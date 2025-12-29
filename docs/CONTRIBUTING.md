# Contributing to Murmurant

Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

This document describes rules for contributing code and documentation.

## Before You Start

Read these documents first:

- `docs/ARCHITECTURAL_CHARTER.md` - The Murmurant constitution
- `docs/CI/HOTSPOT_MAP.md` - Files requiring special handling
- `docs/CI/PR_SIZE_LIMITS.md` - Size limits and micro-PR pattern

## Hotspot Quarantine

Some files require merge captain ownership. Do not modify these without explicit instruction:

| Hotspot | Owner | Why |
|---------|-------|-----|
| `prisma/schema.prisma` | Merge Captain | Schema changes affect all features |
| `prisma/migrations/**` | Merge Captain | Migration order is critical |
| `package.json` | Merge Captain | Dependency changes affect build |
| `package-lock.json` | Merge Captain | Lock file conflicts are common |
| `.github/workflows/**` | Merge Captain | CI changes affect all PRs |
| `src/app/admin/**/layout.tsx` | Merge Captain | Shared layout affects all admin pages |
| `src/app/admin/**/nav*.tsx` | Merge Captain | Navigation changes are high-impact |
| `src/lib/auth*.ts` | Merge Captain | Authentication logic requires security review |
| `src/lib/rbac*.ts` | Merge Captain | Authorization logic requires security review |
| `src/components/editor/**` | Merge Captain | Editor components are tightly coupled |

If your work requires touching a hotspot:

1. Do not open the PR yourself.
2. Open a tracking issue describing the change.
3. Wait for merge captain to schedule via themed wave.

## PR Size Discipline

Small PRs merge faster and conflict less.

| Size | Files | Lines | What to Do |
|------|-------|-------|------------|
| S | 1-5 | 1-100 | Merge when green |
| M | 6-15 | 101-300 | Needs merge captain approval |
| L | 16+ | 301+ | Close and split into micro-PRs |

**Micro-PR pattern:**

- One concern per PR
- Maximum 5 files
- Maximum 100 lines
- Clear, descriptive title
- No mixing refactors with features

## One-Rebase Rule

Each PR gets one rebase opportunity.

1. Open PR from feature branch.
2. If main advances, you may rebase once: `git rebase origin/main`.
3. If rebase creates conflicts, do not force-resolve.
4. If you already rebased, do not rebase again.

After one rebase, if conflicts appear:

1. Close the PR (keep the branch).
2. Open a tracking issue.
3. Salvage via micro-PRs.

## Close and Recreate Rule

If a PR becomes conflict-heavy:

1. Do not force-merge or multi-rebase.
2. Close the PR with a comment explaining why.
3. Open a tracking issue linking to the closed PR.
4. Create a salvage plan (see `docs/backlog/SALVAGE_PLAN_*.md` for examples).
5. Execute the salvage as a series of micro-PRs.

This approach preserves the original work while avoiding merge conflicts.

## Daily Merge Cadence

The merge captain runs a nightly merge at 11pm:

1. Docs-only PRs with green checks merge first.
2. Non-hotspot PRs with green checks merge second.
3. Hotspot PRs only merge as part of themed waves.

To get your PR merged:

- Keep it small (S-size preferred).
- Avoid hotspots.
- Ensure all checks are green.
- Respond to review feedback promptly.

PRs that sit open for more than 7 days without activity may be closed.

## Commit Messages

Use conventional commits:

```
type(scope): short description

Optional longer description.
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `build`, `ci`

Examples:

- `feat(membership): add renewal reminder email`
- `fix(events): correct date display in list view`
- `docs(api): add endpoint reference for registration`
- `test(eligibility): add unit tests for committee check`

## Testing Requirements

Before opening a PR:

```bash
npm run typecheck    # Must pass
npm run lint         # Must pass
npm run test:unit    # Must pass
```

If your change affects admin surfaces:

```bash
npm run test-admin:stable
```

## What Not to Do

- Do not modify hotspots without merge captain coordination.
- Do not open PRs larger than 300 lines.
- Do not rebase more than once.
- Do not force-merge conflicting PRs.
- Do not skip required tests.
- Do not mix unrelated changes in one PR.
- Do not add features beyond what was requested.

## Getting Help

If you are unsure:

1. Open an issue describing what you want to do.
2. Wait for guidance before writing code.
3. Ask in the PR if you encounter problems.

The merge captain reviews all open PRs daily at 11pm.
