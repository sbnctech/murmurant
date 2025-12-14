# Admin Query Filter Catalog

Goal
- Enumerate allowed filter/sort keys per entity and their RBAC sensitivity.

Members
- Filters (allowlist): status, member_type, joined_after, renewed_before, last_name_prefix, email_prefix (role-gated), phone_prefix (role-gated)
- Sorts (allowlist): last_name, first_name, created_at, status

Events
- Filters: start_after, start_before, category, tag, location, status, has_waitlist
- Sorts: start_at, created_at, title

Registrations
- Filters: event_id, member_id (scoped), status, created_after
- Sorts: created_at, status

Payments (if/when enabled)
- Filters: payer_member_id (scoped), status, date_after, date_before, amount_range
- Sorts: date, amount, status

RBAC sensitivity notes
- Email, phone, address are always role-gated and may be redacted.
- Payment method details must be redacted except Finance role.
