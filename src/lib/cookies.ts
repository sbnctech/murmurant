/**
 * Secure Cookie Utilities
 *
 * Charter Principles:
 * - P9: Security must fail closed
 * - P1: Identity must be provable
 *
 * Cookie settings follow OWASP guidelines:
 * - HttpOnly: Always true (prevents XSS access to cookies)
 * - Secure: True in production (HTTPS only)
 * - SameSite: Lax (prevents CSRF while allowing navigation)
 */

import { isProduction } from "@/lib/auth";

/**
 * Cookie options type matching Next.js cookie API.
 */
export type CookieOptions = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict" | "lax" | "none";
  path: string;
  maxAge?: number;
  expires?: Date;
};

/**
 * Default secure cookie settings.
 * HttpOnly: Always on (prevents JavaScript access)
 * Secure: True in production (cookies only sent over HTTPS)
 * SameSite: Lax (prevents CSRF, allows normal navigation)
 * Path: / (available across the entire site)
 */
export const SECURE_COOKIE_DEFAULTS: CookieOptions = {
  httpOnly: true,
  secure: isProduction(),
  sameSite: "lax",
  path: "/",
};

/**
 * Session cookie duration in seconds (24 hours).
 * Matches SESSION_DURATION_MS in auth.ts.
 */
export const SESSION_COOKIE_MAX_AGE = 24 * 60 * 60;

/**
 * Refresh token cookie duration in seconds (7 days).
 * Longer than session for rotating refresh token strategy.
 */
export const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

/**
 * Get secure options for a session cookie.
 * Used when setting the access token cookie.
 */
export function getSessionCookieOptions(): CookieOptions {
  return {
    ...SECURE_COOKIE_DEFAULTS,
    maxAge: SESSION_COOKIE_MAX_AGE,
  };
}

/**
 * Get secure options for a refresh token cookie.
 * Used for rotating refresh token strategy.
 *
 * Note: Refresh token cookies should:
 * - Be stored in a separate cookie from access tokens
 * - Have longer expiry for UX
 * - Be rotated on each use
 */
export function getRefreshCookieOptions(): CookieOptions {
  return {
    ...SECURE_COOKIE_DEFAULTS,
    maxAge: REFRESH_COOKIE_MAX_AGE,
  };
}

/**
 * Get options for clearing a cookie (setting maxAge to 0).
 * Used during logout to invalidate cookies.
 */
export function getClearCookieOptions(): CookieOptions {
  return {
    ...SECURE_COOKIE_DEFAULTS,
    maxAge: 0,
  };
}

/**
 * Cookie names used by the application.
 * Centralized for consistency and to avoid typos.
 */
export const COOKIE_NAMES = {
  SESSION: "clubos_session",
  REFRESH: "clubos_refresh",
} as const;

/**
 * Validate that secure cookie settings are appropriate for the environment.
 * In production, Secure flag must be true.
 * Logs warnings for misconfiguration.
 */
export function validateCookieSecurity(): void {
  if (isProduction()) {
    if (!SECURE_COOKIE_DEFAULTS.secure) {
      console.error(
        "[COOKIES] CRITICAL: Secure flag is false in production. " +
          "Cookies will be sent over insecure connections."
      );
    }
    if (SECURE_COOKIE_DEFAULTS.sameSite === "none" && !SECURE_COOKIE_DEFAULTS.secure) {
      console.error(
        "[COOKIES] CRITICAL: SameSite=none requires Secure flag. " +
          "This configuration is invalid and cookies may be rejected."
      );
    }
    console.log("[COOKIES] Production cookie security validated.");
  }
}

// Run validation at module load
validateCookieSecurity();
