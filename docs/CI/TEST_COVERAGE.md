# Test Coverage: Contract Tests

This document describes the contract test suite that verifies core security and business invariants.

## Overview

Contract tests verify the system's core invariants using two approaches:

- **Unit tests (Vitest)**: Fast, pure function tests with no network or database
- **API tests (Playwright)**: Verify authorization at the HTTP boundary

Both types are deterministic and serve as living documentation of security contracts.

## Running Contract Tests

```bash
# Run all contract tests (unit + API)
npm run test-contracts

# Run only unit tests (lifecycle)
npm run test-contracts:unit

# Run only API tests (RBAC, impersonation)
npm run test-contracts:api
```

## Contract Test Files

### A) RBAC Contract (`tests/contracts/rbac.contract.spec.ts`)

**Type:** Playwright API tests

Tests the capability-based permission system at the HTTP boundary.

| Category | Tests | What It Verifies |
|----------|-------|------------------|
| Default Deny | 6 | Unauthenticated requests return 401 |
| Role Deny | 4 | Non-admin tokens cannot access admin endpoints |
| Scoped Allow | 4 | Admin tokens can access admin endpoints |
| Capability Documentation | 2 | Critical invariants are documented |
| Visibility Scoping | 2 | Proper data structure returned |
| Error Response Format | 2 | 401/403 responses have expected structure |

**Key Invariants:**

- Only `admin` has `admin:full` capability
- `member` role cannot access admin endpoints
- Invalid tokens receive 401, not 403
- Error responses include `error` field in JSON

### B) Impersonation Safety Contract (`tests/contracts/impersonation.contract.spec.ts`)

**Type:** Playwright API tests

Tests the impersonation safety system at the HTTP boundary.

| Category | Tests | What It Verifies |
|----------|-------|------------------|
| Start Authorization | 5 | Only admin can start impersonation |
| End Authorization | 2 | Proper handling of end requests |
| Status Endpoint | 2 | Status endpoint authorization |
| Blocked Capabilities | 4 | Exactly 5 capabilities are blocked |
| Audit Trail | 2 | Audit action names standardized |
| Protected Endpoints | 2 | Endpoints use safe capability checks |
| Nesting Prevention | 1 | Cannot nest impersonation |

**Key Invariants:**

- Blocked capabilities: `finance:manage`, `comms:send`, `users:manage`, `events:delete`, `admin:full`
- All `:view` and `:read` capabilities remain allowed
- `admin:full` is blocked (prevents nesting)
- Impersonation requires admin:full capability

### C) Lifecycle Contract (`tests/contracts/lifecycle.contract.spec.ts`)

**Type:** Vitest unit tests

Tests the membership lifecycle state machine using pure functions.

| Category | Tests | What It Verifies |
|----------|-------|------------------|
| Transition Table | 6 | Valid state transitions are documented |
| Disallowed Transitions | 7 | Invalid transitions are blocked |
| State Labels | 10 | All states have human-readable labels |
| Boundary Conditions | 6 | Day 89/90 and Day 729/730 thresholds |
| Status Code Precedence | 4 | Non-active statuses take priority |
| Narrative Generation | 2 | Narratives are non-empty and human-friendly |
| Milestone Calculation | 4 | Newbie end date and two-year mark correct |

**Key Invariants:**

- Day 89 = active_newbie, Day 90 = active_member
- Day 729 = active_member, Day 730 = offer_extended
- Cannot skip newbie period
- Cannot go backwards in lifecycle
- Lapsed is a terminal state

**Determinism:** Uses `daysAgo()` helper for relative date calculations.

## Known Gaps

The following areas are NOT covered by contract tests (yet):

1. **Row-level security (RLS)**: Requires database integration tests
2. **Cross-tenant isolation**: Requires multi-tenant test fixtures
3. **Audit log storage**: Contract tests verify format, not storage
4. **Capability enforcement during impersonation**: Requires active session testing

## Flakiness Mitigations

- **No time dependence**: Lifecycle tests use relative `daysAgo()` calculations
- **No database state**: API tests use hardcoded test tokens
- **No seed data counts**: Tests verify structure, not row counts
- **Deterministic tokens**: Test tokens are recognized by dev auth middleware

## Adding New Contract Tests

1. Create a new file in `tests/contracts/`
2. Choose test type:
   - Vitest for pure function tests (`*.contract.spec.ts`)
   - Playwright for API boundary tests (`*.contract.spec.ts`)
3. Test invariants that should NEVER change
4. Document the contract in this file

## Related Documentation

- [ARCHITECTURAL_CHARTER.md](../ARCHITECTURAL_CHARTER.md) - Security principles (P1-P10)
- [CONTRIBUTING.md](./CONTRIBUTING.md) - CI workflow and merge policy
- [INVARIANTS.md](./INVARIANTS.md) - Security invariants overview
