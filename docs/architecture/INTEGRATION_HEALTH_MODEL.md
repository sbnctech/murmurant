# Integration Health Model

Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

Status: Architectural Specification
Audience: Engineering
Last updated: 2025-12-21

---

## Purpose

This document closes the **Silent Failure (MF-4)** gap for integrations by
defining:

1. Minimum observability guarantees for token expiry, webhook handling, and sync failures
2. A canonical integration health surface derivable from internal state
3. Precise definitions for "healthy", "degraded", and "failed" states

**Scope:** Addresses FF-1 (Token Expiry), FF-3 (Webhook Replay), FF-4 (Partial Sync)
from [FUTURE_FAILURE_STRESS_TEST.md](./FUTURE_FAILURE_STRESS_TEST.md).

**Constraints:**

- No external dashboards or monitoring tools
- No APM/observability vendor assumptions
- Status derived entirely from internal database state

---

## 1. Integration Health Surface

### 1.1 Canonical Model: IntegrationHealth

All integration observability derives from a single source of truth:

```
IntegrationHealth {
  id:              uuid
  tenantId:        uuid
  provider:        enum (stripe, google_calendar, mailchimp, zoom, etc.)
  credentialType:  enum (oauth, api_key, webhook_secret)
  status:          enum (healthy, degraded, failed)

  // Credential lifecycle
  credentialExpiresAt:    datetime | null
  credentialRefreshedAt:  datetime | null
  credentialWarningAt:    datetime | null  // When 7-day warning sent

  // Last operation tracking
  lastSuccessAt:          datetime | null
  lastFailureAt:          datetime | null
  consecutiveFailures:    int default 0
  lastErrorCode:          string | null
  lastErrorMessage:       string | null

  // Rate limiting
  rateLimitResetAt:       datetime | null
  rateLimitRemaining:     int | null

  // Metadata
  createdAt:              datetime
  updatedAt:              datetime
}
```

**Key Design Decisions:**

- One row per provider per tenant
- Status is computed, not stored (derived from other fields)
- All timestamps use UTC
- Error details stored for debugging without external logs

### 1.2 Status Derivation Rules

Status is calculated on read, not stored. This ensures consistency:

```
FUNCTION computeStatus(health: IntegrationHealth): Status

  // FAILED: Credentials unusable
  IF credentialExpiresAt IS NOT NULL AND credentialExpiresAt < NOW():
    RETURN failed

  // FAILED: Too many consecutive failures
  IF consecutiveFailures >= 5:
    RETURN failed

  // DEGRADED: Credentials expiring soon (7 days)
  IF credentialExpiresAt IS NOT NULL AND credentialExpiresAt < NOW() + 7 days:
    RETURN degraded

  // DEGRADED: Rate limited
  IF rateLimitResetAt IS NOT NULL AND rateLimitResetAt > NOW():
    RETURN degraded

  // DEGRADED: Recent failures (but not consecutive threshold)
  IF consecutiveFailures >= 2:
    RETURN degraded

  // DEGRADED: No successful operation in 24 hours (for active integrations)
  IF lastSuccessAt IS NOT NULL AND lastSuccessAt < NOW() - 24 hours:
    IF lastFailureAt IS NOT NULL AND lastFailureAt > lastSuccessAt:
      RETURN degraded

  // HEALTHY: All checks pass
  RETURN healthy
```

### 1.3 Why One Surface

Multiple health surfaces create:

- Inconsistent status between views
- Race conditions in status updates
- Duplication of threshold logic
- Testing complexity

One surface ensures:

- Single source of truth
- Consistent status calculation
- Testable derivation rules
- Simple UI integration

---

## 2. Observability Guarantee: Token Expiry (FF-1)

### 2.1 Problem Statement

OAuth tokens expire. API keys get rotated. Without proactive monitoring:

- Integration silently stops working
- Admins discover failure weeks later
- Members miss confirmations, calendar invites, emails

### 2.2 Minimum Observability Guarantees

