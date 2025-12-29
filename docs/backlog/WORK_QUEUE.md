<!--
  Copyright © 2025 Murmurant, Inc. All rights reserved.
-->


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

A6. ✅ COMPLETE - FlipCard block type
- Implemented: 3D CSS flip animation, keyboard accessible
- Files: blocks.ts, blockSchemas.ts, BlockRenderer.tsx

A7. ✅ COMPLETE - Accordion block type
- Implemented: Expandable sections with <details> element
- Features: Multiple panels, defaultOpen option

A8. ✅ COMPLETE - Tabs block type
- Implemented: Tabbed panels with tab navigation
- Server-rendered (first tab default)

A9. ✅ COMPLETE - Testimonial block type
- Implemented: Quote with author/role/image
- Features: Pagination dots, auto-rotate option

A10. ✅ COMPLETE - Stats block type
- Implemented: Number counters with prefix/suffix
- Styled: Primary color background, grid layout

A11. ✅ COMPLETE - Timeline block type
- Implemented: Vertical timeline with dots
- Features: Date, title, description, optional image

A12. ✅ COMPLETE - Before/After image slider block type
- Implemented: Draggable slider comparing two images
- Features: Horizontal drag handle, mouse/touch support, Before/After labels
- Options: aspectRatio (16:9, 4:3, 1:1, 3:2), initialPosition (0-100)
- Files: blocks.ts, blockSchemas.ts, BlockRenderer.tsx

A13. ✅ COMPLETE - Before/After block editor (form-based)
- Implemented: SchemaBlockEditor with number field type for initialPosition
- Fields: beforeImage, afterImage, alt texts, labels, aspectRatio, initialPosition

A14. ✅ COMPLETE - Stats block editor (first repeater pattern)
- Implemented: RepeaterEditor component (reusable for all array-based blocks)
- Features: Add/remove/reorder with collapsible cards, move up/down buttons
- Fields: title, columns, stats array (value, label, prefix, suffix)

A15. ✅ COMPLETE - Timeline block editor
- Implemented: TimelineBlockEditor using RepeaterEditor
- Fields: title, events array (date, title, description, image)

A16. ✅ COMPLETE - Accordion block editor
- Implemented: AccordionBlockEditor using RepeaterEditor
- Fields: title, allowMultiple, items array (title, content HTML, defaultOpen)

A17. ✅ COMPLETE - Tabs block editor
- Implemented: TabsBlockEditor using RepeaterEditor
- Fields: alignment, tabs array (label, content HTML)

A18. ✅ COMPLETE - Cards/FlipCards block editors
- Implemented: CardsBlockEditor, FlipCardsBlockEditor using RepeaterEditor
- Cards: columns, cards array (title, description, image, linkUrl, linkText)
- FlipCards: columns, cards array (front image/alt, back title/description/gradient, link)

A19. ✅ COMPLETE - Testimonial block editor
- Implemented: TestimonialBlockEditor using RepeaterEditor
- Fields: title, autoRotate, rotateIntervalMs, testimonials array (quote, author, role, image)

A20. ✅ COMPLETE - Gallery block editor
- Implemented: GalleryBlockEditor using RepeaterEditor
- Fields: columns, enableLightbox, images array (src, alt, caption)

A21. ✅ COMPLETE - Contact form field editor
- Implemented: ContactBlockEditor using RepeaterEditor
- Fields: title, description, recipientEmail, submitText, fields array (name, label, type, required, options)
- Conditional: options textarea appears only when type=select

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

D3. ✅ COMPLETE - Go/No-Go declaration template
- Template: docs/OPS/GO_NOGO_TEMPLATE.md
- Includes: Technical/operational/business readiness checklists
- Features: Risk assessment, sign-offs, conditional GO criteria
- Related: WA_CUTOVER_PLAN.md

D4. ✅ COMPLETE - Incident log storage and retention policy
- Policy: docs/OPS/INCIDENT_LOG_POLICY.md
- Storage: docs/incidents/YYYY/ directory structure (Phase 1 manual)
- Templates: Incident report template, PIR template
- Retention: 3 years incidents, 5 years PIRs, 1 year audit logs
- Classification: SEV-1 through SEV-4, type codes (OUT/PERF/SEC/DATA/INT/DEP)
- Metrics: MTTR, MTTD, incident rate, recurrence rate

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

F1. ✅ COMPLETE - Migration architecture spec
- Spec: docs/ARCH/MIGRATION_INTEGRATION_ARCHITECTURE.md
- Defines: Read-through caching, write-through with confirmation, conflict resolution
- Authority matrix: WA vs MM authoritative per entity per stage
- Sync: Real-time (on-demand), near-real-time (5 min polling), nightly reconciliation
- Failure handling: Retry, queue, graceful degradation
- Cutover criteria: Technical, operational, stakeholder checklists

F2. ✅ COMPLETE - WA API proxy layer
- Implemented: src/lib/wa/ (types, config, security, audit, client, webhooks)
- Features: Typed client with auto-pagination, rate limiting, input validation
- Security: Credential protection, sensitive data redaction, webhook signatures
- Audit: Full operation logging with PII protection
- Tests: tests/unit/wa/ (95 tests)
- Docs: docs/ARCH/WA_API_SECURITY.md

F3. ✅ COMPLETE - Member data read-through
- Goal: MM reads member data from WA, caches locally for performance.
- Implemented: src/lib/wa/memberSync.ts (cache layer, read-through, background sync)
- Features: TTL-based caching (5 min default), staleness indicators, manual refresh
- UI Components: src/components/wa/ (StalenessIndicator, RefreshButton)
- Hook: src/hooks/useMemberData.tsx (useMemberData, useMembersData)
- Tests: tests/unit/wa/memberSync.spec.ts (35 tests)

F4. ✅ COMPLETE - Event/registration write-through
- Goal: Event registrations in MM UI write to WA as source of truth.
- Implemented: src/lib/wa/registrationSync.ts (write-through, retry, queue)
- Features: createRegistration, cancelRegistration with confirmation
- Error handling: Retry with backoff, pending write queue, conflict detection
- User messages: Clear error messages for each failure type
- Tests: tests/unit/wa/registrationSync.spec.ts (21 tests)
- Total WA tests: 116

F5. ✅ COMPLETE - Gradual cutover plan
- Goal: Define criteria and process for migrating entity types to MM-authoritative.
- Spec: docs/ARCH/WA_CUTOVER_PLAN.md
- Includes: Per-entity cutover order, technical/operational checklists
- Rollback: Decision criteria, step-by-step procedures, testing requirements
- Validation: Data validation suite spec with member/event/registration checks
- Monitoring: Post-cutover monitoring schedule with alert thresholds
- Communication: Pre/during/post cutover messaging templates

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


