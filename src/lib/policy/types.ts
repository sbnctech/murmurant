/**
 * Policy Access Layer - Types
 *
 * This module defines the type-safe keys for organization-configurable policies.
 * All policy access MUST go through getPolicy() to ensure:
 * 1. Type safety for policy keys
 * 2. Default value resolution
 * 3. Future database/config integration
 *
 * See: docs/ARCH/PLATFORM_VS_POLICY.md
 * Related: Issue #263 (Policy Configuration Layer)
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
 * Event scheduling policy keys
 */
export type SchedulingPolicyKey =
  | "scheduling.timezone" // Organization timezone (IANA format)
  | "scheduling.registrationOpenDay" // Day of week registration opens (0-6)
  | "scheduling.registrationOpenHour" // Hour registration opens (0-23)
  | "scheduling.eventArchiveDays" // Days after event to archive
  | "scheduling.announcementDay" // Day of week for announcements (0-6)
  | "scheduling.announcementHour"; // Hour for announcements (0-23)

/**
 * Governance workflow policy keys
 */
export type GovernancePolicyKey =
  | "governance.minutesReviewDays" // Days to review minutes
  | "governance.boardEligibilityDays" // Days of membership for board eligibility
  | "governance.quorumPercentage"; // Percentage for quorum

/**
 * KPI and dashboard policy keys
 */
export type KpiPolicyKey =
  | "kpi.membershipWarningThreshold" // Membership count warning level
  | "kpi.membershipDangerThreshold" // Membership count danger level
  | "kpi.eventAttendanceWarningPercent" // Event attendance warning percentage
  | "kpi.eventAttendanceDangerPercent"; // Event attendance danger percentage

/**
 * Display and terminology policy keys
 */
export type DisplayPolicyKey =
  | "display.organizationName" // Organization display name
  | "display.memberTermSingular" // What to call a member (e.g., "member", "participant")
  | "display.memberTermPlural"; // Plural form

/**
 * Union of all valid policy keys
 */
export type PolicyKey =
  | MembershipPolicyKey
  | SchedulingPolicyKey
  | GovernancePolicyKey
  | KpiPolicyKey
  | DisplayPolicyKey;

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

  // Scheduling
  "scheduling.timezone": string;
  "scheduling.registrationOpenDay": number;
  "scheduling.registrationOpenHour": number;
  "scheduling.eventArchiveDays": number;
  "scheduling.announcementDay": number;
  "scheduling.announcementHour": number;

  // Governance
  "governance.minutesReviewDays": number;
  "governance.boardEligibilityDays": number;
  "governance.quorumPercentage": number;

  // KPI
  "kpi.membershipWarningThreshold": number;
  "kpi.membershipDangerThreshold": number;
  "kpi.eventAttendanceWarningPercent": number;
  "kpi.eventAttendanceDangerPercent": number;

  // Display
  "display.organizationName": string;
  "display.memberTermSingular": string;
  "display.memberTermPlural": string;
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
