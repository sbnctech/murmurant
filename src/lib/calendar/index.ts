/**
 * Calendar module exports
 *
 * Provides ICS generation for calendar integration with
 * Google Calendar, Apple Calendar, and Outlook.
 *
 * See: docs/ARCH/CALENDAR_TIME_MODEL.md for design rationale.
 */

export {
  generateIcs,
  generateSingleEventIcs,
  generateVEvent,
  generateVTimezone,
  escapeIcsText,
  foldLine,
  formatDtstamp,
  formatLocalDateTime,
  formatDateOnly,
  generateUid,
} from "./ics";

export type { IcsEventInput, IcsOptions } from "./ics";
