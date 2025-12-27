# Time and Timezone Rules

This document describes the guardrails that prevent implicit Date usage in
time-critical modules. See also: `tests/unit/guardrails/noImplicitDate.spec.ts`.

## Purpose

Prevent timezone-related bugs caused by implicit `new Date()` or `Date.now()`
calls in scheduling and timezone modules. These patterns are dangerous because
they use the system clock without timezone awareness, leading to:

- Tests that pass locally but fail in CI (different system timezone)
- Incorrect scheduling when servers run in UTC
- Hard-to-debug issues around DST transitions

## The Rule: Explicit Time

**Time-critical modules must not use implicit Date constructors.**

Forbidden patterns in `src/lib/timezone.ts`, `src/lib/events/scheduling.ts`,
and `src/lib/time/**`:

- `new Date()` - zero-arg constructor uses system clock
- `Date.now()` - uses system clock

Allowed patterns:

- `new Date(timestamp)` - explicit value
- `new Date(year, month, day, ...)` - explicit construction
- `Date.UTC(...)` - explicit UTC construction
- Default parameters: `(now: Date = new Date())` - allows injection for testing

## How It Works

A unit test scans time-critical files for forbidden patterns:

```
tests/unit/guardrails/noImplicitDate.spec.ts
```

The test maintains a list of known exceptions (reviewed uses) and fails if
new patterns appear without being added to the exception list.

## Adding New Time-Critical Code

When writing code that deals with time in these modules:

1. **Accept a Date parameter** with an optional default:

   ```typescript
   function computeDeadline(event: Event, now: Date = new Date()): Date {
     // Use 'now' instead of new Date() in the body
   }
   ```

2. **Add to exception list** if the default is necessary:

   Edit `KNOWN_EXCEPTIONS` in `noImplicitDate.spec.ts`:

   ```typescript
   "src/lib/events/scheduling.ts": [
     "115:new Date()", // getNextSunday default param
     // Add your new exception with justification
     "500:new Date()", // computeDeadline default param
   ],
   ```

3. **Write tests with injected dates**:

   ```typescript
   it("computes deadline correctly", () => {
     const fixedNow = new Date("2024-03-15T10:00:00Z");
     const deadline = computeDeadline(event, fixedNow);
     expect(deadline).toEqual(expected);
   });
   ```

## Why Default Parameters Are Allowed

Default parameters like `(now: Date = new Date())` are allowed because:

1. They make functions testable by allowing date injection
2. The call site controls whether to use system time or a fixed time
3. Tests can pass explicit dates for deterministic behavior

The exception list documents these reviewed uses.

## Canonical Modules

| Module | Purpose |
|--------|---------|
| `src/lib/timezone.ts` | Timezone-aware date formatting |
| `src/lib/events/scheduling.ts` | Event publication and registration scheduling |
| `src/lib/time/**` | Future time utilities (reserved) |

All other code should import from `src/lib/timezone.ts` for formatting.

## Related ESLint Rules

The ESLint config (`eslint.config.mjs`) bans locale-dependent formatting
everywhere except `timezone.ts`:

- `toLocaleString()` - Use timezone.ts helpers
- `toLocaleDateString()` - Use timezone.ts helpers
- `toLocaleTimeString()` - Use timezone.ts helpers
- `Intl.DateTimeFormat()` - Use timezone.ts helpers

## Troubleshooting

### Test fails with "Found implicit Date usage"

1. Check if the pattern is intentional (default param, reviewed use)
2. If intentional, add to `KNOWN_EXCEPTIONS` with line number and justification
3. If not intentional, refactor to accept Date parameter

### Exception line numbers are stale

When code is moved, exception line numbers become invalid. The test will fail
with "pattern not found on line". Update the line numbers in
`KNOWN_EXCEPTIONS` to match the new locations.

### New file in src/lib/time/**

The guardrail automatically scans any `.ts` files in `src/lib/time/`. Add
exceptions as needed following the same pattern.
