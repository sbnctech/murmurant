# Admin Test Failures Baseline

**Generated**: 2025-12-14
**Branch**: `chore/test-baseline-triage-v2`
**Total Tests**: 71
**Passing**: 47
**Failing**: 24

## Purpose

- Track pre-existing admin test failures so other PRs can proceed
- Categorize root causes for systematic fixing
- Provide recommended fix approach for each category

## Rules

- Do NOT change production code in this PR
- Prefer fixing brittle assertions to be data-resilient
- If truly blocked, use `test.skip` with TODO and link to issue

---

## Failure Categories

| Category | Count | Owner | Priority |
|----------|-------|-------|----------|
| Hardcoded mock names | 4 | Test | High |
| Hardcoded exact counts | 6 | Test | High |
| UUID vs mock ID regex | 2 | Test | High |
| API auth 401 in helpers | 3 | Test | Medium |
| Missing UI elements (activity rows) | 3 | Investigate | Medium |
| Mock event not in DB | 2 | Test | Medium |
| Hardcoded mock ID navigation | 2 | Test | High |
| Invalid ID returns 200 not 404 | 1 | Production | Low |
| Health check external error | 1 | Config | Low |

---

## Category 1: Hardcoded Mock Names (4 failures)

**Root Cause**: Tests expect hardcoded mock data names ("Alice Johnson", "Welcome Hike") but seed data has different values ("Alice Chen", "Morning Hike at Rattlesnake Canyon").

**Recommended Fix**: Make tests data-resilient by fetching actual data from API before asserting, or use tolerant assertions (e.g., check for "Alice" not "Alice Johnson").

### Affected Tests

| Test File | Test Name | Expected | Actual |
|-----------|-----------|----------|--------|
| `admin-member-detail-page.spec.ts:15` | Displays member name, email, and status | "Alice Johnson" | "Alice Chen" |
| `admin-member-detail-ui.spec.ts:29` | Panel shows the expected member name | "Alice Johnson" | "Alice Chen" |
| `admin-search-ui.spec.ts:19` | Searching shows member matches | "Alice Johnson" | "Alice Chen" |
| `admin-search-ui.spec.ts:62` | Searching for event title | "Welcome Hike" | "Morning Hike at Rattlesnake Canyon" |

---

## Category 2: Hardcoded Exact Counts (6 failures)

**Root Cause**: Tests assert exact row counts (e.g., `toHaveCount(2)`) but database has different number of seed records.

**Recommended Fix**: Use `toBeGreaterThanOrEqual(1)` for existence checks, or fetch expected count from API.

### Affected Tests

| Test File | Test Name | Expected | Actual |
|-----------|-----------|----------|--------|
| `admin-events-explorer.spec.ts:13` | displays both mock events | 2 | 0 |
| `admin-events.spec.ts:4` | renders mock events | 2 | 3 |
| `admin-member-detail-page.spec.ts:32` | Shows registrations table | 1 | 2 |
| `admin-member-detail-ui.spec.ts:59` | Panel shows registration row | 1 | 2 |
| `admin-registrations-filter.spec.ts:6` | filter defaults to All | 2 | 4 |
| `admin-registrations.spec.ts:5` | renders joined member/event data | 2 | 4 |

---

## Category 3: UUID vs Mock ID Regex (2 failures)

**Root Cause**: Tests use regex patterns expecting mock IDs like `m\d+` or `r\d+`, but production uses UUIDs.

**Recommended Fix**: Update regex to accept UUIDs: `/\/admin\/members\/[a-f0-9-]+/` or use a more general pattern.

### Affected Tests

| Test File | Test Name | Pattern | Actual URL |
|-----------|-----------|---------|------------|
| `admin-members-explorer.spec.ts:26` | Clicking member navigates to detail | `/m\d+/` | `7a5bae18-1091-46b5-81be-9b4fdc73562b` |
| `admin-registrations-explorer.spec.ts:26` | clicking member navigates to detail | `/r\d+/` | `20a1008f-fbdf-435b-a582-1bd8604b5f65` |

---

## Category 4: API Auth 401 in Test Helpers (3 failures)

**Root Cause**: `lookupEventIdByTitle` helper calls `/api/admin/events` without auth context, returns 401.

**Recommended Fix**: Either configure Playwright auth fixture or use public API endpoint, or mock the lookup.

### Affected Tests

| Test File | Test Name |
|-----------|-----------|
| `admin-event-detail-page.spec.ts:7` | shows event detail page for Welcome Hike |
| `admin-event-detail-page.spec.ts:23` | shows at least one registration row |
| `admin-event-detail-page.spec.ts:32` | returns 404 for invalid event id |

---

## Category 5: Missing UI Elements - Activity Rows (3 failures)

**Root Cause**: `[data-test-id="admin-activity-row"]` elements never appear. Either:

- Activity data not in seed
- Component not rendering rows
- Different test-id used

**Recommended Fix**: Investigate if activity UI is implemented. If not, skip with TODO.

### Affected Tests

| Test File | Test Name |
|-----------|-----------|
| `admin-activity-ui.spec.ts:18` | Activity table shows the expected rows |
| `admin-activity-ui.spec.ts:36` | Status column shows REGISTERED and WAITLISTED |
| `admin-activity-ui.spec.ts:51` | Activity table structure is correct |

