# ClubOS Multi-Tenancy Architecture Plan

Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

Status: Planning Document
Last updated: 2025-12-21

---

## 1. Definitions

### 1.1 What "Tenant" Means for ClubOS

A **tenant** is an independent club or organization operating as a distinct entity within ClubOS. Each tenant:

- Has its own member roster, events, committees, and governance records
- Has its own administrators with scoped permissions
- Cannot see or access data from other tenants
- May have its own domain or subdomain
- Operates under its own policies and workflows

Examples:
- Santa Barbara Newcomers Club = Tenant A
- Ventura County Newcomers = Tenant B
- Professional Association XYZ = Tenant C

Tenants are NOT:
- Chapters within a single organization (use Committee scoping instead)
- User groups within a tenant (use AudienceRule instead)
- Permission levels (use role assignments instead)

### 1.2 What "Data Isolation" Means (Hard Requirement)

Data isolation is a **non-negotiable guarantee** (Charter P2, P9):

- A query for Tenant A MUST NEVER return data from Tenant B
- A user authenticated to Tenant A MUST NOT access Tenant B APIs
- Errors in tenant resolution MUST fail closed (deny access, not guess)
- Cross-tenant data access MUST be impossible through normal APIs
- Admin/support access to multiple tenants requires explicit elevation

This is a **hard stop** per docs/reliability/READINESS_GAPS_AND_RISK_ACCEPTANCE.md Section 7:
"Unauthorized access without containment plan" cannot be accepted as a risk.

### 1.3 What "Shared" Means

Some resources MAY be shared across tenants for efficiency:

| Resource | Shared? | Notes |
|----------|---------|-------|
| Database server | Yes | Connection pooling, resource efficiency |
| Application infrastructure | Yes | Vercel deployment, edge functions |
| Static assets (JS, CSS) | Yes | CDN-cached, version-stamped |
| Email sending infrastructure | Yes | SMTP/provider shared, from-addresses per tenant |
| File storage buckets | Depends | Prefix-isolated within bucket OR separate buckets |
| Audit log infrastructure | Yes | Tenant-tagged, queried in isolation |
| Cron job runners | Yes | Tenant-scoped job execution |

Shared infrastructure MUST enforce tenant isolation at the data layer.

---

## 2. Data Model Strategy

### 2.1 Option A: tenantId Column on Every Table (RECOMMENDED)

Add a `tenantId` UUID column to every tenant-owned table. All queries include `WHERE tenantId = ?`.

**Implementation:**
```prisma
model Tenant {
  id        String   @id @default(uuid()) @db.Uuid
  slug      String   @unique  // "sbnc", "vcn"
  name      String
  domain    String?  @unique  // "sbnc.clubos.app" or "sbnewcomers.org"
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Member {
  id       String @id @default(uuid()) @db.Uuid
  tenantId String @db.Uuid
  // ... existing fields
  tenant   Tenant @relation(fields: [tenantId], references: [id])

  @@index([tenantId])
}
```

**Pros:**
- Single database, simple operations
- Standard Postgres tooling (backup, restore, monitoring)
- Easy to query across tenants for platform analytics (with explicit elevation)
- Well-understood pattern with extensive documentation
- Works with Prisma without extensions
- Supports per-tenant row-level security (RLS) if needed later

**Cons:**
- Every query must include tenantId (discipline required)
- Risk of tenant data leakage if WHERE clause forgotten
- Backup/restore is database-wide (not per-tenant)
- Large tenants share resources with small ones

**Operational Burden:**
- Moderate. Requires disciplined query patterns but no infrastructure changes.
- Backup: Single database backup. Tenant-specific restore requires data filtering.
- Monitoring: Add tenantId dimension to all metrics.

**Fits Solutions-First Posture:**
- Yes. Platform team controls all tenants, can assist any tenant, can move tenants if needed.

### 2.2 Option B: Schema-per-Tenant

Each tenant gets its own Postgres schema within the same database.

**Implementation:**
```sql
CREATE SCHEMA tenant_sbnc;
CREATE SCHEMA tenant_vcn;
-- Tables replicated in each schema
```

**Pros:**
- Strong isolation within same database
- Per-schema backup/restore possible
- No tenantId columns needed
- Clear separation visible in database tools

**Cons:**
- Prisma does not support runtime schema switching well
- Schema migrations must run N times (once per tenant)
- Connection pooling complexity (schema search_path per connection)
- Adding a tenant requires DDL operations
- Not a common pattern in Next.js/Prisma ecosystem

**Operational Burden:**
- High. Every migration is multiplied. Schema management becomes core competency.
- Not recommended for early-stage platform.

