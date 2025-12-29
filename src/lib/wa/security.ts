// Copyright © 2025 Murmurant, Inc. All rights reserved.
/**
 * Wild Apricot API Security Controls
 *
 * This module implements security controls for the WA API proxy:
 * - Rate limiting (per-org budgets)
 * - Input validation and sanitization
 * - Credential protection
 * - Request/response filtering
 *
 * Charter: P1 (provable identity), P9 (fail closed), N7 (PII protection)
 */

import { isSensitiveField, WA_MAX_REQUEST_SIZE, WA_MAX_RECORDS_PER_REQUEST } from "./config";

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * Rate limit bucket for tracking request counts.
 */
type RateLimitBucket = {
  count: number;
  resetAt: number;
};

/**
 * In-memory rate limit storage.
 * In production, this would be Redis or similar.
 */
const rateLimitBuckets = new Map<string, RateLimitBucket>();

/**
 * Rate limit configuration.
 */
export type RateLimitConfig = {
  /** Maximum requests per window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
};

/**
 * Default rate limits by operation type.
 */
export const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  read: { limit: 100, windowMs: 60_000 }, // 100/min for reads
  write: { limit: 30, windowMs: 60_000 }, // 30/min for writes
  auth: { limit: 10, windowMs: 60_000 }, // 10/min for auth
};

/**
 * Rate limit check result.
 */
export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfterMs?: number;
};

/**
 * Check rate limit for an operation.
 *
 * @param identifier - Unique identifier (org ID, user ID, IP)
 * @param operation - Operation type for limit selection
 * @returns Rate limit check result
 */
export function checkRateLimit(
  identifier: string,
  operation: "read" | "write" | "auth"
): RateLimitResult {
  const config = DEFAULT_RATE_LIMITS[operation];
  const now = Date.now();
  const bucketKey = `${identifier}:${operation}`;

  let bucket = rateLimitBuckets.get(bucketKey);

  // Create new bucket or reset expired bucket
  if (!bucket || now >= bucket.resetAt) {
    bucket = {
      count: 0,
      resetAt: now + config.windowMs,
    };
    rateLimitBuckets.set(bucketKey, bucket);
  }

  // Check if under limit
  if (bucket.count >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(bucket.resetAt),
      retryAfterMs: bucket.resetAt - now,
    };
  }

  // Increment and allow
  bucket.count++;

  return {
    allowed: true,
    remaining: config.limit - bucket.count,
    resetAt: new Date(bucket.resetAt),
  };
}

/**
 * Reset rate limit for an identifier.
 * Used for testing and admin operations.
 */
export function resetRateLimit(identifier: string, operation?: string): void {
  if (operation) {
    rateLimitBuckets.delete(`${identifier}:${operation}`);
  } else {
    // Reset all operations for this identifier
    for (const key of rateLimitBuckets.keys()) {
      if (key.startsWith(`${identifier}:`)) {
        rateLimitBuckets.delete(key);
      }
    }
  }
}

// ============================================================================
// INPUT VALIDATION
// ============================================================================

/**
 * Validation error with details.
 */
export class WaValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value?: unknown
  ) {
    super(message);
    this.name = "WaValidationError";
  }
}

/**
 * Validate email format.
 */
