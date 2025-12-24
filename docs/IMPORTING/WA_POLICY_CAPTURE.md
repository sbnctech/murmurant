# WA Policy Capture

This document describes how the migration system extracts organization-specific policies from Wild Apricot and produces a migration bundle with captured policies and operator-defined mappings.

## Overview

"Policy capture" means extracting configuration data from the source organization (WA) that determines how ClubOS should be configured for that organization. This includes:

- Membership level definitions (tiers, fees, renewal settings)
- Organization timezone and scheduling preferences
- Custom field configurations

## What Gets Extracted

### Automatic Extraction (WA API)

The following data is fetched automatically when WA API credentials are available:

| Data | WA API Endpoint | Output File |
|------|-----------------|-------------|
| Membership Levels | `/accounts/{id}/membershiplevels` | `policies/membership_levels.json` |
| Account Info | `/accounts/{id}` | `source_org.json` |

### Manual Fallback (When API Unavailable)

If the WA API is unavailable or returns incomplete data:

1. The system generates a **template mapping file**
2. Operator fills in the mapping
3. System validates before proceeding

## Migration Bundle Structure

```
migration_bundle/
├── source_org.json                     # WA account metadata
│   └── { accountId, name, timezone, extractedAt }
│
├── policies/
│   └── membership_levels.json          # Raw WA membership levels
│       └── [{ id, name, fee, renewalEnabled, ... }]
│
├── mappings/
│   └── membership_levels_mapping.json  # WA level → ClubOS tier
│       └── { levels: [{ waId, waName, clubosTier, ignore?, reason? }] }
│
└── reports/
    └── policy_capture_report.md        # Human-readable summary
```

## Membership Level Mapping

### Source: WA Membership Levels

Wild Apricot membership levels contain:

```json
{
  "Id": 12345,
  "Name": "Active Member",
  "MembershipFee": 150.00,
  "RenewalEnabled": true,
  "RenewalPeriod": "OneYear",
  "NewMembersEnabled": true,
  "Description": "Full membership with all benefits"
}
```

### Target: ClubOS Membership Status

ClubOS uses a status-based model with codes:

- `active` - Currently active member
- `lapsed` - Expired membership
- `pending_new` - New member awaiting approval
- `pending_renewal` - Renewal in progress
- `suspended` - Administratively suspended
- `not_a_member` - Guest or contact only

### Mapping File Format

```json
{
  "version": "1.0",
  "createdAt": "2024-12-24T12:00:00Z",
  "levels": [
    {
      "waId": 12345,
      "waName": "Active Member",
      "clubosTier": "active",
      "notes": "Primary membership level"
    },
    {
      "waId": 12346,
      "waName": "Honorary Member",
      "clubosTier": "active",
      "notes": "No fee, same permissions as active"
    },
    {
      "waId": 12347,
      "waName": "Inactive",
      "ignore": true,
      "reason": "Legacy level, no current members"
    }
  ]
}
```

### Validation Rules

1. Every WA membership level must be mapped
2. `clubosTier` must be a valid ClubOS status code
3. Unmapped levels require `ignore: true` with a `reason`
4. No duplicate mappings allowed

## Operator Workflow

### Step 1: Run Policy Capture

```bash
npx tsx scripts/migration/capture-wa-policies.ts \
  --account-id <WA_ACCOUNT_ID> \
  --output-dir ./migration_bundle
```

### Step 2: Review and Complete Mapping

If automatic fetch succeeds, review `policies/membership_levels.json` and verify the auto-generated `mappings/membership_levels_mapping.json`.

If automatic fetch fails:
1. System generates template at `mappings/membership_levels_mapping.json`
2. Fill in `clubosTier` for each level
3. Re-run with `--validate-only` to check

### Step 3: Validate

```bash
npx tsx scripts/migration/capture-wa-policies.ts \
  --validate-only \
  --mapping-file ./migration_bundle/mappings/membership_levels_mapping.json
```

### Step 4: Proceed with Migration

Once validation passes, the migration bundle is ready for the main import:

```bash
npx tsx scripts/importing/wa_full_sync.ts \
  --policy-bundle ./migration_bundle
```

## Policy Capture Report

The report (`reports/policy_capture_report.md`) includes:

```markdown
# Policy Capture Report

Generated: 2024-12-24T12:00:00Z
Source: Wild Apricot Account 12345

## Membership Levels

| WA ID | WA Name | ClubOS Tier | Status |
|-------|---------|-------------|--------|
| 12345 | Active Member | active | Mapped |
| 12346 | Honorary Member | active | Mapped |
| 12347 | Inactive | - | Ignored (Legacy level) |

## Summary

- Total WA levels: 3
- Mapped to ClubOS: 2
- Ignored with reason: 1
- Unmapped (blocking): 0

## Validation

All levels accounted for.
```

## Error Handling

### API Errors

| Error | Action |
|-------|--------|
| 401 Unauthorized | Check WA_API_KEY, re-authenticate |
| 403 Forbidden | Account may restrict API access; use manual fallback |
| 404 Not Found | Verify WA_ACCOUNT_ID |
| 5xx Server Error | Retry with backoff; if persistent, use manual fallback |

### Validation Errors

| Error | Resolution |
|-------|------------|
| Unmapped level | Add `clubosTier` or set `ignore: true` with `reason` |
| Invalid tier code | Use one of: active, lapsed, pending_new, pending_renewal, suspended, not_a_member |
| Duplicate mapping | Remove duplicate entries |

## Related Documentation

- [IMPORTER_SYSTEM_SPEC.md](./IMPORTER_SYSTEM_SPEC.md) - Overall import architecture
- [WA_FIELD_MAPPING.md](./WA_FIELD_MAPPING.md) - Field-by-field mapping spec
- [IMPORTER_RUNBOOK.md](./IMPORTER_RUNBOOK.md) - Operational procedures

## Related Issues

- #275 - Policy Capture: Extract Source Org Policies
- #202 - WA Migration Epic
- #232 / #263 - Policy Isolation Layer
