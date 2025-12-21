# Finance Safety MVP - Final Specification

**Status:** Normative
**Scope:** Minimum viable financial data integrity guarantees
**Last Updated:** 2025-12-21

---

## Purpose

This document specifies the **final three guarantees** for Finance Safety MVP.
Each guarantee is defined with:

- Exact schema invariants (what the database must enforce)
- Blocked operations (what the system must refuse to do)
- WA behavior comparison (what Wild Apricot allows that ClubOS forbids)
- Auditable verification criteria

**Design Principle:** Structural prevention only. No warnings, no confirmations,
no "are you sure?" dialogs. If an operation is dangerous, it is impossible.

---

## Constraints

| Constraint | Implication |
|------------|-------------|
| No payment processor assumptions | Guarantees work regardless of gateway (Stripe, Square, manual) |
| No refund automation | Refund UX is out of scope; only state separation is in scope |
| Structural prevention only | No runtime warnings; impossible at schema/service layer |

---

## The Three Guarantees

| # | Guarantee | Prevents | WA Issue |
|---|-----------|----------|----------|
| G1 | Financial Domain Isolation | Cascade corruption across domains | WA-030 |
| G2 | Mandatory Financial Audit | Untraced financial mutations | WA-031 |
| G3 | Payment Failure Surfacing | Silent payment failures | WA-035 |

---

## G1: Financial Domain Isolation

### What This Guarantees

Financial operations CANNOT mutate non-financial entities. Invoice status
changes CANNOT cascade to registration status. Each domain (billing,
membership, events) has an independent lifecycle.

### Schema Invariants

```prisma
// Invoice has NO cascade relationship to Registration
model Invoice {
  id              String        @id @default(uuid()) @db.Uuid
  status          InvoiceStatus
  registrationId  String?       @db.Uuid  // Reference only, NOT lifecycle coupling

  // No onDelete: Cascade to Registration
  registration    Registration? @relation(fields: [registrationId], references: [id], onDelete: SetNull)
}

// Registration has NO cascade relationship to Invoice
model Registration {
  id        String             @id @default(uuid()) @db.Uuid
  status    RegistrationStatus

  // Invoice reference is read-only from Registration perspective
  invoices  Invoice[]          // One-to-many, no lifecycle coupling
}

// INVARIANT: No foreign key with onDelete: Cascade between financial and
// non-financial entities
```

**Enum Definitions:**

```prisma
enum InvoiceStatus {
  DRAFT
  ISSUED
  PAID
  VOIDED
  REFUNDED
}

enum RegistrationStatus {
  DRAFT
  PENDING_PAYMENT
  PENDING
  CONFIRMED
  WAITLISTED
  CANCELLED
  REFUND_PENDING
  REFUNDED
  NO_SHOW
}
```

### Blocked Operations

| Operation | Why Blocked | Error Response |
|-----------|-------------|----------------|
| Invoice service writing to Registration table | Cross-domain mutation | `DOMAIN_ISOLATION_VIOLATION` |
| Registration service writing to Invoice table | Cross-domain mutation | `DOMAIN_ISOLATION_VIOLATION` |
| Invoice.status change triggering Registration.status change | Cascade coupling | N/A - not implemented |
| Registration.status change triggering Invoice.status change | Cascade coupling | N/A - not implemented |
| DELETE Invoice with active Registration (hard delete) | Cascade data loss | `HARD_DELETE_FORBIDDEN` |

### Service Layer Enforcement

```typescript
// src/lib/finance/invoice-service.ts
// This file MUST NOT import from src/lib/events/ or src/lib/registration/

// FORBIDDEN:
import { updateRegistrationStatus } from "@/lib/events/registration"; // BLOCKED

// ALLOWED:
import { createFinancialAuditEntry } from "@/lib/finance/audit";
```

**Code Review Gate:** Any PR that adds an import from `src/lib/finance/` to
`src/lib/events/` (or vice versa) for write operations MUST be blocked.

### What WA Allows That ClubOS Forbids

