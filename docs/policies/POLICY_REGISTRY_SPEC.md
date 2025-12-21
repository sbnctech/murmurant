# Policy Registry Specification

Copyright (c) Santa Barbara Newcomers Club

## Overview

The Policy Registry is a read-only system for inspecting organizational policies. It does **not** change ClubOS behavior—it makes policy visible and queryable so officers can understand what rules exist, where they come from, and whether they conflict.

### Goals

1. **Single source of truth** for all club policies (bylaws, standing rules, board resolutions, procedures)
2. **Inspectable** by authorized officers (board members first, then committee chairs)
3. **Traceable** to source documents with citations
4. **Conflict-aware** through automated contradiction detection

### Non-Goals (Phase 1)

- Automated enforcement of ingested policies
- Policy editing or creation workflow
- Member-facing policy display
- Integration with code-level `requirePolicy()` system (future work)

---

## Data Model

### PolicyDocument

The primary entity representing a policy source document.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `title` | String | Document title (e.g., "SBNC Bylaws 2024") |
| `category` | Enum | See categories below |
| `documentType` | Enum | BYLAWS, STANDING_RULES, BOARD_RESOLUTION, PROCEDURE, GUIDELINE, EXTERNAL |
| `audience` | Enum | BOARD_ONLY, OFFICERS, COMMITTEE_CHAIRS, ALL_MEMBERS, PUBLIC |
| `authority` | String | Who approved this (e.g., "Board of Directors", "Membership Vote") |
| `effectiveDate` | Date | When this policy became effective |
| `expirationDate` | Date? | When this policy expires (null = no expiration) |
| `supersedes` | UUID? | Reference to policy document this replaces |
| `sourceUrl` | String? | Link to original document (Google Drive, website, etc.) |
| `status` | Enum | DRAFT, ACTIVE, SUPERSEDED, EXPIRED, ARCHIVED |
| `owner` | UUID | Member ID of the policy owner (usually an officer) |
| `lastReviewedAt` | DateTime? | When this was last reviewed for accuracy |
| `lastReviewedBy` | UUID? | Who reviewed it |
| `notes` | String? | Internal notes about this document |
| `createdAt` | DateTime | Import timestamp |
| `updatedAt` | DateTime | Last modification |

### PolicyAttachment

PDF or other file attachments for a policy document.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `policyDocumentId` | UUID | FK to PolicyDocument |
| `filename` | String | Original filename |
| `mimeType` | String | File type (application/pdf, etc.) |
| `sizeBytes` | Int | File size |
| `storageKey` | String | S3/storage path |
| `uploadedAt` | DateTime | Upload timestamp |
| `uploadedBy` | UUID | Member who uploaded |

### PolicyExtract

Extracted rules/provisions from a policy document.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `policyDocumentId` | UUID | FK to PolicyDocument |
| `sectionRef` | String | Section reference (e.g., "Article IV, Section 2") |
| `title` | String? | Section title if any |
| `extractedText` | Text | The actual text of the provision |
| `summary` | String? | Plain-language summary |
| `topics` | String[] | Tags/topics (e.g., ["membership", "dues", "renewal"]) |
| `effectiveDate` | Date? | Override for section-specific effective date |
| `extractedAt` | DateTime | When this was extracted |
| `extractedBy` | UUID? | Member who extracted (null = automated) |
| `confidence` | Float? | AI extraction confidence score (0-1) |
| `verified` | Boolean | Human-verified as accurate |
| `verifiedAt` | DateTime? | When verified |
| `verifiedBy` | UUID? | Who verified |

### PolicyContradiction

Detected conflicts between policies or with ClubOS configuration.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `extractA_Id` | UUID | FK to PolicyExtract (first conflicting rule) |
| `extractB_Id` | UUID? | FK to PolicyExtract (second conflicting rule, if policy-to-policy) |
| `configKey` | String? | ClubOS config key if conflict is with system config |
| `configValue` | String? | Current ClubOS config value |
| `contradictionType` | Enum | POLICY_VS_POLICY, POLICY_VS_CONFIG, AMBIGUOUS, OUTDATED |
| `description` | Text | Explanation of the conflict |
| `severity` | Enum | LOW, MEDIUM, HIGH, CRITICAL |
| `status` | Enum | DETECTED, ACKNOWLEDGED, RESOLVED, WONT_FIX |
| `resolution` | Text? | How this was resolved |
| `resolvedAt` | DateTime? | When resolved |
| `resolvedBy` | UUID? | Who resolved |
| `detectedAt` | DateTime | When detected |
| `detectedBy` | UUID? | Member or null for automated |

---

## Categories

