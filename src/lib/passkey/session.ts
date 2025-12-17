/**
 * Session Service - HttpOnly Cookie Session Management
 *
 * Provides secure session handling via HttpOnly cookies.
 * Sessions are server-validated and stored in memory (can be extended to use database).
 *
 * Security Requirements:
 * - Cookies are HttpOnly, Secure, and SameSite=Lax
 * - Sessions have both idle timeout and absolute max lifetime
 * - Session IDs are cryptographically random
 * - Tokens are never stored in localStorage or accessible to JavaScript
 *
 * Cookie Configuration:
 * - HttpOnly: true (prevents XSS from stealing tokens)
 * - Secure: true in production (requires HTTPS)
 * - SameSite: Lax (CSRF protection while allowing top-level navigations)
 * - Max-Age: 7 days (absolute max lifetime)
 *
 * Charter Compliance:
 * - P1: Session ties actions to authenticated user
 * - P9: Fails closed on invalid sessions
 */

import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  SESSION_IDLE_TIMEOUT_SECONDS,
} from "./config";

// ============================================================================
// Types
// ============================================================================

export interface SessionData {
  id: string;
  memberId: string;
  userAccountId: string;
  email: string;
  globalRole: string;
  createdAt: Date;
  lastActivityAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================================================
// In-Memory Session Store
// Note: For production, consider using Redis or database-backed sessions
// ============================================================================

const sessionStore = new Map<string, SessionData>();

// ============================================================================
// Session Token Utilities
// ============================================================================

/**
 * Generate a cryptographically secure session ID.
 */
function generateSessionId(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Hash a session ID for storage/lookup.
 * We store hashed IDs to prevent timing attacks.
 */
function hashSessionId(sessionId: string): string {
  return createHash("sha256").update(sessionId).digest("hex");
}

// ============================================================================
// Session Operations
// ============================================================================

/**
 * Create a new session for an authenticated user.
 *
 * @param data - Session data (memberId, userAccountId, email, globalRole)
 * @param ipAddress - Client IP for security tracking
 * @param userAgent - Client user agent for security tracking
 */
export function createSession(
  data: { memberId: string; userAccountId: string; email: string; globalRole: string },
  ipAddress?: string,
  userAgent?: string
): string {
  const sessionId = generateSessionId();
  const hashedId = hashSessionId(sessionId);

  const sessionData: SessionData = {
    id: hashedId,
    memberId: data.memberId,
    userAccountId: data.userAccountId,
    email: data.email,
    globalRole: data.globalRole,
    createdAt: new Date(),
    lastActivityAt: new Date(),
    ipAddress,
    userAgent,
  };

  sessionStore.set(hashedId, sessionData);

  return sessionId;
}

/**
 * Get session data from a session ID.
 * Also validates that the session is not expired.
 *
 * @param sessionId - The session ID from the cookie
 */
export function getSession(sessionId: string): SessionData | null {
  const hashedId = hashSessionId(sessionId);
  const session = sessionStore.get(hashedId);

  if (!session) {
    return null;
  }

  const now = Date.now();
  const createdMs = session.createdAt.getTime();
  const lastActivityMs = session.lastActivityAt.getTime();

  // Check absolute max lifetime
  if (now - createdMs > SESSION_MAX_AGE_SECONDS * 1000) {
    sessionStore.delete(hashedId);
    return null;
  }

  // Check idle timeout
  if (now - lastActivityMs > SESSION_IDLE_TIMEOUT_SECONDS * 1000) {
    sessionStore.delete(hashedId);
    return null;
  }

  // Update last activity
  session.lastActivityAt = new Date();
  sessionStore.set(hashedId, session);

  return session;
}

/**
 * Destroy a session.
 *
 * @param sessionId - The session ID to destroy
 */
export function destroySession(sessionId: string): void {
  const hashedId = hashSessionId(sessionId);
  sessionStore.delete(hashedId);
}

/**
 * Destroy all sessions for a user.
 * Used when passkeys are revoked or account is disabled.
 *
 * @param userAccountId - The user account ID
 */
export function destroyAllSessions(userAccountId: string): number {
  let count = 0;
  for (const [hashedId, session] of sessionStore.entries()) {
    if (session.userAccountId === userAccountId) {
      sessionStore.delete(hashedId);
      count++;
    }
  }
  return count;
}

// ============================================================================
// Cookie Operations
// ============================================================================

/**
 * Set the session cookie.
 *
 * @param sessionId - The session ID to store in the cookie
 */
export async function setSessionCookie(sessionId: string): Promise<void> {
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";

  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
}

/**
 * Get the session ID from the cookie.
 */
export async function getSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);
  return cookie?.value;
}

/**
 * Clear the session cookie.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Get the current session from the cookie.
 * Convenience function that combines getSessionCookie and getSession.
 */
export async function getCurrentSession(): Promise<SessionData | null> {
  const sessionId = await getSessionCookie();
  if (!sessionId) {
    return null;
  }
  return getSession(sessionId);
}

// ============================================================================
// Session Cleanup
// ============================================================================

/**
 * Clean up expired sessions.
 * Should be run periodically.
 */
export function cleanupExpiredSessions(): number {
  const now = Date.now();
  let count = 0;

  for (const [hashedId, session] of sessionStore.entries()) {
    const createdMs = session.createdAt.getTime();
    const lastActivityMs = session.lastActivityAt.getTime();

    // Check absolute max lifetime
    if (now - createdMs > SESSION_MAX_AGE_SECONDS * 1000) {
      sessionStore.delete(hashedId);
      count++;
      continue;
    }

    // Check idle timeout
    if (now - lastActivityMs > SESSION_IDLE_TIMEOUT_SECONDS * 1000) {
      sessionStore.delete(hashedId);
      count++;
    }
  }

  return count;
}

/**
 * Get session statistics (for monitoring).
 */
export function getSessionStats(): { totalSessions: number; activeSessions: number } {
  const now = Date.now();
  let activeSessions = 0;

  for (const session of sessionStore.values()) {
    const lastActivityMs = session.lastActivityAt.getTime();
    // Consider active if activity in last 5 minutes
    if (now - lastActivityMs < 5 * 60 * 1000) {
      activeSessions++;
    }
  }

  return {
    totalSessions: sessionStore.size,
    activeSessions,
  };
}
