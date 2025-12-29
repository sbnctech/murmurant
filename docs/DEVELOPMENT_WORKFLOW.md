# Murmurant Development Workflow

This document describes the development workflow for contributors working on Murmurant.

## Project Overview

Murmurant is a membership and event management system built with:

- **Next.js 16** with the App Router
- **TypeScript** for type safety
- **Playwright** for end-to-end testing
- **Mock data layer** (database integration is planned but not yet active)

The application provides an admin dashboard for managing members, events, and registrations. Currently, all data comes from in-memory mock modules rather than a live database.

The main admin dashboard (`/admin`) includes:

- Dashboard summary tiles (member, event, and registration counts)
- System communications panel (email and SMS testing)
- Search panel (cross-entity search)
- Activity feed (recent registrations via `/api/admin/activity`)

The admin dashboard also includes three symmetric explorer features:

- Members Explorer (`/admin/members`)
- Events Explorer (`/admin/events`)
- Registrations Explorer (`/admin/registrations`)

All three follow the same pattern with list and detail pages backed by admin-only API endpoints under `/api/admin`. When adding new features to any explorer, keep these patterns aligned.

## Multi-Session Development Model

Murmurant development uses multiple parallel sessions, each focused on a specific domain. This prevents merge conflicts and allows faster iteration.

### Session Responsibilities

- **Session 1: Backend and APIs**
  - Owns: `server/`, `src/lib/`, `prisma/`, API routes under `src/app/api/`
  - Focus: Data layer, API endpoints, business logic
  - Does NOT modify: UI components, admin pages, dev scripts

- **Session 2: Admin UI and Tests**
  - Owns: `src/app/admin/`, `src/components/`, `tests/admin/`
  - Focus: Admin dashboard, React components, UI tests
  - Does NOT modify: Server code, API logic, dev tooling

- **Session 3: Developer Tooling**
  - Owns: `scripts/`, `Makefile`, CI/CD configurations
  - Focus: Build scripts, dev environment, test infrastructure
  - Does NOT modify: Application code in `src/`

- **Session 4: Documentation and Orchestration**
  - Owns: `docs/`, README files
  - Focus: Developer documentation, workflow guides
  - Does NOT modify: Code, tests, or Makefile targets

### Human Orchestrator Role

The human developer coordinates sessions by:

1. Breaking features into domain-specific tasks
2. Assigning tasks to the appropriate session
3. Preventing file conflicts between sessions
4. Merging and testing integrated changes

## How to Work on a Task

Follow this checklist when starting development work:

1. **Pull the latest changes**
   ```bash
   git pull origin main
   ```

2. **Start the development server**
   ```bash
   make dev
   ```
   Or if you need a clean start:
   ```bash
   make dev-clean
   ```

3. **Run relevant tests** to verify baseline behavior
   - All tests:
     ```bash
     make test
     ```
   - API tests only:
     ```bash
     make test-api
     ```
   - Admin UI tests only:
     ```bash
     make test-admin
     ```

4. **Make your changes** within your session's domain

5. **Run tests again** to verify your changes work

6. **Commit and push** when tests pass

## When Things Go Wrong

### Stuck Builds

If the dev server hangs or fails to compile:

1. Reset the Turbopack cache:
   ```bash
   make turbopack-reset
   ```

2. Restart the dev server:
   ```bash
   make dev
   ```

Or combine both steps:
```bash
make dev-clean
```

### Port Conflicts

If Next.js cannot bind to port 3000:

1. Kill any running Next.js processes:
   ```bash
   make kill
   ```

2. Start fresh:
   ```bash
   make dev
   ```

### Test Failures

When tests fail unexpectedly:

1. Narrow down the failure by running specific test suites:
   ```bash
   make test-api     # Run only API tests
   make test-admin   # Run only admin UI tests
   ```

2. Check if the dev server is running and healthy:
   ```bash
   curl http://localhost:3000/api/health
   ```

3. If cache issues are suspected, reset and retry:
   ```bash
   make turbopack-reset
   make dev
   # In another terminal:
   make test
   ```

### Hot Reload Not Working

If code changes are not reflected in the browser:

