# Lights-Out Job Catalog

Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

## Purpose

Lights-out jobs are safe autonomous work that can proceed while the merge
captain is handling hotspot coordination. These jobs maintain forward progress
without creating conflicts or blocking themed integration waves.

## Allowed Categories

### Category A: Documentation

- Process and policy docs
- Architecture decision records
- API reference updates
- Runbooks and checklists
- Backlog grooming and salvage plans

### Category B: Inventories and Audits

- Code inventory reports
- Dependency audits (read-only, no updates)
- Test coverage analysis
- File structure documentation

### Category C: Non-Hotspot Tests

- Unit tests for pure functions (not auth/rbac)
- API contract tests (read-only)
- Test fixtures and helpers
- Snapshot updates for existing components

### Category D: CI Scripts (Read-Only)

- Validation scripts
- Report generators
- Linting configuration (if not in package.json)

## Forbidden Hotspots

Lights-out jobs MUST NOT touch:

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
src/lib/publishing/**
```

If your task requires touching ANY of these files, it is NOT lights-out.
Stop and open a tracking issue instead.

## Activation Conditions Template

Use this template when defining a lights-out job in GitHub Issues:

```markdown
## Activation

- [x] Safe to start immediately (lights-out)

## Scope Guardrails

- [x] Docs-only OR non-hotspot code only
- [x] Must NOT touch: [list forbidden files]
- [x] No schema changes
- [x] No package dependency changes

## Goal

[Brief description of what this job accomplishes]

## Deliverable

- [List specific files to create/modify]
```

## Stop Conditions Template

Include these conditions to halt work safely:

```markdown
## Stop Conditions

Stop immediately and open a tracking issue if:

1. Task requires touching a hotspot file
2. Task requires schema changes
3. Task conflicts with an in-flight themed wave
4. Task grows beyond M size (6-15 files, 101-300 lines)
5. Uncertainty about scope or impact arises

When stopping:
1. Commit any safe, complete work
2. Open tracking issue with details
3. Tag with `blocked-by-merge` label
4. Do not proceed without merge captain approval
```

---

## Example Jobs (Ready to Copy)

### Job 1: API Reference Documentation

```markdown
**Title:** docs(api): document /api/v1/events endpoints

**Activation:**
- Safe to start immediately (lights-out)

**Scope:**
- Docs-only
- Create/update docs/api/EVENTS_API.md

**Deliverable:**
- Document GET/POST/PATCH/DELETE for /api/v1/events
- Include request/response schemas
- Add error codes and examples

**Labels:** lights-out, docs-only
```

### Job 2: Test Coverage Report

```markdown
**Title:** docs(testing): create test coverage inventory

**Activation:**
- Safe to start immediately (lights-out)

**Scope:**
- Docs-only
- Create docs/testing/COVERAGE_INVENTORY.md

**Deliverable:**
- List all test files and what they cover
- Identify gaps in unit test coverage
- Do not modify any tests

**Labels:** lights-out, docs-only
```

### Job 3: Runbook Creation

```markdown
**Title:** docs(ops): add runbook for member data export

**Activation:**
- Safe to start immediately (lights-out)

**Scope:**
- Docs-only
- Create docs/operations/MEMBER_EXPORT_RUNBOOK.md

**Deliverable:**
- Step-by-step export procedure
- Verification checklist
- Troubleshooting section

**Labels:** lights-out, docs-only
```

### Job 4: Architecture Decision Record

```markdown
**Title:** docs(adr): document pagination strategy decision

**Activation:**
- Safe to start immediately (lights-out)

**Scope:**
- Docs-only
- Create docs/architecture/ADR_PAGINATION.md

**Deliverable:**
- Context and problem statement
- Decision and rationale
- Consequences and trade-offs

**Labels:** lights-out, docs-only
```

### Job 5: Backlog Salvage Plan

```markdown
**Title:** docs(backlog): create salvage plan for parked PR #NNN

**Activation:**
- Safe to start immediately (lights-out)

**Scope:**
- Docs-only
- Create docs/backlog/SALVAGE_PLAN_NNN.md

**Deliverable:**
- Inventory of changes in parked PR
- Micro-PR decomposition
- Integration order and dependencies

**Labels:** lights-out, docs-only
```

### Job 6: Unit Tests for Pure Functions

```markdown
**Title:** test(utils): add unit tests for date formatting

**Activation:**
- Safe to start immediately (lights-out)

**Scope:**
- Tests only
- Create/modify tests/unit/utils/date-format.spec.ts
- Must NOT touch src/lib/auth* or src/lib/rbac*

**Deliverable:**
- Test cases for formatDate, parseDate, isValidDate
- Edge cases for timezone handling

**Labels:** lights-out
```

### Job 7: CI Validation Script

```markdown
**Title:** chore(ci): add script to validate markdown links

**Activation:**
- Safe to start immediately (lights-out)

**Scope:**
- Scripts only
- Create scripts/ci/validate-md-links.ts
- Must NOT touch package.json or workflows

**Deliverable:**
- Script that checks all markdown files for broken links
- Can be run manually: npx tsx scripts/ci/validate-md-links.ts

**Labels:** lights-out
```

### Job 8: Error Code Documentation

```markdown
**Title:** docs(errors): document API error codes

**Activation:**
- Safe to start immediately (lights-out)

**Scope:**
- Docs-only
- Create docs/api/ERROR_CODES.md

**Deliverable:**
- List all error codes used in API responses
- Include descriptions and resolution steps
- Group by category (auth, validation, server)

**Labels:** lights-out, docs-only
```

### Job 9: Environment Variable Reference

```markdown
**Title:** docs(config): document required environment variables

**Activation:**
- Safe to start immediately (lights-out)

**Scope:**
- Docs-only
- Create/update docs/deployment/ENV_VARS.md

**Deliverable:**
- List all required and optional env vars
- Include descriptions and example values
- Group by category (database, auth, features)

**Labels:** lights-out, docs-only
```

### Job 10: Test Fixture Documentation

```markdown
**Title:** docs(testing): document test fixture patterns

**Activation:**
- Safe to start immediately (lights-out)

**Scope:**
- Docs-only
- Create docs/testing/FIXTURE_PATTERNS.md

**Deliverable:**
- Document factory functions for test data
- Explain seeding vs runtime fixtures
- Include examples for common entities

**Labels:** lights-out, docs-only
```

---

## Definition of Done

A lights-out job is complete when:

- [ ] All deliverables created
- [ ] No hotspot files touched
- [ ] PR is S or M size (not L)
- [ ] Clear title and description
- [ ] Proper labels applied
- [ ] Ready for merge captain review

## Related Documents

- [WORKER_LIGHTS_OUT_JOBS.md](WORKER_LIGHTS_OUT_JOBS.md) - Detailed workflow
- [HOTSPOT_MAP.md](HOTSPOT_MAP.md) - Complete hotspot list
- [PR_SIZE_LIMITS.md](PR_SIZE_LIMITS.md) - Size categories
