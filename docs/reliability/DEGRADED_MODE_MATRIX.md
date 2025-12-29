# Murmurant — Degraded Mode Matrix

Status: Canonical Specification  
Applies to: Production operations  
Last updated: 2025-12-20

This document defines how Murmurant behaves when parts of the system are degraded,
unavailable, or unsafe. Degraded behavior MUST be predictable, conservative,
and reversible.

This document is normative.

---

## 1. Core Principle

When in doubt:
- Prefer READ-ONLY over WRITE
- Prefer 404 over partial leakage
- Prefer denial over corruption
- Prefer manual recovery over automation

---

## 2. Failure Domains

Murmurant recognizes the following independent failure domains:

- Database
- Authentication / Identity
- Authorization / Permissions
- Publishing / Page Rendering
- Admin UI
- External Integrations
- Background Jobs
- Notifications / Email
- Observability

Each domain has explicit degraded behavior.

---

## 3. Database Failure

### Symptoms
- Connection failure
- Read timeout
- Write failure
- Partial replication

### Behavior
- Public site: HARD FAIL (503)
- Member site: HARD FAIL (503)
- Admin UI: HARD FAIL (503)
- Writes: BLOCKED
- Reads: BLOCKED

### Rationale
Serving stale or partial data risks corruption and trust loss.

---

## 4. Authentication Failure

### Symptoms
- Identity provider unavailable
- Session validation failure

### Behavior
- Public pages: READ-ONLY, unauthenticated view only
- Member pages: 401
- Admin pages: 401
- Writes: BLOCKED

### Rationale
Auth failure must never downgrade to elevated access.

---

## 5. Authorization / Permission Failure

### Symptoms
- Role lookup failure
- Permission evaluation error

### Behavior
- All protected routes: DENY (403)
- Admin UI: DISABLED
- Writes: BLOCKED

### Rationale
Fail closed. Never guess permissions.

---

## 6. Publishing System Failure

### Symptoms
- Page rendering error
- Content schema mismatch
- Block rendering failure

### Behavior
- Public pages: 404 (not 500)
- Member pages: 404
- Admin preview: ERROR WITH CONTEXT
- Publishing actions: BLOCKED

### Rationale
Avoid leaking internal state or broken layouts.

---

## 7. Admin UI Failure

### Symptoms
- JS bundle failure
- API contract mismatch

### Behavior
- Admin UI: UNAVAILABLE
- Public/member views: UNAFFECTED
- Admin writes: BLOCKED

### Rationale
Admin failure must not impact members.

---

## 8. External Integration Failure

### Examples
- Payment processor
- Email service
- Calendar sync

### Behavior
- Core system: CONTINUES
- Affected feature: DISABLED WITH WARNING
- Financial actions: BLOCKED if unsafe

### Rationale
External dependencies are optional, not authoritative.

---

## 9. Background Job Failure

### Symptoms
- Queue stalled
- Job retries exhausted

### Behavior
- User-facing actions: CONTINUE
- Deferred effects: DELAYED
- Admin UI: SHOW WARNINGS

### Rationale
Jobs are conveniences, not gates.

---

## 10. Notification / Email Failure

### Symptoms
- SMTP down
- API failure

### Behavior
- Core actions: CONTINUE
- Notifications: SKIPPED
- Admin UI: WARN

### Rationale
Email is non-authoritative.

---

## 11. Observability Failure

### Symptoms
- Logs unavailable
- Metrics missing

### Behavior
- System: CONTINUES
- Admin UI: WARN
- Incident severity: INCREASED

### Rationale
Running blind increases risk but is preferable to shutdown.

---

## 12. Escalation Rules

Any degraded mode that persists longer than:
- 1 hour (production)
- 24 hours (non-critical)

MUST:
- Trigger human review
- Produce a written incident note

---

## 13. Explicit Non-Guarantees

Murmurant does NOT guarantee:
- Graceful degradation for unknown failures
- Automatic recovery from cascading failures
- Correct behavior if multiple domains fail simultaneously

---

## 14. Enforcement

- New features MUST define degraded behavior.
- Undefined degraded behavior is a merge blocker.
- Ambiguity resolves toward denial and safety.

