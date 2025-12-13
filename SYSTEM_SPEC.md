Copyright (c) Santa Barbara Newcomers Club
All rights reserved.

SYSTEM SPECIFICATION
ClubOS Platform
ASCII Only
No external branding references

----------------------------------------------------------------------

1. System Overview

ClubOS is the membership, events, communication, and operations platform
for SBNC. It replaces legacy systems and provides a unified, modern,
API-first foundation. The system must support the following domains:

- Member directory and profile management
- Event creation, registration, attendance, and waitlist flows
- Communications (email, SMS, two-way texting)
- Roles and permissions for staff and volunteers
- Notifications framework
- Admin control panel
- Structured activity logs for all actions
- Integration surfaces for future modules

All files and documentation must use ASCII characters only.
All content must be suitable for rendering in MacDown.
All code, docs, and internal text blocks must be written as if they were
produced by a professional software team (no meta commentary).

----------------------------------------------------------------------

2. Architecture Summary

- Next.js application in TypeScript
- PostgreSQL primary datastore via Prisma ORM
- API routes in Next.js for all server functions
- Modular subsystem boundaries:
  - members
  - events
  - registrations
  - waitlist
  - sms
  - email
  - notifications
  - permissions
  - admin_ui
  - integrations

Testing:
- Playwright for end-to-end tests
- Test data must use deterministic fixtures
- UI must expose stable data-test-id attributes for selectors

----------------------------------------------------------------------

3. Member Subsystem

3.1 Data Model
Members have:
- id
- first_name
- last_name
- email
- phone
- membership_level
- status
- created_at
- updated_at

3.2 Core Requirements
- Searchable member directory
- Per-member communication preferences
- Opt-in state for SMS and email
- View and update profile (admin-managed)

----------------------------------------------------------------------

4. Events Subsystem

4.1 Data Model
Events include:
- id
- title
- category
- description
- start_time
- end_time
- location
- capacity
- created_by
- created_at
- updated_at

4.2 Registration Model
Registrations include:
- id
- event_id
- member_id
- status (registered, cancelled, waitlisted)
- created_at
- updated_at

4.3 Waitlist Rules
- When capacity is reached, new registrations join the waitlist.
- When a registered member cancels, the earliest waitlisted member is
  automatically promoted to registered.
- Promotion triggers a notification via email and (optionally) SMS.

----------------------------------------------------------------------

5. Communications Subsystem

5.1 Email
- Outbound email using a provider adapter pattern.
- Templates stored in the repository.
- Logging of:
  - who was emailed
  - which template was used
  - success/failure state

5.2 SMS (Outbound Baseline)
ClubOS must support outbound SMS broadcasts using a dedicated local
number. Requirements:

- 10 digit local number
- Send to filtered subsets of members or event registrants
- Log outbound sends and status
- Inbound handling:
  - STOP and similar keywords must be honored
  - Basic display of replies in a per-member thread view

Use cases:
- Last minute logistics
- Day of event reminders
- Simple one-way alerts

----------------------------------------------------------------------

6. Two Way Texting (Trellis or Equivalent)

6.1 Purpose
Enable full conversational SMS interaction between members and staff,
with structured automation logic. Must support use cases including RSVP,
waitlist actions, surveys, and member assistance.

6.2 Provider Requirements
- API for outbound messages
- Webhooks for inbound messages
- Support for US carriers
- Support for 10DLC compliance
- Exportable message history

6.3 Outbound Flow
- ClubOS triggers outbound SMS:
  - Event reminders
  - Registration status changes
  - Manual campaign sends
- Provider returns message IDs and delivery status for logging.

6.4 Inbound Flow
- Provider posts inbound SMS to a ClubOS webhook.
- ClubOS parses message and applies rules:
  - Y or YES: confirm attendance
  - N or NO: cancel and promote next from waitlist
  - Numeric ratings for surveys
  - Free text routed to admin inbox
- All inbound messages stored in message_log table.

6.5 Admin UI Requirements
- Per-member conversation thread
- Per-event SMS conversation log
- Filter for unresolved inbound messages needing attention

6.6 Automation
- Waitlist promotion triggered by N reply
- Confirmation triggered by Y reply
- Survey scores stored per event participation

----------------------------------------------------------------------

7. Access Control Model: Roles, Groups, and Capabilities

7.1 Definitions

