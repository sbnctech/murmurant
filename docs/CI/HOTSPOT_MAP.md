# Hotspot Map

Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

## Purpose

Hotspots are files that frequently cause merge conflicts or require
careful coordination. This document lists all hotspots and the rules
for working with them.

## Primary Hotspots (Merge Captain Only)

These files require merge captain ownership and themed integration:

| Pattern | Reason | Owner |
|---------|--------|-------|
| `prisma/schema.prisma` | Schema changes affect all features | Merge Captain |
| `prisma/migrations/**` | Migration order is critical | Merge Captain |
| `package.json` | Dependency changes affect build | Merge Captain |
| `package-lock.json` | Lock file conflicts are common | Merge Captain |
| `.github/workflows/**` | CI changes affect all PRs | Merge Captain |

## Admin Surface Hotspots

These admin UI files are frequently modified and conflict-prone:

| Pattern | Reason |
|---------|--------|
| `src/app/admin/**/layout.tsx` | Shared layout affects all admin pages |
| `src/app/admin/**/nav*.tsx` | Navigation changes are high-impact |
| `src/app/admin/**/search*.tsx` | Search is cross-cutting |
| `src/app/admin/AdminSectionNav.tsx` | Core navigation component |
| `src/app/admin/AdminSearchPanel.tsx` | Core search component |

## Editor/Publishing Hotspots

These files are part of the editor integration wave:

| Pattern | Reason |
|---------|--------|
| `src/components/editor/**` | Editor components are tightly coupled |
| `src/app/admin/content/pages/**` | Page editor surfaces |
| `src/lib/publishing/**` | Publishing runtime logic |
| `src/components/publishing/**` | Publishing UI components |

## Auth/Security Hotspots

These files require security review:

| Pattern | Reason |
|---------|--------|
| `src/lib/auth*.ts` | Authentication logic |
| `src/lib/rbac*.ts` | Authorization logic |
| `src/lib/permissions*.ts` | Permission checks |
| `src/app/api/**/route.ts` | API route handlers |

## Rules for Hotspot PRs

1. **Declare hotspots in PR body.**
   Use the hotspot checklist in the PR template.

2. **Include HOTSPOT PLAN section.**
   Explain what you are changing and why.

3. **Wait for merge captain.**
   Do not self-merge hotspot PRs.

4. **One hotspot PR at a time.**
   Never have multiple hotspot PRs in flight.

5. **Conflicts mean close and recreate.**
   If rebase conflicts, close PR and salvage via micro-PRs.

## Conflict Resolution

If your PR conflicts with a hotspot:

1. Do not force-resolve the conflict.
2. Close the PR (do not delete branch).
3. Open a tracking issue with salvage plan.
4. Wait for the conflicting work to land.
5. Recreate via micro-PR pattern.

## Themed Integration Waves

For large hotspot work:

1. Create tracking issue (template: merge-captain-integration-branch).
2. Create integration branch: `integration/<theme>-YYYYMMDD`.
3. Land micro-PRs into integration branch.
4. Merge integration branch to main as single wave.
5. Delete integration branch after merge.

Only one theme wave at a time.

## Current Active Waves

Track active waves in GitHub issues:

- #200 - Editor/Publishing Wave
- #201 - Auth/RBAC Wave
- #202 - Migration Wave
- #203 - Eligibility Wave

Check these issues before starting hotspot work.
