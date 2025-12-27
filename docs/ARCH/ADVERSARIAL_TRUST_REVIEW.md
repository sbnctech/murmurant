# Adversarial Trust Review

**Status**: Review Document
**Last Updated**: 2025-12-25
**Perspective**: Skeptical non-profit leader who has been burned before

---

## Purpose

This document examines ClubOS documentation from the perspective of someone who has experienced vendor failures, botched migrations, and broken promises. The goal is to identify gaps, unstated risks, and claims that may not hold under stress.

This is not a marketing document. It is an honest assessment of what the documentation promises, where those promises are supported, and where skepticism remains warranted.

---

## Review Categories

1. [Migration Promises](#1-migration-promises)
2. [Preview Guarantees](#2-preview-guarantees)
3. [Abort and Rollback Language](#3-abort-and-rollback-language)
4. [Human-in-the-Loop Claims](#4-human-in-the-loop-claims)
5. [Non-Goals and Exclusions](#5-non-goals-and-exclusions)

---

## 1. Migration Promises

### Concern 1.1: "Zero data loss" during abort

**Risk**: The documentation repeatedly states that abort leaves systems unchanged. But what if the abort mechanism itself fails? What if there's a bug in the "discard" logic?

**Source**: CUSTOMER_MIGRATION_CUTOVER_REHEARSAL.md, lines 43-44: "On Abort, the journal is discarded, and ClubOS returns to pre-rehearsal state."

**Assessment**: **Partially mitigated.** The architecture is designed for safe abort (intent journal is separate from production state). However:

- No documentation describes what happens if abort fails mid-execution
- No recovery procedure is documented for a corrupted abort state
- The "zero data loss" claim assumes the abort mechanism works correctly

**Recommendation**: Document the failure mode for abort itself. What does the operator do if abort hangs or errors?

---

### Concern 1.2: WA remains unchanged during rehearsal

**Risk**: The documentation claims Wild Apricot is untouched during rehearsal. But the sync process reads from WA. What if a sync bug causes writes to WA? What if API credentials are misconfigured to allow writes?

**Source**: CUSTOMER_MIGRATION_CUTOVER_REHEARSAL.md, line 16: "Wild Apricot remains your authoritative system (members continue using WA normally)"

**Assessment**: **Mitigated by design, but not by documentation.** The sync scripts use read-only API endpoints. However:

- No documentation explicitly states "ClubOS never writes to WA"
- No documentation describes API permission scoping (read-only vs. read-write)
- A skeptical customer cannot verify this claim without reading code

**Recommendation**: Add explicit statement about WA API access being read-only and how this is enforced.

---

### Concern 1.3: "No limit to rehearsal attempts"

**Risk**: The documentation says you can abort and retry as many times as needed. But what about data drift? If WA data changes significantly between attempts, does the migration become increasingly fragile?

**Source**: CUSTOMER_MIGRATION_CUTOVER_REHEARSAL.md, line 209: "You can abort and restart rehearsal as many times as needed. Each rehearsal starts fresh."

**Assessment**: **Accepted risk.** The documentation acknowledges this indirectly (recommends 24-72 hour rehearsal window). However:

- No documentation describes what "too much drift" looks like
- No guidance on when repeated failures indicate a structural problem

**Recommendation**: Add guidance on recognizing when repeated rehearsal failures suggest a deeper issue.

---

## 2. Preview Guarantees

### Concern 2.1: "Same logic path" between preview and execution

**Risk**: Preview claims to use the same decision logic as execution. But code paths diverge. A preview flag might skip a side effect that matters. Race conditions might exist in execution but not in preview.

**Source**: PREVIEW_SURFACE_CONTRACT.md, section 2.1: "Preview uses the same decision logic as execution"

**Assessment**: **Mitigated with documented limitations.** The contract explicitly lists Known Deltas (timestamp drift, external state change, concurrent modification). However:

- The contract does not address code path divergence explicitly
- No documentation describes how this guarantee is tested or enforced
- A sophisticated customer might ask: "How do you prove this?"

**Recommendation**: Consider adding a statement about how preview/execution parity is validated (e.g., shared function calls, automated tests).

---

### Concern 2.2: Preview may expire

**Risk**: The documentation states preview represents a point-in-time snapshot. But what tells the customer their preview is stale? Can they accidentally commit based on outdated information?

**Source**: PREVIEW_SURFACE_CONTRACT.md, section 3: "Preview represents a point-in-time snapshot; it expires when inputs change"

**Assessment**: **Partially mitigated.** The documentation recommends re-previewing if time passes or data changes. However:

- No documented mechanism forces re-preview before commit
- No documented staleness indicator or warning
- Customer could theoretically approve a week-old preview

**Recommendation**: Document whether the system warns about stale previews or requires re-preview before commit.

---

### Concern 2.3: Uncertainty markers are voluntary

**Risk**: The system uses uncertainty markers (`UNCERTAIN`, `REQUIRES_HUMAN`, etc.). But what ensures all uncertain situations are actually marked? A bug could silently skip the marker.

**Source**: PREVIEW_SURFACE_CONTRACT.md, section 2.4: "When the system cannot make a confident prediction, it must mark uncertainty explicitly"

**Assessment**: **Unresolved.** The contract states uncertainty "must" be marked, but:

- No documentation describes how this is enforced
- No documentation describes what happens if a prediction is wrong without a marker
- This relies on developer discipline, not system enforcement

**Recommendation**: Acknowledge that uncertainty markers are best-effort and may not catch all edge cases.

---

## 3. Abort and Rollback Language

### Concern 3.1: Abort vs. rollback distinction

**Risk**: The documentation distinguishes abort (before commit) from rollback (after commit). But customers may conflate these. If a customer thinks they can "undo" after commit like they can before commit, they may proceed with false confidence.

**Source**: SUGGESTION_REVIEW_WORKFLOW.md, lines 188-195: Abort mechanisms table; lines 189-195: Post-commit abort requirements

**Assessment**: **Mitigated.** The documentation explicitly distinguishes these concepts. However:

- The distinction appears in technical documentation, not customer-facing guides
- TRUST_AND_RISK_FAQ.md (if it exists) should reinforce this clearly
- A board member reading only the cutover guide might miss this nuance

**Recommendation**: Ensure customer-facing materials emphasize: "Before commit = easy abort. After commit = complex rollback (if available)."

---

### Concern 3.2: Rollback requires artifacts

**Risk**: Rollback after commit requires a preserved artifact. What if the artifact is corrupted or missing? What if the rollback capability wasn't enabled?

**Source**: SUGGESTION_REVIEW_WORKFLOW.md, lines 189-195: "Post-Commit Abort requires: Rollback artifact exists, Actor has content:rollback capability"

**Assessment**: **Accepted risk.** The documentation correctly states rollback requires artifacts. However:

- No documentation describes artifact integrity validation
- No documentation describes what happens if artifacts are missing
- The customer is informed rollback may not be available, which is honest

**Recommendation**: None. The limitation is clearly stated. Customers should understand not all operations are reversible.

---

### Concern 3.3: "Abort is always safe"

**Risk**: Multiple documents state abort is "always safe." This is a strong claim. Is there any scenario where abort causes problems?

**Source**: PREVIEW_SURFACE_CONTRACT.md, line 207: "Abort is always safe."

**Assessment**: **Mostly mitigated.** The architecture supports this claim (uncommitted data is discarded). However:

- No documentation addresses abort during external API calls
- No documentation addresses abort if the database is in an inconsistent state
- "Always" is an absolute that invites edge case failures

**Recommendation**: Consider softening to "Abort before commit is designed to be safe" and documenting any known edge cases.

---

## 4. Human-in-the-Loop Claims

### Concern 4.1: "System proposes, you decide"

**Risk**: The documentation claims humans make all decisions. But what about default behaviors? Auto-transitions? Background syncs? Are there hidden automations?

**Source**: SUGGESTION_REVIEW_WORKFLOW.md, line 33: "A suggestion must never mutate production state until explicitly accepted by a human with appropriate authority."

**Assessment**: **Mitigated by design.** The Suggestion Review Workflow explicitly prohibits auto-application. However:

- The Expire state (line 185) shows suggestions can auto-transition after a timeout
- This auto-transition is logged, but is it truly human-controlled?
- A skeptical customer might ask: "What else happens automatically?"

**Recommendation**: Enumerate all automatic transitions (expiration, system-initiated events) in a central location.

---

### Concern 4.2: Operator vs. customer authority

**Risk**: The documentation uses both "operator" and "customer" terminology. Who has actual authority? Can an operator override a customer? Can a vendor-side operator commit without customer approval?

**Source**: INTENT_MANIFEST_SCHEMA.md, line 47: "Operators can review exactly what will happen."

**Assessment**: **Partially addressed.** The glossary (if it exists) should clarify these roles. However:

- No documentation explicitly states "vendor cannot commit without customer approval"
- No documentation describes access control for commit operations
- A burned customer might ask: "Who else can push the commit button?"

**Recommendation**: Document who can commit and whether customer sign-off is required (not just recommended).

---

### Concern 4.3: Verification is customer responsibility

**Risk**: The documentation places verification responsibility on the customer. But what if the customer lacks expertise? What if they approve something they don't understand?

**Source**: PREVIEW_SURFACE_CONTRACT.md, section 5.1: "You verify. We provide the tools."

**Assessment**: **Accepted risk.** This is honest—the system cannot know what data "should" look like. However:

- No documentation describes minimum competency for approvers
- No documentation describes what happens if an unqualified person approves
- The system trusts human judgment but humans make mistakes

**Recommendation**: None. This is an inherent limitation. Documenting it honestly is appropriate.

---

## 5. Non-Goals and Exclusions

### Concern 5.1: "Does not support partial commits"

**Risk**: The Intent Manifest explicitly does not support partial commits. What if a customer wants to migrate members but not events? What if only part of the migration succeeds?

**Source**: INTENT_MANIFEST_SCHEMA.md, line 313: "A manifest is committed atomically or not at all. There is no partial state."

**Assessment**: **Design decision, clearly documented.** However:

- Atomic commits are simpler but may force "all or nothing" on customers
- A customer with 5000 members and 2 problematic records faces a dilemma
- No documented workaround (e.g., pre-migration data cleanup)

**Recommendation**: Document how to handle scenarios where a few records block an otherwise successful migration.

---

### Concern 5.2: "Does not enable rollback"

**Risk**: The Intent Manifest explicitly does not enable rollback—reverting requires a new manifest. This means post-commit recovery is manual and potentially error-prone.

**Source**: INTENT_MANIFEST_SCHEMA.md, line 316: "Reverting requires creating a new manifest that expresses the prior intent."

**Assessment**: **Accepted risk, honestly stated.** However:

- No documentation describes how to create a "revert manifest"
- No tools are documented for generating a reverting manifest
- A customer may assume "reversible" means "easy to reverse"

**Recommendation**: Clarify that post-commit reversion is a manual, expert-level process with no automation.

---

### Concern 5.3: "Does not track edit history"

**Risk**: Each manifest is a snapshot with no change deltas. This means you cannot answer "what changed between v3 and v4?" without external tooling.

**Source**: INTENT_MANIFEST_SCHEMA.md, line 319: "The manifest does not contain change deltas or edit annotations."

**Assessment**: **Design decision.** However:

- Audit trails require comparing snapshots externally
- A customer asking "who changed this" may not get an easy answer
- This may conflict with P7 (Observability is a product feature)

**Recommendation**: Document how manifest version comparison is performed for audit purposes.

---

### Concern 5.4: Invariants module is not integrated

**Risk**: The MIGRATION_INVARIANTS.md document describes validation functions, but explicitly states they are not wired into the engine. This means documented safety checks may not actually run.

**Source**: MIGRATION_INVARIANTS.md, line 136: "This module does NOT modify the migration engine in this PR. Integration will happen in a future PR after review."

**Assessment**: **Unresolved.** The invariants exist as code but are not enforced. However:

- A customer reading the invariants documentation might assume they are active
- The "Future Integration Points" section describes intent, not reality
- Until integration happens, the invariants are aspirational

**Recommendation**: Update documentation to clearly state current integration status. Mark invariants as "available but not enforced" until integration is complete.

---

## Summary Table

| Concern | Risk Level | Status |
|---------|------------|--------|
| 1.1 Zero data loss on abort | Medium | Partially mitigated |
| 1.2 WA unchanged during rehearsal | Low | Mitigated by design |
| 1.3 Unlimited rehearsal attempts | Low | Accepted risk |
| 2.1 Same logic path guarantee | Medium | Mitigated with limitations |
| 2.2 Preview staleness | Medium | Partially mitigated |
| 2.3 Uncertainty markers voluntary | Medium | Unresolved |
| 3.1 Abort vs. rollback distinction | Low | Mitigated |
| 3.2 Rollback requires artifacts | Low | Accepted risk |
| 3.3 "Abort is always safe" claim | Low | Mostly mitigated |
| 4.1 Hidden automations | Low | Mitigated by design |
| 4.2 Operator vs. customer authority | Medium | Partially addressed |
| 4.3 Customer verification burden | Low | Accepted risk |
| 5.1 No partial commits | Medium | Design decision |
| 5.2 Manual rollback process | Medium | Accepted risk |
| 5.3 No edit history tracking | Low | Design decision |
| 5.4 Invariants not integrated | High | Unresolved |

---

## Conclusion

The ClubOS trust documentation is more transparent than most vendor documentation. It explicitly states non-goals, accepted limitations, and customer responsibilities. This honesty is valuable.

However, a skeptical customer should note:

1. **"Always" claims deserve scrutiny.** The system is designed for safe abort, but edge cases exist.

2. **Post-commit recovery is limited.** Rollback is not automatic and may not be available for all operations.

3. **Some safety mechanisms are not yet enforced.** The invariants module is documented but not integrated.

4. **Verification burden falls on the customer.** The system provides tools but cannot guarantee correctness.

These are not indictments—they are honest limitations. A non-profit leader should understand them before proceeding.

---

## References

- [Customer Migration Cutover Rehearsal](../IMPORTING/CUSTOMER_MIGRATION_CUTOVER_REHEARSAL.md)
- [Preview Surface Contract](./PREVIEW_SURFACE_CONTRACT.md)
- [Suggestion Review Workflow](./SUGGESTION_REVIEW_WORKFLOW.md)
- [Intent Manifest Schema](./INTENT_MANIFEST_SCHEMA.md)
- [Migration Invariants](./MIGRATION_INVARIANTS.md)

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2025-12-25 | System | Initial adversarial review |
