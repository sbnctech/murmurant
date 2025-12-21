# Wild Apricot Future Failure Immunity

Status: Normative Architecture Document
Applies to: All ClubOS design, development, and review decisions
Last updated: 2025-12-21

---

## Purpose

This document extracts **meta-failure patterns** from Wild Apricot's Top-50 issues
and establishes architectural defenses that make ClubOS immune to both current
WA failures and future failures of the same structural type.

The goal is not to fix 50 specific bugs.
The goal is to make entire **classes** of failure architecturally impossible.

---

## 1. Meta-Failure Pattern Taxonomy

Analysis of WA's Top-50 reveals seven recurring meta-patterns.
Every WA failure maps to one or more of these patterns.

| Pattern ID | Pattern Name | Description |
|------------|--------------|-------------|
| MF-1 | Hidden Cascades | Action triggers non-obvious side effects in unrelated data |
| MF-2 | Irreversible Actions | Destructive operations with no undo, archive, or recovery path |
| MF-3 | Coarse Permissions | All-or-nothing access grants; cannot scope to task or object |
| MF-4 | Silent Failures | Errors, state changes, or data loss occur without notification |
| MF-5 | Implicit State Machines | Business states encoded in boolean flags or inferred from data |
| MF-6 | Unattributed Mutations | Changes occur with no record of who, what, when, or why |
| MF-7 | Single-Point-of-Failure Releases | All tenants receive all changes simultaneously |

These are not WA-specific. They are **universal anti-patterns** that any
membership platform can accidentally reintroduce.

---

## 2. Anti-Pattern Detail and ClubOS Defenses

### MF-1: Hidden Cascades

**Definition:** An action on entity A silently modifies, deletes, or corrupts entity B
without user awareness or consent.

**WA Examples:**

- Deleting an event voids all associated invoices
- Voiding an invoice creates automatic member credits
- Changing a membership level retroactively affects registration eligibility
- Deleting a contact removes their payment history

**Why It Happens:**

- Tight coupling between unrelated domains (events ↔ billing ↔ membership)
- No separation between logical deletion and data removal
- Foreign key cascades at the database level without business rule enforcement

**ClubOS Architectural Defense:**

| Defense | Implementation |
|---------|----------------|
| Domain isolation | Events, billing, and membership are separate bounded contexts |
| Cancel ≠ Delete ≠ Archive | Explicit state transitions, not data removal |
| Append-only financials | Financial records never cascade-delete; reversals create new records |
| Reference protection | Cannot delete entities with dependent records; must cancel first |
| Cascade preview | Any operation affecting multiple records shows preview before execution |

**Verification Test:**

> Delete an event with paid registrations → system blocks deletion and shows affected records

---

### MF-2: Irreversible Actions

**Definition:** A user action permanently destroys data with no recovery path
within the application.

**WA Examples:**

- Delete = permanent removal, not soft delete
- No page revision history
- No undo for bulk operations
- Accidental email sends cannot be recalled

**Why It Happens:**

- No soft-delete pattern; delete means DROP
- No revision/snapshot model for mutable content
- "Undo" treated as a UI feature, not a data model requirement
- Backup/restore is provider-only, not user-accessible

**ClubOS Architectural Defense:**

| Defense | Implementation |
|---------|----------------|
| Soft delete everywhere | Deletion sets `deletedAt`; purge is a separate scheduled operation |
| Recovery window | 30-day minimum before permanent removal |
| Revision history | Content entities maintain bounded revision stack (undo/redo) |
| Bulk operation preview | All bulk actions require confirmation with affected record list |
| Point-in-time restore | Tenant-scoped restore capability with 15-minute RPO target |

**Verification Test:**

> Delete a page → page remains recoverable for 30 days → undo restores to prior state

---

### MF-3: Coarse Permissions

**Definition:** Authorization model forces administrators to grant excessive access
because permissions cannot be scoped to specific tasks or objects.

**WA Examples:**

- Only 4 preset admin levels (Member, Group Leader, Limited Admin, Full Admin)
- Event Manager can delete events (cannot separate waitlist from delete)
- Read-only admin can export full contact list
- Committee chairs require Full Admin to manage their area
- Check-in requires full event access

**Why It Happens:**

