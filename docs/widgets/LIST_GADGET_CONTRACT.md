# List Gadget Contract

Worker 1 — List Gadget Contract — Spec

---

## Purpose

The List Gadget renders tabular data (members, events, registrations, payments, etc.) in a consistent, accessible format. It receives pre-filtered, pre-sorted data from ClubOS and displays it without modification.

**The List Gadget exists to:**

- Display rows of entity data in a table or list format
- Provide consistent column rendering across entity types
- Support pagination for large result sets
- Enable navigation to detail views via row links

---

## Non-Goals

**The List Gadget does NOT:**

- Filter data (all filtering is server-side)
- Sort data (all sorting is server-side)
- Query APIs directly (receives payload from platform)
- Enforce authorization (receives only authorized records)
- Perform aggregations or calculations
- Cache data beyond the current render cycle
- Modify, create, or delete records

**The List Gadget is a renderer, never a query engine.**

If the gadget must decide what to show, the architecture is wrong. ClubOS decides; the gadget displays.

---

## Inputs

The List Gadget receives a configuration object and a data payload.

### Configuration Inputs

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| entity | string | Yes | Entity type: members, events, registrations, payments |
| view_id | string | Yes | Named view configuration (e.g., "active_members", "upcoming_events") |
| columns | string[] | Yes | Ordered list of column keys to display |
| sort | SortSpec | No | Display sort indicator (server already sorted) |
| page_size | number | No | Rows per page (default: 25, max: 100) |
| refresh | RefreshSpec | No | Refresh cadence (default: manual) |
| row_link | string | No | URL template for row click navigation |
| empty_message | string | No | Custom empty state message |

### SortSpec

```
SortSpec {
  column: string      // Column key
  direction: 'asc' | 'desc'
}
```

Note: SortSpec is for display indication only. The server has already sorted the data.

### RefreshSpec

```
RefreshSpec {
  cadence: 'realtime' | 'polling' | 'daily' | 'manual'
  interval_seconds: number | null  // For polling only
}
```

### Data Payload Inputs

| Field | Type | Description |
|-------|------|-------------|
| rows | object[] | Array of entity records |
| total_count | number | Total records matching view (for pagination) |
| page | number | Current page (0-indexed) |
| schema_version | string | Data contract version |
| redactions | RedactionNote[] | Fields redacted due to RBAC |

---

## Output Shape

The List Gadget renders based on the payload structure.

### Row Structure

Each row contains only fields declared in the view configuration:

```
Row {
  id: string                    // Entity ID (always present)
  [column_key]: ColumnValue     // One entry per declared column
}
```

### ColumnValue Types

| Type | Rendering |
|------|-----------|
| string | Plain text |
| number | Formatted number (locale-aware) |
| currency | Currency format with symbol |
| date | Formatted date (locale-aware) |
| datetime | Formatted date and time |
| email | Mailto link |
| phone | Tel link |
| boolean | Yes/No or checkmark |
| status | Badge with color coding |
| link | Clickable URL |
| redacted | Placeholder indicating hidden value |

### Schema Version

The schema_version field indicates the data contract version:

- Format: `YYYY-MM-DD` (e.g., "2025-01-15")
- Gadget must tolerate unknown fields
- Gadget must handle missing optional fields gracefully

### Redaction Notes

When fields are redacted due to RBAC, the payload includes notes:

```
RedactionNote {
  field: string       // Column key that was redacted
  reason: string      // Generic reason (e.g., "insufficient_permission")
  count: number       // Number of rows affected
}
```

Redaction notes are for diagnostics; the gadget displays redacted placeholder, not the reason.

---

## RBAC Invariants

The following invariants are absolute and non-negotiable.

**Invariant 1: Server Pre-Filtered**

- All rows in the payload have passed RBAC checks
- The gadget receives only records the viewer is authorized to see
- No additional filtering occurs client-side

**Invariant 2: No Secrets in Payload**

- Sensitive fields are redacted server-side before payload delivery
- The gadget never receives data it should not display
- Redacted fields appear as placeholder values, not omitted

**Invariant 3: Column Visibility Enforced**

