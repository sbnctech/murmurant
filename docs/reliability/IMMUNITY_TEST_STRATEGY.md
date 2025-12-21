# Immunity Test Strategy

Copyright (c) Santa Barbara Newcomers Club

Status: Canonical Specification
Applies to: CI, pre-merge gates, nightly validation
Last updated: 2025-12-21

---

## Purpose

This document converts the 10 failure immunity narratives into executable tests. The goal is regression prevention, not proof of correctness. If ClubOS ever reintroduces a Wild Apricot failure mode, these tests must fail.

**Design Principles:**

- Prefer cheap tests over perfect tests
- Blocking tests must be fast (< 5s each)
- No new infrastructure required (use existing Vitest + Playwright)
- Focus on "this bad thing cannot happen" assertions

---

## Source Documents

| Document | Content |
|----------|---------|
| WA_FAILURE_IMMUNITY_TEST_NARRATIVES.md | 10 conceptual safety proofs |
| WA_IMMUNITY_REVIEW_GATE.md | 7 meta-failure patterns (MF-1 through MF-7) |

---

## Test Classification

| Type | Speed | Purpose | Runs |
|------|-------|---------|------|
| **Unit** | < 100ms | Validate logic in isolation | Every commit |
| **Integration** | < 2s | Validate API behavior with database | Every commit |
| **Property** | < 5s | Validate invariants hold across inputs | Pre-merge |
| **Gate** | < 30s | Full scenario validation | Nightly / pre-release |

---

## Narrative-to-Test Mapping

### Narrative 1: Event Deletion with Financial Records

**Source:** MF-1 (Hidden Cascades) + Delete vs Cancel Confusion

**Testable Assertions:**

| Assertion | Type | Blocking |
|-----------|------|----------|
| Event with payments cannot be deleted | Integration | Yes |
| Delete API returns 400/409 with reason | Integration | Yes |
| Audit log records rejected deletion | Integration | Yes |
| Payment records unchanged after blocked delete | Integration | Yes |

**Proposed Tests:**

```
Test: immunity/event-delete-financial-block
Type: Integration
Trigger: DELETE /api/v1/admin/events/:id when payments exist
Expected: 409 Conflict with body.error containing "financial records"
Where: CI (pre-merge)
Blocking: Yes
```

```
Test: immunity/event-delete-payments-intact
Type: Integration
Trigger: Attempt delete event with $500 in payments
Expected: All Payment records have unchanged status and amount
Where: CI (pre-merge)
Blocking: Yes
```

---

### Narrative 2: Event Cancellation Preserves Financial History

**Source:** MF-2 (Irreversible Actions) + Hidden Financial Side Effects

**Testable Assertions:**

| Assertion | Type | Blocking |
|-----------|------|----------|
| Cancel changes EventStatus only | Integration | Yes |
| Payment records unchanged after cancel | Integration | Yes |
| Invoice records unchanged after cancel | Integration | Yes |
| No Refund records created automatically | Integration | Yes |

**Proposed Tests:**

```
Test: immunity/cancel-event-financial-isolation
Type: Integration
Trigger: POST /api/v1/admin/events/:id/cancel
Expected: Event.status = CANCELLED, all Payment.status unchanged
Where: CI (pre-merge)
Blocking: Yes
```

```
Test: immunity/cancel-event-no-auto-refund
Type: Integration
Trigger: Cancel event with 10 paid registrations
Expected: Refund.count = 0 (no automatic refunds created)
Where: CI (pre-merge)
Blocking: Yes
```

---

### Narrative 3: Granular Capability Prevents Deletion

**Source:** MF-3 (Coarse Permissions)

**Testable Assertions:**

| Assertion | Type | Blocking |
|-----------|------|----------|
| events:edit does not grant events:delete | Unit | Yes |
| events:manage does not grant events:delete | Unit | Yes |
| Delete without capability returns 403 | Integration | Yes |
| Audit records unauthorized attempt | Integration | Yes |

**Proposed Tests:**

