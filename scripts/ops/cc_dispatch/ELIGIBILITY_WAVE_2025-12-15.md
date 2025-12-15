# CC Dispatch: Eligibility Engine Wave
Date: 2025-12-15
Owner: Ed
Branch: feat/eligibility-engine-v1
PR: https://github.com/sbnctech/clubos/pull/78

## Ground Truth (Read First)
- Schema + migration PR #78 is OPEN and READY
- Migration: 20251215010935_add_event_eligibility_models
- DO NOT modify migrations or prisma/schema.prisma
- DO NOT touch main
- All work happens on feature branches

## What Was Just Completed
- Eligibility schema added and migrated
- Preflight, lint, typecheck passed
- Branch pushed and PR opened

## Active Workers

### Worker 1 — Eligibility Logic (Claude / CC)
Status: READY
Branch: feat/eligibility-engine-v1 (or child branch)

Tasks:
- Implement eligibility evaluation service
- No DB changes
- Pure logic + unit tests
- Inputs: Member, Event, TicketType
- Output: eligibility decision + reason codes

Constraints:
- No Prisma schema edits
- No migrations
- Tests must not rely on admin UI

---

### Worker 2 — API Layer (Claude / CC)
Status: READY
Branch: chore/api-eligibility-v1 (new)

Tasks:
- Add read-only endpoints:
  - GET /api/v1/events/:id/eligibility
  - GET /api/v1/tickets/:id/eligibility
- Use mocked or stubbed service initially
- Add contract tests only

Constraints:
- No schema changes
- No writes
- Follow existing API patterns

---

### Worker 3 — Admin UX (Optional)
Status: NOT STARTED

Tasks:
- Read-only admin visibility into eligibility state
- No mutation
- Feature-flagged if needed

---

## Merge Rules
- Each worker opens its own PR
- No PR mixes schema + logic
- Reference PR #78 in descriptions

## Questions?
If unsure, STOP and ask Ed.
