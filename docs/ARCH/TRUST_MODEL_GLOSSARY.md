# Trust Model Glossary

**Status**: Reference
**Last Updated**: 2025-12-25
**Related Documents**: INTENT_MANIFEST_SCHEMA.md, PREVIEW_SURFACE_CONTRACT.md, SUGGESTION_REVIEW_WORKFLOW.md

---

## Purpose

This glossary defines terms used across ClubOS trust and migration documentation. Consistent terminology reduces ambiguity and supports clear communication between operators, customers, and systems.

---

## Term Definitions

### Abort

The act of stopping an operation before commit. Abort discards uncommitted work and leaves both source and target systems unchanged. Abort is always safe and requires no justification from the customer.

### Commit

The irreversible application of an approved change to the target system. Commit occurs only after explicit human authorization. Once committed, changes cannot be undone through abort; recovery requires rollback.

### Customer

The organization using ClubOS. Customers are the ultimate authority over their data and presentation. The system proposes; customers decide.

### Determinism

The property that identical inputs produce identical outputs. Manifests and previews are deterministic within a snapshot: given the same data and rules, they produce the same result every time.

### Intent Manifest

A versioned, immutable document that captures what an organization wants their presentation to accomplish. The manifest is a proposal awaiting approval, not an action. It can be reviewed, discarded, or regenerated without side effects.

### Known Delta

A documented, expected difference between preview and execution. Known deltas include timestamp drift, generated IDs, and external state changes. They are expected behavior, not bugs.

### Non-Guarantee

An explicit statement of what the system does not promise. Non-guarantees set honest expectations and prevent misunderstanding.

### Operator

A person authorized to perform administrative actions on behalf of a customer. Operators review, approve, and apply changes. They are accountable for the decisions they make.

### Preview

A read-only representation of what the system intends to do before it does it. Preview uses the same logic and data as execution but produces no side effects. Preview is a trust mechanism, not a marketing feature.

### Proposed (State)

A suggestion has been created and awaits review. No action has been taken. The suggestion is not visible to end users.

### Rehearsal Mode

A complete end-to-end preview of a major transition (such as migration cutover). Rehearsal validates assumptions and surfaces edge cases without modifying production. The customer may abort rehearsal at any point.

### Reviewed (State)

An operator has examined a suggestion and formed an opinion. The suggestion may proceed to approval or rejection.

### Accepted (State)

A suggestion has been approved for application. The change becomes actionable but is not yet applied. Application requires a separate explicit action.

### Rejected (State)

A suggestion has been declined. No action is taken. The rejection is preserved for audit with a recorded reason.

### Recognition Test

A verification step where operators confirm that migrated data matches their expectations. Recognition tests are operator-driven, not system-automated.

### Rollback

The process of reverting a committed change using a preserved artifact. Rollback is distinct from abort: abort prevents a change; rollback undoes one. Rollback requires explicit capability and is logged as a separate action.

### Suggested Change

A system-generated recommendation that requires human approval before taking effect. Suggestions surface observations without overstepping human authority. A suggestion is not an action.

### Uncertainty Marker

An explicit indicator that the system cannot make a confident prediction. Markers include `UNCERTAIN`, `REQUIRES_HUMAN`, `EXTERNAL_DEPENDENCY`, and `POLICY_AMBIGUOUS`. Uncertainty markers are honest communication, not failures.

---

## Language Rules

These rules govern how ClubOS documentation describes system behavior.

### Preferred Phrasing

| Instead of | Use |
|------------|-----|
| "silent drop" | "skip with visibility" |
| "automatic" (without qualification) | "system-generated, operator-approved" |
| "system decides" | "operator approves" |
| "seamless" | "explicit" or "reviewable" |
| "magic" | (avoid entirely) |
| "the system handles it" | "operator reviews and approves" |

### Rationale

- **Skip with visibility**: Skipped records should be logged and visible, never silently discarded.

- **Operator-approved**: Automation proposes; humans authorize. If an action occurs without human review, the documentation must state this explicitly and explain why.

- **Explicit over seamless**: "Seamless" implies hidden complexity. ClubOS values transparency. Customers should see what will happen before it happens.

- **No magic**: Magic implies unpredictability. ClubOS behavior should be explainable in plain English.

### When "Automatic" Is Acceptable

Use "automatic" only when:

1. The action requires no human decision (e.g., "timestamps are automatically generated")
2. Human authorization was given at a prior step (e.g., "after operator approval, the change is automatically applied")
3. The behavior is explicitly documented and expected

Never use "automatic" to obscure decision-making or imply the system acts without oversight.

---

## References

- [Intent Manifest Schema](./INTENT_MANIFEST_SCHEMA.md)
- [Preview Surface Contract](./PREVIEW_SURFACE_CONTRACT.md)
- [Suggestion Review Workflow](./SUGGESTION_REVIEW_WORKFLOW.md)
- [Architectural Charter](../ARCHITECTURAL_CHARTER.md)
- [Brand and Voice](../BIZ/BRAND_AND_VOICE.md)

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2025-12-25 | System | Initial glossary |
