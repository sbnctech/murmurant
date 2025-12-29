# Database Migration Plan (v1 Baseline)

## Purpose

This document describes the first database migration for Murmurant. The v1 migration creates all the core tables needed to track members, committees, events, photos, and communications. After running this migration, the database will have a complete structure ready for development and testing, though it will contain no actual data until we run the seed script.

---

## Scope of v1 Schema

The first migration will create the following database tables:

- **Member** - Club members with contact information and membership status
- **MembershipStatus** - Lookup table defining membership levels (Newcomer, Extended, Alumni, etc.)
- **Committee** - Club committees (Board, Activities, Membership, etc.)
- **CommitteeRole** - Positions within committees (Chair, Vice Chair, Member)
- **Term** - Time periods for committee service (club years)
- **RoleAssignment** - Records of who served in what role during which term
- **UserAccount** - Login credentials for members with administrative access
- **Event** - Club activities (hikes, dinners, socials)
- **EventRegistration** - Member signups for events with status tracking
- **Photo** - Images uploaded to the system
- **PhotoAlbum** - Collections of photos, typically linked to events
- **EmailLog** - Record of emails sent through the system

The migration also creates:

- Two enums: RegistrationStatus and EmailStatus
- All foreign key constraints between tables
- Indexes for common query patterns
- Unique constraints to prevent duplicate data

---

## Idempotence and Safety

### Development Environment

This migration is designed for local development first. Developers will run it against their own PostgreSQL instances to set up a working database. The Prisma migration system tracks which migrations have been applied, so running the same migration twice will not cause errors or duplicate changes.

### Production Considerations

We are not ready for production yet. When the time comes to deploy to a real database with real member data, we will:

1. Review all migrations carefully before applying
2. Take a database backup first
3. Test the migration against a copy of production data
4. Have a rollback plan ready

For now, treat all data as disposable. The seed script can recreate demo data at any time.

### Running the Migration

To apply the v1 migration in development:

```
npx prisma migrate dev --name init
```

This command will:
1. Generate SQL from the Prisma schema
2. Apply the SQL to the database
3. Generate the Prisma Client for TypeScript

---

## Future Migrations

Later versions of Murmurant will likely add these features, each requiring new migrations:

- **Guest Support** - A Guest model for non-members who attend events, linked to EventRegistration. This allows tracking of prospective members and visitors.

- **Payments and Invoices** - Invoice and Payment models for tracking event fees, membership dues, and financial transactions. Will integrate with payment processors.

- **Audit Logging** - An AuditLog table to track who changed what and when. Important for sensitive operations like membership status changes and leadership transitions.

- **Recurring Events** - An EventSeries or RecurrenceRule model to support events that repeat on a schedule (monthly hikes, weekly socials). The system would auto-generate individual Event records.

- **Notification Preferences** - A MemberPreferences model to track email frequency, opt-out categories, and preferred contact methods.

- **SMS Support** - An SmsLog model similar to EmailLog for tracking text message communications.

Each future migration will follow the same pattern: update the Prisma schema, generate a migration, test locally, then apply to shared environments.

---

## Migration File Location

Prisma stores migration files in:

```
prisma/migrations/
```

Each migration gets a timestamped folder containing:
- `migration.sql` - The actual SQL that runs against the database
- Metadata files used by Prisma to track state

Do not manually edit migration files after they have been applied. If changes are needed, create a new migration instead.