- Role: A named set of capabilities assigned to a user. Roles define what
  actions a user may perform system-wide (e.g., Event Chair, Finance Manager).

- Group: A membership-based segment that can grant additional capabilities or
  visibility rules (e.g., committees, interest groups, activity categories).
  A user may belong to zero or more groups.

- Capability (Permission): An atomic action or read right expressed as a
  dot-notation string (e.g., "events.refund.approve", "events.waitlist.manage").
  Capabilities are additive; a user's effective permissions are the union of
  all capabilities from their role plus any group-derived capabilities.

- Visibility Rule: Content is shown or hidden depending on role, group, or
  capability. Pages, blocks, and data views may render differently based on
  the viewer's effective permissions.

7.2 How Evaluation Works

Authorization is evaluated in this order:

1. Authentication: Is the user logged in? If not, treat as Guest.
2. Role Capabilities: What capabilities does the user's role grant?
3. Group-Derived Capabilities: What additional capabilities do the user's
   group memberships grant?
4. Object-Level Rules: Does the specific resource (event, page, etc.) have
   additional access restrictions?

Principles:

- Least Privilege: Users receive only the minimum permissions needed.
- Deny-by-Default: Access is denied unless explicitly granted.
- Additive Permissions: Capabilities from roles and groups combine (union).
- UI Adaptation: Different pages and components render different controls
  based on the viewer's effective capabilities.

7.3 Role List (Initial)

| Role               | Description                                          |
|--------------------|------------------------------------------------------|
| Guest              | Unauthenticated visitor. Public content only.        |
| Member             | Authenticated member. Own profile and registrations. |
| Event Organizer    | Can create and manage specific events they own.      |
| Event Chair        | Full control over events in assigned categories.     |
| Finance Manager    | Approve refunds, run reconciliation, view finances.  |
| Membership Manager | Manage member records, renewals, and statuses.       |
| Content Editor     | Edit and publish public pages and news articles.     |
| System Admin       | Full system access. Restricted to tech staff.        |

7.4 Capability Naming Convention

Capabilities use a hierarchical dot-notation: {domain}.{resource}.{action}

Domains:
- events: Event and registration management
- finance: Payments, refunds, reconciliation
- membership: Member records and statuses
- content: Pages, news, navigation
- admin: System configuration and user management

7.5 Capabilities List (Initial)

Events Domain:
- events.view: View event listings and details
- events.create: Create new events
- events.edit: Edit event details
- events.delete: Delete events
- events.registration.view: View registrations for an event
- events.registration.cancel: Cancel a registration
- events.waitlist.manage: Promote or reorder waitlist entries
- events.attendance.mark: Mark attendance at events

Finance Domain:
- finance.view: View financial summaries and reports
- finance.refund.request: Submit a refund request
- finance.refund.approve: Approve pending refund requests
- finance.refund.execute: Execute approved refunds
- finance.reconcile.run: Run payment reconciliation

Membership Domain:
- membership.view: View member directory and profiles
- membership.edit: Edit member profiles
- membership.status.change: Change membership status (renew, lapse)
- membership.export: Export member data to CSV

Content Domain:
- content.page.view: View CMS pages
- content.page.edit: Edit page content
- content.page.publish: Publish or unpublish pages
- content.nav.edit: Edit navigation menus

Admin Domain:
- admin.users.view: View user accounts and roles
- admin.users.manage: Create, edit, or disable user accounts
- admin.roles.assign: Assign roles to users
- admin.groups.manage: Create and manage groups
- admin.audit.view: View audit logs
- admin.settings.edit: Edit system settings

7.6 Role-Capability Matrix

