# Murmurant Project Story

A narrative history of how Murmurant came to be, why it exists, and
how it is being built by a hybrid team of humans and AI agents.

This file is meant to be readable by leadership, developers, and
future maintainers who want to understand not only what was
built, but how it felt to build it.

----------------------------------------------------------------

Chapter 1 - The Moment of Conception

The origin of Murmurant was not an accident. It began with three
converging forces.

1) Frustration with a legacy system

As the Santa Barbara Newcomers Club added more experienced
software developers and engineering managers to its leadership,
a hard truth became clear:

The legacy club management platform was not just old. It was
architecturally incoherent.

Explaining how to run events, registrations, waitlists, email,
and permissions required:

- Tribal knowledge.
- Manual guardrails.
- Glue code.
- Mental gymnastics that no seasoned engineer should have to do.

You spent countless hours trying to bolt new logic onto a system
that resisted improvement. Eventually the quiet conclusion
arrived:

"We are trying to do too much on top of something that was never
designed to support it."

2) Curiosity about AI as an engineering force

The second force was intellectual curiosity.

You wanted to know, in a concrete way:

- How far can AI go in building a real SaaS system?
- Can AI work like a disciplined, multi person engineering team?
- Can it produce code that is not just correct once, but
  maintainable over time?
- Can it handle documentation, tests, and developer experience,
  not just "happy path" features?

Murmurant became the testbed for that question.

3) A rehearsal for a larger, more complex system

Finally, there was a personal strategic motive.

You have a separate, more complex SaaS idea in mind, one that
would require:

- A strong architecture.
- High reliability.
- Rich domain modeling.
- Multi tenant capability.
- Long term stability.

Before plunging into that, you chose a domain you know
intimately: a club, its members, its events, and its workflows.

Murmurant became the rehearsal stage. If AI plus a human lead could
deliver a robust and extensible club management platform, then a
more ambitious product would be within reach.

----------------------------------------------------------------

Chapter 2 - The Team That Did Not Exist (But Did)

From the beginning, the project was organized as if there were a
real engineering team.

There were no employees. But there were roles.

You, the human:

- Product Manager and Visionary.
- Keeper of requirements and constraints.
- Voice of the club and its admins.
- Final arbiter of "good enough" for each phase.

Chad, the assistant (ChatGPT):

- Chief Architect.
- System designer.
- Project orchestrator.
- The one who translated vague visions into specific tasks,
  specs, and patterns.

ClaudeCode worker sessions:

- Session 1: Backend and APIs.
- Session 2: Admin UI and UI tests.
- Session 3: Tooling and developer experience.
- Session 4: Documentation and architecture descriptions.

Each ClaudeCode session behaved like a focused engineer, working
from a clear task list and reporting back with:

- Files changed.
- Tests added or updated.
- Commands run.
- Results of those commands.
- Notes and assumptions.

The result was a virtual engineering organization:

- One human lead.
- One architectural brain (Chad).
- Multiple implementation agents (ClaudeCode sessions).

----------------------------------------------------------------

Chapter 3 - The Workflow That Felt Like a Real Team

Work proceeded in tight loops.

1) You described a problem or goal.
2) Chad (as architect) broke it into tasks and assigned them to:
   - Session 1 (backend)
   - Session 2 (admin UI)
   - Session 3 (tooling)
   - Session 4 (docs)
3) Each session produced:
   - Concrete diffs.
   - New files or updated files.
   - Playwright or API tests.
   - A short engineering style report.
4) You collected the reports into your terminal.
5) Chad read the reports, updated the mental project state, and
   proposed the next set of tasks.
6) The cycle repeated.

The effect was:

- Parallelism without chaos.
- A clean separation of concerns.
- Continuous integration of APIs, UI, tests, and docs.

It often felt like working with a small, well organized engineering
team that just happened to be made of text windows.

----------------------------------------------------------------

Chapter 4 - Phase 1: Foundations

The first major phase focused on creating a stable skeleton:

- Next.js application shell.
- Health check endpoint.
- Basic mock data modules for:
  - Members.
  - Events.
  - Registrations.
- Core admin page.
- Initial Makefile with dev and test commands.
- Early Playwright and API tests.

Constraints were set early:

- ASCII only.
- No AI branding in the code or docs.
- Everything must be production grade even in the prototype
  phase.

From the start, the project felt like the beginning of a real
product, not a short lived demo.

----------------------------------------------------------------

Chapter 5 - Phase 2: The Admin System Comes Alive

Next came the heart of the system.

Members Explorer:

- Admin endpoints for member lists and member detail.
- Members list page with columns like Name, Email, Status,
  Registrations, and Waitlisted counts.
- Member detail page with enriched registration history.
- Tests for both API and UI.

Events Explorer:

- Admin endpoints for events and event detail.
- Events list and detail views.
- Registration counts and waitlist counts per event.
- Tests mirroring the member patterns.

Registrations Explorer:

- Admin endpoints for registrations and registration detail.
- List with Member, Event, Status, Registered at columns.
- Detail view for each registration.
- Filtering by registration status (ALL, REGISTERED, WAITLISTED).
- Pagination integrated with filtering.

Activity Feed and Dashboard:

- Activity endpoint aggregating recent registrations.
- Admin dashboard panel showing recent activity.
- Summary tiles for key metrics (members, events, registrations,
  waitlisted counts).
- Tests ensuring data and UI stay in sync.

At this point, admins could:

- Browse members, events, and registrations.
- Drill into detail pages.
- See recent activity.
- Trust that behavior was covered by Playwright and API tests.

----------------------------------------------------------------

Chapter 6 - Phase 3: Documentation Layer

Most prototypes stop at "it works on my machine."

