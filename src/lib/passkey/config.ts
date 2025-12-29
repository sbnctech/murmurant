/**
 * Passkey/WebAuthn Configuration
 *
 * Derives rpID and origin from environment variables with fail-closed behavior.
 * Uses strict validation to prevent misconfiguration attacks.
 *
 * Environment Variables:
 * - PASSKEY_RP_ID: Relying party ID (usually the domain, e.g., "sbnc.club")
 * - PASSKEY_ORIGIN: Expected origin (e.g., "https://sbnc.club")
 * - PASSKEY_RP_NAME: Human-readable name for the RP (e.g., "Santa Barbara Newcomers Club")
 *
 * Security Notes:
 * - rpID must match the domain where credentials are registered
 * - origin must be the exact origin used by the browser (including protocol)
 * - These values are cryptographically bound to credentials and cannot be changed later
 */

// Challenge expiration in milliseconds (5 minutes)
export const CHALLENGE_EXPIRATION_MS = 5 * 60 * 1000;

// Magic link expiration in milliseconds (15 minutes)
export const MAGIC_LINK_EXPIRATION_MS = 15 * 60 * 1000;

// Session cookie configuration
export const SESSION_COOKIE_NAME = "murmurant_session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days
export const SESSION_IDLE_TIMEOUT_SECONDS = 24 * 60 * 60; // 24 hours

// Rate limiting thresholds
export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
export const RATE_LIMIT_MAX_ATTEMPTS = 10; // Max attempts per window per IP

/**
 * Get the WebAuthn Relying Party ID.
 *
 * The rpID is typically the domain without protocol or port.
 * For subdomains, you can use the parent domain to allow credentials
 * to work across subdomains.
 *
 * @throws Error if PASSKEY_RP_ID is not set in production
 */
export function getRelyingPartyId(): string {
  const rpId = process.env.PASSKEY_RP_ID;

  if (rpId) {
    // Validate format: should be a valid domain without protocol
    if (rpId.includes("://") || rpId.includes("/")) {
      throw new Error(
        `Invalid PASSKEY_RP_ID format: "${rpId}". Must be a domain like "example.com", not a URL.`
      );
    }
    return rpId;
  }

  // Development defaults
  if (process.env.NODE_ENV === "development") {
    return "localhost";
  }

  // Fail closed in production
  throw new Error(
    "PASSKEY_RP_ID environment variable is required in production. " +
      "Set it to your domain (e.g., 'sbnc.club')."
  );
}

/**
 * Get the expected WebAuthn origin(s).
 *
 * The origin is the full protocol + domain + port that the browser reports.
 * This must exactly match what the authenticator receives.
 *
 * @throws Error if PASSKEY_ORIGIN is not set in production
 */
export function getExpectedOrigin(): string | string[] {
  const origin = process.env.PASSKEY_ORIGIN;

  if (origin) {
    // Validate format: should be a valid URL
    try {
      new URL(origin);
    } catch {
      throw new Error(
        `Invalid PASSKEY_ORIGIN format: "${origin}". Must be a full URL like "https://example.com".`
      );
    }
    return origin;
  }

  // Development defaults - support both localhost variants
  if (process.env.NODE_ENV === "development") {
    const port = process.env.PORT ?? "3000";
    return [
      `http://localhost:${port}`,
      `http://127.0.0.1:${port}`,
    ];
  }

  // Fail closed in production
  throw new Error(
    "PASSKEY_ORIGIN environment variable is required in production. " +
      "Set it to your full origin URL (e.g., 'https://sbnc.club')."
  );
}

/**
 * Get the Relying Party name for display in authenticator prompts.
 */
export function getRelyingPartyName(): string {
  return process.env.PASSKEY_RP_NAME ?? "Murmurant";
}

/**
 * Validate that passkey configuration is complete and consistent.
 * Call this at startup to fail fast on misconfiguration.
 */
export function validatePasskeyConfig(): void {
  const rpId = getRelyingPartyId();
  const origin = getExpectedOrigin();
  const rpName = getRelyingPartyName();

  // In production, verify origin matches rpId
  if (process.env.NODE_ENV === "production") {
    const origins = Array.isArray(origin) ? origin : [origin];
    for (const o of origins) {
      const url = new URL(o);
      // The origin's hostname should end with the rpId (or equal it)
      if (!url.hostname.endsWith(rpId)) {
        throw new Error(
          `PASSKEY_ORIGIN hostname "${url.hostname}" does not match PASSKEY_RP_ID "${rpId}". ` +
            "The origin must be on the same domain or a subdomain of the rpId."
        );
      }
    }
  }

  console.log(
    `[PASSKEY] Config validated: rpId="${rpId}", rpName="${rpName}", ` +
      `origins=${JSON.stringify(origin)}`
  );
}

/**
 * Configuration object for SimpleWebAuthn
 */
export interface PasskeyConfig {
  rpId: string;
  rpName: string;
  origin: string | string[];
  challengeExpirationMs: number;
  magicLinkExpirationMs: number;
}

/**
 * Get the complete passkey configuration object.
 */
export function getPasskeyConfig(): PasskeyConfig {
  return {
    rpId: getRelyingPartyId(),
    rpName: getRelyingPartyName(),
    origin: getExpectedOrigin(),
    challengeExpirationMs: CHALLENGE_EXPIRATION_MS,
    magicLinkExpirationMs: MAGIC_LINK_EXPIRATION_MS,
  };
}
