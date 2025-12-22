# PR Size Limits

Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

## Purpose

Small PRs are easier to review, less likely to conflict, and safer to merge.
This document defines size limits and what to do when limits are exceeded.

## Size Categories

| Size | Files | Lines Changed | Review Required | Merge Policy |
|------|-------|---------------|-----------------|--------------|
| **S** | 1-5 | 1-100 | Self-review OK | Merge when green |
| **M** | 6-15 | 101-300 | Peer review | Merge captain approval |
| **L** | 16+ | 301+ | Split required | Close and salvage |

## Counting Rules

- **Files**: Count distinct files changed (added, modified, deleted).
- **Lines**: Count total lines added + deleted (not net change).
- **Exclude**: Generated files, lock files, and snapshots may be excluded.

## Size Declaration

Every PR must declare its size in the PR body:

```markdown
## Size

- [ ] S (1-5 files, 1-100 lines)
- [ ] M (6-15 files, 101-300 lines)
- [ ] L (16+ files, 301+ lines)
```

CI will validate size declaration against actual changes.

## What to Do When Over Limit

### If PR is Medium (M)

1. Consider splitting into smaller PRs.
2. If splitting is impractical, proceed with merge captain review.
3. Document why the PR cannot be smaller.

### If PR is Large (L)

1. **Stop.** Do not open or continue the PR.
2. Close the PR (keep branch).
3. Open a tracking issue.
4. Create a split plan.
5. Execute split as micro-PRs.

## Micro-PR Pattern

A micro-PR is a minimal, focused change:

- One concern per PR.
- Maximum 5 files.
- Maximum 100 lines.
- Clear, descriptive title.
- No mixing refactors with features.

### Examples

Good micro-PRs:
- "fix: correct date formatting in event list"
- "docs: add API reference for registration endpoint"
- "test: add unit tests for membership tier logic"

Bad (too large):
- "feat: add complete event management system"
- "refactor: reorganize entire admin module"

## Split Plan Template

When splitting a large PR, create a plan:

```markdown
## Split Plan for PR #NNN

Original scope: [describe]

### Micro-PRs

1. PR: [title] - [files: X, lines: Y]
2. PR: [title] - [files: X, lines: Y]
3. PR: [title] - [files: X, lines: Y]

### Order

Merge in order listed. Each PR should be green before next.

### Dependencies

- PR 2 depends on PR 1
- PR 3 depends on PR 2
```

## Exceptions

Size limits may be exceeded for:

1. **Generated files**: Lock files, snapshots, API specs.
2. **Bulk renames**: File moves without logic changes.
3. **Themed integration waves**: Merge captain owned.

Exceptions must be documented in PR body with justification.

## Enforcement

- CI checks file count and line count.
- PRs exceeding limits without exception will fail checks.
- Merge captain may override with explicit approval.
