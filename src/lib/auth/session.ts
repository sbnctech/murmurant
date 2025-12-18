/**
 * Session Service - DB-backed Server-Side Sessions
 *
 * Provides secure session management with database persistence.
 * Sessions are server-validated and stored in PostgreSQL.
 *
 * Security Requirements:
 * - Only token hashes stored in DB (never raw tokens)
 * - Sessions have idle timeout and absolute max lifetime
 * - Sessions can be revoked by admin
 * - Cookie rotation on every login (new session each time)
 *
 * Charter Compliance:
 * - P1: Session ties actions to authenticated user
 * - P3: Explicit state via revokedAt for session revocation
 * - P7: All session events are auditable
 * - P9: Fails closed on invalid sessions
 */

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { generateSessionToken, verifyToken } from "./tokens";
import {
  getSessionCookieName,
  getSessionCookieOptions,
  getClearSessionCookieOptions,
  SESSION_MAX_AGE_SECONDS,
  SESSION_IDLE_TIMEOUT_SECONDS,
} from "./cookies";
import type { GlobalRole } from "@/lib/auth";

// ============================================================================
// Types
// ============================================================================

export interface SessionData {
  id: string;
  userAccountId: string;
  email: string;
  globalRole: GlobalRole;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
}

export interface CreateSessionParams {
  userAccountId: string;
  email: string;
  globalRole: GlobalRole;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================================================
// Session Creation
// ============================================================================

/**
 * Create a new session for an authenticated user.
 * Returns the raw token (for the cookie) - DB stores only the hash.
 *
 * @param params - Session creation parameters
 * @returns Promise<string> - Raw session token for cookie
 */
export async function createSession(params: CreateSessionParams): Promise<string> {
  const { userAccountId, email, globalRole, ipAddress, userAgent } = params;

  // Generate token and hash
  const { token, hash } = generateSessionToken();

  // Calculate expiration
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  // Store session in database
  await prisma.session.create({
    data: {
      tokenHash: hash,
      userAccountId,
      email,
      globalRole,
      ipAddress,
      userAgent,
      expiresAt,
      lastActivityAt: new Date(),
    },
  });

  return token;
}

// ============================================================================
// Session Retrieval
// ============================================================================

/**
 * Get session data from a session token.
 * Validates expiration, idle timeout, and revocation status.
 *
 * @param token - The raw session token from the cookie
 * @returns Promise<SessionData | null>
 */
export async function getSession(token: string): Promise<SessionData | null> {
  // Find all non-expired, non-revoked sessions
  // We need to verify the token hash
  const sessions = await prisma.session.findMany({
    where: {
      expiresAt: { gt: new Date() },
      revokedAt: null,
    },
    select: {
      id: true,
      tokenHash: true,
      userAccountId: true,
      email: true,
      globalRole: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      lastActivityAt: true,
      expiresAt: true,
    },
  });

  // Find matching session by verifying token hash
  for (const session of sessions) {
    const matches = verifyToken(token, session.tokenHash);
    if (matches) {
      // Check idle timeout
      const lastActivity = session.lastActivityAt.getTime();
      const now = Date.now();
      if (now - lastActivity > SESSION_IDLE_TIMEOUT_SECONDS * 1000) {
        // Session has been idle too long - don't delete, just reject
        return null;
      }

      // Update last activity
      await prisma.session.update({
        where: { id: session.id },
        data: { lastActivityAt: new Date() },
      });

      return {
        id: session.id,
        userAccountId: session.userAccountId,
        email: session.email,
        globalRole: session.globalRole as GlobalRole,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        createdAt: session.createdAt,
        lastActivityAt: new Date(), // Updated just now
        expiresAt: session.expiresAt,
      };
    }
  }

  return null;
}

/**
 * Optimized session lookup using token hash prefix.
 * For better performance with many sessions, we store and query by hash.
 * Since we use scrypt, we need to iterate but can limit the search space.
 */
export async function getSessionByTokenHash(
  tokenHash: string
): Promise<SessionData | null> {
  const session = await prisma.session.findUnique({
    where: {
      tokenHash,
      expiresAt: { gt: new Date() },
      revokedAt: null,
    },
    select: {
      id: true,
      tokenHash: true,
      userAccountId: true,
      email: true,
      globalRole: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      lastActivityAt: true,
      expiresAt: true,
    },
  });

  if (!session) {
    return null;
  }

  // Check idle timeout
  const lastActivity = session.lastActivityAt.getTime();
  const now = Date.now();
  if (now - lastActivity > SESSION_IDLE_TIMEOUT_SECONDS * 1000) {
    return null;
  }

  // Update last activity
  await prisma.session.update({
    where: { id: session.id },
    data: { lastActivityAt: new Date() },
  });

  return {
    id: session.id,
    userAccountId: session.userAccountId,
    email: session.email,
    globalRole: session.globalRole as GlobalRole,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    createdAt: session.createdAt,
    lastActivityAt: new Date(),
    expiresAt: session.expiresAt,
  };
}

// ============================================================================
// Session Destruction
// ============================================================================

/**
 * Revoke a session.
 * Does not delete - marks as revoked for audit trail.
 *
 * @param token - The raw session token
 * @param revokedById - Member ID of who revoked (optional, for admin actions)
 * @param reason - Reason for revocation (optional)
 */
export async function revokeSession(
  token: string,
  revokedById?: string,
  reason?: string
): Promise<boolean> {
  // Find the session
  const sessions = await prisma.session.findMany({
    where: {
      revokedAt: null,
    },
    select: {
      id: true,
      tokenHash: true,
    },
  });

  for (const session of sessions) {
    const matches = verifyToken(token, session.tokenHash);
    if (matches) {
      await prisma.session.update({
        where: { id: session.id },
        data: {
          revokedAt: new Date(),
          revokedById,
          revokedReason: reason ?? "User logout",
        },
      });
      return true;
    }
  }

  return false;
}

/**
 * Revoke a session by its ID.
 * Used for admin-initiated revocation.
 */
export async function revokeSessionById(
  sessionId: string,
  revokedById: string,
  reason: string
): Promise<boolean> {
  try {
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        revokedAt: new Date(),
        revokedById,
        revokedReason: reason,
      },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Revoke all sessions for a user account.
 * Used when password changes, passkeys revoked, or account disabled.
 *
 * @param userAccountId - The user account ID
 * @param revokedById - Member ID of who revoked
 * @param reason - Reason for revocation
 */
export async function revokeAllSessions(
  userAccountId: string,
  revokedById?: string,
  reason?: string
): Promise<number> {
  const result = await prisma.session.updateMany({
    where: {
      userAccountId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
      revokedById,
      revokedReason: reason ?? "All sessions revoked",
    },
  });

  return result.count;
}

// ============================================================================
// Cookie Operations
// ============================================================================

/**
 * Set the session cookie with a new token.
 *
 * @param token - The raw session token
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  const cookieName = getSessionCookieName();
  const options = getSessionCookieOptions();

  cookieStore.set(cookieName, token, options);
}

/**
 * Get the session token from the cookie.
 */
export async function getSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const cookieName = getSessionCookieName();
  const cookie = cookieStore.get(cookieName);
  return cookie?.value;
}

/**
 * Clear the session cookie.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  const cookieName = getSessionCookieName();
  const options = getClearSessionCookieOptions();

  cookieStore.set(cookieName, "", options);
}

// ============================================================================
// High-Level Operations
// ============================================================================

/**
 * Get the current session from the cookie.
 * Convenience function that combines getSessionCookie and getSession.
 */
export async function getCurrentSession(): Promise<SessionData | null> {
  const token = await getSessionCookie();
  if (!token) {
    return null;
  }
  return getSession(token);
}

/**
 * Create session and set cookie.
 * Call this after successful authentication.
 */
export async function loginUser(params: CreateSessionParams): Promise<string> {
  const token = await createSession(params);
  await setSessionCookie(token);
  return token;
}

/**
 * Revoke session and clear cookie.
 * Call this for logout.
 */
export async function logoutUser(): Promise<boolean> {
  const token = await getSessionCookie();
  if (token) {
    await revokeSession(token, undefined, "User logout");
  }
  await clearSessionCookie();
  return true;
}

// ============================================================================
// Session Cleanup
// ============================================================================

/**
 * Clean up expired sessions.
 * Should be run periodically via a cron job.
 */
export async function cleanupExpiredSessions(): Promise<number> {
  // Delete sessions that have been expired for more than 30 days
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const result = await prisma.session.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: cutoff } },
        { revokedAt: { lt: cutoff } },
      ],
    },
  });

  return result.count;
}

/**
 * Get session statistics (for monitoring).
 */
export async function getSessionStats(): Promise<{
  totalSessions: number;
  activeSessions: number;
  revokedSessions: number;
}> {
  const now = new Date();
  const recentCutoff = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes

  const [total, active, revoked] = await Promise.all([
    prisma.session.count(),
    prisma.session.count({
      where: {
        expiresAt: { gt: now },
        revokedAt: null,
        lastActivityAt: { gt: recentCutoff },
      },
    }),
    prisma.session.count({
      where: {
        revokedAt: { not: null },
      },
    }),
  ]);

  return {
    totalSessions: total,
    activeSessions: active,
    revokedSessions: revoked,
  };
}
