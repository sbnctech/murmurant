/**
 * Event Postmortem Utilities
 *
 * Provides server-side derivation of postmortem completion status.
 * Status is computed from postmortem record fields, not stored separately.
 *
 * Charter: P3 (explicit derived state), P7 (audit trail via postmortem records)
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { EventPostmortem, PostmortemStatus } from "@prisma/client";

/**
 * Derived completion status for postmortems.
 * This is computed from the postmortem record, not stored in DB.
 */
export type PostmortemCompletionStatus =
  | "NOT_STARTED"   // No postmortem record exists
  | "IN_PROGRESS"   // Record exists but required fields missing
  | "COMPLETE";     // All required fields present

/**
 * Required fields for a postmortem to be considered COMPLETE.
 *
 * Conservative minimal set (documented in docs/events/EVENT_POSTMORTEM.md):
 * - At least one retrospective field (whatWorked, whatDidNot, OR whatToChangeNextTime)
 * - At least one rating (attendanceRating, logisticsRating, OR satisfactionRating)
 *
 * This ensures we capture:
 * 1. Qualitative feedback for future chairs
 * 2. Quantitative assessment for trend analysis
 */
export interface PostmortemCompletionCriteria {
  /** Has at least one retrospective note field filled */
  hasRetrospectiveNotes: boolean;
  /** Has at least one rating field filled */
  hasRating: boolean;
  /** All required criteria met */
  isComplete: boolean;
}

/**
 * Check if a postmortem meets completion criteria.
 *
 * @param postmortem - The postmortem record (or null if none exists)
 * @returns Completion criteria breakdown
 */
export function checkPostmortemCompletion(
  postmortem: Pick<
    EventPostmortem,
    | "whatWorked"
    | "whatDidNot"
    | "whatToChangeNextTime"
    | "attendanceRating"
    | "logisticsRating"
    | "satisfactionRating"
  > | null
): PostmortemCompletionCriteria {
  if (!postmortem) {
    return {
      hasRetrospectiveNotes: false,
      hasRating: false,
      isComplete: false,
    };
  }

  // Check retrospective notes - at least one must be non-empty
  const hasRetrospectiveNotes = Boolean(
    (postmortem.whatWorked && postmortem.whatWorked.trim()) ||
    (postmortem.whatDidNot && postmortem.whatDidNot.trim()) ||
    (postmortem.whatToChangeNextTime && postmortem.whatToChangeNextTime.trim())
  );

  // Check ratings - at least one must be present
  const hasRating = Boolean(
    postmortem.attendanceRating !== null ||
    postmortem.logisticsRating !== null ||
    postmortem.satisfactionRating !== null
  );

  return {
    hasRetrospectiveNotes,
    hasRating,
    isComplete: hasRetrospectiveNotes && hasRating,
  };
}

/**
 * Derive postmortem completion status from a postmortem record.
 *
 * @param postmortem - The postmortem record (or null/undefined if none exists)
 * @returns The derived completion status
 */
export function derivePostmortemStatus(
  postmortem: Pick<
    EventPostmortem,
    | "whatWorked"
    | "whatDidNot"
    | "whatToChangeNextTime"
    | "attendanceRating"
    | "logisticsRating"
    | "satisfactionRating"
  > | null | undefined
): PostmortemCompletionStatus {
  if (!postmortem) {
    return "NOT_STARTED";
  }

  const criteria = checkPostmortemCompletion(postmortem);

  if (criteria.isComplete) {
    return "COMPLETE";
  }

  return "IN_PROGRESS";
}

/**
 * Get a human-readable label for postmortem completion status.
 */
export function getPostmortemStatusLabel(status: PostmortemCompletionStatus): string {
  switch (status) {
    case "NOT_STARTED":
      return "Not started";
    case "IN_PROGRESS":
      return "In progress";
    case "COMPLETE":
      return "Complete";
  }
}

/**
 * Get the CTA (call-to-action) text for a postmortem based on status.
 */
export function getPostmortemCTAText(status: PostmortemCompletionStatus): string {
  switch (status) {
    case "NOT_STARTED":
      return "Start post-mortem";
    case "IN_PROGRESS":
      return "Complete post-mortem";
    case "COMPLETE":
      return "View post-mortem";
  }
}

/**
 * Fields to include when querying postmortem for status derivation.
 * Use this in Prisma select to minimize data transfer.
 */
export const POSTMORTEM_STATUS_FIELDS = {
  whatWorked: true,
  whatDidNot: true,
  whatToChangeNextTime: true,
  attendanceRating: true,
  logisticsRating: true,
  satisfactionRating: true,
} as const;

/**
 * Full postmortem fields for display (includes status fields plus metadata).
 */
export const POSTMORTEM_DISPLAY_FIELDS = {
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  ...POSTMORTEM_STATUS_FIELDS,
} as const;
