# Event Posting and Registration Schedule

Copyright (c) Santa Barbara Newcomers Club

## Overview

This document describes the SBNC event publishing and registration scheduling policy implemented in Murmurant. The policy ensures members have time to learn about events before registration opens, preventing a "first-come-first-served rush" when events are announced.

## SBNC Scheduling Policy

### Events Requiring Registration

For events that require member registration (capacity-limited activities, ticketed events, etc.):

1. **Sunday (eNews Day)**: Event is announced in the weekly newsletter
   - Event becomes visible to members on the website
   - Registration is NOT yet open (button shows "Registration opens Tuesday, Jan X at 8:00 AM")

2. **Tuesday at 8:00 AM Pacific**: Registration opens
   - Members can now register for the event
   - Follows the standard registration flow

This two-day gap gives all members equal opportunity to learn about events before registration opens, rather than rewarding those who happened to be online at announcement time.

### Events NOT Requiring Registration

For events that don't require registration (open attendance, informational meetings, etc.):

- Published immediately when approved
- No scheduling constraints apply
- Members can see the event right away

## Data Model

The following fields support this scheduling policy:

```prisma
model Event {
  // Existing fields...

  // Registration scheduling
  requiresRegistration Boolean   @default(true)
  registrationOpensAt  DateTime?  // When registration UI becomes active

  // eNews integration
  enewsBlurbDraft      String?    // Short blurb for weekly newsletter
}
```

### Field Semantics

| Field | Description |
|-------|-------------|
| `requiresRegistration` | Whether members must register. If false, event publishes immediately. |
| `registrationOpensAt` | When the Register button becomes active. Null = immediate when published. |
| `enewsBlurbDraft` | Short description for the weekly newsletter (VP Communications editable). |

## Derived States

### Visibility State

Derived from `status`, `publishAt`, and `publishedAt`:

| State | Meaning |
|-------|---------|
| `DRAFT` | Not visible to members |
| `SCHEDULED` | Approved but not yet published (future publishAt) |
| `VISIBLE` | Published and visible to members |

### Registration State

Derived from `requiresRegistration`, `registrationOpensAt`, `registrationDeadline`, and `startTime`:

| State | Meaning |
|-------|---------|
| `NOT_REQUIRED` | No registration needed for this event |
| `SCHEDULED` | Event visible but registration not yet open |
| `OPEN` | Registration is active |
| `CLOSED` | Registration deadline passed or event started |

### Operational Status

Comprehensive status combining visibility, registration, and event lifecycle:

| Status | Label | Meaning |
|--------|-------|---------|
| `DRAFT` | Draft | Event being created |
| `PENDING_APPROVAL` | Pending Approval | Submitted for VP Activities approval |
| `CHANGES_REQUESTED` | Changes Requested | Returned to chair with feedback |
| `APPROVED_SCHEDULED` | Approved - Scheduled | Approved, waiting for publishAt |
| `ANNOUNCED_NOT_OPEN` | Announced - Registration Opens Soon | Visible but registration not yet open |
| `OPEN_FOR_REGISTRATION` | Open for Registration | Members can register |
| `REGISTRATION_CLOSED` | Registration Closed | Deadline passed |
| `IN_PROGRESS` | In Progress | Event is currently happening |
| `COMPLETED` | Completed | Event has ended |
| `CANCELED` | Canceled | Event was canceled |
| `ARCHIVED` | Archived | Moved to historical records |

## Member-Facing UI

When viewing an event in the `SCHEDULED` registration state:

- Status badge shows "Coming Soon"
- Instead of a Register button, members see:
  ```
  [clock icon] Registration opens Tuesday, Jan 14 at 8:00 AM
  ```
- The "Add to Calendar" button remains available

## VP Communications Dashboard

Available at `/admin/communications` for users with the `events:schedule:view` capability.

Shows:

1. **Events Announcing This Week**: Events with `publishAt` in the current Sunday-Saturday range
2. **Registration Opens This Week**: Events with `registrationOpensAt` in the current week

For each event, the dashboard displays:
- Event title (links to admin detail page)
- Committee name
- Publish/registration date
- Event date
- Operational status
- eNews blurb status

## RBAC Capabilities

| Capability | Description | Roles |
|------------|-------------|-------|
| `events:schedule:view` | View event scheduling dashboard | VP Activities, VP Communications, Admin |
| `events:enews:edit` | Edit eNews blurb drafts | VP Communications, Admin |
| `events:approve` | Approve events for publication | VP Activities, Admin |
| `events:submit` | Submit events for approval | Event Chair, VP Activities, Admin |

## API Endpoints

### GET `/api/v1/admin/communications/enews-week`

Returns events for the VP Communications dashboard.

**Authorization**: Requires `events:schedule:view` capability

**Response**:
```json
{
  "week": {
    "start": "2024-12-22T08:00:00.000Z",
    "end": "2024-12-28T08:00:00.000Z",
    "displayStart": "Sun, Dec 22",
    "displayEnd": "Sat, Dec 28"
  },
  "announcing": [...],
  "opening": [...],
  "counts": {
    "announcing": 5,
    "opening": 3
  }
}
```

### GET `/api/v1/events/:id`

Now includes registration scheduling fields:

```json
{
  "event": {
    "id": "...",
    "title": "...",
    "requiresRegistration": true,
    "registrationOpensAt": "2024-12-24T16:00:00.000Z",
    "registrationState": "SCHEDULED",
    "registrationOpensMessage": "Registration opens Tuesday, Dec 24 at 8:00 AM"
  }
}
```

## Timezone Handling

All scheduling uses Pacific Time (`America/Los_Angeles`):

- `publishAt` dates are set to midnight Pacific on Sunday
- `registrationOpensAt` is set to 8:00 AM Pacific on Tuesday
- Display formatting uses Pacific timezone

## Charter Compliance

This implementation adheres to:

- **P1 (Identity)**: All scheduling actions tied to authenticated users
- **P2 (Default Deny)**: Dashboard requires explicit capability
- **P5 (Visible State)**: Operational status clearly displayed to admins and members
- **P7 (Audit)**: Sensitive access to scheduling data is logged

## Related Documentation

- [EVENT_STATUS_LIFECYCLE.md](./EVENT_STATUS_LIFECYCLE.md) - Status transitions
- [EVENT_LIFECYCLE_DESIGN.md](./EVENT_LIFECYCLE_DESIGN.md) - Overall event lifecycle
- [EVENT_FIELD_INTELLIGENCE.md](./EVENT_FIELD_INTELLIGENCE.md) - Field derivations
