import { describe, expect, test } from "vitest";
import {
  getTransitionLeadDays,
  calculateShowAtDate,
  calculateDaysRemaining,
  getTermNameForTransition,
  isWidgetVisible,
  getTermBoundaries,
  isWithinLeadWindow,
} from "@/lib/serviceHistory/transitionWidget";

describe("transition widget utilities", () => {
  describe("getTransitionLeadDays", () => {
    test("returns default 60 days when env not set", () => {
      // Note: env vars are not mocked in these tests, so this tests the default
      const days = getTransitionLeadDays();
      expect(days).toBe(60);
    });
  });

  describe("calculateShowAtDate", () => {
    test("calculates show date 60 days before Feb 1 transition", () => {
      // Feb 1, 2026 at 08:00 UTC (midnight Pacific PST)
      const transitionDate = new Date("2026-02-01T08:00:00.000Z");
      const leadDays = 60;
      const showAt = calculateShowAtDate(transitionDate, leadDays);

      // 60 days before Feb 1 is Dec 3
      expect(showAt.getUTCMonth()).toBe(11); // December
      expect(showAt.getUTCDate()).toBe(3);
      expect(showAt.getUTCFullYear()).toBe(2025);
    });

    test("calculates show date 60 days before Aug 1 transition", () => {
      // Aug 1, 2026 at 07:00 UTC (midnight Pacific PDT)
      const transitionDate = new Date("2026-08-01T07:00:00.000Z");
      const leadDays = 60;
      const showAt = calculateShowAtDate(transitionDate, leadDays);

      // 60 days before Aug 1 is June 2
      expect(showAt.getUTCMonth()).toBe(5); // June
      expect(showAt.getUTCDate()).toBe(2);
      expect(showAt.getUTCFullYear()).toBe(2026);
    });

    test("calculates show date with custom lead days", () => {
      const transitionDate = new Date("2026-02-01T08:00:00.000Z");
      const leadDays = 30;
      const showAt = calculateShowAtDate(transitionDate, leadDays);

      // 30 days before Feb 1 is Jan 2
      expect(showAt.getUTCMonth()).toBe(0); // January
      expect(showAt.getUTCDate()).toBe(2);
      expect(showAt.getUTCFullYear()).toBe(2026);
    });
  });

  describe("calculateDaysRemaining", () => {
    test("calculates days remaining for same day (0 days)", () => {
      const transitionDate = new Date("2026-02-01T08:00:00.000Z");
      const now = new Date("2026-02-01T10:00:00.000Z"); // Same Pacific day
      const days = calculateDaysRemaining(now, transitionDate);
      expect(days).toBe(0);
    });

    test("calculates days remaining (1 day)", () => {
      const transitionDate = new Date("2026-02-01T08:00:00.000Z");
      // Jan 31 Pacific time
      const now = new Date("2026-01-31T20:00:00.000Z");
      const days = calculateDaysRemaining(now, transitionDate);
      expect(days).toBe(1);
    });

    test("calculates days remaining (30 days)", () => {
      const transitionDate = new Date("2026-02-01T08:00:00.000Z");
      // Jan 2 Pacific time
      const now = new Date("2026-01-02T20:00:00.000Z");
      const days = calculateDaysRemaining(now, transitionDate);
      expect(days).toBe(30);
    });

    test("calculates days remaining (60 days)", () => {
      const transitionDate = new Date("2026-02-01T08:00:00.000Z");
      // Dec 3 Pacific time
      const now = new Date("2025-12-03T20:00:00.000Z");
      const days = calculateDaysRemaining(now, transitionDate);
      expect(days).toBe(60);
    });
  });

  describe("getTermNameForTransition", () => {
    test("Feb 1 starts Summer term", () => {
      const feb1 = new Date("2026-02-01T08:00:00.000Z");
      expect(getTermNameForTransition(feb1)).toBe("Summer 2026");
    });

    test("Aug 1 starts Winter term", () => {
      const aug1 = new Date("2026-08-01T07:00:00.000Z");
      expect(getTermNameForTransition(aug1)).toBe("Winter 2026/2027");
    });

    test("Feb 1 2025 starts Summer 2025", () => {
      const feb1 = new Date("2025-02-01T08:00:00.000Z");
      expect(getTermNameForTransition(feb1)).toBe("Summer 2025");
    });
  });

  describe("isWidgetVisible", () => {
    const transitionDate = new Date("2026-02-01T08:00:00.000Z"); // Feb 1, 2026
    const leadDays = 60;

    test("widget is not visible before lead window", () => {
      // Dec 2, 2025 - one day before showAt
      const now = new Date("2025-12-02T20:00:00.000Z");
      expect(isWidgetVisible(now, transitionDate, leadDays)).toBe(false);
    });

    test("widget is visible on first day of lead window", () => {
      // Dec 3, 2025 - exactly 60 days before Feb 1
      const now = new Date("2025-12-03T20:00:00.000Z");
      expect(isWidgetVisible(now, transitionDate, leadDays)).toBe(true);
    });

    test("widget is visible in middle of lead window", () => {
      // Jan 15, 2026
      const now = new Date("2026-01-15T20:00:00.000Z");
      expect(isWidgetVisible(now, transitionDate, leadDays)).toBe(true);
    });

    test("widget is visible one day before transition", () => {
      // Jan 31, 2026
      const now = new Date("2026-01-31T20:00:00.000Z");
      expect(isWidgetVisible(now, transitionDate, leadDays)).toBe(true);
    });

    test("widget is not visible on transition day", () => {
      // Feb 1, 2026 at transition time
      const now = new Date("2026-02-01T08:00:00.000Z");
      expect(isWidgetVisible(now, transitionDate, leadDays)).toBe(false);
    });

    test("widget is not visible after transition", () => {
      // Feb 2, 2026
      const now = new Date("2026-02-02T20:00:00.000Z");
      expect(isWidgetVisible(now, transitionDate, leadDays)).toBe(false);
    });

    test("short lead window works correctly", () => {
      const shortLead = 7; // 7 days
      // Jan 20 - outside 7-day window
      const nowOutside = new Date("2026-01-20T20:00:00.000Z");
      expect(isWidgetVisible(nowOutside, transitionDate, shortLead)).toBe(false);

      // Jan 26 - inside 7-day window (6 days before Feb 1)
      const nowInside = new Date("2026-01-26T20:00:00.000Z");
      expect(isWidgetVisible(nowInside, transitionDate, shortLead)).toBe(true);
    });
  });

  describe("getTermBoundaries", () => {
    test("returns Summer term boundaries when in March", () => {
      // March 15, 2026 Pacific Time
      const now = new Date("2026-03-15T20:00:00.000Z");
      const bounds = getTermBoundaries(now);

      // Current term is Summer (Feb 1 - Aug 1)
      expect(bounds.currentTermStart.getUTCMonth()).toBe(1); // February
      expect(bounds.currentTermStart.getUTCDate()).toBe(1);
      expect(bounds.currentTermEnd.getUTCMonth()).toBe(7); // August
      expect(bounds.currentTermEnd.getUTCDate()).toBe(1);

      // Next term is Winter (Aug 1 - Feb 1 next year)
      expect(bounds.nextTermStart.getUTCMonth()).toBe(7); // August
      expect(bounds.nextTermEnd.getUTCMonth()).toBe(1); // February next year
    });

    test("returns Winter term boundaries when in October", () => {
      // October 15, 2026 Pacific Time
      const now = new Date("2026-10-15T20:00:00.000Z");
      const bounds = getTermBoundaries(now);

      // Current term is Winter (Aug 1 - Feb 1 next year)
      expect(bounds.currentTermStart.getUTCMonth()).toBe(7); // August
      expect(bounds.currentTermStart.getUTCFullYear()).toBe(2026);
      expect(bounds.currentTermEnd.getUTCMonth()).toBe(1); // February
      expect(bounds.currentTermEnd.getUTCFullYear()).toBe(2027);

      // Next term is Summer (Feb 1 - Aug 1 next year)
      expect(bounds.nextTermStart.getUTCMonth()).toBe(1); // February
      expect(bounds.nextTermStart.getUTCFullYear()).toBe(2027);
    });

    test("returns Winter term boundaries when in January", () => {
      // January 15, 2026 Pacific Time
      const now = new Date("2026-01-15T20:00:00.000Z");
      const bounds = getTermBoundaries(now);

      // Current term is Winter (Aug 1 previous year - Feb 1)
      expect(bounds.currentTermStart.getUTCMonth()).toBe(7); // August
      expect(bounds.currentTermStart.getUTCFullYear()).toBe(2025);
      expect(bounds.currentTermEnd.getUTCMonth()).toBe(1); // February
      expect(bounds.currentTermEnd.getUTCFullYear()).toBe(2026);

      // Next term is Summer (Feb 1 - Aug 1)
      expect(bounds.nextTermStart.getUTCMonth()).toBe(1); // February
      expect(bounds.nextTermStart.getUTCFullYear()).toBe(2026);
    });

    test("handles DST transition in March correctly", () => {
      // March 8, 2026 - right after DST starts
      const now = new Date("2026-03-08T20:00:00.000Z");
      const bounds = getTermBoundaries(now);

      // Should still be in Summer term
      expect(bounds.currentTermStart.getUTCMonth()).toBe(1); // February
      expect(bounds.currentTermEnd.getUTCMonth()).toBe(7); // August
    });

    test("handles DST transition in November correctly", () => {
      // November 1, 2026 - right after DST ends
      const now = new Date("2026-11-01T20:00:00.000Z");
      const bounds = getTermBoundaries(now);

      // Should be in Winter term
      expect(bounds.currentTermStart.getUTCMonth()).toBe(7); // August
      expect(bounds.currentTermEnd.getUTCMonth()).toBe(1); // February
    });
  });

  describe("isWithinLeadWindow", () => {
    test("returns true when within lead window", () => {
      const termEnd = new Date("2026-02-01T08:00:00.000Z");
      const now = new Date("2026-01-15T20:00:00.000Z"); // 17 days before
      expect(isWithinLeadWindow(now, termEnd, 60)).toBe(true);
    });

    test("returns false when before lead window", () => {
      const termEnd = new Date("2026-02-01T08:00:00.000Z");
      const now = new Date("2025-11-01T20:00:00.000Z"); // Way before
      expect(isWithinLeadWindow(now, termEnd, 60)).toBe(false);
    });

    test("returns false when after term end", () => {
      const termEnd = new Date("2026-02-01T08:00:00.000Z");
      const now = new Date("2026-02-15T20:00:00.000Z"); // After
      expect(isWithinLeadWindow(now, termEnd, 60)).toBe(false);
    });

    test("works with different lead day values", () => {
      const termEnd = new Date("2026-02-01T08:00:00.000Z");
      const now = new Date("2026-01-25T20:00:00.000Z"); // 7 days before

      // Should be within 30-day window
      expect(isWithinLeadWindow(now, termEnd, 30)).toBe(true);

      // Should NOT be within 5-day window
      expect(isWithinLeadWindow(now, termEnd, 5)).toBe(false);
    });
  });
});
