/**
 * Feature Flags
 *
 * Centralized feature flag management for Murmurant.
 * All flags default to OFF for safety.
 *
 * Copyright © 2025 Murmurant, Inc.
 */

/**
 * Check if ACH payment option is enabled
 *
 * When enabled:
 * - Members can add/manage ACH payment methods
 * - Checkout shows ACH as a payment option
 * - Admin sees ACH adoption metrics
 *
 * Default: OFF (MURMURANT_ACH_ENABLED must be "1" or "true" to enable)
 */
export function isAchEnabled(): boolean {
  const value = process.env.MURMURANT_ACH_ENABLED;
  return value === "1" || value === "true";
}

/**
 * All feature flags for reference
 */
export const FEATURE_FLAGS = {
  ACH_ENABLED: "MURMURANT_ACH_ENABLED",
  NATIVE_AUTH: "MURMURANT_NATIVE_AUTH",
  NATIVE_EMAIL: "MURMURANT_NATIVE_EMAIL",
  NATIVE_PAYMENTS: "MURMURANT_NATIVE_PAYMENTS",
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

/**
 * Generic feature flag checker
 * @param flag - The feature flag name (e.g., "NATIVE_AUTH")
 * @returns true if the flag is enabled ("1" or "true")
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  const envVar = FEATURE_FLAGS[flag];
  const value = process.env[envVar];
  return value === "1" || value === "true";
}