```
Test: immunity/capability-separation-delete
Type: Unit
Trigger: Check ROLE_CAPABILITIES for EventChair role
Expected: Does not include "events:delete"
Where: CI (pre-merge)
Blocking: Yes
```

```
Test: immunity/delete-without-capability-403
Type: Integration
Trigger: DELETE event as user with events:edit only
Expected: 403 Forbidden with body.error = "Missing capability: events:delete"
Where: CI (pre-merge)
Blocking: Yes
```

---

### Narrative 4: Soft Delete with Recovery Window

**Source:** MF-2 (Irreversible Actions)

**Testable Assertions:**

| Assertion | Type | Blocking |
|-----------|------|----------|
| Delete sets deletedAt, not physical removal | Unit | Yes |
| Deleted records excluded from normal queries | Integration | Yes |
| Deleted records visible in trash view | Integration | No |
| Hard delete only via platform access | Unit | Yes |

**Proposed Tests:**

```
Test: immunity/soft-delete-pattern
Type: Unit
Trigger: Scan schema for DELETE operations
Expected: All user-data models use deletedAt pattern
Where: CI (pre-merge)
Blocking: Yes
```

```
Test: immunity/deleted-record-excluded
Type: Integration
Trigger: Soft-delete event, then list events
Expected: Deleted event not in list, but exists in database
Where: CI (pre-merge)
Blocking: Yes
```

---

### Narrative 5: Bulk Update Preview and Confirmation

**Source:** MF-1 (Hidden Cascades) + MF-4 (Silent Failures)

**Testable Assertions:**

| Assertion | Type | Blocking |
|-----------|------|----------|
| Bulk import validates before commit | Integration | Yes |
| Validation errors include row numbers | Integration | Yes |
| No records written until confirmation | Integration | Yes |
| Partial success reports per-record status | Integration | No |

**Proposed Tests:**

```
Test: immunity/bulk-import-validation-first
Type: Integration
Trigger: POST import with 3 invalid rows out of 10
Expected: Response includes error details, 0 records written
Where: CI (pre-merge)
Blocking: Yes
```

```
Test: immunity/bulk-import-per-row-errors
Type: Integration
Trigger: Import CSV with validation errors
Expected: Each error includes { row, field, message }
Where: CI (pre-merge)
Blocking: No (observational - implementation pending)
```

---

### Narrative 6: State Machine Rejects Invalid Transition

**Source:** MF-5 (Implicit State Machines)

**Testable Assertions:**

| Assertion | Type | Blocking |
|-----------|------|----------|
| Status fields are enums, not booleans | Unit | Yes |
| Invalid transitions return error | Unit | Yes |
| Transition validation runs before write | Integration | Yes |
| Valid transitions are documented | Property | No |

**Proposed Tests:**

```
Test: immunity/status-is-enum
Type: Unit
Trigger: Check Prisma schema for EventStatus, PageStatus, etc.
Expected: All are enum types, no isActive/isPublished booleans
Where: CI (pre-merge)
Blocking: Yes
```

```
Test: immunity/invalid-transition-rejected
Type: Unit
Trigger: Call transitionEventStatus(DRAFT, COMPLETED)
Expected: Throws InvalidTransitionError
Where: CI (pre-merge)
Blocking: Yes
```

```
Test: immunity/transition-matrix-complete
Type: Property
Trigger: Generate all possible status pairs
Expected: Each has defined outcome (allowed or rejected with reason)
Where: Nightly
Blocking: No (observational)
```

---

### Narrative 7: Actor Attribution on Every Mutation

**Source:** MF-6 (Unattributed Mutations)

**Testable Assertions:**

| Assertion | Type | Blocking |
|-----------|------|----------|
| All mutations create audit entries | Integration | Yes |
| Audit entries have actorId | Unit | Yes |
| Audit entries have before/after | Integration | Yes |
| Background jobs attribute to service account | Integration | No |

**Proposed Tests:**

```
Test: immunity/mutation-creates-audit
Type: Integration
Trigger: Update member profile via API
Expected: AuditLog record created with matching entityId
Where: CI (pre-merge)
Blocking: Yes
```

