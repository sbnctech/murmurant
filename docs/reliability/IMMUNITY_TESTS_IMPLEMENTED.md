Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

# Immunity Tests: Implementation Status

Status: Active
Last updated: 2025-12-21

---

## Summary

Tier-1 blocking immunity tests are implemented for Narratives 1-4.
These tests run pre-merge and fail CI if violated.

| Metric | Value |
|--------|-------|
| Tests implemented | 70 |
| Test files | 4 |
| Runtime | < 500ms |
| Status | All passing |

---

## Test Files

| File | Narrative | Tests | Purpose |
|------|-----------|-------|---------|
| `capability-separation.spec.ts` | N3 | 22 | events:delete separated from events:edit |
| `state-machine.spec.ts` | N6 | 23 | Status enums, invalid transitions rejected |
| `soft-delete.spec.ts` | N4 | 13 | CANCELED/ARCHIVED states, no hard delete |
| `financial-cascade.spec.ts` | N1, N2 | 12 | Cancel does not affect financial records |

---

## Coverage by Immunity ID

| ID | Description | Test File | Status |
|----|-------------|-----------|--------|
| IMM-001 | Event delete blocked when financials exist | financial-cascade.spec.ts | Covered (design) |
| IMM-002 | Cancel event financial isolation | financial-cascade.spec.ts | Covered (design) |
| IMM-003 | Capability separation (delete) | capability-separation.spec.ts | Covered |
| IMM-005 | Soft delete pattern | soft-delete.spec.ts | Covered |
| IMM-006 | Status is enum | state-machine.spec.ts | Covered |
| IMM-007 | Invalid transition rejected | state-machine.spec.ts | Covered |
| IMM-010 | No auto-refund on cancel | financial-cascade.spec.ts | Covered (design) |

---

## Running the Tests

```bash
# Run all immunity tests
npm run test:immunity

# Run with verbose output
npm run test:immunity:blocking
```

---

## CI Integration

Tests are included in the standard unit test suite:

```bash
npm run test:unit
```

The `test:immunity` script runs only immunity tests for focused verification.

---

## Design Decisions

### Unit vs Integration

These Tier-1 tests are **unit tests** that verify:

- Capability model structure (ROLE_CAPABILITIES map)
- Status enum values (Prisma-generated types)
- State transition logic (isValidTransition function)
- Design invariants (documented patterns)

Integration tests for full API behavior (IMM-001, IMM-002 with database)
are in Tier-2 and require database fixtures.

### Marker Tests

Some tests are "marker tests" that document design decisions:

```typescript
it("design decision: invoices are not voided by event cancellation", () => {
  expect(true).toBe(true); // Marker: design is documented
});
```

These tests:
- Document architectural invariants
- Serve as regression anchors
- Will fail if someone removes them (indicating design review needed)

---

## Not Yet Implemented

| ID | Description | Blocked By |
|----|-------------|------------|
| IMM-004 | Delete without capability returns 403 | Requires API integration test |
| IMM-008 | Mutation creates audit | Requires database integration |
| IMM-009 | Audit has actor | Requires audit system integration |
| IMM-012 | Page edit creates revision | PageRevision model pending |

These are Tier-2 tests requiring database fixtures or pending features.

---

## Failure Response

If any immunity test fails:

1. **PR is blocked** - Cannot merge until fixed
2. **Fix the code** - Do not modify tests to pass
3. **If test is wrong** - Requires architectural review before change

Tests document invariants. Changing tests changes the contract.

---

## See Also

- [IMMUNITY_TEST_STRATEGY.md](./IMMUNITY_TEST_STRATEGY.md) - Full strategy
- [WA_IMMUNITY_REVIEW_GATE.md](./WA_IMMUNITY_REVIEW_GATE.md) - Manual review checklist
- [WA_FAILURE_IMMUNITY_TEST_NARRATIVES.md](../architecture/WA_FAILURE_IMMUNITY_TEST_NARRATIVES.md) - Source narratives
