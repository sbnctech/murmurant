# Wild Apricot Registration Import Pipeline Analysis

Audit Date: 2024-12-18
Audit Type: Read-only code analysis (no sync runs, no schema changes)

---

## Summary

The WA registration import pipeline fetches event registrations from Wild Apricot
and upserts them into ClubOS. Registrations can be skipped for several reasons,
some of which are logged and some of which may appear silent to operators.

---

## 1. Where Registrations Are Fetched

**File**: `src/lib/importing/wildapricot/client.ts`
**Function**: `fetchEventRegistrations(eventId: number)`
**Lines**: 417-423

```typescript
async fetchEventRegistrations(eventId: number): Promise<WAEventRegistration[]> {
  const endpoint = `/accounts/${this.config.accountId}/eventregistrations`;
  return this.fetchPaginated<WAEventRegistration>(endpoint, {
    params: { eventId },
  });
}
```

**Pagination mechanism**: Uses `fetchPaginated()` which iterates with `$top` and
`$skip` query parameters until a partial page is returned.

**Page size**: Configurable via `WA_PAGE_SIZE` env var (default: 100, WA max: 500)

---

## 2. Where Registrations Are Validated

### 2.1 Pre-Transform Checks (importer.ts)

**File**: `src/lib/importing/wildapricot/importer.ts`
**Function**: `syncRegistration()`
**Lines**: 864-942

Checks performed before transform:

| Check | Line | Outcome if Failed |
|-------|------|-------------------|
| Member ID mapping exists | 872-883 | Skip + increment `registrationsSkippedMissingMember` |

### 2.2 Transform Validation (transformers.ts)

**File**: `src/lib/importing/wildapricot/transformers.ts`
**Function**: `transformRegistration()`
**Lines**: 429-464

| Validation | Outcome if Failed |
|------------|-------------------|
| Registration date parseable | Return `success: false` with error |

---

## 3. All Reasons a Registration Can Be Skipped

| Reason | Code Location | Diagnostic Counter | Logged? |
|--------|---------------|-------------------|---------|
| Event not mapped (no WaIdMapping) | importer.ts:818-824 | `eventsSkippedUnmapped` | Yes (WARN) |
| Member not mapped (no WaIdMapping for contact) | importer.ts:872-883 | `registrationsSkippedMissingMember` | First 10 only |
| Transform error (invalid date) | importer.ts:888-894 | `registrationsSkippedTransformError` | Yes (WARN) |
| Status unchanged (update case) | importer.ts:924-926 | `stats.registrations.skipped` | No |
| Fetch error for event | importer.ts:846-849 | recorded in `skipReasons` | Yes (ERROR) |

### Skip Reason Details

**Event not mapped**: The WA event ID has no corresponding ClubOS event ID in
`WaIdMapping`. This happens if:
- Event was never synced (new event in WA)
- Event sync failed previously
- Event was deleted in ClubOS but mapping remains

**Member not mapped**: The WA contact ID on the registration has no corresponding
ClubOS member ID. This happens if:
- Contact was never synced
- Contact sync failed (e.g., missing email, missing name)
- Contact was filtered out during sync

**Transform error**: The registration's `RegistrationDate` field cannot be parsed
as a valid ISO8601 date.

**Status unchanged**: Registration already exists in ClubOS with the same status.
This is a no-op skip, not an error.

---

## 4. Skip Visibility Analysis

### 4.1 Missing Member Causes Limited Logging

**Behavior**: When a registration is skipped due to missing member mapping, only
the first 10 occurrences are logged:

```typescript
// importer.ts:877-880
if (diag.registrationsSkippedMissingMember <= 10) {
  await log("WARN", `Member not found for registration ${registration.Id}...`);
}
```

**Impact**: If many members are missing mappings, operators see only 10 warnings
but the `registrationsSkippedMissingMember` counter may be much higher.

**Mitigation**: The final summary log (lines 853-861) reports the total count:
```
Registration sync complete: ... X skipped (missing member)
```

### 4.2 Missing Event Causes Skip of All Its Registrations

**Behavior**: If an event is not mapped, the entire event is skipped without
fetching its registrations:

```typescript
// importer.ts:818-824
if (!eventId) {
  diag.eventsSkippedUnmapped++;
  recordSkipReason(diag, `Event ${event.Id} not mapped`);
  await log("WARN", `Skipping registrations for unmapped event ${event.Id}`);
  continue;
}
```

**Impact**: All registrations for that event are silently not fetched.

---

## 5. Contacts Paging Limits Analysis

### 5.1 Contacts Fetch Mechanism

**File**: `src/lib/importing/wildapricot/client.ts`
**Function**: `fetchContacts()`
**Lines**: 344-372

Contacts use **async query mode** (`$async: true`), NOT pagination:

```typescript
const params: Record<string, string | number> = {
  $async: "true", // Request async processing for large result sets
};
```

