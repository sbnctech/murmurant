# Murmurant CI and Merge Policy

Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

## Overview

This directory contains the canonical policies and procedures for merging
code into the Murmurant repository. The goal is to prevent merge churn, reduce
PR queue chaos, and ensure that main remains stable and deployable.

## Quick Start

| You are... | Start here |
|------------|------------|
| Merge captain | [MERGE_CHECKLIST_11PM.md](MERGE_CHECKLIST_11PM.md) |
| Contributor opening a PR | [CONTRIBUTING.md](CONTRIBUTING.md) |
| Worker doing lights-out job | [WORKER_LIGHTS_OUT_JOBS.md](WORKER_LIGHTS_OUT_JOBS.md) |
| Checking if file is hotspot | [HOTSPOT_MAP.md](HOTSPOT_MAP.md) |

## Core Documents

### Merge Policy

- [MERGE_POLICY.md](MERGE_POLICY.md) - The canonical merge policy. Read this first.
- [MERGE_CHECKLIST_11PM.md](MERGE_CHECKLIST_11PM.md) - Nightly merge captain procedure.
- [MERGE_CHURN_PREVENTION.md](MERGE_CHURN_PREVENTION.md) - How to avoid merge conflicts.

### PR Guidelines

- [CONTRIBUTING.md](CONTRIBUTING.md) - How to contribute code.
- [PR_SIZE_LIMITS.md](PR_SIZE_LIMITS.md) - Size categories and limits.
- [DOCS_ONLY_PR_CHECKLIST.md](DOCS_ONLY_PR_CHECKLIST.md) - Checklist for docs-only PRs.
- [RELEASE_CLASSIFICATION.md](RELEASE_CLASSIFICATION.md) - experimental/candidate/stable.

### Safety and Hotspots

- [HOTSPOT_MAP.md](HOTSPOT_MAP.md) - Files that require special handling.
- [WORKER_LIGHTS_OUT_JOBS.md](WORKER_LIGHTS_OUT_JOBS.md) - Safe autonomous work patterns.
- [LIGHTS_OUT_JOB_CATALOG.md](LIGHTS_OUT_JOB_CATALOG.md) - Catalog of safe job types.

### Schema and Database

- [PRISMA_RULES.md](PRISMA_RULES.md) - Rules for Prisma schema changes.

### Integration Waves

- [EDITOR_INTEGRATION_PLAYBOOK.md](EDITOR_INTEGRATION_PLAYBOOK.md) - Editor theme integration.
- [MERGE_POLICY_ADDENDUM_EDITOR_WAVE.md](MERGE_POLICY_ADDENDUM_EDITOR_WAVE.md) - Editor-specific rules.

### Status and Reports

- [PRUNE_AND_POLICY_REPORT.md](PRUNE_AND_POLICY_REPORT.md) - Latest prune status.
- [ENGINEERING_CONSTITUTION.md](ENGINEERING_CONSTITUTION.md) - Foundational principles.

## Key Commands

```bash
# Run merge captain script (dry run)
cd "$HOME/murmurant" && DRY_RUN=1 zsh ./MERGE_CAPTAIN.zsh

# Check open PRs
gh pr list --state open

# Merge a docs-only PR
gh pr merge NNN --squash --delete-branch

# Verify main is green
npm run typecheck && npm run test:unit
```

## Labels

| Label | Meaning |
|-------|---------|
| `lights-out` | Safe for autonomous execution |
| `docs-only` | Documentation changes only |
| `merge-captain-only` | Requires merge captain coordination |
| `blocked-by-merge` | Wait for integration wave |
| `theme-*` | Part of a themed integration wave |

## Escalation

If blocked or uncertain:

1. Do not proceed.
2. Open a tracking issue.
3. Tag with appropriate labels.
4. Wait for merge captain.

See [MERGE_POLICY.md](MERGE_POLICY.md) for details.
