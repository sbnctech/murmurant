Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

# Live Demo Scenarios

Status: Sales Enablement
Audience: Founders, Solutions Team
Last updated: 2025-12-21

---

## Purpose

This document provides three live demo scenarios for prospect conversations.
Each scenario demonstrates a common organizational task that:

- Wild Apricot cannot safely complete
- ClubOS handles safely by architectural design

These are not feature comparisons. They demonstrate failure prevention.

---

## Before You Begin

**Test Environment Requirements:**

- ClubOS staging environment with test data
- At least one test event with registrations (completed)
- At least one test user with limited role (e.g., "Event Host")
- At least one draft event and one published event

**Do not use production data for demos.**

---

## Scenario 1: Cleaning Up a Past Event

### Why This Matters

After an event concludes, volunteers often want to "clean up" the calendar
by removing old events. In Wild Apricot, this is dangerous. In ClubOS,
the system prevents harm.

### Setup

1. Open ClubOS admin panel
2. Navigate to Events
3. Find a past event that has:
   - Status: COMPLETED
   - At least one registration
   - At least one payment recorded

Say to the prospect:

> "Let's say your volunteer wants to tidy up the calendar by removing
> this old event. In Wild Apricot, what would happen?"

### What Wild Apricot Does (Describe Verbally)

Do not demonstrate this in WA. Describe it:

> "In Wild Apricot, the volunteer clicks Delete. No warning appears about
> financial impact. The system immediately:
>
> - Deletes the event record
> - Automatically voids all associated invoices
> - Creates credits on every member account who paid
> - Leaves no trace of who did this or when
>
> Your treasurer discovers phantom credits days later. Hours of cleanup.
> This happened at SBNC in December 2024."

### What ClubOS Prevents (Demonstrate)

1. Click on the past event to open it
2. Attempt to delete it (look for Delete action or similar)
3. Show the system response:

> "ClubOS refuses. The delete action is blocked because this event has
> financial records. Watch what happens..."

Point out:

- **Error message**: "Cannot delete: event has registrations and payment history"
- **Suggested action**: "Use Cancel to mark this event as cancelled without removing records"
- **No cascade occurred**: Invoice records are unchanged

4. Show the Cancel action instead:

> "Cancel changes the status. The event moves to CANCELLED. But look:
> the registration records still exist. The payment records still exist.
> Nothing was voided. Nothing was credited. The data is preserved."

### Why This Matters to a Board

> "Your volunteers cannot accidentally corrupt your financial records
> by cleaning up the calendar. The system structurally prevents it.
> Not a policy. Not training. Architecture."

### Guarantee Mapping

| Demo Element | Guarantee | Source |
|--------------|-----------|--------|
| Delete blocked | Events with financial records cannot be deleted | CLUBOS_WA_PROSPECT_POSITIONING.md:103-112 |
| Cancel is separate | State machine distinguishes cancel from delete | CLUBOS_WA_PROSPECT_POSITIONING.md:75-99 |
| Invoices unchanged | Financial records are append-only | CLUBOS_WA_PROSPECT_POSITIONING.md:133-160 |

---

## Scenario 2: Delegating Check-In Access

### Why This Matters

Event day volunteers need access to mark attendance. They should not
have access to change registrations, issue refunds, or delete the event.
Wild Apricot cannot separate these. ClubOS can.

### Setup

1. Ensure you have a test user with the "Event Host" or "Check-In" role
2. Know the credentials to log in as that user (or use impersonation if available)
3. Have a published event with registrations ready

Say to the prospect:

> "Let's say you want a volunteer to check people in at your event.
> In Wild Apricot, what access do they get?"

### What Wild Apricot Does (Describe Verbally)

Do not demonstrate in WA. Describe it:

> "In Wild Apricot, to give someone check-in access, you have to make
> them an Event Manager. But Event Managers can:
>
> - See all registration details including payment info
> - Edit or cancel registrations
> - Issue refunds
> - Delete the entire event
>
> You wanted check-in. They got full control. There is no middle option."

### What ClubOS Prevents (Demonstrate)

1. Log in as the limited-role user (or show their role assignment)
2. Navigate to the event as that user
3. Show what they CAN do:

> "The Check-In role can see the attendee list and mark people as
> arrived. That's it. Watch what happens when they try to do more..."

4. Attempt to edit a registration:

> "Blocked. They don't have the registration:edit capability."

5. Attempt to access refund or payment functions:

> "Not even visible. They don't have finance:* capabilities."

6. Attempt to delete or cancel the event:

> "Blocked. Event management requires event:manage capability.
> Event deletion requires event:delete capability. This role has neither."

7. Show the role's actual permissions (if visible in UI):

> "Here's exactly what this role can do. Check-in only. No surprises."

### Why This Matters to a Board

> "You can give 20 volunteers event-day access without worrying that
> any of them can accidentally corrupt registrations, issue refunds,
> or delete events. The permission model is granular, not all-or-nothing."

### Guarantee Mapping

| Demo Element | Guarantee | Source |
|--------------|-----------|--------|
| Check-in separated | Capability-based permission model | PROSPECT_DECK_OUTLINE.md:133-139 |
| Finance not visible | Object-scoped authorization | CLUBOS_WA_PROSPECT_POSITIONING.md:157-160 |
| Delete blocked | Separate capability for destructive actions | CLUBOS_WA_PROSPECT_POSITIONING.md:47-51 |

---

## Scenario 3: Finding Who Changed What

