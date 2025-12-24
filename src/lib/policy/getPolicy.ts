/**
 * Policy Access Layer - getPolicy
 *
 * Single entry point for accessing organization-configurable policies.
 * All code that needs policy values MUST use this function.
 *
 * Current implementation: Returns hard-coded defaults (SBNC values)
 * Future implementation: Database lookup with caching
 *
 * See: Issue #235 (Membership Lifecycle Thresholds Migration)
 * See: Issue #263 (Policy Configuration Layer)
 */

import type {
  PolicyKey,
  PolicyValue,
  PolicyValueMap,
  GetPolicyOptions,
} from "./types";

// =============================================================================
// Default Values (SBNC as Tenant Zero)
// =============================================================================

/**
 * Default policy values based on SBNC configuration.
 * These serve as fallbacks and initial values for new organizations.
 *
 * IMPORTANT: These are DEFAULTS, not requirements.
 * Other organizations may configure different values.
 */
export const POLICY_DEFAULTS: PolicyValueMap = {
  // Membership lifecycle
  "membership.newbieDays": 90,
  "membership.extendedDays": 730,
  "membership.gracePeriodDays": 30,
  "membership.renewalReminderDays": 30,
};

// =============================================================================
// Validation
// =============================================================================

/**
 * Set of all valid policy keys for runtime validation
 */
const VALID_KEYS = new Set<string>(Object.keys(POLICY_DEFAULTS));

/**
 * Type guard to check if a string is a valid PolicyKey
 */
export function isValidPolicyKey(key: string): key is PolicyKey {
  return VALID_KEYS.has(key);
}

/**
 * Error thrown when an invalid policy key is requested
 */
export class InvalidPolicyKeyError extends Error {
  constructor(key: string) {
    super(
      `Invalid policy key: "${key}". Valid keys are: ${Array.from(VALID_KEYS).join(", ")}`
    );
    this.name = "InvalidPolicyKeyError";
  }
}

/**
 * Error thrown when orgId is missing
 */
export class MissingOrgIdError extends Error {
  constructor() {
    super("orgId is required for policy access (even if currently unused)");
    this.name = "MissingOrgIdError";
  }
}

// =============================================================================
// Main API
// =============================================================================

/**
 * Get a policy value for an organization.
 *
 * @param key - The policy key to retrieve
 * @param options - Options including orgId
 * @returns The policy value (currently always the default)
 * @throws InvalidPolicyKeyError if key is not a valid PolicyKey
 * @throws MissingOrgIdError if orgId is not provided
 *
 * @example
 * ```typescript
 * const newbieDays = getPolicy("membership.newbieDays", { orgId: "org_123" });
 * // Returns: 90 (default)
 * ```
 */
export function getPolicy<K extends PolicyKey>(
  key: K,
  options: GetPolicyOptions
): PolicyValue<K> {
  // Validate orgId is provided (future: use for lookup)
  if (!options?.orgId) {
    throw new MissingOrgIdError();
  }

  // Validate key at runtime (TypeScript only catches compile-time)
  if (!isValidPolicyKey(key)) {
    throw new InvalidPolicyKeyError(key);
  }

  // TODO: Future implementation will:
  // 1. Check cache for org-specific value
  // 2. Query database if not cached
  // 3. Fall back to default if not configured
  //
  // For now, always return the default
  return POLICY_DEFAULTS[key] as PolicyValue<K>;
}

/**
 * Get the default value for a policy key.
 * Use this when you specifically want the platform default, not the org value.
 *
 * This is appropriate for pure/deterministic functions that don't have
 * org context, like the lifecycle state machine.
 *
 * @param key - The policy key
 * @returns The default value
 */
export function getPolicyDefault<K extends PolicyKey>(key: K): PolicyValue<K> {
  if (!isValidPolicyKey(key)) {
    throw new InvalidPolicyKeyError(key);
  }

  return POLICY_DEFAULTS[key] as PolicyValue<K>;
}

// =============================================================================
// Exports
// =============================================================================

export type { PolicyKey, PolicyValue, PolicyValueMap, GetPolicyOptions } from "./types";
