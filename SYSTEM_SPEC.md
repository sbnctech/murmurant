Copyright (c) Santa Barbara Newcomers Club
All rights reserved.

SYSTEM SPECIFICATION
Murmurant Platform
ASCII Only
No external branding references

----------------------------------------------------------------------

1. System Overview

Murmurant is the membership, events, communication, and operations platform
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

2a. Timezone Policy

All DateTime handling in Murmurant follows these rules:

- All DateTime values are stored in UTC at rest (Prisma default).
- The system's canonical business timezone is America/Los_Angeles.
- All user-facing date/time display is rendered in Pacific Time.
- All day-boundary logic (e.g., "today", role transitions, expirations) is evaluated at 00:00 Pacific Time, accounting for DST.
- Any logic that depends on calendar days MUST use the shared timezone utility helpers in src/lib/timezone.ts, not ad hoc date math.

This ensures consistent behavior across the club's operations, which are all based in Santa Barbara, California.

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
Murmurant must support outbound SMS broadcasts using a dedicated local
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
- Murmurant triggers outbound SMS:
  - Event reminders
  - Registration status changes
  - Manual campaign sends
- Provider returns message IDs and delivery status for logging.

6.4 Inbound Flow
- Provider posts inbound SMS to a Murmurant webhook.
- Murmurant parses message and applies rules:
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

7. Permissions and Roles

7.1 Principles
- Least privilege
- Role-based access
- Separation between operational roles and developer roles

7.2 Roles
- System Admin
- Communications Admin
- Events Admin
- Category Chair
- Read Only Auditor

7.3 Capabilities Matrix
Each role grants explicit rights to:
- Create/read/update/delete events
- Send email
- Send SMS
- Manage members
- Access analytics
- Access system settings

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

This section tracks implementation stages for Murmurant at the system level.
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
- Wire this into the broader Murmurant admin shell as it comes online.

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

- A "member" in Murmurant is defined as:
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

- Murmurant must be able to host and manage the club's public website and member portal.
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

----------------------------------------------------------------

## Publishing System (Detailed Design)

### Overview

The publishing system enables club administrators and designated editors to create, manage, and publish web pages without writing code. Pages are composed of reusable blocks, styled by themes, and governed by visibility rules that determine who can see what content.

### Data Model

#### Page

Represents a single web page in the site.

Fields:

- id (uuid, primary key)
- siteId (uuid, foreign key to Site)
- path (string, unique within site, e.g., "/", "/events", "/groups/hiking")
- title (string)
- description (string, optional, used for SEO meta description)
- templateId (uuid, foreign key to PageTemplate)
- status (enum: DRAFT, PUBLISHED, ARCHIVED)
- visibility (enum: PUBLIC, MEMBERS_ONLY, ROLE_RESTRICTED, GROUP_TARGETED)
- visibilityRuleId (uuid, optional, foreign key to VisibilityRule)
- publishedAt (datetime, nullable)
- createdAt (datetime)
- updatedAt (datetime)
- createdBy (uuid, foreign key to Contact)
- updatedBy (uuid, foreign key to Contact)

Constraints:

- Path must be unique within a site.
- Path must start with "/" and contain only lowercase letters, numbers, hyphens, and forward slashes.
- A page can only be published if it has at least one block.

#### PageVersion

Tracks version history for pages.

Fields:

- id (uuid, primary key)
- pageId (uuid, foreign key to Page)
- versionNumber (integer, auto-incremented per page)
- snapshot (jsonb, stores serialized page state including blocks)
- publishedAt (datetime, nullable)
- createdAt (datetime)
- createdBy (uuid, foreign key to Contact)

Notes:

- Every publish action creates a new PageVersion.
- Restoring a previous version creates a new version with the old snapshot.

#### Block

Represents a content component on a page.

Fields:

- id (uuid, primary key)
- pageId (uuid, foreign key to Page)
- region (string, e.g., "header", "main", "sidebar", "footer")
- blockType (string, e.g., "hero", "text", "image", "event-list", "cta", "gallery")
- sortOrder (integer, position within region)
- config (jsonb, block-specific configuration)
- visibility (enum: INHERIT, PUBLIC, MEMBERS_ONLY, ROLE_RESTRICTED, GROUP_TARGETED)
- visibilityRuleId (uuid, optional, foreign key to VisibilityRule)
- createdAt (datetime)
- updatedAt (datetime)

Block Types (initial set):

- hero: Full-width header with title, subtitle, background image, and optional CTA button
- text: Rich text content (stored as HTML or structured JSON)
- image: Single image with optional caption and alt text
- event-list: Dynamic list of upcoming events with optional category filter
- registration-cta: Call to action for event registration
- callout: Highlighted message box with icon and styling variant
- gallery: Grid of images from a media collection
- nav-links: Custom navigation links for a section
- member-spotlight: Featured member profile
- contact-form: Simple contact form that sends to a configured email

Block Config Examples:

```
// hero block config
{
  "title": "Welcome to SBNC",
  "subtitle": "Your community awaits",
  "backgroundImage": "/images/hero-bg.jpg",
  "ctaText": "Join Us",
  "ctaLink": "/join"
}

// event-list block config
{
  "limit": 5,
  "categoryFilter": ["social", "outdoor"],
  "showPastEvents": false
}
```

#### VisibilityRule

Defines complex visibility conditions for pages and blocks.

Fields:

- id (uuid, primary key)
- name (string, human-readable name)
- description (string, optional)
- ruleType (enum: ROLE_BASED, GROUP_BASED, MEMBERSHIP_LEVEL, COMPOUND)
- conditions (jsonb, structured rule definition)
- createdAt (datetime)
- updatedAt (datetime)

Condition Examples:

```
// Role-based: only board members
{
  "type": "role",
  "roles": ["BOARD_MEMBER", "SITE_ADMIN"]
}

// Group-based: hiking group members
{
  "type": "group",
  "groupIds": ["hiking-group-uuid"]
}

// Membership level: newcomers and extended only
{
  "type": "membershipLevel",
  "levels": ["NEWCOMER", "EXTENDED"]
}

// Compound: board members OR hiking group chairs
{
  "type": "compound",
  "operator": "OR",
  "rules": [
    { "type": "role", "roles": ["BOARD_MEMBER"] },
    { "type": "groupRole", "groupId": "hiking-group-uuid", "roles": ["CHAIR"] }
  ]
}
```

### Page Rendering Flow

1. Request arrives for a path (e.g., "/groups/hiking").
2. System looks up Page by path within the current Site.
3. If page not found, return 404.
4. If page status is not PUBLISHED, return 404 (unless viewer is an editor with preview rights).
5. Evaluate page visibility:
   - PUBLIC: render for all visitors.
   - MEMBERS_ONLY: require authenticated member.
   - ROLE_RESTRICTED or GROUP_TARGETED: evaluate VisibilityRule against viewer.
6. Load Page, PageTemplate, Theme, and Blocks.
7. For each Block, evaluate block-level visibility:
   - INHERIT: use page visibility.
   - Otherwise: evaluate block's VisibilityRule.
8. Filter out blocks the viewer cannot see.
9. Render page using React components, applying Theme tokens.

### Editor Workflow

1. Editor navigates to admin page management.
2. Editor creates a new page:
   - Selects a PageTemplate.
   - Enters path, title, and description.
   - Sets visibility level.
3. Editor adds blocks to page regions:
   - Chooses block type from available types for that region.
   - Configures block via structured form (not free-form code).
   - Sets block-level visibility if different from page.
