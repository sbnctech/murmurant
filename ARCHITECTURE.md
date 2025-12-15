## Persistence layer v0.1

The persistence layer uses PostgreSQL 16 and Prisma to model the core club data.

### Core tables

- Contact
  - Fields: id, createdAt, updatedAt, firstName, lastName, email, phone, and other profile fields.
  - Notes: primary anchor for any person; other tables refer to Contact via foreign keys.

- Membership
  - Fields: id, createdAt, updatedAt, contactId, level, status, startAt, endAt (nullable for open-ended).
  - Relationship: many Membership rows per Contact over time.
  - Purpose: represents membership history and allows the system to compute the current membership state at any time.

- Event
  - Fields: id, createdAt, updatedAt, title, description, category, startAt, endAt, and any additional scheduling and configuration fields.
  - Purpose: defines scheduled activities that can be listed on calendars and used for registrations and communications.

- Registration
  - Fields: id, createdAt, updatedAt, eventId, contactId, status.
  - Relationship:
    - Many registrations per Event.
    - Many registrations per Contact.
  - Purpose: represents the relationship between a Contact and an Event, including statuses like REGISTERED and WAITLISTED.

- SmsMessageLog
  - Fields: id, createdAt, contactId (optional), eventId (optional), phone, direction, status, body, providerMessageId (optional).
  - Purpose: central log for outbound and inbound SMS around Contacts and Events.

### Concept of "member" in the architecture

There is no Member table.

- "Member" is a view:
  - Derived from Contact + Membership where Membership is in an active state.
  - Different screens may use slightly different definitions of "active" (for example: includes Extended Newcomer or Alumni), but the underlying data remains the same.

- Query examples:
  - "Current members" page:
    - Select Contacts that have at least one Membership row whose state is in an allowed set and whose time bounds include "now".
  - "Lapsed members" view:
    - Select Contacts whose most recent Membership row ended before "now" and is in a lapsed state.

### Development environment

- PostgreSQL 16 runs locally via Homebrew:
  - Data directory: /opt/homebrew/var/postgresql@16
- Prisma is configured with a single datasource "db" pointing at:
  - postgresql://clubos:clubos@localhost:5432/clubos
- Migration:
  - Managed via "prisma migrate dev".
  - Migration history is stored in the _prisma_migrations table and in prisma/migrations on disk.
- Application code:
  - Uses the generated Prisma Client to read and write Contact, Membership, Event, Registration, and SmsMessageLog.

### Transitional API approach

For now:

- The admin dashboard endpoints are still mostly mocked:
  - /api/members, /api/events, /api/registrations.
- The architecture assumes these will be replaced by Prisma-backed implementations that:
  - Use Contact as the root for any person lists.
  - Use Membership to derive member status.
  - Use Registration for event attendance.
  - Use SmsMessageLog for SMS-related monitoring and audit.

This section is the authoritative reference for how the persistence layer is expected to behave in the current phase.

----------------------------------------------------------------

## Publishing and Communications Layer (v0.2)

The publishing and communications layer extends the core persistence model to support page management, email templates, mailing lists, and permissions.

### Site and Configuration Tables

- Site
  - Fields: id, name, domain, defaultThemeId, defaultTemplateId, settings (jsonb), createdAt, updatedAt.
  - Purpose: represents a club's web presence with global configuration.

- NavigationMenu
  - Fields: id, siteId, name, slug, items (jsonb), createdAt, updatedAt.
  - Purpose: stores navigation menus (Primary, Footer, Member Menu) with ordered items.

### Page and Content Tables

- Page
  - Fields: id, siteId, path, title, description, templateId, status (DRAFT, PUBLISHED, ARCHIVED), visibility (PUBLIC, MEMBERS_ONLY, ROLE_RESTRICTED, GROUP_TARGETED), visibilityRuleId, publishedAt, createdAt, updatedAt, createdBy, updatedBy.
  - Constraints: path unique within site, starts with "/".
  - Purpose: represents a web page with metadata and visibility settings.

