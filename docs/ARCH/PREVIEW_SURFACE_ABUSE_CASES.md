# Preview Surface Abuse Cases

**Status**: Adversarial Review
**Last Updated**: 2024-12-25
**Related Documents**: PREVIEW_SURFACE_CONTRACT.md, INTENT_MANIFEST_SCHEMA.md, SUGGESTION_REVIEW_WORKFLOW.md

---

## Purpose

This document identifies ways the Preview Surface Contract might be:

1. **Misunderstood** by customers or operators
2. **Misimplemented** by developers
3. **Exploited** by bad actors
4. **Weaponized** against the organization

Adversarial review strengthens the contract by surfacing gaps before they become incidents.

---

## Non-Goals

The Preview Surface is explicitly **NOT** the following:

### Preview Is Not a CMS Publishing Workflow

Content management systems often have "preview" modes that show how content will look before publishing. ClubOS preview is fundamentally different:

| CMS Preview | ClubOS Preview |
|-------------|----------------|
| Shows rendering of authored content | Shows intended actions for a migration or operation |
| Author controls content | System proposes based on source data |
| Preview → Publish is a single decision | Preview → Approval → Execution is multi-step |
| Publishing is immediate and reversible | Execution may involve irreversible changes |
| Author can edit preview directly | Preview is read-only; changes require new source data |

**Why this matters**: Customers familiar with CMS workflows may expect to "edit" a preview or assume "publish" is low-stakes. ClubOS preview requires understanding that what follows is potentially irreversible transformation, not content styling.

### Preview Is Not a Test Environment

Preview is not a sandbox where customers can "try things out" to see what happens:

- Preview does not execute operations
- Preview does not create test records
- Preview does not allow "undo" of test actions (because there are no actions)
- Preview is observation, not experimentation

### Preview Is Not Approval

Viewing a preview does not constitute approval. Approval requires:

1. Explicit customer acknowledgment
2. Recorded consent (audit log)
3. Distinct action (button click, API call, signed confirmation)

A customer viewing a preview has made no commitment. The system MUST NOT proceed on the basis of "they saw it."

### Preview Is Not a Contract Amendment

Preview shows system behavior at preview time. It does not:

- Create binding obligations
- Modify service terms
- Guarantee specific outcomes
- Override documented non-guarantees

If preview output and contract terms conflict, contract terms govern.

---

## 1. Non-Guarantees That Will Be Misread

The Preview Surface Contract explicitly lists non-guarantees. Experience shows these will be misread anyway.

### 1.1 "Byte-Identical Output"

**What the contract says**: Execution may include timestamps, generated IDs, or sequence numbers that differ from preview.

**How it will be misread**:

| Misreading | Consequence |
|------------|-------------|
| "The preview is exactly what I'll get" | Customer disputes execution output that differs cosmetically |
| "If counts match, everything matches" | Customer ignores ID differences that break external integrations |
| "Preview is a contract" | Legal exposure if customer claims execution violated preview |

**Protective language required**: Previews are approximations. Execution is authoritative.

### 1.2 "External System Behavior"

**What the contract says**: If execution involves third-party APIs, their responses may differ.

**How it will be misread**:

| Misreading | Consequence |
|------------|-------------|
| "Preview tested the external system" | Customer assumes third-party will behave identically |
| "If preview succeeded, execution will succeed" | External service goes down between preview and execution |
| "ClubOS controls the entire pipeline" | Blame misdirected when external failure occurs |

**Protective language required**: External systems are outside our control. Re-preview before consequential operations.

### 1.3 "Infinite Validity"

**What the contract says**: Preview represents a point-in-time snapshot; it expires when inputs change.

**How it will be misread**:

| Misreading | Consequence |
|------------|-------------|
| "Preview from last week is still valid" | Customer executes against stale preview; unexpected results |
| "I approved this already" | Customer refuses to re-review after source changes |
| "Nothing changed on my end" | Customer unaware that source system changed |

**Protective language required**: Previews expire. Re-preview before execution if time has passed.

---

## 2. Common Misinterpretations

### 2.1 Preview as Commitment

**Misinterpretation**: "If the preview shows 847 members, I am guaranteed exactly 847 members after execution."

**Reality**: Preview shows intent at preview time. Between preview and execution:

- Source records may be added, modified, or deleted
- Validation rules may flag new errors
- External dependencies may change state

**Clarification needed**: Preview is a snapshot of intent, not a binding commitment to outcome.

### 2.2 Preview as Validation

**Misinterpretation**: "If preview succeeds, the data is clean."

**Reality**: Preview validates against known rules. It cannot:

- Detect semantic errors (wrong data that is syntactically valid)
- Validate business logic the customer hasn't configured
- Anticipate novel edge cases

**Clarification needed**: Preview catches known problems. Unknown problems may still exist.

### 2.3 Preview as Rehearsal

**Misinterpretation**: "Preview is a full rehearsal of production execution."

**Reality**: Preview simulates decision logic but does not:

- Exercise actual write paths
- Stress database constraints under load
- Test concurrent access scenarios
- Validate external service round-trips

**Clarification needed**: Preview tests logic. Rehearsal (a separate concept) tests execution.

### 2.4 Preview as Backup

**Misinterpretation**: "I can use the preview to restore if something goes wrong."

**Reality**: Preview is read-only and ephemeral. It does not:

- Capture source data (only references it)
- Persist execution state
- Enable rollback

**Clarification needed**: Preview is for review, not recovery. Rollback requires separate mechanisms.

### 2.5 "No Side Effects" as "No Risk"

**Misinterpretation**: "Since preview has no side effects, I can preview as much as I want without concern."

**Reality**: Preview has no *data* side effects, but may have:

- Performance impact (CPU, memory, I/O during preview generation)
- Rate limiting triggers (if preview calls external APIs)
- Audit log entries (preview requests may be logged)
- Cost implications (if preview uses metered services)

**Clarification needed**: No side effects means no state change, not no resource consumption.

---

## 3. Unsafe Assumptions

### 3.1 Assumptions Customers Will Make

| Unsafe Assumption | Why It's Dangerous |
|-------------------|-------------------|
| "Preview is official output" | Customer uses preview screenshots in legal/compliance contexts |
| "Preview counts are exact" | Customer makes financial decisions based on preview numbers |
| "If it's in preview, it will happen" | Customer pre-announces changes based on preview |
| "If it's not in preview, it won't happen" | Customer assumes complete enumeration of effects |
| "Preview errors are bugs" | Customer files bug reports for legitimate uncertainty markers |
| "Preview success means approval" | Customer believes viewing preview constitutes sign-off |

### 3.2 Assumptions Developers Will Make

| Unsafe Assumption | Why It's Dangerous |
|-------------------|-------------------|
| "Preview code is non-critical" | Developer writes preview logic carelessly; bugs cause confusion |
| "Preview doesn't need tests" | Preview bugs undermine trust without breaking execution |
| "Preview can diverge from execution" | Logic drift causes preview/execution mismatches |
| "Preview is just a display layer" | Developer exposes internal state inappropriately |
| "Preview errors don't need handling" | Preview failures leave customer confused |
| "Performance doesn't matter for preview" | Slow previews frustrate customers; they skip review |

### 3.3 Assumptions Operators Will Make

| Unsafe Assumption | Why It's Dangerous |
|-------------------|-------------------|
| "Customer saw the preview, so they approved" | Operator proceeds without explicit consent |
| "Preview looked fine to me" | Operator substitutes their judgment for customer's |
| "Preview was generated recently" | Operator uses stale preview for execution |
| "I know what the customer wants" | Operator modifies scope without customer awareness |

---

## 4. Contractual Protections

The following protections exist in the contract. They must be understood and enforced.

### 4.1 Explicit Uncertainty Markers

**Protection**: The contract requires uncertainty markers (`UNCERTAIN`, `REQUIRES_HUMAN`, `EXTERNAL_DEPENDENCY`, `POLICY_AMBIGUOUS`).

**Enforcement**:

- Implementations MUST surface these markers visibly
- Markers MUST NOT be suppressible by configuration
- Customers MUST acknowledge markers before proceeding

**Failure mode if not enforced**: Customers claim they weren't warned about uncertainty.

### 4.2 Resolution Protocol

**Protection**: The contract specifies a resolution protocol (Stop → Document → Investigate → Correct → Re-preview → Proceed).

