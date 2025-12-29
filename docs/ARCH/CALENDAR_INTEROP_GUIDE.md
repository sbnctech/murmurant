# Calendar Interoperability Guide

Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

This document describes how Murmurant calendar data interoperates with Google
Calendar, Apple Calendar, and Microsoft Outlook using the iCalendar standard.

---

## Overview

Murmurant exports event data in iCalendar format (RFC 5545). This format is
universally supported by major calendar applications. When users subscribe
to or import Murmurant calendars, their calendar client interprets the data
according to their local timezone settings.

**Key principle**: Murmurant stores and exports precise UTC instants with
timezone identifiers (TZID). Calendar clients are responsible for displaying
events in the user's local timezone.

---

## Event Types and iCalendar Semantics

### 1. Timed Events (UTC Instants + TZID)

Timed events have a specific start and end time. Murmurant exports these as
UTC timestamps with an associated TZID for the club's timezone.

**What Murmurant exports:**
- DTSTART with TZID (e.g., `DTSTART;TZID=America/Los_Angeles:20250215T100000`)
- DTEND with TZID
- VTIMEZONE component defining the timezone rules

**Example: Single Timed Event**

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Murmurant//Event Export//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VTIMEZONE
TZID:America/Los_Angeles
BEGIN:STANDARD
DTSTART:19701101T020000
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
TZOFFSETFROM:-0700
TZOFFSETTO:-0800
TZNAME:PST
END:STANDARD
BEGIN:DAYLIGHT
DTSTART:19700308T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
TZOFFSETFROM:-0800
TZOFFSETTO:-0700
TZNAME:PDT
END:DAYLIGHT
END:VTIMEZONE
BEGIN:VEVENT
UID:event-abc123@murmurant.example.com
DTSTAMP:20250115T120000Z
DTSTART;TZID=America/Los_Angeles:20250215T100000
DTEND;TZID=America/Los_Angeles:20250215T120000
SUMMARY:Monthly Luncheon
DESCRIPTION:Join us for our monthly luncheon at the Garden Restaurant.
LOCATION:Garden Restaurant, 123 Main St, Santa Barbara, CA
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR
```

**How clients interpret this:**

| Client | Behavior |
|--------|----------|
| Google Calendar | Displays 10:00 AM - 12:00 PM Pacific. If user is in Eastern time, shows 1:00 PM - 3:00 PM. |
| Apple Calendar | Same behavior. Uses VTIMEZONE to handle DST transitions correctly. |
| Outlook | Same behavior. Converts to user's local timezone for display. |

### 2. All-Day Events (DATE only)

All-day events span an entire calendar day and have no specific time.
Murmurant exports these using DATE values (no time component).

**What Murmurant exports:**
- DTSTART with VALUE=DATE (e.g., `DTSTART;VALUE=DATE:20250401`)
- DTEND with VALUE=DATE (day after the event ends)
- No VTIMEZONE needed for all-day events

**Example: All-Day Event**

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Murmurant//Event Export//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:event-xyz789@murmurant.example.com
DTSTAMP:20250115T120000Z
DTSTART;VALUE=DATE:20250401
DTEND;VALUE=DATE:20250402
SUMMARY:Membership Renewal Deadline
DESCRIPTION:Last day to renew your membership for the upcoming year.
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR
```

**How clients interpret this:**

| Client | Behavior |
|--------|----------|
| Google Calendar | Shows as all-day event on April 1. No timezone conversion. |
| Apple Calendar | Same. Appears on April 1 regardless of user's timezone. |
| Outlook | Same. Renders as banner across the entire day. |

**Note**: All-day events are date-anchored, not instant-anchored. A user in
Tokyo sees the same calendar date (April 1) as a user in Los Angeles.

### 3. Recurring Events (RRULE + TZID)

Recurring events repeat according to a pattern. Murmurant exports these with
RRULE (recurrence rule) and TZID to ensure correct handling across DST.

**What Murmurant exports:**
- DTSTART with TZID
- RRULE defining the recurrence pattern
- VTIMEZONE component

