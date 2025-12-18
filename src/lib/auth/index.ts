/**
 * Auth Module - Central Authentication and Authorization
 *
 * This module provides:
 * - Token generation and hashing (tokens.ts)
 * - Cookie configuration (cookies.ts)
 * - DB-backed session management (session.ts)
 * - Audit logging for auth events (audit.ts)
 *
 * Charter Compliance:
 * - P1: Identity is provable via cryptographically secure sessions
 * - P2: Default deny - no session = no access
 * - P3: Explicit state machine for sessions (active/revoked)
 * - P7: All auth events are audited
 * - P9: Fail closed on invalid auth
 */

// Token utilities
export {
  generateToken,
  hashToken,
  verifyToken,
  generateLoginToken,
  generateSessionToken,
} from "./tokens";

// Cookie configuration
export {
  getSessionCookieName,
  getSessionCookieOptions,
  getClearSessionCookieOptions,
  validateCookieConfig,
  SESSION_MAX_AGE_SECONDS,
  SESSION_IDLE_TIMEOUT_SECONDS,
} from "./cookies";

// Session management
export {
  createSession,
  getSession,
  getSessionByTokenHash,
  revokeSession,
  revokeSessionById,
  revokeAllSessions,
  setSessionCookie,
  getSessionCookie,
  clearSessionCookie,
  getCurrentSession,
  loginUser,
  logoutUser,
  cleanupExpiredSessions,
  getSessionStats,
  type SessionData,
  type CreateSessionParams,
} from "./session";

// Audit logging
export { auditAuthEvent, type AuthAuditEvent } from "./audit";

// Error handling
export {
  parseAuthError,
  getFriendlyAuthError,
  getAuthErrorMessage,
  formatAuthError,
  AuthError,
  type AuthErrorCode,
} from "./errors";
