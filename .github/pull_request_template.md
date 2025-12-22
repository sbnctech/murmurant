## Release classification (required)

Select exactly one:

- [ ] experimental
- [ ] candidate
- [ ] stable

## Size (required)

Select exactly one:

- [ ] S (1-5 files, 1-100 lines)
- [ ] M (6-15 files, 101-300 lines)
- [ ] L (16+ files, 301+ lines) - requires split plan below

## Hotspots touched (required)

Check all that apply:

- [ ] prisma/schema.prisma or migrations
- [ ] package.json or package-lock.json
- [ ] .github/workflows/**
- [ ] src/app/admin/**/layout, nav, or search
- [ ] src/components/editor/** or publishing surfaces
- [ ] src/lib/auth*, rbac*, or permissions*
- [ ] None of the above

If ANY hotspot is checked, you MUST complete the Hotspot Plan section below.

## Summary

What changed and why.

## Hotspot Plan

<!-- Required if any hotspot is checked above. Delete if not applicable. -->

**Files affected:**

- file1.ts
- file2.ts

**Why these changes are safe:**

<!-- Explain conflict risk and mitigation -->

**Rollback plan:**

<!-- How to undo if something goes wrong -->

## Split Plan (if size L)

<!-- Required if size is L. Delete if not applicable. -->

**Micro-PRs:**

1. PR: [title] - [files: X, lines: Y]
2. PR: [title] - [files: X, lines: Y]

## Checks

- [ ] Local preflight passed: `npm run -s typecheck`
- [ ] Size declaration matches actual changes
- [ ] Hotspot declaration is accurate
