# Pricing and Entitlements Specification

```
Status: DRAFT - Pricing model deferred pending market validation
Version: 1.0
Last Updated: 2025-12-24
Derived From: _ARCHIVE/CHATGPT_BUSINESS_MODEL_WORKING_NOTES.md
Related: Epic #248, Issue #249
```

---

## 1. Conceptual Framework

### 1.1 The Three-Layer Model

Murmurant separates access control into three distinct layers:

```
+-------------------+     +-------------------+     +-------------------+
|   CAPABILITIES    |     |   ENTITLEMENTS    |     |      LIMITS       |
|   (Security)      |     |   (Product)       |     |   (Operations)    |
+-------------------+     +-------------------+     +-------------------+
| What you CAN do   |     | What VALUE you    |     | How MUCH you      |
|                   |     | have access to    |     | can consume       |
+-------------------+     +-------------------+     +-------------------+
| RBAC-enforced     |     | Tier/plan-based   |     | Rate/quota-based  |
| Default: DENY     |     | Default: varies   |     | Default: generous |
| Server-enforced   |     | Product decision  |     | Abuse prevention  |
+-------------------+     +-------------------+     +-------------------+
```

### 1.2 Why This Separation Matters

| Anti-Pattern | Problem | Correct Approach |
|--------------|---------|------------------|
| Entitlements as security gates | "Premium tier can access admin" conflates product with auth | Capabilities gate admin; entitlements gate premium features |
| Capabilities for every feature | RBAC bloat, unmaintainable | Coarse capabilities; fine-grained entitlements |
| Limits without monitoring | Unenforced, exploitable | Every limit has a counter and alert |

---

## 2. Membership Tiers

### 2.1 Tier Philosophy

Tiers are **organization-specific classifications**. They are NOT:
- Platform-level categories
- Authorization levels
- Pricing tiers (though they may inform pricing)

### 2.2 Example Tier Structures

**SBNC (Santa Barbara Newcomers Club):**

| Tier | Criteria | Description |
|------|----------|-------------|
| PROSPECT | Pre-membership | Interested but not joined |
| NEWCOMER | Days 0-90 | New member |
| FIRST_YEAR | Days 91-365 | First year member |
| SECOND_YEAR | Days 366-730 | Second year member |
| THIRD_YEAR | Days 731+ | Third year and beyond |
| ALUMNI | Post-membership | Former member |

**Hypothetical Other Org (Flat Structure):**

| Tier | Criteria | Description |
|------|----------|-------------|
| MEMBER | Paid dues | Active member |
| GUEST | No dues | Guest access |

### 2.3 Tier Configuration

Tiers are defined in organization policy configuration, not code:

```
Configured per-organization:
- Tier codes and names
- Threshold definitions (days, payment status, etc.)
- Tier-to-tier transitions
- Default tier for new members
```

---

## 3. Entitlements

### 3.1 Entitlement Categories

| Category | Description | Examples |
|----------|-------------|----------|
| **Feature Access** | Access to product features | Premium content, advanced reports |
| **Priority** | Preferential treatment | Early registration, waitlist priority |
| **Capacity** | Increased limits | More events, more storage |
| **Support** | Service level | Priority support, dedicated contact |

### 3.2 Entitlement Matrix (Template)

This is a template. Actual entitlements are TBD pending pricing model.

| Entitlement | Standard | Premium | Notes |
|-------------|----------|---------|-------|
| Member management | Yes | Yes | Core feature |
| Event management | Yes | Yes | Core feature |
| Governance tools | Yes | Yes | Core feature |
| Advanced reporting | No | Yes | Premium feature |
| Priority support | No | Yes | Premium feature |
| Custom branding | No | Yes | Premium feature |
| API access | Limited | Full | Capacity difference |

### 3.3 Entitlement Enforcement

| Layer | Enforcement Method |
|-------|-------------------|
| UI | Feature visibility (convenience, not security) |
| API | Entitlement check before feature execution |
| Database | No enforcement (capabilities handle security) |

**Important:** Entitlement checks are NOT security boundaries. A user without an entitlement may see "Upgrade to access" but cannot bypass to access the feature. However, the feature itself should also have capability checks.

---

## 4. Limits

### 4.1 Limit Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| **Rate limits** | Prevent abuse | API calls per minute |
| **Quotas** | Prevent overconsumption | Members per org, events per month |
| **Storage** | Manage resources | File storage, attachments |

### 4.2 Limit Defaults

| Limit | Default | Premium | Rationale |
|-------|---------|---------|-----------|
| API calls/minute | 100 | 1000 | Abuse prevention |
| Members per org | 5000 | 50000 | Scaling |
| Events per month | 50 | Unlimited | Scaling |
| File storage | 1GB | 10GB | Resource cost |

### 4.3 Limit Enforcement

Every limit MUST have:
1. **Counter** - Track current usage
2. **Check** - Enforce before operation
3. **Response** - Clear error when exceeded
4. **Monitoring** - Alert when approaching limit

---

## 5. Pricing Model

### 5.1 Current Status: DEFERRED

Pricing model is intentionally deferred pending:
- Market validation with early adopters
- Understanding of actual usage patterns
- Competitive analysis

### 5.2 Pricing Options Under Consideration

| Model | Description | Pros | Cons |
|-------|-------------|------|------|
| Per-member | Price per active member | Scales with value | Complex tracking |
| Flat tier | Fixed price for tier | Simple | May not fit all orgs |
| Usage-based | Pay for what you use | Fair | Unpredictable bills |
| Hybrid | Base + per-member | Predictable + scalable | More complex |

### 5.3 Pricing Invariants (When Decided)

When pricing is implemented, these invariants apply:
- Price changes require advance notice
- Downgrades are allowed (with feature loss)
- No surprise charges
- Clear invoicing

See: [BILLING_INVARIANTS.md](./BILLING_INVARIANTS.md)

---

## 6. Implementation Notes

### 6.1 Database Model

Tiers and entitlements require:
- `MembershipTier` table (per-org tier definitions)
- `Entitlement` table (feature flags per tier/plan)
- `UsageCounter` table (limit tracking)

### 6.2 API Design

Entitlement checks should be:
- Centralized (single point of truth)
- Cached (performance)
- Audited (who accessed what)

### 6.3 Migration Considerations

When migrating from WA:
- Map WA membership levels to Murmurant tiers
- Operator validates mapping before import
- No automatic entitlement assignment (requires explicit configuration)

---

## 7. Open Questions

| Question | Status | Owner |
|----------|--------|-------|
| Per-member vs flat pricing? | DEFERRED | Business |
| What features are premium? | DEFERRED | Product |
| Annual vs monthly billing? | DEFERRED | Business |
| Free trial duration? | DEFERRED | Business |

---

## 8. Related Documents

| Document | Relationship |
|----------|--------------|
| [BUSINESS_MODEL_CANONICAL.md](./BUSINESS_MODEL_CANONICAL.md) | Parent document |
| [BILLING_INVARIANTS.md](./BILLING_INVARIANTS.md) | Billing safety rules |
| [Working Notes](./_ARCHIVE/CHATGPT_BUSINESS_MODEL_WORKING_NOTES.md) | Rationale |

---

_This document will be updated when pricing model is finalized._
