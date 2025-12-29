# Pricing and Entitlements Specification

```
Status: PROPOSED - Pricing model ready for market validation
Version: 1.1
Last Updated: 2025-12-28
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

### 5.1 Current Status: PROPOSED

This pricing model is proposed for market validation. Final pricing TBD.

### 5.2 Base Package

The base package includes all core functionality:

| Feature Category | Included |
|------------------|----------|
| Membership management | Yes |
| Event registration & payments | Yes |
| Donation tracking & receipts | Yes |
| Community guide / resource directory | Yes |
| Member directory | Yes |
| Governance (minutes, motions) | Yes |
| Email communications | Yes |
| Basic reporting | Yes |
| Standard support | Yes |

**Pricing Structure (Hybrid Model):**

| Component | Rate | Notes |
|-----------|------|-------|
| Per engaged member | $0.50-1.00/month | Scales with org size |
| Transaction fee | 0.5-1% | On top of Stripe fees |
| Minimum monthly | $25-50 | Floor to ensure sustainability |

### 5.3 Add-Ons

| Add-On | Price | Description |
|--------|-------|-------------|
| Custom domain | $10/month | yourclub.org instead of *.murmurant.app |
| Premium support | $50/month | Priority response, dedicated contact |
| API access | $25/month | Full API access for integrations |
| White-label PDFs | $15/month | Remove Murmurant branding from exports |
| Multi-chapter | Custom | For organizations with branches |

### 5.4 Professional Services

**Philosophy:** Services should be self-service or automated. Human-time services are
intentionally limited to avoid scaling constraints.

| Service | Price | Scope |
|---------|-------|-------|
| Self-service migration | Included | Automated import wizard for Wild Apricot, CSV |
| Video onboarding library | Included | On-demand tutorials, no human time required |
| Community forum support | Included | Peer support from other operators |

**Premium (Limited Availability):**

| Service | Price | Notes |
|---------|-------|-------|
| Concierge migration | $500 one-time | For complex/large migrations only |
| Priority support queue | Part of Premium Support add-on | Faster response, not dedicated staff |

**Explicitly NOT Offered:**

- Custom development (use API access instead)
- Dedicated account managers
- Hourly consulting

This aligns with Charter Principle P10 (automation over human intervention) and ensures
the platform scales without linear headcount growth.

### 5.5 Pricing Invariants

When pricing is implemented, these invariants apply:
- Price changes require 30+ days advance notice
- Downgrades are allowed (with feature loss)
- No surprise charges
- Clear invoicing with itemized breakdown
- "Engaged member" definition: logged in within last 90 days

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
| Per-member vs flat pricing? | PROPOSED: Hybrid (per-member + minimum) | Business |
| What features are premium? | PROPOSED: See Add-Ons section | Product |
| Annual vs monthly billing? | TBD: Consider annual discount | Business |
| Free trial duration? | TBD | Business |
| Exact per-member rate ($0.50 vs $1.00)? | TBD: Market testing | Business |
| Transaction fee (0.5% vs 1%)? | TBD: Competitor analysis | Business |

---

## 8. Related Documents

| Document | Relationship |
|----------|--------------|
| [BUSINESS_MODEL_CANONICAL.md](./BUSINESS_MODEL_CANONICAL.md) | Parent document |
| [BILLING_INVARIANTS.md](./BILLING_INVARIANTS.md) | Billing safety rules |
| [Working Notes](./_ARCHIVE/CHATGPT_BUSINESS_MODEL_WORKING_NOTES.md) | Rationale |

---

_This document will be updated when pricing model is finalized._
