/**
 * Magic Link Request API
 *
 * POST /api/auth/request-link
 *
 * Request a magic link for email-based authentication.
 * Always returns 200 with generic response to prevent account enumeration.
 *
 * Security:
 * - No account enumeration (same response whether email exists or not)
 * - Rate limited by email and IP
 * - Tokens are hashed before storage
 * - Links expire after 30 minutes
 *
 * Charter Compliance:
 * - P1: Identity provable via email ownership
 * - P7: All link requests are audited
 * - P9: Fails closed on errors (returns generic response)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateLoginToken } from "@/lib/auth/tokens";
import { auditMagicLinkSent } from "@/lib/auth/audit";
import { sendEmail } from "@/lib/email";

// Magic link expiration (30 minutes)
const MAGIC_LINK_EXPIRATION_MS = 30 * 60 * 1000;

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_EMAIL = 3;
const MAX_REQUESTS_PER_IP = 6;

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

/**
 * Check rate limits for magic link requests.
 */
async function checkRateLimit(
  email: string,
  ipAddress: string | null
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

  // Check email rate limit
  const emailCount = await prisma.emailMagicLink.count({
    where: {
      email,
      createdAt: { gt: windowStart },
    },
  });

  if (emailCount >= MAX_REQUESTS_PER_EMAIL) {
    return { allowed: false, retryAfter: 60 };
  }

  // Check IP rate limit if available
  if (ipAddress) {
    const ipCount = await prisma.emailMagicLink.count({
      where: {
        ipAddress,
        createdAt: { gt: windowStart },
      },
    });

    if (ipCount >= MAX_REQUESTS_PER_IP) {
      return { allowed: false, retryAfter: 60 };
    }
  }

  return { allowed: true };
}

/**
 * Generate the verify URL for the magic link.
 */
function getVerifyUrl(token: string, req: NextRequest): string {
  const origin = req.headers.get("origin") ?? req.nextUrl.origin;
  return `${origin}/auth/verify?token=${encodeURIComponent(token)}`;
}

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const email = (body.email ?? "").toLowerCase().trim();

    // Validate email format
    if (!email || !email.includes("@")) {
      // Generic response to prevent enumeration
      return NextResponse.json({ ok: true });
    }

    const ipAddress = getClientIp(req);
    const userAgent = req.headers.get("user-agent") ?? undefined;

    // Check rate limits
    const rateLimit = await checkRateLimit(email, ipAddress);
    if (!rateLimit.allowed) {
      // Still return 200 with ok: true to prevent enumeration
      // Rate limiting is enforced silently
      console.log(`[AUTH] Rate limited: ${email} (IP: ${ipAddress})`);
      return NextResponse.json({ ok: true });
    }

    // Generate token and hash
    const { token, hash } = await generateLoginToken();
    const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRATION_MS);

    // Check if user account exists (for linking, not for enumeration)
    const userAccount = await prisma.userAccount.findUnique({
      where: { email },
      select: { id: true },
    });

    // Store magic link in database
    const magicLink = await prisma.emailMagicLink.create({
      data: {
        tokenHash: hash,
        email,
        userAccountId: userAccount?.id ?? null,
        purpose: "login",
        ipAddress,
        expiresAt,
      },
    });

    // Generate verify URL
    const verifyUrl = getVerifyUrl(token, req);

    // Send email or log to console in development
    if (process.env.NODE_ENV === "production") {
      await sendEmail({
        to: email,
        subject: "Sign in to ClubOS",
        text: `Click this link to sign in: ${verifyUrl}\n\nThis link expires in 30 minutes.`,
        html: `
          <p>Click the button below to sign in to ClubOS:</p>
          <p style="margin: 20px 0;">
            <a href="${verifyUrl}"
               style="background-color: #2563eb; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Sign In
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.
          </p>
          <p style="color: #999; font-size: 12px;">
            Or copy this link: ${verifyUrl}
          </p>
        `,
      });
    } else {
      // Development: log to console
      console.log("\n========================================");
      console.log("[DEV] Magic Link Generated");
      console.log(`Email: ${email}`);
      console.log(`Verify URL: ${verifyUrl}`);
      console.log(`Expires: ${expiresAt.toISOString()}`);
      console.log("========================================\n");
    }

    // Audit the event
    await auditMagicLinkSent(email, magicLink.id, ipAddress ?? undefined, userAgent);

    // Always return generic success response
    return NextResponse.json({ ok: true });
  } catch (error) {
    // Log error but return generic response to prevent enumeration
    console.error("[AUTH] Error in request-link:", error);
    return NextResponse.json({ ok: true });
  }
}
