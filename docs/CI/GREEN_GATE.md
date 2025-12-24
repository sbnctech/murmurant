# The Green Gate

ClubOS CI uses a **three-lane model** to keep builds fast, deterministic, and comprehensive.

---

## The Three Lanes

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CI SIGNAL LANES                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  LANE 1: PR Gate (Fast)          npm run green                      │
│  ─────────────────────           ~30-60 seconds                     │
│  Runs on: Every PR, every push                                      │
│  Purpose: Fast feedback, blocks merge if failing                    │
│                                                                     │
│  LANE 2: Full Suite              npm run green:full                 │
│  ─────────────────────           ~5-10 minutes                      │
│  Runs on: Push to main, nightly, label 'run-full-ci'               │
│  Purpose: Comprehensive validation with Playwright                  │
│                                                                     │
│  LANE 3: Flaky Quarantine        npm run green:flaky                │
│  ─────────────────────           Nightly only                       │
│  Runs on: Nightly, tests/**  PRs (validation only)                  │
│  Purpose: Monitor flaky tests, enforce issue tracking               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Lane 1: PR Gate (`npm run green`)

The fast, deterministic check that must pass before any PR can merge.

### What It Runs (~30-60 seconds)

| Step | Command | Purpose |
|------|---------|---------|
| 1 | `typecheck` | TypeScript compilation errors |
| 2 | `lint` | ESLint static analysis |
| 3 | `test:guardrails` | Auth/impersonation safety checks |
| 4 | `test:unit` | Vitest unit tests (including contracts) |

### What It Does NOT Run

| Excluded | Why | Where It Runs |
|----------|-----|---------------|
| Playwright browser tests | Slow, flaky risk | Lane 2 (Full Suite) |
| Database seeding | Requires Postgres | Lane 2 (Full Suite) |
| `@flaky` tests | Intermittent failures | Lane 3 (Quarantine) |

### Why This Is Enough

- **Type errors**: Caught at compile time
- **Lint issues**: Static analysis finds common bugs
- **Security invariants**: Guardrails enforce impersonation safety
- **Business logic**: Unit tests cover deterministic logic

### CI Workflow

File: `.github/workflows/green.yml`

Runs on:
- All pull requests
- All pushes to main

**Required check for merges to main.**

---

## Lane 2: Full Suite (`npm run green:full`)

Comprehensive validation including browser tests.

### What It Runs (~5-10 minutes)

1. Everything in Lane 1 (PR Gate)
2. Database seeding (`npm run db:seed`)
3. Playwright admin tests (`npm run test-admin:stable`)
4. Playwright API tests (`npm run test-api:stable`)

### When It Runs

| Trigger | Why |
|---------|-----|
| Push to main | Post-merge verification |
| Nightly (3 AM UTC) | Catch regressions |
| Label `run-full-ci` | On-demand for critical PRs |
| Manual trigger | Via workflow_dispatch |

### CI Workflow

File: `.github/workflows/green-full.yml`

---

## Lane 3: Flaky Quarantine (`npm run green:flaky`)

Managed isolation for intermittently failing tests.

### How It Works

1. Mark flaky test with `@flaky` tag
2. Create GitHub issue to track the flakiness
3. Add issue link as comment near the tag
4. Test is excluded from PR gate but runs nightly

### Requirements

**Every `@flaky` test MUST have a GitHub issue link.**

```typescript
// REQUIRED format - must include issue link
// Flaky: https://github.com/sbnctech/clubos/issues/XXX
test('@flaky: sometimes fails due to timing', async () => {
  // ...
});
```

The `test:flaky-backlog` script validates this:

```bash
npm run test:flaky-backlog
```

### CI Workflow

File: `.github/workflows/flaky-quarantine.yml`

Runs:
- **On PRs touching tests/**: Validates issue links only (fast)
- **Nightly (4 AM UTC)**: Runs actual flaky tests, reports health

### Philosophy

We don't hide flakiness — we track it:
- Flaky tests don't block PRs (keeps CI calm)
- But every flaky test needs an issue (accountability)
- Nightly runs monitor progress (visibility)
- Goal: fix and remove `@flaky` tags

---

## Commands Reference

```bash
# Lane 1: PR Gate (fast, required for merge)
npm run green

# Lane 2: Full Suite (comprehensive)
npm run green:full

# Lane 2: E2E only (Playwright + seed)
npm run green:e2e

# Lane 3: Flaky tests only
npm run green:flaky

# Validate flaky test backlog
npm run test:flaky-backlog

# Explain what green runs
npm run explain:green
```

---

## Tagging Tests

### `@quarantine`

Future/strict tests that aren't ready yet. Not expected to pass.

```typescript
test('@quarantine: strict assertion not yet implemented', async () => {
  // ...
});
```

### `@flaky`

Tests that pass most of the time but occasionally fail. **Must have issue link.**

```typescript
// Flaky: https://github.com/sbnctech/clubos/issues/123
test('@flaky: timing-sensitive operation', async () => {
  // ...
});
```

---

## Debugging Failures

### typecheck fails

```bash
npm run typecheck
# Read the error, fix the type issue
```

### lint fails

```bash
npm run lint
# Fix the lint error, or add eslint-disable with justification
```

### guardrails fails

```bash
npm run test:guardrails
# See docs/CI/INVARIANTS.md for how to fix each type
```

### test:unit fails

```bash
npm run test:unit
# Or run specific test: npx vitest run tests/unit/specific.spec.ts
```

### flaky-backlog fails

```bash
npm run test:flaky-backlog
# Add issue link to any @flaky test missing one
```

---

## Adding New Checks

### To Lane 1 (PR Gate)

Requirements:
- Fast (<5s)
- Deterministic (no flaky failures)
- No infrastructure requirements

Steps:
1. Add to the `green` script in `package.json`
2. Add step to `.github/workflows/green.yml`
3. Update this documentation

### To Lane 2 (Full Suite)

For checks that need database or browser:
1. Add to `green:e2e` or `green:full` in `package.json`
2. Add step to `.github/workflows/green-full.yml`
3. Update this documentation

---

## Design Principles

1. **Fast PR gate**: Under 60 seconds, so developers run it often
2. **Deterministic**: No flaky tests in the PR gate
3. **Comprehensive nightly**: Full coverage runs every night
4. **Tracked flakiness**: Flaky tests isolated but monitored
5. **Calm failures**: Clear summaries, no wall of red text
6. **High standards**: We don't lower the bar, we isolate the noise
