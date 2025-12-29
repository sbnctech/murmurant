# Backups Runbook

Operational procedures for Murmurant backup and recovery.

**Charter Principles:**

- **P5**: Every important action must be undoable or reversible
- **P7**: Observability - clear status indicators, meaningful logs
- **P9**: Security must fail closed

---

## Overview

Murmurant uses Neon PostgreSQL which provides automatic backup capabilities:

- **Point-in-Time Recovery (PITR)**: Restore to any point in retention window
- **Branch-based architecture**: Instant database clones
- **Automatic snapshots**: No manual backup required

### Backup Architecture

| Component | Purpose |
|-----------|---------|
| Neon PITR | Continuous backup with point-in-time restore |
| Neon Branches | Instant clones for testing/recovery |
| Neon Console | Web interface for backup management |
| Neon CLI | Command-line backup operations |

---

## Health Check

### Quick Status

```bash
# Run backup health check
scripts/ops/health-checks/backup-health.sh

# Or check manually via Neon CLI
neonctl branches list --project-id $NEON_PROJECT_ID
```

### Verify PITR Window

```bash
# Check project details including retention
neonctl projects get $NEON_PROJECT_ID --output json | jq '.history_retention_seconds'
```

---

## Retention Periods

| Neon Plan | PITR Window | Branch Limit |
|-----------|-------------|--------------|
| Free | 24 hours | 10 branches |
| Pro | 7 days | Unlimited |
| Enterprise | 30 days | Unlimited |

**Current plan:** Check Neon console for your project's plan.

---

## Common Issues

### Issue: Cannot Restore to Specific Point

**Symptoms:**

- Restore fails with "point not available"
- Needed restore point is outside retention window

**Diagnosis:**

1. Check your PITR retention window
2. Verify the timestamp is in UTC
3. Confirm point is within retention period

**Resolution:**

| Cause | Action |
|-------|--------|
| Outside retention | Data not recoverable; review backup strategy |
| Wrong timezone | Convert timestamp to UTC |
| Recent changes | Wait a few minutes for replication |

### Issue: Branch Creation Fails

**Symptoms:**

- Cannot create restore branch
- "Branch limit exceeded" error
- Timeout during branch creation

**Diagnosis:**

1. Check current branch count:
   ```bash
   neonctl branches list --project-id $NEON_PROJECT_ID | wc -l
   ```

2. Check for stuck branches
3. Verify project permissions

**Resolution:**

| Cause | Action |
|-------|--------|
| Branch limit reached | Delete unused branches |
| Permission denied | Check API key permissions |
| Timeout | Retry; large databases take longer |

### Issue: Restore Branch Has Wrong Data

**Symptoms:**

- Restored data doesn't match expectations
- Missing recent transactions

**Diagnosis:**

1. Verify the restore timestamp used
2. Check for transaction timing issues
3. Confirm correct database selected

**Resolution:**

| Cause | Action |
|-------|--------|
| Wrong timestamp | Create new branch with correct time |
| Wrong database | Specify correct database name |
| Replication lag | Choose slightly earlier timestamp |

---

## Manual Operations

### Create Backup Branch

```bash
# Create a named backup branch
neonctl branches create \
  --project-id $NEON_PROJECT_ID \
  --name backup-$(date +%Y%m%d-%H%M) \
  --parent main
```

### Create Point-in-Time Restore Branch

```bash
# Restore to specific timestamp (UTC)
neonctl branches create \
  --project-id $NEON_PROJECT_ID \
  --name restore-$(date +%Y%m%d-%H%M) \
  --parent main \
  --at "2024-01-15T10:30:00Z"
```

### Get Connection String for Branch

```bash
# Get connection string for restore branch
neonctl connection-string \
  --project-id $NEON_PROJECT_ID \
  --branch-name restore-branch-name
```

### Delete Old Branches

```bash
# List branches
neonctl branches list --project-id $NEON_PROJECT_ID

# Delete specific branch
neonctl branches delete \
  --project-id $NEON_PROJECT_ID \
  --branch-name old-branch-name
```

---

## Restore Procedures

### Procedure: Point-in-Time Restore

**When:** Need to recover from data corruption or accidental deletion

**Steps:**

1. Identify the restore point (UTC timestamp before incident)

2. Create restore branch:
   ```bash
   neonctl branches create \
     --project-id $NEON_PROJECT_ID \
     --name restore-$(date +%Y%m%d-%H%M) \
     --parent main \
     --at "YYYY-MM-DDTHH:MM:SSZ"
   ```

