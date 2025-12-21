# Finance Safety MVP

Minimum Viable Guarantees for Financial Data Integrity

---

## Purpose

This document defines the **minimum architectural mechanisms** required to
make ClubOS's financial data handling safe. It addresses the largest
remaining risk gap: all 7 finance-related failure modes from the WA analysis
are currently PLANNED with 0% implemented.

**Goal:** Make dangerous failure modes structurally impossible, not just
unlikely.

**Constraints:**

- No payment processor integration work
- No accounting policy decisions
- Architecture first, features second

---

## 1. Top 5 Finance Failure Modes (PLANNED/Unimplemented)

### Analysis Source

From [FAILURE_MODES_TO_GUARANTEES_REGISTRY.md](./FAILURE_MODES_TO_GUARANTEES_REGISTRY.md):

| Priority | WA ID | Failure Mode | Current Status | Safety Impact |
|----------|-------|--------------|----------------|---------------|
| 1 | WA-030 | Invoice voiding cascades | PLANNED | **CRITICAL** - Data corruption |
| 2 | WA-031 | No payment audit trail | PLANNED | **CRITICAL** - Accountability gap |
| 3 | WA-035 | Payment errors silent | PLANNED | **HIGH** - Silent data loss |
| 4 | WA-029 | Refund workflow confusing | PLANNED | **MEDIUM** - State confusion |
| 5 | WA-021 | Event delete cascades to invoices | DONE | Addressed |

**Key Finding:** WA-021 is already DONE (event cancellation is non-destructive).
The remaining finance gaps are about financial record integrity, not event
integration.

---

## 2. Failure Mode Detail

### FM-1: Invoice Voiding Cascades (WA-030) - CRITICAL

**What WA Allows:**

Voiding an invoice in Wild Apricot automatically changes registration state.
Financial records and registration records are tightly coupled. When someone
"fixes" a billing error, they accidentally cancel a registration.

**Why This Is Dangerous:**

- Domain leakage: billing actions affect membership/event domains
- Hidden side effects: user voids invoice, member loses registration
- No atomic undo: must manually fix both billing AND registration
- Audit trail breaks: hard to determine root cause

**What ClubOS Must Make Impossible:**

1. Financial operations MUST NOT mutate non-financial entities
2. Invoice status changes MUST NOT cascade to registration status
3. Each domain (billing, membership, events) MUST have independent lifecycles
4. Cross-domain effects MUST require explicit, separate actions

**Minimum Architectural Mechanism:**

```
RULE: Financial records live in isolated domain

Invoice {
  status: DRAFT | ISSUED | PAID | VOIDED | REFUNDED
}

Registration {
  status: PENDING | CONFIRMED | CANCELLED | NO_SHOW
  invoiceId: FK (reference only, not lifecycle coupling)
}

INVARIANT:
  Invoice.status transition NEVER triggers Registration.status transition
  (and vice versa)

ENFORCEMENT:
  No Invoice service has write access to Registration table
  No Registration service has write access to Invoice table
```

---

### FM-2: No Payment Audit Trail (WA-031) - CRITICAL

**What WA Allows:**

Payment, credit, and refund transactions lack comprehensive audit trails.
Cannot link event registration to specific invoice easily. When discrepancies
occur, investigation is manual guesswork.

**Why This Is Dangerous:**

- Fiduciary risk: cannot prove what was paid and when
- Reconciliation impossible: no paper trail for auditors
- Dispute resolution blocked: cannot prove member's claim
- Fraud detection disabled: no visibility into anomalies

**What ClubOS Must Make Impossible:**

1. Any financial mutation occurring without audit entry
2. Audit entries missing actor, timestamp, or before/after state
3. Financial records being modified without trace
4. Linkage between payment and purpose being unclear

**Minimum Architectural Mechanism:**

