# Production Migration Runbook

Operator-grade runbook for migrating Wild Apricot data to ClubOS in production.

**Status:** Production-Ready
**Last Updated:** 2025-12-25
**Related:** Epic #202, #275, #276, #277, #278

---

## Overview

This runbook covers the complete end-to-end migration process from Wild Apricot to ClubOS. It supports two execution modes:

| Mode | Database Writes | Artifacts | Use Case |
|------|-----------------|-----------|----------|
| **DRY RUN** | None | Reports, ID mappings | Validation before production |
| **LIVE RUN** | Yes | Reports, ID mappings, run_id | Production migration |

**Key Principle:** Always run DRY RUN first. Never proceed to LIVE RUN without a successful dry run.

---

## Phase 0: Credentials and Access

### Required Access

| System | Access Level | Purpose |
|--------|--------------|---------|
| Wild Apricot | Admin | Export CSV data |
| ClubOS Production DB | Read/Write | Execute migration |
| ClubOS Server | SSH | Run migration scripts |
| Backup System | Read | Verify backups exist |

### Environment Setup

```bash
# Verify environment
echo $DATABASE_URL  # Must point to production
echo $NODE_ENV      # Should be "production"

# Verify Prisma client
npx prisma generate

# Verify migration scripts exist
ls scripts/migration/migrate.ts
ls scripts/migration/capture-policies.ts
ls scripts/migration/seed-membership-tiers.ts
```

---

## Phase 1: Pre-Flight Checklist

**Complete ALL items before proceeding. Do not skip any step.**

### 1.1 Policy Bundle Validated

```bash
# Generate or validate policy bundle
npx tsx scripts/migration/capture-policies.ts \
  --validate-only \
  --mapping-file ./migration-input/policy.json

# Expected: "Validation PASSED" with zero errors
```

**Abort if:** Policy validation fails. Fix all errors first.

### 1.2 Tier Mapping Confirmed

```bash
# Verify membership tiers are seeded
npx tsx scripts/migration/seed-membership-tiers.ts --dry-run

# Expected: Shows tier mapping without errors
```

**Abort if:** Tier seeding fails or mappings are incorrect.

### 1.3 Invariants Pass

```bash
# Run dry run to generate artifacts
npx tsx scripts/migration/migrate.ts \
  --data-dir ./wa-export \
  --verbose

# Check invariants on output
# TODO: Add CLI command for standalone invariant check
# For now, review migration-dry-run-*.json manually
cat migration-reports/migration-dry-run-*.json | jq '.summary'
```

**Abort if:** Dry run has errors or invariant violations.

### 1.4 Backup Confirmed

```bash
# Create timestamped backup
pg_dump "$DATABASE_URL" > backup-pre-migration-$(date +%Y%m%d-%H%M%S).sql

# Verify backup is non-empty
ls -lh backup-pre-migration-*.sql
wc -l backup-pre-migration-*.sql
```

**Abort if:** Backup fails or file is empty.

### 1.5 Pre-Flight Sign-Off

Before proceeding, confirm:

- [ ] Policy bundle validation: PASSED
- [ ] Tier mapping: VERIFIED
- [ ] Dry run: COMPLETED with zero errors
- [ ] Database backup: CREATED and verified
- [ ] Merge Captain approval: OBTAINED

---

## Phase 2: DRY RUN Execution

DRY RUN produces all artifacts without writing to the database.

### 2.1 Execute Dry Run

```bash
npx tsx scripts/migration/migrate.ts \
  --data-dir ./wa-export \
  --members members/wa-members-export.csv \
  --events events/wa-events-export.csv \
  --registrations events/wa-registrations-export.csv \
  --output-report ./migration-reports \
  --verbose
```

### 2.2 Verify Dry Run Output

```bash
# Check summary
cat migration-reports/migration-dry-run-*.json | jq '.summary'

# Expected output structure:
# {
#   "totalRecords": N,
#   "created": N,
#   "updated": N,
#   "skipped": N,
#   "errors": 0,    <-- MUST be zero
#   "duration_ms": N
# }

# Check ID mapping
cat migration-reports/id-map-dry-run-*.json | jq '.members.counts, .events.counts'

# Check for duplicates (must be empty)
cat migration-reports/id-map-dry-run-*.json | jq '.members.duplicateWaIds, .events.duplicateWaIds'
```