| Capability                  | Guest | Member | Organizer | Chair | Finance | Membership | Editor | Admin |
|-----------------------------|:-----:|:------:|:---------:|:-----:|:-------:|:----------:|:------:|:-----:|
| events.view                 |   Y   |   Y    |     Y     |   Y   |    Y    |     Y      |   Y    |   Y   |
| events.create               |       |        |     Y     |   Y   |         |            |        |   Y   |
| events.edit                 |       |        |    own    |   Y   |         |            |        |   Y   |
| events.registration.cancel  |       |  own   |    own    |   Y   |         |            |        |   Y   |
| events.waitlist.manage      |       |        |    own    |   Y   |         |            |        |   Y   |
| finance.refund.request      |       |   Y    |     Y     |   Y   |    Y    |            |        |   Y   |
| finance.refund.approve      |       |        |           |       |    Y    |            |        |   Y   |
| finance.refund.execute      |       |        |           |       |    Y    |            |        |   Y   |
| finance.reconcile.run       |       |        |           |       |    Y    |            |        |   Y   |
| membership.view             |       |   Y    |     Y     |   Y   |    Y    |     Y      |   Y    |   Y   |
| membership.edit             |       |        |           |       |         |     Y      |        |   Y   |
| content.page.edit           |       |        |           |       |         |            |   Y    |   Y   |
| content.page.publish        |       |        |           |       |         |            |   Y    |   Y   |
| admin.users.manage          |       |        |           |       |         |            |        |   Y   |
| admin.audit.view            |       |        |           |       |    Y    |     Y      |        |   Y   |

Legend: Y = full access, own = access to own resources only, blank = no access

7.7 Groups and Visibility

Groups enable dynamic content visibility and scoped permissions:

- Committee Groups: Members of a committee see committee-specific pages and
  can receive committee-targeted emails.
- Activity Category Groups: Event Chairs and Organizers are scoped to specific
  activity categories (e.g., Dining, Hiking, Travel).
- Interest Groups: Members opt into interest groups to see related content
  and receive targeted communications.

Group membership can grant additional capabilities. For example:

- Hiking Committee group grants events.create for Hiking category events.
- Board group grants visibility to board-only pages and documents.

7.8 Future Expansion

The following features are planned for future phases:

- Object-Level Permissions: Fine-grained access control per event, per page,
  or per document (e.g., "only this committee can edit this event").

- Delegation: Temporary role grants (e.g., a Chair can delegate Event
  Organizer rights to another member for a specific period).

- Audit Logging: All sensitive actions (role changes, refund approvals,
  member status changes) must be logged with actor, action, target, and
  timestamp for compliance and accountability.

- Permission Templates: Predefined capability bundles that can be assigned
  to groups to simplify administration.

----------------------------------------------------------------------

8. Notifications Framework

All subsystems use a unified notification bus.

Supported channels:
- Email
- SMS
- In-app notifications (later)

Notifications must be:
- Logged
- Deduplicated
- Idempotent (safe to retry)
- Delivered asynchronously

----------------------------------------------------------------------

9. Admin UI

9.1 Requirements
- Web-based console
- Stable data-test-id attributes
- iframe-safe rendering for testing
- Must expose:
  - event list
  - event details
  - registration list
  - member list
  - communications center (email + SMS)
  - inbox for inbound SMS from Trellis provider

9.2 Testing Hooks
- Root element: data-test-id="admin-root"
- Header: data-test-id="admin-header"
- Any interactive element must include a stable data-test-id

----------------------------------------------------------------------

10. Testing Requirements

10.1 Playwright Tests
- All admin pages must load inside iframe #admin-frame
- Tests must use waitForAdminFrame helper pattern:
  - Wait for iframe
  - Acquire frame via contentFrame()
  - Wait for load state
  - Wait for [data-test-id="admin-root"]
- Provide fixtures for:
  - Member creation
  - Event creation
  - Registrations and waitlist states

----------------------------------------------------------------------

11. Future Modules

Placeholder modules for future expansion:
- Payments
- Carpooling
- Photo and media management
- Volunteer management

----------------------------------------------------------------------

END OF SYSTEM SPEC

--------------------------------------------------
Requirements update 2025-12-10: Contacts and memberships
--------------------------------------------------

Data model

- The system MUST treat Contact as the canonical person record.
- Each Contact MAY have zero or more Membership records over time.
- The system MUST support at least the following membership statuses:
  - ACTIVE
  - LAPSED
  - ALUMNI
  - PROSPECT
- The system MUST support at least the following membership levels, which can be mapped to SBNC usage:
  - NEWBIE
  - NEWCOMER
  - EXTENDED
  - BOARD
  - ALUMNI_LEVEL
  - OTHER
- The Members view in the admin UI MUST be defined as:
  - Contacts with at least one Membership where status = ACTIVE.
- Event registrations MUST reference Contact and Event by id.
- SmsMessageLog entries MAY reference Contact and Event, but SMS behavior beyond basic logging is a later phase.

Email and SMS scope for early milestones