| WA Behavior | ClubOS Response |
|-------------|-----------------|
| Voiding an invoice automatically changes registration state | Invoice status is independent; registration unchanged |
| Deleting an event voids all invoices and creates credits | Event cancellation is soft-delete; invoices remain intact |
| Payment failure can leave registration in limbo | Registration status is explicit; never derived from payment state |
| Admin "fixing" billing error accidentally cancels registration | Billing fix affects billing only; registration requires separate action |

---

## G2: Mandatory Financial Audit

### What This Guarantees

Every financial mutation produces an audit entry. Audit entries include actor,
timestamp, before/after state, and related entities. Audit entries are
append-only (no UPDATE/DELETE).

### Schema Invariants

```prisma
model FinancialAuditEntry {
  id            String   @id @default(uuid()) @db.Uuid
  createdAt     DateTime @default(now())

  // WHO (required, never null)
  actorId       String   @db.Uuid
  actorType     ActorType

  // WHAT happened
  action        FinancialAuditAction

  // WHICH entity
  entityType    FinancialEntityType
  entityId      String   @db.Uuid

  // State capture (required for mutations)
  beforeState   Json?    // null for CREATE
  afterState    Json?    // null for DELETE

  // Linkage to related entities
  memberId      String?  @db.Uuid
  eventId       String?  @db.Uuid
  registrationId String? @db.Uuid

  // Context
  ipAddress     String?
  userAgent     String?
  requestId     String?  // For tracing

  // INVARIANT: No UPDATE or DELETE allowed on this table
  // Enforced by: No update/delete methods in service layer
  // Enforced by: Database REVOKE UPDATE, DELETE (optional hardening)
}

enum ActorType {
  USER
  SYSTEM
  BACKGROUND_JOB
}

enum FinancialAuditAction {
  INVOICE_CREATED
  INVOICE_ISSUED
  INVOICE_PAID
  INVOICE_VOIDED
  INVOICE_REFUNDED
  PAYMENT_ATTEMPTED
  PAYMENT_SUCCEEDED
  PAYMENT_FAILED
  PAYMENT_REFUND_REQUESTED
  PAYMENT_REFUND_PROCESSED
  PAYMENT_REFUND_FAILED
  CREDIT_APPLIED
  CREDIT_REVERSED
}

enum FinancialEntityType {
  INVOICE
  PAYMENT
  PAYMENT_ATTEMPT
  REFUND
  CREDIT
}
```

### Blocked Operations

| Operation | Why Blocked | Error Response |
|-----------|-------------|----------------|
| UPDATE on FinancialAuditEntry | Audit is append-only | `AUDIT_IMMUTABLE` |
| DELETE on FinancialAuditEntry | Audit is append-only | `AUDIT_IMMUTABLE` |
| Invoice mutation without audit entry | Untraced mutation | Transaction rollback |
| Payment mutation without audit entry | Untraced mutation | Transaction rollback |
| Audit entry with null actorId | Unattributed action | Schema validation error |

### Service Layer Enforcement

```typescript
// src/lib/finance/invoice-service.ts

// REQUIRED PATTERN: Every mutation wrapped with audit
export async function updateInvoiceStatus(
  invoiceId: string,
  newStatus: InvoiceStatus,
  actorId: string,
  reason: string
): Promise<Invoice> {
  return await prisma.$transaction(async (tx) => {
    // 1. Get before state
    const before = await tx.invoice.findUniqueOrThrow({ where: { id: invoiceId } });

    // 2. Perform mutation
    const after = await tx.invoice.update({
      where: { id: invoiceId },
      data: { status: newStatus },
    });

    // 3. Create audit entry (REQUIRED - transaction fails without this)
    await tx.financialAuditEntry.create({
      data: {
        actorId,
        actorType: "USER",
        action: `INVOICE_${newStatus}`,
        entityType: "INVOICE",
        entityId: invoiceId,
        beforeState: before,
        afterState: after,
        memberId: before.memberId,
      },
    });

    return after;
  });
}

// FORBIDDEN: Direct prisma.invoice.update() without audit wrapper
```

**Code Review Gate:** Any PR with `prisma.invoice.update()`,
`prisma.payment.update()`, or similar financial mutations outside of audit
wrappers MUST be blocked.

### What WA Allows That ClubOS Forbids

