# Calendar Trust and Reliability

How Murmurant handles dates, times, and calendars reliably.

**Audience:** Club officers and administrators
**Last Updated:** 2025-12-25
**Technical Reference:** docs/ARCH/CALENDAR_TIME_MODEL.md

---

## Why Time Is Surprisingly Tricky

You might think "3:00 PM on Tuesday" is straightforward. For a single person in a single place, it is. But for software that serves organizations across time zones, three things make dates and times genuinely difficult:

### Timezones

The world is divided into regions that observe different local times. When it is 10:00 AM in California, it is 1:00 PM in New York and 6:00 PM in London. Your club's members may travel, but your events happen in a specific place.

A timezone is not just "three hours behind" or "eight hours behind UTC." Timezones have names (like "America/Los_Angeles" for Pacific Time) that encode both the offset AND the rules for when that offset changes.

### Daylight Saving Time (DST)

Twice a year, most U.S. locations shift their clocks:

- **Spring Forward (March):** Clocks jump from 1:59 AM directly to 3:00 AM. The 2:00 AM hour does not exist that day.
- **Fall Back (November):** Clocks reach 1:59 AM, then return to 1:00 AM. The 1:00 AM hour happens twice.

This creates real problems. What happens to "every Tuesday at 2:00 AM" meetings during spring? What if you schedule an event for 1:30 AM on the fall-back night? Poorly designed systems produce wrong answers. Well-designed systems have explicit rules.

### "What Day Is It?" Depends on Where You Are

When it is 11:00 PM on Tuesday in California, it is already 2:00 AM Wednesday in New York and 7:00 AM Wednesday in London. If your system stores an event as "December 15" without specifying what timezone that date applies to, different calendar apps may show different dates.

---

## How Calendar Systems Represent Events

Most calendar systems (Google Calendar, Apple Calendar, Outlook) use an international standard called iCalendar. There are two main ways to represent when an event happens:

### Timed Events (Events With Specific Hours)

These are stored as "instants"--exact moments in time that are the same worldwide. Think of them as "the moment when 18 billion seconds have passed since 1970." That instant corresponds to different clock readings in different places, but it is unambiguous.

**Example:** An event at 6:00 PM Pacific on December 15, 2025 is stored as "2025-12-16T02:00:00Z" (2:00 AM on December 16 in UTC). When Google Calendar displays it, it converts back to your local time.

### All-Day Events (Date-Only Events)

These represent calendar squares, not clock times. "Company Holiday on December 25" means "the square marked December 25 on your calendar," regardless of timezone. No time conversion applies.

**Example:** An all-day event on December 25 is stored as "December 25" with no time component. Every calendar shows it on December 25.

---

## What Murmurant Does

### Storage: UTC Instants

All event times are stored as UTC instants in the database. UTC (Coordinated Universal Time) is the global reference point--it does not observe daylight saving time and provides an unambiguous timestamp.

When you create an event for "Tuesday at 10:00 AM," Murmurant calculates the corresponding UTC instant and stores that.

### Display: Named Timezones

When displaying times to you, Murmurant converts UTC instants back to your organization's configured timezone. This ensures everyone sees consistent times.

Murmurant uses IANA timezone identifiers, not abbreviations:

- **Correct:** America/Los_Angeles
- **Incorrect:** PST, PDT, Pacific

Why? Because "PST" is ambiguous (some systems interpret it as exactly -8 hours, ignoring DST rules), while "America/Los_Angeles" encodes the complete ruleset including all DST transitions.

### Scheduling: Organization Timezone Rules

When Murmurant calculates "next Tuesday" or "registration opens Sunday at 8 AM," it uses your organization's timezone. The day-of-week and hour-of-day are determined in that timezone, then converted to UTC for storage.

This means "8 AM Pacific" stays "8 AM Pacific" regardless of DST. During standard time, that is UTC-8. During daylight time, that is UTC-7. The stored UTC instant changes to maintain the same local wall-clock time.

### All-Day Events: Date-Only (Future)

Murmurant does not currently distinguish all-day events from timed events. When this capability is added, all-day events will be stored as date-only values (no time component), ensuring they appear on the correct calendar square regardless of timezone.

---

## What Murmurant Does NOT Promise

### External Calendar Rendering

