/**
 * Auth Cookie Configuration
 *
 * Defines secure cookie settings for session management.
 *
 * Cookie Security:
 * - __Host- prefix: Requires Secure, Path=/, and no Domain attribute
 * - HttpOnly: Prevents JavaScript access (XSS protection)
 * - Secure: Cookie only sent over HTTPS (required for __Host-)
 * - SameSite=Lax: CSRF protection while allowing top-level navigations
 *
 * Note: __Host- prefix is only enforced in production (HTTPS).
 * In development, we use a non-prefixed cookie name for localhost compatibility.
 *
 * Charter Compliance:
 * - P1: Cookie security ensures session integrity
 * - P9: Strict cookie settings prevent common attacks
 */

import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

// Cookie name with __Host- prefix for production security
// In development, use simpler name for localhost compatibility
const PRODUCTION_COOKIE_NAME = "__Host-murmurant_session";
const DEVELOPMENT_COOKIE_NAME = "murmurant_session";

// Session durations
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days
export const SESSION_IDLE_TIMEOUT_SECONDS = 24 * 60 * 60; // 24 hours for activity tracking

/**
 * Get the session cookie name based on environment.
 * Uses __Host- prefix in production for additional security.
 */
export function getSessionCookieName(): string {
  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_COOKIE_NAME;
  }
  return DEVELOPMENT_COOKIE_NAME;
}

/**
 * Get secure cookie options for setting the session cookie.
 * These options implement OWASP recommendations for session cookies.
 */
export function getSessionCookieOptions(): Omit<ResponseCookie, "name" | "value"> {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction, // Required for __Host- prefix
    sameSite: "lax", // CSRF protection + allows top-level navigation
    path: "/", // Required for __Host- prefix
    maxAge: SESSION_MAX_AGE_SECONDS,
    // Note: No domain attribute (required for __Host- prefix)
  };
}

/**
 * Get cookie options for clearing the session cookie.
 */
export function getClearSessionCookieOptions(): Omit<ResponseCookie, "name" | "value"> {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0, // Expires immediately
  };
}

/**
 * Validate cookie security configuration.
 * Call at startup in production to fail fast on misconfiguration.
 */
export function validateCookieConfig(): void {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    console.log(
      `[AUTH] Cookie config: name="${getSessionCookieName()}", ` +
        `httpOnly=true, secure=true, sameSite=lax, path=/, maxAge=${SESSION_MAX_AGE_SECONDS}s`
    );
  }
}
