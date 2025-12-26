# Time and Timezone Rules for ClubOS

Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

This document defines rules for handling time in tests and business logic.
Following these rules prevents flaky tests and timezone-related bugs.

---

## The Three Failure Modes

We have repeatedly hit these timezone and time-related failures:

### 1. Local Machine Timezone Differences

Tests pass on a developer machine in Pacific time but fail in CI (UTC) or on
a machine in Eastern time. The same instant in time produces different local
dates depending on system timezone.

**Example failure**: `getDay()` returns 0 (Sunday) locally but 1 (Monday) in CI
because UTC is 8 hours ahead of Pacific.

### 2. Real Clock Drift

Tests use `Date.now()` or `new Date()` to compute "yesterday" or "tomorrow".
These tests:
- Fail at midnight boundaries
- Produce different results depending on when CI runs
- Cannot be reproduced reliably

**Example failure**: Test expects "yesterday" event to be COMPLETED, but runs
at 11:59 PM and crosses midnight during execution.

### 3. DST and Day-of-Week Misinterpretation

Code assumes a fixed UTC offset or uses `getDay()` without timezone context.
During DST transitions (March/November), offsets shift by 1 hour, causing:
- Events appearing on wrong day
- Registration windows opening at wrong time
- Week boundaries computed incorrectly

**Example failure**: Test expects Tuesday 8 AM Pacific = 16:00 UTC, but during
PDT it equals 15:00 UTC.

---

## Rules (MUST)

### Rule 1: Freeze Time in Unit Tests

Every test that involves time comparison MUST freeze time to a fixed instant.

```typescript
import { freezeTime, restoreTime } from "../../helpers/freezeTime";

describe("Event status", () => {
  afterEach(() => {
    restoreTime();
  });

  it("returns COMPLETED for past event", () => {
    freezeTime("2025-01-15T12:00:00Z");
    const pastDate = new Date("2025-01-14T12:00:00Z");
    expect(getEffectiveStatus({ status: "PUBLISHED", endTime: pastDate }))
      .toBe("COMPLETED");
  });
});
```

Use Vitest fake timers (`vi.useFakeTimers`, `vi.setSystemTime`) under the hood.

### Rule 2: Always Pass Timezone Explicitly

Never rely on system timezone. Always specify `CLUB_TIMEZONE` or pass
timezone as a parameter.

```typescript
// CORRECT: explicit timezone
import { CLUB_TIMEZONE } from "@/lib/timezone";

const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: CLUB_TIMEZONE,
  weekday: "long",
});

// WRONG: uses system timezone
const day = someDate.getDay(); // Result depends on machine timezone
```

### Rule 3: Do Not Parse Date Strings Without Timezone

Date strings without timezone are interpreted in local time, causing drift.

```typescript
// WRONG: ambiguous, interpreted as local time
const date = new Date("2025-01-15");

// CORRECT: explicit UTC
const date = new Date("2025-01-15T00:00:00Z");

// CORRECT: explicit Pacific offset
const date = new Date("2025-01-15T00:00:00-08:00");
```

---

## Patterns (DO)

### Pattern 1: Fixed Instant with Explicit Timezone

When testing day-of-week or date logic, use a fixed UTC instant and verify
against known Pacific-time expectations.

```typescript
it("identifies Sunday in Pacific time", () => {
  freezeTime("2024-12-22T18:00:00Z"); // Sunday 10 AM Pacific

  const dayName = new Intl.DateTimeFormat("en-US", {
    timeZone: CLUB_TIMEZONE,
    weekday: "long",
  }).format(new Date());

  expect(dayName).toBe("Sunday");
});
```

### Pattern 2: Use Club Timezone Helpers

Use existing helpers from `@/lib/timezone` for club-specific formatting:

```typescript
import {
  CLUB_TIMEZONE,
  clubYmdString,
  formatClubDate,
  formatClubDateTime,
  startOfClubDayUtc,
} from "@/lib/timezone";

// Get YYYY-MM-DD in club timezone
const ymd = clubYmdString(someUtcDate); // "2025-01-15"

// Format for display
const display = formatClubDate(someUtcDate); // "Jan 15, 2025"

// Get midnight Pacific as UTC instant
const midnight = startOfClubDayUtc(someUtcDate);
```

### Pattern 3: Deterministic Test Dates

Choose test dates that avoid DST transitions and are clearly in the past
or future relative to your frozen time.

```typescript
// Frozen time: 2025-01-15T12:00:00Z (noon UTC, 4 AM Pacific)
freezeTime("2025-01-15T12:00:00Z");

// Yesterday (safe margin)
const yesterday = new Date("2025-01-14T12:00:00Z");

// Tomorrow (safe margin)
const tomorrow = new Date("2025-01-16T12:00:00Z");

// Avoid: dates only hours apart (boundary issues)
// Avoid: March 10, November 3 (DST transition days)
```

### Pattern 4: Day-of-Week in Pacific Time

When checking day of week, use `Intl.DateTimeFormat` with explicit timezone:

```typescript
function getPacificDayOfWeek(date: Date): number {
  const dayName = new Intl.DateTimeFormat("en-US", {
    timeZone: CLUB_TIMEZONE,
    weekday: "short",
  }).format(date);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return dayNames.indexOf(dayName);
}
```

---

## Anti-Patterns (DO NOT)

### Anti-Pattern 1: new Date() in Business Logic

