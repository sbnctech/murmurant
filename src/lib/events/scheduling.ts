/**
 * Event Scheduling Helpers
 *
 * Implements the SBNC publication and registration schedule policy:
 * - For events requiring registration:
 *   - Announce in eNews on Sunday (visible to members, registration locked)
 *   - Open registration the following Tuesday at 8:00 AM Pacific
 * - For events NOT requiring registration:
 *   - Post immediately (visible immediately)
 *
 * Timezone: All scheduling uses America/Los_Angeles (Pacific Time).
 *
 * Charter Compliance:
 * - P3: Explicit state derivation (visible vs open)
 * - P5: Policy-based defaults with override capability
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { EventStatus } from "@prisma/client";

// ============================================================================
// CONSTANTS
// ============================================================================

/** SBNC operates in Pacific Time */
export const SBNC_TIMEZONE = "America/Los_Angeles";

/** Default time for registration to open (8:00 AM Pacific) */
export const DEFAULT_REGISTRATION_OPEN_HOUR = 8;

/** Days after event end before it's considered archived */
export const ARCHIVE_DAYS_AFTER_END = 30;

// ============================================================================
// TYPES
// ============================================================================

/**
 * Visibility state determines if members/public can see the event.
 * - DRAFT: Not visible (still being edited or pending approval)
 * - SCHEDULED: Approved but publishAt is in the future
 * - VISIBLE: Published and visible to members/public
 */
export type EventVisibilityState = "DRAFT" | "SCHEDULED" | "VISIBLE";

/**
 * Registration state determines if members can register for the event.
 * - NOT_REQUIRED: Event doesn't require registration (no tickets/capacity)
 * - SCHEDULED: Registration will open in the future
 * - OPEN: Registration is currently open
 * - CLOSED: Registration has closed (deadline passed or event started)
 */
export type EventRegistrationState = "NOT_REQUIRED" | "SCHEDULED" | "OPEN" | "CLOSED";

/**
 * Operational status is a comprehensive derived status for admin/display.
 */
export type EventOperationalStatus =
  | "DRAFT"                    // Being edited, not submitted
  | "PENDING_APPROVAL"         // Submitted, awaiting VP Activities
  | "CHANGES_REQUESTED"        // VP returned for revisions
  | "APPROVED_SCHEDULED"       // Approved, publishAt in future
  | "ANNOUNCED_NOT_OPEN"       // Published, but registration not yet open
  | "OPEN_FOR_REGISTRATION"    // Published and registration open
  | "REGISTRATION_CLOSED"      // Registration closed but event not started
  | "IN_PROGRESS"              // Event is currently happening
  | "COMPLETED"                // Event has ended
  | "CANCELED"                 // Event was canceled
  | "ARCHIVED";                // Past archive threshold

/**
 * Input for computing default schedule.
 */
export interface ScheduleDefaultsInput {
  requiresRegistration: boolean;
  /** Override: specific Sunday to use for eNews (optional) */
  enewsSundayDate?: Date;
  /** Current time (optional, defaults to now) */
  now?: Date;
}

/**
 * Output from computing default schedule.
 */
export interface ScheduleDefaults {
  publishAt: Date;
  registrationOpensAt: Date | null;
  explanation: string;
}

/**
 * Minimal event shape for status derivation.
 */
export interface EventForStatus {
  status: EventStatus;
  requiresRegistration?: boolean;
  publishAt?: Date | null;
  publishedAt?: Date | null;
  registrationOpensAt?: Date | null;
  registrationDeadline?: Date | null;
  startTime: Date;
  endTime?: Date | null;
  approvedAt?: Date | null;
}

// ============================================================================
// DATE UTILITIES
// ============================================================================

/**
 * Get the next Sunday at midnight Pacific time.
 * If today is Sunday, returns today.
 */