- PageVersion
  - Fields: id, pageId, versionNumber, snapshot (jsonb), publishedAt, createdAt, createdBy.
  - Purpose: tracks version history for pages; snapshot contains full page state.

- Block
  - Fields: id, pageId, region, blockType, sortOrder, config (jsonb), visibility, visibilityRuleId, createdAt, updatedAt.
  - Purpose: content components on pages (hero, text, image, event-list, etc.).

- PageTemplate
  - Fields: id, siteId, name, slug, description, regions (jsonb), isDefault, createdAt, updatedAt.
  - Purpose: defines page structure with available regions and block type constraints.

- Theme
  - Fields: id, siteId, name, slug, description, tokens (jsonb), isDefault, createdAt, updatedAt.
  - Purpose: design tokens for colors, typography, spacing exposed as CSS variables.

- VisibilityRule
  - Fields: id, name, description, ruleType (ROLE_BASED, GROUP_BASED, MEMBERSHIP_LEVEL, COMPOUND), conditions (jsonb), createdAt, updatedAt.
  - Purpose: complex visibility conditions for pages and blocks.

### Email and Communications Tables

- MailTemplate
  - Fields: id, siteId, name, slug, type (TRANSACTIONAL, CAMPAIGN), subject, preheader, bodyHtml, bodyText, fromName, fromEmail, replyTo, isActive, createdAt, updatedAt, createdBy.
  - Purpose: reusable email templates with merge field support.

- EmailMessageLog
  - Fields: id, templateId, templateSlug, recipientContactId, recipientEmail, subject, bodyHtml, bodyText, status (PENDING, SENT, DELIVERED, BOUNCED, FAILED), providerMessageId, sentAt, deliveredAt, bouncedAt, bounceReason, metadata (jsonb), createdAt.
  - Purpose: audit trail for all sent emails.

- MailingList
  - Fields: id, siteId, name, slug, description, listType (STATIC, DYNAMIC), audienceSegmentId, ownerRoles (string array), allowMemberSubscribe, allowMemberUnsubscribe, isActive, createdAt, updatedAt.
  - Purpose: logical groupings of email recipients.

- MailingListMember
  - Fields: id, mailingListId, contactId, addedAt, addedBy, removedAt, removedBy.
  - Purpose: links contacts to static mailing lists.

- AudienceSegment
  - Fields: id, siteId, name, description, rules (jsonb), createdAt, updatedAt.
  - Purpose: dynamic recipient definitions based on membership, roles, groups, or events.

- UnsubscribeRecord
  - Fields: id, contactId, mailingListId (nullable for global unsubscribe), unsubscribedAt, source (LINK_CLICK, ADMIN_ACTION, MEMBER_PREFERENCE).
  - Purpose: tracks unsubscribe preferences per contact.

### Groups and Permissions Tables

- Group
  - Fields: id, siteId, name, slug, description, groupType (INTEREST, COMMITTEE, BOARD, SPECIAL), isActive, createdAt, updatedAt.
  - Purpose: interest groups, committees, and other member groupings.

- GroupMember
  - Fields: id, groupId, contactId, groupRole (MEMBER, LEADER, CHAIR, COORDINATOR), joinedAt, leftAt.
  - Purpose: links contacts to groups with role information.

- ContactRole
  - Fields: id, contactId, role (enum), grantedAt, grantedBy, revokedAt, revokedBy.
  - Purpose: assigns global roles to contacts (SITE_ADMIN, CONTENT_EDITOR, etc.).

- PagePermission
  - Fields: id, pageId, contactId, role, groupId, permission (VIEW, EDIT, PUBLISH, DELETE), grantedAt, grantedBy.
  - Purpose: row-level permissions for specific pages.

