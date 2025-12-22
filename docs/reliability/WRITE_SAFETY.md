# ClubOS — Write Safety and Transactional Guarantees

Status: Canonical Specification  
Applies to: All write paths  
Last updated: 2025-12-20

This document defines when ClubOS is permitted to perform writes,
how writes are validated, and how uncertainty is handled.

This document is normative.

---

## 1. Core Principle

No write is better than a wrong write.

If write safety cannot be guaranteed:
- The write MUST NOT occur
- The system MUST fail closed
- Humans MUST intervene if needed

---

## 2. Preconditions for Any Write

Before performing a write, ClubOS MUST verify:

- Authentication is valid
- Authorization is explicit and sufficient
- Target records exist and are current
- Data invariants will not be violated
- Required dependencies are available

If any precondition fails, the write MUST be rejected.

---

## 3. Atomicity

- Writes MUST be atomic at the domain level.
- Partial updates are forbidden.
- Multi-step changes MUST either fully succeed or fully fail.

If atomicity cannot be guaranteed, the operation MUST NOT execute.

---

## 4. Idempotency

- All externally-triggered writes MUST be idempotent.
- Replaying the same request MUST NOT create duplicates.
- Idempotency keys MUST be enforced where applicable.

---

## 5. Ordering and Concurrency

- Writes MUST operate on the latest known version.
- Stale writes MUST be rejected.
- Concurrent writes MUST resolve deterministically or fail.

Last-write-wins without versioning is forbidden.

---

## 6. Validation Timing

Validation MUST occur:
- Before persistence
- After transformation
- Before side effects

Deferred validation is forbidden.

---

## 7. Side Effects

- Side effects (emails, notifications, jobs) MUST NOT occur
  unless the write commits successfully.
- Side effects MUST be repeatable or cancelable.
- Side effects MUST NOT mutate authoritative data.

---

## 8. Failure Handling

On any write failure:
- No partial data may persist
- The failure MUST be logged
- The caller MUST receive a clear error

Silent failure is forbidden.

---

## 9. Degraded Mode

When any dependency required for safe writes is unavailable:
- Writes MUST be disabled
- Read-only mode MUST activate if possible
- Admin UI MUST display warning state

---

## 10. Explicit Non-Guarantees

ClubOS does NOT guarantee:
- Automatic conflict resolution
- Best-effort writes under failure
- Eventual correction of bad writes

---

## 11. Enforcement

- Any write path not covered by this spec MUST NOT exist.
- Violations are SEV-1 incidents.
- Write safety overrides availability and performance.

This document enforces correctness over convenience.