| Guarantee ID | Guarantee | Enforcement |
|--------------|-----------|-------------|
| TOK-1 | Credential expiry date is tracked | `credentialExpiresAt` stored on OAuth flow completion |
| TOK-2 | 7-day warning before expiry | Background job checks daily, creates admin notification |
| TOK-3 | 1-day warning before expiry | Background job creates urgent notification |
| TOK-4 | Status reflects expiry state | `computeStatus()` returns `degraded` within 7 days |
| TOK-5 | Expired credentials surface immediately | `computeStatus()` returns `failed` when expired |
| TOK-6 | Refresh attempts are logged | AuditLog entry on refresh success or failure |

### 2.3 Token Lifecycle State Machine

```
           +---------+
           |  VALID  |
           +----+----+
                |
    +-----------+-----------+
    |                       |
    v                       v
+-------+             +-----------+
| WARN  | ──────────> | EXPIRING  |
| (7d)  |             |   (1d)    |
+-------+             +-----+-----+
    |                       |
    |    +------------------+
    |    |
    v    v
+---------+
| EXPIRED |
+---------+
    |
    v
+-----------+
| REFRESHED | ──> VALID (on success)
+-----------+
```

### 2.4 Background Job: CredentialExpiryChecker

Runs daily at 06:00 UTC:

```
FOR EACH integration IN IntegrationHealth WHERE credentialExpiresAt IS NOT NULL:

  daysUntilExpiry = credentialExpiresAt - NOW() in days

  IF daysUntilExpiry <= 0:
    // Already expired - status will be FAILED
    IF NOT hasNotification(integration, 'expired'):
      createAdminNotification(
        type: 'integration_expired',
        severity: 'critical',
        integration: integration.provider,
        message: "{provider} credentials have expired. Re-authorize immediately."
      )

  ELSE IF daysUntilExpiry <= 1 AND credentialWarningAt != 1-day:
    createAdminNotification(
      type: 'integration_expiring',
      severity: 'urgent',
      integration: integration.provider,
      message: "{provider} credentials expire tomorrow. Re-authorize to avoid disruption."
    )

  ELSE IF daysUntilExpiry <= 7 AND credentialWarningAt IS NULL:
    UPDATE integration SET credentialWarningAt = NOW()
    createAdminNotification(
      type: 'integration_warning',
      severity: 'warning',
      integration: integration.provider,
      message: "{provider} credentials expire in {daysUntilExpiry} days."
    )
```

### 2.5 Verification Test

> Configure OAuth token with 5-day expiry → next day: admin receives warning
> notification → status shows "degraded" → token expires → status shows "failed"
> → admin re-authorizes → status returns to "healthy"

---

## 3. Observability Guarantee: Webhook Handling (FF-3)

### 3.1 Problem Statement

Webhooks can be:

- Replayed maliciously or accidentally (network retry)
- Lost silently (endpoint unavailable, processing error)
- Out of order (async delivery)

Without tracking, duplicates corrupt data or failures go unnoticed.

### 3.2 Canonical Model: WebhookEvent

```
WebhookEvent {
  id:              uuid (internal)
  tenantId:        uuid
  provider:        enum (stripe, etc.)
  externalId:      string (provider's event ID)
  eventType:       string (e.g., "payment_intent.succeeded")

  status:          enum (received, processing, processed, failed, duplicate)
  receivedAt:      datetime
  processedAt:     datetime | null

  attemptCount:    int default 1
  lastError:       string | null

  payload:         json (stored for replay/debugging)
  signature:       string (for validation)

  // Idempotency
  idempotencyKey:  string (derived from externalId + eventType)

  createdAt:       datetime
  updatedAt:       datetime

  UNIQUE(tenantId, provider, idempotencyKey)
}
```

### 3.3 Minimum Observability Guarantees

| Guarantee ID | Guarantee | Enforcement |
|--------------|-----------|-------------|
| WH-1 | All webhooks are logged | WebhookEvent created before processing |
| WH-2 | Duplicates are detected and rejected | UNIQUE constraint on idempotencyKey |
| WH-3 | Duplicate attempts are counted | `status: duplicate` with original reference |
| WH-4 | Processing failures are tracked | `status: failed` with `lastError` |
| WH-5 | Replay attempts are visible | Query for `status = duplicate` shows replay patterns |
| WH-6 | Failed webhooks can be retried | Admin action: retry(webhookEventId) |
| WH-7 | Signature validation is mandatory | Reject webhook if signature invalid (no record created) |

