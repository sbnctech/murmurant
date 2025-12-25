# Suggestion Review Workflow

**Status:** Specification
**Last Updated:** 2025-12-24
**Related Principles:** P3 (State Machines), P4 (No Hidden Rules), P5 (Reversibility), P7 (Observability)
**Related Anti-Patterns:** N5 (No Silent Automation)

---

## Overview

This document defines how ClubOS proposes, reviews, accepts, or rejects presentation suggestions. Suggestions are a mechanism for surfacing recommendations without overstepping human authority.

**A suggestion is not an action.** It is a proposal awaiting human decision.

---

## Why Suggestions Exist

ClubOS may observe patterns, detect inconsistencies, or identify opportunities for improvement in organizational presentation (content, structure, branding, member-facing language). Rather than silently correcting or auto-applying changes, ClubOS surfaces these observations as suggestions.

### Suggestions vs. Automation

| Automation | Suggestions |
|------------|-------------|
| Acts without asking | Proposes and waits |
| Assumes correctness | Acknowledges uncertainty |
| Difficult to reverse | Never applied until accepted |
| Authority resides in system | Authority remains with humans |

### Core Invariant

> **A suggestion must never mutate production state until explicitly accepted by a human with appropriate authority.**

This invariant aligns with:

- **P5**: Every important action must be undoable or safely reversible
- **N5**: Never let automation mutate data without explicit authorization

---

## Suggestion States

Suggestions follow an explicit state machine. There are no implicit transitions.

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Proposed │────>│ Reviewed │────>│ Accepted │
└──────────┘     └──────────┘     └──────────┘
      │                │
      │                │           ┌──────────┐
      │                └──────────>│ Rejected │
      │                            └──────────┘
      │
      │          ┌──────────┐
      └─────────>│ Revised  │────> (back to Proposed)
                 └──────────┘
