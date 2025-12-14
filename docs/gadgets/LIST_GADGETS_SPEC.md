# List Gadgets Specification

Worker 3 — List Gadgets Spec — Report

## Goal
Provide reusable gadgets that render filtered/sorted lists (members, events, payments, registrants, etc.) without breaking RBAC or leaking data.

## Key Principle
All filtering and sorting must be enforced server-side with allowlisted parameters.
Clients do not send arbitrary query expressions.

## Core Use Cases
- Member: "My upcoming events"
- Chair: "Registrants for my event"
- VP Activities: "All events for committees I oversee"
- Finance: "Open invoices needing review"
- Admin: "Lapsed members needing outreach"

## Proposed Gadget Pattern
A "ListGadget" is configured by:
- template_id: identifies the server-side list template
- params: allowlisted primitive params (strings/ints/bools), validated
- columns: presentation-only selection (allowlisted)
- default_sort: allowlisted sort key + direction
- pagination: page size limits enforced server-side

## Data Safety Rules
- RBAC is applied before any filtering or sorting.
- Returned rows are already scoped to the viewer.
- PII fields must be explicitly opt-in by template and role.
- Aggregate-only for sensitive counts when possible.

## Template Examples (Illustrative)
- MEM_MY_DIRECTORY (member-self + visible-to-role)
- EVT_UPCOMING_MEMBER
- EVT_MY_EVENTS_CHAIR
- REG_EVENT_ROSTER_CHAIR
- FIN_OPEN_ITEMS_VP_FINANCE

## Query Guardrails
- Max page size (e.g., 50)
- Hard cap on total rows returned per request (e.g., 500)
- Stable cursor pagination for large sets
- Rate limiting on list endpoints (later)

## Audit
- Read operations are not audited by default.
- Any export or "download CSV" must be audited (who/when/template/params).

## Decisions Required
- Do we support CSV export in v1 (yes/no)?
- Which roles can see which PII columns by default?

## Verdict
READY FOR REVIEW
