# Cron Jobs Runbook

Operational procedures for Murmurant scheduled tasks.

**Charter Principles:**

- **P5**: Every important action must be undoable or reversible
- **P7**: Observability - clear status indicators, meaningful logs
- **P9**: Security must fail closed

---

## Overview

Murmurant uses scheduled jobs for:

- **Membership transitions**: Auto-advancing membership states
- **Sync jobs**: Wild Apricot data synchronization
- **Cleanup tasks**: Session cleanup, temporary data removal

### Cron Architecture

| Component | Purpose |
|-----------|---------|
| `/api/cron/transitions` | Process due membership transitions |
| `/api/health/cron` | Check cron job status |
| Hosting platform cron | Trigger endpoint on schedule |

---

## Health Check

### Quick Status

```bash
# Basic cron health (no auth)
curl -s https://your-site.com/api/health/cron | jq .

# Detailed cron health (requires admin auth)
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://your-site.com/api/health/cron | jq .
```

### Expected Response

```json
{
  "status": "ok",
  "checks": {
    "cronSecretConfigured": { "status": "ok" },
    "dueTransitionsCount": 0,
    "lastCronRun": "2024-01-15T10:00:00Z"
  }
}
```

### Automated Health Check

```bash
scripts/ops/health-checks/cron-health.sh
```

---

## Scheduled Jobs

### Membership Transitions

**Schedule:** Every hour
**Endpoint:** `POST /api/cron/transitions`
**Purpose:** Process membership state changes that are due

**Example states processed:**

- Pending approval past deadline
- Trial memberships expiring
- Renewals due

### Wild Apricot Sync

**Schedule:** Every 6 hours (configurable)
**Script:** `scripts/importing/wa_incremental_sync.ts`
**Purpose:** Sync member data from Wild Apricot

---

## Common Issues

### Issue: Transitions Not Being Applied

**Symptoms:**

- Members stuck in pending states
- `/api/health/cron` shows `dueTransitionsCount > 0`
- No recent `lastCronRun` timestamp

**Diagnosis:**

1. Check cron health:
   ```bash
   curl -s https://your-site.com/api/health/cron
   ```

2. Verify CRON_SECRET is set
3. Check hosting platform cron configuration

**Resolution:**

| Cause | Action |
|-------|--------|
| CRON_SECRET not set | Add CRON_SECRET to environment variables |
| Cron not scheduled | Configure cron in Netlify/Vercel settings |
| Cron endpoint failing | Check application logs for errors |

### Issue: Cron Jobs Timing Out

**Symptoms:**

- Partial processing of transitions
- Timeout errors in logs
- Inconsistent state updates

**Diagnosis:**

1. Check execution time in logs
2. Count pending transitions:
   ```sql
   SELECT COUNT(*) FROM membership_transitions
   WHERE due_at <= NOW() AND processed_at IS NULL;
   ```

**Resolution:**

| Cause | Action |
|-------|--------|
| Too many pending items | Process in smaller batches |
| Slow database queries | Check for missing indexes |
| External API delays | Add timeout handling |

### Issue: Duplicate Cron Executions

**Symptoms:**

- Same transition processed multiple times
- Duplicate audit log entries
- Race condition errors

**Diagnosis:**

1. Check for overlapping cron schedules
2. Review execution locking mechanism
3. Check for multiple cron configurations

**Resolution:**

| Cause | Action |
|-------|--------|
| Overlapping schedules | Increase interval between runs |
| Missing execution lock | Implement distributed lock |
| Multiple cron sources | Consolidate to single scheduler |

---

## Manual Operations

### Manually Trigger Transitions

```bash
# Trigger the cron job manually
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://your-site.com/api/cron/transitions
```

### Check Pending Transitions

```sql
-- Count pending transitions
SELECT
  transition_type,
  COUNT(*) as pending_count,
  MIN(due_at) as oldest_due
FROM membership_transitions
WHERE processed_at IS NULL AND due_at <= NOW()
GROUP BY transition_type;
```

### Force Process Specific Transition

```sql
-- Mark a transition as processed (emergency only)
UPDATE membership_transitions
SET processed_at = NOW(), processed_by = 'manual-override'
WHERE id = 'transition-id-here';
```

---

## Escalation Procedures

### Level 1: Self-Service (Operator)

1. Run health check script
2. Manually trigger cron endpoint
3. Check environment variables
4. Review hosting platform cron logs

### Level 2: Technical Support

Escalate if:

- Manual trigger also fails
- Database connection issues
- Unexpected transition states

**Information to gather:**

- Health check output
- Pending transition count
- Recent cron execution logs
- Error messages

### Level 3: Emergency

Escalate immediately if:

- Members incorrectly transitioned
- Data integrity issues
- Cron running but making wrong decisions

---

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `CRON_SECRET` | Yes | Authenticates cron requests |
| `DATABASE_URL` | Yes | PostgreSQL connection string |

### Generating CRON_SECRET

```bash
# Generate a secure secret
openssl rand -base64 32
```

---

## Hosting Platform Configuration

### Netlify Scheduled Functions

In `netlify.toml`:

```toml
[functions.cron-transitions]
schedule = "@hourly"
```

### Vercel Cron Jobs

In `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/transitions",
    "schedule": "0 * * * *"
  }]
}
```

---

## Monitoring Alerts

Set up alerts for:

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Due transitions | > 0 for 24h | Investigate cron execution |
| Last cron run | > 2 hours ago | Check cron schedule |
| Cron failures | > 3 consecutive | Escalate to L2 |

---

## Recovery Procedures

### Procedure: Clear Stale Transitions

**When:** Transitions stuck due to processing errors

**Steps:**

1. Identify stuck transitions:
   ```sql
   SELECT * FROM membership_transitions
   WHERE processed_at IS NULL
   AND due_at < NOW() - INTERVAL '24 hours';
   ```

2. Review each transition manually
3. Either process or mark as skipped with reason

### Procedure: Rebuild Cron State

**When:** Cron state is corrupted

**Steps:**

1. Stop cron execution (disable in hosting platform)
2. Clear cron tracking state
3. Re-enable cron
4. Monitor first few executions

---

## Related Documents

- [monitoring.md](../monitoring.md) - Health check details
- [time-and-scheduling.md](../time-and-scheduling.md) - Scheduling design
