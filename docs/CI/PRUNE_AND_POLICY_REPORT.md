# Prune and Policy Hardening Report

Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

Generated: 2025-12-22

## Summary

This report documents the merge-captain policy hardening implemented to prevent
the repo from returning to the 80+ PR / merge-churn state.

## Files Created

### Policy Documents

| File | Purpose |
|------|---------|
| `docs/CI/MERGE_POLICY.md` | Canonical merge policy |
| `docs/CI/WORKER_LIGHTS_OUT_JOBS.md` | Safe autonomous work catalog |
| `docs/CI/HOTSPOT_MAP.md` | Hotspot file inventory (updated) |
| `docs/CI/PR_SIZE_LIMITS.md` | Size thresholds and micro-PR guidance |
| `docs/CI/MERGE_CHECKLIST_11PM.md` | Nightly merge captain procedure |
| `docs/CI/CONTRIBUTING.md` | Contributor guide |
| `docs/backlog/PR_QUEUE_HYGIENE.md` | Queue maintenance procedures |

### GitHub Templates

| File | Purpose |
|------|---------|
| `.github/pull_request_template.md` | Updated with size and hotspot declarations |
| `.github/ISSUE_TEMPLATE/merge-captain-integration-branch.md` | Themed wave requests |
| `.github/ISSUE_TEMPLATE/micro-pr-salvage.md` | Salvage planning |
| `.github/ISSUE_TEMPLATE/lights-out-docs-job.md` | Safe autonomous work requests |

### CI Guardrails

| File | Purpose |
|------|---------|
| `scripts/ci/check-pr-policy.ts` | PR size and hotspot validation |
| `.github/workflows/pr-policy-guard.yml` | CI workflow for policy checks |

### Automation

| File | Purpose |
|------|---------|
| `MERGE_CAPTAIN.zsh` | Nightly merge automation script |

## How the Policy Works

### Core Rules

1. **Merge captain only**: One person merges at a time.
2. **Size limits**: S (1-5 files), M (6-15 files), L (16+ files = split).
3. **Hotspot quarantine**: Certain files require coordination.
4. **Themed integration**: Related hotspot work merges together.

### PR Flow

1. Contributor opens PR with required declarations.
2. CI validates size and hotspot declarations.
3. Merge captain reviews at nightly run.
4. Docs-only and non-hotspot PRs merge first.
5. Hotspot PRs merge only when explicitly owned.

### Using MERGE_CAPTAIN.zsh

Preview mode (default):
```bash
cd "$HOME/clubos"
DRY_RUN=1 zsh ./MERGE_CAPTAIN.zsh
```

Execute merges:
```bash
DRY_RUN=0 zsh ./MERGE_CAPTAIN.zsh
```

The script:
- Syncs main
- Fetches all open PRs
- Categorizes by docs-only, non-hotspot, hotspot
- Prints merge commands in priority order
- Optionally executes merges

## Remaining Manual Steps

The following actions require GitHub admin access:

### Required (High Priority)

- [ ] **Enable branch protection on main**
  - Settings > Branches > Add rule for `main`
  - Require pull request reviews before merging
  - Require status checks to pass (select: PR Policy Guard, Charter, Prisma Build)
  - Restrict who can push to matching branches (merge captain only)

- [ ] **Restrict merge permissions**
  - Settings > Branches > main protection rule
  - "Restrict who can push" = merge captain GitHub username(s)

### Recommended

- [ ] **Enable CODEOWNERS**
  - Create `.github/CODEOWNERS` file
  - Assign hotspot paths to merge captain

- [ ] **Configure required reviewers**
  - Settings > Branches > main protection
  - Require 1 review for all PRs
  - Require merge captain review for hotspot PRs

- [ ] **Set up merge queue** (if available)
  - Settings > General > Pull Requests
  - Enable merge queue
  - Require CI to pass before queue entry

### Optional Enhancements

- [ ] **Slack/Discord notifications** for PR policy failures
- [ ] **Weekly hygiene report** automation
- [ ] **PR age warning bot** for stale PRs

## Limitations

### Without Org Admin

- Cannot enforce "merge captain only" at GitHub level
- Cannot require specific reviewers by file path
- Policy relies on convention and CI checks

### CI Limitations

- PR body content not accessible in all workflow contexts
- Size check uses git diff, may differ from GitHub's count
- Hotspot detection is pattern-based, may have edge cases

## Verification

To verify the policy is working:

1. Open a test PR touching a hotspot file
2. Verify PR Policy Guard workflow runs and warns
3. Verify PR template includes size/hotspot declarations
4. Run `DRY_RUN=1 zsh ./MERGE_CAPTAIN.zsh` and verify categorization

## Support

For questions about merge policy:

1. Read the policy docs (docs/CI/*.md)
2. Check tracking issues (#200-#203)
3. Contact merge captain

Do not guess. Do not force. Ask and wait.
