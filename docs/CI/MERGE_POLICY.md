# Merge Policy

Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

## Purpose

This document defines the canonical merge policy for Murmurant.
The goal is to prevent merge churn, reduce PR queue chaos, and ensure
that main remains stable and deployable at all times.

## Core Principles

1. **Safety over speed.** A calm, stable repo is more valuable than fast merges.
2. **One merge captain.** Only one person merges at a time.
3. **Small PRs only.** Large PRs create conflicts and block others.
4. **Hotspots are quarantined.** Files that cause conflicts require special handling.
5. **Themed integration.** Related changes merge together in planned waves.

## Merge Captain Role

- Only the designated merge captain may merge PRs to main.
- The merge captain runs the nightly merge checklist (see MERGE_CHECKLIST_11PM.md).
- The merge captain owns conflict resolution and hotspot coordination.
- If you are not the merge captain, do not merge anything.

## PR Size Limits

| Size | Files Changed | Lines Changed | Policy |
|------|---------------|---------------|--------|
| S (Small) | 1-5 | 1-100 | Merge when green |
| M (Medium) | 6-15 | 101-300 | Requires merge captain review |
| L (Large) | 16+ | 301+ | Must be split or converted to themed wave |

PRs exceeding L thresholds will be closed and salvaged via micro-PR pattern.

See: PR_SIZE_LIMITS.md for details.

## Hotspot Quarantine Rules

The following files are designated hotspots:

- `prisma/schema.prisma`
- `prisma/migrations/**`
- `package.json`
- `package-lock.json`
- `.github/workflows/**`
- `src/app/admin/**/layout.tsx`
- `src/app/admin/**/nav*.tsx`
- `src/app/admin/**/search*.tsx`
- `src/components/editor/**`
- `src/app/admin/content/pages/**`

Rules for hotspot PRs:

1. Only merge captain may merge hotspot PRs.
2. Only one hotspot PR may be in flight at a time.
3. Hotspot PRs require a HOTSPOT PLAN section in PR body.
4. If conflicts arise, close PR and recreate via micro-PR salvage.

See: HOTSPOT_MAP.md for the complete list.

## Rebase Policy

- Rebase at most once before merge.
- If rebase creates conflicts, do not force-resolve.
- Instead: close PR, open tracking issue, salvage via micro-PRs.
- Never rebase large PRs. Close and recreate instead.

## Themed Integration Branches

For related work touching hotspots:

1. Create a tracking issue (use template: merge-captain-integration-branch).
2. Create integration branch: `integration/<theme>-YYYYMMDD`.
3. Merge micro-PRs into integration branch first.
4. Merge integration branch to main as single themed wave.
5. Only merge captain owns integration branches.

One theme at a time. Never run parallel integration branches.

## Required PR Body Contract

All PRs must include:

1. **Release classification** (exactly one checked):
   - [ ] experimental
   - [ ] candidate
   - [ ] stable

2. **Size declaration** (exactly one checked):
   - [ ] S (1-5 files, 1-100 lines)
   - [ ] M (6-15 files, 101-300 lines)
   - [ ] L (16+ files, 301+ lines) - requires split plan

3. **Hotspot declaration** (check all that apply):
   - [ ] touches prisma/schema.prisma
   - [ ] touches package.json or package-lock.json
   - [ ] touches admin layout/nav/search
   - [ ] touches editor/publishing surfaces
   - [ ] none of the above

4. If any hotspot checked: **HOTSPOT PLAN** section required.

## Enforcement

- CI will fail PRs that exceed size limits without override.
- CI will fail PRs that touch hotspots without HOTSPOT PLAN.
- Merge captain reviews all PRs before merge.
- PRs without proper classification will not be merged.

## Nightly Merge Cadence

The merge captain runs the 11pm checklist:

1. Sync main.
2. Review open PRs.
3. Merge docs-only PRs first (if green).
4. Merge non-hotspot PRs next (if green).
5. Merge hotspot PRs only if explicitly owned and planned.
6. Run smoke tests.
7. Record notes in daily log.

See: MERGE_CHECKLIST_11PM.md for the full procedure.

## Escalation

If merge conflicts block progress:

1. Park the conflicting PR (convert to draft or close).
2. Open tracking issue with salvage plan.
3. Notify merge captain.
4. Wait for themed integration wave.

Do not attempt heroic conflict resolution. Park and plan.
