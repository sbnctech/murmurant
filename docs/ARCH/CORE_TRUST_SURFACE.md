# Core Trust Surface

**Status**: Canonical
**Last Updated**: 2025-12-25

---

## Purpose

The Core Trust Surface is the set of architectural contracts that define what customers can rely on during migration, preview, and organizational presentation workflows. These contracts are not implementation details. They are promises.

This document formally declares which specifications form the trust surface and establishes change control rules to prevent regression.

---

## Components

The Core Trust Surface consists of the following documents:

| Document | Purpose | Status |
|----------|---------|--------|
| [Intent Manifest Schema](./INTENT_MANIFEST_SCHEMA.md) | Defines the intermediate representation of organizational intent | Active |
| [Preview Surface Contract](./PREVIEW_SURFACE_CONTRACT.md) | Guarantees what preview shows and does not show | Active |
| [Suggestion Review Workflow](./SUGGESTION_REVIEW_WORKFLOW.md) | State machine for human-authorized suggestions | Active |
| [Reversibility Contract](./REVERSIBILITY_CONTRACT.md) | Guarantees for abort and recovery | Planned |
| [Intent-to-Rendering Contract](./INTENT_TO_RENDERING_CONTRACT.md) | Guarantees for manifest-to-presentation transformation | Planned |

**Active**: Specification exists and is binding.
**Planned**: Specification is part of the trust surface but not yet written.

---

## What This Surface Guarantees

The Core Trust Surface provides the following guarantees to customers:

### 1. Human Authority

No consequential action occurs without explicit human authorization. The system proposes; humans decide. Authority resides with the customer, not the software.

### 2. Intent Determinism

What you review is what you get. The Intent Manifest captures exactly what will happen. There are no hidden transformations, inferred values, or smart defaults.

### 3. Preview Fidelity

Preview shows what execution will do. Preview and execution use the same logic path, the same input data, and produce deterministic results within a snapshot.

### 4. Abortability

Until explicit commit, you can walk away. Abort discards intentions without side effects. The source system remains unchanged. There is no penalty for caution.

### 5. Auditability

Every decision is logged. Who approved what, when, and why is recorded. The system fails visibly, not silently.

---

## What This Surface Forbids

The following are explicitly prohibited by the Core Trust Surface:

| Prohibition | Rationale |
|-------------|-----------|
| **Automatic execution** | Nothing commits without human approval |
| **Silent mutation** | No data changes without audit trail |
| **Preview-as-approval** | Viewing a preview does not authorize execution |
| **Implicit intent** | If it is not in the manifest, it does not happen |
| **CMS cloning** | The manifest captures intent, not content |
| **Hidden inference** | No auto-detected values or inferred relationships |
| **Timeout-based commit** | No passive approval via inaction |
| **Partial commits** | Manifests apply atomically or not at all |

---

## Change Control

### Scope

Any change to documents in the Core Trust Surface requires architectural review. This includes:

- Modification of guarantee language
- Addition or removal of guarantees
- Changes to state machine transitions
- Modifications to abort semantics
- Changes to what preview shows or hides

### Invariants

Changes must preserve:

1. **Abortability** — Customers can always walk away before commit
2. **Human authority** — No automation decides; humans decide
3. **Intent determinism** — Manifest produces predictable outcomes
4. **Preview fidelity** — What you see is what will happen
5. **Audit completeness** — Every action is logged

### What May Evolve

- Implementation details (how guarantees are achieved)
- Performance characteristics
- User interface presentation
- Internal data structures
- Tooling and automation

### What May Not Regress

- Customer-facing guarantees
- Abort semantics
- Authority boundaries
- Audit completeness
- Determinism properties

---

## Relationship to Other Documents

The Core Trust Surface sits above implementation documents:

```
┌─────────────────────────────────────────┐
│         CORE TRUST SURFACE              │
│  (Intent, Preview, Suggestion, Abort)   │
├─────────────────────────────────────────┤
│         ARCHITECTURAL CHARTER           │
│     (Principles P1-P10, Anti-Patterns)  │
├─────────────────────────────────────────┤
│         IMPLEMENTATION DOCUMENTS        │
│   (Runbooks, Guides, Technical Specs)   │
└─────────────────────────────────────────┘
```

Implementation documents may reference trust surface guarantees. They may not contradict or weaken them.

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2025-12-25 | System | Initial specification |
