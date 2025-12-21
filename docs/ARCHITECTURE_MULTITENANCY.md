# ClubOS Multi-Tenancy Architecture Spike

Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

Status: Architecture Spike (Decision Pending)
Audience: Engineering, Architecture Review
Last updated: 2025-12-21

---

## 1. Purpose

This document evaluates multi-tenancy approaches for ClubOS, compares
implementation options, and recommends a path forward. ClubOS currently
operates as a single-tenant system for SBNC. This spike explores how to
support multiple organizations while maintaining the security, isolation,
and reliability guarantees defined in the Architectural Charter.

---

## 2. Tenancy Goals

### 2.1 Delivery Model Alignment

ClubOS follows a solutions-led delivery model (see DELIVERY_MODEL_STRATEGY.md).
This affects tenancy design:

| Consideration | Implication for Tenancy |
|---------------|------------------------|
| Solutions-first onboarding | Tenants are provisioned by platform team, not self-service signup |
| High-touch support | Tenant count will be low (tens, not thousands) initially |
| Data sensitivity | Member PII, financial records, governance history require strong isolation |
| Volunteer operators | Tenants cannot debug cross-tenant data leaks themselves |

**Conclusion:** Multi-tenancy must prioritize isolation guarantees over
operational efficiency. We are not optimizing for 10,000 tenants.

### 2.2 Tenant Isolation Requirements

| Requirement | Priority | Notes |
|-------------|----------|-------|
| Data isolation | MUST | Tenant A must never see Tenant B's data |
| Query isolation | MUST | Queries must be tenant-scoped by default |
| Performance isolation | SHOULD | One tenant's load should not degrade others |
| Schema isolation | MAY | Per-tenant schema customization is not required initially |
| Backup isolation | SHOULD | Per-tenant backup/restore without affecting others |
| Compliance isolation | MAY | Per-tenant data residency (future consideration) |

### 2.3 Admin Delegation Model

ClubOS supports delegated administration within tenants:

```
Platform Level (ClubOS Team)
    |
    +-- Tenant: SBNC
    |       +-- Org Admin (full tenant access)
    |       +-- Officers (scoped by role)
    |       +-- Committee Chairs (scoped by committee)
    |       +-- Members (self-service only)
    |
    +-- Tenant: Other Club
            +-- (same hierarchy)
```

Key constraints:
- Platform admins can access all tenants (for support/debugging)
- Org admins are scoped to their tenant only
- All existing RBAC (Charter P1, P2) applies within tenant scope
- Cross-tenant operations are forbidden at application level

### 2.4 Data Residency (Future)

Not required for initial multi-tenancy but worth noting:

- Some organizations may require data to stay in specific regions
- Database-per-tenant model supports this most easily
- Shared database model requires careful shard placement

**Initial stance:** All tenants in same region. Revisit if customer requires.

---

## 3. Tenancy Model Comparison

### 3.1 Model A: Shared Database with tenant_id Column

**Description:**
All tenants share a single database. Every table includes a `tenant_id`
column. All queries filter by tenant_id.

```
Database: clubos_prod
  +-- Table: Member (tenant_id, id, name, email, ...)
  +-- Table: Event (tenant_id, id, title, ...)
  +-- Table: Registration (tenant_id, id, member_id, event_id, ...)
```

**Advantages:**

| Advantage | Details |
|-----------|---------|
| Simple operations | Single database to backup, monitor, maintain |
| Easy migrations | One schema, one migration run |
| Resource efficient | Shared connection pool, no per-tenant overhead |
| Query flexibility | Cross-tenant analytics possible (for platform team) |

**Disadvantages:**

| Disadvantage | Risk Level | Mitigation |
|--------------|------------|------------|
| Query leaks | HIGH | Every query must include tenant filter; easy to forget |
| No performance isolation | MEDIUM | Noisy neighbor effects possible |
| Complex backup/restore | MEDIUM | Cannot restore single tenant without affecting others |
| Schema rigidity | LOW | All tenants must use same schema |

**Row-Level Security (RLS) Option:**

PostgreSQL RLS can enforce tenant isolation at the database level:

```sql
-- Pseudocode
ALTER TABLE member ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON member
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

RLS provides defense-in-depth but:
- Adds query overhead
- Requires careful session management
- Does not help with backup/restore isolation
- Complex to debug when policies conflict

**Implementation Effort:** Medium
**Isolation Confidence:** Medium (depends on discipline, improved with RLS)

---

### 3.2 Model B: Separate Schema Per Tenant

**Description:**
Single database with separate PostgreSQL schemas per tenant.
Each tenant's tables exist in their own namespace.

```
Database: clubos_prod
  +-- Schema: tenant_sbnc
  |     +-- Table: member
  |     +-- Table: event
  |
  +-- Schema: tenant_otherclub
        +-- Table: member
        +-- Table: event
