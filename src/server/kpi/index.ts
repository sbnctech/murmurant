/**
 * KPI Data Access Module
 *
 * Data-access stubs for KPI evaluators.
 */

// Types
export type {
  OpsHealthStats,
  MemberEngagementByTierStats,
  NewbieActivationStats,
  CommitteeCadenceStats,
  FinancialCoverageStats,
  DateRangeParams,
  NewbieActivationParams,
  CommitteeCadenceParams,
} from "./types";

// Data Access Functions
export {
  getOpsHealthStats,
  getMemberEngagementByTier,
  getNewbieActivationStats,
  getCommitteeCadenceStats,
  getFinancialCoverageStats,
} from "./data-access";