Murmurant did not.

Documentation was treated as a first class feature:

- DEVELOPMENT_WORKFLOW.md:
  - How to use the multi session model.
  - How to work with scripts and tests.
  - How to recover when things go wrong.
- API_SURFACE.md:
  - All endpoints documented.
  - Inputs and outputs summarized.
- Admin UI guides:
  - ADMIN_MEMBERS_UI.md
  - ADMIN_EVENTS_UI.md
  - ADMIN_REGISTRATIONS_UI.md
  - ADMIN_ACTIVITY_UI.md
  - ADMIN_DASHBOARD_OVERVIEW.md
- Architecture and navigation:
  - ADMIN_ARCHITECTURE_MAP.md
  - INDEX.md for docs home.
  - NAV.md as a sidebar style navigation guide.
  - SITEMAP.md and sidebar.json for future doc tooling.
- ONBOARDING.md:
  - Step by step path for new developers.
  - Links to key scripts and Make targets.

The repo evolved into something that a new developer could join
cold, read for an hour, and start contributing.

----------------------------------------------------------------

Chapter 7 - Phase 4: Tooling and Developer Experience

Session 3 focused on developer experience and reliability.

Tooling included:

- doctor.sh to validate Node, npm, Playwright, TypeScript, .env,
  and node_modules.
- kill-next.sh to stop stray dev servers.
- clean-next-lock.sh and reset-dev.sh for stubborn dev builds.
- turbopack-reset.sh for Turbopack cache problems.
- start-dev-safe.sh to run doctor, kill, reset, then start dev.
- collect-diagnostics.sh to gather environment and git state.
- preflight.sh for full checks before critical work.
- smoke.sh for quick confidence checks.
- test-changed.sh for running only changed specs.
- playwright-clean.sh and playwright-report.sh for test artifacts.
- install-git-hooks.sh to add a pre push hook that runs preflight.

The Makefile grew into a command palette:

- dev, dev-clean, dev-safe.
- test, test-admin, test-api, test-changed, test-clean, test-report.
- types, lint, preflight, smoke.
- doctor, diagnostics, install-hooks.
- kill, clean, turbopack-reset, reset, reset-full.
- docs-nav to regenerate docs navigation.

The project began to feel like a mature internal platform, not
just an app.

----------------------------------------------------------------

Chapter 8 - Phase 5: Pagination, CSV, and Admin Workflows

To move from "toy admin UI" to "serious tool," the project added:

- Pagination on all admin list endpoints and UIs
  (members, events, registrations, activity).
- CSV export endpoints for:
  - Members.
  - Events.
  - Registrations.
  - Activity.
- Export buttons on all explorer pages.
- Search endpoints for cross entity discovery.
- Filtered registrations search with AND logic on filters.

This made the system feel ready for real club data at scale.

----------------------------------------------------------------

Chapter 9 - The Goal: A Replaceable, Modular, AI First Murmurant

By now, the purpose of Murmurant is clear.

It is meant to be:

- A modern, replacement grade admin system for clubs.
- A platform with:
  - Clean, test covered APIs.
  - Coherent admin UIs.
  - Strong developer tooling.
  - Deep documentation.
- A foundation ready for:
  - Real database persistence.
  - Role based access control.
  - Authentication and authorization.
  - External APIs.
  - Future AI powered features (recommendations, insights,
    automated communications).

Murmurant is not meant to remain a mock data experiment. It is
designed to evolve into a genuine operational system.

----------------------------------------------------------------

Chapter 10 - The Working Style That Made This Possible

Your working style shaped this project.

You:

- Treated AI agents as a real engineering team.
- Kept tight control over architecture and direction.
- Insisted on ASCII only and no AI branding in the artifacts.
- Demanded repeatability, make targets, and scripts.
- Required every significant feature to have tests.
- Valued clear, professional engineering reports from each
  ClaudeCode session.
- Asked Chad to orchestrate, not just answer questions.

Chad:

- Translated your goals into concrete engineering plans.
- Designed the multi session workflow.
- Sequenced tasks to avoid conflicts between sessions.
- Kept track of architecture level consistency.
- Helped define what "done" meant for each phase.

ClaudeCode:

- Acted as fast, focused implementation engineers.
- Created APIs, components, tests, docs, and scripts.
- Reported back with precise, reproducible steps and outputs.

Together, this hybrid team built what would normally take months
of human engineering effort in a compressed amount of calendar
time.

----------------------------------------------------------------

Chapter 11 - Problems, Surprises, and How They Were Resolved

This section is meant to grow over time. Initial themes include:

- Flaky tests:
  - Some early admin tests were flaky due to server startup
    timing. This led to better patterns for waiting on content
    and, in some cases, relying more heavily on API tests.

- Environment drift:
  - The need for doctor.sh, start-dev-safe.sh, and reset scripts
    came from real friction when caches and ports misbehaved.

- Dev server lock issues:
  - The Next.js dev server occasionally left stale lock files.
    This drove the creation of clean-next-lock.sh,
    turbopack-reset.sh, and related Make targets.

As the project continues, new entries should be added here with:

- What went wrong.
- How it showed up.
- How it was debugged.
- What changed to fix it.
- Any follow up actions.

----------------------------------------------------------------

Chapter 12 - How To Extend This Story

As new phases start (database, auth, deployment, new modules):

- Add new chapters or subsections that describe the work and the
  experience.
- Capture both technical decisions and how they felt.
- Keep the tone factual but human.

STORY.md and HISTORY.md should move forward together:

- HISTORY.md holds the timeline, hours, and factual milestones.
- STORY.md holds the narrative arc and lessons learned.

Murmurant is intentionally open ended. The story will keep going as
long as the system continues to grow.