| WA Behavior | ClubOS Response |
|-------------|-----------------|
| Payment transactions lack comprehensive audit trails | Every payment mutation produces audit entry |
| Cannot link event registration to specific invoice easily | Audit entry includes memberId, eventId, registrationId |
| Investigation of discrepancies is manual guesswork | Audit queryable by member, event, date range, action |
| Audit shows "edited" but not what changed | Audit includes beforeState and afterState JSON |
| Cannot determine who made a change | actorId is required, never null |
| System actions indistinguishable from user actions | actorType distinguishes USER, SYSTEM, BACKGROUND_JOB |

---

## G3: Payment Failure Surfacing

### What This Guarantees

Payment failures are NEVER silent. Every payment attempt is logged with
outcome. Failed payments create admin notifications. Failed payments are
queryable.

### Schema Invariants

```prisma
model PaymentAttempt {
  id              String               @id @default(uuid()) @db.Uuid
  createdAt       DateTime             @default(now())
  completedAt     DateTime?

  // Status (explicit enum, not derived)
  status          PaymentAttemptStatus

  // Gateway details
  gatewayProvider String               // "stripe", "square", "manual"
  gatewayId       String?              // External reference
  gatewayStatus   String?              // Raw gateway response code

  // Failure information (REQUIRED when status != SUCCEEDED)
  failureReason   String?              // Human-readable: "Card declined"
  failureCode     String?              // Machine-readable: "card_declined"

  // Amount
  amountCents     Int
  currency        String               @default("USD")

  // Linkage
  invoiceId       String?              @db.Uuid
  memberId        String               @db.Uuid

  // Retry tracking
  attemptNumber   Int                  @default(1)
  isRetryable     Boolean              @default(false)

  invoice         Invoice?             @relation(fields: [invoiceId], references: [id])
  member          Member               @relation(fields: [memberId], references: [id])

  // INVARIANT: status != SUCCEEDED implies failureReason IS NOT NULL
  // Enforced by: Service layer validation before insert/update
}

enum PaymentAttemptStatus {
  PENDING
  PROCESSING
  SUCCEEDED
  FAILED
  REQUIRES_ACTION
  CANCELLED
}
```

### Blocked Operations

| Operation | Why Blocked | Error Response |
|-----------|-------------|----------------|
| PaymentAttempt with status=FAILED and null failureReason | Missing failure info | Validation error |
| Payment gateway call that doesn't record outcome | Silent failure | N/A - wrapper enforces logging |
| Failed payment without admin notification | Silent failure | N/A - notification created in transaction |
| Failed payment without audit entry | Untraced failure | N/A - audit created in transaction |

### Service Layer Enforcement

```typescript
// src/lib/finance/payment-service.ts

// REQUIRED PATTERN: Gateway wrapper that guarantees outcome logging
export async function processPayment(
  params: PaymentParams
): Promise<PaymentResult> {
  // 1. Create pending attempt (always, before calling gateway)
  const attempt = await prisma.paymentAttempt.create({
    data: {
      status: "PENDING",
      gatewayProvider: params.gateway,
      amountCents: params.amountCents,
      invoiceId: params.invoiceId,
      memberId: params.memberId,
    },
  });

  try {
    // 2. Call gateway
    const gatewayResult = await callGateway(params);

    // 3. Update attempt with outcome (REQUIRED)
    await prisma.$transaction(async (tx) => {
      const updatedAttempt = await tx.paymentAttempt.update({
        where: { id: attempt.id },
        data: {
          status: gatewayResult.success ? "SUCCEEDED" : "FAILED",
          completedAt: new Date(),
          gatewayId: gatewayResult.id,
          gatewayStatus: gatewayResult.status,
          failureReason: gatewayResult.error?.message,
          failureCode: gatewayResult.error?.code,
          isRetryable: gatewayResult.error?.retryable ?? false,
        },
      });

      // 4. Create audit entry (REQUIRED)
      await tx.financialAuditEntry.create({
        data: {
          actorId: params.actorId,
          actorType: "USER",
          action: gatewayResult.success ? "PAYMENT_SUCCEEDED" : "PAYMENT_FAILED",
          entityType: "PAYMENT_ATTEMPT",
          entityId: attempt.id,
          afterState: updatedAttempt,
          memberId: params.memberId,
        },
      });

      // 5. Create notification on failure (REQUIRED)
      if (!gatewayResult.success) {
        await tx.notification.create({
          data: {
            type: "PAYMENT_FAILED",
            recipientType: "ADMIN",
            title: `Payment failed: ${gatewayResult.error?.message}`,
            entityType: "PAYMENT_ATTEMPT",
            entityId: attempt.id,
          },
        });
      }
    });

    return { success: gatewayResult.success, attemptId: attempt.id };
  } catch (error) {
    // 6. Even on exception, record failure (REQUIRED)
    await prisma.paymentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        failureReason: error instanceof Error ? error.message : "Unknown error",
        failureCode: "EXCEPTION",
      },
    });
    throw error;
  }
}

// FORBIDDEN: Calling payment gateway without going through this wrapper
```