```
Test: immunity/audit-has-actor
Type: Unit
Trigger: Attempt createAuditEntry without actorId
Expected: Throws or compilation error (required parameter)
Where: CI (pre-merge)
Blocking: Yes
```

```
Test: immunity/audit-has-diff
Type: Integration
Trigger: Update member email, check audit
Expected: Audit.before and Audit.after contain email field
Where: CI (pre-merge)
Blocking: Yes
```

---

### Narrative 8: Page Versioning with Rollback

**Source:** MF-2 (Irreversible Actions)

**Testable Assertions:**

| Assertion | Type | Blocking |
|-----------|------|----------|
| Page edits create revisions | Integration | Yes |
| Revisions are immutable | Unit | Yes |
| Restore creates new revision | Integration | Yes |
| All revisions queryable | Integration | No |

**Proposed Tests:**

```
Test: immunity/page-edit-creates-revision
Type: Integration
Trigger: Update page content twice
Expected: PageRevision.count = 2 for that page
Where: CI (pre-merge)
Blocking: Yes
```

```
Test: immunity/revision-immutable
Type: Unit
Trigger: Check schema for PageRevision UPDATE/DELETE permissions
Expected: Application layer has no update/delete methods
Where: CI (pre-merge)
Blocking: Yes
```

```
Test: immunity/restore-creates-new-revision
Type: Integration
Trigger: Restore page to revision 2 (when current is revision 5)
Expected: New revision 6 created with content from revision 2
Where: CI (pre-merge)
Blocking: Yes (when versioning implemented)
```

---

### Narrative 9: Financial Refund Requires Explicit Action

**Source:** Hidden Financial Side Effects

**Testable Assertions:**

| Assertion | Type | Blocking |
|-----------|------|----------|
| Event cancel does not create refunds | Integration | Yes |
| Refund requires finance:refund capability | Integration | Yes |
| Refund creates new record, not mutation | Integration | Yes |
| Original payment unchanged after refund | Integration | Yes |

**Proposed Tests:**

```
Test: immunity/cancel-no-refund
Type: Integration
Trigger: Cancel event with paid registrations
Expected: Refund table unchanged
Where: CI (pre-merge)
Blocking: Yes
```

```
Test: immunity/refund-requires-capability
Type: Integration
Trigger: POST refund as user without finance:refund
Expected: 403 Forbidden
Where: CI (pre-merge)
Blocking: Yes
```

```
Test: immunity/refund-preserves-payment
Type: Integration
Trigger: Process refund for $50 payment
Expected: Original Payment.status = COMPLETED, new Refund record exists
Where: CI (pre-merge)
Blocking: Yes
```

---

### Narrative 10: Feature Flag Isolation for Staged Rollout

**Source:** MF-7 (Single-Point-of-Failure Releases)

**Testable Assertions:**

| Assertion | Type | Blocking |
|-----------|------|----------|
| Feature flags are tenant-scoped | Unit | Yes |
| Disabled flag hides feature | Integration | Yes |
| Flag changes are audited | Integration | No |
| Kill switch is instant (no redeploy) | Gate | No |

**Proposed Tests:**

```
Test: immunity/feature-flag-tenant-scoped
Type: Unit
Trigger: Check flag evaluation includes tenantId
Expected: All feature checks include tenant context
Where: CI (pre-merge)
Blocking: Yes (when feature flags implemented)
```

```
Test: immunity/disabled-flag-hides-feature
Type: Integration
Trigger: Request feature endpoint with flag disabled for tenant
Expected: 404 or feature not present in response
Where: CI (pre-merge)
Blocking: No (observational until flags exist)
```

---

## Minimal Immunity Test Suite

These are the highest-value tests that prevent the most damaging regressions.

### Tier 1: Blocking Tests (Merge Fails if Red)

