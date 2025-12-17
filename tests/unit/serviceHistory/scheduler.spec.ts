import { describe, expect, test } from "vitest";
import {
  isTransitionDate,
  getNextTransitionDate,
  getUpcomingTransitionDates,
  validateTransitionDate,
} from "@/lib/serviceHistory/scheduler";

describe("scheduler date utilities", () => {
  describe("isTransitionDate", () => {
    test("Feb 1 at midnight Pacific (PST) is a transition date", () => {
      // Feb 1, 2025 at midnight Pacific = Feb 1, 2025 at 08:00 UTC
      const feb1 = new Date("2025-02-01T08:00:00.000Z");
      expect(isTransitionDate(feb1)).toBe(true);
    });

    test("Aug 1 at midnight Pacific (PDT) is a transition date", () => {
      // Aug 1, 2025 at midnight Pacific = Aug 1, 2025 at 07:00 UTC
      const aug1 = new Date("2025-08-01T07:00:00.000Z");
      expect(isTransitionDate(aug1)).toBe(true);
    });

    test("other dates are not transition dates", () => {
      const jan15 = new Date("2025-01-15T08:00:00.000Z");
      expect(isTransitionDate(jan15)).toBe(false);

      const mar1 = new Date("2025-03-01T08:00:00.000Z");
      expect(isTransitionDate(mar1)).toBe(false);

      const dec31 = new Date("2025-12-31T08:00:00.000Z");
      expect(isTransitionDate(dec31)).toBe(false);
    });

    test("Feb 1 in Pacific is detected even with different UTC times", () => {
      // Late on Feb 1 Pacific time (still Feb 1 in Pacific but Feb 2 UTC)
      const lateFeb1 = new Date("2025-02-02T07:00:00.000Z"); // 11pm Pacific on Feb 1
      expect(isTransitionDate(lateFeb1)).toBe(true);
    });
  });

  describe("getNextTransitionDate", () => {
    test("returns Feb 1 when current date is Jan 15", () => {
      const jan15 = new Date("2025-01-15T08:00:00.000Z");
      const next = getNextTransitionDate(jan15);
      // Should be Feb 1, 2025 at 08:00 UTC (midnight Pacific PST)
      expect(next.getUTCMonth()).toBe(1); // February
      expect(next.getUTCDate()).toBe(1);
      expect(next.getUTCFullYear()).toBe(2025);
    });

    test("returns Aug 1 when current date is Mar 15", () => {
      const mar15 = new Date("2025-03-15T07:00:00.000Z");
      const next = getNextTransitionDate(mar15);
      // Should be Aug 1, 2025 at 07:00 UTC (midnight Pacific PDT)
      expect(next.getUTCMonth()).toBe(7); // August
      expect(next.getUTCDate()).toBe(1);
      expect(next.getUTCFullYear()).toBe(2025);
    });

    test("returns Feb 1 next year when current date is Sep 15", () => {
      const sep15 = new Date("2025-09-15T07:00:00.000Z");
      const next = getNextTransitionDate(sep15);
      // Should be Feb 1, 2026
      expect(next.getUTCMonth()).toBe(1); // February
      expect(next.getUTCDate()).toBe(1);
      expect(next.getUTCFullYear()).toBe(2026);
    });
  });

  describe("getUpcomingTransitionDates", () => {
    test("returns array of future transition dates", () => {
      const dates = getUpcomingTransitionDates();
      expect(dates.length).toBeGreaterThan(0);
      expect(dates.length).toBeLessThanOrEqual(4);

      // All dates should be in the future
      const now = new Date();
      for (const date of dates) {
        expect(date.getTime()).toBeGreaterThan(now.getTime());
      }

      // All dates should be Feb 1 or Aug 1
      for (const date of dates) {
        expect(isTransitionDate(date)).toBe(true);
      }
    });

    test("dates are sorted in ascending order", () => {
      const dates = getUpcomingTransitionDates();
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i].getTime()).toBeGreaterThan(dates[i - 1].getTime());
      }
    });
  });

  describe("validateTransitionDate", () => {
    test("valid Feb 1 date passes validation", () => {
      const feb1 = new Date("2025-02-01T08:00:00.000Z");
      const result = validateTransitionDate(feb1);
      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    test("valid Aug 1 date passes validation", () => {
      const aug1 = new Date("2025-08-01T07:00:00.000Z");
      const result = validateTransitionDate(aug1);
      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    test("invalid date fails validation with helpful message", () => {
      const jan15 = new Date("2025-01-15T08:00:00.000Z");
      const result = validateTransitionDate(jan15);
      expect(result.valid).toBe(false);
      expect(result.message).toContain("Feb 1 or Aug 1");
      expect(result.message).toContain("Next valid date");
    });
  });
});
