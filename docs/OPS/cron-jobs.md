# Cron Jobs Operations Guide

This document describes the cron job infrastructure for ClubOS, including authentication, idempotency, and monitoring.

## Overview

ClubOS uses cron-over-HTTP for scheduled tasks, designed for reliability and observability in a volunteer-run environment.

**Key Features:**

- **Authentication**: All POST endpoints require `CRON_SECRET` Bearer token
- **Idempotency**: Jobs only run once per scheduled date via `withJobRun` wrapper
- **Observability**: Job executions are logged to `JobRun` table with status tracking
- **Fail Closed**: Missing or invalid configuration results in errors, not silent failures

## Cron Endpoints

### POST /api/cron/transitions

Processes scheduled leadership transitions and closes completed event host records.

**Schedule**: Daily at 8:00 UTC (midnight Pacific PST, 1am PDT)

**Authentication**: `Authorization: Bearer <CRON_SECRET>`

**Response (success):**
```json
{
  "success": true,
  "transitionsApplied": 0,
  "eventHostsClosed": 0,
  "runId": "uuid",
  "requestId": "req-xxx-xxx",
  "processedAt": "2025-01-15T08:00:00.000Z"
}
```

**Response (skipped - already ran today):**
```json
{
  "success": true,
  "skipped": true,
  "reason": "Job already executed for this date",
  "runId": "uuid",
  "requestId": "req-xxx-xxx"
}
```

### GET /api/cron/transitions

Health check endpoint (no auth required).

**Response:**
```json
{
  "status": "ok",
  "upcomingTransitionDates": ["2025-02-01T00:00:00.000Z", "2025-08-01T00:00:00.000Z"],
  "dueTransitionsCount": 0,
  "lastRun": {
    "id": "uuid",
    "scheduledFor": "2025-01-15T00:00:00.000Z",
    "status": "SUCCESS",
    "startedAt": "2025-01-15T08:00:00.000Z",
    "finishedAt": "2025-01-15T08:00:05.000Z",
    "error": null
  }
}
```

## Health Endpoints

### GET /api/health/db

Database connectivity check.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T08:00:00.000Z",
  "requestId": "req-xxx-xxx",
  "checks": {
    "database": {
      "status": "ok",
      "latencyMs": 5
    }
  }
}
```

### GET /api/health/auth

Authentication system health check.

- **Public**: Returns basic status only
- **Admin**: Returns detailed configuration status

### GET /api/health/cron

Cron system health check.

- **Public**: Returns basic status only
- **Admin**: Returns detailed cron status including last runs

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `CRON_SECRET` | Bearer token for cron auth (min 16 chars) | Yes |
| `AUTH_SECRET` | NextAuth.js secret (min 32 chars) | Yes |

### Vercel Cron Configuration

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/transitions",
      "schedule": "0 8 * * *"
    }
  ]
}
```

## Idempotency with withJobRun

The `withJobRun` helper ensures jobs only execute once per scheduled date:

```typescript
import { withJobRun, generateRequestId, verifyCronAuth } from "@/lib/cron";

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();

  // Verify authentication
  const authResult = verifyCronAuth(req);
  if (!authResult.authorized) {
    return cronErrorResponse(authResult.error, authResult.statusCode);
  }

  // Execute with idempotency
  const result = await withJobRun(
    "my-job",
    new Date(),
    async () => {
      // Your job logic here
      return { processed: 42 };
    },
    { requestId }
  );

  return NextResponse.json({ success: true, ...result });
}
```

### How It Works

1. `withJobRun` attempts to create a `JobRun` record with `UNIQUE(jobName, scheduledFor)`
2. If the record already exists (constraint violation), the job is skipped
3. If created, the job executes and status is updated to `SUCCESS` or `FAILED`
4. The `runId` is returned in all responses for tracing

## JobRun Database Model

```prisma
enum JobRunStatus {
  PENDING
  RUNNING
  SUCCESS
  FAILED
  SKIPPED
}

model JobRun {
  id           String       @id @default(uuid())
  jobName      String
  scheduledFor DateTime     @db.Date
  requestId    String?
  status       JobRunStatus @default(PENDING)
  startedAt    DateTime?
  finishedAt   DateTime?
  errorSummary String?
  metadata     Json?
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  @@unique([jobName, scheduledFor])
}
```

## Monitoring and Troubleshooting

### Check Last Job Run

```bash
curl https://your-app.vercel.app/api/cron/transitions
```

Look at `lastRun.status`:
- `SUCCESS`: Job completed normally
- `FAILED`: Job had an error (check `lastRun.error`)
- `RUNNING`: Job is currently executing (or crashed mid-execution)
- `PENDING`: Job was created but never started (unusual)

### Manual Trigger (Testing)

```bash
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://your-app.vercel.app/api/cron/transitions
```

### View Job History

Query the `JobRun` table directly:

```sql
SELECT * FROM "JobRun"
WHERE "jobName" = 'transitions'
ORDER BY "createdAt" DESC
LIMIT 10;
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid or missing `CRON_SECRET` | Check env var is set correctly |
| 500 Server error | `CRON_SECRET` not configured | Set `CRON_SECRET` in env |
| Job skipped | Already ran today | Expected behavior - check `lastRun` |
| Job stuck in RUNNING | Crash during execution | Manual intervention needed |

## Security Notes

Per Charter Principle P9 (Security must fail closed):

- If `CRON_SECRET` is not configured or too short, the endpoint returns 500
- Invalid tokens return 401 (never 403 to avoid information leakage)
- Request IDs are included for audit trail
- No sensitive information is logged or returned in responses
