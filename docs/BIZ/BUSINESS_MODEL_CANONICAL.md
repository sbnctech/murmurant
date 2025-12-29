# Murmurant Business Model - Canonical Specification

```
Status: DRAFT - Pending stakeholder review
Version: 1.0
Last Updated: 2025-12-24
Derived From: _ARCHIVE/CHATGPT_BUSINESS_MODEL_WORKING_NOTES.md
Related: Epic #248
```

---

## Overview

This document defines the canonical business model rules for Murmurant.
It separates **decisions** (what we will do) from **rationale** (why).

For rationale, see: [ChatGPT Working Notes](./_ARCHIVE/CHATGPT_BUSINESS_MODEL_WORKING_NOTES.md)

---

## Value Proposition

Murmurant offers **migration-first, safety-first adoption** for organizations
moving from Wild Apricot (or similar platforms) to a modern, self-hostable
club management system.

Core promises to operators:

- **Migration safety**: Staged approach with verification at each step
- **Operator confidence**: Runbooks, deterministic tooling, clear abort criteria
- **Rollback capability**: Never burn bridges; always reversible until cutover
- **Transparency**: No hidden rules, no black-box behavior

---

## Customer Journey: Staged Migration

The "wing-walking" approach ensures organizations never let go of one handhold
before firmly grasping the next:

| Stage | Description |
|-------|-------------|
| 1. Observe/Export | Extract data from Wild Apricot via CSV exports |
| 2. Import | Load data into Murmurant using migration tooling |
| 3. Verify | Run verification scripts; operator spot-checks |
| 4. Shadow | Run Murmurant in parallel; compare behavior |
| 5. Decide | Organization makes go/no-go decision |
| 6. Cutover | Switch production traffic; decommission WA |

Each stage has entry/exit criteria. Operators control the pace.
See [MIGRATION_PHILOSOPHY.md](./MIGRATION_PHILOSOPHY.md) for details.

---

## Core Business Model Rules

### Rule 1: Single-Tenant Deployment

| Aspect | Specification |
|--------|---------------|
| Deployment model | One Murmurant instance per organization |
| Database | Separate database per organization |
| Infrastructure | Per-org deployment (not shared compute) |
| Status | **DECIDED** for Phase 1 |

**Future consideration:** Multi-tenant SaaS is Phase 2+.

### Rule 2: Organization-Specific Policy

| Aspect | Specification |
|--------|---------------|
| Tiers | Configurable per organization |
| Role names | Configurable per organization |
| Lifecycle thresholds | Configurable per organization |
| Workflows | Configurable per organization |
| Status | **DECIDED** |

**Constraint:** Platform invariants (auth, audit, RBAC model) are NOT configurable.

See: #232, #263

### Rule 3: Assisted Migration

| Aspect | Specification |
|--------|---------------|
| Migration approach | Assisted (platform team helps), not self-service |
| Data source | Wild Apricot (primary), others TBD |
| Direction | One-way (WA -> Murmurant) |
| Sync mode | Explicit import operations, not continuous |
| Status | **DECIDED** |

**Constraint:** No bidirectional sync. No automated background sync.

See: #202

### Rule 4: Operator-in-the-Loop

| Aspect | Specification |
|--------|---------------|
| Migration | Requires operator confirmation |
| Bulk operations | Require preview and confirmation |
| Destructive operations | Require extra confirmation |
| Policy changes | Require review |
| Status | **DECIDED** |

**Constraint:** Full automation is explicitly NOT a goal.

### Rule 5: No Free Tier

| Aspect | Specification |
|--------|---------------|
| Free tier | Not planned |
| Trial | May offer time-limited trials |
| Pricing | All organizations pay |
| Status | **DECIDED** |

---

## Commercialization Stance

### Platform vs Policy Separation

Murmurant is a **platform** that supports multiple organizations with
different policies. SBNC (Santa Barbara Newcomers Club) is "Tenant Zero":

- SBNC provides seed data, templates, and real-world validation
- SBNC policies are **never required** for other tenants
- Other organizations bring their own policies
- Platform behavior is policy-driven, not hardcoded

This separation is mandatory for commercialization. See Epic #232.

### Tenant Zero Model

- SBNC is the first customer and primary test bed
- Lessons learned inform platform design
- But: no SBNC-specific logic in platform code
- Policy isolation enables multi-tenant deployment

---

## Scope Boundaries

### In Scope for Murmurant

| Capability | Description |
|------------|-------------|
| Member management | Member records, profiles, lifecycle |
| Event management | Event creation, registration, attendance |
| Role-based access | Capability-based authorization |
| Governance | Minutes, motions, workflows |
| Communications | Member messaging, announcements |

### Explicitly Out of Scope

| Capability | Reason |
|------------|--------|
| Website hosting/CMS | Not a website builder |
| Payment processing | Integrate with Stripe, don't build |
| Email marketing | Integrate with external tools |
| WA feature parity | Not a WA clone |
| Real-time external sync | Explicit imports only |

---

## Terminology

| Term | Definition |
|------|------------|
| **Tier** | Member classification based on tenure or plan (org-specific) |
| **Capability** | RBAC permission to perform an action (platform concept) |
| **Entitlement** | Feature/service access based on tier/plan (product concept) |
| **Limit** | Quantitative usage boundary (operational concept) |
| **Policy** | Organization-specific configuration (not platform invariant) |
| **Invariant** | Platform behavior that cannot be changed per-org |

---

## What Must Be True for v1 Success

1. **Verification tooling works**: ID mappings, count checks, spot-check scripts
2. **Rollback is always possible**: Until cutover, WA remains authoritative
3. **Determinism**: Same input produces same output; bundles are reproducible
4. **Runbooks exist**: Operators have step-by-step guides for every phase
5. **Abort criteria are clear**: Operators know when to stop and investigate

---

## Decision Status Summary

| Decision | Status | Notes |
|----------|--------|-------|
| Single-tenant deployment | DECIDED | Phase 1 |
| Organization-specific policy | DECIDED | Foundation for commercialization |
| Assisted migration | DECIDED | Platform team assists onboarding |
| Operator-in-the-loop | DECIDED | Humans approve consequential ops |
| No free tier | DECIDED | All orgs pay |
| Pricing model | DEFERRED | Needs market validation |
| Payment integration | DEFERRED | Depends on pricing |
| Multi-org management | DEFERRED | Phase 2+ |

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [PRICING_AND_ENTITLEMENTS.md](./PRICING_AND_ENTITLEMENTS.md) | Tier and entitlement rules |
| [BILLING_INVARIANTS.md](./BILLING_INVARIANTS.md) | Billing safety requirements |
| [MIGRATION_PHILOSOPHY.md](./MIGRATION_PHILOSOPHY.md) | Migration approach details |
| [Working Notes](./_ARCHIVE/CHATGPT_BUSINESS_MODEL_WORKING_NOTES.md) | Rationale and context |
| Epic #248 | Business Model |
| Epic #232 | Policy Isolation |
| Epic #202 | WA Migration |

---

## Acceptance Criteria

This document is considered complete when:

- [ ] Stakeholder review completed
- [ ] Child documents (pricing, billing) finalized
- [ ] Engineering sign-off on feasibility
- [ ] Linked to Epic #248

---

_This is a living document. Changes require stakeholder approval._
