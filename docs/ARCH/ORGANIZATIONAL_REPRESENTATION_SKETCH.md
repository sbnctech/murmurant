# Organizational Representation Sketch

**Status**: Architecture Sketch
**Last Updated**: 2025-12-25
**Related Documents**:
- [Organizational Presentation Philosophy](../BIZ/ORGANIZATIONAL_PRESENTATION_PHILOSOPHY.md)
- [Intent Manifest Schema](./INTENT_MANIFEST_SCHEMA.md)
- [Intent to Rendering Contract](./INTENT_TO_RENDERING_CONTRACT.md)

---

## Purpose

This document sketches how ClubOS represents an organization's public-facing identity - not just data, but how they want to be seen. It connects the philosophical goals (why this matters) to the technical contracts (how it works).

---

## The Representation Problem

### Organizations Are More Than Databases

When an organization exists in Wild Apricot, they have:

- Member records (data)
- Event history (data)
- Financial transactions (data)

But also:

- A website that welcomes visitors
- Navigation that guides people to what matters
- Colors and imagery that convey identity
- Language that reflects their voice

**The second list is not data. It is presentation intent.**

### Why Presentation Intent Matters

Two organizations with identical member counts and event types may present themselves completely differently:

| Aspect | Organization A | Organization B |
|--------|----------------|----------------|
| Tone | Formal, professional | Warm, casual |
| Emphasis | Governance, bylaws | Events, community |
| Colors | Navy, gold | Teal, coral |
| Hero image | Board meeting | Members laughing |

These differences matter to the organizations. They are not accidents. They are choices.

ClubOS must preserve these choices during migration.

---

## Representation Layers

### Layer 1: Data (Already Solved)

Member records, events, registrations, transactions. This is the domain of traditional migration - ETL, validation, mapping.

ClubOS handles this through importers and the existing data model.

### Layer 2: Intent (This Problem)

How the organization wants to present themselves. Captured in:

- **Intent Manifest**: The source of truth for presentation intent
- See: [INTENT_MANIFEST_SCHEMA.md](./INTENT_MANIFEST_SCHEMA.md)

### Layer 3: Rendering (Derived from Intent)

What actually appears on screen. Specified in:

- **Renderable Plan**: Derived from Intent Manifest
- See: [INTENT_TO_RENDERING_CONTRACT.md](./INTENT_TO_RENDERING_CONTRACT.md)

### Layer 4: Preview and Approval

How operators verify the rendering is acceptable:

- Preview surfaces
- Human-in-the-loop approval
- Abort and retry

---

## How Intent Flows to Rendering

```
                          +-----------------------+
                          |    Source System      |
                          | (e.g., Wild Apricot)  |
                          +-----------+-----------+
                                      |
                                      | [Analysis]
                                      v
                          +-----------------------+
                          |   Suggested Intent    |
                          |      Manifest         |
                          +-----------+-----------+
                                      |
                                      | [Human Review]
                                      v
                          +-----------------------+
                          |   Approved Intent     |
                          |      Manifest         |
                          +-----------+-----------+
                                      |
                                      | [Generation]
                                      v
                          +-----------------------+
                          |   Renderable Plan     |
                          |   (Deterministic)     |
                          +-----------+-----------+
                                      |
                                      | [Preview]
                                      v
                          +-----------------------+
                          |   Preview Surface     |
                          |   (Human Approval)    |
                          +-----------+-----------+
                                      |
                          +-----------+-----------+
                          |                       |
                     [Approve]               [Abort]
                          |
                          v
                  +---------------+
                  |  Production   |
                  |   Rendering   |
                  +---------------+
```

---

## Contract Alignment

This sketch aligns with the formal contract in [INTENT_TO_RENDERING_CONTRACT.md](./INTENT_TO_RENDERING_CONTRACT.md).

### Key Alignments

| This Sketch Says | Contract Specifies |
|------------------|-------------------|
| Intent is captured explicitly | Intent Manifest schema with required fields |
| Rendering is derived | Renderable Plan computed from manifest |
| Humans approve before publish | Approval gates with capability requirements |
| Preview matches production | Same render path guarantee |
| Mismatches are surfaced | Explicit unknowns and mismatch reporting |
| Export enables portability | Export format and lock-in avoidance principles |

### What the Contract Adds

The contract provides:

1. **Precise field definitions** for Renderable Plan
2. **Determinism rules** ensuring reproducibility
3. **Audit requirements** for every state transition
4. **Acceptance criteria** for operators to verify compliance

This sketch provides the "why" and high-level "how". The contract provides the "exactly what".

---

## What This Is NOT

### Not a CMS Architecture

We are not designing a content management system. Content lives elsewhere. This is about representing *how* content is organized and presented.

### Not a Theme Engine

We are not building a CSS framework or design system. Theme tokens capture brand identity; they do not replace styling tools.

### Not Wild Apricot Emulation

We do not replicate WA behaviors, quirks, or HTML structure. We extract intent and reconstruct it in ClubOS terms.

---

## Current Status

| Component | Status |
|-----------|--------|
| Philosophy documented | Done - see ORGANIZATIONAL_PRESENTATION_PHILOSOPHY.md |
| Intent Manifest schema defined | Done - see INTENT_MANIFEST_SCHEMA.md |
| Intent-to-Rendering contract defined | Done - see INTENT_TO_RENDERING_CONTRACT.md |
| Suggestion workflow specified | Done - see SUGGESTION_REVIEW_WORKFLOW.md |
| Preview contract specified | Done - see PREVIEW_SURFACE_CONTRACT.md |
| Intent extractor (from WA) | **Future required** |
| Renderable Plan generator | **Future required** |
| Theme token extractor | **Future required** |
| Preview surface implementation | **Future required** |
| Export tooling | **Future required** |

---

## Next Steps

1. **Define extraction heuristics**: How do we analyze Wild Apricot to suggest intent?
2. **Implement Renderable Plan generator**: Consume manifest, produce plan
3. **Build preview surface**: Render plan without side effects
4. **Create operator review UI**: Let humans approve/reject/revise
5. **Implement export**: Enable portability of intent

Each step requires its own specification. This sketch provides the framing.

---

## References

- [Organizational Presentation Philosophy](../BIZ/ORGANIZATIONAL_PRESENTATION_PHILOSOPHY.md) - Why this matters
- [Intent Manifest Schema](./INTENT_MANIFEST_SCHEMA.md) - How intent is captured
- [Intent to Rendering Contract](./INTENT_TO_RENDERING_CONTRACT.md) - How intent becomes rendering
- [Suggestion Review Workflow](./SUGGESTION_REVIEW_WORKFLOW.md) - How suggestions are reviewed
- [Preview Surface Contract](./PREVIEW_SURFACE_CONTRACT.md) - How previews work

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2025-12-25 | System | Initial sketch |
