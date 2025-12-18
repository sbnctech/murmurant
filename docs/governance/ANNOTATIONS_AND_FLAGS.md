# Annotations and Review Flags

This document describes the governance annotation and review flag systems in ClubOS.

## Charter Principles

- **P1**: Identity provable - all actions tracked by actor
- **P2**: Default deny, least privilege (capability-based permissions)
- **P7**: Full audit trail

---

## Part 1: Annotations

Annotations are comments or notes attached to governance documents. They're typically used by the Parliamentarian to add procedural notes, interpretations, or clarifications.

### Target Types

Annotations can be attached to:

| Target Type | Description |
|-------------|-------------|
| `motion` | Board meeting motions |
| `minutes` | Meeting minutes |
| `bylaw` | Bylaws sections |
| `policy` | Policy documents |
| `page` | CMS pages |
| `file` | Uploaded files |

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `targetType` | string | Type of target (motion, minutes, etc.) |
| `targetId` | UUID | ID of the target resource |
| `motionId` | UUID | Direct link if annotation is on a motion |
| `anchor` | string | Optional anchor/location within target |
| `body` | text | Annotation content (markdown supported) |
| `isPublished` | boolean | Whether visible to non-governance users |
| `createdById` | UUID | Who created the annotation |
| `createdAt` | datetime | When created |

### API Endpoints

#### List Annotations

```
GET /api/v1/officer/governance/annotations
```

Query parameters:

- `targetType` - Filter by target type
- `targetId` - Filter by target ID
- `motionId` - Filter by motion
- `isPublished` - Filter by publish status
- `countsOnly=true` - Return only counts
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 100)

#### Create Annotation

```
POST /api/v1/officer/governance/annotations
```

Request body:

```json
{
  "targetType": "motion",
  "targetId": "uuid",
  "motionId": "uuid",
  "anchor": "section-2",
  "body": "Procedural note: This motion follows Robert's Rules...",
  "isPublished": false
}
```

#### Get Annotation

```
GET /api/v1/officer/governance/annotations/:id
```

#### Update Annotation

```
PATCH /api/v1/officer/governance/annotations/:id
```

Request body:

```json
{
  "body": "Updated annotation text",
  "anchor": "section-3",
  "isPublished": true
}
```

#### Delete Annotation

```
DELETE /api/v1/officer/governance/annotations/:id
```

#### Publish/Unpublish Actions

```
POST /api/v1/officer/governance/annotations/:id
```

Request body:

```json
{
  "action": "publish" | "unpublish"
}
```

### Capabilities

| Capability | Description |
|------------|-------------|
| `governance:annotations:read` | View annotations |
| `governance:annotations:write` | Create/edit annotations |
| `governance:annotations:publish` | Publish/unpublish annotations |

### Roles

| Role | Can Do |
|------|--------|
| Secretary | Read, Write |
| Parliamentarian | Read, Write, Publish |
| President | Read |

---

## Part 2: Review Flags

Review flags are used to flag governance documents for review. They create a workflow for compliance tracking.

### Flag Types

| Flag Type | Description |
|-----------|-------------|
| `INSURANCE_REVIEW` | Needs insurance team review |
| `LEGAL_REVIEW` | Needs legal review |
| `POLICY_REVIEW` | Needs policy compliance review |
| `COMPLIANCE_CHECK` | General compliance check |
| `GENERAL` | Other review needed |

### Flag Statuses

| Status | Description |
|--------|-------------|
| `OPEN` | New flag, not yet being worked on |
| `IN_PROGRESS` | Someone is working on the review |
| `RESOLVED` | Review completed successfully |
| `DISMISSED` | Flag dismissed (not applicable) |

### Target Types

Flags can be attached to:

| Target Type | Description |
|-------------|-------------|
| `page` | CMS pages |
| `file` | Uploaded files |
| `policy` | Policy documents |
| `event` | Events |
| `bylaw` | Bylaws sections |
| `minutes` | Meeting minutes |
| `motion` | Board motions |

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `targetType` | string | Type of target |
| `targetId` | UUID | ID of the target resource |
| `flagType` | enum | Type of review needed |
| `status` | enum | Current status |
| `title` | string | Brief description of concern |
| `notes` | text | Detailed notes |
| `dueDate` | datetime | Optional deadline |
| `resolution` | text | How it was resolved |
| `resolvedAt` | datetime | When resolved |
| `resolvedById` | UUID | Who resolved it |
| `createdById` | UUID | Who created the flag |
| `createdAt` | datetime | When created |

