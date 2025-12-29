# Events/Calendar Widget Fit Assessment (Murmurant)

Worker 1 — Events Widget Fit — Report

## Scope
Assess whether the events/calendar widget concept fits the Murmurant model (plugins, RBAC, auditability, maintainability).
No implementation. No new architecture.

## Current Widget Capabilities (Observed / Expected)

- Display upcoming events in calendar or list view
- Filter by category, date range, or committee
- Show event details (title, date, time, location, description)
- Display registration status and spots available
- Link to event registration flow
- Support public vs member-only event visibility
- Chair view: show registration counts, waitlist status
- Admin view: show all events with management actions

## Murmurant Model Requirements

- RBAC gates for read access (member vs public vs admin)
- Delegated administration boundaries (VP Activities -> chairs; chairs -> their events/committees)
- Auditability for any privileged action
- Plugin-style extensibility (widgets/gadgets composable on pages)
- Minimal coupling (storage/API interchangeable where practical)

## Fit Mapping

| Widget Capability | Murmurant Equivalent | Fit | Notes |
|---|---|---|---|
| Display public events | EVT_UPCOMING_PUBLIC template | OK | Server filters by visibility=public |
| Display member events | EVT_UPCOMING_MEMBER template | OK | Server requires authenticated viewer |
| Filter by category | Template param (category_id) | OK | Allowlisted param in template |
| Filter by date range | Template param (date_from, date_to) | OK | Allowlisted param in template |
| Show registration count | Pre-computed in payload | OK | Server includes count, not raw roster |
| Show spots available | Computed field (capacity - registered) | OK | Server computes, widget displays |
| Link to registration | Deep link in payload | OK | Widget receives URL, does not construct |
| Chair: view own events | EVT_MY_EVENTS_CHAIR template | OK | Scoped by viewer's chair assignments |
| Chair: view registrants | REG_EVENT_ROSTER_CHAIR template | OK | Scoped by event ownership |
| Admin: view all events | Separate admin template | OK | Requires SYSTEM_ADMIN role |
| Member-only visibility | Server-side RBAC filter | OK | Widget never sees unpermitted events |
| Waitlist position | Pre-filtered to viewer only | OK | Viewer sees own position, not others |

## Gaps / Risks

- No gap: All read operations fit pre-filtered payload model
- No gap: Filters map to allowlisted template params
- Risk: Chair dashboard requires multiple templates (events + registrations)
- Risk: Real-time waitlist updates need polling or SSE (not specified)
- Risk: Calendar grid view may require client-side date grouping from flat list

## Decisions Required

1. **Polling vs SSE for waitlist updates?**
   - Current: Daily or manual refresh acceptable for v1
   - Future: Consider SSE for high-traffic events
   - **REQUIRES DECISION** (if real-time needed in v1)

2. **Chair dashboard: single composite widget or multiple gadgets?**
   - Option A: One dashboard widget with multiple template calls
   - Option B: Separate widgets for events, registrations, waitlist
   - **OK AS DESIGNED** (either approach fits model)

3. **Calendar grid rendering?**
   - Server returns flat list; client groups by date
   - No RBAC implications (presentation only)
   - **OK AS DESIGNED**

4. **Event detail page vs inline expansion?**
   - Widget links to detail page (navigation-only)
   - No inline mutations
   - **OK AS DESIGNED**

## Summary

| Category | Count |
|----------|-------|
| OK AS DESIGNED | 12 |
| REQUIRES DECISION | 1 |
| Blocked | 0 |

The events/calendar widget fits the Murmurant model with minimal adaptation. All read operations map to pre-filtered templates. The only open decision is whether v1 requires real-time waitlist updates (recommend: no for v1).

## Verdict
READY FOR REVIEW
