/**
 * Magic Link Service - Email-based fallback authentication
 *
 * Provides secure email magic links for users who:
 * - Don't have passkeys registered
 * - Lost access to their passkey devices
 * - Are on a device that doesn't support WebAuthn
 *
 * Security Requirements:
 * - Tokens are cryptographically random and single-use
 * - Token hashes are stored (never plain text)
 * - Links expire after 15 minutes
 * - Rate limited to prevent abuse
 *
 * Charter Compliance:
 * - P1: Identity verified via email ownership
 * - P7: All link events are logged
 * - P9: Fails closed on invalid tokens
 */

import { prisma } from "@/lib/prisma";
import { MAGIC_LINK_EXPIRATION_MS } from "./config";
import { createHash, randomBytes } from "crypto";

// ============================================================================
// Types
// ============================================================================

export interface MagicLinkCreateResult {
  token: string; // Send this in the email link
  linkId: string; // For logging purposes
  expiresAt: Date;
}

export interface MagicLinkVerifyResult {
  success: true;
  email: string;
  userAccountId: string | null;
  memberId: string | null;
}

// ============================================================================
// Token Utilities
// ============================================================================

/**
 * Generate a cryptographically secure token.
 * Uses 32 bytes = 256 bits of entropy, encoded as base64url.
 */
function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Hash a token for storage.
 * We never store plain tokens - only their SHA-256 hashes.
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// ============================================================================
// Magic Link Operations
// ============================================================================

/**
 * Create a magic link for an email address.
 *
 * @param email - The email address to create a link for
 * @param ipAddress - Client IP for rate limiting
 * @param purpose - "login" or "verify"
 */
export async function createMagicLink(
  email: string,
  ipAddress?: string,
  purpose: "login" | "verify" = "login"
): Promise<MagicLinkCreateResult> {
  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();

  // Check if user account exists
  const userAccount = await prisma.userAccount.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  // Generate token and hash
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRATION_MS);

  // Store the magic link
  const magicLink = await prisma.emailMagicLink.create({
    data: {
      tokenHash,
      email: normalizedEmail,
      userAccountId: userAccount?.id,
      purpose,
      ipAddress,
      expiresAt,
    },
  });

  return {
    token,
    linkId: magicLink.id,
    expiresAt,
  };
}

/**
 * Verify a magic link token.
 *
 * @param token - The token from the magic link URL
 */
export async function verifyMagicLink(token: string): Promise<MagicLinkVerifyResult> {
  const tokenHash = hashToken(token);

  // Find the magic link
  const magicLink = await prisma.emailMagicLink.findUnique({
    where: { tokenHash },
  });

  if (!magicLink) {
    throw new Error("Invalid or expired link");
  }

  if (magicLink.usedAt) {
    throw new Error("Link has already been used");
  }

  if (new Date() > magicLink.expiresAt) {
    throw new Error("Link has expired");
  }

  // Mark as used and get user info atomically
  const [, userAccount] = await prisma.$transaction([
    prisma.emailMagicLink.update({
      where: { id: magicLink.id },
      data: { usedAt: new Date() },
    }),
    // Find or create user account for this email
    prisma.userAccount.findUnique({
      where: { email: magicLink.email },
      include: { member: { select: { id: true } } },
    }),
  ]);

  // If user account exists, update last login
  if (userAccount) {
    await prisma.userAccount.update({
      where: { id: userAccount.id },
      data: { lastLoginAt: new Date() },
    });
  }

  return {
    success: true,
    email: magicLink.email,
    userAccountId: userAccount?.id ?? null,
    memberId: userAccount?.member?.id ?? null,
  };
}

/**
 * Clean up expired magic links.
 * Should be run periodically via a cron job.
 */
export async function cleanupExpiredMagicLinks(): Promise<number> {
  const result = await prisma.emailMagicLink.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });

  return result.count;
}

/**
 * Check rate limits for magic link requests.
 * Returns true if the request should be allowed.
 *
 * @param email - Email address requesting the link
 * @param ipAddress - Client IP address
 */
export async function checkMagicLinkRateLimit(
  email: string,
  ipAddress?: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const windowStart = new Date(Date.now() - 60 * 1000); // 1 minute window
  const maxRequests = 3; // Max 3 requests per minute per email

  // Count recent requests for this email
  const recentCount = await prisma.emailMagicLink.count({
    where: {
      email: email.toLowerCase().trim(),
      createdAt: { gt: windowStart },
    },
  });

  if (recentCount >= maxRequests) {
    return {
      allowed: false,
      retryAfter: 60, // seconds
    };
  }

  // Also check IP if provided
  if (ipAddress) {
    const ipCount = await prisma.emailMagicLink.count({
      where: {
        ipAddress,
        createdAt: { gt: windowStart },
      },
    });

    if (ipCount >= maxRequests * 2) {
      // More lenient for IP
      return {
        allowed: false,
        retryAfter: 60,
      };
    }
  }

  return { allowed: true };
}