### API Endpoints

#### List Flags

```
GET /api/v1/officer/governance/flags
```

Query parameters:

- `targetType` - Filter by target type
- `targetId` - Filter by target ID
- `status` - Filter by status
- `flagType` - Filter by flag type
- `overdue=true` - Return only overdue flags
- `countsOnly=true` - Return counts grouped by type
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 100)

#### Create Flag

```
POST /api/v1/officer/governance/flags
```

Request body:

```json
{
  "targetType": "event",
  "targetId": "uuid",
  "flagType": "INSURANCE_REVIEW",
  "title": "High-risk activity needs insurance verification",
  "notes": "This hiking event includes rappelling which may require additional coverage.",
  "dueDate": "2024-12-31T00:00:00Z"
}
```

#### Get Flag

```
GET /api/v1/officer/governance/flags/:id
```

#### Update Flag

```
PATCH /api/v1/officer/governance/flags/:id
```

Request body:

```json
{
  "title": "Updated title",
  "notes": "Updated notes",
  "dueDate": "2024-12-15T00:00:00Z",
  "status": "IN_PROGRESS"
}
```

#### Delete Flag

```
DELETE /api/v1/officer/governance/flags/:id
```

Only allowed for OPEN or DISMISSED flags. IN_PROGRESS and RESOLVED flags cannot be deleted to preserve the audit trail.

#### Flag Actions

```
POST /api/v1/officer/governance/flags/:id
```

Request body:

```json
{
  "action": "start" | "resolve" | "dismiss" | "reopen",
  "resolution": "Resolution text (required for resolve/dismiss)"
}
```

**Actions:**

| Action | From Status | To Status | Description |
|--------|-------------|-----------|-------------|
| `start` | OPEN | IN_PROGRESS | Begin working on the review |
| `resolve` | OPEN, IN_PROGRESS | RESOLVED | Complete the review |
| `dismiss` | OPEN, IN_PROGRESS | DISMISSED | Mark as not applicable |
| `reopen` | RESOLVED, DISMISSED | OPEN | Reopen for further review |

### Capabilities

| Capability | Description |
|------------|-------------|
| `governance:flags:read` | View flags |
| `governance:flags:write` | Create/edit flags |
| `governance:flags:create` | Create flags |
| `governance:flags:resolve` | Resolve/dismiss/reopen flags |

### Roles

| Role | Can Do |
|------|--------|
| Secretary | Read, Create, Write |
| Parliamentarian | Read, Create, Write, Resolve |
| President | Read, Resolve |

---

## Dashboard Views

### Open Flags by Type

```
GET /api/v1/officer/governance/flags?countsOnly=true
```

Returns:

```json
{
  "counts": {
    "INSURANCE_REVIEW": 3,
    "LEGAL_REVIEW": 1,
    "POLICY_REVIEW": 0,
    "COMPLIANCE_CHECK": 2,
    "GENERAL": 1
  }
}
```

### Overdue Flags

```
GET /api/v1/officer/governance/flags?overdue=true
```

Returns flags where `dueDate < now()` and status is `OPEN` or `IN_PROGRESS`.

### Annotation Counts for a Target

```
GET /api/v1/officer/governance/annotations?targetType=motion&targetId=uuid&countsOnly=true
```

Returns:

```json
{
  "counts": {
    "total": 5,
    "published": 3,
    "unpublished": 2
  }
}
```

---

## Audit Trail

All annotation and flag operations are logged to `AuditLog`:

**Annotations:**

- `action`: CREATE, UPDATE, DELETE
- `objectType`: GovernanceAnnotation
- `objectId`: Annotation UUID
- `metadata`: includes action (publish, unpublish) when applicable

**Flags:**

- `action`: CREATE, UPDATE, DELETE
- `objectType`: GovernanceReviewFlag
- `objectId`: Flag UUID
- `metadata`: includes action (start, resolve, dismiss, reopen) and newStatus
