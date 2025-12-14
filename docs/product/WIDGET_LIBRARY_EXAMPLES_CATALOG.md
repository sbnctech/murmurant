# Widget Library Examples Catalog

Worker 1 — Q-025 Widget Examples Catalog — Report

---

## Purpose

This catalog provides eight concrete widget examples that instantiate the ClubOS widget library model. Each entry demonstrates how widgets consume pre-filtered data, respect RBAC boundaries, and provide navigation-only actions. Use these examples as reference implementations when designing new widgets.

---

## Example 1: My Upcoming Events

**Widget ID:** W-MEM-01

**Purpose:** Display the viewer's confirmed event registrations for the next 30 days, helping members stay organized and reducing "what did I sign up for?" support queries.

**Audience Personas:**

- Regular Member
- New Member

**Data Dependencies:**

- `registrations` — filtered to viewer's own records, status = confirmed
- `events` — joined for event title, date, time, location

**RBAC Sensitivity:** Low

RBAC is Low because the widget displays only self-scoped data. The viewer sees exclusively their own registrations; no cross-member visibility is possible.

**Refresh Cadence:** Daily

Registrations change infrequently for individual members. Daily refresh balances freshness with performance.

**Actions (Navigation-Only):**

- Link to individual event detail page
- Link to full calendar view
- Link to "My Registrations" management page

**Deep Links:**

- `/events/{event_id}` — event detail
- `/calendar` — full calendar
- `/my/registrations` — registration management

**Failure Mode:**

Display "No upcoming events" message with prominent link to calendar: "Browse events to find something interesting."

---

## Example 2: Announcements Feed

**Widget ID:** W-COM-01

**Purpose:** Show recent club-wide announcements, keeping members informed of news, policy changes, and important dates.

**Audience Personas:**

- Regular Member
- New Member
- Event Chair
- Committee Leader

**Data Dependencies:**

- `announcements` — filtered by publish date (last 30 days), status = published
- `announcement_categories` — for category labels (optional)

**RBAC Sensitivity:** Low

RBAC is Low because announcements are published content visible to all authenticated members. No role-specific filtering required beyond membership verification.

**Refresh Cadence:** Daily

Announcements are typically posted weekly or less. Daily refresh ensures new items appear within 24 hours.

**Actions (Navigation-Only):**

- Link to full announcement text
- Link to announcement archive

**Deep Links:**

- `/announcements/{announcement_id}` — full announcement
- `/announcements` — archive listing

**Failure Mode:**

Display "No recent announcements" placeholder. Do not show error states for empty content.

---

## Example 3: Renewal Reminder

**Widget ID:** W-MEM-07

**Purpose:** Display a prominent renewal call-to-action for members whose membership expires within 30 days, protecting club revenue and reducing lapsed memberships.

**Audience Personas:**

- Regular Member

**Data Dependencies:**

- `member_profile` — viewer's own record: membership_expiration_date, membership_level

**RBAC Sensitivity:** Low

RBAC is Low because the widget accesses only the viewer's own membership record. No cross-member data is exposed.

**Refresh Cadence:** Daily

Membership expiration dates do not change frequently. Daily refresh ensures accuracy while minimizing load.

**Actions (Navigation-Only):**

- Link to renewal page
- Link to membership benefits information

**Deep Links:**

- `/membership/renew` — renewal workflow
- `/membership/benefits` — membership level information

**Failure Mode:**

Widget is hidden if membership expiration is more than 30 days away or if expiration date is unavailable. Never show error state; simply do not render.

---

## Example 4: Event Chair Dashboard

**Widget ID:** W-EVT-06

**Purpose:** Provide Event Chairs with at-a-glance status of their events, including registration counts, waitlist lengths, and items needing attention.

**Audience Personas:**

- Event Chair
- Committee Leader

**Data Dependencies:**

- `events` — filtered to events where viewer is chair or committee lead
- `registrations` — aggregated counts per event (confirmed, waitlisted, cancelled)
- `event_status_flags` — action items (e.g., event unpublished, payment pending)

**RBAC Sensitivity:** Medium

RBAC is Medium because the widget exposes aggregate registration data for committee-scoped events. The viewer sees registration counts (not individual registrant details) for events they manage.

**Refresh Cadence:** Realtime

Event Chairs need current registration counts to make operational decisions. Stale data causes coordination failures.

**Actions (Navigation-Only):**

- Link to event management page
- Link to registration roster (view only)
- Link to waitlist management

**Deep Links:**

- `/admin/events/{event_id}` — event management
- `/admin/events/{event_id}/registrations` — roster view
- `/admin/events/{event_id}/waitlist` — waitlist management

**Failure Mode:**

