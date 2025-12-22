# Micro-PR Salvage Checklists (Post-Editor-Wave)

Goal: Be ready to salvage parked work the minute editor wave (#186) lands.

Global rules:
- Do NOT rebase old parked branches.
- Create a fresh branch from main AFTER #186 merge.
- Keep micro-PRs small (target < 300 net LOC).
- If a change must touch a hotspot, it is NOT a micro-PR. It becomes a themed wave owned by merge captain.
- Prefer manual re-application of the smallest coherent slice over large cherry-picks.

Hotspot quarantine (examples):
- prisma/schema.prisma, prisma/migrations/**
- package.json, package-lock.json
- src/app/admin/** core nav/search/layout
- src/app/admin/content/pages/** editor surfaces
- src/lib/publishing/** editor runtime

Micro-PR template:
1) Branch
- git checkout main
- git pull --ff-only origin main
- git checkout -b salvage/<topic>-<pr>-<yyyymmdd>

2) Slice
- Identify one smallest coherent slice (one feature, one test set).
- Skip refactors. Skip format-only churn.

3) Apply
- Prefer manual edits.
- Cherry-pick only if:
  - commit is minimal
  - applies cleanly
  - does not drag in hotspots

4) Tests
- Add/adjust unit tests where applicable.
- Keep test scope aligned with slice.

5) Finish
- Push branch, open PR.
- Labels: merge-captain-only, parked (if still blocked), plus theme label.
- Merge ASAP to reduce drift.

Per-PR salvage checklist stubs (fill in after #186 merge):

PR #134
- Intended outcome:
- Smallest slice:
- Files likely touched (confirm non-hotspot):
- Tests to run:
- Notes/risk:

PR #135
- Intended outcome:
- Smallest slice:
- Files likely touched (confirm non-hotspot):
- Tests to run:
- Notes/risk:

PR #136
- Intended outcome:
- Smallest slice:
- Files likely touched (confirm non-hotspot):
- Tests to run:
- Notes/risk:

PR #138
- Intended outcome:
- Smallest slice:
- Files likely touched (confirm non-hotspot):
- Tests to run:
- Notes/risk:
