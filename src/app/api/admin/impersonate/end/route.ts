/**
 * POST /api/admin/impersonate/end
 *
 * End impersonation and return to admin identity.
 *
 * Charter Compliance:
 * - P7: Audit logging - IMPERSONATION_END recorded
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { endImpersonation, getSessionWithImpersonation } from "@/lib/auth/session";
import { getSessionCookieName } from "@/lib/auth/cookies";
import { auditMutation } from "@/lib/audit";

export async function POST(req: NextRequest) {
  // Require basic auth (the user should still be authenticated as admin)
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

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

  // Check if impersonating
  if (!session.impersonation) {
    return NextResponse.json(
      { error: "Not currently impersonating" },
      { status: 400 }
    );
  }

  // Store impersonation info for audit before ending
  const impersonation = session.impersonation;

  // End impersonation
  const ended = await endImpersonation(session.id);
  if (!ended) {
    return NextResponse.json(
      { error: "Failed to end impersonation" },
      { status: 500 }
    );
  }

  // Audit log the impersonation end
  await auditMutation(req, auth.context, {
    action: "IMPERSONATION_END",
    capability: "admin:full",
    objectType: "Member",
    objectId: impersonation.memberId,
    metadata: {
      impersonatedMemberName: impersonation.memberName,
      impersonatedMemberEmail: impersonation.memberEmail,
      duration: Date.now() - impersonation.impersonatedAt.getTime(),
    },
  });

  return NextResponse.json({
    success: true,
    message: "Impersonation ended",
  });
}