export function getNextSunday(fromDate: Date = new Date()): Date {
  // Get day of week in Pacific timezone
  const dayOfWeekPart = new Intl.DateTimeFormat("en-US", {
    timeZone: SBNC_TIMEZONE,
    weekday: "short",
  }).formatToParts(fromDate).find(p => p.type === "weekday");
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayOfWeek = dayNames.indexOf(dayOfWeekPart?.value ?? "Mon");

  // Days until next Sunday (0 if today is Sunday)
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;

  // Create date at midnight Pacific by calculating offset
  const nextSunday = new Date(fromDate);
  nextSunday.setDate(nextSunday.getDate() + daysUntilSunday);
  nextSunday.setHours(0, 0, 0, 0);

  // Adjust for Pacific timezone
  const utcDate = new Date(nextSunday.getTime() + nextSunday.getTimezoneOffset() * 60000);
  const offsetMs = getTimezoneOffsetMs(utcDate);
  const pacificMidnight = new Date(utcDate.getTime() + offsetMs);

  // If today is Sunday but it's past midnight Pacific, use next Sunday
  if (daysUntilSunday === 0 && fromDate.getTime() > pacificMidnight.getTime()) {
    pacificMidnight.setDate(pacificMidnight.getDate() + 7);
  }

  return pacificMidnight;
}

/**
 * Helper to get timezone offset in milliseconds for Pacific time.
 */
function getTimezoneOffsetMs(date: Date): number {
  const tzPart = new Intl.DateTimeFormat("en-US", {
    timeZone: SBNC_TIMEZONE,
    timeZoneName: "shortOffset",
  }).formatToParts(date).find(p => p.type === "timeZoneName");
  const offsetStr = tzPart?.value ?? "GMT-8";
  const match = offsetStr.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?$/);
  if (!match) return -8 * 60 * 60 * 1000; // Default to PST
  const sign = match[1] === "-" ? -1 : 1;
  const hours = parseInt(match[2], 10);
  const mins = parseInt(match[3] ?? "0", 10);
  return sign * (hours * 60 + mins) * 60 * 1000;
}

/**
 * Get the Tuesday following a given Sunday at 8:00 AM Pacific.
 */
export function getFollowingTuesday(sunday: Date): Date {
  const tuesday = new Date(sunday);
  tuesday.setDate(sunday.getDate() + 2); // Sunday + 2 = Tuesday
  tuesday.setHours(DEFAULT_REGISTRATION_OPEN_HOUR, 0, 0, 0);
  return tuesday;
}

/**
 * Get Sunday of the current week (for display purposes).
 */
export function getThisWeekSunday(fromDate: Date = new Date()): Date {
  // Get day of week in Pacific timezone
  const dayOfWeekPart = new Intl.DateTimeFormat("en-US", {
    timeZone: SBNC_TIMEZONE,
    weekday: "short",
  }).formatToParts(fromDate).find(p => p.type === "weekday");
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayOfWeek = dayNames.indexOf(dayOfWeekPart?.value ?? "Sun");

  const thisSunday = new Date(fromDate);
  thisSunday.setDate(thisSunday.getDate() - dayOfWeek);
  thisSunday.setHours(0, 0, 0, 0);

  // Adjust for Pacific timezone
  const utcDate = new Date(thisSunday.getTime() + thisSunday.getTimezoneOffset() * 60000);
  const offsetMs = getTimezoneOffsetMs(utcDate);

  return new Date(utcDate.getTime() + offsetMs);
}

/**
 * Get the end of the week (Saturday 11:59:59 PM Pacific).
 */
export function getEndOfWeek(sunday: Date): Date {
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  saturday.setHours(23, 59, 59, 999);
  return saturday;
}

// ============================================================================
// SCHEDULE COMPUTATION
// ============================================================================

/**
 * Compute default schedule based on SBNC policy.
 *
 * For events requiring registration:
 * - publishAt = next Sunday (for eNews announcement)
 * - registrationOpensAt = following Tuesday at 8:00 AM Pacific
 *
 * For events NOT requiring registration:
 * - publishAt = now (immediate publication)
 * - registrationOpensAt = null
 */
