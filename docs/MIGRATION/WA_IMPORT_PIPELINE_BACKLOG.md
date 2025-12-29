# WA Import Pipeline: Implementation Backlog

```
Status: Planning
Priority: P1 (Critical path for go-live)
Epic: Wild Apricot Migration
```

---

## Backlog Overview

### Workstreams

| Stream | Stories | Points | Priority |
|--------|---------|--------|----------|
| Schema Changes | 3 | 8 | P0 |
| Core Pipeline | 5 | 21 | P1 |
| Committees | 3 | 8 | P1 |
| Events + Tags | 4 | 13 | P1 |
| Verification | 3 | 8 | P2 |
| Rollback | 2 | 5 | P2 |
| **Total** | **20** | **63** | |

---

## Stream 1: Schema Changes (P0)

### MIG-001: Add EventTag junction table

**Priority:** P0 - Blocker for event import

**Description:**

Add many-to-many relationship between Events and Tags to support multi-tag events from WA.

**Acceptance Criteria:**

- [ ] `EventTag` model added to schema with `eventId`, `tag`, `createdAt`
- [ ] Unique constraint on `(eventId, tag)` prevents duplicates
- [ ] Index on `tag` for efficient tag queries
- [ ] Index on `eventId` for efficient event tag lookups
- [ ] Migration runs cleanly on empty and populated databases
- [ ] Existing events unaffected (tags table starts empty)

**Technical Notes:**

```prisma
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
```

**Story Points:** 2

---

### MIG-002: Add MigrationIdMap tracking table

**Priority:** P0 - Required for rollback capability

**Description:**

Add table to track mapping between WA IDs and Murmurant UUIDs for each migration run. Enables rollback and reconciliation.

**Acceptance Criteria:**

- [ ] `MigrationIdMap` model added with `runId`, `entityType`, `waId`, `murmurantId`
- [ ] Unique constraint on `(runId, entityType, waId)`
- [ ] Index on `runId` for rollback queries
- [ ] Migration runs cleanly
- [ ] Old mapping data can be purged after retention period

**Technical Notes:**

```prisma
model MigrationIdMap {
  id         String   @id @default(uuid()) @db.Uuid
  runId      String
  entityType String
  waId       String
  murmurantId   String   @db.Uuid
  createdAt  DateTime @default(now())

  @@unique([runId, entityType, waId])
  @@index([runId])
  @@index([entityType, waId])
}
```

**Story Points:** 2

---

### MIG-003: Add guestCount to EventRegistration

**Priority:** P0 - Required for registration import

**Description:**

Add `guestCount` field to `EventRegistration` model to track number of guests per registration.

**Acceptance Criteria:**

- [ ] `guestCount` field added with default 0
- [ ] Existing registrations remain valid (default applied)
- [ ] Registration UI updated to display guest count
- [ ] Registration capacity calculation includes guests

**Technical Notes:**

```prisma
model EventRegistration {
  // ... existing fields ...
  guestCount Int @default(0)
}
```

**Story Points:** 4 (includes UI update)

---

## Stream 2: Core Pipeline Infrastructure (P1)

### MIG-010: Create ID mapping service

**Priority:** P1

**Description:**

Build service to manage WA-to-Murmurant ID mappings during import. Supports lookup, insert, and rollback operations.

**Acceptance Criteria:**

- [ ] `IdMappingService` class with `recordMapping()`, `lookupMurmurantId()`, `lookupWaId()`
- [ ] Batch insert support for performance
- [ ] Transaction support (rollback on failure)
- [ ] Query by run ID for rollback
- [ ] Memory-efficient for large imports (streaming)

**API:**

```typescript
interface IdMappingService {
  recordMapping(runId: string, entityType: string, waId: string, murmurantId: string): Promise<void>;
  recordMappingBatch(runId: string, mappings: Mapping[]): Promise<void>;
  lookupMurmurantId(entityType: string, waId: string): Promise<string | null>;
  lookupWaId(entityType: string, murmurantId: string): Promise<string | null>;
  getRunMappings(runId: string): Promise<Mapping[]>;
  deleteRunMappings(runId: string): Promise<number>;
}
```