**Fits Solutions-First Posture:**
- Partially. Adds operational complexity that doesn't serve solutions goals.

### 2.3 Option C: Database-per-Tenant

Each tenant gets its own Postgres database.

**Implementation:**
```
clubos_sbnc (database)
clubos_vcn (database)
clubos_xyz (database)
```

**Pros:**
- Maximum isolation (no cross-tenant queries possible)
- Per-tenant backup/restore trivial
- Per-tenant resource limits possible
- Compliance-friendly (data residency, GDPR deletion)

**Cons:**
- Connection management across N databases
- Prisma Client instantiation per tenant (memory overhead)
- Migrations must run N times
- Platform analytics requires federated queries
- Hosting costs scale linearly with tenants
- Provisioning new tenant requires database creation (slow)

**Operational Burden:**
- Very high. Database provisioning, connection management, migration coordination.
- Only justified for enterprise/regulated customers.

**Fits Solutions-First Posture:**
- Only for premium tier where customer demands dedicated infrastructure.

### 2.4 Recommendation

**Use Option A (tenantId column) as the default model.**

Rationale:
1. ClubOS is solutions-first, not high-volume self-service SaaS
2. Initial customer count will be low (10s, not 1000s)
3. Prisma ecosystem support is strongest for single-database patterns
4. Tenant isolation is enforced at application layer with audit trail
5. Platform team maintains visibility across all tenants for support
6. Migration complexity is minimized

Option C (database-per-tenant) should be available as an upgrade path for:
- Customers requiring data residency
- Customers with regulatory isolation requirements
- Enterprise customers willing to pay premium

---

## 3. Prisma Changes

### 3.1 Proposed Tenant Model

```prisma
// ============================================================================
// MULTI-TENANCY FOUNDATION
// ============================================================================

model Tenant {
  id            String   @id @default(uuid()) @db.Uuid
  slug          String   @unique                         // URL-safe identifier
  name          String                                   // Display name
  domain        String?  @unique                         // Custom domain if any
  subdomain     String   @unique                         // {subdomain}.clubos.app
  isActive      Boolean  @default(true)
  suspendedAt   DateTime?
  suspendReason String?
  settings      Json?                                    // Tenant-specific config
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // All tenant-owned entities relate back here
  members       Member[]
  events        Event[]
  committees    Committee[]
  // ... all other tenant-scoped models
}
```

### 3.2 Where tenantId Would Be Required

**All tenant-scoped models need tenantId:**

| Model | Needs tenantId | Notes |
|-------|---------------|-------|
| Member | Yes | Core tenant data |
| UserAccount | Yes | Auth scoped to tenant |
| Session | Yes | Session includes tenantId for enforcement |
| Event | Yes | Events belong to tenant |
| EventRegistration | Yes (via Event) | Can derive from event.tenantId |
| Committee | Yes | Org structure per tenant |
| RoleAssignment | Yes (via Member) | Can derive |
| Term | Yes | Terms are tenant-specific |
| MembershipStatus | Shared OR per-tenant | Decision needed |
| MembershipTier | Yes | Pricing varies per tenant |
| Page | Yes | Content per tenant |
| Theme | Shared OR per-tenant | Platform themes vs custom |
| Template | Shared OR per-tenant | Platform templates vs custom |
| AudienceRule | Yes | Audience definitions per tenant |
| MailingList | Yes | Lists per tenant |
| MessageCampaign | Yes | Campaigns per tenant |
| AuditLog | Yes | Audit isolation critical |
| GovernanceMeeting | Yes | Governance per tenant |
| GovernanceMinutes | Yes | Minutes per tenant |
| FileObject | Yes | Files per tenant |
| SupportCase | Yes | Support scoped to tenant |

**Models that MAY be shared (platform-level):**

| Model | Shared | Justification |
|-------|--------|---------------|
| Theme (platform defaults) | Yes | "ClubOS Classic" theme shared |
| Template (platform defaults) | Yes | Standard email templates |
| EmailTrackingConfig | One per tenant | Config varies by tenant |
| JobRun | Per tenant | Job execution is tenant-scoped |

### 3.3 Enforcing Tenant Scoping in Queries

**Pattern 1: Prisma Client Extension (Recommended)**

Create a tenant-scoped Prisma client that automatically injects tenantId:

```typescript
// src/lib/db/tenant-client.ts

import { PrismaClient } from '@prisma/client';

export function createTenantClient(tenantId: string) {
  const prisma = new PrismaClient();

  return prisma.$extends({
    query: {
      $allModels: {
        async findMany({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findUnique({ args, query }) {
          // findUnique must validate tenantId post-fetch
          const result = await query(args);
          if (result && result.tenantId !== tenantId) {
            throw new Error('Tenant mismatch');
          }
          return result;
        },
        async create({ args, query }) {
          args.data = { ...args.data, tenantId };
          return query(args);
        },
        async update({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async delete({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
      },
    },
  });
}
```

