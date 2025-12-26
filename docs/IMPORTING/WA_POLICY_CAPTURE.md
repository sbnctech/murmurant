# WA Policy Capture

This document describes the policy capture process for Wild Apricot migrations to ClubOS.

**Related Issues:** #275 (Policy Capture), #202 (WA Migration Epic), #263 (Policy Layer)

## Overview

Before migrating data from Wild Apricot to ClubOS, you must capture and configure organization policies. These policies control how ClubOS behaves for membership lifecycle, event scheduling, governance, and more.

The policy capture script generates a **policy bundle** that:

1. Extracts available values from WA when you run the script
2. Provides templates for manual entry where needed
3. Validates completeness before migration

## Quick Start

```bash
# 1. Generate a template (no WA access needed)
npx tsx scripts/migration/capture-policies.ts --generate-template

# 2. Edit the generated policy.json to fill in required values

# 3. Validate your completed mapping
npx tsx scripts/migration/capture-policies.ts --validate-only --mapping-file migration-output/policy.json

# 4. Proceed with migration once validation passes
```

## Output Artifacts

The script produces two files in the output directory:

| File | Format | Purpose |
|------|--------|---------|
| `policy.json` | JSON | Machine-readable policy bundle for migration |
| `policy.md` | Markdown | Human-readable report for operator review |

### policy.json Structure

```json
{
  "version": "1.0",
  "generatedAt": "2025-12-24T12:00:00.000Z",
  "organizationName": "Your Organization",
  "policies": [
    {
      "key": "scheduling.timezone",
      "value": "America/Los_Angeles",
      "source": "manual",
      "description": "Organization timezone (IANA format)",
      "required": true
    }
  ],
  "validation": {
    "valid": true,
    "errors": [],
    "warnings": []
  },
  "metadata": {
    "captureMode": "auto",
    "templateSections": []
  }
}
```

## Policy Categories

### Required Policies

These policies **must** be set before migration:

| Policy Key | Description | Example Value |
|------------|-------------|---------------|
| `scheduling.timezone` | Organization timezone | `"America/Los_Angeles"` |
| `display.organizationName` | Display name | `"Santa Barbara Newcomers"` |

### Optional Policies

These policies have sensible defaults (SBNC-based) but can be customized:

#### Membership Lifecycle

| Policy Key | Default | Description |
|------------|---------|-------------|
| `membership.newbieDays` | 90 | Days considered a new member |
| `membership.extendedDays` | 730 | Days to qualify as extended member |
| `membership.gracePeriodDays` | 30 | Days after expiration before lapsed |
| `membership.renewalReminderDays` | 30 | Days before expiration to remind |

#### Event Scheduling

| Policy Key | Default | Description |
|------------|---------|-------------|
| `scheduling.registrationOpenDay` | 2 (Tuesday) | Day registration opens (0=Sun) |
| `scheduling.registrationOpenHour` | 8 | Hour registration opens (0-23) |
| `scheduling.eventArchiveDays` | 30 | Days after event to archive |
| `scheduling.announcementDay` | 0 (Sunday) | Day for announcements |
| `scheduling.announcementHour` | 8 | Hour for announcements |

#### Governance

| Policy Key | Default | Description |
|------------|---------|-------------|
| `governance.minutesReviewDays` | 7 | Days to review minutes |
| `governance.boardEligibilityDays` | 730 | Membership days for board eligibility |
| `governance.quorumPercentage` | 50 | Percentage for quorum |

#### KPI Thresholds

| Policy Key | Default | Description |
|------------|---------|-------------|
| `kpi.membershipWarningThreshold` | 200 | Membership count for warning |
| `kpi.membershipDangerThreshold` | 150 | Membership count for danger |
| `kpi.eventAttendanceWarningPercent` | 50 | Attendance % for warning |
| `kpi.eventAttendanceDangerPercent` | 25 | Attendance % for danger |

#### Display

| Policy Key | Default | Description |
|------------|---------|-------------|
| `display.memberTermSingular` | "member" | Singular term for members |
| `display.memberTermPlural` | "members" | Plural term for members |

## WA Membership Level Mapping

> **Important:** The WA membership level API may not be available or reliable. Manual mapping is acceptable and often necessary.

If you want to map WA membership levels to ClubOS membership tiers during migration, you need to configure:

```json
{
  "membership.tiers.enabled": true,
  "membership.tiers.defaultCode": "GENERAL",
  "membership.tiers.waMapping": {
    "New Member": "NEWCOMER",
    "1st Year": "FIRST_YEAR",
    "2nd Year": "SECOND_YEAR",
    "Alumni": "ALUMNI"
  }
}
```

