# Committee and Leadership Enablement

How ClubOS Enables Safe Delegation Without Governance Consulting

---

## Purpose

This document explains how Wild Apricot's limited entity model forces
organizations into permission contortions, and how ClubOS's first-class
entities enable safe delegation, time-bounded authority, and auditable
transitions.

**Scope Boundary:** ClubOS provides structural enablement, not governance
consulting. We do not advise on term limits, succession policies, or
dispute resolution. We provide the tools to implement whatever governance
your bylaws define.

See: docs/solutions/SCOPE_BOUNDARIES_AND_NON_GOALS.md (planned)

---

## The Entity Problem

### Why WA Forces Contortions

Wild Apricot has no first-class concept of:

| Entity | WA Reality | Consequence |
|--------|------------|-------------|
| **Committee** | Contact group (manual, no permissions) | Groups stale, no access control link |
| **Role** | Admin level (4 preset options) | Overprivileged or underprivileged |
| **Term** | None (permissions permanent until removed) | Former chairs retain access |
| **Transition** | None (manual email/hope) | Knowledge loss, permission gaps |

### What Organizations Actually Do in WA

```
Scenario: New Activities Chair takes over

WA Process:
1. Board approves new chair (meeting minutes)
2. Webmaster manually grants "Limited Admin" (all or nothing)
3. Old chair asked to "not use" their still-active access
4. Old chair eventually removed (weeks/months later, maybe)
5. New chair figures out what to do from scratch
6. No record of what old chair did or decided
```

This is not a training problem. It is a structural limitation.

---

## Entity Comparison: WA vs ClubOS

### Committee Entity

| Aspect | Wild Apricot | ClubOS |
|--------|--------------|--------|
| Exists as entity | No (contact group only) | Yes (first-class) |
| Has defined scope | No | Yes (events, members, content) |
| Has subcommittees | Manual workaround | Native hierarchy |
| Persists across chairs | Sort of (group may get stale) | Yes (entity is permanent) |
| Links to permissions | No | Yes (scope boundary) |
| Links to events | No | Yes (committeeId on Event) |
| Has audit history | No | Yes (all changes logged) |

### Role Entity

| Aspect | Wild Apricot | ClubOS |
|--------|--------------|--------|
| Exists as entity | No (admin level only) | Yes (CommitteeRole) |
| Defines capabilities | No (preset bundles) | Yes (explicit capability list) |
| Scoped to committee | No | Yes |
| Can have multiple holders | N/A | Yes (co-chairs) |
| Requires succession plan | No | Configurable |
| Has history | No | Yes (past holders queryable) |

### Term Entity

| Aspect | Wild Apricot | ClubOS |
|--------|--------------|--------|
| Exists as entity | No | Yes (Term model) |
| Has start/end dates | N/A | Yes |
| Has transition window | N/A | Yes (overlap period) |
| Auto-revokes access | No (manual) | Yes (scheduled) |
| Links assignments | N/A | Yes (all roles in term) |
| Auditable | N/A | Yes |

### Role Assignment

| Aspect | Wild Apricot | ClubOS |
|--------|--------------|--------|
| Explicit assignment | Sort of (manual grant) | Yes (RoleAssignment) |
| Requires acceptance | No | Yes (explicit) |
| Has effective date | No (immediate) | Yes (scheduled) |
| Has end date | No (permanent until removed) | Yes (automatic) |
| Records who assigned | No | Yes (assignedBy) |
| Records why ended | No | Yes (endReason) |
| Auditable | Limited | Complete |

---

## Committee Lifecycle in ClubOS

### Simplified Model

