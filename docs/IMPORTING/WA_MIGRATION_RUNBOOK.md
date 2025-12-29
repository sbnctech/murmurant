# Wild Apricot Migration Runbook

Production runbook for migrating data from Wild Apricot to Murmurant using the CSV-based migration pipeline.

**Related Issues:**

- #278 (E1: Production Migration Runbook)
- #202 (WA Migration Epic)
- #275 (Policy Capture)
- #277 (D1: Rollback & Recovery)

---

## 1. Preconditions

Complete ALL preconditions before proceeding. Do not skip any step.

### 1.1 Access Requirements

| Access | Purpose | Who Grants |
|--------|---------|------------|
| Wild Apricot Admin | Export CSV data | WA Account Owner |
| Murmurant Database | Production access | Merge Captain |
| SSH/Server Access | Run migration scripts | DevOps |
| Backup Access | Verify/restore backups | DevOps |

### 1.2 Database Backup (REQUIRED)

**Before ANY migration run, create a database backup:**

```bash
# Create timestamped backup
pg_dump "$DATABASE_URL" > backup-pre-migration-$(date +%Y%m%d-%H%M%S).sql

# Verify backup file is non-empty
ls -lh backup-pre-migration-*.sql
```

**Stop immediately if backup fails.** Do not proceed without a verified backup.

### 1.3 Dry-Run Validation (REQUIRED)

A successful dry-run is REQUIRED before any live migration:

```bash
# Dry-run is the default mode
npx tsx scripts/migration/migrate.ts \
  --data-dir ./wa-export \
  --verbose

# Expected: "DRY RUN (no database changes)" in output
# Expected: Zero errors in summary
```

**Do not proceed to live run if dry-run has errors.**

### 1.4 Sample Data Validation

Before production data, validate with sample pack:

```bash
# Run against included sample data
npx tsx scripts/migration/migrate.ts --verbose

# Verify output:
# - Reports generated in scripts/migration/reports/
# - ID mapping file created
# - Zero errors
```

### 1.5 Environment Setup

```bash
# Required environment
export DATABASE_URL="postgresql://..."  # Production connection string
export NODE_ENV="production"            # Ensures production safeguards

# Verify Prisma client is current
npx prisma generate
```

---

## 2. Inputs

### 2.1 CSV Export Files

Export the following from Wild Apricot Admin:

| File | WA Export Path | Required Fields |
|------|---------------|-----------------|
| Members | Contacts → Export | Contact ID, Member ID, Email, First name, Last name, Member since, Membership level |
| Events | Events → Export | Event ID, Event name, Start date, End date, Location, Description |
| Registrations | Events → Registrations → Export | Registration ID, Contact ID, Event ID, Registration status, Registration date |

**Export Format Requirements:**

- CSV format (not Excel)
- UTF-8 encoding
- Include all fields (do not filter columns)
- Date format: MM/DD/YYYY or YYYY-MM-DD

### 2.2 Directory Structure

Organize exports in this structure:

```
wa-export/
├── members/
│   └── wa-members-export.csv
├── events/
│   └── wa-events-export.csv
│   └── wa-registrations-export.csv
```

### 2.3 Organization Configuration

Create or verify `scripts/migration/config/migration.yaml`:

```yaml
source: wild-apricot
target: murmurant
version: "1.0"

# Source organization details
sourceOrg:
  name: "Santa Barbara Newcomers Club"
  waAccountId: "176353"

# Field mappings (defaults usually work)
fieldMappings:
  contactId: "Contact ID"
  memberId: "Member ID"
  email: "Email"
  firstName: "First name"
  lastName: "Last name"
```

### 2.4 Timezone Assumptions

| Setting | Default | Override |
|---------|---------|----------|
| Source timezone | America/Los_Angeles | Set in config |
| Event times | Local time from WA | Converted to UTC |
| Member dates | Date-only (no time) | Midnight local |

**Important:** All dates in WA exports are assumed to be in Pacific Time unless explicitly configured otherwise.

---

## 3. Commands to Run

Execute these commands in order. Do not skip steps.

### 3.1 Validate CSV Files

