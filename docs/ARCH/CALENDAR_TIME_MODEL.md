# Calendar and Time Model

Defines how ClubOS stores, computes, and displays dates, times, and timezones.

**Last Updated:** 2025-12-25
**Charter Reference:** P4 (No hidden rules), P6 (Human-first terminology)
**Related:** docs/policy/POLICY_CROSSWALK.md (EVENT-009 through EVENT-011)

Copyright (c) Santa Barbara Newcomers Club

---

## Overview

ClubOS handles three categories of temporal data:

1. **Instant Events** - Events with specific start/end times (most club events)
2. **All-Day Events** - Date-only events without specific times (future capability)
3. **Recurring Events** - Events with repetition rules (future capability)

This document defines how each category works and how they map to external calendar systems.

---

## Current Implementation

### Storage Model

All event times are stored as **UTC instants** in the database:

```
startTime: DateTime (UTC)
endTime:   DateTime (UTC, nullable)
```

The organization's timezone is stored as policy, not per-event:

```typescript
getPolicy("scheduling.timezone", { orgId }) // Returns IANA timezone ID
```

For SBNC, this is `America/Los_Angeles` (Pacific Time).

### Display Model

When displaying times to users, we convert UTC instants to the organization's timezone:

```typescript
import { formatClubDateTime } from "@/lib/timezone";

// Converts UTC instant to Pacific time for display
formatClubDateTime(event.startTime); // "Dec 15, 2025, 10:00 AM"
```

### Scheduling Calculations

Date-based scheduling (e.g., "next Sunday", "following Tuesday") uses the organization's timezone for day boundaries:

```typescript
import { SBNC_TIMEZONE, getNextSunday } from "@/lib/events/scheduling";

// Day-of-week calculated in Pacific timezone
const nextSunday = getNextSunday(now);
```

---

## Event Types

### Instant Events (Current)

Events with specific start and end times.

| Property | Type | Description |
|----------|------|-------------|
| startTime | DateTime (UTC) | When the event starts |
| endTime | DateTime (UTC) | When the event ends (nullable, defaults to +2 hours) |
| Display TZID | Policy | Organization timezone for display |

### All-Day Events (Future)

Date-only events without specific times. NOT YET IMPLEMENTED.

When implemented, will use:

| Property | Type | Description |
|----------|------|-------------|
| startDate | Date (YYYY-MM-DD) | Event date (no time component) |
| endDateExclusive | Date (YYYY-MM-DD) | Day after last event day |

### Recurring Events (Future)

Events with repetition rules. NOT YET IMPLEMENTED.

When implemented, will require:

| Property | Type | Description |
|----------|------|-------------|
| tzid | string | IANA timezone for recurrence calculation |
| localTime | string | Wall-clock time (HH:MM) in tzid |
| durationMinutes | number | Event duration |
| rrule | string | iCalendar RRULE string |

Recurrence MUST be calculated in the event's timezone to handle DST correctly. A "10:00 AM every Tuesday" event stays at 10:00 AM local time across DST boundaries.

---

## Timezone Handling

### IANA Timezone IDs

ClubOS uses IANA timezone identifiers (e.g., `America/Los_Angeles`). These are:

- Unambiguous (unlike "PST" which some systems interpret differently)
- DST-aware (include DST transitions for spring forward / fall back)
- Widely supported (JavaScript, iCalendar, Google Calendar, Apple Calendar)

**Valid:**
- `America/Los_Angeles`
- `America/New_York`
- `Europe/London`
- `UTC`

**Invalid:**
- `PST` (ambiguous)
- `Pacific Time` (not an IANA ID)
- `GMT-8` (does not handle DST)

### Day Boundaries

When determining "what day is it?" for scheduling purposes, ClubOS uses the organization's timezone:

```typescript
// Midnight Pacific determines club day boundaries
import { clubYmdString, startOfClubDayUtc } from "@/lib/timezone";

clubYmdString(new Date("2025-12-15T07:59:59.000Z")); // "2025-12-14" (still Saturday in Pacific)
clubYmdString(new Date("2025-12-15T08:00:00.000Z")); // "2025-12-15" (now Sunday in Pacific)
```

### DST Transitions

The codebase correctly handles DST transitions:

- **Spring Forward (March):** 2 AM becomes 3 AM; 2:30 AM does not exist
- **Fall Back (November):** 2 AM occurs twice; we use the first occurrence

Test coverage exists in `tests/unit/timezone.spec.ts` for DST edge cases.

---

## Policy Configuration