### 3.4 Webhook Processing Flow

```
FUNCTION handleWebhook(provider, rawBody, signature):

  // 1. Validate signature BEFORE creating record
  IF NOT validateSignature(provider, rawBody, signature):
    LOG.warn("Invalid webhook signature", {provider, ip: request.ip})
    RETURN 401 Unauthorized  // No record created

  // 2. Parse and extract idempotency key
  payload = parse(rawBody)
  externalId = payload.id
  eventType = payload.type
  idempotencyKey = hash(externalId + eventType)

  // 3. Check for duplicate (idempotent insert)
  existing = WebhookEvent.findByIdempotencyKey(tenantId, provider, idempotencyKey)
  IF existing:
    LOG.info("Duplicate webhook detected", {externalId, originalId: existing.id})
    UPDATE existing SET attemptCount = attemptCount + 1, updatedAt = NOW()
    RETURN 200 OK  // Acknowledge to prevent retries

  // 4. Create webhook record
  event = WebhookEvent.create({
    tenantId, provider, externalId, eventType,
    status: 'received',
    receivedAt: NOW(),
    payload, signature, idempotencyKey
  })

  // 5. Process webhook
  TRY:
    UPDATE event SET status = 'processing'
    processWebhookPayload(event)
    UPDATE event SET status = 'processed', processedAt = NOW()
  CATCH error:
    UPDATE event SET status = 'failed', lastError = error.message
    // Do NOT throw - return 200 to prevent infinite retries
    // Failed webhooks surface via admin notification

  RETURN 200 OK
```

### 3.5 Background Job: WebhookHealthChecker

Runs hourly:

```
// Check for webhooks stuck in processing
stuck = WebhookEvent.where(
  status: 'processing',
  updatedAt: < NOW() - 1 hour
)
FOR EACH event IN stuck:
  UPDATE event SET status = 'failed', lastError = 'Processing timeout'
  createAdminNotification(
    type: 'webhook_stuck',
    severity: 'warning',
    message: "{provider} webhook {externalId} timed out during processing"
  )

// Check for high duplicate rate (potential replay attack)
last24h = WebhookEvent.where(createdAt: > NOW() - 24 hours)
duplicates = last24h.where(attemptCount: > 1)
IF duplicates.count / last24h.count > 0.1:  // >10% duplicate rate
  createAdminNotification(
    type: 'webhook_replay_warning',
    severity: 'urgent',
    message: "High webhook duplicate rate detected. Possible replay attack."
  )

// Update IntegrationHealth based on webhook success rate
FOR EACH provider IN distinct(last24h.provider):
  failed = last24h.where(provider, status: 'failed').count
  total = last24h.where(provider).count
  IF total > 0 AND failed / total > 0.2:  // >20% failure rate
    UPDATE IntegrationHealth
    SET consecutiveFailures = consecutiveFailures + 1
    WHERE provider = provider
```

### 3.6 Verification Test

> Receive Stripe webhook → record created with `status: received` →
> processing completes → `status: processed` → replay same webhook →
> `attemptCount` increments → no duplicate record created → no duplicate
> side effects

---

## 4. Observability Guarantee: Partial Sync (FF-4)

### 4.1 Problem Statement

Bulk sync operations can fail partway due to:

- Rate limiting by external API
- Transient network errors
- Individual record validation failures

Without per-record tracking, partial success appears as complete success.

### 4.2 Canonical Model: SyncOperation

```
SyncOperation {
  id:              uuid
  tenantId:        uuid
  provider:        enum
  operationType:   enum (member_sync, event_sync, etc.)

  status:          enum (pending, in_progress, completed, completed_with_errors, failed)
  startedAt:       datetime
  completedAt:     datetime | null

  totalRecords:    int
  successCount:    int default 0
  failureCount:    int default 0
  pendingCount:    int default 0  // Records not yet attempted (rate limited)

  lastRecordId:    uuid | null  // For resumption

  createdAt:       datetime
  updatedAt:       datetime
}

SyncRecord {
  id:              uuid
  operationId:     uuid (FK to SyncOperation)
  recordType:      string (e.g., "member")
  recordId:        uuid (internal ID)
  externalId:      string | null (external system ID)

  status:          enum (pending, synced, failed, skipped)
  attemptCount:    int default 0
  lastError:       string | null

  createdAt:       datetime
  updatedAt:       datetime
}
```

