# Tenant Isolation Verification

**Status:** Audit Complete
**Scope:** Code path review for multi-tenancy readiness
**Auditor:** Worker 3
**Date:** 2025-12-21

---

## Purpose

This document verifies the current state of tenant isolation in ClubOS.
Goal: Answer the question **"Can one tenant affect another, even during
partial failure?"**

**Current Answer: N/A (Single-Tenant)**

ClubOS is currently single-tenant. There is no multi-tenant infrastructure
in place. This document identifies what would need to change for safe
multi-tenancy.

---

## Executive Summary

| Area | Current State | Risk Level | Action Required |
|------|---------------|------------|-----------------|
| Database Schema | No tenant_id columns | CRITICAL | Add tenant scoping to all tables |
| Prisma Middleware | None | CRITICAL | Add tenant filter/inject middleware |
| Row-Level Security | Not implemented | HIGH | Add RLS policies |
| Session/Auth | No tenant context | CRITICAL | Add tenantId to session |
| API Middleware | No tenant validation | CRITICAL | Add global tenant middleware |
| Shared State | 3 module-level caches | MEDIUM | Key by tenant or use AsyncLocalStorage |
| Environment Config | Single-tenant assumptions | HIGH | Per-tenant config needed |
| Storage | No tenant prefix | HIGH | Add tenant prefix to storage keys |
| Unique Constraints | Global uniqueness | HIGH | Convert to @@unique([tenantId, ...]) |

**Verdict:** Multi-tenancy is not currently implemented. All layers need
modification before a second tenant can be safely onboarded.

---

## Detailed Findings

### 1. Database Layer

#### 1.1 No Tenant Model

The Prisma schema has no `Tenant` or `Organization` model.

```
FINDING: No model Tenant in prisma/schema.prisma
RISK: CRITICAL
REQUIRED: Add Tenant model before Phase 0
```

#### 1.2 No tenant_id Columns

No tables have tenant_id columns.

```
FINDING: grep -r "tenantId" prisma/schema.prisma returns 0 matches
FINDING: grep -r "tenant_id" prisma/schema.prisma returns 0 matches
RISK: CRITICAL
REQUIRED: Add tenantId to all tenant-scoped tables (see ARCHITECTURE_MULTITENANCY.md Section 7.2)
```

#### 1.3 Global Unique Constraints

Many unique constraints would prevent the same data in different tenants:

| Table | Column | Current Constraint | Required Change |
|-------|--------|-------------------|-----------------|
| Member | email | `@unique` | `@@unique([tenantId, email])` |
| UserAccount | email | `@unique` | `@@unique([tenantId, email])` |
| UserAccount | memberId | `@unique` | `@@unique([tenantId, memberId])` |
| MembershipStatus | code | `@unique` | `@@unique([tenantId, code])` |
| MembershipTier | code | `@unique` | `@@unique([tenantId, code])` |
| Committee | slug | `@unique` | `@@unique([tenantId, slug])` |
| CommitteeRole | [committeeId, slug] | `@@unique` | OK (committee already tenant-scoped) |
| Page | slug | `@unique` | `@@unique([tenantId, slug])` |
| Theme | slug | `@unique` | `@@unique([tenantId, slug])` |
| Template | slug | `@unique` | `@@unique([tenantId, slug])` |
| Navigation | slug | `@unique` | `@@unique([tenantId, slug])` |
| MailingList | slug | `@unique` | `@@unique([tenantId, slug])` |
| MessageTemplate | slug | `@unique` | `@@unique([tenantId, slug])` |
| EmailSuppressionList | email | `@unique` | `@@unique([tenantId, email])` |

```
RISK: HIGH
REQUIRED: Update all unique constraints to include tenantId
```

#### 1.4 No Row-Level Security

No RLS policies exist in the database.

```
FINDING: No RLS configuration in codebase
RISK: HIGH (defense-in-depth gap)
REQUIRED: Add RLS policies per ARCHITECTURE_MULTITENANCY.md Appendix B
```

#### 1.5 Prisma Client Configuration

```typescript
// src/lib/prisma.ts
export const prisma: PrismaClient =
  global.__clubosPrisma ?? createPrismaClient();
```

Single Prisma client (correct). No tenant middleware.

```
FINDING: No Prisma middleware for tenant filtering
RISK: CRITICAL
REQUIRED: Add middleware per ARCHITECTURE_MULTITENANCY.md Appendix A
```

---

### 2. API Layer

#### 2.1 Session Model Has No Tenant

```prisma
model Session {
  id            String    @id @default(uuid()) @db.Uuid
  tokenHash     String    @unique
  userAccountId String    @db.Uuid
  email         String
  globalRole    String
  // ... no tenantId
}
```

