# Intent to Rendering Contract

**Status**: Specification Draft
**Last Updated**: 2025-12-25
**Related Documents**:
- [Intent Manifest Schema](./INTENT_MANIFEST_SCHEMA.md)
- [Suggestion Review Workflow](./SUGGESTION_REVIEW_WORKFLOW.md)
- [Preview Surface Contract](./PREVIEW_SURFACE_CONTRACT.md)
- [Organizational Presentation Philosophy](../BIZ/ORGANIZATIONAL_PRESENTATION_PHILOSOPHY.md)
- [Organizational Representation Sketch](./ORGANIZATIONAL_REPRESENTATION_SKETCH.md)

---

## Table of Contents

- [A. Scope and Non-Goals](#a-scope-and-non-goals)
- [B. Definitions](#b-definitions)
- [C. Output Contract: Renderable Plan](#c-output-contract-renderable-plan)
- [D. Review and Safety](#d-review-and-safety)
- [E. Preview Guarantees](#e-preview-guarantees)
- [F. Export and Portability](#f-export-and-portability)
- [G. Explicit Non-Guarantees and Undefined Areas](#g-explicit-non-guarantees-and-undefined-areas)
- [H. Acceptance Tests](#h-acceptance-tests)
- [Revision History](#revision-history)

---

## A. Scope and Non-Goals

### What This Contract IS

This contract defines the bridge between an organization's **Intent Manifest** (the source of truth for presentation intent) and the **Renderable Plan** (a deterministic, reviewable artifact that drives actual rendering).

The goal is **recognizable fidelity**: when an organization migrates to ClubOS, their identity should be preserved well enough that their members recognize it.

**In scope:**

- Transforming Intent Manifest into a reviewable Renderable Plan
- Preserving organizational identity through the transformation
- Enabling preview before any changes go live
- Supporting export and portability of intent
- Providing clear acceptance criteria for operators

### What This Contract Is NOT

| Non-Goal | Explanation |
|----------|-------------|
| **Not WA HTML cloning** | We do not scrape and replay Wild Apricot HTML. We extract intent and reconstruct it using ClubOS primitives. |
| **Not auto-publishing** | Nothing renders to production without explicit human approval. The Renderable Plan is a proposal, not an action. |
| **Not pixel-perfect reproduction** | We preserve visual intent (colors, layout patterns, priorities), not exact pixels. Theme tokens approximate, not replicate. |
| **Not CMS bypass** | The Renderable Plan does not replace content management. Content lives in its authoritative stores; the plan references it. |

### Present vs Future

| Mechanism | Status |
|-----------|--------|
| Intent Manifest schema | **Present** - defined in INTENT_MANIFEST_SCHEMA.md |
| Suggestion review workflow | **Present** - defined in SUGGESTION_REVIEW_WORKFLOW.md |
| Preview surface contract | **Present** - defined in PREVIEW_SURFACE_CONTRACT.md |
| Renderable Plan generator | **Future required** - not yet implemented |
| Theme token extraction | **Future required** - not yet implemented |
| Export format specification | **Future required** - not yet implemented |

---

## B. Definitions

### Intent Manifest

The **Intent Manifest** is the durable, intermediate representation that captures an organization's presentation intent. It describes *what* the organization wants to accomplish with their presentation, not *how* to render it.

See: [INTENT_MANIFEST_SCHEMA.md](./INTENT_MANIFEST_SCHEMA.md)

Key properties:

- Source of truth for presentation intent
- Human-readable and reviewable
- Version-controlled and immutable once approved
- System-agnostic (not tied to Wild Apricot or any other source)

### Renderable Plan

The **Renderable Plan** is derived from the Intent Manifest. It is a deterministic, concrete specification of what will be rendered.

Key properties:

- **Derived**: Computed from Intent Manifest; never edited directly
- **Deterministic**: Same Intent Manifest produces same Renderable Plan
- **Reviewable**: Operators can inspect exactly what will be rendered
- **Concrete**: Specifies actual pages, sections, and tokens

The relationship:

```
Intent Manifest (what you want) --> Renderable Plan (what will happen)
```

### Theme Tokens

**Theme Tokens** are the visual design primitives that capture brand identity:

| Token Category | Examples |
|----------------|----------|
| Colors | Primary, secondary, accent, background, text |
| Typography | Font families, sizes, weights, line heights |
| Spacing | Margins, padding, gaps (as a scale) |
| Borders | Radii, widths, styles |

Theme tokens are:

- Extracted from source analysis (when migrating) or defined manually
- Minimal and extensible (start small, add as needed)
- Not exact replicas (approximate visual intent, not pixels)

### Sections, Stripes, and Blocks

| Term | Definition |
|------|------------|
| **Section** | A logical grouping of content with a single purpose (e.g., "About Us", "Upcoming Events") |
| **Stripe** | A horizontal band of a page that may contain one or more sections |
| **Block** | A discrete content module within a section (e.g., text block, image block, CTA button) |

These are content modules that compose pages. The Renderable Plan specifies which modules appear where.

### Navigation Model

The **Navigation Model** specifies how users move through the presentation:

| Component | Description |
|-----------|-------------|
| Primary Nav | Top-level menu items |
| Footer Links | Bottom-of-page navigation |
| CTAs | Call-to-action buttons (e.g., "Join Now", "Contact Us") |
| Breadcrumbs | Hierarchical location indicators |

The navigation model is derived from the Intent Manifest's navigation intent, not from HTML scraping.

### Page Templates vs Page Instances

| Concept | Definition |
|---------|------------|
| **Page Template** | A reusable layout pattern (e.g., "Landing Page", "Event Detail", "About Page") |
| **Page Instance** | A specific page using a template with actual content (e.g., "Our History" page using "About Page" template) |

The Renderable Plan references templates for layout and specifies instances for content.

---

## C. Output Contract: Renderable Plan

### Schema (Conceptual)

The Renderable Plan is structured data. This section defines its minimal required shape.

> **Note**: This is a conceptual specification. The exact implementation format (JSON, TypeScript types, etc.) is defined at implementation time.

#### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `planId` | string (UUID) | Unique identifier for this plan |
| `planVersion` | integer | Monotonically increasing version |
| `sourceManifestId` | string | Reference to the Intent Manifest this was derived from |
| `sourceManifestVersion` | integer | Which version of the manifest |
| `generatedAt` | timestamp | When this plan was generated |
| `generatedBy` | string | System or operator that generated it |

#### Page List

| Field | Type | Description |
|-------|------|-------------|
| `pages` | array | All pages in the presentation |
| `pages[].pageId` | string | Stable identifier |
| `pages[].slug` | string | URL path segment (e.g., "about-us") |
| `pages[].title` | string | Page title |
| `pages[].templateRef` | string | Reference to page template |
| `pages[].sections` | array | Ordered list of sections on this page |
| `pages[].visibility` | enum | public, members, officers, admins |

#### Navigation Structure

| Field | Type | Description |
|-------|------|-------------|
| `navigation.primary` | array | Primary nav items |
| `navigation.primary[].label` | string | Display text |
| `navigation.primary[].targetPageId` | string | Which page this links to |
| `navigation.primary[].position` | integer | Explicit ordering |
| `navigation.primary[].children` | array | Submenu items (if hierarchical) |
| `navigation.footer` | array | Footer link groups |
| `navigation.ctas` | array | Call-to-action specifications |

#### Theme Token Set

| Field | Type | Description |
|-------|------|-------------|
| `theme.colors.primary` | string | Primary brand color (hex) |
| `theme.colors.secondary` | string | Secondary color |
| `theme.colors.accent` | string | Accent/highlight color |
| `theme.colors.background` | string | Page background |
| `theme.colors.text` | string | Primary text color |
| `theme.typography.headingFamily` | string | Font family for headings |
| `theme.typography.bodyFamily` | string | Font family for body text |
| `theme.typography.baseSize` | string | Base font size |
| `theme.spacing.scale` | array | Spacing scale values |

This token set is minimal. Implementations may extend it while preserving backward compatibility.

#### Asset References

| Field | Type | Description |
|-------|------|-------------|
| `assets` | array | Referenced assets |
| `assets[].assetId` | string | Stable identifier |
| `assets[].type` | enum | logo, hero, favicon, image |
| `assets[].sourceRef` | string | Pointer to asset location |
| `assets[].altText` | string | Accessibility text |

Assets are pointers, not embedded content. The rendering layer fetches assets from their authoritative location.

### Handling Unknowns

When intent cannot be extracted from the manifest, the system surfaces this explicitly.

| Field | Type | Description |
|-------|------|-------------|
| `unknowns` | array | Explicit gaps requiring operator decision |
| `unknowns[].unknownId` | string | Identifier for tracking |
| `unknowns[].context` | string | Where in the manifest this arose |
| `unknowns[].question` | string | What needs to be decided |
| `unknowns[].options` | array | Suggested resolutions (if any) |
| `unknowns[].required` | boolean | Whether plan can proceed without resolution |

A Renderable Plan with unresolved `required` unknowns cannot be committed.

### Determinism Rules

Given the same Intent Manifest version, the Renderable Plan MUST be identical:

1. **Stable ordering**: Arrays use explicit position fields, not insertion order
2. **Stable IDs**: Identifiers are derived deterministically, not randomly generated
3. **No runtime inference**: The plan contains only what was explicitly derived
4. **Reproducible generation**: Running the generator twice yields identical output

---

## D. Review and Safety

### How Suggestions Appear

Suggestions follow the workflow defined in [SUGGESTION_REVIEW_WORKFLOW.md](./SUGGESTION_REVIEW_WORKFLOW.md).

For presentation reconstruction, the flow is:

```
[Source Analysis] --> [Suggestion: Draft Intent Manifest]
                              |
                              v
                      [Operator Reviews]
                              |
            +-----------------+-----------------+
            |                 |                 |
         [Accept]          [Revise]          [Reject]
            |                 |
            v                 v
[Approved Manifest]    [Modified Suggestion]
            |                 |
            v                 v
   [Generate Renderable Plan]
            |
            v
   [Preview and Review]
            |
    +-------+-------+
    |               |
[Approve]        [Abort]
    |
    v
[Commit to Production]
```

### Required Approvals Before Preview

| Approval Gate | Required Before | Authority |
|---------------|-----------------|-----------|
| Manifest approval | Renderable Plan generation | `suggestion:approve` capability |
| Plan review | Preview rendering | `content:preview` capability |
| Commit authorization | Production rendering | `content:publish` capability |

No step skips a gate. Each gate is explicit and logged.

### Audit Trail Requirements

Every transition MUST be logged:

| Event | Logged Fields |
|-------|---------------|
| Manifest created | manifestId, version, creator, timestamp |
| Manifest approved | manifestId, approver, timestamp |
| Plan generated | planId, sourceManifestId, generator, timestamp |
| Plan reviewed | planId, reviewer, timestamp |
| Preview rendered | planId, previewer, timestamp |
| Commit executed | planId, committer, timestamp |
| Abort executed | planId, aborter, reason, timestamp |

Logs are append-only. Deletion of audit logs is prohibited.

---

## E. Preview Guarantees

Preview guarantees align with [PREVIEW_SURFACE_CONTRACT.md](./PREVIEW_SURFACE_CONTRACT.md).

### Same Render Path

The preview MUST use the same rendering logic as production:

| Guarantee | Meaning |
|-----------|---------|
| Same templates | Preview renders with production templates |
| Same theme tokens | Preview applies the same token values |
| Same asset resolution | Preview fetches assets the same way |
| Same navigation model | Preview renders navigation identically |

If preview and production diverge, trust is broken. They must be the same code path.

### No Side Effects

Preview MUST NOT:

- Modify any database records
- Publish any content
- Send any notifications
- Alter any system state

Preview is read-only. It renders to a preview surface that is isolated from production.

### No Silent Changes

If the Renderable Plan changes between previews:

- The change MUST be visible in the plan diff
- The operator MUST be notified
- A re-preview MUST be required before commit

### Explicit Mismatch Reporting

When the system cannot faithfully reconstruct something:

| Mismatch Type | Report |
|---------------|--------|
| Content missing | "Could not locate source content for section X" |
| Asset unavailable | "Asset Y referenced but not accessible" |
| Template mismatch | "Source layout Z has no matching template" |
| Style approximation | "Color extracted as #ABC123; closest token is #ABC000" |

Mismatches appear in the preview report. Operators decide whether to proceed.

---

## F. Export and Portability

### Exportable Intent

The Intent Manifest and Renderable Plan MUST be exportable:

| Export Target | Format (Conceptual) |
|---------------|---------------------|
| Backup/Archive | JSON with schema version |
| Human review | Markdown summary |
| Migration | JSON with references resolved |

### Export Principles

1. **Self-describing**: Exported artifacts include schema version and type
2. **Stable references**: Asset references use stable URIs
3. **No vendor lock-in**: Export format does not require ClubOS to interpret
4. **Reversible**: An exported manifest can be re-imported to recreate the plan

### CMS Lock-In Avoidance

To avoid lock-in:

| Principle | Implementation |
|-----------|----------------|
| Content stays portable | Content in standard formats (Markdown, HTML, images) |
| Structure is explicit | Intent Manifest is human-readable and documented |
| Rendering is separate | Theme tokens and templates are layered, not baked in |
| No proprietary encoding | All data formats are open and documented |

An organization that exports their Intent Manifest and content can, in principle, reconstruct their presentation elsewhere.

---

## G. Explicit Non-Guarantees and Undefined Areas

This section documents what this contract intentionally does not define, guarantee, or attempt to automate. These omissions are deliberate. They protect trust by being honest about boundaries rather than making promises the system cannot keep.

### G.1 Visual Layout Preservation

| Not Guaranteed | Why Intentionally Undefined | Who Is Responsible |
|----------------|----------------------------|-------------------|
| Column widths and proportions | Source layouts depend on WA's CSS framework; ClubOS uses different layout primitives | Operator reviews preview and adjusts if needed |
| Responsive breakpoints | Mobile/tablet behavior is template-dependent, not extractable from source | ClubOS templates define responsive behavior |
| Vertical rhythm and spacing | Precise pixel spacing is theme-engine specific | Theme tokens approximate; human validates |
| Animation and transitions | Interactive behaviors are not part of presentation intent | ClubOS templates may add or omit as appropriate |

**Why this protects trust**: Promising layout fidelity would require replicating WA's rendering engine. That creates fragile coupling. Instead, we promise *recognizable* presentation and give operators the preview to verify it.

### G.2 CSS and Style Inheritance

| Not Guaranteed | Why Intentionally Undefined | Who Is Responsible |
|----------------|----------------------------|-------------------|
| Custom CSS rules | Arbitrary CSS cannot be safely migrated without understanding its purpose | Organization provides brand guidelines; operator configures tokens |
| WA theme internals | WA themes are proprietary; we extract visible outcomes, not implementation | Theme tokens capture visual intent, not source rules |
| Browser-specific rendering | Browser quirks are outside scope | ClubOS targets modern browsers; edge cases are implementation concerns |
| Third-party font licensing | Font availability depends on licensing agreements | Organization ensures fonts are licensed for ClubOS use |

**Why this protects trust**: CSS is code. Migrating code without understanding it creates hidden failures. We extract *what it looks like*, not *how it was built*.

### G.3 Widget and Component Equivalence

| Not Guaranteed | Why Intentionally Undefined | Who Is Responsible |
|----------------|----------------------------|-------------------|
| WA-specific widgets | Widgets like event calendars, member directories are WA features | ClubOS provides its own components; mapping is explicit in manifest |
| Custom code blocks | Embedded JavaScript or custom HTML may have unknown dependencies | Operator reviews and decides whether to migrate, recreate, or omit |
| Third-party integrations | External widgets (forms, chat, analytics) are not part of presentation intent | Organization re-configures integrations in ClubOS |
| Dynamic content sources | Content pulled from external APIs is not captured in intent | Operator documents external dependencies separately |

**Why this protects trust**: Widgets are behavior, not presentation. Silently migrating a broken widget is worse than explicitly noting it needs attention.

### G.4 Semantic Inference

| Not Guaranteed | Why Intentionally Undefined | Who Is Responsible |
|----------------|----------------------------|-------------------|
| Understanding organizational meaning | System extracts structure, not purpose | Operator validates that extracted structure reflects actual intent |
| Detecting outdated content | System cannot know if content is stale | Organization reviews content during migration |
| Inferring navigation hierarchy | System suggests based on visible structure; may not match organizational mental model | Operator adjusts navigation in review |
| Distinguishing important from incidental | System treats all visible content equally | Operator marks emphasis in manifest |

**Why this protects trust**: Pretending the system understands meaning would create false confidence. Operators know their organization; the system provides tools, not judgment.

### G.5 Content Completeness

| Not Guaranteed | Why Intentionally Undefined | Who Is Responsible |
|----------------|----------------------------|-------------------|
| Capturing hidden content | Content behind login walls, unpublished drafts, or conditional display may not be visible to analysis | Operator ensures all intended content is accessible during analysis |
| Detecting missing assets | Broken image links or deleted files in source may not be flagged | Preview surfaces what's available; operator verifies completeness |
| Preserving content history | Version history and edit timestamps are not part of presentation intent | If history matters, it's a data migration concern, not presentation |
| Migrating unpublished drafts | Only published presentation is analyzed | Operator manually migrates draft content if needed |

**Why this protects trust**: The system sees what is visible. Promising to find invisible content would be a lie.

### G.6 Rendering Engine Guarantees

| Not Guaranteed | Why Intentionally Undefined | Who Is Responsible |
|----------------|----------------------------|-------------------|
| Template immutability | ClubOS templates may evolve over time | Renderable Plan references templates by ID; changes are versioned |
| Cross-browser pixel identity | Different browsers render differently | ClubOS tests against modern browsers; minor variations are expected |
| Print fidelity | Print rendering is not preview scope | If print matters, organization tests separately |
| Accessibility perfection | Accessibility is improved incrementally | ClubOS templates aim for WCAG compliance; organization validates |

**Why this protects trust**: Templates are living code. Freezing them would prevent improvements. The contract is that *the same plan produces the same output*—not that output never improves.

### G.7 Automatic Error Correction

| Not Guaranteed | Why Intentionally Undefined | Who Is Responsible |
|----------------|----------------------------|-------------------|
| Fixing organizational mistakes | If source content has errors, they migrate as-is | Organization reviews and corrects content |
| Improving poor structure | If source navigation is confusing, system reproduces confusion | Operator restructures during review if desired |
| Standardizing inconsistent branding | If source uses multiple conflicting styles, system captures the inconsistency | Operator chooses which style to normalize to |
| Removing outdated content | System does not judge what should be removed | Organization decides what to keep |

**Why this protects trust**: Migration is not editorial. The system's job is fidelity to intent, not improvement of intent. Operators and organizations make editorial decisions.

### G.8 Summary: What Fills These Gaps

| Gap Category | Filled By |
|--------------|-----------|
| Visual judgment calls | Operator preview review |
| Semantic understanding | Organization's knowledge of itself |
| Technical edge cases | ClubOS implementation decisions |
| Content quality | Organization's editorial judgment |
| Integration configuration | Operator re-configuration in ClubOS |

The contract defines what the *system* guarantees. These gaps are filled by *humans*—operators and organizations—who bring context the system cannot have.

---

## H. Acceptance Tests

### Operator Checklist

An operator can verify this contract is satisfied by checking:

| Criterion | Test |
|-----------|------|
| Intent Manifest exists | A versioned, reviewable manifest is present |
| Manifest is approved | Approval recorded in audit log |
| Renderable Plan derived | Plan generated from approved manifest |
| Plan is deterministic | Regenerating produces identical plan |
| Unknowns are surfaced | Any gaps are explicitly listed |
| Preview available | Preview renders without errors |
| Preview matches production path | Same templates and tokens used |
| Mismatches reported | Any reconstruction gaps are documented |
| Audit trail complete | All state transitions logged |
| Export works | Manifest can be exported to JSON |

### Recognizability Rubric

"Recognizable fidelity" is measured by human review:

| Dimension | Pass Criteria |
|-----------|---------------|
| **Brand colors present** | Primary brand colors appear in rendered output |
| **Logo visible** | Organization logo renders in expected locations |
| **Navigation intuitive** | Members can find major sections as before |
| **Content hierarchy preserved** | Important content remains prominent |
| **Mission visible** | Organization's purpose is clear to visitors |

A migration passes the recognizability test if:

> A member visiting the new site says "Yes, this is my organization" within 5 seconds.

This is a subjective human judgment, not an automated metric. The preview exists to enable this judgment before commit.

### Document-Level Acceptance

This contract document is acceptable when:

1. All sections (A-G) are complete
2. Terms are defined unambiguously
3. Schema fields are enumerated
4. Present vs. future mechanisms are labeled
5. Related documents are linked
6. Operators can use the checklist to verify compliance

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2025-12-25 | System | Initial specification |
| 2025-12-25 | System | Add Section G: Explicit Non-Guarantees and Undefined Areas |
| 2025-12-25 | System | Language audit: remove ambiguous "determine" phrasing |
