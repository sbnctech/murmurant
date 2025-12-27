/**
 * Test helper for freezing time in Vitest tests.
 *
 * Usage:
 *   import { freezeTime } from "@tests/helpers/freezeTime";
 *
 *   describe("my test", () => {
 *     freezeTime("2025-01-15T08:00:00-08:00"); // January 15, 2025 8 AM Pacific
 *
 *     it("should work at frozen time", () => {
 *       expect(new Date().toISOString()).toContain("2025-01-15");
 *     });
 *   });
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { vi, beforeEach, afterEach } from "vitest";

/**
 * Freeze time to a specific instant for all tests in the current describe block.
 *
 * @param isoString - ISO 8601 timestamp with timezone (e.g., "2025-01-15T08:00:00-08:00")
 *
 * IMPORTANT: Always include the timezone offset in the ISO string to avoid
 * ambiguity. The string represents a single instant in time.
 */
export function freezeTime(isoString: string): void {
  beforeEach(() => {
    const timestamp = new Date(isoString).getTime();
    if (Number.isNaN(timestamp)) {
      throw new Error("freezeTime: invalid ISO string: " + isoString);
    }
    vi.useFakeTimers();
    vi.setSystemTime(timestamp);
  });

  afterEach(() => {
    vi.useRealTimers();
  });
}

/**
 * Pacific timezone identifier for SBNC operations.
 */
export const PACIFIC_TZ = "America/Los_Angeles";

/**
 * Create a test date at a specific time in Pacific timezone.
 * Useful for creating dates that represent specific local times.
 *
 * @param year - Year
 * @param month - Month (1-12)
 * @param day - Day of month
 * @param hour - Hour (0-23), defaults to 0
 * @param minute - Minute (0-59), defaults to 0
 * @returns Date object representing that instant
 */
export function pacificDate(
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  minute: number = 0
): Date {
  // Format as ISO with Pacific offset
  // This is an approximation - for exact handling, use Intl
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const hh = String(hour).padStart(2, "0");
  const mi = String(minute).padStart(2, "0");

  // Determine if date is in DST (approximate)
  // PDT: March second Sunday to November first Sunday
  const isDST = month > 3 && month < 11;
  const offset = isDST ? "-07:00" : "-08:00";

  return new Date(`${year}-${mm}-${dd}T${hh}:${mi}:00${offset}`);
}