### 4.3 Minimum Observability Guarantees

| Guarantee ID | Guarantee | Enforcement |
|--------------|-----------|-------------|
| SYNC-1 | Per-record status tracking | SyncRecord created for each item |
| SYNC-2 | Operation never reports "complete" if records pending | `status` derived from counts |
| SYNC-3 | Failures are itemized | `SyncRecord.status = failed` with `lastError` |
| SYNC-4 | Rate limits are handled with backoff | Exponential backoff with jitter |
| SYNC-5 | Partial progress is resumable | `lastRecordId` enables continuation |
| SYNC-6 | High failure rate triggers alert | >10% failure creates admin notification |
| SYNC-7 | Admin can view and retry failed records | UI action: retryFailed(operationId) |

### 4.4 Sync Operation Status Derivation

```
FUNCTION computeSyncStatus(op: SyncOperation): Status

  IF op.failureCount == op.totalRecords:
    RETURN failed

  IF op.successCount + op.failureCount < op.totalRecords:
    IF op.status == 'in_progress':
      RETURN in_progress
    ELSE:
      RETURN pending  // Resumable

  IF op.failureCount > 0:
    RETURN completed_with_errors

  RETURN completed
```

### 4.5 Sync Execution Pattern

```
FUNCTION executeBulkSync(tenantId, provider, records):

  // 1. Create operation record
  operation = SyncOperation.create({
    tenantId, provider,
    operationType: 'member_sync',
    status: 'in_progress',
    startedAt: NOW(),
    totalRecords: records.length
  })

  // 2. Create per-record tracking
  FOR EACH record IN records:
    SyncRecord.create({
      operationId: operation.id,
      recordType: 'member',
      recordId: record.id,
      status: 'pending'
    })

  // 3. Process with rate limit handling
  pendingRecords = SyncRecord.where(operationId: operation.id, status: 'pending')

  WHILE pendingRecords.count > 0:
    record = pendingRecords.first()

    TRY:
      externalId = syncToProvider(provider, record)
      UPDATE record SET
        status = 'synced',
        externalId = externalId,
        attemptCount = attemptCount + 1
      UPDATE operation SET successCount = successCount + 1

    CATCH RateLimitError as e:
      // Do not mark as failed - will retry after backoff
      UPDATE operation SET lastRecordId = record.recordId
      waitUntil = e.retryAfter OR exponentialBackoff(record.attemptCount)
      SLEEP(waitUntil)
      CONTINUE

    CATCH error:
      UPDATE record SET
        status = 'failed',
        lastError = error.message,
        attemptCount = attemptCount + 1
      UPDATE operation SET failureCount = failureCount + 1

    pendingRecords = SyncRecord.where(operationId: operation.id, status: 'pending')

  // 4. Complete operation
  finalStatus = computeSyncStatus(operation)
  UPDATE operation SET status = finalStatus, completedAt = NOW()

  // 5. Alert on high failure rate
  IF operation.failureCount / operation.totalRecords > 0.1:
    createAdminNotification(
      type: 'sync_high_failure_rate',
      severity: 'warning',
      message: "Sync to {provider}: {failureCount} of {totalRecords} failed"
    )

  RETURN operation
```

### 4.6 Integration with IntegrationHealth

After sync completion, update provider health:

```
IF operation.status == 'failed':
  UPDATE IntegrationHealth
  SET consecutiveFailures = consecutiveFailures + 1,
      lastFailureAt = NOW(),
      lastErrorMessage = 'Bulk sync failed'
  WHERE tenantId = tenantId AND provider = provider

ELSE IF operation.status == 'completed':
  UPDATE IntegrationHealth
  SET consecutiveFailures = 0,
      lastSuccessAt = NOW()
  WHERE tenantId = tenantId AND provider = provider

ELSE IF operation.status == 'completed_with_errors':
  // Degraded but not failed
  UPDATE IntegrationHealth
  SET lastSuccessAt = NOW()  // Some records succeeded
  WHERE tenantId = tenantId AND provider = provider
```

