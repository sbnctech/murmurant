# Migration Rollback & Recovery Specification

> **Status**: Draft
> **Related Issues**: #277 (D1: Rollback & Recovery Capability), #202 (Migration Wave)
> **Last Updated**: 2025-12-24

This document defines the rollback model for ClubOS migrations: what can be reverted, what cannot, and the required audit artifacts.

---

## Table of Contents

1. [Core Concepts](#1-core-concepts)
2. [What Can and Cannot Be Rolled Back](#2-what-can-and-cannot-be-rolled-back)
3. [Rollback Data Requirements](#3-rollback-data-requirements)
4. [Soft Rollback vs Hard Rollback](#4-soft-rollback-vs-hard-rollback)
5. [Operator Workflows](#5-operator-workflows)
6. [Rollback Checklists](#6-rollback-checklists)
7. [Open Questions](#7-open-questions)
8. [Revision History](#8-revision-history)

---

## 1. Core Concepts

### 1.1 Migration Run ID

Every migration run produces a unique identifier:

```
run-id: "abc12345-1234-5678-9abc-def012345678"
```

**Properties**:

- UUID v4 format, generated at run start
- Immutable once created
- Links all artifacts from a single run
- Enables precise rollback targeting

**Usage**:

- All bundle files include the run ID
- Audit logs reference the run ID
- Rollback operations specify the run ID

### 1.2 Bundle Hash

Each migration bundle receives a content-addressable hash:

```
bundle-hash: sha256:a1b2c3d4...
```

**Purpose**:

- Verify bundle integrity before rollback
- Detect tampering or corruption
- Enable reproducible rollback across environments

**Computed Over**:

- Source CSV files (content hash)
- Configuration YAML (content hash)
- ID mapping output (content hash)
- Report JSON (excluding timestamps)

### 1.3 ID-Map Immutability

The ID mapping file (`id-map-{mode}-{timestamp}.json`) is **write-once**:

| Property | Value |
|----------|-------|
| Created | Once per migration run |
| Modified | Never |
| Deleted | Only via explicit rollback |
| Format | Deterministic JSON (sorted keys, stable ordering) |

**Immutability Guarantees**:

- Same WA ID always maps to same ClubOS ID within a run
- Mappings preserve insertion order from source CSV
- No timestamps in mapping entries (only in report metadata)

**Violation Consequences**:

- Editing ID maps invalidates bundle hash
- Orphaned ClubOS records become unreferenceable
- Registration foreign keys may break

### 1.4 Replay Safety

Migration runs must be **idempotent** to support safe replay:

| Scenario | Expected Behavior |
|----------|-------------------|
| Replay same CSV, same config | No net changes (update timestamps only) |
| Replay same CSV, different config | Config-driven changes only |
| Replay different CSV, same config | Delta changes (new/updated/removed) |

**Replay Safety Rules**:

1. **Deterministic Ordering**: Records processed in CSV row order
2. **Stable ID Resolution**: Email-based member lookup, composite key for events
3. **Conflict Resolution**: Configurable (update vs skip)
4. **No Side Effects**: Dry-run mode produces identical plan without writes

---

## 2. What Can and Cannot Be Rolled Back

### 2.1 Rollback-Safe Operations

These operations can be fully reversed:

| Operation | Rollback Method | Data Loss |
|-----------|-----------------|-----------|
| Member CREATE | Delete record | None (new record) |
| Event CREATE | Delete record | None (new record) |
| Registration CREATE | Delete record | None (new record) |
| Member UPDATE (from migration) | Restore from snapshot | None |
| Event UPDATE (from migration) | Restore from snapshot | None |

### 2.2 Rollback-Unsafe Operations

These operations cannot be cleanly reversed:

| Operation | Why | Mitigation |
|-----------|-----|------------|
| User-initiated changes post-migration | Overwrites migration data | Preserve user changes, skip those records |
| Registration with attendance recorded | Business state changed | Warn operator, require confirmation |
| Member with payment history | Financial integrity | Block rollback, require manual review |
| Events with external calendar sync | External state changed | Require re-sync after rollback |

### 2.3 Rollback Boundaries

```
+-----------------------------------------------------------------+
|                       ROLLBACK BOUNDARY                         |
+-----------------------------------------------------------------+
|  OK  Records created by migration (trackable via run ID)       |
|  OK  Records updated by migration (snapshot available)         |
|  NO  Records modified by users after migration                 |
|  NO  Records referenced by external systems                    |
|  NO  Records with downstream business transactions             |
+-----------------------------------------------------------------+
```

---

## 3. Rollback Data Requirements

### 3.1 Minimum Artifacts for Rollback

Each migration run must produce and retain:

| Artifact | Purpose | Retention |
|----------|---------|-----------|
| `migration-{mode}-{ts}.json` | Summary report | Permanent |
| `migration-{mode}-{ts}-full.json` | Full report with records | 90 days |
| `id-map-{mode}-{ts}.json` | WA to ClubOS ID mapping | Permanent |
| `before-snapshot-{ts}.json` | Pre-migration state | 90 days |
| Audit log entries | Per-record trail | Permanent |

### 3.2 Before-Snapshot Format

Captures state of records that will be modified:

```json
{
  "runId": "abc12345-...",
  "capturedAt": "2024-03-15T10:00:00Z",
  "members": [
    {
      "id": "member-uuid-1",
      "email": "alice@example.com",
      "firstName": "Alice",
      "lastName": "Anderson",
      "phone": "805-555-0101",
      "joinedAt": "2024-01-15T00:00:00Z",
      "membershipStatusId": "status-uuid",
      "updatedAt": "2024-03-01T12:00:00Z"
    }
  ],
  "events": [],
  "registrations": []
}
```

**Snapshot Rules**:

- Capture only records that exist in ClubOS AND appear in migration CSV
- Exclude records that will be created (no prior state)
- Include all mutable fields, not just changed ones
- Timestamp with server time at capture

### 3.3 After-Snapshot Format

Records the post-migration state:

```json
{
  "runId": "abc12345-...",
  "capturedAt": "2024-03-15T10:05:00Z",
  "created": {
    "members": ["member-uuid-new-1", "member-uuid-new-2"],
    "events": ["event-uuid-new-1"],
    "registrations": ["reg-uuid-new-1", "reg-uuid-new-2"]
  },
  "updated": {
    "members": ["member-uuid-1"],
    "events": [],
    "registrations": []
  },
  "skipped": {
    "members": [],
    "events": ["event-uuid-existing-1"],
    "registrations": []
  }
}
```

### 3.4 Audit Log Requirements

Each migration action creates an audit entry:

```typescript
{
  action: "CREATE" | "UPDATE" | "SKIP",
  resourceType: "Member" | "Event" | "EventRegistration",
  resourceId: "uuid",
  actor: {
    email: "system@migration",
    globalRole: "system",
    memberId: null
  },
  metadata: {
    source: "wa_migration",
    runId: "abc12345-...",
    waId: "WA001",
    mode: "live" | "dry-run",
    previousState: {...} // for UPDATE only
  }
}
```

---

## 4. Soft Rollback vs Hard Rollback

### 4.1 Soft Rollback

**Definition**: Mark migrated records as deleted without removing data.

**Mechanism**:

```sql
-- For each record created by run ID
UPDATE Member SET deletedAt = NOW()
WHERE id IN (SELECT clubosId FROM migration_records WHERE runId = ?);

-- Restore updated records from snapshot
UPDATE Member SET
  firstName = snapshot.firstName,
  lastName = snapshot.lastName,
  ...
WHERE id = snapshot.id;
```

**Properties**:

| Property | Value |
|----------|-------|
| Data preserved | Yes (soft delete) |
| Reversible | Yes (undelete) |
| Performance | Fast (UPDATE only) |
| Foreign keys | Preserved (cascades soft-delete filter) |
| Audit trail | Maintained |

**When to Use**:

- Testing rollback procedure
- Temporary reversion pending investigation
- Preserving data for debugging

### 4.2 Hard Rollback

**Definition**: Permanently delete migrated records.

**Mechanism**:

```sql
-- Delete registrations first (FK constraint)
DELETE FROM EventRegistration
WHERE id IN (SELECT clubosId FROM migration_records
             WHERE runId = ? AND entityType = 'registration');

-- Delete events
DELETE FROM Event
WHERE id IN (SELECT clubosId FROM migration_records
             WHERE runId = ? AND entityType = 'event');

-- Delete members
DELETE FROM Member
WHERE id IN (SELECT clubosId FROM migration_records
             WHERE runId = ? AND entityType = 'member');

-- Restore updated records from snapshot
-- (same as soft rollback)
```

**Properties**:

| Property | Value |
|----------|-------|
| Data preserved | No (hard delete) |
| Reversible | No (requires re-migration) |
| Performance | Slower (DELETE + cascade) |
| Foreign keys | Broken if not ordered correctly |
| Audit trail | Preserved (records deletion) |

**When to Use**:

- Confirmed bad data that must not exist
- GDPR/privacy compliance requirements
- Storage reclamation after soft rollback period

### 4.3 Rollback Type Decision Matrix

```
                          +---------------------+
                          | Need to preserve    |
                          | data for analysis?  |
                          +----------+----------+
                                     |
                      +--------------+--------------+
                      |                             |
                     YES                           NO
                      |                             |
                      v                             v
             +---------------+             +---------------+
             | SOFT ROLLBACK |             | Are there     |
             +---------------+             | compliance    |
                                           | requirements? |
                                           +-------+-------+
                                                   |
                                    +--------------+--------------+
                                    |                             |
                                   YES                           NO
                                    |                             |
                                    v                             v
                           +---------------+             +---------------+
                           | HARD ROLLBACK |             | SOFT ROLLBACK |
                           | (after legal  |             | (default)     |
                           |  review)      |             +---------------+
                           +---------------+
```

---

## 5. Operator Workflows

### 5.1 Initiating a Rollback

**Prerequisites**:

1. Identify the run ID to roll back
2. Locate the bundle artifacts
3. Verify bundle integrity (hash check)
4. Assess rollback safety (no conflicting changes)

**Command** (proposed):

```bash
# Preview rollback
npx tsx scripts/migration/rollback.ts \
  --run-id "abc12345-..." \
  --mode soft \
  --dry-run

# Execute rollback
npx tsx scripts/migration/rollback.ts \
  --run-id "abc12345-..." \
  --mode soft \
  --confirm
```

### 5.2 Rollback Safety Check

Before executing rollback, the system checks:

```
+-----------------------------------------------------------------+
|                    ROLLBACK SAFETY CHECK                        |
+-----------------------------------------------------------------+
|                                                                 |
|  [1] Bundle Integrity                                           |
|      [ ] Bundle files exist                                     |
|      [ ] Hash matches computed value                            |
|      [ ] ID map is complete                                     |
|                                                                 |
|  [2] Conflicting Changes                                        |
|      [ ] No user modifications to migrated records              |
|      [ ] No downstream transactions (payments, attendance)      |
|      [ ] No external system references                          |
|                                                                 |
|  [3] Snapshot Availability                                      |
|      [ ] Before-snapshot exists for updated records             |
|      [ ] Snapshot data matches current schema                   |
|                                                                 |
|  [4] Authorization                                              |
|      [ ] Operator has MIGRATION_ADMIN role                      |
|      [ ] Two-person approval for production                     |
|                                                                 |
+-----------------------------------------------------------------+
```

### 5.3 Post-Rollback Verification

After rollback completes:

```
+-----------------------------------------------------------------+
|                 POST-ROLLBACK VERIFICATION                      |
+-----------------------------------------------------------------+
|                                                                 |
|  [1] Record Counts                                              |
|      [ ] Created records removed/soft-deleted                   |
|      [ ] Updated records restored to snapshot state             |
|      [ ] Total affected matches expected count                  |
|                                                                 |
|  [2] Data Integrity                                             |
|      [ ] No orphaned foreign keys                               |
|      [ ] No dangling ID mappings                                |
|      [ ] Referential integrity constraints pass                 |
|                                                                 |
|  [3] Application Health                                         |
|      [ ] Member list loads correctly                            |
|      [ ] Event list loads correctly                             |
|      [ ] Registration lookups work                              |
|                                                                 |
|  [4] Audit Trail                                                |
|      [ ] Rollback action logged                                 |
|      [ ] All affected records have rollback audit entry         |
|                                                                 |
+-----------------------------------------------------------------+
```

---

## 6. Rollback Checklists

### 6.1 Pre-Rollback Checklist

Use this checklist before initiating any rollback:

- [ ] **Identify scope**: Which run ID(s) to roll back?
- [ ] **Locate artifacts**: Do all bundle files exist?
- [ ] **Verify integrity**: Does bundle hash match?
- [ ] **Check timing**: How long since migration ran?
- [ ] **Assess conflicts**: Any user changes to migrated data?
- [ ] **Review dependencies**: Any downstream references?
- [ ] **Choose mode**: Soft or hard rollback?
- [ ] **Get approval**: Two-person sign-off for production?
- [ ] **Notify stakeholders**: Who needs to know?
- [ ] **Schedule window**: When to execute?

### 6.2 Rollback Execution Checklist

During rollback execution:

- [ ] **Dry run first**: Run with --dry-run flag
- [ ] **Review plan**: Verify affected record counts
- [ ] **Create backup**: Database snapshot before execution
- [ ] **Disable sync**: Pause any automated imports
- [ ] **Execute rollback**: Run with --confirm flag
- [ ] **Monitor progress**: Watch for errors
- [ ] **Verify completion**: Check exit code

### 6.3 Post-Rollback Checklist

After rollback completes:

- [ ] **Verify counts**: Match expected affected records
- [ ] **Check integrity**: Run FK constraint validation
- [ ] **Test application**: Verify UI/API functionality
- [ ] **Review audit log**: Confirm all actions logged
- [ ] **Update documentation**: Record rollback reason
- [ ] **Notify stakeholders**: Confirm completion
- [ ] **Re-enable sync**: Resume automated imports (if appropriate)
- [ ] **Monitor**: Watch for issues over next 24 hours

### 6.4 Emergency Rollback Runbook

For urgent situations requiring immediate rollback:

```
EMERGENCY ROLLBACK PROCEDURE
============================

1. STOP all running migrations
   $ pkill -f "migration/run.ts"

2. DISABLE automated syncs
   $ Update WA_SYNC_ENABLED=false in environment

3. IDENTIFY the problematic run
   $ ls -la output/migration-*.json | tail -5

4. VERIFY bundle integrity
   $ npx tsx scripts/migration/verify-bundle.ts --run-id <id>

5. EXECUTE soft rollback
   $ npx tsx scripts/migration/rollback.ts \
       --run-id <id> \
       --mode soft \
       --emergency \
       --confirm

6. VERIFY system health
   $ npm run test:smoke

7. DOCUMENT incident
   $ Create incident report in #operations

8. NOTIFY stakeholders
   $ Post in #clubos-alerts
```

---

## 7. Open Questions

The following questions must be resolved before implementation:

### 7.1 Storage and Retention

| Question | Options | Recommendation |
|----------|---------|----------------|
| Where to store snapshots? | Filesystem / S3 / Database | Filesystem for now, S3 for production |
| How long to retain full bundles? | 30 / 60 / 90 days | 90 days, then archive to cold storage |
| Should snapshots be compressed? | Yes / No | Yes (gzip), reduces storage by ~80% |

### 7.2 Authorization and Access Control

| Question | Options | Recommendation |
|----------|---------|----------------|
| Who can initiate rollback? | Any admin / Migration admin only | Migration admin role (to be created) |
| Require two-person approval? | Always / Production only / Never | Production only |
| How to authenticate rollback? | Session / API key / Hardware token | Session with MFA |

### 7.3 Conflict Detection

| Question | Options | Recommendation |
|----------|---------|----------------|
| How to detect user modifications? | updatedAt comparison / Change log / Audit trail | Audit trail (most reliable) |
| What if user modified migrated record? | Block rollback / Warn and skip / Force | Warn and skip (preserve user changes) |
| How to handle partial conflicts? | All-or-nothing / Per-record | Per-record with summary |

### 7.4 External System Integration

| Question | Options | Recommendation |
|----------|---------|----------------|
| How to handle calendar synced events? | Block rollback / Rollback + resync / Manual | Warn, rollback + document for resync |
| What about email notifications sent? | Ignore / Log only | Log only (cannot unsend) |
| Webhook deliveries? | Ignore / Send compensating events | Log only for now |

### 7.5 Performance and Scale

| Question | Options | Recommendation |
|----------|---------|----------------|
| Max records per rollback transaction? | 100 / 1000 / Unlimited | 1000 (batch for large rollbacks) |
| Timeout for rollback operation? | 5 / 15 / 30 minutes | 15 minutes, with resume capability |
| Should rollback be async? | Yes / No | Yes for >1000 records, with progress tracking |

### 7.6 Testing Requirements

| Question | Options | Recommendation |
|----------|---------|----------------|
| How to test rollback without production data? | Fixtures / Anonymized prod copy | Both (fixtures for CI, copy for staging) |
| Required test coverage? | Happy path only / Edge cases / Chaos | All three before production use |
| Rollback of rollback? | Support / Not support | Support (re-run original migration) |

---

## 8. Revision History

| Date | Author | Change |
|------|--------|--------|
| 2025-12-24 | Claude Code | Initial specification |

---

## References

- [IMPORTER_SYSTEM_SPEC.md](../IMPORTING/IMPORTER_SYSTEM_SPEC.md) - Import system specification
- [Issue #277](https://github.com/sbnctech/clubos/issues/277) - Rollback capability tracking issue
- [Issue #202](https://github.com/sbnctech/clubos/issues/202) - Migration Wave parent issue
