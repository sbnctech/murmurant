/**
 * KPI Data Access Layer
 *
 * Stub implementations for KPI evaluators.
 * All functions return placeholder values with TODO markers.
 *
 * CONSTRAINTS:
 * - No schema edits
 * - No writes
 * - No committee/member names; signals only
 */

import type {
  OpsHealthStats,
  MemberEngagementByTierStats,
  NewbieActivationStats,
  CommitteeCadenceStats,
  FinancialCoverageStats,
  DateRangeParams,
  NewbieActivationParams,
  CommitteeCadenceParams,
} from "./types";

/**
 * Get operational health statistics for the club.
 *
 * @param params - Date range for the reporting period
 * @returns Operational health metrics
 *
 * TODO: Implement with actual Prisma queries:
 * - Count events created in date range
 * - Count events with registrations
 * - Calculate average fill rate
 * - Count waitlisted registrations
 */
export async function getOpsHealthStats(
  params: DateRangeParams
): Promise<OpsHealthStats> {
  // TODO: Replace stub with actual Prisma queries
  void params; // Suppress unused parameter warning

  return {
    eventsCreated: 0,
    eventsWithRegistrations: 0,
    totalRegistrations: 0,
    averageFillRate: 0,
    waitlistedCount: 0,
    asOf: new Date().toISOString(),
  };
}

/**
 * Get member engagement statistics broken down by membership tier.
 *
 * @param params - Date range for the reporting period
 * @returns Engagement metrics per tier
 *
 * TODO: Implement with actual Prisma queries:
 * - Group members by tier
 * - Count registrations per tier
 * - Calculate participation rates
 */
export async function getMemberEngagementByTier(
  params: DateRangeParams
): Promise<MemberEngagementByTierStats> {
  // TODO: Replace stub with actual Prisma queries
  void params; // Suppress unused parameter warning

  return {
    tiers: [],
    asOf: new Date().toISOString(),
  };
}

/**
 * Get activation statistics for new members.
 *
 * @param params - Date range and newbie threshold configuration
 * @returns Newbie activation metrics
 *
 * TODO: Implement with actual Prisma queries:
 * - Find members joined within threshold
 * - Count those with registrations
 * - Calculate avg days to first registration
 */
export async function getNewbieActivationStats(
  params: NewbieActivationParams
): Promise<NewbieActivationStats> {
  // TODO: Replace stub with actual Prisma queries
  void params; // Suppress unused parameter warning

  return {
    newMemberCount: 0,
    activatedCount: 0,
    activationRate: 0,
    avgDaysToFirstRegistration: null,
    dormantCount: 0,
    asOf: new Date().toISOString(),
  };
}

/**
 * Get committee meeting/activity cadence statistics.
 *
 * NOTE: Returns signals only, no committee names.
 *
 * @param params - Date range and inactivity threshold configuration
 * @returns Committee cadence metrics
 *
 * TODO: Implement with actual Prisma queries:
 * - Count committees by activity status
 * - Calculate meetings per committee
 * - Determine cadence compliance
 */
export async function getCommitteeCadenceStats(
  params: CommitteeCadenceParams
): Promise<CommitteeCadenceStats> {
  // TODO: Replace stub with actual Prisma queries
  void params; // Suppress unused parameter warning

  return {
    totalCommittees: 0,
    activeCommittees: 0,
    inactiveCommittees: 0,
    avgMeetingsPerCommittee: 0,
    cadenceComplianceRate: 0,
    asOf: new Date().toISOString(),
  };
}

/**
 * Get financial coverage statistics.
 *
 * NOTE: Returns ratios and percentages only, no dollar amounts.
 *
 * @param params - Date range for the reporting period
 * @returns Financial coverage metrics
 *
 * TODO: Implement with actual Prisma queries:
 * - Calculate budget coverage ratio
 * - Categorize budget line items
 * - Determine utilization rate
 */
export async function getFinancialCoverageStats(
  params: DateRangeParams
): Promise<FinancialCoverageStats> {
  // TODO: Replace stub with actual Prisma queries
  void params; // Suppress unused parameter warning

  return {
    budgetCoverageRatio: 0,
    categoriesOnTrack: 0,
    categoriesOverBudget: 0,
    categoriesUnderSpent: 0,
    utilizationRate: 0,
    asOf: new Date().toISOString(),
  };
}
