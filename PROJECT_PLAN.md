# ClubOS Project Plan

Copyright (c) Santa Barbara Newcomers Club

This plan describes the current implementation phases for ClubOS.
It is kept short and practical so it can be read quickly before coding sessions.

All files and code in this repository must use ASCII only and avoid smart quotes.
All markdown files must be formatted to render cleanly in MacDown.

--------------------------------------------------
Phase 0: Foundation (completed)
--------------------------------------------------

- Create clubos repository under sbnctech.
- Initialize Next.js 16 app router project with TypeScript and Tailwind.
- Enable React strict mode and the React compiler with a conservative configuration.
- Add basic app layout and health check endpoint at /api/health.
- Add Playwright test harness and a simple health endpoint test.

Status: completed.

--------------------------------------------------
Phase 1: Admin frame and mock data dashboards (completed)
--------------------------------------------------

Goals

- Prove out the admin shell structure and Playwright based regression tests.
- Use purely in memory mock data and simple Next.js route handlers.

Deliverables

- /admin-frame wrapper page hosting an iframe for /admin.
- /admin dashboard page with:
  - Members overview table backed by /api/members.
  - Events overview table backed by /api/events.
  - Registrations overview table backed by /api/registrations.
- Initial mock implementations for:
  - /api/members
  - /api/events
  - /api/registrations
- Playwright tests:
  - Admin page loaded: iframe ready.
  - Admin members table renders mock members.
  - Admin events table renders mock events.
  - Admin registrations test is present but currently skipped.
- Initial SMS and email test endpoints with file or console based logging.

Status: completed for mock data and smoke tests.

--------------------------------------------------
Phase 2: Real database backend (in progress)
--------------------------------------------------

Goals

- Replace ad hoc Member model with a normalized Contact and Membership model.
- Back the admin dashboards with a real database accessed through Prisma.
- Keep the admin UI and tests stable while swapping in the database.

Data model

- Use Postgres as the target provider and Prisma as the ORM.
- Define the following core models in prisma/schema.prisma:
  - Contact
  - Membership
  - Event
  - Registration
  - SmsMessageLog
- Define enums:
  - MembershipStatus (ACTIVE, LAPSED, ALUMNI, PROSPECT)
  - MembershipLevel (NEWBIE, NEWCOMER, EXTENDED, BOARD, ALUMNI_LEVEL, OTHER)
  - RegistrationStatus (REGISTERED, WAITLISTED, CANCELLED, NO_SHOW)
  - SmsDirection (OUTBOUND, INBOUND)
  - SmsStatus (PENDING, SENT, DELIVERED, FAILED, RECEIVED)

Implementation steps

- Prisma setup
  - Ensure prisma/schema.prisma reflects the Contact plus Membership design.
  - Run prisma migrate dev to create the dev database.
  - Run prisma generate to produce the Prisma client.

- Seed script
  - Add scripts/seed-dev.ts that:
    - Clears existing tables.
    - Creates two Contacts: Alice Johnson and Bob Smith.
    - Adds ACTIVE NEWBIE Memberships for both contacts.
    - Creates two Events: Welcome Hike and Wine Mixer.
    - Creates two Registrations:
      - Alice registered for Welcome Hike.
      - Bob waitlisted for Wine Mixer.

- API rewiring
  - /api/members:
    - Query Membership records with status ACTIVE and include Contact.
    - Return a simplified array of member objects:
      - id
      - firstName
      - lastName
      - email
  - /api/events:
    - Query Event rows ordered by startTime.
    - Return minimal fields required by the admin dashboard.
  - /api/registrations:
    - Query Registration rows including Contact and Event.
    - Return a flattened structure suitable for the admin registrations table.

- Admin dashboards
  - Keep the existing admin page structure but ensure:
    - Members overview is now backed by the real database.
    - Events overview is now backed by the real database.
    - Registrations overview is prepared to consume the flattened DB backed data.

