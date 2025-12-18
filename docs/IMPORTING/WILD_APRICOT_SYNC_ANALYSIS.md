# Wild Apricot Sync System Analysis

This document provides a comprehensive analysis of the existing Wild Apricot (WA) data extraction pipeline in the chatbot repository, for the purpose of understanding what can be reused or adapted for ClubOS data ingestion.

## 1. System Overview

The WA sync system resides in `/Users/edf/wa-dev/` and consists of Python scripts that extract data from the Wild Apricot API and store it in a SQLite database (`wa.db`).

### 1.1 Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Full Sync | `/Users/edf/wa-dev/wa_full_sync.py` | Complete data extraction (all entities) |
| Incremental Sync | `/Users/edf/wa-dev/wa_incremental_sync.py` | Delta extraction (changed records only) |
| Nightly Job | `/Users/edf/wa-dev/nightly_wa_sync.sh` | Shell wrapper for cron execution |
| Retry Wrapper | `/Users/edf/wa-dev/cron/run_incremental_sync_with_retry.sh` | Retry logic with alerting |
| DB Optimizer | `/Users/edf/wa-dev/wa_db_optimizer.py` | Creates indexes and materialized views |
| Config | `/Users/edf/wa-dev/wa_config.json` | API credentials and settings |

### 1.2 Schedule

The sync runs nightly at 3 AM Pacific via cron:

```
0 3 * * * cd /home/sbnewcom/wa-dev && ./cron/run_incremental_sync_with_retry.sh
```

## 2. Authentication Method

The system uses **OAuth 2.0 Client Credentials Flow** with an API key:

```python
# From wa_full_sync.py:190-252
AUTH_URL = "https://oauth.wildapricot.org/auth/token"

# API key is base64 encoded as "APIKEY:{api_key}"
credentials = base64.b64encode(f"APIKEY:{self._api_key}".encode()).decode()

response = requests.post(
    AUTH_URL,
    headers={
        "Authorization": f"Basic {credentials}",
        "Content-Type": "application/x-www-form-urlencoded"
    },
    data={
        "grant_type": "client_credentials",
        "scope": "auto"
    }
)
```

**Token Management:**

- Tokens are cached with automatic refresh 5 minutes before expiry (`TOKEN_EXPIRY_BUFFER_SECONDS = 300`)
- Token lifetime is typically 30 minutes (1800 seconds)
- Credentials stored in `wa_config.json` (not version controlled)

## 3. Extraction Pipeline

### 3.1 Data Flow Diagram

```
┌─────────────────────┐
│   Wild Apricot API  │
│  api.wildapricot.org│
└──────────┬──────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────┐
│                    WildApricotDataSync                   │
├──────────────────────────────────────────────────────────┤
│  1. _get_access_token() → OAuth token                    │
│  2. _make_api_request() → Authenticated requests         │
│  3. _poll_async_result() → Handle async queries          │
│  4. _fetch_paginated() → Handle pagination               │
└──────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────┐
│                    Entity Fetchers                       │
├──────────────────────────────────────────────────────────┤
│  fetch_contacts()      → All/incremental members         │
│  fetch_events()        → All events                      │
│  fetch_event_registrations() → Per-event registrations   │
│  fetch_invoices()      → All invoices                    │
│  fetch_payments()      → All payments                    │
│  fetch_membership_levels() → Membership tiers            │
│  fetch_sent_emails()   → Email logs with recipients      │
└──────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────┐
│                    Normalizers/Enrichers                 │
├──────────────────────────────────────────────────────────┤
│  enrich_upcoming_events_with_organizer()                 │
│  fetch_event_pricing() → Registration types + pricing    │
│  enrich_events_with_committee() → Derive from name/email │
└──────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────┐
│                    SQLite Database                       │
│                      wa.db                               │
├──────────────────────────────────────────────────────────┤
│  contacts              │  membership_levels              │
│  events                │  invoices                       │
│  event_registrations   │  payments                       │
│  event_ticket_types    │  sent_emails                    │
│  email_recipients_log  │                                 │
└──────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────┐
│                    wa_db_optimizer.py                    │
│  Creates indexes and convenience views                   │
└──────────────────────────────────────────────────────────┘
```

### 3.2 Pagination Handling

The system implements WA's OData-style pagination (`$top`, `$skip`):

```python
# From wa_full_sync.py:391-461
def _fetch_paginated(self, endpoint: str, page_size: int = 100) -> List[Dict]:
    all_items = []
    skip = 0

    while True:
        params = {'$top': page_size, '$skip': skip}
        response = self._make_api_request('GET', endpoint, params=params)
        items = response.get('Items', response.get('Events', response.get('Invoices', [])))

        if not items:
            break

        all_items.extend(items)

        if len(items) < page_size:
            break

        skip += page_size

    return all_items
```

