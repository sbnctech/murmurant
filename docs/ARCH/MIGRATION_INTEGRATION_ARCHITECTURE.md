<!--
  Copyright © 2025 Murmurant, Inc. All rights reserved.
-->

# F1: Migration Integration Architecture

```
Status: PROPOSED
Version: 1.0
Created: 2025-12-28
Related: WORK_QUEUE.md F1, IMPORTER_SYSTEM_SPEC.md, BUSINESS_MODEL_CANONICAL.md
```

---

## 1. Overview

This document defines the architecture for operating Murmurant as the UI layer while
Wild Apricot (WA) remains the system of record. This enables gradual migration with
minimal risk—organizations use the better MM interface while WA continues handling
critical operations during the transition period.

### 1.1 Migration Stages

| Stage | WA Role | MM Role | Duration |
|-------|---------|---------|----------|
| **Stage 0: Import Only** | Source of truth | Read-only mirror | Initial setup |
| **Stage 1: Hybrid Read** | Source of truth | UI + cached reads | Weeks 1-4 |
| **Stage 2: Hybrid Write** | Source of truth | UI + write-through | Weeks 4-8 |
| **Stage 3: MM Primary** | Backup/archive | Source of truth | Post-cutover |

This document focuses on **Stage 1 and Stage 2**—the hybrid period.

---

## 2. Data Authority Model

### 2.1 Entity Authority Matrix

Not all entities transfer authority at the same time. This matrix defines which
system is authoritative for each entity type during hybrid operation:

| Entity | Stage 1 (Hybrid Read) | Stage 2 (Hybrid Write) | Stage 3 (MM Primary) |
|--------|----------------------|------------------------|---------------------|
| **Members** | WA authoritative | WA authoritative | MM authoritative |
| **Membership Status** | WA authoritative | WA authoritative | MM authoritative |
| **Events** | WA authoritative | MM authoritative* | MM authoritative |
| **Registrations** | WA authoritative | WA authoritative | MM authoritative |
| **Payments** | WA authoritative | WA authoritative | MM authoritative** |
| **Pages/Content** | MM authoritative | MM authoritative | MM authoritative |
| **Governance** | MM authoritative | MM authoritative | MM authoritative |

*Events created in MM are written through to WA for registration processing
**Payments may remain WA authoritative if using WA payment processor

### 2.2 Authority Rules

**WA Authoritative** means:
- MM reads from WA (cached) for display
- MM writes to WA, then reads back confirmation
- WA is the "golden record" for reconciliation
- MM discards local state if conflict with WA

**MM Authoritative** means:
- MM is the source of truth
- WA is not consulted for this entity
- One-way sync TO WA (if needed for compatibility)

---

## 3. Read-Through Architecture

### 3.1 Pattern: Cached Read-Through

```
┌─────────┐     ┌─────────────┐     ┌──────────────┐     ┌────────┐
│  User   │────▶│  MM API     │────▶│  WA Cache    │────▶│  WA API│
│         │     │  Handler    │     │  Layer       │     │        │
└─────────┘     └─────────────┘     └──────────────┘     └────────┘
                      │                    │
                      │              ┌─────┴─────┐
                      │              │  Redis/   │
                      │              │  Memory   │
                      │              └───────────┘
                      │
                ┌─────┴─────┐
                │  MM DB    │
                │ (fallback)│
                └───────────┘
```

### 3.2 Cache Strategy

| Entity | Cache TTL | Refresh Trigger | Fallback |
|--------|-----------|-----------------|----------|
| Member profile | 5 minutes | On login, on edit | MM DB |
| Member list | 15 minutes | Manual refresh | MM DB |
| Event details | 5 minutes | On registration | MM DB |
| Event list | 15 minutes | Manual refresh | MM DB |
| Registration | 1 minute | On any reg action | MM DB |

### 3.3 Staleness Indicators

The UI MUST indicate data freshness:

```typescript
interface CachedData<T> {
  data: T;
  cachedAt: Date;
  source: 'wa_live' | 'wa_cached' | 'mm_fallback';
  stale: boolean; // true if cache TTL exceeded
}
```

UI displays:
- **Green dot**: Fresh from WA (< 5 min)
- **Yellow dot**: Cached (5-60 min)
- **Orange dot**: Stale (> 60 min) or MM fallback
- **Refresh button**: Manual cache invalidation

### 3.4 Cache Invalidation

| Event | Invalidation Scope |
|-------|-------------------|
| Member edits own profile | That member only |
| Admin edits member | That member only |
| Registration created | Event + member registrations |
| Event edited | That event only |
| Manual refresh clicked | Entire entity class |
| WA webhook received | Affected entities |

---

## 4. Write-Through Architecture

### 4.1 Pattern: Write-Through with Confirmation

