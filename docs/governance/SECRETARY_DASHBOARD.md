# Secretary Dashboard

Copyright (c) Santa Barbara Newcomers Club

## Purpose

The Secretary Dashboard provides a workflow management interface for the Club Secretary to manage meeting minutes through their lifecycle - from draft creation to publication.

## Charter Alignment

- **P1: Identity Provable** - Session-based authentication; all actions tracked by actor
- **P2: Default Deny** - Dashboard visibility gated by `meetings:read` capability
- **P3: Explicit State Machine** - Minutes follow defined status transitions
- **P5: Undoable Actions** - Revisions allowed before publication
- **P7: Audit Trail** - Every minutes record links to its audit history

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Secretary Dashboard                       │
│                    (Admin UI Widget)                         │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│           GET /api/v1/officer/secretary/dashboard            │
│                                                              │
│  Returns:                                                    │
│  - visible (boolean)                                         │
│  - upcomingMeeting (next meeting info)                       │
│  - draftsInProgress (DRAFT/REVISED minutes)                  │
│  - awaitingReview (SUBMITTED minutes)                        │
│  - readyToPublish (APPROVED minutes)                         │
│  - recentlyPublished (PUBLISHED minutes)                     │
│  - capabilities (action permissions)                         │
└─────────────────────────────────────────────────────────────┘
```

## Dashboard Sections

### 1. Upcoming Meeting

Shows the next scheduled governance meeting with:

- Meeting type (BOARD, EXECUTIVE)
- Meeting date (formatted)
- Meeting title (if set)
- Quick action: "Create Draft Minutes" (if no draft exists)

**Visibility**: Always shown when `upcomingMeeting` is not null

**Action**: Create Draft (requires `meetings:minutes:draft:create`)

### 2. Drafts in Progress

Minutes in DRAFT or REVISED status that the Secretary can edit.

- Status: "Draft" or "Needs Revision"
- Last edited by information
- Version number (if > 1)

**Actions**:

- Edit (requires `meetings:minutes:draft:edit`)
- Submit for Review (requires `meetings:minutes:draft:submit`)
- View Audit Trail

### 3. Awaiting President Review

Minutes in SUBMITTED status waiting for President approval.

- Status: "Awaiting Review"
- Read-only for Secretary

**Actions**:

- View Audit Trail (no edit actions)

### 4. Approved - Ready to Publish

Minutes in APPROVED status that can be published.

- Status: "Ready to Publish"
- Shows approval information

**Actions**:

- Publish (requires `meetings:minutes:finalize`)
- View Audit Trail

### 5. Recently Published

Last 5 published minutes for reference.

- Status: "Published"
- Collapsed by default
- Historical reference only

**Actions**:

- View Audit Trail

## Capability Requirements

| Action | Capability | Typical Roles |
|--------|------------|---------------|
| View Dashboard | `meetings:read` | secretary, admin |
| Create Draft | `meetings:minutes:draft:create` | secretary, admin |
| Edit Draft | `meetings:minutes:draft:edit` | secretary, admin |
| Submit for Review | `meetings:minutes:draft:submit` | secretary, admin |
| Publish | `meetings:minutes:finalize` | admin |

Note: The Secretary role can create, edit, and submit minutes but cannot publish. Publishing requires the `meetings:minutes:finalize` capability, typically held by admin or president.

## Minutes Workflow State Machine

```
                    ┌─────────┐
                    │  DRAFT  │ (Secretary creates/edits)
                    └────┬────┘
                         │ submit
                         ▼
                    ┌─────────────┐
              ┌────▶│  SUBMITTED  │ (Awaiting President)
              │     └──────┬──────┘
              │            │
              │     ┌──────┴──────┐
              │     │             │
              │     ▼             ▼
         resubmit   │        ┌──────────┐
              │  ┌──────┐    │ APPROVED │ (Ready to publish)
              │  │REVISED│   └────┬─────┘
              │  └───┬───┘        │ publish
              │      │            ▼
              └──────┘       ┌──────────┐
                             │PUBLISHED │ (Visible to members)
                             └────┬─────┘
                                  │ archive
                                  ▼
                             ┌──────────┐
                             │ ARCHIVED │ (Historical)
                             └──────────┘
