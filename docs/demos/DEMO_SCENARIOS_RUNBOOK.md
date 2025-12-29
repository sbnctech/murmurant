# Demo Scenarios Runbook

This document describes how to set up and run the Murmurant demo dashboard with
pre-configured scenarios for demonstrating key features.

---

## Overview

The demo dashboard (`/admin/demo`) provides a control panel with scenario cards
and deep links for:

- **Officer Roles**: Members with specific club roles (President, VP Activities, Secretary, etc.)
- **Lifecycle States**: Members demonstrating each membership lifecycle state
- **Event States**: Events in different states (upcoming, past, full, draft)

Each scenario card links directly to a real entity in the database, making it
easy to navigate during demos.

---

## Quick Start

### 1. Seed Demo Data

Run the seed script to create demo fixtures:

```bash
# Preview mode (no changes)
DRY_RUN=1 npx tsx scripts/demo/seed_demo_scenarios.ts

# Execute
npx tsx scripts/demo/seed_demo_scenarios.ts
```

This creates:

- Demo officers at `@sbnc.example` domain
- Demo committees with role assignments
- Demo events in various states
- Lifecycle demo members (if `seed_demo_members.ts` was also run)

### 2. Access the Demo Dashboard

Navigate to: `/admin/demo`

The page shows:

- **System Status**: Database connectivity, email config, environment
- **Demo Scenario Cards**: Quick-access cards organized by category
- **Lifecycle Table**: Alternative table view of lifecycle states
- **Work Queue**: Upcoming events, registrations, governance items

---

## Demo Scenarios

### Officer Roles

| Role            | Demo Email                      | Demonstrates                           |
|-----------------|---------------------------------|----------------------------------------|
| President       | demo.president@sbnc.example     | Full visibility, approval authority    |
| VP Activities   | demo.vp-activities@sbnc.example | Event management, transitions          |
| Secretary       | demo.secretary@sbnc.example     | Minutes workflow (draft, submit)       |
| Parliamentarian | demo.parliamentarian@sbnc.example | Governance flags, annotations        |
| Event Chair     | demo.eventchair@sbnc.example    | Event-scoped permissions               |
| Webmaster       | demo.webmaster@sbnc.example     | Publishing without member data access  |

### Lifecycle States

| State           | Demonstrates                                         |
|-----------------|------------------------------------------------------|
| Active Newbie   | 90-day countdown, newbie transitions                 |
| Active Member   | Standard member, 2-year milestone                    |
| Extended Member | Third-year member with extended privileges           |
| Lapsed          | Historical record, reactivation path                 |
| Pending New     | Pre-approval state                                   |
| Suspended       | Admin suspension state                               |
| Unknown         | Data quality flag requiring review                   |

### Event States

| State              | Demonstrates                                      |
|--------------------|---------------------------------------------------|
| Upcoming (Open)    | Registration flow for open event                  |
| Full (Waitlist)    | Capacity limits and waitlist management           |
| Past Event         | Historical event with registrations               |
| Draft Event        | Unpublished planning state                        |
| Unlimited Capacity | Free events with no limit                         |

---

## API Endpoint

### GET /api/admin/demo/scenarios

Returns all demo scenarios with deep links.

**Auth**: Requires `admin:full` capability

**Response**:

```json
{
  "scenarios": [
    {
      "category": "role",
      "id": "role-president",
      "role": "president",
      "label": "President",
      "description": "...",
      "member": { "id": "...", "name": "...", "email": "..." },
      "deepLink": "/admin/members/...",
      "demoNotes": "..."
    }
  ],
  "summary": {
    "total": 18,
    "available": 15,
    "missing": 3,
    "byCategory": {
      "lifecycle": { "total": 7, "available": 5 },
      "role": { "total": 6, "available": 6 },
      "event": { "total": 5, "available": 4 }
    }
  }
}
```

---

## 10-Minute Demo Flow

### Suggested Path

1. **Start at Demo Dashboard** (`/admin/demo`)
   - Show system status (database connected, email configured)
   - Point out the scenario cards

2. **Officer Roles** (2 min)
   - Click President card, show member detail
   - Navigate to transitions to show approval authority
   - Return to demo dashboard

3. **Lifecycle States** (3 min)
   - Click Active Newbie card
   - Show Lifecycle Explainer panel (90-day countdown)
   - Click Active Member card (2-year milestone)
   - Show how state is inferred from data

4. **Event Management** (3 min)
   - Click Upcoming (Open) event
   - Show registration flow
   - Click Full (Waitlist) event
   - Show waitlist management

5. **Governance** (2 min)
   - Click Parliamentarian card
   - Navigate to governance annotations
   - Show flag creation workflow

---

## Resetting Demo Data

To reset demo-specific data (registrations, challenges):

```bash
npx ts-node scripts/demo/reset-demo-data.ts
```

This preserves:

- Members
- Events
- Governance records

---

## Files Reference

| File                                          | Purpose                              |
|-----------------------------------------------|--------------------------------------|
| `scripts/demo/seed_demo_scenarios.ts`         | Seed script for all demo fixtures    |
| `scripts/importing/seed_demo_members.ts`      | Seed script for lifecycle members    |
| `scripts/demo/reset-demo-data.ts`             | Reset demo-specific data             |
| `src/app/admin/demo/page.tsx`                 | Demo dashboard page                  |
| `src/app/admin/demo/DemoScenarioCards.tsx`    | Scenario cards component             |
| `src/app/api/admin/demo/scenarios/route.ts`   | Scenarios API endpoint               |
| `tests/api/admin/demo-scenarios.spec.ts`      | API tests                            |
| `tests/admin/admin-demo-dashboard.spec.ts`    | Playwright smoke tests               |

---

## Rollback

To remove demo fixtures:

1. Delete members with `@sbnc.example` email domain:

   ```sql
   DELETE FROM "Member" WHERE email LIKE '%@sbnc.example';
   ```

2. Delete demo events:

   ```sql
   DELETE FROM "Event" WHERE title LIKE 'Demo:%';
   ```

3. Delete demo committees (if created):

   ```sql
   DELETE FROM "Committee" WHERE slug IN (
     'executive-board', 'activities', 'communications'
   );
   ```

**Note**: These deletions cascade to related records. Use with caution.

---

## Troubleshooting

### "No matching member" on scenario cards

Run the seed script:

```bash
npx tsx scripts/demo/seed_demo_scenarios.ts
```

### Database connection errors

Check `DATABASE_URL` in `.env`:

```bash
DATABASE_URL="postgresql://murmurant:murmurant@localhost:5432/murmurant_dev"
```

### Permission denied errors

Ensure you're using admin authentication. In development, add:

```
Authorization: Bearer test-admin-token
```

Or use the dev session cookie.

---

## What Changed (Dec 2025)

- Added `scripts/demo/seed_demo_scenarios.ts` for comprehensive demo fixtures
- Extended `/api/admin/demo/scenarios` to include roles and events
- Created `DemoScenarioCards.tsx` component with categorized scenario cards
- Added API and Playwright tests
- Created this runbook

---

*Last updated: December 2025*
