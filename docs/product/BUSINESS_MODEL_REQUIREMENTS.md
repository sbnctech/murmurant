# Business Model → Software Requirements

**Epic:** #248
**Child Issues:** #249, #252, #256, #259, #260
**Status:** Requirements Outline
**Last Updated:** December 2024

---

## 1. Executive Summary

This document translates Murmurant business model requirements into implementable software specifications. It covers:

- Membership tiers and entitlements (what users can do)
- Capability gating (how entitlements are enforced)
- Billing safety (revenue-critical invariants)
- Abuse prevention (rate limiting and resource quotas)
- Audit and compliance (financial logging requirements)

### Milestone Plan

| Milestone | Description | Dependencies |
|-----------|-------------|--------------|
| **M1: MVP Tier Gating (No Billing)** | Enforce tier-based feature access without payment integration | Schema, Auth |
| **M2: Billing Integration** | Add payment processing, subscription lifecycle | M1, Payment provider |
| **M3: Full Compliance** | Complete audit trail, dispute handling, reconciliation | M2 |

---

## 2. Membership Tiers and Entitlements (#249)

### 2.1 Tier Enumeration

Murmurant supports a configurable tier system. The following are **invariant** (cannot be removed):

| Tier Code | Display Name | Description |
|-----------|--------------|-------------|
| `free` | Free | Basic access, limited features |
| `member` | Member | Standard paid membership |

The following are **configurable** (organization can add/modify):

| Tier Code | Display Name | Description |
|-----------|--------------|-------------|
| `premium` | Premium | Enhanced features, priority access |
| `admin` | Admin | Full system access (not a paid tier) |

### 2.2 Tier vs Status (Orthogonal Dimensions)

As documented in `docs/MEMBERSHIP_MODEL_TRUTH_TABLE.md`, Murmurant uses two orthogonal dimensions:

- **Status** (lifecycle state): active, lapsed, pending_new, pending_renewal, suspended
- **Tier** (benefit level): free, member, premium, etc.

These are independent: a "Lapsed Premium" member was premium but didn't renew.

### 2.3 Entitlement Primitives

| Primitive | Type | Description | Configurable? |
|-----------|------|-------------|---------------|
| `tier.code` | enum | Tier identifier | Yes (add new) |
| `tier.rank` | integer | Tier ordering (higher = more access) | Yes |
| `tier.features` | string[] | Feature flags included in tier | Yes |
| `tier.limits` | object | Resource quotas for tier | Yes |
| `tier.price` | decimal | Monthly/annual price (null = free) | Yes |

### 2.4 Feature Matrix Template

| Feature | Free | Member | Premium | Admin |
|---------|------|--------|---------|-------|
| View public events | Yes | Yes | Yes | Yes |
| Register for events | Yes | Yes | Yes | Yes |
| Priority registration | No | No | Yes | Yes |
| Create events | No | No | No | Yes |
| Export data | No | No | Yes | Yes |
| API access | No | Limited | Full | Full |

**Note:** This matrix is a template. Actual features are organization-specific.

### 2.5 Tier Transition Rules

| Transition | Trigger | Effect | Audit |
|------------|---------|--------|-------|
| Upgrade | Payment confirmed | Immediate access to new tier | Required |
| Downgrade (voluntary) | User action | End of billing period | Required |
| Downgrade (non-payment) | Payment failed | Grace period, then restrict | Required |
| Suspension | Admin action | Immediate access revocation | Required |

**Invariant: INV-TIER-001** — No silent downgrades. User must be notified before access is reduced.

---

## 3. Capability Gating (#252)

### 3.1 Technical Requirements

Tier checks must integrate with the existing capability system documented in `docs/RBAC_OVERVIEW.md`.

#### 3.1.1 Server-Side Enforcement (Invariant)

```typescript
// Required pattern
const auth = await requireCapability(req, "events:register");
if (!hasTierAccess(auth, "premium", "priority_registration")) {
  return tierUpgradePrompt("priority_registration", "premium");
}
```

**Invariant: INV-CAP-001** — Tier checks must be server-side. UI hiding is not sufficient.

#### 3.1.2 Fail-Closed Behavior

```typescript
// If tier is unknown or null, deny access to tier-gated features
if (!auth.user.tier || auth.user.tier === "unknown") {
  return denyWithReason("tier_unknown");
}
```

**Invariant: INV-CAP-002** — Tier checks fail closed. Unknown tier = no access to gated features.

### 3.2 Implementation Checklist

- [ ] `hasTierAccess(auth, minTier, feature)` helper function
- [ ] `requireTieredCapability(req, capability, minTier)` middleware
- [ ] Tier information included in auth context
- [ ] Audit log entry for tier-gated denials
- [ ] UI components can check tier for conditional rendering
- [ ] Tests cover tier enforcement (positive and negative cases)

### 3.3 Graceful Degradation

When a user lacks tier access:

1. Show what they're missing (feature preview)
2. Show upgrade path (pricing, benefits)
3. Log the upgrade opportunity (for conversion tracking)

---

## 4. Billing Safety Invariants (#256)

