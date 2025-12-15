# TESTING_STRATEGY

## Goals
- Make testing predictable, fast, and maintainable.
- Use the right test type for the job (unit vs integration vs E2E).
- Keep E2E small and high-value; put most logic coverage into unit and integration.
- Establish a coverage ratchet so coverage trends upward over time.

## Test Layers

### Unit tests (Vitest)
Purpose:
- Fast, deterministic verification of pure logic.
Scope:
- Business rules (membership transitions, eligibility, waitlist logic)
- RBAC policy evaluation (role/group -> allow/deny)
- Helpers, parsing, formatting
- DTO mapping and validation utilities
Rules:
- No network
- No real database
- Use mocks for external dependencies

Command:
- npm run test:unit
- npm run test:unit:coverage

### Integration tests (Vitest + real DB or realistic substitutes)
Purpose:
- Verify server-side behavior across modules and boundaries without a browser.
Scope:
- API route handlers (auth + RBAC + error format)
- Prisma queries and joins
- Template rendering output checks
- Audit log interface calls and invariants (even if stubbed)
Rules:
- Use a dedicated test database (preferred: ephemeral container).
- Tests may read/write within the isolated test database.
- No writes to production resources.

Command:
- npm run test:integration

### End-to-end tests (Playwright)
Purpose:
- Verify critical workflows in a real browser.
Scope:
- Highest-value flows (admin search/detail, key member workflows)
- Role-based experience differences
- Regression guards for known failures
Rules:
- Keep these small and focused.
- Prefer stable selectors and deterministic fixtures.

Command:
- npm run test:e2e
- npm run test-admin

## Contract Testing (API boundary)
Purpose:
- Prevent accidental breaking changes for widgets and external clients.
Approach:
- Integration tests that validate response shapes and error formats for v1 endpoints.
- Add tests for both valid and invalid inputs and for auth failures.

## Coverage
Primary coverage measurement:
- Vitest coverage for unit and (optionally) integration tests.

Policy:
- Start with a low coverage gate if needed, then ratchet upward in small steps.
- Never reduce coverage for stable modules without a documented reason.

Near-term plan:
- Add a coverage ratchet step in CI that enforces a minimum for unit coverage totals.
- Increase coverage by targeting core business rules and RBAC first.

## What goes where (rules of thumb)
- If it is logic and has no UI: unit test.
- If it touches auth/RBAC, API handlers, Prisma, or templates: integration test.
- If it is a user workflow or regression of a UI issue: E2E test.

