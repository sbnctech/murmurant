# Claude Code Rules for Murmurant

Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

This repository is maintained primarily by chatbots. This file provides essential context for Claude Code instances working in this codebase.

---

## Quick Reference

### Common Commands

```bash
npm run green          # Full CI check (typecheck + tests) - run before committing
npm run typecheck      # TypeScript compilation check
npm run test:unit      # Vitest unit tests
npm run test:immunity  # Quick smoke tests
npm run dev            # Start development server
npx prisma generate    # Regenerate Prisma client after schema changes
npx prisma db push     # Push schema to dev database (no migration)
```

### Test Commands

```bash
npm run test-admin:stable   # Playwright admin tests (stable suite)
npm run test-api:stable     # Playwright API tests (stable suite)
npx playwright test <file>  # Run specific Playwright test
npm run test:unit -- <pattern>  # Run specific unit tests
```

---

## Authority Model (Non-Negotiable)

Murmurant operates under a single Merge Captain model.

**Claude Code MAY:**

- Prepare documentation
- Draft code in feature branches
- Decompose work into micro-PRs
- Comment on issues and PRs

**Claude Code MAY NOT:**

- Merge PRs
- Rebase branches
- Modify schema, migrations, lockfiles, or CI workflows
- Override PR size limits or hotspot rules

**If a task requires prohibited actions:**

1. Mark the task BLOCKED
2. Log context on the relevant issue
3. Move immediately to another unblocked task

---

## Architectural Charter (Mandatory Reading)

Before making ANY change, read: **docs/ARCHITECTURAL_CHARTER.md**

### Core Principles (P1-P10)

In your plan, cite the specific principles that apply:

- **P1**: Identity and authorization must be provable (audit logs required)
- **P2**: Default deny, least privilege, object scope (no UI-only gating)
- **P3**: State machines over ad-hoc booleans (explicit workflow states)
- **P4**: No hidden rules (behavior explainable in plain English)
- **P5**: Every important action must be undoable or reversible
- **P6**: Human-first UI language and consistent terminology
- **P7**: Observability is a product feature
- **P8**: Schema and APIs are stable contracts
- **P9**: Security must fail closed
- **P10**: Chatbots are contributors, not authorities

### Anti-Patterns to Avoid (N1-N8)

- **N1**: Never base security on page visibility
- **N2**: Never allow coarse roles to replace capabilities
- **N3**: Never lock workflows into vendor-like rigidity
- **N4**: Never create hidden admin settings
- **N5**: Never let automation mutate data without authorization + audit
- **N6**: Never ship without tests for permission boundaries
- **N7**: Never store or expose more PII than necessary
- **N8**: Never allow template fragility

---

## Merge-Captain Workflow

This repo uses a **single merge captain** model. See: docs/CI/CONTRIBUTING.md

### Rules

1. **Single authority**: Only the merge captain merges PRs to main
2. **Nightly cadence**: Merges happen during 11pm checklist
3. **Main must stay green**: Never merge if CI is red
4. **Size limits**: PRs must be ≤300 LOC; larger work uses micro-PR pattern
5. **No mass rebases**: If conflicts, close PR and recreate
6. **Hotspots require HOTSPOT PLAN**: See hotspot list below

### PR Size Limits

| Size | Lines Changed | Policy |
|------|---------------|--------|
| S    | 1-100         | Merge when green |
| M    | 101-300       | Requires merge captain review |
| L    | 301+          | Must be split into micro-PRs |

---

## Hotspot Files (Special Handling Required)

These files require merge captain ownership. See: docs/CI/HOTSPOT_MAP.md

### Primary Hotspots (Merge Captain Only)

- `prisma/schema.prisma` - Schema changes affect all features
- `prisma/migrations/**` - Migration order is critical
- `package.json` / `package-lock.json` - Dependency changes
- `.github/workflows/**` - CI changes

### Other Hotspots

- `src/app/admin/**/layout.tsx` - Admin layouts
- `src/app/admin/**/nav*.tsx` - Navigation
- `src/components/editor/**` - Editor components
- `src/lib/auth*.ts` - Authentication logic
- `src/lib/rbac*.ts` - Authorization logic