export function validateEmail(email: string): boolean {
  // RFC 5322 simplified pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate WA entity ID.
 */
export function validateWaId(id: unknown, fieldName: string): number {
  if (typeof id === "number" && Number.isInteger(id) && id > 0) {
    return id;
  }
  if (typeof id === "string") {
    const parsed = parseInt(id, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  throw new WaValidationError(`Invalid WA ID: ${fieldName}`, fieldName, id);
}

/**
 * Validate string length.
 */
export function validateStringLength(
  value: string,
  fieldName: string,
  minLength: number,
  maxLength: number
): string {
  if (typeof value !== "string") {
    throw new WaValidationError(`${fieldName} must be a string`, fieldName, value);
  }
  if (value.length < minLength) {
    throw new WaValidationError(
      `${fieldName} must be at least ${minLength} characters`,
      fieldName
    );
  }
  if (value.length > maxLength) {
    throw new WaValidationError(
      `${fieldName} must be at most ${maxLength} characters`,
      fieldName
    );
  }
  return value;
}

/**
 * Validate request payload size.
 */
export function validatePayloadSize(payload: unknown): void {
  const size = JSON.stringify(payload).length;
  if (size > WA_MAX_REQUEST_SIZE) {
    throw new WaValidationError(
      `Request payload too large: ${size} bytes (max: ${WA_MAX_REQUEST_SIZE})`,
      "payload"
    );
  }
}

/**
 * Validate array length for bulk operations.
 */
export function validateArrayLength<T>(
  items: T[],
  fieldName: string,
  maxLength: number = WA_MAX_RECORDS_PER_REQUEST
): T[] {
  if (!Array.isArray(items)) {
    throw new WaValidationError(`${fieldName} must be an array`, fieldName, items);
  }
  if (items.length > maxLength) {
    throw new WaValidationError(
      `${fieldName} exceeds maximum length: ${items.length} (max: ${maxLength})`,
      fieldName
    );
  }
  return items;
}

// ============================================================================
// SANITIZATION
// ============================================================================

/**
 * Sanitize a string for safe logging.
 * Removes potential injection patterns and truncates.
 */
export function sanitizeForLog(value: string, maxLength: number = 200): string {
  if (!value) return "";

  // Remove potential log injection patterns
  let sanitized = value
    .replace(/[\r\n]/g, " ") // Remove newlines
    .replace(/\x1b\[[0-9;]*m/g, "") // Remove ANSI codes
    .trim();

  // Truncate if too long
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength) + "...";
  }

  return sanitized;
}

/**
 * Redact sensitive data from an object for logging.
 * Returns a deep copy with sensitive fields replaced.
 */
export function redactSensitiveData(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "string") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitiveData(item));
  }

  if (typeof obj === "object") {
    const redacted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (isSensitiveField(key)) {
        redacted[key] = "[REDACTED]";
      } else if (typeof value === "object") {
        redacted[key] = redactSensitiveData(value);
      } else {
        redacted[key] = value;
      }
    }
    return redacted;
  }

  return obj;
}

/**
 * Sanitize HTML/script content from WA responses.
 * Prevents XSS from WA-stored user content.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";

  // Basic HTML entity encoding for dangerous characters
  return html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// ============================================================================
// REQUEST AUTHORIZATION
// ============================================================================

/**
 * Allowed WA API operations by permission level.
 */
export const WA_OPERATION_PERMISSIONS = {
  // Read operations require basic WA access
  read: ["wa:read"],

  // Write operations require elevated permissions
  write: ["wa:write"],

  // Admin operations require full WA admin
  admin: ["wa:admin"],
} as const;

/**
 * Check if an operation is allowed for the given permissions.
 */
export function isOperationAllowed(
  operation: "read" | "write" | "admin",
  permissions: string[]
): boolean {
  const required = WA_OPERATION_PERMISSIONS[operation];
  return required.some((perm) => permissions.includes(perm));
}

// ============================================================================
// ERROR SANITIZATION
// ============================================================================

/**
 * Sanitize WA API errors for safe exposure to clients.
 * Removes internal details and potential credential leaks.
 */
export function sanitizeWaError(error: Error): { code: string; message: string } {
  const message = error.message || "Unknown error";

  // Check for credential-related errors (don't expose details)
  if (
    message.toLowerCase().includes("unauthorized") ||
    message.toLowerCase().includes("authentication") ||
    message.toLowerCase().includes("forbidden")
  ) {
    return {
      code: "WA_AUTH_ERROR",
      message: "Wild Apricot authentication failed",
    };
  }

  // Check for rate limit errors
  if (message.toLowerCase().includes("rate") || message.toLowerCase().includes("429")) {
    return {
      code: "WA_RATE_LIMITED",
      message: "Too many requests to Wild Apricot",
    };
  }

  // Check for connection errors
  if (
    message.toLowerCase().includes("timeout") ||
    message.toLowerCase().includes("econnrefused") ||
    message.toLowerCase().includes("network")
  ) {
    return {
      code: "WA_CONNECTION_ERROR",
      message: "Unable to connect to Wild Apricot",
    };
  }

  // Generic error (don't expose WA internals)
  return {
    code: "WA_ERROR",
    message: "Wild Apricot request failed",
  };
}
