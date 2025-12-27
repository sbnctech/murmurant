# SafeEmbed Allowlist Policy

```
Status: Design Complete
Audience: Engineers, Operators, Security Review
Classification: Architecture Specification
```

---

## Overview

SafeEmbed is ClubOS's mechanism for rendering external content (iframes) within pages. Unlike arbitrary HTML blocks, SafeEmbed uses a **domain allowlist** to permit only trusted sources.

This document specifies the **two-person approval model** for managing the allowlist, ensuring no single administrator can introduce a malicious embed source.

---

## Security Principles

| Principle | Implementation |
|-----------|----------------|
| Default deny | URLs not on allowlist are blocked |
| Two-person rule | One admin proposes, another approves |
| No wildcards | Each domain requires explicit entry |
| HTTPS only | HTTP sources rejected at validation |
| Audit everything | All changes logged with actor, timestamp, action |
| Sandbox isolation | Iframes rendered with restrictive sandbox attributes |

---

## Data Model

### SafeEmbedAllowlistEntry

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| domain | String | Exact domain (e.g., `youtube.com`) |
| pathPrefix | String? | Optional path restriction (e.g., `/embed/`) |
| embedType | Enum | `iframe` or `script` |
| notes | String? | Human-readable justification |
| status | Enum | `pending`, `active`, `revoked` |
| createdBy | UUID | Admin who proposed the entry |
| createdAt | DateTime | When proposed |
| approvedBy | UUID? | Admin who approved (null if pending) |
| approvedAt | DateTime? | When approved (null if pending) |
| revokedBy | UUID? | Admin who revoked (null if active) |
| revokedAt | DateTime? | When revoked (null if active) |

### Entry Status States

```
                 ┌──────────────────┐
                 │                  │
    ┌────────────▼──────────┐       │
    │       PENDING         │       │
    │  (awaits approval)    │       │
    └───────────┬───────────┘       │
                │                   │
         approve (by different admin)
                │                   │
    ┌───────────▼───────────┐       │
    │        ACTIVE         │       │
    │  (embeds allowed)     │───────┘ re-propose after revoke
    └───────────┬───────────┘
                │
            revoke
                │
    ┌───────────▼───────────┐
    │       REVOKED         │
    │  (embeds blocked)     │
    └───────────────────────┘
```

### Constraints

- `createdBy` and `approvedBy` MUST be different users (enforced at database level)
- `domain` must be a valid hostname (no protocol, no path)
- `pathPrefix` must start with `/` if provided
- No wildcard subdomains (e.g., `*.youtube.com` is invalid)
- `embedType` determines which HTML elements are permitted:
  - `iframe`: Only `<iframe>` elements allowed
  - `script`: Only `<script>` elements allowed (rare, high-security)

---

## Two-Person Approval Workflow

### Why Two-Person Rule?

A single compromised admin account could add a malicious domain to the allowlist, enabling XSS or phishing attacks on all members. The two-person rule ensures:

1. No single point of compromise
2. Peer review of security decisions
3. Clear accountability chain

### Workflow Steps

```
Step 1: PROPOSE
├── Admin A navigates to Settings > SafeEmbed Allowlist
├── Admin A clicks "Add Domain"
├── Admin A enters domain, path prefix, embed type, justification
├── Admin A clicks "Submit for Approval"
├── Entry created with status = PENDING
├── Audit log: "safeembed.entry.proposed" { domain, createdBy }
└── Notification sent to other admins

Step 2: REVIEW
├── Admin B sees pending entry in allowlist
├── Admin B clicks "Review"
├── Admin B sees domain, justification, proposer
├── Admin B uses "Test Embed" sandbox to preview
├── Admin B decides: Approve or Reject

Step 3a: APPROVE (if approved)
├── System verifies: approvedBy != createdBy
├── Entry updated: status = ACTIVE, approvedBy, approvedAt
├── Audit log: "safeembed.entry.approved" { domain, approvedBy }
└── Embeds from this domain now render

Step 3b: REJECT (if rejected)
├── Entry deleted (or marked rejected for history)
├── Audit log: "safeembed.entry.rejected" { domain, rejectedBy, reason }
└── Notification sent to proposer

Step 4: REVOKE (any admin, any time)
├── Admin clicks "Revoke" on active entry
├── Entry updated: status = REVOKED, revokedBy, revokedAt
├── Audit log: "safeembed.entry.revoked" { domain, revokedBy, reason }
└── Embeds from this domain blocked immediately
```

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| Only one admin exists | Entry stays PENDING; org must add second admin |
| Same admin tries to approve own proposal | System rejects with error |
| Revoked domain re-proposed | Creates new PENDING entry (history preserved) |
| Domain with multiple paths | One entry per domain+pathPrefix combo |

---

## Test Embed Sandbox

Before approving, reviewers can test how an embed renders using a sandboxed preview.

### Sandbox Specification

