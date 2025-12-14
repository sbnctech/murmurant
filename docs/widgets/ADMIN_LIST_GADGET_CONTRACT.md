# Admin List Gadget Contract

Purpose
- Standardize filtered/sorted list gadgets (members, events, registrants, payments) as safe, RBAC-enforced widgets.

Non-negotiables
- Gadget is untrusted UI: no client-side filtering of raw data.
- All filtering/sorting happens server-side using ViewerContext.
- Filter and sort keys are allowlisted per entity.
- Pagination is required. Default limit enforced server-side.

Gadget request shape (conceptual)
- entity: members|events|registrations|payments
- filters: array of { key, op, value }
- sort: { key, dir }
- page: { cursor, limit }
- columns: array of allowed column ids (server may override/redact)
- include: optional expansions (allowlisted)

Gadget response shape (conceptual)
- viewer: ViewerContext summary (role, scope, flags)
- rows: array of records (redacted per RBAC)
- page: next_cursor, total_estimate(optional)
- links: deep links to allowed pages/sections
- warnings: redaction notices, truncated results

Error codes
- 401 unauthorized
- 403 forbidden
- 404 entity not found (scoped)
- 409 conflict (invalid state)
- 422 invalid request (bad filter/sort/columns)
- 429 rate limited
- 5xx server error

Audit and observability
- Admin reads for sensitive entities SHOULD emit query audit entries (configurable).
- Admin writes are always audited (actor, target, before/after, timestamp, reason).

Test requirements
- Allow tests and deny tests for every entity
- Ensure sensitive fields never leak to insufficient roles
- Ensure unknown filter/sort keys are rejected (422)
