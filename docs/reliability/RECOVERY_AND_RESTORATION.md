# Murmurant — Recovery and Restoration Guarantees

Status: Canonical Specification  
Applies to: All production data and services  
Last updated: 2025-12-20

This document defines how Murmurant recovers from failures and restores
service while preserving data integrity and organizational trust.

This document is normative.

---

## 1. Core Principle

Recovery MUST:
- Preserve data integrity
- Prefer correctness over speed
- Avoid compounding failures
- Be understandable by humans

A fast recovery that corrupts data is a failure.

---

## 2. Recoverable Failure Classes

Murmurant explicitly supports recovery from:

- Application crashes
- Partial deploy failures
- Background job failures
- External integration outages
- Admin misconfiguration
- Operator error (with audit trail)

Recovery does NOT imply zero downtime.

---

## 3. Irrecoverable Failures

The following are considered irrecoverable without data loss:

- Simultaneous corruption of primary data and all backups
- Malicious deletion outside access controls
- Undetected invariant violations over time

These are escalated as SEV-1 with disclosure.

---

## 4. Recovery Guarantees

Murmurant guarantees that:

- Authoritative data can be restored to a known-good state
- Restoration can be performed without reintroducing writes
- Recovery actions are auditable
- Partial restoration is forbidden unless explicitly supported

---

## 5. Restoration Safety Rules

During restoration:
- All writes MUST be disabled
- Reads MUST be clearly marked as stale or unavailable
- Side effects MUST be suspended
- Admin access MUST remain available

Restoration is a controlled operation, not normal runtime.

---

## 6. Rollback Semantics

Rollback means:
- Reverting to a previously known-valid state
- NOT replaying unsafe operations
- NOT merging partial states

Rollback is explicit, deliberate, and documented.

---

## 7. Human-in-the-Loop Requirement

Recovery MUST:
- Require explicit human initiation
- Produce a checklist or runbook
- Allow verification before resuming writes

Automatic recovery without visibility is forbidden.

---

## 8. Verification Before Resume

Before resuming normal operation:
- Invariants MUST be rechecked
- Data counts MUST be reconciled
- Admin sign-off MUST occur

Resumption without verification is forbidden.

---

## 9. Explicit Non-Guarantees

Murmurant does NOT guarantee:
- Zero data loss under all conditions
- Automatic recovery without humans
- Instant restoration
- Perfect rollback for all failures

---

## 10. Enforcement

- Features without a recovery story MUST NOT merge
- Undefined restoration behavior is a SEV-1 risk
- Safety overrides availability

This document defines survivability, not perfection.