### 4.1 Financial Invariants

These invariants must hold for all financial operations:

| ID | Invariant | Enforcement |
|----|-----------|-------------|
| **INV-FIN-001** | Payment intents are idempotent | Same idempotency key = same result |
| **INV-FIN-002** | Refunds require explicit authorization | `finance:refund` capability + audit |
| **INV-FIN-003** | Subscription state matches payment state | State machine with verification |
| **INV-FIN-004** | Financial operations blocked during impersonation | `BLOCKED_WHILE_IMPERSONATING` list |
| **INV-FIN-005** | All money movement is logged immutably | Append-only audit log |
| **INV-FIN-006** | No double-charging | Idempotency + transaction isolation |
| **INV-FIN-007** | No silent tier downgrades | Notification + grace period required |

### 4.2 Proration Rules (Placeholder)

Proration applies when:

- User upgrades mid-cycle
- User downgrades mid-cycle
- Subscription period changes

**Placeholder:** Proration strategy TBD based on payment provider capabilities.

| Scenario | Proration Strategy | Implementation |
|----------|-------------------|----------------|
| Upgrade mid-cycle | Charge difference immediately | TBD |
| Downgrade mid-cycle | Credit applied to next cycle | TBD |
| Annual to monthly | No proration (start fresh) | TBD |

### 4.3 Subscription State Machine

```
┌─────────────────────────────────────────────────────────┐
│                   SUBSCRIPTION STATES                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐         │
│  │   NONE   │────▶│  ACTIVE  │────▶│ CANCELED │         │
│  └──────────┘     └────┬─────┘     └──────────┘         │
│        │               │                 │               │
│        │               ▼                 │               │
│        │         ┌──────────┐            │               │
│        │         │ PAST_DUE │────────────┘               │
│        │         └────┬─────┘                            │
│        │              │                                  │
│        │              ▼                                  │
│        │         ┌──────────┐                            │
│        └────────▶│ EXPIRED  │                            │
│                  └──────────┘                            │
│                                                          │
└─────────────────────────────────────────────────────────┘

Transitions:
  NONE → ACTIVE: Payment confirmed
  ACTIVE → PAST_DUE: Payment failed
  ACTIVE → CANCELED: User canceled
  PAST_DUE → ACTIVE: Payment succeeded
  PAST_DUE → EXPIRED: Grace period exceeded
  PAST_DUE → CANCELED: User canceled
  EXPIRED → ACTIVE: Re-subscription
  CANCELED → ACTIVE: Re-subscription
```

### 4.4 Grace Periods

| Event | Grace Period | User Notification |
|-------|--------------|-------------------|
| Payment failed | 7 days | Email on day 0, 3, 6 |
| Card expiring | 30 days before | Email on day -30, -14, -7 |
| Subscription canceled | End of period | Confirmation email |

---

## 5. Abuse Prevention and Rate Limiting (#259)

### 5.1 Rate Limiting by Role

| Role | API Calls/min | Burst Limit | Backoff |
|------|---------------|-------------|---------|
| Anonymous | 30 | 60 | Exponential |
| Member (free) | 60 | 120 | Exponential |
| Member (paid) | 300 | 600 | Linear |
| Admin | 600 | 1200 | None |

### 5.2 Rate Limiting by Endpoint

| Endpoint Category | Rate Limit | Notes |
|-------------------|------------|-------|
| Authentication | 5/min per IP | Prevent brute force |
| Registration | 10/min per user | Prevent spam |
| Data export | 3/hour per user | Prevent data scraping |
| Email sending | 50/day per user | Prevent spam |
| Search | 30/min per user | Prevent abuse |

### 5.3 Resource Quotas by Tier

| Resource | Free | Member | Premium |
|----------|------|--------|---------|
| Storage (MB) | 10 | 100 | 1000 |
| Events created/month | 0 | 0 | 5 |
| API calls/day | 100 | 1000 | 10000 |
| Email sends/month | 0 | 50 | 500 |

### 5.4 Abuse Detection Signals

| Signal | Threshold | Action |
|--------|-----------|--------|
| Failed logins | 5 in 10 min | Temporary lockout |
| Rate limit hits | 10 in 1 min | Extended cooldown |
| Export requests | 10 in 1 hour | Manual review |
| Registration spam | 3 failed in 1 hour | CAPTCHA required |

### 5.5 Account Restriction Workflow

