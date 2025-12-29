<!-- MERGE NOTE: auto-resolved add/add by concatenating ours then theirs -->


---

## P2 — Publishing: JSON-LD Structured Metadata for Public Pages

- Spec: docs/publishing/JSON_LD_METADATA.md
- Deliverable: emit JSON-LD (<script type="application/ld+json">) for public pages
- Guardrail: no JSON-LD for non-public pages
- Tests: unit tests for JSON-LD builders + basic rendering assertion (if practical)

---

---

# ClubOS - Work Queue (Backlog)

Status: Canonical backlog
Last updated: 2025-12-28

This file is the system-of-record backlog for reliability, editor, and publishing work.
Items are ordered. Do not reorder without explicit rationale.

-------------------------------------------------------------------------------

## P1 — Communications: Email Template Editor

**Priority: HIGH** - Core operator capability for member communications.

### P1.1 Email Template Editor UI

- Goal: Visual editor for creating and editing email templates
- Location: `/admin/comms/templates/`
- Existing: `MessageTemplatesTable.tsx`, basic `page.tsx`
- Needed:
  - Template creation wizard
  - WYSIWYG content editing (reuse block editor patterns)
  - Variable/merge field insertion (member name, event details, etc.)
  - Preview with sample data
  - Mobile-responsive preview toggle

### P1.2 Email Identity Management

- Goal: Manage sender identities (From name/email) with proper authorization
- Deliverables:
  - EmailIdentity model in schema (if not present)
  - Admin UI for identity CRUD
  - Role-based access (who can send as whom)
  - Verification status display

### P1.3 Email Composer

- Goal: Compose and send emails using templates
- Deliverables:
  - Template selection
  - Recipient selection (individual, list, segment)
  - Merge field population
  - Send/schedule controls
  - Audit logging for all sends

### P1.4 Template Library

- Goal: Pre-built templates for common use cases
- Templates needed:
  - Welcome email (new member)
  - Event reminder
  - Event confirmation
  - Renewal reminder
  - Password reset
  - General announcement

**Spec reference:** Salvage Plan 202 (archived) - PR #117
**Related:** `src/lib/email/`, `src/lib/publishing/email.ts`

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

## F. Outstanding Salvage Items (from archived SALVAGE_PLAN_* docs)

Captured: 2025-12-28 during salvage plan reconciliation audit.
See: docs/archive/SALVAGE_RECONCILIATION.md for full details.

F1. Editor core components (blocks A1/A2)
- RichTextEditor.tsx - WYSIWYG rich text component (tiptap-based)
- BlockEditors.tsx - per-block-type editing UI
- PageEditor.tsx - main editor orchestrator component
- Note: These are prerequisites for A1/A2 to be fully functional

F2. Breadcrumb system (blocks A3/A4)
- Page.breadcrumb schema field (nullable JSON)
- Breadcrumbs.tsx rendering component
- Note: Currently referenced in PageHeader but not fully implemented

F3. Rollback executor (blocks C1)
- src/lib/governance/rollback/executor.ts - execute rollback policies
- Note: policies.ts and validators.ts exist; executor is missing

F4. Audit CI enforcement (blocks B2)
- scripts/ci/check-audit-coverage.sh - CI gate for audit compliance
- Note: audit.ts exists; CI enforcement not wired

F5. Auth/RBAC documentation
- docs/project/AUTH_AND_RBAC.md - document current auth patterns
- Note: Capabilities exist in auth.ts but undocumented

F6. Eligibility engine (future - not blocking)
- Full schema: TicketType, TicketEligibilityOverride, CommitteeMembership, EventSponsorship
- Service: evaluateEligibility logic
- Admin UI: eligibility viewer and ticket types page
- Note: Stub exists at src/server/eligibility/stub.ts; full implementation is a future epic

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


