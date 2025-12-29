<!--
  Copyright © 2025 Murmurant, Inc. All rights reserved.
-->




## V2 Backlog: Organizational Health Dashboard (Board KPI Widget)

Owner: TBD (Board dashboard / management widgets)
Source doc: docs/widgets/organizational-health-dashboard.md

- [ ] Build role-segmented board KPI dashboard widget (read-only)
- [ ] Implement configurable thresholds/targets (no hardcoded values)
- [ ] Implement seasonal adjustment mode (same period last year default)
- [ ] Add metrics:
      - New member activation (>=1 event/month in first 90 days)
      - Newbie near-term availability (slots in next 30 days)
      - Mid-tier engagement distribution and movement
      - Committee cadence and "committee dark" signals
      - Volunteer load signals (board-safe)
      - Financial stewardship (dues vs overhead; event variance; unsold tickets)
      - Tech ops health (uptime, bounce rate, registration friction)
- [ ] Add "quiet unless red" surfacing behavior
- [ ] Add RBAC + audit logging for config changes
- [ ] Add tooltip definitions and trend indicators