The async query returns a `ResultUrl` which is polled until complete. The result
contains ALL matching contacts in one response.

**Conclusion**: Contacts are NOT limited by pagination. If contacts were missing,
it would be due to:
- WA API filter excluding them
- Async query timeout (40 attempts x 3s = 2 minutes max)
- Transform failure (missing email, missing name)

### 5.2 Registrations Fetch Mechanism

Registrations DO use pagination via `fetchPaginated()`. The pagination loop
continues until a partial page is returned:

```typescript
// client.ts:266-275
if (items.length === 0) break;
allItems.push(...items);
if (items.length < this.config.pageSize) break;
skip += this.config.pageSize;
```

**Conclusion**: Registration pagination is correctly implemented and will fetch
all registrations for a given event.

---

## 6. Sequence Diagram

```
+-------------+      +----------------+      +------------------+      +----------+
|  fullSync() |      | WA API Client  |      | syncRegistration |      |  Prisma  |
+------+------+      +-------+--------+      +--------+---------+      +----+-----+
       |                     |                        |                     |
       |  fetchEvents()      |                        |                     |
       |-------------------->|                        |                     |
       |                     |  GET /events (paged)   |                     |
       |                     |----------------------->|                     |
       |  events[]           |                        |                     |
       |<--------------------|                        |                     |
       |                     |                        |                     |
       |  For each event:    |                        |                     |
       |  +-----------------+|                        |                     |
       |  | Check eventIdMap||                        |                     |
       |  | (WaIdMapping)   ||                        |                     |
       |  +-----------------+|                        |                     |
       |       |             |                        |                     |
       |  [if unmapped]      |                        |                     |
       |  skip + log WARN    |                        |                     |
       |       |             |                        |                     |
       |  [if mapped]        |                        |                     |
       |  fetchEventRegs()   |                        |                     |
       |-------------------->|                        |                     |
       |                     | GET /eventregistrations|                     |
       |                     | ?eventId=X (paged)     |                     |
       |                     |----------------------->|                     |
       |  registrations[]    |                        |                     |
       |<--------------------|                        |                     |
       |                     |                        |                     |
       |  For each reg:      |                        |                     |
       |  +---------------------------------+         |                     |
       |  | Check memberIdMap (WaIdMapping) |         |                     |
       |  +---------------------------------+         |                     |
       |       |                                      |                     |
       |  [if member unmapped]                        |                     |
       |  skip + increment counter                    |                     |
       |  (log first 10 only)                         |                     |
       |       |                                      |                     |
       |  [if member mapped]                          |                     |
       |  transformRegistration()                     |                     |
       |--------------------------------------------->|                     |
       |       |                                      |                     |
       |  [if transform fails]                        |                     |
       |  skip + log WARN                             |                     |
       |       |                                      |                     |
       |  [if transform ok]                           |                     |
       |  upsert to DB---------------------------------------------->|      |
       |                                              |              |      |
       |                                              |  findUnique  |      |
       |                                              |<-------------|      |
       |                                              |              |      |
       |                                              | create/update|      |
       |                                              |------------->|      |
       |                                              |              |      |
       +----------------------------------------------+--------------+------+
```

---

## 7. Diagnostic Counters Available

The `RegistrationDiagnostics` struct tracks:

| Counter | Meaning |
|---------|---------|
| `eventsProcessed` | Total events iterated |
| `eventsSkippedUnmapped` | Events with no ClubOS mapping |
| `registrationFetchCalls` | Number of WA API calls made |
| `registrationsFetchedTotal` | Total registrations received from WA |
| `registrationsTransformedOk` | Registrations that passed validation |
| `registrationsSkippedMissingEvent` | (Not used - events checked before fetch) |
| `registrationsSkippedMissingMember` | Registrations skipped due to unmapped contact |
| `registrationsSkippedTransformError` | Registrations with invalid dates |
| `registrationsUpserted` | Successfully written to DB |
| `skipReasons` | Map of reason string -> count |

---

## 8. Recommendations (For Future Work)

1. **Increase logging threshold**: Consider logging more than 10 missing-member
   warnings, or provide a summary of unique missing contact IDs.

2. **Add probe command**: The existing `probeEventRegistrations()` function is
   useful for debugging specific events.

3. **Pre-sync contact check**: Before syncing registrations, verify that all
   contacts referenced by registrations exist in the member ID map.

4. **Stale mapping detection**: Use `detectStaleRecords()` to identify orphaned
   mappings that may cause silent skips.

---

## References

- `src/lib/importing/wildapricot/importer.ts` - Main sync orchestration
- `src/lib/importing/wildapricot/client.ts` - WA API client with pagination
- `src/lib/importing/wildapricot/transformers.ts` - Field validation/transformation
- `src/lib/importing/wildapricot/types.ts` - TypeScript interfaces
- `src/lib/importing/wildapricot/config.ts` - Configuration and env vars
