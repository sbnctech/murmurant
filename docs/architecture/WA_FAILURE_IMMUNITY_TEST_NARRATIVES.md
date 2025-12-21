# WA Failure Immunity: Conceptual Safety Proofs

Copyright (c) Santa Barbara Newcomers Club
Status: Safety Verification Narratives
Last Updated: 2025-12-21

---

## Purpose

This document defines 10 test narratives that prove destructive Wild Apricot
failure modes are architecturally impossible in ClubOS.

These are **conceptual safety proofs**, not test code. Each narrative:

- Describes a scenario that causes harm in Wild Apricot
- Demonstrates why ClubOS blocks the harmful outcome
- Maps to a specific failure class and prevention mechanism

---

## Narrative Format

Each test follows Given/When/Then structure:

- **Given**: The preconditions and context
- **When**: The action a user attempts
- **Then**: The system's response that prevents harm

---

## Test Narrative 1: Event Deletion with Financial Records

**Failure Class**: MF-1 (Hidden Cascades) + Delete vs Cancel Confusion

**WA Behavior**: Deleting an event voids all invoices and creates automatic
member credits, corrupting financial records.

**Mechanism**: Reference protection + Append-only financials

---

**Given**:
- An event "Holiday Gala" exists in PUBLISHED status
- 25 members have paid registrations totaling $1,250
- All payments are in COMPLETED status
- User has `events:manage` capability (but not `events:delete`)

**When**:
- User attempts to delete the event via admin UI or API

**Then**:
- System rejects the deletion request
- Error message: "Cannot delete event with financial records. Use Cancel instead."
- Event remains in PUBLISHED status
- All 25 registrations remain intact
- All payment records remain unchanged
- Audit log records the rejected deletion attempt with reason

**Proof**:
The deletion fails because:
1. `events:delete` capability is not granted to event managers
2. Even with capability, deletion is blocked when `Payment` records exist
3. Invoice and Payment models have no foreign key cascade from Event
4. The code path to void invoices on event deletion does not exist

---

## Test Narrative 2: Event Cancellation Preserves Financial History

**Failure Class**: MF-2 (Irreversible Actions) + Hidden Financial Side Effects

**WA Behavior**: Event cancellation or deletion modifies payment records and
creates automatic refunds without explicit financial action.

**Mechanism**: State machine + Append-only financials

---

**Given**:
- An event "Wine Tour" exists in PUBLISHED status
- 15 members have paid registrations
- Event needs to be cancelled due to weather

**When**:
- Admin with `events:cancel` capability cancels the event

**Then**:
- Event status changes to CANCELLED
- All 15 registrations remain in their current status
- All payment records remain COMPLETED
- No automatic refunds are created
- No invoice modifications occur
- Members receive cancellation notification (if configured)
- Audit log records: actor, event ID, status change from PUBLISHED to CANCELLED

**Proof**:
Financial isolation is structural:
1. `cancelEvent()` only modifies EventStatus enum field
2. No code path exists from event state change to Payment mutation
3. Refunds require explicit `finance:refund` capability and separate action
4. Financial records are append-only; reversals create new Refund records

---

## Test Narrative 3: Granular Capability Prevents Deletion

**Failure Class**: MF-3 (Coarse Permissions)

**WA Behavior**: Event managers can delete events because delete is bundled
with event management.

**Mechanism**: Capability decomposition + Object-scoped authorization

---

**Given**:
- User "Alice" is assigned as Event Chair for "Monthly Mixer"
- Alice has capabilities: `events:edit`, `events:checkin`, `registrations:manage`
- Alice does NOT have: `events:delete`, `events:cancel`

**When**:
- Alice attempts to delete "Monthly Mixer"

**Then**:
- Delete button is not visible in UI (capability-gated)
- Direct API call to DELETE endpoint returns 403 Forbidden
- Error: "Missing required capability: events:delete"
- Event remains unchanged
- Audit log records: unauthorized deletion attempt by Alice