Display "No events to manage" if the viewer has no assigned events. If data fetch fails, show "Dashboard temporarily unavailable" with link to full events list.

---

## Example 5: Membership Metrics

**Widget ID:** W-ADM-01

**Purpose:** Display high-level membership statistics for administrators and board members: total active members, new this month, lapsed this month, and renewal rate.

**Audience Personas:**

- Board Member
- Admin Staff

**Data Dependencies:**

- `members` — aggregate counts only: total active, new (created this month), lapsed (expired this month)
- `membership_metrics` — pre-computed renewal rate percentage

**RBAC Sensitivity:** High

RBAC is High because aggregate membership data is sensitive organizational information. Only Admin and Board roles should see these numbers.

**Refresh Cadence:** Daily

Membership metrics change gradually. Daily refresh at midnight ensures morning dashboards reflect previous day's final state.

**Actions (Navigation-Only):**

- Link to membership report
- Link to lapsed members list
- Link to new members list

**Deep Links:**

- `/admin/reports/membership` — detailed report
- `/admin/members?status=lapsed` — lapsed members
- `/admin/members?status=new` — new members

**Failure Mode:**

Display "Metrics unavailable" with link to manual report generation. Never display partial or potentially incorrect numbers.

---

## Example 6: Featured Event Spotlight

**Widget ID:** W-EVT-02

**Purpose:** Highlight a single featured event with hero image to drive registrations for priority club activities.

**Audience Personas:**

- Regular Member
- New Member

**Data Dependencies:**

- `events` — single event with featured flag = true, sorted by event date (nearest first)
- `event_images` — hero image for featured event

**RBAC Sensitivity:** Low

RBAC is Low because featured events are public promotional content. Any authenticated member may see the spotlight.

**Refresh Cadence:** Daily

Featured event designation changes infrequently (typically weekly). Daily refresh ensures new featured events appear promptly.

**Actions (Navigation-Only):**

- Link to event detail page
- Link to registration page

**Deep Links:**

- `/events/{event_id}` — event detail
- `/events/{event_id}/register` — registration flow

**Failure Mode:**

Widget is hidden if no event is currently marked as featured. Do not display empty spotlight or error state.

---

## Example 7: Quick Actions Panel

**Widget ID:** W-MEM-04

**Purpose:** Provide one-click access to the most common member tasks, reducing navigation friction for frequent operations.

**Audience Personas:**

- Regular Member
- New Member
- Event Chair

**Data Dependencies:**

- None (static configuration)
- Optionally: `member_profile` for role-aware action visibility

**RBAC Sensitivity:** Low

RBAC is Low because the widget displays navigation links only. Link visibility may be role-filtered, but no sensitive data is exposed.

**Refresh Cadence:** Weekly

Action configuration changes only when platform features change. Weekly refresh accommodates configuration updates.

**Actions (Navigation-Only):**

- Link to event calendar
- Link to profile settings
- Link to contact directory
- Link to help/FAQ

**Deep Links:**

- `/calendar` — event calendar
- `/my/profile` — profile settings
- `/directory` — member directory
- `/help` — help center

**Failure Mode:**

Always renders successfully (static content). If role-aware filtering fails, show default member actions.

---

## Example 8: My Waitlist Positions

**Widget ID:** W-MEM-03

**Purpose:** Show members their current waitlist positions for events, reducing "am I on the waitlist?" inquiries and setting accurate expectations.

**Audience Personas:**

- Regular Member

**Data Dependencies:**

- `registrations` — filtered to viewer's own records, status = waitlisted
- `events` — joined for event title and date
- `waitlist_position` — viewer's position number in each waitlist

**RBAC Sensitivity:** Low

RBAC is Low because the widget displays only self-scoped data. The viewer sees their own waitlist positions; they do not see other members' positions or the full waitlist.

**Refresh Cadence:** Realtime

Waitlist positions change when others cancel. Near-realtime refresh ensures members see accurate position as soon as movement occurs.

**Actions (Navigation-Only):**

- Link to event detail page
- Link to cancel waitlist entry

**Deep Links:**

- `/events/{event_id}` — event detail
- `/my/registrations/{registration_id}/cancel` — cancellation flow

**Failure Mode:**

Widget is hidden if viewer has no waitlist entries. Do not display "no waitlist" message; simply do not render.

---

## Open Questions

- Should widgets support configurable refresh cadence per deployment, or are the defaults fixed?

- How should widgets handle partial data availability (e.g., event exists but image missing)?

- What is the maximum number of items widgets should display before truncating with "see all" link?

- Should role-aware widgets (like Quick Actions) declare their role dependencies in the widget manifest?

- How do widgets communicate loading state to avoid layout shift during data fetch?

---

## Verdict

READY FOR REVIEW
