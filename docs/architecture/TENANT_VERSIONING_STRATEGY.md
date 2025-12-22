Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

# Tenant Versioning Strategy

Status: Architecture Decision
Audience: Engineering, Operations, Solutions
Last updated: 2025-12-21

---

## Executive Summary

ClubOS recommends a **single shared code version for all tenants** with
**feature flags for controlled rollout**. Per-tenant code versions are
explicitly rejected due to migration complexity, support burden, and
incident response risk.

This document explains the rationale, presents alternatives for edge
cases, and defines non-negotiable requirements that any approach must
satisfy.

---

## 1. Baseline Recommendation

### Recommendation: Single Shared Code Version

All tenants run the same deployed code version. Feature availability
is controlled via:

- Tenant-level feature flags (enable/disable specific capabilities)
- Audience-based rollout (percentage, cohort, or named tenants)
- Environment gates (staging vs production)

### Why We Recommend This

| Factor | Single Version | Per-Tenant Versions |
|--------|----------------|---------------------|
| Migration complexity | One migration, all tenants | N migrations, N potential failures |
| Incident response | One codebase to debug | Which version is this tenant on? |
| Support burden | One known state | N known states |
| Security patches | Deploy once | Deploy N times, verify N times |
| Testing coverage | One test matrix | N test matrices (combinatorial) |
| Rollback complexity | One rollback | N rollbacks, potentially inconsistent |

### What Single Version Does NOT Mean

Single code version does not mean identical behavior for all tenants:

- **Feature flags** control which features are enabled per tenant
- **Configuration** controls tenant-specific settings (branding, limits)
- **Tier entitlements** control which capabilities are available
- **Data isolation** ensures tenants cannot see each other's data

The code is shared. The experience is configurable.

---

## 2. Alternative Approaches (If Per-Tenant Versions Are Desired)

If business requirements force per-tenant versioning, two approaches
are viable. Both add significant operational cost.

### Approach A: Multi-Tenant, Single Code, Feature Flags Per Tenant

**Description:** Single deployment, single codebase. New features are
gated behind feature flags. Tenants opt-in to new features on their
schedule (within a support window).

**Implementation:**

```
if (featureFlags.isEnabled('new-editor', tenant.id)) {
  return <NewEditor />;
} else {
  return <LegacyEditor />;
}
```

| Dimension | Assessment |
|-----------|------------|
| Cost | Low infrastructure cost. Flag management overhead. |
| Complexity | Moderate. Must maintain both code paths during transition. |
| Migration risk | Low. Database is unified. Migrations are shared. |
| Incident response | Moderate. Must identify which flags were active. |
| Support burden | Moderate. "Which features do you have enabled?" |
| Sunset discipline | Required. Old paths must be removed within window. |

**Constraints:**

- Feature flag sunset window: 90 days maximum
- No more than 3 major feature flags active simultaneously
- All flags must have kill-switch capability
- Flag state changes are audited

### Approach B: Separate Deployment Per Tenant (or Per Cohort)

**Description:** Each tenant (or tenant cohort) gets an isolated
deployment. Different deployments can run different versions.

**Implementation:**

```
tenant-a.clubos.app  -> Deployment v2.3.1
tenant-b.clubos.app  -> Deployment v2.4.0
tenant-c.clubos.app  -> Deployment v2.4.0
```

| Dimension | Assessment |
|-----------|------------|
| Cost | High. N deployments = N infrastructure costs. |
| Complexity | High. N deployments to maintain, monitor, update. |
| Migration risk | High. Migrations must succeed on each deployment. |
| Incident response | Complex. Which deployment? Which version? |
| Support burden | High. "Let me check which version you're on." |
| Version sprawl | Likely. Tenants resist upgrades. |

**When This Might Be Justified:**

- Regulatory requirement for physical isolation (rare)
- Tenant paying for dedicated infrastructure (premium tier)
- Temporary isolation during major migration (sunset path)

**Constraints:**

- Maximum version lag: 2 minor versions behind current
- Tenants on old versions receive security patches only
- No new features until upgraded to current
- Upgrade path documented and tested before isolation granted

---

## 3. Field Test Model for Multi-Tenant

Pilot cohorts can be run without per-tenant code forks using staged
rollout patterns.

### Rollout Stages

```
Stage 1: Internal only (SBNC dogfooding)
   |
Stage 2: Opt-in beta (tenants who request early access)
   |
Stage 3: Percentage rollout (10% -> 25% -> 50% -> 100%)
   |
Stage 4: General availability (flag removed, feature is default)
```

### What Must Be Feature-Flagged

| Category | Flag Required | Rationale |
|----------|---------------|-----------|
| New UI components | Yes | Visual changes need validation |
| New workflows | Yes | Behavioral changes need training |
| Performance optimizations | Usually no | Should be transparent |
| Bug fixes | No | All tenants should benefit immediately |
| Security fixes | No | All tenants must be protected |
| Breaking API changes | Yes | Clients need migration time |
| Database schema changes | No | Schema is shared, migrations are atomic |

### What Must NOT Be Feature-Flagged