Scheduling behavior is controlled by organization policies:

| Policy Key | Type | Default | Description |
|------------|------|---------|-------------|
| `scheduling.timezone` | string | America/Los_Angeles | Organization timezone (IANA format) |
| `scheduling.registrationOpenDay` | number | 2 | Day of week for registration opens (0=Sunday) |
| `scheduling.registrationOpenHour` | number | 8 | Hour for registration opens (0-23) |
| `scheduling.announcementDay` | number | 0 | Day of week for announcements (0=Sunday) |
| `scheduling.announcementHour` | number | 8 | Hour for announcements (0-23) |
| `scheduling.eventArchiveDays` | number | 30 | Days after event end to archive |

See: `src/lib/policy/getPolicy.ts`

---

## iCalendar Interoperability

ClubOS generates iCalendar (.ics) files compatible with:

- Google Calendar
- Apple Calendar (macOS/iOS)
- Microsoft Outlook
- Any RFC 5545-compliant client

---

### Pattern 1: Timed Event in UTC (Current ClubOS Output)

Use UTC instants with Z suffix. This is the most interoperable format.

```
BEGIN:VEVENT
UID:evt_abc123@sbnc.clubos
DTSTAMP:20251215T120000Z
DTSTART:20251215T180000Z
DTEND:20251215T200000Z
SUMMARY:Holiday Mixer
LOCATION:123 Main St, Santa Barbara, CA
DESCRIPTION:Join us for holiday festivities!
END:VEVENT
```

**Properties:**

- `DTSTART:20251215T180000Z` means December 15, 2025 at 18:00:00 UTC
- The Z suffix indicates UTC (Zulu time)
- Client software converts to local time for display
- No ambiguity about which instant in time is meant

**When to use:** Single events without recurrence (ClubOS current model).

---

### Pattern 2: Timed Event with TZID (For Recurring Events)

Use TZID when wall-clock time matters across DST transitions.

```
BEGIN:VEVENT
UID:evt_recurring_456@sbnc.clubos
DTSTAMP:20251215T120000Z
DTSTART;TZID=America/Los_Angeles:20251215T100000
DTEND;TZID=America/Los_Angeles:20251215T120000
RRULE:FREQ=WEEKLY;BYDAY=TU;COUNT=10
SUMMARY:Tuesday Coffee
LOCATION:Starbucks, 3890 State St
END:VEVENT
```

**Properties:**

- `DTSTART;TZID=America/Los_Angeles:20251215T100000` means 10:00 AM Pacific
- No Z suffix (this is local time, not UTC)
- The TZID must be a valid IANA timezone identifier
- Recurrence calculated in specified timezone

**When to use:** Recurring events where "10:00 AM" should remain "10:00 AM" across DST.

---

### Pattern 3: All-Day Event (VALUE=DATE)

All-day events use date-only values with exclusive end dates.

```
BEGIN:VEVENT
UID:evt_allday_789@sbnc.clubos
DTSTAMP:20251215T120000Z
DTSTART;VALUE=DATE:20251225
DTEND;VALUE=DATE:20251226
SUMMARY:Christmas Day - Club Office Closed
END:VEVENT
```

**Properties:**

- `DTSTART;VALUE=DATE:20251225` means December 25, 2025 (entire day)
- `DTEND;VALUE=DATE:20251226` is EXCLUSIVE (one day after last day)
- No time component, no timezone
- A single-day event has DTEND = DTSTART + 1 day

**Multi-day all-day event example:**

```
DTSTART;VALUE=DATE:20251224
DTEND;VALUE=DATE:20251227
```

This spans December 24, 25, and 26 (three full days). December 27 is NOT included.

**When to use:** Holidays, closures, deadlines without specific times.

---

### DST Behavior for Recurring Events

Daylight Saving Time affects recurring events differently based on format.

**UTC recurrence (problematic for local-time events):**

```
DTSTART:20250310T180000Z
RRULE:FREQ=WEEKLY;BYDAY=MO
```

- Before DST (winter): 18:00 UTC = 10:00 AM Pacific
- After DST (summer): 18:00 UTC = 11:00 AM Pacific
- The event "drifts" by one hour when DST changes

**TZID recurrence (correct for local-time events):**

```
DTSTART;TZID=America/Los_Angeles:20250310T100000
RRULE:FREQ=WEEKLY;BYDAY=MO
```

- Before DST: 10:00 AM Pacific
- After DST: 10:00 AM Pacific (still)
- Wall-clock time preserved; underlying UTC instant changes

