Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

# Tenant Versioning Reality Check

Status: Gap Analysis
Audience: Engineering, Architecture
Last updated: 2025-12-21

---

## Executive Summary

The TENANT_VERSIONING_STRATEGY.md document describes a mature multi-tenant
feature flag system. The actual codebase is a **single-tenant application**
with **one global feature flag**. There is a significant gap between
documented strategy and implementation reality.

**Key Finding:** ClubOS is currently single-tenant (SBNC only). Multi-tenant
infrastructure does not exist. The strategy document describes aspirational
architecture, not current state.

---

## 1. Version Flags: Exists vs Conceptual

| Flag/Mechanism | Documented | Implemented | Status |
|----------------|------------|-------------|--------|
| Feature flag service | Yes | No | CONCEPTUAL |
| Tenant-scoped flags | Yes | No | CONCEPTUAL |
| Environment-based flags | Yes | Yes (1 flag) | PARTIAL |
| Flag audit logging | Yes | No | CONCEPTUAL |
| Kill switch capability | Yes | No | CONCEPTUAL |
| Sunset tracking | Yes | No | CONCEPTUAL |
| Rollout dashboard | Yes | No | CONCEPTUAL |

### What Actually Exists

**One feature flag implemented:**

```
File: src/lib/config/featureFlags.ts

Flag: CLUBOS_ACH_ENABLED
Type: Environment variable (process.env)
Scope: Global (all users)
Usage: 4 files (payment-methods routes, ach-metrics)
```

This flag is:
- Environment-based (not database-backed)
- Global (not tenant-scoped)
- Not audited
- Has no kill switch beyond env var change
- Has no sunset tracking

---

## 2. Tenant Model: Does Not Exist

| Schema Element | Expected | Actual |
|----------------|----------|--------|
| Tenant/Organization model | Yes | **NOT PRESENT** |
| tenantId on tables | Yes | **NOT PRESENT** |
| organizationId on tables | Yes | **NOT PRESENT** |
| Tenant context in queries | Yes | **NOT PRESENT** |
| Tenant-scoped audit logs | Yes | **NOT PRESENT** |

**Implication:** ClubOS is currently a single-tenant system. All data
belongs to one organization (SBNC). Multi-tenant isolation does not
exist because there is only one tenant.

### Evidence

```bash
# No tenant/org model in schema
grep "model Organization\|model Tenant" prisma/schema.prisma
# Result: No matches found

# No tenantId in schema
grep "tenantId\|orgId\|organizationId" prisma/schema.prisma
# Result: No matches found

# No tenant context in src
grep -r "tenantId\|organizationId" src/
# Result: No files found
```

---

## 3. Missing Version Checks

The strategy document describes version checks that should exist but do not.

### 3.1 Feature Flag Checks

| Check | Location Expected | Status |
|-------|-------------------|--------|
| `featureFlags.isEnabled('feature', tenant.id)` | All feature-gated code | MISSING |
| Tenant context in flag evaluation | Flag service | MISSING |
| Flag state persistence | Database | MISSING |

**Current implementation:**

```typescript
// Actual: Global check, no tenant context
export function isAchEnabled(): boolean {
  const value = process.env.CLUBOS_ACH_ENABLED;
  return value === "1" || value === "true";
}

// Expected (per strategy doc):
// featureFlags.isEnabled('ach-payments', tenant.id)
```

### 3.2 Write Control Checks

| Check | Documented | Status |
|-------|------------|--------|
| Read-only mode per tenant | Section 4.4 | MISSING |
| Publish freeze per tenant | Section 4.4 | MISSING |
| Control state in admin dashboard | Section 4.4 | MISSING |

### 3.3 Rollout Stage Checks

| Check | Documented | Status |
|-------|------------|--------|
| Stage 1: Internal only | Section 3 | MISSING |
| Stage 2: Opt-in beta | Section 3 | MISSING |
| Stage 3: Percentage rollout | Section 3 | MISSING |
| Stage 4: General availability | Section 3 | MISSING |

---

## 4. Non-Negotiables Assessment

The strategy document lists non-negotiables. Here is their implementation status.

### 4.1 Data Isolation

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Tenant A cannot access Tenant B data | N/A | Single tenant only |
| All queries include tenant context | MISSING | No tenantId in schema |
| Cross-tenant queries impossible | N/A | Single tenant only |
| Unit tests enforce tenant scoping | MISSING | No tenant scoping exists |

**Assessment:** Data isolation is trivially satisfied because there is only
one tenant. When multi-tenancy is added, this must be implemented.

### 4.2 Restore Paths

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Tenant-specific restore possible | N/A | Single tenant only |
| Restore does not affect other tenants | N/A | Single tenant only |
| Quarterly restore drill | UNKNOWN | No evidence of drills |

