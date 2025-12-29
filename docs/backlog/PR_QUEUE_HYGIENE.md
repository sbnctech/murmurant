<!--
  Copyright © 2025 Murmurant, Inc. All rights reserved.
-->


# PR Queue Hygiene

Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

## Purpose

This document describes how to maintain a healthy PR queue.
The goal is to keep open PRs to a minimum and prevent merge churn.

## Target State

- Fewer than 10 open PRs at any time
- Zero PRs older than 7 days without activity
- Zero PRs with failing checks (close or fix)
- All parked work tracked in issues

## When to Park a PR

Park (close or convert to draft) a PR when:

- It has been open more than 7 days without activity
- It has conflicts with main
- It touches hotspots and is not part of active wave
- It exceeds size limits and cannot be split
- Checks are failing and cannot be fixed quickly

## How to Park a PR

### Option 1: Convert to Draft

Use when work is in progress but blocked:

```bash
gh pr ready --undo NNN
```

### Option 2: Close with Tracking Issue

Use when work is complete but cannot merge:

1. Open tracking issue (use micro-pr-salvage template)
2. Close PR with comment linking to issue
3. Keep branch for salvage

Comment template:
```markdown
Parking this PR due to [reason].

Tracking issue: #NNN
Branch preserved: `branch-name`

Next steps:
- [describe salvage plan]
```

## How to Label PRs

| Label | When to Apply |
|-------|---------------|
| `docs-only` | PR only changes docs/ or *.md files |
| `hotspot-touching` | PR touches any hotspot file |
| `merge-captain-only` | PR requires merge captain ownership |
| `lights-out` | Safe for autonomous merge |
| `parked` | PR is intentionally paused |
| `salvage` | PR content being extracted to micro-PRs |

## How to Use Tracking Issues

Current themed wave tracking issues:

- #200 - Editor/Publishing Wave
- #201 - Auth/RBAC Wave
- #202 - Migration Wave
- #203 - Eligibility Wave

When parking work:

1. Find the relevant theme issue
2. Add a comment with PR number and salvage notes
3. Close the PR
4. Reference the issue in PR close comment

## Weekly Hygiene Routine

Every Monday:

1. List all open PRs: `gh pr list --state open`
2. Close any PR older than 14 days with no activity
3. Convert any stale PR (7-14 days) to draft
4. Verify all open PRs have proper labels
5. Update tracking issues with current state

## Merge Captain Responsibilities

The merge captain is responsible for:

- Nightly merge runs (see MERGE_CHECKLIST_11PM.md)
- Weekly hygiene routine
- Tracking issue updates
- Hotspot coordination

## Emergency Procedures

### Too Many Open PRs (>20)

1. Stop all new PR creation
2. Run aggressive prune:
   - Close all PRs older than 7 days
   - Close all PRs with failing checks
   - Convert all hotspot PRs to draft
3. Create tracking issues for closed work
4. Resume normal operations when under 10

### Main is Broken

1. Stop all merges immediately
2. Identify breaking commit: `git bisect`
3. Revert if clear: `git revert <commit>`
4. Open P0 issue for investigation
5. Resume merges only after fix confirmed

## Metrics to Track

Track weekly:

- Open PR count
- Average PR age
- PRs merged vs closed
- Hotspot collision incidents

Goal: Downward trend in open PRs, zero collisions.