```bash
# Check file encoding and structure
file wa-export/members/wa-members-export.csv
# Expected: UTF-8 Unicode text

# Preview first rows
head -5 wa-export/members/wa-members-export.csv

# Count records (subtract 1 for header)
wc -l wa-export/members/wa-members-export.csv
wc -l wa-export/events/wa-events-export.csv
wc -l wa-export/events/wa-registrations-export.csv
```

**Record these counts for verification later.**

### 3.2 Run Dry-Run Migration

```bash
npx tsx scripts/migration/migrate.ts \
  --data-dir ./wa-export \
  --members members/wa-members-export.csv \
  --events events/wa-events-export.csv \
  --registrations events/wa-registrations-export.csv \
  --output-report ./migration-reports \
  --verbose
```

**Review output for:**

- [ ] "DRY RUN" mode confirmed
- [ ] All files parsed successfully
- [ ] No parsing errors
- [ ] Record counts match expectations

### 3.3 Review Dry-Run Report

```bash
# Find latest report
ls -lt migration-reports/migration-dry-run-*.json | head -1

# Review summary
cat migration-reports/migration-dry-run-*.json | jq '.summary'

# Check for errors
cat migration-reports/migration-dry-run-*.json | jq '.errors'
```

**Stop if errors array is non-empty.**

### 3.4 Review ID Mapping

```bash
# Check ID mapping report
cat migration-reports/id-map-dry-run-*.json | jq '.members.counts'
cat migration-reports/id-map-dry-run-*.json | jq '.events.counts'

# Check for duplicates (should be empty)
cat migration-reports/id-map-dry-run-*.json | jq '.members.duplicateWaIds'
cat migration-reports/id-map-dry-run-*.json | jq '.events.duplicateWaIds'
```

**Stop if duplicates are found. Investigate before proceeding.**

### 3.5 Execute Live Migration

**Only after successful dry-run with zero errors:**

```bash
# Create backup (if not done already)
pg_dump "$DATABASE_URL" > backup-pre-migration-$(date +%Y%m%d-%H%M%S).sql

# Run live migration
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

**Monitor output for errors. Be prepared to stop immediately.**

### 3.6 Archive Reports

```bash
# Create archive of all reports
tar -czvf migration-run-$(date +%Y%m%d-%H%M%S).tar.gz migration-reports/

# Store in safe location
mv migration-run-*.tar.gz /path/to/archives/
```

---

## 4. Verification Checklist

Complete ALL verification steps after live migration.

### 4.1 Count Verification

```bash
# Compare expected vs actual counts
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"Member\";"
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"Event\";"
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"Registration\";"
```

| Entity | CSV Count | DB Count | Match? |
|--------|-----------|----------|--------|
| Members | _____ | _____ | [ ] |
| Events | _____ | _____ | [ ] |
| Registrations | _____ | _____ | [ ] |

### 4.2 Spot Checks

Verify 5-10 random records manually:

```bash
# Pick random WA IDs from CSV
# Look up in Murmurant database
psql "$DATABASE_URL" -c "
  SELECT m.id, m.email, m.\"firstName\", m.\"lastName\"
  FROM \"Member\" m
  WHERE m.\"waContactId\" = 'WA12345';
"
```

**Spot check criteria:**

- [ ] Names match source
- [ ] Email addresses match
- [ ] Membership dates reasonable
- [ ] Event dates/times correct
- [ ] Registration statuses match

### 4.3 Invariant Checks

```bash
# No orphaned registrations (registration without member)
psql "$DATABASE_URL" -c "
  SELECT COUNT(*) FROM \"Registration\" r
  LEFT JOIN \"Member\" m ON r.\"memberId\" = m.id
  WHERE m.id IS NULL;
"
# Expected: 0

# No orphaned registrations (registration without event)
psql "$DATABASE_URL" -c "
  SELECT COUNT(*) FROM \"Registration\" r
  LEFT JOIN \"Event\" e ON r.\"eventId\" = e.id
  WHERE e.id IS NULL;
"
# Expected: 0

# No duplicate WA IDs
psql "$DATABASE_URL" -c "
  SELECT \"waContactId\", COUNT(*)
  FROM \"Member\"
  WHERE \"waContactId\" IS NOT NULL
  GROUP BY \"waContactId\"
  HAVING COUNT(*) > 1;
"
# Expected: 0 rows
```

### 4.4 Application Smoke Test

After database verification:

- [ ] Murmurant admin dashboard loads
- [ ] Member list shows imported members
- [ ] Event list shows imported events
- [ ] Member detail page works for imported member
- [ ] Event detail page works for imported event
- [ ] No console errors in browser

---

## 5. Failure Modes

### 5.1 STOP IMMEDIATELY Triggers

**Stop the migration and do NOT proceed if:**

| Trigger | Action |
|---------|--------|
| Database connection lost | Stop, restore backup, investigate |
| More than 10 errors in output | Stop, review errors |
| "Fatal error" message | Stop, restore backup |
| Duplicate key violations | Stop, check existing data |
| Disk space warnings | Stop, free space |
| Memory exhaustion | Stop, reduce batch size |

### 5.2 Common Errors and Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "CSV parse error" | Malformed CSV | Re-export from WA with UTF-8 |
| "Missing required field" | Column name mismatch | Check field mappings in config |
| "Invalid date format" | Unexpected date format | Normalize dates before import |
| "Member not found" | Registration before member | Import members first |
| "Duplicate waContactId" | Re-running migration | Use rollback first |

### 5.3 Partial Failure Recovery

If migration fails partway through:

1. **Note the last successful record** from logs
2. **Do NOT re-run immediately**
3. **Run rollback** to clean up partial data
4. **Fix the root cause**
5. **Re-run from scratch** with corrected data

---

## 6. Rollback Plan

If issues are discovered after migration, use the rollback capability.

**Related:** Issue #277 (D1: Rollback & Recovery)

### 6.1 When to Rollback

- Data corruption discovered
- Wrong source data used
- Business decision to revert
- Critical bugs in imported data

### 6.2 Rollback Procedure

```bash
# Find the migration run ID from reports
cat migration-reports/migration-live-*.json | jq '.runId'

# Execute rollback (when rollback.ts is implemented)
npx tsx scripts/migration/rollback.ts --run-id <RUN_ID>

# Or restore from backup
psql "$DATABASE_URL" < backup-pre-migration-YYYYMMDD-HHMMSS.sql
```

### 6.3 Post-Rollback Verification

- [ ] Imported records removed
- [ ] Pre-existing data intact
- [ ] Application functional
- [ ] ID mappings cleared (if using script)

### 6.4 Backup Restoration (Nuclear Option)

If rollback script is insufficient:

```bash
# Drop and recreate database
dropdb murmurant_production
createdb murmurant_production

# Restore from backup
psql murmurant_production < backup-pre-migration-YYYYMMDD-HHMMSS.sql

# Verify
psql murmurant_production -c "SELECT COUNT(*) FROM \"Member\";"
```

**Warning:** This removes ALL data since backup, not just migration data.

---

## 7. Operator Checklist

Print this checklist and check off each item:

### Pre-Migration

- [ ] Database backup created and verified
- [ ] CSV exports obtained from WA
- [ ] Dry-run completed with zero errors
- [ ] ID mapping reviewed (no duplicates)
- [ ] Merge Captain approval obtained

### During Migration

- [ ] Live run started with `--live --yes`
- [ ] Output monitored for errors
- [ ] No STOP IMMEDIATELY triggers hit

### Post-Migration

- [ ] Count verification passed
- [ ] Spot checks passed (5+ records)
- [ ] Invariant checks passed
- [ ] Application smoke test passed
- [ ] Reports archived

### Sign-Off

```
Migration completed by: _______________________
Date/Time: _______________________
Records imported:
  Members: _______
  Events: _______
  Registrations: _______
Verified by: _______________________
```

---

## 8. Quick Reference

### Commands

```bash
# Dry run
npx tsx scripts/migration/migrate.ts --data-dir ./wa-export --verbose

# Live run
npx tsx scripts/migration/migrate.ts --data-dir ./wa-export --live --yes --verbose

# Help
npx tsx scripts/migration/migrate.ts --help
```

### Key Files

| File | Purpose |
|------|---------|
| `scripts/migration/migrate.ts` | CLI entry point |
| `scripts/migration/lib/migration-engine.ts` | Core engine |
| `scripts/migration/config/migration.yaml` | Configuration |
| `migration-reports/` | Output reports |

### Support

- **Epic:** #202 (WA Migration)
- **Rollback:** #277 (D1: Rollback & Recovery)
- **Policy Capture:** #275