**Proof**:
Capability separation is enforced at authorization layer:
1. `events:delete` is a distinct capability from `events:edit`
2. Event Chair role template does not include `events:delete`
3. Authorization check occurs before any business logic
4. UI rendering is also capability-gated (defense in depth)

---

## Test Narrative 4: Soft Delete with Recovery Window

**Failure Class**: MF-2 (Irreversible Actions)

**WA Behavior**: Deletion permanently removes records with no recovery path.

**Mechanism**: Soft delete pattern + Recovery window

---

**Given**:
- A draft event "Planning Session" exists with no registrations
- Admin has `events:delete` capability
- Current date: January 15

**When**:
- Admin deletes the draft event

**Then**:
- Event is not physically removed from database
- Event gains `deletedAt` timestamp of January 15
- Event disappears from normal admin listings
- Event is recoverable via "Deleted Items" admin view
- Event can be restored until February 14 (30-day window)
- After February 14, scheduled job performs hard delete
- Audit log records: soft delete with actor, reason, recovery deadline

**Proof**:
Soft delete is enforced at model layer:
1. Delete operations set `deletedAt`, not remove rows
2. All queries filter `WHERE deletedAt IS NULL` by default
3. Hard delete requires platform-level access, not tenant admin
4. Recovery is self-service within retention window

---

## Test Narrative 5: Bulk Update Preview and Confirmation

**Failure Class**: MF-1 (Hidden Cascades) + MF-4 (Silent Failures)

**WA Behavior**: Bulk operations execute immediately with no preview,
and errors are not itemized per record.

**Mechanism**: Bulk operation preview + Per-record error reporting

---

**Given**:
- Admin wants to update phone numbers for 150 members via CSV import
- CSV contains 150 rows
- 3 rows have invalid phone format
- 2 rows reference non-existent member IDs

**When**:
- Admin uploads CSV and initiates import

**Then**:
- System parses CSV and displays preview:
  - "145 records will be updated"
  - "3 records have validation errors (invalid phone format)"
  - "2 records reference unknown members"
- Each error row is listed with line number and specific error
- Import is NOT executed until admin reviews and confirms
- Admin can download error report
- Admin can fix CSV and re-upload
- Only after confirmation do 145 valid records update
- Audit log records: bulk update, 145 successes, 5 skipped with reasons

**Proof**:
Preview-before-commit is mandatory:
1. Import validation runs before any database writes
2. Per-record validation with detailed error messages
3. Explicit confirmation required after preview
4. Partial success reports which records succeeded/failed
5. No silent failures; all outcomes are explicit

---

## Test Narrative 6: State Machine Rejects Invalid Transition

**Failure Class**: MF-5 (Implicit State Machines)

**WA Behavior**: Event states are inferred from boolean flags and dates,
allowing inconsistent state combinations.

**Mechanism**: Explicit state enum + Transition validation

---

**Given**:
- An event "Art Show" is in DRAFT status
- Event has never been published
- Event has no registrations

**When**:
- User attempts to transition event directly to COMPLETED status

**Then**:
- System rejects the transition
- Error: "Invalid state transition: DRAFT cannot transition to COMPLETED"
- Event remains in DRAFT status
- Valid transitions are shown: "DRAFT -> PENDING_APPROVAL or DRAFT -> CANCELLED"
- Audit log records: rejected transition attempt with reason

**Proof**:
State machine is enforced at model layer:
1. EventStatus is an enum, not computed from flags
2. Transition functions validate source and target states
3. Invalid transitions are rejected before database write
4. Only valid paths through state machine are allowed:
   - DRAFT -> PENDING_APPROVAL -> APPROVED -> PUBLISHED -> COMPLETED
   - Any state -> CANCELLED (with appropriate capability)

---

## Test Narrative 7: Actor Attribution on Every Mutation

**Failure Class**: MF-6 (Unattributed Mutations)

