# Murmurant Release Model and Field Testing

Copyright (c) Santa Barbara Newcomers Club
Status: Canonical Specification
Last Updated: 2025-12-21

---

## Purpose

This document defines how Murmurant releases reach customers, from development
through production. It establishes gates, rollback strategies, and field
testing protocols consistent with our solutions-first, safety-first posture.

This document is normative.

---

## 1. Current State (Today)

### 1.1 Architecture

Murmurant is currently a **single-tenant deployment** serving SBNC.

| Aspect | Current State |
|--------|---------------|
| Tenancy | Single-tenant (SBNC only) |
| Database | Single Postgres instance (Supabase) |
| Hosting | Vercel (Next.js) |
| Multi-tenant | NOT implemented |

### 1.2 Merge and Build

| Step | Mechanism | Status |
|------|-----------|--------|
| Code review | GitHub PR required | ACTIVE |
| Charter gate | Pre-push hook checks | ACTIVE |
| Migration safety | CI script blocks destructive patterns | ACTIVE |
| TypeScript | `tsc --noEmit` in CI | ACTIVE |
| Unit tests | Vitest suite | ACTIVE |
| E2E tests | Playwright (subset) | PARTIAL |

**Branch protection:**
- `main` requires passing CI
- Force push forbidden on `main`
- Commits must be signed (configured, not enforced)

### 1.3 Deployment

| Aspect | Current State |
|--------|---------------|
| Trigger | Merge to `main` auto-deploys to production |
| Staging | EXISTS but not gated |
| Preview | Vercel preview deploys on PRs |
| Rollback | Vercel instant rollback (code only) |

**What this means:**
- Every merge to `main` goes directly to production
- No staging gate between merge and production
- No formal field test period

### 1.4 Environments

| Environment | Purpose | URL | Status |
|-------------|---------|-----|--------|
| Local dev | Development | localhost:3000 | ACTIVE |
| Preview | PR testing | *.vercel.app | ACTIVE |
| Staging | Pre-prod validation | TBD | PLANNED |
| Production | Live SBNC | sbnewcomers.org | ACTIVE |

**Assumption:** Staging exists as Vercel project but is not part of formal gate.

### 1.5 Schema Migrations

| Aspect | Current State |
|--------|---------------|
| Tool | Prisma Migrate |
| Safety check | CI blocks DROP/destructive patterns |
| Approval | MIGRATION_APPROVED annotation required |
| Rollback | Restore from backup (no down migrations) |
| Backup | Supabase PITR (planned, not verified) |

See: [migrations.md](./migrations.md) for detailed safety rules.

---

## 2. Proposed Release Lifecycle

### 2.1 Lifecycle Stages

```
DEV -> STAGING -> PILOT (field test) -> GA (general availability)
```

| Stage | Purpose | Duration | Gate |
|-------|---------|----------|------|
| DEV | Development and PR testing | Continuous | CI passes |
| STAGING | Integration validation | 1-3 days | Smoke tests pass |
| PILOT | Field test with SBNC | 1-2 weeks | No SEV-1/2 incidents |
| GA | General availability | Ongoing | Sign-off complete |

### 2.2 Stage Definitions

#### DEV (Development)

**Entry:** Code written
**Activities:**
- Local development
- Unit tests
- Preview deploy testing
- Code review

**Exit criteria:**
- [ ] CI passes (types, lint, tests)
- [ ] Charter checks pass
- [ ] Migration safety check passes
- [ ] PR approved by reviewer

#### STAGING (Integration)

**Entry:** Merged to `main` or `staging` branch
**Activities:**
- Deploy to staging environment
- Run smoke tests
- Verify migrations applied cleanly
- Test critical paths manually

**Exit criteria:**
- [ ] Staging deploy successful
- [ ] No console errors in staging
- [ ] Critical paths verified (login, events, publishing)
- [ ] Migration applied without error

#### PILOT (Field Test)

**Entry:** Staging validated
**Activities:**
- Deploy to production
- Monitor for 1-2 weeks
- SBNC staff use in real operations
- Collect feedback and bug reports

**Exit criteria:**
- [ ] No SEV-1 or SEV-2 incidents during pilot
- [ ] No data integrity issues
- [ ] No blocking usability issues
- [ ] System Owner sign-off

**What "field test" means for single-tenant:**
Since Murmurant currently serves only SBNC, the pilot stage is SBNC operating
the system under normal conditions. The field test validates:
- Real user workflows work correctly
- No edge cases missed in testing
- Performance acceptable under real load
- No silent failures or data corruption

#### GA (General Availability)

**Entry:** Pilot complete with sign-off
**Activities:**
- Feature considered stable
- Documentation complete
- Rollback plan archived