- Columns are filtered server-side based on viewer role
- Requested columns not authorized for viewer are omitted from payload
- Gadget renders only columns present in payload

**Invariant 4: View Scope Enforced**

- Named views have RBAC requirements
- Viewer must be authorized for the view_id to receive any data
- Unauthorized view requests return empty payload, not error

**Invariant 5: No Cross-Viewer Data**

- Self-scoped views return only viewer's own records
- Committee-scoped views return only viewer's committee records
- Global-scoped views require appropriate role

**Invariant 6: Pagination Does Not Leak**

- total_count reflects only authorized records
- Page navigation cannot reveal existence of unauthorized records
- Empty pages return empty rows, not 404

---

## Error Modes

The List Gadget must handle errors without leaking information.

### 401 Unauthorized

**Cause:** Viewer session expired or invalid.

**Gadget Behavior:**
- Display "Session expired" message
- Provide link to login
- Do not display stale data

### 403 Forbidden

**Cause:** Viewer authenticated but not authorized for this view.

**Gadget Behavior:**
- Display "Access denied" message
- Do not reveal what data exists
- Do not distinguish from 404

### 404 Not Found

**Cause:** View does not exist or viewer cannot access it.

**Gadget Behavior:**
- Display "Not found" message
- Identical presentation to 403
- Do not attempt to infer existence

### 422 Unprocessable Entity

**Cause:** Invalid configuration (bad column, invalid view_id).

**Gadget Behavior:**
- Display "Configuration error" message
- Log error for admin review
- Do not expose configuration details to viewer

### 429 Rate Limited

**Cause:** Too many requests from this viewer.

**Gadget Behavior:**
- Display "Please wait" message
- Show retry countdown if provided
- Do not retry automatically without backoff

### 5xx Server Error

**Cause:** ClubOS internal failure.

**Gadget Behavior:**
- Display "Service unavailable" message
- May retry with exponential backoff
- Do not expose error details

---

## Examples

Five concrete list configurations demonstrating usage.

### Example 1: Active Members List (Admin View)

```
Configuration:
  entity: "members"
  view_id: "active_members"
  columns: ["full_name", "email", "membership_level", "expiration_date", "status"]
  sort: { column: "full_name", direction: "asc" }
  page_size: 50
  row_link: "/admin/members/{id}"

RBAC:
  Required role: Admin
  Scope: global
  Sensitivity: High

Payload example:
  rows: [
    { id: "m_123", full_name: "Alice Smith", email: "alice@example.com",
      membership_level: "Regular", expiration_date: "2025-06-15", status: "active" },
    ...
  ]
  total_count: 847
  page: 0
  schema_version: "2025-01-15"
  redactions: []
```

### Example 2: Upcoming Events (Member View)

```
Configuration:
  entity: "events"
  view_id: "upcoming_public"
  columns: ["title", "event_date", "location", "spots_available", "category"]
  sort: { column: "event_date", direction: "asc" }
  page_size: 25
  row_link: "/events/{id}"
  refresh: { cadence: "daily", interval_seconds: null }

RBAC:
  Required role: Member
  Scope: global (public events only)
  Sensitivity: Low

Payload example:
  rows: [
    { id: "e_456", title: "Wine Tasting", event_date: "2025-02-10",
      location: "Community Center", spots_available: 12, category: "Social" },
    ...
  ]
  total_count: 23
  page: 0
  schema_version: "2025-01-15"
  redactions: []
```

### Example 3: My Registrations (Self-Scoped)

```
Configuration:
  entity: "registrations"
  view_id: "my_registrations"
  columns: ["event_title", "event_date", "registration_status", "amount_paid"]
  sort: { column: "event_date", direction: "desc" }
  page_size: 25
  row_link: "/my/registrations/{id}"
  refresh: { cadence: "polling", interval_seconds: 300 }

RBAC:
  Required role: Member
  Scope: self (viewer's own registrations only)
  Sensitivity: Low

Payload example:
  rows: [
    { id: "r_789", event_title: "Wine Tasting", event_date: "2025-02-10",
      registration_status: "confirmed", amount_paid: 25.00 },
    ...
  ]
  total_count: 8
  page: 0
  schema_version: "2025-01-15"
  redactions: []
```

