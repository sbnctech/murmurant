# ClubOS — Failure Modes and Guardrails

```
Status: Canonical Specification
Audience: Engineers, Operators, Security Review
Classification: Normative
```

---

## Overview

This document enumerates what can go wrong in ClubOS, defines how each failure mode must be handled, and specifies guardrails that must never be violated.

**Core principle:** Every failure mode has a deterministic, safe outcome. When in doubt, deny access and surface the error.

---

## Part 1: Failure Mode Enumeration

### 1.1 Configuration Failures

| Failure Mode | Trigger | Impact | Safe Outcome |
|--------------|---------|--------|--------------|
| **Config page missing** | Page deleted, route broken | Admin cannot configure feature | Show error page, log incident, feature operates in last-known-good state |
| **Config data corrupted** | Bad migration, manual edit | Feature misconfigured | Reject invalid config, use defaults, alert admin |
| **Required env var missing** | Deployment error | Feature non-functional | Fail startup, do not serve traffic |
| **Database connection failed** | Network, credentials | All features down | Return 503, do not cache errors |

**Deterministic outcomes:**

```
CONFIG MISSING → Use safe defaults → Log warning → Show admin notice
CONFIG INVALID → Reject config → Keep previous → Alert admin
ENV VAR MISSING → Block startup → Force fix before deploy
DB CONNECTION FAILED → 503 to all → Retry with backoff → No stale data served
```

### 1.2 Data Format Failures

| Failure Mode | Trigger | Impact | Safe Outcome |
|--------------|---------|--------|--------------|
| **Invalid JSON in API request** | Malformed client data | Request rejected | 400 with clear error, log requestId |
| **Invalid JSON in stored config** | Data corruption | Config unreadable | Reject, use defaults, alert operator |
| **Schema mismatch** | Version drift, bad migration | Data unprocessable | Reject operation, log schema version expected vs received |
| **Missing required fields** | Client bug, API misuse | Incomplete data | 400 with field-level errors |
| **Type mismatch** | Wrong data type | Validation failure | 400 with expected vs received types |

**Deterministic outcomes:**

```
INVALID JSON REQUEST → 400 Bad Request → { code: "INVALID_JSON", message: "...", requestId }
INVALID JSON CONFIG → Reject config → Use previous/defaults → Admin alert
SCHEMA MISMATCH → 422 Unprocessable → Log version info → Do not guess
MISSING FIELD → 400 Validation Error → List all missing fields
TYPE MISMATCH → 400 Validation Error → Show expected type
```

### 1.3 Access Control Failures

| Failure Mode | Trigger | Impact | Safe Outcome |
|--------------|---------|--------|--------------|
| **Member-only data exposed** | Auth bug, query leak | PII disclosure | NEVER serve without auth check, log as SEV-1 |
| **Admin action without auth** | Missing middleware | Privilege escalation | Block action, audit log, alert |
| **Session expired mid-action** | Time-based expiry | Action interrupted | Reject action, prompt re-auth, preserve draft if safe |
| **Role assignment expired** | Time-bounded role ended | Capability removed | Deny access, no fallback |
| **Impersonation abuse** | Admin misuse | Unauthorized actions | Block dangerous capabilities, full audit trail |

**Deterministic outcomes:**

```
MEMBER DATA WITHOUT AUTH → 401 Unauthorized → NEVER return data → SEV-1 log
ADMIN ACTION WITHOUT AUTH → 401 → Block completely → Audit "auth_bypass_attempt"
SESSION EXPIRED → 401 → Clear session → Redirect to login
ROLE EXPIRED → 403 → No capability granted → Time check on every request
IMPERSONATION BLOCKED → 403 → "Action blocked during impersonation" → Audit
```

### 1.4 External System Failures

| Failure Mode | Trigger | Impact | Safe Outcome |
|--------------|---------|--------|--------------|
| **WA API unavailable** | WA downtime, rate limit | Sync blocked | Queue for retry, show sync status, no stale data served as fresh |
| **WA layout/API changed** | WA updates schema | Parser breaks | Fail gracefully, log schema diff, alert operator |
| **Stripe unavailable** | Payment provider down | Payments blocked | Show maintenance message, queue payments, no duplicate charges |
| **Email delivery failed** | SMTP issues | Notifications lost | Queue for retry, log failures, admin alert for persistent failures |
| **ICS feed malformed** | External calendar error | Calendar sync broken | Show last-known-good, log parse error |

**Deterministic outcomes:**

```
WA API UNAVAILABLE → Queue operation → Show "sync pending" → No data loss
WA SCHEMA CHANGED → Fail parse → Log expected vs received → Operator alert
STRIPE UNAVAILABLE → Show "payments temporarily unavailable" → Queue → No duplicate charges
EMAIL FAILED → Queue with retry → Log attempt → Alert after N failures
ICS MALFORMED → Use last-known-good → Log parse error → No crash
```

### 1.5 UI/UX Failures

| Failure Mode | Trigger | Impact | Safe Outcome |
|--------------|---------|--------|--------------|
| **Page component crash** | React error | Blank page | Error boundary catches, shows fallback UI |
| **Form submission failed** | Network, validation | User action lost | Preserve input, show error, enable retry |
| **Navigation broken** | Route misconfiguration | User stuck | Show home link, log route error |
| **Asset loading failed** | CDN issue, 404 | Broken display | Graceful degradation, alt text, placeholder |

**Deterministic outcomes:**

```
COMPONENT CRASH → Error boundary → Fallback UI → Log error with stack
FORM FAILED → Preserve input → Show error message → Enable retry
ROUTE BROKEN → 404 page with home link → Log missing route
ASSET FAILED → Placeholder/alt text → No broken image icons
```

### 1.6 Migration-Specific Failures

| Failure Mode | Trigger | Impact | Safe Outcome |
|--------------|---------|--------|--------------|
| **Discovery crawler blocked** | WA auth, robots.txt | Incomplete inventory | Log blocked pages, report partial results |
| **Embed URL not allowlisted** | Unknown source | Embed blocked | Show placeholder, log URL for review |
| **Custom HTML unsafe** | Script tags detected | Content excluded | Log as UNSUPPORTED, operator notified |
| **Member data mismatch** | Field mapping error | Wrong data migrated | Dry-run first, require approval, rollback available |
| **Cutover rehearsal failed** | Any verification step | Migration blocked | Abort rehearsal, preserve WA unchanged, log failure |

**Deterministic outcomes:**

```
CRAWLER BLOCKED → Report partial → List blocked URLs → Operator decision
EMBED NOT ALLOWLISTED → Placeholder UI → "Embed pending approval" → Log for review
UNSAFE HTML → Exclude from migration → Flag as UNSUPPORTED → Operator sees in report
DATA MISMATCH → Block migration → Require manual review → No silent data loss
REHEARSAL FAILED → Abort → WA unchanged → Detailed failure log
```

---

## Part 2: Error UI Patterns

### 2.1 Admin-Visible Errors

Admin users see detailed error information to enable debugging.

**Pattern: Admin Error Panel**

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠ Configuration Error                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Unable to load SafeEmbed allowlist configuration.           │
│                                                             │
│ Details:                                                    │
│ • Error: JSON parse error at line 42                        │
│ • File: /config/safeembed-allowlist.json                    │
│ • Timestamp: 2024-12-26T10:30:00Z                           │
│ • Request ID: req-abc123                                    │
│                                                             │
│ The system is using the previous valid configuration.       │
│                                                             │
│                                [View Logs] [Retry] [Dismiss] │
└─────────────────────────────────────────────────────────────┘
```

**Admin error content includes:**

- Specific error type and message
- Affected resource/file/endpoint
- Timestamp and request ID for log correlation
- Current system state (fallback, degraded, etc.)
- Actionable buttons (retry, view logs, contact support)

### 2.2 Public-Visible Errors

Public/member users see friendly messages without technical details.

**Pattern: Public Error Message**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    ┌─────────────────┐                      │
│                    │       ⚠️        │                      │
│                    └─────────────────┘                      │
│                                                             │
│             Something went wrong                            │
│                                                             │
│     We couldn't complete your request. Please try           │
│     again in a few moments.                                 │
│                                                             │
│     If this continues, contact your club administrator.     │
│                                                             │
│     Reference: REQ-ABC123                                   │
│                                                             │
│                    [Try Again] [Go Home]                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Public error content includes:**

- Friendly, non-technical message
- Actionable guidance (try again, contact admin)
- Reference ID for support (no sensitive details)
- No stack traces, file paths, or internal codes

### 2.3 Error UI Decision Matrix

| Error Type | Admin Sees | Public Sees |
|------------|------------|-------------|
| **Validation error** | Field-level errors with expected types | "Please check your input" |
| **Auth failure** | Capability required vs granted | "Please sign in" or "Access denied" |
| **Config error** | File path, JSON error, fallback state | "Feature temporarily unavailable" |
| **Network error** | Endpoint, status code, retry count | "Connection issue, please retry" |
| **System error** | Stack trace, request ID, component | "Something went wrong" + reference ID |
| **Migration error** | Source URL, classification, reason | N/A (admin-only surface) |

### 2.4 Error Component Usage

**AccessDenied (403)**

```tsx
<AccessDenied
  title="Access Denied"
  message="You need administrator access for this page."
  requiredAccess="admin:manage-users"
  showContactAdmin={true}
