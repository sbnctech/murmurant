// Copyright © 2025 Murmurant, Inc. All rights reserved.
/**
 * Wild Apricot API Configuration
 *
 * Security: Credentials are loaded from environment variables only.
 * Never hardcode or log credentials.
 *
 * Charter: P9 (fail closed) - Missing config = hard failure
 */

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export type WaConfig = {
  /** WA API base URL */
  apiUrl: string;

  /** WA OAuth token URL */
  tokenUrl: string;

  /** WA Account ID */
  accountId: number;

  /** API Key (client_id for OAuth) */
  apiKey: string;

  /** Client Secret */
  clientSecret: string;

  /** Request timeout in ms */
  timeoutMs: number;

  /** Max retries for failed requests */
  maxRetries: number;

  /** Rate limit: requests per minute per org */
  rateLimitPerMinute: number;

  /** Circuit breaker: failure count before opening */
  circuitBreakerThreshold: number;

  /** Circuit breaker: reset time in ms */
  circuitBreakerResetMs: number;
};

// ============================================================================
// CONFIGURATION LOADING
// ============================================================================

/**
 * Configuration validation errors.
 */
export class WaConfigError extends Error {
  constructor(
    message: string,
    public readonly missingVars: string[]
  ) {
    super(message);
    this.name = "WaConfigError";
  }
}

/**
 * Load and validate WA configuration from environment.
 *
 * Security: Fails hard if required credentials are missing.
 * This ensures we never attempt API calls without proper auth.
 *
 * @throws {WaConfigError} If required environment variables are missing
 */
export function loadWaConfig(): WaConfig {
  const missingVars: string[] = [];

  // Required variables
  const accountIdStr = process.env.WA_ACCOUNT_ID;
  const apiKey = process.env.WA_API_KEY;
  const clientSecret = process.env.WA_CLIENT_SECRET;

  if (!accountIdStr) missingVars.push("WA_ACCOUNT_ID");
  if (!apiKey) missingVars.push("WA_API_KEY");
  if (!clientSecret) missingVars.push("WA_CLIENT_SECRET");

  if (missingVars.length > 0) {
    throw new WaConfigError(
      `Missing required WA configuration: ${missingVars.join(", ")}`,
      missingVars
    );
  }

  const accountId = parseInt(accountIdStr!, 10);
  if (isNaN(accountId)) {
    throw new WaConfigError("WA_ACCOUNT_ID must be a valid number", ["WA_ACCOUNT_ID"]);
  }

  return {
    apiUrl: process.env.WA_API_URL || "https://api.wildapricot.org/v2.2",
    tokenUrl: process.env.WA_TOKEN_URL || "https://oauth.wildapricot.org/auth/token",
    accountId,
    apiKey: apiKey!,
    clientSecret: clientSecret!,
    timeoutMs: parseInt(process.env.WA_TIMEOUT_MS || "30000", 10),
    maxRetries: parseInt(process.env.WA_MAX_RETRIES || "3", 10),
    rateLimitPerMinute: parseInt(process.env.WA_RATE_LIMIT || "60", 10),
    circuitBreakerThreshold: parseInt(process.env.WA_CIRCUIT_THRESHOLD || "5", 10),
    circuitBreakerResetMs: parseInt(process.env.WA_CIRCUIT_RESET_MS || "60000", 10),
  };
}

/**
 * Check if WA integration is enabled.
 *
 * Returns false if credentials are not configured.
 * Use this for graceful degradation in development.
 */
export function isWaEnabled(): boolean {
  return !!(
    process.env.WA_ACCOUNT_ID &&
    process.env.WA_API_KEY &&
    process.env.WA_CLIENT_SECRET
  );
}

/**
 * Get config safely, returning null if not configured.
 *
 * Use this when WA integration is optional.
 */
export function getWaConfigSafe(): WaConfig | null {
  try {
    return loadWaConfig();
  } catch {
    return null;
  }
}

// ============================================================================
// SECURITY CONSTANTS
// ============================================================================

/**
 * Maximum request body size for WA API calls (5MB).
 */
export const WA_MAX_REQUEST_SIZE = 5 * 1024 * 1024;

/**
 * Maximum number of records per API request.
 */
export const WA_MAX_RECORDS_PER_REQUEST = 500;

/**
 * Sensitive field names that should never be logged (normalized lowercase, no separators).
 */
export const WA_SENSITIVE_FIELDS = new Set([
  "password",
  "accesstoken",
  "refreshtoken",
  "apikey",
  "clientsecret",
  "ssn",
  "socialsecuritynumber",
  "taxid",
  "creditcard",
  "cardnumber",
  "cvv",
  "bankaccount",
]);

/**
 * Check if a field name is sensitive.
 * Handles camelCase, snake_case, and kebab-case.
 */
export function isSensitiveField(fieldName: string): boolean {
  // Normalize: lowercase and remove all separators
  const normalized = fieldName.toLowerCase().replace(/[_-]/g, "");
  return WA_SENSITIVE_FIELDS.has(normalized);
}