```
FINDING: Session model has no tenantId field
RISK: CRITICAL
REQUIRED: Add tenantId to Session model
```

#### 2.2 No Global Middleware

```
FINDING: No src/middleware.ts file exists
RISK: CRITICAL
REQUIRED: Create middleware for tenant extraction and validation
```

#### 2.3 No Tenant Validation in Routes

API routes check user authentication but not tenant access.

```typescript
// Example from auth.ts
export async function requireAuth(req: NextRequest) {
  // Checks session exists
  // Does NOT check tenant access
}
```

```
RISK: CRITICAL
REQUIRED: Add tenant validation to requireAuth and all route guards
```

#### 2.4 Audit Logs Missing Tenant

```prisma
model AuditLog {
  id           String      @id @default(uuid()) @db.Uuid
  action       AuditAction
  resourceType String
  resourceId   String      @db.Uuid
  memberId     String?     @db.Uuid
  // ... no tenantId
}
```

```
FINDING: AuditLog has no tenantId column
RISK: MEDIUM (can't filter audits by tenant)
REQUIRED: Add tenantId to AuditLog
```

#### 2.5 JobRun Missing Tenant

```prisma
model JobRun {
  id           String       @id @default(uuid()) @db.Uuid
  jobName      String
  scheduledFor DateTime     @db.Date
  // ... no tenantId
}
```

```
FINDING: JobRun has no tenantId column
RISK: MEDIUM (background jobs not tenant-scoped)
REQUIRED: Add tenantId to JobRun
```

---

### 3. Shared Mutable State

#### 3.1 Module-Level Caches

| Location | Variable | Risk | Mitigation |
|----------|----------|------|------------|
| `src/lib/importing/wildapricot/client.ts:35` | `tokenCache` | HIGH | Key by tenant or separate client per tenant |
| `src/lib/policies/loader.ts:75` | `cachedRegistry` | LOW | Policies are org-specific, cache per tenant |
| `src/lib/payments/fake-provider.ts:290` | `fakeProviderInstance` | LOW | Test-only, clear between tenants |

```
FINDING: 3 module-level mutable variables found
RISK: MEDIUM (potential data leakage if not cleared between tenant contexts)
REQUIRED: Use AsyncLocalStorage for tenant context, key caches by tenantId
```

#### 3.2 Global Prisma Instance

```typescript
// src/lib/prisma.ts
global.__clubosPrisma = prisma;
```

```
FINDING: Single global Prisma instance
RISK: LOW (correct pattern, but needs tenant middleware added)
STATUS: OK (expected for connection pooling)
```

---

### 4. Implicit Tenant Assumptions

#### 4.1 Environment Variables

Single-tenant configuration via environment:

| Variable | Current Assumption | Multi-Tenant Requirement |
|----------|-------------------|--------------------------|
| `WA_API_KEY` | One WA account | Per-tenant WA credentials |
| `WA_ACCOUNT_ID` | One WA account | Per-tenant config |
| `PASSKEY_RP_ID` | Single domain | Per-tenant RP config or shared |
| `PASSKEY_ORIGIN` | Single origin | Per-tenant origins |
| `BASE_URL` | Single URL | Per-tenant URLs or path routing |
| `FILE_STORAGE_S3_BUCKET` | Single bucket | Shared bucket OK with tenant prefix |

```
FINDING: Environment assumes single tenant
RISK: HIGH
REQUIRED: Tenant settings table for per-tenant configuration
```

#### 4.2 Storage Keys

```typescript
// src/lib/files/storage.ts:449
export function generateStorageKey(originalFilename: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const uuid = crypto.randomUUID();
  return `${year}/${month}/${uuid}-${sanitized}`;
}
```

```
FINDING: Storage keys have no tenant prefix
RISK: HIGH (files from different tenants in same namespace)
REQUIRED: Add tenant prefix: `${tenantId}/${year}/${month}/${uuid}-${filename}`
```

#### 4.3 Mock Email Log

```typescript
// src/lib/email.ts:24
const LOG_FILE = path.join(process.cwd(), "tmp", "mock-email-log.json");
```

```
FINDING: Single mock email log file for all tenants
RISK: LOW (dev-only, but could leak data in testing)
REQUIRED: Per-tenant mock log or clear between tests
```

---

### 5. Confirmed Safe Areas

| Area | Status | Notes |
|------|--------|-------|
| Authorization is server-side | SAFE | No client-only gating (Charter N1 compliant) |
| Capability-based RBAC | SAFE | Can be extended with tenant scope |
| Audit logging infrastructure | SAFE | Just needs tenantId added |
| Soft delete pattern | SAFE | Data recoverable |
| State machines are explicit | SAFE | Charter P3 compliant |
| Finance domain isolation | SAFE | Already implemented (see FINANCE_SAFETY_MVP_FINAL.md) |
| Impersonation has audit | SAFE | IMPERSONATION_START/END logged |

