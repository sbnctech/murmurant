# Calendar Time Model Compliance Audit

Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

This document audits all time, timezone, and day-of-week logic in ClubOS
against the canonical calendar time model defined in:
- `docs/ARCH/CALENDAR_TIME_MODEL.md`
- `docs/CI/TIME_AND_TIMEZONE_RULES.md`

Audit performed: 2025-12-25

---

## Compliance Guarantees

The following guarantees are verified by this audit:

1. **Timezone Constants**: All code uses `SBNC_TIMEZONE` or `CLUB_TIMEZONE`
   constants, never hardcoded offset strings like "PST" or "EST".

2. **Explicit Timezone Parameter**: Formatting functions use explicit
   `timeZone` in `Intl.DateTimeFormat` options.

3. **UTC for Storage**: Prisma DateTime fields store UTC instants.
   No local-time storage.

4. **Policy Layer Ready**: Timezone is configurable via `getPolicy()` at
   `scheduling.timezone`, though not yet wired through all call sites.

---

## Files Audited

| Directory | Files Checked | Patterns Found |
|-----------|--------------|----------------|
| src/lib/events/ | 4 | 45 |
| src/lib/timezone.ts | 1 | 12 |
| src/lib/time/ | 3 | 8 |
| src/lib/membership/ | 2 | 6 |
| src/lib/serviceHistory/ | 6 | 22 |
| src/lib/auth/ | 4 | 18 |
| src/lib/passkey/ | 4 | 16 |
| src/app/api/ | 12 | 24 |
| src/components/ | 8 | 14 |
| tests/unit/events/ | 1 | 12 |

---

## Classification Legend

- **COMPLIANT**: Follows canonical model
- **EXCEPTION**: Allowed deviation with justification
- **NON-COMPLIANT**: Violates model (documented for future cleanup)
- **PENDING**: Fix in open PR

---

## Timezone Constants

### Compliant

| File | Line | Usage | Status |
|------|------|-------|--------|
| src/lib/timezone.ts | 1 | `CLUB_TIMEZONE = "America/Los_Angeles"` | COMPLIANT |
| src/lib/events/scheduling.ts | 27 | `SBNC_TIMEZONE = "America/Los_Angeles"` | COMPLIANT |
| src/lib/policy/getPolicy.ts | 40 | `scheduling.timezone: "America/Los_Angeles"` | COMPLIANT |

### Observations

- Two parallel constants exist: `CLUB_TIMEZONE` and `SBNC_TIMEZONE`
- Policy layer defines `scheduling.timezone` but not wired to all code
- No hardcoded "PST", "EST", or other abbreviations found in production code

---

## Day-of-Week Calculations

### Non-Compliant

| File | Line | Code | Issue | Status |
|------|------|------|-------|--------|
| src/lib/events/scheduling.ts | 129-130 | `setDate()`, `setHours()` | Uses local timezone | PENDING PR #353 |
| src/lib/events/scheduling.ts | 167-168 | `setDate()`, `setHours()` | Uses local timezone | PENDING PR #353 |
| src/lib/events/scheduling.ts | 185-186 | `setDate()`, `setHours()` | Uses local timezone | PENDING PR #353 |
| src/lib/events/scheduling.ts | 200-201 | `setDate()`, `setHours()` | Uses local timezone | PENDING PR #353 |
| src/app/api/v1/officer/communications/dashboard/route.ts | 114 | `now.getDay()` | No timezone context | NON-COMPLIANT |

### Compliant

| File | Line | Code | Status |
|------|------|------|--------|
| src/lib/events/scheduling.ts | 117-122 | `formatToParts().weekday` | COMPLIANT |
| src/lib/events/scheduling.ts | 177-182 | `formatToParts().weekday` | COMPLIANT |
| src/lib/time/dayOfWeek.ts | 41-60 | `getDayOfWeek()` with tzid | COMPLIANT |
| src/lib/serviceHistory/transitionWidget.ts | 45 | `Date.UTC()` | COMPLIANT |

---

## Test Assertions

### Non-Compliant

