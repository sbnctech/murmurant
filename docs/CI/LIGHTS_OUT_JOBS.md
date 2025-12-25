# Lights-Out Job Catalog

This document catalogs CI jobs designed to run unattended (overnight, weekly) with clear pass/fail signals.

---

## What Is a "Lights-Out Job"?

A **lights-out job** is an automated CI task that:

1. **Runs unattended** - No human needs to watch it
2. **Produces clear signals** - Pass/fail with actionable summaries
3. **Has defined SLAs** - Expected runtime, owner, escalation path
4. **Is self-documenting** - Failures include context for resolution

These jobs enable:

- Overnight work without babysitting
- Nightly regression detection
- Weekly deep audits
- Reduced CI queue pressure during work hours

---

## Job Catalog

### Active Jobs

| Name | Command | Runtime | Schedule | What It Catches | Owner |
|------|---------|---------|----------|-----------------|-------|
| **PR Gate** | `npm run green` | ~30-60s | Every PR | Type errors, lint, unit failures | Any dev |
| **Full Suite** | `npm run green:full` | ~5-10m | Push to main, nightly | E2E regressions, integration issues | Merge captain |
| **Flaky Quarantine** | `npm run green:flaky` | ~2-5m | Nightly | Flaky test status, new instability | Merge captain |

### Proposed Lights-Out Jobs

| Name | Command | Runtime | Schedule | What It Catches | Owner |
|------|---------|---------|----------|-----------------|-------|
| **Full Unit + Contracts** | `npm run test:unit && npm run test-contracts:unit` | ~20s | Nightly | Contract violations, unit regressions | Merge captain |
| **Full Playwright** | `npm run test-admin:stable && npm run test-api:stable` | ~5-8m | Nightly | Browser/API E2E regressions | Merge captain |
| **Migration Suite** | `npx vitest run tests/unit/migration` | ~5s | Nightly, on migration PRs | Migration logic errors | Merge captain |
| **Lint + Typecheck Only** | `npm run typecheck && npm run lint` | ~15s | Weekly | Type drift, lint debt | Any dev |
| **Flaky Backlog Audit** | `npm run test:flaky-backlog` | ~1s | On test PRs, nightly | Missing issue links for @flaky | Merge captain |
| **Dependency Audit** | `npm audit --audit-level=high` | ~5s | Weekly | Known vulnerabilities | Merge captain |

---

## Job Definitions

### PR Gate (Active)

```yaml
name: PR Gate
trigger: pull_request, push to main
command: npm run green
timeout: 5 minutes
required: Yes (blocks merge)
```

**Steps:**
1. TypeScript compilation
2. ESLint static analysis
3. Auth guardrails check
4. Vitest unit tests

**On failure:** Developer must fix before merge.

---

### Full Suite (Active)

```yaml
name: Full Suite
trigger: push to main, nightly (3 AM UTC), label 'run-full-ci'
command: npm run green:full
timeout: 15 minutes
required: No (informational on PR, required on main)
```

**Steps:**
1. All PR Gate steps
2. Database seeding
3. Playwright admin tests
4. Playwright API tests

**On failure:** Check if failure is in changed files or a known issue.

---

### Flaky Quarantine (Active)

```yaml
name: Flaky Quarantine
trigger: nightly (4 AM UTC), PRs touching tests/**
command: npm run green:flaky (nightly) / npm run test:flaky-backlog (PRs)
timeout: 10 minutes
required: No (informational)
```

**Purpose:** Monitor tests marked @flaky, enforce issue tracking.

**On failure:** Check linked GitHub issues for status.

---

### Migration Suite (Proposed)

```yaml
name: Migration Suite
trigger: nightly, PRs touching scripts/migration/** or tests/unit/migration/**
command: npx vitest run tests/unit/migration
timeout: 2 minutes
required: No (but recommended for migration PRs)
```

**What it tests:**
- WA client retry/backoff logic
- Registration sync transformers
- Policy capture validation
- Migration bundle integrity

**On failure:** Check migration logic for regressions.

---

### Dependency Audit (Proposed)

```yaml
name: Dependency Audit
trigger: weekly (Sunday 2 AM UTC)
command: npm audit --audit-level=high
timeout: 2 minutes
required: No (advisory)
```

**What it catches:**
- Known CVEs in dependencies
- High/critical severity vulnerabilities

**On failure:** Create issue for dependency update, assess risk.

---

## Runtime Expectations

