# ClubOS - Guarantee to Mechanism Matrix

Status: Canonical Specification
Applies to: All environments (dev, staging, production)
Last updated: 2025-12-20

This document maps every reliability guarantee to concrete enforcement mechanisms,
detection signals, and recovery paths.

This document is normative.

---

## 1. Core Rule

Every guarantee MUST map to:
- At least one enforcement mechanism
- At least one detection signal
- At least one recovery path

A guarantee without a mechanism is invalid. A mechanism without detection is unsafe.

---

## 2. Mechanism Layers

- DB: constraints, transactions, locks, migrations, PITR
- App: validation, authorization gates, idempotency keys, concurrency control
- Process: CI gates, change control, runbooks, backups, restore drills
- Human: escalation, incident response, decision logs, approvals

---

## 3. Primary Inputs

- docs/reliability/DATA_INVARIANTS.md
- docs/reliability/WRITE_SAFETY.md
- docs/reliability/READ_SAFETY.md
- docs/reliability/SECURITY_FAILURE_AND_CONTAINMENT.md
- docs/reliability/RECOVERY_AND_RESTORATION.md
- docs/reliability/DEPENDENCY_ISOLATION.md
- docs/reliability/CAPACITY_AND_BACKPRESSURE.md
- docs/reliability/INCIDENT_RESPONSE_AND_RUNBOOKS.md
- docs/reliability/RELEASE_SAFETY_AND_CHANGE_CONTROL.md
- docs/reliability/DATA_PROTECTION_AND_BACKUPS.md
- docs/reliability/DEGRADED_MODE_MATRIX.md
- docs/reliability/OPERATIONAL_OWNERSHIP_AND_ONCALL.md

---

## 4. Guarantee to Mechanism Matrix

Columns:
- Guarantee: the promise we make
- Mechanism: how we enforce it
- Layer: DB/App/Process/Human
- Detection: how we know it failed or is at risk
- Recovery: what we do to restore safety

| Guarantee | Mechanism | Layer | Detection | Recovery |
|---|---|---|---|---|
| No silent data loss of authoritative data | Point-in-time recovery (PITR) + scheduled backups + isolated storage | DB/Process | Backup job health + restore drill results + checksum verification | Human-initiated restore + verification before writes resume |
| No data corruption from partial writes | Single-transaction writes for each domain action | DB/App | Transaction failure logs + invariant checks + error rate spike | Abort write, log incident, block further writes if unclear |
| No writes without auth and authz | requireCapability gates on all write routes | App | Unauthorized/forbidden audit trail + anomaly detection | Enable read-only mode, rotate secrets if needed, fix policy, review logs |
| No privilege escalation without audit trail | Append-only audit log for role changes and admin actions | App/DB | Missing audit entry for admin action | Treat as SEV-1, freeze admin actions, investigate, patch |
| Published content immutability (semantic) | App guard: published pages cannot be edited without explicit unpublish/new revision | App | Attempted edit rejected + audit log | Use revision workflow, rollback release if violated |
| Referential integrity (no orphans) | DB foreign keys or explicit application-level integrity checks | DB/App | Integrity scan jobs + invariant checks | Repair via scripted migration/runbook, block writes until repaired |
| Monotonic timestamps | DB defaults + app constraints; createdAt <= updatedAt | DB/App | Invariant scan detects violations | Manual correction script + incident note |
| Audience enforcement is server-side only | Server-side audience filter applied before render; no client-only hiding | App | Security review checks + tests for leakage | Treat as SEV-1, disable affected routes, hotfix, run leak audit |
| Preview never leaks to public | Separate preview routes + authz gate + noindex + strict fetch policy | App/Process | Access logs + automated leak test | Disable preview feature, rotate preview tokens, patch gate, review logs |
| Degraded mode prefers denial over corruption | Degraded-mode rules: read-only, 404 over partial truth | App/Process/Human | Health checks + incident triggers | Activate degraded mode, execute runbook, restore deps, resume writes only after verification |
| External dependency failure does not take down core | Isolation of external calls; timeouts; circuit breakers; bounded retries | App/Process | Timeout counters + dependency health status | Degrade feature, queue optional work, do not block core writes |
| Capacity exhaustion does not corrupt data | Backpressure: reject writes rather than queue unbounded; rate limits | App/Process | 429/503 rates + queue depth + latency | Activate protective limits, shed load, incident response |
| Admin actions are attributable | Require authenticated admin identity + audit trail | App | Missing actor identity in logs | Treat as SEV-1, freeze admin actions, investigate |
| Every production deploy is traceable | PR-based deploy policy + CI metadata + change class | Process/Human | Deploy audit records | Roll back, lock deploys, fix pipeline |
| Recovery is human-in-the-loop | No auto-restore; runbooks required; verification gates | Process/Human | Restore attempt logs + runbook checklist | Execute restore runbook, verify invariants, resume writes |
| Undefined degraded behavior blocks merge | Spec requirement + PR checklist gate | Process/Human | PR review/CI gate failure | Refuse merge until behavior defined |
| Observability failure increases severity | Explicit degraded handling for metrics/log loss | Process/Human | Monitoring gap alert | Treat as elevated incident; restore observability first |

---

## 5. Coverage Requirements

Minimum coverage for each domain (must be satisfied before production):
- Data: backups, restore drills, invariant checks
- Auth/Authz: gate coverage tests + audit trail
- Publishing: audience enforcement tests + preview leak tests
- Admin: attributable actions + change control
- Capacity: backpressure rules + clear failure signals
- Recovery: runbooks + human approval gates

---

## 6. Open Items (Must Become Mechanisms or Explicit Non-Guarantees)

- Define the concrete audit log storage model and retention
- Define restore verification suite (which invariants run, how, and pass/fail criteria)
- Define read-only mode implementation and activation mechanism
- Define CI enforcement gates for reliability specs (merge blockers)

---

## 7. Enforcement

- Any feature that introduces a new guarantee MUST add a row in this matrix.
- Any feature that violates a mapped mechanism MUST NOT merge.
- Ambiguity resolves toward denial, safety, and reversibility.

