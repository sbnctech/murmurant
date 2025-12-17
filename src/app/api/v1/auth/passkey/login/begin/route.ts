/**
 * POST /api/v1/auth/passkey/login/begin
 *
 * Begin passkey authentication ceremony.
 * Does not require authentication (this IS the login flow).
 *
 * Request body:
 * {
 *   email?: string  // Optional - if provided, narrows to user's credentials
 * }
 *
 * Response:
 * - 200: { options: PublicKeyCredentialRequestOptionsJSON, challengeId: string }
 * - 429: Rate limited
 * - 500: Server error
 *
 * Security:
 * - Challenge is single-use and time-limited (5 minutes)
 * - Does not reveal whether email exists (prevents enumeration)
 * - Rate limited by IP
 */

import { NextRequest, NextResponse } from "next/server";
import { beginAuthentication, RATE_LIMIT_MAX_ATTEMPTS, RATE_LIMIT_WINDOW_MS } from "@/lib/passkey";
import { errors, apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const RequestSchema = z.object({
  email: z.string().email().optional(),
});

function getClientIp(req: NextRequest): string | undefined {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") ?? undefined;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return errors.validation("Invalid request format");
  }

  const { email } = parsed.data;
  const ipAddress = getClientIp(req);

  // Rate limiting by IP
  if (ipAddress) {
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
    const recentAttempts = await prisma.authChallenge.count({
      where: {
        ipAddress,
        type: "authentication",
        createdAt: { gt: windowStart },
      },
    });

    if (recentAttempts >= RATE_LIMIT_MAX_ATTEMPTS) {
      return apiError("RATE_LIMITED", "Too many login attempts. Please try again later.", {
        retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
      });
    }
  }

  try {
    const result = await beginAuthentication(email, ipAddress);

    return NextResponse.json({
      options: result.options,
      challengeId: result.challengeId,
    });
  } catch (error) {
    console.error("[PASSKEY] Authentication begin error:", error);
    return errors.internal("Failed to begin passkey authentication");
  }
}