### Example 4: Event Registrants (Event Chair View)

```
Configuration:
  entity: "registrations"
  view_id: "event_registrants"
  columns: ["member_name", "registration_date", "status", "payment_status", "dietary_notes"]
  sort: { column: "registration_date", direction: "asc" }
  page_size: 100
  row_link: "/admin/events/{event_id}/registrations/{id}"
  refresh: { cadence: "realtime", interval_seconds: null }

RBAC:
  Required role: EventChair (for owned events)
  Scope: committee (chair's events only)
  Sensitivity: Medium

Payload example:
  rows: [
    { id: "r_101", member_name: "Bob Jones", registration_date: "2025-01-05",
      status: "confirmed", payment_status: "paid", dietary_notes: "vegetarian" },
    ...
  ]
  total_count: 34
  page: 0
  schema_version: "2025-01-15"
  redactions: []

Note: dietary_notes visible to Event Chair for operational planning.
```

### Example 5: Payment History (Finance Manager View)

```
Configuration:
  entity: "payments"
  view_id: "all_payments"
  columns: ["transaction_date", "member_name", "description", "amount", "status", "method"]
  sort: { column: "transaction_date", direction: "desc" }
  page_size: 50
  row_link: "/admin/payments/{id}"
  refresh: { cadence: "manual", interval_seconds: null }

RBAC:
  Required role: FinanceManager or Admin
  Scope: global
  Sensitivity: High

Payload example:
  rows: [
    { id: "p_202", transaction_date: "2025-01-12", member_name: "Carol White",
      description: "Wine Tasting registration", amount: 25.00,
      status: "completed", method: "credit_card" },
    ...
  ]
  total_count: 1243
  page: 0
  schema_version: "2025-01-15"
  redactions: []

Note: Payment card details (last 4 digits, etc.) are NOT included;
only transaction metadata visible.
```

---

## Test Expectations

All List Gadget implementations must pass these test categories.

### Positive Tests

- Renders all provided columns in correct order
- Displays pagination controls when total_count > page_size
- Navigates to row_link URL on row click
- Handles empty payload with empty_message
- Displays sort indicator matching SortSpec
- Tolerates unknown fields in payload (ignores them)
- Handles all ColumnValue types correctly

### Deny Tests (Mandatory)

**These tests are required for security validation.**

| Test | Expectation |
|------|-------------|
| Unauthorized view_id request | Returns empty payload, not error |
| Request for columns not in view | Columns omitted from payload |
| Self-scoped view for other user | Returns only viewer's records |
| Committee-scoped view cross-committee | Returns only viewer's committee |
| Global view without Admin role | Returns 403 or empty based on view config |
| Attempt to inject filter via config | Filter ignored; server filter applies |
| Attempt to inject sort via payload | Sort ignored; server sort applies |
| Request with expired session | Returns 401, gadget shows login prompt |

### Redaction Tests

- Redacted fields display placeholder, not empty
- Redaction notes logged but not displayed to viewer
- Partial redaction (some rows redacted) renders correctly
- Full redaction (all rows redacted) shows empty state

### Error Handling Tests

- 401 displays session expired message
- 403 displays access denied (identical to 404)
- 404 displays not found (identical to 403)
- 422 displays configuration error
- 429 displays rate limit with retry indication
- 5xx displays service unavailable

### Pagination Tests

- Page 0 displays first page_size rows
- Page N displays correct offset
- Last page displays remaining rows (may be < page_size)
- Page beyond total returns empty rows
- total_count reflects authorized records only

---

## Cross-References

- Homepage Gadget Architecture: docs/architecture/HOMEPAGE_GADGET_ARCHITECTURE.md
- Widget Data Contract Principles: docs/architecture/WIDGET_DATA_CONTRACT_PRINCIPLES.md
- RBAC Overview: docs/rbac/AUTH_AND_RBAC.md

---

## Verdict

READY FOR REVIEW
