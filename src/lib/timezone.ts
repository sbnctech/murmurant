// Copyright (c) Santa Barbara Newcomers Club
// Timezone utility helpers for consistent date/time handling
//
// POLICY: All dates stored as UTC. All business logic uses America/Los_Angeles.
// See ARCHITECTURE.md and SYSTEM_SPEC.md for the full timezone policy.

/**
 * The canonical business timezone for the club.
 * All user-facing dates and day-boundary logic use this timezone.
 */
export const CLUB_TIMEZONE = "America/Los_Angeles";

/**
 * Format a UTC date for display in the club timezone.
 * Returns an object with formatted date parts for flexible rendering.
 *
 * @param dateUtc - A Date object (typically from database, stored as UTC)
 * @returns Formatted date/time parts in Pacific Time
 */
export function toClubDateTime(dateUtc: Date): {
  date: string; // e.g., "12/15/2025"
  time: string; // e.g., "2:30 PM"
  weekday: string; // e.g., "Monday"
  full: string; // e.g., "Monday, December 15, 2025 at 2:30 PM"
  iso: string; // ISO string in club timezone (for debugging)
} {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: CLUB_TIMEZONE,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const parts = formatter.formatToParts(dateUtc);
  const partsMap: Record<string, string> = {};
  for (const part of parts) {
    partsMap[part.type] = part.value;
  }

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: CLUB_TIMEZONE,
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });

  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: CLUB_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  // Build ISO-like string for debugging (not true ISO, but useful)
  const isoFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: CLUB_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const isoParts = isoFormatter.formatToParts(dateUtc);
  const isoMap: Record<string, string> = {};
  for (const part of isoParts) {
    isoMap[part.type] = part.value;
  }

  return {
    date: dateFormatter.format(dateUtc),
    time: timeFormatter.format(dateUtc),
    weekday: partsMap.weekday || "",
    full: formatter.format(dateUtc),
    iso: `${isoMap.year}-${isoMap.month}-${isoMap.day}T${isoMap.hour}:${isoMap.minute}:${isoMap.second}`,
  };
}

/**
 * Get the start of the club day (00:00 Pacific) for a given UTC date.
 * This is the canonical day boundary for all business logic.
 *
 * @param dateUtc - A Date object to find the start of day for
 * @returns A new Date representing 00:00:00 Pacific Time for that calendar day
 */
export function startOfClubDay(dateUtc: Date): Date {
  // Get the date parts in club timezone
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: CLUB_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const dateStr = formatter.format(dateUtc); // e.g., "2025-12-15"

  // Parse and create a date at midnight in the club timezone
  // We need to find what UTC time corresponds to 00:00 Pacific on this date
  const [year, month, day] = dateStr.split("-").map(Number);

  // Create a date in UTC that we'll adjust
  // Start with noon UTC on that day (to avoid DST edge cases in initial calc)
  const tempDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));

  // Get the offset for that moment in Pacific time
  const offsetMinutes = getTimezoneOffsetMinutes(tempDate);

  // 00:00 Pacific = 00:00 + offset in UTC
  // If offset is -480 (PST, UTC-8), then 00:00 Pacific = 08:00 UTC
  // If offset is -420 (PDT, UTC-7), then 00:00 Pacific = 07:00 UTC
  const midnightUtc = new Date(
    Date.UTC(year, month - 1, day, 0, 0, 0, 0) - offsetMinutes * 60 * 1000
  );

  return midnightUtc;
}

/**
 * Check if two UTC dates fall on the same club calendar day.
 *
 * @param aUtc - First date (UTC)
 * @param bUtc - Second date (UTC)
 * @returns true if both dates are on the same Pacific Time calendar day
 */
export function isSameClubDay(aUtc: Date, bUtc: Date): boolean {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: CLUB_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(aUtc) === formatter.format(bUtc);
}

/**
 * Get the club calendar date string (YYYY-MM-DD) for a UTC date.
 * Useful for date comparisons and database queries.
 *
 * @param dateUtc - A Date object (UTC)
 * @returns Date string in YYYY-MM-DD format, in club timezone
 */
export function toClubDateString(dateUtc: Date): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: CLUB_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(dateUtc);
}

/**
 * Get the current date/time in the club timezone.
 *
 * @returns The current time as a Date, with utility methods for club time
 */
export function nowInClubTime(): Date {
  return new Date();
}

/**
 * Get today's date string in club timezone.
 *
 * @returns Today's date as YYYY-MM-DD in Pacific Time
 */
export function todayClubDateString(): string {
  return toClubDateString(new Date());
}

/**
 * Get the timezone offset in minutes for a given date in the club timezone.
 * Negative values indicate west of UTC (e.g., -480 for PST, -420 for PDT).
 *
 * @param date - The date to check the offset for
 * @returns Offset in minutes from UTC
 */
function getTimezoneOffsetMinutes(date: Date): number {
  // Create formatter that includes timezone offset info
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: CLUB_TIMEZONE,
    timeZoneName: "shortOffset",
  });

  const parts = formatter.formatToParts(date);
  const tzPart = parts.find((p) => p.type === "timeZoneName");

  if (!tzPart) {
    // Fallback: assume PST (-8 hours)
    return -480;
  }

  // Parse offset like "GMT-8" or "GMT-7"
  const match = tzPart.value.match(/GMT([+-]\d+)/);
  if (match) {
    const hours = parseInt(match[1], 10);
    return hours * 60;
  }

  // Fallback
  return -480;
}

/**
 * Check if a date is before today in club timezone.
 * Useful for checking if something has expired.
 *
 * @param dateUtc - The date to check
 * @returns true if the date is before the start of today (Pacific Time)
 */
export function isBeforeToday(dateUtc: Date): boolean {
  const todayStart = startOfClubDay(new Date());
  return dateUtc < todayStart;
}

/**
 * Check if a date is today or later in club timezone.
 *
 * @param dateUtc - The date to check
 * @returns true if the date is today or in the future (Pacific Time)
 */
export function isTodayOrLater(dateUtc: Date): boolean {
  const todayStart = startOfClubDay(new Date());
  return dateUtc >= todayStart;
}
