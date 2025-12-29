# Wild Apricot Import Pipeline: Events, Tags, and Committees

```
Version: 1.0
Status: Planning
Audience: Migration Operators, Murmurant Developers
Purpose: Define extraction, transformation, and load process for WA data
```

---

## Executive Summary

This document defines the complete pipeline for importing Wild Apricot (WA) events, tags, and committees into Murmurant. The pipeline follows a three-phase approach:

1. **Extract**: Export data from WA via CSV and API
2. **Transform**: Map WA fields to Murmurant schema, normalize values
3. **Load**: Import into Murmurant with idempotency and rollback support

### Scope

| Entity | WA Source | Murmurant Target | Migration Type |
|--------|-----------|---------------|----------------|
| Events | Events export + API | `Event` model | AUTO |
| Event Tags | Event "Tags" field | `Event.category` + new `EventTag` | AUTO |
| Event Categories | WA Categories | Category taxonomy | AUTO |
| Committees/Groups | Groups export | `Committee` model | AUTO |
| Group Members | Group membership | `RoleAssignment` | AUTO |
| Registrations | Registrations export | `EventRegistration` | AUTO |

### Out of Scope

- Payment history (separate pipeline)
- Custom fields beyond standard WA export
- WA page content and layout (presentation migration)

---

## Phase 1: Data Extraction

### 1.1 Required WA Exports

Export these datasets from Wild Apricot Admin:

#### Events Export

**Path:** WA Admin > Events > Export

**Required columns:**

| Column | Description | Example |
|--------|-------------|---------|
| Event ID | WA internal ID | `12345` |
| Event name | Title | `Welcome Coffee` |
| Description | Rich text description | `Monthly new member...` |
| Tags | Comma-separated tags | `Social, Coffee, Newcomer` |
| Location | Venue name/address | `Handlebar Coffee` |
| Start date | Event start | `01/15/2025 09:00` |
| End date | Event end | `01/15/2025 11:00` |
| Registration limit | Capacity | `30` |
| Registration enabled | Boolean | `Yes` |
| Access level | Visibility | `Public` / `Members only` |
| Registration count | Current count | `25` |

**Export settings:**
- Date format: `MM/DD/YYYY HH:mm`
- Include past events: Yes (for historical data)
- Include cancelled events: Yes (for audit trail)

#### Registrations Export

**Path:** WA Admin > Events > [Select events] > Export Registrations

**Required columns:**

| Column | Description | Example |
|--------|-------------|---------|
| Registration ID | WA internal ID | `REG-001` |
| Contact ID | Member reference | `67890` |
| Event ID | Event reference | `12345` |
| First name | Registrant first name | `Jane` |
| Last name | Registrant last name | `Smith` |
| Email | Registrant email | `jane@example.com` |
| Registration date | When registered | `01/10/2025 14:30` |
| Registration status | Current status | `Confirmed` |
| Cancellation date | If cancelled | `01/12/2025 09:00` |
| Guests | Guest count | `1` |
| Payment status | If paid event | `Paid` |

#### Groups/Committees Export

**Path:** WA Admin > Settings > Member groups > Export

Or via API: `GET /v2.2/accounts/{accountId}/membergroups`

**Required columns:**

| Column | Description | Example |
|--------|-------------|---------|
| Group ID | WA internal ID | `GRP-001` |
| Group name | Display name | `Activities Committee` |
| Description | Purpose | `Plans and executes...` |
| Access type | Open/Closed | `Closed` |
| Member count | Current count | `12` |
| Created date | When created | `01/01/2020` |

#### Group Membership Export

**Path:** WA Admin > Settings > Member groups > [Group] > Members > Export

**Required columns:**

| Column | Description | Example |
|--------|-------------|---------|
| Group ID | Group reference | `GRP-001` |
| Contact ID | Member reference | `67890` |
| Email | Member email | `jane@example.com` |
| Role | Position in group | `Chair` / `Member` |
| Added date | When joined | `06/15/2024` |