If your change touches hotspots:

1. Add HOTSPOT PLAN section to PR body
2. Wait for merge captain
3. Do not self-merge

---

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Database**: PostgreSQL via Prisma 7
- **Testing**: Playwright (E2E/API), Vitest (unit)
- **Auth**: Passkey-based (WebAuthn)

---

## Key Directories

```
src/
├── app/           # Next.js App Router pages and API routes
│   ├── (public)/  # Public pages (no auth required)
│   ├── (member)/  # Member-only pages
│   ├── admin/     # Admin surfaces
│   └── api/       # API routes
├── components/    # React components
├── lib/           # Shared business logic
│   ├── auth/      # Authentication
│   ├── events/    # Event management
│   ├── governance/# Governance workflows
│   ├── membership/# Membership lifecycle
│   ├── publishing/# Content publishing
│   └── ...
tests/
├── admin/         # Playwright admin tests
├── api/           # Playwright API tests
├── e2e/           # End-to-end tests
├── unit/          # Vitest unit tests
└── fixtures/      # Test data
prisma/
├── schema.prisma  # Database schema (HOTSPOT)
└── migrations/    # Migration files (HOTSPOT)
scripts/
└── migration/     # Data migration tools
docs/
├── ARCHITECTURAL_CHARTER.md  # The constitution (read first)
├── CI/            # Merge policy, hotspots, contributing
└── ...
```

---

## State Machines

Murmurant uses explicit state machines for workflows (per P3). Key domains:

- **Membership lifecycle**: application → review → active → alumni
- **Event lifecycle**: draft → published → closed → archived
- **Registration lifecycle**: registered → waitlisted → cancelled → attended
- **Publishing lifecycle**: draft → review → published

Never use ad-hoc boolean flags to represent state.

---

## Authorization Requirements

All privileged actions require (per P1, P2):

1. **Server-side authorization** (UI gating is never sufficient)
2. **Object-scoped permissions** (not page-based)
3. **Audit log entries** for every privileged action
4. **Tests for permission boundaries** (positive and negative)

Example pattern:

```typescript
// Authorization must be explicit and audited
const allowed = await authorize(user, 'event:edit', { eventId });
if (!allowed) {
  await auditLog('event:edit:denied', { userId, eventId });
  return forbidden();
}
await auditLog('event:edit:allowed', { userId, eventId });
```

---

## Testing Requirements

Before merging, ensure:

1. `npm run green` passes (typecheck + tests)
2. Permission boundaries have positive AND negative tests
3. Critical workflows have E2E coverage
4. Audit log assertions for privileged actions

---

## Documentation

- If a change modifies user-visible behavior, update docs in the same PR
- Docs must match code (per R6)
- Use plain English (per P6)

---

## What NOT to Do

1. **Don't bypass authorization** - No "if admin then allow all"
2. **Don't hide buttons as security** - Server-side checks required
3. **Don't accumulate booleans** - Use state machines
4. **Don't create one-off helpers** - Use shared libraries
5. **Don't merge without tests** - Permission boundaries must be tested
6. **Don't self-merge hotspot PRs** - Wait for merge captain
7. **Don't force-resolve conflicts** - Close and recreate via micro-PRs

---

## Current Integration Waves

Check these tracking issues before starting hotspot work:

- #200 - Editor/Publishing Wave
- #201 - Auth/RBAC Wave
- #202 - Migration Wave
- #203 - Eligibility Wave

---

## Summary Checklist

Before submitting a PR:

- [ ] Read docs/ARCHITECTURAL_CHARTER.md
- [ ] Cited relevant principles (P1-P10) in plan
- [ ] Avoided anti-patterns (N1-N8)
- [ ] Authorization is server-side, default-deny, object-scoped
- [ ] Audit log entries for privileged actions
- [ ] State machines used (no ad-hoc booleans)
- [ ] Tests include permission boundary checks
- [ ] `npm run green` passes
- [ ] Hotspots declared (if applicable)
- [ ] Docs updated (if behavior changed)
