# Migration Rollback and Recovery Guide

This document defines failure modes, safe checkpoints, and rollback procedures for Wild Apricot migrations.

**Related**: Issue #277 (Rollback & Recovery Capability), #202 (Migration Wave)

---

## Table of Contents

1. [Failure Modes](#1-failure-modes)
2. [Safe Checkpoints](#2-safe-checkpoints)
3. [Rollback Levels](#3-rollback-levels)
4. [Recovery Procedures by Scenario](#4-recovery-procedures-by-scenario)
5. [Audit Trail Expectations](#5-audit-trail-expectations)
6. [Pre-Migration Checklist](#6-pre-migration-checklist)
7. [Post-Recovery Verification](#7-post-recovery-verification)

---

## 1. Failure Modes

### 1.1 Partial Import

**Description**: Import halts midway, leaving the database in an incomplete state.

| Symptom | Example |
|---------|---------|
| Some members imported, others missing | 500/2000 members present |
| Events imported but registrations failed | Events visible, no attendees |
| Transaction rolled back mid-batch | Batch 5/20 failed |

**Causes**:
- Network interruption to WA API
- Database connection timeout
- Memory exhaustion on large datasets
- Rate limiting exceeded retry budget

**Risk Level**: Medium - Data is incomplete but not corrupted

### 1.2 Wrong Mappings

**Description**: WA IDs mapped to incorrect Murmurant records.

| Symptom | Example |
|---------|---------|
| Member linked to wrong person | Alice's WA ID points to Bob's Murmurant record |
| Event registrations on wrong event | Registrations from Event A on Event B |
| Duplicate mappings | Same WA ID mapped twice |

**Causes**:
- Bug in matching logic
- Stale cache during re-import
- Concurrent imports creating race conditions
- Manual database edits conflicting with import

**Risk Level**: High - Affects data integrity and user trust

### 1.3 Bad Tier Mapping

**Description**: Members assigned incorrect membership tiers.

| Symptom | Example |
|---------|---------|
| All members as PROSPECT | Tier mapping config missing |
| Wrong tier for membership level | "2nd Year" mapped to ALUMNI |
| Null tiers | Tier FK constraint violations |

**Causes**:
- Misconfigured `membership_status_mapping` in config
- Missing tier seed data
- WA membership level name changed

**Risk Level**: Medium - Affects eligibility calculations

### 1.4 Duplicate IDs

**Description**: Same entity imported multiple times with different Murmurant IDs.

| Symptom | Example |
|---------|---------|
| Member appears twice in list | Same email, two UUIDs |
| Duplicate events | Same event title/date, different IDs |
| Split registrations | Same registration split across duplicates |

**Causes**:
- ID reconciliation key mismatch
- Import run without checking existing mappings
- Composite key fields changed in source

**Risk Level**: High - Requires manual deduplication

### 1.5 Wrong Org Policies

**Description**: Imported data violates organization-specific business rules.

| Symptom | Example |
|---------|---------|
| Events exceed capacity limits | Event imported with 500 capacity, org limit is 100 |
| Members in wrong visibility groups | Private members visible publicly |
| Invalid date ranges | Events with end before start |

**Causes**:
- Source data not validated against Murmurant policies
- Policy configuration changed after import started
- Transform functions not applying org rules

**Risk Level**: Medium - May expose incorrect data to users

### 1.6 Operator Error

**Description**: Human mistake during migration operation.

| Symptom | Example |
|---------|---------|
| Wrong environment targeted | Dev data imported to prod |
| Incorrect config file used | Staging config on production |
| Premature execution | Full import before dry run |

**Causes**:
- Missing safety checks
- Unclear environment indicators
- Copy-paste errors in commands

**Risk Level**: Critical - May require full database restore

---

## 2. Safe Checkpoints

### 2.1 Pre-Run Snapshot

**When**: Before any import begins

**What to Capture**:

```sql
-- TBD: Automated snapshot command
-- For now, use manual pg_dump

pg_dump -Fc -f "backup_$(date +%Y%m%d_%H%M%S).dump" $DATABASE_URL
```

**Retention**: Keep for at least 7 days post-migration

**Verification**:
- File size matches expected range
- Can be restored to test environment
- Timestamp recorded in migration log

### 2.2 Dry-Run Artifacts

**When**: After every `DRY_RUN=1` execution

**What to Capture**:

```bash
# Dry run generates these artifacts:
# - Summary counts (would create/update/skip)
# - Sample transformed records
# - Validation warnings

DRY_RUN=1 npx tsx scripts/importing/wa_full_sync.ts 2>&1 | tee dry_run_$(date +%Y%m%d_%H%M%S).log
```

**Review Before Proceeding**:
- [ ] "Would create" counts match expected
- [ ] No unexpected "would skip" entries
- [ ] Transformation warnings reviewed

### 2.3 Bundle Hash

**When**: After generating migration bundle (TBD implementation)

**Purpose**: Cryptographic proof of import contents

```bash
# TBD: Migration bundle generation
# npx tsx scripts/migration/generate-bundle.ts --output bundle.json

# Hash verification
shasum -a 256 bundle.json > bundle.sha256
```

**Usage**:
- Compare before/after to detect tampering
- Include in audit log
- Reference in rollback requests

### 2.4 Post-Run Validation

**When**: Immediately after import completes

**What to Check**:

```sql
-- Count verification
SELECT
  (SELECT COUNT(*) FROM "Member") as members,
  (SELECT COUNT(*) FROM "Event") as events,
  (SELECT COUNT(*) FROM "Registration") as registrations,
  (SELECT COUNT(*) FROM "WaIdMapping") as mappings;

-- Orphan check
SELECT COUNT(*) FROM "WaIdMapping" wm
LEFT JOIN "Member" m ON wm."murmurantId" = m.id AND wm."entityType" = 'Member'
WHERE m.id IS NULL AND wm."entityType" = 'Member';
```

**Store Results**: Log to audit trail with run_id

---

## 3. Rollback Levels

### Level 0: Stop and Do Nothing

**Trigger**: Dry run reveals problems before any writes occur

**Actions**:
1. Do not proceed with live import
2. Document issues found
3. Fix configuration or source data
4. Re-run dry run

**Commands**:
```bash
# No rollback needed - nothing was written
# Just fix the issue and retry dry run
DRY_RUN=1 npx tsx scripts/importing/wa_full_sync.ts
```

**Recovery Time**: Immediate

**Data Impact**: None

---

### Level 1: Revert Records for Single Run ID

**Trigger**: Import completed but with errors discovered post-hoc

**Scope**: Only records created/modified by specific import run

**Prerequisites**:
- `run_id` from import execution
- Records tagged with `importRunId` metadata
- WaIdMapping entries with run_id

**Actions**:

```sql
-- TBD: Automated rollback command
-- npx tsx scripts/migration/rollback.ts --run-id <RUN_ID>

-- Manual approach (DANGER - verify run_id first):

-- 1. Find affected records
SELECT id, "entityType", "waId" FROM "WaIdMapping"
WHERE "syncRunId" = '<RUN_ID>';

-- 2. Delete registrations from this run
DELETE FROM "Registration" r
USING "WaIdMapping" wm
WHERE wm."murmurantId" = r.id
  AND wm."entityType" = 'Registration'
  AND wm."syncRunId" = '<RUN_ID>';

-- 3. Delete events from this run
DELETE FROM "Event" e
USING "WaIdMapping" wm
WHERE wm."murmurantId" = e.id
  AND wm."entityType" = 'Event'
  AND wm."syncRunId" = '<RUN_ID>';

-- 4. Delete members from this run (if applicable)
-- CAUTION: Members may have other associations
DELETE FROM "Member" m
USING "WaIdMapping" wm
WHERE wm."murmurantId" = m.id
  AND wm."entityType" = 'Member'
  AND wm."syncRunId" = '<RUN_ID>';

-- 5. Clear the mappings
DELETE FROM "WaIdMapping"
WHERE "syncRunId" = '<RUN_ID>';

-- 6. Log the rollback
INSERT INTO "AuditLog" (action, metadata)
VALUES ('migration:rollback:level1', '{"run_id": "<RUN_ID>"}');
```

**Recovery Time**: 5-15 minutes depending on record count

**Data Impact**: Records from specified run removed

---

### Level 2: Restore Database Snapshot

**Trigger**: Widespread data corruption or operator error affecting multiple runs

**Scope**: Full database state restoration

**Prerequisites**:
- Valid backup file from pre-migration
- Maintenance window coordinated
- All dependent services stopped

**Actions**:

```bash
# 1. Stop application
# TBD: Application shutdown command

# 2. Create safety backup of current state
pg_dump -Fc -f "pre_restore_$(date +%Y%m%d_%H%M%S).dump" $DATABASE_URL

# 3. Restore from pre-migration backup
pg_restore --clean --if-exists -d $DATABASE_URL backup_20241215_100000.dump

# 4. Verify restoration
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Member\";"

# 5. Restart application
# TBD: Application restart command

# 6. Log the restoration
psql $DATABASE_URL -c "INSERT INTO \"AuditLog\" (action, metadata)
VALUES ('migration:rollback:level2', '{\"restored_from\": \"backup_20241215_100000.dump\"}');"
```

**Recovery Time**: 15-60 minutes depending on database size

**Data Impact**: All changes since backup are lost

---

## 4. Recovery Procedures by Scenario

### 4.1 Partial Import Recovery

**Scenario**: Import stopped at batch 15/50

**Procedure**:
1. Check last successful batch in logs
2. Note the `run_id` of failed import
3. Option A: Re-run import (idempotent design will skip completed records)
4. Option B: Level 1 rollback, then fresh import

```bash
# Option A: Just re-run (recommended)
npx tsx scripts/importing/wa_full_sync.ts

# Option B: Rollback then re-run
# TBD: npx tsx scripts/migration/rollback.ts --run-id <RUN_ID>
npx tsx scripts/importing/wa_full_sync.ts
```

### 4.2 Wrong Mapping Recovery

**Scenario**: WA Contact 12345 mapped to wrong Murmurant member

**Procedure**:
1. Identify correct Murmurant member ID
2. Update mapping record
3. Audit log the correction

```sql
-- Find the bad mapping
SELECT * FROM "WaIdMapping"
WHERE "waId" = '12345' AND "entityType" = 'Member';

-- Correct it (after identifying right murmurantId)
UPDATE "WaIdMapping"
SET "murmurantId" = '<CORRECT_UUID>'
WHERE "waId" = '12345' AND "entityType" = 'Member';

-- Log the fix
INSERT INTO "AuditLog" (action, metadata)
VALUES ('migration:mapping:corrected',
  '{"waId": "12345", "oldMurmurantId": "<WRONG_UUID>", "newMurmurantId": "<CORRECT_UUID>"}');
```

### 4.3 Bad Tier Recovery

**Scenario**: All members assigned wrong tier

**Procedure**:
1. Fix tier mapping configuration
2. Re-run import to update tiers
3. Verify corrections

```bash
# 1. Edit config to fix mapping
# (Update membership_status_mapping in config file)

# 2. Re-run to correct tiers (import is idempotent)
npx tsx scripts/importing/wa_full_sync.ts

# 3. Verify
psql $DATABASE_URL -c "
SELECT mt.code, COUNT(*)
FROM \"Member\" m
JOIN \"MembershipTier\" mt ON m.\"membershipTierId\" = mt.id
GROUP BY mt.code;"
```

### 4.4 Duplicate Resolution

**Scenario**: Member imported twice with different IDs

**Procedure**:
1. Identify duplicate records
2. Choose canonical record (usually the one with more associations)
3. Merge data if needed
4. Delete duplicate
5. Update mapping to point to canonical

```sql
-- Find duplicates by email
SELECT email, array_agg(id) as ids, COUNT(*)
FROM "Member"
GROUP BY email
HAVING COUNT(*) > 1;

-- TBD: Automated merge command
-- npx tsx scripts/migration/merge-duplicates.ts --email user@example.com

-- Manual merge (DANGER - verify carefully):
-- 1. Move registrations to canonical member
UPDATE "Registration"
SET "memberId" = '<CANONICAL_UUID>'
WHERE "memberId" = '<DUPLICATE_UUID>';

-- 2. Delete duplicate
DELETE FROM "Member" WHERE id = '<DUPLICATE_UUID>';

-- 3. Update mapping
UPDATE "WaIdMapping"
SET "murmurantId" = '<CANONICAL_UUID>'
WHERE "murmurantId" = '<DUPLICATE_UUID>' AND "entityType" = 'Member';
```

---

## 5. Audit Trail Expectations

### 5.1 Required Audit Entries

Every migration operation MUST create audit log entries:

| Action | When | Metadata Required |
|--------|------|-------------------|
| `migration:started` | Import begins | run_id, mode (dry/live), operator |
| `migration:completed` | Import finishes | run_id, counts, duration |
| `migration:failed` | Import errors | run_id, error, last_batch |
| `migration:rollback:level1` | Single-run rollback | run_id, records_affected |
| `migration:rollback:level2` | Snapshot restore | backup_file, restore_time |
| `migration:mapping:corrected` | Mapping fixed | waId, old/new murmurantId |

### 5.2 Audit Query Examples

```sql
-- All migration activity for a run
SELECT * FROM "AuditLog"
WHERE action LIKE 'migration:%'
  AND metadata->>'run_id' = '<RUN_ID>'
ORDER BY "createdAt";

-- All rollbacks in last 30 days
SELECT * FROM "AuditLog"
WHERE action LIKE 'migration:rollback:%'
  AND "createdAt" > NOW() - INTERVAL '30 days';

-- Who ran imports this month
SELECT
  metadata->>'operator' as operator,
  COUNT(*) as imports,
  SUM((metadata->>'duration')::int) as total_seconds
FROM "AuditLog"
WHERE action = 'migration:completed'
  AND "createdAt" > DATE_TRUNC('month', NOW())
GROUP BY metadata->>'operator';
```

### 5.3 Retention Policy

- **Migration audit logs**: Retain for 2 years minimum
- **Pre-migration snapshots**: Retain for 30 days
- **Dry-run artifacts**: Retain for 7 days

---

## 6. Pre-Migration Checklist

Before any production migration:

- [ ] **Backup created** - `pg_dump` completed and verified
- [ ] **Dry run executed** - Results reviewed and approved
- [ ] **Config reviewed** - Tier/status mappings checked
- [ ] **Maintenance window** - Scheduled if needed
- [ ] **Rollback plan** - Level 1 or 2 predetermined
- [ ] **Operator identified** - Who is running this, logged
- [ ] **Stakeholders notified** - Board/ops aware of migration

### Verification Commands

```bash
# Verify backup exists and is recent
ls -la backups/*.dump | tail -1

# Verify dry run was recent
ls -la dry_run_*.log | tail -1

# Verify environment
echo "Target: $DATABASE_URL" | grep -o 'localhost\|prod\|staging'
```

---

## 7. Post-Recovery Verification

After any rollback, verify:

### 7.1 Data Integrity

```sql
-- No orphaned mappings
SELECT COUNT(*) as orphaned_members FROM "WaIdMapping" wm
LEFT JOIN "Member" m ON wm."murmurantId" = m.id AND wm."entityType" = 'Member'
WHERE m.id IS NULL AND wm."entityType" = 'Member';

-- No orphaned registrations
SELECT COUNT(*) as orphaned_regs FROM "Registration" r
LEFT JOIN "Member" m ON r."memberId" = m.id
WHERE m.id IS NULL;

-- Counts match expectations
SELECT
  (SELECT COUNT(*) FROM "Member") as members,
  (SELECT COUNT(*) FROM "Event") as events,
  (SELECT COUNT(*) FROM "Registration") as registrations;
```

### 7.2 Application Health

```bash
# API health check
curl http://localhost:3000/api/v1/health

# Auth still works
# TBD: Auth verification command

# Key pages load
curl -s http://localhost:3000/admin/members | head -1
```

### 7.3 Sync State Reset

After Level 2 rollback, sync state needs attention:

```sql
-- Check sync state
SELECT * FROM "WaSyncState";

-- If needed, reset to force full re-sync
-- TBD: Automated sync state reset
UPDATE "WaSyncState" SET "lastFullSync" = NULL, "lastIncSync" = NULL;
```

---

## Quick Reference Card

| Failure | Rollback Level | Time | Command |
|---------|----------------|------|---------|
| Dry run issues | 0 | Immediate | Fix config, retry |
| Single bad run | 1 | 5-15 min | TBD: `rollback.ts --run-id` |
| Multiple bad runs | 2 | 15-60 min | `pg_restore` |
| Wrong mappings | Manual | Varies | SQL UPDATE |
| Duplicates | Manual | Varies | TBD: `merge-duplicates.ts` |

---

## Appendix: TBD Commands

The following commands are referenced but not yet implemented:

| Command | Purpose | Issue |
|---------|---------|-------|
| `scripts/migration/rollback.ts` | Automated Level 1 rollback | #277 |
| `scripts/migration/merge-duplicates.ts` | Duplicate resolution | #277 |
| `scripts/migration/generate-bundle.ts` | Bundle generation with hash | #277 |
| Application shutdown/restart | Graceful service control | Ops |

These should be implemented as part of Issue #277 to complete the rollback capability.
