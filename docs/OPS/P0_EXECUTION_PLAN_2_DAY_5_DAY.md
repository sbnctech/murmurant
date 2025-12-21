# P0 Execution Plan (2-Day / 5-Day)

Purpose: Close migration blockers without queue-jumping. This plan focuses on P0 security guarantees, auditability, and CI enforcement.

---

## P0 Blockers (Must Close Before Migration Mode)
- TB-1/TB-2: Time-bounded authority (server-side date validation)
- SD-3: Escalation prevention (cannot grant capabilities not possessed)
- DM-3/DM-4: Delegation + cross-scope enforcement
- AU-1: Authority lifecycle audit logging
- CI: Immunity tests + route audit must run on PRs
- Foundations: DATA_INVARIANTS.md and SYSTEM_GUARANTEES.md exist and are referenced

---

## 2-Day Plan

### Day 1
Goal: All P0 items in PRs with tests started.

- Implement TB-1/TB-2 enforcement + tests
- Implement SD-3 enforcement + tests
- Implement DM-3/DM-4 enforcement + tests
- Implement AU-1 audit coverage + tests
- Add CI workflow: npm run test:immunity + route audit script
- Create foundation docs: DATA_INVARIANTS.md + SYSTEM_GUARANTEES.md

Checkpoint (end of day): All P0 work has PRs open.

### Day 2
Goal: Merge P0 items safely and confirm green CI.

- Merge CI enforcement first
- Fix any test fallout immediately
- Cross-review security logic for centralized enforcement
- Re-run Worker 8 synthesis and update readiness status

GO/NO-GO:
- GO if all P0 issues merged and CI green
- NO-GO if any P0 issue remains unenforced or untested

---

## 5-Day Plan (Conservative Hardening)

### Days 3–4
- Address HIGH + UNCLEAR guarantees surfaced by guarantee audit
- Resolve cognitive load MUST-FIX items (silent catch blocks, alert(), confirmation dialog)
- Add regression tests where gaps exist

### Day 5
- Re-audit guarantees and release gates
- Confirm "Migration Mode safe to begin" statement is defensible
