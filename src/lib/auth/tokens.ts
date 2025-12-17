/**
 * Auth Token Utilities
 *
 * Provides cryptographically secure token generation and hashing
 * for login tokens and session tokens.
 *
 * Security Requirements:
 * - Tokens are 256-bit random (32 bytes, base64url encoded)
 * - Token hashes use scrypt with per-token salt
 * - Verification uses constant-time comparison
 *
 * Charter Compliance:
 * - P1: Cryptographically secure tokens ensure identity is provable
 * - P9: Fail closed on invalid tokens
 */

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// Token configuration
const TOKEN_BYTES = 32; // 256 bits of entropy
const SALT_BYTES = 16; // 128-bit salt
const SCRYPT_KEY_LENGTH = 32; // 256-bit derived key
const SCRYPT_COST = 16384; // N parameter (2^14)
const SCRYPT_BLOCK_SIZE = 8; // r parameter
const SCRYPT_PARALLELIZATION = 1; // p parameter

/**
 * Generate a cryptographically secure token.
 * Returns a base64url-encoded string with 256 bits of entropy.
 */
export function generateToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

/**
 * Hash a token for secure storage.
 * Uses scrypt with a per-token salt for strong protection against
 * precomputation attacks.
 *
 * @param rawToken - The raw token string to hash
 * @returns Promise<string> - Format: "salt:hash" (both base64url encoded)
 */
export function hashToken(rawToken: string): string {
  const salt = randomBytes(SALT_BYTES);
  const derivedKey = scryptSync(rawToken, salt, SCRYPT_KEY_LENGTH, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELIZATION,
  });

  const saltStr = salt.toString("base64url");
  const hashStr = derivedKey.toString("base64url");

  return `${saltStr}:${hashStr}`;
}

/**
 * Verify a token against its stored hash.
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @param rawToken - The raw token string to verify
 * @param storedHash - The stored hash in "salt:hash" format
 * @returns boolean - true if token matches, false otherwise
 */
export function verifyToken(rawToken: string, storedHash: string): boolean {
  try {
    const [saltStr, hashStr] = storedHash.split(":");
    if (!saltStr || !hashStr) {
      return false;
    }

    const salt = Buffer.from(saltStr, "base64url");
    const expectedHash = Buffer.from(hashStr, "base64url");

    // Derive key from the provided token
    const derivedKey = scryptSync(rawToken, salt, SCRYPT_KEY_LENGTH, {
      N: SCRYPT_COST,
      r: SCRYPT_BLOCK_SIZE,
      p: SCRYPT_PARALLELIZATION,
    });

    // Constant-time comparison
    if (derivedKey.length !== expectedHash.length) {
      return false;
    }

    return timingSafeEqual(derivedKey, expectedHash);
  } catch {
    // Any error in parsing or computation = fail closed
    return false;
  }
}

/**
 * Generate a login token with its hash.
 * Convenience function that generates a token and its hash together.
 *
 * @returns { token: string; hash: string } - token is for the email link, hash is for DB storage
 */
export function generateLoginToken(): { token: string; hash: string } {
  const token = generateToken();
  const hash = hashToken(token);
  return { token, hash };
}

/**
 * Generate a session token with its hash.
 * Same as generateLoginToken but with semantic naming for clarity.
 *
 * @returns { token: string; hash: string } - token is for the cookie, hash is for DB storage
 */
export function generateSessionToken(): { token: string; hash: string } {
  return generateLoginToken();
}