```
RULE: Every financial mutation is audited

FinancialAuditEntry {
  id: UUID
  timestamp: datetime
  actorId: UUID                    // WHO (required, never null)
  actorType: "user" | "system"     // Human or automated
  action: string                   // WHAT happened
  entityType: "invoice" | "payment" | "credit" | "refund"
  entityId: UUID                   // WHICH entity
  before: JSON                     // State before
  after: JSON                      // State after
  relatedEntities: {               // Linkage
    memberId: UUID,
    eventId?: UUID,
    registrationId?: UUID
  }
}

INVARIANT:
  INSERT/UPDATE/DELETE on Invoice, Payment, Credit, Refund
  MUST produce FinancialAuditEntry in same transaction

ENFORCEMENT:
  Database trigger OR service layer wrapper
  Cannot be bypassed by any code path
```

---

### FM-3: Payment Errors Silent (WA-035) - HIGH

**What WA Allows:**

Payment gateway errors occur without intuitive alerts. Organizations have
missed donations because failures weren't surfaced. Admin dashboard doesn't
show failed payments prominently.

**Why This Is Dangerous:**

- Revenue loss: failed payments not retried or followed up
- Member confusion: member thinks they paid, org has no record
- Trust erosion: "I paid, why am I marked delinquent?"
- Audit gaps: no record of what was attempted

**What ClubOS Must Make Impossible:**

1. Payment attempt failing silently
2. Admin not knowing about failed payments
3. Member not receiving notification of failure
4. Failed attempts not being logged

**Minimum Architectural Mechanism:**

```
RULE: Payment failures are never silent

PaymentAttempt {
  id: UUID
  status: PENDING | SUCCEEDED | FAILED | REQUIRES_ACTION
  gatewayStatus: string            // Raw gateway response
  failureReason: string | null     // Human-readable reason
  failureCode: string | null       // Machine-readable code
  createdAt: datetime
  completedAt: datetime | null
}

ON PaymentAttempt.status = FAILED:
  1. Create FinancialAuditEntry (failure recorded)
  2. Create AdminNotification (alert dashboard)
  3. Create MemberNotification (if member-initiated)
  4. Set retry eligibility flag

INVARIANT:
  PaymentAttempt with status != SUCCEEDED
  MUST have failureReason populated

ENFORCEMENT:
  Gateway integration wrapper enforces logging
  Cannot return to caller without recording outcome
```

---

### FM-4: Refund Workflow Confusing (WA-029) - MEDIUM

**What WA Allows:**

Recording a refund in WA doesn't actually return money to the payer. User
must separately process refund through payment gateway. Status in WA doesn't
reflect actual gateway state.

**Why This Is Dangerous:**

- State mismatch: ClubOS says "refunded" but money never moved
- Double refund risk: admin processes gateway refund, then records in WA
- Member dispute: "You said you refunded me but I never got it"
- Audit discrepancy: books don't match bank

**What ClubOS Must Make Impossible:**

1. Refund "recorded" status that doesn't reflect reality
2. Ambiguity between "requested" and "processed"
3. Admin confusion about whether money actually moved

**Minimum Architectural Mechanism:**

```
RULE: Refund status explicitly separates intent from execution

Refund {
  id: UUID
  paymentId: UUID
  amount: decimal

  // Explicit status progression
  status: REQUESTED | PENDING_GATEWAY | PROCESSED | FAILED | CANCELLED

  // Gateway reality
  gatewayRefundId: string | null
  gatewayStatus: string | null
  gatewayProcessedAt: datetime | null

  // Audit
  requestedBy: UUID
  requestedAt: datetime
  processedAt: datetime | null
  reason: string
}

STATE MACHINE:
  REQUESTED -> PENDING_GATEWAY -> PROCESSED | FAILED
  REQUESTED -> CANCELLED

INVARIANT:
  status = PROCESSED implies gatewayRefundId IS NOT NULL
  status = FAILED implies failureReason IS NOT NULL

ENFORCEMENT:
  Status transitions validated at service layer
  Cannot set PROCESSED without gateway confirmation
```