/>
```

**ConfigError (Admin Only)**

```tsx
<ConfigError
  error={error}
  configPath="/settings/safeembed"
  fallbackState="Using previous configuration"
  onRetry={handleRetry}
/>
```

**PublicError (500)**

```tsx
<PublicError
  message="We couldn't complete your request."
  referenceId={requestId}
  showRetry={true}
/>
```

---

## Part 3: Security Assertions

These assertions MUST always hold. Violation is a SEV-1 incident.

### 3.1 Authentication Assertions

| ID | Assertion | Enforcement |
|----|-----------|-------------|
| A1 | Every protected route requires `requireAuth()` | Pre-commit hook, route audit |
| A2 | Session tokens expire and are not reusable after expiry | Token validation on every request |
| A3 | Auth state cannot be inferred from UI visibility | Server-side checks only |
| A4 | Failed auth attempts are rate-limited | Middleware, per-IP tracking |
| A5 | Session revocation is immediate and complete | No cached session data served |

### 3.2 Authorization Assertions

| ID | Assertion | Enforcement |
|----|-----------|-------------|
| Z1 | Capabilities are checked server-side, never UI-only | Code review, contract tests |
| Z2 | Role expiration is checked at request time | Time-bounded role validation |
| Z3 | Object-scoped access uses explicit scope checks | `requireCapabilityWithScope()` |
| Z4 | Impersonation blocks dangerous capabilities | Hard-coded blocked list |
| Z5 | Fallback to less restrictive permission is forbidden | No fallback in auth layer |

### 3.3 Data Protection Assertions

| ID | Assertion | Enforcement |
|----|-----------|-------------|
| D1 | Member PII is never returned without auth | Query-level filtering |
| D2 | Audit logs are append-only and immutable | Database constraints |
| D3 | Deleted data is soft-deleted with audit trail | No hard deletes without review |
| D4 | Exported data respects field-level privacy | Export filter by visibility |
| D5 | Error messages never expose PII | Error sanitization layer |

### 3.4 Input Validation Assertions

| ID | Assertion | Enforcement |
|----|-----------|-------------|
| V1 | All user input is validated server-side | Zod schemas, type coercion |
| V2 | File uploads are type-checked and size-limited | Middleware validation |
| V3 | URLs are validated against allowlist | SafeEmbed, external links |
| V4 | HTML content is sanitized before storage | No raw HTML from users |
| V5 | SQL injection is impossible | Parameterized queries (Prisma) |

### 3.5 Audit Assertions

| ID | Assertion | Enforcement |
|----|-----------|-------------|
| U1 | Every privileged action is logged | `auditMutation()` required |
| U2 | Audit logs include actor identity | Auth context attached |
| U3 | Audit logs include timestamp and IP | Request context attached |
| U4 | Missing audit is itself a security failure | Pre-commit audit check |
| U5 | Audit data is retained per policy | Retention schedule enforced |

---

## Part 4: Do Not Regress Checklist

Before merging any PR, verify these invariants hold.

### 4.1 Authentication Invariants

- [ ] All admin routes call `requireAuth()` or `requireCapability()`
- [ ] No route uses UI-only gating (hiding buttons is not security)
- [ ] Session validation happens on every request
- [ ] Auth failures return 401/403, never 200 with empty data
- [ ] Test tokens only work in development mode

### 4.2 Authorization Invariants

- [ ] Capability checks use `hasCapability()`, not role string comparison
- [ ] Time-bounded roles are validated at request time
- [ ] Object-scoped resources check scope, not just capability
- [ ] Impersonation blocks: `finance:manage`, `comms:send`, `users:manage`, `events:delete`, `admin:full`
- [ ] No "if admin then allow all" patterns

### 4.3 Data Protection Invariants

- [ ] Member queries filter by auth context
- [ ] PII fields respect visibility settings
- [ ] Error responses are sanitized (no stack traces in production)
- [ ] Deleted records are soft-deleted with audit
- [ ] Export endpoints respect field-level privacy

### 4.4 Input Validation Invariants

- [ ] Request bodies are validated with Zod schemas
- [ ] File uploads check MIME type and size
- [ ] URLs are validated against allowlist (SafeEmbed)
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] All database queries use Prisma (no raw SQL)

### 4.5 Audit Invariants

- [ ] `auditMutation()` called for CREATE, UPDATE, DELETE, PUBLISH, SEND
- [ ] Auth context attached to all audit logs
- [ ] Request ID included for correlation
- [ ] Failed operations are also logged
- [ ] Audit failures do not block operations (log-and-continue)

### 4.6 Error Handling Invariants

- [ ] Errors are caught and logged (no silent failures)
- [ ] Error responses include request ID
- [ ] Admin errors show details; public errors are sanitized
- [ ] Error boundaries prevent full-page crashes
- [ ] Form failures preserve user input

### 4.7 Migration-Specific Invariants

- [ ] SafeEmbed only renders allowlisted domains
- [ ] Two-person approval required for new embed sources
- [ ] UNSUPPORTED content is excluded, not guessed
- [ ] Cutover rehearsal failures abort (no partial migration)
- [ ] WA data is unchanged until explicit commit

---

## Part 5: Error Response Reference

### HTTP Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 400 | Bad Request | Invalid input, malformed JSON, validation failure |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but lacks permission |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | State mismatch, concurrent edit |
| 422 | Unprocessable | Valid JSON but semantically wrong |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Error | Unexpected server error |
| 503 | Service Unavailable | Maintenance, database down |

### Error Response Schema

```typescript
interface ErrorResponse {
  code: string;              // Machine-readable error code
  message: string;           // Human-readable description
  details?: {
    requestId: string;       // For log correlation
    field?: string;          // For validation errors
    expected?: string;       // For type mismatches
    received?: string;       // For type mismatches
    [key: string]: unknown;  // Additional context
  };
}
```

### Example Error Responses

**Validation Error (400)**

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid request data",
  "details": {
    "requestId": "req-abc123",
    "field": "email",
    "expected": "valid email address",
    "received": "not-an-email"
  }
}
```

