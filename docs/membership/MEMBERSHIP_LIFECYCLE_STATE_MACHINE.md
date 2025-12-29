# Membership Lifecycle State Machine

Purpose: Formalize the membership lifecycle as an explicit state machine for
implementation reference. This document describes states, events, transitions,
and guard conditions.

---

## States

| State            | Description                                              |
|------------------|----------------------------------------------------------|
| not_a_member     | Contact record only; no membership privileges.           |
| pending_new      | Application submitted; awaiting approval.                |
| active_newbie    | Approved; in 90-day newbie window.                       |
| active_member    | Standard member; 90 days to 2-year mark.                 |
| offer_extended   | 2-year mark reached; extended offer sent, awaiting response. |
| active_extended  | Extended membership accepted and paid.                   |
| lapsed           | Membership ended; historical record preserved.           |
| suspended        | Membership suspended (policy-driven; no privileges).     |
| unknown          | Data incomplete; requires admin review.                  |

---

## Events

| Event                      | Description                                          |
|----------------------------|------------------------------------------------------|
| join_approved              | Admin approves membership application.               |
| newbie_90_days_elapsed     | 90 days since join date.                             |
| two_year_mark_reached      | 2 years since join date.                             |
| extended_offer_sent        | Extended membership offer sent to member.            |
| extended_accepted          | Member accepts the extended offer.                   |
| extended_paid              | Payment received for extended membership.            |
| extended_declined          | Member declines the extended offer.                  |
| payment_failed             | Payment attempt failed or expired.                   |
| membership_end_reached     | End of membership term (member or extended).         |
| suspension_applied         | Admin suspends membership.                           |
| suspension_lifted          | Admin lifts suspension.                              |

---

## Transition Table

| Current State    | Event                      | Next State       | Guard / Notes                          |
|------------------|----------------------------|------------------|----------------------------------------|
| not_a_member     | join_approved              | active_newbie    | Application exists and approved.       |
| pending_new      | join_approved              | active_newbie    | Start 90-day newbie window.            |
| active_newbie    | newbie_90_days_elapsed     | active_member    | Automatic; no action required.         |
| active_member    | two_year_mark_reached      | offer_extended   | Trigger extended offer workflow.       |
| offer_extended   | extended_accepted          | offer_extended   | Awaiting payment (state unchanged).    |
| offer_extended   | extended_paid              | active_extended  | Guard: accepted + paid.                |
| offer_extended   | extended_declined          | lapsed           | Member declines; membership ends.      |
| offer_extended   | payment_failed             | lapsed           | Payment not received; membership ends. |
| offer_extended   | membership_end_reached     | lapsed           | Grace period expired; membership ends. |
| active_extended  | membership_end_reached     | lapsed           | Extended term ends; membership ends.   |
| active_member    | membership_end_reached     | lapsed           | Edge case: term ends without offer.    |
| active_newbie    | suspension_applied         | suspended        | Admin action.                          |
| active_member    | suspension_applied         | suspended        | Admin action.                          |
| active_extended  | suspension_applied         | suspended        | Admin action.                          |
| suspended        | suspension_lifted          | (previous)       | Restore to prior active state.         |
| unknown          | (any resolution)           | (resolved state) | Admin manually resolves data issues.   |

---

## Guard Conditions

- **join_approved**: Requires valid MembershipApplication with status approved.
- **newbie_90_days_elapsed**: joinDate + 90 days <= now.
- **two_year_mark_reached**: joinDate + 730 days <= now (or calendar 2 years; TBD).
- **extended_paid**: Payment record exists with status completed.
- **suspension_lifted**: Requires admin action; restores prior state from audit log.

---

## WA Field Mapping to States

Wild Apricot does not use the same state machine. Murmurant infers state from:

| WA Field(s)                        | Murmurant State Inference                         |
|------------------------------------|------------------------------------------------|
| membershipStatus = Active          | Depends on tier and timestamps.                |
| membershipStatus = Lapsed          | lapsed                                         |
| membershipStatus = PendingNew      | pending_new                                    |
| membershipStatus = Suspended       | suspended                                      |
| waMembershipLevelRaw = NewbieNewcomer | active_newbie (if status Active)            |
| waMembershipLevelRaw = NewcomerMember | active_member (if status Active)            |
| waMembershipLevelRaw = ExtendedNewcomer | active_extended (if status Active)        |
| waMembershipLevelRaw = Admins      | unknown (role, not tier; requires resolution)  |
| Missing/unknown level              | unknown (flag for admin review)                |

Additional inference rules:

- If membershipStatus = Active and tier = newbie_member and joinDate + 90 days > now:
  state = active_newbie.
- If membershipStatus = Active and tier = member and joinDate + 730 days > now:
  state = active_member.
- If membershipStatus = Active and tier = extended_member:
  state = active_extended.
- If membershipStatus = Active and joinDate + 730 days <= now and tier != extended_member:
  state = offer_extended OR lapsed (depends on offer workflow status).

---

## Implementation Notes

1. **Cron/scheduled job**: Check for members crossing 90-day and 2-year thresholds.
2. **Event sourcing**: Consider storing state transitions as events for audit.
3. **Idempotency**: Transitions should be idempotent (re-running same event is safe).
4. **Manual override**: Admin can force state changes with audit log entry.
5. **Suspension restore**: Track "prior state" when suspending to enable restoration.

---

## Open Items

- Definition of "2 years" (730 days vs calendar years with leap year handling).
- Grace period duration after extended offer sent.
- Whether extended membership has a fixed end date or is perpetual until lapsed.
- Renewal workflow for extended members (if applicable).

---

## Diagram (ASCII)

```
                          +---------------+
                          | not_a_member  |
                          +-------+-------+
                                  |
                          join_approved
                                  |
                                  v
                          +---------------+
                          | pending_new   |
                          +-------+-------+
                                  |
                          join_approved
                                  |
                                  v
                          +---------------+
                          | active_newbie |<---------+
                          +-------+-------+          |
                                  |                  |
                    newbie_90_days_elapsed    suspension_lifted
                                  |                  |
                                  v                  |
                          +---------------+          |
                          | active_member |<---------+
                          +-------+-------+          |
                                  |                  |
                    two_year_mark_reached     suspension_lifted
                                  |                  |
                                  v                  |
                          +----------------+         |
                          | offer_extended |         |
                          +-------+--------+         |
                           /      |      \           |
            extended_declined  extended_paid  payment_failed
                         /        |           \
                        v         v            v
                  +--------+ +---------------+ +--------+
                  | lapsed | | active_extended| | lapsed |
                  +--------+ +-------+-------+ +--------+
                                     |
                         membership_end_reached
                                     |
                                     v
                               +--------+
                               | lapsed |
                               +--------+

                          +------------+
                          | suspended  |<---- suspension_applied (from any active)
                          +------------+
                                |
                        suspension_lifted
                                |
                                v
                          (prior active state)
```

---

## References

- docs/MEMBERSHIP/MEMBERSHIP_MODEL_TRUTH_TABLE.md
- docs/work-queue/MEMBERSHIP_LIFECYCLE.md (workflow notes)
