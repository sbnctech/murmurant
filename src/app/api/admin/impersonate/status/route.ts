/**
 * GET /api/admin/impersonate/status
 *
 * Check current impersonation status.
 * Returns impersonation details if active, or isImpersonating: false.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSessionWithImpersonation } from "@/lib/auth/session";
import { getSessionCookieName } from "@/lib/auth/cookies";

export async function GET(req: NextRequest) {
  // Require basic auth
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  // Get session from cookie
  const sessionCookie = req.cookies.get(getSessionCookieName());
  if (!sessionCookie?.value) {
    return NextResponse.json({
      isImpersonating: false,
    });
  }

  const session = await getSessionWithImpersonation(sessionCookie.value);
  if (!session) {
    return NextResponse.json({
      isImpersonating: false,
    });
  }

  if (session.impersonation) {
    return NextResponse.json({
      isImpersonating: true,
      impersonating: {
        id: session.impersonation.memberId,
        name: session.impersonation.memberName,
        email: session.impersonation.memberEmail,
        startedAt: session.impersonation.impersonatedAt.toISOString(),
        status: session.impersonation.memberStatus,
        statusLabel: session.impersonation.memberStatusLabel,
        roleAssignments: session.impersonation.roleAssignments,
        isEventChair: session.impersonation.isEventChair,
        isOfficer: session.impersonation.isOfficer,
      },
    });
  }

  return NextResponse.json({
    isImpersonating: false,
  });
}