- EventPermission
  - Fields: id, eventId, contactId, role, permission (VIEW, EDIT, MANAGE_REGISTRATIONS, DELETE), grantedAt, grantedBy.
  - Purpose: row-level permissions for specific events.

- PermissionAuditLog
  - Fields: id, action (GRANT, REVOKE, MODIFY), resourceType, resourceId, targetContactId, targetRole, targetGroupId, permission, performedBy, performedAt, metadata (jsonb).
  - Purpose: audit trail for all permission changes.

### Entity Relationships

```
Site
  |-- has many --> Page
  |-- has many --> PageTemplate
  |-- has many --> Theme
  |-- has many --> NavigationMenu
  |-- has many --> MailingList
  |-- has many --> MailTemplate
  |-- has many --> AudienceSegment
  |-- has many --> Group

Page
  |-- belongs to --> PageTemplate
  |-- may reference --> VisibilityRule
  |-- has many --> Block
  |-- has many --> PageVersion
  |-- has many --> PagePermission

Block
  |-- belongs to --> Page
  |-- may reference --> VisibilityRule

MailingList
  |-- may reference --> AudienceSegment (for DYNAMIC lists)
  |-- has many --> MailingListMember (for STATIC lists)

MailingListMember
  |-- belongs to --> MailingList
  |-- belongs to --> Contact

EmailMessageLog
  |-- may reference --> MailTemplate
  |-- may reference --> Contact (recipient)

Group
  |-- has many --> GroupMember

GroupMember
  |-- belongs to --> Group
  |-- belongs to --> Contact

Contact
  |-- has many --> ContactRole
  |-- has many --> GroupMember
  |-- has many --> UnsubscribeRecord
  |-- has many --> PagePermission
  |-- has many --> EventPermission
```

### Prisma Enums (to be added)

```
enum PageStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum PageVisibility {
  PUBLIC
  MEMBERS_ONLY
  ROLE_RESTRICTED
  GROUP_TARGETED
}

enum BlockVisibility {
  INHERIT
  PUBLIC
  MEMBERS_ONLY
  ROLE_RESTRICTED
  GROUP_TARGETED
}

enum VisibilityRuleType {
  ROLE_BASED
  GROUP_BASED
  MEMBERSHIP_LEVEL
  COMPOUND
}

enum MailTemplateType {
  TRANSACTIONAL
  CAMPAIGN
}

enum EmailStatus {
  PENDING
  SENT
  DELIVERED
  BOUNCED
  FAILED
}

enum MailingListType {
  STATIC
  DYNAMIC
}

enum UnsubscribeSource {
  LINK_CLICK
  ADMIN_ACTION
  MEMBER_PREFERENCE
}

enum GroupType {
  INTEREST
  COMMITTEE
  BOARD
  SPECIAL
}

enum GroupRole {
  MEMBER
  LEADER
  CHAIR
  COORDINATOR
}

enum ContactRoleType {
  SITE_ADMIN
  CONTENT_EDITOR
  COMMUNICATIONS_ADMIN
  EVENTS_ADMIN
  MEMBERS_ADMIN
  CATEGORY_CHAIR
  GROUP_LEADER
  READ_ONLY_AUDITOR
}

enum PagePermissionType {
  VIEW
  EDIT
  PUBLISH
  DELETE
}

enum EventPermissionType {
  VIEW
  EDIT
  MANAGE_REGISTRATIONS
  DELETE
}

enum PermissionAction {
  GRANT
  REVOKE
  MODIFY
}
```

----------------------------------------------------------------

## Implementation Status (v0.2.1)

The following components have been implemented for the publishing and communications layer:

### Prisma Models Implemented

