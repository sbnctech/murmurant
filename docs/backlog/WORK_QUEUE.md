<!-- MERGE NOTE: auto-resolved add/add by concatenating ours then theirs -->


---

## P2 — ✅ COMPLETE - JSON-LD Structured Metadata for Public Pages

- Spec: docs/publishing/JSON_LD_METADATA.md
- Implemented: src/lib/seo/jsonld.ts, src/components/seo/JsonLd.tsx
- Integrated: src/app/(public)/[slug]/page.tsx
- Tests: tests/unit/seo/jsonld.spec.ts (22 tests)

---

---

# Murmurant - Work Queue (Backlog)

Status: Canonical backlog
Last updated: 2025-12-28

This file is the system-of-record backlog for reliability, editor, and publishing work.
Items are ordered. Do not reorder without explicit rationale.

-------------------------------------------------------------------------------

## A. Editor and Publishing (Next)

A1. ✅ COMPLETE - Editor Phase 1 - Block ordering UI wiring (draft-only)
- Implemented: src/lib/publishing/blockOrdering.ts (reorderBlocks, moveBlockUp, moveBlockDown)
- Implemented: PageEditorClient.tsx with Move Up/Down buttons
- Tests: tests/unit/publishing/block-ordering.spec.ts (14 tests)

A2. ✅ COMPLETE - Editor Phase 2 - Drag-and-drop
- Implemented: src/components/publishing/SortableBlockList.tsx (@dnd-kit integration)
- Features: DragHandle, DragOverlay, keyboard accessibility
- Tests: block-ordering.spec.ts includes DnD compatibility tests

A3. ✅ COMPLETE - Publishing lifecycle orchestration (draft -> preview -> publish)
- Implemented: src/lib/publishing/pageLifecycle.ts (state machine: DRAFT → PUBLISHED → ARCHIVED)
- Validation: isValidTransition() enforces allowed transitions
- Controls: PageEditorClient.tsx with publish/unpublish/archive/discardDraft
- API: POST /api/admin/content/pages/[id]?action=publish|unpublish|archive|discardDraft
- Undo/Redo: 20-step stack, clears on publish boundaries
- Audit: Full before/after logging on all lifecycle actions
- Docs: docs/BIZ/PUBLISHING_AND_CONTENT_LIFECYCLE.md

A4. ✅ COMPLETE - Preview/publish plumbing
- Preview route: /pages/{slug}/preview (auth + content admin required)
- Preview isolation: Public route ONLY shows publishedContent, never draft
- Audience enforcement: PUBLIC, MEMBERS_ONLY, ROLE_RESTRICTED (server-side)
- Content selection: src/lib/publishing/contentSelection.ts
- Visibility: src/lib/publishing/visibility.ts, audience.ts
- Permissions: src/lib/publishing/permissions.ts
- Tests: tests/unit/publishing/ (contentSelection, permissions, audience, pageLifecycle)

A5. ✅ COMPLETE - Subset rollout for pages/copy (feature spec)
- Spec: docs/publishing/SUBSET_ROLLOUT.md
- Three-stage rollout: INTERNAL → PREVIEW → GENERAL

A6. FlipCard block type
- Goal: Hover-activated 3D flip card with image front, text/gradient back
- Features: CSS-only animation (rotateY), keyboard accessible (focus=flip)
- Inspiration: sbnc-website-redesign-playground.wildapricot.org
- Deliverables: Block schema, editor UI, CSS styles, unit tests

A7. Accordion block type
- Goal: Expandable/collapsible content sections
- Features: Multiple panels, one-at-a-time or multi-open modes, smooth animation
- Use cases: FAQs, program details, nested information
- Deliverables: Block schema, editor UI, accessibility (ARIA), tests

A8. Tabs block type
- Goal: Tabbed content panels for organizing related content
- Features: Horizontal tabs, keyboard navigation, lazy content loading option
- Use cases: Event details, member benefits, multi-category info
- Deliverables: Block schema, editor UI, accessibility, tests

A9. Testimonial/Quote carousel block type
- Goal: Rotating member testimonials or quotes with author attribution
- Features: Auto-rotate, manual navigation, pause on hover
- Use cases: Member stories, board quotes, event feedback
- Deliverables: Block schema, editor UI, CSS animations, tests

A10. Stats counter block type
- Goal: Animated number counters for key metrics
- Features: Count-up animation on scroll into view, configurable values
- Use cases: "500+ Members", "50 Events/Year", "30 Interest Groups"
- Deliverables: Block schema, editor UI, intersection observer, tests

A11. Timeline block type
- Goal: Vertical timeline for chronological content
- Features: Alternating left/right layout, date markers, scroll animations
- Use cases: Club history, event schedules, membership journey
- Deliverables: Block schema, editor UI, responsive design, tests

A12. Before/After image slider block type
- Goal: Draggable slider comparing two images
- Features: Horizontal drag handle, touch support, labels
- Use cases: Venue transformations, event setups, community impact
- Deliverables: Block schema, editor UI, touch events, tests

-------------------------------------------------------------------------------

## B. Reliability R3 (Stubs + CI Wiring) - Pre-deployment readiness

B1. ✅ COMPLETE - Implement inert mechanism stubs (NO enabling)
- Implemented: src/lib/reliability/ (guards, killSwitch, isolation, backpressure, backup, failureInjection)
- Tests: tests/unit/reliability/ (103 tests)
- All stubs are inert (always allow, no-op)

B2. ✅ COMPLETE - CI merge gates (usage enforcement only; no activation)
- Implemented: scripts/ci/check-reliability-guardrails.ts
- Checks: required docs, module exports, guard adoption tracking, mechanism matrix
- Wired into: npm run test:guardrails

B3. ✅ COMPLETE - Update MECHANISM_STUBS_AND_OWNERSHIP.md
- Updated: 8 mechanisms moved from Defined → Stubbed
- Last updated: 2025-12-28

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

## F. Migration Path (WA as Source of Truth)

Strategy: Use Murmurant UI while Wild Apricot remains the system of record.
This enables gradual user migration with minimal risk.

F1. Migration architecture spec
- Goal: Define read-through/write-through patterns for WA integration.
- Deliverables: Architecture doc covering data flow, caching, conflict handling.
- Must define: Which entities remain WA-authoritative vs MM-authoritative.
- Must define: Sync frequency, failure modes, reconciliation strategy.

F2. WA API proxy layer
- Goal: Abstract WA API behind internal service interface.
- Deliverables: src/lib/wa/ with typed client, error handling, retry logic.
- Must include: Rate limit handling, audit logging of WA calls.
- Must use: DEPENDENCY_ISOLATION wrapper from reliability module.

F3. Member data read-through
- Goal: MM reads member data from WA, caches locally for performance.
- Deliverables: Member sync service, cache invalidation strategy.
- Must include: Staleness indicators in UI, manual refresh option.

F4. Event/registration write-through
- Goal: Event registrations in MM UI write to WA as source of truth.
- Deliverables: Registration API that proxies to WA, confirms success.
- Must include: Rollback on WA failure, clear error messages.

F5. Gradual cutover plan
- Goal: Define criteria and process for migrating entity types to MM-authoritative.
- Deliverables: Cutover checklist, rollback procedures, data validation suite.
- Must include: Per-entity migration (members, events, pages separate).

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
- Migration path (F*) requires F1 architecture spec approval before implementation.

Coordination rules:
- One PR per stream.
- Avoid simultaneous edits to docs/backlog/WORK_QUEUE.md (treat as append-only or coordinate).
- CI/workflows are owned by Stream 1.