**Pattern 2: Request Context Middleware**

```typescript
// src/lib/tenant/context.ts

import { AsyncLocalStorage } from 'async_hooks';

interface TenantContext {
  tenantId: string;
  tenantSlug: string;
}

export const tenantStorage = new AsyncLocalStorage<TenantContext>();

export function getTenantId(): string {
  const context = tenantStorage.getStore();
  if (!context) {
    throw new Error('No tenant context - fail closed');
  }
  return context.tenantId;
}
```

**Pattern 3: Helper Functions (Transitional)**

```typescript
// src/lib/db/queries.ts

export function withTenant<T extends { tenantId?: string }>(
  tenantId: string,
  where: T
): T & { tenantId: string } {
  return { ...where, tenantId };
}

// Usage:
await prisma.member.findMany({
  where: withTenant(tenantId, { membershipStatusId: statusId }),
});
```

**Lint Rule Idea:**

Create an ESLint rule that flags Prisma queries missing tenantId:

```javascript
// eslint-plugin-clubos/rules/require-tenant-scope.js
// Flags: prisma.member.findMany({ where: { ... } })
// When tenantId is not present in the where clause
```

### 3.4 Migration Strategy for Existing Tables

1. Add `tenantId` column as nullable
2. Backfill with default tenant (SBNC) for existing data
3. Add NOT NULL constraint
4. Add foreign key to Tenant table
5. Add index on tenantId

```sql
-- Step 1: Add nullable column
ALTER TABLE "Member" ADD COLUMN "tenantId" UUID;

-- Step 2: Backfill (assuming default tenant exists)
UPDATE "Member" SET "tenantId" = (
  SELECT id FROM "Tenant" WHERE slug = 'sbnc'
);

-- Step 3: Add NOT NULL
ALTER TABLE "Member" ALTER COLUMN "tenantId" SET NOT NULL;

-- Step 4: Add FK
ALTER TABLE "Member"
  ADD CONSTRAINT "Member_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id");

-- Step 5: Add index
CREATE INDEX "Member_tenantId_idx" ON "Member"("tenantId");
```

---

## 4. Auth and Routing

### 4.1 How Tenant Is Resolved

**Primary: Subdomain-based resolution**

```
sbnc.clubos.app       -> Tenant: SBNC
vcn.clubos.app        -> Tenant: VCN
app.clubos.app        -> Tenant selector (if authenticated to multiple)
```

**Secondary: Custom domain resolution**

```
sbnewcomers.org       -> Tenant: SBNC (via Tenant.domain lookup)
members.vcnclub.org   -> Tenant: VCN
```

**Fallback: Path prefix (for development/admin)**

```
clubos.app/t/sbnc/... -> Tenant: SBNC (requires platform admin)
```

**Resolution Logic:**

```typescript
// src/lib/tenant/resolver.ts

export async function resolveTenant(request: Request): Promise<Tenant | null> {
  const host = request.headers.get('host');

  // 1. Check custom domain
  const byDomain = await prisma.tenant.findUnique({
    where: { domain: host, isActive: true },
  });
  if (byDomain) return byDomain;

  // 2. Check subdomain
  const subdomain = extractSubdomain(host);
  if (subdomain && subdomain !== 'app' && subdomain !== 'www') {
    const bySubdomain = await prisma.tenant.findUnique({
      where: { subdomain, isActive: true },
    });
    if (bySubdomain) return bySubdomain;
  }

  // 3. Check path prefix (admin only)
  const pathTenant = extractPathTenant(request.url);
  if (pathTenant) {
    // Requires platform admin session
    return await resolvePathTenant(pathTenant, request);
  }

  // 4. Fail closed
  return null;
}
```

### 4.2 How Admin UI Chooses Tenant

**For single-tenant users:** Automatic. Session is bound to tenant.

**For multi-tenant users (platform admins):**

1. Platform admin dashboard shows tenant list
2. Admin explicitly selects tenant to "enter"
3. Session records active tenantId
4. All subsequent requests scoped to that tenant
5. "Switch tenant" action available in header

```typescript
// Session includes both user identity AND current tenant
interface SessionData {
  userId: string;
  tenantId: string;           // Current active tenant
  authorizedTenants: string[]; // Tenants user can access
  globalRole?: 'platform_admin' | 'platform_support';
}
```

### 4.3 How API Routes Enforce Tenant Scope

