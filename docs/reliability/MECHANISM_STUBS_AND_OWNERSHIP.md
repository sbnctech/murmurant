# Murmurant - Mechanism Stubs and Ownership

Status: Canonical Planning Specification
Applies to: Pre-deployment readiness
Last updated: 2025-12-28

This document maps reliability guarantees to concrete mechanism stubs, their
intended system locations, explicit human ownership, and implementation status.

This document is descriptive only.
It MUST NOT enable behavior, change runtime logic, alter infrastructure, or
modify data paths.

---

## 1. Core Rule

Every reliability guarantee MUST have:
- A named mechanism stub
- A clear system location
- A human owner
- An explicit implementation status

A guarantee without an owner is invalid.
A mechanism without a status is unsafe.

---

## 2. Mechanism Status Vocabulary (Strict)

Each mechanism MUST be in exactly one state:

- Defined     - Specified, not built
- Stubbed     - Code placeholder exists, inert
- Implemented - Built, not enabled
- Enabled     - Active in production
- Deferred    - Explicitly postponed with rationale

Any other status is forbidden.

---

## 3. Global Safety Rule

Nothing in this document:
- Enables behavior
- Changes runtime logic
- Alters infrastructure
- Modifies data paths

This document is a map, not a mandate.

---

## 4. Mechanism Stub Matrix (Initial)

Columns:
- Guarantee: the promise we make
- Mechanism stub: the concrete thing that will exist
- Location: where it lives (DB/App/Infra/Process/Human)
- Owner: named individual or "TBD"
- Status: Defined/Stubbed/Implemented/Enabled/Deferred
- Notes: factual only

| Guarantee | Mechanism stub | Location | Owner | Status | Notes |
|---|---|---|---|---|---|
| No silent data loss of authoritative data | Backup execution job | Infra | TBD | Stubbed | src/lib/reliability/backup.ts (dry-run) |
| Point-in-time recovery (PITR) | PITR/WAL configuration | DB/Infra | TBD | Defined | Provider-dependent capability |
| No partial writes | Single-transaction write wrapper | App | TBD | Implemented | Use for every domain write |
| Read-only degraded mode | WRITE_GUARD global gate | App | TBD | Stubbed | src/lib/reliability/guards.ts (always allow) |
| Publishing freeze | PUBLISH_GUARD global gate | App | TBD | Stubbed | src/lib/reliability/guards.ts (always allow) |
| Preview isolation | Preview route authorization gate | App | TBD | Implemented | No public preview access |
| Audience enforcement | Server-side audience filter | App | TBD | Enabled | Must remain server-side only |
| Audit log | Append-only audit table + writer | DB/App | TBD | Implemented | src/lib/audit.ts (DB table + writer) |
| Admin attribution | requireActor middleware | App | TBD | Enabled | Actor required for admin actions |
| Kill switches | Server-side feature flags | App | TBD | Stubbed | src/lib/reliability/killSwitch.ts (all OFF) |
| Dependency isolation | Timeout + circuit policy | App | TBD | Stubbed | src/lib/reliability/isolation.ts (pass-through) |
| Backpressure | Rate limit + reject policy | App/Infra | TBD | Stubbed | src/lib/reliability/backpressure.ts (no-op) |
| Incident logging | Incident record template | Process/Human | System Owner | Defined | Manual until tooling exists |
| Restore verification | Invariant verification suite | App/DB | TBD | Stubbed | src/lib/reliability/backup.ts (fixture-only) |
| Failure injection | Test-only injectors + scenarios | Test/Process | TBD | Stubbed | src/lib/reliability/failureInjection.ts (disabled) |

---

## 5. Ownership Rules

- TBD owners are acceptable pre-deployment.
- No deployment is allowed while any production-critical mechanism has Owner=TBD.
- Ownership implies authority to:
  - Enable/disable the mechanism
  - Execute the runbook
  - Approve irreversible actions
  - Record decision logs

---

## 6. Explicit Non-Goals

This document does NOT:
- Create tasks
- Approve implementation
- Schedule work
- Enable deployment
- Resolve architectural debates

---

## 7. Enforcement

- Any new guarantee MUST add a row here.
- Any mechanism moving to Enabled MUST:
  - Update status in this file
  - Reference a PR
  - Pass docs/reliability/DEPLOYMENT_READINESS_CHECKLIST.md
- Silent activation is a SEV-1 violation.

