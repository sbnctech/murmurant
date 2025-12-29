# Wild Apricot Importer System Specification

This document defines the data sources, invariants, idempotency rules, and failure handling for the Murmurant Wild Apricot importer.

## 1. Overview

The WA Importer synchronizes data from Wild Apricot (WA) into Murmurant using a hybrid approach:

- **WA API Client**: TypeScript port of proven Python patterns (OAuth, pagination, async polling)
- **Prisma Import Layer**: Fresh implementation for PostgreSQL with proper audit integration
- **ID Mapping**: Deterministic WA integer ID to Murmurant UUID mapping

## 2. Data Sources

### 2.1 Wild Apricot API

| Endpoint | Entity | Murmurant Target |
|----------|--------|---------------|
| `/v2.2/accounts/{id}/contacts` | Contacts | Member |
| `/v2.2/accounts/{id}/events` | Events | Event |
| `/v2.2/accounts/{id}/eventregistrations?eventId={id}` | Registrations | EventRegistration |
| `/v2.2/accounts/{id}/membershiplevels` | Membership Levels | MembershipStatus (mapping) |

### 2.2 Not Imported (Out of Scope)

- **Invoices**: Financial records stay in WA
- **Payments**: Financial records stay in WA
- **Email logs**: Historical only, not needed
- **Custom field JSON blobs**: Individual fields mapped as needed

## 3. Entity Import Order

Entities must be imported in dependency order:

```
1. MembershipStatus (seed data, not from WA)
2. Member (depends on MembershipStatus)
3. Event (depends on Member for eventChairId)
4. EventRegistration (depends on Member and Event)
```

## 4. Invariants

### 4.1 Data Integrity Invariants

| Invariant | Description | Enforcement |
|-----------|-------------|-------------|
| INV-1 | Every Murmurant entity from WA has a WaIdMapping record | Transaction: create mapping before entity |
| INV-2 | WA ID + entityType is unique | Database unique constraint |
| INV-3 | Member.email is unique in Murmurant | Upsert by email, not by WA ID |
| INV-4 | EventRegistration is unique per (eventId, memberId) | Database unique constraint |
| INV-5 | All imported records have audit trail | Batch audit on each sync run |

### 4.2 Business Logic Invariants

| Invariant | Description | Enforcement |
|-----------|-------------|-------------|
| BIZ-1 | Status mapping is deterministic | Static mapping table, no ambiguity |
| BIZ-2 | Missing required fields cause skip, not failure | Log warning, continue with next record |
| BIZ-3 | Foreign key references must exist | Validate before insert, skip if missing |
| BIZ-4 | Dates are stored as UTC | Parse with timezone, convert to UTC |

## 5. Idempotency Rules

### 5.1 Core Principle

**Running the same sync twice produces no net changes** (except updatedAt timestamps).

### 5.2 Implementation

```
For each WA entity:
  1. Lookup WaIdMapping by (entityType, waId)
  2. If exists:
     - Fetch Murmurant entity by murmurantId
     - Compare fields (excluding updatedAt, createdAt)
     - If changed: UPDATE (Prisma upsert)
     - If unchanged: SKIP
  3. If not exists:
     - CREATE Murmurant entity
     - CREATE WaIdMapping record
     - Both in same transaction
```

### 5.3 Idempotency Key Strategy

| Entity | Idempotency Key | Rationale |
|--------|-----------------|-----------|
| Member | email | WA allows duplicates, Murmurant doesn't |
| Event | WA ID | No natural key, use WA ID mapping |
| EventRegistration | (eventId, memberId) | Business unique constraint |

### 5.4 Conflict Resolution

| Scenario | Resolution |
|----------|------------|
| Same WA contact, different email | Update email (WA is source of truth) |
| Same email, different WA contact | Use first WA contact, log warning |
| Event chair not in Murmurant | Set eventChairId to null, log warning |
| Registration for unknown member | Skip registration, log error |
| Registration for unknown event | Skip registration, log error |

