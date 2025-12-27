# Event Archive & Chair Notebook

## Overview

The Event Archive & Chair Notebook captures institutional knowledge so future Event Chairs can succeed faster. After an event is completed or canceled, the Event Chair can document what worked, what didn't, and what to change next time.

This system applies **only to completed or canceled events**. Active or draft events cannot have postmortem notes.

## Purpose

- **Preserve institutional knowledge** across chair transitions
- **Document vendor contacts, setup logistics, and timeline** for recurring events
- **Capture success ratings** for trend analysis
- **Enable retrospectives** that improve future events

## Data Model

### EventPostmortem

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `eventId` | UUID | Link to parent event (unique, 1:1) |
| `createdById` | UUID | Member who created the postmortem |
| `createdAt` | DateTime | When created |
| `updatedAt` | DateTime | Last modification |

#### Setup & Logistics

| Field | Type | Description |
|-------|------|-------------|
| `setupNotes` | Text | Room setup, AV requirements, signage |
| `contactsUsed` | Text | Vendor names, phone numbers, emails |
| `timelineNotes` | Text | Day-of schedule, key milestones |

#### Success Ratings (1-5 scale)

| Field | Type | Description |
|-------|------|-------------|
| `attendanceRating` | Int (1-5) | How well did attendance meet expectations? |
| `logisticsRating` | Int (1-5) | How smoothly did setup/teardown go? |
| `satisfactionRating` | Int (1-5) | How satisfied were attendees? |

#### Retrospective Notes

| Field | Type | Description |
|-------|------|-------------|
| `whatWorked` | Text | Things that went well |
| `whatDidNot` | Text | Things that didn't work |
| `whatToChangeNextTime` | Text | Specific improvements for next time |

#### Access Control

| Field | Type | Description |
|-------|------|-------------|
| `internalOnly` | Boolean | If true, only visible to Event Chairs and VPs (default: true) |
| `status` | Enum | DRAFT, SUBMITTED, APPROVED, UNLOCKED |
| `approvedAt` | DateTime | When VP approved |
| `approvedBy` | UUID | VP who approved |

## Status Workflow

```
DRAFT → SUBMITTED → APPROVED
                  ↓
              UNLOCKED (by VP only)
```

| Status | Description | Who Can Edit |
|--------|-------------|--------------|
| `DRAFT` | Being written | Event Chair (creator) |
| `SUBMITTED` | Ready for review | No one |
| `APPROVED` | Locked and finalized | No one |
| `UNLOCKED` | Reopened for edits | Event Chair (creator) |

**Transitions:**

- `DRAFT → SUBMITTED`: Event Chair submits for review
- `SUBMITTED → APPROVED`: VP Activities approves
- `SUBMITTED → DRAFT`: VP Activities returns for revision
- `APPROVED → UNLOCKED`: VP Activities reopens for edits

## Access Control

### Read Access

| Role | Access |
|------|--------|
| Event Chair | Own postmortems only |
| Committee Chair | All postmortems for their committee's events |
| VP Activities | All postmortems |
| Admin | All postmortems |
| Regular Member | No access |

### Write Access

| Role | Can Create | Can Edit |
|------|------------|----------|
| Event Chair | Yes (own events only) | Yes (DRAFT or UNLOCKED status only) |
| VP Activities | No | Can unlock, return, approve |
| Admin | No | System override only |

## UI Specification

### Archive Tab (Event Detail Page)

The Archive tab appears on the event detail page for completed/canceled events. It is only visible to users with read access.

#### States

1. **No Postmortem Exists**
   - Message: "No chair notebook for this event"
   - Button: "Start Chair Notebook" (Event Chair only)

2. **Draft Mode**
   - Full edit form with all fields
   - Save button (auto-saves on blur)
   - Submit button: "Submit for Review"

3. **Submitted Mode**
   - Read-only view of all content
   - Status badge: "Pending Approval"
   - VP sees: Approve / Return for Revision buttons

