# Wild Apricot Registration Import Diagnostics

This document provides troubleshooting guidance for the "0 registrations imported" issue and related registration sync problems.

## Overview

The WA registration import can fail silently if prerequisites are not met. This document explains:

- Why registrations may be skipped
- How to diagnose the root cause
- Available tools for debugging
- Common failure patterns and fixes

## How Registration Import Works

The registration sync follows a strict order:

1. **Members sync first**: Contacts are fetched from WA and mapped to ClubOS Members
2. **Events sync second**: Events are fetched from WA and mapped to ClubOS Events
3. **Registrations sync last**: Registrations are fetched per-event and linked to both Members and Events

### Critical Dependency

Each registration references both:

- A WA **Contact ID** (must map to a ClubOS Member)
- A WA **Event ID** (must map to a ClubOS Event)

If either mapping is missing, the registration is **skipped silently**.

## Diagnostic Instrumentation

The importer now tracks detailed registration diagnostics:

| Counter | Description |
|---------|-------------|
| `eventsProcessed` | Total events checked for registrations |
| `eventsSkippedUnmapped` | Events without a WaIdMapping (never synced) |
| `registrationFetchCalls` | API calls made to fetch registrations |
| `registrationsFetchedTotal` | Total registrations returned by WA API |
| `registrationsTransformedOk` | Registrations that passed validation |
| `registrationsSkippedMissingEvent` | Skipped: event not mapped |
| `registrationsSkippedMissingMember` | Skipped: member not mapped |
| `registrationsSkippedTransformError` | Skipped: data transformation failed |
| `registrationsUpserted` | Successfully created/updated in database |

### Viewing Diagnostics

After a sync run, the script prints a diagnostics summary:

```
Registration Diagnostics:
  Events processed:          523
  Events skipped (unmapped): 0
  Registration fetch calls:  523
  Total fetched from WA:     15420
  Transformed successfully:  150
  Upserted to database:      150

  Skipped:
    Missing member mapping:  15270
    Missing event mapping:   0
    Transform error:         0

  Top skip reasons:
    - Member not mapped: WA contact 12345: 2100
    - Member not mapped: WA contact 67890: 1800
    ...
```

## Common Failure Patterns

### Pattern 1: All Registrations Skipped (Missing Members)

**Symptom:**

```
Total fetched from WA:     15420
Upserted to database:      0
Missing member mapping:    15420
```

**Root Cause:** The contacts sync returned fewer contacts than exist in WA. Common reasons:

- WA API returned a non-async response (only first page of 100)
- Filter was accidentally applied to full sync
- Async query timed out

**Fix:**

1. Run probe mode to verify member mappings exist:
   ```bash
   npx tsx scripts/importing/wa_full_sync.ts --probe-event-id <EVENT_ID>
   ```

2. Check the WaIdMapping table for member counts:
   ```sql
   SELECT COUNT(*) FROM "WaIdMapping" WHERE "entityType" = 'Member';
   ```

3. Compare with WA contact count (should be ~2000+)

4. If mapping count is low, re-run full sync to rebuild mappings

### Pattern 2: Some Events Skipped

**Symptom:**

```
Events processed:          523
Events skipped (unmapped): 45
```

**Root Cause:** Some events in WA don't have corresponding WaIdMapping entries.

**Fix:**

1. These events were likely created after the last event sync
2. Run another full sync to pick up new events
3. Or, for a targeted fix, run the events sync separately

### Pattern 3: Transform Errors

**Symptom:**

```
Transform error:         500
```

**Root Cause:** Registration data failed validation. Check the top skip reasons for specific issues:

- Invalid status value
- Missing required fields
- Data format issues

**Fix:** Review the `transformRegistration` function in `transformers.ts` and check what validations are failing.

## Probe Mode

Use probe mode to diagnose a specific event's registrations without running a full sync:

```bash
npx tsx scripts/importing/wa_full_sync.ts --probe-event-id 12345
```

This outputs:

```
============================================================
  Probing Event 12345
============================================================

[PROBE] Event found: Monthly Luncheon
[PROBE] Event mapped to ClubOS: YES (uuid-abc123)
[PROBE] Fetched 45 registrations from WA

[PROBE] Sample registration 1: {
  "Id": 9876,
  "Contact": { "Id": 5432, "Name": "Jane Doe", "Email": "jane@example.com" },
  "Status": "Confirmed",
  "RegistrationDate": "2025-01-15T10:30:00Z"
}

============================================================
  Probe Results
============================================================

Event ID:              12345
Event found in WA:     YES
Event mapped to ClubOS: YES
ClubOS Event ID:       uuid-abc123
Registrations from WA: 45

Import Analysis:
  Would import:               5
  Would skip (missing member): 40
  Would skip (transform error): 0

Sample registrations (first 5):
  - WA#9876 Jane Doe (jane@example.com)
    WA Contact: 5432, Status: Confirmed
    Member mapped: YES (uuid-member123)
    Result: IMPORT

  - WA#9877 John Smith (john@example.com)
    WA Contact: 5433, Status: Confirmed
    Member mapped: NO
    Result: SKIP: Member not mapped (WA contact 5433)
```

## SQL Diagnostic Queries

### Check Mapping Counts

```sql
-- Count mappings by entity type
SELECT "entityType", COUNT(*)
FROM "WaIdMapping"
GROUP BY "entityType";
```

### Find Unmapped Contacts

```sql
-- Get registration contact IDs that have no member mapping
-- (Would need to cross-reference with WA API data)
SELECT DISTINCT wm."waId"
FROM "WaIdMapping" wm
WHERE wm."entityType" = 'EventRegistration'
  AND NOT EXISTS (
    SELECT 1 FROM "WaIdMapping" mem
    WHERE mem."entityType" = 'Member'
    -- Note: This requires knowing which contact ID the registration references
  );
```

### Check Recent Sync State

```sql
SELECT * FROM "WaSyncState" ORDER BY "updatedAt" DESC LIMIT 1;
```

### Verify Registration Counts

```sql
-- Compare mapping count to actual registrations
SELECT
  (SELECT COUNT(*) FROM "WaIdMapping" WHERE "entityType" = 'EventRegistration') as mapped,
  (SELECT COUNT(*) FROM "EventRegistration") as actual;
```

## Known Issues

### 1. Contacts Returning Only 100 (WA_CONTACTS_INCOMPLETE)

The WA API sometimes returns a non-async response with only the first page of contacts.

**Status:** Under investigation

**Workaround:** If sync shows only 100 contacts, re-run the sync. The async query should eventually trigger.

### 2. Async Query Timeout

Large contact sets may cause the async query to timeout.

**Status:** Config parameter `WA_ASYNC_MAX_ATTEMPTS` controls this (default: 40 polls at 3s each = 2 minutes)

**Fix:** Increase timeout if needed:
```bash
WA_ASYNC_MAX_ATTEMPTS=100 npx tsx scripts/importing/wa_full_sync.ts
```

## Checklist Before Running Full Sync

- [ ] `WA_API_KEY` and `WA_ACCOUNT_ID` are set
- [ ] Database migrations are applied (`npx prisma migrate deploy`)
- [ ] MembershipStatus records are seeded
- [ ] Preflight checks pass (script includes these checks)
- [ ] For production: `ALLOW_PROD_IMPORT=1` is set

## Related Documentation

- [IMPORTER_RUNBOOK.md](./IMPORTER_RUNBOOK.md) - Full operational runbook
- [src/lib/importing/wildapricot/README.md](../../src/lib/importing/wildapricot/README.md) - Code documentation (if exists)
