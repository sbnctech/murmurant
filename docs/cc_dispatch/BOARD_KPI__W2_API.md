# Worker 2 - API Layer (Read-only)
Start: NOW
Branch: chore/api-board-kpis-v1

Goal:
- Add API endpoint:
  - GET /api/v1/admin/kpis?view=president|vp_membership|vp_activities|treasurer|technology
- Wire to KPI engine (worker 1) and return KPIResult[]
- Add contract tests (no admin UI)

Constraints:
- NO schema changes
- NO writes
- Follow existing API patterns (folder conventions, handlers, error shape)

PR:
- Title: "feat(api): board KPI read-only endpoint"
- Reference: CC_PROJECT__BOARD_KPI_WIDGET.md
