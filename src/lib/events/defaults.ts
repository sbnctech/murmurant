/**
 * Event Defaults and Derivations
 *
 * Smart defaults to reduce admin burden when creating/editing events.
 * See docs/events/EVENT_FIELD_INTELLIGENCE.md for full documentation.
 *
 * All functions are pure and deterministic - given the same inputs,
 * they always produce the same outputs.
 *
 * Copyright © 2025 Murmurant, Inc.
 */

/** Default event duration in milliseconds (2 hours) */
const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000;

// ============================================================================
// Time-Based Derivations
// ============================================================================

/**
 * Derive endTime if not explicitly provided.
 * Default: startTime + 2 hours
 */
export function deriveEndTime(
  startTime: Date,
  endTime: Date | null | undefined
): Date {
  if (endTime) {
    return endTime;
  }
  return new Date(startTime.getTime() + DEFAULT_DURATION_MS);
}

/**
 * Determine if an event is in the past.
 * Uses provided reference date for deterministic testing.
 */
export function isPastEvent(startTime: Date, now: Date = new Date()): boolean {
  return startTime < now;
}

/**
 * Determine if an event is happening today.
 * Compares date portions only (ignores time).
 */
export function isToday(startTime: Date, now: Date = new Date()): boolean {
  return (
    startTime.getFullYear() === now.getFullYear() &&
    startTime.getMonth() === now.getMonth() &&
    startTime.getDate() === now.getDate()
  );
}

/**
 * Determine if an event is happening tomorrow.
 */
export function isTomorrow(startTime: Date, now: Date = new Date()): boolean {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    startTime.getFullYear() === tomorrow.getFullYear() &&
    startTime.getMonth() === tomorrow.getMonth() &&
    startTime.getDate() === tomorrow.getDate()
  );
}

/**
 * Get days until event (negative if past).
 */
export function daysUntil(startTime: Date, now: Date = new Date()): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor((startOfDay(startTime).getTime() - startOfDay(now).getTime()) / msPerDay);
}

// ============================================================================
// Availability Derivations
// ============================================================================

/**
 * Compute derived event availability fields.
 * These are calculated from stored data, not stored themselves.
 */
export function computeAvailability(
  capacity: number | null,
  registeredCount: number
): {
  spotsRemaining: number | null;
  isFull: boolean;
  isWaitlistOpen: boolean;
} {
  if (capacity === null) {
    return {
      spotsRemaining: null,
      isFull: false,
      isWaitlistOpen: false,
    };
  }

  const spotsRemaining = Math.max(0, capacity - registeredCount);
  const isFull = spotsRemaining === 0;

  return {
    spotsRemaining,
    isFull,
    isWaitlistOpen: isFull, // Waitlist opens when full
  };
}

/**
 * Get human-readable spots remaining text.
 */
export function spotsRemainingLabel(
  capacity: number | null,
  registeredCount: number
): string {
  if (capacity === null) {
    return "Open registration";
  }

  const { spotsRemaining, isFull, isWaitlistOpen } = computeAvailability(capacity, registeredCount);

  if (isFull) {
    return isWaitlistOpen ? "Full - Waitlist open" : "Full";
  }

  if (spotsRemaining === 1) {
    return "1 spot remaining";
  }

  return `${spotsRemaining} spots remaining`;
}

// ============================================================================
// Status Labels
// ============================================================================

export type EventStatus = "draft" | "upcoming" | "ongoing" | "past";

/**
 * Compute event lifecycle status.
 * Status is derived, not stored.
 */
export function computeStatus(
  isPublished: boolean,
  startTime: Date,
  endTime: Date | null,
  now: Date = new Date()
): EventStatus {
  if (isPastEvent(endTime ?? startTime, now)) {
    return "past";
  }

  if (!isPublished) {
    return "draft";
  }

  if (startTime <= now) {
    return "ongoing";
  }

  return "upcoming";
}

/**
 * Get human-readable status label.
 */
export function statusLabel(status: EventStatus): string {
  const labels: Record<EventStatus, string> = {
    draft: "Draft",
    upcoming: "Upcoming",
    ongoing: "In Progress",
    past: "Past",
  };
  return labels[status];
}

// ============================================================================
// Urgency Labels (for UI indicators)
// ============================================================================

export type UrgencyLevel = "none" | "low" | "medium" | "high" | "urgent";

/**
 * Compute urgency level for an event.
 * Used for visual indicators in the UI.
 */
export function computeUrgency(
  startTime: Date,
  capacity: number | null,
  registeredCount: number,
  now: Date = new Date()
): UrgencyLevel {
  const days = daysUntil(startTime, now);

  // Past events have no urgency
  if (days < 0) {
    return "none";
  }

  // Check capacity urgency
  if (capacity !== null) {
    const { spotsRemaining } = computeAvailability(capacity, registeredCount);
    if (spotsRemaining !== null) {
      // Last few spots
      if (spotsRemaining <= 2 && spotsRemaining > 0) {
        return "urgent";
      }
      if (spotsRemaining <= 5) {
        return "high";
      }
    }
  }

  // Check time urgency
  if (days === 0) {
    return "urgent"; // Today
  }
  if (days === 1) {
    return "high"; // Tomorrow
  }
  if (days <= 3) {
    return "medium";
  }
  if (days <= 7) {
    return "low";
  }

  return "none";
}