- Role-based access without capability decomposition
- No object-scoped permissions (permissions are global)
- Security model designed for single admin, not delegated operations
- Committees and leadership roles not modeled as first-class entities

**ClubOS Architectural Defense:**

| Defense | Implementation |
|---------|----------------|
| Capability model | 40+ discrete capabilities (e.g., `events:edit`, `events:delete`, `events:checkin`) |
| Object scoping | Capabilities can be granted for specific resources (this event, this committee) |
| Role composition | Roles are collections of capabilities; custom roles are first-class |
| Committee entities | Committees are modeled with scoped authority; chairs inherit committee capabilities |
| Temporal grants | Capability grants can have start/end dates for transitions |

**Verification Test:**

> Grant user `events:checkin` for Event X → user can check in attendees but cannot edit event details or access other events

---

### MF-4: Silent Failures

**Definition:** Errors, state changes, or data loss occur without notifying the user
or leaving any audit trail.

**WA Examples:**

- Membership lapses without notification
- Payment failures not surfaced to admins
- Background jobs fail silently
- Data import errors are not itemized
- Page publish errors go unnoticed

**Why It Happens:**

- Error handling returns success even on partial failure
- Background processes have no notification channel
- State transitions are implicit (inferred from dates/flags)
- No admin alerting mechanism for critical events

**ClubOS Architectural Defense:**

| Defense | Implementation |
|---------|----------------|
| Explicit state machines | All lifecycle transitions are explicit, auditable events |
| Failure surfacing | Background job failures create admin notifications |
| Partial failure handling | Bulk operations report per-record success/failure |
| Critical action alerts | Configurable alerts for high-risk actions (delete, permission change) |
| Transition notifications | Members and admins notified of lifecycle state changes |

**Verification Test:**

> Membership payment fails → admin receives notification → member receives notice → audit log records failure with reason

---

### MF-5: Implicit State Machines

**Definition:** Business entity states are encoded in boolean flags or inferred
from combinations of data values rather than explicitly modeled.

**WA Examples:**

- Event "active" inferred from date ranges and hidden flags
- Membership status derived from payment + expiration + level
- Registration eligibility computed from multiple implicit conditions
- Page "published" status unclear; no draft/live distinction

**Why It Happens:**

- State added incrementally via boolean columns (`isActive`, `isPublished`, `isCanceled`)
- No formal state machine design; transitions not validated
- Business logic scattered across application, not centralized
- States are computed, not stored

**ClubOS Architectural Defense:**

| Defense | Implementation |
|---------|----------------|
| Explicit status enums | All lifecycle entities have a `status` column with defined values |
| State machine validation | Transitions validated at the model layer; invalid transitions rejected |
| Transition logging | Every state change creates an audit entry with before/after |
| Canonical state definitions | States defined in documentation with allowed transitions |
| No derived states | State is stored, not computed; derived values are clearly labeled |

**State Machine Examples:**

- **Event:** `DRAFT → PENDING_APPROVAL → APPROVED → PUBLISHED → CANCELED | COMPLETED`
- **Member:** `PROSPECT → APPLICANT → PENDING_PAYMENT → ACTIVE → LAPSED → RESIGNED | DECEASED`
- **Page:** `DRAFT → PENDING_REVIEW → PUBLISHED → ARCHIVED`
- **Invoice:** `DRAFT → ISSUED → PAID | VOIDED | REFUNDED`

**Verification Test:**

> Attempt to transition event from DRAFT to COMPLETED → system rejects; must follow valid path

---

### MF-6: Unattributed Mutations

**Definition:** Data changes occur with no record of who made the change,
what was changed, or when.

**WA Examples:**

- Cannot determine who deleted a record
- Audit shows "edited" but not what changed
- Shared admin credentials obscure individual accountability
- No before/after comparison available
- System-triggered changes not distinguished from user actions

**Why It Happens:**

- Audit logging is optional or incomplete
- Logging captures action type but not payload diff
- Actor identity not captured consistently
- Background processes not attributed to a service account

**ClubOS Architectural Defense:**

| Defense | Implementation |
|---------|----------------|
| Mandatory audit logging | All privileged actions logged; no opt-out |
| Actor attribution | Every log entry includes authenticated user ID |
| Before/after capture | Audit entries include JSON diff of changed fields |
| Service account distinction | Background jobs use named service accounts |
| Append-only audit store | Audit records cannot be modified or deleted |
| Export capability | Audit logs exportable for compliance review |

