# Murmurant Monitoring Guide

This guide explains how to monitor Murmurant for a volunteer-run organization.

## Health Endpoints

Murmurant provides three health check endpoints for monitoring system status:

| Endpoint | Purpose | Auth Required |
|----------|---------|---------------|
| `/api/health/db` | Database connectivity | No |
| `/api/health/auth` | Authentication system | No (basic), Yes (detailed) |
| `/api/health/cron` | Scheduled jobs status | No (basic), Yes (detailed) |

### Response Format

All health endpoints return JSON with this structure:

```json
{
  "status": "ok" | "degraded" | "error",
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req-abc123-xyz789",
  "checks": {
    "component": {
      "status": "ok" | "degraded" | "error",
      "latencyMs": 42
    }
  }
}
```

### HTTP Status Codes

- **200**: All checks passed (status: "ok")
- **503**: One or more checks failed (status: "degraded" or "error")

## What to Check When Something Breaks

### Symptom: Users can't log in

1. Check `/api/health/auth`:
   ```bash
   curl https://your-site.com/api/health/auth
   ```

2. Look for:
   - `status: "error"` indicates auth system is down
   - Check if `authSecretConfigured` is failing (admin view)

3. Common causes:
   - AUTH_SECRET environment variable not set
   - Database connection issues (sessions can't be stored)

### Symptom: Pages are loading but data is missing

1. Check `/api/health/db`:
   ```bash
   curl https://your-site.com/api/health/db
   ```

2. Look for:
   - High `latencyMs` values (> 1000ms indicates slowness)
   - `status: "error"` indicates database is unreachable

3. Common causes:
   - Database server is down
   - Connection pool exhausted
   - Network issues between app and database

### Symptom: Transitions aren't being applied automatically

1. Check `/api/health/cron` (with admin auth):
   ```bash
   curl -H "Authorization: Bearer test-admin-token" \
     https://your-site.com/api/health/cron
   ```

2. Look for:
   - `dueTransitionsCount > 0` means transitions are waiting
   - `lastCronRun` shows when cron last executed
   - `alert` field warns of stale transitions

3. Common causes:
   - CRON_SECRET not configured
   - Cron job not scheduled in hosting platform
   - Cron job failing silently (check logs)

## Interpreting Health Responses

### Status Values

- **ok**: Everything is working normally
- **degraded**: System is operational but not optimal (e.g., slow database)
- **error**: System is not functioning (immediate action needed)

### RequestId

Every response includes a `requestId` (e.g., `req-m5x9k2f-a1b2c3`).

**Use this to:**

- Correlate errors across logs
- Report issues to support
- Track requests through distributed systems

The requestId is:

- Generated at the start of each request
- Logged with any errors
- Included in API error responses
- Safe to share (contains no sensitive data)

### Latency Guidelines

| Component | Good | Acceptable | Investigate |
|-----------|------|------------|-------------|
| Database  | < 50ms | < 200ms | > 500ms |
| Auth      | < 100ms | < 300ms | > 500ms |

## Setting Up Monitoring

### Basic Health Check (Uptime Robot, Pingdom, etc.)

Monitor: `https://your-site.com/api/health/db`

- Check interval: Every 5 minutes
- Alert condition: HTTP status != 200
- Timeout: 10 seconds

### Cron Job Verification

For Vercel Cron or similar:

1. Schedule the cron job to POST to `/api/cron/transitions`
2. Monitor `/api/health/cron` for stale transitions
3. Alert if `dueTransitionsCount > 0` for more than 24 hours

### Log Monitoring

Look for these patterns in logs:

```
{"level":"error","requestId":"req-xxx",...}
```

Key fields to filter:

- `level: "error"` - All errors
- `component: "health/db"` - Database issues
- `component: "health/auth"` - Auth issues
- `component: "health/cron"` - Cron job issues

## Environment Variables for Operations

| Variable | Required | Purpose |
|----------|----------|---------|
| `AUTH_SECRET` | Yes | Must be 32+ characters for production |
| `CRON_SECRET` | Yes | Authenticates cron job requests |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NODE_ENV` | No | Set to "production" in prod |

## Emergency Procedures

### Database Down

1. Check hosting provider status page
2. Check `/api/health/db` for specific error
3. Contact database administrator

### Auth System Down

1. Check if AUTH_SECRET is set correctly
2. Check database connectivity (sessions are stored there)
3. Check `/api/health/auth` with admin token for details

### Cron Jobs Stuck

1. Check `/api/health/cron` for due transitions
2. Manually trigger cron if needed:
   ```bash
   curl -X POST \
     -H "Authorization: Bearer YOUR_CRON_SECRET" \
     https://your-site.com/api/cron/transitions
   ```
3. Check Vercel/hosting platform cron logs

## Charter Compliance

This monitoring system follows:

- **P7 (Observability)**: Clear status indicators, meaningful logs
- **P9 (Fail Closed)**: Errors return 503, no secrets in responses

See `docs/ARCHITECTURAL_CHARTER.md` for full charter.
