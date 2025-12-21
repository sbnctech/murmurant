# ClubOS vs Wild Apricot: Prospect Positioning

Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

Status: Sales and Board Reference
Audience: Prospects, Board, Solutions Team
Last updated: 2025-12-21

---

## Impossible by Construction

This section proves that entire classes of Wild Apricot failures are
**architecturally impossible** in ClubOS. These are not promises or
policies. They are structural properties of the system design.

---

## Case Study: The Event Deletion Cascade (December 2024)

### What Happened

An SBNC event was canceled. Refunds were processed manually through
proper financial procedures. Later, a volunteer deleted the event
record from Wild Apricot to "clean up" the calendar.

Wild Apricot automatically:
1. Voided all invoices associated with that event
2. Created duplicate credits on member accounts
3. Required hours of manual cleanup by the finance team

### Why Wild Apricot Allowed This

| WA Design Choice | Consequence |
|------------------|-------------|
| Event managers can delete events | No capability separation between manage and destroy |
| Delete and Cancel are the same operation | No semantic distinction in the data model |
| Invoice voiding is automatic on event deletion | Hidden cascade with no warning |
| No confirmation of financial impact | User was not informed of side effects |
| Audit trail incomplete | Could not immediately identify who performed the action |

### Why ClubOS Cannot Reproduce This Failure

| ClubOS Mechanism | What It Prevents |
|------------------|------------------|
| Separate `event:cancel` and `event:delete` capabilities | Different permissions for status change vs removal |
| Delete blocked when financial records exist | System refuses deletion, suggests cancel instead |
| Cancel is a status transition, not removal | Event record preserved with CANCELLED status |
| Financial records are append-only | Invoices cannot be voided by event state change |
| Confirmation required for destructive actions | User sees exactly what will happen before proceeding |
| Actor attribution in audit log | Every action tied to specific authenticated user |

**This failure class is impossible because:**

1. The delete operation checks for financial records and refuses to proceed
2. Even if delete were allowed, invoices are immutable records
3. The capability to delete requires explicit grant, not bundled with event management
4. The cascade that WA performs does not exist in ClubOS's data model

---

## Generalized Failure Classes

### Failure Class 1: Delete vs Cancel Confusion

**What WA Allows:**

- Single operation conflates "remove from view" with "erase from existence"
- Users intend to cancel but system performs deletion
- No recovery path once deletion is complete
- Related records mutate or disappear silently

**What ClubOS Structurally Forbids:**

| Mechanism | How It Prevents the Failure |
|-----------|----------------------------|
| Explicit state machine | Events have states: DRAFT, PUBLISHED, CANCELLED, COMPLETED |
| Cancel is a transition | Changes state to CANCELLED; preserves all data |
| Delete is a separate operation | Requires different capability; blocked by business rules |
| Soft delete only | Records marked deleted, not removed; recoverable for 30 days |
| Hard delete requires platform access | Not available to any tenant admin role |

**State Machine Enforcement:**

```
                    DRAFT
                      |
                      v
    +----------> PUBLISHED <----------+
    |                |                |
    |                v                |
    |           CANCELLED             |
    |                                 |
    |                                 |
    +---------> COMPLETED <-----------+

Delete is not a state. Delete is removal.
Cancel is a state. Cancel preserves the record.
```

**Structural Guarantee:**

Calling `cancelEvent(id)` changes the event status.
Calling `deleteEvent(id)` is rejected if:
- Financial records exist (registrations, payments, invoices)
- Event was ever published
- Any registrations exist (even cancelled ones)

Delete is only possible for:
- Draft events with no registrations
- Test data cleanup by platform administrators

---

### Failure Class 2: Hidden Financial Side Effects

**What WA Allows:**

- Event deletion voids associated invoices
- Invoice voiding creates member credits automatically
- Registration cancellation may or may not affect payment status
- Financial state changes occur as side effects of non-financial actions

**What ClubOS Structurally Forbids:**

| Mechanism | How It Prevents the Failure |
|-----------|----------------------------|
| Financial records are append-only | No mutation of existing invoice/payment records |
| Separate financial operations | Refund is explicit action, not cascade from event state |
| Event state does not cascade to invoices | Cancelling event does not void invoices |
| Explicit refund workflow | Refunds require separate permission and create new records |

**Append-Only Financial Model:**

```
Invoice created:     [Invoice #1: $50, status: ISSUED]
Payment received:    [Payment #1: $50, invoice: #1, status: COMPLETED]
Event cancelled:     [Event status: CANCELLED]
                     Invoice #1: unchanged (still ISSUED -> PAID)
                     Payment #1: unchanged (still COMPLETED)

If refund needed:
Refund processed:    [Refund #1: $50, payment: #1, reason: "Event cancelled"]
                     Invoice #1: still exists (historical record)
                     Payment #1: still exists (historical record)
                     Refund #1: new record documenting the refund
```

**Structural Guarantee:**

There is no code path where:
- Event state change modifies Invoice records
- Event state change modifies Payment records
- Event deletion removes financial history

Financial changes require explicit financial operations with:
- Separate capability (`finance:refund`)
- Separate confirmation
- Separate audit entry
- New records, not mutations

---

### Failure Class 3: Silent Cascades

**What WA Allows:**

- Parent record deletion cascades to child records
- Cascade effects are not enumerated before execution
- User discovers cascade effects after the fact
- Recovery requires manual reconstruction

