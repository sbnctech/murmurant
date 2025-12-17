# Admin Playwright Test Status

**Last Updated:** 2024-12-14
**Branch:** `fix/admin-test-auth-v1`

---

## Summary

This document tracks the status of admin Playwright tests after the auth and fixture fixes applied in PR fix/admin-test-auth-v1.

## Root Causes Fixed

### 1. API Authentication (401 Errors)

**Problem:** Tests calling admin API endpoints via `lookupIds.ts` helpers were failing with 401 Unauthorized because no authentication header was provided.

**Solution:** Added `extraHTTPHeaders` to `playwright.config.ts`:

```typescript
use: {
  baseURL: process.env.PW_BASE_URL ?? "http://localhost:3000",
  browserName: "chromium",
  extraHTTPHeaders: {
    Authorization: "Bearer test-admin-token",
  },
},
```

The auth middleware in `src/lib/auth.ts` recognizes `test-admin-token` and returns an admin context.

### 2. Seed Data Mismatch

**Problem:** Tests had hardcoded member names ("Alice Johnson") and event names ("Welcome Hike", "Wine Mixer") that did not match the actual `prisma/seed.ts` data.

**Solution:** Created `tests/fixtures/seed-data.ts` with constants that match `prisma/seed.ts` exactly:

- Members: Alice Chen, Carol Johnson (not Alice Johnson, Bob Smith)
- Events: Welcome Coffee, Morning Hike at Rattlesnake Canyon, Summer Beach Picnic, Draft Event (not Welcome Hike, Wine Mixer)
- Statuses: CONFIRMED, WAITLISTED (not REGISTERED)

---

## Fixed Test Files

| File | Tests | Status |
|------|-------|--------|
| `admin-event-detail-page.spec.ts` | 3 | Fixed |
| `admin-member-detail-page.spec.ts` | 4 | Fixed |
| `admin-member-detail-ui.spec.ts` | 3 | Fixed |
| `admin-member-detail.spec.ts` | 3 | Fixed |
| `admin-registrations-filter.spec.ts` | 4 | Fixed |
| `admin-registrations.spec.ts` | 1 | Fixed |
| `admin-search-ui.spec.ts` | 4 | Fixed |
| `admin-summary.spec.ts` | 2 | Fixed |

**Total Tests Fixed:** 24

---

## Changes Made

### New Files

- `tests/fixtures/seed-data.ts` - Centralized seed data constants

### Modified Files

- `playwright.config.ts` - Added auth headers
- 8 test files updated to use seed data constants

---

## Seed Data Reference

Tests should import from `tests/fixtures/seed-data.ts`:

```typescript
import { SEED_MEMBERS, SEED_EVENTS, SEED_COUNTS, REGISTRATION_STATUS } from "../fixtures/seed-data";

// Members
SEED_MEMBERS.ALICE.fullName  // "Alice Chen"
SEED_MEMBERS.ALICE.email     // "alice@example.com"
SEED_MEMBERS.CAROL.fullName  // "Carol Johnson"

// Events
SEED_EVENTS.WELCOME_COFFEE.title  // "Welcome Coffee"
SEED_EVENTS.MORNING_HIKE.title    // "Morning Hike at Rattlesnake Canyon"

// Counts
SEED_COUNTS.members       // 2
SEED_COUNTS.events        // 4
SEED_COUNTS.registrations // 4

// Statuses
REGISTRATION_STATUS.CONFIRMED   // "CONFIRMED"
REGISTRATION_STATUS.WAITLISTED  // "WAITLISTED"
```

---

## Known Remaining Issues

### Tests Still Using Legacy Patterns

- `admin-events.spec.ts` - Uses frame-based approach (`waitForAdminFrame`) and wrong event names

### Tests Needing Review

- Tests expecting exact row counts may be fragile if seed data changes
- Some tests may need adjustment based on UI rendering behavior

---

## Running Tests

```bash
# Run all admin tests
npx playwright test tests/admin/

# Run specific test file
npx playwright test tests/admin/admin-member-detail.spec.ts

# Run with headed browser
npx playwright test tests/admin/ --headed
```

---

## Best Practices

1. **Always use seed data constants** - Never hardcode member names, event titles, or counts
2. **Use flexible assertions** - Prefer `toBeGreaterThanOrEqual(1)` over exact counts when testing presence
3. **Use `request` parameter** - Pass `request` (not `page.request`) to lookup helpers for proper auth header inheritance
4. **Reference `prisma/seed.ts`** - When adding new seed data constants, ensure they match the seed script exactly
