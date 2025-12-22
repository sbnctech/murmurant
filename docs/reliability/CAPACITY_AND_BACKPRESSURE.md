# ClubOS — Capacity, Load, and Backpressure Guarantees

Status: Canonical Specification  
Applies to: All production environments  
Last updated: 2025-12-20

This document defines how ClubOS behaves under load, contention,
and resource exhaustion. Overload MUST NOT cause data loss
or undefined behavior.

This document is normative.

---

## 1. Core Principle

When capacity is exceeded:
- Reject work rather than queue indefinitely
- Slow down before failing
- Fail safely and visibly

Overload is a normal condition, not an exception.

---

## 2. Load Classes

ClubOS recognizes the following load classes:

- Public read traffic
- Authenticated member actions
- Admin actions
- Background jobs
- External integration callbacks

Each class has independent limits.

---

## 3. Write Backpressure

When write capacity is constrained:
- New writes MUST be rejected
- Partial writes are forbidden
- Clients MUST receive explicit failure

Write rejection is safer than degraded writes.

---

## 4. Read Behavior Under Load

Under read pressure:
- Public reads MAY be throttled
- Authenticated reads take priority
- Admin reads take highest priority

Stale or partial reads are forbidden.

---

## 5. Background Job Limits

Background jobs:
- MUST be bounded
- MUST be idempotent
- MUST tolerate retry or cancellation

Job backlogs MUST NOT block interactive use.

---

## 6. External Dependency Backpressure

When external services degrade:
- Related features MUST degrade
- Core system MUST continue
- Retries MUST be bounded

External slowness must not propagate.

---

## 7. Admin Visibility

Under load:
- Admin UI MUST surface warnings
- Operators MUST see queue depth or rejection counts
- Silent overload is forbidden

---

## 8. Degraded Mode Interaction

Capacity exhaustion:
- Triggers degraded mode
- May force read-only operation
- MUST be reversible without restart

---

## 9. Explicit Non-Guarantees

ClubOS does NOT guarantee:
- Infinite throughput
- Zero latency spikes
- No request rejection
- Automatic scaling

---

## 10. Enforcement

- Features without load behavior MUST NOT merge
- Unbounded queues are forbidden
- Safety overrides throughput

This document defines survivability under stress.
