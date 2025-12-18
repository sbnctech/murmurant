# Minutes Workflow

This document describes the state machine for governance meeting minutes in ClubOS.

## Charter Principles

- **P1**: Identity provable - all actions tracked by actor
- **P3**: Explicit state machine for minutes workflow
- **P5**: Published minutes immutable (versioning required for corrections)
- **P7**: Full audit trail via AuditLog

## Status States

Minutes progress through these states:

| Status | Description |
|--------|-------------|
| `DRAFT` | Initial state. Secretary is editing the document. |
| `SUBMITTED` | Secretary has submitted for presidential review. |
| `REVISED` | President requested revisions. Secretary is editing again. |
| `APPROVED` | President approved. Ready for publication. |
| `PUBLISHED` | Published to members. Immutable. |
| `ARCHIVED` | Moved to archive. Historical record. |

## State Transitions

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│   ┌─────────┐   submit   ┌───────────┐                        │
│   │  DRAFT  │──────────▶│ SUBMITTED │                        │
│   └─────────┘            └───────────┘                        │
│        ▲                       │                              │
│        │                       │                              │
│        │         approve       ▼                              │
│        │               ┌───────────┐   publish   ┌─────────┐  │
│        │               │ APPROVED  │───────────▶│PUBLISHED│  │
│        │               └───────────┘             └─────────┘  │
│        │                       ▲                      │       │
│        │       revise          │                      │       │
│        │               ┌───────────┐                  │       │
│        └───────────────│  REVISED  │                  │       │
│         (re-submit)    └───────────┘                  │       │
│                              │                        │       │
│                              │ submit                 │       │
│                              ▼                        │       │
│                        (SUBMITTED)                    │       │
│                                                       │       │
│                               archive                 ▼       │
│                                            ┌──────────────┐   │
│                                            │   ARCHIVED   │   │
│                                            └──────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

## Transition Rules

| From State | To State | Action | Who Can Perform | Capability Required |
|------------|----------|--------|-----------------|---------------------|
| DRAFT | SUBMITTED | Submit for review | Secretary | `meetings:minutes:draft:submit` |
| SUBMITTED | APPROVED | Approve | President | `meetings:minutes:finalize` |
| SUBMITTED | REVISED | Request revision | President | `meetings:minutes:revise` |
| REVISED | SUBMITTED | Re-submit | Secretary | `meetings:minutes:draft:submit` |
| APPROVED | PUBLISHED | Publish | Secretary | `meetings:minutes:finalize` |
| PUBLISHED | ARCHIVED | Archive | Admin | `admin:full` |

## Secretary Editable States

The Secretary can only edit minutes content in these states:

- `DRAFT`
- `REVISED`

Once minutes are `SUBMITTED`, `APPROVED`, `PUBLISHED`, or `ARCHIVED`, the content is locked.

## Versioning for Corrections

Published minutes are **immutable** per Charter P5. If corrections are needed:

1. Use the `create_revision` action on published minutes
2. This creates a new DRAFT copy with incremented version number
3. The original published version remains unchanged
4. Edit, submit, approve, and publish the new version

This preserves the audit trail while allowing necessary corrections.

## API Endpoints

### List Minutes

```
GET /api/v1/officer/governance/minutes
```

Query parameters:

- `meetingId` - Filter by meeting
- `status` - Filter by status (DRAFT, SUBMITTED, etc.)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

### Create Minutes

```
POST /api/v1/officer/governance/minutes
```

Request body:

```json
{
  "meetingId": "uuid",
  "content": { "sections": [...] },
  "summary": "Optional summary text"
}
```

### Get Minutes

```
GET /api/v1/officer/governance/minutes/:id
```

### Update Minutes

```
PATCH /api/v1/officer/governance/minutes/:id
```

Request body:

```json
{
  "content": { "sections": [...] },
  "summary": "Updated summary"
}
```

Only allowed in DRAFT or REVISED status.

### Delete Minutes

```
DELETE /api/v1/officer/governance/minutes/:id
```

Only allowed in DRAFT status.

### Workflow Actions

```
POST /api/v1/officer/governance/minutes/:id
```

Request body:

```json
{
  "action": "submit" | "approve" | "revise" | "publish" | "archive" | "create_revision",
  "notes": "Optional notes (required for 'revise')"
}
```

## Roles and Capabilities

| Role | Capabilities |
|------|--------------|
| Secretary | Create drafts, edit drafts, submit for review, publish approved |
| President | Approve minutes, request revision |
| Parliamentarian | Read minutes, add annotations |
| Admin | All of the above, plus archive |

## Example Workflow

1. **Secretary creates minutes** after a board meeting:
   - POST to `/api/v1/officer/governance/minutes` with meeting content
   - Status: `DRAFT`

2. **Secretary edits and refines**:
   - PATCH to `/api/v1/officer/governance/minutes/:id`
   - Status remains: `DRAFT`

3. **Secretary submits for review**:
   - POST to `/api/v1/officer/governance/minutes/:id` with `action: "submit"`
   - Status: `SUBMITTED`

4. **President reviews and approves** (or requests revision):
   - POST with `action: "approve"` → Status: `APPROVED`
   - OR POST with `action: "revise", notes: "Please clarify..."` → Status: `REVISED`

5. **If revised**, Secretary makes changes and re-submits:
   - PATCH to edit
   - POST with `action: "submit"` → Status: `SUBMITTED`

6. **Secretary publishes** approved minutes:
   - POST with `action: "publish"`
   - Status: `PUBLISHED` (now immutable)

7. **If corrections needed later**:
   - POST with `action: "create_revision"` → New minutes with `DRAFT` status, version+1
   - Go through workflow again

## Audit Trail

All transitions are logged to `AuditLog` with:

- `action`: UPDATE
- `objectType`: GovernanceMinutes
- `objectId`: Minutes UUID
- `metadata.action`: The workflow action (submit, approve, etc.)
- `metadata.newStatus`: The resulting status