| Test ID | Name | Type | Speed | Gate |
|---------|------|------|-------|------|
| IMM-001 | event-delete-financial-block | Integration | < 1s | Pre-merge |
| IMM-002 | cancel-event-financial-isolation | Integration | < 1s | Pre-merge |
| IMM-003 | capability-separation-delete | Unit | < 100ms | Pre-merge |
| IMM-004 | delete-without-capability-403 | Integration | < 1s | Pre-merge |
| IMM-005 | soft-delete-pattern | Unit | < 500ms | Pre-merge |
| IMM-006 | status-is-enum | Unit | < 100ms | Pre-merge |
| IMM-007 | invalid-transition-rejected | Unit | < 100ms | Pre-merge |
| IMM-008 | mutation-creates-audit | Integration | < 1s | Pre-merge |
| IMM-009 | audit-has-actor | Unit | < 100ms | Pre-merge |
| IMM-010 | cancel-no-refund | Integration | < 1s | Pre-merge |
| IMM-011 | refund-requires-capability | Integration | < 1s | Pre-merge |
| IMM-012 | page-edit-creates-revision | Integration | < 1s | Pre-merge |

**Total Tier 1:** 12 tests, < 10s total runtime

### Tier 2: Observational Tests (Warning Only)

| Test ID | Name | Type | Speed | Gate |
|---------|------|------|-------|------|
| IMM-101 | bulk-import-per-row-errors | Integration | < 2s | Nightly |
| IMM-102 | transition-matrix-complete | Property | < 5s | Nightly |
| IMM-103 | background-job-attribution | Integration | < 2s | Nightly |
| IMM-104 | revision-history-queryable | Integration | < 2s | Nightly |
| IMM-105 | feature-flag-audit | Integration | < 2s | Nightly |
| IMM-106 | kill-switch-instant | Gate | < 30s | Pre-release |

**Total Tier 2:** 6 tests, < 45s total runtime

---

## Test Implementation Guidance

### Unit Tests (Vitest)

Location: `tests/unit/immunity/`

```typescript
// Example: IMM-005 soft-delete-pattern
describe('Immunity: Soft Delete Pattern', () => {
  it('Event model uses deletedAt, not physical delete', async () => {
    // Check that eventService.delete sets deletedAt
    const event = await createTestEvent();
    await eventService.delete(event.id, testContext);

    // Record still exists
    const raw = await prisma.event.findUnique({
      where: { id: event.id }
    });
    expect(raw).not.toBeNull();
    expect(raw.deletedAt).not.toBeNull();
  });
});
```

### Integration Tests (Vitest + Prisma)

Location: `tests/integration/immunity/`

```typescript
// Example: IMM-001 event-delete-financial-block
describe('Immunity: Event Delete Financial Block', () => {
  it('rejects deletion when payments exist', async () => {
    const event = await createEventWithPayments(3);

    const response = await api.delete(`/events/${event.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(response.status).toBe(409);
    expect(response.body.error).toContain('financial records');

    // Verify event still exists
    const check = await prisma.event.findUnique({
      where: { id: event.id }
    });
    expect(check.status).toBe('PUBLISHED');
  });
});
```

### Property Tests (fast-check)

Location: `tests/property/immunity/`

```typescript
// Example: IMM-102 transition-matrix-complete
import fc from 'fast-check';

describe('Immunity: Transition Matrix', () => {
  it('all status pairs have defined behavior', () => {
    const statuses = Object.values(EventStatus);

    fc.assert(fc.property(
      fc.constantFrom(...statuses),
      fc.constantFrom(...statuses),
      (from, to) => {
        const result = getTransitionResult(from, to);
        // Either allowed or has rejection reason
        return result.allowed === true ||
               typeof result.reason === 'string';
      }
    ));
  });
});
```

---

## CI Configuration

### Pre-Merge (GitHub Actions)

```yaml
# .github/workflows/immunity-tests.yml
name: Immunity Tests
on: [pull_request]

jobs:
  tier1:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:immunity:blocking
        # Fails PR if any test fails
```

### Nightly (Full Suite)

```yaml
name: Nightly Immunity Suite
on:
  schedule:
    - cron: '0 4 * * *'  # 4 AM UTC