```html
<iframe
  src="{testUrl}"
  sandbox="allow-scripts allow-same-origin"
  referrerpolicy="no-referrer"
  allow=""
  style="width: 100%; height: 400px; border: 1px solid #ccc;"
></iframe>
```

### Sandbox Constraints

- Preview renders in isolated modal
- No network access to ClubOS APIs from preview
- No access to user session or tokens
- Preview URL must match proposed domain
- Preview times out after 30 seconds

### Test Workflow

1. Reviewer enters a sample URL (e.g., `https://youtube.com/embed/abc123`)
2. System verifies URL matches proposed domain
3. Preview renders in sandbox
4. Reviewer assesses whether embed behaves as expected
5. Reviewer proceeds to approve or reject

---

## Audit Log Requirements

Every allowlist action creates an immutable audit log entry.

### Audit Events

| Event | Fields Logged |
|-------|---------------|
| `safeembed.entry.proposed` | entryId, domain, pathPrefix, embedType, createdBy, notes |
| `safeembed.entry.approved` | entryId, domain, approvedBy, createdBy |
| `safeembed.entry.rejected` | entryId, domain, rejectedBy, createdBy, reason |
| `safeembed.entry.revoked` | entryId, domain, revokedBy, reason |
| `safeembed.embed.rendered` | entryId, domain, pageId, renderedBy |
| `safeembed.embed.blocked` | domain, pageId, reason, attemptedBy |

### Audit Log Retention

- Allowlist change events: Retained indefinitely
- Embed render events: Retained 90 days (configurable)
- Blocked attempt events: Retained 30 days

---

## Default Allowlist (Seed Data)

ClubOS ships with a pre-approved allowlist for common trusted sources.

| Domain | Path Prefix | Embed Type | Notes |
|--------|-------------|------------|-------|
| youtube.com | /embed/ | iframe | Video embeds |
| youtu.be | / | iframe | Short video URLs |
| www.youtube.com | /embed/ | iframe | Video embeds |
| vimeo.com | /video/ | iframe | Video embeds |
| player.vimeo.com | / | iframe | Vimeo player |
| google.com | /maps/embed | iframe | Google Maps |
| www.google.com | /maps/embed | iframe | Google Maps |
| calendar.google.com | /calendar/embed | iframe | Public calendars |
| docs.google.com | /document/d/ | iframe | Public docs |
| docs.google.com | /spreadsheets/d/ | iframe | Public sheets |
| docs.google.com | /presentation/d/ | iframe | Public slides |
| forms.google.com | / | iframe | Google Forms |
| canva.com | /design/ | iframe | Canva designs |
| calendly.com | / | iframe | Scheduling |

### Seed Entry Properties

- `status`: ACTIVE (pre-approved)
- `createdBy`: SYSTEM
- `approvedBy`: SYSTEM
- `notes`: "Default allowlist - trusted source"

Organizations cannot revoke seed entries but can request removal via support.

---

## UI Specification

### Allowlist Management Page

**Location:** Settings > SafeEmbed Allowlist

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ SafeEmbed Allowlist                          [+ Add Domain] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ PENDING APPROVAL (2)                                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ example.com/embed/     iframe    Proposed by Jane       │ │
│ │ "Partner video hosting"           [Review] [Reject]     │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ widget.partner.org     iframe    Proposed by Bob        │ │
│ │ "Event registration widget"       [Review] [Reject]     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ACTIVE (14)                                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ youtube.com/embed/     iframe    System (default)       │ │
│ │ "Video embeds"                                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ vimeo.com/video/       iframe    System (default)       │ │
│ │ "Video embeds"                                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ... more entries ...                                        │
│                                                             │
│ REVOKED (1)                          [Show/Hide]            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ oldvendor.com          iframe    Revoked 2024-01-15     │ │
│ │ "Vendor discontinued"             [Re-propose]          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Add Domain Modal

```
┌─────────────────────────────────────────────────────────────┐
│ Propose New Embed Source                              [X]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Domain *                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ example.com                                             │ │
│ └─────────────────────────────────────────────────────────┘ │
│ Enter exact domain without protocol (https://)              │
│                                                             │
│ Path Prefix (optional)                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ /embed/                                                 │ │
│ └─────────────────────────────────────────────────────────┘ │
│ Restrict to URLs starting with this path                    │
│                                                             │
│ Embed Type *                                                │
│ ○ iframe (recommended)                                      │
│ ○ script (requires security review)                         │
│                                                             │
│ Justification *                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Partner video hosting for member training content       │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│ Explain why this source should be trusted                   │
│                                                             │
│                              [Cancel] [Submit for Approval] │
└─────────────────────────────────────────────────────────────┘
```

### Review Modal

