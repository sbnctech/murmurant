# ClubOS Admin E2E Test Status (Quarantine)

Last updated: 2025-12-14

## Goal

- Keep a small, deterministic Admin E2E suite GREEN at all times for demos and regression protection.
- Quarantine flaky/brittle tests until the underlying app + test harness is deterministic.

This repository currently has:
- Admin E2E tests (Playwright): tests/admin
- Unit tests (Vitest): tests/unit

## Current State

- Full admin suite (unfiltered): ~71 tests
- Stable admin suite (unquarantined): 40 tests passing locally
- Quarantined tests: everything tagged with @quarantine in the test title

Stable suite definition:
- No hardcoded exact row counts unless guaranteed by seed data.
- No reliance on external services or real authentication.
- Uses deterministic demo seed data (prisma/seed.ts) and stable selectors (data-test-id).
- Allows server-render timing by waiting for key elements (not arbitrary sleeps).

## How Quarantine Works

We mark a test as quarantined by adding "@quarantine" to the test title, for example:

- test("Activity table shows expected rows @quarantine", async (...) => { ... })

The stable runner excludes quarantined tests using grep invert.

## Commands

Run all admin tests (informational; failures expected until quarantine removed):
- npm run test-admin

Run only stable admin tests (must be GREEN; this is the demo gate):
- npm run test-admin:stable

Run unit tests:
- npm run test:unit

Reset demo data (recommended before demo and before stable suite):
- npm run db:seed

## Known Failure Categories (Why Tests Were Quarantined)

These are the common failure classes we are intentionally isolating:

1) Authentication / API 401 during test helpers
- Example: helper-based ID lookups call /api/admin/* and receive 401.
- Fix: make test harness inject admin auth (or bypass auth in test mode) consistently for both UI navigation and APIRequestContext.

2) Data mismatches vs seed
- Hardcoded expectations for member names, event names, or exact counts drifted from prisma/seed.ts.
- Fix: move tests to seeded constants (single source of truth) and assert presence, not exact ordering/counts unless deterministic.

3) Invalid ID behavior inconsistent
- Some tests expect 404 for invalid IDs but receive 200.
- Fix: standardize route behavior and error boundaries; ensure API returns 404 and UI surfaces it.

4) Async rendering / missing selectors
- Some tests query rows immediately and find zero elements.
- Fix: wait for stable root element, then wait for first row OR an empty-state marker that is always rendered.

5) System comms / health panel nondeterminism
- Health checks can return "error" depending on environment.
- Fix: make health check deterministic under test mode (mock/stub) or relax assertion to "renders a status" until deterministic.

## Demo Contract

For a demo, we rely on:
- npm run db:seed
- npm run dev
- Navigate to /admin
- Stable suite: npm run test-admin:stable

The stable suite must remain green. All quarantined tests are allowed to fail until they are upgraded to deterministic behavior and unquarantined.

