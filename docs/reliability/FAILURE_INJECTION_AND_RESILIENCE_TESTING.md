# Murmurant — Failure Injection and Resilience Testing

Status: Canonical Specification  
Applies to: Staging and controlled production scenarios  
Last updated: 2025-12-20

This document defines how Murmurant deliberately injects failures to validate
system guarantees, degraded modes, recovery paths, and data safety.

This document is normative.

---

## 1. Core Principle

Failure injection exists to prove that Murmurant behaves correctly when things go wrong.

Failure injection MUST verify:
- Guarantees are enforced
- Writes fail safely
- Reads fail closed
- Degraded modes activate correctly
- Recovery paths require human approval when specified
- No silent corruption occurs

Failure injection is a validation mechanism, not a debugging tool.

---

## 2. Scope of Failure Injection

Failure injection MUST cover all defined failure domains:

- Database
- Authentication
- Authorization
- Publishing
- Admin UI
- Background jobs
- External dependencies
- Capacity and load
- Observability
- Backups
- Recovery
- Security containment

No failure domain may remain untested.

---

## 3. Failure Injection Categories

### 3.1 Read Safety Tests
Inject:
- Missing authentication
- Wrong audience
- Corrupted dependency

Expected behavior:
- 404 or explicit denial
- No partial or mixed data

---

### 3.2 Write Safety Tests
Inject:
- Mid-write failure
- Duplicate requests
- Stale version writes

Expected behavior:
- Atomic failure
- No partial persistence
- Clear error returned

---

### 3.3 Degraded Mode Activation
Inject:
- Database write unavailability
- External dependency outage

Expected behavior:
- Writes disabled
- Safe reads only
- Admin UI warning visible

---

### 3.4 Invariant Violation Simulation
Inject illegal states:
- Orphaned blocks
- Invalid status combinations
- Referential breaks

Expected behavior:
- Operation blocked
- SEV-1 incident generated

---

### 3.5 Backup and Restore Validation
Inject:
- Backup job failure
- Checksum mismatch on restore

Expected behavior:
- Alert raised
- Restore halted
- Human approval required

---

### 3.6 Security Containment Tests
Simulate:
- Authorization bypass attempts
- Token misuse
- Privilege escalation

Expected behavior:
- Writes disabled
- Access restricted
- Audit log entry created

---

## 4. Execution Model

Failure injection MUST be:
- Explicitly triggered
- Logged
- Time-bounded
- Reversible

Allowed mechanisms:
- Feature flags
- Fault-injection middleware
- Dependency mocks (staging)
- Configuration toggles

Forbidden:
- Random chaos
- Silent injection
- Unlogged tests
- Production-only surprises

---

## 5. Required Test Outputs

Each failure injection MUST produce:
- Test name
- Failure injected
- Expected behavior
- Observed behavior
- Pass or fail result
- Related guarantee(s)
- Related recovery path(s)

Undocumented tests are invalid.

---

## 6. Severity Classification

| Outcome | Severity |
|-------|----------|
| Silent data corruption | SEV-1 |
| Unauthorized access | SEV-1 |
| Incorrect data served | SEV-1 |
| Write blocked safely | PASS |
| Read denied safely | PASS |
| Observability missing | SEV-2 |

---

## 7. Linkage Requirements

Each failure injection MUST reference:
- docs/reliability/GUARANTEE_TO_MECHANISM_MATRIX.md
- At least one reliability specification
- At least one runbook when human action is required

---

## 8. Explicit Non-Goals

Failure injection does NOT aim to:
- Guarantee uptime
- Simulate every possible bug
- Replace formal verification
- Run continuously

The goal is confidence, not chaos.

---

## 9. Enforcement

- New guarantees REQUIRE failure injection coverage
- Missing failure injection tests block merge
- Skipped tests require explicit written exemption