**What ClubOS Structurally Forbids:**

| Mechanism | How It Prevents the Failure |
|-----------|----------------------------|
| Deletion impact preview | System shows what will be affected before confirmation |
| Cascade blocking rules | Records with children cannot be deleted without child resolution |
| Soft delete first | Marked deleted but recoverable; hard cascade only after retention |
| Audit of cascade intent | Log records the scope of the deletion request |

**Cascade Prevention Rules:**

| Parent Record | Deletion Blocked If |
|---------------|---------------------|
| Event | Has any registrations (even cancelled) |
| Event | Has any payments or invoices |
| Event | Was ever in PUBLISHED status |
| Member | Has any registration history |
| Member | Has any payment history |
| Committee | Has any members assigned |
| Page | Has any published versions |

**Soft Delete Cascade:**

If deletion is allowed (e.g., draft event with no registrations):

1. Parent record marked `deleted_at = now()`
2. Child records marked `deleted_at = now()`
3. All records excluded from normal queries
4. All records recoverable for 30 days
5. Hard delete (physical removal) only by platform process after retention

**Structural Guarantee:**

There is no code path where:
- A single user action permanently removes multiple records
- Cascade effects are not previewed before confirmation
- Deleted records are unrecoverable within the retention window

---

## Mechanism-to-Guarantee Mapping

### Soft Delete

| Mechanism Property | Guarantee Provided |
|--------------------|-------------------|
| `deleted_at` timestamp on all mutable records | Deletion is marking, not removal |
| Query filters exclude deleted records | Deleted records invisible in normal operation |
| 30-day retention before hard delete | Recovery window for mistakes |
| Hard delete requires platform-level access | Tenant admins cannot permanently destroy data |
| Audit entry for soft delete | Who deleted what and when is recorded |

**This mechanism prevents:**
- Accidental permanent data loss
- Unrecoverable deletion mistakes
- "Oops, it's gone" scenarios

### Explicit State Machines

| Mechanism Property | Guarantee Provided |
|--------------------|-------------------|
| Enum types for all workflow states | States are finite and explicit |
| Transition functions validate source/target | Invalid transitions rejected at code level |
| State changes are logged | Audit shows state transitions with actor |
| State determines allowed operations | Operations blocked when state is inappropriate |

**This mechanism prevents:**
- Ad-hoc boolean flag accumulation
- Undefined or ambiguous record states
- Operations on records in inappropriate states
- Silent state changes

### Audit with Confirmation and Preview

| Mechanism Property | Guarantee Provided |
|--------------------|-------------------|
| Destructive action preview | User sees what will happen before confirming |
| Typed confirmation for high-risk actions | Cannot accidentally click through |
| Before/after in audit records | What changed is recorded, not just that something changed |
| Actor attribution | Who performed the action is known |
| Timestamp and client context | When and from where is recorded |

**This mechanism prevents:**
- Accidental destructive actions
- Unknown scope of changes
- "Who did this?" ambiguity
- Unattributable changes

---

## Proof Summary

### WA Failure: Event Deletion Cascade

| WA Behavior | ClubOS Impossibility |
|-------------|---------------------|
| Delete available to event managers | Delete capability not included in event management roles |
| Delete and cancel conflated | State machine distinguishes cancel (state change) from delete (removal) |
| Invoice voiding automatic | Financial records immutable; no cascade from event state |
| No preview of cascade | Deletion shows preview of affected records |
| No confirmation of financial impact | Destructive actions require typed confirmation |
| Incomplete audit trail | Audit includes actor, timestamp, before/after state |

### Generalized Impossibilities

| Failure Class | Preventing Mechanism | Why It Works |
|---------------|---------------------|--------------|
| Delete/Cancel confusion | Explicit state machine | Cancel is transition; delete is removal |
| Hidden financial side effects | Append-only financial records | Event state cannot mutate financial records |
| Silent cascades | Cascade preview + blocking rules | User sees impact; system blocks dangerous cascades |
| Unrecoverable deletion | Soft delete with retention | 30-day recovery window; hard delete requires platform access |
| Unattributed changes | Required actor in audit | Every privileged action tied to authenticated user |

---

## What "Impossible by Construction" Means

These guarantees are not:
- Policies that could be changed
- Configurations that could be disabled
- Features that could be turned off
- Promises that require trust

These guarantees are:
- Enforced by data model structure (append-only records)
- Enforced by type system (state enums)
- Enforced by authorization layer (capability requirements)
- Enforced by database constraints (foreign keys, NOT NULL)
- Enforced by code structure (no code path exists to violate)

To violate these guarantees would require:
- Changing the database schema
- Removing authorization checks
- Rewriting core business logic
- Deploying a fundamentally different system

This is what "impossible by construction" means.

---

## See Also

- [WA Failure Modes to ClubOS Guarantees](./WA_FAILURE_MODES_TO_CLUBOS_GUARANTEES.md) - Full comparison
- [Wild Apricot Issues Impact for SBNC](../sbnc/WILD_APRICOT_ISSUES_IMPACT_FOR_SBNC.md) - 50 issues mapped
- [Safe Delegation and Permission Model](../architecture/SAFE_DELEGATION_AND_PERMISSION_MODEL.md) - Permission philosophy
- [Architectural Charter](../ARCHITECTURAL_CHARTER.md) - Core design principles
- [Data Invariants](../reliability/DATA_INVARIANTS.md) - Data integrity rules