- **Page**: Content pages with block-based content, status workflow (DRAFT, PUBLISHED, ARCHIVED), visibility controls (PUBLIC, MEMBERS_ONLY, ROLE_RESTRICTED), and SEO fields
- **PageTemplate**: Reusable page structures with regions and default blocks
- **Theme**: Design tokens (colors, typography, spacing, shadows) with CSS variable generation and custom CSS support
- **AudienceRule**: JSON-based rules for targeting content to specific member segments
- **MailingList**: Recipient lists with dynamic audience rules
- **MessageTemplate**: Email/message templates with token replacement
- **MessageCampaign**: Campaign management with scheduling and delivery tracking
- **DeliveryLog**: Audit trail for message deliveries
- **Permission**: Row-level permissions for resources
- **AuditLog**: System-wide audit trail for all operations

### API Routes Implemented

**Content Management APIs:**
- `GET/POST /api/admin/content/pages` - List and create pages
- `GET/PATCH/DELETE /api/admin/content/pages/[id]` - Page CRUD operations
- `GET/POST /api/admin/content/templates` - Template management
- `GET/PATCH/DELETE /api/admin/content/templates/[id]` - Template CRUD
- `GET/POST /api/admin/content/themes` - Theme management
- `GET/PATCH/DELETE /api/admin/content/themes/[id]` - Theme CRUD
- `GET /api/theme` - Returns active theme as CSS variables

**Communications APIs:**
- `GET/POST /api/admin/comms/lists` - Mailing list management
- `GET/PATCH/DELETE /api/admin/comms/lists/[id]` - List CRUD
- `GET/POST /api/admin/comms/templates` - Message template management
- `GET/PATCH/DELETE /api/admin/comms/templates/[id]` - Template CRUD
- `GET/POST /api/admin/comms/campaigns` - Campaign management
- `GET/PATCH/DELETE /api/admin/comms/campaigns/[id]` - Campaign CRUD with send action

**Public Routes:**
- `GET /pages/[slug]` - Public page rendering
- `GET /member/[slug]` - Member-only page rendering

### Library Modules Implemented

- `src/lib/publishing/theme.ts` - Theme token validation, CSS variable generation, theme caching
- `src/lib/publishing/blocks.ts` - Block validation, default content creation, block metadata
- `src/lib/publishing/audience.ts` - Audience rule evaluation against member context
- `src/lib/publishing/email.ts` - Email token replacement with XSS protection
- `src/lib/publishing/permissions.ts` - Permission checking, user context building, audit logging

### Admin UI Pages Implemented

- `/admin/content/pages` - Page list with filtering and pagination
- `/admin/content/pages/[id]` - Page editor (stub)
- `/admin/content/templates` - Template list
- `/admin/content/themes` - Theme list with status filtering
- `/admin/comms/lists` - Mailing list management
- `/admin/comms/templates` - Message template list
- `/admin/comms/campaigns` - Campaign list with status filtering and pagination

### Components Implemented

- `BlockRenderer.tsx` - Renders page blocks (hero, text, image, cards, event-list, gallery, FAQ, contact, CTA, divider, spacer)
- `PagesTable.tsx`, `TemplatesTable.tsx`, `ThemesTable.tsx` - Admin list components
- `MailingListsTable.tsx`, `MessageTemplatesTable.tsx`, `CampaignsTable.tsx` - Communications admin components

### Test Coverage

- **Unit Tests (151 tests):**
  - `tests/unit/publishing/theme.spec.ts` - Theme validation and CSS generation
  - `tests/unit/publishing/blocks.spec.ts` - Block validation and creation
  - `tests/unit/publishing/audience.spec.ts` - Audience rule evaluation
  - `tests/unit/publishing/email.spec.ts` - Token replacement and XSS protection
  - `tests/unit/publishing/permissions.spec.ts` - Permission checking

- **E2E Tests:**
  - `tests/admin/admin-content-*.spec.ts` - Content admin UI tests
  - `tests/admin/admin-comms-*.spec.ts` - Communications admin UI tests
  - `tests/api/api-content-*.spec.ts` - Content API tests
  - `tests/api/api-comms.spec.ts` - Communications API tests
  - `tests/api/api-publishing-contracts.spec.ts` - API contract tests

