Copyright (c) 2025 Santa Barbara Newcomers Club. All rights reserved.

# ClubOS Project History

## Overview

ClubOS is a modern, admin-focused club management system designed to
give officers clear insight into members, events, and registrations,
with a strong emphasis on test coverage, developer experience, and
long-term maintainability.

This document records how the project has been built over time, the
major milestones, and the working model that keeps development moving
quickly while staying under control.

## Development Timeline (Calendar and Hours)

The table below tracks the major phases of the project. The calendar
dates are approximate and may be refined over time. The Hours column
is intended to capture actual or estimated focused work time.

| Phase                                      | Date          | Hours | Notes                                             |
|-------------------------------------------|---------------|-------|---------------------------------------------------|
| Project inception and high-level design   | 2025-12-10    |       | Initial vision, constraints, tech stack agreed    |
| Initial API and admin skeleton            | 2025-12-10    |       | Health check, mock data, basic admin routing      |
| Admin explorers (members, events, regs)   | 2025-12-10    |       | List + detail pages, basic tests                  |
| Activity feed and dashboard enhancements  | 2025-12-10    |       | Recent activity API, dashboard panel, tests       |
| CSV exports and admin tooling             | 2025-12-10    |       | Export endpoints, UI buttons, tests               |
| Pagination (API + UI) and refinements     | 2025-12-11    |       | Paginated admin APIs and explorer tables          |
| Developer tooling and diagnostics         | 2025-12-10-11 |       | Doctor script, smoke tests, preflight, git hooks  |
| Documentation and onboarding              | 2025-12-11    |       | Admin docs, API surface, onboarding, workflows    |
| Authentication and RBAC                   | 2025-12-12    |       | Header-based auth, role checks, VP scoping        |
| Future phases                              | TBD           |       | To be defined as the project evolves              |

Recommended usage:
- Update the Hours column as work is completed.
- Add new rows when new milestones are reached.
- Keep the table roughly in chronological order.

## Major Milestones (So Far)

- Core stack selected:
  - Next.js App Router
  - TypeScript
  - Playwright tests for API and admin UI
  - Mock data modules instead of a live database (for now)

- Admin surface established:
  - /admin dashboard with:
    - Summary tiles
    - System communication tests (email and SMS)
    - Admin search panel
    - Recent activity feed for registrations
  - Admin explorers:
    - /admin/members with detail pages
    - /admin/events with detail pages
    - /admin/registrations with detail pages

- API surface built out:
  - Health and communication test endpoints
  - Member, event, and registration mocks
  - Admin endpoints for summary, search, explorers, activity, and export
  - Pagination added to list endpoints with a consistent response shape

