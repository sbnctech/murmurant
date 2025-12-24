# Invariant-to-Test Traceability Map

This document maps security and behavioral invariants to their verification tests.

**Related Issues:** #258 (Traceability), #201 (Auth/RBAC Wave)

---

## Quick Reference

| Category | Invariants | Contract Tests | CI Gate |
|----------|------------|----------------|---------|
| RBAC | Default deny, capability-based | `tests/contracts/rbac.contract.spec.ts` | `npm run green` |
| Impersonation | Blocked capabilities | `tests/contracts/impersonation.contract.spec.ts` | `npm run green` |
| Lifecycle | State machine boundaries | `tests/contracts/lifecycle.contract.spec.ts` | `npm run green` |
| Policy | Typed keys, defaults | `tests/contracts/policy.contract.spec.ts` | `npm run green` |
| Tenant Isolation | Member-scoped access | `tests/unit/tenant-isolation.spec.ts` | `npm run green` |

---

## 1. RBAC Invariants

### INV-RBAC-001: Default Deny

**Charter:** P2 (Default deny, least privilege)

| Invariant | Test File | Test | Command |
|-----------|-----------|------|---------|
| Unauthenticated requests return 401 | `tests/contracts/rbac.contract.spec.ts` | "unauthenticated requests return 401" | `npm run test-contracts` |
| Invalid tokens return 401 | `tests/contracts/rbac.contract.spec.ts` | "invalid token returns 401" | `npm run test-contracts` |
| Member cannot access admin endpoints | `tests/contracts/rbac.contract.spec.ts` | "member token cannot access admin endpoints" | `npm run test-contracts` |

### INV-RBAC-002: Capability-Based Access

**Charter:** P1 (Authorization provable), P2 (Object scope)

| Invariant | Test File | Test | Command |
|-----------|-----------|------|---------|
| Admin has admin:full capability | `tests/unit/tenant-isolation.spec.ts` | "admin:full capability is the only bypass" | `npm run test:unit` |
| Capabilities are role-scoped | `tests/contracts/rbac.contract.spec.ts` | "capability system invariants are documented" | `npm run test-contracts` |
| Admin can access admin endpoints | `tests/contracts/rbac.contract.spec.ts` | "admin token can access admin endpoints" | `npm run test-contracts` |

### INV-RBAC-003: Admin Route Auth Guards

**Charter:** P2 (Default deny), P9 (Fail closed)

| Invariant | Test File | CI Script | Command |
|-----------|-----------|-----------|---------|
| All admin routes have auth | `scripts/ci/check-auth-guardrails.ts` | Check 2: Admin Auth Guards | `npm run test:guardrails` |

---

## 2. Impersonation Invariants

### INV-IMP-001: Impersonation Requires Admin

**Charter:** P1 (Identity provable), P2 (Least privilege)

| Invariant | Test File | Test | Command |
|-----------|-----------|------|---------|
| Unauthenticated start returns 401 | `tests/contracts/impersonation.contract.spec.ts` | "unauthenticated request to start returns 401" | `npm run test-contracts` |
| Member cannot start impersonation | `tests/contracts/impersonation.contract.spec.ts` | "member token cannot start impersonation" | `npm run test-contracts` |
| Admin can start impersonation | `tests/contracts/impersonation.contract.spec.ts` | "admin can attempt impersonation start" | `npm run test-contracts` |

### INV-IMP-002: Blocked Capabilities During Impersonation

**Charter:** P2 (Least privilege), P9 (Fail closed)

| Capability | Reason | Test File | Command |
|------------|--------|-----------|---------|
| `finance:manage` | No money movement | `tests/contracts/impersonation.contract.spec.ts` | `npm run test-contracts` |
| `comms:send` | No email sending | `tests/contracts/impersonation.contract.spec.ts` | `npm run test-contracts` |
| `users:manage` | No role changes | `tests/contracts/impersonation.contract.spec.ts` | `npm run test-contracts` |
| `events:delete` | No destructive actions | `tests/contracts/impersonation.contract.spec.ts` | `npm run test-contracts` |
| `admin:full` | Downgraded to read-only | `tests/contracts/impersonation.contract.spec.ts` | `npm run test-contracts` |

**CI Enforcement:** `scripts/ci/check-auth-guardrails.ts` (Check 1: Impersonation Safety)

### INV-IMP-003: Blocked Capabilities Sync

**Charter:** P4 (No hidden rules)

| Invariant | CI Script | Command |
|-----------|-----------|---------|
| Script matches `src/lib/auth.ts` | `scripts/ci/check-auth-guardrails.ts` (Check 3) | `npm run test:guardrails` |

### INV-IMP-004: No Nesting

**Charter:** P9 (Fail closed)

| Invariant | Test File | Test | Command |
|-----------|-----------|------|---------|
| Cannot impersonate while impersonating | `tests/contracts/impersonation.contract.spec.ts` | "nesting prevention is a documented invariant" | `npm run test-contracts` |

### INV-IMP-005: Audit Trail

**Charter:** P1 (Provable), P7 (Observability)

| Action | Audit Event | Test File | Command |
|--------|-------------|-----------|---------|
| Start impersonation | `IMPERSONATION_START` | `tests/contracts/impersonation.contract.spec.ts` | `npm run test-contracts` |
| End impersonation | `IMPERSONATION_END` | `tests/contracts/impersonation.contract.spec.ts` | `npm run test-contracts` |
| Blocked action | `IMPERSONATION_BLOCKED_ACTION` | `tests/contracts/impersonation.contract.spec.ts` | `npm run test-contracts` |

---

## 3. Membership Lifecycle Invariants

