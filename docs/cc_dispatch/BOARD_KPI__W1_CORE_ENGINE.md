# Worker 1 - Core KPI Engine (Scaffolding)
Start: NOW
Branch: chore/kpi-engine-scaffold-v1

Goal:
- Implement KPI engine scaffolding + registry + evaluator interface + config loader abstraction
- Add 2 stub evaluators (website uptime, email bounce rate) returning UNKNOWN unless wired

Constraints:
- NO Prisma schema edits
- NO migrations
- Read-only only
- Strict types, no any

Deliverables:
- src/server/kpi/* (types, registry, engine runner)
- Unit tests for registry/engine
- Docs: short README in src/server/kpi/README.md

PR:
- Title: "feat(kpi): scaffold board KPI engine"
- Reference: CC_PROJECT__BOARD_KPI_WIDGET.md