### 3.3 Async Query Handling

Large queries (e.g., all contacts) use async polling:

```python
# From wa_full_sync.py:317-389
def _poll_async_result(self, result_url: str, max_attempts: int = 40) -> List[Dict]:
    for attempt in range(max_attempts):
        time.sleep(ASYNC_POLL_INTERVAL_SECONDS)  # 3 seconds

        response = requests.get(result_url, headers={'Authorization': f'Bearer {token}'})
        result = response.json()
        state = result.get('State')

        if state == 'Complete':
            return result.get('Contacts', result.get('Items', []))
        elif state == 'Failed':
            raise AsyncQueryError(f"Async query failed: {result.get('ErrorDetails')}")
```

### 3.4 Rate Limiting and Retries

- **Default timeout:** 30 seconds per request
- **Retry wrapper:** 3 attempts with exponential backoff (60s, 120s, 180s)
- **Timeout retry:** 5-second delay on timeout, then retry same page
- **Partial results:** Returns partial data if error occurs mid-pagination

## 4. Entities Extracted

### 4.1 Contacts (Members)

**Source:** `/v2.2/accounts/{id}/contacts`

**Fields Extracted:**

| WA Field | SQLite Column | Notes |
|----------|---------------|-------|
| Id | Id | WA contact ID (integer) |
| FirstName | FirstName | |
| LastName | LastName | |
| Email | Email | |
| DisplayName | DisplayName | |
| Organization | Organization | |
| MembershipLevel.Id | MembershipLevelId | FK to membership_levels |
| MembershipLevel.Name | MembershipLevelName | Denormalized |
| Status | Status | Active, Lapsed, PendingNew, etc. |
| MemberSince | MemberSince | ISO8601 date string |
| IsSuspendedMember | IsSuspended | Boolean |
| ProfileLastUpdated | ProfileLastUpdated | ISO8601 datetime |
| IsAccountAdministrator | IsAccountAdministrator | Boolean |
| FieldValues | FieldValues | JSON blob of custom fields |

**Custom Fields Flattened:**

- PreviousResidence, Age, HowDidYouHear, DateMovedToSB
- City, ZipCode, Phone, StreetAddress
- BoardParticipation, ChairParticipation, CommitteeMemberParticipation
- HasSignificantOther, SpouseFirstName, SpouseLastName
- SpecialSkills, WillingToHostEvents, SelfIntroduction
- ThirdYearEligibility, ApprovalDateExtended, InternalNotes
- NewMember, OptionalParticipationNotes
- LastLoginDate, IsArchived, IsDonor, IsEventAttendee, IsMember
- Balance, CreationDate, LastUpdated, RenewalDue

### 4.2 Events

**Source:** `/v2.2/accounts/{id}/events`

**Fields Extracted:**

| WA Field | SQLite Column | Notes |
|----------|---------------|-------|
| Id | Id | WA event ID |
| Name | Name | Event title |
| StartDate | StartDate | ISO8601 datetime |
| EndDate | EndDate | ISO8601 datetime |
| Location | Location | Venue info |
| Details.Organizer.Id | OrganizerContactId | Requires enrichment call |
| RegistrationEnabled | RegistrationEnabled | Boolean |
| RegistrationsLimit | RegistrationsLimit | Capacity |
| ConfirmedRegistrationsCount | ConfirmedRegistrationsCount | |
| PendingRegistrationsCount | PendingRegistrationsCount | |
| AccessLevel | Status | Public, Restricted, etc. |
| Tags | Tags | JSON array |
| Details | Details | JSON blob |

**Enriched Fields:**

- MinPrice, MaxPrice, IsFree (from EventRegistrationTypes)
- HasGuestTickets (derived from pricing)
- RegistrationOpenDate (earliest AvailableFrom)
- Committee (derived from organizer email or event name)

### 4.3 Event Registrations

**Source:** `/v2.2/accounts/{id}/eventregistrations?eventId={id}`

**Fields Extracted:**

| WA Field | SQLite Column | Notes |
|----------|---------------|-------|
| Id | Id | Registration ID |
| Event.Id | EventId | FK to events |
| Contact.Id | ContactId | FK to contacts |
| RegistrationType.Id | RegistrationTypeId | |
| RegistrationType.Name | RegistrationType | e.g., "Newbie", "Newcomer" |
| Status | Status | Confirmed, Cancelled, etc. |
| RegistrationDate | RegistrationDate | ISO8601 datetime |
| IsCheckedIn | IsCheckedIn | Boolean |
| OnWaitlist | OnWaitlist | Boolean |

