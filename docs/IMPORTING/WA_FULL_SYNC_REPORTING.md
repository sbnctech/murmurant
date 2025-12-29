# Wild Apricot Full Sync Reporting

This document describes the end-of-run reporting system for the WA full sync process.

## Overview

The WA full sync now produces:

1. **Console Summary** - Structured output showing fetched counts, results, and diagnostics
2. **JSON Report File** - Machine-readable report at `/tmp/murmurant/wa_full_sync_report.json`
3. **Prominent Warnings** - Visual warnings for suspicious conditions

## Console Output

The sync prints a structured summary at the end of each run:

```
============================================================
  Sync Complete
============================================================

  FETCHED FROM WA:
    Contacts:      500
    Events:        100
    Registrations: 2000

  RESULTS:
    Members:       10 created, 20 updated, 5 skipped
    Events:        5 created, 10 updated, 2 skipped
    Registrations: 100 created, 50 updated, 10 skipped

  REGISTRATION DIAGNOSTICS:
    Events processed:           100
    Events skipped (unmapped):  5
    Registrations fetched:      2000
    Registrations upserted:     1800
    Skipped (missing member):   180
    Skipped (missing event):    10
    Skipped (transform error):  10

  Duration:  300s
  Errors:    0
  Warnings:  0
  Report:    /tmp/murmurant/wa_full_sync_report.json
============================================================
```

## JSON Report File

Location: `/tmp/murmurant/wa_full_sync_report.json`

### Report Structure

```json
{
  "version": 1,
  "runId": "sync_1702918800000_abc123",
  "startedAt": "2025-01-15T10:00:00.000Z",
  "finishedAt": "2025-01-15T10:05:00.000Z",
  "durationMs": 300000,
  "success": true,
  "dryRun": false,
  "fetched": {
    "contacts": 500,
    "events": 100,
    "registrations": 2000
  },
  "warnings": [],
  "stats": {
    "members": { "created": 10, "updated": 20, "skipped": 5, "errors": 0 },
    "events": { "created": 5, "updated": 10, "skipped": 2, "errors": 0 },
    "registrations": { "created": 100, "updated": 50, "skipped": 10, "errors": 0 }
  },
  "registrationDiagnostics": {
    "eventsProcessed": 100,
    "eventsSkippedUnmapped": 5,
    "registrationFetchCalls": 100,
    "registrationsFetchedTotal": 2000,
    "registrationsTransformedOk": 1800,
    "registrationsSkippedMissingEvent": 10,
    "registrationsSkippedMissingMember": 180,
    "registrationsSkippedTransformError": 10,
    "registrationsUpserted": 1800,
    "topSkipReasons": [
      { "reason": "Member not mapped: WA contact 12345", "count": 50 }
    ]
  },
  "errors": [],
  "totalErrorCount": 0
}
```

### Key Fields

| Field | Description |
|-------|-------------|
| `version` | Report format version (currently 1) |
| `runId` | Unique identifier for this sync run |
| `fetched` | Raw counts of entities fetched from WA |
| `warnings` | Array of warnings generated during sync |
| `stats` | Create/update/skip/error counts per entity type |
| `registrationDiagnostics` | Detailed breakdown of registration processing |
| `topSkipReasons` | Most common reasons registrations were skipped |

## Warnings

The sync generates warnings for suspicious conditions:

### Warning Codes

| Code | Severity | Condition |
|------|----------|-----------|
| `ZERO_CONTACTS` | high | No contacts fetched from WA |
| `LOW_CONTACT_COUNT` | high | < 100 contacts fetched (expects more for full sync) |
| `LOW_EVENT_COUNT` | medium | < 10 events fetched |
| `ZERO_REGISTRATIONS_UPSERTED` | high | Registrations fetched but none imported |
| `HIGH_MEMBER_SKIP_RATIO` | high | > 90% of registrations skipped due to missing members |

### Warning Output Format

Warnings are displayed prominently in a box:

```
╔══════════════════════════════════════════════════════════════╗
║                         ⚠️  WARNINGS                          ║
╠══════════════════════════════════════════════════════════════╣
║ [HIGH  ] ZERO_REGISTRATIONS_UPSERTED
║   Fetched 500 registrations but upserted 0. Top skip reasons:
║   Member not mapped: WA contact 12345: 500
╟──────────────────────────────────────────────────────────────╢
╚══════════════════════════════════════════════════════════════╝
```

## Probe Command

Use `--probe-event-id` to diagnose a specific event's registrations:

```bash
npx tsx scripts/importing/wa_full_sync.ts --probe-event-id 12345
```

Output includes:

- Whether the event exists in WA
- Whether the event is mapped to Murmurant
- Registration count from WA
- Sample registrations with their mapping status
- Summary of what would be imported vs skipped

## Diagnosing "0 Registrations" Issues

If the sync reports 0 registrations upserted:

1. **Check the JSON report** at `/tmp/murmurant/wa_full_sync_report.json`
2. **Look at `topSkipReasons`** to see why registrations were skipped
3. **Check `fetched.registrations`** to confirm registrations were fetched
4. **Verify member sync** ran first (registrations require member mappings)
5. **Use `--probe-event-id`** to diagnose a specific event

### Common Causes

1. **Members not synced** - Run full sync; members sync before registrations
2. **Event not mapped** - Event may not exist in Murmurant yet
3. **API filter issue** - Check WA API credentials and filters
4. **Transform errors** - Check `registrationsSkippedTransformError` count

## Usage Examples

### Standard Full Sync

```bash
ALLOW_PROD_IMPORT=1 npx tsx scripts/importing/wa_full_sync.ts
```

### Dry Run (No Writes)

```bash
DRY_RUN=1 npx tsx scripts/importing/wa_full_sync.ts
```

### View Report After Sync

```bash
cat /tmp/murmurant/wa_full_sync_report.json | jq .
```

### Check for Warnings

```bash
cat /tmp/murmurant/wa_full_sync_report.json | jq '.warnings'
```

### Get Top Skip Reasons

```bash
cat /tmp/murmurant/wa_full_sync_report.json | jq '.registrationDiagnostics.topSkipReasons'
```

## What Changed (2025-12-18)

- Added `SyncReport` type with full diagnostic breakdown
- End-of-run JSON report written to `/tmp/murmurant/wa_full_sync_report.json`
- Warning system for suspicious conditions (0 upserts, low counts)
- Prominent visual warning box in console output
- Enhanced console summary with fetched counts and diagnostics

## How to Demo

1. Run a dry-run sync: `DRY_RUN=1 npx tsx scripts/importing/wa_full_sync.ts`
2. Observe the structured summary output
3. Check the JSON report: `cat /tmp/murmurant/wa_full_sync_report.json | jq .`
4. If warnings appear, show the diagnostic information

## How to Rollback

The changes are additive - no rollback needed. To disable:

1. Report file: Just don't read it
2. Warnings: The warnings don't affect sync behavior, only output
3. To remove: Revert the changes in `src/lib/importing/wildapricot/importer.ts`