```

### Status Transitions

| From | To | Actor | Capability |
|------|----|-------|------------|
| DRAFT | SUBMITTED | Secretary | `meetings:minutes:draft:submit` |
| SUBMITTED | APPROVED | President | `meetings:minutes:review` |
| SUBMITTED | REVISED | President | `meetings:minutes:review` |
| REVISED | SUBMITTED | Secretary | `meetings:minutes:draft:submit` |
| APPROVED | PUBLISHED | Admin | `meetings:minutes:finalize` |
| PUBLISHED | ARCHIVED | Admin | `meetings:minutes:finalize` |

## API Endpoint

### GET /api/v1/officer/secretary/dashboard

Returns the dashboard data for the authenticated user.

**Response Structure**:

```typescript
{
  visible: boolean;
  upcomingMeeting: {
    id: string;
    date: string;           // ISO 8601
    dateFormatted: string;  // "Dec 17, 2025"
    type: string;           // "BOARD" | "EXECUTIVE"
    title: string | null;
    hasMinutes: boolean;
  } | null;
  draftsInProgress: MinutesSummary[];
  awaitingReview: MinutesSummary[];
  readyToPublish: MinutesSummary[];
  recentlyPublished: MinutesSummary[];
  capabilities: {
    canCreateDraft: boolean;
    canEditDraft: boolean;
    canSubmit: boolean;
    canPublish: boolean;
  };
}
```

**MinutesSummary**:

```typescript
{
  id: string;
  meetingId: string;
  meetingDate: string;           // ISO 8601
  meetingDateFormatted: string;  // "Dec 17, 2025"
  meetingType: string;
  meetingTitle: string | null;
  status: MinutesStatus;
  statusLabel: string;           // Human-readable
  version: number;
  updatedAt: string;             // ISO 8601
  lastEditedBy: string | null;
  auditTrailUrl: string;
}
```

## UI Component

### File Location

`src/app/admin/SecretaryDashboard.tsx`

### Features

- Session-based authentication (HttpOnly cookies)
- Capability-gated action buttons
- Collapsible sections for long lists
- Inline workflow actions (Submit, Publish)
- Loading and error states
- Audit trail links for every item

### Data Test IDs

| Element | Test ID |
|---------|---------|
| Dashboard container | `secretary-dashboard` |
| Dashboard title | `secretary-dashboard-title` |
| Loading state | `secretary-dashboard-loading` |
| Upcoming meeting | `secretary-upcoming-meeting` |
| Create draft button | `secretary-create-draft-btn` |
| Drafts section | `secretary-drafts` |
| Drafts count badge | `secretary-drafts-count` |
| Drafts list | `secretary-drafts-list` |
| Draft item | `secretary-drafts-item-{id}` |
| Edit link | `secretary-drafts-edit-{id}` |
| Submit action | `secretary-drafts-action-{id}` |
| Audit link | `secretary-drafts-audit-{id}` |
| Awaiting review section | `secretary-awaiting-review` |
| Ready to publish section | `secretary-ready-publish` |
| Published section | `secretary-published` |

## Testing

### Unit Tests

Location: `tests/unit/governance/secretary-dashboard.spec.ts`

Coverage:

- Dashboard data structure validation
- Status label mappings
- Capability checking
- Action gating logic
- Audit trail URL format

### E2E Tests

Location: `tests/api/v1/officer/secretary-dashboard.test.ts`

Coverage:

- API endpoint response structure
- Section data validation
- Status filtering by section
- Performance requirements

### Minutes Status Tests

Location: `tests/unit/governance/minutes-status.spec.ts`

Coverage:

- State machine transitions
- Valid/invalid transition checks
- Secretary editable statuses

## Related Documentation

- [Minutes Workflow](./MINUTES_WORKFLOW.md) - Full minutes lifecycle
- [Capability System](../AUTH/CAPABILITIES.md) - Permission model
- [Audit Logging](../OPS/AUDIT_LOGGING.md) - Audit trail details