1. Reset Turbopack cache:
   ```bash
   make turbopack-reset
   ```

2. Restart the dev server:
   ```bash
   make dev
   ```

### Full Environment Reset

If nothing else works, perform a complete reset:

```bash
make reset
```

Or for a full reset including node_modules:

```bash
make reset-full
```

## Example Feature Slice: Admin Members Explorer

This section shows how a feature was built across multiple sessions.

### Backend (Session 1)

- Added or extended mock data helpers in `src/lib/`
- Implemented `/api/admin/members` endpoint (list with metrics)
- Implemented `/api/admin/members/[id]` endpoint (detail with registrations)

### Admin UI (Session 2)

- Built `/admin/members` page with member table
- Built `/admin/members/[id]` page with profile and registration list
- Added `data-testid` attributes for tables, rows, and detail views

### Testing (Sessions 1 and 2)

- API tests in `tests/api/admin-members-list.spec.ts`
- API tests in `tests/api/admin-member-detail.spec.ts`
- UI tests in `tests/admin/admin-members-explorer.spec.ts`
- UI tests in `tests/admin/admin-member-detail-page.spec.ts`

### Validation Commands

```bash
make test-api              # Validate API changes
make test-admin            # Validate UI changes
make test-one TEST=...     # Run a specific test file
make test                  # Run all tests
```

## Writing UI Tests for Server Components

Murmurant uses Next.js App Router with React Server Components. This affects how UI tests work.

### What Playwright Can and Cannot Mock

**Server components (default in App Router):**

- Data fetching happens on the server during page render
- Playwright cannot intercept these fetches with `page.route()`
- Tests must run against the real API endpoints
- This is why UI tests require the dev server to be running

**Client components (marked with "use client"):**

- Data fetching happens in the browser via `fetch()` or libraries
- Playwright CAN intercept these with `page.route()`
- Useful for testing loading states, error handling, and edge cases

### Testing Strategy for Server-Rendered Pages

For pages like the admin dashboard that use server components:

1. **Test against real data**: Use the mock data layer that the API returns
2. **Use data-testid attributes**: Target specific elements reliably
3. **Test what the user sees**: Verify text content, not implementation details
4. **Run tests with dev server**: Ensure `make dev` is running first

Example test structure:

```typescript
test('dashboard shows summary tiles', async ({ page }) => {
  await page.goto('/admin');

  // Wait for server-rendered content
  await expect(page.getByTestId('summary-tiles')).toBeVisible();

  // Verify data from /api/admin/summary is displayed
  await expect(page.getByTestId('active-members-count')).toHaveText('2');
});
```

### Testing Client-Side Interactions

For search panels and other interactive features that use client-side fetching:

```typescript
test('search returns results', async ({ page }) => {
  await page.goto('/admin');

  // This fetch CAN be mocked if needed
  await page.route('/api/admin/search*', async route => {
    await route.fulfill({
      json: { results: { members: [], events: [], registrations: [] } }
    });
  });

  await page.getByTestId('search-input').fill('alice');
  await page.getByTestId('search-button').click();

  // Verify UI responds to the mocked response
});
```

### When to Mock vs Use Real Data

| Scenario | Approach |
|----------|----------|
| Happy path tests | Use real mock data |
| Error handling | Mock with `page.route()` (client components only) |
| Loading states | Mock with delayed response |
| Empty states | Use real API if it supports empty scenarios, or mock |
| Edge cases | Mock to force specific conditions |

## Quick Reference

| Command              | Description                              |
|---------------------|------------------------------------------|
| `make dev`          | Start development server                 |
| `make dev-clean`    | Clean cache, then start server           |
| `make test`         | Run all Playwright tests                 |
| `make test-api`     | Run API tests only                       |
| `make test-admin`   | Run admin UI tests only                  |
| `make kill`         | Kill running Next.js processes           |
| `make turbopack-reset` | Reset Turbopack cache                 |
| `make reset`        | Full dev environment reset               |
| `make reset-full`   | Reset including node_modules reinstall   |
| `make types`        | Run TypeScript type check                |
| `make lint`         | Run ESLint                               |