**Story Points:** 5

---

### MIG-011: Create tag normalization service

**Priority:** P1

**Description:**

Build service to normalize WA tags to Murmurant categories and preserve original tags in EventTag table.

**Acceptance Criteria:**

- [ ] `TagNormalizationService` class with `normalizeTag()`, `extractCategory()`, `parseTagList()`
- [ ] Pattern matching from config (wildcards, case-insensitive)
- [ ] Returns both normalized category and original tags
- [ ] Handles comma-separated and semicolon-separated tag lists
- [ ] Trims whitespace and deduplicates

**API:**

```typescript
interface TagNormalizationService {
  normalizeTag(rawTag: string): string;
  extractCategory(tags: string[]): string;
  parseTagList(tagString: string): string[];
  processEventTags(tagString: string): {
    category: string;
    tags: string[];
  };
}
```

**Story Points:** 3

---

### MIG-012: Create import orchestrator

**Priority:** P1

**Description:**

Build orchestrator to manage import order and dependencies between entity types.

**Acceptance Criteria:**

- [ ] Orchestrator manages import order: Members → Committees → Roles → Assignments → Events → Tags → Registrations
- [ ] Skips already-imported entities when re-running
- [ ] Supports partial import (e.g., events only)
- [ ] Generates run ID and tracks progress
- [ ] Handles interruption gracefully (resumable)

**API:**

```typescript
interface ImportOrchestrator {
  startRun(options: ImportOptions): Promise<string>; // returns runId
  importEntities(runId: string, entityTypes: EntityType[]): Promise<ImportResult>;
  getRunStatus(runId: string): Promise<RunStatus>;
  resumeRun(runId: string): Promise<ImportResult>;
}
```

**Story Points:** 5

---

### MIG-013: Create import report generator

**Priority:** P1

**Description:**

Build report generator that produces detailed JSON and human-readable reports after each import run.

**Acceptance Criteria:**

- [ ] JSON report with counts, errors, and ID mappings
- [ ] Human-readable summary for operator review
- [ ] Error details with WA ID, field, and value
- [ ] Saved to `scripts/migration/reports/` directory
- [ ] Includes verification query results

**Output Example:**

```json
{
  "runId": "mig-2025-01-15-001",
  "timestamp": "2025-01-15T10:30:00Z",
  "results": {
    "events": { "created": 150, "skipped": 25, "errors": 2 }
  },
  "errors": [
    { "waId": "EVT-999", "field": "startTime", "error": "Invalid date" }
  ]
}
```

**Story Points:** 3

---

### MIG-014: Create dry-run mode

**Priority:** P1

**Description:**

Add dry-run mode that validates data and shows what would be imported without making changes.

**Acceptance Criteria:**

- [ ] `--dry-run` flag prevents database writes
- [ ] Validates all field mappings and transformations
- [ ] Reports validation errors
- [ ] Shows counts of what would be created/updated/skipped
- [ ] Validates foreign key references exist

**Story Points:** 5

---

## Stream 3: Committee Import (P1)

### MIG-020: Implement committee importer

**Priority:** P1

**Description:**

Build importer for WA groups/committees including name normalization and slug generation.

**Acceptance Criteria:**

- [ ] Parses WA groups export CSV
- [ ] Maps group names to slugs using config
- [ ] Skips interest groups (configurable pattern)
- [ ] Creates committees with description
- [ ] Idempotent: updates existing by slug

**Story Points:** 3

---

### MIG-021: Implement committee role seeder

**Priority:** P1

**Description:**

For each imported committee, seed standard roles (chair, co-chair, secretary, member).

**Acceptance Criteria:**

- [ ] Creates standard roles for new committees
- [ ] Role names and slugs from config
- [ ] Preserves existing roles on re-run
- [ ] Correct sort order for display

**Story Points:** 2

---

### MIG-022: Implement role assignment importer

**Priority:** P1

**Description:**

Import WA group memberships as Murmurant role assignments, mapping WA roles to committee roles.