### How to Discover WA Membership Levels

Since the WA API for membership levels may be unavailable, try these approaches:

1. **Export member data from WA admin** - Look at the "Membership Level" column
2. **Check your WA membership level configuration** - In WA Admin → Settings → Membership Levels
3. **Run a sample member import** - The migration report will show unmapped levels

### Tier Code Reference

ClubOS supports these standard tier codes (seed with `seed-membership-tiers.ts`):

| Tier Code | Description |
|-----------|-------------|
| `PROSPECT` | Not yet a member |
| `NEWCOMER` | New member (first 90 days) |
| `FIRST_YEAR` | First year member |
| `SECOND_YEAR` | Second year member |
| `THIRD_YEAR` | Third year member |
| `ALUMNI` | Former member |
| `LAPSED` | Expired membership |
| `GENERAL` | Default/catch-all tier |

## Script Modes

### 1. Generate Template

Creates an empty template for manual completion. Does not require WA access.

```bash
npx tsx scripts/migration/capture-policies.ts --generate-template

# With custom org name
npx tsx scripts/migration/capture-policies.ts --generate-template --org-name "My Club"

# Custom output directory
npx tsx scripts/migration/capture-policies.ts --generate-template --output-dir ./my-policies
```

### 2. Best-Effort Capture

Attempts to capture from WA, falls back to templates for uncapturable policies.

```bash
# With WA credentials (retrieves org name from WA)
WA_API_KEY=xxx WA_ACCOUNT_ID=176353 npx tsx scripts/migration/capture-policies.ts

# Use platform defaults for optional fields
npx tsx scripts/migration/capture-policies.ts --use-defaults --org-name "My Club"

# Merge with existing mapping
npx tsx scripts/migration/capture-policies.ts --mapping-file existing-policies.json
```

### 3. Validate Only

Validates an existing policy file without regenerating.

```bash
npx tsx scripts/migration/capture-policies.ts --validate-only --mapping-file policy.json
```

Exit codes:

- `0` - Validation passed
- `1` - Validation failed (missing required fields or invalid values)

## Validation Rules

The script validates:

1. **Required fields are present** - `scheduling.timezone`, `display.organizationName`
2. **Value types are correct** - Numbers, strings, objects where expected
3. **Value ranges are valid** - Days 0-6, hours 0-23, percentages 0-100
4. **Timezone format** - Must contain "/" (e.g., `America/Los_Angeles`)

## Integration with Migration

The policy bundle integrates with the migration workflow:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ capture-policies│ --> │ policy.json     │ --> │ migrate.ts      │
│ (generate)      │     │ (operator edits)│     │ (uses policies) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │
                              v
                        ┌─────────────────┐
                        │ validate-only   │
                        │ (before migrate)│
                        └─────────────────┘
```

### Bundle Determinism

The policy bundle is generated deterministically:

- Policies are sorted by category, then by key
- JSON output uses 2-space indentation
- Timestamps use ISO 8601 format

This ensures reproducible builds and meaningful diffs.

## Operator Checklist

Before running migration:

- [ ] Run `capture-policies.ts --generate-template` or with `--use-defaults`
- [ ] Review `policy.md` for required actions
- [ ] Fill in missing values in `policy.json`
- [ ] Configure tier mapping if using membership tiers
- [ ] Run `--validate-only` to confirm completeness
- [ ] Keep `policy.json` in version control for audit trail

## Troubleshooting

### "Missing required policy" Error

```
ERROR: Missing required policy: scheduling.timezone
```

**Fix:** Edit `policy.json` and add the missing value:

```json
{
  "key": "scheduling.timezone",
  "value": "America/Los_Angeles",
  "source": "manual",
  ...
}
```

### "Invalid value" Error

```
ERROR: Invalid value for scheduling.timezone: Must be a valid IANA timezone
```

**Fix:** Use a valid IANA timezone format like `America/New_York`, not `EST` or `Eastern`.

### WA API Errors

```
[capture] Could not fetch WA info: WA auth failed: 401
```

**Fix:** Check your `WA_API_KEY` is valid. You can still proceed without WA access using `--generate-template`.

## Related Documentation

- [IMPORTER_RUNBOOK.md](./IMPORTER_RUNBOOK.md) - Full migration runbook
- [WA_FIELD_MAPPING.md](./WA_FIELD_MAPPING.md) - Field mapping reference
- [docs/ARCH/PLATFORM_VS_POLICY.md](/docs/ARCH/PLATFORM_VS_POLICY.md) - Policy architecture

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2025-12-24 | System | Initial documentation |
