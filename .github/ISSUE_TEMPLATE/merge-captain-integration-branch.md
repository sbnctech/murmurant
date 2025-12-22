---
name: Themed Integration Branch
about: Request a themed integration wave for hotspot work
title: '[Theme] '
labels: 'merge-captain-only, theme-integration'
assignees: ''
---

## Theme Name

<!-- Short name for this integration wave, e.g., "Editor Wave", "Auth Hardening" -->

## Scope

<!-- What features or fixes are included in this wave? -->

## PRs to Include

<!-- List PRs to be merged into this integration branch -->

- #
- #
- #

## Hotspots Touched

<!-- Check all that apply -->

- [ ] prisma/schema.prisma or migrations
- [ ] package.json or package-lock.json
- [ ] .github/workflows/**
- [ ] src/app/admin/**/layout, nav, or search
- [ ] src/components/editor/** or publishing surfaces
- [ ] src/lib/auth*, rbac*, or permissions*

## Integration Branch Name

<!-- Proposed branch name -->

`integration/<theme>-YYYYMMDD`

## Merge Order

<!-- Order in which PRs should be merged into integration branch -->

1. #NNN - [title]
2. #NNN - [title]
3. #NNN - [title]

## Acceptance Criteria

<!-- What must be true before merging integration branch to main? -->

- [ ] All included PRs merged to integration branch
- [ ] No conflicts with main
- [ ] All tests pass
- [ ] Merge captain has reviewed

## Rollback Plan

<!-- How to undo if something goes wrong after merge to main -->

1. Revert merge commit: `git revert <commit>`
2. Push to main
3. Open issue for investigation

## Timeline

<!-- Expected completion -->

Start: YYYY-MM-DD
Target merge to main: YYYY-MM-DD

## Notes

<!-- Any additional context -->