### 4.7 Verification Test

> Sync 500 members → API rate limits at 200 → system backs off and retries →
> admin sees "200 synced, 0 failed, 300 pending" → after completion: "500 synced"
> OR "485 synced, 15 failed" with per-record error details

---

## 5. Health State Definitions

### 5.1 Canonical States

| State | Definition | User Impact | Admin Action |
|-------|------------|-------------|--------------|
| **healthy** | All operations succeeding, credentials valid, no rate limits | None | None |
| **degraded** | Operations succeeding but with warnings | Delayed processing possible | Monitor; prepare to re-authorize |
| **failed** | Operations not possible | Features unavailable | Immediate re-authorization required |

### 5.2 Degraded Conditions

An integration is **degraded** when ANY of:

- Credential expires within 7 days (`credentialExpiresAt < NOW() + 7d`)
- Currently rate limited (`rateLimitResetAt > NOW()`)
- 2-4 consecutive failures (`2 <= consecutiveFailures < 5`)
- No success in 24 hours with recent failure
- Sync operation completed with errors (>0% but <100% failure)

**Degraded behavior:**

- Integration continues to function
- Admin notification created
- Status visible in admin UI
- Automatic retry logic active

### 5.3 Failed Conditions

An integration is **failed** when ANY of:

- Credential expired (`credentialExpiresAt < NOW()`)
- 5+ consecutive failures (`consecutiveFailures >= 5`)
- Sync operation 100% failed

**Failed behavior:**

- Integration operations blocked
- Critical admin notification created
- Status prominently visible in admin UI
- Manual intervention required

### 5.4 State Transitions

```
        +─────────────────────────────────────────────+
        │                                             │
        v                                             │
   ┌─────────┐    credential warning    ┌──────────┐  │
   │ HEALTHY │ ─────────────────────────>│ DEGRADED │  │
   └────┬────┘                          └─────┬────┘  │
        │                                     │       │
        │  credential expired                 │       │
        │  OR 5+ failures                     │       │  credential refreshed
        │                                     │       │  AND 0 failures
        v                                     v       │
   ┌────────┐     5+ failures           ┌────────┐   │
   │ FAILED │ <─────────────────────────│ FAILED │───┘
   └────────┘                           └────────┘
        │
        │  credential refreshed
        │  AND consecutiveFailures reset
        v
   ┌─────────┐
   │ HEALTHY │
   └─────────┘
```

---

## 6. Admin Notification Model

### 6.1 Notification Types

| Type | Severity | Trigger | Message Pattern |
|------|----------|---------|-----------------|
| `integration_warning` | warning | 7 days before expiry | "{provider} credentials expire in {days} days" |
| `integration_expiring` | urgent | 1 day before expiry | "{provider} credentials expire tomorrow" |
| `integration_expired` | critical | Credential expired | "{provider} credentials have expired" |
| `integration_failing` | warning | 2+ consecutive failures | "{provider} has failed {n} times" |
| `integration_failed` | critical | 5+ consecutive failures | "{provider} integration has failed" |
| `webhook_stuck` | warning | Processing timeout | "{provider} webhook timed out" |
| `webhook_replay_warning` | urgent | >10% duplicate rate | "High webhook duplicate rate detected" |
| `sync_high_failure_rate` | warning | >10% failure in sync | "Sync to {provider}: {n} of {total} failed" |

### 6.2 Notification Deduplication

Prevent notification spam:

```
FUNCTION shouldCreateNotification(tenantId, type, provider):

  existing = Notification.where(
    tenantId: tenantId,
    type: type,
    provider: provider,
    createdAt: > NOW() - 24 hours,
    dismissed: false
  )

  RETURN existing.count == 0
```

### 6.3 Notification Lifecycle

```
CREATED ──> VIEWED ──> DISMISSED
   │
   └──────> RESOLVED (by system when condition clears)
```

---

## 7. API Surface

### 7.1 Integration Health Endpoint