- Developer experience and tooling:
  - scripts/dev/*
    - doctor, kill-next, turbopack-reset, reset-dev, preflight
    - smoke tests, playwright report helpers, test-changed runner
  - Makefile:
    - Standardized commands for dev, tests, lint, types, diagnostics
  - Git hook support for pre-push checks

- Documentation:
  - DEVELOPMENT_WORKFLOW (multi-session model, troubleshooting)
  - API_SURFACE (all major endpoints)
  - Admin UI docs:
    - ADMIN_DASHBOARD_OVERVIEW
    - ADMIN_MEMBERS_UI
    - ADMIN_EVENTS_UI
    - ADMIN_REGISTRATIONS_UI
    - ADMIN_ACTIVITY_UI
  - ONBOARDING (first-time setup and getting productive)

## Team Structure and Workflow

The project is organized into four recurring development streams,
called sessions. Each session focuses on a specific area of the
system:

- Session 1: Backend and APIs
  - Owns the API surface under /api/**
  - Extends mock data modules and admin endpoints
  - Ensures strong API test coverage in tests/api

- Session 2: Admin UI and UX
  - Owns the admin pages under /admin/**
  - Builds explorers, detail pages, and dashboard panels
  - Writes Playwright UI tests in tests/admin

- Session 3: Tooling and Developer Experience
  - Owns scripts/dev and related Makefile targets
  - Focuses on diagnostics, preflight checks, and stability
  - Keeps local development fast and predictable

- Session 4: Documentation and Architecture
  - Owns docs/*.md and the Documentation section in README.md
  - Maintains development workflow, onboarding guides, and admin UI docs
  - Keeps the architecture and API surface understandable for new contributors

A human orchestrator coordinates these sessions:
- Chooses the next set of tasks.
- Assigns work to sessions in parallel.
- Ensures changes are tested and documented before being considered done.

## Working Model

The project follows a few simple rules to stay manageable:

- Feature slices:
  - Each feature is broken into:
    - API changes
    - UI changes
    - Tests
    - Documentation
  - Most work items are limited to 1-2 of these at a time.

- Test-first and test-always:
  - API and UI tests are added or updated with every change.
  - Core commands:
    - make test-api
    - make test-admin
    - make smoke
    - make preflight

- Tooling as first-class:
  - When friction appears (flaky tests, dev server issues, slow feedback),
    Session 3 adds or improves scripts and Makefile targets.
  - The goal is to keep the project feeling fast and trustworthy.

- Documentation as part of the work:
  - New features are not considered complete until:
    - API_SURFACE is accurate for new endpoints.
    - Relevant admin UI docs exist or are updated.
    - The ONBOARDING and DEVELOPMENT_WORKFLOW docs still tell the truth.

## How This History Should Be Updated

When new milestones are reached:

- Add a new row to the Development Timeline table:
  - Pick a short phase name.
  - Add a date or date range.
  - Update the Hours column when you have a rough estimate.

- Add a short bullet to the Major Milestones section if the change
  affects:
  - Admin UI capabilities
  - API surface
  - Tooling or developer experience
  - Documentation or onboarding

- Keep entries factual and concise. This file is meant to help future
  maintainers understand how the system grew over time.

## Authorization Design Decisions

### Why "Mutual Trust" for VP/Chair Relationships

When designing the authorization model for activities management, we considered
three approaches:

1. **Everyone is Admin** - Simple but risky. No accountability.
2. **Strict Approval Workflow** - Safe but slow. Creates bottlenecks.
3. **Mutual Trust Model** - VPs can edit Chair events directly. (Chosen)

We chose the mutual trust model because:

- SBNC volunteers are trusted community members
- Speed matters for event coordination (events have deadlines)
- Minor mistakes can always be fixed (no destructive actions for non-admins)
- VP oversight catches problems before publication
- Audit logging provides accountability without approval queues

This decision is documented in detail in docs/rbac/ACTIVITIES_ROLES.md.

### Problems the VP Scope Model Solves

The VP of Activities scope model addresses several real-world issues:

1. **Chair unavailability**: When an Event Chair is sick or on vacation, their
   VP can step in without admin intervention.

2. **Quality control**: VPs review events before publication, catching errors
   before members see them.

3. **Coordination**: VPs can see all events in their supervised groups,
   preventing scheduling conflicts.

4. **Security boundaries**: VPs cannot see or modify events outside their
   scope, limiting blast radius of mistakes.

5. **Clear accountability**: Each activity area has one VP responsible,
   making it clear who to contact for issues.

## Future Directions (Open-Ended)

The project is intentionally open-ended. Some possible future phases:

- Replacing mock data with a real database and migration plan.
- Member authentication with real session management.
- Deeper integration with club workflows (billing, waitlists, renewals).
- Performance tuning and scaling for larger clubs.
- Additional documentation for deployment, operations, and support.

The exact endpoint of the project is not fixed. This history file is
meant to grow alongside the system, capturing both technical progress
and the choices that shaped it.

## Sunday, 2025-12-14 ~09:30 PT - Worker Docs Sprint and PR Merge Wave

Context:
- This morning continued the parallel "worker" workflow producing small, docs-only PRs to lock down governance, RBAC guardrails, and operating conventions.

Key outcomes:
- Merged PR #60: docs(widgets): embed safety and RBAC guardrails.
  - Vercel deployment check was failing, but merges are not gated by required checks under current repo plan settings; treated as advisory for now.
- Opened PR #62: docs(widgets): assess events widget fit to ClubOS model (Worker 1).
- Opened/updated PR #65: docs(architecture): open source adoption policy (Worker 5).
- Additional docs PRs visible and queued for review/merge:
  - PR #66: docs(gadgets): admin gadgets catalog (Worker 3).
  - PR #68: docs(chatbot): chatbot plugin spec (Worker 4).
  - PR #61: docs(training): JIT training system spec (Worker 4).
  - PR #67: docs(governance): implementation authorization checklist (Worker 2).

Notes:
- The "workers" approach is proving useful for fast, reviewable increments that keep specs and guardrails ahead of implementation.
- Vercel failures should be investigated, but they are not currently blocking documentation merges.

## Sunday Morning 2025-12-14 (Merge Wave 2: Widget + RBAC + Embed Docs)
A second Sunday morning merge wave landed a set of docs-only PRs that tighten the security posture and define the first durable contracts for widgets, embeds, and delegated admin.

Merged:
- PR #34: docs(widgets): embedded widgets security model.
- PR #36: docs(widgets): RBAC admin widgets security model.
- PR #45: docs(api): embed widget SDK contract (v1) + finance approval queue widget contract (read-only).
- PR #53: docs(widgets): embed widget SDK v1 (iframe-first) + public embed README stub.
- PR #39: docs(rbac): delegated admin model for activities and chairs (includes deny-path tests + an activities chatbot support playbook file).

Closed:
- PR #40: docs(chatbot): activities RBAC support playbook (read-only).
  - Reason: superseded by PR #39 (same playbook path), to prevent duplicate/conflicting documentation.

Operational note:
- Vercel preview deploy checks continue to fail intermittently, but (under current repo plan/settings) they do not gate merges. Treat as advisory for docs-only work, but resolve before relying on previews for user-facing changes.
