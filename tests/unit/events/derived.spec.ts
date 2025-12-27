/**
 * Unit Tests: Event Derived Calculations
 *
 * Tests for the pure functions in src/lib/events/defaults.ts
 * All functions accept an optional `now` parameter for deterministic testing.
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { describe, expect, test } from "vitest";
import {
  deriveEndTime,
  isPastEvent,
  isToday,
  isTomorrow,
  daysUntil,
  computeAvailability,
  spotsRemainingLabel,
  computeStatus,
  statusLabel,
  computeUrgency,
  urgencyLabel,
  inferCategory,
  validateEventFields,
  generateDerivedPreview,
} from "@/lib/events";

// ============================================================================
// Time-Based Derivations
// ============================================================================

describe("deriveEndTime", () => {
  test("returns provided endTime when set", () => {
    const start = new Date("2025-01-15T10:00:00Z");
    const end = new Date("2025-01-15T14:00:00Z");
    expect(deriveEndTime(start, end)).toEqual(end);
  });

  test("returns startTime + 2 hours when endTime is null", () => {
    const start = new Date("2025-01-15T10:00:00Z");
    const result = deriveEndTime(start, null);
    expect(result.getTime()).toBe(start.getTime() + 2 * 60 * 60 * 1000);
  });

  test("returns startTime + 2 hours when endTime is undefined", () => {
    const start = new Date("2025-01-15T10:00:00Z");
    const result = deriveEndTime(start, undefined);
    expect(result.getTime()).toBe(start.getTime() + 2 * 60 * 60 * 1000);
  });
});

describe("isPastEvent", () => {
  const now = new Date("2025-01-15T12:00:00Z");

  test("returns true when startTime is before now", () => {
    const past = new Date("2025-01-15T10:00:00Z");
    expect(isPastEvent(past, now)).toBe(true);
  });

  test("returns false when startTime is after now", () => {
    const future = new Date("2025-01-15T14:00:00Z");
    expect(isPastEvent(future, now)).toBe(false);
  });

  test("returns false when startTime equals now", () => {
    const same = new Date("2025-01-15T12:00:00Z");
    expect(isPastEvent(same, now)).toBe(false);
  });
});

describe("isToday", () => {
  const now = new Date("2025-01-15T12:00:00Z");

  test("returns true when dates are same day", () => {
    const sameDay = new Date("2025-01-15T08:00:00Z");
    expect(isToday(sameDay, now)).toBe(true);
  });

  test("returns true when time differs but same calendar day", () => {
    const laterToday = new Date("2025-01-15T23:59:59Z");
    expect(isToday(laterToday, now)).toBe(true);
  });

  test("returns false for yesterday", () => {
    const yesterday = new Date("2025-01-14T12:00:00Z");
    expect(isToday(yesterday, now)).toBe(false);
  });

  test("returns false for tomorrow", () => {
    const tomorrow = new Date("2025-01-16T12:00:00Z");
    expect(isToday(tomorrow, now)).toBe(false);
  });
});

describe("isTomorrow", () => {
  const now = new Date("2025-01-15T12:00:00Z");

  test("returns true for next day", () => {
    const tomorrow = new Date("2025-01-16T10:00:00Z");
    expect(isTomorrow(tomorrow, now)).toBe(true);
  });

  test("returns false for today", () => {
    const today = new Date("2025-01-15T18:00:00Z");
    expect(isTomorrow(today, now)).toBe(false);
  });

  test("returns false for day after tomorrow", () => {
    const dayAfter = new Date("2025-01-17T10:00:00Z");
    expect(isTomorrow(dayAfter, now)).toBe(false);
  });

  test("handles month boundaries", () => {
    const jan31 = new Date("2025-01-31T12:00:00Z");
    const feb1 = new Date("2025-02-01T10:00:00Z");
    expect(isTomorrow(feb1, jan31)).toBe(true);
  });
});

describe("daysUntil", () => {
  const now = new Date("2025-01-15T12:00:00Z");

  test("returns 0 for same day", () => {
    const today = new Date("2025-01-15T18:00:00Z");
    expect(daysUntil(today, now)).toBe(0);
  });

  test("returns positive for future days", () => {
    const future = new Date("2025-01-18T10:00:00Z");
    expect(daysUntil(future, now)).toBe(3);
  });

  test("returns negative for past days", () => {
    const past = new Date("2025-01-12T10:00:00Z");
    expect(daysUntil(past, now)).toBe(-3);
  });

  test("returns 1 for tomorrow", () => {
    // Use 20:00 UTC which is clearly afternoon PT, ensuring it's the next day
    const tomorrow = new Date("2025-01-16T20:00:00Z");
    expect(daysUntil(tomorrow, now)).toBe(1);
  });

  test("handles year boundaries", () => {
    const dec31 = new Date("2024-12-31T12:00:00Z");
    const jan2 = new Date("2025-01-02T10:00:00Z");
    expect(daysUntil(jan2, dec31)).toBe(2);
  });
});

// ============================================================================
// Availability Derivations
// ============================================================================

describe("computeAvailability", () => {
  test("returns null spotsRemaining when capacity is null", () => {
    const result = computeAvailability(null, 5);
    expect(result.spotsRemaining).toBeNull();
    expect(result.isFull).toBe(false);
    expect(result.isWaitlistOpen).toBe(false);
  });

  test("calculates spots remaining correctly", () => {
    const result = computeAvailability(20, 15);
    expect(result.spotsRemaining).toBe(5);
    expect(result.isFull).toBe(false);
    expect(result.isWaitlistOpen).toBe(false);
  });

  test("isFull is true when at capacity", () => {
    const result = computeAvailability(20, 20);
    expect(result.spotsRemaining).toBe(0);
    expect(result.isFull).toBe(true);
    expect(result.isWaitlistOpen).toBe(true);
  });

  test("spots remaining never goes negative", () => {
    const result = computeAvailability(20, 25);
    expect(result.spotsRemaining).toBe(0);
    expect(result.isFull).toBe(true);
  });

  test("zero capacity means immediately full", () => {
    const result = computeAvailability(0, 0);
    expect(result.spotsRemaining).toBe(0);
    expect(result.isFull).toBe(true);
    expect(result.isWaitlistOpen).toBe(true);
  });
});

describe("spotsRemainingLabel", () => {
  test("returns 'Open registration' for null capacity", () => {
    expect(spotsRemainingLabel(null, 10)).toBe("Open registration");
  });

  test("returns 'Full - Waitlist open' when at capacity", () => {
    expect(spotsRemainingLabel(20, 20)).toBe("Full - Waitlist open");
  });

  test("returns singular '1 spot remaining'", () => {
    expect(spotsRemainingLabel(20, 19)).toBe("1 spot remaining");
  });

  test("returns plural 'X spots remaining'", () => {
    expect(spotsRemainingLabel(20, 15)).toBe("5 spots remaining");
  });
});

// ============================================================================
// Status Labels
// ============================================================================

describe("computeStatus", () => {
  const now = new Date("2025-01-15T12:00:00Z");

  test("returns 'past' when event end time is before now", () => {
    const start = new Date("2025-01-14T10:00:00Z");
    const end = new Date("2025-01-14T12:00:00Z");
    expect(computeStatus(true, start, end, now)).toBe("past");
  });

  test("returns 'draft' when not published and upcoming", () => {
    const start = new Date("2025-01-20T10:00:00Z");
    expect(computeStatus(false, start, null, now)).toBe("draft");
  });

  test("returns 'ongoing' when published and between start/end", () => {
    const start = new Date("2025-01-15T10:00:00Z");
    const end = new Date("2025-01-15T14:00:00Z");
    expect(computeStatus(true, start, end, now)).toBe("ongoing");
  });

  test("returns 'upcoming' when published and not yet started", () => {
    const start = new Date("2025-01-20T10:00:00Z");
    expect(computeStatus(true, start, null, now)).toBe("upcoming");
  });

  test("uses startTime as endTime fallback for past check", () => {
    const pastStart = new Date("2025-01-14T10:00:00Z");
    expect(computeStatus(true, pastStart, null, now)).toBe("past");
  });
});

describe("statusLabel", () => {
  test("returns correct labels for all statuses", () => {
    expect(statusLabel("draft")).toBe("Draft");
    expect(statusLabel("upcoming")).toBe("Upcoming");
    expect(statusLabel("ongoing")).toBe("In Progress");
    expect(statusLabel("past")).toBe("Past");
  });
});

// ============================================================================
// Urgency Derivations
// ============================================================================

describe("computeUrgency", () => {
  const now = new Date("2025-01-15T12:00:00Z");

  test("returns 'none' for past events", () => {
    const past = new Date("2025-01-10T10:00:00Z");
    expect(computeUrgency(past, null, 0, now)).toBe("none");
  });

  test("returns 'urgent' for events today", () => {
    const today = new Date("2025-01-15T18:00:00Z");
    expect(computeUrgency(today, null, 0, now)).toBe("urgent");
  });

  test("returns 'high' for events tomorrow", () => {
    const tomorrow = new Date("2025-01-16T10:00:00Z");
    expect(computeUrgency(tomorrow, null, 0, now)).toBe("high");
  });

  test("returns 'medium' for events in 2-3 days", () => {
    const in3Days = new Date("2025-01-18T10:00:00Z");
    expect(computeUrgency(in3Days, null, 0, now)).toBe("medium");
  });

  test("returns 'low' for events in 4-7 days", () => {
    const in5Days = new Date("2025-01-20T10:00:00Z");
    expect(computeUrgency(in5Days, null, 0, now)).toBe("low");
  });

  test("returns 'none' for events more than 7 days away", () => {
    const in10Days = new Date("2025-01-25T10:00:00Z");
    expect(computeUrgency(in10Days, null, 0, now)).toBe("none");
  });

  test("returns 'urgent' when only 1-2 spots left", () => {
    const in5Days = new Date("2025-01-20T10:00:00Z");
    expect(computeUrgency(in5Days, 20, 18, now)).toBe("urgent");
    expect(computeUrgency(in5Days, 20, 19, now)).toBe("urgent");
  });

  test("returns 'high' when 3-5 spots left", () => {
    const in10Days = new Date("2025-01-25T10:00:00Z");
    expect(computeUrgency(in10Days, 20, 15, now)).toBe("high");
  });

  test("capacity urgency takes precedence over time urgency", () => {
    const in10Days = new Date("2025-01-25T10:00:00Z");
    // 2 spots left should be urgent even though 10 days away
    expect(computeUrgency(in10Days, 20, 18, now)).toBe("urgent");
  });
});

describe("urgencyLabel", () => {
  const now = new Date("2025-01-15T12:00:00Z");

  test("returns 'Past' for past events", () => {
    const past = new Date("2025-01-10T10:00:00Z");
    expect(urgencyLabel(past, null, 0, now)).toBe("Past");
  });

  test("returns 'Today' for events today", () => {
    const today = new Date("2025-01-15T18:00:00Z");
    expect(urgencyLabel(today, null, 0, now)).toBe("Today");
  });

  test("returns 'Tomorrow' for events tomorrow", () => {
    const tomorrow = new Date("2025-01-16T10:00:00Z");
    expect(urgencyLabel(tomorrow, null, 0, now)).toBe("Tomorrow");
  });

  test("returns 'Waitlist' when full", () => {
    const in5Days = new Date("2025-01-20T10:00:00Z");
    expect(urgencyLabel(in5Days, 20, 20, now)).toBe("Waitlist");
  });

  test("returns 'X left' when 3 or fewer spots", () => {
    const in5Days = new Date("2025-01-20T10:00:00Z");
    expect(urgencyLabel(in5Days, 20, 18, now)).toBe("2 left");
    expect(urgencyLabel(in5Days, 20, 17, now)).toBe("3 left");
  });

  test("returns 'In X days' for upcoming events", () => {
    const in5Days = new Date("2025-01-20T10:00:00Z");
    expect(urgencyLabel(in5Days, null, 0, now)).toBe("In 5 days");
  });

  test("returns empty string for far future events", () => {
    const in10Days = new Date("2025-01-25T10:00:00Z");
    expect(urgencyLabel(in10Days, null, 0, now)).toBe("");
  });
});

// ============================================================================
// Category Inference
// ============================================================================

describe("inferCategory", () => {
  test("infers Luncheon from title", () => {
    expect(inferCategory("Monthly Luncheon")).toBe("Luncheon");
    expect(inferCategory("Spring Lunch")).toBe("Luncheon");
  });

  test("infers Book Club from title", () => {
    expect(inferCategory("Book Club Meeting")).toBe("Book Club");
    expect(inferCategory("Mystery Book Group")).toBe("Book Club");
  });

  test("infers Wine from title", () => {
    expect(inferCategory("Wine Tasting")).toBe("Wine");
    expect(inferCategory("Wine & Cheese")).toBe("Wine");
  });

  test("infers Outdoor from title", () => {
    expect(inferCategory("Morning Hike")).toBe("Outdoor");
    expect(inferCategory("Nature Walk")).toBe("Outdoor");
    expect(inferCategory("Hiking Adventure")).toBe("Outdoor");
  });

  test("infers Golf from title", () => {
    expect(inferCategory("Golf Tournament")).toBe("Golf");
  });

  test("infers Bridge from title", () => {
    expect(inferCategory("Bridge Night")).toBe("Bridge");
  });

  test("infers Orientation from title", () => {
    expect(inferCategory("New Member Orientation")).toBe("Orientation");
    expect(inferCategory("Orientation Session")).toBe("Orientation");
  });

  test("infers Board from title", () => {
    expect(inferCategory("Board Meeting")).toBe("Board");
  });

  test("returns null for unrecognized patterns", () => {
    expect(inferCategory("Social Gathering")).toBeNull();
    expect(inferCategory("Special Event")).toBeNull();
  });

  test("is case-insensitive", () => {
    expect(inferCategory("MONTHLY LUNCHEON")).toBe("Luncheon");
    expect(inferCategory("book club")).toBe("Book Club");
  });
});

// ============================================================================
// Validation
// ============================================================================

describe("validateEventFields", () => {
  test("returns error when title is missing", () => {
    const errors = validateEventFields({
      startTime: new Date(),
    });
    expect(errors).toContainEqual({ field: "title", message: "Title is required" });
  });

  test("returns error when title is empty", () => {
    const errors = validateEventFields({
      title: "   ",
      startTime: new Date(),
    });
    expect(errors).toContainEqual({ field: "title", message: "Title is required" });
  });

  test("returns error when startTime is missing", () => {
    const errors = validateEventFields({
      title: "Event",
    });
    expect(errors).toContainEqual({ field: "startTime", message: "Start time is required" });
  });

  test("returns error when endTime is before startTime", () => {
    const errors = validateEventFields({
      title: "Event",
      startTime: new Date("2025-01-15T10:00:00Z"),
      endTime: new Date("2025-01-15T08:00:00Z"),
    });
    expect(errors).toContainEqual({ field: "endTime", message: "End time must be after start time" });
  });

  test("returns error when capacity is negative", () => {
    const errors = validateEventFields({
      title: "Event",
      startTime: new Date(),
      capacity: -5,
    });
    expect(errors).toContainEqual({ field: "capacity", message: "Capacity must be 0 or greater" });
  });

  test("allows zero capacity", () => {
    const errors = validateEventFields({
      title: "Event",
      startTime: new Date(),
      capacity: 0,
    });
    expect(errors).not.toContainEqual(expect.objectContaining({ field: "capacity" }));
  });

  test("allows null capacity", () => {
    const errors = validateEventFields({
      title: "Event",
      startTime: new Date(),
      capacity: null,
    });
    expect(errors).not.toContainEqual(expect.objectContaining({ field: "capacity" }));
  });

  test("returns empty array for valid fields", () => {
    const errors = validateEventFields({
      title: "Valid Event",
      startTime: new Date("2025-01-15T10:00:00Z"),
      endTime: new Date("2025-01-15T12:00:00Z"),
      capacity: 20,
    });
    expect(errors).toHaveLength(0);
  });

  test("returns multiple errors when applicable", () => {
    const errors = validateEventFields({});
    expect(errors.length).toBeGreaterThanOrEqual(2);
    expect(errors).toContainEqual({ field: "title", message: "Title is required" });
    expect(errors).toContainEqual({ field: "startTime", message: "Start time is required" });
  });
});

// ============================================================================
// Preview Generation
// ============================================================================

describe("generateDerivedPreview", () => {
  const now = new Date("2025-01-15T12:00:00Z");

  test("generates complete preview for upcoming event", () => {
    const preview = generateDerivedPreview({
      title: "Monthly Luncheon",
      startTime: new Date("2025-01-18T20:00:00Z"),
      isPublished: true,
      capacity: 20,
      registeredCount: 10, // 10 spots remaining, no capacity urgency
      now,
    });

    expect(preview.status).toBe("upcoming");
    expect(preview.statusLabel).toBe("Upcoming");
    expect(preview.spotsLabel).toBe("10 spots remaining");
    expect(preview.urgency).toBe("medium"); // 3 days away, plenty of spots
    expect(preview.inferredCategory).toBe("Luncheon");
    expect(preview.isToday).toBe(false);
    expect(preview.isTomorrow).toBe(false);
    expect(preview.daysUntil).toBe(3);
  });

  test("generates preview for event today", () => {
    const preview = generateDerivedPreview({
      title: "Board Meeting",
      startTime: new Date("2025-01-15T18:00:00Z"),
      isPublished: true,
      now,
    });

    expect(preview.isToday).toBe(true);
    expect(preview.isTomorrow).toBe(false);
    expect(preview.daysUntil).toBe(0);
    expect(preview.urgency).toBe("urgent");
    expect(preview.urgencyLabel).toBe("Today");
    expect(preview.inferredCategory).toBe("Board");
  });

  test("generates preview for draft event", () => {
    const preview = generateDerivedPreview({
      title: "Wine Tasting",
      startTime: new Date("2025-01-20T18:00:00Z"),
      isPublished: false,
      now,
    });

    expect(preview.status).toBe("draft");
    expect(preview.statusLabel).toBe("Draft");
    expect(preview.inferredCategory).toBe("Wine");
  });

  test("derives endTime when not provided", () => {
    const startTime = new Date("2025-01-20T17:00:00Z");
    const preview = generateDerivedPreview({
      title: "Event",
      startTime,
      now,
    });

    expect(preview.effectiveEndTime.getTime()).toBe(startTime.getTime() + 2 * 60 * 60 * 1000);
  });

  test("uses provided endTime", () => {
    const startTime = new Date("2025-01-20T17:00:00Z");
    const endTime = new Date("2025-01-20T21:00:00Z");
    const preview = generateDerivedPreview({
      title: "Event",
      startTime,
      endTime,
      now,
    });

    expect(preview.effectiveEndTime).toEqual(endTime);
  });

  test("handles null capacity as open registration", () => {
    const preview = generateDerivedPreview({
      title: "Event",
      startTime: new Date("2025-01-20T17:00:00Z"),
      capacity: null,
      now,
    });

    expect(preview.spotsLabel).toBe("Open registration");
  });

  test("handles full event", () => {
    const preview = generateDerivedPreview({
      title: "Book Club Meeting",
      startTime: new Date("2025-01-20T17:00:00Z"),
      capacity: 10,
      registeredCount: 10,
      isPublished: true,
      now,
    });

    expect(preview.spotsLabel).toBe("Full - Waitlist open");
    expect(preview.inferredCategory).toBe("Book Club");
  });
});
