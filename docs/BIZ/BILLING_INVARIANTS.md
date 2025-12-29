# Billing Invariants

```
Status: DRAFT - Billing implementation deferred
Version: 1.0
Last Updated: 2025-12-24
Derived From: _ARCHIVE/CHATGPT_BUSINESS_MODEL_WORKING_NOTES.md
Related: Epic #248, Issue #256
```

---

## 1. Purpose

This document defines **invariants** - rules that MUST always hold true for
billing operations. Violating these invariants is a system failure.

These are safety rails, not implementation details.

---

## 2. Financial Transaction Invariants

### INV-B1: No Silent Charges

```
INVARIANT: Every charge to a customer MUST be associated with:
  - An explicit customer action (signup, upgrade, renewal)
  - OR advance notification (auto-renewal reminder)
  - AND itemized invoice

NEVER: Charge without the customer knowing why
```

### INV-B2: Charge Idempotency

```
INVARIANT: A charge operation with the same idempotency key MUST:
  - Succeed exactly once
  - Return the same result on retry
  - Never double-charge

NEVER: Allow duplicate charges due to retries or race conditions
```

### INV-B3: Audit Trail

```
INVARIANT: Every financial transaction MUST be logged with:
  - Timestamp
  - Actor (who initiated)
  - Amount and currency
  - Reason/type
  - External reference (Stripe ID, etc.)

NEVER: Modify financial records without audit trail
```

### INV-B4: Refund Capability

```
INVARIANT: Every charge MUST be refundable within policy window
  - Full refund for billing errors
  - Prorated refund for cancellations (if policy allows)
  - Refund reason is logged

NEVER: Take money that cannot be returned if needed
```

---

## 3. Subscription Lifecycle Invariants

### INV-S1: Grace Period

```
INVARIANT: When payment fails, customer MUST have grace period before:
  - Feature degradation
  - Data access loss
  - Account suspension

Minimum grace period: 7 days

NEVER: Immediately lock out on failed payment
```

### INV-S2: Downgrade Path

```
INVARIANT: Customer can always downgrade to lower tier
  - Feature access adjusts to new tier
  - Data is preserved (even if view-only)
  - No penalty fees for downgrade

NEVER: Trap customer in higher tier
```

### INV-S3: Cancellation

```
INVARIANT: Customer can cancel at any time
  - Access continues until end of paid period
  - Data export available before termination
  - No hidden fees

NEVER: Make cancellation difficult or punitive
```

### INV-S4: Price Change Notice

```
INVARIANT: Price increases require:
  - 30 days advance notice (minimum)
  - Clear comparison (old vs new)
  - Option to cancel before new price takes effect

NEVER: Surprise price increase
```

---

## 4. Data Retention Invariants

### INV-D1: Data Outlives Subscription

```
INVARIANT: When subscription ends:
  - Data is retained for export period (30 days minimum)
  - Read-only access during retention
  - Clear deletion schedule communicated

NEVER: Delete data immediately on subscription end
```

### INV-D2: Export Before Delete

```
INVARIANT: Before permanent data deletion:
  - Customer notified 14 days in advance
  - Export option available
  - Explicit confirmation or expiry

NEVER: Delete without warning
```

---

## 5. Payment Processing Invariants

### INV-P1: Secure Handling

```
INVARIANT: Payment credentials MUST:
  - Be handled by PCI-compliant processor (Stripe)
  - Never touch Murmurant servers in raw form
  - Use tokenization for recurring payments

NEVER: Store card numbers, CVVs, or full account numbers
```

### INV-P2: Receipt Delivery

```
INVARIANT: Every successful charge MUST generate:
  - Email receipt to customer
  - Record in billing history
  - Downloadable invoice

NEVER: Charge without providing receipt
```

### INV-P3: Failed Payment Notification

```
INVARIANT: Failed payment MUST trigger:
  - Email notification to customer
  - In-app notification
  - Clear instructions to update payment method

NEVER: Fail silently
```

---

## 6. Currency and Tax Invariants

### INV-C1: Currency Transparency

```
INVARIANT: All prices MUST be displayed in:
  - Customer's billing currency
  - With currency symbol/code
  - Tax-inclusive or exclusive clearly marked

NEVER: Surprise with currency conversion at checkout
```

### INV-C2: Tax Compliance

```
INVARIANT: Tax handling MUST:
  - Collect required sales tax/VAT
  - Display tax amount separately
  - Provide tax receipts/invoices

NEVER: Ignore tax obligations
```

---

## 7. Error Handling Invariants

### INV-E1: Fail Safe

```
INVARIANT: When billing system fails:
  - Do NOT degrade customer access immediately
  - Retry failed operations with backoff
  - Alert operations team
  - Default to preserving customer access

NEVER: Punish customer for system failure
```

### INV-E2: Clear Error Messages

```
INVARIANT: Billing errors shown to customer MUST:
  - Be human-readable
  - Explain what went wrong
  - Provide actionable next steps

NEVER: Show cryptic error codes
```

---

## 8. Compliance Invariants

### INV-X1: Record Retention

```
INVARIANT: Financial records MUST be retained:
  - 7 years minimum (US tax requirements)
  - Immutable (no modification after creation)
  - Backup protected

NEVER: Delete financial records prematurely
```

### INV-X2: Dispute Handling

```
INVARIANT: When customer disputes charge:
  - Pause collection activities
  - Investigate within 3 business days
  - Resolve or escalate within 14 days

NEVER: Ignore or auto-reject disputes
```

---

## 9. Invariant Verification

### How to Test

Each invariant should have:
1. **Unit tests** - Verify behavior in isolation
2. **Integration tests** - Verify with payment processor
3. **Monitoring** - Detect violations in production

### Violation Response

When invariant is violated:
1. **Immediate notification** - Alert on-call
2. **Customer protection** - Default to customer-favorable outcome
3. **Root cause analysis** - Prevent recurrence
4. **Disclosure if needed** - Notify affected customers

---

## 10. Implementation Status

| Invariant | Implementation | Tests | Monitoring |
|-----------|----------------|-------|------------|
| INV-B1 | TBD | TBD | TBD |
| INV-B2 | TBD | TBD | TBD |
| INV-B3 | TBD | TBD | TBD |
| INV-B4 | TBD | TBD | TBD |
| INV-S1 | TBD | TBD | TBD |
| INV-S2 | TBD | TBD | TBD |
| INV-S3 | TBD | TBD | TBD |
| INV-S4 | TBD | TBD | TBD |
| INV-D1 | TBD | TBD | TBD |
| INV-D2 | TBD | TBD | TBD |
| INV-P1 | TBD | TBD | TBD |
| INV-P2 | TBD | TBD | TBD |
| INV-P3 | TBD | TBD | TBD |
| INV-C1 | TBD | TBD | TBD |
| INV-C2 | TBD | TBD | TBD |
| INV-E1 | TBD | TBD | TBD |
| INV-E2 | TBD | TBD | TBD |
| INV-X1 | TBD | TBD | TBD |
| INV-X2 | TBD | TBD | TBD |

---

## 11. Related Documents

| Document | Relationship |
|----------|--------------|
| [BUSINESS_MODEL_CANONICAL.md](./BUSINESS_MODEL_CANONICAL.md) | Parent document |
| [PRICING_AND_ENTITLEMENTS.md](./PRICING_AND_ENTITLEMENTS.md) | What customers pay for |
| [Working Notes](./_ARCHIVE/CHATGPT_BUSINESS_MODEL_WORKING_NOTES.md) | Rationale |

---

_These invariants are non-negotiable. Implementation details may vary,
but these rules must always hold._
