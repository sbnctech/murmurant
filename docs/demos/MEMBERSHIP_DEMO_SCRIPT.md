# Membership Truth Surfaces - Demo Script

**Purpose:** Walk through the membership clarity features in Murmurant
**Duration:** 5-7 minutes
**Prerequisites:** Server running at localhost:3000, database seeded with members

---

## Demo Setup

Before starting:

```bash
npm run dev
# Visit http://localhost:3000/admin/demo
```

Ensure you have at least 10-20 members in the database with varied:
- Membership statuses (active, lapsed, pending)
- Membership tiers (newbie, member, extended)
- Join dates (within 90 days, 1-2 years ago, 3+ years ago)

---

## Part 1: Demo Dashboard (30 seconds)

### URL: `/admin/demo`

**What to show:**

1. Quick links bar at top - point out "Member List with Lifecycle Hints"
2. System status section - show database is connected
3. Mention this is the starting point for all demos

**What to say:**

> "This is the demo dashboard - a purpose-built view for showing stakeholders what Murmurant can do. The system status shows we're connected and have X members in the database. Let's look at how we've solved the membership visibility problem."

---

## Part 2: Member List with Lifecycle Hints (2 minutes)

### URL: `/admin/demo/members`

**What to show:**

1. **Table columns:** Name, Email, Status, Tier, Joined, Lifecycle
2. **Status badges:** Color-coded by membership status
   - Green = Active
   - Yellow = Pending
   - Red = Lapsed/Suspended
3. **Tier badges:** Color-coded by membership tier
   - Blue = Newbie Member
   - Gray = Standard Member
   - Purple = Extended Member
4. **Lifecycle hints:** The key differentiator from Wild Apricot
   - "Newbie expires in X days" (green/orange/red based on urgency)
   - "Extended (Third Year)"
   - "Member for X years"
   - "Status pending"

**What to demonstrate:**

1. **Filter by status:** Click the Status dropdown, select "Lapsed"
   - "We can instantly see all lapsed members who need renewal outreach"
2. **Filter by tier:** Click the Tier dropdown, select "Extended Member"
   - "These are our most tenured members - the club's backbone"
3. **Clear filters and paginate:** Show there's real data behind this

**What to say:**

> "Unlike Wild Apricot, Murmurant shows membership status AND tier at a glance. The 'Lifecycle' column is derived data - we calculate where each member is in their journey. See this newbie with 'expires in 12 days'? The system knows their 90-day orientation period is ending soon. This is the kind of visibility the membership committee has been asking for."

---

## Part 3: Member Detail with Lifecycle Explainer (3 minutes)

### URL: Click any member name in the list

**What to show:**

1. Basic member info at top (name, email, status)
2. Scroll down to the **Membership Lifecycle** panel
3. **Expand the panel** (should be expanded by default)

**Lifecycle Panel Sections:**

1. **Current Status (narrative):**
   - Demo-friendly explanation in plain English
   - Example: "Jane is an active member in their first 90 days (newbie period). They joined on December 1, 2024 and have 47 days remaining in the newbie period."

2. **State badge:**
   - Color-coded state (Active Newbie, Active Member, etc.)

3. **How This Was Determined:**
   - Shows the raw data that led to the inference
   - Membership Status: Active
   - Membership Tier: Newbie Member
   - Join Date: Dec 1, 2024
   - Days Since Join: 43

4. **Membership Milestones:**
   - 90-Day Newbie Period: Shows when it ends
   - 2-Year Mark (Extended Offer): Shows target date
   - Visual indicators show which milestones are complete vs upcoming

5. **What Happens Next:**
   - Possible transitions with conditions
   - Example: "Newbie 90 Days Elapsed → Active Member (automatic)"
   - Shows estimated dates for automatic transitions

**What to demonstrate:**

1. Click on a **newbie member** - show the "Newbie expires in X days" narrative
2. Click on an **extended member** - show "Extended (Third Year)" state
3. Click on a **lapsed member** - show the different state and transitions
4. Point out the "What Happens Next" section - these are the state machine transitions

**What to say:**

> "This is what was missing from Wild Apricot. The system tells you not just WHERE a member is, but HOW they got there and WHAT happens next. This is based on an explicit state machine - no guesswork. The membership chair can look at this and immediately understand the member's journey."

---

## Part 4: Closing Points (1 minute)

**Return to:** `/admin/demo/members`

**What to say:**

> "Let me summarize what we've seen:
>
> 1. **Status and Tier are separate** - Active/Lapsed is different from Newbie/Extended. This lets us answer questions like 'How many active extended members do we have?'
>
> 2. **Lifecycle hints are derived** - The system calculates where each member is based on their join date and current status. No manual entry needed.
>
> 3. **Next steps are explicit** - When a member's status will change, and why. This is a state machine, not a spreadsheet.
>
> 4. **This is all read-only** - We're not changing member data here, just surfacing what the system knows. All actual status changes go through proper workflows with audit trails."

---

## Demo Data Points to Prepare

Have ready examples of:

- [ ] A newbie member with < 30 days remaining (shows urgency)
- [ ] A newbie member with 60+ days remaining (shows green lifecycle hint)
- [ ] A standard member with 1-2 years tenure
- [ ] An extended member (third year)
- [ ] A lapsed member (shows different lifecycle)
- [ ] A member with "unknown" tier (shows data quality issue)

---

## Troubleshooting

**"Loading members..." spinner never stops:**
- Check the browser console for errors
- Verify `/api/admin/demo/member-list` endpoint is responding
- Check that the test auth token is being accepted

**Lifecycle panel shows error:**
- Verify `/api/v1/admin/members/:id/lifecycle` endpoint is responding
- Check that the member has a valid `membershipStatus` FK

**No members in the list:**
- Run the WA sync or seed the database
- Check filters aren't hiding all results

---

## Related Documentation

- [MEMBERSHIP_MODEL_TRUTH_TABLE.md](../MEMBERSHIP_MODEL_TRUTH_TABLE.md) - How status and tier are modeled
- [MEMBERSHIP_LIFECYCLE_STATE_MACHINE.md](../MEMBERSHIP_LIFECYCLE_STATE_MACHINE.md) - The state machine definition
- [WA_FULL_SYNC_VERIFICATION.md](../WA_FULL_SYNC_VERIFICATION.md) - How data gets into the system

---

*Demo script created December 2024 for Murmurant stakeholder review*
