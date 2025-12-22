# Prisma Schema Authorization Contract (ClubOS)

**Last updated:** 2025-12-22

---

## Purpose

- Schema changes are the highest merge-risk hotspot in ClubOS.
- This contract makes "schema authorization" explicit, auditable, and unambiguous.

---

## Definition

- "Schema change" means ANY edit to `prisma/schema.prisma` or `prisma/migrations/**`.

---

## Policy

- No schema change is allowed unless the Merge Captain posts an explicit authorization comment on the tracking issue.
- Authorization must specify scope, allowed files, and acceptance tests.
- If authorization is missing or unclear: STOP that schema task and work on non-schema work instead.

---

## Required Authorization Comment (copy/paste)

```
MERGE CAPTAIN SCHEMA AUTHORIZATION — ISSUE #<N>

Authorized scope:
- Models/fields/enums: <exact list>
- Files allowed:
  - prisma/schema.prisma
  - prisma/migrations/<new migration dir name>/...
- Explicitly NOT allowed:
  - package-lock.json
  - CI/workflows
  - any unrelated refactors

Constraints:
- No rebases
- Micro-PRs only (<= 300 LOC each)
- One schema intent per PR
- Add/Update tests:
  - <exact test files or suites>
- Validation required before merge:
  - npm run -s typecheck
  - npm test
  - prisma migrate status (or CI equivalent)

Acceptance criteria:
- <bullets that prove success>

Rollback:
- <how to revert safely, if needed>
```

---

## Notes

- If multiple schema waves exist, authorization must explicitly name which wave(s) are unlocked.
- All other waves remain BLOCKED until explicitly authorized.

---

*This contract is normative for all schema changes.*
