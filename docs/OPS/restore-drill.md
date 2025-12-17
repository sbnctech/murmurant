# Database Restore Drill

This document describes ClubOS backup strategy, restore procedures, and when to test them.

**Charter Principles:**

- **P5**: Every important action must be undoable or safely reversible
- **P7**: Observability - clear status indicators, meaningful logs
- **P9**: Security must fail closed - deny action if restore procedure is untested

---

## Neon Backup Strategy

ClubOS uses [Neon](https://neon.tech) for PostgreSQL hosting. Neon provides:

### Automatic Backups

- **Point-in-Time Recovery (PITR)**: Restore to any point in the last 7 days (Pro) or 24 hours (Free)
- **Branch-based architecture**: Every branch is a copy-on-write clone
- **No manual backup required**: Neon continuously logs all changes

### Backup Retention

| Plan | PITR Window | Branch Retention |
|------|-------------|------------------|
| Free | 24 hours | 10 branches |
| Pro | 7 days | Unlimited |
| Enterprise | 30 days | Unlimited |

---

## Restore Procedures

### Scenario 1: Restore to Point in Time

Use when: Bad data was written, need to go back in time.

**Steps:**

1. **Identify the restore point**
   ```
   # Check Neon console for the timestamp before the incident
   # Note: All times are in UTC
   ```

2. **Create a restore branch in Neon Console**
   - Go to Neon Console > Project > Branches
   - Click "Create Branch"
   - Select "From specific point in time"
   - Enter the timestamp (UTC)
   - Name the branch: `restore-YYYYMMDD-HHMM`

3. **Verify the restored data**
   ```bash
   # Connect to the restore branch
   psql "postgres://user:pass@restore-branch-host/neondb"

   # Verify critical data
   SELECT COUNT(*) FROM members;
   SELECT COUNT(*) FROM events;
   SELECT MAX(created_at) FROM audit_log;
   ```

4. **Promote or merge the restore branch**
   - If restore is correct, you can either:
     - Switch the application to the restore branch
     - Or use Neon's branch reset feature to reset main to the restore point

### Scenario 2: Recover Dropped Table/Column

Use when: A destructive migration deleted important data.

**Steps:**

1. **Create a branch from before the migration**
   ```
   # In Neon Console, create branch from:
   # - Specific point in time before the migration ran
   # - Or from the last known good state
   ```

2. **Export the needed data**
   ```bash
   # Connect to restore branch and export
   pg_dump -h restore-host -U user -d neondb \
     --table="deleted_table" \
     --data-only \
     -f deleted_table_backup.sql
   ```

3. **Import to production**
   ```bash
   # This requires the table structure to exist
   # May need to recreate table first
   psql -h prod-host -U user -d neondb < deleted_table_backup.sql
   ```

### Scenario 3: Complete Database Restore

Use when: Major incident requiring full rollback.

**Steps:**

1. **Stop all application traffic**
   - Set Netlify deploy to a maintenance page
   - Or pause the Netlify deployment

2. **Create restore branch from safe point**
   - Neon Console > Branches > Create from point in time

3. **Update connection string**
   - Get new connection string from restore branch
   - Update in Netlify environment variables

4. **Redeploy application**
   - Trigger redeploy in Netlify

5. **Verify and monitor**
   - Check application logs
   - Verify critical functionality
   - Monitor for errors

---

## When to Test Restore

Test the restore procedure:

### Required Testing

| Trigger | Action |
|---------|--------|
| Before any destructive migration | Test restore from branch |
| Quarterly | Full restore drill |
| After Neon plan change | Verify PITR window |
| After infrastructure change | Test full procedure |

### Pre-Migration Restore Test

Before merging any migration with `MIGRATION_APPROVED`:

1. Create a test branch in Neon
2. Apply the migration to test branch
3. Create a restore branch from before the migration
4. Verify data can be recovered
5. Document the test in the PR

### Quarterly Restore Drill

Every quarter, perform a full restore drill:

1. **Schedule**: First Monday of each quarter
2. **Scope**: Full point-in-time restore
3. **Duration**: 1-2 hours
4. **Documentation**: Record results in ops log

**Drill Checklist:**

- [ ] Identify a restore point (previous day)
- [ ] Create restore branch
- [ ] Verify member count matches
- [ ] Verify event count matches
- [ ] Verify recent audit log entries exist
- [ ] Test application connectivity to restore branch
- [ ] Document any issues
- [ ] Delete test branches when done

---

## Neon CLI Commands

For automated restore operations:

```bash
# Install Neon CLI
npm install -g neonctl

# Authenticate
neonctl auth

# List branches
neonctl branches list --project-id <project-id>

# Create restore branch
neonctl branches create \
  --project-id <project-id> \
  --name restore-$(date +%Y%m%d-%H%M) \
  --parent main \
  --suspend-timeout 3600

# Get connection string
neonctl connection-string \
  --project-id <project-id> \
  --branch-name restore-branch
```

---

## Emergency Contacts

| Role | Contact | When |
|------|---------|------|
| Database Admin | (document contact) | Data loss incident |
| Neon Support | support@neon.tech | Platform issues |
| Team Lead | (document contact) | Decision needed |

---

## Post-Incident Review

After any restore operation:

1. **Document the incident**
   - What happened
   - When it was detected
   - What was the root cause

2. **Document the recovery**
   - Restore point used
   - Time to recovery
   - Data loss (if any)

3. **Preventive measures**
   - What changes prevent recurrence
   - PR references for fixes

4. **Update this document**
   - Any procedure changes needed
   - Lessons learned

---

## Related Documents

- [migrations.md](./migrations.md) - Safe migration practices
- [ARCHITECTURAL_CHARTER.md](../ARCHITECTURAL_CHARTER.md) - System principles
