/**
 * ICS (iCalendar) Generator
 *
 * Generates RFC 5545 compliant ICS files for calendar integration with
 * Google Calendar, Apple Calendar, and Outlook.
 *
 * Key semantics enforced:
 * - TZID uses IANA timezone names (e.g., America/Los_Angeles)
 * - DTSTART/DTEND for timed events include TZID parameter
 * - All-day events use VALUE=DATE format with exclusive end date
 * - UID is globally unique per event
 * - DTSTAMP is always UTC
 *
 * Reference: RFC 5545 - Internet Calendaring and Scheduling (iCalendar)
 */

import { CLUB_TIMEZONE } from "../timezone";

/**
 * Minimal event interface for ICS generation.
 * Compatible with Prisma Event model.
 */
export interface IcsEventInput {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startTime: Date;
  endTime?: Date | null;
  /** If true, generates VALUE=DATE format (all-day event) */
  isAllDay?: boolean;
}

/**
 * Options for ICS generation.
 */
export interface IcsOptions {
  /** IANA timezone name. Defaults to CLUB_TIMEZONE. */
  timezone?: string;
  /** Product identifier for PRODID. Defaults to Murmurant. */
  prodId?: string;
  /** Base URL for generating unique UIDs. */
  baseUrl?: string;
}

const DEFAULT_PROD_ID = "-//Murmurant//Event Calendar//EN";
const DEFAULT_BASE_URL = "murmurant.app";

/**
 * Escapes special characters in ICS text fields per RFC 5545 Section 3.3.11.
 * Escapes: backslash, semicolon, comma, newline.
 */
export function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Folds long lines per RFC 5545 Section 3.1.
 * Lines longer than 75 octets are folded with CRLF + single whitespace.
 */
export function foldLine(line: string): string {
  const maxLen = 75;
  if (line.length <= maxLen) {
    return line;
  }

  const result: string[] = [];
  let remaining = line;

  // First line can be full 75 chars
  result.push(remaining.slice(0, maxLen));
  remaining = remaining.slice(maxLen);

  // Continuation lines start with space, so only 74 chars of content
  while (remaining.length > 0) {
    // RFC allows 75 octets including the leading space
    result.push(" " + remaining.slice(0, maxLen - 1));
    remaining = remaining.slice(maxLen - 1);
  }

  return result.join("\r\n");
}

/**
 * Formats a Date as ICS DTSTAMP (always UTC).
 * Format: YYYYMMDDTHHMMSSZ
 */
export function formatDtstamp(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  const ss = String(date.getUTCSeconds()).padStart(2, "0");
  return `${y}${m}${d}T${hh}${mm}${ss}Z`;
}

/**
 * Formats a Date as ICS local datetime with TZID.
 * Format: YYYYMMDDTHHMMSS (no Z suffix - TZID parameter handles timezone)
 */
export function formatLocalDateTime(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "00";

  const y = get("year");
  const m = get("month");
  const d = get("day");
  const hh = get("hour");
  const mm = get("minute");
  const ss = get("second");

  return `${y}${m}${d}T${hh}${mm}${ss}`;
}

/**
 * Formats a Date as ICS VALUE=DATE (all-day event).
 * Format: YYYYMMDD
 */
export function formatDateOnly(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "00";

  return `${get("year")}${get("month")}${get("day")}`;
}

/**
 * Generates a globally unique UID for an event.
 * Format: {eventId}@{baseUrl}
 */
export function generateUid(eventId: string, baseUrl: string): string {
  return `${eventId}@${baseUrl}`;
}

/**
 * Generates a VEVENT block for a single event.
 */
