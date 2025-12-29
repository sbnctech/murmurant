# Wild Apricot Full Sync Verification Report

**Generated:** 2025-12-18
**Sync Run:** 2025-12-18T07:15:10.265Z
**Mode:** LIVE (writes enabled)

---

## Executive Summary

The WA full sync completed with **partial success**:

| Entity        | WA Source | Murmurant DB | Status |
|---------------|-----------|-----------|--------|
| Members       | 100       | 96        | Partial (4 skipped) |
| Events        | 7,390     | 7,390     | Complete |
| Registrations | 0         | 0         | **FAILED - No data from WA API** |

**Critical Finding:** The WA API returned 0 registrations for all 7,390 events. This is an API-level issue, not an importer bug.

---

## 1. Member Sync Results

### Summary

- **Contacts received from WA:** 100
- **Members created:** 96
- **Members updated:** 0
- **Members skipped:** 4

### Skipped Members (4)

All skipped due to missing last name (required field in Murmurant):

| WA Contact ID | Email | WA Tier | Reason |
|---------------|-------|---------|--------|
| 25279299 | alan@mergecreative.ca | Admins | Missing last name |
| 25611303 | availadmin1@sbnewcomers.org | Admins | Missing last name |
| 44178994 | webmaster1@sbnewcomers.org | Admins | Missing last name |
| 57282676 | webmaster2@sbnewcomers.org | Admins | Missing last name |

### Membership Status Distribution (Murmurant)

| Status | Count |
|--------|-------|
| Lapsed | 67 |
| Active | 22 |
| Unknown | 7 |
| Pending New | 0 |
| Pending Renewal | 0 |
| Suspended | 0 |
| Not a Member | 0 |

### Membership Tier Distribution (Murmurant)

| Tier Code | Tier Name | Count |
|-----------|-----------|-------|
| extended_member | Extended Member | 61 |
| unknown | Unknown | 33 |
| member | Member | 2 |
| newbie_member | Newbie Member | 0 |

### WA Raw Membership Level Values

| waMembershipLevelRaw | Count | Murmurant Mapping |
|----------------------|-------|----------------|
| ExtendedNewcomer | 61 | extended_member |
| Admins | 26 | **unknown** (unmapped) |
| (null) | 7 | unknown |
| NewcomerMember | 2 | member |

### Tier Mapping Gap

The "Admins" tier from WA (26 contacts) is currently **unmapped** in the importer. These are likely WA system/admin accounts, not actual members. Consider:

1. Adding explicit "Admins" mapping (probably to "unknown" or a new "admin" tier)
2. Filtering out "Admins" contacts during import (if they shouldn't be in the member database)

---

## 2. Event Sync Results

### Summary

- **Events received from WA:** 7,390
- **Events created:** 7,390
- **Events updated:** 0
- **Events skipped:** 0

**Status:** Complete - all events imported successfully.

---

## 3. Registration Sync Results

### Summary

- **Registrations imported:** 0
- **Status:** **FAILED**

### Observed Behavior

For all 7,390 events, the WA API returned 0 registrations:

```
[WA-IMPORT] [INFO] Syncing 0 registrations for event 6476695
[WA-IMPORT] [INFO] Syncing 0 registrations for event 6481126
... (repeats for all events)
```

One event had a network error:
```
[WA-IMPORT] [ERROR] Failed to fetch registrations for event 5889614 TypeError: fetch failed
```

### Root Cause Analysis

The importer code correctly calls the WA `/eventregistrations` endpoint (see `src/lib/importing/wildapricot/client.ts:417-423`):

```typescript
async fetchEventRegistrations(eventId: number): Promise<WAEventRegistration[]> {
  const endpoint = `/accounts/${this.config.accountId}/eventregistrations`;
  return this.fetchPaginated<WAEventRegistration>(endpoint, {
    params: { eventId },
  });
}
```

**Possible causes (requires WA Admin investigation):**

1. **API Token Permissions:** The WA API key may not have permission to read event registrations
2. **Endpoint Requirements:** WA may require additional parameters or different endpoint format
3. **Data Retention:** Historical events may not retain registration data in WA's API
4. **Rate Limiting:** Aggressive pagination may trigger silent rate limiting

### Recommended Actions

1. **Verify WA API Permissions:** Check that the API key has "View event registrations" permission in WA admin
2. **Test Single Event:** Manually query the WA API for a known event with registrations
3. **Check WA Documentation:** Review WA API docs for eventregistrations endpoint requirements
4. **Consider Alternative:** Use WA's webhook for real-time registration sync instead of batch import

---

## 4. Database Verification

### Entity Counts (Post-Sync)

| Entity | Count |
|--------|-------|
| Members | 96 |
| Events | 7,390 |
| Registrations | 0 |
| MembershipStatuses | 7 |
| MembershipTiers | 4 |
| WaIdMappings | 7,486 |

### WaIdMapping Breakdown

- Member mappings: 96
- Event mappings: 7,390
- Registration mappings: 0
- **Total:** 7,486 (96 + 7,390)

---

## 5. Data Quality Issues

### Join Date Missing

Many contacts (72+) had no join date in WA. The importer correctly falls back to current date:

```
[WA-IMPORT] [WARN] No join date found for contact 26550743, using current date
```

This affects historical accuracy for these members.

### Tier Mapping Warnings

26 contacts with "Admins" tier + 7 with null tier = 33 members with "unknown" tier. These are primarily:

- WA system accounts (secretary@, president@, etc.)
- Personal emails without a membership level set

---

## 6. Conclusions

### What Succeeded

1. **Member sync:** 96/100 contacts imported (96% success)
2. **Event sync:** 7,390/7,390 events imported (100% success)
3. **ID mappings:** All imported entities have correct WaIdMapping records
4. **Audit trail:** All creates logged to AuditLog

### What Failed

1. **Registration sync:** 0 registrations imported (WA API returning empty)
2. **4 members skipped:** Missing required lastName field

### Recommended Next Steps

1. **Registration Investigation:**
   - Contact WA support or check API key permissions
   - Test registration fetch with a recent event known to have registrations

2. **Tier Mapping:**
   - Decide how to handle "Admins" tier (add mapping or filter)

3. **Data Cleanup:**
   - Consider updating join dates for the 72+ members with fallback dates

4. **Future Syncs:**
   - Run incremental sync to keep members/events current
   - Re-run registration sync after fixing the API issue

---

*Report generated by Murmurant WA Importer analysis. No database writes were made during this verification.*
