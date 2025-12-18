# Parliamentarian Role and Tools

## Overview

The Parliamentarian role in ClubOS provides governance oversight capabilities including annotation tools for bylaws interpretations, policy clarifications, and review flag management. The role is intentionally **read-only for core records** - the Parliamentarian can annotate and flag documents but cannot mutate official minutes or motions.

## RBAC Capabilities

The Parliamentarian role (`parliamentarian`) has the following capabilities defined in `src/lib/auth.ts`:

### Governance Oversight

- `meetings:read` - View meetings list and details
- `meetings:motions:read` - View motions within meetings
- `meetings:motions:annotate` - Add annotations to motions
- `governance:rules:manage` - Manage rules guidance documents
- `governance:docs:read` - Read internal governance documents
- `governance:docs:write` - Write internal governance documents

### Annotations (Full Control)

- `governance:annotations:read` - View all annotations
- `governance:annotations:write` - Create/edit annotations
- `governance:annotations:publish` - Publish/unpublish annotations

### Review Flags (Full Control)

- `governance:flags:read` - View all flags
- `governance:flags:write` - Create/edit flags
- `governance:flags:create` - Create flags (legacy)
- `governance:flags:resolve` - Resolve/dismiss flags

### Interpretations Log

- `governance:interpretations:create` - Create interpretation entries
- `governance:interpretations:edit` - Edit interpretation entries
- `governance:interpretations:publish` - Publish interpretation entries

### Policy Annotations

- `governance:policies:annotate` - Add annotations to policies/bylaws
- `governance:policies:propose_change` - Propose changes to policies

### File Management

- `files:upload` - Upload governance documents

## Annotation System

### Schema

Annotations are stored in `GovernanceAnnotation` (Prisma schema):

```prisma
model GovernanceAnnotation {
  id          String   @id @default(uuid())
  targetType  String   // "motion", "bylaw", "policy", "page", "file", "minutes"
  targetId    String   // UUID of target resource
  motionId    String?  // Direct relation to motion (optional)
  anchor      String?  // Location within target (section, paragraph)
  body        String   // Annotation content (markdown)
  isPublished Boolean  @default(false)
  createdById String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Key Properties

- **Timestamped** - All annotations have `createdAt` and `updatedAt`
- **Attributed** - `createdById` tracks who created the annotation
- **Non-editing overlays** - Annotations never modify the target document
- **Publish control** - `isPublished` controls visibility to non-governance users

### Target Types

- `motion` - Procedural notes on meeting motions
- `bylaw` - Interpretations of bylaw sections
- `policy` - Clarifications on policy documents
- `page` - Notes on published pages
- `file` - Notes on uploaded files
- `minutes` - Notes on meeting minutes

## Review Flags

### Schema

Review flags are stored in `GovernanceReviewFlag` (Prisma schema):

```prisma
model GovernanceReviewFlag {
  id           String           @id @default(uuid())
  targetType   String           // "page", "file", "policy", "event", "bylaw", "minutes", "motion"
  targetId     String
  flagType     ReviewFlagType
  status       ReviewFlagStatus @default(OPEN)
  title        String
  notes        String?
  dueDate      DateTime?
  resolvedAt   DateTime?
  resolvedById String?
  resolution   String?
  createdById  String?
  createdAt    DateTime
  updatedAt    DateTime
}
```

### Flag Types

- `INSURANCE_REVIEW` - Needs insurance team review
- `LEGAL_REVIEW` - Needs legal/liability review
- `POLICY_REVIEW` - Policy interpretation needed
- `COMPLIANCE_CHECK` - Bylaws/rules compliance check
- `GENERAL` - Other review needed

### Status Machine

```
OPEN → IN_PROGRESS → RESOLVED
                  ↘ DISMISSED
```

- **OPEN** - Flag created, awaiting action
- **IN_PROGRESS** - Parliamentarian is working on it
- **RESOLVED** - Review completed with resolution
- **DISMISSED** - Flag dismissed (not applicable)

### Visibility

Review flags are visible to:

- Board members
- Officers with governance capabilities
- Non-blocking (flags don't prevent other actions)
- Fully auditable (all changes logged)

## UI Components

### Parliamentarian Dashboard

Located at `src/app/admin/ParliamentarianDashboard.tsx`, displays:

- **Overdue Flags Alert** - Red banner for flags past due date
- **Open Policy Questions** - POLICY_REVIEW flags in OPEN/IN_PROGRESS
- **Docs Needing Review** - INSURANCE_REVIEW and LEGAL_REVIEW flags
- **Recent Interpretations** - Latest annotations
- **Quick Links** - Navigation to full flag/annotation pages

### Admin Pages

| Route | Purpose |
|-------|---------|
| `/admin/governance/flags` | List all flags with filtering |
| `/admin/governance/flags/new` | Create new flag |
| `/admin/governance/flags/[id]` | View/manage single flag |
| `/admin/governance/annotations` | List all annotations |
| `/admin/governance/annotations/new` | Create new annotation |
| `/admin/governance/annotations/[id]` | View/edit annotation |

## API Endpoints

### Parliamentarian Dashboard

```
GET /api/v1/officer/parliamentarian/dashboard
```

Returns dashboard data including open flags, annotations, and capabilities.

### Flags

```
GET  /api/v1/officer/governance/flags         # List flags
POST /api/v1/officer/governance/flags         # Create flag
GET  /api/v1/officer/governance/flags/:id     # Get flag
PATCH /api/v1/officer/governance/flags/:id    # Update flag
DELETE /api/v1/officer/governance/flags/:id   # Delete flag
POST /api/v1/officer/governance/flags/:id     # Action (start, resolve, dismiss, reopen)
```

### Annotations

```
GET  /api/v1/officer/governance/annotations       # List annotations
POST /api/v1/officer/governance/annotations       # Create annotation
GET  /api/v1/officer/governance/annotations/:id   # Get annotation
PATCH /api/v1/officer/governance/annotations/:id  # Update annotation
DELETE /api/v1/officer/governance/annotations/:id # Delete annotation
POST /api/v1/officer/governance/annotations/:id   # Action (publish, unpublish)
```

## Audit Logging

All flag and annotation mutations are audit logged via `auditMutation()`:

```typescript
await auditMutation(req, auth.context, {
  action: "CREATE",
  capability: "governance:flags:create",
  objectType: "GovernanceReviewFlag",
  objectId: flag.id,
  metadata: { flagType, title, targetType, targetId },
});
```

Audit log entries include:

- Actor identity (memberId, email)
- Timestamp
- Action type
- Resource type and ID
- Before/after state (for updates)
- IP address and user agent

## Charter Compliance

- **P1 (Identity Provable)** - All annotations and flags track createdBy/resolvedBy
- **P2 (Default Deny)** - All endpoints require capability checks
- **P3 (Explicit State)** - Review flags use explicit status machine
- **P5 (No Hidden Rules)** - isPublished controls annotation visibility
- **P7 (Audit Trail)** - All mutations logged with full context
- **P9 (Fail Closed)** - Missing capabilities return 403

## Testing

Test the Parliamentarian role with:

```bash
# Use test token for Parliamentarian
curl -H "Authorization: Bearer test-parliamentarian-token" \
  http://localhost:3000/api/v1/officer/parliamentarian/dashboard
```

Or set session cookie with `test-parliamentarian` token.

## Security Notes

- Parliamentarian **cannot** directly edit minutes or motions
- Parliamentarian **cannot** delete published minutes
- Annotations are non-destructive overlays
- All actions are attributed and auditable
- Review flags are non-blocking (advisory only)
