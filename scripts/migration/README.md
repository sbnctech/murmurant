# ClubOS Data Migration Pipeline

Wild Apricot (WA) → ClubOS data migration tool.

## Quick Start

```bash
# Dry run with sample data
npm run migrate:dry-run

# Dry run with real WA exports
npm run migrate:dry-run -- --data-dir ./wa-export

# Live import
npm run migrate:live -- --yes --data-dir ./wa-export
```

## Required WA Exports

### Members (Contacts → Export → CSV)
- Contact ID, First name, Last name, Email, Phone, Member since, Membership level

### Events (Events → Export)
- Event ID, Event name, Start date, End date, Location, Registration limit, Tags

### Registrations
- Registration ID, Contact ID, Event ID, Registration status, Registration date

## ID Reconciliation

- **Members**: Matched by email
- **Events**: Matched by title + start time (±1 hour)
- **Registrations**: Matched by member + event

Imports are **idempotent** - safe to re-run.

## Reset Tool

```bash
npm run migrate:reset                # Preview
npx tsx scripts/migration/reset-sandbox.ts --confirm "I understand this deletes data"
```

## Configuration

Edit `config/migration-config.yaml` for field mappings and status translations.

## Reports

Each run generates JSON reports in `scripts/migration/reports/`.