---

### FM-5: Financial/Registration Coupling (WA-021 variant) - ADDRESSED

**Status:** Already addressed. Event cancellation is non-destructive per
existing guarantee. Including here for completeness.

**Existing Guarantee:**

Events use soft-delete. Cancellation transitions state without voiding
invoices. Financial records remain intact.

---

## 3. Finance Safety MVP Scope

### In Scope: 3 Core Guarantees

| # | Guarantee | What It Prevents | Priority |
|---|-----------|------------------|----------|
| G1 | **Financial Domain Isolation** | FM-1: Cascade corruption | CRITICAL |
| G2 | **Mandatory Financial Audit** | FM-2: Untraced mutations | CRITICAL |
| G3 | **Payment Failure Surfacing** | FM-3: Silent failures | HIGH |

### Explicit Non-Goals (This MVP)

| Non-Goal | Rationale |
|----------|-----------|
| Refund workflow UX | FM-4 is state confusion, not safety. Can be layered after G1-G3. |
| Financial reporting | WA-034 is feature gap, not safety risk |
| Manual donation recording | WA-033 is feature gap, not safety risk |
| Auto-renewal reminder logic | WA-032 is UX, not safety |
| Payment processor integration | Constrained out of scope |
| Accounting policy decisions | Constrained out of scope |

### Why These 3

**G1 (Domain Isolation):** Without this, any financial operation can corrupt
registration data. This is a precondition for all other guarantees.

**G2 (Mandatory Audit):** Without this, we cannot detect, investigate, or
prove anything about financial operations. This is fiduciary responsibility.

**G3 (Failure Surfacing):** Without this, revenue is lost silently and
member trust erodes. This is operational visibility.

Together, these three make the *dangerous* failure modes impossible while
deferring *inconvenient* ones to future work.

---

## 4. Done Means Impossible

### G1: Financial Domain Isolation

**Done when:**

- [ ] Invoice status changes cannot trigger Registration status changes
- [ ] Registration status changes cannot trigger Invoice status changes
- [ ] No service in `src/lib/finance/` writes to `Registration` table
- [ ] No service in `src/lib/events/` writes to `Invoice` table
- [ ] Test: Change invoice status → registration status unchanged
- [ ] Test: Cancel registration → invoice status unchanged

**Impossible after:**

Billing error correction cannot accidentally cancel someone's event
registration. The cascade failure mode is structurally eliminated.

---

### G2: Mandatory Financial Audit

**Done when:**

- [ ] Every INSERT/UPDATE/DELETE on financial tables produces audit entry
- [ ] Audit entry includes actor, timestamp, before/after, related entities
- [ ] Audit entries are append-only (no UPDATE/DELETE on audit table)
- [ ] Code review gate: no financial mutation without `createFinancialAuditEntry()`
- [ ] Test: Direct database mutation blocked or audited
- [ ] Test: Audit entry queryable by member, event, date range

**Impossible after:**

Financial changes cannot occur without a record of who, what, when, and why.
The accountability gap is structurally eliminated.

---

### G3: Payment Failure Surfacing

**Done when:**

- [ ] PaymentAttempt table records all attempts (success and failure)
- [ ] Failed attempts have failureReason populated
- [ ] Admin dashboard shows failed payments within 24 hours
- [ ] Failed payment creates notification (admin at minimum)
- [ ] Test: Gateway returns error → audit entry + notification created
- [ ] Test: Admin can query "all failed payments this month"

**Impossible after:**

Payment failures cannot go unnoticed. Silent revenue loss is structurally
eliminated.

---

## 5. Implementation Sequence

### Phase 1: Schema and Isolation (Week 1-2)

1. Define FinancialAuditEntry table
2. Define PaymentAttempt table with status enum
3. Verify Invoice and Registration tables have no direct coupling
4. Create service boundary: `src/lib/finance/` cannot import from `src/lib/events/`

