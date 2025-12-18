/**
 * Governance Types
 *
 * Re-exports Prisma enums and provides additional type definitions
 * for the governance domain.
 *
 * Charter P9: Fail closed - using explicit string unions
 * instead of open string types.
 */

// Re-export Prisma enums for convenience
export {
  GovernanceMeetingType,
  MinutesStatus,
  MotionResult,
  ReviewFlagType,
  ReviewFlagStatus,
} from "@prisma/client";

// Board record lifecycle status (legacy - use MinutesStatus)
export type BoardRecordStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "IN_REVIEW"
  | "PUBLISHED"
  | "ARCHIVED";

// Meeting types for governance (legacy - use GovernanceMeetingType)
export type MeetingType =
  | "BOARD"
  | "EXECUTIVE"
  | "SPECIAL"
  | "ANNUAL";

// Governance flag types for review workflows (legacy - use ReviewFlagType)
export type GovernanceFlagType =
  | "RULES_QUESTION"
  | "BYLAWS_CHECK"
  | "INSURANCE_REVIEW"
  | "LEGAL_REVIEW"
  | "OTHER";

// Governance flag lifecycle status (legacy - use ReviewFlagStatus)
export type GovernanceFlagStatus =
  | "OPEN"
  | "IN_REVIEW"
  | "RESOLVED"
  | "DISMISSED";

// Annotation severity levels (for future use)
export type AnnotationSeverity =
  | "INFO"
  | "SUGGESTION"
  | "WARNING"
  | "ERROR";

// Target types for annotations
export type AnnotationTargetType = "motion" | "bylaw" | "policy" | "page" | "file" | "minutes";

// Target types for review flags
export type FlagTargetType = "page" | "file" | "policy" | "event" | "bylaw" | "minutes" | "motion";
