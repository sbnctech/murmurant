# Implementation Backlog

## Presentation Discovery Stage

Planned (docs complete, code later):
- Site crawler for public WA pages (default: public-only scope)
- Widget/gadget inventory with classification tagging
- Navigation structure extraction
- Theme/CSS extraction
- Discovery report generation (JSON schema defined)

Related docs:
- docs/MIGRATION/PRESENTATION_DISCOVERY_STAGE.md
- docs/MIGRATION/PRESENTATION_DISCOVERY_CONTRACT.json

---

## Migration Awareness: WA Gadgets and Extensions

Planned (docs complete, code later):
- Migration intake checklist for gadgets/widgets
- Clear tagging: auto-migrate vs manual rebuild vs unsupported
- Page builder primitives aligned to migration reality

Future code requirements:
- Webhook/event stream (member.created, event.published, registration.paid)
- Signed webhook delivery with retries and replay
- Stable export endpoints (timezone-safe)
- ICS feeds with deterministic TZID behavior

---

## SafeEmbed v1

Status: Design complete, code not started

### Summary

SafeEmbed is a page builder primitive that renders external content via locked-down iframes. It replaces arbitrary HTML embeds from WA custom blocks with a secure, auditable alternative.

**Security Model:** Two-person approval. One admin proposes a domain, a different admin must approve before embeds render.

### Specification

- docs/ARCH/SAFEEMBED_ALLOWLIST_POLICY.md (approval workflow, data model, UI spec)
- docs/ARCH/CLUBOS_PAGE_BUILDER_PRIMITIVES.md (SafeEmbed component spec)

### Implementation Milestones

#### Milestone 1: Allowlist Schema and Storage

**Deliverable:** Prisma model and seed data

- Define `SafeEmbedAllowlistEntry` model with two-person approval fields:
  - id, domain, pathPrefix, embedType, notes, status
  - createdBy, createdAt, approvedBy, approvedAt, revokedBy, revokedAt
- Add database constraint: `createdBy != approvedBy`
- Seed default allowlist (YouTube, Vimeo, Google Maps, Calendly, Canva)
- Status enum: PENDING, ACTIVE, REVOKED

**Hotspot:** Prisma schema change requires merge captain

#### Milestone 2: URL Validation Logic

**Deliverable:** Server-side URL validator

- Parse incoming embed URL
- Match against ACTIVE allowlist entries only
- Hostname exact match (no wildcards)
- Path prefix match (if specified)
- Reject HTTP (HTTPS only)
- Return: matched entry or rejection reason

#### Milestone 3: SafeEmbed React Component

**Deliverable:** Locked-down iframe renderer

- Props: url, title, height, width
- Validate URL against allowlist before render
- Render with sandbox attributes: `allow-scripts allow-same-origin`
- Set `referrerpolicy="no-referrer"` and `allow=""`
- Show fallback UI if blocked (with reason)

#### Milestone 4: Admin UI - Allowlist Management

**Deliverable:** Settings page for allowlist CRUD

- List entries grouped by status (PENDING, ACTIVE, REVOKED)
- "Add Domain" button opens proposal modal
- Proposal form: domain, pathPrefix, embedType, justification
- Entries show proposer, approver, timestamps
- PENDING entries show [Review] and [Reject] buttons
- ACTIVE entries show [Revoke] button

#### Milestone 5: Admin UI - Two-Person Approval

**Deliverable:** Review workflow with sandbox preview

- Review modal shows proposal details and proposer
- "Test Embed" sandbox for previewing before approval
- System blocks self-approval (createdBy != approvedBy)
- Approve/Reject actions with confirmation
- Rejection requires reason text

#### Milestone 6: Audit Logging

**Deliverable:** Immutable audit trail

- Log events: proposed, approved, rejected, revoked
- Log embed renders and blocked attempts
- Include actor, timestamp, entry details, reason
- Retention: changes indefinitely, renders 90 days, blocks 30 days

#### Milestone 7: Migration Tooling Integration

**Deliverable:** Discovery classifier for WA custom HTML

- Detect iframe/embed elements in WA pages
- Classify: AUTO (matches default), MANUAL (unknown domain), UNSUPPORTED (scripts)
- Generate SafeEmbed blocks for AUTO items
- Flag MANUAL items for operator domain proposal

### Safety Requirements

| Requirement | Implementation |
|-------------|----------------|
| Default deny | Only ACTIVE entries allow embeds |
| Two-person rule | `createdBy != approvedBy` enforced at DB level |
| No wildcards | Domain must be exact match |
| HTTPS only | HTTP rejected at validation |
| Sandbox isolation | iframe sandbox + referrerpolicy + allow="" |
| Audit trail | All changes and renders logged |

### Acceptance Criteria

See: docs/ARCH/SAFEEMBED_ALLOWLIST_POLICY.md (Acceptance Tests section)

Key scenarios:

- Admin cannot approve their own proposal
- Pending entries do not allow embeds
- Revoked entries block immediately
- All lifecycle events are audit logged

### Dependencies

- Prisma schema change (HOTSPOT - merge captain)
- Admin UI layout integration
- Audit log infrastructure

### Related Docs

- docs/ARCH/SAFEEMBED_ALLOWLIST_POLICY.md
- docs/ARCH/CLUBOS_PAGE_BUILDER_PRIMITIVES.md
- docs/MIGRATION/WILD_APRICOT_GADGET_TAGGING.md
- docs/MIGRATION/WILD_APRICOT_CUSTOM_HTML_BLOCKS_GUIDE.md