```
GOVERNANCE       - Bylaws, articles of incorporation, standing rules
MEMBERSHIP       - Eligibility, dues, renewal, termination
EVENTS           - Event policies, registration, cancellation, refunds
FINANCE          - Budgets, spending authority, reimbursement
COMMUNICATIONS   - Newsletter, website, email, social media
COMMITTEES       - Committee structure, chairs, responsibilities
OFFICERS         - Officer duties, elections, terms
PRIVACY          - Data handling, member information
VOLUNTEERS       - Volunteer policies, recognition
EXTERNAL         - External requirements (venue rules, insurance, etc.)
```

---

## Audience Levels

| Level | Who Can View | Examples |
|-------|--------------|----------|
| `BOARD_ONLY` | President, VPs, Secretary, Treasurer | Executive session minutes, personnel matters |
| `OFFICERS` | All elected/appointed officers | Internal procedures, delegation authorities |
| `COMMITTEE_CHAIRS` | Officers + committee chairs | Committee-specific procedures |
| `ALL_MEMBERS` | Any authenticated member | Bylaws, standing rules, general policies |
| `PUBLIC` | Anyone | Public-facing policies |

---

## Prisma Schema

```prisma
// Policy Registry Models

enum PolicyCategory {
  GOVERNANCE
  MEMBERSHIP
  EVENTS
  FINANCE
  COMMUNICATIONS
  COMMITTEES
  OFFICERS
  PRIVACY
  VOLUNTEERS
  EXTERNAL
}

enum PolicyDocumentType {
  BYLAWS
  STANDING_RULES
  BOARD_RESOLUTION
  PROCEDURE
  GUIDELINE
  EXTERNAL
}

enum PolicyAudience {
  BOARD_ONLY
  OFFICERS
  COMMITTEE_CHAIRS
  ALL_MEMBERS
  PUBLIC
}

enum PolicyDocumentStatus {
  DRAFT
  ACTIVE
  SUPERSEDED
  EXPIRED
  ARCHIVED
}

enum ContradictionType {
  POLICY_VS_POLICY
  POLICY_VS_CONFIG
  AMBIGUOUS
  OUTDATED
}

enum ContradictionSeverity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum ContradictionStatus {
  DETECTED
  ACKNOWLEDGED
  RESOLVED
  WONT_FIX
}

model PolicyDocument {
  id              String   @id @default(uuid()) @db.Uuid
  title           String
  category        PolicyCategory
  documentType    PolicyDocumentType
  audience        PolicyAudience
  authority       String
  effectiveDate   DateTime @db.Date
  expirationDate  DateTime? @db.Date
  supersedesId    String?  @db.Uuid
  supersedes      PolicyDocument? @relation("Supersedes", fields: [supersedesId], references: [id])
  supersededBy    PolicyDocument[] @relation("Supersedes")
  sourceUrl       String?
  status          PolicyDocumentStatus @default(ACTIVE)
  ownerId         String   @db.Uuid
  owner           Member   @relation(fields: [ownerId], references: [id])
  lastReviewedAt  DateTime?
  lastReviewedById String? @db.Uuid
  lastReviewedBy  Member?  @relation("PolicyReviewer", fields: [lastReviewedById], references: [id])
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  attachments     PolicyAttachment[]
  extracts        PolicyExtract[]

  @@index([category])
  @@index([status])
  @@index([audience])
}

model PolicyAttachment {
  id                String   @id @default(uuid()) @db.Uuid
  policyDocumentId  String   @db.Uuid
  policyDocument    PolicyDocument @relation(fields: [policyDocumentId], references: [id], onDelete: Cascade)
  filename          String
  mimeType          String
  sizeBytes         Int
  storageKey        String
  uploadedAt        DateTime @default(now())
  uploadedById      String   @db.Uuid
  uploadedBy        Member   @relation(fields: [uploadedById], references: [id])

  @@index([policyDocumentId])
}

model PolicyExtract {
  id                String   @id @default(uuid()) @db.Uuid
  policyDocumentId  String   @db.Uuid
  policyDocument    PolicyDocument @relation(fields: [policyDocumentId], references: [id], onDelete: Cascade)
  sectionRef        String
  title             String?
  extractedText     String
  summary           String?
  topics            String[]
  effectiveDate     DateTime? @db.Date
  extractedAt       DateTime @default(now())
  extractedById     String?  @db.Uuid
  extractedBy       Member?  @relation("ExtractedBy", fields: [extractedById], references: [id])
  confidence        Float?
  verified          Boolean  @default(false)
  verifiedAt        DateTime?
  verifiedById      String?  @db.Uuid
  verifiedBy        Member?  @relation("VerifiedBy", fields: [verifiedById], references: [id])

  contradictionsA   PolicyContradiction[] @relation("ContradictionA")
  contradictionsB   PolicyContradiction[] @relation("ContradictionB")

  @@index([policyDocumentId])
  @@index([topics])
}

model PolicyContradiction {
  id                String   @id @default(uuid()) @db.Uuid
  extractAId        String   @db.Uuid
  extractA          PolicyExtract @relation("ContradictionA", fields: [extractAId], references: [id])
  extractBId        String?  @db.Uuid
  extractB          PolicyExtract? @relation("ContradictionB", fields: [extractBId], references: [id])
  configKey         String?
  configValue       String?
  contradictionType ContradictionType
  description       String
  severity          ContradictionSeverity
  status            ContradictionStatus @default(DETECTED)
  resolution        String?
  resolvedAt        DateTime?
  resolvedById      String?  @db.Uuid
  resolvedBy        Member?  @relation(fields: [resolvedById], references: [id])
  detectedAt        DateTime @default(now())
  detectedById      String?  @db.Uuid
  detectedBy        Member?  @relation("DetectedBy", fields: [detectedById], references: [id])

  @@index([status])
  @@index([severity])
}
```