**Auth Required (401)**

```json
{
  "code": "UNAUTHORIZED",
  "message": "Authentication required",
  "details": {
    "requestId": "req-abc123"
  }
}
```

**Permission Denied (403)**

```json
{
  "code": "FORBIDDEN",
  "message": "You don't have permission for this action",
  "details": {
    "requestId": "req-abc123",
    "required": "events:delete",
    "reason": "Capability not granted"
  }
}
```

---

## Part 6: Incident Response

### Severity Levels

| Level | Definition | Response Time | Examples |
|-------|------------|---------------|----------|
| SEV-1 | Security breach, data exposure | Immediate | Auth bypass, PII leak, privilege escalation |
| SEV-2 | Service degraded, feature broken | 1 hour | Payment failures, sync broken, admin down |
| SEV-3 | Minor issue, workaround exists | 4 hours | UI glitch, slow performance, cosmetic bug |
| SEV-4 | Improvement opportunity | Next sprint | Documentation, minor enhancement |

### SEV-1 Response Protocol

1. **Contain** - Disable affected feature or route
2. **Assess** - Determine blast radius
3. **Notify** - Alert stakeholders
4. **Investigate** - Review audit logs
5. **Remediate** - Fix root cause
6. **Verify** - Confirm fix works
7. **Document** - Post-mortem within 48 hours

---

## Related Documents

- [Security Failure and Containment](./SECURITY_FAILURE_AND_CONTAINMENT.md) - Core containment principles
- [Architectural Charter](../ARCHITECTURAL_CHARTER.md) - P1-P10 principles
- [Threat Model](../SECURITY/THREAT_MODEL.md) - Assets and risks
- [SafeEmbed Allowlist Policy](../ARCH/SAFEEMBED_ALLOWLIST_POLICY.md) - Embed security

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2024-12-26 | System | Initial specification with failure modes, UI patterns, assertions |