- The system MUST provide a mock email provider:
  - Writes outbound messages to a local log file.
  - Exposes a test endpoint for use in automated tests.
  - Supports an admin Email Activity panel to inspect recently logged messages.
- The system SHOULD be designed so that a real email provider (for example SES or Postmark) can be plugged in later without breaking the admin UI.
- The system MUST NOT depend on a real SMS provider for the initial milestones.
- Two way SMS is explicitly treated as a later phase and is out of scope for the first working demo.
## Domain model (authoritative v0.2)

This project treats Contact as the primary identity record. All other person- or event-related records hang off Contacts.

Entities:

- Contact
  - One row per real-world person (member, spouse, guest, admin, etc.).
  - Stores stable identifiers, names, primary email and phone, and basic profile fields.
  - Represents both current and former members, guests, and other contacts.

- Membership
  - Time-bounded snapshots representing the relationship between a Contact and the club.
  - Examples of states: Newbie, Newcomer, Extended Newcomer, Alumni, Lapsed, Admin.
  - Multiple rows per Contact over time, allowing a full membership history.
  - Encodes start and end timestamps plus membership level and any relevant flags.

- Event
  - A scheduled activity with title, description, category, start and end timestamps, and any access rules.
  - Used by both the public/member-facing calendar and internal admin tools.

- Registration
  - A link table between Contact and Event.
  - Represents a single contact's relationship to a specific event (Registered, Waitlisted, Cancelled, No-Show, etc.).
  - Designed to support full history of changes, not just the current status.

- SmsMessageLog
  - Tracks SMS messages related to Contacts and Events.
  - Stores direction (outbound, inbound), status (pending, sent, failed, delivered), body text, phone number, optional contactId and eventId, and an optional providerMessageId.
  - Intended for compliance, debugging, and operational visibility.

### Terminology and "members" as a derived concept

The database no longer has a top-level Member entity.

- "Member" in the UI is a derived concept:
  - A Contact with at least one active Membership row in a "member-like" state (for example: Newcomer, Extended Newcomer, or Alumni depending on business rules).
  - Different screens may filter by different membership states, but they all start from Contact plus Membership.

- This means:
  - All membership state logic lives in the Membership model and the queries that interpret it.
  - Admin tools should think in terms of Contacts and Memberships, even if the UI labels still say "Members" for now to keep things familiar.

### Persistence technology

- Database: PostgreSQL 16, running locally for development.
- Schema management: Prisma Migrate with a migration history checked into prisma/migrations.
- Application access: Prisma Client v7, generated from prisma/schema.prisma.

These choices are now considered part of the core system specification.

## Email subsystem specification (updated)

### 1. Test email endpoint

Current behavior:

- Route: POST /api/email/test
- Sends a mock email via mockEmailSend helper
- Returns:
  {
    ok: true,
    to,
    messageId
  }
- Used for system testing and as a placeholder until real provider integration.

Design constraints:

- Must behave consistently in all environments.
- Must not require a real provider for tests or local development.
- API contract is now considered stable.

Future expansion:

- Add provider adapter layer:
  - mock (default for test)
  - resend
  - ses
  - smtp
- Add retry and failure logging.

---

### 2. Email log endpoint

Current behavior (Phase 1):

- Route: POST /api/email/log
  - Generates an id, captures subject, body, timestamp.
  - Stores entry in in-memory array emailLog.
  - Responds with {
      ok: true,
      id,
      subject
    }

- Route: GET /api/email/log
  - Returns { emails: emailLog }

- Behavior is validated with Playwright tests.
- In-memory data resets when the dev server restarts.

Reasoning for current design:

- Locks down the API contract while deferring database wiring.
- Allows front-end and admin tooling to progress without waiting for persistence.
- Avoids blocking progress on Prisma (which is still being stabilized).

---

### 3. Planned final implementation (not yet completed)

Database-backed EmailMessageLog:

- Prisma model (to be added):
  - id (string)
  - memberId (nullable)
  - to (string)
  - subject (string)
  - body (text)
  - providerMessageId (string nullable)
  - status (enum: SENT, FAILED, PENDING)
  - createdAt (datetime)

- Repository interface:
  - createEmailLog(entry)
  - listRecent(limit)

- Route updates:
  - POST /api/email/test: persists log after sending
  - POST /api/email/log: writes to database
  - GET /api/email/log: queries last 20 items

Testing:

- Continue using Playwright for contract tests.
- Add Prisma integration tests only after model and migrations exist.