---

## Attachment Handling

### Supported Formats

| Format | MIME Type | Extraction Support |
|--------|-----------|-------------------|
| PDF | application/pdf | Full text extraction via pdf-parse |
| Word (.docx) | application/vnd.openxmlformats-officedocument.wordprocessingml.document | Text extraction via mammoth |
| Plain Text | text/plain | Direct ingestion |
| Markdown | text/markdown | Direct ingestion |

### Storage

- Attachments stored in S3-compatible storage (same as existing file storage)
- Storage key format: `policies/{documentId}/{attachmentId}/{filename}`
- Access controlled by policy audience level

### Text Extraction Pipeline

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│   Upload    │────▶│   Extract    │────▶│   Section     │
│   PDF/DOCX  │     │   Raw Text   │     │   Detection   │
└─────────────┘     └──────────────┘     └───────────────┘
                                                 │
                                                 ▼
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│   Human     │◀────│   Create     │◀────│   Parse       │
│   Review    │     │   Extracts   │     │   Sections    │
└─────────────┘     └──────────────┘     └───────────────┘
```

### Section Detection Patterns

For bylaws and standing rules, detect sections by:

1. **Article markers**: "ARTICLE I", "Article 1", etc.
2. **Section markers**: "Section 1.", "Sec. 1", "1.1", etc.
3. **Numbered lists**: "1.", "a.", "(i)", etc.
4. **Headers**: ALL CAPS lines, bold text (from Word docs)

---

## Extracted Text + Citations View

### Display Format

Each extract shows:

```
┌─────────────────────────────────────────────────────────────┐
│ SBNC Bylaws 2024                                            │
│ Article IV, Section 2                                       │
├─────────────────────────────────────────────────────────────┤
│ "Members shall pay annual dues as established by the        │
│ Board of Directors. Dues are payable upon joining and       │
│ annually thereafter on the anniversary of membership."      │
├─────────────────────────────────────────────────────────────┤
│ Topics: membership, dues, renewal                           │
│ Effective: January 1, 2024                                  │
│ Verified: ✓ by Jane Smith on 2024-03-15                     │
└─────────────────────────────────────────────────────────────┘
```

### Citation Format

When referencing policies elsewhere in ClubOS:

```
Per SBNC Bylaws 2024, Art. IV §2: "Members shall pay annual dues..."
```

---

## Contradictions Report Generator

### Contradiction Types

| Type | Description | Example |
|------|-------------|---------|
| `POLICY_VS_POLICY` | Two policies state conflicting rules | Bylaws say 30-day notice, Standing Rules say 14-day |
| `POLICY_VS_CONFIG` | Policy differs from ClubOS setting | Policy says $50 dues, ClubOS configured for $60 |
| `AMBIGUOUS` | Policy language is unclear or contradictory within itself | "Must" vs "should" for same requirement |
| `OUTDATED` | Policy references obsolete entities/processes | References committee that no longer exists |

### Detection Methods

1. **Keyword matching**: Find extracts with same topics, compare for conflicts
2. **Config comparison**: Match policy extracts to ClubOS configuration keys
3. **Date checking**: Flag policies past review date or referencing expired policies
4. **Entity validation**: Check referenced committees, roles, processes exist

### ClubOS Config Keys for Comparison

| Config Key | Policy Topics |
|------------|---------------|
| `membership.duesAmount` | dues, membership, fees |
| `membership.renewalPeriodDays` | renewal, membership, grace period |
| `events.cancellationDeadlineHours` | cancellation, refund, events |
| `events.registrationOpenDay` | registration, events, publishing |
| `finance.approvalThreshold` | approval, spending, budget |

### Report Format

```markdown
# Policy Contradictions Report
Generated: December 20, 2024

