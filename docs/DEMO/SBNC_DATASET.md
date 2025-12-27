# SBNC Demo Dataset

This document describes the canonical demo dataset for SBNC evaluation scenarios.

## Purpose

The SBNC demo dataset provides realistic but safe test data for:

- Demo spine walkthrough
- Migration dry-run testing
- Calendar export verification
- Payment processing demos
- Membership lifecycle demos

## Safety Guarantees

- **No real data**: All names, emails, and phone numbers are fictional
- **Non-deliverable emails**: All emails use `@sbnc-demo.example` domain
- **Clearly marked**: All demo events prefixed with `[DEMO]`
- **No production credentials**: No real payment processor or API keys
- **Idempotent**: Safe to run multiple times

## Dataset Contents

### Members (15)

| Name | Email | Status | Join Date | Notes |
|------|-------|--------|-----------|-------|
| Margaret Montecito | margaret.montecito@sbnc-demo.example | Extended | 3 years ago | Active volunteer, past board |
| Robert Riviera | robert.riviera@sbnc-demo.example | Extended | 4 years ago | Hiking group leader |
| Susan Stearns | susan.stearns@sbnc-demo.example | Extended | 2 years ago | Event host |
| William Waterfront | william.waterfront@sbnc-demo.example | Extended | 5 years ago | Founding member |
| Patricia Paseo | patricia.paseo@sbnc-demo.example | Extended | 3 years ago | VP Activities |
| James Jardine | james.jardine@sbnc-demo.example | Newcomer | 90 days ago | Recent joiner |
| Linda Laguna | linda.laguna@sbnc-demo.example | Newcomer | 180 days ago | Welcome coffee recruit |
| Michael Mission | michael.mission@sbnc-demo.example | Newcomer | 45 days ago | Brand new |
| Elizabeth Eastside | elizabeth.eastside@sbnc-demo.example | Newcomer | 1 year ago | Near extended status |
| David Downtown | david.downtown@sbnc-demo.example | Newcomer | 60 days ago | Active in groups |
| Barbara Beachside | barbara.beachside@sbnc-demo.example | Alumni | 8 years ago | Past President |
| Richard Rancho | richard.rancho@sbnc-demo.example | Alumni | 6 years ago | Occasional attendee |
| Nancy Noleta | nancy.noleta@sbnc-demo.example | Lapsed | 2 years ago | Expired 30 days ago |
| Thomas Trigo | thomas.trigo@sbnc-demo.example | Lapsed | 3 years ago | Lapsed 6 months |
| Jennifer Junipero | jennifer.junipero@sbnc-demo.example | Prospect | 14 days ago | Considering membership |

### Events (3)

| Event | Date | Location | Capacity | Fee |
|-------|------|----------|----------|-----|
| Welcome Coffee - New Member Orientation | 7 days from now | Faulkner Gallery | 30 | Free |
| Morning Hike - Inspiration Point | 14 days from now | Tunnel Road Trailhead | 15 | Free |
| Monthly Luncheon - Guest Speaker | 21 days from now | Santa Barbara Club | 50 | $35 |

### Registrations (7)

| Event | Member | Status | Payment |
|-------|--------|--------|---------|
| Monthly Luncheon | Margaret Montecito | Confirmed | $35 paid |
| Monthly Luncheon | Susan Stearns | Confirmed | $35 paid |
| Morning Hike | Robert Riviera | Confirmed | N/A |
| Morning Hike | James Jardine | Confirmed | N/A |
| Morning Hike | David Downtown | Confirmed | N/A |
| Welcome Coffee | Jennifer Junipero | Confirmed | N/A |
| Welcome Coffee | Michael Mission | Confirmed | N/A |

## Usage

### Seed the Demo Data

```bash
# Preview what will be created (no changes)
DRY_RUN=1 npx tsx scripts/seed/sbncDemo.ts

# Actually create the demo data
npx tsx scripts/seed/sbncDemo.ts
```

### Prerequisites

The main seed script must run first to create membership statuses:

```bash
npx prisma db seed
```

### Verify the Data

After seeding, verify via admin UI or database:

```sql
-- Count demo members
SELECT COUNT(*) FROM "Member"
WHERE email LIKE '%@sbnc-demo.example';

-- List demo events
SELECT title, "startTime", capacity
FROM "Event"
WHERE title LIKE '%[DEMO]%';

-- Check paid registrations
SELECT m."firstName", m."lastName", pi.amount, pi.status
FROM "EventRegistration" er
JOIN "Member" m ON er."memberId" = m.id
JOIN "PaymentIntent" pi ON pi."eventRegistrationId" = er.id
WHERE m.email LIKE '%@sbnc-demo.example';
```

## Demo Scenarios

### 1. Demo Spine Walkthrough

Use Patricia Paseo (VP Activities) to demonstrate:

- Event creation and approval workflow
- Registration management
- Payment processing for luncheon

### 2. Migration Dry-Run

The dataset supports testing WA-to-ClubOS migration:

- Member import with various statuses
- Event import with registrations
- Payment record verification

### 3. Calendar Export

Export demo events to verify:

- iCal format correctness
- Timezone handling (Pacific)
- Event details in description

### 4. Membership Lifecycle

Demonstrate status transitions:

- Prospect (Jennifer) -> Newcomer (application approved)
- Newcomer (Elizabeth) -> Extended (2-year anniversary)
- Lapsed (Nancy) -> Newcomer (renewal)
- Extended (anyone) -> Alumni (transition)

## Cleanup

To remove demo data:

```sql
-- Remove demo registrations
DELETE FROM "EventRegistration"
WHERE "memberId" IN (
  SELECT id FROM "Member"
  WHERE email LIKE '%@sbnc-demo.example'
);

-- Remove demo payment intents (orphans handled by cascade)

-- Remove demo events
DELETE FROM "Event"
WHERE title LIKE '%[DEMO]%';

-- Remove demo members
DELETE FROM "Member"
WHERE email LIKE '%@sbnc-demo.example';
```

## Design Decisions

### Why These Names?

Names are Santa Barbara-themed (neighborhoods, streets, landmarks) to feel
realistic while being obviously fictional. This helps evaluators connect
with the data while ensuring no confusion with real members.

### Why 15 Members?

Enough to demonstrate:

- Various membership statuses
- Realistic event attendance patterns
- Board eligibility differences
- Renewal scenarios

Not so many that the demo becomes cluttered.

### Why 3 Events?

Three events cover the main patterns:

1. **Free, open event** (Welcome Coffee): Prospect-friendly, no payment
2. **Free, capacity-limited** (Hike): Registration without payment
3. **Paid event** (Luncheon): Full payment workflow

### Why $35 Luncheon Fee?

Matches typical SBNC luncheon pricing, making cost comparisons realistic.

## Related Documentation

- [Demo Spine](/docs/DEMO_SPINE.md) - UI walkthrough script
- [Migration Guide](/docs/migration/MIGRATION_GUIDE.md) - WA migration process
- [Calendar Export](/docs/ARCH/CALENDAR_INTEROP_GUIDE.md) - iCal integration

---

*This dataset is for evaluation and demonstration only. No real member
information is included. The `@sbnc-demo.example` domain is not deliverable.*
