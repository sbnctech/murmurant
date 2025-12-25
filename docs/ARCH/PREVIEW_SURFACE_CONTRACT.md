# Preview Surface Contract

**Status**: Canonical
**Last Updated**: 2024-12-24
**Related Documents**: ARCHITECTURAL_CHARTER.md (P5), MIGRATION_INVARIANTS.md

---

## 1. Purpose of Preview

A **preview** is a representation of what the system intends to do before it does it.

Preview exists because:

1. **Consequential actions should be reversible or previewable** (Charter P5)
2. **Customers need to understand what will happen before approving it**
3. **Mistakes caught before execution cost nothing to fix**

Preview is not a marketing feature. It is a trust mechanism.

---

## 2. Guarantees

### 2.1 Fidelity Bounds

A preview represents the system's best-effort prediction of outcome. The following are guaranteed:

| Guarantee | Meaning |
|-----------|---------|
| **Same logic path** | Preview uses the same decision logic as execution |
| **Same input data** | Preview operates on the same source data available at preview time |
| **Deterministic within snapshot** | Given identical input, preview produces identical output |
| **No side effects** | Preview does not modify any persistent state |

**Fidelity scope**: Preview is faithful to the data and rules as they exist at the moment of preview generation.

### 2.2 What Preview Shows

| Element | Included |
|---------|----------|
| Record counts | Total records that would be created, updated, skipped |
| Entity mappings | How source records map to target entities |
| Policy application | Which rules would apply and their effects |
| Validation results | Errors and warnings that would occur |
| Decision rationale | Why each action would be taken |

### 2.3 Known Deltas

Preview may differ from execution in specific, documented ways:

| Delta | Cause | Mitigation |
|-------|-------|------------|
| **Timestamp drift** | System timestamps generated at execution differ from preview | Documented in output; timestamps are for audit, not logic |
| **External state change** | Source data changed between preview and execution | Re-preview before execution; deltas are surfaced |
| **Concurrent modification** | Another actor modified target while preview was pending | Execution validates preconditions; fails safely if violated |

These deltas are **expected behavior**, not bugs.

### 2.4 Explicit Uncertainty Markers

When the system cannot make a confident prediction, it must mark uncertainty explicitly:

| Marker | Meaning |
|--------|---------|
| `UNCERTAIN` | Decision depends on runtime conditions that may change |
| `REQUIRES_HUMAN` | System cannot proceed without human judgment |
| `EXTERNAL_DEPENDENCY` | Outcome depends on an external system not under ClubOS control |
| `POLICY_AMBIGUOUS` | Multiple valid interpretations exist; customer must clarify |

Uncertainty markers are not failures. They are honest communication.

---

## 3. Non-Guarantees

The following are explicitly **not guaranteed**:

| Non-Guarantee | Explanation |
|---------------|-------------|
| **Byte-identical output** | Execution may include timestamps, generated IDs, or sequence numbers that differ |
| **External system behavior** | If execution involves third-party APIs, their responses may differ |
| **Concurrent user actions** | Other users may take actions between preview and execution |
| **Infinite validity** | Preview represents a point-in-time snapshot; it expires when inputs change |
| **Complete enumeration of edge cases** | Preview surfaces known edge cases; truly novel situations may occur |

**The customer should re-preview if significant time has passed or if they have reason to believe source data changed.**

---

## 4. Relationship to Other Concepts

### 4.1 Intent Manifest

An **intent manifest** is a structured, machine-readable record of what the system intends to do.

| Property | Intent Manifest | Preview |
|----------|-----------------|---------|
| Format | Structured data (JSON, typed objects) | May include human-readable presentation |
| Purpose | Machine processing, audit, rollback reference | Human understanding and approval |
| Durability | Persisted as part of execution record | May be ephemeral or cached |

**Relationship**: A preview is a rendering of an intent manifest for human consumption. The intent manifest is the source of truth; the preview is derived from it.

### 4.2 Suggestion Workflow

A **suggestion** is a system-generated recommendation that requires human approval before taking effect.

| State | Description |
|-------|-------------|
| `SUGGESTED` | System has proposed an action; awaiting human decision |
| `APPROVED` | Human has approved; execution proceeds |
| `REJECTED` | Human has declined; no action taken |
| `MODIFIED` | Human has adjusted the suggestion; modified version proceeds |

**Relationship**: Preview provides visibility into what a suggestion would do. The suggestion workflow provides the approval gate.

