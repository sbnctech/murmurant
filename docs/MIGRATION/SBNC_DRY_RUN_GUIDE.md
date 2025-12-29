# SBNC Migration Dry-Run Guide

This guide explains how to run a dry-run of the SBNC (Santa Barbara Newcomers Club) migration from Wild Apricot to Murmurant.

## Quick Start

```bash
npm run migration:dry-run:sbnc
```

## What It Does

The dry-run:

- **Reads** WA export CSV files from the SBNC data directory
- **Validates** all records against Murmurant schema and business rules
- **Counts** members, events, and registrations that would be created/updated
- **Reports** errors and warnings with source row numbers
- **Generates** preview artifacts for inspection
- **Never writes** to the database (enforced - cannot be overridden)

## Prerequisites

1. **Database connection** - The script needs to read existing data for deduplication checks:

   ```bash
   export DATABASE_URL="postgresql://..."
   ```

2. **CSV export files** - Place WA exports in the SBNC data directory (see below)

## Data Directory Structure

Place your Wild Apricot export files in:

```
scripts/migration/sbnc-data/
├── members/
│   └── wa-members-export.csv     # Required
├── events/
│   ├── wa-events-export.csv      # Optional
│   └── wa-registrations-export.csv  # Optional (requires events)
```

### Required CSV Columns

**Members** (`wa-members-export.csv`):

| Column | Description |
|--------|-------------|
| Contact ID | WA member ID (for ID mapping) |
| First name | Member first name |
| Last name | Member last name |
| Email | Member email (used for deduplication) |
| Phone | Optional phone number |
| Member since | Join date |
| Membership level | WA membership level name |

**Events** (`wa-events-export.csv`):

| Column | Description |
|--------|-------------|
| Event ID | WA event ID |
| Event name | Event title |
| Description | Event description |
| Tags | Category (e.g., "Luncheon", "Book Club") |
| Location | Event location |
| Start date | Event start date/time |
| End date | Event end date/time |
| Registration limit | Capacity (optional) |

**Registrations** (`wa-registrations-export.csv`):

| Column | Description |
|--------|-------------|
| Registration ID | WA registration ID |
| Contact ID | WA member ID (must match members file) |
| Event ID | WA event ID (must match events file) |
| Registration status | Status (Registered, Cancelled, etc.) |
| Registration date | When registered |
| Cancellation date | When cancelled (optional) |

## Running the Dry-Run

### Basic Run

```bash
npm run migration:dry-run:sbnc
```

### What You'll See

```
======================================================================
  SBNC Migration Dry-Run
  Santa Barbara Newcomers Club → Murmurant
======================================================================

  Mode:       DRY RUN (read-only, no database changes)
  Data Dir:   /path/to/scripts/migration/sbnc-data
  Reports:    /path/to/scripts/migration/reports/sbnc
  Timestamp:  2024-12-26T12:00:00.000Z

  Data Files:
    Members:       ✓ Found
    Events:        ✓ Found
    Registrations: ✓ Found

----------------------------------------------------------------------
  COUNTS (What Would Happen)
----------------------------------------------------------------------
  Members          150 total |   120 create |    30 update |     0 skip |     0 errors
  Events            45 total |    40 create |     5 update |     0 skip |     0 errors
  Registrations    320 total |   300 create |    20 update |     0 skip |     2 errors
----------------------------------------------------------------------
  TOTAL            515 total |   460 create |    55 update |     0 skip |     2 errors

----------------------------------------------------------------------
  ERRORS (2 total)
----------------------------------------------------------------------

  REGISTRATION (2):
    Row 156 [WA:12345]: Member not found for Contact ID: 999
    Row 287 [WA:12346]: Event not found for Event ID: 888

----------------------------------------------------------------------
  PREVIEW ARTIFACTS
----------------------------------------------------------------------
    /path/to/reports/sbnc/migration-dry-run-2024-12-26T12-00-00.json
    /path/to/reports/sbnc/sbnc-dry-run-summary-2024-12-26T12-00-00.json

======================================================================
  ⚠️  DRY RUN COMPLETE - 2 ERROR(S) DETECTED
     Review errors above before proceeding to live migration.

  Duration: 1234ms
  Run ID:   abc-123-def-456
======================================================================
```

## Understanding the Output

### Counts

| Field | Meaning |
|-------|---------|
| total | Number of rows in the CSV file |
| create | Records that would be created (new to Murmurant) |
| update | Records that would be updated (already exist, matched by email/title) |
| skip | Records that would be skipped (e.g., duplicates, invalid) |
| errors | Records with validation errors |

### Error Types

| Error | Cause | Resolution |
|-------|-------|------------|
| Member not found | Registration references unknown Contact ID | Ensure member exists in members CSV |
| Event not found | Registration references unknown Event ID | Ensure event exists in events CSV |
| Unknown status | Membership level not mapped | Add mapping in migration-config.yaml |
| Invalid date | Date format not recognized | Use ISO format or MM/DD/YYYY |
| Missing required field | Required column is empty | Fill in missing data in CSV |

## Preview Artifacts

The dry-run generates JSON files in `scripts/migration/reports/sbnc/`:

### Summary File (`sbnc-dry-run-summary-*.json`)

```json
{
  "timestamp": "2024-12-26T12:00:00.000Z",
  "mode": "DRY_RUN",
  "counts": {
    "members": { "total": 150, "wouldCreate": 120, ... },
    "events": { "total": 45, "wouldCreate": 40, ... },
    "registrations": { "total": 320, "wouldCreate": 300, ... }
  },
  "errors": [...],
  "warnings": [...]
}
```

### Full Report (`migration-dry-run-*.json`)

Contains complete record-level details including:

- Every parsed record with field values
- ID mapping (WA ID → Murmurant ID)
- Per-record action (create/update/skip)
- Per-record errors

## Safety Guarantees

1. **Read-only** - The dry-run script enforces `dryRun: true` and cannot be overridden
2. **Deterministic** - Same input produces same validation results
3. **Aborts on ambiguity** - Stops immediately if data directory or files are missing
4. **No side effects** - Does not modify any data, only reads and reports

## Troubleshooting

### "SBNC data directory not found"

Create the directory and add CSV files:

```bash
mkdir -p scripts/migration/sbnc-data/members
mkdir -p scripts/migration/sbnc-data/events
# Copy your CSV files into these directories
```

### "No CSV data files found"

Ensure files are named correctly:

- `members/wa-members-export.csv`
- `events/wa-events-export.csv`
- `events/wa-registrations-export.csv`

### "DATABASE_URL environment variable is not set"

Set the database URL:

```bash
export DATABASE_URL="postgresql://user:pass@host:5432/dbname"
npm run migration:dry-run:sbnc
```

### Many "Unknown status" errors

Check `scripts/migration/config/migration-config.yaml` for membership status mappings. Add any missing WA membership levels.

## Next Steps

After a successful dry-run with no errors:

1. Review the counts - do they match expectations?
2. Review the preview artifacts for any unexpected mappings
3. Coordinate with the merge captain for live migration approval
4. Run the live migration (requires separate authorization)

## Related Documentation

- [Migration README](../../scripts/migration/README.md) - General migration documentation
- [Migration Config](../../scripts/migration/config/migration-config.yaml) - Field mappings and rules
- Issue #202 - WA Migration tracking issue
