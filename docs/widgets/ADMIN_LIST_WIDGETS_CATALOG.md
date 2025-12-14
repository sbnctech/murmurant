# Admin List Widgets Catalog (ClubOS)

Worker 2 -- Admin List Widgets Catalog -- Report

## Goal
Define a reusable library of list widgets (members, events, payments, registrants, committees) that can be filtered/sorted safely without breaking RBAC.

## Principles
- All data returned is pre-filtered server-side by RBAC.
- Widget parameters are allowlisted and validated.
- No client-constructed queries for privileged data.
- Each widget declares: audience, required roles, and data shape.

## Core List Widgets (v1)
1. Members List
   - Viewer: Membership admins, Tech Chair, President (role-gated)
   - Filters: status, join date range, tags, committee assignment
   - Output: name, status, contact (role dependent), last activity (if allowed)

2. Events List
   - Viewer: public/member/chair/admin variants
   - Filters: date range, category, visibility, committee, location
   - Output: title, date/time, visibility, registration metrics (as allowed)

3. Registrants List (per event)
   - Viewer: chair for owned events, VP Activities, President
   - Filters: registration status, waitlist, payment status
   - Output: name, status, counts; minimal PII unless role allows

4. Payments / Transactions List (stub for now)
   - Viewer: finance roles + President
   - Filters: date range, status, event, payer
   - Output: amounts, status, references (RBAC-gated fields)

5. Committees / Roles Assignments List
   - Viewer: delegated admins (VP Activities) for chairs; Tech Chair for system
   - Filters: committee, role type, active range
   - Output: assignee, role, scope, effective dates

## Standard Widget Contract
Each list widget must define:
- template_id
- allowlisted params (with types + max lengths)
- required roles
- response schema (fields + which are role-dependent)
- audit notes (what is logged, even for reads if sensitive)

## Embed Considerations
If embedded externally:
- Must use a ClubOS-generated signed token with short TTL
- Origin allowlist + CSP + iframe sandbox required
- Never expose raw APIs; use widget endpoints only

## Open Decisions
- Which list widgets appear on which dashboards by persona/role
- Whether to support saved views (named filters) in v1

## Verdict
READY FOR REVIEW