**Audit Entry Schema:**

```
{
  id: uuid,
  timestamp: datetime,
  actorId: uuid,           // Who
  actorType: "user" | "service",
  action: string,          // What action
  entityType: string,      // What entity type
  entityId: uuid,          // Which entity
  before: json,            // State before
  after: json,             // State after
  metadata: json           // Context (IP, session, etc.)
}
```

**Verification Test:**

> Edit member profile → audit log shows actor ID, field name, old value, new value, timestamp

---

### MF-7: Single-Point-of-Failure Releases

**Definition:** All tenants receive all software changes simultaneously,
making every release a global risk event.

**WA Examples:**

- No staged rollout; all customers get every release
- Cannot pilot features with subset of tenants
- Rollback requires vendor intervention
- No way to defer disruptive updates
- Release notes discovered after the fact

**Why It Happens:**

- Monolithic architecture with shared deployment
- No tenant-scoped feature flags
- No rollback mechanism designed into release process
- Release cadence driven by vendor, not customer readiness

**ClubOS Architectural Defense:**

| Defense | Implementation |
|---------|----------------|
| Tenant-scoped feature flags | Features can be enabled per-tenant or per-cohort |
| Staged rollout | Internal → Pilot → Limited → GA progression |
| Kill switches | High-risk features have instant disable capability |
| Rollback drills | Rollback tested before any pilot begins |
| Advance notice | Breaking changes communicated before rollout |
| Tenant deferral | Non-critical updates can be deferred (up to 30 days) |

**Integration with Feature Risk Model:**

This pattern maps directly to the [Feature Risk and Field Testing Model](../ops/FEATURE_RISK_AND_FIELD_TESTING_MODEL.md):

- Risk Tier determines required rollout stages
- Kill switch requirements scale with risk
- Rollback plans are mandatory for Moderate+ risk

**Verification Test:**

> Enable feature for pilot tenant only → other tenants unaffected → disable feature instantly via flag

---

## 3. Future Risk Areas Not Yet Fully Covered

Honest assessment of areas where ClubOS defenses are planned but not yet implemented,
or where new failure modes could emerge.

### 3.1 Third-Party Integration Cascades

**Risk:** External API calls (payment processors, email providers, calendar sync)
can introduce hidden cascades and irreversible actions outside ClubOS control.

**Current Status:** Planned

**Mitigation Required:**

- Idempotency keys for all external calls
- Retry logic with dead-letter handling
- External action preview before commit
- Rollback plan for each integration point

### 3.2 Bulk Import/Export Failures

**Risk:** Large data imports can fail partway through, leaving inconsistent state.
Exports can expose more data than intended.

**Current Status:** Partially implemented

**Mitigation Required:**

- Transactional imports with all-or-nothing semantics
- Per-record error reporting with recovery guidance
- Export scoping tied to capability grants
- Import preview with validation before commit

### 3.3 Background Job Opacity

**Risk:** Scheduled jobs (renewal notices, expiration processing, report generation)
can fail silently or produce unexpected side effects.

**Current Status:** Planned

**Mitigation Required:**

- Job execution dashboard visible to admins
- Failure alerting with retry status
- Dry-run mode for destructive jobs
- Audit trail for all job-triggered mutations

### 3.4 Multi-Tenant Data Leakage

**Risk:** Bugs in tenant isolation could expose one tenant's data to another.

**Current Status:** Implemented at query layer

**Mitigation Required:**

- Tenant ID enforcement at ORM/middleware layer
- Automated tests for cross-tenant query attempts
- Regular security audit of data access patterns
- Tenant isolation verification in release checklist

### 3.5 Permission Model Evolution

**Risk:** As capabilities are added, the permission model could become as complex
as WA's, with non-obvious interactions between capabilities.

**Current Status:** Ongoing concern

**Mitigation Required:**

- Capability inventory with clear descriptions
- Capability conflict detection (if A and B together enable unintended C)
- Regular permission model review
- Principle of least privilege enforced in role templates

### 3.6 State Machine Proliferation

**Risk:** As more entities get explicit state machines, interactions between
state machines could create hidden dependencies.

