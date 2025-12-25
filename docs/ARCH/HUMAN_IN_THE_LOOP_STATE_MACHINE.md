# Human-in-the-Loop State Machine

**Status:** Normative Architecture
**Last Updated:** 2025-12-24
**Related Documents:**
- [Suggestion Review Workflow](./SUGGESTION_REVIEW_WORKFLOW.md)
- [Preview Surface Contract](./PREVIEW_SURFACE_CONTRACT.md)
- [Architectural Charter](./ARCHITECTURAL_CHARTER.md)

---

## Purpose

This document formalizes the human-in-the-loop guarantees as an explicit state machine. It defines the states, transitions, and invariants that ensure humans retain authority over all consequential system actions.

**This is normative architecture.** Any implementation must conform to this state machine. Violations are not acceptable.

---

## Core Invariant

> **No consequential action may occur without explicit human authorization at a defined decision point.**

A "consequential action" is any operation that:

- Modifies persistent data
- Sends communications to external parties
- Changes system configuration
- Cannot be trivially undone

---

## 1. Enumerated States

The human-in-the-loop state machine consists of the following states:

### 1.1 Primary States

| State | Code | Description |
|-------|------|-------------|
| **Idle** | `IDLE` | No pending action. System awaits input. |
| **Proposed** | `PROPOSED` | System has generated a suggestion or intent. Awaiting human review. |
| **Previewing** | `PREVIEWING` | Human is examining a preview of the proposed action. |
| **Reviewed** | `REVIEWED` | Human has examined the proposal and formed an opinion. |
| **Approved** | `APPROVED` | Human has authorized execution. Awaiting commit. |
| **Executing** | `EXECUTING` | System is performing the authorized action. |
| **Committed** | `COMMITTED` | Action completed successfully. |
| **Rejected** | `REJECTED` | Human declined the proposal. No action taken. |
| **Aborted** | `ABORTED` | Action was cancelled before or during execution. |
| **Failed** | `FAILED` | Execution failed. Requires human intervention. |
| **Rolled Back** | `ROLLED_BACK` | Previously committed action was reversed. |

### 1.2 State Categories

States are categorized by whether the system or human holds control:

| Category | States | Control |
|----------|--------|---------|
| **Waiting** | IDLE, PROPOSED, PREVIEWING, REVIEWED, APPROVED | Human controls next step |
| **Active** | EXECUTING | System controls; human may abort if supported |
| **Terminal** | COMMITTED, REJECTED, ABORTED, FAILED, ROLLED_BACK | End state; new cycle required |

---

## 2. Allowed Transitions

### 2.1 Transition Table

| From | To | Trigger | Actor | Required |
|------|----|---------|-------|----------|
| IDLE | PROPOSED | System generates proposal | System | - |
| PROPOSED | PREVIEWING | Human requests preview | Human | capability |
| PROPOSED | REJECTED | Human declines without preview | Human | capability |
| PROPOSED | ABORTED | Human discards proposal | Human | capability |
| PREVIEWING | REVIEWED | Human completes review | Human | - |
| PREVIEWING | ABORTED | Human cancels preview | Human | - |
| REVIEWED | APPROVED | Human authorizes execution | Human | approval capability |
| REVIEWED | REJECTED | Human declines | Human | review capability |
| REVIEWED | PREVIEWING | Human requests re-preview | Human | - |
| APPROVED | EXECUTING | System begins execution | System | approval exists |
| APPROVED | ABORTED | Human revokes approval | Human | prior to execution start |
| EXECUTING | COMMITTED | Execution succeeds | System | - |
| EXECUTING | FAILED | Execution fails | System | - |
| EXECUTING | ABORTED | Human aborts mid-execution | Human | if checkpoints exist |
| COMMITTED | ROLLED_BACK | Human requests rollback | Human | rollback capability + artifact |
| FAILED | IDLE | Human acknowledges failure | Human | - |
| FAILED | PREVIEWING | Human requests diagnostic preview | Human | - |
| REJECTED | IDLE | Cycle complete | System | - |
| ABORTED | IDLE | Cycle complete | System | - |
| ROLLED_BACK | IDLE | Cycle complete | System | - |

### 2.2 Transition Diagram