### What WA Allows That ClubOS Forbids

| WA Behavior | ClubOS Response |
|-------------|-----------------|
| Payment gateway errors occur without intuitive alerts | Every failure creates admin notification |
| Organizations have missed donations because failures weren't surfaced | Failed payments visible in dashboard |
| Admin dashboard doesn't show failed payments prominently | Failed payments are queryable by date, member, status |
| No record of what was attempted | Every attempt logged, success or failure |
| Member thinks they paid, org has no record | Member can see attempt history |
| Trust erosion: "I paid, why am I marked delinquent?" | Clear status showing FAILED with reason |

---

## Finance Safety Done Checklist

This checklist is auditable. Each item has a specific verification method.
All items must be verified before Finance Safety MVP is declared complete.

### G1: Financial Domain Isolation

| # | Criterion | Verification Method | Verified |
|---|-----------|---------------------|----------|
| G1.1 | Invoice table has no `onDelete: Cascade` to Registration | `grep -r "onDelete.*Cascade" prisma/schema.prisma` - no finance→events matches | [ ] |
| G1.2 | Registration table has no `onDelete: Cascade` to Invoice | `grep -r "onDelete.*Cascade" prisma/schema.prisma` - no events→finance matches | [ ] |
| G1.3 | `src/lib/finance/` has no write imports from `src/lib/events/` | `grep -r "import.*from.*events" src/lib/finance/` - no matches | [ ] |
| G1.4 | `src/lib/events/` has no write imports from `src/lib/finance/` | `grep -r "import.*from.*finance" src/lib/events/` - only read imports | [ ] |
| G1.5 | Test: Invoice.status change does not affect Registration.status | Unit test exists and passes | [ ] |
| G1.6 | Test: Registration.status change does not affect Invoice.status | Unit test exists and passes | [ ] |
| G1.7 | Test: Void invoice → registration remains CONFIRMED | Integration test exists and passes | [ ] |
| G1.8 | Test: Cancel registration → invoice remains PAID | Integration test exists and passes | [ ] |

### G2: Mandatory Financial Audit

| # | Criterion | Verification Method | Verified |
|---|-----------|---------------------|----------|
| G2.1 | FinancialAuditEntry table exists in schema | `grep "model FinancialAuditEntry" prisma/schema.prisma` | [ ] |
| G2.2 | actorId is required (not nullable) in FinancialAuditEntry | Schema inspection - no `?` on actorId | [ ] |
| G2.3 | No UPDATE method exists for FinancialAuditEntry | `grep -r "financialAuditEntry.update" src/` - no matches | [ ] |
| G2.4 | No DELETE method exists for FinancialAuditEntry | `grep -r "financialAuditEntry.delete" src/` - no matches | [ ] |
| G2.5 | Invoice mutations use audit wrapper | Code review: all Invoice updates in transaction with audit | [ ] |
| G2.6 | Payment mutations use audit wrapper | Code review: all Payment updates in transaction with audit | [ ] |
| G2.7 | Test: Invoice update without audit → transaction fails | Unit test exists and passes | [ ] |
| G2.8 | Test: Audit entries queryable by memberId | Query test exists and passes | [ ] |
| G2.9 | Test: Audit entries queryable by date range | Query test exists and passes | [ ] |
| G2.10 | Test: Audit entries include beforeState and afterState | Schema test exists and passes | [ ] |

