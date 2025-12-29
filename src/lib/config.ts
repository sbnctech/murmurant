/**
 * Application Configuration
 *
 * Centralized configuration for Murmurant. Values can be overridden via environment variables.
 * All config values should be accessed through this module rather than directly from process.env.
 */

// ============================================================================
// Transition Widget Configuration
// ============================================================================

/**
 * Number of days before a term transition when the countdown widget becomes visible.
 * Default: 60 days
 * Override: TRANSITION_WIDGET_LEAD_DAYS environment variable
 */
export function getTransitionWidgetLeadDays(): number {
  const envValue = process.env.TRANSITION_WIDGET_LEAD_DAYS;
  if (envValue) {
    const parsed = parseInt(envValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 60;
}

// ============================================================================
// Environment Detection
// ============================================================================

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function isTest(): boolean {
  return process.env.NODE_ENV === "test";
}

// ============================================================================
// Feature Flags
// ============================================================================

/**
 * Enable webmaster debug readonly access to member/registration data.
 * Default: false
 * Override: WEBMASTER_DEBUG_READONLY=true
 */
export function isWebmasterDebugEnabled(): boolean {
  return process.env.WEBMASTER_DEBUG_READONLY === "true";
}