```
GET /api/v1/admin/integrations/health

Response:
{
  "integrations": [
    {
      "provider": "stripe",
      "status": "healthy",
      "credentialExpiresAt": "2026-03-15T00:00:00Z",
      "lastSuccessAt": "2025-12-21T10:30:00Z",
      "consecutiveFailures": 0
    },
    {
      "provider": "google_calendar",
      "status": "degraded",
      "credentialExpiresAt": "2025-12-25T00:00:00Z",
      "lastSuccessAt": "2025-12-21T09:00:00Z",
      "consecutiveFailures": 1,
      "warning": "Credentials expire in 4 days"
    }
  ]
}
```

### 7.2 Sync Operation Status Endpoint

```
GET /api/v1/admin/sync/{operationId}

Response:
{
  "id": "abc-123",
  "provider": "mailchimp",
  "status": "completed_with_errors",
  "totalRecords": 500,
  "successCount": 485,
  "failureCount": 15,
  "pendingCount": 0,
  "failedRecords": [
    {
      "recordId": "member-456",
      "error": "Invalid email format"
    }
  ]
}
```

### 7.3 Retry Failed Records

```
POST /api/v1/admin/sync/{operationId}/retry

Response:
{
  "newOperationId": "def-456",
  "recordsToRetry": 15
}
```

---

## 8. Implementation Checklist

### 8.1 Database Schema

- [ ] Create `IntegrationHealth` table
- [ ] Create `WebhookEvent` table with unique constraint on `idempotencyKey`
- [ ] Create `SyncOperation` table
- [ ] Create `SyncRecord` table
- [ ] Create `AdminNotification` table (if not exists)

### 8.2 Background Jobs

- [ ] `CredentialExpiryChecker` - daily at 06:00 UTC
- [ ] `WebhookHealthChecker` - hourly
- [ ] `StuckSyncDetector` - hourly (operations in_progress > 1 hour)

### 8.3 Webhook Handlers

- [ ] Signature validation before record creation
- [ ] Idempotency check with duplicate counting
- [ ] Processing with failure capture
- [ ] IntegrationHealth update on completion

### 8.4 Sync Handlers

- [ ] Per-record tracking
- [ ] Rate limit detection with exponential backoff
- [ ] Progress resumption from `lastRecordId`
- [ ] IntegrationHealth update on completion

### 8.5 Admin UI

- [ ] Integration health summary view
- [ ] Per-integration detail with credential status
- [ ] Sync operation list with status
- [ ] Failed record viewer with retry action
- [ ] Notification badge for degraded/failed integrations

---

## 9. Verification Matrix

| Guarantee | Test Scenario | Expected Outcome |
|-----------|---------------|------------------|
| TOK-1 | OAuth flow completes | `credentialExpiresAt` populated |
| TOK-2 | Token expires in 5 days | Admin notification created |
| TOK-4 | Token expires in 5 days | Status = degraded |
| TOK-5 | Token expired | Status = failed |
| WH-2 | Same webhook received twice | Second returns 200, no duplicate record |
| WH-3 | Same webhook received 5 times | `attemptCount = 5` on original record |
| WH-4 | Webhook processing throws | `status = failed`, `lastError` populated |
| SYNC-1 | Sync 100 records | 100 SyncRecord rows created |
| SYNC-2 | Rate limit at record 50 | Status = in_progress, pendingCount = 50 |
| SYNC-3 | 5 records fail validation | `failureCount = 5`, each with `lastError` |
| SYNC-6 | 20% failure rate | Admin notification created |

---

## 10. Cross-References

| Document | Relationship |
|----------|--------------|
| [FUTURE_FAILURE_STRESS_TEST.md](./FUTURE_FAILURE_STRESS_TEST.md) | Source: FF-1, FF-3, FF-4 scenarios |
| [WA_FUTURE_FAILURE_IMMUNITY.md](./WA_FUTURE_FAILURE_IMMUNITY.md) | Source: MF-4 pattern definition |
| [ARCHITECTURAL_CHARTER.md](../ARCHITECTURAL_CHARTER.md) | Principle P7: Observability is a product feature |
| [SYSTEM_GUARANTEES.md](../reliability/SYSTEM_GUARANTEES.md) | Guarantee registry |

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-21 | Initial integration health model | ClubOS Architecture |

---

*This document defines the minimum viable integration observability layer.
Status is derived from internal state. No external tooling is required.
Silent failures become visible failures.*