```
                    +-------------------+
                    |    COMMITTEE      |
                    |  (permanent)      |
                    +-------------------+
                            |
              +-------------+-------------+
              |                           |
    +---------v----------+     +----------v---------+
    |   COMMITTEE ROLE   |     |   COMMITTEE ROLE   |
    |   (Chair)          |     |   (Secretary)      |
    +--------------------+     +--------------------+
              |                           |
    +---------v----------+     +----------v---------+
    |   ROLE ASSIGNMENT  |     |   ROLE ASSIGNMENT  |
    |   (Sarah, 2025-26) |     |   (Bob, 2025-26)   |
    +--------------------+     +--------------------+
              |                           |
    +---------v----------+     +----------v---------+
    |       TERM         |     |       TERM         |
    |   (2025-2026)      |     |   (2025-2026)      |
    +--------------------+     +--------------------+
```

### Lifecycle States

```
COMMITTEE LIFECYCLE:
  active -----> inactive -----> dissolved
     ^              |
     +--------------+
        (reactivated)

Note: Dissolved committees retain all history. Never hard-deleted.
```

```
ROLE ASSIGNMENT LIFECYCLE:

  pending -----> active -----> completed
     |              |
     |              +-----> resigned
     |              |
     +-----> declined      +-----> removed

  pending:    Assigned but not yet accepted
  active:     Holder has capabilities
  completed:  Term ended normally
  resigned:   Holder left before term end
  removed:    Board/admin removed holder
  declined:   Holder did not accept assignment
```

```
TERM LIFECYCLE:

  upcoming -----> transitioning -----> active -----> completed
                       |
                       +-- Overlap period: both incoming and
                           outgoing have access
```

### Transition Timeline

```
MONTH -1                          MONTH 0                          MONTH +1
   |                                 |                                 |
   |  TRANSITION STARTS              |  TERM STARTS                    |  OVERLAP ENDS
   |  - Incoming gets read access    |  - Incoming is primary          |  - Outgoing access revoked
   |  - Handoff checklist created    |  - Outgoing becomes read-only   |  - Transition marked complete
   |  - Knowledge transfer begins    |  - Support window starts        |
   |                                 |                                 |
   v                                 v                                 v
```

---

## Explicit Guarantees

### Safe Delegation

ClubOS guarantees that delegation is safe through structural constraints:

| Guarantee | Mechanism | Enforcement |
|-----------|-----------|-------------|
| Role capabilities cannot exceed committee scope | Committee scope filters all capability checks | Server-side, per-request |
| Chairs cannot assign roles to others | `roles:assign` is admin-only capability | Capability check on assignment API |
| Chairs cannot escalate their own permissions | Cannot grant capabilities you don't have | Validation on assignment creation |
| Delegated access is always bounded | All role assignments require term reference | Schema constraint (termId required) |
| Cross-committee access requires explicit grant | Committee scope is default filter | Query layer enforcement |

### Time-Bounded Authority

ClubOS guarantees that authority has explicit time boundaries:

| Guarantee | Mechanism | Enforcement |
|-----------|-----------|-------------|
| Access activates at scheduled time | effectiveAt field on RoleAssignment | Permission check includes date validation |
| Access expires at scheduled time | endsAt field on RoleAssignment | Permission check includes date validation |
| Transition window is built in | Term has transitionStartDate | System-enforced overlap |
| No indefinite access without renewal | All assignments require term | Schema constraint |
| Automatic notifications before expiry | System sends 7-day and 1-day warnings | Background job |
| Admin can override in emergency | Admin:full can adjust any assignment | Explicit capability, audited |

### Auditability Across Transitions

ClubOS guarantees that transitions are fully auditable:

| Guarantee | Mechanism | Enforcement |
|-----------|-----------|-------------|
| All assignments logged | AuditLog entry on create/update/end | Required in assignment service |
| Actor attribution | assignedBy, acceptedBy fields | Schema constraint |
| Reason recorded | endReason field on RoleAssignment | Required on early termination |
| Historical queries possible | Role assignment history persists | Immutable records |
| Before/after diff available | Audit entry includes field changes | AuditLog before/after JSON |
| Checklist progress tracked | TransitionChecklist items logged | Item-level audit entries |

---

## Problem Scenarios and Solutions

