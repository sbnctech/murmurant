# Wild Apricot Importer Runbook

This document provides exact commands for running the WA importer in all environments.

## 1. Prerequisites

### 1.1 Environment Variables

```bash
# Required for all operations
WA_API_KEY=your_api_key_here      # Wild Apricot API key
WA_ACCOUNT_ID=176353              # Wild Apricot account ID
DATABASE_URL=postgresql://...     # ClubOS database connection

# Optional safety flags
ALLOW_PROD_IMPORT=1               # Required for production writes
DRY_RUN=1                         # Preview mode (no writes)
```

### 1.2 Database Setup

Ensure migrations are applied:

```bash
npx prisma migrate deploy
npx prisma generate
```

### 1.3 Seed MembershipStatus Records

The importer requires specific MembershipStatus records. Run the seeder:

```bash
# Development/staging
npx tsx scripts/importing/seed_membership_statuses.ts

# Production (requires explicit opt-in)
ALLOW_PROD_SEED=1 npx tsx scripts/importing/seed_membership_statuses.ts

# Dry run (preview only)
DRY_RUN=1 npx tsx scripts/importing/seed_membership_statuses.ts
```

Expected status codes created:

- `active` - Currently active member
- `lapsed` - Membership has expired
- `pending_new` - New member pending approval/payment
- `pending_renewal` - Renewal in progress
- `suspended` - Membership suspended
- `not_a_member` - Guest or non-member contact
- `unknown` - Fallback for unmapped statuses

### 1.4 Seed MembershipTier Records (Optional)

