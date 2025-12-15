# Worker 4 - Data Access Layer Stubs
Start: NOW
Branch: chore/kpi-data-access-stubs-v1

Goal:
- Create stable data-access functions the KPI evaluators will call:
  - getOpsHealthStats(...)
  - getMemberEngagementByTier(...)
  - getNewbieActivationStats(...)
  - getCommitteeCadenceStats(...)
  - getFinancialCoverageStats(...)
- Implement as stubs returning placeholder values + TODO markers
- Add types and tests that ensure functions return expected shape

Constraints:
- No schema edits
- No writes
- Avoid leaking committee/member names; signals only

PR:
- Title: "chore(kpi): add data-access stubs for evaluators"
- Reference: CC_PROJECT__BOARD_KPI_WIDGET.md
