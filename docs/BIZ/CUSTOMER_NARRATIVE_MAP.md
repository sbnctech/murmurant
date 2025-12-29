# Customer Narrative Map

> How Murmurant explains itself across customer-facing documentation

This document analyzes the narrative arc across Murmurant customer communications, identifies a unifying "story spine," and maps where each document reinforces or departs from that spine.

---

## Documents Reviewed

| Document | Status | Primary Audience |
|----------|--------|------------------|
| MIGRATION_CUSTOMER_JOURNEY.md | Reviewed | Clubs considering migration |
| ORGANIZATIONAL_PRESENTATION_PHILOSOPHY.md | Reviewed | Clubs concerned about identity preservation |
| HOW_MURMURANT_IS_BUILT.md | Not found | (Would address technical trust) |
| BRAND_AND_VOICE.md | Not found | (Would address tone/consistency) |

**Note**: Analysis proceeds with available documents. Missing documents represent a gap in narrative coverage.

---

## The Story Spine

A coherent customer narrative follows this 7-step arc:

| Step | Theme | Core Message |
|------|-------|--------------|
| 1 | **Your club matters** | We understand what you've built over years |
| 2 | **Change is scary** | Migration anxiety is legitimate and expected |
| 3 | **We guide, you decide** | Human-in-the-loop at every consequential step |
| 4 | **See before you leap** | Preview everything before commitment |
| 5 | **You stay in control** | Abort anytime; explicit approval required |
| 6 | **Your identity arrives intact** | Data, relationships, history preserved |
| 7 | **We're still here after** | Partnership continues post-migration |

---

## Mapping Documents to Spine

### MIGRATION_CUSTOMER_JOURNEY.md

| Spine Step | Coverage | How Addressed |
|------------|----------|---------------|
| 1. Your club matters | Partial | Implied in "respects your organization's identity" but not emphasized |
| 2. Change is scary | Strong | Anxiety/reassurance tables throughout all 7 phases |
| 3. We guide, you decide | Strong | "Operator accompanies—never operates behind scenes" |
| 4. See before you leap | Strong | Phase 3 (Dry Run Preview) entirely dedicated |
| 5. You stay in control | Strong | "Rollback available" (now "Abort available"), explicit cutover decision |
| 6. Identity arrives intact | Moderate | Data completeness emphasized; identity less explicit |
| 7. Still here after | Strong | Phase 7 covers post-migration partnership |

**Narrative strength**: This document excels at addressing fear through structured reassurance. The anxiety/reassurance pattern is consistent and thorough.

**Narrative gap**: Step 1 (Your club matters) is assumed rather than stated. Opens with process, not empathy.

---

### ORGANIZATIONAL_PRESENTATION_PHILOSOPHY.md

| Spine Step | Coverage | How Addressed |
|------------|----------|---------------|
| 1. Your club matters | Strong | "Murmurant helps your organization arrive intact" |
| 2. Change is scary | Moderate | Implicit in "identity preservation" framing |
| 3. We guide, you decide | Strong | Assisted reconstruction: Discover → Suggest → Review → Approve |
| 4. See before you leap | Strong | Preview as first-class concept |
| 5. You stay in control | Strong | Human-in-the-loop approval flow |
| 6. Identity arrives intact | Strong | Core promise of the document |
| 7. Still here after | Not addressed | Focuses on migration, not ongoing relationship |

**Narrative strength**: Strongest statement of identity preservation. The "arrive intact" framing is emotionally resonant.

**Narrative gap**: Ends at migration completion. Doesn't address ongoing partnership (Step 7).

---

## Gaps Analysis

### Missing Documents

| Document | Expected Contribution | Impact of Absence |
|----------|----------------------|-------------------|
| HOW_MURMURANT_IS_BUILT.md | Technical trust (how we build safely) | Customers lack insight into engineering practices |
| BRAND_AND_VOICE.md | Tone consistency across all touchpoints | Risk of inconsistent messaging |

### Narrative Gaps in Existing Documents

| Gap | Where Occurs | Recommendation |
|-----|--------------|----------------|
| "Your club matters" underemphasized | MIGRATION_CUSTOMER_JOURNEY.md opening | Add empathy paragraph before process description |
| Post-migration relationship | ORGANIZATIONAL_PRESENTATION_PHILOSOPHY.md | Add brief note that philosophy extends beyond migration |
| Technical trust foundation | Both documents | Create HOW_MURMURANT_IS_BUILT.md or equivalent |

---

## Overlaps (Reinforcing)

These overlaps are positive—they reinforce the narrative:

| Theme | Document 1 | Document 2 | Assessment |
|-------|-----------|-----------|------------|
| Human-in-the-loop | Migration Journey (Phase 5) | Presentation Philosophy (Approval Flow) | Consistent and complementary |
| Preview before commit | Migration Journey (Dry Run) | Presentation Philosophy (Preview Surface) | Strong alignment |
| Abort/reversibility | Migration Journey (Rollback) | Presentation Philosophy (Revertibility) | Aligned after terminology cleanup |

---

## Contradictions (None Found)

No contradictions were identified between reviewed documents. The terminology cleanup in PR #324 resolved potential confusion around "rollback" vs "abort" semantics.

---

## Recommendations

### 1. Create Missing Documents

- **HOW_MURMURANT_IS_BUILT.md**: Explain engineering practices that support customer guarantees (versioned manifests, preview gates, test coverage)
- **BRAND_AND_VOICE.md**: Define tone guidelines ensuring consistent messaging

### 2. Strengthen Story Spine Step 1

Add an opening section to MIGRATION_CUSTOMER_JOURNEY.md that explicitly acknowledges:
- Clubs have built something meaningful over years
- That history and identity deserve respect
- Murmurant exists to preserve, not replace

### 3. Extend Philosophy Document

Add a brief section to ORGANIZATIONAL_PRESENTATION_PHILOSOPHY.md noting that the philosophy of "arrive intact" extends beyond migration day into ongoing operations.

### 4. Cross-Reference Trust Surface

Both documents should reference the Core Trust Surface contracts (added in PR #331) so customers can see the formal guarantees backing the narrative claims.

---

## Trust Architecture Alignment

Both documents converge on a shared trust architecture:

| Trust Principle | Migration Journey | Presentation Philosophy |
|-----------------|-------------------|------------------------|
| **Visibility** | "Customer sees exactly what will happen" | Preview as first-class concept |
| **Control** | "Every consequential step requires approval" | Human-in-the-loop approval |
| **Reversibility** | "Abort documented for every phase" | Abortable until commit |
| **Partnership** | "Operator accompanies—never behind scenes" | Assisted reconstruction model |
| **Patience** | "No artificial time pressure" | Customer-paced decisions |

This alignment is strong. The trust architecture is consistent across documents.

---

## Related Documentation

- [Migration Customer Journey](../IMPORTING/MIGRATION_CUSTOMER_JOURNEY.md) — Full migration experience
- [Organizational Presentation Philosophy](./ORGANIZATIONAL_PRESENTATION_PHILOSOPHY.md) — Identity preservation principles
- [Architectural Charter](../ARCHITECTURAL_CHARTER.md) — Core Trust Surface section
- [Methodology to Guarantee Map](../ARCH/METHODOLOGY_TO_GUARANTEE_MAP.md) — Practice-to-guarantee traceability

---

*This analysis reflects documentation as of December 2025. It identifies narrative patterns and gaps without inventing new features or promises.*
