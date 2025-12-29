# Organizational Health Dashboard Widget (Board/Admin)
Version: v1 requirements capture
Date: 2025-12-14

## Purpose
Provide real-time, objective indicators of organizational health for a volunteer, membership-funded nonprofit, enabling early detection of structural risk and board decision-making without relying on surveys.

## Non-goals
- Not a performance review tool
- Not individual volunteer scoring
- Not predictive analytics (yet)
- Not public-facing

## Design principles
- Signals over names (default views show status, not individuals)
- Quiet unless red
- Seasonally adjusted comparisons (same period last year by default)
- Configurable thresholds (no hardcoded targets)
- Role-segmented views (board lens vs VP lens)
- Behavioral metrics only (no survey dependency)

## Scope
Widget type: Management / Board Dashboard widget (read-only, role-aware)
Placement: Board dashboard (primary), VP dashboards (secondary), optional dedicated page

## Configuration model (required)
All targets and thresholds must be configurable without code changes.

Per-metric configuration supports:
- Target value
- Green/Yellow/Red thresholds
- Evaluation window (30/60/90 days, quarter, first 90 days cohort-based)
- Comparison mode (same period last year default; rolling average optional; absolute optional)

## KPI categories
### A. New member activation (critical)
- % of new members attending >= 1 event per month in first 90 days (target default: > 1 event/month; threshold default: 80%)
- Median time to first event
- # of newbie-eligible slots available within next 30 days
- % of newbie registrations encountering waitlists

### B. Member engagement distribution (mid-tier focus)
- Distribution of members by attendance tier (quartiles configurable)
- Movement between tiers (period over period)
- % of members attending >= 1 event per quarter

### C. Committee capacity and cadence (seasonal)
- # active committees
- # committees with >= 1 event this period
- # committees with zero events this period (signal)
- Activity slots delivered vs filled

### D. Volunteer load signals (board-safe)
- Events managed per chair (rolling window)
- # waitlist/cancellation interventions
- High-admin-load events per period
Constraints: no hours, no rankings; drill-down restricted

### E. Financial stewardship
- % overhead covered by dues alone
- Aggregate event variance (budget vs actual)
- Trend in unsold tickets
Configurable definitions and tolerances

### F. Ops and tech health
- Website uptime (rolling 30/90)
- Email deliverability / bounce rate
- Registration friction rate (failed registrations / retries)
Behavior: hidden unless threshold breached

## Role-based views
- President/Governance: overall summary, leadership pipeline signals, structural risks
- VP Membership: new member activation, mid-tier movement
- VP Activities: committee cadence, capacity gaps, chair load signals
- Treasurer: dues vs overhead coverage, event variance
- Technology: uptime, deliverability, registration friction

## Visualization requirements
- Status tiles (green/yellow/red)
- Trend arrows (up/down/flat)
- Tooltips: definition, threshold logic, comparison basis
- Drill-down on demand only

## Security
- Board-only by default
- RBAC controls which metrics appear by role
- Audit log for configuration changes

## Out of scope (explicit)
- Predictive churn modeling
- Individual volunteer scoring
- Automated nudging (future phase)
- Cross-club benchmarking

## Open items (deferred)
- Default thresholds per metric
- Quartile definitions
- Board-friendly naming
- UI styling/branding
- Data source mapping to Murmurant models