4. Editor saves draft (creates or updates Page and Blocks).
5. Editor previews page (renders with editor's permissions applied).
6. Editor publishes:
   - System validates page has at least one block.
   - System creates PageVersion snapshot.
   - System sets page status to PUBLISHED and records publishedAt.

----------------------------------------------------------------

## Templates and Themes (Detailed Design)

### PageTemplate

Defines the structural layout of a page.

Fields:

- id (uuid, primary key)
- siteId (uuid, foreign key to Site)
- name (string, e.g., "Default", "Landing", "Event Detail", "Group Home")
- slug (string, unique identifier)
- description (string, optional)
- regions (jsonb, defines available content regions and their constraints)
- isDefault (boolean, one default template per site)
- createdAt (datetime)
- updatedAt (datetime)

Region Definition:

```
{
  "regions": [
    {
      "name": "header",
      "label": "Header",
      "allowedBlockTypes": ["hero", "nav-links"],
      "maxBlocks": 1
    },
    {
      "name": "main",
      "label": "Main Content",
      "allowedBlockTypes": ["text", "image", "event-list", "registration-cta", "callout", "gallery", "member-spotlight"],
      "maxBlocks": null
    },
    {
      "name": "sidebar",
      "label": "Sidebar",
      "allowedBlockTypes": ["nav-links", "callout", "contact-form"],
      "maxBlocks": 3
    },
    {
      "name": "footer",
      "label": "Footer",
      "allowedBlockTypes": ["text", "nav-links"],
      "maxBlocks": 2
    }
  ]
}
```

### Theme

Defines visual styling via design tokens.

Fields:

- id (uuid, primary key)
- siteId (uuid, foreign key to Site)
- name (string, e.g., "SBNC Classic", "Modern Light", "Festive")
- slug (string, unique identifier)
- description (string, optional)
- tokens (jsonb, design token definitions)
- isDefault (boolean, one default theme per site)
- createdAt (datetime)
- updatedAt (datetime)

Token Structure:

```
{
  "colors": {
    "primary": "#1a5f7a",
    "primaryHover": "#134a5e",
    "secondary": "#f5a623",
    "background": "#ffffff",
    "backgroundAlt": "#f8f9fa",
    "text": "#333333",
    "textMuted": "#666666",
    "border": "#e0e0e0",
    "error": "#dc3545",
    "success": "#28a745",
    "warning": "#ffc107"
  },
  "typography": {
    "fontFamily": "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    "fontFamilyHeading": "'Playfair Display', Georgia, serif",
    "fontSizeBase": "16px",
    "fontSizeSmall": "14px",
    "fontSizeLarge": "18px",
    "lineHeight": "1.6",
    "headingLineHeight": "1.3"
  },
  "spacing": {
    "xs": "4px",
    "sm": "8px",
    "md": "16px",
    "lg": "24px",
    "xl": "32px",
    "xxl": "48px"
  },
  "borderRadius": {
    "sm": "4px",
    "md": "8px",
    "lg": "16px",
    "full": "9999px"
  },
  "shadows": {
    "sm": "0 1px 2px rgba(0,0,0,0.05)",
    "md": "0 4px 6px rgba(0,0,0,0.1)",
    "lg": "0 10px 15px rgba(0,0,0,0.1)"
  }
}
```

### CSS Variable Mapping

Theme tokens are exposed as CSS custom properties:

```
:root {
  --color-primary: #1a5f7a;
  --color-primary-hover: #134a5e;
  --color-secondary: #f5a623;
  --color-background: #ffffff;
  --color-text: #333333;
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-family-heading: 'Playfair Display', Georgia, serif;
  --font-size-base: 16px;
  --spacing-md: 16px;
  --border-radius-md: 8px;
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
}
```

### Theme Application

1. Page load fetches the active Theme for the Site.
2. Server generates CSS custom properties from Theme tokens.
3. CSS is injected into the page head.
4. Components use variables (e.g., `color: var(--color-text)`).
5. No component needs to know the actual color values.

### Template and Theme Selection

- Each Page references a PageTemplate.
- The Site has a default Theme applied to all pages.
- Future: per-page theme overrides (deferred to v2).

----------------------------------------------------------------

## Email Templates (Detailed Design)

### MailTemplate

Represents a reusable email template.

Fields:

- id (uuid, primary key)
- siteId (uuid, foreign key to Site)
- name (string, human-readable name)
- slug (string, unique identifier, e.g., "event-reminder", "welcome-new-member")
- type (enum: TRANSACTIONAL, CAMPAIGN)
- subject (string, supports merge fields)
- preheader (string, optional, preview text in email clients)
- bodyHtml (text, HTML content with merge fields)
- bodyText (text, plain text fallback with merge fields)
- fromName (string, optional, defaults to site setting)
- fromEmail (string, optional, defaults to site setting)
- replyTo (string, optional)
- isActive (boolean)
- createdAt (datetime)
- updatedAt (datetime)
- createdBy (uuid, foreign key to Contact)

Template Types:

- TRANSACTIONAL: Triggered by system events (registration confirmation, password reset)
- CAMPAIGN: Manually sent broadcasts (newsletters, announcements)

### Merge Fields

Merge fields use double-brace syntax: `{{fieldName}}`

Standard Member Fields:

- `{{member.firstName}}`
- `{{member.lastName}}`
- `{{member.fullName}}`
- `{{member.email}}`
- `{{member.membershipLevel}}`

Standard Event Fields:

- `{{event.title}}`
- `{{event.startDate}}`
- `{{event.startTime}}`
- `{{event.endDate}}`
- `{{event.endTime}}`
- `{{event.location}}`
- `{{event.description}}`

Registration Fields:

- `{{registration.status}}`
- `{{registration.confirmationNumber}}`
- `{{registration.registeredAt}}`

System Fields:

- `{{club.name}}`
- `{{club.website}}`
- `{{unsubscribeLink}}`
- `{{preferencesLink}}`

Example Subject:

```
Reminder: {{event.title}} is coming up on {{event.startDate}}
```

Example Body (HTML):

```
<p>Hi {{member.firstName}},</p>

<p>This is a friendly reminder that <strong>{{event.title}}</strong> is
happening on {{event.startDate}} at {{event.startTime}}.</p>

<p><strong>Location:</strong> {{event.location}}</p>

<p>We look forward to seeing you there!</p>

<p>Best regards,<br>
{{club.name}}</p>

<p style="font-size: 12px; color: #666;">
<a href="{{unsubscribeLink}}">Unsubscribe</a> |
<a href="{{preferencesLink}}">Email Preferences</a>
</p>
```

### Email Styling

Email templates share design tokens with the web theme where email-safe:

- Colors from Theme.tokens.colors
- Font family uses web-safe fallbacks for email
- Inline styles required for email client compatibility

Email CSS is generated separately from web CSS, using only email-compatible properties.

### EmailMessageLog

Tracks all sent emails for audit and debugging.

Fields:

- id (uuid, primary key)
- templateId (uuid, optional, foreign key to MailTemplate)
- templateSlug (string, snapshot of template slug at send time)
- recipientContactId (uuid, optional, foreign key to Contact)
- recipientEmail (string)
- subject (string, resolved with merge fields)
- bodyHtml (text, resolved with merge fields)
- bodyText (text, resolved with merge fields)
- status (enum: PENDING, SENT, DELIVERED, BOUNCED, FAILED)
- providerMessageId (string, optional)
- sentAt (datetime, nullable)
- deliveredAt (datetime, nullable)
- bouncedAt (datetime, nullable)
- bounceReason (string, optional)
- metadata (jsonb, additional context like eventId, campaignId)
- createdAt (datetime)

Audit Requirements:

- Every email send attempt creates an EmailMessageLog entry.
- Status updates tracked via provider webhooks.
- Logs retained for compliance and debugging.
- Admin can view logs filtered by recipient, template, status, or date range.

----------------------------------------------------------------

## Mailing Lists (Detailed Design)

### MailingList

Represents a logical list of email recipients.

Fields:

- id (uuid, primary key)
- siteId (uuid, foreign key to Site)
- name (string, e.g., "All Members", "Hiking Group", "Board Members")
- slug (string, unique identifier)
- description (string, optional)
- listType (enum: STATIC, DYNAMIC)
- audienceSegmentId (uuid, optional, foreign key to AudienceSegment for DYNAMIC lists)
- ownerRoles (string array, roles that can send to this list)
- allowMemberSubscribe (boolean, whether members can self-subscribe)
- allowMemberUnsubscribe (boolean, whether members can self-unsubscribe)
- isActive (boolean)
- createdAt (datetime)
- updatedAt (datetime)

List Types:

- STATIC: Manually curated list of specific contacts
- DYNAMIC: Membership determined by AudienceSegment rules, evaluated at send time

### MailingListMember

Links contacts to static mailing lists.

Fields:

- id (uuid, primary key)
- mailingListId (uuid, foreign key to MailingList)
- contactId (uuid, foreign key to Contact)
- addedAt (datetime)
- addedBy (uuid, optional, foreign key to Contact who added them)
- removedAt (datetime, nullable)
- removedBy (uuid, optional)

Notes:

- Only used for STATIC lists.
- DYNAMIC lists compute membership from AudienceSegment at query time.
- removedAt allows soft-delete for audit purposes.

### AudienceSegment

Defines a dynamic set of contacts based on rules.

Fields:

- id (uuid, primary key)
- siteId (uuid, foreign key to Site)
- name (string)
- description (string, optional)
- rules (jsonb, structured filter definition)
- createdAt (datetime)
- updatedAt (datetime)

Rule Examples:

```
// All active members
{
  "membershipStatus": ["ACTIVE"]
}

// Members in specific groups
{
  "membershipStatus": ["ACTIVE"],
  "groups": ["hiking-uuid", "book-club-uuid"]
}

// Board members and committee chairs
{
  "roles": ["BOARD_MEMBER", "COMMITTEE_CHAIR"]
}

// Members who joined in the last 90 days
{
  "membershipStatus": ["ACTIVE"],
  "joinedAfter": "{{today - 90 days}}"
}

// Members registered for a specific event
{
  "eventRegistration": {
    "eventId": "event-uuid",
    "status": ["REGISTERED", "WAITLISTED"]
  }
}
```

### Mailing List Resolution

When sending to a mailing list:

1. If STATIC: query MailingListMember for contactIds where removedAt is null.
2. If DYNAMIC: evaluate AudienceSegment rules against Contact/Membership/Group data.
3. Filter out contacts who have unsubscribed from this list.
4. Filter out contacts with invalid email addresses.
5. Return deduplicated list of recipient contacts.

### Unsubscribe Handling

UnsubscribeRecord:

- id (uuid, primary key)
- contactId (uuid, foreign key to Contact)
- mailingListId (uuid, optional, null means unsubscribed from all)
- unsubscribedAt (datetime)
- source (enum: LINK_CLICK, ADMIN_ACTION, MEMBER_PREFERENCE)

Rules:

- Global unsubscribe (mailingListId is null) blocks all non-transactional email.
- List-specific unsubscribe blocks only that list.
- Transactional emails (password reset, registration confirmation) are never blocked.
- Unsubscribe links in emails must work with single click (no login required).

----------------------------------------------------------------

## Permissions Model (Detailed Design)

### Overview

Murmurant uses a layered permission model:

1. Role-Based Access Control (RBAC): Global roles with predefined capabilities
2. Group Membership: Access to group-specific resources
3. Row-Level Permissions: Fine-grained access to specific records

### Roles

ContactRole (join table):

- id (uuid, primary key)
- contactId (uuid, foreign key to Contact)
- role (enum: defined below)
- grantedAt (datetime)
- grantedBy (uuid, foreign key to Contact)
- revokedAt (datetime, nullable)
- revokedBy (uuid, optional)

Role Definitions:

- SITE_ADMIN: Full access to all site features, content, and settings
- CONTENT_EDITOR: Can create and edit pages, blocks, and media
- COMMUNICATIONS_ADMIN: Can manage email templates and send to all mailing lists
- EVENTS_ADMIN: Can create, edit, and manage all events
- MEMBERS_ADMIN: Can view and edit member records, manage memberships
- CATEGORY_CHAIR: Can manage events in assigned categories
- GROUP_LEADER: Can manage assigned groups and their members
- READ_ONLY_AUDITOR: Read-only access to admin views for audit purposes
- MEMBER: Standard member (implicit for all active memberships)

### Capabilities Matrix

```
Capability                    | SITE_ADMIN | CONTENT_EDITOR | COMMS_ADMIN | EVENTS_ADMIN | MEMBERS_ADMIN | CATEGORY_CHAIR | GROUP_LEADER | AUDITOR | MEMBER
------------------------------|------------|----------------|-------------|--------------|---------------|----------------|--------------|---------|-------
Manage site settings          | Yes        | No             | No          | No           | No            | No             | No           | No      | No
Edit all pages                | Yes        | Yes            | No          | No           | No            | No             | No           | No      | No
Edit assigned pages           | Yes        | Yes            | No          | No           | No            | No             | Yes          | No      | No
Manage themes/templates       | Yes        | Yes            | No          | No           | No            | No             | No           | No      | No
Create/edit email templates   | Yes        | No             | Yes         | No           | No            | No             | No           | No      | No
Send to any mailing list      | Yes        | No             | Yes         | No           | No            | No             | No           | No      | No
Send to owned mailing lists   | Yes        | No             | Yes         | Yes          | No            | Yes            | Yes          | No      | No
Create/edit all events        | Yes        | No             | No          | Yes          | No            | No             | No           | No      | No
Create/edit category events   | Yes        | No             | No          | Yes          | No            | Yes            | No           | No      | No
View all members              | Yes        | No             | Yes         | Yes          | Yes           | No             | No           | Yes     | No
Edit member records           | Yes        | No             | No          | No           | Yes           | No             | No           | No      | No
Manage group members          | Yes        | No             | No          | No           | Yes           | No             | Yes          | No      | No
View audit logs               | Yes        | No             | No          | No           | No            | No             | No           | Yes     | No
Register for events           | Yes        | Yes            | Yes         | Yes          | Yes           | Yes            | Yes          | Yes     | Yes
View member directory         | Yes        | Yes            | Yes         | Yes          | Yes           | Yes            | Yes          | Yes     | Yes
```

### Groups

Group:

- id (uuid, primary key)
- siteId (uuid, foreign key to Site)
- name (string, e.g., "Hiking", "Book Club", "Wine Tasting")
- slug (string, unique identifier)
- description (string, optional)
- groupType (enum: INTEREST, COMMITTEE, BOARD, SPECIAL)
- isActive (boolean)
- createdAt (datetime)
- updatedAt (datetime)

GroupMember:

- id (uuid, primary key)
- groupId (uuid, foreign key to Group)
- contactId (uuid, foreign key to Contact)
- groupRole (enum: MEMBER, LEADER, CHAIR, COORDINATOR)
- joinedAt (datetime)
- leftAt (datetime, nullable)

Group-Scoped Permissions:

- Group leaders can edit group pages (pages with groupId matching their group).
- Group leaders can send email to their group's mailing list.
- Group chairs have additional admin capabilities within the group.

### Row-Level Permissions

For fine-grained access beyond roles and groups:

PagePermission:

- id (uuid, primary key)
- pageId (uuid, foreign key to Page)
- contactId (uuid, optional, specific contact)
- role (string, optional, specific role)
- groupId (uuid, optional, specific group)
- permission (enum: VIEW, EDIT, PUBLISH, DELETE)
- grantedAt (datetime)
- grantedBy (uuid)

EventPermission:

- id (uuid, primary key)
- eventId (uuid, foreign key to Event)
- contactId (uuid, optional)
- role (string, optional)
- permission (enum: VIEW, EDIT, MANAGE_REGISTRATIONS, DELETE)
- grantedAt (datetime)
- grantedBy (uuid)

### Permission Resolution

When checking if a contact can perform an action:

1. Check global role capabilities (fastest path).
2. If not granted by role, check group membership and group-scoped permissions.
3. If not granted by group, check row-level permissions on the specific resource.
4. Cache permission results for the session to avoid repeated queries.

Example: Can contact X edit page Y?

```
1. Does X have SITE_ADMIN or CONTENT_EDITOR role? -> Yes: allowed
2. Is Y a group page and X is a leader of that group? -> Yes: allowed
3. Does PagePermission exist for (pageId=Y, contactId=X, permission=EDIT)? -> Yes: allowed
4. Otherwise: denied
```

### Permission Audit

All permission changes are logged:

PermissionAuditLog:

- id (uuid, primary key)
- action (enum: GRANT, REVOKE, MODIFY)
- resourceType (string, e.g., "Page", "Event", "MailingList")
- resourceId (uuid)
- targetContactId (uuid, who is affected)
- targetRole (string, optional)
- targetGroupId (uuid, optional)
- permission (string)
- performedBy (uuid, who made the change)
- performedAt (datetime)
- metadata (jsonb, additional context)

----------------------------------------------------------------

## Site Configuration

### Site

Represents a club's web presence.

Fields:

- id (uuid, primary key)
- name (string, e.g., "Santa Barbara Newcomers Club")
- domain (string, e.g., "sbnewcomers.org")
- defaultThemeId (uuid, foreign key to Theme)
- defaultTemplateId (uuid, foreign key to PageTemplate)
- settings (jsonb, site-wide configuration)
- createdAt (datetime)
- updatedAt (datetime)

Settings Structure:

```
{
  "branding": {
    "logoUrl": "/images/logo.png",
    "faviconUrl": "/images/favicon.ico",
    "organizationName": "Santa Barbara Newcomers Club"
  },
  "email": {
    "defaultFromName": "SBNC",
    "defaultFromEmail": "noreply@sbnewcomers.org",
    "defaultReplyTo": "info@sbnewcomers.org"
  },
  "seo": {
    "defaultTitle": "Santa Barbara Newcomers Club",
    "defaultDescription": "Welcome to Santa Barbara! Join our community...",
    "socialImage": "/images/social-share.jpg"
  },
  "features": {
    "memberDirectory": true,
    "eventRegistration": true,
    "groupPages": true,
    "emailCampaigns": true
  }
}
```

### NavigationMenu

Named menus for site navigation.

Fields:

- id (uuid, primary key)
- siteId (uuid, foreign key to Site)
- name (string, e.g., "Primary", "Footer", "Member Menu")
- slug (string, unique identifier)
- items (jsonb, ordered list of navigation items)
- createdAt (datetime)
- updatedAt (datetime)

Items Structure:

```
{
  "items": [
    {
      "label": "Home",
      "href": "/",
      "visibility": "PUBLIC"
    },
    {
      "label": "Events",
      "href": "/events",
      "visibility": "PUBLIC"
    },
    {
      "label": "Member Directory",
      "href": "/members",
      "visibility": "MEMBERS_ONLY"
    },
    {
      "label": "Admin",
      "href": "/admin",
      "visibility": "ROLE_RESTRICTED",
      "visibilityRoles": ["SITE_ADMIN", "EVENTS_ADMIN", "MEMBERS_ADMIN"]
    },
    {
      "label": "Groups",
      "href": "/groups",
      "visibility": "MEMBERS_ONLY",
      "children": [
        { "label": "Hiking", "href": "/groups/hiking" },
        { "label": "Book Club", "href": "/groups/book-club" },
        { "label": "Wine Tasting", "href": "/groups/wine-tasting" }
      ]
    }
  ]
}
```

----------------------------------------------------------------

## API Design Guidelines

### Publishing APIs

Page Management:

- GET /api/pages - List pages (filterable by status, visibility)
- GET /api/pages/:id - Get page with blocks
- POST /api/pages - Create new page
- PUT /api/pages/:id - Update page
- POST /api/pages/:id/publish - Publish page (creates version)
- POST /api/pages/:id/unpublish - Revert to draft
- GET /api/pages/:id/versions - List page versions
- POST /api/pages/:id/versions/:versionId/restore - Restore version

Block Management:

- GET /api/pages/:pageId/blocks - List blocks for page
- POST /api/pages/:pageId/blocks - Add block to page
- PUT /api/pages/:pageId/blocks/:blockId - Update block
- DELETE /api/pages/:pageId/blocks/:blockId - Remove block
- POST /api/pages/:pageId/blocks/reorder - Reorder blocks

### Email APIs

Template Management:

- GET /api/email/templates - List templates
- GET /api/email/templates/:id - Get template
- POST /api/email/templates - Create template
- PUT /api/email/templates/:id - Update template
- POST /api/email/templates/:id/preview - Preview with sample data

Sending:

- POST /api/email/send - Send to specific recipients
- POST /api/email/send-to-list - Send to mailing list
- GET /api/email/logs - List sent emails (filterable)

### Mailing List APIs

- GET /api/mailing-lists - List mailing lists
- GET /api/mailing-lists/:id - Get list details
- GET /api/mailing-lists/:id/recipients - Get resolved recipients
- POST /api/mailing-lists - Create list
- PUT /api/mailing-lists/:id - Update list
- POST /api/mailing-lists/:id/members - Add member (static lists)
- DELETE /api/mailing-lists/:id/members/:contactId - Remove member

### Permission APIs

- GET /api/contacts/:id/permissions - Get contact's effective permissions
- POST /api/permissions/check - Check specific permission
- POST /api/roles/grant - Grant role to contact
- POST /api/roles/revoke - Revoke role from contact
- GET /api/audit/permissions - List permission changes

----------------------------------------------------------------

## Publishing System Implementation (v0.2.1)

The publishing and communications system has been implemented with the following
capabilities:

### Content Management

**Pages:**
- Block-based page content with 11 block types (hero, text, image, cards, event-list, gallery, FAQ, contact, CTA, divider, spacer)
- Status workflow: DRAFT -> PUBLISHED -> ARCHIVED
- Visibility controls: PUBLIC, MEMBERS_ONLY, ROLE_RESTRICTED
- SEO fields: seoTitle, seoDescription, seoImage
- Scheduled publishing via publishAt field

**Themes:**
- Design tokens for colors, typography, spacing, border-radius, and shadows
- CSS variable generation from theme tokens
- Custom CSS support with XSS sanitization
- Default theme fallback

**Templates:**
- Page templates with regions and default blocks
- Template-based page creation

### Communications

**Mailing Lists:**
- Static lists with explicit member assignments
- Dynamic lists with audience rules
- Audience rules support: membership status, roles, committees, specific members, join date filters, exclusions

**Message Templates:**
- Categories: EVENT, NEWSLETTER, ANNOUNCEMENT, TRANSACTIONAL
- Token replacement: member.firstName, member.lastName, member.email, event.title, club.name, currentYear
- XSS protection for token values

**Campaigns:**
- Status workflow: DRAFT -> SCHEDULED -> SENDING -> SENT
- Integration with mailing lists
- Delivery logging

### Permissions

**Role-based Access:**
- Admin roles: president, webmaster, communications-chair, board-member
- Content admin roles: webmaster, communications-chair
- Communications admin roles: communications-chair, webmaster

**Permission Functions:**
- hasAdminRole, canManageThemes, canManageTemplates
- canManageMailingLists, canSendCampaign
- canViewPage, canEditPage, canPublishPage, canDeletePage
- evaluateAudienceRule, buildUserContext

**Audit Trail:**
- All operations logged to AuditLog table
- Actions: CREATE, UPDATE, DELETE, PUBLISH, UNPUBLISH, SEND, ARCHIVE

### API Routes

Content APIs (under /api/admin/content/):
- pages, pages/[id]
- templates, templates/[id]
- themes, themes/[id]

Communications APIs (under /api/admin/comms/):
- lists, lists/[id]
- templates, templates/[id]
- campaigns, campaigns/[id]

Public Routes:
- /api/theme - CSS variables for active theme
- /pages/[slug] - Public page rendering
- /member/[slug] - Member-only page rendering

----------------------------------------------------------------

## Version 0.2.2 - Hardening and Release Readiness

### CI Alignment

New npm scripts for test automation:
- test:unit - Vitest unit tests
- test-admin:stable - Playwright admin tests (excludes @quarantine)
- test-publish:e2e - Publishing/comms specific E2E tests
- test-api:stable - API E2E tests (excludes @quarantine)

### Test Coverage

Unit Tests (151 total):
- theme.spec.ts - 23 tests for CSS generation and validation
- blocks.spec.ts - 44 tests for block types and validation
- audience.spec.ts - 27 tests for audience rule evaluation
- email.spec.ts - 17 tests for token replacement
- permissions.spec.ts - 39 tests for RBAC checks

E2E Tests:
- Admin content UI tests (pages, themes, templates)
- Admin comms UI tests (lists, templates, campaigns)
- API contract tests (page lifecycle, theme validation, list endpoints)

### Stability Decisions

- Tests use waitUntil: networkidle for page loads
- Assertions use data-test-id attributes
- CRUD tests create own data (no seed ID dependencies)
- @quarantine tag excludes flaky tests from stable runs

### Known Limitations

- Page editor UI is stub only
- No rich text block editing
- Campaign send logs but doesn't email
- Seed IDs non-deterministic

----------------------------------------------------------------

## Version 0.2.3 - RBAC Refinement: Webmaster Role

### Role Clarification

The webmaster role is a **UI/site management role**, NOT a full admin.

Webmaster Capabilities:
- publishing:manage - Pages, themes, templates, media
- comms:manage - Email templates, audiences, campaigns
- members:view - Read-only member data (for support)
- registrations:view - Read-only registration data (for support)

Webmaster Restrictions:
- NO exports:access - Cannot download CSV exports
- NO finance:view/manage - Cannot see financial data
- NO users:manage - Cannot change user roles/entitlements
- NO members:history - Cannot view member service history narrative
- Cannot delete published pages (only full admins can)

### Capability System

Added to src/lib/auth.ts:
- hasCapability(role, capability) - Check if role has capability
- hasAnyCapability(role, capabilities) - Check for any of several
- isFullAdmin(role) - Check for admin:full capability
- requireCapability(req, capability) - Route guard

### Route Guard Updates

Export endpoints require exports:access (webmaster denied):
- /api/admin/export/members
- /api/admin/export/events
- /api/admin/export/registrations
- /api/admin/export/activity

Publishing endpoints use publishing:manage (webmaster allowed):
- /api/admin/content/pages
- /api/admin/content/pages/[id]
- DELETE on published pages requires admin:full

### Debug Escape Hatch

For support debugging, when WEBMASTER_SUPPORT_DEBUG=1:
- GET /api/admin/debug/effective-permissions?email=...
- Returns capability booleans and role (never finance data)
- Requires publishing:manage to access

### Test Updates

- 185 unit tests (added auth-capabilities.spec.ts)
- Added webmaster-access.spec.ts for API restrictions
- Updated permissions.spec.ts (webmaster NOT full admin)

----------------------------------------------------------------

## Version 0.2.4 - Member History and Permission Refinement

### Member History Feature

Added member service history viewing capability to admin UI.

**New Capability: members:history**
- View member service history narrative
- See stats (events attended, volunteer roles, leadership roles, years active)
- Copy summary text to clipboard
- View detailed timeline of service records

**Role Access:**
- admin: Full access (has admin:full)
- vp-activities: Full access (leadership oversight)
- webmaster: DENIED (default, not needed for UI/site work)
- event-chair: DENIED (only see event-related member info)
- member: DENIED (no admin access)

### Admin UI Integration

Member Detail page (/admin/members/[id]) now includes:
- History panel below registrations table
- Stats row showing events, volunteer roles, leadership roles, years active
- Summary text narrative describing member's involvement
- Copy button to copy summary to clipboard
- Collapsible timeline table for audit/detail view

### API Endpoints

**GET /api/admin/members/[id]/history**
- Requires members:history capability
- Returns: memberId, memberName, summaryText, stats, timeline
- 403 Forbidden for unauthorized roles
- 404 for invalid member ID

### Tests

- Unit tests for members:history capability in auth-capabilities.spec.ts
- E2E tests in admin-member-history.spec.ts:
  - Panel visibility for admin role
  - Summary and stats display
  - Copy button presence
  - API permission checks for all roles

----------------------------------------------------------------

## Version 0.2.5 - Authorization Hardening

### Webmaster Posture

The webmaster role has been hardened to reflect SBNC operational reality.
Webmaster is a **UI/site management role**, NOT a full admin.

**Webmaster CAN:**
- Manage publishing assets (pages, themes, templates)
- Manage communication templates (email templates, audience rules)
- View mailing lists and campaigns

**Webmaster CANNOT (hardened restrictions):**
- See any financial information (finance:view/manage)
- Change anyone's entitlements or roles (users:manage)
- Access data exports (exports:access)
- View member data (members:view) - removed in v0.2.5
- View registration data (registrations:view) - removed in v0.2.5
- View member service history (members:history)
- Send campaigns (comms:send) - create only, send denied

**Debug Override:**
For support/debugging purposes, set `WEBMASTER_DEBUG_READONLY=true` to grant
webmaster read-only access to member and registration data. Default is OFF.

### New Roles

Added SBNC-specific leadership roles:

**president:**
- Full visibility into operations (members, events, registrations)
- Can view member service history
- Can approve transitions
- Can view financial data (but not manage)
- Cannot delete events (use cancel flow)

**past-president:**
- Advisory role with limited access
- Can view members, events, registrations
- Can view transitions (but not approve)
- Cannot edit events
- No financial access

### New Capabilities

Added to support fine-grained access:
- events:view - View all events including unpublished
- events:edit - Edit any event
- events:delete - Delete events (admin only)
- comms:send - Actually send campaigns
- transitions:view - View transition plans
- transitions:approve - Approve transition plans
- debug:readonly - Debug read-only access

### Route Hardening

Content and comms routes now use capability-based checks:
- /api/admin/content/* - publishing:manage
- /api/admin/comms/* - comms:manage

### Tests

- Updated auth-capabilities.spec.ts with new roles and capabilities
- Removed webmaster members:view assumption
- Added president/past-president capability tests

----------------------------------------------------------------

## Auth Posture (v0 Permissive)

### Current State (v0)

The authentication system is currently in a permissive development mode to
enable rapid iteration and testing without blocking on full auth implementation.

Behavior in v0:

- Admin endpoints accept any valid test token pattern
- Authorization: Bearer test-admin-token grants admin access
- Authorization: Bearer test-member-{id} grants member access
- Authorization: Bearer test-vp-activities grants VP access
- No strict ownership or role enforcement on most endpoints
- Unauthenticated requests to admin routes may return 200 instead of 401

### Planned State (v1 Hardening)

When auth hardening is implemented, the following will be enforced:

- Unauthenticated requests to admin routes return 401
- Regular members cannot access admin routes (403)
- Event chairs can only view/edit their own events
- VP of Activities can view/edit all events but cannot delete
- Only administrators can delete events
- Cross-chair access to other chairs' events returns 403

### Test Quarantine Strategy

Tests that verify strict auth behavior are tagged with @quarantine and excluded
from stable test runs until v1 hardening is complete. Each quarantined test
includes a TODO comment like:

```
// TODO (v1 hardening): Re-enable once auth enforcement is strict
test.describe("@quarantine Unauthenticated access", () => {
```

When v1 auth is implemented:
1. Remove @quarantine tags from auth tests
2. Verify all previously quarantined tests pass
3. Update this section to reflect the hardened state

----------------------------------------------------------------

## Page Templates and Theme Hooks (v0.3.0)

### Overview

Murmurant pages are rendered in two distinct view contexts: public (unauthenticated
visitors) and member (authenticated users with active membership). Each context
has different layout requirements, navigation menus, and available blocks.

This section defines the page template system and theme hooks that allow pages
to render appropriately for each view context while sharing the underlying
block-based content model.

### View Contexts

#### Public Context

- Target audience: Unauthenticated visitors and search engines
- Layout: Marketing-focused with prominent join/login CTAs
- Navigation: Public menu items only (Home, About, Events, Join, Contact)
- Blocks allowed: All non-member-only block types
- Theme hooks: usePublicTheme, PublicLayoutProvider

#### Member Context

- Target audience: Authenticated members with ACTIVE membership status
- Layout: Dashboard-focused with member navigation and profile access
- Navigation: Full member menu (My Club, Events, Groups, Directory, Account)
- Blocks allowed: All block types including member-only blocks
- Theme hooks: useMemberTheme, MemberLayoutProvider

### Page Template Types

Page templates define the structural layout for pages within each context.
Templates are stored in the Template model with type = PAGE.

#### Template Structure

```
PageTemplate {
  id: uuid
  name: string                    // Display name
  slug: string                    // Unique identifier
  context: "public" | "member"    // View context
  regions: TemplateRegion[]       // Layout regions
  defaultBlocks?: BlockConfig[]   // Blocks added to new pages
  constraints: TemplateConstraints
}

TemplateRegion {
  name: string                    // Region identifier (header, main, sidebar, footer)
  label: string                   // Display label
  allowedBlockTypes: BlockType[]  // Block types permitted in this region
  minBlocks?: number              // Minimum blocks required
  maxBlocks?: number              // Maximum blocks allowed (null = unlimited)
}

TemplateConstraints {
  requiresAuth: boolean           // Whether template requires authentication
  allowedRoles?: string[]         // Restrict to specific roles
  allowedMembershipStatuses?: string[]  // Restrict to membership statuses
}
```

#### Standard Templates

1. public-landing
   - Context: public
   - Regions: header (hero only), main (all public blocks), footer
   - Use case: Home page, landing pages

2. public-content
   - Context: public
   - Regions: main (text, image, cards, faq, contact, cta, divider, spacer)
   - Use case: About pages, info pages

3. public-events
   - Context: public
   - Regions: header (optional hero), main (event-list, text, cta)
   - Use case: Public events calendar

4. member-dashboard
   - Context: member
   - Regions: header, main, sidebar
   - Use case: Member home page with widgets

5. member-content
   - Context: member
   - Regions: main (all block types)
   - Use case: Member-only content pages

6. member-group
   - Context: member
   - Regions: header, main, sidebar
   - Use case: Interest group pages

### Theme Hooks

Theme hooks provide theme tokens and CSS variables to components based on
the current view context. Hooks are implemented as React hooks and context
providers.

#### Hook API

```typescript
// Public theme hook - uses site default theme
function usePublicTheme(): ThemeContext;

// Member theme hook - uses member preferences or site default
function useMemberTheme(): ThemeContext;

// Generic theme hook - auto-detects context
function useTheme(): ThemeContext;

// Theme context type
type ThemeContext = {
  themeId: string;
  tokens: ThemeTokens;
  cssVariables: string;
  isLoading: boolean;
  error?: Error;
};
```

#### Context Providers

```typescript
// Wraps public pages with theme context
function PublicLayoutProvider({ children }: { children: React.ReactNode });

// Wraps member pages with theme context and auth
function MemberLayoutProvider({ children }: { children: React.ReactNode });

// Generic provider that determines context from route
function PageLayoutProvider({
  context,
  children,
}: {
  context: "public" | "member";
  children: React.ReactNode;
});
```

### Page Rendering Flow

1. Request arrives for page path (e.g., /about or /member/groups/hiking)
2. Router determines view context from path prefix:
   - /member/* -> member context
   - /* -> public context
3. Layout provider wraps page with appropriate context
4. Page component fetches page data including template and blocks
5. canViewPage check runs against user context and page visibility
6. If denied: redirect to login (public) or show access denied (member)
7. If allowed: render page using template regions and blocks
8. Theme hook provides CSS variables to block renderer

### Block Visibility Rules

Blocks can have their own visibility rules independent of page visibility:

```typescript
type BlockVisibility = "inherit" | "public" | "members_only" | "role_restricted";

type BlockConfig = {
  id: string;
  type: BlockType;
  visibility: BlockVisibility;
  visibilityRule?: AudienceRule;  // For role_restricted
  data: BlockData;
  order: number;
};
```

Visibility resolution:
- inherit: Uses page visibility
- public: Always visible
- members_only: Visible only to authenticated members
- role_restricted: Visible only to members matching visibilityRule

### Member-Only Block Types

The following block types are only available in member context:

- member-directory: Searchable member directory widget
- my-registrations: Current user's event registrations
- my-groups: Current user's group memberships
- group-roster: Group member list (for group chairs)
- officer-widget: Role-specific admin widget

These blocks query live data and are never rendered in public context.

### Theme Inheritance

Themes follow an inheritance chain:

1. Site default theme (always present)
2. Page-specific theme override (optional)
3. Block-specific style overrides (optional)

The effective theme is computed by merging tokens:

```typescript
const effectiveTokens = mergeTokensWithDefaults(
  siteTheme.tokens,
  pageTheme?.tokens || {},
  blockStyles || {}
);
```

### API Endpoints

Page rendering endpoints:

- GET /api/pages/[slug]/render
  - Returns rendered page data for given context
  - Query params: context (public|member)
  - Auth: None for public, session for member
  - Response: { page, blocks, theme, template }

- GET /api/theme/current
  - Returns current theme CSS for view context
  - Query params: context (public|member), pageId (optional)
  - Response: { css: string, themeId: string }

### Implementation Files

Library modules:

- src/lib/publishing/pageTemplates.ts
  - Template type definitions
  - Template validation
  - Default template configurations
  - getTemplateForContext()
  - validateBlocksForTemplate()

- src/lib/publishing/themeHooks.ts
  - usePublicTheme hook
  - useMemberTheme hook
  - useTheme hook
  - ThemeProvider component
  - Theme token merging utilities

- src/lib/publishing/viewContext.ts
  - ViewContext type definitions
  - getViewContextFromPath()
  - ViewContextProvider component

Components:

- src/components/publishing/PageLayoutProvider.tsx
- src/components/publishing/PublicLayout.tsx
- src/components/publishing/MemberLayout.tsx
- src/components/publishing/BlockRenderer.tsx (existing, extended)

### Test Requirements

Unit tests (Vitest):

- tests/unit/publishing/pageTemplates.spec.ts
  - Template validation
  - Block type restrictions
  - Region constraints

- tests/unit/publishing/themeHooks.spec.ts
  - Token merging
  - CSS variable generation
  - Context detection

- tests/unit/publishing/viewContext.spec.ts
  - Path-based context detection
  - Block visibility filtering

E2E tests (Playwright):

- tests/e2e/public-page-render.spec.ts
  - Public page loads without auth
  - Member-only blocks hidden
  - Correct theme applied

- tests/e2e/member-page-render.spec.ts
  - Requires authentication
  - All blocks visible
  - Member theme applied

### Migration Notes

Existing pages without explicit template assignment:

- Public pages (visibility = PUBLIC) default to public-content template
- Member pages (visibility = MEMBERS_ONLY) default to member-content template
- Role-restricted pages default to member-content template

No data migration required; defaults are computed at render time.

----------------------------------------------------------------

