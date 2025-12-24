# The Green Gate

`npm run green` is the single, fast, deterministic command that must pass before any PR can merge.

## What It Runs

| Step | Command | Time | Purpose |
|------|---------|------|---------|
| 1 | `typecheck` | ~5s | TypeScript compilation errors |
| 2 | `lint` | ~5s | ESLint static analysis |
| 3 | `test:guardrails` | ~2s | Auth/impersonation safety checks |
| 4 | `test:unit` | ~10s | Vitest unit tests (including contracts) |

**Total: ~30-60 seconds**

## What It Does NOT Run

These are intentionally excluded from `green` to keep it fast and deterministic:

| Excluded | Why | Alternative |
|----------|-----|-------------|
| Playwright browser tests | Slow (~3min), flaky risk | `npm run green:e2e` |
| Database seeding | Requires Postgres | `npm run green:e2e` |
| Full E2E suite | Too slow for every commit | `npm run green:full` |

## Why This Is Enough

A skeptical senior engineer should ask: "How do I know this catches real bugs?"

### 1. Type Errors (typecheck)

TypeScript catches:
- Null/undefined access
- Wrong argument types
- Missing properties
- API contract violations

If it compiles, the types are correct.

### 2. Static Analysis (lint)

ESLint catches:
- Unused variables (dead code)
- Missing dependencies in hooks
- Unreachable code
- Common JavaScript pitfalls

### 3. Security Invariants (guardrails)

The guardrail script (`scripts/ci/check-auth-guardrails.ts`) enforces:
- **Impersonation safety**: Routes with dangerous capabilities must use `requireCapabilitySafe()`
- **Admin auth guards**: All admin routes must have authentication
- **Blocked capabilities sync**: The blocked list stays consistent

See: [INVARIANTS.md](./INVARIANTS.md)

### 4. Business Logic (unit tests)

Vitest tests cover:
- Lifecycle state machine (90-day, 730-day boundaries)
- RBAC capability checks
- Event scheduling logic
- Membership transitions

These are deterministic (no network, no browser, no database).

## Commands

```bash
# Fast gate (required for merge)
npm run green

# E2E tests (Playwright, needs database)
npm run green:e2e

# Full suite (green + e2e)
npm run green:full

# Explain what green runs
npm run explain:green
```

## CI Integration

The `green` workflow (`.github/workflows/green.yml`) runs on:
- All pull requests
- All pushes to main

It is configured as a **required check** for merges to main.

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

## Design Principles

1. **Fast**: Under 60 seconds, so developers run it before every push
2. **Deterministic**: No flaky tests, no network calls, no timing issues
3. **Explainable**: `npm run explain:green` shows exactly what ran
4. **Sufficient**: Catches the bugs that matter before they reach review

## Adding New Checks

To add a new check to `green`:

1. Ensure it's fast (<5s) and deterministic
2. Add to the `green` script in `package.json`
3. Update this documentation
4. Update `explain:green` output

If the check is slow or requires infrastructure, add it to `green:e2e` instead.