## 6. Sync Modes

### 6.1 Full Sync

**Purpose**: Initial load or recovery from corruption

**Behavior**:
- Fetch ALL records from WA
- Upsert ALL records in Murmurant
- Detect orphans (Murmurant records with no WA counterpart)
- Mark orphans as soft-deleted (deletedAt timestamp)

**Duration**: 15-30 minutes (depends on data volume)

**When to use**:
- Initial Murmurant deployment
- After WA data recovery
- Monthly reconciliation

### 6.2 Incremental Sync

**Purpose**: Daily sync of changes

**Behavior**:
- Fetch CHANGED records from WA (using filters)
- Upsert only changed records
- Do NOT detect orphans (full sync only)

**Filters**:
- Contacts: `'Profile last updated' gt {yesterday}`
- Events: `StartDate ge {today - 30 days}` (recent + future)
- Registrations: Re-fetch for all synced events

**Duration**: 2-5 minutes

**When to use**:
- Nightly cron job
- On-demand refresh

## 7. Soft Delete Detection

### 7.1 Tombstone Strategy

Records deleted from WA should not be hard-deleted from Murmurant.

```
For each Murmurant entity with WaIdMapping:
  If WA API returns 404 or entity not in full fetch:
    1. Set deletedAt = NOW() (soft delete)
    2. Create audit log entry (action: DELETE)
    3. Keep WaIdMapping record (for audit trail)
```

### 7.2 Recovery

If a "deleted" WA record reappears:
```
If Murmurant entity has deletedAt AND WA record exists:
  1. Set deletedAt = NULL (restore)
  2. Update fields from WA
  3. Create audit log entry (action: UPDATE, metadata: {restored: true})
```

## 8. Audit Logging

### 8.1 Per-Entity Audit

Every create/update/delete produces an audit log entry:

```typescript
await createAuditEntry({
  action: "CREATE" | "UPDATE" | "DELETE",
  resourceType: "Member" | "Event" | "EventRegistration",
  resourceId: entity.id,
  actor: { email: "system@importer", globalRole: "system", memberId: null },
  metadata: {
    source: "wa_import",
    syncRunId: runId,
    waId: waEntity.Id,
  },
});
```

### 8.2 Batch Audit

Each sync run produces a summary audit:

```typescript
await createAuditEntry({
  action: "CREATE",
  resourceType: "WaSyncRun",
  resourceId: runId,
  actor: systemActor,
  metadata: {
    mode: "full" | "incremental",
    startedAt: timestamp,
    finishedAt: timestamp,
    stats: {
      members: { created: N, updated: N, skipped: N, errors: N },
      events: { created: N, updated: N, skipped: N, errors: N },
      registrations: { created: N, updated: N, skipped: N, errors: N },
    },
  },
});
```

## 9. Failure Modes and Recovery

### 9.1 Transient Failures

| Failure | Detection | Recovery |
|---------|-----------|----------|
| Network timeout | HTTP timeout | Retry with exponential backoff (3 attempts) |
| WA rate limit | HTTP 429 | Wait for Retry-After header, then retry |
| WA server error | HTTP 5xx | Retry with backoff, fail after 3 attempts |
| Token expired | HTTP 401 | Refresh token, retry request |

### 9.2 Data Failures

| Failure | Detection | Recovery |
|---------|-----------|----------|
| Invalid email format | Validation | Skip member, log warning |
| Missing required field | Validation | Skip entity, log warning |
| FK reference missing | Lookup failure | Skip entity, log error |
| Duplicate email | Unique constraint | Use existing member, log warning |

### 9.3 Catastrophic Failures

| Failure | Detection | Recovery |
|---------|-----------|----------|
| Database connection lost | Prisma error | Abort sync, alert admin |
| WA API unavailable | All retries failed | Abort sync, alert admin |
| Disk full | Write error | Abort sync, alert admin |

### 9.4 Rollback Strategy