**Middleware chain:**

```typescript
// src/middleware.ts (Next.js middleware)

export async function middleware(request: NextRequest) {
  // 1. Resolve tenant from request
  const tenant = await resolveTenant(request);
  if (!tenant) {
    return NextResponse.json(
      { error: 'Tenant not found' },
      { status: 404 }
    );
  }

  // 2. Add tenant to request headers (internal)
  const headers = new Headers(request.headers);
  headers.set('x-tenant-id', tenant.id);
  headers.set('x-tenant-slug', tenant.slug);

  // 3. Continue with modified request
  return NextResponse.next({ headers });
}
```

**Route handler pattern:**

```typescript
// src/app/api/members/route.ts

export async function GET(request: Request) {
  // 1. Get tenant from context (injected by middleware)
  const tenantId = getTenantIdFromRequest(request);

  // 2. Get authenticated user
  const session = await getSession(request);
  if (!session || session.tenantId !== tenantId) {
    return unauthorized();
  }

  // 3. Use tenant-scoped client
  const db = createTenantClient(tenantId);
  const members = await db.member.findMany();

  return Response.json(members);
}
```

**Audit logging:**

Every API request logs:
- `tenantId`
- `userId`
- `action`
- `resourceType`
- `resourceId`
- `ipAddress`

Cross-tenant access attempts are logged as security events.

---

## 5. Migration Plan

### 5.1 Steps to Migrate from Single-Tenant to Multi-Tenant

**Phase 1: Foundation (No User Impact)**

1. Create Tenant model in schema
2. Create default tenant record for SBNC
3. Add tenantId columns as nullable to all models
4. Deploy schema changes
5. Run backfill script to set tenantId = SBNC for all existing data
6. Add NOT NULL constraints
7. Add foreign keys and indexes

**Phase 2: Application Layer (Internal Changes)**

1. Implement tenant resolution middleware
2. Create tenant-scoped Prisma client
3. Update all queries to use tenant-scoped client
4. Add tenant context to session model
5. Update auth flows to include tenantId
6. Add tenant to all audit log entries

**Phase 3: Routing (External Changes)**

1. Configure subdomain for SBNC (sbnc.clubos.app)
2. Update DNS for existing domain
3. Test custom domain resolution
4. Deploy tenant-aware routing

**Phase 4: Verification**

1. Verify all queries include tenantId
2. Run security audit for cross-tenant access
3. Test backup/restore procedures
4. Update monitoring dashboards
5. Document operational procedures

**Phase 5: Second Tenant**

1. Create new tenant record
2. Configure subdomain/domain
3. Onboard first users
4. Verify isolation

### 5.2 Backward Compatibility Assumptions

- Existing SBNC data remains accessible at same URLs
- Existing user accounts continue working
- Existing sessions remain valid (migrated to include tenantId)
- Existing API integrations (if any) require update for tenant header
- Existing cron jobs updated to iterate tenants

### 5.3 Rollback Plan

**If issues discovered after Phase 1:**
- Remove NOT NULL constraints
- Set tenantId = NULL
- Drop Tenant table
- Revert to single-tenant codebase

**If issues discovered after Phase 2-3:**
- Redirect all traffic to sbnc.clubos.app
- Disable tenant resolution middleware
- Hardcode tenantId in session
- Revert routing changes

**Data is preserved in all rollback scenarios** - tenantId column can remain even if unused.

---

## 6. Hard Stops / Risks

### Risk 1: Cross-Tenant Data Leakage

**Severity:** Critical (Hard Stop)
**Description:** Query without tenantId filter returns data from wrong tenant.
**Mitigation:**
- Tenant-scoped Prisma client enforces filter automatically
- ESLint rule flags bare queries
- Postgres RLS as defense-in-depth (future)
- Automated tests for isolation
**Risk Acceptance:** Not acceptable. Must be verified before deployment.
**Reference:** READINESS_GAPS_AND_RISK_ACCEPTANCE.md Section 7

### Risk 2: Tenant Resolution Failure

**Severity:** High
**Description:** Request cannot determine tenant, but proceeds anyway.
**Mitigation:**
- Fail closed: no tenant = 404, not guess
- Middleware prevents request processing without tenant
- Audit log captures resolution failures
**Risk Acceptance:** Acceptable if fail-closed is verified.

### Risk 3: Session Tenant Mismatch

**Severity:** High
**Description:** User authenticated to Tenant A accesses Tenant B subdomain.
**Mitigation:**
- Session includes tenantId
- Middleware compares request tenant to session tenant
- Mismatch = force re-authentication or switch confirmation
**Risk Acceptance:** Acceptable with explicit handling.

