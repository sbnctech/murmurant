# Lifecycle Demo Fixtures

This document describes the demo member fixtures used to demonstrate the Membership Lifecycle Explainer.

## Quick Start

### Seed Demo Members

```bash
# Dry run (preview only)
DRY_RUN=1 npx tsx scripts/importing/seed_demo_members.ts

# Live (creates/updates demo members)
npx tsx scripts/importing/seed_demo_members.ts
```

### Prerequisites

Before running the seeder, ensure these exist:

1. **MembershipStatus records** - Run: `npx tsx scripts/importing/seed_membership_statuses.ts`
2. **MembershipTier records** - Run: `npx tsx scripts/importing/seed_membership_tiers.ts`

### View Demo Members

Navigate to `/admin/demo` and scroll to the "Lifecycle State Demo" section.

---

## Demo Member Fixtures

| Email | Name | Expected State | Days Since Join | Description |
|-------|------|----------------|-----------------|-------------|
| demo.pending@sbnc.example | Penny Pending | pending_new | 5 | Membership application pending approval |
| demo.newbie@sbnc.example | Nancy Newbie | active_newbie | 80 | In 90-day welcome period, 10 days remaining |
| demo.member@sbnc.example | Mary Member | active_member | 200 | Standard member, 530 days to 2-year mark |
| demo.offer_extended@sbnc.example | Oscar Offerwaiting | offer_extended | 750 | 2-year mark passed, offer pending |
| demo.extended@sbnc.example | Edna Extended | active_extended | 800 | Extended membership accepted and paid |
| demo.lapsed@sbnc.example | Larry Lapsed | lapsed | 900 | Membership ended |
| demo.suspended@sbnc.example | Sam Suspended | suspended | 300 | Temporarily suspended |
| demo.unknown@sbnc.example | Uma Unknown | unknown | 100 | Tier unknown, needs admin review |

---

## Why Each Fixture Is Interesting

### pending_new (Penny Pending)

- **Shows**: Application pending state before approval
- **Demo point**: Members start here, must be approved to become active
- **Next transition**: join_approved -> active_newbie

### active_newbie (Nancy Newbie)

- **Shows**: Early membership in the 90-day welcome period
- **Demo point**: Special onboarding period with countdown to regular member
- **Next transition**: newbie_90_days_elapsed -> active_member (automatic)

### active_member (Mary Member)

- **Shows**: Standard membership after newbie period
- **Demo point**: Most members are in this state; shows path to extended offer
- **Next transition**: two_year_mark_reached -> offer_extended (automatic)

### offer_extended (Oscar Offerwaiting)

- **Shows**: Critical decision point at 2-year anniversary
- **Demo point**: Member must decide to continue or let membership lapse
- **Next transitions**: extended_paid -> active_extended OR payment_failed -> lapsed

### active_extended (Edna Extended)

- **Shows**: Long-term committed member
- **Demo point**: Full privileges, paid extended dues
- **Next transition**: membership_end_reached -> lapsed (when term ends)

### lapsed (Larry Lapsed)

- **Shows**: Terminal state when membership ends
- **Demo point**: Historical record preserved, no privileges
- **Next transition**: None (rejoin creates new application)

### suspended (Sam Suspended)

- **Shows**: Administrative hold on membership
- **Demo point**: Privileges revoked until admin action
- **Next transition**: suspension_lifted -> restored state

### unknown (Uma Unknown)

- **Shows**: Data quality issue requiring attention
- **Demo point**: Sometimes tier is missing or unmapped; admin must fix
- **Next transition**: Manual admin intervention required

---

## Click Path for Demo

1. Start at `/admin/demo`
2. Find the "Lifecycle State Demo" section
3. Click any member name to jump to their detail page
4. The page scrolls to the `#lifecycle` anchor showing the explainer panel

### Recommended Demo Order

For a 2-3 minute walkthrough:

1. **Penny Pending** - Show the starting point (pending application)
2. **Nancy Newbie** - Show early membership with countdown timer
3. **Oscar Offerwaiting** - Show the critical 2-year decision point
4. **Edna Extended** - Show successful extended member
5. **Larry Lapsed** - Show what happens if offer declined/expired

---

## 2-3 Minute Demo Script

### Opening (30 seconds)

"Let me show you Murmurant's membership lifecycle explainer. Every member goes through a journey from application to either extended membership or lapse."

### Walkthrough (2 minutes)

Navigate to `/admin/demo` and click on demo members:

1. **Penny Pending** (15 seconds)
   "This is a new applicant. They've applied but aren't approved yet. See the pending_new state here."

2. **Nancy Newbie** (20 seconds)
   "Once approved, members enter their 90-day welcome period. Notice the countdown - she has 10 days left before becoming a regular member."

3. **Oscar Offerwaiting** (30 seconds)
   "This is the key transition point. Oscar reached his 2-year anniversary and received an extended membership offer. The panel shows he needs to accept and pay, or his membership will lapse."

4. **Edna Extended** (20 seconds)
   "Edna accepted her offer. She's now an extended member with full privileges. The system tracks her journey from newbie to extended."

5. **Larry Lapsed** (15 seconds)
   "If someone doesn't respond to the offer or declines, they become lapsed. Their history is preserved but they have no active privileges."

### Closing (30 seconds)

"This explainer panel helps admins understand any member's status at a glance. It shows how they got there, what data we're using, and what happens next. All read-only - just insight into the state machine."

---

## Technical Details

### Lifecycle State Inference

The lifecycle state is computed by `inferLifecycleState()` in `src/lib/membership/lifecycle.ts`.

Key rules:

1. Non-active statuses (lapsed, suspended, pending_new) map directly
2. Active status + tier determines sub-state:
   - newbie_member + within 90 days = active_newbie
   - member + before 2 years = active_member
   - member + after 2 years = offer_extended
   - extended_member = active_extended
3. Unknown tier = unknown state (needs admin review)

### API Endpoint

```
GET /api/v1/admin/members/:id/lifecycle
```

Returns full lifecycle explanation including:

- Current state and description
- Inference reason
- Relevant data (status, tier, join date, days since join)
- Milestones (90-day end, 2-year mark)
- Possible next transitions

### Demo Members API

```
GET /api/admin/demo/lifecycle-members
```

Returns all demo members with computed lifecycle states for the demo dashboard.

---

## Resetting Demo Data

To reset demo members to fresh state:

```bash
npx tsx scripts/importing/seed_demo_members.ts
```

This is idempotent - running it again updates existing demo members to their canonical state.

---

## Files Reference

| File | Purpose |
|------|---------|
| scripts/importing/seed_demo_members.ts | Creates/updates demo member fixtures |
| scripts/importing/seed_membership_statuses.ts | Seeds MembershipStatus codes |
| scripts/importing/seed_membership_tiers.ts | Seeds MembershipTier codes |
| src/lib/membership/lifecycle.ts | Lifecycle state inference logic |
| src/app/api/v1/admin/members/[id]/lifecycle/route.ts | Lifecycle API endpoint |
| src/app/api/admin/demo/lifecycle-members/route.ts | Demo members list API |
| src/app/admin/demo/page.tsx | Demo dashboard with lifecycle section |
| src/app/admin/members/[id]/LifecycleExplainerPanel.tsx | Lifecycle explainer UI component |
