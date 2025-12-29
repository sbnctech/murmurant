# Lifecycle Explainer Demo Guide

This guide walks through demonstrating the membership lifecycle state machine using pre-seeded demo members.

## Overview

The lifecycle explainer shows how Murmurant tracks member status through time-based and administrative state transitions. Demo members are created with specific join dates and membership attributes to represent each lifecycle state.

## Prerequisites

1. Database connection configured (DATABASE_URL in .env)
2. Membership statuses and tiers seeded:
   ```bash
   npx tsx scripts/importing/seed_membership_statuses.ts
   npx tsx scripts/importing/seed_membership_tiers.ts
   ```

## Seeding Demo Members

Run the demo member seed script:

```bash
npx tsx scripts/importing/seed_demo_members.ts
```

For dry-run preview (no database writes):
```bash
DRY_RUN=1 npx tsx scripts/importing/seed_demo_members.ts
```

For production database (requires explicit confirmation):
```bash
ALLOW_PROD_SEED=1 npx tsx scripts/importing/seed_demo_members.ts
```

The script is idempotent. Running it multiple times updates existing demo members.

## Demo Members

| Email | Name | Expected State | Description |
|-------|------|----------------|-------------|
| demo.pending@sbnc.example | Penny Pending | `pending_new` | Application pending approval |
| demo.newbie@sbnc.example | Nancy Newbie | `active_newbie` | Joined 80 days ago, 10 days until transition |
| demo.member@sbnc.example | Mary Member | `active_member` | Joined 200 days ago, standard member |
| demo.offer_extended@sbnc.example | Oscar Offerwaiting | `offer_extended` | Joined 750 days ago, past 2-year mark |
| demo.extended@sbnc.example | Edna Extended | `active_extended` | Extended membership accepted |
| demo.lapsed@sbnc.example | Larry Lapsed | `lapsed` | Membership ended |
| demo.suspended@sbnc.example | Sam Suspended | `suspended` | Admin suspended |
| demo.unknown@sbnc.example | Uma Unknown | `unknown` | Needs admin review |

## Demo Walkthrough

### 1. Access the Demo Dashboard

Navigate to: `/admin/demo`

The dashboard shows:
- System status (database, email, environment)
- **Lifecycle State Demo** section (highlighted in yellow)
- Work queue (events, registrations, governance)

### 2. Review Lifecycle Demo Section

The Lifecycle State Demo section displays all demo members in a table:

| Column | Description |
|--------|-------------|
| Member | Name (linked to member detail) and email |
| Status / Tier | Current membership status badge and tier |
| Days | Days since join date |
| Lifecycle State | Computed state code |
| Description | Brief explanation of the state |

### 3. Demonstrate Individual Members

Click any member name to open their detail page with the lifecycle explainer panel.

**Recommended demo sequence:**

1. **Penny Pending (`pending_new`)** - Start of the journey
   - Point out: "Penny just submitted her application 5 days ago"
   - Explain: "She's waiting for approval to become a member"

2. **Nancy Newbie (`active_newbie`)** - Show the 90-day countdown
   - Point out: "Nancy joined 80 days ago, so she has 10 days left in her newbie period"
   - Explain: "After 90 days, she'll automatically transition to regular member"

3. **Mary Member (`active_member`)** - Standard membership
   - Point out: "Mary is past her newbie period but before the 2-year mark"
   - Explain: "She'll receive an extended membership offer at the 2-year mark"

4. **Oscar Offerwaiting (`offer_extended`)** - Transition point
   - Point out: "Oscar has passed his 2-year mark but hasn't responded yet"
   - Explain: "The system detected he's eligible for extended membership"

5. **Edna Extended (`active_extended`)** - Fully transitioned
   - Point out: "Edna accepted her offer and paid for extended membership"
   - Explain: "Extended members have demonstrated long-term commitment"

6. **Larry Lapsed (`lapsed`)** - End state
   - Point out: "Larry's membership has ended"
   - Explain: "His record is preserved but he has no active privileges"

7. **Sam Suspended (`suspended`)** - Admin action
   - Point out: "Sam is suspended by an administrator"
   - Explain: "This requires admin action to resolve"

8. **Uma Unknown (`unknown`)** - Data issue
   - Point out: "Uma's status couldn't be determined"
   - Explain: "This requires admin review to fix data inconsistencies"

### 4. Explain the State Machine

Show how states flow:

```
not_a_member → pending_new → active_newbie → active_member → offer_extended → active_extended → lapsed
                   ↓             ↓              ↓              ↓              ↓
               (rejected)    suspended      suspended      lapsed        suspended
```

Key transitions:
- **Automatic (time-based)**: newbie → member (90 days), member → offer (2 years)
- **Manual (admin)**: suspension, lifting suspension
- **User action**: accepting/declining extended offer, payment

## API Endpoint

The demo section fetches data from:

```
GET /api/admin/demo/lifecycle-members
```