```

### State Definitions

| State | Definition | Who Can Transition |
|-------|------------|-------------------|
| **Proposed** | Suggestion created and awaiting review. Not visible to end users. | System (creation only) |
| **Reviewed** | A human has examined the suggestion and formed an opinion. | Authorized reviewer |
| **Accepted** | Suggestion approved for application. Becomes actionable. | Authorized approver |
| **Rejected** | Suggestion declined. No action taken. Preserved for audit. | Authorized reviewer |
| **Revised** | Original suggestion modified before re-proposal. | Authorized editor |

### State Transition Rules

1. **Proposed → Reviewed**: Reviewer marks they have examined the suggestion
2. **Reviewed → Accepted**: Approver confirms the suggestion should be applied
3. **Reviewed → Rejected**: Reviewer declines with reason
4. **Proposed → Revised**: Editor modifies the suggestion content
5. **Revised → Proposed**: Modified suggestion re-enters review queue
6. **Rejected → (terminal)**: Rejected suggestions do not re-enter the queue automatically

A rejected suggestion may be manually resubmitted as a new suggestion if circumstances change.

---

## Who Can Act at Each State

Authority is scoped to the suggestion's domain (content area, committee, or system-wide).

| Action | Required Capability | Scope |
|--------|--------------------:|-------|
| Create suggestion | `suggestion:create` | Domain-scoped |
| View suggestion | `suggestion:view` | Domain-scoped |
| Mark as reviewed | `suggestion:review` | Domain-scoped |
| Accept suggestion | `suggestion:approve` | Domain-scoped |
| Reject suggestion | `suggestion:review` | Domain-scoped |
| Revise suggestion | `suggestion:edit` | Domain-scoped |
| Apply accepted suggestion | `content:edit` + domain | Object-scoped |

### Separation of Concerns

- **Reviewers** evaluate whether a suggestion is appropriate
- **Approvers** authorize application (may be same as reviewer for simple domains)
- **Editors** apply the accepted change to the actual content

This separation ensures no single action both approves and applies a change.

---

## What Is Logged and Why

Every state transition is logged. Logs serve three purposes:

1. **Auditability**: Answer "who decided what, when, and why"
2. **Debuggability**: Trace unexpected outcomes back to their source
3. **Accountability**: Ensure decisions are attributable to real identities

### Log Entry Structure

Each log entry includes:

| Field | Description |
|-------|-------------|
| `suggestionId` | Unique identifier for the suggestion |
| `previousState` | State before transition |
| `newState` | State after transition |
| `actor` | Identity of the person who acted |
| `timestamp` | When the action occurred |
| `reason` | Human-provided rationale (required for Reject, optional otherwise) |
| `metadata` | Additional context (diff summary, affected scope) |

### Logged Events

- Suggestion created
- Suggestion viewed (first view by reviewer)
- Suggestion reviewed (opinion formed)
- Suggestion accepted
- Suggestion rejected (with reason)
- Suggestion revised (with diff)
- Accepted suggestion applied
- Accepted suggestion application failed

---

## What Is Previewable vs. Committed

Suggestions support preview at every stage. Nothing is committed until explicitly applied.

### Preview Capabilities

| Stage | Preview Available | Commit Possible |
|-------|-------------------|-----------------|
| Proposed | Yes (side-by-side diff) | No |
| Reviewed | Yes | No |
| Accepted | Yes (final confirmation) | Yes (requires explicit action) |
| Rejected | Yes (historical view) | No |
| Revised | Yes (comparison to original) | No |

### Preview Guarantees

1. **Read-only**: Preview does not modify any data
2. **Accurate**: Preview shows exactly what will change if applied
3. **Scoped**: Preview identifies all affected areas
4. **Reversible indication**: Preview indicates whether the change is reversible

### Commit Requirements

Committing an accepted suggestion requires:

1. Suggestion is in `Accepted` state
2. Actor has `content:edit` capability for the affected scope
3. Actor explicitly confirms the apply action
4. System records the application in audit log
5. System creates rollback artifact (if applicable)

---

## Abort Semantics

At any point before commit, a suggestion can be abandoned without side effects.

### Abort Mechanisms

| Action | Effect | Logged |
|--------|--------|--------|
| **Reject** | Suggestion moves to Rejected state. Preserved for audit. | Yes |
| **Discard** | Suggestion deleted entirely (if never reviewed). | Yes (deletion event) |
| **Expire** | Suggestion auto-transitions to Expired after configurable period. | Yes (system-initiated) |

### Post-Commit Abort

If a suggestion has been applied (committed), abort requires:

1. Rollback artifact exists
2. Actor has `content:rollback` capability
3. Rollback is logged as a distinct action
4. Original suggestion retains "Applied then Rolled Back" status

This aligns with **P5**: reversibility must be supported, not assumed.

---

## Failure Modes and Visibility Guarantees

ClubOS must fail visibly. Silent failures are not acceptable.

### Failure Modes

| Failure | Visibility | Resolution |
|---------|------------|------------|
| Suggestion creation fails | Error shown to creator | Retry or report |
| Review transition fails | Error shown to reviewer | Retry or escalate |
| Approval fails | Error shown to approver | Retry or escalate |
| Application fails | Error shown to applicant + logged | Investigate, retry, or reject |
| Rollback fails | Error shown to actor + alert to admin | Manual intervention required |

### Visibility Guarantees

1. **No silent state changes**: Every transition is logged and visible in the suggestion history
2. **No orphaned suggestions**: Suggestions cannot exist in undefined states
3. **No phantom applications**: Applied changes are always traceable to an accepted suggestion
4. **No hidden rejections**: Rejected suggestions and their reasons are visible to authorized reviewers
5. **No mystery failures**: Failed operations include structured error information

### Error Structure

Failed operations return:

```
{
  "error": true,
  "code": "SUGGESTION_APPLICATION_FAILED",
  "message": "Unable to apply suggestion: target content was modified since review",
  "suggestionId": "sug_abc123",
  "failedAt": "2025-12-24T12:00:00Z",
  "resolution": "Review the current content and re-evaluate the suggestion"
}
```

---

## Relation to Intent Manifest

> **Note**: The Intent Manifest is a conceptual component for tracking intended changes during cutover rehearsal. This section describes alignment, not dependency.

Suggestions operate similarly to Intent Manifest entries:

| Concept | Suggestions | Intent Manifest |
|---------|-------------|-----------------|
| Purpose | Surface recommendations | Record intended changes |
| Mutability | Proposals can be revised | Intents are append-only |
| Authority | Human accepts/rejects | Human commits/aborts session |
| Application | Individual suggestion applied | Entire manifest replayed |

Both share the principle: **nothing happens without explicit human authorization**.

---

## Summary of Invariants

1. Suggestions never auto-apply
2. Every state transition is logged
3. Preview is always available before commit
4. Abort is always possible before commit
5. Post-commit rollback requires explicit artifact and capability
6. Failures are visible and structured
7. Authority remains with humans at every decision point

---

## References

- [Architectural Charter](./ARCHITECTURAL_CHARTER.md) — Governing principles
- [Migration Invariants](./MIGRATION_INVARIANTS.md) — Validation patterns
- [Importer Runbook](../IMPORTING/IMPORTER_RUNBOOK.md) — Migration procedures

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2025-12-24 | System | Initial specification |