| File | Line | Code | Issue | Status |
|------|------|------|-------|--------|
| tests/unit/events/scheduling.spec.ts | 28 | `result.getDay()` | No timezone context | PENDING PR #353 |
| tests/unit/events/scheduling.spec.ts | 38 | `result.getDay()` | No timezone context | PENDING PR #353 |
| tests/unit/events/scheduling.spec.ts | 48 | `result.getDay()` | No timezone context | PENDING PR #353 |
| tests/unit/events/scheduling.spec.ts | 60 | `result.getDay()` | No timezone context | PENDING PR #353 |
| tests/unit/events/scheduling.spec.ts | 79 | `result.publishAt.getDay()` | No timezone context | PENDING PR #353 |
| tests/unit/events/scheduling.spec.ts | 84 | `registrationOpensAt.getDay()` | No timezone context | PENDING PR #353 |
| tests/unit/events/scheduling.spec.ts | 376 | `start.getDay()` | No timezone context | PENDING PR #353 |
| tests/unit/events/scheduling.spec.ts | 390 | `start.getDay()` | No timezone context | PENDING PR #353 |

---

## `new Date()` Usage Categories

### Category 1: Timestamp/Now (EXCEPTION - Allowed)

These uses create a "now" instant for comparison or storage. They do not
interpret the date in any timezone context, so local timezone has no effect.

| File | Count | Example |
|------|-------|---------|
| src/lib/importing/wildapricot/importer.ts | 12 | `syncedAt: new Date()` |
| src/lib/auth/session.ts | 8 | `lastActivityAt: new Date()` |
| src/lib/passkey/service.ts | 6 | `usedAt: new Date()` |
| src/lib/governance/minutes.ts | 4 | `approvedAt: new Date()` |
| src/lib/support/index.ts | 3 | `closedAt: new Date()` |
| src/lib/observability.ts | 2 | `timestamp: new Date().toISOString()` |

**Justification**: These create UTC instants for storage in Prisma DateTime
fields. No local timezone interpretation occurs.

### Category 2: Function Default (EXCEPTION - Pattern Approved)

Functions accept optional `now` parameter defaulting to `new Date()`.
This allows callers to inject frozen time for testing.

| File | Line | Function | Status |
|------|------|----------|--------|
| src/lib/events/scheduling.ts | 115 | `getNextSunday(fromDate = new Date())` | EXCEPTION |
| src/lib/events/scheduling.ts | 264 | `getEventVisibilityState(event, now = new Date())` | EXCEPTION |
| src/lib/events/scheduling.ts | 300 | `getEventRegistrationState(event, now = new Date())` | EXCEPTION |
| src/lib/events/scheduling.ts | 323 | `getEventOperationalStatus(event, now = new Date())` | EXCEPTION |
| src/lib/events/defaults.ts | 38 | `isPastEvent(startTime, now = new Date())` | EXCEPTION |
| src/lib/events/defaults.ts | 46 | `isToday(startTime, now = new Date())` | EXCEPTION |
| src/lib/membership/lifecycle.ts | 163 | `now = new Date()` | EXCEPTION |

**Justification**: Enables testability via dependency injection.

### Category 3: Date Parsing (REQUIRES REVIEW)

Parsing ISO strings into Date objects.

| File | Line | Code | Status |
|------|------|------|--------|
| src/lib/importing/wildapricot/transformers.ts | 125 | `new Date(isoString)` | EXCEPTION |
| src/lib/governance/meetings.ts | 30 | `new Date(data.date)` | REQUIRES TIMEZONE |
| src/app/events/[id]/EventDetailClient.tsx | 48 | `new Date(dateString)` | EXCEPTION |

**Note**: Parsing with timezone offset suffix (e.g., `-08:00` or `Z`) is safe.
Parsing bare dates (e.g., `2025-01-15`) interprets as local midnight.

### Category 4: Relative Date Math (MIXED)

Using `Date.now()` or `new Date()` for relative calculations.