jobs:
  full-suite:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:immunity:all
      - name: Report failures
        if: failure()
        run: |
          # Post to Slack or create issue
```

---

## Package.json Scripts

```json
{
  "scripts": {
    "test:immunity:blocking": "vitest run tests/unit/immunity tests/integration/immunity --reporter=verbose",
    "test:immunity:nightly": "vitest run tests/property/immunity tests/gate/immunity --reporter=verbose",
    "test:immunity:all": "vitest run tests/**/immunity --reporter=verbose"
  }
}
```

---

## Failure Response Protocol

### Tier 1 Test Fails in PR

1. PR is blocked from merge
2. Author must fix before re-requesting review
3. Reviewer checks that fix addresses root cause
4. Do not add exceptions; fix the code

### Tier 2 Test Fails in Nightly

1. Issue created automatically with test output
2. On-call reviews within 24 hours
3. Classify as:
   - **Regression**: Escalate to Tier 1, fix immediately
   - **Test drift**: Update test to match intended behavior
   - **New gap**: Add to backlog with priority

---

## Coverage Gap Tracking

Tests that cannot be implemented yet due to missing functionality:

| Test | Blocked By | Priority |
|------|------------|----------|
| IMM-012 page-edit-creates-revision | PageRevision model pending | P1 |
| IMM-105 feature-flag-audit | Feature flag system pending | P2 |
| IMM-106 kill-switch-instant | Feature flag system pending | P2 |
| bulk-import-per-row-errors | Bulk import UI pending | P2 |

**Rule:** When feature is implemented, corresponding immunity test must be added in same PR.

---

## Relationship to Review Gate

The WA_IMMUNITY_REVIEW_GATE.md defines 7 meta-failure patterns with checklist questions. This test suite automates the verification:

| Meta-Failure | Review Gate Question | Automated Test |
|--------------|---------------------|----------------|
| MF-1 Hidden Cascades | "Does delete leave financial records intact?" | IMM-001, IMM-002 |
| MF-2 Irreversible Actions | "Does deletion use deletedAt?" | IMM-005 |
| MF-3 Coarse Permissions | "Does new functionality use specific capability?" | IMM-003, IMM-004 |
| MF-4 Silent Failures | "Do errors surface to user?" | IMM-101 |
| MF-5 Implicit State Machines | "Is state an enum, not boolean flags?" | IMM-006, IMM-007 |
| MF-6 Unattributed Mutations | "Does mutation create audit entry?" | IMM-008, IMM-009 |
| MF-7 SPOF Releases | "Is there a kill switch?" | IMM-106 |

**Review gate remains manual.** Tests catch regressions; humans catch design problems.

---

## Summary

| Category | Count | Blocking | Observational |
|----------|-------|----------|---------------|
| Tier 1 Tests | 12 | 12 | 0 |
| Tier 2 Tests | 6 | 0 | 6 |
| **Total** | **18** | **12** | **6** |

**Runtime:**
- Pre-merge (Tier 1): < 10 seconds
- Nightly (All): < 1 minute

**Coverage:**
- 10 immunity narratives mapped to 18 tests
- 7 meta-failure patterns covered
- 4 tests blocked pending feature implementation

---

## See Also

- [WA_FAILURE_IMMUNITY_TEST_NARRATIVES.md](../architecture/WA_FAILURE_IMMUNITY_TEST_NARRATIVES.md) - Source narratives
- [WA_IMMUNITY_REVIEW_GATE.md](./WA_IMMUNITY_REVIEW_GATE.md) - Manual review checklist
- [FAILURE_MODES_TO_GUARANTEES_REGISTRY.md](../architecture/FAILURE_MODES_TO_GUARANTEES_REGISTRY.md) - Full WA issue mapping
- [DATA_INVARIANTS.md](./DATA_INVARIANTS.md) - Financial append-only rules

---

*This document is normative for immunity test implementation.
Tier 1 tests are merge-blocking. Tier 2 tests are observational.*
