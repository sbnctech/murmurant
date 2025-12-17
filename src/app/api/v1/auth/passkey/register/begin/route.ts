/**
 * POST /api/v1/auth/passkey/register/begin
 *
 * Begin passkey registration ceremony.
 * Requires authenticated session (user must be logged in).
 *
 * Response:
 * - 200: { options: PublicKeyCredentialCreationOptionsJSON, challengeId: string }
 * - 401: Not authenticated
 * - 500: Server error
 *
 * Security:
 * - Requires valid session cookie
 * - Challenge is single-use and time-limited (5 minutes)
 * - Excludes user's existing credentials to prevent re-registration
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthContext } from "@/lib/auth";
import { beginRegistration } from "@/lib/passkey";
import { errors } from "@/lib/api";
import { prisma } from "@/lib/prisma";

function getClientIp(req: NextRequest): string | undefined {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") ?? undefined;
}

export async function POST(req: NextRequest) {
  // Require authenticated session
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { memberId, email } = auth.context as AuthContext;

  try {
    // Get user account ID from member
    const userAccount = await prisma.userAccount.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!userAccount) {
      // User doesn't have an account yet - this shouldn't happen for authenticated users
      // but handle gracefully
      return errors.notFound("UserAccount", memberId);
    }

    const ipAddress = getClientIp(req);
    const result = await beginRegistration(userAccount.id, ipAddress);

    return NextResponse.json({
      options: result.options,
      challengeId: result.challengeId,
    });
  } catch (error) {
    console.error("[PASSKEY] Registration begin error:", error);
    return errors.internal("Failed to begin passkey registration");
  }
}
