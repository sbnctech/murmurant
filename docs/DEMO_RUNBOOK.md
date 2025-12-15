# ClubOS Demo Runbook

This document provides step-by-step instructions for running a repeatable, low-risk demo of the ClubOS admin interface.

## Quick Start (One Command)

```bash
# Full demo setup in one command
make demo
```

Or manually:

```bash
npm run db:seed && npm run dev
```

## Prerequisites

- Node.js 18+
- PostgreSQL running locally
- `.env` file configured with `DATABASE_URL`

## Demo Environment Setup

### 1. Reset Database to Demo State

```bash
# Run the seed script to reset to known state
npm run db:seed
```

This creates:

- 2 members (Alice Chen, Carol Johnson)
- 4 events (3 published, 1 draft)
- 4 registrations (3 confirmed, 1 waitlisted)

### 2. Start Development Server

```bash
npm run dev
```

Server starts at http://localhost:3000

## Demo URLs

| URL | Description |
|-----|-------------|
| http://localhost:3000/admin | Admin dashboard home |
| http://localhost:3000/admin/members | Members explorer |
| http://localhost:3000/admin/events | Events explorer |
| http://localhost:3000/admin/registrations | Registrations explorer |

## Expected Demo Data

### Members

| Name | Email | Status |
|------|-------|--------|
| Alice Chen | alice@example.com | Extended Member (active) |
| Carol Johnson | carol@example.com | Newcomer (active) |

### Events

| Title | Category | Capacity | Published |
|-------|----------|----------|-----------|
| Welcome Coffee | Social | 20 | Yes |
| Morning Hike at Rattlesnake Canyon | Outdoors | 15 | Yes |
| Summer Beach Picnic | Social | 50 | Yes |
| Draft Event (not published) | Social | 10 | No |

### Registrations

| Member | Event | Status |
|--------|-------|--------|
| Carol Johnson | Welcome Coffee | CONFIRMED |
| Carol Johnson | Morning Hike | CONFIRMED |
| Alice Chen | Morning Hike | WAITLISTED |
| Alice Chen | Beach Picnic | CONFIRMED |

### Summary Stats

- Total members: 2
- Active members: 2
- Total events: 4
- Published events: 3
- Total registrations: 4
- Waitlisted: 1
- Confirmed: 3

## Demo Script

### 1. Dashboard Overview

1. Open http://localhost:3000/admin
2. Show summary stats: 2 members, 4 events, 4 registrations
3. Show recent activity feed

### 2. Members Management

1. Navigate to Members Explorer
2. Show both members listed
3. Click Alice Chen to show detail view
4. Show her registrations (Morning Hike - WAITLISTED, Beach Picnic - CONFIRMED)

### 3. Events Management

1. Navigate to Events Explorer
2. Show 3 published events (draft not shown in member view)
3. Click "Morning Hike" to show detail
4. Show registrations for this event (Carol CONFIRMED, Alice WAITLISTED)

### 4. Search

1. Return to dashboard
2. Search for "alice" - shows member and her registrations
3. Search for "hike" - shows Morning Hike event
4. Search for "xyz" - shows no results state

## Recovery Steps

### Problem: Database is in unknown state

```bash
# Reset to known demo state
npm run db:seed
```

### Problem: Server won't start

```bash
# Check environment
cat .env | grep DATABASE_URL

# Verify database connection
npx prisma db push

# Regenerate Prisma client
npx prisma generate
```

### Problem: Tests are failing

```bash
# Ensure database is in demo state
npm run db:seed

# Run tests
npm run test:admin
```

### Problem: Data looks wrong

1. Verify you're using local database (not production)
2. Re-run seed script
3. Check seed output for errors

## Test Verification

Run admin tests against demo data:

```bash
# Start server in background
npm run dev &

# Run admin tests
npm run test:admin

# Or with Playwright UI
npx playwright test --ui tests/admin/
```

### Expected Test Results

After seeding and running tests:

- Tests referencing demo seed should pass
- Tests should find Alice Chen, Carol Johnson
- Tests should find published events
- Tests should see CONFIRMED and WAITLISTED registrations

## Data Reference

For programmatic access to demo data constants, see:

```
tests/fixtures/demo-seed.ts
```

This file exports:

- `DEMO_MEMBERS` - Member data objects
- `DEMO_EVENTS` - Event data objects
- `DEMO_REGISTRATIONS` - Registration data objects
- `DEMO_SUMMARY` - Expected counts for dashboard

Tests import from this file to ensure consistency with seed data.

## Cleanup

After demo:

```bash
# Optional: clear all data
npx prisma db push --force-reset

# Re-seed for next demo
npm run db:seed
```

## Troubleshooting

### "Member not found" errors in tests

The seed data uses UUIDs, not mock IDs like `m1` or `e1`. Tests should:

1. Look up IDs via API using `lookupMemberIdByEmail()`
2. Or use the demo-helpers navigation functions

### Tests expect different names

Old tests may expect "Alice Johnson" or "Bob Smith". Update tests to use:

- Alice Chen (from `DEMO_MEMBERS.ALICE`)
- Carol Johnson (from `DEMO_MEMBERS.CAROL`)

### Count mismatches

Seed creates:

- 2 members (not 3)
- 4 events (not 2)
- 4 registrations (not 2)

Update hardcoded counts to use `DEMO_*_COUNT` constants.