### INV-LIFE-001: State Machine Transitions

**Charter:** P3 (State machines over booleans)

| Invariant | Test File | Test | Command |
|-----------|-----------|------|---------|
| Valid transitions are defined | `tests/contracts/lifecycle.contract.spec.ts` | "transition table has all expected entries" | `npm run test:unit` |
| Lapsed has no outgoing transitions | `tests/contracts/lifecycle.contract.spec.ts` | "lapsed has no outgoing transitions" | `npm run test:unit` |
| Cannot skip newbie period | `tests/contracts/lifecycle.contract.spec.ts` | "disallows pending_new -> active_member" | `npm run test:unit` |
| Cannot go backwards | `tests/contracts/lifecycle.contract.spec.ts` | "disallows active_member -> active_newbie" | `npm run test:unit` |

### INV-LIFE-002: Boundary Conditions

**Charter:** P4 (No hidden rules)

| Boundary | Days | Test File | Command |
|----------|------|-----------|---------|
| Newbie period ends | 90 | `tests/contracts/lifecycle.contract.spec.ts` | `npm run test:unit` |
| Extended offer begins | 730 | `tests/contracts/lifecycle.contract.spec.ts` | `npm run test:unit` |

### INV-LIFE-003: State Labels

**Charter:** P6 (Human-first language)

| Invariant | Test File | Test | Command |
|-----------|-----------|------|---------|
| All states have human labels | `tests/contracts/lifecycle.contract.spec.ts` | "state {x} has label {y}" | `npm run test:unit` |
| Narratives are non-empty | `tests/contracts/lifecycle.contract.spec.ts` | "narratives are non-empty for all states" | `npm run test:unit` |

---

## 4. Policy Configuration Invariants

### INV-POL-001: Typed Policy Keys

**Charter:** P4 (No hidden rules), P8 (Stable contracts)

| Invariant | Test File | Test | Command |
|-----------|-----------|------|---------|
| Unknown keys throw | `tests/contracts/policy.contract.spec.ts` | "throws InvalidPolicyKeyError for unknown key" | `npm run test:unit` |
| Valid keys are recognized | `tests/contracts/policy.contract.spec.ts` | "returns true for valid keys" | `npm run test:unit` |

### INV-POL-002: SBNC Defaults

**Charter:** P4 (No hidden rules)

| Policy | Default | Test File | Command |
|--------|---------|-----------|---------|
| `membership.newbieDays` | 90 | `tests/contracts/policy.contract.spec.ts` | `npm run test:unit` |
| `membership.extendedDays` | 730 | `tests/contracts/policy.contract.spec.ts` | `npm run test:unit` |
| `scheduling.timezone` | America/Los_Angeles | `tests/contracts/policy.contract.spec.ts` | `npm run test:unit` |
| `governance.quorumPercentage` | 50 | `tests/contracts/policy.contract.spec.ts` | `npm run test:unit` |

### INV-POL-003: orgId Required

**Charter:** P1 (Identity provable)

| Invariant | Test File | Test | Command |
|-----------|-----------|------|---------|
| getPolicy requires orgId | `tests/contracts/policy.contract.spec.ts` | "throws MissingOrgIdError when orgId is undefined" | `npm run test:unit` |
| Empty orgId throws | `tests/contracts/policy.contract.spec.ts` | "throws MissingOrgIdError when orgId is empty string" | `npm run test:unit` |

---

## 5. Tenant Isolation Invariants

### INV-TENANT-001: Self-Access Allowed

**Charter:** P2 (Object scope)

| Invariant | Test File | Test | Command |
|-----------|-----------|------|---------|
| Member can access own data | `tests/unit/tenant-isolation.spec.ts` | "{role} can access own data" | `npm run test:unit` |

### INV-TENANT-002: Cross-Access Denied

**Charter:** P2 (Default deny), P9 (Fail closed)

| Invariant | Test File | Test | Command |
|-----------|-----------|------|---------|
| Non-admin cannot access other members | `tests/unit/tenant-isolation.spec.ts` | "{role} CANNOT access other member data" | `npm run test:unit` |
| Only admin has admin:full | `tests/unit/tenant-isolation.spec.ts` | "admin:full capability is the only bypass" | `npm run test:unit` |

### INV-TENANT-003: Admin Bypass

**Charter:** P1 (Provable), P2 (Object scope)

| Invariant | Test File | Test | Command |
|-----------|-----------|------|---------|
| Admin can access any member | `tests/unit/tenant-isolation.spec.ts` | "admin can access any member data" | `npm run test:unit` |

---

## CI Commands Summary

| Command | What It Checks | Duration |
|---------|----------------|----------|
| `npm run test:unit` | Unit tests including contracts | ~5s |
| `npm run test-contracts` | Playwright contract tests | ~10s |
| `npm run test:guardrails` | Auth guardrail checks | ~5s |
| `npm run green` | All PR gate checks | ~30-60s |

---

## Adding New Invariants

When adding a new invariant:

1. **Identify the charter principle(s)** it supports (P1-P10, N1-N8)
2. **Write a contract test** in `tests/contracts/` or `tests/unit/`
3. **Add to this map** with:
   - Invariant ID (e.g., `INV-RBAC-004`)
   - Charter reference
   - Test file and test name
   - Run command
4. **If static analysis is needed**, add to `scripts/ci/check-auth-guardrails.ts`
5. **Update `npm run green`** if a new CI step is required

---

## See Also

- `docs/CI/INVARIANTS.md` - Security invariants and guardrails
- `docs/ARCHITECTURAL_CHARTER.md` - Non-negotiable principles
- `scripts/ci/check-auth-guardrails.ts` - CI guardrail implementation
