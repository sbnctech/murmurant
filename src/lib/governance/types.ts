/**
 * Governance Types
 *
 * Local type definitions for governance domain to avoid
 * modifying Prisma schema until feature is production-ready.
 *
 * Charter P9: Fail closed - using explicit string unions
 * instead of open string types.
 */

// Board record lifecycle status
export type BoardRecordStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "IN_REVIEW"
  | "PUBLISHED"
  | "ARCHIVED";

// Meeting types for governance
export type MeetingType =
  | "BOARD"
  | "EXECUTIVE"
  | "SPECIAL"
  | "ANNUAL";

// Governance flag types for review workflows
export type GovernanceFlagType =
  | "RULES_QUESTION"
  | "BYLAWS_CHECK"
  | "INSURANCE_REVIEW"
  | "LEGAL_REVIEW"
  | "OTHER";

// Governance flag lifecycle status
export type GovernanceFlagStatus =
  | "OPEN"
  | "IN_REVIEW"
  | "RESOLVED"
  | "DISMISSED";

// Annotation severity levels
export type AnnotationSeverity =
  | "INFO"
  | "SUGGESTION"
  | "WARNING"
  | "ERROR";

// Minutes document status
export type MinutesStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "IN_REVIEW"
  | "APPROVED"
  | "PUBLISHED"
  | "ARCHIVED";
