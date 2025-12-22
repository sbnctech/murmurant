# ClubOS - R3: Stub Mechanisms and CI Wiring (Pre-Deployment)

Status: Canonical Planning + Implementation Specification
Applies to: All environments (dev, staging, production)
Last updated: 2025-12-20

This document defines R3 work: create INERT mechanism stubs and wire them
into the codebase and CI so that future enabling is controlled, reviewable,
and reversible.

This phase MUST NOT:
- Enable degraded modes
- Change runtime behavior
- Alter infrastructure
- Change production deployment posture

R3 exists to make ClubOS "ready to be deployed if directed" without actually
deploying or activating reliability controls.

This document is normative for R3.

---

## 1. Core Rule

Mechanism lifecycle is strict:

Defined -> Stubbed -> Implemented -> Enabled

R3 produces: Stubbed (and some Implemented in dev-only test harnesses),
but MUST NOT produce Enabled behavior.

---

## 2. R3 Deliverables (Summary)

R3 creates:

A) Code stubs (inert by default)
- WRITE_GUARD (global write gate)
- PUBLISH_GUARD (publishing freeze gate)
- AUDIT_LOG writer interface + no-op implementation (or DB table only, still inert)
- KILL_SWITCH registry (server-side flags, default all false)
- DEPENDENCY_ISOLATION helpers (timeouts/circuit wrappers, default pass-through)
- BACKPRESSURE helpers (rate limit facade, default disabled)
- BACKUP job scaffold (dry-run/no-op)
- RESTORE verification scaffold (runs against fixtures, not prod)
- FAILURE injection harness (compile-time disabled)

B) CI wiring (merge blockers without runtime changes)
- "No direct writes" lint/check: all write paths must use write wrapper
- "Guards referenced" check: write/publish routes must call guards (even if no-op)
- "Audit actor required" check: admin routes must require actor context
- "Reliability docs present" check: required docs exist and are linked
- "Mechanism status update" check: when a mechanism stub is added/changed, update MECHANISM_STUBS_AND_OWNERSHIP.md

C) Minimal runbook scaffolds (not production-ready)
- Runbook templates for: Read-only activation, Publish freeze, Backup verify, Restore drill
- Each template includes: Preconditions, Steps, Verification, Rollback, Decision log

---

## 3. Non-Goals (Explicit)

R3 does NOT:
- Turn on read-only mode
- Add real rate limiting
- Configure PITR/backups in a cloud provider
- Add on-call rotation
- Build incident tooling UI
- Run failure injection in production
- Change publishing behavior

---

## 4. Mechanism Stub Requirements

All stubs MUST:
- Default to "allow" (no new denials)
- Be server-side only
- Emit structured logs when invoked (debug level acceptable)
- Include a single "activation point" (centralized) so enabling later is not scattered
- Have unit tests proving default behavior is inert

All stubs MUST be ASCII-only and carry SBNC copyright headers.

---

## 5. WRITE_GUARD Stub

Intent: Central place to block writes in the future.

R3 requirement:
- Implement function: canWrite(context): { allowed: true } always
- Every write route must call it
- Unit tests:
  - default allows
  - guard is invoked (spy/expect)

---

## 6. PUBLISH_GUARD Stub

Intent: Central place to freeze publishing in the future.

R3 requirement:
- Implement function: canPublish(context): { allowed: true } always
- Publish endpoints must call it
- Unit tests:
  - default allows
  - guard is invoked

---

## 7. Audit Log Stub

Intent: Ensure "admin actions are attributable" is never optional.

R3 requirement:
- Define audit event shape (type, actorId, action, target, metadata, timestamp)
- Create a no-op sink in dev (or a DB table with writer that is called but no retention policy yet)
- Enforce that all admin write routes call audit(). Missing calls fail tests.

Unit tests:
- audit() is called with actorId for admin actions
- audit() rejects missing actorId (in dev/test)

---

## 8. Kill Switch Registry Stub

Intent: Central registry of server-side switches, all OFF by default.

R3 requirement:
- Define enumerated switches:
  - WRITE_DISABLED
  - PUBLISH_DISABLED
  - ADMIN_DISABLED (optional)
  - PREVIEW_DISABLED (optional)
- Provide getter that returns false for all
- No environment variable activation in R3 (pure stub)

Unit tests:
- switches default false

---

## 9. Dependency Isolation Wrapper Stub

Intent: Wrap external calls with timeouts/circuit semantics later.

R3 requirement:
- Provide helper: withIsolation(name, fn) that calls fn directly (pass-through)
- Add structured log point (debug)
- No timeouts enforced in R3

Unit tests:
- pass-through behavior
- wrapper invoked

---

## 10. Backpressure Facade Stub

Intent: Centralize future rate limiting/backpressure.

R3 requirement:
- Provide helper: enforceBackpressure(classification) that is no-op
- No runtime throttling in R3
- Ensure all high-risk routes call it (even though inert)

Unit tests:
- no-op
- called by routes (minimal)

---

## 11. Backup Job Scaffold (Dry-Run)

Intent: A runnable job entrypoint that does not touch real infrastructure.

R3 requirement:
- Create script/command that:
  - Enumerates authoritative tables/models
  - Prints intended backup plan (dataset id, timestamp)
  - Exits 0
- No credentials or provider integration

Unit tests:
- command runs
- output contains dataset id and timestamp

---

## 12. Restore Verification Scaffold

Intent: Build the verification suite that will later gate restores.

R3 requirement:
- Create "verify invariants" runner that:
  - Runs against test fixtures / local DB only
  - Checks a small set of invariants (smoke)
  - Produces pass/fail report

Unit tests:
- passes on valid fixture
- fails on invalid fixture

---

## 13. Failure Injection Harness (Disabled)

Intent: Provide explicit injection points without chaos.

R3 requirement:
- Implement injection framework that is compile-time disabled:
  - if (process.env.FAIL_INJECT === "1") allow injection else ignore
- Default behavior MUST NOT change
- No documentation encouraging production use

Unit tests:
- disabled by default
- enabled only when flag set in test environment

---

## 14. CI Merge Gates (No Runtime Change)

R3 adds CI checks that enforce:
- write wrapper usage
- guard call presence
- audit call presence for admin writes
- docs exist and are referenced
- mechanism map updated when stubs change

R3 CI MUST NOT block documentation-only PRs.

---

## 15. Acceptance Criteria

R3 is complete when:
- All listed stubs exist and are referenced from relevant routes
- Default behavior is unchanged (no new denials)
- Typecheck passes
- Unit tests pass
- CI gates enforce "usage" but not "activation"
- MECHANISM_STUBS_AND_OWNERSHIP.md updated: statuses move from Defined -> Stubbed where applicable

---

## 16. Handoff

After R3 merge:
- System Owner reviews diffs to confirm "no enabling"
- Worker B/C notified: future editor/publishing work must call guards and emit audit events where applicable

