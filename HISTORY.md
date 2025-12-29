# Murmurant Project History

This file captures the factual history of the Murmurant project:
what was built, when it was built, and roughly how much effort it
took in days and hours.

It is a companion to STORY.md:
- HISTORY.md is factual and timeline oriented.
- STORY.md is narrative and reflective.

All dates and hours are approximate and intended as a planning and
retrospective aid, not as a precise timesheet.

----------------------------------------------------------------

## Origins and Motivation

Project motivation came from three converging forces:

1. Legacy system fatigue  
   As the Santa Barbara Newcomers Club added more experienced
   developers and managers, it became clear that the existing
   club management platform was architecturally incoherent.
   Managing events, registrations, waitlists, email, and
   permissions required duct tape, tribal knowledge, and
   constant vigilance.

2. Curiosity about AI as an engineering force  
   The project was also an experiment: could AI, organized as a
   disciplined multi-agent team, build a complex SaaS system
   that is functional, testable, maintainable, documented, and
   extensible?

3. A rehearsal for a more complex future system  
   There is a separate, more ambitious SaaS system under
   consideration. Murmurant serves as a proving ground where the
   domain is deeply understood and user needs are well known,
   making it an ideal environment to test AI driven development.

----------------------------------------------------------------

## Roles

Product Manager and Visionary:
- Defines goals, constraints, and priorities.
- Represents club requirements and admin workflows.
- Decides when features are "good enough" and sets the roadmap.

Chief Architect and Orchestrator (Chad, the ChatGPT assistant):
- Turns high level ideas into concrete development specs.
- Designs the multi session workflow and task breakdown.
- Coordinates and sequences work across all agents.
- Maintains consistency of architecture, APIs, UI, tests, and docs.

Implementation Team (ClaudeCode sessions):
- Session 1: Backend and API endpoints.
- Session 2: Admin UI and Playwright UI tests.
- Session 3: Tooling, scripts, and Make targets.
- Session 4: Documentation, architecture, and onboarding materials.

----------------------------------------------------------------

## Timeline (First Major Build Cycle)

Note: All times are approximate and reflect one intense build
cycle primarily on a single day.

### Day 0: Pre history (before this repo)
- Date: Prior to this push
- Activity:
  - Years of experience running Newcomers Club workflows.
  - Deep familiarity with the pain points of the legacy system.
  - Conception of the idea for a modern club platform.
- Estimated hours: Many spread over months and years.
- Notes: This experience provides the domain knowledge that
  makes rapid progress on Murmurant possible.

### Day 1: Foundation and Admin System (Initial build)
- Date: 2025 12 11 (approximate for this cycle)
- Activity:
  - Define multi agent development model with four sessions.
  - Establish ASCII only and "no AI tells" constraints.
  - Create core Next.js app structure.
  - Introduce mock data modules for members, events, and
    registrations.
  - Implement health and communication test APIs
    (email and SMS test endpoints).
  - Add basic admin page and health/system communications panel.
  - Create first round of API and UI Playwright tests.
  - Build initial Makefile for dev and test commands.
- Estimated hands on keyboard hours (Ed): 6 8
- Estimated AI development hours (equivalent): 20 30
- Notes: The project moves from concept to a living codebase
  with tests and a clear architecture.

### Day 1 (continued): Explorers and Dashboard
- Activity:
  - Members Explorer: list and detail pages, admin endpoints,
    pagination ready data models.
  - Events Explorer: list and detail pages, matching admin
    endpoints.
  - Registrations Explorer: list and detail pages, including
    status filtering (REGISTERED vs WAITLISTED).
  - Admin summary and dashboard endpoints for high level
    metrics.
  - Admin dashboard UI with summary tiles and activity feed.
  - Cross linking between explorers and detail pages.
  - CSV exports for members, events, and registrations.
- Estimated incremental hours (Ed): 3 4
- Estimated AI development hours (equivalent): 15 20
- Notes: Admins can now browse and inspect all key entities
  (members, events, registrations) from a coherent UI.

### Day 1 (continued): Activity Feed and Advanced Admin APIs
- Activity:
  - Admin activity endpoint aggregating registrations into a
    chronological activity feed.
  - Admin activity panel on the dashboard UI with recent
    registrations.
  - Pagination for all admin list endpoints
    (members, events, registrations, activity).
  - Search endpoints for admin use cases:
    - Cross entity search over members, events, registrations.
    - Member detail endpoints with enriched registrations.
    - Event detail endpoints with enriched registrations.
    - Registration detail endpoints.
    - Filtered registrations search.
  - CSV export endpoints for activity.
- Estimated incremental hours (Ed): 2 3
- Estimated AI development hours (equivalent): 10 15
- Notes: Admins have both broad and focused views of the data,
  with consistent list/detail patterns across the system.

### Day 1 (continued): Tooling and Developer Experience
- Activity:
  - Scripts under scripts/dev:
    - doctor.sh (environment validation)
    - kill-next.sh
    - clean-next-lock.sh
    - reset-dev.sh
    - turbopack-reset.sh
    - start-dev-safe.sh
    - collect-diagnostics.sh
    - preflight.sh
    - smoke.sh
    - test-changed.sh
    - playwright-clean.sh
    - playwright-report.sh
    - install-git-hooks.sh
  - Git pre push hook running preflight.
  - Makefile with 20+ targets for development, testing, and
    maintenance.
  - Commands for targeted test runs (admin, api, changed specs).
- Estimated incremental hours (Ed): 1 2
- Estimated AI development hours (equivalent): 8 12
- Notes: The repo now behaves like a mature engineering project,
  with strong DX and guardrails.

### Day 1 (continued): Documentation Layer
- Activity:
  - docs/DEVELOPMENT_WORKFLOW.md
  - docs/API_SURFACE.md
  - docs/ADMIN_MEMBERS_UI.md
  - docs/ADMIN_EVENTS_UI.md
  - docs/ADMIN_REGISTRATIONS_UI.md
  - docs/ADMIN_ACTIVITY_UI.md
  - docs/ADMIN_DASHBOARD_OVERVIEW.md
  - docs/ADMIN_ARCHITECTURE_MAP.md
  - docs/ONBOARDING.md
  - docs/INDEX.md (docs home)
  - docs/NAV.md (sidebar style nav)
  - SITEMAP.md and sidebar.json for future doc tooling.
  - README.md updates linking to all major docs.
- Estimated incremental hours (Ed): 1 2
- Estimated AI development hours (equivalent): 8 10
- Notes: New developers can now onboard using only the docs and
  scripts, without prior conversations.

### Day 1 (continued): Story and History Artifacts
- Activity:
  - Create STORY.md to capture the narrative of the project,
    including motivations, roles, and how multi agent AI was
    used (Chad as architect, ClaudeCode as worker sessions).
  - Create HISTORY.md to track timeline, hours, and milestones.
  - Establish guidelines for extending both files over time.
- Estimated incremental hours (Ed): 0.5 1
- Estimated AI development hours (equivalent): 3 5
- Notes: The project gains a human readable history and a
  narrative record that can grow as Murmurant evolves.

----------------------------------------------------------------

## High Level Completion Estimate

For the "Admin and Internal Platform" milestone:

- Admin UI: about 70 percent complete
- Admin APIs: about 80 percent complete (for current scope)
- Tooling and tests: about 80 percent complete
- Documentation: about 70 percent complete

For the full long term Murmurant vision (database, auth, external
APIs, production deployment), the project is intentionally open
ended. This first build cycle is roughly:
- 60 70 percent of a solid internal prototype
- 25 35 percent of a production ready SaaS system

These numbers are intentionally approximate and will be refined
as new phases are planned.

----------------------------------------------------------------

## How To Update This File

Whenever a new major phase or feature set is completed:

1. Add a new dated entry under the Timeline section.
2. Describe:
   - What was built.
   - Why it was built.
   - Any significant architectural decisions.
   - Rough hours of effort from the human lead.
3. If a phase materially changes the architecture, reference the
   relevant docs (for example, new database schema docs or auth
   design).

HISTORY.md should grow slowly but steadily, mirroring how the
system grows from prototype into production.


## Day 2 — Deployment Tooling & Build Verification
Calendar Day: Day 2
Status: Complete
Scope: Tooling, CI/CD validation, no production activation

### Summary
Day 2 focused on validating deployment tooling and ensuring the Murmurant codebase builds and deploys cleanly in a hosted environment without introducing runtime configuration, data migrations, or production credentials.

### Completed
- Git repository clean and synced with main
- ASCII documentation checks passing
- Pre-push hooks verified
- Vercel project connected to GitHub repo sbnctech/murmurant
- Next.js framework auto-detected by Vercel
- Root Directory confirmed empty (repo-root app)
- Full production build succeeded on Vercel
- Prisma client generated during build
- Static and dynamic routes generated correctly
- Admin UI routes present (/admin/*)
- API routes present (/api/* and /api/v1/*)
- Local dev server verified with health endpoint returning {"status":"ok"}
- No untracked or backup artifacts remain

### Explicit Non-Actions
- No environment variables configured
- No database migrations run
- No authentication providers enabled
- No DNS or domain changes
- No production data introduced

### Current State
- Deployment tooling validated
- Project is deployable but not runtime-configured
- System remains in safe pre-production posture

### Next Planned Scope (Day 3, not started)
- Environment variables
- Runtime configuration (Prisma, auth, email)
- Controlled activation of external dependencies


---

## Day 3 — Runtime Configuration & Environment Wiring
Calendar Day: Day 3
Status: Not started
Scope: Environment variables, runtime services, controlled activation

### Objectives
- Define required environment variables (no secrets committed)
- Prepare Prisma runtime configuration (no migrations yet)
- Prepare auth/email/SMS wiring in disabled or test mode
- Keep production safety guarantees intact

### Guardrails
- No destructive database actions
- No live credentials enabled
- No irreversible external integrations
- All changes reversible

### Planned Work Items
- ENV variable inventory and documentation
- Vercel environment setup (Preview only)
- Runtime health verification
- CI confirmation


---

## Day 2 — Tooling, CI Discipline, and Deployment Validation
Calendar Day: Day 2
Status: Complete (locked)

### Accomplishments
- Preflight tooling stabilized (lint, typecheck, build)
- Pre-push hook updated to skip integration tests locally (CI responsibility)
- ESLint errors resolved; warnings acknowledged and deferred
- Build verified locally and on Vercel
- Prisma client generation validated
- Dev server verified with live health endpoint
- No untracked or backup artifacts remain

### Deployment Verification
- Vercel build completed successfully
- 39 static pages generated
- 44 dynamic routes compiled
- All /api and /api/v1 routes present
- Admin UI routes verified
- Build artifacts traced and deployed without error

### Safety Posture
- No database migrations executed
- No production credentials enabled
- No external services activated
- No irreversible actions taken

Day 2 closes with a clean, reproducible, deployable baseline.


### Day 2 Closeout - DB Migration Baseline
- Confirmed local dev DB had Murmurant tables but no _prisma_migrations history (likely created via db push)
- Archived prior migration folders to prisma/migrations_archive/
- Removed non-baseline migrations from prisma/migrations/
- Marked 00000000000000_init as applied using prisma migrate resolve (no schema changes)
- Result: migration history now matches existing schema safely