```
[System generates suggestion]
         |
         v
[Preview rendered for human review]
         |
         v
[Human: Approve / Reject / Modify]
         |
         v
[If approved: Execute and record intent manifest]
```

### 4.3 Cutover Rehearsal

A **cutover rehearsal** is a full preview of a major operational transition (e.g., migration from one system to another).

| Rehearsal Property | Value |
|-------------------|-------|
| Scope | Complete end-to-end preview of transition |
| Output | Full intent manifest plus summary report |
| Side effects | None (rehearsal does not modify production) |
| Purpose | Validate assumptions, surface edge cases, build confidence |

**Relationship**: A cutover rehearsal is a specialized, high-stakes preview. It uses the same preview guarantees and non-guarantees, but with additional emphasis on:

- **Completeness checks**: All entities accounted for
- **Rollback planning**: Intent manifest structured for potential reversal
- **Stakeholder sign-off**: Multiple approval gates before real cutover

---

## 5. When Preview Does Not Match Expectation

If a customer reviews a preview and the outcome does not match their expectation, the following process applies:

### 5.1 Categories of Mismatch

| Category | Example | Resolution Path |
|----------|---------|-----------------|
| **Data quality issue** | "These 12 members show as lapsed, but I think they're active" | Investigate source data; correct if needed; re-preview |
| **Policy misunderstanding** | "I expected renewals to work differently" | Clarify policy configuration; adjust if needed; re-preview |
| **System error** | "The preview shows an error for records that should be valid" | Report issue; engineering investigates; defer execution until resolved |
| **Expectation error** | "I thought this would include events, but the scope is members only" | Clarify scope; no action needed if system is correct |

### 5.2 Resolution Protocol

1. **Stop**: Do not proceed to execution
2. **Document**: Record the specific mismatch
3. **Investigate**: Determine root cause (data, policy, system, or expectation)
4. **Correct**: Fix the root cause if possible
5. **Re-preview**: Generate new preview to verify correction
6. **Proceed only when satisfied**: Customer explicitly approves

**The system must never pressure the customer to proceed when they have expressed concern.**

---

## 6. Customer Control and Abort Paths

### 6.1 Control Points

| Control Point | What Customer Can Do |
|---------------|----------------------|
| **Before preview** | Configure scope, select filters, set parameters |
| **During preview generation** | Cancel if taking too long |
| **After preview received** | Approve, reject, request modification, or re-preview |
| **During execution** | Abort if execution supports checkpoints |
| **After execution** | Request rollback if rollback is available |

### 6.2 Explicit Abort Rights

The customer has the unconditional right to:

1. **Refuse to proceed** after viewing any preview
2. **Request clarification** before making a decision
3. **Take time** without artificial urgency imposed by the system
4. **Change their mind** before execution begins
5. **Request rollback** after execution if rollback is supported

### 6.3 What Abort Means

| Context | Abort Effect |
|---------|--------------|
| **Abort during preview** | No record created; no state changed |
| **Abort before execution** | Intent manifest may be retained for audit; no execution occurs |
| **Abort during execution** | Depends on execution model; checkpoint-based execution may partially complete |
| **Rollback after execution** | Separate procedure; see rollback documentation |

**Abort is always safe**. The customer should never fear that aborting will leave the system in a broken state.

---

## 7. Implementation Constraints

This contract is **implementation-agnostic**. The following must hold regardless of how preview is rendered:

| Constraint | Requirement |
|------------|-------------|
| **No UI assumption** | Contract applies to CLI, API, web UI, or future interfaces |
| **No rendering engine assumption** | Contract applies whether preview is text, HTML, JSON, or other format |
| **No persistence assumption** | Contract applies whether preview is ephemeral or stored |
| **Backward compatibility** | Future implementations must honor these guarantees |

**Any implementation that claims to be "a preview" must satisfy this contract.**

---

## 8. Versioning

This contract has a version. If guarantees change, the version changes.

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2024-12-24 | Initial contract |

Implementations must declare which version of this contract they conform to.

---

## 9. References

- [ARCHITECTURAL_CHARTER.md](../ARCHITECTURAL_CHARTER.md) - Principle P5 (undoable/reversible actions)
- [MIGRATION_INVARIANTS.md](./MIGRATION_INVARIANTS.md) - Invariant validation for migration previews
- [IMPORTER_RUNBOOK.md](../IMPORTING/IMPORTER_RUNBOOK.md) - Dry run mode documentation

---

*This document defines what customers can rely on. It is not aspirational—it is a binding contract between the system and its users.*
