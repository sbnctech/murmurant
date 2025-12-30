/**
 * Scheduling Policy Key Adapter
 *
 * This module provides stable policy key accessors for scheduling-related
 * constants. Currently a no-op layer returning key strings; future work
 * will wire these through getPolicy() for org-specific configuration.
 *
 * Related:
 * - Issue #263: Policy Configuration Layer
 * - docs/ARCH/PLATFORM_VS_POLICY.md
 *
 * Future Work:
 * - Wire getSchedulingTimezone() to use getPolicy("scheduling.timezone", orgContext)
 * - Replace hardcoded SBNC_TIMEZONE in src/lib/events/scheduling.ts
 * - Replace hardcoded DEFAULT_REGISTRATION_OPEN_HOUR
 * - Replace hardcoded ARCHIVE_DAYS_AFTER_END
 *
 * Charter Compliance:
 * - P8: Schema and APIs are stable contracts (key strings are versioned)
 * - P4: No hidden rules (policy keys are documented)
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import type { SchedulingPolicyKey } from "@/lib/policy/types";

// =============================================================================
// POLICY KEY ACCESSORS
// =============================================================================

/**
 * Returns the policy key for organization timezone.
 *
 * Current hardcoded value: "America/Los_Angeles" (src/lib/events/scheduling.ts)
 *
 * Future: Will be wired through getPolicy() for org-specific timezones.
 */
export function getSchedulingTimezonePolicyKey(): SchedulingPolicyKey {
  return "scheduling.timezone";
}

/**
 * Returns the policy key for registration open hour.
 *
 * Current hardcoded value: 8 (src/lib/events/scheduling.ts)
 *
 * Future: Will be wired through getPolicy() for org-specific open times.
 */
export function getRegistrationOpenHourPolicyKey(): SchedulingPolicyKey {
  return "scheduling.registrationOpenHour";
}

/**
 * Returns the policy key for event archive days.
 *
 * Current hardcoded value: 30 (src/lib/events/scheduling.ts)
 *
 * Future: Will be wired through getPolicy() for org-specific archive windows.
 */
export function getEventArchiveDaysPolicyKey(): SchedulingPolicyKey {
  return "scheduling.eventArchiveDays";
}

// =============================================================================
// ADDITIONAL POLICY KEYS (for completeness)
// =============================================================================

/**
 * Returns the policy key for registration open day.
 *
 * Current hardcoded behavior: Tuesday (day 2)
 *
 * Future: Will be wired through getPolicy() for org-specific open days.
 */
export function getRegistrationOpenDayPolicyKey(): SchedulingPolicyKey {
  return "scheduling.registrationOpenDay";
}

/**
 * Returns the policy key for announcement day.
 *
 * Current hardcoded behavior: Sunday (day 0)
 *
 * Future: Will be wired through getPolicy() for org-specific announcement days.
 */
export function getAnnouncementDayPolicyKey(): SchedulingPolicyKey {
  return "scheduling.announcementDay";
}

/**
 * Returns the policy key for announcement hour.
 *
 * Current hardcoded behavior: 8 AM
 *
 * Future: Will be wired through getPolicy() for org-specific announcement times.
 */
export function getAnnouncementHourPolicyKey(): SchedulingPolicyKey {
  return "scheduling.announcementHour";
}

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * All scheduling policy keys as a constant array.
 * Useful for iteration and validation.
 */
export const SCHEDULING_POLICY_KEYS: readonly SchedulingPolicyKey[] = [
  "scheduling.timezone",
  "scheduling.registrationOpenDay",
  "scheduling.registrationOpenHour",
  "scheduling.eventArchiveDays",
  "scheduling.announcementDay",
  "scheduling.announcementHour",
] as const;
