# Worker Lights-Out Jobs

Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

## Purpose

This document defines "lights-out" work that autonomous workers (chatbots or
humans) can safely perform without merge captain coordination.

Lights-out jobs avoid hotspots and can be merged independently.

## Definition

A lights-out job is work that:

1. Does NOT touch any hotspot file (see HOTSPOT_MAP.md).
2. Does NOT require schema migrations.
3. Does NOT modify package dependencies.
4. Does NOT change admin navigation, layout, or search.
5. Does NOT modify editor or publishing surfaces.
6. CAN be merged independently without conflict risk.

## Safe Job Types

### Category A: Documentation

- Spec documents (docs/**/*)
- API documentation updates
- Architecture decision records
- Process and policy docs
- Runbooks and checklists

Examples:
- docs/specs/NEW_FEATURE_SPEC.md
- docs/architecture/DECISION_*.md
- docs/operations/*.md

### Category B: Inventories and Audits

- Code inventory reports
- Dependency audits
- Test coverage analysis
- File structure documentation

Examples:
- docs/audits/DEPENDENCY_AUDIT_YYYYMMDD.md
- docs/inventories/API_SURFACE.md

### Category C: Non-Hotspot Tests

- Unit tests for existing pure functions
- API contract tests (read-only)
- Test fixtures and helpers

Examples:
- tests/unit/lib/**.spec.ts (if not touching auth/rbac)
- tests/fixtures/*.ts

### Category D: CI Scripts (Read-Only)

- Linting scripts
- Validation scripts
- Report generators

Examples:
- scripts/ci/validate-*.ts
- scripts/ci/report-*.ts

## Do-Not-Touch List

Workers performing lights-out jobs must NOT touch:

```
prisma/schema.prisma
prisma/migrations/**
package.json
package-lock.json
.github/workflows/**
src/app/admin/**/layout.tsx
src/app/admin/**/nav*.tsx
src/app/admin/**/search*.tsx
src/components/editor/**
src/app/admin/content/pages/**
src/lib/auth*.ts
src/lib/rbac*.ts
```

If your task requires touching any of these files, it is NOT a lights-out job.
Stop and open a tracking issue instead.

## Lights-Out Job Workflow

1. Confirm task is lights-out safe (check file list above).
2. Create branch: `docs/<descriptive-name>` or `chore/<descriptive-name>`.
3. Make changes.
4. Run: `npm run typecheck && npm run lint`
5. Open PR with proper classification (usually: candidate).
6. Mark size as S or M.
7. Check "none of the above" for hotspots.
8. Wait for merge captain to merge at next nightly run.

## Examples of Lights-Out PRs

Good:
- "docs: add API reference for /api/v1/events"
- "chore: add unit tests for date formatting utilities"
- "docs: update deployment checklist"

Bad (not lights-out):
- "feat: add new field to Event model" (touches schema)
- "chore: update dependencies" (touches package.json)
- "fix: admin nav not showing correctly" (touches admin layout)

## Escalation

If you start a lights-out job and discover it requires hotspot changes:

1. Stop immediately.
2. Commit any safe changes separately.
3. Open a tracking issue for the hotspot work.
4. Notify merge captain.
5. Do not proceed with hotspot changes.