---

## Category 6: Mock Event Not in DB (2 failures)

**Root Cause**: Tests look for "Welcome Hike" event which doesn't exist in seed data.

**Recommended Fix**: Use dynamic lookup to find any event, or update seed data.

### Affected Tests

| Test File | Test Name |
|-----------|-----------|
| `admin-events-explorer.spec.ts:25` | title links navigate to event detail page |
| `admin-registrations-filter.spec.ts:20` | Registered only filter shows REGISTERED rows |

---

## Category 7: Hardcoded Mock ID Navigation (2 failures)

**Root Cause**: Tests navigate to `/admin/members/m1` but `m1` doesn't exist (system uses UUIDs).

**Recommended Fix**: Fetch a valid member ID from API before navigation.

### Affected Tests

| Test File | Test Name |
|-----------|-----------|
| `admin-member-detail.spec.ts:6` | Loads member detail page for m1 |
| `admin-member-detail.spec.ts:25` | Displays registrations table with at least 1 row |

---

## Category 8: Invalid ID Returns 200 Not 404 (1 failure)

**Root Cause**: Route `/admin/registrations/invalid-id` returns 200 (likely shows error state) instead of 404.

**Recommended Fix**: Either update test to check for error UI state, or fix route to return 404.

### Affected Tests

| Test File | Test Name | Expected | Actual |
|-----------|-----------|----------|--------|
| `admin-registration-detail-page.spec.ts:32` | returns 404 for invalid registration id | 404 | 200 |

---

## Category 9: Health Check External Error (1 failure)

**Root Cause**: System health check returns error in test environment.

**Recommended Fix**: Mock health check in tests, or skip with TODO noting external dependency.

### Affected Tests

| Test File | Test Name | Expected | Actual |
|-----------|-----------|----------|--------|
| `admin-system-comms.spec.ts:6` | displays system comms section with health OK | "Health: OK" | "Health checkHealth: error" |

---

## Recommended Fix Priority

### Phase 1: Quick Wins (Test-Only Changes)

1. Fix UUID regex patterns (Category 3) - 2 tests
2. Fix hardcoded counts to use `>=1` (Category 2) - 6 tests
3. Fix hardcoded names to use dynamic lookup (Category 1) - 4 tests
4. Fix mock ID navigation to use dynamic lookup (Category 7) - 2 tests

### Phase 2: Requires Investigation

5. Fix API auth in test helpers (Category 4) - 3 tests
6. Investigate activity UI rendering (Category 5) - 3 tests
7. Update tests for events not in seed (Category 6) - 2 tests

### Phase 3: Deferred

8. Skip health check test with TODO (Category 9) - 1 test
9. Decide on 404 vs error state behavior (Category 8) - 1 test

---

## Full Failure List

```
24 failed
  tests/admin/admin-activity-ui.spec.ts:18:7 › Activity table shows the expected rows
  tests/admin/admin-activity-ui.spec.ts:36:7 › Status column shows REGISTERED and WAITLISTED
  tests/admin/admin-activity-ui.spec.ts:51:7 › Activity table structure is correct
  tests/admin/admin-event-detail-page.spec.ts:7:7 › shows event detail page for Welcome Hike
  tests/admin/admin-event-detail-page.spec.ts:23:7 › shows at least one registration row
  tests/admin/admin-event-detail-page.spec.ts:32:7 › returns 404 for invalid event id
  tests/admin/admin-events-explorer.spec.ts:13:7 › displays both mock events
  tests/admin/admin-events-explorer.spec.ts:25:7 › title links navigate to event detail page
  tests/admin/admin-events.spec.ts:4:5 › Admin events table renders mock events
  tests/admin/admin-member-detail-page.spec.ts:15:7 › Displays member name, email, and status
  tests/admin/admin-member-detail-page.spec.ts:32:7 › Shows registrations table with at least one row
  tests/admin/admin-member-detail-ui.spec.ts:29:7 › Panel shows the expected member name
  tests/admin/admin-member-detail-ui.spec.ts:59:7 › Panel shows at least one registration row
  tests/admin/admin-member-detail.spec.ts:6:7 › Loads member detail page for m1
  tests/admin/admin-member-detail.spec.ts:25:7 › Displays registrations table with at least 1 row
  tests/admin/admin-members-explorer.spec.ts:26:7 › Clicking member name navigates to detail page
  tests/admin/admin-registration-detail-page.spec.ts:32:7 › returns 404 for invalid registration id
  tests/admin/admin-registrations-explorer.spec.ts:26:7 › clicking member name navigates to detail page
  tests/admin/admin-registrations-filter.spec.ts:6:7 › filter defaults to All statuses
  tests/admin/admin-registrations-filter.spec.ts:20:7 › Registered only filter shows REGISTERED rows
  tests/admin/admin-registrations.spec.ts:5:5 › renders joined member/event data
  tests/admin/admin-search-ui.spec.ts:19:7 › Searching shows member/event/registration matches
  tests/admin/admin-search-ui.spec.ts:62:7 › Searching for event title shows event results
  tests/admin/admin-system-comms.spec.ts:6:7 › displays system comms section with health OK
```