**WA Behavior**: Changes occur with no record of who made them or what
specifically changed.

**Mechanism**: Mandatory audit logging + Before/after diff

---

**Given**:
- Member "Bob Smith" has profile with email: bob@oldcompany.com
- Admin "Carol" updates Bob's email to bob@newcompany.com
- Update occurs at 2:30 PM on January 20

**When**:
- Carol submits the profile update

**Then**:
- Profile is updated with new email
- Audit log entry is created with:
  - `actorId`: Carol's member ID
  - `action`: "member.profile.update"
  - `entityType`: "Member"
  - `entityId`: Bob's member ID
  - `timestamp`: 2025-01-20T14:30:00Z
  - `before`: `{"email": "bob@oldcompany.com"}`
  - `after`: `{"email": "bob@newcompany.com"}`
  - `metadata`: `{"ip": "...", "userAgent": "..."}`

**Proof**:
Audit logging is mandatory:
1. All privileged actions route through `createAuditEntry()`
2. AuthContext (with actorId) is required parameter
3. Before/after JSON diff is captured automatically
4. Audit records are append-only (no UPDATE/DELETE allowed)
5. No code path exists to mutate data without audit entry

---

## Test Narrative 8: Page Versioning with Rollback

**Failure Class**: MF-2 (Irreversible Actions)

**WA Behavior**: Page edits go live immediately with no version history
or rollback capability.

**Mechanism**: Revision history + Draft/Preview/Publish workflow

---

**Given**:
- "About Us" page exists in PUBLISHED status
- Page has been edited 5 times, creating 5 revisions
- Current published content: "Welcome to Santa Barbara Newcomers..."
- Admin accidentally deletes a paragraph and saves

**When**:
- Admin realizes the mistake and wants to undo

**Then**:
- Admin opens revision history for the page
- All 5 previous revisions are listed with timestamps and authors
- Admin selects revision from before the mistake
- Preview shows the selected revision
- Admin clicks "Restore this version"
- Page content is restored to selected revision
- Audit log records: restore action with source revision ID
- Member-facing page now shows correct content

**Proof**:
Versioning is built into the data model:
1. Page edits create PageRevision records
2. Revisions are immutable once created
3. "Current" content is the latest revision
4. Restore creates a new revision copying old content
5. No revision is ever deleted (append-only)

---

## Test Narrative 9: Financial Refund Requires Explicit Action

**Failure Class**: Hidden Financial Side Effects

**WA Behavior**: Invoice voiding automatically creates member credits;
refund logic is triggered implicitly by non-financial actions.

**Mechanism**: Separate financial operations + Explicit refund workflow

---

**Given**:
- Member "Diana" paid $50 for "Garden Tour" event
- Event is now cancelled
- Diana requests a refund

**When**:
- Admin processes the refund

**Then**:
- Admin must navigate to Finance section (not Event section)
- Admin must have `finance:refund` capability
- Refund form shows:
  - Original payment: $50
  - Payment method: Card ending 4242
  - Refund amount: $50 (editable for partial refund)
  - Reason: (required field)
- Admin submits refund with reason "Event cancelled"
- New Refund record is created (not modification of Payment)
- Original Payment record remains COMPLETED (historical record)
- Original Invoice record remains PAID (historical record)
- Refund record links to Payment with reason and timestamp
- Audit log records: refund action, amount, reason, actor

**Proof**:
Financial operations are isolated:
1. Event cancellation does not trigger any financial action
2. Refund requires explicit navigation to financial function
3. Refund requires separate `finance:refund` capability
4. Refund creates new record, never modifies existing records
5. Complete financial history preserved for audit

---

## Test Narrative 10: Feature Flag Isolation for Staged Rollout

**Failure Class**: MF-7 (Single-Point-of-Failure Releases)

**WA Behavior**: All tenants receive all changes simultaneously;
no ability to test with subset or roll back per-tenant.

**Mechanism**: Tenant-scoped feature flags + Kill switch