### Scenario 1: Committees vs Roles

**Problem:** In WA, "Activities Committee" is just a contact group. The
"Activities Chair" is a person with "Limited Admin" access to everything.

**ClubOS Solution:**

```
Committee: Activities
  |
  +-- Role: Chair
  |     Capabilities: events:create, events:edit, events:publish (scope: activities)
  |
  +-- Role: Vice Chair
  |     Capabilities: events:edit (scope: activities)
  |
  +-- Role: Host Coordinator
        Capabilities: events:checkin (scope: activities)

Result: Each role has exactly the permissions needed, scoped to Activities only.
```

### Scenario 2: Temporary Leadership

**Problem:** Board member temporarily covers for absent chair. In WA, they
get full admin access that persists after the coverage period.

**ClubOS Solution:**

```
RoleAssignment:
  member: Board Member
  role: Activities Chair (acting)
  term: 2025-2026
  effectiveAt: 2025-03-01
  endsAt: 2025-04-15
  endReason: "temporary_coverage"

Result: Access automatically revokes after 6 weeks. No manual cleanup needed.
```

### Scenario 3: Overlapping Authority

**Problem:** Incoming and outgoing chairs need simultaneous access during
transition. In WA, this means two people with full admin access and no
clarity on who is responsible.

**ClubOS Solution:**

```
Term transition period:
  - Incoming: read-only initially, full access after Week 2
  - Outgoing: full access, then read-only after term start

Visibility:
  - Both see current state
  - Audit shows who made each change
  - Handoff checklist tracks knowledge transfer
```

### Scenario 4: Handoff Between Chairs

**Problem:** Chair leaves. Knowledge lives in their head. Successor starts
from scratch.

**ClubOS Solution:**

```
System-generated on transition:
  [ ] Accept role assignment
  [ ] Complete orientation materials
  [ ] Attend knowledge transfer session
  [ ] Review pending items list
  [ ] Verify contact lists
  [ ] Confirm upcoming commitments
  [ ] Mark transition complete

Plus:
  - Past chair contact info preserved
  - Committee wiki persists
  - Decision log searchable
  - Recurring tasks continue
```

---

## What ClubOS Does NOT Do

Explicit scope boundaries:

| We Do NOT | Rationale |
|-----------|-----------|
| Advise on term lengths | Governance decision for your bylaws |
| Enforce eligibility requirements | Organization-specific policy |
| Auto-select successors | Human judgment required |
| Resolve disputes between chairs | Governance matter |
| Dictate committee structure | Organizations vary widely |
| Require specific handoff items | Advisory checklist, not blocking |
| Prevent vacancies | Some roles may be temporarily unfilled |
| Define what "chair" means | Your bylaws define roles |

We provide **structure and enforcement** for whatever governance you define.
We do not define the governance itself.

---

## Implementation Status

| Entity | Schema | API | UI | Transitions |
|--------|--------|-----|----|--------------|
| Committee | Done | Done | Partial | N/A |
| CommitteeRole | Done | Done | Planned | N/A |
| Term | Done | Partial | Planned | Planned |
| RoleAssignment | Done | Partial | Planned | Planned |
| TransitionChecklist | Planned | Planned | Planned | Planned |

**Current capability:** Committees and roles exist in the data model.
Assignment and transition workflows are in progress.

---

## See Also

- [Committee and Leadership Model](./COMMITTEE_AND_LEADERSHIP_MODEL.md) - Full architecture specification
- [Safe Delegation and Permission Model](./SAFE_DELEGATION_AND_PERMISSION_MODEL.md) - Delegation rules
- [Architectural Charter](../ARCHITECTURAL_CHARTER.md) - Core principles
- [WA Failure Modes to ClubOS Guarantees](../competitive/WA_FAILURE_MODES_TO_CLUBOS_GUARANTEES.md) - Competitive comparison

---

*This document is normative for committee and leadership enablement.
ClubOS enables governance; it does not provide governance consulting.*
