# Trust Claims Ledger

```
Purpose: Internal governance artifact
Audience: Murmurant operators, architects, auditors
Status: Living document - update when claims change
```

---

## What This Document Is

This ledger catalogs every explicit or implicit trust claim made to customers. Each claim is mapped to:

- Where it is defined
- Whether it is a guarantee, constraint, or aspiration
- How (or whether) it is enforced
- What could go wrong if misunderstood

This is not marketing material. It is an accountability document.

---

## Claim Types

| Type | Definition |
|------|------------|
| **Guarantee** | A binding promise the system must uphold. Violation is a defect. |
| **Constraint** | A limitation we impose on ourselves. Violation requires architectural review. |
| **Process** | A procedure we follow. Deviation may be acceptable with justification. |
| **Non-goal** | Something we explicitly do not promise. Clarifies boundaries. |

---

## Legend: Enforcement Mechanisms

| Mechanism | Meaning |
|-----------|---------|
| **Code** | Enforced by software logic; cannot be bypassed without code change |
| **Schema** | Enforced by database constraints |
| **Procedural** | Enforced by human process; requires operator discipline |
| **Architectural** | Enforced by design decisions; would require significant rework to violate |
| **Descriptive** | Stated in documentation; no technical enforcement |

---

## Human Authority Claims

| Claim | Type | Source | Enforcement | Risk if Misunderstood | Notes |
|-------|------|--------|-------------|----------------------|-------|
| No consequential action occurs without explicit human authorization | Guarantee | CORE_TRUST_SURFACE, ARCHITECTURAL_CHARTER (P5, N5) | Architectural + Code | Customer may expect automation and be confused by required approvals | Core invariant |
| The system proposes; humans decide | Guarantee | CORE_TRUST_SURFACE, HOW_MURMURANT_IS_BUILT | Architectural | Customer may think "propose" means partial execution | Philosophical anchor |
| Suggestions never auto-apply | Guarantee | SUGGESTION_REVIEW_WORKFLOW | Code | Customer may expect time-based auto-approval | State machine enforced |
| Authority remains with humans at every decision point | Guarantee | SUGGESTION_REVIEW_WORKFLOW | Architectural | May be interpreted as "no automation at all" | Clarify mechanical vs consequential automation |

---

## Preview and Visibility Claims

| Claim | Type | Source | Enforcement | Risk if Misunderstood | Notes |
|-------|------|--------|-------------|----------------------|-------|
| Preview uses the same decision logic as execution | Guarantee | PREVIEW_SURFACE_CONTRACT (2.1) | Code | Customer may expect byte-identical results | Timestamps and IDs may differ |
| Preview does not modify any persistent state | Guarantee | PREVIEW_SURFACE_CONTRACT (2.1) | Code | None significant | Hard enforcement |
| What you see in preview is what will happen | Guarantee | PREVIEW_SURFACE_CONTRACT, HOW_MURMURANT_IS_BUILT | Code | Data may change between preview and execution | Document known deltas |
| Customer sees exactly what will happen before it happens | Guarantee | MIGRATION_CUSTOMER_JOURNEY | Procedural + Code | External changes are not visible | Re-preview recommended after delay |
| Preview is always available before commit | Guarantee | SUGGESTION_REVIEW_WORKFLOW | Code | Does not mean preview is exhaustive | Some edge cases may not be surfaced |

---

## Abortability Claims

| Claim | Type | Source | Enforcement | Risk if Misunderstood | Notes |
|-------|------|--------|-------------|----------------------|-------|
| Until explicit commit, you can walk away | Guarantee | CORE_TRUST_SURFACE | Architectural | Customer may expect post-commit abort | Abort ≠ rollback |
| Abort discards intentions without side effects | Guarantee | CORE_TRUST_SURFACE | Code | May be confused with "undo" | Abort is pre-commit only |
| Abort is always safe | Guarantee | PREVIEW_SURFACE_CONTRACT (6.3) | Code | Customer may delay decisions indefinitely | No timeout enforcement by design |
| Wild Apricot remains unchanged during migration | Guarantee | ORGANIZATIONAL_PRESENTATION_PHILOSOPHY, MIGRATION_CUSTOMER_JOURNEY | Architectural | Customer may expect WA updates to sync | Read-only access only |
| Customer can refuse to proceed after any preview | Guarantee | PREVIEW_SURFACE_CONTRACT (6.2) | Procedural | No technical block on pressure | Operator must not pressure |

