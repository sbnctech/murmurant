/**
 * KPI Data Access Types
 *
 * Types for data-access functions used by KPI evaluators.
 * NOTE: Avoid leaking committee/member names; return signals only.
 */

/**
 * Operational health statistics.
 * Tracks system-level operational metrics.
 */
export type OpsHealthStats = {
  /** Number of events created in the reporting period */
  eventsCreated: number;
  /** Number of events with at least one registration */
  eventsWithRegistrations: number;
  /** Total registrations in the reporting period */
  totalRegistrations: number;
  /** Average fill rate across events (0-1) */
  averageFillRate: number;
  /** Number of waitlisted registrations */
  waitlistedCount: number;
  /** Timestamp of data retrieval */
  asOf: string;
};

/**
 * Member engagement statistics by membership tier.
 */
export type MemberEngagementByTierStats = {
  tiers: Array<{
    /** Tier identifier (e.g., "GOLD", "SILVER", "BRONZE") */
    tierId: string;
    /** Number of members in this tier */
    memberCount: number;
    /** Number of event registrations by members in this tier */
    registrationCount: number;
    /** Average registrations per member */
    avgRegistrationsPerMember: number;
    /** Percentage of members with at least one registration (0-100) */
    participationRate: number;
  }>;
  /** Timestamp of data retrieval */
  asOf: string;
};

/**
 * New member activation/onboarding statistics.
 */
export type NewbieActivationStats = {
  /** Number of new members in the reporting period */
  newMemberCount: number;
  /** Number of new members who registered for at least one event */
  activatedCount: number;
  /** Activation rate (0-100) */
  activationRate: number;
  /** Average days to first registration for activated members */
  avgDaysToFirstRegistration: number | null;
  /** Number of new members with zero registrations */
  dormantCount: number;
  /** Timestamp of data retrieval */
  asOf: string;
};

/**
 * Committee meeting/activity cadence statistics.
 * NOTE: No committee names exposed; signals only.
 */
export type CommitteeCadenceStats = {
  /** Total number of committees tracked */
  totalCommittees: number;
  /** Number of committees with recent activity (within threshold) */
  activeCommittees: number;
  /** Number of committees without recent activity */
  inactiveCommittees: number;
  /** Average meetings per committee in reporting period */
  avgMeetingsPerCommittee: number;
  /** Percentage of committees meeting cadence expectations (0-100) */
  cadenceComplianceRate: number;
  /** Timestamp of data retrieval */
  asOf: string;
};

/**
 * Financial coverage statistics.
 * NOTE: No dollar amounts exposed; ratios and percentages only.
 */
export type FinancialCoverageStats = {
  /** Budget coverage ratio (actual/budget) */
  budgetCoverageRatio: number;
  /** Number of budget categories on track */
  categoriesOnTrack: number;
  /** Number of budget categories over budget */
  categoriesOverBudget: number;
  /** Number of budget categories under-spent */
  categoriesUnderSpent: number;
  /** Percentage of budget utilized (0-100) */
  utilizationRate: number;
  /** Timestamp of data retrieval */
  asOf: string;
};

/**
 * Input parameters for date-ranged queries.
 */
export type DateRangeParams = {
  /** Start of reporting period (ISO date string) */
  startDate: string;
  /** End of reporting period (ISO date string) */
  endDate: string;
};

/**
 * Input parameters for newbie activation queries.
 */
export type NewbieActivationParams = DateRangeParams & {
  /** Number of days since join to consider as "newbie" */
  newbieDaysThreshold?: number;
};

/**
 * Input parameters for committee cadence queries.
 */
export type CommitteeCadenceParams = DateRangeParams & {
  /** Number of days without activity to consider inactive */
  inactivityThresholdDays?: number;
};
