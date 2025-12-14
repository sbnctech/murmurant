# Query Filter Catalog

Worker 2 — Filter Catalog + Sort Keys — Report

---

## Purpose

Define a strict whitelist of allowed filters and sorts per entity. List gadgets and chatbot queries may only request query shapes defined in this catalog. No free-form query language. No dynamic filter construction.

---

## Members

### Allowed Filters (10)

| Filter | Type | Semantics | RBAC Notes |
|--------|------|-----------|------------|
| status | enum | active, lapsed, prospect | Admin/VP Membership: all; Member: self only |
| membership_level | enum | individual, couple, alumni | Admin/VP Membership: all; Member: self only |
| name_contains | string | Case-insensitive substring match on display name | Admin/VP: all; Member: none |
| email_domain | string | Exact match on email domain (e.g., "gmail.com") | Admin only |
| joined_after | date | Members who joined on or after date | Admin/VP Membership |
| joined_before | date | Members who joined on or before date | Admin/VP Membership |
| expires_before | date | Membership expiring before date | Admin/VP Membership |
| committee_id | uuid | Members in specific committee | VP/Chair: own committee; Admin: all |
| has_role | enum | admin, vp, chair, member | Admin only |
| last_login_after | date | Members who logged in after date | Admin only |

### Allowed Sorts (4)

| Key | Directions | Notes |
|-----|------------|-------|
| display_name | asc, desc | Default: asc |
| joined_at | asc, desc | Newest/oldest first |
| expires_at | asc, desc | Soonest expiration first |
| last_login_at | asc, desc | Admin only |

### Defaults

- Default sort: display_name asc
- Default page size: 50
- Max page size: 200

### Sensitive Fields Policy

| Field | Admin | VP Membership | Chair | Member |
|-------|-------|---------------|-------|--------|
| email | full | full | own committee | self only |
| phone | full | full | redacted | self only |
| address | full | redacted | never | self only |
| payment_method | never | never | never | never |

---

## Events

### Allowed Filters (10)

| Filter | Type | Semantics | RBAC Notes |
|--------|------|-----------|------------|
| status | enum | draft, published, cancelled | Admin/VP: all; Chair: own; Member: published only |
| category_id | uuid | Events in specific activity category | All roles |
| starts_after | date | Events starting on or after date | All roles |
| starts_before | date | Events starting on or before date | All roles |
| chair_id | uuid | Events chaired by specific member | Admin/VP: all; Chair: self |
| has_capacity | boolean | Events with available spots | All roles |
| has_waitlist | boolean | Events with active waitlist | Admin/VP/Chair |
| is_free | boolean | Events with zero cost | All roles |
| location_contains | string | Substring match on location | All roles |
| created_by | uuid | Events created by specific user | Admin only |

### Allowed Sorts (4)

| Key | Directions | Notes |
|-----|------------|-------|
| starts_at | asc, desc | Default: asc (upcoming first) |
| created_at | asc, desc | Newest created first |
| title | asc, desc | Alphabetical |
| registration_count | asc, desc | Admin/VP only |

### Defaults

- Default sort: starts_at asc
- Default page size: 25
- Max page size: 100

### Sensitive Fields Policy

| Field | Admin | VP Activities | Chair | Member |
|-------|-------|---------------|-------|--------|
| title | full | full | full | published only |
| description | full | full | full | published only |
| cost | full | full | full | published only |
| internal_notes | full | full | own events | never |
| revenue_total | full | full | never | never |

---

## Registrations

### Allowed Filters (10)

| Filter | Type | Semantics | RBAC Notes |
|--------|------|-----------|------------|
| event_id | uuid | Registrations for specific event | Chair: own events; VP/Admin: all |
| member_id | uuid | Registrations by specific member | Admin: all; Member: self only |
| status | enum | confirmed, waitlisted, cancelled | All (scoped by role) |
| registered_after | date | Registrations created after date | Admin/VP/Chair |
| registered_before | date | Registrations created before date | Admin/VP/Chair |
| payment_status | enum | paid, pending, refunded | Admin/Finance only |
| is_guest | boolean | Guest registrations only | Chair: own events; Admin: all |
| cancelled_by | enum | member, chair, admin, system | Admin/VP only |
| waitlist_position | number | Specific position or range | Chair: own events; Admin: all |
| checked_in | boolean | Attendance confirmed | Chair: own events; Admin: all |

### Allowed Sorts (4)

| Key | Directions | Notes |
|-----|------------|-------|
| created_at | asc, desc | Default: desc (newest first) |
| waitlist_position | asc, desc | Waitlist order |
| member_name | asc, desc | Alphabetical by registrant |
| checked_in_at | asc, desc | Check-in time |

### Defaults

- Default sort: created_at desc
- Default page size: 50
- Max page size: 500

### Sensitive Fields Policy

| Field | Admin | VP | Chair | Member |
|-------|-------|-----|-------|--------|
| member_name | full | full | own events | self only |
| member_email | full | full | own events | self only |
| payment_amount | full | redacted | redacted | self only |
| payment_method | never | never | never | never |
| cancellation_reason | full | full | own events | self only |

---

## Payments (Read-Only)

### Allowed Filters (8)

| Filter | Type | Semantics | RBAC Notes |
|--------|------|-----------|------------|
| member_id | uuid | Payments by specific member | Admin/Finance: all; Member: self only |
| event_id | uuid | Payments for specific event | Admin/Finance only |
| status | enum | completed, pending, refunded, failed | Admin/Finance: all; Member: self only |
| created_after | date | Payments after date | Admin/Finance |
| created_before | date | Payments before date | Admin/Finance |
| amount_min | decimal | Minimum amount | Admin/Finance only |
| amount_max | decimal | Maximum amount | Admin/Finance only |
| type | enum | registration, refund, fee | Admin/Finance: all; Member: self only |

### Allowed Sorts (3)

| Key | Directions | Notes |
|-----|------------|-------|
| created_at | asc, desc | Default: desc |
| amount | asc, desc | Admin/Finance only |
| status | asc, desc | Group by status |

### Defaults

- Default sort: created_at desc
- Default page size: 25
- Max page size: 100

### Sensitive Fields Policy

| Field | Admin | Finance | VP | Member |
|-------|-------|---------|-----|--------|
| amount | full | full | never | self only |
| payment_method | last4 only | last4 only | never | self only (last4) |
| transaction_id | full | full | never | never |
| processor_response | full | full | never | never |
| card_number | never | never | never | never |
| cvv | never | never | never | never |

---

## Implementation Rules

### Filter Validation

- All filters validated against this catalog before execution
- Unknown filter names rejected with error
- Filter values validated against declared type
- RBAC enforced before query execution, not after

### Sort Validation

- Only whitelisted sort keys accepted
- Invalid sort keys default to entity default sort
- Direction must be explicit (asc or desc)

### Pagination

- Cursor-based pagination required for all list queries
- Offset pagination not supported (performance)
- Page size capped per entity as defined above

### Sensitive Field Handling

- Redacted fields return "[REDACTED]" string, not null
- "Never" fields are omitted from response entirely
- "Last4 only" returns masked format: "****1234"
- Field visibility determined at query time, not display time

---

## Verdict

READY FOR REVIEW
