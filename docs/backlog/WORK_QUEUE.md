<!-- MERGE NOTE: auto-resolved add/add by concatenating ours then theirs -->


---

## P2 — Publishing: JSON-LD Structured Metadata for Public Pages

- Spec: docs/publishing/JSON_LD_METADATA.md
- Deliverable: emit JSON-LD (<script type="application/ld+json">) for public pages
- Guardrail: no JSON-LD for non-public pages
- Tests: unit tests for JSON-LD builders + basic rendering assertion (if practical)

---

---

# Murmurant - Work Queue (Backlog)

Status: Canonical backlog
Last updated: 2025-12-21

This file is the system-of-record backlog for reliability, editor, and publishing work.
Items are ordered. Do not reorder without explicit rationale.

-------------------------------------------------------------------------------

## A. Editor and Publishing (Next)

A1. Editor Phase 1 - Block ordering UI wiring (draft-only)
- Goal: Wire Move Up/Move Down controls using reorderBlocks utility.
- Out of scope: drag-and-drop, publish lifecycle, preview plumbing beyond spec.
- Deliverables: UI wiring + component tests.

A2. Editor Phase 2 - Drag-and-drop (deferred until A1 complete)
- Goal: DnD ordering with clear accessibility and deterministic order.
- Must include: tests, keyboard fallback, no hidden side effects.

A3. Publishing lifecycle orchestration (draft -> preview -> publish) (spec then code)
- Goal: Implement lifecycle state machine and enforcement at boundaries.
- Must include: audit events and reversible transitions.
- Must not: change reliability posture.

A4. Preview/publish plumbing beyond spec (code)
- Goal: implement routing, fetch policies, and storage model per specs.
- Must include: preview isolation tests and audience enforcement tests.

A5. Subset rollout for pages/copy (feature spec + minimal mechanism)
- Goal: allow limited audience/percent/group rollout before full launch.
- Deliverables: canonical spec doc, then implementation plan.

-------------------------------------------------------------------------------

## B. Reliability R3 (Stubs + CI Wiring) - Pre-deployment readiness

B1. Implement inert mechanism stubs (NO enabling)
- WRITE_GUARD stub
- PUBLISH_GUARD stub
- AUDIT_LOG stub (shape + sink)
- KILL_SWITCH registry stub
- DEPENDENCY_ISOLATION wrapper stub
- BACKPRESSURE facade stub
- BACKUP job scaffold (dry-run)
- RESTORE verification scaffold (fixtures/local only)
- FAILURE injection harness (compile-time disabled)

B2. CI merge gates (usage enforcement only; no activation)
- Require write wrapper usage on write paths
- Require guard calls on write/publish routes (no-op OK)
- Require actor context on admin actions
- Ensure required reliability docs exist
- Ensure mechanism matrix updates when stubs change

B3. Update MECHANISM_STUBS_AND_OWNERSHIP.md
- Move applicable mechanisms from Defined -> Stubbed

-------------------------------------------------------------------------------

## C. Reliability Enablement (Later; not before deployment decision)

C1. Audit log real storage + retention (append-only, attributable)
C2. Read-only mode implementation (actual write blocking, not policy only)
C3. Publish freeze implementation (server-side)
C4. Real backpressure/rate limiting (bounded, visible)
C5. Dependency isolation (timeouts/circuit behavior)
C6. Backup execution (real), PITR/WAL, immutable storage, access controls
C7. Restore verification suite (runs invariants against restored dataset)
C8. Failure injection execution plan (staging first, then controlled prod)

-------------------------------------------------------------------------------

## D. Operations (Runbooks, table tops, governance)

D1. Assign provisional owners for production-critical mechanisms (pre-deployment)
D2. Run at least 2 table tops (TT1, TT2) with written outcomes
D3. Create Go/No-Go declaration template for deployment decision
D4. Define incident log storage location and retention (even if manual)

-------------------------------------------------------------------------------

## E. Infra and Resilience (Later; separate decision)

E1. Environment strategy (dev/staging/prod separation)
E2. Database resilience strategy (provider choice, PITR, failover posture)
E3. Observability stack (logs/metrics/traces) and alert routing
E4. Disaster recovery exercise plan (restore drills with verification)

-------------------------------------------------------------------------------

## Parallelization Plan (Official)

Safe parallel streams (now):

- Stream 1: Reliability R3 stubs + CI wiring (B1/B2/B3)
  - Rule: stubs MUST be inert (default allow). No enabled behavior.

- Stream 2: Editor Phase 1 (A1) - block ordering UI wiring + tests
  - Rule: no drag-and-drop, no lifecycle orchestration, no publish plumbing.

- Stream 3: Publishing specs (A3 + A5) - docs/spec only
  - Rule: no runtime changes required in this stream.

- Stream 4: Ops/governance readiness (D1/D2/D3/D4) - docs only

Not parallelized yet / gated:
- Editor drag-and-drop (A2) waits for A1 completion.
- Reliability enablement (C*) requires explicit deployment posture decision.

Coordination rules:
- One PR per stream.
- Avoid simultaneous edits to docs/backlog/WORK_QUEUE.md (treat as append-only or coordinate).
- CI/workflows are owned by Stream 1.