---

### 4. Architectural guarantees

- The API shape for test email and email log endpoints is now fixed.
- Persistence layer is intentionally deferred.
- Mock behavior must remain fully functional and testable until persistence is added.
- Code written by agents must not assume that Prisma persistence is already wired.


## Development Stages Checklist

This section tracks implementation stages for ClubOS at the system level.
It should stay consistent with PROJECT_PLAN.md.

Stage 0: Repo and tooling baseline
- Status: Done
- Next.js App Router project scaffolded.
- TypeScript, ESLint, and basic formatting in place.
- Playwright test runner configured and working against PW_BASE_URL.
- Prisma client generated and prisma.ts helper file created, but not yet used by production endpoints.

Stage 1: Minimal app shell
- Status: Partial
- Default layout and basic app chrome in place.
- Healthcheck style endpoints can be added without touching core domain logic.
- No persistent data model relied upon yet for production features.

Stage 2: Email primitives and dev/test endpoints
- Status: Done
- /api/email/test POST endpoint implemented.
  - Accepts JSON body with optional "to", "subject", and "body".
  - Uses server/mock-email.ts mockEmailSend helper to simulate sending and returns a messageId.
  - Has a Playwright test (tests/api/email-test.spec.ts) that asserts HTTP 200 and basic response shape.
- /api/email/log POST + GET implemented with in-memory storage only.
  - POST: accepts minimal subject/body, writes to an in-memory array, and returns a generated id.
  - GET: returns the current in-memory log array with id, subject, body, and createdAt ISO timestamp.
  - Covered by tests/api/email-log.spec.ts, which posts a log entry and then verifies it appears in the list.
- Prisma is not yet used by these endpoints.
  - Earlier attempts to wire Prisma into /api/email/log ran into PrismaClient initialization issues that need to be solved before production persistence is enabled.
  - The current behavior is explicitly dev-friendly and safe but not durable.

Stage 3: Email and notification subsystem v1 (persistent)
- Status: Not started
- Define Prisma model for EmailMessageLog (or equivalent) in prisma/schema.prisma.
- Resolve Prisma configuration so that new PrismaClient() can be constructed safely in server/prisma.ts using DATABASE_URL from the environment.
- Migrate the /api/email/log implementation from in-memory storage to Prisma-backed storage while keeping tests green.
- Ensure schema and endpoint can support future notification features:
  - Recipient address.
  - Subject.
  - Body or serialized payload.
  - Timestamps and basic status fields for sent messages.

Stage 4: Member and admin facing UX
- Status: Not started
- Build minimal authenticated admin view for recent email logs.
- Add simple filters (by recipient or time range) to verify that the log is usable for debugging.
- Wire this into the broader ClubOS admin shell as it comes online.

Notes
- The current implementation intentionally favors simplicity and green tests over early database complexity.
- When Prisma configuration is stable, we will update this checklist to mark Stage 3 as in progress and move the email log from memory to the database.

Admin and Monitoring Surfaces (Current Status)

Overview
- The system is evolving toward a browser-based admin shell that surfaces:
  - Recent outbound email activity.
  - Basic member, event, and registration views.
  - Simple debug-oriented telemetry for communications.

Communication Endpoints (Implemented)
- /api/email/test
  - Accepts JSON with "to", optional "subject", optional "body".
  - Uses a mockEmailSend helper (server/mock-email.ts) to generate a synthetic messageId.
  - Returns JSON: { ok: true, to, messageId }.
  - Designed for automated tests and manual smoke checks only; no real email delivery.
- /api/sms/test
  - Accepts JSON with "to" and optional "body".
  - Uses a mockSmsSend helper to generate a synthetic messageId.
  - Returns JSON: { ok: true, to, messageId }.
  - Intended for confirming that SMS wiring is conceptually correct before integrating a real provider.
- /api/email/log
  - POST:
    - Accepts subject and body fields (plus any future metadata).
    - Generates a unique id and ISO timestamp.
    - Stores an entry in an in-memory emailLog structure.
  - GET:
    - Returns the most recent entries in newest-first order.
  - This in-memory store is process-lifetime only and is not yet backed by the database.
  - Playwright tests validate both the HTTP contract and the store behavior:
    - tests/api/email-log.spec.ts.
    - tests/api/email-log-store.spec.ts.

