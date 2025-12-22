---
name: Micro-PR Salvage
about: Plan to salvage a closed/parked PR via micro-PRs
title: '[Salvage] '
labels: 'salvage, micro-pr'
assignees: ''
---

## Original PR

<!-- Link to the closed/parked PR -->

#NNN - [title]

## Why Parked

<!-- Select one -->

- [ ] Too large (exceeded size limits)
- [ ] Hotspot conflicts
- [ ] Stale (outdated base)
- [ ] Failed checks
- [ ] Other:

## Branch Preserved

<!-- Branch name where work is saved -->

`branch-name`

## Salvageable Content

<!-- What can be extracted and merged separately? -->

### Docs (safe to merge first)

- [ ] `docs/path/to/file.md` - [description]
- [ ] `docs/path/to/file.md` - [description]

### Tests (safe if not touching hotspots)

- [ ] `tests/path/to/file.spec.ts` - [description]

### Code (may need coordination)

- [ ] `src/path/to/file.ts` - [description]

## Micro-PR Plan

<!-- Break down into small, mergeable PRs -->

| Order | PR Title | Files | Lines | Hotspot? |
|-------|----------|-------|-------|----------|
| 1 | [title] | ~X | ~Y | No |
| 2 | [title] | ~X | ~Y | No |
| 3 | [title] | ~X | ~Y | Yes |

## Dependencies

<!-- Which micro-PRs depend on others? -->

- PR 2 depends on PR 1
- PR 3 depends on PR 2

## Acceptance Criteria

<!-- When is salvage complete? -->

- [ ] All valuable content extracted
- [ ] All micro-PRs merged
- [ ] Original PR can be deleted
- [ ] Original branch can be deleted

## Notes

<!-- Any additional context -->