- Tests
  - Update or confirm Playwright tests so that:
    - Admin members test passes using DB seeded Alice and Bob.
    - Admin events test passes using DB seeded Welcome Hike and Wine Mixer.
    - Admin registrations test remains skipped until the UI is finalized.
    - Email test endpoint test passes using the mock email provider and log.

Status

- Schema updated to use Contact and Membership.
- Prisma format and migrate dev have been run successfully.
- Further steps are in progress.

--------------------------------------------------
Phase 3: Email delivery and activity views (planned)
--------------------------------------------------

Goals

- Provide a stable abstraction for sending email from ClubOS.
- Continue to use a mock provider in development, with a path to plug in a real provider later.
- Give admins a simple way to see what messages were sent.

Scope

- Email provider interface:
  - Simple TypeScript interface for sending messages.
  - Mock implementation that writes to a local log file under tmp/.
- API endpoints:
  - /api/email/test for verifying connectivity in tests and in the admin UI.
- Admin pages:
  - Email Activity section that lists recent messages with:
    - To address.
    - Subject or template name.
    - Timestamp.
- Tests:
  - Playwright test that calls the email test endpoint and verifies that the admin Email Activity table shows the new entry.

Status: not started.

--------------------------------------------------
Phase 4: SMS and two way messaging (deferred)
--------------------------------------------------

Goals

- Add structured support for SMS messaging without blocking earlier milestones.
- Allow experimentation with providers such as Twilio or Trellis while preserving the Contact centric data model.

Current decision

- SMS is logged via SmsMessageLog but full two way behavior and provider integration are deferred.
- Requirements and design notes are captured in SYSTEM_SPEC.md.
- Implementation work will start only after Phase 2 and Phase 3 are stable.

## Status update 2025-12-11: database foundation

The project now has a working relational schema and local database for development.

Completed:

- Installed PostgreSQL 16 via Homebrew and started it as a background service.
- Created a dedicated "clubos" role with login and createdb privileges.
- Created a "clubos" database owned by the "clubos" role.
- Configured DATABASE_URL in .env to use:
  - postgresql://clubos:clubos@localhost:5432/clubos
- Defined the following Prisma models and applied an initial migration:
  - Contact
  - Membership
  - Event
  - Registration
  - SmsMessageLog
- Verified that tables exist in the "clubos" database and that Prisma Client can be generated successfully.

### Current constraints

- The admin dashboard UI (members, events, registrations) is still backed by mock API endpoints.
- No production-ready seed data yet; only minimal or mock data for development.
- All database access is local-only; there is no production database or cloud deployment wired up yet.

### Next milestones (contact- and membership-centric)

Short term:

- Replace mocked /api/members with a real Prisma-backed /api/contacts endpoint that:
  - Lists Contacts plus their current membership status.
  - Implements simple pagination and basic filters (for example: current members only, lapsed, all contacts).
- Replace mocked /api/events and /api/registrations with Prisma-backed endpoints:
  - /api/events:
    - Fetches events from the Event table.
  - /api/registrations:
    - Joins Registration with Contact and Event for admin reporting views.
- Update the admin dashboard to:
  - Render data directly from the new DB-backed endpoints.
  - Treat "members" as a view over Contacts plus active Memberships, not as a standalone entity.

Medium term:

- Implement a one-way import pipeline:
  - Pull membership and contact data from the current live system into Contact and Membership.
  - Ensure there is a clear mapping from upstream membership states into Membership rows and periods.
- Add a simple email sending queue that uses Contacts as the root entity:
  - Start with the mock email logging already in place.
  - Later, plug in a real transactional email provider.

Longer term:

- Introduce role- and permission-aware views on top of Contacts, Memberships, Events, and Registrations.
- Add robust audit logging on membership changes and event registrations.
- Prepare for multi-tenant or multi-chapter support once the single-club version is stable.

## Workplan alignment

The project plan should now assume:

- "Member" is not a first-class persistence concept.
- Contacts, Memberships, Events, Registrations, and SmsMessageLog are the canonical models.
- Any remaining plan items that refer to a Member table or Member entity should be interpreted as:
  - "Query Contacts and Memberships to show member-like views."