```
┌─────────────────────────────────────────────────────────────┐
│ Review Embed Source                                   [X]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Domain:       example.com/embed/                            │
│ Embed Type:   iframe                                        │
│ Proposed By:  Jane Smith                                    │
│ Proposed At:  2024-12-26 10:30 AM                           │
│                                                             │
│ Justification:                                              │
│ "Partner video hosting for member training content"         │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│ Test Embed                                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ https://example.com/embed/sample123                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                            [Load Preview]   │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                                                         │ │
│ │              [Preview renders here]                     │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Rejection Reason (if rejecting)                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│                                   [Reject] [Approve]        │
└─────────────────────────────────────────────────────────────┘
```

---

## Acceptance Tests

### Approval Workflow Tests

```gherkin
Feature: SafeEmbed Two-Person Approval

Scenario: Admin cannot approve their own proposal
  Given Admin A is logged in
  And Admin A proposes domain "newsite.com"
  When Admin A attempts to approve "newsite.com"
  Then the system rejects with "Cannot approve your own proposal"
  And the entry remains PENDING

Scenario: Different admin can approve proposal
  Given Admin A proposes domain "newsite.com"
  And Admin B is logged in
  When Admin B approves "newsite.com"
  Then the entry status becomes ACTIVE
  And approvedBy equals Admin B's ID
  And audit log contains "safeembed.entry.approved"

Scenario: Pending entry does not allow embeds
  Given domain "newsite.com" has status PENDING
  When a page tries to embed "https://newsite.com/video/123"
  Then the embed is blocked
  And fallback UI displays "Embed source pending approval"

Scenario: Active entry allows embeds
  Given domain "newsite.com" has status ACTIVE
  When a page embeds "https://newsite.com/video/123"
  Then the iframe renders with sandbox attributes
  And audit log contains "safeembed.embed.rendered"

Scenario: Revoked entry blocks embeds immediately
  Given domain "newsite.com" has status ACTIVE
  And a page currently displays an embed from "newsite.com"
  When Admin C revokes "newsite.com"
  Then the entry status becomes REVOKED
  And subsequent page loads show fallback UI
  And audit log contains "safeembed.entry.revoked"
```

### Validation Tests

```gherkin
Feature: SafeEmbed Input Validation

Scenario: Domain with protocol is rejected
  When Admin proposes domain "https://example.com"
  Then validation fails with "Enter domain without protocol"

Scenario: Wildcard subdomain is rejected
  When Admin proposes domain "*.example.com"
  Then validation fails with "Wildcards not permitted"

Scenario: Path prefix without slash is rejected
  When Admin proposes pathPrefix "embed"
  Then validation fails with "Path prefix must start with /"

Scenario: HTTP URL is blocked at render time
  Given domain "example.com" has status ACTIVE
  When a page tries to embed "http://example.com/video/123"
  Then the embed is blocked
  And reason is "HTTPS required"
```

### Audit Tests

```gherkin
Feature: SafeEmbed Audit Logging

Scenario: All lifecycle events are logged
  Given Admin A proposes domain "audit-test.com"
  When Admin B approves the entry
  And Admin C revokes the entry
  Then audit log contains exactly 3 entries for "audit-test.com":
    | event                      | actor   |
    | safeembed.entry.proposed   | Admin A |
    | safeembed.entry.approved   | Admin B |
    | safeembed.entry.revoked    | Admin C |

Scenario: Blocked embeds are logged
  Given domain "blocked.com" is not in allowlist
  When a page tries to embed "https://blocked.com/widget"
  Then audit log contains "safeembed.embed.blocked"
  And logged reason is "Domain not in allowlist"
```

---

## Integration with Migration

### Discovery Phase

The Presentation Discovery crawler detects iframe/embed elements in WA custom HTML blocks and classifies them:

| Classification | Condition | Migration Action |
|----------------|-----------|------------------|
| AUTO | Domain matches default allowlist | Generate SafeEmbed block |
| MANUAL | Domain not in allowlist | Flag for operator review |
| UNSUPPORTED | Script tag or tracking pixel | Exclude from migration |

### Operator Workflow

1. Migration report shows custom HTML blocks
2. AUTO items generate SafeEmbed blocks automatically
3. MANUAL items prompt operator to:
   - Propose domain addition (enters two-person workflow)
   - Use external link instead
   - Skip the embed entirely

See: docs/MIGRATION/WILD_APRICOT_CUSTOM_HTML_BLOCKS_GUIDE.md

---

## Related Documents

- [Page Builder Primitives](./CLUBOS_PAGE_BUILDER_PRIMITIVES.md) - SafeEmbed component spec
- [Custom HTML Blocks Guide](../MIGRATION/WILD_APRICOT_CUSTOM_HTML_BLOCKS_GUIDE.md) - Operator guidance
- [Gadget Tagging](../MIGRATION/WILD_APRICOT_GADGET_TAGGING.md) - Migration classification
- [Architectural Charter](./ARCHITECTURAL_CHARTER.md) - P1 (audit), P2 (default deny), P9 (fail closed)

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2024-12-26 | System | Initial specification with two-person approval model |