### 1.2 WA API Extraction (Optional Enhancement)

For automated extraction, use the WA API v2.2:

```bash
# Authenticate
curl -X POST https://oauth.wildapricot.org/auth/token \
  -H "Authorization: Basic ${WA_API_KEY_BASE64}" \
  -d "grant_type=client_credentials&scope=auto"

# Get events
curl https://api.wildapricot.org/v2.2/accounts/{accountId}/events \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"

# Get member groups
curl https://api.wildapricot.org/v2.2/accounts/{accountId}/membergroups \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

**API Rate Limits:**
- 60 requests per minute
- 10,000 requests per day
- Use pagination for large datasets

---

## Phase 2: Data Transformation

### 2.1 Event Field Mapping

| WA Field | Murmurant Field | Transform | Notes |
|----------|--------------|-----------|-------|
| `Event ID` | `_waEventId` | Store as metadata | For reconciliation |
| `Event name` | `title` | Direct copy | Required |
| `Description` | `description` | HTML to Markdown | Preserve formatting |
| `Tags` | `category` | First tag only | See Tag Strategy below |
| `Tags` | `EventTag[]` | All tags | New junction table |
| `Location` | `location` | Direct copy | |
| `Start date` | `startTime` | Parse + timezone | `America/Los_Angeles` |
| `End date` | `endTime` | Parse + timezone | Null if same day |
| `Registration limit` | `capacity` | Parse int | Null if unlimited |
| `Registration enabled` | `requiresRegistration` | Boolean parse | |
| `Access level` | `status` | Map to status | See Status Mapping |
| (derived) | `status` | Default: `PUBLISHED` | Historical = published |
| (derived) | `isPublished` | `true` | Legacy compat |
| (derived) | `publishedAt` | `startTime - 7 days` | Estimate |

### 2.2 Tag Strategy

WA uses a flat tag system. Murmurant needs structured categories.

**Approach: Primary Category + Tag Junction**

```
WA Tags: "Social, Coffee, Newcomer Welcome"
         ↓
Murmurant:
  - Event.category = "Social"              (first/primary tag)
  - EventTag records:
      - { eventId, tag: "Social" }
      - { eventId, tag: "Coffee" }
      - { eventId, tag: "Newcomer Welcome" }