**Enforcement**:

- Protocol MUST be documented in customer-facing materials
- Operators MUST follow protocol when customers express concern
- System MUST NOT pressure customers to proceed

**Failure mode if not enforced**: Customer proceeds under pressure; outcome is disputed.

### 4.3 Explicit Abort Rights

**Protection**: Customer has unconditional right to refuse, request clarification, take time, change mind.

**Enforcement**:

- Abort MUST be available at every stage
- Abort MUST NOT require justification
- Abort MUST NOT have negative consequences for customer
- System MUST NOT create artificial urgency

**Failure mode if not enforced**: Customer feels trapped; trust is destroyed.

### 4.4 Implementation-Agnostic Guarantees

**Protection**: Contract applies regardless of interface (CLI, API, web UI).

**Enforcement**:

- All implementations MUST honor the same guarantees
- New implementations MUST declare contract version conformance
- Implementations MUST NOT add guarantees beyond the contract

**Failure mode if not enforced**: Interface-specific behaviors create confusion.

---

## 5. Explicit Rejection Cases

The following are cases where the system MUST reject an action or surface a blocking error.

### 5.1 Stale Preview Execution

**Scenario**: Customer attempts to execute based on a preview older than a configured threshold (e.g., 24 hours).

**Required behavior**: System MUST block execution. Customer MUST re-preview.

**Rationale**: Stale previews do not reflect current state. Execution would be uninformed.

### 5.2 Unacknowledged Uncertainty Markers

**Scenario**: Preview contains `REQUIRES_HUMAN` markers. Customer attempts to proceed without addressing them.

**Required behavior**: System MUST block execution. Customer MUST resolve or explicitly accept each marker.

**Rationale**: Markers exist because human judgment is required. Bypassing markers defeats their purpose.

### 5.3 Concurrent Modification Detected

**Scenario**: Between preview and execution, the system detects that source data changed.

**Required behavior**: System MUST block execution. Customer MUST re-preview.

**Rationale**: Execution would operate on different data than customer reviewed.

### 5.4 Execution Without Preview

**Scenario**: Customer attempts to execute a consequential operation without having generated a preview.

**Required behavior**: System MUST block execution. Customer MUST preview first.

**Rationale**: The contract requires previewability for consequential actions (Charter P5).

### 5.5 Preview-Execution Logic Mismatch

**Scenario**: Due to a bug or misconfiguration, preview logic differs from execution logic.

**Required behavior**: System MUST halt. Engineering MUST investigate. No executions until resolved.

**Rationale**: Preview/execution fidelity is a core guarantee. Mismatch is a critical bug.

### 5.6 External Dependency Unavailable

**Scenario**: Preview requires an external system. That system is unavailable.

**Required behavior**: System MUST mark affected items with `EXTERNAL_DEPENDENCY` and surface a warning. Preview MAY complete with partial information. Execution MUST NOT proceed if dependency is still unavailable.

**Rationale**: Customer cannot make informed decision without external data.

---

## 6. Attack Vectors

### 6.1 Preview Flooding

**Attack**: Malicious actor generates many previews rapidly to consume resources.

**Mitigation**:

- Rate limiting on preview requests
- Quotas per organization/user
- Background processing for expensive previews

### 6.2 Preview Data Exfiltration

**Attack**: Malicious actor uses preview to extract data they shouldn't access.

**Mitigation**:

- Preview respects authorization (same as execution)
- Preview does not expose data beyond what execution would reveal
- Audit logging for preview requests

### 6.3 Preview as Reconnaissance

**Attack**: Malicious actor uses preview to understand system behavior before attacking execution.

**Mitigation**:

- Preview does not reveal implementation details
- Error messages do not expose internal state
- Rate limiting prevents enumeration

### 6.4 Stale Preview Replay

**Attack**: Attacker captures a valid preview and replays it later to bypass review.

**Mitigation**:

- Previews are timestamped and expire
- Execution validates preview freshness
- Previews are not transferable between sessions

### 6.5 Preview Manipulation

**Attack**: Attacker modifies preview display to deceive reviewer.

**Mitigation**:

- Preview is rendered server-side, not client-side manipulable
- Preview includes integrity markers (hashes, signatures)
- Audit trail captures what was actually previewed

