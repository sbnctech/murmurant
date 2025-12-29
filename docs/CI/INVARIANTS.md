# Security Invariants & CI Guardrails

This document describes security invariants enforced by CI guardrails in Murmurant.

## Overview

Murmurant enforces three categories of security invariants:

| Category | Invariant | Check Location | CI Gate |
|----------|-----------|----------------|---------|
| RBAC | Default deny, capability-based access | `tests/contracts/rbac.contract.spec.ts` | `test-contracts` |
| Impersonation | Dangerous capabilities blocked during impersonation | `scripts/ci/check-auth-guardrails.ts` | `test:guardrails` |
| Lifecycle | State machine boundaries (90-day, 730-day) | `tests/contracts/lifecycle.contract.spec.ts` | `test-contracts:unit` |

---

## 1. Impersonation Safety Invariants

### Principles

- **P2**: Least privilege (impersonation downgrades capabilities)
- **P7**: Observability (blocked actions are audited)
- **P9**: Fail closed (block by default)

### Blocked Capabilities

These capabilities are **ALWAYS BLOCKED** during impersonation:

| Capability | Reason |
|------------|--------|
| `finance:manage` | No money movement while impersonating |
| `comms:send` | No email sending while impersonating |
| `users:manage` | No role changes while impersonating |
| `events:delete` | No destructive actions while impersonating |
| `admin:full` | Downgraded to read-only |

### Safe vs Unsafe Auth Helpers

```typescript
// UNSAFE - does NOT check impersonation status
const auth = await requireCapability(req, "users:manage");

// SAFE - blocks if admin is impersonating
const auth = await requireCapabilitySafe(req, "users:manage");
```

### Known Gaps

The following routes currently use `requireCapability()` but SHOULD use `requireCapabilitySafe()`:

**users:manage (High Priority)**

- `v1/admin/users/[id]/passkeys/route.ts` (lines 48, 98)
- `v1/admin/service-history/route.ts` (line 86)
- `v1/admin/service-history/[id]/close/route.ts` (line 21)
- `v1/admin/transitions/route.ts` (line 72)
- `v1/admin/transitions/[id]/*` (multiple routes)

**admin:full (Lower Priority - mostly read operations)**

- `v1/support/cases/*` (support case management)
- `v1/officer/governance/*` (governance endpoints)
- `admin/demo/*` (demo/test endpoints)

These are tracked in `scripts/ci/check-auth-guardrails.ts` as `KNOWN_GAPS`. Adding new unsafe usages will fail CI.

---

## 2. Admin Auth Guards

### Principle

- **P2**: Default deny - all admin routes must have authentication

### Enforcement

The guardrail script checks all routes under:
- `src/app/api/admin/**`
- `src/app/api/v1/admin/**`

Each route must use one of these auth patterns:
- `requireAuth`
- `requireAdmin`
- `requireCapability` / `requireCapabilitySafe`
- `requireRole`
- `requireVPOrAdmin`
- `requireEventChairOrVP`
- `requireEventViewAccess` / `requireEventEditAccess` / `requireEventDeleteAccess`
- `requireRegistrationAccess`
- `getSession` / `validateSession`

Routes without any auth pattern will fail CI.

---

## 3. Blocked Capabilities Sync

### Principle

- **P4**: No hidden rules - the blocked capabilities list must stay consistent

### Enforcement

The guardrail script verifies that `DANGEROUS_CAPABILITIES` in the script matches `BLOCKED_WHILE_IMPERSONATING` in `src/lib/auth.ts`.

If someone adds a new blocked capability to auth.ts, they must also update the guardrail script.

---

## 4. CI Integration

### npm Scripts

| Script | Purpose |
|--------|---------|
| `npm run test:guardrails` | Run security guardrail checks |
| `npm run green` | Full CI check (includes guardrails) |

### GitHub Actions

The `security-guardrails.yml` workflow runs on:
- All PRs touching `src/app/api/**` or `src/lib/auth*.ts`
- All pushes to `main` touching those paths

Estimated runtime: ~5-10 seconds

---

## 5. How to Fix Guardrail Failures

### Impersonation Safety Violation

**Error:** "NEW unsafe auth helper usage detected"

**Fix:** Replace `requireCapability` with `requireCapabilitySafe` for dangerous capabilities:

```typescript
// BEFORE (unsafe)
const auth = await requireCapability(req, "users:manage");

// AFTER (safe)
const auth = await requireCapabilitySafe(req, "users:manage");
```

### Missing Auth Guard

**Error:** "No authentication guard found"

**Fix:** Add one of these auth helpers to your route handler:

```typescript
// For admin-only endpoints
const auth = await requireAdmin(req);

// For capability-based access
const auth = await requireCapability(req, "some:capability");

// For basic authentication
const auth = await requireAuth(req);
```

### Blocked Capabilities Mismatch

**Error:** "Blocked capabilities mismatch"

**Fix:** Update `DANGEROUS_CAPABILITIES` in `scripts/ci/check-auth-guardrails.ts` to match `BLOCKED_WHILE_IMPERSONATING` in `src/lib/auth.ts`.

---

## 6. Charter Compliance

These guardrails support:

- **P1**: Identity and authorization provable (capability tests)
- **P2**: Default deny, least privilege (deny-path tests, impersonation blocking)
- **P7**: Observability (audit expectations documented)
- **P9**: Fail closed (guardrail enforcement)
- **N6**: Never ship without tests for permission boundaries