**Spring forward edge case:**

If an event is scheduled for 2:30 AM on a DST spring-forward day, that time does not exist (clocks jump from 2:00 AM to 3:00 AM). Behavior varies by client; most skip to 3:00 AM or 3:30 AM.

**Fall back edge case:**

If an event is scheduled for 1:30 AM on a DST fall-back day, that time occurs twice. Most clients use the first occurrence (before the clocks change back).

---

### Calendar Client Behavior (Observed Patterns)

Different calendar clients handle ICS data with minor variations. These observations are based on common behavior and may change with client updates.

**Google Calendar:**

- Accepts UTC (Z suffix) and TZID formats
- Converts to user's local timezone for display
- Displays all-day events correctly with VALUE=DATE
- Handles RRULE expansion for recurring events
- May show timezone name in event details

**Apple Calendar (macOS/iOS):**

- Accepts UTC and TZID formats
- Associates events with a "Time Zone" visible in event info
- VALUE=DATE all-day events span the calendar day in any timezone
- Travel time features may use event timezone
- iCloud sync generally preserves timezone data

**Microsoft Outlook:**

- Accepts UTC and TZID formats
- Desktop and web versions may display timezone differently
- Older versions may have issues with uncommon IANA timezone IDs
- VALUE=DATE handling is generally reliable
- Exchange server may convert timezones during sync

**General compatibility notes:**

- UTC format (Z suffix) is universally understood
- IANA timezone IDs are widely supported (America/Los_Angeles, not PST)
- VALUE=DATE all-day events work consistently across clients
- RRULE support is generally good but edge cases vary
- VTIMEZONE blocks are optional when using IANA IDs with modern clients

---

### ICS Generation Best Practices

1. **Use UTC for single events** - DTSTART/DTEND with Z suffix (current approach)
2. **Use TZID for recurring events** - Preserves wall-clock time across DST
3. **Use VALUE=DATE for all-day events** - No timezone ambiguity
4. **Include DTSTAMP** - Current time when ICS was generated (required by spec)
5. **Use stable UID** - Event ID + domain for uniqueness and update detection
6. **Escape special characters** - Commas, semicolons, backslashes, newlines
7. **Line folding** - Lines longer than 75 octets should be folded (RFC 5545)

---

### Complete ICS File Example

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Santa Barbara Newcomers Club//ClubOS//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:evt_abc123@sbnc.clubos
DTSTAMP:20251215T120000Z
DTSTART:20251215T180000Z
DTEND:20251215T200000Z
SUMMARY:Holiday Mixer
LOCATION:123 Main St\, Santa Barbara\, CA 93101
DESCRIPTION:Join us for holiday festivities!\n\nPlease RSVP by Dec 10.
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR
```

**Note:** Commas in LOCATION are escaped with backslash. Newlines in DESCRIPTION use `\n`.

---

## What We Do and Do Not Do

### We Do

- Store all times as UTC instants in the database
- Display times in the organization's configured timezone
- Use Intl.DateTimeFormat for timezone-aware formatting
- Calculate day-of-week in organization timezone for scheduling
- Handle DST transitions correctly
- Generate iCalendar with UTC instants (Z suffix)
- Validate timezone IDs against IANA database

### We Do Not (Currently)

- Store per-event timezone (all events use org timezone)
- Support all-day events as a distinct type
- Support recurring events with RRULE
- Support timezone conversion in UI (users see org timezone only)
- Support arbitrary timezone selection per event

### We Will Not (By Design)

- Use ambiguous timezone abbreviations (PST, EST, PDT)
- Rely on server local timezone for any calculation
- Store times as local datetime without timezone info
- Use JavaScript Date methods that depend on runtime timezone

---

## Testing Requirements

See: docs/CI/TIME_AND_TIMEZONE_RULES.md

All time-related tests must:

1. Freeze the clock to a known instant
2. Explicitly specify timezone for all conversions
3. Not assume "today" or "current day of week"
4. Cover DST transition edge cases where relevant

---

## Related Files

| File | Purpose |
|------|---------|
| `src/lib/timezone.ts` | Core timezone utilities |
| `src/lib/events/scheduling.ts` | Event scheduling logic |
| `src/lib/policy/getPolicy.ts` | Policy access layer |
| `tests/unit/timezone.spec.ts` | Timezone tests |
| `tests/unit/events/scheduling.spec.ts` | Scheduling tests |

---

## Revision History

| Date | Change |
|------|--------|
| 2025-12-25 | Initial document with iCalendar interop section |
