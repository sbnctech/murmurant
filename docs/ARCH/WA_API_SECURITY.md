<!--
  Copyright © 2025 Murmurant, Inc. All rights reserved.
-->

# F2: Wild Apricot API Security Controls

```
Status: IMPLEMENTED
Version: 1.0
Created: 2025-12-28
Related: MIGRATION_INTEGRATION_ARCHITECTURE.md, WORK_QUEUE.md F2
```

---

## 1. Overview

This document describes the security controls implemented in the Wild Apricot API proxy layer (`src/lib/wa/`). These controls protect both Murmurant and its customers from abuse while maintaining a developer-friendly API.

---

## 2. Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                      Inbound Request                            │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Layer 1: Authentication                                        │
│  - Require valid session/API key                                │
│  - Verify organization membership                               │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Layer 2: Rate Limiting                                         │
│  - Per-org quotas (read: 100/min, write: 30/min)                │
│  - Return Retry-After headers when exceeded                     │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Layer 3: Input Validation                                      │
│  - Validate IDs, emails, string lengths                         │
│  - Reject oversized payloads (>5MB)                             │
│  - Sanitize HTML content                                        │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Layer 4: Audit Logging                                         │
│  - Log all operations with timestamps                           │
│  - Redact sensitive data                                        │
│  - Track success/failure rates                                  │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Layer 5: External Call Isolation                               │
│  - Timeout enforcement (30s)                                    │
│  - Retry with exponential backoff                               │
│  - Circuit breaker (future)                                     │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      WA API                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Rate Limiting

### 3.1 Limits by Operation Type

| Operation | Limit | Window | Rationale |
|-----------|-------|--------|-----------|
| Read | 100/minute | Per org | Allows browsing, syncs |
| Write | 30/minute | Per org | Prevents bulk mutations |
| Auth | 10/minute | Per org | Limits token churn |

### 3.2 Response Headers

When approaching limits, responses include:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 23
X-RateLimit-Reset: 1703808000
```

When exceeded:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 45
```

### 3.3 Implementation

```typescript
import { checkRateLimit } from "@/lib/wa";

const check = checkRateLimit(orgId, "read");
if (!check.allowed) {
  return new Response("Too Many Requests", {
    status: 429,
    headers: { "Retry-After": String(check.retryAfterMs! / 1000) },
  });
}
```

---

## 4. Input Validation

### 4.1 Validated Fields

| Field Type | Validation | Example |
|------------|------------|---------|
| WA ID | Positive integer | `validateWaId(id, "contactId")` |
| Email | RFC 5322 format | `validateEmail(email)` |
| String | Min/max length | `validateStringLength(name, "name", 1, 100)` |
| Payload | Max 5MB | `validatePayloadSize(body)` |
| Array | Max 500 items | `validateArrayLength(items, "contacts", 500)` |

### 4.2 Validation Errors

Validation failures throw `WaValidationError` with:

- Field name that failed
- Reason for failure
- Original value (redacted if sensitive)

```typescript
try {
  validateWaId(id, "contactId");
} catch (e) {
  if (e instanceof WaValidationError) {
    return { error: e.message, field: e.field };
  }
}
```

---

## 5. Credential Protection

### 5.1 Secure Storage

- Credentials loaded from environment variables only
- Never logged, even at debug level
- Never included in error messages

### 5.2 Sensitive Field Detection

Fields matching these patterns are automatically redacted in logs:

- `password`, `apiKey`, `clientSecret`
- `accessToken`, `refreshToken`
- `ssn`, `creditCard`, `cvv`

```typescript
import { isSensitiveField, redactSensitiveData } from "@/lib/wa";

isSensitiveField("apiKey"); // true
isSensitiveField("firstName"); // false

redactSensitiveData({ name: "test", password: "secret" });
// { name: "test", password: "[REDACTED]" }
```

---

## 6. Audit Logging

### 6.1 What's Logged

Every WA API operation records:

| Field | Description |
|-------|-------------|
| `id` | Unique log entry ID |
| `timestamp` | When the operation occurred |
| `operationType` | AUTH, READ, WRITE, SYNC, RETRY |
| `method` | HTTP method |
| `endpoint` | API endpoint called |
| `entityType` | contact, event, registration |
| `waEntityId` | WA entity ID (if applicable) |
| `userId` | Murmurant user who triggered (if applicable) |
| `orgId` | Organization ID |
| `durationMs` | Request duration |
| `responseStatus` | HTTP response status |
| `success` | Boolean success indicator |
| `error` | Error message if failed |
| `source` | user_action, background_sync, reconciliation, retry |

### 6.2 Log Example

```
[WA-AUDIT] ✓ READ GET /contacts
  { durationMs: 234, status: 200, entityType: 'contact', source: 'user_action' }
```

### 6.3 Privacy Protection

- Sensitive fields redacted before logging
- PII minimized (no full contact data)
- Log entries sanitized for injection prevention

---

## 7. Error Handling

### 7.1 Error Sanitization

External errors are sanitized before returning to clients:

| WA Error | Returned Error |
|----------|----------------|
| "Unauthorized" / 401 | `WA_AUTH_ERROR: Wild Apricot authentication failed` |
| "429 Too Many Requests" | `WA_RATE_LIMITED: Too many requests to Wild Apricot` |
| Timeout / connection | `WA_CONNECTION_ERROR: Unable to connect to Wild Apricot` |
| Other | `WA_ERROR: Wild Apricot request failed` |

### 7.2 Never Exposed

- Internal WA API structure
- Credential details
- Stack traces
- Verbose error messages

---

## 8. Webhook Security

### 8.1 Signature Verification

Incoming webhooks are verified using HMAC-SHA256:

```typescript
import { verifyWebhookSignature } from "@/lib/wa";

const valid = verifyWebhookSignature(rawBody, signature, webhookSecret);
if (!valid) {
  return new Response("Invalid signature", { status: 401 });
}
```

### 8.2 Replay Protection

- Webhook timestamps must be within 5 minutes
- Idempotency keys prevent duplicate processing

```typescript
import { validateWebhook } from "@/lib/wa";

const result = validateWebhook(rawBody, signature, secret);
if (!result.valid) {
  console.log("Rejected:", result.error);
  // "Webhook timestamp too old (possible replay attack)"
  // "Duplicate webhook (already processed)"
}
```

### 8.3 Idempotency

Webhooks are deduplicated using SHA-256 hash of:

- Account ID
- Event type
- Timestamp
- Entity ID

Processed keys are cached for 24 hours.

---

## 9. External Call Isolation

### 9.1 Timeout Enforcement

All WA API calls have a 30-second timeout (configurable via `WA_TIMEOUT_MS`).

### 9.2 Retry Strategy

Failed requests are retried with exponential backoff:

| Attempt | Delay |
|---------|-------|
| 1 | 1 second |
| 2 | 2 seconds |
| 3 | 4 seconds |

Not retried:

- 4xx errors (except 429)
- Validation errors
- Auth errors

### 9.3 Circuit Breaker (Future)

The isolation layer supports circuit breaker configuration:

```typescript
{
  circuitBreakerThreshold: 5, // failures to open
  circuitBreakerResetMs: 60000 // time to half-open
}
```

Currently stubbed (pass-through) per R3 reliability roadmap.

---

## 10. Configuration

### 10.1 Required Environment Variables

| Variable | Description |
|----------|-------------|
| `WA_ACCOUNT_ID` | Wild Apricot account ID |
| `WA_API_KEY` | API key (client_id for OAuth) |
| `WA_CLIENT_SECRET` | Client secret |

### 10.2 Optional Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `WA_API_URL` | `https://api.wildapricot.org/v2.2` | API base URL |
| `WA_TOKEN_URL` | `https://oauth.wildapricot.org/auth/token` | OAuth token URL |
| `WA_TIMEOUT_MS` | 30000 | Request timeout |
| `WA_MAX_RETRIES` | 3 | Max retry attempts |
| `WA_RATE_LIMIT` | 60 | Requests per minute per org |

---

## 11. Usage Examples

### 11.1 Basic Client Usage

```typescript
import { getWaClient } from "@/lib/wa";

const client = getWaClient();
if (!client) {
  // WA not configured
  return;
}

// Get paginated contacts
const page = await client.getContacts({ limit: 50 });

// Get next page
const nextPage = await client.getContacts({ cursor: page.nextCursor });

// Get ALL contacts (handles pagination internally)
const all = await client.getAllContacts();
```

### 11.2 With Error Handling

```typescript
import { getWaClient, WaValidationError, sanitizeWaError } from "@/lib/wa";

try {
  const contact = await client.getContact(contactId);
} catch (e) {
  if (e instanceof WaValidationError) {
    // Invalid input
    return { error: e.message, field: e.field };
  }
  // Sanitize for client
  const { code, message } = sanitizeWaError(e);
  return { error: { code, message } };
}
```

---

## 12. Testing

Unit tests are in `tests/unit/wa/`:

- `security.spec.ts` - Rate limiting, validation, sanitization (32 tests)
- `webhooks.spec.ts` - Signature verification, idempotency (16 tests)
- `config.spec.ts` - Configuration loading (12 tests)

Run tests:

```bash
npm run test:unit -- tests/unit/wa/
```

---

## 13. Module Structure

```
src/lib/wa/
├── index.ts      # Public exports
├── types.ts      # TypeScript types for WA API
├── config.ts     # Configuration loading, sensitive field detection
├── security.ts   # Rate limiting, validation, sanitization
├── audit.ts      # Audit logging
├── client.ts     # WA API client with pagination
└── webhooks.ts   # Webhook handling
```

---

## 14. Related Documents

| Document | Relationship |
|----------|--------------|
| [MIGRATION_INTEGRATION_ARCHITECTURE.md](./MIGRATION_INTEGRATION_ARCHITECTURE.md) | Parent architecture |
| [WORK_QUEUE.md](../backlog/WORK_QUEUE.md) | F2 task definition |
| [MECHANISM_STUBS_AND_OWNERSHIP.md](../reliability/MECHANISM_STUBS_AND_OWNERSHIP.md) | Isolation stubs |

---

_This document describes security controls for F2. F3 (member read-through) builds on this foundation._