Database Layer (Planned for this area)
- Prisma Client is generated and available via server/prisma.ts.
- The Prisma schema defines an email_message_log table, but:
  - The current HTTP endpoints do not write to or read from this table yet.
  - Migration to a database-backed email log is deferred until Prisma configuration is stable in all target environments.

Admin UI Surfaces (Planned)
- Admin wrapper page:
  - Route: /admin-frame.
  - Purpose:
    - Host an iframe that loads the main admin shell at /admin.
    - Provide a stable container for embedding admin views into other sites or layouts.
- Admin shell page:
  - Route: /admin.
  - Initial scope:
    - Email activity table with data-test-id="admin-email-table".
    - Events table with data-test-id="admin-events-table".
    - Members table with data-test-id="admin-members-table".
    - Registrations table with data-test-id="admin-registrations-table".
  - Data sources (initial):
    - Static or in-memory mock data that satisfies the existing Playwright tests under tests/admin/.
    - No dependency on Prisma or live production data for the first iteration.

Test Integration
- API-level tests:
  - All tests under tests/api currently pass against the mocked communication endpoints.
  - The SMS tests now use process.env.PW_BASE_URL ?? "http://localhost:3000" for the base URL.
- Admin tests:
  - Tests under tests/admin are currently red.
  - These tests assume:
    - /admin-frame exists and can be navigated to.
    - /admin exists and renders the four tables listed above with the specified data-test-id attributes.
    - tests/admin/admin-registrations.spec.ts will be updated to respect process.env.PW_BASE_URL just like the other tests.
  - Implementing a minimal /admin-frame and /admin that satisfy these tests is the next step before any deeper UX work.

Implementation Notes
- The communication layer is deliberately simple and mock-oriented so it can be replaced with real providers and a real email_message_log persistence layer later.
- Any future migration to Prisma-backed storage for email logs must:
  - Preserve the current HTTP contract for /api/email/log.
  - Maintain backward compatibility with existing Playwright tests, or evolve the tests and documentation together.
- The admin shell is intended to be a thin UI tailored to debugging and operations, not a full member portal.


## 2025-12-11 Notes: Member API and Status Semantics

Member definition

- A "member" in ClubOS is defined as:
  - Any Contact that has at least one ACTIVE Membership record.
- This aligns the UI concept of "member" with the underlying data model:
  - Contact: person-level record (name, email, household, etc.).
  - Membership: time-bounded relationship between a Contact and the club, with a status enum (ACTIVE, LAPSED, ALUMNI, PROSPECT, etc.).

Member status for API responses

- When an endpoint needs to expose "member status", it MUST derive that field from Membership, not from Contact.
- For now:
  - status is the status of the current or most recent ACTIVE Membership if present.
  - If a Contact has more than one Membership:
    - The API should prefer the ACTIVE membership with the latest start date.
- Longer term:
  - We may introduce a helper view or computed field to encapsulate "current membership status" per Contact.

Members API contract (initial)

- The initial /api/members endpoint is defined as follows:
  - Returns only Contacts that qualify as members (have at least one ACTIVE Membership).
  - Each entry includes:
    - id
    - firstName
    - lastName
    - email
    - status (derived from Membership as described above)
- For now, tests are written against mock data so that the endpoint behavior is stable even while Prisma configuration is still being refined.
- When Prisma is fully wired:
  - The endpoint will query Contacts and Memberships via Prisma.
  - Tests will be updated to either:
    - Seed known test records (e.g., sample members), or
    - Assert more generic conditions (shape and semantics) instead of hardcoded names.

Event registration delegation (partner signups)

- Requirement:
  - A member should be able to delegate rights to another member to register them for events.
  - Primary use case:
    - Two partners in the same household who are both members want either partner to be able to sign up both of them for an event.
- Early model sketch:
  - Delegation is represented explicitly in the data model as:
    - Delegation:
      - id
      - grantorContactId (the member who is delegating)
      - delegateContactId (the member who is allowed to register on their behalf)
      - scope (initially: EVENT_REGISTRATION)
      - activeFrom, activeTo (optional; for future time-bounded delegation)
  - Business rules (initial):
    - Both grantor and delegate must be valid members.
    - UI should make the household/partner use case easy, but the data model should not be limited only to couples.
    - When a delegate registers for an event, the system:
      - Records both who is ATTENDING and who performed the ACTION (delegate).
      - Enforces event-level limits (per-member, per-household, etc.) based on attendees, not the delegate.
