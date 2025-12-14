# Entity List Gadgets Matrix

Worker 2 - Entity List Gadgets Matrix - Report

## Purpose
Define the standard read-only "list gadget" shapes for common entities (members, events, registrations, payments, committees),
including allowed filters, sort keys, pagination rules, and RBAC-sensitive fields.

## Scope
- Read-only list gadgets only
- No UI implementation
- No new backend endpoints required (contract only)
- Assumes server-side RBAC + field filtering

## Standard List Gadget Contract
All list gadgets must support:
- pagination: limit, cursor (or page), stable ordering
- sorting: explicit allowlist only
- filtering: explicit allowlist only
- output: schema-stable rows + optional summary counts (if allowed)
- errors: 401/403/404 + validation errors for illegal filters/sorts

## Entity Coverage

### Members
Allowed filters (examples):
- status (active/lapsed)
- membership_level
- joined_after/joined_before
- last_renewal_after
- group_id (role filtered)
RBAC-sensitive fields:
- email, phone, address (must be filtered or redacted by role)
Allowed sorts:
- last_name, joined_at, renewal_date

### Events
Allowed filters:
- date_range
- category_id
- tag
- visibility (public/member-only)
Allowed sorts:
- start_at, created_at, title

### Registrations
Allowed filters:
- event_id (required for non-admin roles)
- status (confirmed/waitlisted/canceled)
- created_at_range
RBAC-sensitive fields:
- attendee contact fields (role filtered)
Allowed sorts:
- created_at, last_name

### Payments
Allowed filters:
- date_range
- status
- event_id (optional)
RBAC-sensitive fields:
- payer identity (role filtered), method details (redacted)
Allowed sorts:
- created_at, amount

### Committees / Groups
Allowed filters:
- active_only
- role_required (viewer-context scoped)
Allowed sorts:
- name, created_at

## Security Invariants
- No gadget may accept arbitrary field names for filter/sort
- All filter/sort keys are allowlisted per entity
- RBAC is enforced server-side; gadgets never decide eligibility
- Deny-tests required for: forbidden filters, forbidden sorts, forbidden fields

## Verdict
READY FOR REVIEW