**Current Status:** Ongoing concern

**Mitigation Required:**

- State machine registry with documented transitions
- Cross-entity state dependencies explicitly modeled
- Integration tests for multi-entity workflows
- State machine visualization tooling

### 3.7 Audit Log Volume and Usability

**Risk:** Comprehensive logging could produce so much data that important
events are lost in noise, recreating silent failure via obscurity.

**Current Status:** Partially addressed

**Mitigation Required:**

- Severity levels for audit entries
- Filterable audit UI by entity, actor, action type
- Alert rules for critical action patterns
- Audit log retention policy with archival

---

## 4. Failure Immunity Checklist

Before any feature merges, verify it does not introduce these anti-patterns:

### MF-1: Hidden Cascades

- [ ] Action affects only the targeted entity
- [ ] Any cross-entity effects are shown in preview
- [ ] Dependent records block deletion (not cascade-delete)
- [ ] Financial records are never modified by non-financial operations

### MF-2: Irreversible Actions

- [ ] Deletion is soft-delete with recovery window
- [ ] Content changes maintain revision history
- [ ] Bulk operations show preview and require confirmation
- [ ] Undo is available for user-initiated changes

### MF-3: Coarse Permissions

- [ ] New functionality uses existing capability or adds scoped capability
- [ ] Capability can be granted per-object, not just globally
- [ ] No new functionality bundled into existing broad capability
- [ ] Documentation updated with capability requirements

### MF-4: Silent Failures

- [ ] Errors surface to user with actionable message
- [ ] Background failures create admin notification
- [ ] Partial failures report per-item status
- [ ] Critical state changes trigger alerts

### MF-5: Implicit State Machines

- [ ] Entity uses explicit status enum, not boolean flags
- [ ] State transitions validated at model layer
- [ ] Invalid transitions rejected with clear error
- [ ] All transitions logged to audit trail

### MF-6: Unattributed Mutations

- [ ] All privileged actions create audit log entry
- [ ] Audit entry includes actor, action, entity, before/after
- [ ] Background jobs attributed to service account
- [ ] No mutation path bypasses audit logging

### MF-7: Single-Point-of-Failure Releases

- [ ] Feature risk score calculated
- [ ] Required field test stages identified
- [ ] Kill switch implemented (if required by risk tier)
- [ ] Rollback plan documented (if Moderate+ risk)

---

## 5. Relationship to Other Documents

| Document | Relationship |
|----------|--------------|
| [ARCHITECTURAL_CHARTER.md](../ARCHITECTURAL_CHARTER.md) | This document operationalizes charter principles |
| [FEATURE_RISK_AND_FIELD_TESTING_MODEL.md](../ops/FEATURE_RISK_AND_FIELD_TESTING_MODEL.md) | MF-7 defense mechanism |
| [WA_FAILURE_MODES_TO_CLUBOS_GUARANTEES.md](../competitive/WA_FAILURE_MODES_TO_CLUBOS_GUARANTEES.md) | Specific WA→ClubOS mappings |
| [DATA_INVARIANTS.md](../reliability/DATA_INVARIANTS.md) | MF-1, MF-2 enforcement rules |
| [SYSTEM_GUARANTEES.md](../reliability/SYSTEM_GUARANTEES.md) | Architectural commitments |

---

## 6. Summary

ClubOS achieves future failure immunity not by fixing WA's specific bugs,
but by making the **structural conditions** that enable those bugs impossible.

| Meta-Pattern | WA Enables | ClubOS Blocks By |
|--------------|------------|------------------|
| Hidden Cascades | Tight coupling, cascade deletes | Domain isolation, reference protection |
| Irreversible Actions | Hard delete, no versioning | Soft delete, revision history, recovery window |
| Coarse Permissions | 4 preset roles | 40+ capabilities, object-scoped |
| Silent Failures | Optional logging, no alerts | Mandatory audit, failure surfacing |
| Implicit State Machines | Boolean flags | Explicit enums, validated transitions |
| Unattributed Mutations | Optional audit | Mandatory actor attribution |
| SPOF Releases | Monolithic deploy | Staged rollout, kill switches |

These defenses are not features. They are architectural constraints.

Features can be removed.
Constraints cannot be violated.

That is the difference between "we try to avoid this" and "this cannot happen."