```

**Tag Normalization Rules:**

| WA Tag Pattern | Normalized Tag | Category |
|----------------|----------------|----------|
| `Social*`, `social*` | `Social` | Social |
| `Outdoor*`, `Hike*`, `Walk*` | `Outdoor` | Outdoor Activities |
| `Cultural*`, `Art*`, `Music*` | `Cultural` | Cultural |
| `Dining*`, `Wine*`, `Food*` | `Dining` | Dining Out |
| `Learning*`, `Workshop*` | `Learning` | Learning |
| `Board*`, `Committee*` | `Governance` | Governance |
| `Special*`, `Annual*` | `Special Events` | Special Events |
| (no match) | (original) | General |

**Category to Committee Mapping:**

| Category | Likely Committee | Notes |
|----------|------------------|-------|
| Social | Social Committee | Auto-assign if clear |
| Outdoor | Outdoor Activities | |
| Cultural | Cultural Committee | |
| Dining | Dining Committee | |
| Governance | Board | VP-level review |
| (other) | Activities Committee | Default fallback |

### 2.3 Committee/Group Field Mapping

| WA Field | Murmurant Field | Transform | Notes |
|----------|--------------|-----------|-------|
| `Group ID` | `_waGroupId` | Store as metadata | For reconciliation |
| `Group name` | `name` | Direct copy | Required |
| `Group name` | `slug` | Slugify | `activities-committee` |
| `Description` | `description` | Direct copy | |
| `Access type` | (info only) | Not mapped | |
| (derived) | `isActive` | `true` | Default active |

**Group Name to Committee Mapping:**

| WA Group Name Pattern | Murmurant Committee | Create New? |
|-----------------------|------------------|-------------|
| `*Board*` | `board` | No (exists) |
| `*Activities*` | `activities-committee` | Yes |
| `*Social*` | `social-committee` | Yes |
| `*Membership*` | `membership-committee` | Yes |
| `*Communications*` | `communications-committee` | Yes |
| `*Finance*`, `*Treasurer*` | `finance-committee` | Yes |
| `*Hospitality*` | `hospitality-committee` | Yes |
| `*Tech*`, `*Website*` | `tech-committee` | Yes |
| `*Outdoor*` | `outdoor-committee` | Yes |
| `*Cultural*` | `cultural-committee` | Yes |
| `*Dining*` | `dining-committee` | Yes |
| `Interest Group:*` | Skip | Interest groups handled separately |
| (other) | Create with slugified name | Yes |

### 2.4 Group Membership to Role Assignment

| WA Field | Murmurant Field | Transform | Notes |
|----------|--------------|-----------|-------|
| `Contact ID` | `memberId` | Lookup by email | Via member import |
| `Group ID` | `committeeId` | Lookup by WA ID | Via committee import |
| `Role` | `committeeRoleId` | Map to role | See Role Mapping |
| `Added date` | `startDate` | Parse date | |
| (derived) | `endDate` | `null` | Current term |
| (derived) | `termId` | Current term | Lookup current |

**Role Mapping:**

| WA Role | Murmurant CommitteeRole | Create If Missing? |
|---------|----------------------|-------------------|
| `Chair`, `Chairman`, `Chairperson` | `chair` | Yes |
| `Co-Chair`, `Vice Chair` | `co-chair` | Yes |
| `Secretary` | `secretary` | Yes |
| `Treasurer` | `treasurer` | Yes |
| `Member`, (blank) | `member` | Yes |
| (other) | `member` | No |

### 2.5 Registration Field Mapping

| WA Field | Murmurant Field | Transform | Notes |
|----------|--------------|-----------|-------|
| `Registration ID` | `_waRegistrationId` | Store as metadata | |
| `Contact ID` | `memberId` | Lookup by WA ID | Required |
| `Event ID` | `eventId` | Lookup by WA ID | Required |
| `Registration date` | `registeredAt` | Parse + timezone | |
| `Registration status` | `status` | Map status | See below |
| `Cancellation date` | `cancelledAt` | Parse + timezone | If cancelled |
| `Guests` | `guestCount` | Parse int | New field needed |

**Registration Status Mapping:**

| WA Status | Murmurant Status | Notes |
|-----------|---------------|-------|
| `Confirmed` | `CONFIRMED` | |
| `Registered` | `CONFIRMED` | Alias |
| `Pending` | `CONFIRMED` | Treat as confirmed |
| `Waitlisted` | `WAITLISTED` | |
| `Cancelled` | `CANCELLED` | |
| `No show` | `NO_SHOW` | |
| (other) | `CONFIRMED` | Default |

---

## Phase 3: Data Loading

### 3.1 Import Order (Critical)

Entities must be imported in dependency order:

```
1. Members (if not already imported)
   ↓ Provides memberId lookups
2. Committees
   ↓ Provides committeeId lookups
3. Committee Roles
   ↓ Provides committeeRoleId lookups
4. Terms (if not exists)
   ↓ Provides termId lookups
5. Role Assignments
   ↓ Links members to committees
6. Events
   ↓ Provides eventId lookups
7. Event Tags (junction records)
   ↓ Links events to tags
8. Registrations
   ↓ Links members to events
```

### 3.2 Idempotency Rules

Each entity type has specific conflict resolution:

| Entity | Match Key | On Conflict |
|--------|-----------|-------------|
| Committee | `slug` | Update fields |
| CommitteeRole | `committeeId` + `slug` | Update fields |
| Event | `title` + `startTime` (±1hr) | Skip (preserve edits) |
| EventTag | `eventId` + `tag` | Skip (no duplicates) |
| RoleAssignment | `memberId` + `committeeId` + `termId` | Update dates |
| Registration | `memberId` + `eventId` | Update status |

### 3.3 Batch Processing

```typescript
// Pseudocode for batch import
const BATCH_SIZE = 100;

