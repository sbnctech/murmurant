## Release classification (required)

Select exactly one:

- [ ] experimental
- [ ] candidate
- [ ] stable

## Size (required)

Select exactly one:

- [ ] S (1-5 files, 1-100 lines)
- [ ] M (6-15 files, 101-300 lines)
- [ ] L (16+ files, 301+ lines) - requires split plan below

## Risk level (required)

Select exactly one:

- [ ] Low - docs, tests, cosmetic changes, no behavior change
- [ ] Medium - new features, refactors with test coverage
- [ ] High - auth, RBAC, impersonation, lifecycle, DB schema, payments

## Hotspots touched (required)

Check all that apply:

- [ ] prisma/schema.prisma or migrations
- [ ] package.json or package-lock.json
- [ ] .github/workflows/**
- [ ] src/app/admin/**/layout, nav, or search
- [ ] src/components/editor/** or publishing surfaces
- [ ] src/lib/auth*, rbac*, or permissions*
- [ ] None of the above

If ANY hotspot is checked, you MUST complete the Hotspot Plan section below.

## Summary

What changed and why.

## Invariants touched (required for Medium/High risk)

Check all that apply:

- [ ] RBAC (capability checks, role mappings)
- [ ] Impersonation (blocked capabilities, impersonation context)
- [ ] Lifecycle (state transitions, status changes)
- [ ] DB Schema (migrations, model changes)
- [ ] Auth (sessions, tokens, authentication flow)
- [ ] None of the above

## Proof of safety (required for Medium/High risk)

Which verification commands were run before submitting:

- [ ] `npm run green` - full CI gate passed
- [ ] `npm run test:guardrails` - security guardrails passed
- [ ] `npm run test-contracts` - contract tests passed
- [ ] `npm run typecheck` - type check only (for docs/minor changes)

**Test output summary** (paste key results or "all passed"):

```
<!-- e.g., "✅ 47 tests passed, 0 failed" -->
```

## Why this change is safe

<!-- Required for Medium/High risk PRs. Delete for Low risk. -->

**Worst-case failure mode:**

<!-- One sentence. e.g., "Member could view another member's PII" -->

**How this would be detected:**

<!-- e.g., "Contract tests fail", "Audit log shows unauthorized action" -->

**How invariants are enforced:**

- Tests: <!-- e.g., "rbac.contract.spec.ts" -->
- Guardrails: <!-- e.g., "security-guardrails.yml" -->
- Runtime: <!-- e.g., "requireCapabilitySafe()" -->

## Hotspot Plan

<!-- Required if any hotspot is checked above. Delete if not applicable. -->

**Files affected:**

- file1.ts
- file2.ts

**Why these changes are safe:**

<!-- Explain conflict risk and mitigation -->

**Rollback plan:**

<!-- How to undo if something goes wrong -->

## Split Plan (if size L)

<!-- Required if size is L. Delete if not applicable. -->

**Micro-PRs:**

1. PR: [title] - [files: X, lines: Y]
2. PR: [title] - [files: X, lines: Y]

## Checks

- [ ] Risk level matches actual change scope
- [ ] Size declaration matches actual changes
- [ ] Hotspot declaration is accurate
- [ ] Proof of safety completed (if Medium/High risk)
- [ ] Invariants section completed (if Medium/High risk)