**Exit criteria:**
- [ ] All acceptance criteria met
- [ ] Documentation updated
- [ ] Feature flag removed (if applicable)

### 2.3 Gate Checks

| Gate | Check | Blocking? |
|------|-------|-----------|
| DEV -> STAGING | CI passes | YES |
| DEV -> STAGING | Migration safety passes | YES |
| DEV -> STAGING | PR approved | YES |
| STAGING -> PILOT | Smoke tests pass | YES |
| STAGING -> PILOT | No staging errors | YES |
| PILOT -> GA | No SEV-1/2 during pilot | YES |
| PILOT -> GA | System Owner sign-off | YES |

### 2.4 Rollback Readiness

Before STAGING -> PILOT:
- [ ] Rollback procedure documented (code)
- [ ] Rollback procedure documented (data, if applicable)
- [ ] Backup verified recent
- [ ] Kill switch identified (if applicable)

---

## 3. Backward Compatibility Rules

### 3.1 API Compatibility

| Rule | Description |
|------|-------------|
| No field removal | API fields can be deprecated but not removed |
| No type changes | Field types cannot change without new endpoint |
| Additive only | New fields OK; removed/changed fields require versioning |
| Deprecation period | Minimum 2 releases before removal |

### 3.2 Database Migration Rules (Expand/Contract)

Murmurant uses the **expand/contract pattern** for schema changes:

#### Phase 1: Expand (Safe)

Add new structure alongside old:

```sql
-- Add new column (nullable, with default)
ALTER TABLE "members" ADD COLUMN "display_name" TEXT;

-- Add new table
CREATE TABLE "member_preferences" (...);
```

**Rules:**
- New columns MUST be nullable or have defaults
- No existing queries break
- No data loss possible

#### Phase 2: Migrate

Move data from old to new:

```sql
-- Backfill new column
UPDATE "members" SET display_name = first_name || ' ' || last_name
WHERE display_name IS NULL;
```

**Rules:**
- Run in background or off-peak
- Verify data integrity
- Can be repeated safely (idempotent)

#### Phase 3: Contract (Dangerous)

Remove old structure:

```sql
DROP COLUMN "old_field"; -- MIGRATION_APPROVED: data migrated to new_field
```

**Rules:**
- Requires MIGRATION_APPROVED annotation
- Minimum 2 weeks after code stops using old structure
- Backup verified before execution
- Rollback = restore from backup

### 3.3 Feature Flags (Minimal Approach)

Murmurant does not currently have a feature flag system. Until one is built,
use this minimal approach:

#### Environment Variable Flags

```typescript
// In src/lib/config.ts
export const FEATURES = {
  NEW_EDITOR: process.env.FEATURE_NEW_EDITOR === "true",
  WAITLIST_AUTO_PROMOTE: process.env.FEATURE_WAITLIST_AUTO === "true",
};

// Usage
if (FEATURES.NEW_EDITOR) {
  return <NewEditor />;
}
return <LegacyEditor />;
```

#### Flag Lifecycle

| Stage | Flag State |
|-------|------------|
| DEV | Enabled in dev only |
| STAGING | Enabled in staging |
| PILOT | Enabled in production |
| GA | Flag removed, feature always on |

#### Flag Rules

- Flags MUST have clear names (FEATURE_*)
- Flags MUST be documented in code
- Flags MUST be removed after GA
- Flag state changes are deployments (require review)

---

## 4. Rollback Strategy

### 4.1 Code Rollback

| Aspect | Mechanism |
|--------|-----------|
| Trigger | Vercel dashboard or CLI |
| Speed | Instant (previous deployment) |
| Scope | Full application code |
| Data | Not affected |

**Procedure:**

1. Identify the last known-good deployment
2. In Vercel dashboard: Deployments -> Select deployment -> "Promote to Production"
3. Verify rollback successful
4. Create incident record

**Limitations:**
- Does not roll back database migrations
- Does not roll back data changes
- May leave application/schema mismatch

### 4.2 Database Rollback

Database rollback is **limited** and **dangerous**.

| Scenario | Strategy |
|----------|----------|
| Additive migration (add column) | Safe to roll back code; column ignored |
| Destructive migration (drop column) | RESTORE FROM BACKUP ONLY |
| Data corruption | RESTORE FROM BACKUP |
| Data loss | RESTORE FROM BACKUP |

**Procedure for backup restore:**

1. Declare incident
2. Enable read-only mode (if available)
3. Identify point-in-time for restore
4. Execute restore per [restore-drill.md](./restore-drill.md)
5. Verify data integrity
6. Resume operations
7. Post-incident review

