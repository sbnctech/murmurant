/**
 * Logout API
 *
 * POST /api/auth/logout
 *
 * Revokes the current session and clears the session cookie.
 *
 * Security:
 * - Session is revoked (not deleted) for audit trail
 * - Cookie is cleared
 * - All logout events are audited
 *
 * Charter Compliance:
 * - P3: Explicit state change (session revoked)
 * - P7: All logout events are audited
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, logoutUser } from "@/lib/auth/session";
import { auditLogout } from "@/lib/auth/audit";

/**
 * Extract client IP from request headers.
 */
function getClientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    // Get current session for audit logging
    const session = await getCurrentSession();

    if (session) {
      const ipAddress = getClientIp(req);
      const userAgent = req.headers.get("user-agent") ?? undefined;

      // Audit the logout
      await auditLogout(
        session.email,
        session.id,
        ipAddress ?? undefined,
        userAgent
      );
    }

    // Revoke session and clear cookie
    await logoutUser();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[AUTH] Error in logout:", error);
    // Still try to clear the cookie even if there's an error
    try {
      await logoutUser();
    } catch {
      // Ignore secondary errors
    }
    return NextResponse.json({ ok: true });
  }
}
