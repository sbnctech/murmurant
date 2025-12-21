/**
 * Feature Flags
 *
 * Centralized feature flag management for ClubOS.
 * All flags default to OFF for safety.
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

/**
 * Check if ACH payment option is enabled
 *
 * When enabled:
 * - Members can add/manage ACH payment methods
 * - Checkout shows ACH as a payment option
 * - Admin sees ACH adoption metrics
 *
 * Default: OFF (CLUBOS_ACH_ENABLED must be "1" or "true" to enable)
 */
export function isAchEnabled(): boolean {
  const value = process.env.CLUBOS_ACH_ENABLED;
  return value === "1" || value === "true";
}

/**
 * All feature flags for reference
 */
export const FEATURE_FLAGS = {
  ACH_ENABLED: "CLUBOS_ACH_ENABLED",
} as const;
