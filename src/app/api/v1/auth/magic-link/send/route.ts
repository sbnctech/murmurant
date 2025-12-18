/**
 * POST /api/v1/auth/magic-link/send
 *
 * Request a magic link for email-based authentication.
 * This is the fallback for users who don't have passkeys or lost access.
 *
 * Request body:
 * {
 *   email: string
 * }
 *
 * Response:
 * - 200: { success: true, message: string }
 * - 400: Invalid email format
 * - 429: Rate limited
 *
 * Security:
 * - Always returns success to prevent email enumeration
 * - Rate limited by email and IP
 * - Link expires in 15 minutes
 * - Token is single-use
 */

import { NextRequest, NextResponse } from "next/server";
import { createMagicLink, checkMagicLinkRateLimit } from "@/lib/passkey";
import { errors, apiError } from "@/lib/api";
import { createAuditEntry } from "@/lib/audit";
import { z } from "zod";

const RequestSchema = z.object({
  email: z.string().email(),
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
    return errors.validation("Invalid JSON body");
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return errors.validation("Invalid email address");
  }

  const { email } = parsed.data;
  const ipAddress = getClientIp(req);

  // Check rate limits
  const rateLimit = await checkMagicLinkRateLimit(email, ipAddress);
  if (!rateLimit.allowed) {
    return apiError("RATE_LIMITED", "Too many requests. Please try again later.", {
      retryAfter: rateLimit.retryAfter,
    });
  }

  try {
    const result = await createMagicLink(email, ipAddress);

    // Audit log the request (but not the token!)
    await createAuditEntry({
      action: "EMAIL_LINK_SENT",
      resourceType: "EmailMagicLink",
      resourceId: result.linkId,
      actor: {
        memberId: "unknown",
        email,
        globalRole: "member",
      },
      req,
      metadata: {
        expiresAt: result.expiresAt.toISOString(),
      },
    });

    // TODO: Actually send the email
    // For now, log the token (REMOVE IN PRODUCTION!)
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV] Magic link for ${email}: /auth/verify?token=${result.token}`);
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, you will receive a sign-in link shortly.",
    });
  } catch (error) {
    console.error("[MAGIC_LINK] Send error:", error);

    // Still return success to prevent enumeration
    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, you will receive a sign-in link shortly.",
    });
  }
}
