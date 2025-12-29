# Secretary Minutes Workflow

**Audience**: SBNC Tech Chair, Secretary, Board Members
**Purpose**: Document the minutes workflow and Secretary capabilities

---

## Overview

The Secretary role manages meeting minutes through a defined state machine workflow. Minutes progress through states with specific capability requirements at each transition.

## Minutes State Machine

```
                 +----------+
                 |  DRAFT   |  <-- Secretary creates/edits
                 +----+-----+
                      |
                      | submit (Secretary)
                      v
                 +----------+
                 | SUBMITTED|  <-- Awaiting President review
                 +----+-----+
                      |
          +-----------+-----------+
          |                       |
          | revise (President)    | approve (President)
          v                       v
    +----------+            +----------+
    | REVISED  |            | APPROVED |  <-- Ready for publication
    +----+-----+            +----+-----+
          |                       |
          | submit (Secretary)    | publish (Secretary)
          |                       v
          |                 +----------+
          +---------------> | PUBLISHED|  <-- Immutable, visible to members
                            +----+-----+
                                  |
                                  | archive (Admin)
                                  v
                            +----------+
                            | ARCHIVED |  <-- Historical record
                            +----------+
```

## Role Capabilities

### Secretary Capabilities

| Capability | Description |
|------------|-------------|
| `meetings:read` | View meetings and minutes |
| `meetings:minutes:draft:create` | Create new draft minutes |
| `meetings:minutes:draft:edit` | Edit DRAFT or REVISED minutes |
| `meetings:minutes:draft:submit` | Submit minutes for presidential review |
| `meetings:minutes:read_all` | View all minutes regardless of status |
| `files:upload` | Upload file attachments |

### President Capabilities

| Capability | Description |
|------------|-------------|
| `meetings:minutes:finalize` | Approve minutes or publish approved minutes |
| `meetings:minutes:revise` | Request revision (return to Secretary) |

### Admin Capabilities

| Capability | Description |
|------------|-------------|
| `admin:full` | Archive published minutes |

## Status Rules

### DRAFT
- **Who can edit**: Secretary
- **Next state**: SUBMITTED
- **Can delete**: Yes

### SUBMITTED
- **Who can edit**: No one (locked for review)
- **Next states**: REVISED (President rejects) or APPROVED (President approves)
- **Can delete**: No

### REVISED
- **Who can edit**: Secretary
- **Next state**: SUBMITTED
- **Can delete**: No

### APPROVED
- **Who can edit**: No one
- **Next state**: PUBLISHED
- **Can delete**: No

### PUBLISHED
- **Who can edit**: No one (immutable)
- **Next state**: ARCHIVED
- **Can delete**: No
- **Visibility**: Board members by default, configurable

### ARCHIVED
- **Who can edit**: No one (terminal state)
- **Next state**: None
- **Can delete**: No

## API Endpoints

### Dashboard
```
GET /api/v1/officer/secretary/dashboard
```
Returns minutes grouped by status for the Secretary dashboard widget.

### Minutes CRUD
```
GET    /api/v1/officer/governance/minutes          - List all minutes
POST   /api/v1/officer/governance/minutes          - Create new minutes
GET    /api/v1/officer/governance/minutes/:id      - Get single minutes
PATCH  /api/v1/officer/governance/minutes/:id      - Update content
DELETE /api/v1/officer/governance/minutes/:id      - Delete (DRAFT only)
```

### Workflow Actions
```
POST /api/v1/officer/governance/minutes/:id
Body: { "action": "submit" }      - Submit for review
Body: { "action": "approve" }     - President approves
Body: { "action": "revise", "notes": "..." }  - President requests revision
Body: { "action": "publish" }     - Secretary publishes
Body: { "action": "archive" }     - Admin archives
Body: { "action": "create_revision" }  - Create new version from published
```

## UI Components

### SecretaryDashboard Widget
Location: `src/app/admin/SecretaryDashboard.tsx`

Displays:
- Upcoming meeting with quick-create draft link
- Drafts in progress (DRAFT, REVISED)
- Awaiting President review (SUBMITTED)
- Ready to publish (APPROVED)
- Recently published (PUBLISHED)

### Inline Actions
- **Create Draft**: Links to minutes editor for upcoming meeting
- **Edit**: Available for DRAFT/REVISED status
- **Submit for Review**: Transitions DRAFT/REVISED → SUBMITTED
- **Publish**: Transitions APPROVED → PUBLISHED (Secretary with finalize capability)

## Distribution Rules

### Draft Minutes
- **Visible to**: Secretary, President
- **Purpose**: Review and editing

### Published Minutes
- **Visible to**: Board members (configurable)
- **Immutable**: Content cannot be changed after publication
- **Corrections**: Create new version using `create_revision` action

## Data Model

```prisma
model GovernanceMinutes {
  id             String        @id @default(uuid())
  meetingId      String
  status         MinutesStatus @default(DRAFT)
  version        Int           @default(1)
  content        Json
  summary        String?

  // Workflow tracking
  submittedAt    DateTime?
  submittedById  String?
  reviewedAt     DateTime?
  reviewedById   String?
  reviewNotes    String?
  approvedAt     DateTime?
  approvedById   String?
  publishedAt    DateTime?
  publishedById  String?

  // Audit fields
  createdById    String?
  lastEditedById String?
  createdAt      DateTime
  updatedAt      DateTime
}

enum MinutesStatus {
  DRAFT
  SUBMITTED
  REVISED
  APPROVED
  PUBLISHED
  ARCHIVED
}
```

## Audit Trail

All workflow actions produce audit log entries:
- Action type (CREATE, UPDATE)
- Actor ID
- Object type (GovernanceMinutes)
- Object ID
- Metadata (action name, new status)

## Test Coverage

- Unit tests: `tests/unit/governance/minutes-status.spec.ts`
- API tests: `tests/api/secretary-access.spec.ts`

## Related Documents

- [RBAC Governance Roles](../rbac/GOVERNANCE_ROLES_SECRETARY_AND_PARLIAMENTARIAN.md)
- [Auth and RBAC Overview](../rbac/AUTH_AND_RBAC.md)

---

*Document maintained by Murmurant development team. Last updated: December 2024*