```

**Advantages:**

| Advantage | Details |
|-----------|---------|
| Namespace isolation | No tenant_id column needed; schema provides separation |
| Simpler queries | No WHERE tenant_id clause on every query |
| Per-tenant backup | pg_dump can target specific schemas |
| Schema flexibility | Tenants could theoretically have different columns |

**Disadvantages:**

| Disadvantage | Risk Level | Mitigation |
|--------------|------------|------------|
| Migration complexity | HIGH | Must run migrations against each schema |
| Connection management | MEDIUM | Must set search_path per request |
| Prisma limitations | HIGH | Prisma does not natively support dynamic schemas |
| Operational overhead | MEDIUM | More schemas to manage, monitor, backup |

**Prisma Challenge:**

Prisma generates a client against a single schema at build time.
Dynamic schema switching requires:
- Multiple Prisma clients (one per tenant)
- Raw SQL with dynamic schema references
- Third-party extensions or workarounds

This significantly increases complexity for marginal isolation benefit
over RLS.

**Implementation Effort:** High
**Isolation Confidence:** High

---

### 3.3 Model C: Separate Database Per Tenant

**Description:**
Each tenant has their own PostgreSQL database.
Application routes requests to the correct database.

```
Database: clubos_sbnc
  +-- Table: member
  +-- Table: event

Database: clubos_otherclub
  +-- Table: member
  +-- Table: event
