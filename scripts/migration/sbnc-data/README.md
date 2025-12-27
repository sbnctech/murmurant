# SBNC Data Directory

Place Wild Apricot CSV export files here for SBNC migration.

## Directory Structure

```
sbnc-data/
├── members/
│   └── wa-members-export.csv     # Required: Member data
├── events/
│   ├── wa-events-export.csv      # Optional: Event data
│   └── wa-registrations-export.csv  # Optional: Registration data
└── README.md                     # This file
```

## Running the Dry-Run

```bash
npm run migration:dry-run:sbnc
```

## CSV File Requirements

### members/wa-members-export.csv

Required columns:

- Contact ID
- First name
- Last name
- Email
- Phone (optional)
- Member since
- Membership level

### events/wa-events-export.csv

Required columns:

- Event ID
- Event name
- Description
- Tags
- Location
- Start date
- End date
- Registration limit (optional)

### events/wa-registrations-export.csv

Required columns:

- Registration ID
- Contact ID
- Event ID
- Registration status
- Registration date
- Cancellation date (optional)

## Notes

- Do NOT commit actual member data to version control
- The `.gitignore` excludes CSV files from this directory
- See docs/MIGRATION/SBNC_DRY_RUN_GUIDE.md for full documentation
