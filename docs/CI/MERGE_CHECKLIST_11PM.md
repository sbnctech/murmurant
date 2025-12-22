# Merge Captain 11PM Checklist

Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

## Purpose

This checklist is the nightly procedure for the merge captain.
Run it every evening before signing off.

## Prerequisites

- GitHub CLI installed and authenticated (`gh auth status`)
- Local repo at `$HOME/clubos` or set `CLUBOS_DIR`
- Clean working tree on main

## Quick Start

```bash
cd "$HOME/clubos"
DRY_RUN=1 zsh ./MERGE_CAPTAIN.zsh
```

## Full Checklist

### 1. Sync Main

```bash
cd "$HOME/clubos"
git switch main
git fetch origin
git pull origin main
git status
```

Verify: working tree is clean, branch is up to date.

### 2. Check Open PRs

```bash
gh pr list --state open --json number,title,isDraft,headRefName \
  --jq '.[] | "#\(.number) [\(if .isDraft then "DRAFT" else "OPEN" end)] \(.title)"'
```

Note the count. Target: fewer than 10 open PRs.

### 3. Identify Merge Candidates

Run the merge captain script:

```bash
DRY_RUN=1 zsh ./MERGE_CAPTAIN.zsh
```

Review output. The script categorizes PRs:
- DOCS-ONLY: Safe to merge first
- NON-HOTSPOT: Safe to merge second
- HOTSPOT: Requires explicit ownership

### 4. Merge Docs-Only PRs

For each docs-only PR with green checks:

```bash
gh pr merge NNN --squash --delete-branch
```

Replace NNN with PR number. Verify each merge succeeds.

### 5. Merge Non-Hotspot PRs

For each non-hotspot PR with green checks:

```bash
gh pr merge NNN --squash --delete-branch
```

### 6. Handle Hotspot PRs

Only merge hotspot PRs if:
- You own the themed wave.
- All related micro-PRs are complete.
- No conflicts exist.

If conflicts: close PR, open tracking issue, salvage later.

### 7. Run Smoke Tests

```bash
npm run typecheck
npm run test:unit
npm run db:seed
npm run test-admin:stable
```

All must pass. If failures occur:
- Check if pre-existing (see TEST_SUITE_STATUS_REPORT.md).
- If new: revert last merge, investigate.

### 8. Update PR Count

```bash
gh pr list --state open --json number --jq 'length'
```

Record in daily log. Target: decreasing trend.

### 9. Prune Branches (Weekly)

Once per week:

```bash
git fetch --prune
git branch --merged main | grep -v '^\* main$' | xargs git branch -d
```

### 10. Record Notes

Add entry to daily log or commit message:

```
Date: YYYY-MM-DD
PRs merged: N
PRs closed: N
Open PRs remaining: N
Test status: PASS/FAIL
Notes: [any issues]
```

## Troubleshooting

### PR has failing checks

Do not merge. Check the failure:
- Release classification: edit PR body to add checkbox.
- Build failure: close PR, notify author.
- Test failure: close PR, open issue.

### PR has conflicts

Do not force-merge. Close PR and salvage via micro-PRs.

### Too many open PRs

Run prune procedure:
1. Close stale PRs (>7 days, no activity).
2. Convert large PRs to draft.
3. Create tracking issues for parked work.

### Tests failing on main

Stop all merges. Investigate:
1. `git log --oneline -5` to find recent changes.
2. `git bisect` if needed.
3. Revert offending commit if clear.
4. Open P0 issue.

## Emergency Stop

If something is wrong:

```bash
# Do not merge anything
# Run status check
npm run typecheck
npm run test:unit

# If failing, revert last merge
git revert HEAD --no-edit
git push origin main
```

Then investigate before resuming.
