# Contributing to ClubOS

Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

## Before You Start

Before opening any PR, read and understand:

1. [MERGE_POLICY.md](./MERGE_POLICY.md) - Core merge rules
2. [HOTSPOT_MAP.md](./HOTSPOT_MAP.md) - Files that require coordination
3. [PR_SIZE_LIMITS.md](./PR_SIZE_LIMITS.md) - Size thresholds
4. [WORKER_LIGHTS_OUT_JOBS.md](./WORKER_LIGHTS_OUT_JOBS.md) - Safe autonomous work

## Decision Tree

```
Is your change docs-only?
├─ Yes → Open PR, mark as docs-only, wait for merge captain
└─ No
   └─ Does it touch any hotspot?
      ├─ Yes → Do NOT open PR. Open tracking issue instead.
      └─ No
         └─ Is it under size limits (S or M)?
            ├─ Yes → Open PR with proper declarations
            └─ No → Split into micro-PRs first
```

## Workflow for Docs-Only Changes

1. Create branch: `docs/<descriptive-name>`
2. Make changes (docs/, *.md files only)
3. Run: `npm run typecheck`
4. Open PR with:
   - Release classification: candidate
   - Size: S or M
   - Hotspots: "None of the above"
5. Wait for merge captain to merge at nightly run

## Workflow for Non-Hotspot Code Changes

1. Confirm no hotspot files are touched (see HOTSPOT_MAP.md)
2. Confirm size is within limits (see PR_SIZE_LIMITS.md)
3. Create branch: `feat/<name>` or `fix/<name>` or `chore/<name>`
4. Make changes
5. Run: `npm run typecheck && npm run test:unit`
6. Open PR with all required declarations
7. Wait for merge captain review and merge

## Workflow for Hotspot Changes

**Do NOT open a PR directly.**

1. Check if an active themed wave exists (see tracking issues).
2. If yes: coordinate with merge captain to add your work.
3. If no: open a tracking issue (template: merge-captain-integration-branch).
4. Wait for merge captain to create integration branch.
5. Submit micro-PRs to integration branch.
6. Merge captain merges integration branch to main.

## PR Requirements

Every PR must include:

- Release classification (exactly one)
- Size declaration (exactly one)
- Hotspot declaration (check all that apply)
- Summary of changes
- Passing checks

See the PR template for details.

## Code Style

- TypeScript for all code
- Prettier for formatting (run automatically)
- ESLint for linting
- No console.log in committed code
- Meaningful variable and function names

## Testing

- Write tests for new functionality
- Run existing tests before opening PR
- Do not skip or delete tests without approval

## Commit Messages

Format:
```
<type>(<scope>): <subject>

<body>
```

Types: feat, fix, docs, chore, test, refactor

Example:
```
feat(events): add registration confirmation email

Sends confirmation email when member registers for event.
Includes event details and calendar attachment.
```

## Questions

If unsure about anything:

1. Check the policy docs first
2. Open a tracking issue with your question
3. Wait for guidance before proceeding

Do not guess. Do not force. Ask and wait.