Response format:
```json
{
  "members": [
    {
      "id": "uuid",
      "name": "Nancy Newbie",
      "email": "demo.newbie@sbnc.example",
      "status": "active",
      "statusLabel": "Active",
      "tier": "newbie_member",
      "tierName": "Newbie Member",
      "joinedAt": "2024-09-29T00:00:00.000Z",
      "daysSinceJoin": 80,
      "expectedLifecycleState": "active_newbie",
      "stateLabel": "Active Newbie",
      "description": "Approved member in their first 90 days...",
      "inferenceReason": "Active member with Newbie tier and within 90-day window (80 days since join).",
      "narrative": "This member joined 80 days ago and is in their newbie welcome period...",
      "nextTransitions": [
        {
          "event": "newbie_90_days_elapsed",
          "toState": "active_member",
          "condition": "90 days since join date",
          "isAutomatic": true,
          "estimatedDate": "2024-12-28T00:00:00.000Z"
        }
      ],
      "milestones": {
        "newbieEndDate": "2024-12-28T00:00:00.000Z",
        "twoYearMark": "2026-09-29T00:00:00.000Z",
        "isNewbiePeriod": true,
        "isPastTwoYears": false
      }
    }
  ],
  "timestamp": "2024-12-18T00:00:00.000Z"
}
```

Key fields for demo:

- `inferenceReason`: Explains exactly why this state was computed
- `narrative`: Human-readable story for live demo
- `nextTransitions`: What happens next, with dates if automatic
- `milestones`: Key dates for this member's lifecycle

## Troubleshooting

**No demo members shown:**
- Run the seed script: `npx tsx scripts/importing/seed_demo_members.ts`
- Verify membership statuses/tiers are seeded first

**Wrong lifecycle state computed:**
- Check the `joinedAt` date calculation in the seed script
- The `daysAgo()` function calculates relative to current date

**API returns 401/403:**
- Ensure admin authentication is configured
- In development, `x-admin-test-token: dev-admin-token` header is used

---

## Why This Is Difficult in Wild Apricot

Wild Apricot's architecture makes deterministic lifecycle tracking difficult or impossible:

### 1. Membership Levels Are Flat, Not Hierarchical

WA treats membership levels as independent categories (e.g., "Newcomer", "Extended Newcomer") without explicit relationships. There is no way to express "Extended Newcomer follows Newcomer after 2 years" in the data model.

**Murmurant approach:** Explicit `MembershipTier` with `code` field enables programmatic transitions. The state machine is defined in code, not implied by naming conventions.

### 2. No Native Time-Based Transitions

WA has no built-in support for "after 90 days, change tier" rules. Operators must manually track milestones or build external automations.

**Murmurant approach:** `joinedAt` + deterministic inference. The system computes lifecycle state on-read, so time-based transitions happen automatically without cron jobs or manual intervention.

### 3. Hidden State in Renewal Workflows

WA's renewal system conflates payment status, membership status, and renewal offers. A member can be "active" but past their renewal window, or "pending" without clear indication why.

**Murmurant approach:** Explicit state separation. `MembershipStatus` (administrative state) is separate from lifecycle inference (computed state). No hidden renewal flags.

### 4. No Audit Trail for Lifecycle Changes

WA provides limited visibility into why a member's status changed. Manual changes are logged inconsistently.

**Murmurant approach:** All state changes produce audit log entries with actor ID, timestamp, and reason. Lifecycle inference is deterministic and inspectable.

---

## Failures This Design Prevents

| Failure Mode | Wild Apricot Risk | Murmurant Prevention |
|--------------|-------------------|-------------------|
| **Silent expiry** | Members lapse without notification | Explicit `lapsed` state with transition tracking |
| **Missed 2-year offers** | Manual tracking required | Automatic `offer_extended` state at 730 days |
| **Newbie period confusion** | "When did they join?" requires lookup | `daysSinceJoin` computed and displayed |
| **Admin confusion** | "Why is this member showing X?" | `inferenceReason` explains every state |
| **Inconsistent reporting** | Queries depend on naming conventions | Queries use `membershipStatusCode` and `membershipTierCode` |
| **Manual reconciliation** | Spreadsheet + WA + email | Single source of truth with full explanation |

---

## What Is NOT Implemented

This demo shows lifecycle inference, NOT production workflows:

| Feature | Status | Notes |
|---------|--------|-------|
| **Lifecycle inference** | Implemented | Read-only, deterministic |
| **Explainer panel** | Implemented | Shows inputs → state → next steps |
| **Demo fixtures** | Implemented | Idempotent seed script |
| **Payment processing** | NOT implemented | No Stripe integration |
| **Renewal flows** | NOT implemented | No automated emails |
| **Extended offer acceptance** | NOT implemented | No self-service UI |
| **Suspension workflow** | NOT implemented | Admin action only, no UI |
| **Migration scripts** | NOT implemented | Demo uses seeded data only |
| **Background jobs** | NOT implemented | No scheduled tasks |

The demo proves the **data model is correct** and the **logic is deterministic**. Production workflows are a future phase.

## Related Documentation

- [Membership Lifecycle State Machine](../MEMBERSHIP/MEMBERSHIP_LIFECYCLE_STATE_MACHINE.md)
- [Membership Model Truth Table](../MEMBERSHIP/MEMBERSHIP_MODEL_TRUTH_TABLE.md)
- [Demo Guide](../DEMO_GUIDE.md)