**Acceptance Criteria:**

- [ ] Parses WA group membership export
- [ ] Looks up member by WA contact ID (via member mapping)
- [ ] Looks up committee by WA group ID
- [ ] Maps WA role names to committee role slugs
- [ ] Creates assignments for current term
- [ ] Handles members not yet imported (log and skip)

**Story Points:** 3

---

## Stream 4: Events + Tags Import (P1)

### MIG-030: Implement event importer

**Priority:** P1

**Description:**

Build importer for WA events including field mapping, date parsing, and category extraction.

**Acceptance Criteria:**

- [ ] Parses WA events export CSV
- [ ] Maps all fields per specification
- [ ] Parses dates with timezone handling
- [ ] Extracts primary category from tags
- [ ] Sets appropriate status (PUBLISHED for historical)
- [ ] Handles missing/invalid dates gracefully

**Story Points:** 5

---

### MIG-031: Implement event tag importer

**Priority:** P1

**Description:**

After events are imported, create EventTag junction records for all tags on each event.

**Acceptance Criteria:**

- [ ] Creates EventTag for each tag in WA Tags field
- [ ] Normalizes tag names (trim, consistent case)
- [ ] Deduplicates tags per event
- [ ] Runs after event import completes
- [ ] Uses event ID mapping to link

**Story Points:** 2

---

### MIG-032: Implement registration importer

**Priority:** P1

**Description:**

Import WA event registrations, linking members to events with status mapping.

**Acceptance Criteria:**

- [ ] Parses WA registrations export CSV
- [ ] Looks up member by WA contact ID
- [ ] Looks up event by WA event ID
- [ ] Maps registration status
- [ ] Imports guest count
- [ ] Handles missing members/events (log and skip)

**Story Points:** 3

---

### MIG-033: Implement committee-event linking

**Priority:** P1

**Description:**

After events and committees are imported, link events to owning committees based on category.

**Acceptance Criteria:**

- [ ] Maps event category to committee
- [ ] Updates `Event.committeeId` field
- [ ] Runs after both events and committees imported
- [ ] Logs events that couldn't be linked
- [ ] Configurable category-to-committee mapping

**Story Points:** 3

---

## Stream 5: Verification (P2)

### MIG-040: Implement verification queries

**Priority:** P2

**Description:**

Build automated verification that runs data quality checks after import.

**Acceptance Criteria:**

- [ ] Checks for orphan registrations (no member)
- [ ] Checks for orphan assignments (no committee)
- [ ] Checks for invalid dates
- [ ] Checks tag normalization coverage
- [ ] Checks committee chair assignments
- [ ] Outputs pass/fail with details

**Story Points:** 3

---

### MIG-041: Implement reconciliation report

**Priority:** P2

**Description:**

Generate report comparing WA export totals to Murmurant import totals.

**Acceptance Criteria:**

- [ ] Counts WA records by type
- [ ] Counts Murmurant records by type
- [ ] Calculates difference (should be 0 or explained)
- [ ] Lists skipped records with reasons
- [ ] Human-readable format for review

**Story Points:** 3

---

### MIG-042: Implement sanity check CLI

**Priority:** P2

**Description:**

Quick CLI command to check import health without full verification.

**Acceptance Criteria:**

- [ ] `npm run migrate:check` command
- [ ] Shows record counts by type
- [ ] Shows recent import run status
- [ ] Shows any error counts
- [ ] Fast execution (< 5 seconds)

**Story Points:** 2

---

## Stream 6: Rollback (P2)

### MIG-050: Implement rollback service

**Priority:** P2

**Description:**

Build service to rollback a specific import run by deleting all created records.

**Acceptance Criteria:**

- [ ] Deletes records by run ID from MigrationIdMap
- [ ] Respects foreign key order (registrations → events → committees)
- [ ] Supports dry-run mode
- [ ] Requires explicit confirmation
- [ ] Logs all deletions for audit

**API:**