3. Verify restored data:
   ```bash
   psql "$(neonctl connection-string --project-id $NEON_PROJECT_ID --branch-name restore-xxx)" \
     -c "SELECT COUNT(*) FROM members;"
   ```

4. If correct, switch application to restore branch or merge data

### Procedure: Recover Dropped Table

**When:** A migration accidentally dropped a table

**Steps:**

1. Create restore branch from before migration

2. Export the table:
   ```bash
   pg_dump \
     "$(neonctl connection-string --project-id $NEON_PROJECT_ID --branch-name restore-xxx)" \
     --table=dropped_table \
     --data-only \
     -f dropped_table_backup.sql
   ```

3. Recreate table structure in production (if needed)

4. Import data:
   ```bash
   psql "$DATABASE_URL" < dropped_table_backup.sql
   ```

### Procedure: Full Database Restore

**When:** Major incident requiring complete rollback

**Steps:**

1. **Pause application traffic**
   - Set maintenance mode in Netlify
   - Or pause deployment

2. **Create restore branch**
   ```bash
   neonctl branches create \
     --project-id $NEON_PROJECT_ID \
     --name restore-full-$(date +%Y%m%d-%H%M) \
     --parent main \
     --at "SAFE_TIMESTAMP"
   ```

3. **Update application connection string**
   - Get new connection string from restore branch
   - Update DATABASE_URL in Netlify environment

4. **Redeploy application**
   - Trigger redeploy
   - Monitor for errors

5. **Verify and cleanup**
   - Check critical functionality
   - Delete old main branch if appropriate
   - Rename restore branch to main

---

## Scheduled Tasks

### Quarterly Restore Drill

**Schedule:** First Monday of each quarter

**Checklist:**

- [ ] Identify a restore point (previous day)
- [ ] Create restore branch
- [ ] Verify member count matches production
- [ ] Verify event count matches production
- [ ] Verify recent audit log entries exist
- [ ] Test application connectivity to restore branch
- [ ] Document any issues found
- [ ] Delete test branches when done

**Document results in:** `docs/OPS/drills/YYYY-QN-restore-drill.md`

### Pre-Migration Backup Verification

**Before any destructive migration:**

- [ ] Confirm current PITR window includes rollback period
- [ ] Create named backup branch as safety net
- [ ] Document the backup branch name in PR
- [ ] Test restore procedure in backup branch

---

## Escalation Procedures

### Level 1: Self-Service (Operator)

1. Run backup health check
2. Attempt restore via Neon Console
3. Use Neon CLI for branch operations
4. Check Neon status page

### Level 2: Technical Support

Escalate if:

- Restore failing despite correct procedure
- Data integrity questions after restore
- Branch operations timing out

**Information to gather:**

- Neon project ID
- Timestamp of incident
- Restore attempts and results
- Error messages

### Level 3: Emergency

Escalate immediately if:

- Complete data loss
- Suspected security breach
- Neon platform issues

**Immediate actions:**

1. Document incident start time
2. Capture current database state
3. Contact Neon support if platform issue

---

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Primary database connection |
| `NEON_PROJECT_ID` | No | For CLI operations |
| `NEON_API_KEY` | No | For automated backup scripts |

---

## Monitoring Alerts

Set up alerts for:

| Condition | Threshold | Action |
|-----------|-----------|--------|
| PITR window | < 48 hours | Consider plan upgrade |
| Branch count | > 80% of limit | Clean up old branches |
| Restore drill | > 90 days ago | Schedule drill |
| Database size | > 80% of plan | Review data retention |

---

## Backup Best Practices

1. **Never rely on a single restore method**
   - Use PITR for recent recovery
   - Keep named backup branches for milestones
   - Document restore procedures

2. **Test restores regularly**
   - Quarterly restore drills
   - Pre-migration backup tests
   - Document all test results

3. **Maintain backup hygiene**
   - Delete old test/restore branches
   - Keep meaningful backup branches named clearly
   - Monitor branch count and storage

4. **Document everything**
   - Log all restore operations
   - Record drill results
   - Update procedures when issues found

---

## Related Documents

- [restore-drill.md](../restore-drill.md) - Detailed restore procedures
- [migrations.md](../migrations.md) - Safe migration practices
- [ARCHITECTURAL_CHARTER.md](../../ARCHITECTURAL_CHARTER.md) - System principles