----------------------------------------------------------------

## Version 0.2.2 - Hardening and Release Readiness

### CI Scripts Added

- `npm run test:unit` - Run unit tests (vitest)
- `npm run test-admin:stable` - Run stable admin E2E tests (excludes @quarantine)
- `npm run test-publish:e2e` - Run publishing/comms E2E tests
- `npm run test-api:stable` - Run stable API E2E tests (excludes @quarantine)

### Test Suite Summary

- **Unit tests:** 151 tests across 5 files
- **Admin E2E:** 6 publishing/comms test files
- **API E2E:** 4 contract test files covering page lifecycle, theme validation, list endpoints

### Stability Improvements

- Added `test.beforeEach` with `waitUntil: "networkidle"` for stable page loads
- All assertions use `data-test-id` attributes where possible
- Tests create own data for CRUD operations (no hardcoded seed IDs)
- Flaky tests can be tagged `@quarantine` and excluded from stable runs

### Known Limitations

- Page editor UI is a stub (detail view only)
- No rich text editing for blocks yet
- Campaign send action logs but doesn't actually send emails
- Seed data IDs are non-deterministic; tests must query by unique fields

----------------------------------------------------------------

## Version 0.2.3 - RBAC Refinement: Webmaster Role

### Webmaster Role Definition

The webmaster role has been clarified to be a **UI/site management role**, NOT a full admin:

**CAN access:**
- Publishing admin (pages, themes, templates, media)
- Comms admin (mailing lists, templates, campaigns)
- Member/registration views (read-only, for support)

**CANNOT access:**
- Data exports (members.csv, events.csv, etc.)
- Finance data (view or manage)
- User entitlements management (roles, permissions)
- Deleting published pages (only full admins can)

### Capability-Based Permissions

The capability system in `src/lib/auth.ts` controls fine-grained access:

```typescript
type Capability =
  | "publishing:manage"     // Pages, themes, templates, media
  | "comms:manage"          // Email templates, audiences, campaigns
  | "comms:send"            // Actually send campaigns (separate from manage)
  | "members:view"          // Read-only member detail
  | "members:history"       // View member service history narrative
  | "registrations:view"    // Read-only registration detail
  | "events:view"           // View all events including unpublished
  | "events:edit"           // Edit any event
  | "events:delete"         // Delete events (admin only)
  | "exports:access"        // Access to data export endpoints
  | "finance:view"          // View financial data
  | "finance:manage"        // Edit financial data
  | "transitions:view"      // View transition plans
  | "transitions:approve"   // Approve transition plans
  | "users:manage"          // Create/update user roles and entitlements
  | "admin:full"            // Full admin access (implies all)
  | "debug:readonly";       // Debug read-only access
```

### Role Capability Mappings (v0.2.5)

- `admin`: All capabilities (has admin:full)
- `president`: members:view/history, events:view/edit, finance:view, transitions:view/approve, exports:access
- `past-president`: members:view/history, events:view, transitions:view (advisory - no edit/approve)
- `vp-activities`: members:view/history, events:view/edit, transitions:view/approve
- `event-chair`: members:view, registrations:view, events:view (committee-scoped edit TBD)
- `webmaster`: publishing:manage, comms:manage (NO member/registration/finance access)
- `member`: No admin capabilities

### Webmaster Debug Override

For debugging/support, set `WEBMASTER_DEBUG_READONLY=true` to enable:
- members:view (read-only)
- registrations:view (read-only)
- events:view (read-only)
- debug:readonly flag

Default is OFF - webmaster has no member/registration access by default.

### Route Guards Updated

All export endpoints now require `exports:access` capability:
- `GET /api/admin/export/members` - 403 for webmaster
- `GET /api/admin/export/events` - 403 for webmaster
- `GET /api/admin/export/registrations` - 403 for webmaster
- `GET /api/admin/export/activity` - 403 for webmaster

