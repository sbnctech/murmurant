/**
 * Passkey Module - WebAuthn/FIDO2 Authentication
 *
 * Provides passwordless authentication via passkeys with
 * email magic link fallback.
 *
 * Exports:
 * - Configuration utilities
 * - Registration and authentication ceremonies
 * - Passkey management
 * - Magic link fallback
 * - Session management
 */

// Configuration
export {
  getRelyingPartyId,
  getRelyingPartyName,
  getExpectedOrigin,
  getPasskeyConfig,
  validatePasskeyConfig,
  CHALLENGE_EXPIRATION_MS,
  MAGIC_LINK_EXPIRATION_MS,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  SESSION_IDLE_TIMEOUT_SECONDS,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_ATTEMPTS,
  type PasskeyConfig,
} from "./config";

// Passkey Service
export {
  beginRegistration,
  finishRegistration,
  beginAuthentication,
  finishAuthentication,
  listPasskeys,
  revokePasskey,
  adminRevokePasskey,
  getPasskeyCount,
  hasActivePasskeys,
  cleanupExpiredChallenges,
  type PasskeyRegistrationBeginResult,
  type PasskeyRegistrationFinishResult,
  type PasskeyAuthenticationBeginResult,
  type PasskeyAuthenticationFinishResult,
  type PasskeyInfo,
} from "./service";

// Magic Link Fallback
export {
  createMagicLink,
  verifyMagicLink,
  cleanupExpiredMagicLinks,
  checkMagicLinkRateLimit,
  type MagicLinkCreateResult,
  type MagicLinkVerifyResult,
} from "./magicLink";

// Session Management
export {
  createSession,
  getSession,
  destroySession,
  destroyAllSessions,
  setSessionCookie,
  getSessionCookie,
  clearSessionCookie,
  getCurrentSession,
  cleanupExpiredSessions,
  getSessionStats,
  type SessionData,
} from "./session";