| Category | Rationale |
|----------|-----------|
| Security patches | Cannot leave some tenants vulnerable |
| Data isolation logic | Must be consistent for all tenants |
| Audit logging | Compliance requires uniform coverage |
| Write guards | Safety mechanisms must be universal |
| Restore procedures | Recovery must work the same everywhere |

### Pilot Cohort Selection

Criteria for early access tenants:

- Explicit opt-in with documented acceptance of risk
- Responsive admin contact (can report issues quickly)
- Not in peak operational period (not during annual events)
- Willing to provide feedback within 7 days
- Understands rollback may occur

---

## 4. Non-Negotiables

Regardless of versioning approach, the following must be guaranteed:

### 4.1 Data Isolation

- Tenant A cannot read, write, or infer data about Tenant B
- All queries include tenant context at the data layer
- Cross-tenant queries are architecturally impossible
- Shared tables (lookup data) are read-only for tenants

**Verification:** Unit tests enforce tenant scoping on all repositories.

### 4.2 Restore Paths

- Tenant-specific restore must be possible (not just full-system)
- Restore does not affect other tenants
- Restore procedure is documented and tested quarterly
- Restore from backup does not require matching code version
  (data format must be forward-compatible)

**Verification:** Quarterly restore drill with verification checklist.

### 4.3 Audit Logging

- All admin actions logged with tenant context
- Audit logs are tenant-scoped (Tenant A cannot see Tenant B's logs)
- Audit retention meets tier-specific SLA
- Audit export available per tenant

**Verification:** Audit coverage enforced by write wrapper pattern.

### 4.4 Write/Publish Control by Policy

- Read-only mode can be activated per tenant
- Publish freeze can be activated per tenant
- These controls are independent of code version
- Control state changes are themselves audited

**Verification:** Admin dashboard shows current control state per tenant.

---

## 5. Decision Matrix

Use this matrix to select an approach based on your constraints.

| Constraint | Single + Flags (A) | Per-Tenant Deploy (B) | Notes |
|------------|--------------------|-----------------------|-------|
| < 50 tenants | Recommended | Possible but costly | Flags scale better |
| 50-500 tenants | Recommended | Not recommended | Operational burden too high |
| > 500 tenants | Recommended | Not feasible | Infrastructure cost prohibitive |
| Regulatory isolation required | Not sufficient | Required | Rare; usually data isolation suffices |
| Tenant pays for dedicated infra | Not applicable | Appropriate | Premium tier only |
| Team capacity < 3 engineers | Recommended | Not feasible | Cannot support N deployments |
| Team capacity 3-10 engineers | Recommended | Possible with automation | Still not recommended |
| Compliance audit frequency high | Recommended | Adds complexity | One audit target vs N |
| Tenant upgrade resistance expected | Use sunset window | Enables version sprawl | Sprawl is a liability |

### Quick Decision Guide

1. **Default choice:** Single version + feature flags (Approach A)
2. **Only consider per-tenant deploy if:**
   - Regulatory requirement for physical isolation, AND
   - Tenant pays for dedicated infrastructure, AND
   - Team has capacity to maintain N deployments
3. **Never allow:**
   - More than 2 minor versions behind current
   - Indefinite version pinning
   - Per-tenant code forks (branches)

---

## 6. Implementation Requirements

### For Single Version + Flags (Recommended)

- [ ] Feature flag service with tenant targeting
- [ ] Flag audit logging (who enabled what, when)
- [ ] Flag kill-switch capability (disable feature for all in < 5 min)
- [ ] Sunset tracking (flags older than 90 days trigger alert)
- [ ] Rollout dashboard (which tenants have which flags)

### For Per-Tenant Deploy (If Required)

- [ ] Deployment automation per tenant
- [ ] Version tracking dashboard
- [ ] Migration verification per deployment
- [ ] Security patch distribution automation
- [ ] Upgrade nudge system (remind lagging tenants)
- [ ] Hard cutoff enforcement (force upgrade after N days)

---

## 7. Relationship to Solutions-First Delivery

The solutions-first delivery model assumes:

- All customers get the same platform
- Differentiation is via tier (SLA, limits, support)
- No custom code per customer

Tenant versioning aligns with this by:

- Recommending single shared code
- Using flags for controlled rollout, not permanent divergence
- Enforcing sunset windows to prevent version sprawl
- Documenting tier-based entitlements, not tenant-specific features

If a customer requests a per-tenant version:

> "ClubOS is a shared platform. All customers run the same version with
> feature flags for controlled rollout. If you have a regulatory
> requirement for physical isolation, we can discuss a premium tier
> with dedicated infrastructure. Otherwise, we recommend the standard
> deployment model."

---

## See Also

- [Architectural Charter](../ARCHITECTURAL_CHARTER.md) - Core principles
- [Delivery Model Strategy](../DELIVERY_MODEL_STRATEGY.md) - Solutions positioning
- [Deployment Readiness Checklist](../reliability/DEPLOYMENT_READINESS_CHECKLIST.md) - Pre-deploy gates
- [Work Queue](../backlog/WORK_QUEUE.md) - Implementation backlog

---

*This document is normative. Deviations require explicit decision memo
with risk acceptance by engineering leadership.*
