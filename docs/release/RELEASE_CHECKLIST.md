# Release Checklist (ClubOS)

Goal:
- Keep everything green locally before push and before merge
- Keep the branch, PR, and version/tag flow unambiguous
- Avoid test tangles and "which window ran what" confusion

## Branch discipline
- One feature/epic per branch.
- If parallel work is needed, create sub-branches and merge into the epic branch.
- Do not mix unrelated refactors into the epic branch.

## Always use stable runners
Local "everything green" must include:
- typecheck
- lint
- unit tests
- db seed
- admin stable E2E (workers=2, exclude @quarantine)
- api stable E2E (workers=2, exclude @quarantine)

Command:
- npm run green

## Before opening the PR
1) Sync and confirm clean working tree
- git fetch origin
- git status -sb (must be clean)
- git log --oneline --decorate -5

2) Run the full green suite
- npm run green

3) Confirm Playwright artifacts are not tracked
- test-results/ and playwright-report/ must be in .gitignore
- no test-results files in git status

## PR requirements
- PR targets main
- PR title includes the version target (example: "v0.2.2: Service history and transitions")
- PR description includes:
  - Summary of changes
  - How to run locally (npm run green)
  - Any migrations (yes/no)
  - Any config changes (yes/no)
  - Any known followups (explicitly listed)

## CI requirements
- CI must be green before merge.
- If CI differs from local, fix the scripts so local matches CI (do not rely on CI only).

## Merge requirements
- Prefer squash merge unless there is a reason to keep history.
- After merge, pull main locally and confirm:
  - npm run green passes on main

## Tagging and release
- Only tag after the PR is merged into main and main is green locally.
- Tag must be annotated.
- Tag name matches semver: v0.2.2

## Post-tag sanity
- git show v0.2.2 --name-only --oneline (spot check)
- Confirm tag exists on origin:
  - git ls-remote --tags origin | rg "v0.2.2"

## If something is not green
- Stop and fix before merge.
- Do not quarantine tests to make green unless the test is truly flaky and has an issue filed.
- If quarantining is required, add @quarantine with a short reason and a followup issue reference.

## Related Documentation

- [Release Channels](../reliability/RELEASE_CHANNELS.md) - Channel definitions and promotion rules
- [Release Process](../deployment/RELEASE_PROCESS.md) - Full deployment guide