export function computeDefaultSchedule(input: ScheduleDefaultsInput): ScheduleDefaults {
  const now = input.now ?? new Date();

  if (!input.requiresRegistration) {
    return {
      publishAt: now,
      registrationOpensAt: null,
      explanation: "Event does not require registration. Publishing immediately.",
    };
  }

  // Use provided Sunday or calculate next one
  const announceSunday = input.enewsSundayDate ?? getNextSunday(now);
  const openTuesday = getFollowingTuesday(announceSunday);

  // Format dates for explanation using Intl.DateTimeFormat
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: SBNC_TIMEZONE,
  });
  const sundayStr = dateFormatter.format(announceSunday);
  const tuesdayStr = dateFormatter.format(openTuesday);

  return {
    publishAt: announceSunday,
    registrationOpensAt: openTuesday,
    explanation: `SBNC policy: Announce in eNews on ${sundayStr}, registration opens ${tuesdayStr} at 8:00 AM Pacific.`,
  };
}

// ============================================================================
// STATUS DERIVATION
// ============================================================================

/**
 * Get event visibility state (can members/public see it?).
 *
 * Rules:
 * - If not APPROVED/PUBLISHED status → DRAFT (not visible)
 * - If APPROVED but publishAt is in future → SCHEDULED
 * - If PUBLISHED or (APPROVED and publishAt <= now) → VISIBLE
 */
export function getEventVisibilityState(event: EventForStatus, now: Date = new Date()): EventVisibilityState {
  // Non-approved events are never visible
  if (event.status === "DRAFT" ||
      event.status === "PENDING_APPROVAL" ||
      event.status === "CHANGES_REQUESTED" ||
      event.status === "CANCELED") {
    return "DRAFT";
  }

  // Already published = visible
  if (event.status === "PUBLISHED" || event.status === "COMPLETED") {
    return "VISIBLE";
  }

  // APPROVED status: check publishAt
  if (event.status === "APPROVED") {
    if (event.publishAt && now < event.publishAt) {
      return "SCHEDULED";
    }
    // No publishAt or past publishAt but not yet PUBLISHED status
    // This shouldn't normally happen, but treat as visible
    return "VISIBLE";
  }

  return "DRAFT";
}

/**
 * Get event registration state (can members register?).
 *
 * Rules:
 * - If requiresRegistration is false → NOT_REQUIRED
 * - If registrationOpensAt is in future → SCHEDULED
 * - If registrationDeadline passed or event started → CLOSED
 * - Otherwise → OPEN
 */
export function getEventRegistrationState(event: EventForStatus, now: Date = new Date()): EventRegistrationState {
  // Check if registration is required at all
  if (event.requiresRegistration === false) {
    return "NOT_REQUIRED";
  }

  // Check if registration hasn't opened yet
  if (event.registrationOpensAt && now < event.registrationOpensAt) {
    return "SCHEDULED";
  }

  // Check if registration has closed
  const deadline = event.registrationDeadline ?? event.startTime;
  if (now >= deadline) {
    return "CLOSED";
  }

  return "OPEN";
}

/**
 * Get comprehensive operational status for admin display.
 */
export function getEventOperationalStatus(event: EventForStatus, now: Date = new Date()): EventOperationalStatus {
  // Canceled takes precedence
  if (event.status === "CANCELED") {
    return "CANCELED";
  }

  // Check approval workflow states first
  if (event.status === "DRAFT") {
    return "DRAFT";
  }

  if (event.status === "PENDING_APPROVAL") {
    return "PENDING_APPROVAL";
  }

  if (event.status === "CHANGES_REQUESTED") {
    return "CHANGES_REQUESTED";
  }

  // Event is approved or published - derive from dates
  const effectiveEnd = event.endTime ?? new Date(event.startTime.getTime() + 2 * 60 * 60 * 1000);

  // Check if archived (past threshold)
  const archiveThreshold = new Date(effectiveEnd);
  archiveThreshold.setDate(archiveThreshold.getDate() + ARCHIVE_DAYS_AFTER_END);
  if (now > archiveThreshold) {
    return "ARCHIVED";
  }

  // Check if completed
  if (now > effectiveEnd) {
    return "COMPLETED";
  }

  // Check if in progress
  if (now >= event.startTime && now <= effectiveEnd) {
    return "IN_PROGRESS";
  }

  // Event hasn't started yet - check visibility and registration
  const visibility = getEventVisibilityState(event, now);

  if (visibility === "SCHEDULED") {
    return "APPROVED_SCHEDULED";
  }

  // Visible - check registration state
  if (event.requiresRegistration !== false) {
    const regState = getEventRegistrationState(event, now);

    if (regState === "SCHEDULED") {
      return "ANNOUNCED_NOT_OPEN";
    }

    if (regState === "CLOSED") {
      return "REGISTRATION_CLOSED";
    }

    return "OPEN_FOR_REGISTRATION";
  }

  // No registration required - if visible, effectively "open"
  return "OPEN_FOR_REGISTRATION";
}