When you export an event to Google Calendar or Apple Calendar, that external application is responsible for displaying it. Different calendar apps may render location, description text, or notification times slightly differently. We test with major calendar applications but cannot guarantee identical appearance across every client.

### Perfect Recurrence Support

Recurring events (repeating weekly meetings, monthly gatherings) require additional complexity that Murmurant does not currently implement. If recurring events are added in the future, they will use the organization's timezone for recurrence calculations, so "every Tuesday at 10 AM" stays at 10 AM local time across DST boundaries.

### Multi-Timezone Participants

Murmurant displays times in the organization's timezone. If a member is traveling in a different timezone, their calendar application will convert to local time, but Murmurant itself does not provide per-user timezone conversion.

---

## What You (the Operator) Decide

### Club Timezone Choice

During setup, you specify your organization's timezone using an IANA identifier. This affects:

- How all event times are displayed
- What "today" means for registration deadlines
- When scheduled emails are sent

For most U.S. clubs, use the timezone where your events physically occur. Common values:

- America/Los_Angeles (Pacific)
- America/Denver (Mountain)
- America/Chicago (Central)
- America/New_York (Eastern)

### Registration Open Hour

You configure what time of day registration opens for events (default: 8:00 AM). This is interpreted in your organization's timezone.

### Cutover Verification Steps

Before going live with Murmurant, verify that:

1. Events imported from your previous system show correct times
2. Sample calendar exports display correctly in Google Calendar and Apple Calendar
3. A test event during DST transition week shows the expected time

---

## How to Verify

Use this checklist to confirm calendar handling works correctly for your organization:

### Sample Event Comparison

Compare 3 sample events across calendar applications:

- [ ] Create a test event in Murmurant at a specific time (e.g., Tuesday 2:00 PM)
- [ ] Export to Google Calendar and verify the time displays correctly
- [ ] Export to Apple Calendar (macOS or iOS) and verify the time displays correctly
- [ ] If times differ, note the discrepancy before going live

### DST Week Sanity Check

During the weeks when DST transitions occur (second Sunday in March, first Sunday in November):

- [ ] Create a test event for the day BEFORE the transition
- [ ] Create a test event for the day AFTER the transition
- [ ] Verify both display at the expected local time
- [ ] Confirm the hour difference is correct (1:00 AM on fall-back day should not show as 12:00 AM or 2:00 AM)

### Day-of-Week Verification

For events near midnight:

- [ ] Create an event at 11:00 PM on a Tuesday
- [ ] Verify it shows as Tuesday in your calendar, not Wednesday
- [ ] Create an event at 12:30 AM on Wednesday
- [ ] Verify it shows as Wednesday, not Tuesday

---

## Glossary

**IANA Timezone:** A standardized timezone identifier maintained by the Internet Assigned Numbers Authority. Examples: America/Los_Angeles, Europe/London, Asia/Tokyo.

**UTC:** Coordinated Universal Time. The global reference for timekeeping. Does not observe DST. Often called "Zulu time" in aviation and military contexts.

**Instant:** A specific moment in time, unambiguous across all timezones. "January 1, 2025 at 00:00:00 UTC" is the same instant worldwide.

**Wall-clock time:** The time shown on a clock in a specific location. "10:00 AM in Los Angeles" is wall-clock time; it corresponds to different UTC instants depending on whether DST is in effect.

**DST (Daylight Saving Time):** The practice of advancing clocks during summer months. Creates two transition days per year where local time jumps forward or backward.

---

## Summary

Murmurant handles calendar times by:

1. Storing all events as UTC instants (unambiguous, worldwide)
2. Displaying times in your organization's configured timezone
3. Using IANA timezone identifiers (not ambiguous abbreviations)
4. Calculating scheduling rules (open day, open hour) in your timezone

This approach means your events display correctly regardless of DST transitions, and calendar exports work reliably with Google Calendar, Apple Calendar, and other standard applications.

If something looks wrong, use the verification checklist above before contacting support. Most issues stem from timezone misconfiguration or DST transition edge cases.

---

## Related Documents

- [Calendar and Time Model](../ARCH/CALENDAR_TIME_MODEL.md) - Technical implementation details
- [Policy Capture](../IMPORTING/WA_POLICY_CAPTURE.md) - How scheduling policies are configured during migration