**Atomic transactions per batch**:
- Each entity batch (e.g., 100 members) is a single transaction
- If batch fails, entire batch is rolled back
- Sync continues with next batch
- Failed batches are logged for retry

**No full rollback**:
- Sync is additive/idempotent
- Re-running fixes partial failures
- Manual intervention only for data corruption

## 10. State Tracking

### 10.1 Sync State Table

```prisma
model WaSyncState {
  id              String   @id @default(uuid()) @db.Uuid
  lastFullSync    DateTime?
  lastIncSync     DateTime?
  lastContactSync DateTime?
  lastEventSync   DateTime?
  metadata        Json?    // Additional state
  updatedAt       DateTime @updatedAt
}
```

### 10.2 State Usage

```typescript
// Before incremental sync
const state = await prisma.waSyncState.findFirst();
const contactsModifiedSince = state?.lastContactSync ?? new Date(0);

// After successful sync
await prisma.waSyncState.upsert({
  where: { id: state?.id ?? "default" },
  update: { lastContactSync: new Date() },
  create: { id: "default", lastContactSync: new Date() },
});
```

## 11. Security Constraints

### 11.1 Credential Handling

- WA API key stored in environment variable `WA_API_KEY`
- Never logged, never in error messages
- Token cached in memory, not persisted

### 11.2 Production Safety

```typescript
// Scripts refuse to run against production without explicit opt-in
if (process.env.NODE_ENV === "production" && !process.env.ALLOW_PROD_IMPORT) {
  console.error("FATAL: Production import requires ALLOW_PROD_IMPORT=1");
  process.exit(1);
}
```

### 11.3 Dry Run Mode

```typescript
// DRY_RUN=1 previews changes without writing
if (process.env.DRY_RUN === "1") {
  console.log("[DRY RUN] Would create/update:", entity);
  return; // Skip actual database writes
}
```

## 12. Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Full sync duration | < 30 minutes | ~2000 members, 500 events |
| Incremental sync duration | < 5 minutes | ~50-100 changed records |
| Memory usage | < 512 MB | Streaming, not bulk load |
| Batch size | 100 entities | Balance speed vs memory |
| API requests/second | < 5 | Respect WA rate limits |

## 13. Monitoring

### 13.1 Metrics to Track

- Sync duration (full, incremental)
- Records processed (created, updated, skipped, errors)
- API request count and latency
- Error rate by type

### 13.2 Alerting

| Condition | Alert Level | Action |
|-----------|-------------|--------|
| Sync failed | Critical | Page on-call |
| Error rate > 5% | Warning | Review logs |
| Sync duration > 2x normal | Warning | Check WA API |
| No sync in 48 hours | Warning | Check cron |

## 14. Data Model Additions

### 14.1 WaIdMapping (New)

```prisma
model WaIdMapping {
  id         String   @id @default(uuid()) @db.Uuid
  entityType String   // "Member", "Event", "EventRegistration"
  waId       Int      // Wild Apricot integer ID
  murmurantId   String   @db.Uuid // Murmurant entity UUID
  syncedAt   DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([entityType, waId])
  @@index([entityType, murmurantId])
  @@index([syncedAt])
}
```

### 14.2 WaSyncState (New)

```prisma
model WaSyncState {
  id              String    @id @default(uuid()) @db.Uuid
  lastFullSync    DateTime?
  lastIncSync     DateTime?
  lastContactSync DateTime?
  lastEventSync   DateTime?
  lastRegSync     DateTime?
  metadata        Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

### 14.3 Soft Delete Fields (Add to existing models)

```prisma
model Member {
  // ... existing fields ...
  deletedAt DateTime? // Soft delete timestamp
  @@index([deletedAt])
}

model Event {
  // ... existing fields ...
  deletedAt DateTime? // Soft delete timestamp
  @@index([deletedAt])
}
```

## 15. Revision History

| Date | Author | Change |
|------|--------|--------|
| 2025-12-17 | System | Initial specification |