### G3: Payment Failure Surfacing

| # | Criterion | Verification Method | Verified |
|---|-----------|---------------------|----------|
| G3.1 | PaymentAttempt table exists in schema | `grep "model PaymentAttempt" prisma/schema.prisma` | [ ] |
| G3.2 | PaymentAttemptStatus enum includes FAILED | Schema inspection | [ ] |
| G3.3 | Gateway wrapper creates attempt before calling gateway | Code review: processPayment pattern | [ ] |
| G3.4 | Gateway wrapper updates attempt after gateway response | Code review: processPayment pattern | [ ] |
| G3.5 | Failed payment creates admin notification | Code review: notification in failure path | [ ] |
| G3.6 | Test: Gateway returns error → attempt status = FAILED | Unit test exists and passes | [ ] |
| G3.7 | Test: Failed attempt has failureReason populated | Validation test exists and passes | [ ] |
| G3.8 | Test: Admin can query failed payments by date | Query test exists and passes | [ ] |
| G3.9 | Test: Gateway exception still records failure | Exception handling test exists and passes | [ ] |
| G3.10 | Audit entry created for every payment attempt | Integration test exists and passes | [ ] |

### Cross-Guarantee Verification

| # | Criterion | Verification Method | Verified |
|---|-----------|---------------------|----------|
| X.1 | All three guarantee tests pass in CI | CI pipeline green on finance-safety tests | [ ] |
| X.2 | No `prisma.invoice.update()` outside audit wrapper | Grep + code review | [ ] |
| X.3 | No `prisma.payment.update()` outside audit wrapper | Grep + code review | [ ] |
| X.4 | PR review gate active for finance/* changes | CI config inspection | [ ] |

---

## Completion Criteria

Finance Safety MVP is complete when:

1. **All G1 checklist items verified** - Domain isolation enforced
2. **All G2 checklist items verified** - Audit trail mandatory
3. **All G3 checklist items verified** - Failures surfaced
4. **All X checklist items verified** - Cross-guarantee integrity
5. **Sign-off obtained** from:
   - [ ] Technical lead (implementation correct)
   - [ ] Architecture reviewer (design compliant)
   - [ ] Product owner (scope complete)

---

## What This Enables

After Finance Safety MVP, these features can be safely built:

| Feature | Depends On |
|---------|------------|
| Refund workflow (WA-029) | G1 (domain isolation), G2 (audit) |
| Financial reporting (WA-034) | G2 (queryable audit) |
| Manual payment recording (WA-033) | G1 (isolated domain), G2 (audited) |
| Reconciliation tools | G2 (complete audit trail) |
| Compliance exports | G2 (structured audit) |
| Auto-renewal handling (WA-032) | G1 (no cascade), G3 (failure visibility) |

---

## Charter Alignment

| Charter Principle | How This Document Applies It |
|-------------------|------------------------------|
| P1: Identity provable | G2 requires actorId on every audit entry |
| P2: Default deny | G1 blocks cross-domain writes by default |
| P3: Explicit state machines | All status fields use enums with defined transitions |
| P5: Reversible operations | G1 prevents cascade corruption; soft-delete preserves data |
| P7: Observability | G2 and G3 make all financial activity visible |
| N2: No coarse rigid roles | Audit includes specific actor, not just "admin" |
| N5: No hidden rules | Blocked operations return explicit errors |

---

## See Also

- [FINANCE_SAFETY_MVP.md](./FINANCE_SAFETY_MVP.md) - Original analysis
- [FAILURE_MODES_TO_GUARANTEES_REGISTRY.md](./FAILURE_MODES_TO_GUARANTEES_REGISTRY.md) - WA issue mapping
- [ARCHITECTURAL_CHARTER.md](../ARCHITECTURAL_CHARTER.md) - Governing principles
- [WA_FUTURE_FAILURE_IMMUNITY.md](./WA_FUTURE_FAILURE_IMMUNITY.md) - Meta-patterns

---

*This document is normative for Finance Safety MVP scope.
All checklist items must be verified before completion sign-off.*
