# Safe Delegation and Permission Model

Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

Status: Architectural Philosophy
Audience: Engineering, Board, Solutions Team
Last updated: 2025-12-21

---

## Purpose

This document defines ClubOS's philosophy for permissions and delegation.
The goal is to enable volunteers safely without exposing destructive
capabilities.

**Core principle:** Permission mistakes are system failures, not user failures.

If a volunteer accidentally deletes data, corrupts records, or exposes
private information, the system failed to protect them. Training and
policy cannot substitute for technical guardrails.

---

## 1. Why Wild Apricot's Role Model Fails

### The Coarse Role Problem

Wild Apricot offers a small set of predefined roles:

- Administrator (full access)
- Limited Administrator (configurable but still broad)
- Contact (no admin access)

This creates a binary choice: either give someone meaningful access
(and expose destructive capabilities) or give them nothing useful.

### The "Everyone Is an Admin" Pattern

Organizations need volunteers to perform specific tasks:

- Check in attendees at events
- Manage waitlists
- Update committee member lists
- Edit website content

In WA, accomplishing any of these requires "limited administrator" access.
But limited administrators can:

- Delete events (with financial side effects)
- Export all member data (privacy risk)
- Modify other administrators' work
- Perform actions outside their intended scope

The result: 20+ volunteers with admin access, each representing a
potential incident.

### Why Training Does Not Scale

Organizations respond to WA's permission model with training:

- "Never delete events, only cancel them"
- "Do not export member lists without approval"
- "Only edit pages in your committee's section"

This approach fails because:

1. **Volunteers rotate frequently** - Training is lost when people leave
2. **Hidden behaviors are not trainable** - WA's cascading deletes are not documented
3. **Mistakes happen under pressure** - Event day stress leads to errors
4. **Training cannot cover every scenario** - Unknown unknowns remain

### The Accountability Gap

When incidents occur in WA:

- Audit trail is incomplete or ambiguous
- "An admin" made the change (but which one?)
- No before/after record of what changed
- Attribution requires investigation, not inspection

If you cannot prove who did what, you cannot improve.

---

## 2. Capability-Based Permissions

### The Task-Capability-Role Model

ClubOS structures permissions as:

```
Task (what someone needs to do)
    |
    v
Capability (atomic permission unit)
    |
    v
Role (bundle of capabilities for a job)
```

**Tasks** are real-world activities:
- "Check in attendees at tonight's event"
- "Add a member to the waitlist"
- "Edit the hiking group's page"

**Capabilities** are the smallest permission units:
- `event:checkin` - Mark attendance
- `event:waitlist:manage` - Move people on/off waitlist
- `content:edit:committee:{id}` - Edit pages scoped to a committee

**Roles** bundle capabilities for common jobs:
- "Event Check-In Volunteer" = `event:checkin` only
- "Waitlist Manager" = `event:waitlist:manage` + `event:view:registrations`
- "Committee Content Editor" = `content:edit:committee:{id}` + `content:preview`

### Capability Design Principles

**Principle 1: Capabilities are atomic**

Each capability grants one specific action. Capabilities do not
bundle multiple actions together.

- GOOD: `event:checkin` (one action)
- BAD: `event:manage` (unclear what "manage" includes)

**Principle 2: Capabilities are scoped**

Capabilities include their scope explicitly:

- `event:edit:{event_id}` - Edit one specific event
- `content:edit:committee:{committee_id}` - Edit pages for one committee
- `member:view:directory` - View directory (not export, not edit)

**Principle 3: Capabilities are object-aware**

Authorization is evaluated against specific objects, not pages or
navigation paths.

- NOT: "Can access /admin/events"
- YES: "Can edit event ABC-123 because role grants event:edit and user is chair of hosting committee"

**Principle 4: Dangerous capabilities require explicit grants**

Capabilities that can cause harm are never bundled by default:

- `event:delete` - Never included in "event manager" roles
- `member:export` - Never included in "member viewer" roles
- `content:publish:public` - Never included in "content editor" roles

### Role Examples

| Role | Capabilities Granted | Capabilities NOT Granted |
|------|---------------------|--------------------------|
| Event Check-In | `event:checkin`, `event:view:attendees` | `event:edit`, `event:delete`, `registration:modify` |
| Waitlist Manager | `event:waitlist:manage`, `event:view:registrations` | `event:delete`, `registration:refund`, `event:edit:pricing` |
| Content Editor | `content:edit:draft`, `content:preview` | `content:publish:public`, `content:delete` |
| Committee Chair | `committee:members:manage`, `content:edit:committee:{id}` | `committee:delete`, `content:publish:public`, `member:export` |

### Role Assignment Rules