```typescript
// WRONG: depends on real clock
function isEventPast(event: { endTime: Date }) {
  return event.endTime < new Date();
}

// CORRECT: accept "now" as parameter for testability
function isEventPast(event: { endTime: Date }, now: Date = new Date()) {
  return event.endTime < now;
}
```

### Anti-Pattern 2: "Today" Computations in Tests

```typescript
// WRONG: flaky, depends on when test runs
it("handles today's event", () => {
  const today = new Date();
  // ...
});

// CORRECT: freeze time, use explicit dates
it("handles today's event", () => {
  freezeTime("2025-01-15T12:00:00Z");
  const today = new Date("2025-01-15T12:00:00Z");
  // ...
});
```

### Anti-Pattern 3: Expecting Weekday Without Freezing Time

```typescript
// WRONG: test only passes on the "right" day
it("computes next Sunday", () => {
  const result = getNextSunday(new Date());
  expect(result.getDay()).toBe(0); // Flaky!
});

// CORRECT: fixed input, fixed expectation
it("computes next Sunday from Monday", () => {
  const monday = new Date("2024-12-23T10:00:00-08:00");
  const result = getNextSunday(monday);
  expect(result.toISOString()).toContain("2024-12-29");
});
```

### Anti-Pattern 4: Using getDay() Without Timezone Context

```typescript
// WRONG: getDay() uses local timezone
const isSunday = someDate.getDay() === 0;

// CORRECT: check in explicit timezone
const dayName = new Intl.DateTimeFormat("en-US", {
  timeZone: CLUB_TIMEZONE,
  weekday: "short",
}).format(someDate);
const isSunday = dayName === "Sun";
```

### Anti-Pattern 5: Hardcoded UTC Offsets

```typescript
// WRONG: assumes PST, breaks during PDT
const pacificMidnight = Date.UTC(year, month, day, 8, 0, 0);

// CORRECT: use library that handles DST
const pacificMidnight = startOfClubDayUtc(someDate);
```

---

## Ongoing Compliance Expectations

The codebase is periodically audited for compliance with these rules.
See: `docs/ARCH/CALENDAR_TIME_COMPLIANCE.md`

### Current Status

As of the last audit (2025-12-25):

- **Mostly Compliant**: Core scheduling and timezone logic follows the model
- **Pending Fixes**: PR #353 addresses remaining `setHours()`/`getDay()` issues
- **Known Exception**: `MemberWelcomeCard.tsx` uses local time for greeting UX

### New Code Requirements

All new code touching time or dates MUST:

1. Pass the PR checklist below
2. Use explicit timezone for any day-of-week or hour calculation
3. Accept `now` parameter for testability
4. Include tests that run in multiple TZ environments

### Periodic Verification

To verify compliance, run tests in multiple timezones:

```bash
TZ=UTC npm run test:unit -- tests/unit/events/scheduling.spec.ts
TZ=Europe/London npm run test:unit -- tests/unit/events/scheduling.spec.ts
TZ=Asia/Tokyo npm run test:unit -- tests/unit/events/scheduling.spec.ts
```

All tests must pass regardless of the system timezone.

### Reporting Issues

If you find non-compliant code:

1. Do not silently fix it (may break something)
2. Document in `docs/ARCH/CALENDAR_TIME_COMPLIANCE.md`
3. Create an issue or PR with explicit timezone handling
4. Add regression test that fails in non-Pacific timezone

---

## Checklist Before Merging

Use this checklist for PRs that touch time-related code:

- [ ] No `new Date()` in business logic without `now` parameter
- [ ] No `Date.now()` in test assertions
- [ ] All time-dependent tests use `freezeTime()` / `restoreTime()`
- [ ] All date strings include timezone (Z or offset)
- [ ] No `getDay()` / `getHours()` without explicit timezone context
- [ ] No hardcoded UTC offsets (use `CLUB_TIMEZONE` helpers)
- [ ] Test dates avoid DST transition dates (Mar 10, Nov 3)
- [ ] Tests use explicit frozen dates, not relative ("yesterday")

---

## Quick Reference

| Need | Use |
|------|-----|
| Freeze time in test | `freezeTime("2025-01-15T12:00:00Z")` |
| Restore after test | `afterEach(() => restoreTime())` |
| Club timezone constant | `CLUB_TIMEZONE` ("America/Los_Angeles") |
| Format date for display | `formatClubDate(utcDate)` |
| Get YYYY-MM-DD in Pacific | `clubYmdString(utcDate)` |
| Midnight Pacific as UTC | `startOfClubDayUtc(utcDate)` |
| Day-of-week in Pacific | Use `Intl.DateTimeFormat` with timezone |

---

## Related Documents

- [CALENDAR_TIME_COMPLIANCE.md](../ARCH/CALENDAR_TIME_COMPLIANCE.md) - Compliance audit
- [CALENDAR_TIME_MODEL.md](../ARCH/CALENDAR_TIME_MODEL.md) - Canonical time model
- [TEST_COVERAGE.md](TEST_COVERAGE.md) - Testing requirements
- [INVARIANTS.md](INVARIANTS.md) - System invariants
- [GREEN_GATE.md](GREEN_GATE.md) - CI gate requirements

## Related Code

- `src/lib/timezone.ts` - Club timezone helpers
- `src/lib/time/` - Clock abstraction and day-of-week utilities
- `src/lib/events/scheduling.ts` - Event scheduling with timezone
- `tests/helpers/freezeTime.ts` - Test time freezing helper