---

**Given**:
- New feature "Waitlist Auto-Promotion" is ready for testing
- Feature has Risk Tier: Moderate
- SBNC is designated as pilot tenant
- Other tenants should not see the feature yet

**When**:
- Engineering enables feature flag `waitlist_auto_promotion` for SBNC only

**Then**:
- SBNC admin sees "Auto-Promotion" toggle in event settings
- Other tenants do NOT see this toggle
- SBNC can test the feature with real events
- If issues are discovered:
  - Kill switch disables feature for SBNC in seconds
  - Other tenants are never affected
  - SBNC events revert to manual waitlist promotion
- If testing succeeds:
  - Feature flag extended to additional pilot tenants
  - Eventually enabled for all tenants
- Audit log records: feature flag changes with actor and scope

**Proof**:
Staged rollout is architectural:
1. Feature flags are tenant-scoped, not global
2. Flag evaluation occurs at request time
3. Kill switch is immediate (no deployment required)
4. Rollback is per-tenant, not all-or-nothing
5. Release risk is isolated to pilot tenants

---

## Summary Matrix

| # | Narrative | Failure Class | Mechanism | WA Outcome | ClubOS Outcome |
|---|-----------|---------------|-----------|------------|----------------|
| 1 | Event deletion with payments | MF-1 + Delete/Cancel | Reference protection | Invoices voided, credits created | Deletion blocked |
| 2 | Event cancellation preserves finance | MF-2 + Financial cascade | Append-only financials | Payments modified | Payments unchanged |
| 3 | Granular capability prevents delete | MF-3 | Capability decomposition | Delete bundled with manage | Delete requires separate capability |
| 4 | Soft delete with recovery | MF-2 | Soft delete pattern | Permanent removal | 30-day recovery window |
| 5 | Bulk update preview | MF-1 + MF-4 | Preview + confirmation | Silent partial failure | Per-record error report |
| 6 | Invalid state transition | MF-5 | State machine validation | Inconsistent state | Transition rejected |
| 7 | Actor attribution | MF-6 | Mandatory audit | Unknown who changed | Actor + before/after recorded |
| 8 | Page versioning | MF-2 | Revision history | No undo | Rollback to any revision |
| 9 | Explicit refund | Financial cascade | Separate financial ops | Auto-refund on cancel | Refund requires explicit action |
| 10 | Feature flag isolation | MF-7 | Tenant-scoped flags | All tenants affected | Pilot-only, instant rollback |

---

## Verification Approach

These narratives are **conceptual proofs**, not test implementations.
To verify each proof:

1. **Code review**: Confirm mechanism exists in codebase
2. **Manual test**: Attempt the scenario in staging environment
3. **Negative test**: Confirm the harmful path is blocked
4. **Audit verification**: Confirm audit trail captures the blocking

Each narrative should map to at least one:
- E2E test scenario (Playwright)
- API test case (integration tests)
- Unit test for authorization/validation logic

---

## Cross-References

| Document | Relationship |
|----------|--------------|
| [WA_FUTURE_FAILURE_IMMUNITY.md](./WA_FUTURE_FAILURE_IMMUNITY.md) | Meta-failure patterns and defenses |
| [CLUBOS_WA_PROSPECT_POSITIONING.md](../competitive/CLUBOS_WA_PROSPECT_POSITIONING.md) | Failure class definitions |
| [CLUBOS_VS_WA_50_ISSUE_MATRIX.md](../competitive/CLUBOS_VS_WA_50_ISSUE_MATRIX.md) | Issue-to-mechanism mapping |
| [DATA_INVARIANTS.md](../reliability/DATA_INVARIANTS.md) | Financial append-only rules |
| [ARCHITECTURAL_CHARTER.md](../ARCHITECTURAL_CHARTER.md) | Core design principles |

---

*These narratives prove that WA failure modes are impossible by construction,
not by policy or configuration. The harmful code paths do not exist.*