### Phase 2: Audit Enforcement (Week 2-3)

1. Implement `createFinancialAuditEntry()` wrapper
2. Wrap all Invoice/Payment mutation paths
3. Add code review gate for financial mutations
4. Write tests for audit completeness

### Phase 3: Failure Surfacing (Week 3-4)

1. Implement payment attempt logging
2. Create admin notification for payment failures
3. Add dashboard query for failed payments
4. Write tests for failure visibility

### Phase 4: Verification (Week 4)

1. Run isolation tests (cross-domain mutation blocked)
2. Run audit tests (no path bypasses logging)
3. Run failure tests (all failure modes surface)
4. Document in DEPLOYMENT_READINESS_CHECKLIST.md

---

## 6. Architectural Decisions

### AD-1: Audit at Service Layer, Not Database Trigger

**Decision:** Implement audit via service wrapper, not database trigger.

**Rationale:**

- Service layer has actor context (who is making the change)
- Service layer has request context (why is this happening)
- Database triggers cannot access application session
- Easier to test and maintain in TypeScript

**Tradeoff:** Direct database access bypasses audit. Mitigated by:

- No direct database access in production code
- Code review gate for any raw SQL
- Periodic reconciliation check (optional)

### AD-2: Separate Financial Audit Table

**Decision:** Financial audit entries go in dedicated table, not general
AuditLog.

**Rationale:**

- Financial audit has different retention requirements
- Financial audit needs specific queryability (by amount, by account)
- Separation allows different access controls
- Compliance may require financial-specific export

### AD-3: Status Enum Over Boolean Flags

**Decision:** All financial entity status uses explicit enum.

**Rationale:**

- Prevents implicit state machines (WA pattern MF-5)
- Enables validated state transitions
- Self-documenting allowed states
- Aligns with Charter P3

---

## 7. Verification Checklist

Before declaring Finance Safety MVP complete:

| Check | Verification Method |
|-------|---------------------|
| G1: Isolation | Unit test: Invoice mutation does not affect Registration |
| G1: Isolation | Unit test: Registration mutation does not affect Invoice |
| G1: Isolation | Code review: No cross-domain imports in finance services |
| G2: Audit | Unit test: Every mutation path creates audit entry |
| G2: Audit | Integration test: Audit entries are queryable |
| G2: Audit | Code review: No financial mutation without wrapper |
| G3: Surfacing | Unit test: Payment failure creates audit + notification |
| G3: Surfacing | Integration test: Admin can see failed payments |
| G3: Surfacing | Manual test: Simulate gateway error, verify visibility |

---

## 8. What This Enables

After Finance Safety MVP is complete:

| Enabled Capability | Depends On |
|--------------------|------------|
| Refund workflow (WA-029) | G1, G2 (state clarity, audit trail) |
| Financial reporting (WA-034) | G2 (queryable audit data) |
| Manual payment recording (WA-033) | G1, G2 (isolated domain, audited) |
| Reconciliation tools | G2 (complete audit trail) |
| Compliance exports | G2 (structured financial audit) |

The MVP provides the foundation. Features layer on top.

---

## See Also

- [FAILURE_MODES_TO_GUARANTEES_REGISTRY.md](./FAILURE_MODES_TO_GUARANTEES_REGISTRY.md) - Source analysis
- [WA_FUTURE_FAILURE_IMMUNITY.md](./WA_FUTURE_FAILURE_IMMUNITY.md) - Meta-patterns
- [ARCHITECTURAL_CHARTER.md](../ARCHITECTURAL_CHARTER.md) - Principles P1, P3, P7
- [WA_FAILURE_MODES_TO_CLUBOS_GUARANTEES.md](../competitive/WA_FAILURE_MODES_TO_CLUBOS_GUARANTEES.md) - Prospect positioning

---

*This document is normative for Finance Safety MVP scope.
Scope changes require architectural review.*