```

**Advantages:**

| Advantage | Details |
|-----------|---------|
| Strongest isolation | No possibility of cross-tenant data leaks at DB level |
| Independent backup/restore | Restore one tenant without affecting others |
| Performance isolation | Each tenant has dedicated resources |
| Data residency | Different databases can be in different regions |
| Simple queries | No tenant filtering or schema switching |

**Disadvantages:**

| Disadvantage | Risk Level | Mitigation |
|--------------|------------|------------|
| Connection overhead | HIGH | Need connection pool per tenant |
| Migration coordination | MEDIUM | Must apply migrations to each database |
| Operational complexity | HIGH | More databases to provision, monitor, backup |
| Cross-tenant queries impossible | LOW | Acceptable for ClubOS use case |
| Cost at scale | MEDIUM | More database instances = higher cost |

**Neon Branching Advantage:**

ClubOS uses Neon for PostgreSQL. Neon's branching model makes
database-per-tenant more viable:
- Branches are cheap and fast to create
- Shared storage reduces cost
- Per-branch connection strings simplify routing
- Point-in-time recovery is per-branch

This significantly reduces the operational overhead disadvantage.

**Implementation Effort:** Medium (with Neon), High (traditional PostgreSQL)
**Isolation Confidence:** Highest

---

## 4. Model Comparison Summary

| Criterion | Model A (Shared + tenant_id) | Model B (Schema per tenant) | Model C (Database per tenant) |
|-----------|------------------------------|-----------------------------|-----------------------------|
| Data isolation | Medium | High | Highest |
| Query simplicity | Low (tenant filter everywhere) | Medium (schema routing) | High (no filtering) |
| Migration simplicity | High | Low | Medium |
| Backup/restore isolation | Low | Medium | High |
| Prisma compatibility | High | Low | High |
| Operational complexity | Low | Medium | Medium-High |
| Performance isolation | Low | Low | High |
| Cost efficiency | High | Medium | Medium (better with Neon) |
| Tenant provisioning | Easy (insert row) | Medium (create schema) | Medium (create database) |

---

## 5. Recommendation

### Recommended Model: A (Shared Database + tenant_id) with RLS

**Rationale:**

1. **Prisma compatibility**: ClubOS uses Prisma extensively. Model B
   (schema-per-tenant) requires significant workarounds. Model A works
   natively with Prisma's existing patterns.

2. **Low tenant count**: ClubOS is solutions-led with high-touch onboarding.
   We will have tens of tenants, not thousands. The operational simplicity
   of shared database outweighs isolation benefits of separate databases.

3. **Defense in depth with RLS**: Row-level security at the PostgreSQL
   level provides a safety net for application-level query mistakes.
   Even if code forgets a tenant filter, RLS blocks the leak.

4. **Migration simplicity**: One database, one schema, one migration run.
   This matters when chatbot contributors make frequent schema changes.

5. **Upgrade path exists**: If isolation requirements increase (e.g., a
   large enterprise customer with data residency requirements), we can
   migrate specific tenants to Model C without rewriting the application.

### Tradeoffs Accepted

| Tradeoff | Mitigation |
|----------|------------|
| Query discipline required | Prisma middleware to auto-inject tenant_id |
| No backup isolation | Document as limitation; platform team handles restores |
| Performance isolation absent | Acceptable for initial tenant count; monitor and revisit |
| Cross-tenant debugging harder | Platform team uses bypass for support queries |

### Future Consideration: Hybrid Model

If a high-value customer requires stronger isolation:
- Provision them on a separate database (Model C)
- Same application code, different connection string
- Treat as "dedicated tenant" tier with premium pricing

This preserves optionality without over-engineering now.

---

## 6. Phased Migration Plan

### Phase 0: Preparation (No Production Changes)

**Goal:** Prepare codebase for tenancy without breaking SBNC.

Tasks:
1. Add `Tenant` model to Prisma schema (id, name, slug, settings)
2. Add `tenant_id` column to all tenant-scoped tables (nullable initially)
3. Create migration that sets all existing rows to SBNC tenant
4. Add `tenantId` to session/context types
5. Document which tables are tenant-scoped vs global

Deliverables:
- [ ] Prisma schema with Tenant model
- [ ] Migration adding tenant_id columns
- [ ] Session context type with tenantId
- [ ] TENANT_SCOPED_TABLES.md reference

### Phase 1: Application Layer Enforcement

**Goal:** All queries respect tenant context.

Tasks:
1. Create Prisma middleware that auto-injects tenant filter on reads
2. Create Prisma middleware that auto-sets tenant_id on creates
3. Update all existing queries to use tenant-aware client
4. Add tenant context to all API routes (from session)
5. Add tenant context to background jobs
6. Update audit log to include tenant_id

Deliverables:
- [ ] Prisma tenant middleware (read filter + write injection)
- [ ] API route tenant context extraction
- [ ] Background job tenant context propagation
- [ ] Audit log tenant attribution
- [ ] Unit tests for tenant isolation

### Phase 2: Database Layer Enforcement (RLS)

**Goal:** Defense in depth via PostgreSQL RLS.

Tasks:
1. Enable RLS on all tenant-scoped tables
2. Create tenant isolation policies
3. Configure session variable setting (app.current_tenant)
4. Update Prisma connection to set session variable
5. Test that RLS blocks queries without tenant context

Deliverables:
- [ ] RLS policies for all tenant-scoped tables
- [ ] Connection wrapper that sets session tenant
- [ ] RLS bypass mechanism for platform operations
- [ ] Integration tests proving RLS enforcement

### Phase 3: Tenant Provisioning

**Goal:** Platform team can create new tenants.

Tasks:
1. Create tenant provisioning admin endpoint (platform-only)
2. Create tenant-specific settings model
3. Create tenant admin user creation flow
4. Create tenant configuration defaults (membership levels, etc.)
5. Document tenant setup runbook

Deliverables:
- [ ] POST /api/platform/tenants endpoint
- [ ] Tenant settings schema
- [ ] First tenant admin invitation flow
- [ ] TENANT_PROVISIONING_RUNBOOK.md

### Phase 4: Operational Readiness

**Goal:** Multi-tenant production operations.

Tasks:
1. Update backup procedures for tenant-aware restore
2. Add tenant dimension to observability (logs, metrics, alerts)
3. Create tenant health dashboard
4. Document tenant isolation incident response
5. Conduct tenant isolation table-top exercise

Deliverables:
- [ ] Backup/restore runbook with tenant considerations
- [ ] Tenant-aware logging and metrics
- [ ] Tenant health monitoring dashboard
- [ ] Incident response playbook for isolation failures

### Phase 5: Second Tenant Onboarding

**Goal:** Prove the model with a real second tenant.

Tasks:
1. Provision second tenant in production
2. Complete solutions onboarding (existing process)
3. Monitor for isolation issues
4. Gather operational learnings
5. Update documentation based on experience

Deliverables:
- [ ] Second tenant live in production
- [ ] No isolation incidents during onboarding
- [ ] Lessons learned documented

---

## 7. Code Touchpoints

### 7.1 Authentication and Session

| Component | Change Required |
|-----------|-----------------|
| Session token | Include tenantId claim |
| Session validation | Extract and validate tenantId |
| Login flow | Determine tenant from user or subdomain |
| Passkey authentication | Associate credentials with tenant |

Files likely affected:
- src/lib/auth/session.ts
- src/lib/auth/passkey.ts
- src/app/api/auth/*/route.ts

### 7.2 Prisma Schema

| Change | Details |
|--------|---------|
| Tenant model | New model with id, name, slug, settings |
| tenant_id column | Add to all tenant-scoped models |
| Relations | All tenant-scoped models relate to Tenant |
| Indexes | Add index on tenant_id for all tables |

Tables requiring tenant_id:
- Member, Membership, MembershipLevel
- Event, EventRegistration, Waitlist
- Page, Block, Navigation
- Message, MessageCampaign, AudienceSegment
- GovernanceMeeting, Minutes, Motion
- AuditLog, JobRun
- (all domain tables)

Tables that remain global:
- User (users can belong to multiple tenants)
- TenantMembership (join table: User <-> Tenant)

### 7.3 API Routing

| Component | Change Required |
|-----------|-----------------|
| Route handlers | Extract tenant from session context |
| Middleware | Validate tenant exists and user has access |
| Error responses | Tenant-aware error messages |
| Rate limiting | Per-tenant rate limits |

Patterns to implement:
- getTenantFromSession(request) helper
- requireTenantAccess(tenantId) guard
- Tenant context propagation to service layer

### 7.4 RBAC and Permissions

| Component | Change Required |
|-----------|-----------------|
| Role definitions | Roles are tenant-scoped |
| Capability checks | Include tenant in scope evaluation |
| Permission cache | Key by (userId, tenantId) |
| Platform roles | Separate from tenant roles |

New role types:
- Platform Admin (cross-tenant access)
- Tenant Admin (full access within one tenant)
- Tenant roles (existing Officer, Chair, Member roles)

### 7.5 Audit Logs

| Component | Change Required |
|-----------|-----------------|
| AuditLog model | Add tenant_id column |
| Log creation | Include tenant context |
| Log queries | Filter by tenant (except platform queries) |
| Log retention | Consider per-tenant retention policies |

Charter P1 requires audit attribution. Tenant context is part of attribution.

### 7.6 Publishing System

| Component | Change Required |
|-----------|-----------------|
| Page model | tenant_id column |
| Content queries | Tenant-scoped |
| Public pages | Route by tenant subdomain or path |
| Asset storage | Tenant-prefixed paths |

URL routing options:
- Subdomain: sbnc.clubos.app, otherclub.clubos.app
- Path prefix: clubos.app/sbnc/, clubos.app/otherclub/
- Custom domain: sbnewcomers.org (mapped to tenant)

### 7.7 Background Jobs

| Component | Change Required |
|-----------|-----------------|
| Job creation | Include tenantId in job payload |
| Job execution | Set tenant context before processing |
| Job logging | Include tenant in log context |
| Job queues | Consider per-tenant queues (future) |

Jobs requiring tenant context:
- Email campaigns
- Membership renewals
- Event reminders
- Report generation
- Data exports

### 7.8 Storage (Files/Media)

| Component | Change Required |
|-----------|-----------------|
| Upload paths | Prefix with tenant: /{tenant_id}/uploads/... |
| Access control | Validate tenant before serving |
| Storage quotas | Per-tenant limits (future) |
| Backup/restore | Tenant-prefixed restore capability |

### 7.9 Email

| Component | Change Required |
|-----------|-----------------|
| From address | Per-tenant from address or subdomain |
| Templates | Tenant-scoped templates |
| Bounce handling | Route bounces to correct tenant |
| Unsubscribe | Tenant-scoped preferences |

### 7.10 Observability

| Component | Change Required |
|-----------|-----------------|
| Log format | Include tenant_id in structured logs |
| Metrics | Add tenant label to all metrics |
| Alerts | Per-tenant alert thresholds (future) |
| Dashboards | Tenant filter on all dashboards |

---

## 8. Isolation and Authorization Test Plan

### 8.1 Unit Tests: Query Isolation

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Read without tenant | Query Member without tenant context | Error or empty result |
| Read wrong tenant | Query with Tenant A context for Tenant B data | Empty result |
| Create without tenant | Insert Member without tenant_id | Error |
| Create wrong tenant | Insert with mismatched tenant context | Error or rejected |
| Update cross-tenant | Update Tenant B record with Tenant A context | Error |
| Delete cross-tenant | Delete Tenant B record with Tenant A context | Error |

### 8.2 Integration Tests: RLS Enforcement

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| RLS blocks unset tenant | Query without setting app.current_tenant | Zero rows |
| RLS allows correct tenant | Query with matching tenant | Expected rows |
| RLS blocks wrong tenant | Query with non-matching tenant | Zero rows |
| RLS bypass for platform | Platform query with bypass | All rows visible |

### 8.3 API Tests: Tenant Context

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| No session | API call without authentication | 401 Unauthorized |
| No tenant in session | API call with user but no tenant | 400 Bad Request |
| Wrong tenant access | User accessing different tenant | 403 Forbidden |
| Correct tenant access | User accessing their tenant | 200 OK |
| Platform admin access | Platform admin accessing any tenant | 200 OK |

### 8.4 E2E Tests: Cross-Tenant Scenarios

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Tenant A user views events | User from Tenant A views event list | Only Tenant A events |
| Tenant A user searches members | Search for Tenant B member name | No results |
| Tenant A admin exports | Export member list | Only Tenant A members |
| Login to wrong tenant | User attempts login on wrong subdomain | Error or redirect |
| Shared email address | Same email in two tenants | Separate accounts, correct routing |

### 8.5 Failure Mode Tests

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Middleware bypass | Direct database query without middleware | RLS blocks access |
| Session tampering | Modified tenantId in token | Token validation fails |
| Admin escalation | Tenant admin attempts platform operation | 403 Forbidden |
| Background job isolation | Job processes data | Only tenant's data affected |

### 8.6 Regression Tests

Add to CI pipeline:
- Tenant isolation smoke test on every PR
- Full isolation test suite nightly
- Cross-tenant query detection (lint rule or runtime check)

---

## 9. Open Questions

| Question | Options | Decision Needed By |
|----------|---------|-------------------|
| Tenant identification in URL | Subdomain vs path prefix vs custom domain | Phase 3 |
| User-tenant relationship | User per tenant vs user across tenants | Phase 1 |
| Tenant settings schema | What is configurable per tenant? | Phase 3 |
| Platform admin access model | How do support staff access tenant data? | Phase 2 |
| Tenant data export format | What does a tenant export include? | Phase 4 |

---

## 10. References

- [Architectural Charter](./ARCHITECTURAL_CHARTER.md) - Core principles
- [Delivery Model Strategy](./DELIVERY_MODEL_STRATEGY.md) - Solutions-led context
- [Engineering Philosophy](./ENGINEERING_PHILOSOPHY.md) - Development approach
- [Reliability and Delivery Synthesis](./RELIABILITY_AND_DELIVERY_SYNTHESIS.md) - Board summary

---

## Appendix A: Prisma Tenant Middleware (Pseudocode)

```
// Read middleware - auto-inject tenant filter
prisma.$use(async (params, next) => {
  if (isTenantScopedModel(params.model)) {
    const tenantId = getCurrentTenantId();
    if (!tenantId && !isPlatformContext()) {
      throw new Error('Tenant context required');
    }
    if (tenantId) {
      params.args.where = {
        ...params.args.where,
        tenantId: tenantId
      };
    }
  }
  return next(params);
});