**Example: Weekly Recurring Event**

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Murmurant//Event Export//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VTIMEZONE
TZID:America/Los_Angeles
BEGIN:STANDARD
DTSTART:19701101T020000
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
TZOFFSETFROM:-0700
TZOFFSETTO:-0800
TZNAME:PST
END:STANDARD
BEGIN:DAYLIGHT
DTSTART:19700308T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
TZOFFSETFROM:-0800
TZOFFSETTO:-0700
TZNAME:PDT
END:DAYLIGHT
END:VTIMEZONE
BEGIN:VEVENT
UID:event-weekly-456@murmurant.example.com
DTSTAMP:20250115T120000Z
DTSTART;TZID=America/Los_Angeles:20250107T140000
DTEND;TZID=America/Los_Angeles:20250107T160000
RRULE:FREQ=WEEKLY;BYDAY=TU;COUNT=12
SUMMARY:Book Club Meeting
DESCRIPTION:Weekly book club discussion. This week: Chapter 5.
LOCATION:Community Center, Room 101
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR
```

**How clients interpret this:**

| Client | Behavior |
|--------|----------|
| Google Calendar | Creates 12 weekly occurrences on Tuesdays at 2:00 PM Pacific. Adjusts for DST automatically (event stays at 2 PM local time). |
| Apple Calendar | Same. VTIMEZONE ensures correct offset before and after DST. |
| Outlook | Same. Each occurrence respects the local time, not the UTC offset. |

**DST handling**: The TZID ensures that "2:00 PM Pacific" remains 2:00 PM
even when clocks change. Without TZID, a March meeting might suddenly appear
at 3:00 PM after DST begins.

---

## What Murmurant Guarantees

Murmurant provides the following guarantees for calendar interoperability:

1. **Correct TZID assignment**: All timed events include `America/Los_Angeles`
   as the timezone identifier.

2. **VTIMEZONE components**: Exported calendars include the VTIMEZONE block
   with correct DST rules for Pacific time.

3. **Stable UIDs**: Each event has a unique, stable UID that allows calendar
   clients to update existing events rather than creating duplicates.

4. **RFC 5545 compliance**: Exported iCalendar data follows the RFC 5545
   specification for maximum compatibility.

5. **All-day events use DATE**: Events marked as all-day use DATE values
   (not DATETIME) to prevent timezone-related day shifts.

6. **DTSTAMP in UTC**: The DTSTAMP property (event creation/modification
   timestamp) is always in UTC.

---

## What is Handled by the Calendar Client

The following behaviors are controlled by the user's calendar application,
not by Murmurant:

1. **Local timezone display**: Calendar clients convert event times to the
   user's local timezone for display. A 10 AM Pacific event shows as 1 PM
   for a user in New York.

2. **Notification timing**: Reminder alerts are calculated by the calendar
   client based on the event's start time in the user's timezone.

3. **Calendar view rendering**: How events appear in day/week/month views
   is determined by the client application.

4. **Sync frequency**: How often the client refreshes subscribed calendars
   (typically 15 minutes to 24 hours).

5. **Conflict detection**: Calendar clients may highlight scheduling
   conflicts with other events in the user's calendar.

6. **Recurring event exceptions**: If a user's calendar allows editing
   single instances of a recurring event, that is client-side behavior.

---

## What Murmurant Does NOT Attempt to Normalize

Murmurant explicitly does not attempt to:

1. **Convert times for the user**: We export in club timezone. Conversion
   is the client's responsibility.

2. **Handle floating time**: We do not use floating time (DATETIME without
   TZID). All timed events have explicit timezone context.

3. **Support proprietary extensions**: We use standard iCalendar properties.
   Client-specific features (Google Meet links, Outlook categories) are
   not generated.

4. **Manage client-side alarm preferences**: We may include VALARM for
   default reminders, but users can override in their client.

5. **Guarantee real-time sync**: Calendar subscription refresh rates vary
   by client. Changes may take minutes to hours to appear.

6. **Handle calendar sharing permissions**: Access control is managed by
   the calendar service (Google, Apple, Microsoft), not by Murmurant.

---

## Client-Specific Notes

### Google Calendar

- Subscription URL format: `webcal://` or `https://` both work
- Refresh interval: Typically every 12-24 hours for subscribed calendars
- VTIMEZONE: Fully supported, uses IANA timezone database
- RRULE: Full support including UNTIL, COUNT, INTERVAL, BYDAY

### Apple Calendar (macOS/iOS)

- Subscription URL format: `webcal://` preferred
- Refresh interval: Configurable (5 minutes to 1 week)
- VTIMEZONE: Fully supported
- RRULE: Full support; handles complex recurrence patterns well
- Note: iOS may cache aggressively; manual refresh sometimes needed

### Microsoft Outlook

- Subscription URL format: `https://` (Outlook.com), varies for desktop
- Refresh interval: Approximately 3 hours for Outlook.com
- VTIMEZONE: Supported, but Outlook may use Windows timezone names internally
- RRULE: Supported with some edge-case limitations for very complex rules
- Note: Outlook desktop and Outlook.com may behave slightly differently

---

## Troubleshooting Common Issues

### Event appears on wrong day

**Symptom**: An event shows up on a different day than expected.

**Cause**: Usually occurs when DATETIME is used without TZID for a timed
event, or when VALUE=DATE is missing for an all-day event.

**Murmurant mitigation**: Always include TZID for timed events; use VALUE=DATE
for all-day events.

### Event time shifts after DST

**Symptom**: After DST transition, recurring event appears at wrong time.

**Cause**: Event was stored with UTC offset instead of TZID.

**Murmurant mitigation**: Always use TZID, never raw UTC offsets like `-08:00`.
The VTIMEZONE component defines DST rules.

### Duplicate events after sync

**Symptom**: Same event appears multiple times.

**Cause**: UID changed between exports, or client imported instead of
subscribed.

**Murmurant mitigation**: Stable UIDs based on event ID. Users should subscribe
(not import) for ongoing sync.

### Changes not appearing

**Symptom**: Event was updated in Murmurant but calendar still shows old info.

**Cause**: Calendar client hasn't refreshed yet.

**Resolution**: Manual refresh in calendar client, or wait for next sync
cycle. Not a Murmurant issue.

---

## Summary

| Aspect | Murmurant Responsibility | Client Responsibility |
|--------|----------------------|----------------------|
| Timezone assignment | Yes (TZID=America/Los_Angeles) | No |
| DST rules | Yes (VTIMEZONE component) | Apply rules to display |
| Local time display | No | Yes |
| All-day date anchoring | Yes (VALUE=DATE) | Render correctly |
| Stable event identity | Yes (UID) | Honor UID for updates |
| Sync frequency | Provide endpoint | Determine refresh rate |
| Recurrence expansion | Define RRULE | Expand instances |

---

## Related Documents

- [INTENT_MANIFEST_SCHEMA.md](INTENT_MANIFEST_SCHEMA.md) - Event data structure
- [../CI/TIME_AND_TIMEZONE_RULES.md](../CI/TIME_AND_TIMEZONE_RULES.md) - Time handling rules

## References

- RFC 5545: Internet Calendaring and Scheduling (iCalendar)
- IANA Time Zone Database: https://www.iana.org/time-zones
