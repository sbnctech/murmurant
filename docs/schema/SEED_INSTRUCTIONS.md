# Database Seed Instructions

This document explains how to seed the Murmurant development database with sample data.

## Quick Start

```bash
# Ensure database is running and migrated
npm run prisma:migrate

# Run the seed script
npm run db:seed
```

## What Gets Seeded

The seed script creates minimal, coherent data for local development:

| Entity | Count | Details |
|--------|-------|---------|
| MembershipStatus | 5 | PROSPECT, NEWCOMER, EXTENDED, ALUMNI, LAPSED |
| Member | 2 | Alice Chen (Extended), Carol Johnson (Newcomer) |
| UserAccount | 1 | alice@example.com (admin) |
| Event | 4 | 3 published (Social, Outdoors categories), 1 draft |
| EventRegistration | 4 | 3 confirmed, 1 waitlisted |

## Running the Seed

### Via npm script

```bash
npm run db:seed
```

### Via Prisma CLI

```bash
npx prisma db seed
```

## Idempotency

The seed script is idempotent - running it multiple times produces the same result. It clears all existing data before inserting, so:

- Running twice produces identical results
- Use it to reset to a known state
- **Never run against production**

## Safety Checks

The script includes safety checks to prevent accidental production seeding:

1. Refuses to run if `NODE_ENV=production`
2. Refuses if DATABASE_URL contains "production", "prod.", or ".com"

## Seed Data Details

### Admin User

- **Email:** alice@example.com
- **Name:** Alice Chen
- **Role:** Extended Member (board eligible)
- **Password:** Demo hash only - not a real bcrypt hash

### Test Member

- **Email:** carol@example.com
- **Name:** Carol Johnson
- **Role:** Newcomer
- **Registration:** Confirmed for Welcome Coffee event

### Sample Events

| Title | Category | Date | Capacity | Status |
|-------|----------|------|----------|--------|
| Welcome Coffee | Social | 2025-07-15 | 20 | Published |
| Morning Hike at Rattlesnake Canyon | Outdoors | 2025-06-10 | 15 | Published |
| Summer Beach Picnic | Social | 2025-08-20 | 50 | Published |
| Draft Event | Social | 2025-09-01 | 10 | Draft |

Events span June through September for date filter testing, with both Social and Outdoors categories.

## Extending the Seed

For the full seed data specification with 12 members, 8 events, committees, and roles, see `docs/schema/SEED_DATA_PLAN.md`.

To add more seed data, edit `prisma/seed.ts` following the existing patterns:

1. Add data to the appropriate `seed*()` function
2. Use `upsert` for entities with unique constraints
3. Maintain foreign key order (statuses before members, etc.)

## Troubleshooting

### "DATABASE_URL not set"

Ensure `.env` file exists with a valid PostgreSQL connection string:

```
DATABASE_URL="postgresql://user:pass@localhost:5432/murmurant_dev"
```

### "Production environment detected"

The script refuses to run against production databases. Check your DATABASE_URL.

### Prisma client errors

Regenerate the Prisma client:

```bash
npm run prisma:generate
```
