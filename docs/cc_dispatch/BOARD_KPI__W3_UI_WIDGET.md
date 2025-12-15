# Worker 3 - UI Widget (Board Dashboard Panel)
Start: NOW
Branch: chore/ui-board-kpi-panel-v1

Target:
- Board/Admin dashboard panel (NOT Admin Event Detail; NOT Ticket Types)

Goal:
- Add "Organizational Health" panel widget:
  - Tile list grouped by category
  - Default behavior: quiet unless red (collapse green)
  - Role-segmented view (auto by role; dropdown fallback)
- Consume GET /api/v1/admin/kpis

Constraints:
- Read-only UI
- No schema edits
- Feature flag if needed

PR:
- Title: "feat(ui): board KPI dashboard panel"
- Reference: CC_PROJECT__BOARD_KPI_WIDGET.md