### 4.3 Audit Logging

| Requirement | Status | Evidence |
|-------------|--------|----------|
| All admin actions logged with tenant context | PARTIAL | Audit exists, no tenantId |
| Audit logs tenant-scoped | MISSING | No tenantId field |
| Audit export per tenant | MISSING | No tenant concept |

### 4.4 Write/Publish Control

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Read-only mode per tenant | MISSING | No implementation |
| Publish freeze per tenant | MISSING | No implementation |
| Control state changes audited | MISSING | No implementation |
| Admin dashboard shows state | MISSING | No implementation |

---

## 5. Gaps Summary

### Critical Gaps (Block Multi-Tenancy)

| Gap | Impact | Priority |
|-----|--------|----------|
| No Tenant model | Cannot identify which org owns data | P0 |
| No tenantId on tables | Cannot isolate queries | P0 |
| No tenant context in feature flags | Cannot do per-tenant rollout | P0 |

### High Gaps (Block Safe Rollout)

| Gap | Impact | Priority |
|-----|--------|----------|
| No kill switch implementation | Cannot disable features without deploy | P1 |
| No flag audit logging | Cannot track who enabled what | P1 |
| No read-only mode | Cannot freeze tenant during incidents | P1 |
| No publish freeze | Cannot stop content changes during issues | P1 |

### Medium Gaps (Block Operational Excellence)

| Gap | Impact | Priority |
|-----|--------|----------|
| No sunset tracking | Old flags accumulate | P2 |
| No rollout dashboard | No visibility into flag state | P2 |
| No percentage rollout | Cannot do gradual rollout | P2 |

---

## 6. Recommended Fixes (No Implementation Yet)

### Phase 1: Single-Tenant Hardening (Current State)

Before adding multi-tenancy, harden the single-tenant system:

1. **Add kill switch infrastructure**
   - Create database-backed flag storage
   - Add admin UI to toggle flags
   - Add audit logging for flag changes

2. **Implement read-only mode**
   - Add global read-only flag
   - Gate all write operations behind check
   - Add admin toggle with confirmation

3. **Implement publish freeze**
   - Add global publish freeze flag
   - Gate all publish operations behind check
   - Add admin toggle with confirmation

### Phase 2: Multi-Tenant Foundation

Add tenant model before any multi-tenant features:

1. **Create Tenant schema**
   ```prisma
   model Tenant {
     id        String   @id @default(uuid())
     name      String
     slug      String   @unique
     status    TenantStatus @default(ACTIVE)
     createdAt DateTime @default(now())
     ...
   }
   ```

2. **Add tenantId to all user-data tables**
   - Member, Event, Registration, Payment, Page, etc.
   - Add database-level constraints
   - Add query filters at repository layer

3. **Add tenant context to all queries**
   - Create tenant context middleware
   - Enforce tenant scoping in repositories
   - Add unit tests for isolation

### Phase 3: Feature Flag Service

Implement proper feature flag infrastructure:

1. **Create FeatureFlag schema**
   ```prisma
   model FeatureFlag {
     id        String   @id @default(uuid())
     name      String   @unique
     enabled   Boolean  @default(false)
     tenantId  String?  // null = global
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
     ...
   }
   ```

2. **Implement flag service**
   - `isEnabled(flagName, tenantId?): boolean`
   - Database-backed with caching
   - Audit logging on changes

3. **Add admin UI**
   - View all flags
   - Enable/disable per tenant
   - View flag change history

---

## 7. Behavior Differences: Intentional vs Accidental

### Intentional Differences

| Behavior | Mechanism | Intentional? |
|----------|-----------|--------------|
| ACH payments enabled/disabled | Environment variable | Yes (documented) |
| SBNC-specific URLs | Environment variable | Yes (configurable) |

### Accidental Differences

| Risk | Current State | Concern |
|------|---------------|---------|
| No tenant isolation | Single-tenant only | N/A until multi-tenant |
| No per-tenant flags | Global flags only | Cannot do staged rollout |
| No kill switch | Deploy required | Slow incident response |

---

## 8. Conclusion

The tenant versioning strategy document describes mature infrastructure
that does not exist. The current system is:

- **Single-tenant** (SBNC only)
- **One global feature flag** (ACH payments)
- **No tenant model** in database
- **No per-tenant behavior** branching
- **No kill switch** or read-only mode

**Recommendation:** Update strategy document to reflect current state as
"Phase 0" and define incremental phases to reach documented state. Do not
add multi-tenant features until single-tenant hardening is complete.

---

## See Also

- TENANT_VERSIONING_STRATEGY.md (on branch docs/multitenancy-plan) - Strategy
- MULTITENANT_RELEASE_READINESS.md - Release gates (aspirational)
- src/lib/config/featureFlags.ts - Current feature flag implementation
