# PR Euthanasia Rubric (When to Salvage vs Kill)

**Last updated:** 2025-12-22

---

## Principle

- A stalled or conflict-heavy PR is technical debt. Killing it can be the fastest path to safety.

---

## Kill (close) a PR when any are true

- It requires repeated rebases or has deep conflicts in hotspots.
- It bundles multiple unrelated intents.
- It touches `prisma/schema.prisma` AND UI AND auth in one PR.
- It is older than 7 days and main has moved materially.
- It cannot be explained as a single sentence "intent".
- It fails CI due to drift rather than actual logic errors.

---

## Salvage a PR when all are true

- The intent is still correct and valuable.
- The changes can be decomposed into <= 300 LOC micro-PRs.
- The PR does not require rebasing to be useful as a source of truth.
- The author can produce a salvage plan with ordered micro-PRs.

---

## What to Preserve Before Killing

- A tracking issue with:
  - intent
  - acceptance criteria
  - file hotspots
  - micro-PR sequence
- Optional: a `docs/backlog/SALVAGE_PLAN_<issue>.md`

---

*This rubric is normative for PR triage decisions.*
