---
name: Blocked-by-Merge Job
about: Track work that is blocked until themed integration completes
title: '[Blocked] '
labels: 'blocked-by-merge, follow-up'
assignees: ''
---

## Activation Condition

- [ ] This job is blocked until: <!-- link to blocking issue/PR -->
- [ ] Blocking work is currently in progress
- [ ] This issue is parked, not actionable yet

## Task Description

<!-- What work is blocked? -->

## Why Blocked?

<!-- What must complete before this work can start? -->

- Blocked by: #NNN - [title]
- Reason: <!-- conflict, dependency, hotspot coordination -->

## Guardrails

<!-- What constraints apply once unblocked? -->

- [ ] Docs-only
- [ ] Touches hotspots (requires merge captain)
- [ ] Requires schema changes
- [ ] Requires package dependency changes

## Files Affected

<!-- What files will this work touch? -->

- [ ] `path/to/file`
- [ ] `path/to/file`

## Prompt Block (For Worker)

<!-- Instructions for when this becomes actionable -->

```
Goal: [what to accomplish]

Constraints:
- [constraint 1]
- [constraint 2]

Steps:
1. [step 1]
2. [step 2]

Output:
- [expected deliverable]
```

## Test Plan

<!-- How to verify the work is complete -->

- [ ] [verification step 1]
- [ ] [verification step 2]

## Stop Conditions

<!-- When to halt and escalate -->

Stop immediately if:
- The blocking work changes scope
- New conflicts arise
- Task grows beyond M size

When stopping:
1. Update this issue with status
2. Add blocker notes
3. Do not proceed without merge captain approval

## Unblock Trigger

<!-- What event unblocks this? -->

- [ ] PR #NNN merged to main
- [ ] Issue #NNN closed
- [ ] Merge captain approval received

## Related Issues

- Blocked by: #
- Blocks: #
- Theme: #