```
                                    ┌─────────────┐
                                    │    IDLE     │◄──────────────────────────────┐
                                    └──────┬──────┘                               │
                                           │ system generates                     │
                                           ▼                                      │
                                    ┌─────────────┐                               │
                              ┌────►│  PROPOSED   │────────┐                      │
                              │     └──────┬──────┘        │                      │
                              │            │               │ reject/abort         │
                              │            │ preview       │                      │
                              │            ▼               ▼                      │
                              │     ┌─────────────┐  ┌──────────┐                 │
                              │     │ PREVIEWING  │  │ REJECTED │─────────────────┤
                              │     └──────┬──────┘  └──────────┘                 │
                              │            │                                      │
                              │            │ complete review                      │
                              │            ▼                                      │
           re-preview         │     ┌─────────────┐                               │
              ┌───────────────┼────►│  REVIEWED   │◄───────────┐                  │
              │               │     └──────┬──────┘            │                  │
              │               │            │                   │                  │
              │               │   approve  │  reject           │                  │
              │               │            ▼                   │                  │
              │               │     ┌─────────────┐            │                  │
              │               │     │  APPROVED   │────────────┼──► ABORTED ──────┤
              │               │     └──────┬──────┘            │                  │
              │               │            │                   │                  │
              │               │            │ begin             │                  │
              │               │            ▼                   │                  │
              │               │     ┌─────────────┐            │                  │
              │               │     │  EXECUTING  │────────────┼──► ABORTED ──────┤
              │               │     └──────┬──────┘            │                  │
              │               │            │                   │                  │
              │               │   success  │  failure          │                  │
              │               │            ▼                   │                  │
              │               │     ┌─────────────┐     ┌──────────┐              │
              │               │     │  COMMITTED  │     │  FAILED  │──────────────┤
              │               │     └──────┬──────┘     └──────────┘              │
              │               │            │                                      │
              │               │            │ rollback                             │
              │               │            ▼                                      │
              │               │     ┌─────────────┐                               │
              │               │     │ ROLLED_BACK │───────────────────────────────┘
              │               │     └─────────────┘
              │               │
              └───────────────┘
```

---

## 3. Forbidden Transitions

The following transitions are explicitly forbidden. Any implementation that permits these is non-conformant.

### 3.1 Forbidden Direct Transitions

| From | To | Why Forbidden |
|------|----|---------------|
| IDLE | EXECUTING | Bypasses human authorization |
| IDLE | COMMITTED | Bypasses human authorization |
| PROPOSED | EXECUTING | Bypasses review and approval |
| PROPOSED | COMMITTED | Bypasses review and approval |
| PREVIEWING | EXECUTING | Bypasses approval |
| PREVIEWING | COMMITTED | Bypasses approval |
| REVIEWED | EXECUTING | Bypasses explicit approval |
| REVIEWED | COMMITTED | Bypasses explicit approval |
| REJECTED | APPROVED | Rejected decisions are terminal |
| REJECTED | EXECUTING | Rejected decisions are terminal |
| ABORTED | EXECUTING | Aborted sessions are terminal |
| COMMITTED | EXECUTING | Cannot re-execute committed action |
| FAILED | COMMITTED | Failed execution is not success |
| * | APPROVED | Only REVIEWED may transition to APPROVED |

### 3.2 Forbidden Implicit Transitions

| Pattern | Why Forbidden |
|---------|---------------|
| Timeout-based approval | Human silence is not consent |
| Default-to-execute | Inaction must not trigger action |
| Bulk auto-approve | Each proposal requires individual decision |
| Skip preview for "simple" cases | Simplicity does not waive visibility |
| Emergency bypass | No emergency justifies removing human control |

### 3.3 Forbidden State Modifications

| Pattern | Why Forbidden |
|---------|---------------|
| Mutating COMMITTED without rollback | Committed state is immutable |
| Deleting REJECTED records | Rejection is audit evidence |
| Altering transition history | History is append-only |
| Backdating transitions | Timestamps must be accurate |

---

## 4. Abort Semantics

Abort is a first-class operation. The ability to abort is a human right within this system.

### 4.1 Abort Availability by State

| State | Abort Available | Abort Effect |
|-------|-----------------|--------------|
| IDLE | N/A | Nothing to abort |
| PROPOSED | Yes | Proposal discarded |
| PREVIEWING | Yes | Preview cancelled |
| REVIEWED | Yes | Review discarded |
| APPROVED | Yes (until execution starts) | Approval revoked |
| EXECUTING | Conditional (checkpoints required) | Partial execution rolled back |
| COMMITTED | No (use rollback) | Must use rollback procedure |
| REJECTED | N/A | Already terminal |
| ABORTED | N/A | Already terminal |
| FAILED | N/A | Already terminal |
| ROLLED_BACK | N/A | Already terminal |

### 4.2 Abort Guarantees

1. **Pre-execution abort is always safe**: No state is modified
2. **Abort leaves no partial state**: If checkpoint-based abort fails, system remains in EXECUTING until resolved
3. **Abort is logged**: Every abort creates an audit record
4. **Abort reason is captured**: Human may provide reason (optional but encouraged)
5. **Abort is not punished**: System does not penalize frequent aborts

### 4.3 Abort vs. Reject vs. Rollback

| Operation | When Available | Effect |
|-----------|----------------|--------|
| **Abort** | Before or during execution | Cancels without completing |
| **Reject** | During review | Declines proposal; preserves for audit |
| **Rollback** | After commit | Reverses completed action |