/**
 * Get human-readable urgency label.
 */
export function urgencyLabel(
  startTime: Date,
  capacity: number | null,
  registeredCount: number,
  now: Date = new Date()
): string {
  const days = daysUntil(startTime, now);

  if (days < 0) {
    return "Past";
  }

  // Time-based labels
  if (days === 0) {
    return "Today";
  }
  if (days === 1) {
    return "Tomorrow";
  }

  // Capacity-based labels
  if (capacity !== null) {
    const { spotsRemaining, isFull, isWaitlistOpen } = computeAvailability(capacity, registeredCount);
    if (isFull) {
      return isWaitlistOpen ? "Waitlist" : "Full";
    }
    if (spotsRemaining !== null && spotsRemaining <= 3) {
      return `${spotsRemaining} left`;
    }
  }

  if (days <= 7) {
    return `In ${days} days`;
  }

  return "";
}

// ============================================================================
// Category Inference
// ============================================================================

/**
 * Infer category from title patterns (optional enhancement).
 * Returns null if no pattern matches - human should specify.
 */
export function inferCategory(title: string): string | null {
  const titleLower = title.toLowerCase();

  const patterns: [RegExp, string][] = [
    [/luncheon|lunch/i, "Luncheon"],
    [/book\s*club|book\s*group/i, "Book Club"],
    [/wine|wine\s*tasting/i, "Wine"],
    [/hike|hiking|walk/i, "Outdoor"],
    [/golf/i, "Golf"],
    [/bridge/i, "Bridge"],
    [/orientation|new\s*member/i, "Orientation"],
    [/board\s*meeting/i, "Board"],
  ];

  for (const [pattern, category] of patterns) {
    if (pattern.test(titleLower)) {
      return category;
    }
  }

  return null;
}

// ============================================================================
// Validation Helpers
// ============================================================================

export interface EventValidationError {
  field: string;
  message: string;
}

/**
 * Validate event fields before save.
 * Returns array of validation errors (empty if valid).
 */
export function validateEventFields(fields: {
  title?: string;
  startTime?: Date;
  endTime?: Date | null;
  capacity?: number | null;
}): EventValidationError[] {
  const errors: EventValidationError[] = [];

  // Title required
  if (!fields.title || fields.title.trim() === "") {
    errors.push({ field: "title", message: "Title is required" });
  }

  // Start time required
  if (!fields.startTime) {
    errors.push({ field: "startTime", message: "Start time is required" });
  }

  // End time must be after start time
  if (fields.startTime && fields.endTime && fields.endTime < fields.startTime) {
    errors.push({ field: "endTime", message: "End time must be after start time" });
  }

  // Capacity must be non-negative
  if (fields.capacity !== undefined && fields.capacity !== null && fields.capacity < 0) {
    errors.push({ field: "capacity", message: "Capacity must be 0 or greater" });
  }

  return errors;
}

// ============================================================================
// Preview Helpers (for admin UI)
// ============================================================================

/**
 * Generate a preview of all derived fields for admin UI.
 * Helps admins see what members will see before saving.
 */
export function generateDerivedPreview(fields: {
  title: string;
  startTime: Date;
  endTime?: Date | null;
  capacity?: number | null;
  isPublished?: boolean;
  registeredCount?: number;
  now?: Date;
}): {
  status: EventStatus;
  statusLabel: string;
  effectiveEndTime: Date;
  spotsLabel: string;
  urgency: UrgencyLevel;
  urgencyLabel: string;
  inferredCategory: string | null;
  isToday: boolean;
  isTomorrow: boolean;
  daysUntil: number;
} {
  const now = fields.now ?? new Date();
  const registeredCount = fields.registeredCount ?? 0;
  const effectiveEndTime = deriveEndTime(fields.startTime, fields.endTime);
  const status = computeStatus(
    fields.isPublished ?? false,
    fields.startTime,
    effectiveEndTime,
    now
  );

  return {
    status,
    statusLabel: statusLabel(status),
    effectiveEndTime,
    spotsLabel: spotsRemainingLabel(fields.capacity ?? null, registeredCount),
    urgency: computeUrgency(fields.startTime, fields.capacity ?? null, registeredCount, now),
    urgencyLabel: urgencyLabel(fields.startTime, fields.capacity ?? null, registeredCount, now),
    inferredCategory: inferCategory(fields.title),
    isToday: isToday(fields.startTime, now),
    isTomorrow: isTomorrow(fields.startTime, now),
    daysUntil: daysUntil(fields.startTime, now),
  };
}
