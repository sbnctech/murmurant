/**
 * Policy Access Layer - Types
 *
 * This module defines the type-safe keys for organization-configurable policies.
 * All policy access MUST go through getPolicy() to ensure:
 * 1. Type safety for policy keys
 * 2. Default value resolution
 * 3. Future database/config integration
 *
 * See: Issue #235 (Membership Lifecycle Thresholds Migration)
 * See: Issue #263 (Policy Configuration Layer)
 */

// =============================================================================
// Policy Key Definitions
// =============================================================================

/**
 * Membership lifecycle policy keys
 */
export type MembershipPolicyKey =
  | "membership.newbieDays" // Days before newbie status expires
  | "membership.extendedDays" // Days to qualify as extended member
  | "membership.gracePeriodDays" // Days before lapsed status
  | "membership.renewalReminderDays"; // Days before expiration to remind

/**
 * Union of all valid policy keys
 */
export type PolicyKey = MembershipPolicyKey;

// =============================================================================
// Policy Value Types
// =============================================================================

/**
 * Maps each policy key to its value type
 */
export interface PolicyValueMap {
  // Membership
  "membership.newbieDays": number;
  "membership.extendedDays": number;
  "membership.gracePeriodDays": number;
  "membership.renewalReminderDays": number;
}

// =============================================================================
// Helper Types
// =============================================================================

/**
 * Extract the value type for a given policy key
 */
export type PolicyValue<K extends PolicyKey> = PolicyValueMap[K];

/**
 * Organization ID type (opaque string for now)
 */
export type OrganizationId = string;

/**
 * Options for getPolicy
 */
export interface GetPolicyOptions {
  /**
   * Organization ID (required for future multi-tenant support)
   * Currently unused but enforced for API stability
   */
  orgId: OrganizationId;
}
