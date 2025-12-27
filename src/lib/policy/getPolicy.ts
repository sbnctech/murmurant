/**
 * Policy Access Layer - getPolicy
 *
 * Single entry point for accessing organization-configurable policies.
 * All code that needs policy values MUST use this function.
 *
 * Current implementation: Returns hard-coded defaults (SBNC values)
 * Future implementation: Database lookup with caching
 *
 * See: docs/ARCH/POLICY_KEY_CATALOG.md
 * Related: Issue #263 (Policy Configuration Layer)
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
const POLICY_DEFAULTS: PolicyValueMap = {
  // Membership lifecycle
  "membership.newbieDays": 90,
  "membership.extendedDays": 730,
  "membership.gracePeriodDays": 30,
  "membership.renewalReminderDays": 30,

  // Event scheduling (SBNC: Pacific time, Tuesday 8 AM opens, Sunday announcements)
  "scheduling.timezone": "America/Los_Angeles",
  "scheduling.registrationOpenDay": 2, // Tuesday (0 = Sunday)
  "scheduling.registrationOpenHour": 8, // 8 AM
  "scheduling.eventArchiveDays": 30,
  "scheduling.announcementDay": 0, // Sunday
  "scheduling.announcementHour": 8, // 8 AM

  // Governance
  "governance.minutesReviewDays": 7,
  "governance.boardEligibilityDays": 730, // 2 years
  "governance.quorumPercentage": 50,

  // KPI thresholds
  "kpi.membershipWarningThreshold": 200,
  "kpi.membershipDangerThreshold": 150,
  "kpi.eventAttendanceWarningPercent": 50,
  "kpi.eventAttendanceDangerPercent": 25,

  // Display
  "display.organizationName": "Organization",
  "display.memberTermSingular": "member",
  "display.memberTermPlural": "members",

  // Membership Tiers (Issue #276)
  // WA level names → ClubOS tier codes for SBNC
  "membership.tiers.enabled": false,
  "membership.tiers.defaultCode": "GENERAL",
  "membership.tiers.waMapping": {
    "New Member": "NEWCOMER",
    Newcomer: "NEWCOMER",
    "1st Year": "FIRST_YEAR",
    "2nd Year": "SECOND_YEAR",
    "Third Year": "THIRD_YEAR",
    "3rd Year": "THIRD_YEAR",
    Alumni: "ALUMNI",
    Lapsed: "LAPSED",
    Prospect: "PROSPECT",
  },
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
    super(`Invalid policy key: "${key}". Valid keys are: ${Array.from(VALID_KEYS).join(", ")}`);
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
 *
 * const timezone = getPolicy("scheduling.timezone", { orgId: "org_123" });
 * // Returns: "America/Los_Angeles" (default)
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
 * Get multiple policy values at once.
 *
 * @param keys - Array of policy keys to retrieve
 * @param options - Options including orgId
 * @returns Object mapping keys to their values
 *
 * @example
 * ```typescript
 * const policies = getPolicies(
 *   ["membership.newbieDays", "membership.extendedDays"],
 *   { orgId: "org_123" }
 * );
 * // Returns: { "membership.newbieDays": 90, "membership.extendedDays": 730 }
 * ```
 */
export function getPolicies<K extends PolicyKey>(
  keys: K[],
  options: GetPolicyOptions
): { [key in K]: PolicyValue<key> } {
  const result = {} as { [key in K]: PolicyValue<key> };

  for (const key of keys) {
    result[key] = getPolicy(key, options);
  }

  return result;
}

/**
 * Get all policy values for an organization.
 *
 * @param options - Options including orgId
 * @returns Complete policy value map
 */
export function getAllPolicies(options: GetPolicyOptions): PolicyValueMap {
  // Validate orgId
  if (!options?.orgId) {
    throw new MissingOrgIdError();
  }

  // TODO: Future implementation will merge org-specific values with defaults
  return { ...POLICY_DEFAULTS };
}

/**
 * Get the default value for a policy key.
 * Use this when you specifically want the platform default, not the org value.
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

export { POLICY_DEFAULTS };
export type { PolicyKey, PolicyValue, PolicyValueMap, GetPolicyOptions } from "./types";
