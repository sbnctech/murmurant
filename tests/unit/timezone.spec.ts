// Copyright (c) Santa Barbara Newcomers Club
// Unit tests for timezone utility helpers

import { describe, it, expect } from "vitest";
import {
  CLUB_TIMEZONE,
  toClubDateTime,
  startOfClubDay,
  isSameClubDay,
  toClubDateString,
  todayClubDateString,
  isBeforeToday,
  isTodayOrLater,
} from "@/lib/timezone";

describe("Timezone Utilities", () => {
  describe("CLUB_TIMEZONE constant", () => {
    it("is America/Los_Angeles", () => {
      expect(CLUB_TIMEZONE).toBe("America/Los_Angeles");
    });
  });

  describe("toClubDateTime", () => {
    it("formats a UTC date for display in Pacific Time", () => {
      // 2025-12-15 20:30:00 UTC = 12:30 PM PST (UTC-8)
      const utcDate = new Date("2025-12-15T20:30:00Z");
      const result = toClubDateTime(utcDate);

      expect(result.date).toBe("12/15/2025");
      expect(result.time).toBe("12:30 PM");
      expect(result.weekday).toBe("Monday");
      expect(result.full).toContain("December 15, 2025");
      expect(result.full).toContain("12:30 PM");
    });

    it("handles dates during PDT (summer)", () => {
      // 2025-07-15 19:00:00 UTC = 12:00 PM PDT (UTC-7)
      const utcDate = new Date("2025-07-15T19:00:00Z");
      const result = toClubDateTime(utcDate);

      expect(result.date).toBe("07/15/2025");
      expect(result.time).toBe("12:00 PM");
      expect(result.weekday).toBe("Tuesday");
    });

    it("returns ISO-like string for debugging", () => {
      const utcDate = new Date("2025-12-15T20:30:00Z");
      const result = toClubDateTime(utcDate);

      expect(result.iso).toBe("2025-12-15T12:30:00");
    });
  });

  describe("startOfClubDay", () => {
    it("returns midnight Pacific for a given date", () => {
      // Input: 2025-12-15 20:30:00 UTC (12:30 PM Pacific)
      const utcDate = new Date("2025-12-15T20:30:00Z");
      const startOfDay = startOfClubDay(utcDate);

      // Midnight Pacific on Dec 15 = 08:00 UTC on Dec 15 (PST is UTC-8)
      expect(startOfDay.toISOString()).toBe("2025-12-15T08:00:00.000Z");
    });

    it("handles dates that cross day boundary to previous day in Pacific", () => {
      // Input: 2025-12-15 03:00:00 UTC = Dec 14, 7:00 PM Pacific
      const utcDate = new Date("2025-12-15T03:00:00Z");
      const startOfDay = startOfClubDay(utcDate);

      // Midnight Pacific on Dec 14 = 08:00 UTC on Dec 14
      expect(startOfDay.toISOString()).toBe("2025-12-14T08:00:00.000Z");
    });

    it("handles PDT (summer time) correctly", () => {
      // Input: 2025-07-15 19:00:00 UTC = 12:00 PM PDT
      const utcDate = new Date("2025-07-15T19:00:00Z");
      const startOfDay = startOfClubDay(utcDate);

      // Midnight Pacific on July 15 = 07:00 UTC on July 15 (PDT is UTC-7)
      expect(startOfDay.toISOString()).toBe("2025-07-15T07:00:00.000Z");
    });
  });

  describe("isSameClubDay", () => {
    it("returns true for same calendar day in Pacific", () => {
      // Both are Dec 15 in Pacific Time
      const a = new Date("2025-12-15T10:00:00Z"); // 2 AM Pacific
      const b = new Date("2025-12-15T23:00:00Z"); // 3 PM Pacific

      expect(isSameClubDay(a, b)).toBe(true);
    });

    it("returns false for different calendar days in Pacific", () => {
      // Dec 15 2 AM Pacific vs Dec 16 2 AM Pacific
      const a = new Date("2025-12-15T10:00:00Z");
      const b = new Date("2025-12-16T10:00:00Z");

      expect(isSameClubDay(a, b)).toBe(false);
    });

    it("handles day boundary correctly (late UTC = early Pacific)", () => {
      // Dec 15 03:00 UTC = Dec 14 7:00 PM Pacific
      // Dec 15 10:00 UTC = Dec 15 2:00 AM Pacific
      const a = new Date("2025-12-15T03:00:00Z"); // Dec 14 Pacific
      const b = new Date("2025-12-15T10:00:00Z"); // Dec 15 Pacific

      expect(isSameClubDay(a, b)).toBe(false);
    });

    it("handles same UTC day spanning two Pacific days", () => {
      // Both Dec 15 UTC, but different Pacific days
      const a = new Date("2025-12-15T06:00:00Z"); // Dec 14 10:00 PM Pacific
      const b = new Date("2025-12-15T09:00:00Z"); // Dec 15 1:00 AM Pacific

      expect(isSameClubDay(a, b)).toBe(false);
    });
  });

  describe("toClubDateString", () => {
    it("returns YYYY-MM-DD format in Pacific timezone", () => {
      const utcDate = new Date("2025-12-15T20:30:00Z");
      expect(toClubDateString(utcDate)).toBe("2025-12-15");
    });

    it("handles day boundary correctly", () => {
      // Dec 15 03:00 UTC = Dec 14 in Pacific
      const utcDate = new Date("2025-12-15T03:00:00Z");
      expect(toClubDateString(utcDate)).toBe("2025-12-14");
    });

    it("handles summer time (PDT)", () => {
      // July 15 05:00 UTC = July 14 10:00 PM PDT
      const utcDate = new Date("2025-07-15T05:00:00Z");
      expect(toClubDateString(utcDate)).toBe("2025-07-14");
    });
  });

  describe("todayClubDateString", () => {
    it("returns a valid date string", () => {
      const today = todayClubDateString();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("returns a parseable date", () => {
      const today = todayClubDateString();
      const parsed = new Date(today);
      expect(parsed.toString()).not.toBe("Invalid Date");
    });
  });

  describe("isBeforeToday", () => {
    it("returns true for dates before today", () => {
      // Create a date that's definitely yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(12, 0, 0, 0); // Noon yesterday

      expect(isBeforeToday(yesterday)).toBe(true);
    });

    it("returns false for dates that are today", () => {
      // Create a date that's definitely today (around noon to avoid boundary issues)
      const todayNoon = new Date();
      todayNoon.setHours(12, 0, 0, 0);

      // This might fail near midnight, but should work in normal testing
      expect(isBeforeToday(todayNoon)).toBe(false);
    });

    it("returns false for future dates", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      expect(isBeforeToday(tomorrow)).toBe(false);
    });
  });

  describe("isTodayOrLater", () => {
    it("returns false for past dates", () => {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      expect(isTodayOrLater(lastWeek)).toBe(false);
    });

    it("returns true for today", () => {
      const todayNoon = new Date();
      todayNoon.setHours(12, 0, 0, 0);

      expect(isTodayOrLater(todayNoon)).toBe(true);
    });

    it("returns true for future dates", () => {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      expect(isTodayOrLater(nextWeek)).toBe(true);
    });
  });

  describe("DST transition handling", () => {
    it("handles spring forward (March 2025)", () => {
      // March 9, 2025 at 2:00 AM PST becomes 3:00 AM PDT
      // Just before: March 9, 2025 01:59 AM PST = 09:59 UTC
      // Just after: March 9, 2025 03:00 AM PDT = 10:00 UTC

      const beforeSpringForward = new Date("2025-03-09T09:00:00Z"); // 1 AM PST
      const afterSpringForward = new Date("2025-03-09T11:00:00Z"); // 4 AM PDT

      // Both should be on March 9 in Pacific
      expect(toClubDateString(beforeSpringForward)).toBe("2025-03-09");
      expect(toClubDateString(afterSpringForward)).toBe("2025-03-09");
      expect(isSameClubDay(beforeSpringForward, afterSpringForward)).toBe(true);
    });

    it("handles fall back (November 2025)", () => {
      // November 2, 2025 at 2:00 AM PDT becomes 1:00 AM PST
      // First 1:30 AM: Nov 2, 2025 08:30 UTC (PDT)
      // Second 1:30 AM: Nov 2, 2025 09:30 UTC (PST)

      const first130am = new Date("2025-11-02T08:30:00Z");
      const second130am = new Date("2025-11-02T09:30:00Z");

      // Both should be on November 2 in Pacific
      expect(toClubDateString(first130am)).toBe("2025-11-02");
      expect(toClubDateString(second130am)).toBe("2025-11-02");
      expect(isSameClubDay(first130am, second130am)).toBe(true);
    });
  });
});
