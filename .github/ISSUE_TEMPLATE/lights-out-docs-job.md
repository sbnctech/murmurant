---
name: Lights-Out Docs Job
about: Request autonomous documentation work that avoids hotspots
title: '[Docs] '
labels: 'docs-only, lights-out'
assignees: ''
---

## Task Description

<!-- What documentation needs to be created or updated? -->

## Files to Create/Modify

<!-- List the files. Must be in docs/ or other non-hotspot paths -->

- [ ] `docs/path/to/file.md`
- [ ] `docs/path/to/file.md`

## Hotspot Check

<!-- Confirm this is lights-out safe -->

- [ ] No files in prisma/
- [ ] No files in package.json or package-lock.json
- [ ] No files in .github/workflows/
- [ ] No files in src/app/admin/**/layout, nav, search
- [ ] No files in src/components/editor/
- [ ] No files in src/lib/auth*, rbac*, permissions*
- [ ] **This is a lights-out safe job**

## Acceptance Criteria

<!-- What must be true when done? -->

- [ ] File(s) created/updated
- [ ] Markdown renders correctly
- [ ] Links are valid
- [ ] No hotspots touched

## Context

<!-- Any background information -->

## Related Issues

<!-- Link to related issues or PRs -->

- #
- #
