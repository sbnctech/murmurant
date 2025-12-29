Copyright (c) 2025 Santa Barbara Newcomers Club. All rights reserved.

# The Story of the Murmurant Project

How the idea became a working system and how the team made it happen.

----------------------------------------------------------------

## Chapter 1 - The Moment of Conception

The project began with a simple, ambitious idea:

"Let us build a modern club management system that can eventually
replace the limitations of legacy platforms and give clubs real
control over their members, events, registrations, and communications."

The first sketch of Murmurant included:

- A unified admin dashboard
- Explorer views for members, events, and registrations
- Clean, predictable APIs
- Strong developer experience
- A codebase that could grow into a real product, not just a prototype

From the start, the constraints were clear:

- Industrial discipline, even in early prototypes
- Automatic documentation wherever possible
- Reproducible scripts and Make targets
- Parallel development that feels like a real engineering team
- A long term foundation that can absorb real data, auth, and scale
- ASCII only, no smart quotes, no casual or throwaway code

This set the tone for everything that followed.

----------------------------------------------------------------

## Chapter 2 - The Team That Did Not Exist (But Did)

Instead of a single linear workflow, the project was organized around
four recurring "sessions." Each session acted like a specialized
engineering lane.

Session 1 - Backend

- Owns API endpoints under /api/**
- Defines and evolves the mock data layer
- Handles pagination, search, and filters
- Implements CSV exports and activity feeds
- Keeps tests in tests/api/* passing

Session 2 - Admin UI

- Owns pages under /admin/**
- Builds list and detail "explorer" pages
- Connects UI to admin APIs
- Handles client side interactivity (filters, pagination controls)
- Keeps tests in tests/admin/* passing

Session 3 - Tooling and Developer Experience

- Owns scripts/dev/*
- Adds commands to the Makefile
- Builds diagnostic and repair tools for the dev environment
- Implements preflight and smoke checks
- Keeps local development stable and predictable

Session 4 - Documentation and Architecture

- Owns docs/*.md
- Maintains API_SURFACE, DEVELOPMENT_WORKFLOW, and ONBOARDING
- Documents admin features and architecture maps
- Keeps documentation navigation and structure coherent

Overseeing all of this is the human orchestrator, acting as a kind of
chief architect:

- Assigns tasks to sessions
- Reviews reports from each session
- Tracks project state and decides what comes next
- Keeps the work balanced between features, tests, tooling, and docs

In practice, this feels like a small, disciplined product team.

----------------------------------------------------------------

## Chapter 3 - The Workflow That Feels Like Magic

Each task follows a repeatable pattern:

1. The human orchestrator defines a clear, focused task.
2. A session picks it up and performs the change in isolation.
3. The session reports back with a professional style summary:
   - Files changed
   - Tests run
   - Results
   - Assumptions and gotchas
4. The orchestrator gathers reports from multiple sessions.
5. New tasks are defined based on what just landed.
6. The process repeats, often with several sessions running in parallel.

The effect is a multi threaded development process that keeps the
project moving forward without losing control.

----------------------------------------------------------------

## Chapter 4 - Phase 1: Foundations

The first major milestone was to build a solid skeleton:

- Basic Next.js App Router structure
- Mock data modules for members, events, and registrations
- Health check endpoints
- Communication test endpoints for email and SMS
- Initial admin page shell
- Core Playwright setup for API and UI tests
- Early Makefile targets for dev and test runs
- First scripts under scripts/dev for environment cleanup

This foundation established:

- A predictable code layout
- Consistent patterns for route handlers and components
- Early test coverage so that regressions are caught quickly
- A culture of treating the repo as if it were already heading to production

----------------------------------------------------------------

## Chapter 5 - Phase 2: The Admin System Comes Alive

The second phase turned the skeleton into a functioning admin system.

Members Explorer

- Admin pages to list and view members
- Detail pages per member id
- Admin API endpoints for member summaries and detail
- Pagination added to list responses
- CSV export for members
- Comprehensive tests for API and UI

Events Explorer

- Admin pages for listing and viewing events
- Admin API endpoints for event summaries and detail
- Registration and waitlist counts per event
- CSV export for events
- Matching pagination behavior
- Tests for list and detail flows

Registrations Explorer

- Admin pages listing registrations and showing registration detail
- Status filter (ALL, REGISTERED, WAITLISTED)
- Admin API endpoints for registrations, including:
/api/admin/registrations and /api/admin/registrations/[id]
- CSV export for registrations
- Combined pagination and filtering on the UI side
- Tests for list, detail, and filter behavior

Activity Feed

- Admin API endpoint for recent activity:
/api/admin/activity
- Activity feed section on the main admin dashboard
- Sorting by registeredAt descending, with limits for testing
- UI tests verifying structure, rows, and empty state handling

Admin Dashboard

- Summary tiles with key metrics (members, events, registrations)
- System communication panel for email and SMS test endpoints
- Search panel for members, events, and registrations
- Recent activity panel
- Tests verifying that the dashboard loads and renders expected data

Everything followed a clear path:

Admin UI -> Admin APIs -> Mock data

This makes it straightforward to swap in a real database later.

----------------------------------------------------------------

## Chapter 6 - Phase 3: Documentation Layer

While the system gained features, the documentation layer grew in parallel.

Key documents include:

- DEVELOPMENT_WORKFLOW.md
  - Multi session development model
  - How to pick up a task
  - What to do when things go wrong

- API_SURFACE.md
  - Health and communication endpoints
  - Member, event, and registration endpoints
  - Admin specific endpoints (summary, search, activity, export)
  - Mock data relationships

- Admin UI guides:
  - ADMIN_DASHBOARD_OVERVIEW.md
  - ADMIN_MEMBERS_UI.md
  - ADMIN_EVENTS_UI.md
  - ADMIN_REGISTRATIONS_UI.md
  - ADMIN_ACTIVITY_UI.md

- ONBOARDING.md
  - First time setup
  - Core Make targets
  - How to run tests
  - Where to read next

- INDEX and NAV style docs
  - Central entry points for project documentation

This documentation layer moves Murmurant beyond "demo" status into something
that looks and feels like an internal product platform.

----------------------------------------------------------------

## Chapter 7 - Phase 4: Developer Experience Revolution

The project invested early in developer experience and tooling.

Key scripts under scripts/dev include:

- doctor.sh
  - Checks Node, npm, npx, Playwright, TypeScript, .env, and node_modules

- kill-next.sh
  - Kills Next.js processes on the usual ports

- clean-next-lock.sh, turbopack-reset.sh, reset-dev.sh
  - Clean cache, reset the dev environment, and handle stuck builds

- start-dev-safe.sh
  - Runs doctor, kills stale Next processes, resets Turbopack, then starts dev

- collect-diagnostics.sh
  - Captures environment and git state for debugging

- preflight.sh
  - Runs doctor, types, lint, and tests as a full gate

- smoke.sh
  - Runs doctor, types, lint, and a small set of core tests

- test-changed.sh
  - Detects changed spec files versus main and only runs those tests

- playwright-clean.sh and playwright-report.sh
  - Manage Playwright artifacts and HTML reports

On top of this, the Makefile exposes over twenty targets to wrap
common workflows:

- Setup: doctor, diagnostics, install-hooks
- Development: dev, dev-clean, dev-safe
- Testing: test, test-admin, test-api, test-changed, test-clean, test-report, smoke
- Code quality: types, lint, search, preflight
- Maintenance: kill, clean, turbopack-reset, reset, reset-full
- Docs: docs-nav and related helpers

A git pre push hook runs preflight before allowing a push, enforcing
a strong quality bar.

----------------------------------------------------------------

## Chapter 8 - The Goal: A Replaceable, Modular Murmurant

The intent of Murmurant is clear:

- Provide a complete, navigable, test covered admin interface.
- Back it with clean, composable admin APIs.
- Document the system thoroughly from the start.
- Make onboarding new developers straightforward.
- Keep the architecture ready for:
  - A real database and migrations
  - Role based access control
  - Production deployment and monitoring
  - External integrations
  - Future automation and advanced features

Murmurant is designed to be a credible successor to legacy club systems,
not a disposable experiment.

----------------------------------------------------------------

## Chapter 8.5 - The Authorization Philosophy

When the time came to design access control, a key question emerged:

"How should VPs and Event Chairs work together?"

### The Three Options Considered

Option 1: Make Everyone Admin

The simplest approach. Give all officers full access.

- Pros: No permission errors, fast implementation
- Cons: No accountability, high risk of accidents, no audit trail

This was rejected because mistakes would be hard to trace and there
would be no clear ownership of activities.

Option 2: Strict Approval Workflow

Require VP approval before any Chair action takes effect.

- Pros: Clear chain of command, no unauthorized changes
- Cons: Slow, creates bottlenecks, VPs become overloaded

This was rejected because SBNC activities are time sensitive. Events
have deadlines. Waiting for approval would cause missed publications.

Option 3: Mutual Trust Model (Chosen)

Trust VPs and Chairs to work together. VPs can edit directly but
all changes are logged.

- Pros: Fast workflow, clear accountability, VP can intervene when needed
- Cons: Requires trust between officers

### Why Mutual Trust Won

The deciding factors were:

1. SBNC volunteers are trusted community members who know each other

2. Most changes are routine, not controversial

3. When problems occur, they need fast fixes, not approval queues

4. The audit trail provides accountability without blocking work

5. VPs still have oversight through publication control

### The Publication Gate

The key insight was to separate "editing" from "publishing":

- Event Chairs can create and edit freely within their group
- But only VPs (or Admins) can publish events
- This creates a natural review point without an explicit approval step
- VPs review events before they go public to members

This model gives speed where it matters (drafting, fixing typos) and
control where it matters (what members see).

### The Scope Boundaries

Each VP supervises specific activity groups:

```
VP Sarah: Hiking, Social
VP John: Wine Tasting, Book Club
```

Sarah cannot see John's events. John cannot see Sarah's events.

This was a deliberate choice:

- Prevents accidental changes to wrong events
- Keeps VP dashboards focused on their responsibilities
- Limits blast radius of any mistakes
- Makes accountability crystal clear

### Problems This Model Solves

1. Chair gets sick: VP can take over without admin help
2. Event has a typo: VP can fix immediately, no approval needed
3. Scheduling conflict: VP can see all supervised events to catch it
4. Chair forgets to publish: VP can publish when ready
5. Need to pull back an event: VP can unpublish without admin

### What the Model Does Not Allow

To keep the system safe, some actions are restricted:

- VPs cannot delete events (Admin only)
- VPs cannot see events outside their scope (hard boundary)
- Chairs cannot publish (VP review required)
- Nobody can modify Committee assignments (Admin only)

These restrictions ensure that even trusted officers cannot cause
irreversible damage.

### Documentation for Future Tech Chairs

This authorization philosophy is documented in detail in:

- docs/rbac/AUTH_AND_RBAC.md - Overall system explanation
- docs/rbac/ACTIVITIES_ROLES.md - VP and Chair role guide
- docs/rbac/VP_ACTIVITIES_SCOPE.md - Technical implementation
- docs/HISTORY.md - Design decision rationale

The goal is to ensure future Tech Chairs understand not just HOW the
system works, but WHY it was designed this way.

----------------------------------------------------------------

## Chapter 9 - Where Things Stand Today

By the end of the initial surge of work, the project has:

- Admin explorers for members, events, and registrations
- Detail views for each key entity
- A working activity feed
- Dashboard metrics and panels
- CSV export for members, events, registrations, and activity
- Pagination, filtering, and search in admin lists
- A rich API surface with consistent patterns
- A comprehensive set of API and UI tests
- Strong developer tooling and scripts
- A structured, cross linked documentation set
- A factual history file (HISTORY.md) and this narrative story file (STORY.md)

A rough estimate is that the project is a bit past half way toward
a first "real" platform milestone, with the remaining large pieces
being:

- Database and persistence layer
- Authentication and authorization
- Operational deployment and monitoring
- Additional club specific workflows

----------------------------------------------------------------

## Chapter 10 - The Working Style That Makes This Possible

A few working habits define the project:

- Treat scripted sessions like a real engineering team.
- Insist on clarity in task definitions and reports.
- Prefer small, self contained changes that are easy to test.
- Require ASCII only and consistent naming.
- Keep documentation and tests moving alongside features.
- Use parallel sessions where it reduces latency but still maintain control
  through a single human orchestrator.

The result is a fast moving but disciplined development style.

----------------------------------------------------------------

## Problems, Surprises, and How They Were Resolved

This section is meant to capture issues along the way. It should grow
over time, not be edited down.

Example entries:

- Flaky dev server and test failure
  - Symptom:
    - A Playwright test failed with a server connection error that did not
      reproduce reliably.
  - Likely cause:
    - Race condition between Next.js dev server startup and test execution.
  - Resolution:
    - Introduced safer startup flows (dev safe), better diagnostics, and
      re ran the tests after confirming the server was fully ready.
    - Captured environment details with collect-diagnostics.sh.
    - Confirmed that the test failure was not a logic bug in the app.

- Lint failures during preflight and smoke
  - Symptom:
    - preflight and smoke commands failed due to ESLint errors in files
      outside the active task.
  - Resolution:
    - Treated this as a signal to bring the codebase back to a clean state.
    - Fixed or deferred the issues in a controlled way.
    - Used these failures to validate that the quality gates were working
      as intended.

Future entries should include:

- What went wrong
- How it showed up (symptoms)
- How it was debugged
- What was changed to fix it
- Any follow up actions

----------------------------------------------------------------

## How To Extend This Story

As the project continues:

- Add new chapters or sections for major phases (database, auth,
  deployment, new modules).
- Add entries to the "Problems, Surprises, and How They Were Resolved"
  section whenever a non trivial issue appears.
- Keep the tone factual but narrative, so future readers can understand
  not only what was built, but how it felt to build it.

STORY.md is intended to sit alongside HISTORY.md:

- HISTORY.md holds the timeline, hours, and factual milestones.
- STORY.md holds the narrative arc and lessons learned.

Both should grow together as Murmurant moves toward production.

## Sunday, 2025-12-14 ~09:30 PT - The Sunday Morning Docs Wave

Sunday morning began with a clear goal: keep the story and the rules ahead of the code.

Multiple small documentation PRs landed or were opened in parallel, each one scoped to a single concept and designed to be reviewable:
- One PR codified safe embedding patterns for widgets, explicitly stating what is allowed and what is forbidden.
- One PR captured a plain-language assessment of how an events/calendar widget fits the Murmurant model without drifting into implementation.
- Another PR wrote down a bias toward adopting proven open-source modules to reduce long-term maintenance, while insisting on RBAC, auditability, and clear wrapper boundaries.

A key meta-lesson emerged:
- Even when CI or deployment tooling (like Vercel previews) is noisy, the project can still move forward safely when changes are docs-only, narrowly scoped, and recorded in the canonical history.

This rhythm - short PRs, clear ownership, explicit guardrails - is becoming the working style of the project.

## Sunday Morning 2025-12-14 (Merge Wave 2)
After capturing the narrative and governance intent, the project moved into "contracts first" mode.

A cluster of documentation PRs was merged to lock down how widgets and embedded experiences must behave:
- A dedicated security model for embedded widgets clarified sandboxing, allowed capabilities, and the "deny by default" posture.
- A companion security model for admin widgets clarified RBAC boundaries for list-style gadgets and privileged operations.
- The embed widget SDK contract and an iframe-first SDK note established a clear boundary between Murmurant and any external site embedding Murmurant widgets.
- A first read-only finance approval queue contract was recorded to keep money-adjacent UI safely constrained.
- The Activities delegated admin model landed with explicit deny-path tests and a support playbook, reinforcing that delegation must be auditable and safe.

One small but important hygiene step:
- An overlapping playbook PR was closed as superseded once the richer, bundled version landed, keeping docs canonical and conflict-free.

## Sunday Morning 2025-12-14 (Merge Wave 3)
With embedding and delegated-admin contracts in place, the next step was tightening "operator safety" and "supportability" - especially around chatbot behavior and delegation boundaries.

This merge wave added:
- A chatbot safety contract that makes read-only intent explicit and encodes safe failure modes.
- A delegation matrix that makes who-can-do-what legible at a glance, reducing accidental privilege drift.
- A short set of query runtime guardrails to prevent unsafe or ambiguous query execution paths.
- A practical admin list widgets catalog that treats filters/sorts as RBAC-sensitive (deny by default).
- A VP Activities delegated admin model that complements the broader Activities delegation model already recorded.
- An open source candidates list that supports the "adopt proven modules" bias with a place to track options.

The underlying theme stayed consistent:
- If the system will eventually be operated by non-technical volunteers, the rules must be written down first, in plain language, and kept canonical.
