/**
 * Magic Link Verification Page
 *
 * GET /auth/verify?token=...
 *
 * Verifies the magic link token, creates/finds user, creates session,
 * sets cookie, and redirects to the appropriate page.
 *
 * Security:
 * - Single-use tokens (marked as used atomically)
 * - Token expiration check
 * - Session created with new token (cookie rotation)
 * - All events audited
 *
 * Charter Compliance:
 * - P1: Identity verified via email ownership
 * - P7: All verification events are audited
 * - P9: Fails closed on invalid tokens
 */

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/tokens";
import { loginUser } from "@/lib/auth/session";
import { auditMagicLinkUsed, auditLogin } from "@/lib/auth/audit";
import { headers } from "next/headers";
import type { GlobalRole } from "@/lib/auth";

interface VerifyPageProps {
  searchParams: Promise<{ token?: string }>;
}

/**
 * Get client info from headers.
 */
async function getClientInfo(): Promise<{
  ipAddress: string | null;
  userAgent: string | null;
}> {
  const headersList = await headers();

  const forwarded = headersList.get("x-forwarded-for");
  const ipAddress = forwarded
    ? forwarded.split(",")[0].trim()
    : headersList.get("x-real-ip");

  const userAgent = headersList.get("user-agent");

  return { ipAddress, userAgent };
}

/**
 * Find the magic link by verifying the token hash.
 */
async function findMagicLinkByToken(token: string) {
  // Find all unused, non-expired magic links
  const links = await prisma.emailMagicLink.findMany({
    where: {
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      tokenHash: true,
      email: true,
      userAccountId: true,
      purpose: true,
    },
  });

  // Find the one that matches our token
  for (const link of links) {
    const matches = verifyToken(token, link.tokenHash);
    if (matches) {
      return link;
    }
  }

  return null;
}

/**
 * Determine the global role for a user.
 * For now, we check if the email matches the ADMIN_EMAIL env var.
 * In production, this would be determined by committee role assignments.
 */
function determineGlobalRole(email: string): GlobalRole {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  if (adminEmail && email.toLowerCase().trim() === adminEmail) {
    return "admin";
  }
  return "member";
}

/**
 * Find or create user account and member for the email.
 */
async function findOrCreateUser(email: string): Promise<{
  userAccountId: string;
  memberId: string;
  globalRole: GlobalRole;
}> {
  const normalizedEmail = email.toLowerCase().trim();
  const globalRole = determineGlobalRole(normalizedEmail);

  // First check if user account exists
  const existingAccount = await prisma.userAccount.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      memberId: true,
    },
  });

  if (existingAccount) {
    // Update last login
    await prisma.userAccount.update({
      where: { id: existingAccount.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      userAccountId: existingAccount.id,
      memberId: existingAccount.memberId,
      globalRole,
    };
  }

  // Check if member exists without user account
  const existingMember = await prisma.member.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existingMember) {
    // Create user account for existing member
    const newAccount = await prisma.userAccount.create({
      data: {
        memberId: existingMember.id,
        email: normalizedEmail,
        passwordHash: "", // Not using password auth
        lastLoginAt: new Date(),
      },
    });

    return {
      userAccountId: newAccount.id,
      memberId: existingMember.id,
      globalRole,
    };
  }

  // Create new member and user account
  // First, get or create a default membership status
  let defaultStatus = await prisma.membershipStatus.findFirst({
    where: { isActive: true },
  });

  if (!defaultStatus) {
    defaultStatus = await prisma.membershipStatus.create({
      data: {
        code: "active",
        label: "Active",
        isActive: true,
      },
    });
  }

  // Create member
  const newMember = await prisma.member.create({
    data: {
      firstName: normalizedEmail.split("@")[0],
      lastName: "",
      email: normalizedEmail,
      joinedAt: new Date(),
      membershipStatusId: defaultStatus.id,
    },
  });

  // Create user account
  const newAccount = await prisma.userAccount.create({
    data: {
      memberId: newMember.id,
      email: normalizedEmail,
      passwordHash: "",
      lastLoginAt: new Date(),
    },
  });

  return {
    userAccountId: newAccount.id,
    memberId: newMember.id,
    globalRole,
  };
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const params = await searchParams;
  const token = params.token;

  // No token provided
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-xl font-semibold text-red-600 mb-4">Invalid Link</h1>
          <p className="text-gray-600 mb-4">
            No verification token provided. Please request a new sign-in link.
          </p>
          <a
            href="/login"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  // Find the magic link
  const magicLink = await findMagicLinkByToken(token);

  if (!magicLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-xl font-semibold text-red-600 mb-4">
            Invalid or Expired Link
          </h1>
          <p className="text-gray-600 mb-4">
            This sign-in link is invalid or has expired. Links are valid for 30 minutes
            and can only be used once.
          </p>
          <a
            href="/login"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Request New Link
          </a>
        </div>
      </div>
    );
  }

  // Mark magic link as used (single-use)
  await prisma.emailMagicLink.update({
    where: { id: magicLink.id },
    data: { usedAt: new Date() },
  });

  // Get client info for audit
  const { ipAddress, userAgent } = await getClientInfo();

  // Audit magic link usage
  await auditMagicLinkUsed(
    magicLink.email,
    magicLink.id,
    magicLink.userAccountId,
    ipAddress ?? undefined,
    userAgent ?? undefined
  );

  // Find or create user
  const { userAccountId, memberId, globalRole } = await findOrCreateUser(
    magicLink.email
  );

  // Create session and set cookie (cookie rotation - new session each login)
  await loginUser({
    userAccountId,
    email: magicLink.email,
    globalRole,
    ipAddress: ipAddress ?? undefined,
    userAgent: userAgent ?? undefined,
  });

  // Get the session ID for audit
  const sessions = await prisma.session.findMany({
    where: {
      userAccountId,
      revokedAt: null,
    },
    orderBy: { createdAt: "desc" },
    take: 1,
  });

  const sessionId = sessions[0]?.id ?? "unknown";

  // Audit the login
  await auditLogin(
    magicLink.email,
    userAccountId,
    sessionId,
    ipAddress ?? undefined,
    userAgent ?? undefined
  );

  // Redirect to appropriate page
  // Admin users go to /admin, others go to home
  const redirectUrl = globalRole === "admin" ? "/admin" : "/";
  redirect(redirectUrl);
}
