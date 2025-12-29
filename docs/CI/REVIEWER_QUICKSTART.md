# Reviewer Quickstart

A 2-minute guide to reviewing Murmurant PRs safely.

---

## One Command to Verify

```bash
npm run green
```

This runs all safety checks:

- TypeScript compilation
- ESLint
- Security guardrails
- Unit tests (including contract tests)
- Database seeding
- E2E tests (admin + API)

**If it passes, the PR is mechanically verified.**

---

## What to Check in the PR

### 1. Risk Level (top of PR body)

| Risk | What It Means | Your Job |
|------|--------------|----------|
| **Low** | Docs, tests, cosmetic | Quick review |
| **Medium** | New features, refactors | Check invariants + proof |
| **High** | Auth, RBAC, payments, schema | Deep review required |

### 2. Invariants Section (for Medium/High)

At least one checkbox should be checked:

- RBAC
- Impersonation
- Lifecycle
- DB Schema
- Auth
- None of the above

### 3. Proof of Safety (for Medium/High)

At least one verification command should be checked:

- `npm run green` - full CI
- `npm run test:guardrails` - security checks
- `npm run test-contracts` - contract tests
- `npm run typecheck` - type check only

---

## Quick Reference Links

| Document | When to Read |
|----------|-------------|
| [SAFETY_NET.md](./SAFETY_NET.md) | Understand the layered defense model |
| [PR_REVIEW_CHECKLIST.md](./PR_REVIEW_CHECKLIST.md) | Detailed mechanical review rubric |
| [INVARIANTS.md](./INVARIANTS.md) | Security invariant definitions |
| [../SECURITY/THREAT_MODEL.md](../SECURITY/THREAT_MODEL.md) | What we protect and from whom |
| [../ARCHITECTURAL_CHARTER.md](../ARCHITECTURAL_CHARTER.md) | Core principles (P1-P10) |

---

## Verification Commands

```bash
# Full verification (run this before approving)
npm run green

# Quick checks for specific concerns
npm run typecheck           # Type safety only
npm run test:guardrails     # Security pattern checks
npm run test-contracts      # Contract tests only
npm run test:unit           # All unit tests

# Get a summary of what to check
npm run reviewer:quickcheck
```

---

## Red Flags

Do not approve if:

- [ ] Risk level not selected
- [ ] Medium/High risk with no invariants checked
- [ ] Medium/High risk with no proof checked
- [ ] Hotspots touched but no Hotspot Plan
- [ ] Size L with no Split Plan
- [ ] `npm run green` fails locally

---

## Green Flags

Safe to approve when:

- [x] Risk level matches actual changes
- [x] Appropriate sections completed for risk level
- [x] `npm run green` passes (or CI shows green)
- [x] Hotspot plan included if needed
- [x] Summary explains what changed and why

---

## Need More Detail?

- **Full review checklist**: [PR_REVIEW_CHECKLIST.md](./PR_REVIEW_CHECKLIST.md)
- **Safety architecture**: [SAFETY_NET.md](./SAFETY_NET.md)
- **Threat model**: [../SECURITY/THREAT_MODEL.md](../SECURITY/THREAT_MODEL.md)