4. **Approved Mode**
   - Read-only view of all content
   - Status badge: "Approved"
   - Shows approval date and approver name
   - VP sees: "Unlock for Editing" button

5. **Unlocked Mode**
   - Same as Draft Mode
   - Banner: "This notebook has been unlocked for editing by [VP Name]"

### Rating Input

Each rating field uses a 1-5 star selector:

- 1 = Poor
- 2 = Below Average
- 3 = Average
- 4 = Good
- 5 = Excellent

### Text Fields

All text fields support multiline input. Markdown is not rendered - plain text only.

## API Endpoints

### Create Postmortem

```
POST /api/events/{eventId}/postmortem
Body: { setupNotes?, contactsUsed?, timelineNotes?, ... }
Requires: Event Chair of the event
Response: EventPostmortem object
```

### Get Postmortem

```
GET /api/events/{eventId}/postmortem
Requires: Read access (see Access Control)
Response: EventPostmortem object or 404
```

### Update Postmortem

```
PATCH /api/events/{eventId}/postmortem
Body: { field: value, ... }
Requires: Event Chair + (DRAFT or UNLOCKED status)
Response: Updated EventPostmortem object
```

### Submit for Review

```
POST /api/events/{eventId}/postmortem/submit
Requires: Event Chair + DRAFT status
Response: EventPostmortem with SUBMITTED status
```

### Approve Postmortem

```
POST /api/events/{eventId}/postmortem/approve
Requires: VP Activities capability
Response: EventPostmortem with APPROVED status
```

### Return for Revision

```
POST /api/events/{eventId}/postmortem/return
Requires: VP Activities capability
Response: EventPostmortem with DRAFT status
```

### Unlock Postmortem

```
POST /api/events/{eventId}/postmortem/unlock
Requires: VP Activities capability
Response: EventPostmortem with UNLOCKED status
```

## Charter Compliance

| Principle | How This Feature Complies |
|-----------|---------------------------|
| P1 (Identity provable) | `createdById` and `approvedBy` track authors |
| P2 (Default deny) | Read/write access gated by role checks |
| P7 (Audit logging) | Status transitions create audit entries |
| N1 (Enforce on server) | Access control in API, not just UI |
| N5 (No hidden rules) | Status workflow visible in UI badges |

## Migration Notes

This is an additive change. The `EventPostmortem` model is new and has no impact on existing data.

### Schema Addition

```prisma
model EventPostmortem {
  id        String   @id @default(uuid()) @db.Uuid
  eventId   String   @unique @db.Uuid
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Setup & Logistics
  setupNotes    String?
  contactsUsed  String?
  timelineNotes String?

  // Success Ratings (1-5)
  attendanceRating   Int?
  logisticsRating    Int?
  satisfactionRating Int?

  // Retrospective
  whatWorked           String?
  whatDidNot           String?
  whatToChangeNextTime String?

  // Access Control
  internalOnly Boolean          @default(true)
  status       PostmortemStatus @default(DRAFT)
  approvedAt   DateTime?
  approvedBy   String?          @db.Uuid
  createdById  String?          @db.Uuid

  // Relations
  event     Event   @relation(fields: [eventId], references: [id], onDelete: Cascade)
  approver  Member? @relation("PostmortemApprover", fields: [approvedBy], references: [id])
  createdBy Member? @relation("PostmortemCreator", fields: [createdById], references: [id])
}

enum PostmortemStatus {
  DRAFT
  SUBMITTED
  APPROVED
  UNLOCKED
}
```

## Related Documents

- [Architectural Charter](../ARCHITECTURAL_CHARTER.md) - Core principles
- [Event Lifecycle](./EVENT_LIFECYCLE_DESIGN.md) - Event status workflow
- [RBAC Documentation](../rbac/AUTH_AND_RBAC.md) - Role-based access control

---

*Last updated: December 2024*