### 4.4 Invoices

**Source:** `/v2.2/accounts/{id}/invoices`

**Fields:** Id, DocumentNumber, DocumentDate, ContactId, EventId, Status, Value, OutstandingBalance, CreatedDate, UpdatedDate

### 4.5 Membership Levels

**Source:** `/v2.2/accounts/{id}/membershiplevels`

**Fields:** Id, Name, MembershipFee, RenewalEnabled, Description

### 4.6 Email Logs (Optional)

**Source:** `/v2.2/accounts/{id}/SentEmails`, `/v2.2/accounts/{id}/SentEmailRecipients`

**Purpose:** Track email engagement (opens, clicks, bounces)

## 5. Data Freshness Strategy

### 5.1 Full Sync

- Runs weekly (Sundays at 2 AM)
- Drops and rebuilds all tables
- Duration: ~15-30 minutes depending on data volume

### 5.2 Incremental Sync

- Runs nightly at 3 AM
- Uses filtering for efficiency:
  - **Contacts:** `'Profile last updated' gt {yesterday}` filter
  - **Events:** `StartDate ge {today}` filter (future events only)
  - **Invoices:** `CreatedDate gt {last_invoice_date}` filter
  - **Registrations:** Re-fetched for all upcoming events (to catch status changes)

### 5.3 State Tracking

Sync state is persisted in `sync_state.json`:

```json
{
  "last_sync": "2025-12-17T03:15:42.123456",
  "last_levels_sync": "2025-12-14T03:12:33.789012"
}
```

## 6. Error Handling and Alerting

### 6.1 Retry Logic

```bash
# From run_incremental_sync_with_retry.sh
MAX_RETRIES=3

for attempt in $(seq 1 $MAX_RETRIES); do
    if python3 wa_incremental_sync.py; then
        exit 0
    fi

    # Exponential backoff: 60s, 120s, 180s
    DELAY=$((attempt * 60))
    sleep $DELAY
done

send_alert "All $MAX_RETRIES attempts failed"
```

### 6.2 Alert Channels

- Email alerts to `tech@sbnewcomers.org` on failure
- Exit code 1 if email address changes detected (for monitoring)
- Log files in `/Users/edf/wa-dev/logs/`

## 7. Database Schema Optimizations

The `wa_db_optimizer.py` creates:

### 7.1 Indexes

- `idx_contacts_email`, `idx_contacts_status`, `idx_contacts_member_since`
- `idx_events_start_date`, `idx_events_status`
- `idx_registrations_event`, `idx_registrations_contact`, `idx_registrations_status`
- `idx_invoices_contact`, `idx_invoices_status`

### 7.2 Materialized Views

- `v_contacts_full` - Contacts with membership level join
- `v_events_upcoming` - Future events with registration counts
- `v_registrations_enriched` - Registrations with contact and event details
- `v_member_email_engagement` - Email open/click tracking

## 8. Configuration

### 8.1 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `WA_CONFIG_FILE` | Path to config JSON | No (defaults to `wa_config.json`) |

### 8.2 Config File Structure

```json
{
  "wildapricot": {
    "api_key": "YOUR_API_KEY",
    "account_id": "176353"
  },
  "database_path": "wa.db",
  "log_level": "INFO"
}
```

## 9. Known Limitations

1. **SQLite Only:** No support for PostgreSQL target (ClubOS uses Postgres)
2. **No Idempotency Keys:** Uses `INSERT OR REPLACE` which may lose audit history
3. **No Soft Deletes:** Records removed from WA are not tracked
4. **No Relational Integrity:** Foreign keys are integers (WA IDs), not UUIDs
5. **Time Zone Handling:** ISO8601 strings stored as-is, no normalization
6. **No Transaction Batching:** Individual inserts, not bulk operations
7. **Committee Derivation:** Based on email prefix or event name parsing (fragile)

## 10. Performance Characteristics

| Operation | Typical Duration | Notes |
|-----------|------------------|-------|
| Full contacts sync | 3-5 minutes | ~2000 contacts, async query |
| Full events sync | 1-2 minutes | ~500 events with pagination |
| Event registrations | 5-10 minutes | Per-event API call |
| Incremental sync | 2-5 minutes | Depends on changes |

## 11. Security Considerations

- API key stored in plaintext in `wa_config.json`
- Token not exposed in logs (explicit filtering)
- No secrets in version control (`.gitignore`)
- Credentials required for production access to WA admin panel