---

## Auditability Claims

| Claim | Type | Source | Enforcement | Risk if Misunderstood | Notes |
|-------|------|--------|-------------|----------------------|-------|
| Every decision is logged | Guarantee | CORE_TRUST_SURFACE, ARCHITECTURAL_CHARTER (P1) | Code | "Decision" scope may be unclear | Logs consequential state transitions |
| Who approved what, when, and why is recorded | Guarantee | CORE_TRUST_SURFACE, SUGGESTION_REVIEW_WORKFLOW | Code | "Why" requires human input | Reason field optional except for Reject |
| Every state transition is logged | Guarantee | SUGGESTION_REVIEW_WORKFLOW | Code | Log retention policy not specified | **⚠️ Ambiguous: retention period undefined** |
| Audit log cannot be edited or deleted | Guarantee | HOW_MURMURANT_IS_BUILT | Code + Schema | Database admin access could bypass | Append-only by design |
| The system fails visibly, not silently | Guarantee | CORE_TRUST_SURFACE, SUGGESTION_REVIEW_WORKFLOW | Code | Not all failure modes may be covered | Best effort for unknown failures |

---

## Reversibility Claims

| Claim | Type | Source | Enforcement | Risk if Misunderstood | Notes |
|-------|------|--------|-------------|----------------------|-------|
| Rollback documented for every phase | Guarantee | MIGRATION_CUSTOMER_JOURNEY | Procedural | "Documented" ≠ "automated" | Manual procedures |
| Post-commit rollback requires artifact and capability | Constraint | SUGGESTION_REVIEW_WORKFLOW | Code | Rollback may not always be possible | **⚠️ Ambiguous: not all changes create rollback artifacts** |
| Every important action must be undoable or safely reversible | Constraint | ARCHITECTURAL_CHARTER (P5) | Architectural | "Important" is subjective | Charter principle, not absolute guarantee |
| If a change cannot be undone, you are told before you commit | Guarantee | HOW_MURMURANT_IS_BUILT | Procedural | Depends on accurate classification | **⚠️ Risk: classification could be wrong** |

---

## Migration-Specific Claims

| Claim | Type | Source | Enforcement | Risk if Misunderstood | Notes |
|-------|------|--------|-------------|----------------------|-------|
| Your data will arrive complete and correct | Guarantee | MIGRATION_CUSTOMER_JOURNEY | Procedural + Code | "Complete" subject to source data quality | Verification phase addresses this |
| Data stays in Wild Apricot until explicit cutover | Guarantee | MIGRATION_CUSTOMER_JOURNEY | Architectural | Murmurant copy exists during sync | WA is authoritative until commit |
| Dry run uses identical logic as real sync | Guarantee | MIGRATION_CUSTOMER_JOURNEY, PREVIEW_SURFACE_CONTRACT | Code | Timing and external state may differ | Same code path, not same moment |
| Sync either completes fully or rolls back entirely | Guarantee | MIGRATION_CUSTOMER_JOURNEY | Code (transactional) | Transaction scope may be unclear | Per-batch transactions |
| You control the timing of cutover | Guarantee | MIGRATION_CUSTOMER_JOURNEY | Procedural | No system-imposed deadline | Operator must not impose artificial pressure |
| Murmurant helps your organization arrive intact | Process | ORGANIZATIONAL_PRESENTATION_PHILOSOPHY | Procedural | "Intact" is subjective | Aspirational anchor |

---

## Presentation and Content Claims

| Claim | Type | Source | Enforcement | Risk if Misunderstood | Notes |
|-------|------|--------|-------------|----------------------|-------|
| Nothing publishes without approval | Guarantee | ORGANIZATIONAL_PRESENTATION_PHILOSOPHY | Code | Batch approval may be confusing | Each content piece tracked |
| We extract intent, not clone HTML | Constraint | ORGANIZATIONAL_PRESENTATION_PHILOSOPHY | Architectural | Customer may expect pixel-perfect copy | Explicit non-goal |
| Themes are not replicated pixel-for-pixel | Non-goal | ORGANIZATIONAL_PRESENTATION_PHILOSOPHY | Architectural | Sets correct expectations | Design decision |
| We do not automatically publish anything | Guarantee | ORGANIZATIONAL_PRESENTATION_PHILOSOPHY | Code | Scheduled publishing is human-initiated | Schedule ≠ auto-publish |

---

