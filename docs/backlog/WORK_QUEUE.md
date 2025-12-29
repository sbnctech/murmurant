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

## P1 — Communications: Email Message Editor

**Priority: HIGH** - Core operator capability for member communications.

**Target users:** Committee Chairs, VP Communications, Tech Chair (not general members)

**Design principle:** Reuse page editor patterns and components where possible.
The email editor should feel familiar to anyone who has used the page editor.

### Terminology (Avoid Confusion)

| Term | Meaning | Location |
|------|---------|----------|
| **Page Template** | Layout/structure for website pages | `/admin/content/templates/` |
| **Message Template** | Reusable email content with merge fields | `/admin/comms/templates/` |
| **Page** | Published website content | `/admin/content/pages/` |
| **Message** | Email communication to members | `/admin/comms/messages/` |

Use "Message Template" and "Message" for email, not "Email Template".
This avoids confusion with Page Templates in the publishing system.

### P1.1 Message Template Editor UI

- Goal: Visual editor for creating and editing message templates
- Location: `/admin/comms/templates/`
- Existing: `MessageTemplatesTable.tsx`, basic `page.tsx`
- Design: Mirror page editor UX patterns
  - Block-based content (reuse existing block types where applicable)
  - Drag-and-drop ordering (reuse SortableBlockList when available)
  - Rich text editing (reuse RichTextEditor/tiptap)
  - Preview pane with sample data
  - Mobile-responsive preview toggle
- Template-specific features:
  - Merge field picker (insert `{{member.firstName}}`, `{{event.title}}`, etc.)
  - Merge field validation (warn if field may be empty)
  - Subject line editor with merge field support

### P1.2 Audience Builder

- Goal: Define and save recipient audiences for email campaigns
- Audience types:
  - **All members** (with status filter: active, alumni, etc.)
  - **Committee members** (select committee)
  - **Event registrants** (select event, filter by status)
  - **Custom segment** (saved filter criteria)
  - **Manual list** (paste emails or select individuals)
- Features:
  - Save audiences for reuse
  - Preview audience count before send
  - Exclude list (suppress specific recipients)
  - Respect email preferences / unsubscribe status

### P1.3 Message Composer (Send Flow)

- Goal: Compose and send messages using templates + audiences
- Workflow:
  1. Select template (or start from blank)
  2. Select audience (or create new)
  3. Fill template variables:
     - **Auto-populated:** Data from database (member info, event details)
     - **Manual entry:** Ad-hoc fields filled at send time (e.g., custom message)
  4. Preview with real recipient data (show 3-5 sample renders)
  5. Send immediately, schedule, or set up recurring
- Scheduling options:
  - **Immediate:** Send now
  - **Scheduled:** Pick specific date/time
  - **Relative to event:** X days before/after event start date
  - **Relative to milestone:** X days before/after renewal date, join date, etc.
  - **Recurring:** Weekly digest, monthly newsletter (with end date)
- Missing merge field handling:
  - Show blank (field disappears)
  - Show placeholder text (configurable per field)
  - Warn sender before send if critical fields missing
- Deliverables:
  - Template + audience selection UI
  - Variable resolution engine (stored vs. ad-hoc)
  - Relative scheduling engine (event/milestone triggers)
  - Send confirmation with recipient count
  - Audit logging for all sends

### P1.4 AI Writing Assistant (Optional Enhancement)

- Goal: Help chairs write effective member communications
- Features:
  - "Help me write" button in composer
  - Suggest subject lines
  - Draft body content from bullet points
  - Tone adjustment (formal, friendly, urgent)
  - Grammar/clarity check
- Guardrails:
  - Human review required before send
  - No auto-send of AI-generated content
  - Clear disclosure if AI-assisted (optional)

### P1.5 Template Library

- Goal: Pre-built templates for common use cases
- Templates needed:
  - Welcome email (new member)
  - Event invitation
  - Event reminder (day before)
  - Event confirmation (post-registration)
  - Renewal reminder
  - Password reset
  - Committee announcement
  - General newsletter

### P1.6 Email Identity Management

- Goal: Manage sender identities (From name/email) with proper authorization
- Deliverables:
  - EmailIdentity model in schema (if not present)
  - Admin UI for identity CRUD
  - Role-based access (who can send as whom)
  - Verification status display
  - Default identity per committee

### P1.7 View Message as Web Page

- Goal: Allow recipients to view email content in browser
- Features:
  - "View in browser" link at top of every sent message
  - Hosted web page version of the message at `/messages/{messageId}`
  - Renders with club branding/theme
  - Accessible without login (public URL with token)
  - Retains all formatting, images, links
- Use cases:
  - Email client rendering issues
  - Forwarding/sharing message content
  - Accessibility (some users prefer browser)
- Post-send editing:
  - Allow corrections (fix typos, update links) with audit log
  - Can retract/unpublish the web view entirely
  - Email already delivered is unaffected; web view reflects edits
- Security:
  - Unique token per message (not guessable)
  - Optional expiration (e.g., 90 days)
  - No PII in URL

### P1.8 Message Analytics

- Goal: Track message engagement for sender insight
- Metrics:
  - Delivery rate (sent vs. bounced)
  - Open rate (pixel tracking, privacy-respecting)
  - Click rate (link tracking)
  - Unsubscribe rate
- Access control:
  - Sender can see their own message stats
  - VP Communications can see all message stats
  - Tech Chair / President can see all stats
- Privacy:
  - Aggregate stats by default
  - Individual recipient activity only for debugging bounces
  - Respect Do Not Track where possible

**Spec reference:** Salvage Plan 202 (archived) - PR #117
**Related:** `src/lib/email/`, `src/lib/publishing/email.ts`, page editor components

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

## G. Activity Groups: Photo Gallery (HOTSPOT - Schema Required)

Added: 2025-12-29 (Sprint 5 deferral)

**Prerequisite:** Requires schema changes to prisma/schema.prisma (HOTSPOT)

G1. Schema additions
- ActivityGroupPhotoAlbum model
- ActivityGroupPhoto model (with album relation)
- Add photoAlbums relation to ActivityGroup model

G2. Photo upload API
- POST /api/v1/groups/[id]/albums - create album (coordinator)
- POST /api/v1/groups/[id]/albums/[albumId]/photos - upload photos
- DELETE endpoints for album/photo management
- Image validation and resizing

G3. Gallery UI
- Member view: browse group photo albums
- Coordinator view: create albums, upload/delete photos
- Public view: featured photos on public groups page

G4. Storage integration
- Configure cloud storage (S3/R2/similar)
- Implement signed URLs for private album access
- Thumbnail generation

**Charter compliance:** P1 (audit photo uploads), P2 (coordinator-scoped access)

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