### 2.3 Dry Run Abort Criteria

**STOP and do not proceed to LIVE RUN if:**

| Condition | Action |
|-----------|--------|
| `summary.errors > 0` | Review errors, fix source data |
| Duplicate WA IDs found | Investigate source data |
| Missing required fields | Re-export from WA with all fields |
| Record counts don't match source | Investigate parsing issues |

---

## Phase 3: LIVE RUN Execution

**Only proceed after successful DRY RUN with zero errors.**

### 3.1 Final Pre-Live Checklist

- [ ] Dry run completed within last 24 hours
- [ ] No changes to source data since dry run
- [ ] Backup verified within last hour
- [ ] No other database operations in progress
- [ ] Merge Captain has approved live run

### 3.2 Execute Live Run

```bash
# Live run with confirmation bypass
npx tsx scripts/migration/migrate.ts \
  --data-dir ./wa-export \
  --members members/wa-members-export.csv \
  --events events/wa-events-export.csv \
  --registrations events/wa-registrations-export.csv \
  --output-report ./migration-reports \
  --live \
  --yes \
  --verbose
```

### 3.3 Live Run Abort Criteria

**STOP IMMEDIATELY if any of these occur:**

| Trigger | Action |
|---------|--------|
| Database connection lost | Stop, verify DB state, assess damage |
| More than 10 consecutive errors | Stop, do not continue |
| "Fatal error" message | Stop, restore from backup |
| Duplicate key violations | Stop, check for prior partial run |
| Memory exhaustion | Stop, reduce batch size |
| Disk space warning | Stop, free space |

### 3.4 Capture Run ID

After successful live run, record the run_id:

```bash
# Extract run_id from report
cat migration-reports/migration-live-*.json | jq -r '.runId'

# Record for rollback reference
echo "Run ID: $(cat migration-reports/migration-live-*.json | jq -r '.runId')"
```

---

## Phase 4: Post-Run Verification

### 4.1 Count Verification

```bash
# Get expected counts from migration report
cat migration-reports/migration-live-*.json | jq '.members.created, .events.created, .registrations.created'

# Compare with database counts
psql "$DATABASE_URL" -c "SELECT COUNT(*) as members FROM \"Member\";"
psql "$DATABASE_URL" -c "SELECT COUNT(*) as events FROM \"Event\";"
psql "$DATABASE_URL" -c "SELECT COUNT(*) as registrations FROM \"Registration\";"
```

| Entity | Report Count | DB Count | Match |
|--------|--------------|----------|-------|
| Members | _____ | _____ | [ ] |
| Events | _____ | _____ | [ ] |
| Registrations | _____ | _____ | [ ] |

### 4.2 Spot Checks

Verify 5-10 random records manually:

```bash
# Sample member spot check
psql "$DATABASE_URL" -c "
  SELECT m.id, m.email, m.\"firstName\", m.\"lastName\", m.\"waContactId\"
  FROM \"Member\" m
  WHERE m.\"waContactId\" IS NOT NULL
  ORDER BY RANDOM()
  LIMIT 5;
"
```

**Verify for each record:**
- [ ] Name matches source CSV
- [ ] Email matches source CSV
- [ ] Membership tier assigned (if applicable)
- [ ] No data corruption

### 4.3 Referential Integrity

```bash
# No orphaned registrations (member)
psql "$DATABASE_URL" -c "
  SELECT COUNT(*) as orphaned_member
  FROM \"Registration\" r
  LEFT JOIN \"Member\" m ON r.\"memberId\" = m.id
  WHERE m.id IS NULL;
"
# Expected: 0

# No orphaned registrations (event)
psql "$DATABASE_URL" -c "
  SELECT COUNT(*) as orphaned_event
  FROM \"Registration\" r
  LEFT JOIN \"Event\" e ON r.\"eventId\" = e.id
  WHERE e.id IS NULL;
"
# Expected: 0

# No duplicate WA IDs
psql "$DATABASE_URL" -c "
  SELECT \"waContactId\", COUNT(*) as count
  FROM \"Member\"
  WHERE \"waContactId\" IS NOT NULL
  GROUP BY \"waContactId\"
  HAVING COUNT(*) > 1;
"
# Expected: 0 rows
```