If using tier mapping during migration (Issue #276), seed the MembershipTier records:

```bash
# Enable the feature flag first
export CLUBOS_FLAG_MEMBERSHIP_TIERS_ENABLED=1

# Development/staging
npx tsx scripts/migration/seed-membership-tiers.ts

# Dry run (preview only)
DRY_RUN=1 npx tsx scripts/migration/seed-membership-tiers.ts
```

Expected tier codes created (SBNC defaults):

- `PROSPECT` - Not yet a member
- `NEWCOMER` - New member (first 90 days)
- `FIRST_YEAR` - First year member
- `SECOND_YEAR` - Second year member
- `THIRD_YEAR` - Third year member
- `ALUMNI` - Former member
- `LAPSED` - Expired membership
- `GENERAL` - Default tier for unmapped levels

**Rollback**: If tiers were seeded incorrectly:

```sql
-- Remove specific tier
DELETE FROM "MembershipTier" WHERE code = 'TIER_CODE';

-- Remove all tiers (use with caution)
DELETE FROM "MembershipTier";
```

**Related**: Issue #276, #202, #275, #263

### 1.5 Verify Configuration

```bash
# Check WA API connectivity
npx tsx scripts/importing/wa_health_check.ts

# Expected output:
# [OK] WA API reachable
# [OK] Account ID: 176353
# [OK] Token obtained successfully
```

### 1.6 Preflight Checks

The sync scripts automatically run preflight checks before syncing. You can also check manually via the API:

```bash
curl http://localhost:3000/api/v1/admin/import/status
```

Preflight validates:

- Database connectivity
- WaIdMapping table exists
- WaSyncState table exists
- Required MembershipStatus codes exist

### 1.7 Capture Organization Policies

Capture and validate organization policies before migration. See [WA_POLICY_CAPTURE.md](./WA_POLICY_CAPTURE.md) for details.

```bash
# Generate policy template (no WA access needed)
npx tsx scripts/migration/capture-policies.ts --generate-template

# Or capture with defaults for optional fields
npx tsx scripts/migration/capture-policies.ts --use-defaults --org-name "Your Organization"
```

Edit the generated `migration-output/policy.json` to fill in required values, then validate:

```bash
npx tsx scripts/migration/capture-policies.ts --validate-only --mapping-file migration-output/policy.json
```

**Required policies:**

- `scheduling.timezone` - Organization timezone (e.g., "America/Los_Angeles")
- `display.organizationName` - Organization display name

**Optional tier mapping:** If migrating WA membership levels to ClubOS tiers, configure `membership.tiers.waMapping` in the policy file. Note: WA membership level API may be unreliable; manual mapping is acceptable.

## 1.8 Operator Pre-Migration Checklist

Before running the full sync, complete this checklist:

- [ ] **Environment variables set** - WA_API_KEY, WA_ACCOUNT_ID, DATABASE_URL
- [ ] **Database migrations applied** - `npx prisma migrate deploy`
- [ ] **MembershipStatus records seeded** - Section 1.3
- [ ] **MembershipTier records seeded** (if using tiers) - Section 1.4
- [ ] **Policy bundle captured** - `capture-policies.ts --generate-template`
- [ ] **Policy bundle reviewed** - Check `migration-output/policy.md`
- [ ] **Required policies filled** - Edit `policy.json` for missing values
- [ ] **Policy bundle validated** - `capture-policies.ts --validate-only`
- [ ] **Preflight checks pass** - Section 1.6
- [ ] **Dry run completed** - `DRY_RUN=1 npx tsx scripts/importing/wa_full_sync.ts`

**Safety principle:** No silent defaults for critical values. If something is missing, the validation step will fail explicitly.

## 2. Full Sync

### 2.1 Development/Staging

```bash
# Standard full sync
npx tsx scripts/importing/wa_full_sync.ts

# With verbose logging
DEBUG=wa:* npx tsx scripts/importing/wa_full_sync.ts

# Dry run (preview only)
DRY_RUN=1 npx tsx scripts/importing/wa_full_sync.ts
```

### 2.2 Production

```bash
# DANGER: This writes to production database
# Requires explicit opt-in
ALLOW_PROD_IMPORT=1 npx tsx scripts/importing/wa_full_sync.ts

# Recommended: dry run first
DRY_RUN=1 ALLOW_PROD_IMPORT=1 npx tsx scripts/importing/wa_full_sync.ts
```

### 2.3 Expected Output

```
============================================================
  Wild Apricot Full Sync
  Started: 2025-12-17T10:30:00.000Z
  Mode: LIVE (writes enabled)
============================================================

[1/4] Fetching membership levels...
  - Found 4 levels
  - Mapped to MembershipStatus records

[2/4] Syncing members...
  - Fetching contacts from WA (async query)...
  - Received 2,147 contacts
  - Processing batch 1/22 (100 records)...
  - Processing batch 2/22 (100 records)...
  ...
  - Members: 2,100 created, 47 updated, 0 skipped, 0 errors

[3/4] Syncing events...
  - Fetching events from WA...
  - Received 523 events
  - Events: 500 created, 23 updated, 0 skipped, 0 errors

[4/4] Syncing registrations...
  - Processing 523 events for registrations...
  - Registrations: 8,432 created, 156 updated, 12 skipped, 3 errors

============================================================
  Sync Complete
  Duration: 18m 32s
  Summary:
    Members:       2,147 processed (2,100 new, 47 updated)
    Events:          523 processed (500 new, 23 updated)
    Registrations: 8,603 processed (8,432 new, 156 updated)
    Errors:            3 (see errors.log)
============================================================
```

## 3. Incremental Sync

### 3.1 Development/Staging

```bash
# Standard incremental sync
npx tsx scripts/importing/wa_incremental_sync.ts

# With verbose logging
DEBUG=wa:* npx tsx scripts/importing/wa_incremental_sync.ts

# Dry run
DRY_RUN=1 npx tsx scripts/importing/wa_incremental_sync.ts
```

### 3.2 Production

```bash
# DANGER: This writes to production database
ALLOW_PROD_IMPORT=1 npx tsx scripts/importing/wa_incremental_sync.ts
```

### 3.3 Expected Output

```
============================================================
  Wild Apricot Incremental Sync
  Started: 2025-12-17T03:00:00.000Z
  Last sync: 2025-12-16T03:00:00.000Z
  Mode: LIVE (writes enabled)
============================================================

[1/3] Syncing changed members...
  - Filter: 'Profile last updated' gt 2025-12-16T03:00:00Z
  - Found 23 changed contacts
  - Members: 5 created, 18 updated, 0 skipped, 0 errors

[2/3] Syncing recent events...
  - Filter: StartDate ge 2025-11-17
  - Found 45 events
  - Events: 3 created, 42 updated, 0 skipped, 0 errors

[3/3] Syncing registrations for recent events...
  - Processing 45 events...
  - Registrations: 89 created, 234 updated, 2 skipped, 0 errors

============================================================
  Sync Complete
  Duration: 2m 15s
  Summary:
    Members:       23 processed (5 new, 18 updated)
    Events:        45 processed (3 new, 42 updated)
    Registrations: 325 processed (89 new, 234 updated)
    Errors:         0
============================================================
```

## 4. Dry Run Mode

### 4.1 What It Does

- Fetches all data from WA API (real API calls)
- Computes what would be created/updated
- Prints summary without writing to database
- Useful for validating before production sync

### 4.2 Usage

```bash
DRY_RUN=1 npx tsx scripts/importing/wa_full_sync.ts
```

### 4.3 Expected Output

```
============================================================
  Wild Apricot Full Sync
  Started: 2025-12-17T10:30:00.000Z
  Mode: DRY RUN (no writes)
============================================================

[DRY RUN] Would process 2,147 members:
  - Would create: 2,100
  - Would update: 47
  - Would skip: 0

[DRY RUN] Would process 523 events:
  - Would create: 500
  - Would update: 23
  - Would skip: 0

[DRY RUN] Would process ~8,600 registrations:
  - Estimated creates: ~8,400
  - Estimated updates: ~200

============================================================
  Dry Run Complete
  Duration: 5m 12s
  No database changes were made.
============================================================
```

## 5. Single Entity Sync

### 5.1 Sync Single Member

```bash
# By WA contact ID
npx tsx scripts/importing/wa_sync_member.ts --wa-id 12345

# By email
npx tsx scripts/importing/wa_sync_member.ts --email john@example.com
```

### 5.2 Sync Single Event

```bash
# By WA event ID
npx tsx scripts/importing/wa_sync_event.ts --wa-id 67890
```

### 5.3 Probe Event Registrations (Diagnostic Mode)

Use probe mode to debug why registrations aren't being imported for a specific event:

```bash
# Probe a specific event's registrations
npx tsx scripts/importing/wa_full_sync.ts --probe-event-id 12345
```

This mode:

- Fetches the event from WA and checks if it's mapped
- Fetches all registrations for that event
- Analyzes each registration to determine if it would be imported or skipped
- Reports detailed reasons for any skips

Example output:

```
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
```

See [WA_REGISTRATIONS_DIAGNOSTIC.md](./WA_REGISTRATIONS_DIAGNOSTIC.md) for detailed troubleshooting.

## 6. Troubleshooting

### 6.1 Common Errors

#### Error: WA_API_KEY not set

```
FATAL: WA_API_KEY environment variable is required
```

**Fix**: Set the environment variable:

```bash
export WA_API_KEY=your_api_key_here
```

#### Error: Production safety check failed

```
FATAL: Production import requires ALLOW_PROD_IMPORT=1
```

**Fix**: Explicitly opt in to production writes:

```bash
ALLOW_PROD_IMPORT=1 npx tsx scripts/importing/wa_full_sync.ts
```

#### Error: WA API rate limited

```
ERROR: WA API returned 429 Too Many Requests
Waiting 60 seconds before retry...
```

**Fix**: Wait for rate limit to clear. The script will auto-retry.

#### Error: Token refresh failed

```
ERROR: Failed to refresh WA access token
```

**Fix**: Verify WA_API_KEY is valid. Keys may expire or be revoked.

#### Issue: 0 registrations imported

```
Registrations: 0 created, 0 updated, 15000 skipped
```

**Root cause**: Registrations depend on both Member and Event mappings. If these don't exist, registrations are skipped.

**Diagnosis**:

1. Check the Registration Diagnostics output at the end of the sync
2. Look for "Missing member mapping" count - if high, members weren't imported
3. Use probe mode to analyze a specific event:

```bash
npx tsx scripts/importing/wa_full_sync.ts --probe-event-id <EVENT_ID>
```

**Common causes**:

- Only a subset of contacts were fetched (check "Received X contacts" in logs)
- Members sync failed silently
- Running incremental sync before any full sync was done

**Fix**: Re-run full sync to ensure all members are mapped first.

See [WA_REGISTRATIONS_DIAGNOSTIC.md](./WA_REGISTRATIONS_DIAGNOSTIC.md) for detailed guidance.

### 6.2 Log Files

```bash
# View recent sync logs
tail -f logs/wa_sync.log

# View errors only
grep ERROR logs/wa_sync.log

# View specific sync run
grep "syncRunId=abc123" logs/wa_sync.log
```

### 6.3 Database Queries

```sql
-- Check last sync state
SELECT * FROM "WaSyncState" ORDER BY "updatedAt" DESC LIMIT 1;

-- Check recent ID mappings
SELECT * FROM "WaIdMapping" ORDER BY "syncedAt" DESC LIMIT 20;

-- Check for orphaned mappings
SELECT wm.* FROM "WaIdMapping" wm
LEFT JOIN "Member" m ON wm."clubosId" = m.id AND wm."entityType" = 'Member'
WHERE m.id IS NULL AND wm."entityType" = 'Member';

-- Check import audit logs
SELECT * FROM "AuditLog"
WHERE metadata->>'source' = 'wa_import'
ORDER BY "createdAt" DESC LIMIT 50;
```

## 7. Cron Setup

### 7.1 Recommended Schedule

```cron
# Incremental sync nightly at 3 AM Pacific
0 3 * * * cd /app && ALLOW_PROD_IMPORT=1 npx tsx scripts/importing/wa_incremental_sync.ts >> logs/wa_sync.log 2>&1

# Full sync weekly on Sunday at 2 AM Pacific
0 2 * * 0 cd /app && ALLOW_PROD_IMPORT=1 npx tsx scripts/importing/wa_full_sync.ts >> logs/wa_sync.log 2>&1
```

### 7.2 With Retry Wrapper

```bash
#!/bin/bash
# scripts/importing/run_sync_with_retry.sh

MAX_RETRIES=3
RETRY_DELAY=60

for attempt in $(seq 1 $MAX_RETRIES); do
    echo "Attempt $attempt of $MAX_RETRIES"

    if npx tsx scripts/importing/wa_incremental_sync.ts; then
        echo "Sync completed successfully"
        exit 0
    fi

    if [ $attempt -lt $MAX_RETRIES ]; then
        echo "Sync failed, waiting ${RETRY_DELAY}s before retry..."
        sleep $RETRY_DELAY
        RETRY_DELAY=$((RETRY_DELAY * 2))  # Exponential backoff
    fi
done

echo "All $MAX_RETRIES attempts failed"
# Send alert here
exit 1
```

## 8. Recovery Procedures

### 8.1 Partial Sync Failure

If sync fails partway through:

1. Check error logs to identify failure point
2. Re-run the same sync (idempotent)
3. Script will skip already-synced records

```bash
# Just re-run - it's idempotent
npx tsx scripts/importing/wa_full_sync.ts
```

### 8.2 Corrupted ID Mappings

If WaIdMapping table is corrupted:

```sql
-- DANGER: This will cause re-creation of all records
-- Only use if absolutely necessary
TRUNCATE "WaIdMapping";
```

Then run full sync to rebuild mappings.

### 8.3 Restore Soft-Deleted Records

```sql
-- Find soft-deleted members
SELECT * FROM "Member" WHERE "deletedAt" IS NOT NULL;

-- Restore a specific member
UPDATE "Member" SET "deletedAt" = NULL WHERE id = 'uuid-here';
```

## 9. Monitoring

### 9.1 Import Status Endpoint

```bash
# Requires admin authentication
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/admin/import/status
```

Expected response:

```json
{
  "preflight": {
    "ok": true,
    "checks": {
      "database": true,
      "waIdMappingTable": true,
      "waSyncStateTable": true,
      "membershipStatuses": true
    },
    "missingStatuses": []
  },
  "syncState": {
    "lastFullSync": "2025-12-15T02:00:00.000Z",
    "lastIncSync": "2025-12-17T03:00:00.000Z",
    "lastContactSync": "2025-12-17T03:00:00.000Z",
    "lastEventSync": "2025-12-17T03:00:00.000Z",
    "lastRegSync": "2025-12-17T03:00:00.000Z",
    "updatedAt": "2025-12-17T03:00:00.000Z"
  },
  "stats": {
    "members": { "total": 2147, "mapped": 2100, "lastSynced": "..." },
    "events": { "total": 523, "mapped": 500, "lastSynced": "..." },
    "registrations": { "total": 8603, "mapped": 8400, "lastSynced": "..." }
  },
  "staleRecords": {
    "threshold": "2025-12-10T03:00:00.000Z",
    "staleDaysThreshold": 7,
    "counts": {
      "members": 0,
      "events": 0,
      "registrations": 0
    }
  }
}
```

### 9.2 Stale Record Detection

Records not seen in recent syncs may have been deleted in WA. The status endpoint reports stale counts.

To investigate stale records programmatically:

```typescript
import { detectStaleRecords } from "@/lib/importing/wildapricot";

// Find records not synced in 7 days
const stale = await detectStaleRecords(7);
console.log(stale.staleMembers);  // Array of stale member records
```

To cleanup orphaned WaIdMapping records (after confirming deletion):

```typescript
import { cleanupStaleMappings } from "@/lib/importing/wildapricot";

// Preview what would be removed
const preview = await cleanupStaleMappings(30, true);
console.log(`Would remove ${preview.removed} mappings`);

// Actually remove (DANGER)
const result = await cleanupStaleMappings(30, false);
console.log(`Removed ${result.removed} mappings`);
```

### 9.3 Metrics to Monitor

- `wa_sync_duration_seconds` - Time taken for sync
- `wa_sync_records_processed` - Records processed per entity type
- `wa_sync_errors_total` - Error count
- `wa_api_requests_total` - API request count
- `wa_api_latency_seconds` - API response time

## 10. Contacts

| Role | Contact | When to Contact |
|------|---------|-----------------|
| On-call engineer | #ops-alerts | Sync failures |
| WA admin | admin@example.org | API key issues |
| Database admin | #db-help | Database issues |

## 11. Revision History

| Date | Author | Change |
|------|--------|--------|
| 2025-12-17 | System | Initial runbook |