---

## 5. Audit and Logging Expectations

Every state transition must be logged. Logs are the source of truth for what happened.

### 5.1 Required Log Fields

| Field | Type | Description |
|-------|------|-------------|
| `transitionId` | UUID | Unique identifier for this transition |
| `sessionId` | UUID | Groups related transitions |
| `fromState` | Enum | State before transition |
| `toState` | Enum | State after transition |
| `trigger` | String | What caused the transition |
| `actor` | String | Identity of human or system |
| `actorType` | Enum | HUMAN or SYSTEM |
| `timestamp` | ISO 8601 | When transition occurred |
| `reason` | String | Human-provided rationale (if applicable) |
| `metadata` | Object | Additional context |

### 5.2 Logging Invariants

1. **Completeness**: Every state transition creates a log entry
2. **Immutability**: Log entries are append-only; never modified or deleted
3. **Ordering**: Log entries within a session are strictly ordered
4. **Attributability**: Every human-triggered transition identifies the actor
5. **Non-repudiation**: Log entries cannot be falsified after creation

### 5.3 Audit Questions the Log Must Answer

| Question | How Log Answers |
|----------|-----------------|
| Who approved this? | Actor field on REVIEWED → APPROVED transition |
| When was it executed? | Timestamp on APPROVED → EXECUTING transition |
| Why was it rejected? | Reason field on REVIEWED → REJECTED transition |
| Was it ever rolled back? | Existence of COMMITTED → ROLLED_BACK transition |
| How long did review take? | Time between PROPOSED and REVIEWED timestamps |
| Did execution fail? | Existence of EXECUTING → FAILED transition |

### 5.4 Log Retention

| Category | Retention Period |
|----------|------------------|
| Successful executions | Indefinite |
| Rejected proposals | Minimum 1 year |
| Aborted sessions | Minimum 1 year |
| Failed executions | Indefinite (for debugging) |
| Rollback events | Indefinite |

---

## 6. Implementation Requirements

Any system claiming conformance to this state machine must satisfy:

### 6.1 State Storage

- Current state must be durably stored
- State must survive system restart
- State must be queryable for reporting

### 6.2 Transition Enforcement

- Invalid transitions must be rejected at the application layer
- Database constraints should enforce where possible
- Tests must verify forbidden transitions are blocked

### 6.3 Human Interface

- Current state must be visible to authorized humans
- Available transitions must be clear
- Abort must be accessible and obvious

### 6.4 System Behavior

- System-initiated transitions must be logged with `actorType: SYSTEM`
- System must not simulate human approval
- System must halt and wait in PROPOSED state; never proceed autonomously

---

## 7. Conformance Testing

A conformant implementation must pass the following tests:

### 7.1 Positive Tests

- [ ] Can transition through complete happy path: IDLE → PROPOSED → PREVIEWING → REVIEWED → APPROVED → EXECUTING → COMMITTED
- [ ] Can reject at REVIEWED state
- [ ] Can abort at each pre-execution state
- [ ] Can rollback from COMMITTED state
- [ ] All transitions are logged

### 7.2 Negative Tests

- [ ] Cannot transition IDLE → EXECUTING
- [ ] Cannot transition PROPOSED → COMMITTED
- [ ] Cannot transition REJECTED → APPROVED
- [ ] Cannot modify COMMITTED state without rollback
- [ ] Cannot delete audit logs

### 7.3 Boundary Tests

- [ ] Abort during EXECUTING respects checkpoint semantics
- [ ] Concurrent abort and commit are handled deterministically
- [ ] Rollback failure leaves COMMITTED state intact

---

## 8. Relationship to Other Specifications

| Document | Relationship |
|----------|--------------|
| [Suggestion Review Workflow](./SUGGESTION_REVIEW_WORKFLOW.md) | Implements this state machine for suggestions |
| [Preview Surface Contract](./PREVIEW_SURFACE_CONTRACT.md) | Defines PREVIEWING state behavior |
| [Architectural Charter](./ARCHITECTURAL_CHARTER.md) | Provides governing principles (P3, P5, N5) |
| Intent Manifest (conceptual) | Records intent during APPROVED → EXECUTING |
| Cutover Rehearsal | Specialized application for migration contexts |

---

## 9. Summary

This state machine guarantees:

1. **No autonomous action**: System proposes; humans decide
2. **Explicit authorization**: Every execution requires APPROVED state
3. **Visible state**: Current state is always knowable
4. **Abort rights**: Humans can stop at any point before commit
5. **Reversibility**: Committed actions support rollback
6. **Auditability**: Every transition is logged
7. **No shortcuts**: Forbidden transitions are enforced

**If a feature cannot conform to this state machine, the feature must be redesigned or rejected.**

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2025-12-24 | System | Initial normative specification |
