# Worker 5 - Config + Defaults + Validation
Start: NOW
Branch: chore/kpi-config-defaults-v1

Goal:
- Add default KPI config (file-based for now):
  - thresholds, targets, time windows, comparison mode (YOY), visibility by role
- Add validation (zod or existing validation approach)
- Provide a simple loader interface so config can move to DB later

Constraints:
- No schema edits
- No migrations
- Config must support seasonal adjustments (YOY)

PR:
- Title: "chore(kpi): default config + validation"
- Reference: CC_PROJECT__BOARD_KPI_WIDGET.md