async function importEvents(events: WAEvent[]): Promise<ImportResult> {
  const results = { created: 0, updated: 0, skipped: 0, errors: [] };

  for (const batch of chunk(events, BATCH_SIZE)) {
    await prisma.$transaction(async (tx) => {
      for (const waEvent of batch) {
        try {
          const existing = await findExistingEvent(tx, waEvent);

          if (existing) {
            results.skipped++;
            continue;
          }

          const murmurantEvent = transformEvent(waEvent);
          await tx.event.create({ data: murmurantEvent });
          results.created++;

        } catch (error) {
          results.errors.push({ waEventId: waEvent.eventId, error });
        }
      }
    });
  }

  return results;
}
```

### 3.4 Validation Rules

Before import, validate each record:

**Events:**
- [ ] `title` is non-empty
- [ ] `startTime` is valid date
- [ ] `startTime` is not in far future (>2 years)
- [ ] `endTime` >= `startTime` (if set)
- [ ] `capacity` is non-negative (if set)

**Committees:**
- [ ] `name` is non-empty
- [ ] `slug` contains only alphanumeric and hyphens
- [ ] `slug` is unique

**Registrations:**
- [ ] `memberId` exists in Murmurant
- [ ] `eventId` exists in Murmurant
- [ ] `registeredAt` <= `event.startTime`

### 3.5 Error Handling

```yaml
error_handling:
  validation_failure:
    action: log_and_skip
    continue: true

  foreign_key_missing:
    action: log_and_skip
    continue: true

  duplicate_key:
    action: skip_silently
    continue: true

  database_error:
    action: log_and_retry
    max_retries: 3
    backoff_seconds: [1, 5, 15]

  unknown_error:
    action: abort_batch
    continue: false
```

---

## Phase 4: Verification

### 4.1 Import Report

Each import run generates a report:

```json
{
  "runId": "mig-2025-01-15-001",
  "timestamp": "2025-01-15T10:30:00Z",
  "duration_seconds": 45,
  "source": {
    "events_file": "wa-events-export.csv",
    "registrations_file": "wa-registrations-export.csv",
    "committees_file": "wa-groups-export.csv"
  },
  "results": {
    "committees": { "created": 8, "updated": 0, "skipped": 2, "errors": 0 },
    "committee_roles": { "created": 24, "updated": 0, "skipped": 0, "errors": 0 },
    "role_assignments": { "created": 45, "updated": 3, "skipped": 2, "errors": 1 },
    "events": { "created": 150, "updated": 0, "skipped": 25, "errors": 2 },
    "event_tags": { "created": 380, "updated": 0, "skipped": 0, "errors": 0 },
    "registrations": { "created": 1200, "updated": 50, "skipped": 30, "errors": 5 }
  },
  "errors": [
    {
      "entity": "events",
      "waId": "EVT-999",
      "field": "startTime",
      "error": "Invalid date format",
      "value": "TBD"
    }
  ],
  "id_map_location": "scripts/migration/reports/mig-2025-01-15-001-id-map.json"
}
```

### 4.2 Post-Import Verification Queries

Run these queries after import to verify data integrity:

```sql
-- Events without registrations (may be expected)
SELECT e.id, e.title, e.start_time
FROM "Event" e
LEFT JOIN "EventRegistration" r ON r.event_id = e.id
WHERE r.id IS NULL
AND e.start_time < NOW();

-- Registrations for non-existent members
SELECT r.id, r.member_id, r.event_id
FROM "EventRegistration" r
LEFT JOIN "Member" m ON m.id = r.member_id
WHERE m.id IS NULL;

-- Committees without any assignments
SELECT c.id, c.name
FROM "Committee" c
LEFT JOIN "RoleAssignment" ra ON ra.committee_id = c.id
WHERE ra.id IS NULL;