| Job | Target | Maximum | Acceptable Flake Rate |
|-----|--------|---------|----------------------|
| PR Gate | 30s | 60s | 0% (must be deterministic) |
| Full Suite | 5m | 15m | <5% (retry once) |
| Flaky Quarantine | 2m | 10m | Any (by definition) |
| Migration Suite | 3s | 30s | 0% |
| Lint + Typecheck | 10s | 30s | 0% |
| Dependency Audit | 3s | 30s | 0% |

---

## Ownership Model

| Owner | Responsibilities |
|-------|------------------|
| **Any dev** | Fix failures caused by their PR, run PR Gate locally |
| **Merge captain** | Monitor nightly jobs, triage failures, escalate blockers |

### Escalation Path

1. **Nightly job fails** - Merge captain reviews in morning standup
2. **Same job fails 2+ nights** - Create tracking issue
3. **Critical path blocked** - Notify team immediately

---

## Test Sharding Proposal

For parallel execution and faster feedback, tests can be sharded by domain.

### Unit Test Shards

| Shard | Folder | Approx Tests | Focus |
|-------|--------|--------------|-------|
| **auth** | `tests/unit/auth`, `tests/unit/passkey` | ~40 | Authentication, tokens, capabilities |
| **events** | `tests/unit/events` | ~50 | Event lifecycle, registration |
| **publishing** | `tests/unit/publishing` | ~100 | Blocks, pages, themes |
| **governance** | `tests/unit/governance` | ~40 | Minutes, secretary dashboard |
| **migration** | `tests/unit/migration`, `tests/unit/importing` | ~60 | WA sync, policy capture |
| **finance** | `tests/unit/finance`, `tests/unit/payments` | ~20 | Payment idempotency |
| **core** | `tests/unit/ci`, `tests/unit/config`, `tests/unit/flags` | ~20 | CI checks, config, feature flags |
| **other** | Remaining `tests/unit/*` | ~30 | Profile, home, timezone, etc. |

### Example Commands

```bash
# Run single shard
npx vitest run tests/unit/auth tests/unit/passkey

# Run migration shard only
npx vitest run tests/unit/migration tests/unit/importing

# Run publishing shard
npx vitest run tests/unit/publishing
```

### Playwright Shards

| Shard | Command | Approx Tests |
|-------|---------|--------------|
| **admin** | `npx playwright test tests/admin --workers=2` | ~40 |
| **api** | `npx playwright test tests/api --workers=2` | ~50 |
| **contracts** | `npx playwright test tests/contracts --workers=2` | ~10 |
| **public** | `npx playwright test tests/public --workers=2` | ~5 |

### Parallel Workflow Example (Proposed)

```yaml
# .github/workflows/parallel-tests.yml (conceptual)
jobs:
  unit-auth:
    runs-on: ubuntu-latest
    steps:
      - run: npx vitest run tests/unit/auth tests/unit/passkey

  unit-publishing:
    runs-on: ubuntu-latest
    steps:
      - run: npx vitest run tests/unit/publishing

  unit-migration:
    runs-on: ubuntu-latest
    steps:
      - run: npx vitest run tests/unit/migration tests/unit/importing

  # ... more shards
```

### Benefits of Sharding

| Benefit | Impact |
|---------|--------|
| **Faster feedback** | Each shard runs in parallel |
| **Isolation** | Failure in one domain doesn't mask others |
| **Targeted reruns** | Re-run only the failing shard |
| **Resource efficiency** | Small shards can use smaller runners |

### Implementation Notes

1. **Phase 1 (Current)**: Document shards, validate with local runs
2. **Phase 2 (Future)**: Add shard scripts to package.json
3. **Phase 3 (Future)**: Create parallel GitHub workflow

---

## Adding New Lights-Out Jobs

### Checklist

- [ ] Define clear trigger (schedule, event)
- [ ] Set realistic timeout
- [ ] Assign owner
- [ ] Document what it catches
- [ ] Add to this catalog
- [ ] Add to appropriate workflow file

### Template

```yaml
name: [Job Name]
trigger: [when it runs]
command: [npm run command or script]
timeout: [max duration]
required: [Yes/No - does it block?]
owner: [merge captain / any dev]
catches: [what failures indicate]
on_failure: [what to do]
```

---

## Related Documentation

- [GREEN_GATE.md](./GREEN_GATE.md) - Three-lane CI model
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Merge workflow
- [HOTSPOT_MAP.md](./HOTSPOT_MAP.md) - Files requiring special review

---

*Last updated: December 2024*
