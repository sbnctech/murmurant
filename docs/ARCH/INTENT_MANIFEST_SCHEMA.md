# Intent Manifest Schema

**Status**: Specification Draft
**Last Updated**: 2024-12-24
**Related Issues**: #202, #275, #277
**Related Documents**:
- [Preview Surface Contract](./PREVIEW_SURFACE_CONTRACT.md)
- [Suggestion Review Workflow](./SUGGESTION_REVIEW_WORKFLOW.md)
- [Migration Invariants](./MIGRATION_INVARIANTS.md)

---

## Table of Contents

- [Purpose](#purpose)
- [What the Intent Manifest Is NOT](#what-the-intent-manifest-is-not)
- [Schema Sections](#schema-sections)
- [Determinism Guarantees](#determinism-guarantees)
- [Required vs Optional Fields](#required-vs-optional-fields)
- [Relationship to Workflows](#relationship-to-workflows)
- [Explicit Non-Goals](#explicit-non-goals)
- [Revision History](#revision-history)

---

## Purpose

### Why It Exists

The Intent Manifest is a durable, intermediate representation that captures
an organization's presentation intent during assisted migration or
reconstruction. It sits between:

- The source system (e.g., Wild Apricot)
- The target system (Murmurant)

The manifest does not describe how to render content. It describes what
the organization wants their presentation to accomplish.

### What Problem It Solves

Organizations migrating to Murmurant face three anxieties:

1. **Data loss**: Will my content survive the transition?
2. **Loss of control**: Will the system do something I did not approve?
3. **Irreversibility**: If something goes wrong, can I recover?

The Intent Manifest addresses all three by creating a reviewable,
version-controlled artifact that:

- Captures intent explicitly, with no hidden inference
- Can be reviewed by operators before any changes occur
- Can be discarded and regenerated without side effects

### Why It Is Required for Trust, Preview, and Abortability

**Trust**: The manifest is human-readable. Operators can review exactly
what will happen. There are no black-box transformations.

**Preview**: The manifest enables complete preview of organizational
presentation before any live changes. Preview surfaces read from the
manifest, not from partial or uncommitted state.

**Abortability**: Until the manifest is committed, no changes occur.
Aborting means discarding the manifest. The source system and target
system remain unchanged.

---

## What the Intent Manifest Is NOT

### Not a CMS

The manifest captures intent, not content. Content lives in source
documents, databases, or files. The manifest references content by
stable identifiers. It does not duplicate, transform, or own content.

### Not a Wild Apricot Clone

The manifest is system-agnostic. It does not preserve WA-specific
structures, field names, or behaviors. Migration from WA is one use
case, but the manifest schema stands alone.

### Not Auto-Publishing

The manifest is inert. Creating or updating a manifest publishes
nothing. Publication requires explicit commit by an authorized
operator. The manifest is a proposal, not an action.

### Not Rendering Instructions

The manifest does not specify fonts, colors, layouts, or templates.
Those decisions belong to the rendering layer, which consumes the
manifest but is not defined by it.

---

## Schema Sections

The manifest is organized into logical sections. Each section captures
a category of intent.

### 1. Identity Anchors

Stable identifiers that connect manifest entries to source and target
systems.

| Field | Type | Description |
|-------|------|-------------|
| `manifestId` | string (UUID) | Unique identifier for this manifest version |
| `manifestVersion` | integer | Monotonically increasing version number |
| `organizationId` | string | Murmurant organization identifier |
| `sourceSystem` | string | Origin system (e.g., "wild-apricot", "manual") |
| `sourceOrgId` | string | Identifier in source system (if applicable) |
| `createdAt` | timestamp | When manifest was created |
| `createdBy` | string | Operator who created the manifest |

### 2. Navigation Intent

Describes the intended top-level structure of organizational
navigation.

| Field | Type | Description |
|-------|------|-------------|
| `navigationScheme` | enum | Overall structure (flat, hierarchical, hybrid) |
| `primaryItems` | array | Ordered list of primary navigation items |
| `primaryItems[].label` | string | Display label |
| `primaryItems[].targetType` | enum | page, section, external, anchor |
| `primaryItems[].targetRef` | string | Reference to target (by stable ID) |
| `primaryItems[].position` | integer | Explicit ordering position |
| `primaryItems[].visibility` | object | Visibility constraints (see section 6) |

### 3. Content Grouping Intent

Describes how content should be organized into logical groups.

| Field | Type | Description |
|-------|------|-------------|
| `contentGroups` | array | Logical groupings of content |
| `contentGroups[].groupId` | string | Stable identifier for this group |
| `contentGroups[].label` | string | Human-readable group name |
| `contentGroups[].purpose` | enum | about, events, governance, resources, other |
| `contentGroups[].memberRefs` | array | References to content items in this group |
| `contentGroups[].orderingRule` | enum | manual, alphabetical, chronological, none |

### 4. Ordering and Emphasis

Describes how items should be ordered and which items deserve
special emphasis.

| Field | Type | Description |
|-------|------|-------------|
| `orderings` | array | Named ordering specifications |
| `orderings[].scope` | string | What is being ordered (group ID or global) |
| `orderings[].rule` | enum | manual, alphabetical, chronological, priority |
| `orderings[].sequence` | array | Explicit sequence (for manual ordering) |
| `emphases` | array | Items requiring special emphasis |
| `emphases[].targetRef` | string | Reference to emphasized item |
| `emphases[].emphasisType` | enum | featured, pinned, highlighted, urgent |
| `emphases[].effectiveRange` | object | Start and end timestamps (optional) |

### 5. Visibility Rules

Describes who can see which content.

| Field | Type | Description |
|-------|------|-------------|
| `visibilityRules` | array | Visibility specifications |
| `visibilityRules[].ruleId` | string | Stable identifier |
| `visibilityRules[].targetRefs` | array | What the rule applies to |
| `visibilityRules[].audience` | enum | public, members, officers, admins |
| `visibilityRules[].condition` | object | Additional conditions (optional) |

### 6. Presentation Constraints

Describes constraints on presentation that the rendering layer
must respect.

| Field | Type | Description |
|-------|------|-------------|
| `constraints` | array | Constraints on rendering |
| `constraints[].constraintId` | string | Stable identifier |
| `constraints[].constraintType` | enum | maxItems, hideEmpty, requireApproval |
| `constraints[].scope` | string | What the constraint applies to |
| `constraints[].parameters` | object | Constraint-specific parameters |

---

## Determinism Guarantees

### Stable Ordering

All arrays in the manifest use explicit `position` fields or named
ordering rules. There is no implicit ordering based on insertion
time, hash order, or other non-deterministic factors.

**Guarantee**: Given the same manifest, any consumer will process
items in the same order.

### Replayability

The manifest is versioned. Each version is immutable after creation.
Comparing two manifest versions produces a deterministic diff.

**Guarantee**: Replaying a manifest version produces the same
intent representation every time.

### No Hidden Inference

The manifest contains only what operators explicitly specified.
There are no smart defaults, auto-detected values, or inferred
relationships.

**Guarantee**: If something is not in the manifest, it will not
appear in the presentation.

---

## Required vs Optional Fields

### Required Fields

Every valid manifest must contain:

| Field | Rationale |
|-------|-----------|
| `manifestId` | Every artifact must be identifiable |
| `manifestVersion` | Every artifact must be versioned |
| `organizationId` | Must know which organization this is for |
| `sourceSystem` | Must know the origin for audit trail |
| `createdAt` | Must know when for audit trail |
| `createdBy` | Must know who for audit trail |

### Conditionally Required Fields

| Field | Condition |
|-------|-----------|
| `primaryItems` | Required if `navigationScheme` is specified |
| `orderings[].sequence` | Required if `orderings[].rule` is "manual" |

### Optional Fields

All other fields are optional. Omitting an optional field means:

- For arrays: empty (no items of this type)
- For objects: default behavior (defined by consuming layer)
- For scalars: null (no value specified)

---

## Relationship to Workflows

### Suggestion Workflows

The Intent Manifest is produced by suggestion workflows. These
workflows may analyze source content, propose structures, and
generate draft manifests. The manifest is the output of suggestion,
not its input.

```
[Source Analysis] --> [Suggestion Engine] --> [Draft Manifest]
                                                     |
                                                     v
                                            [Operator Review]
                                                     |
                                                     v
                                            [Approved Manifest]
```

### Preview Surfaces

Preview surfaces render the approved manifest without committing
changes. Preview is read-only and non-destructive.

```
[Approved Manifest] --> [Preview Renderer] --> [Preview Display]
                                                     |
                                              (no side effects)
```

### Cutover Rehearsal, Commit, and Abort

**Cutover Rehearsal**: A full preview run that validates the
manifest would produce a valid presentation. Rehearsal does not
commit changes but confirms the commit would succeed.

**Commit**: The manifest is applied to the target system. This is
a one-way operation. After commit, the manifest version is marked
as committed and cannot be re-committed.

**Abort**: Discards the manifest. No changes have occurred. The
operator may generate a new manifest and try again.

```
[Approved Manifest] --> [Cutover Rehearsal] --> [Rehearsal Report]
                               |
                               v
                        +------+------+
                        |             |
                     [Abort]      [Commit]
                        |             |
                  (no changes)   (apply changes)
```

---

## Explicit Non-Goals

The Intent Manifest does not:

1. **Store content** - Content lives elsewhere. The manifest
   references content by stable identifiers.

2. **Define rendering** - The manifest expresses intent. Rendering
   decisions (themes, layouts, typography) belong elsewhere.

3. **Support partial commits** - A manifest is committed atomically
   or not at all. There is no partial state.

4. **Enable rollback** - The manifest is forward-only. Reverting
   requires creating a new manifest that expresses the prior intent.

5. **Track edit history** - Each manifest version is a snapshot.
   The manifest does not contain change deltas or edit annotations.

6. **Support live editing** - The manifest is created, reviewed,
   and committed. It is not a live-editing surface.

7. **Replace organizational policy** - The manifest captures
   presentation intent. Organizational policies (membership rules,
   governance procedures) are captured separately in policy bundles.

8. **Automate decisions** - The manifest records decisions made by
   operators. It does not make decisions on their behalf.

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2024-12-24 | System | Initial specification |