---

## 7. Organizational Weaponization

### 7.1 "I Previewed, Therefore I'm Covered"

**Scenario**: Operator uses preview as liability shield: "The customer saw the preview, so any problems are their fault."

**Counter**: Preview is for informed decision-making, not blame assignment. Operator remains responsible for:

- Ensuring customer understood the preview
- Answering customer questions
- Not pressuring customer to proceed

### 7.2 "Preview Said X, Therefore Y"

**Scenario**: Operator or customer uses preview as evidence in dispute: "The preview said 847 members, but only 845 migrated. Breach of contract."

**Counter**: The contract explicitly disclaims byte-identical output. Preview is approximation, not commitment. Disputes should focus on:

- Whether process was followed
- Whether concerns were addressed
- Whether abort rights were honored

### 7.3 "We Provided Preview, Therefore We Met Our Obligations"

**Scenario**: Organization uses preview feature as checkbox compliance: "We offered preview, therefore we met transparency requirements."

**Counter**: Preview is necessary but not sufficient. Obligations include:

- Preview is actually usable (not buried, not confusing)
- Customer has time to review
- Customer can ask questions
- Customer can abort without penalty

---

## 8. Operator Responsibility Statements

These are affirmative statements of what operators MUST do. They complement the system guarantees by defining human obligations.

### 8.1 Before Generating Preview

The operator MUST:

1. **Verify scope is correct** — Confirm the preview will cover what the customer expects (not more, not less)
2. **Confirm source data currency** — Verify source data is current; if stale, warn the customer
3. **Disclose known limitations** — If known issues affect this operation, disclose them before preview

### 8.2 During Preview Review

The operator MUST:

1. **Allow sufficient time** — Do not rush the customer; there is no valid reason for artificial urgency
2. **Explain uncertainty markers** — If preview contains `UNCERTAIN`, `REQUIRES_HUMAN`, or other markers, explain what they mean
3. **Answer questions completely** — If the customer asks a question, answer it; do not deflect or defer
4. **Document concerns** — If the customer expresses concern, document it; do not dismiss or minimize

### 8.3 Before Approving Execution

The operator MUST:

1. **Confirm explicit consent** — The customer must explicitly approve; "they didn't object" is not consent
2. **Verify preview freshness** — Confirm the preview is recent; if significant time has passed, re-preview
3. **Confirm customer understands non-guarantees** — The customer must understand that preview is approximation, not commitment

### 8.4 After Execution

The operator MUST:

1. **Compare results to preview** — Review execution results against preview; note any discrepancies
2. **Disclose discrepancies immediately** — If execution differed from preview, inform the customer
3. **Document outcomes** — Record what happened for audit trail and future reference

### 8.5 Prohibited Operator Behaviors

The following behaviors are expressly prohibited:

| Prohibited Behavior | Why It's Prohibited |
|---------------------|---------------------|
| Executing without customer's explicit approval | Violates consent requirement |
| Using preview to pressure customer | Violates abort rights |
| Proceeding despite customer concerns | Violates resolution protocol |
| Substituting operator judgment for customer's | Operator is facilitator, not decision-maker |
| Treating preview as customer commitment | Preview is information, not contract |
| Creating artificial urgency | Undermines informed decision-making |
| Suppressing uncertainty markers | Hides information customer needs |

---

## 9. Revision History

| Date | Author | Change |
|------|--------|--------|
| 2024-12-25 | System | Initial adversarial review |
| 2024-12-25 | System | Added Non-Goals section, Operator Responsibility Statements |

---

## References

- [PREVIEW_SURFACE_CONTRACT.md](./PREVIEW_SURFACE_CONTRACT.md) — The contract being reviewed
- [INTENT_MANIFEST_SCHEMA.md](./INTENT_MANIFEST_SCHEMA.md) — Manifest schema (preview source of truth)
- [SUGGESTION_REVIEW_WORKFLOW.md](./SUGGESTION_REVIEW_WORKFLOW.md) — Suggestion state machine
- [ARCHITECTURAL_CHARTER.md](../ARCHITECTURAL_CHARTER.md) — Charter P5 (reversible/previewable actions)

---

*This document identifies failure modes. Identifying a failure mode is not an accusation—it is a defense.*