-- Events with category not in known set
SELECT id, title, category
FROM "Event"
WHERE category NOT IN ('Social', 'Outdoor', 'Cultural', 'Dining', 'Learning', 'Governance', 'Special Events', 'General')
AND category IS NOT NULL;
```

### 4.3 Data Quality Checks

| Check | Query | Expected |
|-------|-------|----------|
| No orphan registrations | Registrations with invalid memberId | 0 |
| No orphan assignments | RoleAssignments with invalid committeeId | 0 |
| Event dates valid | Events with endTime < startTime | 0 |
| Tags normalized | Distinct tags < 50 | Pass |
| Committees have chairs | Committees with chair role assigned | > 80% |

---

## Phase 5: Rollback Procedures

### 5.1 Pre-Import Snapshot

Before running import, create rollback point:

```bash
# Create database snapshot (if using Neon)
neon branches create --name pre-migration-$(date +%Y%m%d)

# Or dump relevant tables
pg_dump -t "Event" -t "EventTag" -t "Committee" -t "CommitteeRole" \
        -t "RoleAssignment" -t "EventRegistration" \
        $DATABASE_URL > pre-migration-backup.sql
```

### 5.2 Rollback by Entity Type

**Rollback Events:**
```sql
-- Delete events imported in specific run
DELETE FROM "Event"
WHERE id IN (
  SELECT murmurant_id FROM migration_id_map
  WHERE run_id = 'mig-2025-01-15-001'
  AND entity_type = 'event'
);
```

**Rollback Committees:**
```sql
-- First delete role assignments
DELETE FROM "RoleAssignment"
WHERE committee_id IN (
  SELECT murmurant_id FROM migration_id_map
  WHERE run_id = 'mig-2025-01-15-001'
  AND entity_type = 'committee'
);

-- Then delete committee roles
DELETE FROM "CommitteeRole"
WHERE committee_id IN (
  SELECT murmurant_id FROM migration_id_map
  WHERE run_id = 'mig-2025-01-15-001'
  AND entity_type = 'committee'
);

-- Finally delete committees
DELETE FROM "Committee"
WHERE id IN (
  SELECT murmurant_id FROM migration_id_map
  WHERE run_id = 'mig-2025-01-15-001'
  AND entity_type = 'committee'
);
```

### 5.3 Full Rollback Script

```bash
#!/bin/bash
# scripts/migration/rollback.sh

RUN_ID=$1

if [ -z "$RUN_ID" ]; then
  echo "Usage: rollback.sh <run_id>"
  exit 1
fi

echo "Rolling back migration run: $RUN_ID"
echo "This will delete all imported records."
read -p "Type 'ROLLBACK' to confirm: " confirm

if [ "$confirm" != "ROLLBACK" ]; then
  echo "Aborted."
  exit 1
fi

npx tsx scripts/migration/rollback.ts --run-id "$RUN_ID"
```

---

## Schema Changes Required

### New: EventTag Junction Table

```prisma
// Add to prisma/schema.prisma

model EventTag {
  id        String   @id @default(uuid()) @db.Uuid
  eventId   String   @db.Uuid
  tag       String
  createdAt DateTime @default(now())

  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@unique([eventId, tag])
  @@index([tag])
  @@index([eventId])
}

// Update Event model
model Event {
  // ... existing fields ...
  tags EventTag[]
}
```

### New: Migration Tracking Table

```prisma
model MigrationIdMap {
  id         String   @id @default(uuid()) @db.Uuid
  runId      String   // e.g., "mig-2025-01-15-001"
  entityType String   // "event", "committee", "registration"
  waId       String   // Original WA ID
  murmurantId   String   @db.Uuid // Murmurant UUID
  createdAt  DateTime @default(now())

  @@unique([runId, entityType, waId])
  @@index([runId])
  @@index([entityType, waId])
}
```

### Event Model Updates

```prisma
model Event {
  // ... existing fields ...

  // Add guest count support for registrations
  // (Actually on EventRegistration, not Event)
}