/**
 * Get human-readable label for operational status.
 */
export function getOperationalStatusLabel(status: EventOperationalStatus): string {
  const labels: Record<EventOperationalStatus, string> = {
    DRAFT: "Draft",
    PENDING_APPROVAL: "Pending Approval",
    CHANGES_REQUESTED: "Changes Requested",
    APPROVED_SCHEDULED: "Approved - Scheduled",
    ANNOUNCED_NOT_OPEN: "Announced - Registration Opens Soon",
    OPEN_FOR_REGISTRATION: "Open for Registration",
    REGISTRATION_CLOSED: "Registration Closed",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    CANCELED: "Canceled",
    ARCHIVED: "Archived",
  };
  return labels[status];
}

/**
 * Get status color for UI display.
 */
export function getOperationalStatusColor(status: EventOperationalStatus): string {
  const colors: Record<EventOperationalStatus, string> = {
    DRAFT: "#6b7280",           // gray
    PENDING_APPROVAL: "#f59e0b", // amber
    CHANGES_REQUESTED: "#ef4444", // red
    APPROVED_SCHEDULED: "#3b82f6", // blue
    ANNOUNCED_NOT_OPEN: "#8b5cf6", // purple
    OPEN_FOR_REGISTRATION: "#22c55e", // green
    REGISTRATION_CLOSED: "#6b7280", // gray
    IN_PROGRESS: "#22c55e",     // green
    COMPLETED: "#6b7280",       // gray
    CANCELED: "#ef4444",        // red
    ARCHIVED: "#9ca3af",        // light gray
  };
  return colors[status];
}

// ============================================================================
// ENEWS WEEK HELPERS
// ============================================================================

/**
 * Get events announcing this week (publishAt in date range).
 * Used by VP Communications dashboard.
 */
export function getEnewsWeekRange(baseDate: Date = new Date()): { start: Date; end: Date } {
  const sunday = getThisWeekSunday(baseDate);
  const saturday = getEndOfWeek(sunday);
  return { start: sunday, end: saturday };
}

/**
 * Check if an event is announcing this week.
 */
export function isAnnouncingThisWeek(event: EventForStatus, now: Date = new Date()): boolean {
  if (event.status !== "APPROVED" && event.status !== "PUBLISHED") {
    return false;
  }

  const { start, end } = getEnewsWeekRange(now);
  const publishAt = event.publishAt ?? event.publishedAt;

  if (!publishAt) return false;

  return publishAt >= start && publishAt <= end;
}

/**
 * Check if an event's registration opens this week.
 */
export function isRegistrationOpeningThisWeek(event: EventForStatus, now: Date = new Date()): boolean {
  if (event.status !== "APPROVED" && event.status !== "PUBLISHED") {
    return false;
  }

  if (!event.requiresRegistration || !event.registrationOpensAt) {
    return false;
  }

  const { start, end } = getEnewsWeekRange(now);
  return event.registrationOpensAt >= start && event.registrationOpensAt <= end;
}

/**
 * Format a registration opens message for display.
 */
export function formatRegistrationOpensMessage(event: EventForStatus): string | null {
  if (!event.requiresRegistration || !event.registrationOpensAt) {
    return null;
  }

  const dayFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: SBNC_TIMEZONE,
  });
  const dayName = dayFormatter.format(event.registrationOpensAt);

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    timeZone: SBNC_TIMEZONE,
  });
  const dateStr = dateFormatter.format(event.registrationOpensAt);

  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: SBNC_TIMEZONE,
  });
  const timeStr = timeFormatter.format(event.registrationOpensAt);

  return `Registration opens ${dayName}, ${dateStr} at ${timeStr}`;
}
