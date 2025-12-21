/**
 * POST /api/admin/impersonate/start
 *
 * Start impersonating a member for support/debugging.
 * Requires admin:full capability.
 *
 * Charter Compliance:
 * - P1: Identity provable - session tracks real admin and impersonated member
 * - P2: Default deny - requires admin:full
 * - P7: Audit logging - IMPERSONATION_START recorded
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { startImpersonation, getSessionWithImpersonation } from "@/lib/auth/session";
import { getSessionCookieName } from "@/lib/auth/cookies";
import { auditMutation } from "@/lib/audit";

interface StartImpersonationBody {
  memberId: string;
}

export async function POST(req: NextRequest) {
  // Require admin:full capability
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  // Parse request body
  let body: StartImpersonationBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  if (!body.memberId || typeof body.memberId !== "string") {
    return NextResponse.json(
      { error: "memberId is required" },
      { status: 400 }
    );
  }

  // Get session from cookie
  const sessionCookie = req.cookies.get(getSessionCookieName());
  if (!sessionCookie?.value) {
    return NextResponse.json(
      { error: "No active session" },
      { status: 401 }
    );
  }

  const session = await getSessionWithImpersonation(sessionCookie.value);
  if (!session) {
    return NextResponse.json(
      { error: "Invalid session" },
      { status: 401 }
    );
  }

  // Check if already impersonating
  if (session.impersonation) {
    return NextResponse.json(
      { error: "Already impersonating. End current impersonation first." },
      { status: 400 }
    );
  }

  // Start impersonation
  const impersonation = await startImpersonation(session.id, body.memberId);
  if (!impersonation) {
    return NextResponse.json(
      { error: "Member not found" },
      { status: 404 }
    );
  }

  // Audit log the impersonation start
  await auditMutation(req, auth.context, {
    action: "IMPERSONATION_START",
    capability: "admin:full",
    objectType: "Member",
    objectId: body.memberId,
    metadata: {
      impersonatedMemberName: impersonation.memberName,
      impersonatedMemberEmail: impersonation.memberEmail,
    },
  });

  return NextResponse.json({
    success: true,
    impersonating: {
      id: impersonation.memberId,
      name: impersonation.memberName,
      email: impersonation.memberEmail,
      startedAt: impersonation.impersonatedAt.toISOString(),
    },
  });
}