## Data Ownership Claims

| Claim | Type | Source | Enforcement | Risk if Misunderstood | Notes |
|-------|------|--------|-------------|----------------------|-------|
| Your data belongs to you | Guarantee | HOW_MURMURANT_IS_BUILT | Procedural | Export format not specified | **⚠️ Ambiguous: export capabilities undefined** |
| Murmurant provides ways to export your information | Guarantee | HOW_MURMURANT_IS_BUILT | Procedural | **⚠️ No current export tool** | Future capability |
| We do not lock you in | Guarantee | ORGANIZATIONAL_PRESENTATION_PHILOSOPHY | Procedural | Depends on export availability | Claims ahead of capability |

---

## Explicit Non-Goals

| Claim | Type | Source | Enforcement | Risk if Misunderstood | Notes |
|-------|------|--------|-------------|----------------------|-------|
| Preview does not guarantee byte-identical output | Non-goal | PREVIEW_SURFACE_CONTRACT (3) | Descriptive | Customers should not diff raw output | IDs, timestamps differ |
| Preview does not guarantee external system behavior | Non-goal | PREVIEW_SURFACE_CONTRACT (3) | Descriptive | Third-party APIs are beyond control | Honest limitation |
| Preview does not guarantee infinite validity | Non-goal | PREVIEW_SURFACE_CONTRACT (3) | Descriptive | Re-preview if time passes | Explicit expiration |
| We do not automate consequential decisions | Constraint | HOW_MURMURANT_IS_BUILT, ARCHITECTURAL_CHARTER (N5) | Architectural | "Consequential" requires definition | Core design principle |
| We do not assume what you meant | Constraint | HOW_MURMURANT_IS_BUILT | Procedural | System asks for clarification | Ambiguity surfaced, not resolved |

---

## Potentially Ambiguous Claims

The following claims require additional clarity or may be misinterpreted:

| Claim | Concern | Recommendation |
|-------|---------|----------------|
| "Rollback documented for every phase" | Not all rollbacks are automated; some are manual procedures | Clarify which rollbacks are one-click vs. manual |
| "Your data belongs to you" | Export capability is claimed but not fully implemented | Do not claim until export tools exist |
| "Every decision is logged" | Scope of "decision" unclear; does this include read access? | Define what constitutes a loggable decision |
| "Audit log cannot be edited" | True at application level, but DB admin could theoretically modify | Document threat model and administrative access |
| "Sync rolls back entirely" | Transaction boundaries may not cover entire sync | Clarify batch vs. atomic scope |
| "If a change cannot be undone, you are told" | Relies on correct classification of reversibility | Add reversibility metadata to all operations |

---

## Claims Not Yet Made (Future Consideration)

These are capabilities the system should eventually claim but does not yet:

| Potential Claim | Blocker | Status |
|-----------------|---------|--------|
| "You can export all your data in standard formats" | Export tooling not built | Planned |
| "Rollback is one-click for all operations" | Manual rollback procedures exist | Aspirational |
| "All audit logs are retained indefinitely" | Retention policy not defined | Needs decision |
| "Preview includes performance impact estimates" | Not implemented | Future |

---

## Governance

### When to Update This Ledger

Update this document when:

- A new customer-facing guarantee is documented
- An existing claim is weakened or strengthened
- A claim is found to be ambiguous in practice
- Enforcement mechanism changes
- A claim is discovered that is not in this ledger

### Review Cadence

This ledger should be reviewed:

- Before any major customer-facing documentation release
- When architectural changes affect trust surface
- Quarterly as part of governance review

---

## References

- [Core Trust Surface](../ARCH/CORE_TRUST_SURFACE.md)
- [Preview Surface Contract](../ARCH/PREVIEW_SURFACE_CONTRACT.md)
- [Suggestion Review Workflow](../ARCH/SUGGESTION_REVIEW_WORKFLOW.md)
- [Architectural Charter](../ARCHITECTURAL_CHARTER.md)
- [Organizational Presentation Philosophy](./ORGANIZATIONAL_PRESENTATION_PHILOSOPHY.md)
- [Migration Customer Journey](../IMPORTING/MIGRATION_CUSTOMER_JOURNEY.md)
- [How Murmurant Is Built](./HOW_MURMURANT_IS_BUILT_AND_WHY_YOU_CAN_TRUST_IT.md)

---

*This is an internal governance artifact. It catalogs claims for accountability, not marketing.*