### Risk 4: Backup/Restore Complexity

**Severity:** Medium
**Description:** Single database backup makes per-tenant restore difficult.
**Mitigation:**
- Document tenant-specific restore procedure (filter by tenantId)
- Test restore procedure before production
- Consider pg_dump with WHERE clause for tenant-specific backup
**Risk Acceptance:** Acceptable for initial deployment with documented procedure.
**Reference:** READINESS_GAPS_AND_RISK_ACCEPTANCE.md Section 5

### Risk 5: Performance Degradation at Scale

**Severity:** Medium
**Description:** Shared database performance degrades with many tenants.
**Mitigation:**
- Add tenantId to all query indexes
- Monitor query performance by tenant
- Connection pooling with tenant-aware routing
- Plan database-per-tenant upgrade path for large customers
**Risk Acceptance:** Acceptable for initial scale (< 100 tenants).

### Risk 6: Migration Data Corruption

**Severity:** High
**Description:** Backfill script assigns wrong tenantId to existing data.
**Mitigation:**
- Backfill in transaction
- Verify counts before/after
- Test on staging first
- Backup before migration
**Risk Acceptance:** Acceptable with verified procedure.

### Risk 7: Domain/Subdomain Conflicts

**Severity:** Low
**Description:** Two tenants claim same subdomain or conflicting domains.
**Mitigation:**
- UNIQUE constraints on subdomain and domain
- Validation on tenant creation
- DNS verification for custom domains
**Risk Acceptance:** Acceptable with constraints.

### Risk 8: Cron Job Tenant Iteration

**Severity:** Medium
**Description:** Cron jobs must process all tenants; failure in one affects others.
**Mitigation:**
- Per-tenant job isolation (catch errors, continue to next)
- JobRun tracks per-tenant status
- Alert on per-tenant failures
**Risk Acceptance:** Acceptable with error isolation.

### Risk 9: Platform Admin Access Logging

**Severity:** Medium
**Description:** Platform admins accessing multiple tenants lack sufficient audit trail.
**Mitigation:**
- All admin access logged with both admin identity and target tenant
- Impersonation tracking already in Session model
- Admin actions require explicit tenant selection
**Risk Acceptance:** Acceptable with enhanced logging.

### Risk 10: Customer Data Portability

**Severity:** Low (but contractually relevant)
**Description:** Customer requests full data export; tenantId filtering required.
**Mitigation:**
- Build tenant-scoped export function
- Include all related tables
- Document export format
**Risk Acceptance:** Acceptable; build before customer requests.

---

## 7. Implementation Checklist

### Before Starting

- [ ] Review and approve this plan
- [ ] Identify pilot second tenant (or use test tenant)
- [ ] Ensure backup procedures are verified
- [ ] Update READINESS_GAPS_AND_RISK_ACCEPTANCE.md

### Phase 1: Schema

- [ ] Add Tenant model to Prisma schema
- [ ] Add tenantId to all tenant-scoped models
- [ ] Create migration
- [ ] Create backfill script
- [ ] Test on staging

### Phase 2: Application

- [ ] Implement tenant resolution
- [ ] Implement tenant-scoped Prisma client
- [ ] Update all queries (use grep to find bare prisma.X calls)
- [ ] Update session model
- [ ] Update auth flows
- [ ] Add ESLint rule (optional but recommended)

### Phase 3: Routing

- [ ] Configure DNS for subdomains
- [ ] Update Vercel configuration
- [ ] Test custom domain resolution
- [ ] Update existing links/redirects

### Phase 4: Verification

- [ ] Security audit for cross-tenant access
- [ ] Performance testing
- [ ] Backup/restore verification
- [ ] Monitoring updates
- [ ] Documentation updates

---

## See Also

- [ARCHITECTURAL_CHARTER.md](../ARCHITECTURAL_CHARTER.md) - Non-negotiable principles (P1-P10, N1-N8)
- [DELIVERY_MODEL_STRATEGY.md](../DELIVERY_MODEL_STRATEGY.md) - Solutions-first rationale
- [DEPLOYMENT_READINESS_CHECKLIST.md](../reliability/DEPLOYMENT_READINESS_CHECKLIST.md) - Pre-deploy gates
- [READINESS_GAPS_AND_RISK_ACCEPTANCE.md](../reliability/READINESS_GAPS_AND_RISK_ACCEPTANCE.md) - Risk tracking
- [ENGINEERING_PHILOSOPHY.md](../ENGINEERING_PHILOSOPHY.md) - Development principles
- [RECOVERY_AND_RESTORATION.md](../reliability/RECOVERY_AND_RESTORATION.md) - Backup/restore procedures