model EventRegistration {
  // ... existing fields ...

  guestCount Int @default(0) // New: number of guests
}
```

---

## Configuration Updates

Add to `scripts/migration/config/migration-config.yaml`:

```yaml
# Committee/Group configuration
committee_fields:
  name: "Group name"
  description: "Description"
  _wa_group_id: "Group ID"

committee_name_mapping:
  "Board of Directors": "board"
  "Activities Committee": "activities-committee"
  "Social Committee": "social-committee"
  "Membership Committee": "membership-committee"
  "Communications Committee": "communications-committee"
  "Finance Committee": "finance-committee"
  "Tech Committee": "tech-committee"
  _pattern_skip:
    - "Interest Group:*"
    - "Test*"
  _default: "slugify"

committee_role_mapping:
  "Chair": "chair"
  "Chairman": "chair"
  "Chairperson": "chair"
  "Co-Chair": "co-chair"
  "Vice Chair": "co-chair"
  "Secretary": "secretary"
  "Treasurer": "treasurer"
  "Member": "member"
  _default: "member"

# Tag normalization
tag_normalization:
  categories:
    Social:
      patterns: ["Social*", "social*", "Coffee*", "Happy Hour*"]
    Outdoor:
      patterns: ["Outdoor*", "Hike*", "Walk*", "Beach*", "Garden*"]
    Cultural:
      patterns: ["Cultural*", "Art*", "Music*", "Theater*", "Museum*"]
    Dining:
      patterns: ["Dining*", "Wine*", "Food*", "Restaurant*", "Lunch*"]
    Learning:
      patterns: ["Learning*", "Workshop*", "Lecture*", "Class*"]
    Governance:
      patterns: ["Board*", "Committee*", "Annual Meeting*"]
    Special Events:
      patterns: ["Special*", "Annual*", "Holiday*", "Gala*"]
  default_category: "General"
  preserve_original: true  # Keep original tag in EventTag table
```

---

## CLI Commands

### Dry Run (Preview)

```bash
# Preview event import
npm run migrate:events:dry-run -- --data-dir ./wa-export

# Preview committee import
npm run migrate:committees:dry-run -- --data-dir ./wa-export

# Preview full import
npm run migrate:full:dry-run -- --data-dir ./wa-export
```

### Live Import

```bash
# Import committees first
npm run migrate:committees -- --data-dir ./wa-export --yes

# Then import events
npm run migrate:events -- --data-dir ./wa-export --yes

# Or full import (respects order)
npm run migrate:full -- --data-dir ./wa-export --yes
```

### Verification

```bash
# Run post-import verification
npm run migrate:verify -- --run-id mig-2025-01-15-001

# Generate reconciliation report
npm run migrate:reconcile -- --run-id mig-2025-01-15-001
```

### Rollback

```bash
# Preview rollback
npm run migrate:rollback:dry-run -- --run-id mig-2025-01-15-001

# Execute rollback
npm run migrate:rollback -- --run-id mig-2025-01-15-001 --confirm
```

---

## Monitoring and Alerts

### Import Metrics

Track these metrics during import:

| Metric | Threshold | Alert |
|--------|-----------|-------|
| Error rate | > 5% | Warning |
| Error rate | > 10% | Abort |
| Duration | > 5 minutes | Info |
| Memory usage | > 80% | Warning |

### Post-Import Monitoring

Watch for 24 hours after import:

- Member login failures (may indicate ID mapping issues)
- Event display errors (may indicate data issues)
- Registration failures (may indicate relationship issues)

---

## Related Documents

- [Migration Intake Checklist](./WILD_APRICOT_MIGRATION_INTAKE_CHECKLIST.md)
- [Gadget Classification Matrix](./WILD_APRICOT_GADGET_TAGGING.md)
- [Operator Decision Tree](./OPERATOR_DECISION_TREE.md)
- [Migration Engine README](../../scripts/migration/README.md)

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2025-12-26 | Worker 5 | Initial pipeline specification |