export function generateVEvent(
  event: IcsEventInput,
  options: IcsOptions = {},
): string {
  const timezone = options.timezone ?? CLUB_TIMEZONE;
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;

  const lines: string[] = [];
  lines.push("BEGIN:VEVENT");

  // UID: Globally unique identifier
  lines.push(foldLine(`UID:${generateUid(event.id, baseUrl)}`));

  // DTSTAMP: Always UTC, required by RFC 5545
  lines.push(`DTSTAMP:${formatDtstamp(new Date())}`);

  // DTSTART/DTEND handling
  if (event.isAllDay) {
    // All-day events use VALUE=DATE format
    lines.push(
      `DTSTART;VALUE=DATE:${formatDateOnly(event.startTime, timezone)}`,
    );

    if (event.endTime) {
      // RFC 5545: DTEND for VALUE=DATE is exclusive (day after last day)
      const exclusiveEnd = new Date(event.endTime);
      exclusiveEnd.setDate(exclusiveEnd.getDate() + 1);
      lines.push(
        `DTEND;VALUE=DATE:${formatDateOnly(exclusiveEnd, timezone)}`,
      );
    }
  } else {
    // Timed events include TZID parameter
    lines.push(
      `DTSTART;TZID=${timezone}:${formatLocalDateTime(event.startTime, timezone)}`,
    );

    if (event.endTime) {
      lines.push(
        `DTEND;TZID=${timezone}:${formatLocalDateTime(event.endTime, timezone)}`,
      );
    }
  }

  // SUMMARY (title) - required
  lines.push(foldLine(`SUMMARY:${escapeIcsText(event.title)}`));

  // DESCRIPTION - optional
  if (event.description) {
    lines.push(foldLine(`DESCRIPTION:${escapeIcsText(event.description)}`));
  }

  // LOCATION - optional
  if (event.location) {
    lines.push(foldLine(`LOCATION:${escapeIcsText(event.location)}`));
  }

  lines.push("END:VEVENT");

  return lines.join("\r\n");
}

/**
 * Generates VTIMEZONE block for the specified IANA timezone.
 *
 * NOTE: This generates a minimal VTIMEZONE. For full DST handling,
 * production systems should use a VTIMEZONE database (e.g., vzic output).
 * Most modern calendar clients handle TZID without embedded VTIMEZONE.
 */
export function generateVTimezone(timezone: string): string {
  // For America/Los_Angeles, generate PST/PDT rules
  if (timezone === "America/Los_Angeles") {
    return [
      "BEGIN:VTIMEZONE",
      "TZID:America/Los_Angeles",
      "BEGIN:DAYLIGHT",
      "TZOFFSETFROM:-0800",
      "TZOFFSETTO:-0700",
      "TZNAME:PDT",
      "DTSTART:19700308T020000",
      "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
      "END:DAYLIGHT",
      "BEGIN:STANDARD",
      "TZOFFSETFROM:-0700",
      "TZOFFSETTO:-0800",
      "TZNAME:PST",
      "DTSTART:19701101T020000",
      "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU",
      "END:STANDARD",
      "END:VTIMEZONE",
    ].join("\r\n");
  }

  // For other timezones, generate a placeholder
  return [
    "BEGIN:VTIMEZONE",
    `TZID:${timezone}`,
    "BEGIN:STANDARD",
    "TZOFFSETFROM:+0000",
    "TZOFFSETTO:+0000",
    "TZNAME:UTC",
    "DTSTART:19700101T000000",
    "END:STANDARD",
    "END:VTIMEZONE",
  ].join("\r\n");
}

/**
 * Generates a complete VCALENDAR containing one or more events.
 */
export function generateIcs(
  events: IcsEventInput[],
  options: IcsOptions = {},
): string {
  const prodId = options.prodId ?? DEFAULT_PROD_ID;
  const timezone = options.timezone ?? CLUB_TIMEZONE;

  const lines: string[] = [];

  // VCALENDAR header
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push(foldLine(`PRODID:${prodId}`));
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:PUBLISH");

  // Include VTIMEZONE if any events are timed (not all-day)
  const hasTimedEvents = events.some((e) => !e.isAllDay);
  if (hasTimedEvents) {
    lines.push(generateVTimezone(timezone));
  }

  // Add each event
  for (const event of events) {
    lines.push(generateVEvent(event, options));
  }

  lines.push("END:VCALENDAR");

  return lines.join("\r\n") + "\r\n";
}

/**
 * Generates ICS for a single event (convenience wrapper).
 */
export function generateSingleEventIcs(
  event: IcsEventInput,
  options: IcsOptions = {},
): string {
  return generateIcs([event], options);
}