## Critical (1)

### Dues Amount Mismatch
- **Policy**: SBNC Bylaws 2024, Art. IV §2
  "Annual dues shall be $50 per household"
- **ClubOS Config**: membership.duesAmount = 60
- **Impact**: Members are being charged differently than policy states
- **Recommendation**: Update either policy or configuration

## High (2)

### Cancellation Policy Conflict
- **Policy A**: Standing Rules 2024, §12
  "Members may cancel event registration up to 48 hours before..."
- **Policy B**: Event Chair Guidelines, §3
  "Cancellations accepted up to 24 hours before the event"
- **Impact**: Inconsistent cancellation enforcement
- **Recommendation**: Clarify which policy takes precedence

...
```

---

## API Endpoints

### Policy Documents

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/policies/documents` | List policy documents | Board+ |
| GET | `/api/v1/policies/documents/:id` | Get document with extracts | Board+ |
| POST | `/api/v1/policies/documents` | Create policy document | Admin |
| PATCH | `/api/v1/policies/documents/:id` | Update document metadata | Admin |

### Attachments

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/policies/documents/:id/attachments` | List attachments | Board+ |
| POST | `/api/v1/policies/documents/:id/attachments` | Upload attachment | Admin |
| GET | `/api/v1/policies/attachments/:id/download` | Download attachment | Board+ |
| DELETE | `/api/v1/policies/attachments/:id` | Delete attachment | Admin |

### Extracts

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/policies/documents/:id/extracts` | List extracts for document | Board+ |
| POST | `/api/v1/policies/documents/:id/extracts` | Create extract | Admin |
| PATCH | `/api/v1/policies/extracts/:id` | Update extract | Admin |
| POST | `/api/v1/policies/extracts/:id/verify` | Mark as verified | Board+ |

### Contradictions

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/policies/contradictions` | List contradictions | Board+ |
| POST | `/api/v1/policies/contradictions/generate` | Run contradiction detection | Admin |
| PATCH | `/api/v1/policies/contradictions/:id` | Update status/resolution | Board+ |
| GET | `/api/v1/policies/contradictions/report` | Generate formatted report | Board+ |

### Search

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/policies/search?q=...` | Full-text search across extracts | Board+ |
| GET | `/api/v1/policies/topics` | List all topics with counts | Board+ |
| GET | `/api/v1/policies/by-topic/:topic` | Get extracts by topic | Board+ |

---

## UI Pages

### Board View: `/admin/policies/registry`

- List of all policy documents with filters (category, status, audience)
- Search across all extracts
- Quick stats: total documents, extracts, unresolved contradictions

### Document Detail: `/admin/policies/registry/:id`

- Document metadata
- List of attachments with download links
- Extracted provisions with section references
- Verification status for each extract

### Contradictions Dashboard: `/admin/policies/contradictions`

- Contradictions grouped by severity
- Filter by status (detected, acknowledged, resolved)
- Quick action buttons to acknowledge or mark resolved

### Search: `/admin/policies/search`

- Full-text search across all extracts
- Filter by category, topic, document type
- Citation-ready display format

---

## Charter Compliance

| Principle | How Addressed |
|-----------|---------------|
| P1 (Identity) | All actions tied to authenticated member |
| P2 (Default Deny) | Board-only access by default, explicit audience levels |
| P5 (Visible State) | Policy status, contradictions clearly displayed |
| P7 (Audit) | All ingestion, verification, resolution actions logged |
| N5 (No Hidden Rules) | Makes all organizational policies inspectable |

---

## Phase 1 Scope

### In Scope

- [ ] Prisma schema for PolicyDocument, PolicyAttachment, PolicyExtract, PolicyContradiction
- [ ] Manual document creation and metadata entry
- [ ] PDF upload and storage
- [ ] Manual extract creation (human enters section text)
- [ ] Basic contradiction detection (config vs policy)
- [ ] Board-only access control
- [ ] Simple list and detail views

### Out of Scope (Future)

- Automated PDF text extraction
- AI-powered section detection
- Policy-to-policy contradiction detection
- Committee chair access
- Integration with code-level `requirePolicy()`
- Policy change workflow (amendments, approvals)
- Version history and diff view

---

## Related Documents

- [POLICY_REGISTRY.yaml](./POLICY_REGISTRY.yaml) - Code-enforced policies (different system)
- [AUTH_AND_RBAC.md](../rbac/AUTH_AND_RBAC.md) - Access control reference
- [ARCHITECTURAL_CHARTER.md](../ARCHITECTURAL_CHARTER.md) - System principles