```
┌──────────────────────────────────────────────────────┐
│              ACCOUNT RESTRICTION FLOW                 │
├──────────────────────────────────────────────────────┤
│                                                       │
│  Detection      Automatic         Manual Review       │
│  ─────────      ─────────         ─────────────       │
│                                                       │
│  Abuse          ┌──────────┐      ┌──────────┐        │
│  Signal   ────▶ │ WARNING  │ ───▶ │ REVIEW   │        │
│  Detected       └────┬─────┘      └────┬─────┘        │
│                      │                 │              │
│                      ▼                 ▼              │
│                ┌──────────┐      ┌──────────┐         │
│                │RESTRICTED│ ◀─── │ SUSPEND  │         │
│                └────┬─────┘      └──────────┘         │
│                     │                                 │
│                     ▼                                 │
│                ┌──────────┐                           │
│                │ RESTORED │ (after appeal)            │
│                └──────────┘                           │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

## 6. Audit and Compliance (#260)

### 6.1 Financial Audit Log Schema

```typescript
interface FinancialAuditEntry {
  id: string;                    // UUID
  timestamp: string;             // ISO 8601
  eventType: FinancialEventType; // Enum
  actorId: string;               // User who performed action
  actorRole: string;             // Role at time of action
  targetId?: string;             // Affected entity
  amount?: number;               // In cents
  currency?: string;             // ISO 4217
  metadata: Record<string, any>; // Additional context
  idempotencyKey?: string;       // For payment operations
  previousState?: string;        // Before transition
  newState?: string;             // After transition
}

type FinancialEventType =
  | "payment.created"
  | "payment.succeeded"
  | "payment.failed"
  | "refund.requested"
  | "refund.approved"
  | "refund.processed"
  | "subscription.created"
  | "subscription.upgraded"
  | "subscription.downgraded"
  | "subscription.canceled"
  | "subscription.expired"
  | "tier.changed";
```

### 6.2 Retention Policy

| Data Category | Retention Period | Legal Basis |
|---------------|------------------|-------------|
| Financial transactions | 7 years | Tax requirements |
| Payment methods | Until deleted + 90 days | Chargeback window |
| Subscription history | 7 years | Financial records |
| Audit logs | 7 years | Compliance |
| Failed payment attempts | 2 years | Fraud detection |

### 6.3 Compliance Checklist

- [ ] PCI-DSS scope minimized (tokenized payments via provider)
- [ ] Financial audit logs are append-only
- [ ] Logs include actor, timestamp, and full context
- [ ] GDPR deletion process defined for financial data
- [ ] Tax reporting data exportable
- [ ] Chargeback evidence collection automated

### 6.4 Dispute Handling Workflow

| Stage | Owner | SLA | Actions |
|-------|-------|-----|---------|
| Chargeback received | System | Immediate | Notify admin, gather evidence |
| Evidence collection | Admin | 24 hours | Pull audit logs, user history |
| Response submission | Admin | 48 hours | Submit to payment provider |
| Resolution | Provider | 30-90 days | Update records based on outcome |

---

## 7. Implementation Milestones

### M1: MVP Tier Gating (No Billing)

**Goal:** Enforce tier-based access without payment processing.

**Scope:**

- [ ] Add `tier` field to Member model
- [ ] Implement `hasTierAccess()` helper
- [ ] Add tier checks to gated endpoints
- [ ] UI tier badges and upgrade prompts
- [ ] Audit logging for tier denials
- [ ] Unit tests for tier enforcement

**Not Included:**

- Payment processing
- Subscription management
- Proration

**Acceptance Criteria:**

1. Free users cannot access premium features
2. Tier changes are logged
3. UI shows appropriate upgrade paths
4. All tier checks are server-side

### M2: Billing Integration

**Goal:** Add payment processing and subscription lifecycle.

**Scope:**

- [ ] Payment provider integration (Stripe)
- [ ] Subscription state machine
- [ ] Idempotent payment operations
- [ ] Grace period handling
- [ ] Invoice generation
- [ ] Payment failure notifications

**Dependencies:** M1 complete, payment provider contract

**Acceptance Criteria:**

1. Users can upgrade tier via payment
2. Payment failures trigger grace period
3. No double-charging (idempotency verified)
4. All financial operations audited

### M3: Full Compliance

**Goal:** Complete audit trail and dispute handling.

**Scope:**

- [ ] Complete financial audit log
- [ ] Retention policy automation
- [ ] Dispute workflow implementation
- [ ] Tax reporting exports
- [ ] Compliance dashboard

**Dependencies:** M2 complete

**Acceptance Criteria:**

1. 7-year audit trail for all financial operations
2. Dispute evidence auto-collected
3. Tax data exportable
4. Compliance dashboard operational

---

## 8. Cross-References

| Document | Relationship |
|----------|--------------|
| `docs/ARCHITECTURAL_CHARTER.md` | Governing principles (P1-P10) |
| `docs/MEMBERSHIP_MODEL_TRUTH_TABLE.md` | Tier vs Status orthogonality |
| `docs/RBAC_OVERVIEW.md` | Capability system integration |
| `docs/ORG/SBNC_Business_Model_and_Sustainability.md` | Business model grounding |

---

## 9. Open Questions

1. **Tier granularity:** How many tiers does SBNC need? (Current assumption: 3-4)
2. **Feature gating scope:** Which features are tier-gated vs universally available?
3. **Trial periods:** Are trial memberships supported?
4. **Grandfather clauses:** How are legacy tier assignments handled?
5. **Payment provider:** Stripe vs alternatives?
6. **Proration strategy:** Credit-based vs immediate-charge?

---

## 10. Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2024-12-24 | Claude Code | Initial requirements outline |

---

*This document is the canonical source for business model software requirements. Updates require merge captain approval.*
