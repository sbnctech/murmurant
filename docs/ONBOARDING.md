# Developer Onboarding

This guide helps new contributors get productive with Murmurant quickly.

## Who This Is For

- New contributors who just cloned the repo
- Developers returning after time away
- Anyone setting up a fresh development environment

**Assumes familiarity with:**

- Node.js and npm
- TypeScript basics
- React and Next.js fundamentals
- Git workflow

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| Node.js 18+ | Check with `node --version` |
| npm | Comes with Node.js |
| macOS + zsh | Scripts assume this environment |
| Git | Basic branch/commit workflow |
| Playwright browsers | Optional; installed automatically on first test run |

## First-Time Setup

1. **Clone the repository** (see README for URL)

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the environment doctor**
   ```bash
   make doctor
   ```
   All checks should pass before continuing. If any fail, follow the suggested fixes.

4. **Create the .env file**

   Create a `.env` file in the project root. Required variables:
   ```
   # Currently minimal - mock data does not require external services
   NODE_ENV=development
   ```

   If a `.env.example` file exists, copy it:
   ```bash
   cp .env.example .env
   ```

5. **Verify setup**
   ```bash
   make smoke
   ```
   This runs a quick check of types, lint, and core tests.

## Running the App

Start the development server:

```bash
make dev
```

Open http://localhost:3000 in your browser.

**If the dev server behaves oddly:**

```bash
make dev-clean    # Clean cache and restart
```

**Note:** All data is currently mock-only. No database connection is required.

## Core Make Targets

| Command | When to Use |
|---------|-------------|
| `make dev` | Start the dev server for local development |
| `make test` | Run all Playwright tests |
| `make test-api` | Run only API/route tests |
| `make test-admin` | Run only admin UI tests |
| `make preflight` | Full quality check before commit/push |
| `make smoke` | Quick sanity check (types, lint, core tests) |
| `make test-changed` | Run tests only for files you changed |
| `make turbopack-reset` | Fix stuck builds or stale cache |

Run `make help` for the complete list.

## Working With Admin Features

The admin dashboard at `/admin` is the main interface for club officers.

**Dashboard panels:**

- Summary tiles (member, event, registration counts)
- Search panel (cross-entity search)
- Activity feed (recent registrations)

**Explorer pages:**

| Route | Purpose |
|-------|---------|
| `/admin/members` | Browse all members |
| `/admin/events` | Browse all events |
| `/admin/registrations` | Browse all registrations |

Each explorer has a list view and detail view (`/admin/<type>/[id]`).

**Related documentation:**

- [Admin Dashboard Overview](ADMIN_DASHBOARD_OVERVIEW.md)
- [Admin Members UI](ADMIN_MEMBERS_UI.md)
- [Admin Events UI](ADMIN_EVENTS_UI.md)
- [Admin Registrations UI](ADMIN_REGISTRATIONS_UI.md)
- [Admin Activity Feed](ADMIN_ACTIVITY_UI.md)

These are admin-only tools for club officers, not general member features.

## How To Pick Up a Task

1. **Pull latest main**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Run the doctor**
   ```bash
   make doctor
   ```

3. **Verify tests pass** for the area you will touch
   ```bash
   make test-api      # For backend work
   make test-admin    # For UI work
   ```

4. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

5. **Implement changes** in one slice (API, UI, or tests)

6. **Run tests and preflight** before committing
   ```bash
   make test-api      # Or test-admin
   make preflight     # Full quality check
   ```

7. **Commit and push** when everything passes

## Testing Basics

**Test locations:**

| Directory | Contents |
|-----------|----------|
| `tests/api/` | API and route handler tests |
| `tests/admin/` | Admin UI Playwright tests |

**Commands:**

- `make test-api` - Run API tests (backend work)
- `make test-admin` - Run admin UI tests (frontend work)
- `make test-changed` - Run only tests for changed spec files
- `make test` - Run all tests

**Running a single test file:**

```bash
npx playwright test tests/api/admin-summary.spec.ts
```

## Common Troubleshooting

For detailed troubleshooting, see the "When Things Go Wrong" section in
[DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md).

**Quick fixes:**

| Problem | Solution |
|---------|----------|
| Dev server stuck or weird | `make turbopack-reset` then `make dev` |
| Port 3000 in use | `make kill` then `make dev` |
| Tests fail mysteriously | Run the single spec file directly |
| Hot reload not working | `make turbopack-reset` then `make dev` |
| Everything broken | `make reset` or `make reset-full` |

## Where To Read Next

- [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) - Detailed workflow, multi-session model, troubleshooting
- [API_SURFACE.md](API_SURFACE.md) - All HTTP endpoints and response shapes
- [ADMIN_DASHBOARD_OVERVIEW.md](ADMIN_DASHBOARD_OVERVIEW.md) - Main admin interface
- [ADMIN_MEMBERS_UI.md](ADMIN_MEMBERS_UI.md) - Members explorer
- [ADMIN_EVENTS_UI.md](ADMIN_EVENTS_UI.md) - Events explorer
- [ADMIN_REGISTRATIONS_UI.md](ADMIN_REGISTRATIONS_UI.md) - Registrations explorer
- [ADMIN_ACTIVITY_UI.md](ADMIN_ACTIVITY_UI.md) - Activity feed

Welcome to the team!