```
┌─────────┐     ┌─────────────┐     ┌──────────────┐     ┌────────┐
│  User   │────▶│  MM API     │────▶│  WA Write    │────▶│  WA API│
│ Action  │     │  Handler    │     │  Proxy       │     │        │
└─────────┘     └─────────────┘     └──────────────┘     └────────┘
                      │                    │                  │
                      │                    │◀─────────────────┘
                      │                    │ (confirmation)
                      │              ┌─────┴─────┐
                      │              │  Verify   │
                      │              │  + Cache  │
                      │              └───────────┘
                      │
                ┌─────┴─────┐
                │  MM DB    │
                │ (shadow)  │
                └───────────┘
```

### 4.2 Write-Through Operations

| Operation | WA Endpoint | MM Behavior |
|-----------|-------------|-------------|
| Create member | POST /contacts | Write to WA → read back → update MM |
| Update member | PUT /contacts/{id} | Write to WA → verify → update MM |
| Create event | POST /events | Write to WA → read back → update MM |
| Register for event | POST /eventregistrations | Write to WA → verify → update MM |
| Cancel registration | DELETE /eventregistrations/{id} | Write to WA → verify → update MM |

### 4.3 Write Failure Handling

| Failure Type | Detection | Recovery |
|--------------|-----------|----------|
| WA timeout | HTTP timeout (30s) | Retry 2x, then queue for later |
| WA validation error | HTTP 400 | Show error to user, no retry |
| WA rate limit | HTTP 429 | Queue, retry after Retry-After |
| WA server error | HTTP 5xx | Retry 2x, then queue for later |
| WA conflict | HTTP 409 | Re-fetch WA state, re-present to user |

### 4.4 Queued Write Recovery

If write-through fails after retries:

1. Log failure with full request/response
2. Queue write in `WaPendingWrite` table
3. Show user: "Change saved locally, syncing to Wild Apricot..."
4. Background job retries every 5 minutes
5. After 1 hour, alert operator
6. After 24 hours, mark as FAILED, require manual resolution

```prisma
model WaPendingWrite {
  id          String   @id @default(uuid()) @db.Uuid
  entityType  String   // "Member", "Event", "Registration"
  operation   String   // "CREATE", "UPDATE", "DELETE"
  payload     Json     // Full request payload
  attempts    Int      @default(0)
  lastError   String?
  status      String   // "PENDING", "RETRYING", "FAILED", "SYNCED"
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  syncedAt    DateTime?

  @@index([status, createdAt])
}
```

---

## 5. Conflict Resolution

### 5.1 Conflict Detection

Conflicts occur when:
- User A edits member in MM while User B edits same member in WA
- WA data changes between MM cache read and write-through
- Network partition causes divergent state

### 5.2 Resolution Strategy: WA Wins

During hybrid operation, **WA always wins conflicts**:

```typescript
async function writeThrough(entity: Entity, changes: Partial<Entity>) {
  // 1. Read current WA state
  const waState = await waClient.get(entity.waId);

  // 2. Check for conflicts
  if (waState.updatedAt > entity.lastSyncedAt) {
    // WA was modified since we last synced
    return {
      conflict: true,
      waState,
      message: "This record was modified in Wild Apricot. Please review and retry.",
    };
  }

  // 3. Write to WA
  const result = await waClient.update(entity.waId, changes);

  // 4. Update MM with WA response (source of truth)
  await mmDb.update(entity.id, result);

  // 5. Invalidate cache
  await cache.invalidate(entity.type, entity.id);

  return { success: true };
}
```

### 5.3 Conflict UI

When conflict detected:

1. Show side-by-side comparison (MM version vs WA version)
2. Highlight differing fields
3. Options:
   - "Use Wild Apricot version" (discard MM changes)
   - "Apply my changes to current WA version" (merge)
   - "Cancel" (keep editing in MM)

---

## 6. Sync Frequency

### 6.1 Sync Modes

| Mode | Frequency | Entities | Purpose |
|------|-----------|----------|---------|
| **Real-time** | On demand | Single entity | User-triggered refresh |
| **Near-real-time** | 5 minutes | Changed entities | Background polling |
| **Batch** | Nightly | All entities | Full reconciliation |

### 6.2 Near-Real-Time Sync

Background job polls WA for recent changes:

```typescript
async function incrementalSync() {
  const lastSync = await getLastSyncTime();

  // Fetch contacts modified since last sync
  const modifiedContacts = await waClient.getContacts({
    filter: `'Profile last updated' gt ${lastSync.toISOString()}`,
  });

  for (const contact of modifiedContacts) {
    await upsertMember(contact);
    await invalidateCache('Member', contact.Id);
  }

  await setLastSyncTime(new Date());
}

// Run every 5 minutes
cron.schedule('*/5 * * * *', incrementalSync);
```

### 6.3 Nightly Reconciliation

Full sync with orphan detection:

```typescript
async function nightlyReconciliation() {
  // 1. Full sync from WA
  await fullSync();

  // 2. Detect orphans (in MM but not in WA)
  const orphans = await detectOrphans();

  // 3. Soft-delete orphans
  for (const orphan of orphans) {
    await softDelete(orphan);
    await auditLog('ORPHAN_DETECTED', orphan);
  }

  // 4. Report discrepancies
  await generateReconciliationReport();
}
```