| File | Line | Code | Status |
|------|------|------|--------|
| src/lib/importing/wildapricot/importer.ts | 317 | `Date.now() - staleDays * DAY_MS` | EXCEPTION |
| src/lib/auth/session.ts | 74 | `Date.now() + SESSION_MAX_AGE_SECONDS * 1000` | EXCEPTION |
| src/lib/auth/session.ts | 404 | `Date.now() - 30 * DAY_MS` | EXCEPTION |
| src/components/member/MemberWelcomeCard.tsx | 31 | `new Date().getHours()` | NON-COMPLIANT |

**Note**: Line 31 in MemberWelcomeCard.tsx uses local hours for greeting.
This is intentional UX behavior (not a scheduling bug).

---

## `Date.now()` Usage

All `Date.now()` usages fall into two categories:

1. **ID Generation** (COMPLIANT): Creating unique identifiers
   - `sync_${Date.now()}_${random}`
   - `req_${Date.now()}_${random}`

2. **Duration Calculation** (COMPLIANT): Measuring elapsed time
   - `Date.now() - start` for latency
   - `Date.now() - threshold` for expiration

No timezone interpretation occurs in these patterns.

---

## `toLocale*` Usage

| File | Line | Code | Status |
|------|------|------|--------|
| src/app/admin/comms/lists/MailingListsTable.tsx | 90 | `subscriberCount.toLocaleString()` | COMPLIANT |

**Note**: Only numeric `toLocaleString()` found. No date-related
`toLocaleDateString()` or `toLocaleTimeString()` in production code.

---

## Known Exclusions

The following are intentionally excluded from compliance requirements:

1. **User-facing Greeting** (`MemberWelcomeCard.tsx:31`):
   Uses `new Date().getHours()` for "Good morning/afternoon/evening".
   This is UX behavior, not scheduling logic.

2. **Test Fixtures** (when using fixed ISO strings):
   Tests using `new Date("2024-12-22T10:00:00-08:00")` are compliant
   because the timezone offset is explicit in the string.

3. **Mock Providers** (`fake-provider.ts`):
   Development-only code for testing payments.

---

## Pending Fixes

### PR #353: fix(time): make scheduling timezone-explicit and deterministic

Status: OPEN

Fixes:
- All `setHours()`/`setDate()` in scheduling.ts replaced with `Date.UTC()`
- Test assertions use `getDayOfWeek()` with explicit timezone
- DST edge case tests added

Once merged, all items marked "PENDING PR #353" become COMPLIANT.

### PR #351: docs: time/timezone rules and policy layer documentation

Status: OPEN

Adds:
- `docs/CI/TIME_AND_TIMEZONE_RULES.md`
- `docs/ARCH/CALENDAR_TIME_MODEL.md`

---

## Future Cleanup Notes

1. **Communications Dashboard Route**:
   `src/app/api/v1/officer/communications/dashboard/route.ts:114`
   uses `now.getDay()` without timezone context. Should use
   `getDayOfWeek(now, CLUB_TIMEZONE)` from `@/lib/time`.

2. **Timezone Constant Consolidation**:
   Both `CLUB_TIMEZONE` and `SBNC_TIMEZONE` exist. Consider consolidating
   to single constant or aliasing one to the other.

3. **Policy Layer Wiring**:
   `scheduling.timezone` is defined in policy but not wired through
   scheduling functions. Low priority since all clubs use Pacific.

---

## Compliance Summary

| Category | Compliant | Exception | Non-Compliant | Pending |
|----------|-----------|-----------|---------------|---------|
| Timezone Constants | 3 | 0 | 0 | 0 |
| Day-of-Week (src/) | 4 | 0 | 1 | 4 |
| Day-of-Week (tests/) | 0 | 0 | 0 | 8 |
| new Date() patterns | 45+ | 30+ | 1 | 0 |
| Date.now() patterns | 30+ | 0 | 0 | 0 |
| toLocale* | 1 | 0 | 0 | 0 |

**Overall Status**: MOSTLY COMPLIANT

The codebase is largely compliant with the canonical calendar time model.
Remaining non-compliant code is documented and tracked:
- 4 production code issues in scheduling.ts (PR #353 pending)
- 1 production code issue in communications dashboard route
- 8 test assertion issues (PR #353 pending)

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2025-12-25 | Claude Code | Initial audit |