These assumptions supersede any earlier notes that treated "Member" as a top-level model.

## Email infrastructure (current status and gaps)

### 1. Test email endpoint

Status: Phase 1 complete

- Implemented POST /api/email/test using a mockEmailSend helper.
- Endpoint accepts JSON:
  - to (string)
  - subject (string)
  - body (string)
- Responds with:
  - { ok: true, to, messageId }
- Fully covered by Playwright test.
- Currently uses mock provider only.

Open items:

- Replace mockEmailSend with real provider adapter (Resend, SES, etc.).
- Provide environment-based switching (mock in test, real in staging/prod).
- Add consistent error-handling and retry logic.

---

### 2. Email log endpoint

Status: Phase 1 (API contract + tests) complete, persistence not yet implemented

- Implemented POST /api/email/log and GET /api/email/log.
- Current behavior uses in-memory emailLog array:
  - POST stores { id, subject, body, createdAt }
  - GET returns { emails }
- Covered by Playwright tests confirming:
  - POST works and returns id
  - GET returns array containing that id
- No database persistence yet.
- This is intentional for scaffolding; the API contract is locked in before wiring persistence.

Long-term intended design:

- EmailMessageLog table in Postgres via Prisma
- Each entry can store:
  - MemberId (nullable)
  - Subject, body, providerMessageId
  - Status: SENT, FAILED, etc.
  - Timestamps
- Replace in-memory storage with Prisma repository.

---

### 3. Follow-up work required

Planned next steps (not yet done):

1. Prisma Model
   - Add EmailMessageLog to prisma/schema.prisma.
   - Run migrations.
   - Implement repository with createEmailLog() and listRecentEmailLogs().

2. Route updates
   - Update /api/email/test to:
     - Send via real provider (non-test env)
     - Persist log to database
   - Update /api/email/log to read from database instead of in-memory array.

3. Testing
   - Keep Playwright tests as contract tests.
   - Add integration tests for Prisma persistence.
   - Add optional E2E test using a test database.

Note:
We intentionally stopped at mock provider + in-memory logging to unblock development and lock in route behavior before integrating full persistence and external email infrastructure.


### Email subsystem test status (2025-12-11)

As of this stage, the following API tests are passing:

- tests/api/email-test.spec.ts
- tests/api/email-log.spec.ts
- tests/api/email-log-store.spec.ts

Notes

- The SMS test timeout remains a pre-existing issue and is not related to the recent email and email-log work.

Development Stages Checklist (Status Snapshot)

- Stage 1: Baseline health endpoint
  - Status: Complete
  - /api/health implemented and covered by tests/api/health.spec.ts.

- Stage 2: Core data model and Prisma scaffolding
  - Status: In progress
  - Prisma schema and initial migrations created for contacts, memberships, invoices, payments, and email_message_log.
  - Prisma Client generates successfully via "npx prisma generate".
  - Application endpoints do not yet depend on Prisma for email or SMS flows.

- Stage 3: Communication primitives (email, SMS, log)
  - Status: Complete (mocked implementation)
  - /api/email/test:
    - Uses a mock email sender in server/mock-email.ts.
    - Returns a JSON payload with ok, to, and messageId fields.
    - Covered by tests/api/email-test.spec.ts.
  - /api/sms/test:
    - Uses a mockSmsSend helper.
    - Returns a JSON payload with ok, to, and messageId fields.
    - Covered by tests/api/sms-test.spec.ts.
  - /api/email/log:
    - Uses an in-memory emailLog array to store recent entries during a process lifetime.
    - Provides a POST endpoint that stores id, subject, body, createdAt.
    - Provides a GET endpoint that returns the most recent entries.
    - Covered by tests/api/email-log.spec.ts and tests/api/email-log-store.spec.ts.
  - All tests under tests/api are currently green.