---

## 7. Dependency Isolation

### 7.1 WA Client Wrapper

All WA API calls go through a wrapper that provides:

- Timeout enforcement (30s default)
- Retry with exponential backoff
- Rate limit handling
- Circuit breaker (stop calling if WA is down)
- Audit logging

```typescript
// src/lib/wa/client.ts
import { withDependencyIsolation } from '@/lib/reliability/isolation';

export const waClient = withDependencyIsolation({
  name: 'wild_apricot',
  timeout: 30_000,
  retries: 3,
  circuitBreaker: {
    failureThreshold: 5,
    resetTimeout: 60_000,
  },
  fallback: async (operation) => {
    // Return cached data if available
    const cached = await getFromCache(operation);
    if (cached) return { data: cached, source: 'cache' };
    throw new Error('WA unavailable and no cache');
  },
});
```

### 7.2 Graceful Degradation

When WA is unavailable:

| Operation | Degraded Behavior |
|-----------|------------------|
| Read member | Serve from MM cache (stale indicator) |
| Read event | Serve from MM cache (stale indicator) |
| Edit member | Queue write, show "syncing..." |
| Register | Queue write, show "pending confirmation" |
| Cancel registration | Queue write, show "pending confirmation" |
| Create event | Block (events need WA for registration) |

---

## 8. Audit and Observability

### 8.1 Audit Trail

Every WA interaction is logged:

```typescript
interface WaAuditEntry {
  timestamp: Date;
  operation: 'READ' | 'WRITE';
  endpoint: string;
  waEntityId: number;
  mmEntityId: string;
  requestPayload?: object; // For writes
  responseStatus: number;
  durationMs: number;
  source: 'user_action' | 'background_sync' | 'reconciliation';
  userId?: string; // If user-triggered
}
```

### 8.2 Metrics

Track for operational awareness:

| Metric | Alert Threshold |
|--------|-----------------|
| WA API latency p99 | > 5 seconds |
| WA API error rate | > 5% |
| Cache hit rate | < 80% |
| Pending writes queue depth | > 10 |
| Reconciliation discrepancies | > 1% of entities |

### 8.3 Operator Dashboard

Display:
- Last successful sync time
- Pending write queue status
- Cache health
- WA API status (circuit breaker state)
- Reconciliation report summary

---

## 9. Cutover Criteria

Transition from Stage 2 (Hybrid Write) to Stage 3 (MM Primary) requires:

### 9.1 Technical Readiness

- [ ] Zero pending writes for 48+ hours
- [ ] Reconciliation shows < 0.1% discrepancies
- [ ] All MM-created events successfully registered through WA
- [ ] All write-through operations have < 1% failure rate

### 9.2 Operational Readiness

- [ ] Operators trained on MM-only workflows
- [ ] Runbook for WA disconnection
- [ ] Rollback plan documented and tested
- [ ] WA export completed for archive

### 9.3 Stakeholder Approval

- [ ] Operator sign-off on cutover date
- [ ] 48-hour quiet period (no WA changes) before cutover
- [ ] Communication to members about transition

---

## 10. Implementation Phases

### Phase 1: WA API Proxy Layer (F2)

- Build `src/lib/wa/` with typed client
- Implement retry, rate limit, circuit breaker
- Add audit logging for all WA calls
- Use DEPENDENCY_ISOLATION wrapper

### Phase 2: Member Read-Through (F3)

- Implement member cache layer
- Add staleness indicators to UI
- Background polling for member changes
- Manual refresh functionality

### Phase 3: Event/Registration Write-Through (F4)

- Implement write-through for registrations
- Add pending write queue
- Conflict detection UI
- Registration confirmation flow

### Phase 4: Gradual Cutover (F5)

- Per-entity authority switch
- Reconciliation tooling
- Cutover checklist automation
- Post-cutover monitoring

---

## 11. Open Questions

| Question | Status | Owner |
|----------|--------|-------|
| WA webhook support for real-time sync? | TBD | Engineering |
| Payment processor during hybrid? | WA handles | Business |
| Email sending during hybrid? | TBD | Business |
| Member self-service edits route? | Through WA | Engineering |

---

## 12. Related Documents

| Document | Relationship |
|----------|--------------|
| [IMPORTER_SYSTEM_SPEC.md](../IMPORTING/IMPORTER_SYSTEM_SPEC.md) | One-way import (Stage 0) |
| [BUSINESS_MODEL_CANONICAL.md](../BIZ/BUSINESS_MODEL_CANONICAL.md) | Migration philosophy |
| [WORK_QUEUE.md](../backlog/WORK_QUEUE.md) | F1-F5 task definitions |
| [DEPENDENCY_ISOLATION](../reliability/DEPENDENCY_ISOLATION.md) | Isolation patterns |

---

_This document defines architecture for F1. Implementation begins with F2 (WA API Proxy Layer)._