**Explicit limits:**
- No down migrations in Prisma
- PITR depends on database provider (Supabase)
- Restore may lose recent data (RPO window)
- Restore requires human intervention

### 4.3 Data Correction (When Rollback Impossible)

When rollback is impossible (data already changed, no backup covers it):

| Step | Action |
|------|--------|
| 1 | Declare incident with data integrity classification |
| 2 | Freeze writes to affected data (if possible) |
| 3 | Document current state and desired state |
| 4 | Create correction script with dry-run mode |
| 5 | Review script with System Owner |
| 6 | Execute correction in transaction |
| 7 | Verify correction |
| 8 | Create audit entry for correction |
| 9 | Post-incident review |

**Rules:**
- Data corrections require System Owner approval
- All corrections logged to audit
- Corrections must be reversible or have new backup before execution

---

## 5. Sign-Off Authority

### 5.1 Role Mapping

| Role | Defined In | Signs Off On |
|------|------------|--------------|
| System Owner | [OPERATIONAL_OWNERSHIP_AND_ONCALL.md](../reliability/OPERATIONAL_OWNERSHIP_AND_ONCALL.md) | PILOT -> GA transition, data corrections, production incidents |
| Security Owner | [DEPLOYMENT_READINESS_CHECKLIST.md](../reliability/DEPLOYMENT_READINESS_CHECKLIST.md) | Permission changes, auth changes |
| Backup/Recovery Owner | [DEPLOYMENT_READINESS_CHECKLIST.md](../reliability/DEPLOYMENT_READINESS_CHECKLIST.md) | Destructive migrations, restore procedures |

### 5.2 Sign-Off Requirements by Change Type

| Change Type | Required Sign-Off |
|-------------|-------------------|
| Documentation only | Reviewer (any) |
| Low-risk code | Reviewer (any) |
| High-risk code | System Owner |
| Schema migration (additive) | Reviewer (any) |
| Schema migration (destructive) | System Owner + Backup/Recovery Owner |
| Permission/auth changes | System Owner + Security Owner |
| PILOT -> GA | System Owner |
| Data correction | System Owner |
| Restore from backup | Backup/Recovery Owner |

### 5.3 Sign-Off Process

**For PILOT -> GA:**

1. Create sign-off issue/document
2. List all changes in pilot
3. List any incidents during pilot
4. Get explicit written approval from System Owner
5. Record in changelog

**Template:**

```markdown
## Release Sign-Off: [Feature Name]

**Pilot Period:** [Start Date] - [End Date]
**Changes Included:** [PR links]
**Incidents During Pilot:** [None / Issue links]

### Checklist

- [ ] No SEV-1 or SEV-2 incidents
- [ ] No data integrity issues
- [ ] No blocking usability issues
- [ ] Documentation complete

### Approval

System Owner: _________________ Date: _____________
```

---

## 6. Implementation Roadmap

### Phase 1: Formalize Current State (Now)

- [x] Document current release process (this document)
- [ ] Verify staging environment configuration
- [ ] Create smoke test checklist

### Phase 2: Add Staging Gate (Near-term)

- [ ] Configure staging deployment trigger
- [ ] Add staging smoke tests to CI
- [ ] Define staging -> production promotion process

### Phase 3: Feature Flags (When Needed)

- [ ] Implement FEATURES config pattern
- [ ] Document flag lifecycle
- [ ] Add flag cleanup reminders

### Phase 4: Multi-tenant Considerations (Future)

When/if Murmurant supports multiple tenants:

- Canary deployments to subset of tenants
- Tenant-specific feature flags
- Rollback per-tenant
- Staggered rollout schedule

---

## See Also

- [RELEASE_SAFETY_AND_CHANGE_CONTROL.md](../reliability/RELEASE_SAFETY_AND_CHANGE_CONTROL.md) - Change classification
- [OPERATIONAL_OWNERSHIP_AND_ONCALL.md](../reliability/OPERATIONAL_OWNERSHIP_AND_ONCALL.md) - Role definitions
- [DEPLOYMENT_READINESS_CHECKLIST.md](../reliability/DEPLOYMENT_READINESS_CHECKLIST.md) - Pre-deploy gates
- [migrations.md](./migrations.md) - Migration safety rules
- [restore-drill.md](./restore-drill.md) - Backup/restore procedures
- [BACKUP_EXECUTION_AND_RETENTION.md](../reliability/BACKUP_EXECUTION_AND_RETENTION.md) - Backup design
- [RECOVERY_AND_RESTORATION.md](../reliability/RECOVERY_AND_RESTORATION.md) - Recovery guarantees
- DELIVERY_MODEL_STRATEGY.md (TODO: create DELIVERY_MODEL_STRATEGY.md) - Solutions-first rationale