### Why This Matters

When something goes wrong, boards need to know who did what and when.
This is not about blame. It is about training, process improvement,
and accountability. Wild Apricot cannot reliably answer this question.
ClubOS can.

### Setup

1. Open ClubOS admin panel
2. Navigate to a record that has been edited (event, member, or page)
3. Have access to the audit log or history view

Say to the prospect:

> "A member calls and says their registration was changed but they
> didn't do it. How do you find out what happened?"

### What Wild Apricot Does (Describe Verbally)

Do not demonstrate in WA. Describe it:

> "In Wild Apricot, you check the activity log. If you're lucky, it
> shows 'Registration updated.' It does not show:
>
> - Which fields changed
> - What the old values were
> - Which admin account did it
> - Whether it was the member or an admin
>
> You end up asking around: 'Did anyone touch this record?' Nobody
> remembers. The trail is cold."

### What ClubOS Prevents (Demonstrate)

1. Navigate to the record in question
2. Open the audit trail or history view
3. Show a specific audit entry:

> "Here's exactly what happened. Watch what information is recorded..."

Point out each element:

- **Who**: "Alice Martinez (admin) performed this action"
- **When**: "December 15, 2024 at 2:34 PM Pacific"
- **What changed**: "Registration status changed from CONFIRMED to CANCELLED"
- **Before value**: "CONFIRMED"
- **After value**: "CANCELLED"
- **Context**: "Reason: 'Member requested cancellation via email'"

4. Show multiple entries if available:

> "Every change is recorded. We can see the complete history of this
> record. Not just 'it was edited' but exactly what changed each time."

5. If available, show the search or filter:

> "If you need to find all changes by a specific person, or all changes
> to registrations in a date range, the audit log is searchable."

### Why This Matters to a Board

> "When an incident occurs, you can answer the question immediately.
> No guessing. No asking around. The system recorded it. Every privileged
> action, every time, with before and after values."

### Guarantee Mapping

| Demo Element | Guarantee | Source |
|--------------|-----------|--------|
| Actor attribution | Every action tied to authenticated user | CLUBOS_WA_PROSPECT_POSITIONING.md:51, 253-254 |
| Before/after values | Audit includes what changed | CLUBOS_WA_PROSPECT_POSITIONING.md:251 |
| Timestamp and context | When and why is recorded | CLUBOS_WA_PROSPECT_POSITIONING.md:253-254 |

---

## Demo Flow for a 15-Minute Session

If you have limited time, prioritize in this order:

| Minutes | Scenario | Key Point |
|---------|----------|-----------|
| 0-5 | Scenario 1: Event Cleanup | Destructive cascades are impossible |
| 5-10 | Scenario 2: Check-In Delegation | Permissions are granular, not all-or-nothing |
| 10-15 | Scenario 3: Who Did This? | Audit trail is complete and searchable |

If you only have 5 minutes, do Scenario 1. It is the most concrete and
most directly maps to the December 2024 SBNC incident.

---

## What NOT to Do

- **Do not badmouth Wild Apricot employees.** Focus on architecture, not people.
- **Do not claim ClubOS is perfect.** Acknowledge limitations when asked.
- **Do not make claims beyond the source documents.** If unsure, say so.
- **Do not demonstrate in production.** Use staging data only.
- **Do not skip the "why it matters" context.** Board members need the business impact.

---

## Handling Common Questions

### "Can Wild Apricot add these features?"

> "Theoretically, yes. Practically, it would require rewriting 15 years
> of code and migrating 20,000 customers without breaking their workflows.
> The economic incentive is not there. ClubOS was designed knowing what
> to prevent from day one."

### "What if I need to actually delete something?"

> "Draft events with no registrations can be deleted. For everything else,
> Cancel preserves the record while removing it from active views. If you
> truly need to purge data, that requires platform-level access and is
> logged. We make it possible but not easy."

### "What about GDPR/data deletion requests?"

> "Member data deletion requests are handled through a specific workflow
> that anonymizes personal data while preserving transactional history
> for financial compliance. The member's identity is removed, but the
> invoice record that proves you received $50 on a certain date remains."

### "This seems like a lot of restrictions."

> "These are guardrails, not restrictions. Your volunteers can do everything
> they need to do. They just cannot accidentally do things that corrupt
> your financial records or lose your data. The system prevents harm
> without preventing work."

---

## Failure Mode to Guarantee Mapping

Each demo scenario maps to documented failure modes and guarantees:

| Scenario | WA Failure Mode | ClubOS Guarantee | Mechanism |
|----------|-----------------|------------------|-----------|
| Event Cleanup | Delete cascades to invoices | Event deletion blocked when financial records exist | Database constraint + capability check |
| Check-In Delegation | Event managers can delete | Capabilities are granular and object-scoped | Capability-based authorization |
| Who Did This | Audit trail incomplete | Every privileged action logged with actor | Audit middleware on all write paths |

---

## See Also

- [Prospect Deck Outline](./PROSPECT_DECK_OUTLINE.md) - Slide-by-slide guide
- [ClubOS WA Prospect Positioning](../competitive/CLUBOS_WA_PROSPECT_POSITIONING.md) - "Impossible by construction" proofs
- [Talent Pool Expansion Summary](../board/TALENT_POOL_EXPANSION_SUMMARY.md) - Board-facing summary
- [WA Failure Modes to Guarantees](../competitive/WA_FAILURE_MODES_TO_CLUBOS_GUARANTEES.md) - Full comparison