- Stage 4: Admin-facing shell and basic monitoring UX
  - Status: Not started
  - Goal:
    - Implement /admin-frame as a simple wrapper page that hosts an iframe.
    - Implement /admin as a minimal admin shell with:
      - Email activity table (data-test-id="admin-email-table").
      - Events table (data-test-id="admin-events-table").
      - Members table (data-test-id="admin-members-table").
      - Registrations table (data-test-id="admin-registrations-table").
    - Normalize admin Playwright tests so they use PW_BASE_URL (defaulting to http://localhost:3000) instead of hardcoded ports.
  - Current state:
    - Admin-related tests in tests/admin/ are red.
    - No committed implementation yet for /admin or /admin-frame that satisfies the tests.
  - Next action:
    - Implement minimal /admin and /admin-frame pages plus supporting mocks so that all tests in tests/admin pass against the mocked data.

Notes
- The communication endpoints and email log are intentionally implemented against in-memory stores for now.
- Once the Prisma configuration is stable in real environments, the plan is to move the email log off of memory and into the email_message_log table, and update the tests and documentation accordingly.

## Update: Email and Admin Infrastructure (2025-12-11)

### Completed
- Fixed admin test environment mismatch by updating tests/admin/admin-registrations.spec.ts  
  (hardcoded http://localhost:3002/admin replaced with PW_BASE_URL ?? "http://localhost:3000").
- Updated src/app/api/email/test/route.ts to use sendEmail from @/lib/email, ensuring admin Email Activity reflects sent test emails.
- Corrected getBaseUrl.ts so server-side code respects process.env.BASE_URL instead of hardcoding port 3002.
- All admin and API tests now pass:
  - 5/5 admin tests
  - 10/10 API tests

### Follow-up Tasks
- Replace mock API routes (/api/members, /api/events, /api/registrations) with Prisma-backed implementations once schema is stabilized.
- Introduce authentication and role-based access control for admin routes.
- Add filtering (search, date range, status) to admin tables.
- Consolidate email logging mechanisms into a unified library.
- Add `.env.example` documenting BASE_URL, DATABASE_URL, PW_BASE_URL, and MAIL_LOG_PATH.


## 2025-12-11: Member API and Partner Delegation Notes

Member API alignment

- Confirmed definition:
  - "Members" = Contacts with at least one ACTIVE Membership.
- Plan:
  - Keep the current mock-backed /api/members implementation and tests stable while Prisma configuration is still being hardened.
  - Later stage:
    - Switch the members endpoint to Prisma-backed queries.
    - Either:
      - Seed test fixtures for members, or
      - Loosen tests to assert shape and semantics (fields, status logic) instead of specific names.

Partner event-registration delegation

- New requirement:
  - Support a delegation mechanism so that one member can register another member for events.
  - Primary scenario:
    - Couples or partners who are both members and want either one to handle registrations for both.
- Roadmap placement:
  - Short term:
    - Keep requirement documented only (no production code yet).
    - Avoid blocking current communications and admin shell work.
  - Medium term:
    - Add Delegation model and basic API support as part of the broader "event registrations and permissions" stage.
  - Long term:
    - Integrate into the full permissions and auditing system so that:
      - Audit logs can distinguish between "who is attending" and "who performed the action".
      - UI surfaces delegated rights in a clear and predictable way.

Coordination with engineering workflow

- Until Prisma initialization is fully resolved:
  - Continue using mock stores and in-memory implementations (like the email log) where it keeps tests green and behavior observable.
  - Mark any new Prisma-dependent work as blocked and staged for later refactor.
- This plan allows:
  - ClaudeCode and other agents to continue evolving admin views, tests, and communication flows.
  - Minimal churn in core data-model code until the database layer is stable.

## Backlog

- [V2] Testing (system-wide)
  - Spec: docs/TESTING_STRATEGY.md
  - Add npm scripts: test:unit, test:integration, test:e2e, test:ci
  - Establish integration test harness (API + RBAC + DB strategy)
  - Add RBAC test matrix coverage
  - Add coverage ratchet (incremental thresholds)