### 4.4 Application Smoke Test

- [ ] Admin dashboard loads without errors
- [ ] Member list displays imported members
- [ ] Event list displays imported events
- [ ] Member detail page works
- [ ] Event detail page works
- [ ] No JavaScript console errors

---

## Phase 5: Rollback (If Needed)

Use rollback only if critical issues are discovered post-migration.

### 5.1 Rollback Decision Criteria

| Condition | Rollback? |
|-----------|-----------|
| Data corruption discovered | Yes |
| Wrong source data used | Yes |
| Critical business logic broken | Yes |
| Minor data issues (< 1% records) | No - fix in place |
| Missing optional fields | No - backfill later |

### 5.2 Rollback Options

**Option A: Targeted Rollback (Preferred)**

```bash
# TODO: rollback.ts CLI is pending implementation
# For now, use database restore

# Reference the run_id from the migration report
RUN_ID="<run_id_from_report>"
```

**Option B: Database Restore**

```bash
# Full database restore (removes ALL changes since backup)
psql "$DATABASE_URL" < backup-pre-migration-YYYYMMDD-HHMMSS.sql
```

**Related:** Issue #277 (Rollback & Recovery)

---

## Phase 6: Completion

### 6.1 Archive Reports

```bash
# Archive all migration artifacts
tar -czvf migration-complete-$(date +%Y%m%d-%H%M%S).tar.gz \
  migration-reports/ \
  migration-input/

# Move to safe storage
mv migration-complete-*.tar.gz /path/to/archives/
```

### 6.2 Post-Migration Sign-Off

```
============================================
MIGRATION COMPLETION CERTIFICATE
============================================

Migration Run ID: _______________________
Date/Time Started: _______________________
Date/Time Completed: _______________________

Records Imported:
  Members: _______
  Events: _______
  Registrations: _______

Verification:
  [ ] Count verification passed
  [ ] Spot checks passed (___/5 records)
  [ ] Referential integrity passed
  [ ] Application smoke test passed

Operator: _______________________
Merge Captain Approval: _______________________
Date: _______________________
============================================
```

---

## Quick Reference

### Command Summary

```bash
# Policy capture
npx tsx scripts/migration/capture-policies.ts --generate-template
npx tsx scripts/migration/capture-policies.ts --validate-only --mapping-file policy.json

# Tier seeding
npx tsx scripts/migration/seed-membership-tiers.ts --dry-run
npx tsx scripts/migration/seed-membership-tiers.ts

# Migration
npx tsx scripts/migration/migrate.ts --data-dir ./wa-export --verbose          # DRY RUN
npx tsx scripts/migration/migrate.ts --data-dir ./wa-export --live --yes        # LIVE RUN
```

### Key Files

| File | Purpose |
|------|---------|
| `scripts/migration/migrate.ts` | Main migration CLI |
| `scripts/migration/capture-policies.ts` | Policy capture CLI |
| `scripts/migration/seed-membership-tiers.ts` | Tier seeding CLI |
| `scripts/migration/lib/invariants.ts` | Validation functions |
| `migration-reports/` | Output artifacts |

### Related Documentation

- [WA Policy Capture](./WA_POLICY_CAPTURE.md) - Policy capture details
- [Migration Invariants](../ARCH/MIGRATION_INVARIANTS.md) - Validation rules
- [Membership Tier Decision](../ARCH/MEMBERSHIP_TIER_SCHEMA_DECISION.md) - Tier handling

---

## Known Limitations

### TODO Items

| Item | Status | Notes |
|------|--------|-------|
| Standalone invariant check CLI | Pending | Currently manual JSON review |
| Rollback CLI (`rollback.ts`) | Pending | Use database restore for now |
| Incremental migration | Not supported | Full import only |
| Multi-org migration | Not supported | Single org per run |

### Feature Flags

| Flag | Default | Purpose |
|------|---------|---------|
| `membership_tiers_enabled` | `false` | Enable tier assignment during import |

To enable tier mapping during migration:

```bash
MEMBERSHIP_TIERS_ENABLED=1 npx tsx scripts/migration/migrate.ts --live --yes
```
