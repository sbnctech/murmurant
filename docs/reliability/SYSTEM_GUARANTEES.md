# ClubOS System Guarantees

Status: Draft (Authoritative once approved)
Owner: Architecture / Product
Applies to: All ClubOS services, data stores, and operational workflows

---

## 1. Purpose

ClubOS is the system of record for a membership organization of approximately 700 members.
If ClubOS is unavailable or loses data, organizational operations are materially impaired.

This document defines **explicit system guarantees**:
- What ClubOS guarantees
- What ClubOS does NOT guarantee
- How failures are handled
- How recovery is expected to work

All infrastructure, application logic, and operational decisions MUST conform to these guarantees.

---

## 2. Guiding Principles

1. **Data integrity over availability**
   - The system must never knowingly corrupt or lose confirmed data.
   - Read-only degradation is preferable to unsafe writes.

2. **Fail closed, not open**
   - When uncertain, deny access or actions rather than risk leakage or corruption.

3. **Explicit over implicit behavior**
   - No hidden defaults, inferred state, or silent promotion of visibility.

4. **Recoverability is a first-class feature**
   - A system that cannot be restored is considered incomplete.

5. **Human-operable under stress**
   - Recovery must be executable by a trained volunteer, not only the original developers.

---

## 3. Availability Guarantees

### 3.1 Service Availability Target

- Target uptime: **99.9% monthly**
- Planned maintenance excluded, but must be announced and reversible.

### 3.2 Partial Availability

ClubOS guarantees:
- The system may enter **degraded mode** instead of total outage.
- Read-only access may be enforced during incidents.
- Administrative access may be restricted during instability.

ClubOS does NOT guarantee:
- Zero downtime deployments
- Continuous write availability during failures
- Real-time updates during degraded operation

---

## 4. Data Guarantees (Critical)

### 4.1 Data Durability

ClubOS guarantees:
- No acknowledged write is lost without a documented catastrophic failure.
- All primary data is backed up on a defined schedule.
- Backups are encrypted and retained for a defined period.

### 4.2 Data Integrity

ClubOS guarantees:
- No silent data mutation.
- No background jobs that alter historical records without audit logging.
- Schema migrations must be forward- and backward-compatible during rollout.

ClubOS does NOT guarantee:
- Recovery from manual database tampering
- Preservation of data explicitly deleted by authorized admins

---

## 5. Recovery Objectives

### 5.1 Recovery Time Objective (RTO)

- Target RTO: **< 4 hours** for full service restoration
- Target RTO: **< 1 hour** for read-only access

### 5.2 Recovery Point Objective (RPO)

- Target RPO: **< 15 minutes** for core membership and publishing data

---

## 6. Security Guarantees

ClubOS guarantees:
- No private or restricted content is exposed due to partial failure.
- Authentication failures default to denial.
- Authorization is enforced server-side at all times.

ClubOS does NOT guarantee:
- Protection against compromised admin credentials
- Defense against nation-state actors

---

## 7. Publishing & Visibility Guarantees

ClubOS guarantees:
- Draft content is never visible to unintended audiences.
- Preview does not imply publish.
- Visibility rules are evaluated server-side on every request.

ClubOS does NOT guarantee:
- Atomic multi-page publishes (unless explicitly implemented)
- Rollback of user-perceived publication once cached externally

---

## 8. Operational Guarantees

ClubOS guarantees:
- All critical operations have a written runbook.
- Failures produce observable signals (logs, alerts, admin UI warnings).
- Administrative actions are auditable.

ClubOS does NOT guarantee:
- Automatic recovery from all failures
- Absence of human intervention during incidents

---

## 9. Explicit Non-Goals

The following are intentionally NOT guaranteed:

- Five-nines (99.999%) availability
- Instant global consistency
- Zero data loss under all circumstances
- Self-healing without human oversight
- Complex distributed transactions

---

## 10. Enforcement

- Any feature or change that violates these guarantees MUST NOT be merged.
- Ambiguities are resolved in favor of safety and reversibility.
- This document supersedes informal assumptions.

---

## 11. Change Control

- Changes to this document require:
  - Explicit review
  - Changelog entry
  - Rationale explaining tradeoffs

This document is the foundation for all reliability, resiliency, and operational work in ClubOS.