1. **Roles are assigned, not self-selected**
   - Users cannot grant themselves roles
   - Role assignment is itself a capability (`role:assign:{role}`)

2. **Roles expire or follow position tenure**
   - Time-limited roles for temporary helpers
   - Position-linked roles that adjust when positions change

3. **Multiple roles combine additively**
   - A user with Role A and Role B has capabilities from both
   - No capability subtraction (capabilities are only granted, not revoked by roles)

4. **Scope inheritance**
   - Committee chairs have capabilities scoped to their committee
   - Org-wide roles (like VP Activities) have broader scope

---

## 3. Destructive vs Non-Destructive Actions

### Defining Destructive

An action is **destructive** if:

- It permanently removes data
- It has cascading effects on related records
- It modifies financial records
- It exposes data to unintended audiences
- It cannot be easily undone

### Action Classification

| Action | Classification | Reason |
|--------|----------------|--------|
| View event details | Non-destructive | Read-only |
| Edit event title | Non-destructive | Reversible |
| Cancel event | **Destructive** | Status change with notification side effects |
| Delete event | **Destructive** | Permanent removal, financial cascade |
| Check in attendee | Non-destructive | Reversible (can un-check) |
| Refund registration | **Destructive** | Financial mutation |
| View member profile | Non-destructive | Read-only |
| Edit member profile | Non-destructive | Reversible |
| Export member list | **Destructive** | Data leaves system control |
| Edit draft page | Non-destructive | Unpublished, reversible |
| Publish page | **Destructive** | Visible to audience, reputation risk |
| Delete page | **Destructive** | Permanent removal |

### Destructive Action Requirements

All destructive actions MUST have:

1. **Explicit capability requirement** - Never included in general roles
2. **Confirmation step** - User must acknowledge consequences
3. **Audit log entry** - Who, what, when, why recorded
4. **Reversibility path** - Either undo or documented recovery procedure

---

## 4. Cancel vs Delete Semantics

### The Problem

Many systems conflate "cancel" and "delete":

- User wants to cancel an event (status change)
- System offers "delete" as the only option
- Deletion has side effects user did not anticipate
- Financial records are corrupted, requiring cleanup

### ClubOS Distinction

| Operation | What It Means | Side Effects | Permission Level |
|-----------|---------------|--------------|------------------|
| **Cancel** | Change status to "Cancelled" | Notifications sent, registrations preserved, financials unchanged | Standard capability |
| **Archive** | Move to historical view | Hidden from active lists, data preserved | Standard capability |
| **Delete** | Permanently remove record | Cascading effects, audit entry, confirmation required | Elevated capability |

### Cancel Semantics

When an event is **cancelled**:

- Status changes to CANCELLED
- Registrations remain in database (status: CANCELLED)
- Financial records unchanged (refunds are separate)
- Audit log records cancellation reason
- Notifications sent per configuration
- Event visible in "past events" and reports

The event is not gone. History is preserved.

### Delete Semantics

When an event is **deleted** (rare, elevated permission):

- Record marked as deleted (soft delete)
- Not visible in any normal view
- Remains in database for audit and recovery
- Hard delete requires system-level access
- Cascading effects explicitly documented and warned

### When Delete Is Appropriate

Delete should only be used for:

- Test data cleanup
- Accidental duplicate creation
- Data that should never have existed

Delete is NOT appropriate for:

- Events that happened and are now over
- Registrations with financial history
- Content that was published and later withdrawn

---

## 5. Guardrails

### 5.1 Reversibility

**Principle:** Most actions should be reversible by the same person
who performed them.

| Action Type | Reversibility |
|-------------|---------------|
| Edit draft | Undo available, version history |
| Publish | Unpublish available (returns to draft) |
| Cancel event | Can be re-opened (with audit note) |
| Archive | Can be unarchived |
| Soft delete | Can be restored within retention period |
| Hard delete | NOT reversible (requires elevated permission) |
| Financial mutation | NOT reversible (requires compensating transaction) |

**Implementation:**

- Version history for content changes
- Soft delete with retention period
- Status changes logged with previous state
- Financial operations create new records, not mutations

### 5.2 Confirmation

**Principle:** Destructive actions require explicit acknowledgment of
consequences.

Confirmation requirements by severity:

| Severity | Confirmation Required |
|----------|----------------------|
| Low (edit draft) | None |
| Medium (publish) | Single click with clear label |
| High (cancel event) | Modal with consequence summary |
| Critical (delete with cascade) | Modal with typed confirmation |

**Confirmation content:**

- What will happen (specific consequences)
- What will NOT be undoable
- Who will be affected
- How to proceed if unsure

Example confirmation for event deletion:

```
You are about to delete "Holiday Party 2024"

This will:
- Remove the event from all calendars
- Cancel 47 active registrations
- Send cancellation notifications to attendees
- Void associated invoices

This action cannot be undone.

Type "DELETE HOLIDAY PARTY" to confirm:
[____________]

[Cancel] [Delete Event]
```

### 5.3 Audit Logging

**Principle:** Every privileged action creates an immutable audit record.

Audit records contain:

| Field | Description |
|-------|-------------|
| timestamp | When the action occurred |
| actor_id | Who performed the action |
| actor_role | What role/capability authorized it |
| action | What was done |
| object_type | Type of object affected |
| object_id | Specific object affected |
| before_state | Object state before action |
| after_state | Object state after action |
| client_context | Session, IP, user agent |
| reason | Why action was allowed |

Audit log properties:

- **Immutable:** Records cannot be modified or deleted
- **Tamper-evident:** Cryptographic integrity (future)
- **Retained:** Per compliance requirements (minimum 7 years)
- **Queryable:** By object, by actor, by time range

---

## 6. Guarantees ClubOS Makes

### Permission Guarantees

1. **No implicit admin access**
   - No role grants "all permissions"
   - Administrative capabilities are explicitly enumerated
   - "Admin" role bundles specific capabilities, not wildcard access

2. **Capability boundaries are enforced server-side**
   - UI gating is convenience, not security
   - API validates capabilities on every request
   - Database-level constraints where possible (RLS)

3. **Permission decisions are explainable**
   - Every allow/deny can be explained in plain English
   - "Allowed because: role X grants capability Y for object Z"
   - No magic rules or hidden conditions

4. **Scope is always explicit**
   - Capabilities specify their scope
   - No ambient authority ("user is admin so allow")
   - Cross-scope access requires explicit grant

### Safety Guarantees

5. **Destructive actions require elevated permission**
   - Delete, export, publish are never default capabilities
   - Must be explicitly granted per role definition

6. **Cascading effects are warned before execution**
   - User sees what will happen before confirming
   - No silent side effects

7. **Financial operations cannot be performed accidentally**
   - Refunds, voids, credits require explicit confirmation
   - Separate capability from general event management

8. **Recovery is always possible for non-malicious mistakes**
   - Soft delete with recovery period
   - Version history for content
   - Audit trail for reconstruction

### Accountability Guarantees

9. **Every privileged action is attributed**
   - Who did it (specific user, not "an admin")
   - When they did it
   - What capability authorized it

10. **Audit records cannot be tampered with**
    - Immutable storage
    - Retained per compliance requirements

---

## 7. Explicit Out-of-Scope Permissions

ClubOS does NOT provide:

### Organizational Governance

- **Board voting permissions** - ClubOS does not decide who can vote
- **Bylaw interpretation** - ClubOS does not encode bylaw rules
- **Conflict resolution** - ClubOS does not arbitrate disputes
- **Succession authority** - ClubOS does not determine who replaces whom

These require human judgment and organizational process.

### External System Access

- **Email list management** - ClubOS permissions do not extend to external mail systems
- **Social media posting** - ClubOS does not manage external platform access
- **Banking access** - ClubOS does not grant financial institution access
- **Third-party integrations** - Each integration has its own permission model

### Irreversible Real-World Actions

- **Legal commitments** - Contracts, agreements, filings
- **Financial disbursements** - Actual money transfers
- **Physical access** - Building keys, venue access

ClubOS can record that these happened but cannot undo them.

### Super-Admin Bypass

- **No "god mode"** - No capability to bypass all restrictions
- **No "as user" impersonation** - Support access is logged, not invisible
- **No "bulk override"** - Mass operations require individual authorization

Even platform administrators operate within defined capabilities.

---

## Implementation Notes

### For Engineers

- Capability checks MUST be server-side
- Every API route MUST validate capabilities before processing
- Audit log writes MUST be transactional with the action
- Soft delete MUST be the default; hard delete requires explicit path

### For Solutions Team

- Role definitions are documented and versioned
- Customer-specific roles can bundle existing capabilities
- New capabilities require engineering review
- Permission-related incidents feed back to capability design

### For Board/Leadership

- Permission model changes require governance review
- New destructive capabilities require explicit approval
- Audit access has its own capability (not "admin includes everything")

---

## See Also

- [Architectural Charter](../ARCHITECTURAL_CHARTER.md) - Core principles (P1, P2, P5)
- [WA Issues Impact for SBNC](../sbnc/WILD_APRICOT_ISSUES_IMPACT_FOR_SBNC.md) - Problem context
- [Auth and RBAC](../rbac/AUTH_AND_RBAC.md) - Current implementation
- [Reliability and Delivery Synthesis](../RELIABILITY_AND_DELIVERY_SYNTHESIS.md) - Operational context