```typescript
interface RollbackService {
  previewRollback(runId: string): Promise<RollbackPreview>;
  executeRollback(runId: string, confirmation: string): Promise<RollbackResult>;
}
```

**Story Points:** 3

---

### MIG-051: Implement rollback CLI

**Priority:** P2

**Description:**

CLI commands for rollback preview and execution.

**Acceptance Criteria:**

- [ ] `npm run migrate:rollback:dry-run -- --run-id X` shows preview
- [ ] `npm run migrate:rollback -- --run-id X --confirm` executes
- [ ] Requires typing confirmation phrase
- [ ] Shows progress during execution
- [ ] Outputs summary after completion

**Story Points:** 2

---

## Backlog Prioritization

### Sprint 1 (Schema + Core)

| ID | Story | Points | Assignee |
|----|-------|--------|----------|
| MIG-001 | EventTag table | 2 | |
| MIG-002 | MigrationIdMap table | 2 | |
| MIG-003 | guestCount field | 4 | |
| MIG-010 | ID mapping service | 5 | |
| | **Sprint 1 Total** | **13** | |

### Sprint 2 (Import Core)

| ID | Story | Points | Assignee |
|----|-------|--------|----------|
| MIG-011 | Tag normalization | 3 | |
| MIG-012 | Import orchestrator | 5 | |
| MIG-013 | Report generator | 3 | |
| MIG-014 | Dry-run mode | 5 | |
| | **Sprint 2 Total** | **16** | |

### Sprint 3 (Entity Importers)

| ID | Story | Points | Assignee |
|----|-------|--------|----------|
| MIG-020 | Committee importer | 3 | |
| MIG-021 | Committee role seeder | 2 | |
| MIG-022 | Role assignment importer | 3 | |
| MIG-030 | Event importer | 5 | |
| MIG-031 | Event tag importer | 2 | |
| | **Sprint 3 Total** | **15** | |

### Sprint 4 (Completion)

| ID | Story | Points | Assignee |
|----|-------|--------|----------|
| MIG-032 | Registration importer | 3 | |
| MIG-033 | Committee-event linking | 3 | |
| MIG-040 | Verification queries | 3 | |
| MIG-041 | Reconciliation report | 3 | |
| MIG-042 | Sanity check CLI | 2 | |
| MIG-050 | Rollback service | 3 | |
| MIG-051 | Rollback CLI | 2 | |
| | **Sprint 4 Total** | **19** | |

---

## Dependencies

```
MIG-001 (EventTag) ──┐
                     ├──► MIG-031 (Event tag importer)
MIG-030 (Events) ────┘

MIG-002 (IdMap) ────► MIG-010 (ID mapping service) ────► All importers

MIG-003 (guestCount) ────► MIG-032 (Registration importer)

MIG-010 (ID mapping) ────► MIG-050 (Rollback service)

MIG-020 (Committees) ───┐
MIG-021 (Roles) ────────┼──► MIG-022 (Role assignments)
Members import ─────────┘

MIG-020 (Committees) ───┐
MIG-030 (Events) ───────┴──► MIG-033 (Committee-event linking)
```

---

## Definition of Done

Each backlog item must:

- [ ] Code reviewed and merged
- [ ] Unit tests passing (>80% coverage)
- [ ] Integration test with sample data
- [ ] Works with dry-run mode
- [ ] Generates appropriate logs
- [ ] Documentation updated
- [ ] Works on Neon database

---

## Related Documents

- [Import Pipeline Specification](./WA_IMPORT_PIPELINE_EVENTS_TAGS_COMMITTEES.md)
- [Sample Mapping Reference](./WA_IMPORT_SAMPLE_MAPPING.md)
- [Migration README](../../scripts/migration/README.md)

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2025-12-26 | Worker 5 | Initial backlog creation |

## Backlog Item: External Cron Job Discovery

**Priority:** High (migration blocker)
**Added:** 2025-12-27

External cron jobs that modify WA data via API represent hidden business logic. We have no way of knowing about them without asking. They must be documented during intake and reimplemented in Murmurant.

**Action:** Ensure intake checklist includes cron job discovery questions.