// Write middleware - auto-set tenant_id on create
prisma.$use(async (params, next) => {
  if (params.action === 'create' && isTenantScopedModel(params.model)) {
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context required for create');
    }
    params.args.data.tenantId = tenantId;
  }
  return next(params);
});
```

---

## Appendix B: RLS Policy Template (Pseudocode)

```sql
-- Enable RLS on table
ALTER TABLE member ENABLE ROW LEVEL SECURITY;

-- Default deny
ALTER TABLE member FORCE ROW LEVEL SECURITY;

-- Tenant isolation policy
CREATE POLICY tenant_isolation_member ON member
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Platform bypass policy (for support operations)
CREATE POLICY platform_bypass_member ON member
  FOR ALL
  USING (current_setting('app.platform_bypass', true) = 'true');
```

---

## Appendix C: Tenant Context Flow

```
Request arrives
    |
    v
[Middleware: Extract session]
    |
    v
[Middleware: Validate tenant access]
    |
    +-- User has access to tenant? --NO--> 403 Forbidden
    |
    YES
    |
    v
[Set tenant context in AsyncLocalStorage]
    |
    v
[Set PostgreSQL session variable: app.current_tenant]
    |
    v
[Route handler executes]
    |
    v
[Prisma middleware auto-filters by tenant]
    |
    v
[RLS provides defense-in-depth]
    |
    v
[Response returned]
```