---

### 6. Risk Assessment for Partial Failure

**Question:** If multi-tenancy were partially implemented, could one tenant
affect another?

| Failure Scenario | Current Risk | With Tenant Middleware | With RLS |
|------------------|--------------|------------------------|----------|
| Missing WHERE clause | Data exposed | Blocked by middleware | Blocked by RLS |
| Direct DB query | Data exposed | Data exposed | Blocked by RLS |
| Cache poisoning | Token reuse | Blocked (keyed cache) | N/A |
| Background job leak | Data exposed | Blocked (job has tenant) | Blocked by RLS |
| Storage path guessing | Files exposed | Blocked (tenant prefix) | N/A |
| Session hijacking | Full access | Limited to tenant | Limited to tenant |

**Conclusion:** Need both application middleware AND RLS for defense-in-depth.

---

## Required Changes Summary

### Phase 0: Schema Preparation

- [ ] Add `model Tenant` to Prisma schema
- [ ] Add `tenantId` column to all tenant-scoped tables
- [ ] Update unique constraints to include tenantId
- [ ] Create migration setting all existing rows to SBNC tenant
- [ ] Add `tenantId` to Session model
- [ ] Add `tenantId` to AuditLog model
- [ ] Add `tenantId` to JobRun model

### Phase 1: Application Layer

- [ ] Create `src/middleware.ts` for tenant extraction
- [ ] Add Prisma middleware for tenant filtering (reads)
- [ ] Add Prisma middleware for tenant injection (writes)
- [ ] Update all API guards to validate tenant access
- [ ] Key all module-level caches by tenantId
- [ ] Add tenant prefix to storage keys

### Phase 2: Database Layer (RLS)

- [ ] Enable RLS on all tenant-scoped tables
- [ ] Create tenant isolation policies
- [ ] Configure session variable for tenant context
- [ ] Create platform bypass policy for support
- [ ] Test RLS blocks cross-tenant access

### Phase 3: Configuration

- [ ] Create TenantSettings table
- [ ] Move per-tenant config from env vars to database
- [ ] Support per-tenant WA credentials (future)
- [ ] Support per-tenant email settings (future)

---

## Verification Tests Needed

Once multi-tenancy is implemented, these tests must pass:

### Unit Tests

| Test | Description |
|------|-------------|
| T-ISO-001 | Query without tenant context throws error |
| T-ISO-002 | Query with Tenant A context returns no Tenant B data |
| T-ISO-003 | Create without tenant context throws error |
| T-ISO-004 | Create sets tenantId automatically from context |
| T-ISO-005 | Update cross-tenant is rejected |
| T-ISO-006 | Delete cross-tenant is rejected |

### Integration Tests

| Test | Description |
|------|-------------|
| T-ISO-101 | RLS blocks query without app.current_tenant set |
| T-ISO-102 | RLS allows query with correct tenant |
| T-ISO-103 | RLS blocks query with wrong tenant |
| T-ISO-104 | Platform bypass allows cross-tenant (support) |

### API Tests

| Test | Description |
|------|-------------|
| T-ISO-201 | API returns 401 without session |
| T-ISO-202 | API returns 403 for wrong tenant |
| T-ISO-203 | API returns data only for correct tenant |
| T-ISO-204 | Platform admin can access any tenant |

### E2E Tests

| Test | Description |
|------|-------------|
| T-ISO-301 | User from Tenant A sees only Tenant A events |
| T-ISO-302 | Search returns no results from other tenants |
| T-ISO-303 | Export includes only own tenant data |
| T-ISO-304 | Background job processes only own tenant |

---

## Confidence Statement

**Current State:**

> "ClubOS is single-tenant. There is no mechanism for a second tenant's
> data to exist in the system, therefore cross-tenant access is not
> possible."

**After Implementation:**

Once all items in "Required Changes Summary" are complete and all
"Verification Tests" pass, we can state:

> "One tenant cannot affect another, even during partial failure."

---

## Related Documents

- [ARCHITECTURE_MULTITENANCY.md](../ARCHITECTURE_MULTITENANCY.md) - Full architecture spike
- [MULTITENANT_RELEASE_READINESS.md](./MULTITENANT_RELEASE_READINESS.md) - Release gates
- [SYSTEM_GUARANTEES.md](./SYSTEM_GUARANTEES.md) - Architectural commitments
- [WA_FUTURE_FAILURE_IMMUNITY.md](../architecture/WA_FUTURE_FAILURE_IMMUNITY.md) - MF-3 (Coarse Permissions)

---

*This document is a point-in-time audit. Update when multi-tenancy
implementation progresses.*