- Implementation stages:
  - Stage 1: Document requirement and data model concept (this note).
  - Stage 2: Add Delegation model to Prisma schema (behind a feature flag or non-blocking migration).
  - Stage 3: Extend event registration API to honor delegations.
  - Stage 4: Add UI affordances so a member can:
    - Grant or revoke delegation to another member.
    - See who they can act on behalf of.

----------------------------------------------------------------

## Public Site, Content, And Mail System (v1 Requirements)

### Goals

- ClubOS must be able to host and manage the club's public website and member portal.
- Every visitor should see content appropriate to their authentication state, role, and group membership.
- Editors must be able to create, edit, and publish pages without directly editing code.
- Site branding should be controlled via themes and templates, with modern CSS and design tokens.
- Email templates, mailing lists, and access control lists must be first class features, not ad hoc lists.

### Core Concepts

- Site
  - Represents the primary web property for a club.
  - Holds global settings such as theme, navigation menus, and default layouts.

- Page
  - Identified by a path (for example, "/", "/events", "/groups/hiking").
  - Has a type: public, members only, role restricted, or group targeted.
  - References a PageTemplate and contains one or more Blocks.

- PageTemplate
  - Defines the structural layout of a page (for example, header, hero, main, sidebar, footer).
  - Controls which block types can appear in each region.
  - Reusable across multiple pages.

- Theme
  - Defines design tokens for colors, typography, spacing, and other visual properties.
  - Exposed to CSS via variables (for example, --color-primary).
  - Separable from templates so that multiple themes can share the same layout structure.

- Block
  - Represents a content component that appears on a page.
  - Examples: hero, text section, image banner, event list, registration call to action, callout, gallery.
  - Configured via structured data (for example, JSON) and rendered by React components.

- NavigationMenu
  - Named menus such as Primary, Footer, and Member menu.
  - Contains ordered NavigationItems with label, href, and optional visibility rules.

- AudienceSegment
  - A dynamic definition of a set of members based on roles, groups, membership level, or other attributes.
  - Used for both web visibility rules and mailing list targeting.

- MailTemplate
  - Represents a reusable email layout and content structure.
  - Fields include: name, slug, type (transactional or campaign), subject, preheader, layout, and blocks.
  - Uses safe, email friendly HTML and shares design tokens with the web theme.

- MailingList
  - Logical list of recipients, usually backed by an AudienceSegment.
  - Includes meta data such as description, ownerRole, and unsubscribe policy.

### Permissions And Personalization

- The existing role and group model must be extended to cover:
  - Who can view a page.
  - Who can edit a page or specific blocks.
  - Which menu items appear for which roles and groups.
  - Who can send email to specific MailingLists.

- Basic visitor categories:
  - Guest (not logged in).
  - Member (logged in, active member).
  - Officer (board or committee roles).
  - EventChair (has rights over one or more events).
  - SiteAdmin (full control over site and content).

- Personalization rules:
  - A page may have blocks that only render for certain roles or groups.
  - Navigation menus may hide or show items based on the viewer.
  - Member dashboards must show upcoming events, group specific content, and shortcuts to relevant actions.

### Web Layout, Themes, And CSS

- Use design tokens and CSS variables to drive theming.
- Use component level styling (for example, CSS modules) and avoid scattering inline styles.
- Page rendering flow:
  - Load Page + Blocks + Theme + Navigation from storage.
  - Apply permissions filters based on viewer identity.
  - Render via React components using tokens and templates.

- Editors should:
  - Choose a template and theme for a page (subject to permissions).
  - Add, reorder, and configure Blocks via a structured editor.
  - Save drafts and publish changes, with simple version history.

### Email Templates And Mailing Lists

- Email templates must support:
  - Club level branding that matches the public site.
  - Merge fields for member and event data.
  - Two broad types: transactional and broadcast.

- Mailing lists must:
  - Be definable in terms of AudienceSegments.
  - Be subject to clear access control rules (which roles can send).
  - Support unsubscribe behavior that respects member preferences.

### Out Of Scope For v1

- Visual drag and drop page builders.
- Integrated A/B testing and analytics.
- Multi site support across many clubs.
- Third party email provider integration beyond a single outbound channel.

These items may be added in future phases once the core public site and mail system are stable.