Publishing endpoints use `publishing:manage` capability:
- `GET/POST /api/admin/content/pages` - OK for webmaster
- `GET/PUT/POST /api/admin/content/pages/[id]` - OK for webmaster
- `DELETE /api/admin/content/pages/[id]` - Published pages require admin:full

Member history endpoint requires `members:history` capability:
- `GET /api/admin/members/[id]/history` - 403 for webmaster, event-chair

### Debug Support Endpoint

A debug endpoint for webmaster support was added:
- `GET /api/admin/debug/effective-permissions?email=...`
- Only available when `WEBMASTER_SUPPORT_DEBUG=1` env var is set
- Requires `publishing:manage` capability
- Returns capability booleans and role name (never finance data)

### Test Coverage

- **Unit tests:** 263+ tests (auth-capabilities.spec.ts with 57 role/capability tests)
- **API tests:** Added webmaster-access.spec.ts for role restrictions
- **Permission tests:** Updated to reflect webmaster is NOT full admin
- **Member history tests:** admin-member-history.spec.ts for UI and API permission checks
- **New role tests:** president, past-president capability tests added

----------------------------------------------------------------

## Service History and Transitions

### Term Boundaries

ClubOS operates on a semi-annual term cycle:

- **Winter term**: August 1 through January 31
- **Summer term**: February 1 through July 31

Transitions occur at midnight Pacific Time on Feb 1 and Aug 1.

### Transition Widget

The transition countdown widget helps leadership manage semi-annual role transitions. It appears on dashboards of:

- President (via active `BOARD_OFFICER` service record with roleTitle "President")
- Past President (via active `BOARD_OFFICER` service record with roleTitle "Past President")

**Visibility window:**

- Default lead time: 60 days before transition date
- Configurable via `TRANSITION_WIDGET_LEAD_DAYS` environment variable
- Widget shows: next transition date, days remaining, term name, and plan status

**Permissions:**

| Action | President | Past President | VP | Board | Webmaster |
|--------|-----------|----------------|-----|-------|-----------|
| View widget | Yes | Yes | No | No | No |
| Create plan | Yes | No | No | No | No |
| Edit plan | Yes | No | No | No | No |
| Sign off | Yes | Yes | No | No | No |
| Apply plan | Yes | No | No | No | No |

**API endpoint:**

- `GET /api/v1/admin/transitions/widget` - Returns widget data and visibility status

### Service History Records

The `MemberServiceHistory` model tracks:

- `BOARD_OFFICER`: Board positions (President, VP Activities, etc.)
- `COMMITTEE_CHAIR`: Committee leadership
- `COMMITTEE_MEMBER`: Committee membership
- `EVENT_HOST`: Event hosting (auto-created when assigned as event chair, auto-closed day after event ends)
- `VOLUNTEER`: General volunteer service

All service records include:

- Start date and optional end date
- Role title and optional committee/event association
- Link to transition plan (if created via transition workflow)

----------------------------------------------------------------

## Timezone Policy

All DateTime handling in ClubOS follows these rules:

- **Storage**: All DateTime values are stored in UTC at rest (Prisma default).
- **Canonical timezone**: The system's canonical business timezone is `America/Los_Angeles`.
- **Display**: All user-facing date/time display is rendered in Pacific Time.
- **Day boundaries**: All day-boundary logic (e.g., "today", role transitions, expirations) is evaluated at 00:00 Pacific Time, accounting for DST.
- **Implementation requirement**: Any logic that depends on calendar days MUST use the shared timezone utility helpers in `src/lib/timezone.ts`, not ad hoc date math.

This ensures consistent behavior across the club's operations, which are all based in Santa Barbara, California.

----------------------------------------------------------------

## Copyright

Copyright (c) 2025 Santa Barbara Newcomers Club. All rights reserved.
