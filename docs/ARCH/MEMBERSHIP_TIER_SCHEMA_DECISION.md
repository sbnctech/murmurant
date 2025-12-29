# MembershipTier Schema Decision for WA Migration

**Status:** DRAFT
**Date:** 2025-12-24
**Related Issues:** #276 (B1: MembershipTier Schema), #202 (WA Migration Epic), #248 (Business Model Requirements)

---

## 1. Current State

### Schema Status

The `MembershipTier` model **already exists** in the Prisma schema:

```prisma
model MembershipTier {
  id        String   @id @default(uuid()) @db.Uuid
  code      String   @unique
  name      String
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  members Member[]
}

model Member {
  // ...
  membershipTierId     String?  @db.Uuid
  waMembershipLevelRaw String?  // Stores original WA value
  membershipTier       MembershipTier? @relation(...)
}
```

### What's Missing

| Component | Status | Gap |
|-----------|--------|-----|
| Schema model | ✅ Exists | None |
| Seed script | ❌ Missing | No `seed_membership_tiers.ts` |
| Migration mapping | ❌ Missing | Migration engine doesn't map tiers |
| Policy integration | ❌ Missing | Tier thresholds not in policy layer |
| Validation tests | ❌ Missing | No tier assignment tests |

---

## 2. Why Schema Change Is Required for WA Migration

Wild Apricot uses "Membership Levels" to represent pricing tiers:

| WA Membership Level | Meaning | Annual Dues |
|---------------------|---------|-------------|
| NewbieNewcomer | First year member | $150 |
| NewcomerMember | Second year member | $125 |
| ExtendedNewcomer | Third+ year member | $85 |
| Admins | Honorary/admin accounts | $0 |

### Murmurant Mapping Requirement

During WA import, we must:

1. **Preserve the original WA level** in `waMembershipLevelRaw` for audit
2. **Map to a Murmurant tier** in `membershipTierId` for application logic
3. **Allow unmapped imports** (tier = null) without blocking migration

### Current Behavior

- Migration imports members with `membershipTierId = null`
- `waMembershipLevelRaw` stores the original WA value
- No tier-based logic executes (feature is dormant)

---

## 3. Options Considered

### Option A: Seed MembershipTier Table (Recommended)

**Description:** Create a seed script to populate the existing `MembershipTier` table with SBNC-specific tiers, then update migration engine to map WA levels to these tiers.

**Pros:**
- Uses existing schema (no migration required)
- Clean relational model with referential integrity
- Tier names/codes can be org-specific
- Enables tier-based queries (e.g., "all second-year members")

**Cons:**
- Requires seed script maintenance
- Tier definitions coupled to database

**Implementation:**
```bash
# New seed script
scripts/importing/seed_membership_tiers.ts

# Tiers to seed:
# - newcomer_1st_year (NewbieNewcomer)
# - newcomer_2nd_year (NewcomerMember)
# - newcomer_extended (ExtendedNewcomer)
# - honorary (Admins)
```

### Option B: JSON Policy-Only Representation

**Description:** Store tier information entirely in the policy layer as configuration, not in a database table.

**Pros:**
- No database dependencies
- Easy to change without migrations
- Portable across environments

**Cons:**
- No referential integrity
- Cannot query by tier efficiently
- Duplicates data that belongs in relational model
- Schema already has the table (would be unused)

**Not recommended:** The schema already exists; ignoring it creates confusion.

### Option C: Hybrid (Schema + Policy Overlay)

**Description:** Use database table for tier identity, but store tier-specific thresholds (e.g., "newbie period days") in the policy layer.

**Pros:**
- Best of both worlds
- Tier identity in database, behavior in policy
- Follows existing pattern (MembershipStatus + policy)

**Cons:**
- Slightly more complex
- Requires coordination between schema and policy

**Implementation:**
```typescript
// Database: tier identity
MembershipTier { code: "newcomer_1st_year", name: "First Year Newcomer" }

// Policy: tier behavior
getPolicy("membership.tiers.newcomer_1st_year.newbieDays") // → 365
getPolicy("membership.tiers.newcomer_1st_year.annualDues") // → 150
```

---

## 4. Recommendation

**Option C: Hybrid (Schema + Policy Overlay)**

### Rationale

1. **Schema already exists** - The `MembershipTier` table is in place; we should use it
2. **Follows existing patterns** - `MembershipStatus` works this way (identity in DB, behavior in policy)
3. **Enables evolution** - Tier thresholds can change without schema migration
4. **Maintains audit trail** - Tier assignments are trackable in database
5. **Supports queries** - Can efficiently query members by tier

### Implementation Order

1. Create `seed_membership_tiers.ts` with SBNC tiers
2. Add tier mapping to migration engine
3. Add tier thresholds to policy layer
4. Update lifecycle logic to use tier-based policies

---

## 5. Safety and Deferral Strategy

### Why It Is Safe to Defer

The migration can proceed **without tier mapping**:

- `membershipTierId` is nullable
- `waMembershipLevelRaw` preserves source data
- Tier assignment can be backfilled post-migration
- No application logic currently depends on tiers

### Feature Flag Strategy

```typescript
// Policy-gated tier logic
if (getPolicy("membership.tiersEnabled")) {
  // Use tier-based thresholds
  const newbieDays = getTierPolicy(member.membershipTier, "newbieDays");
} else {
  // Use flat thresholds (current behavior)
  const newbieDays = getPolicy("membership.newbieDays");
}
```

### Rollout Phases

| Phase | Scope | Risk |
|-------|-------|------|
| 1. Seed tiers | Add tier records | None (no code uses them yet) |
| 2. Map imports | Assign tiers during migration | Low (nullable field) |
| 3. Enable logic | Use tier-based policies | Medium (behavior change) |

---

## 6. Explicit Non-Goals

This decision **does NOT** cover:

- **Pricing/billing integration** - Tier dues are informational only (see #256)
- **User-facing tier selection** - Members cannot change their own tier
- **Multi-org tier sharing** - Each org defines its own tiers
- **Tier-based access control** - Tiers are not capabilities (see RBAC)
- **Historical tier tracking** - We track current tier only, not history
- **Tier expiration logic** - Lifecycle handles status changes, not tiers

---

## 7. Schema Readiness Checklist

Complete these before merging tier-dependent code:

### Required Invariants

- [ ] Every tier has a unique `code` (enforced by schema)
- [ ] Tier codes are lowercase, snake_case
- [ ] `waMembershipLevelRaw` is never overwritten after initial import
- [ ] Members can have null tier (not all orgs use tiers)

### Backfill Strategy

For existing members imported without tier:

```sql
-- Backfill based on preserved WA level
UPDATE "Member" SET "membershipTierId" = (
  SELECT id FROM "MembershipTier" WHERE code =
    CASE "waMembershipLevelRaw"
      WHEN 'NewbieNewcomer' THEN 'newcomer_1st_year'
      WHEN 'NewcomerMember' THEN 'newcomer_2nd_year'
      WHEN 'ExtendedNewcomer' THEN 'newcomer_extended'
      WHEN 'Admins' THEN 'honorary'
      ELSE NULL
    END
) WHERE "membershipTierId" IS NULL;
```

### Rollout Order

1. **Seed tiers** → Run seed script in production
2. **Update migration** → Engine maps WA levels to tiers
3. **Backfill existing** → Run SQL for already-imported members
4. **Enable policy flag** → `membership.tiersEnabled = true`
5. **Verify lifecycle** → Confirm tier-based thresholds work

### Rollback Implications

If issues discovered after tier enablement:

| Action | Rollback |
|--------|----------|
| Seed script | Delete tier records (cascade-safe if members not assigned) |
| Migration mapping | Tier field nullable; can set to null |
| Backfill | Run inverse: `SET membershipTierId = NULL` |
| Policy flag | Set `membership.tiersEnabled = false` |

**Related:** Issue #277 (D1: Rollback & Recovery)

### Tests Required Before Merge

- [ ] Seed script idempotent (can run multiple times)
- [ ] Migration correctly maps WA levels
- [ ] Backfill SQL works on sample data
- [ ] Tier-based policy lookup works
- [ ] Null tier handled gracefully
- [ ] `npm run green` passes

---

## 8. Decision Summary

| Aspect | Decision |
|--------|----------|
| Approach | Hybrid: Schema for identity, Policy for behavior |
| Schema change needed | **No** (table already exists) |
| Seed script needed | **Yes** (new file required) |
| Migration engine change | **Yes** (add tier mapping) |
| Policy layer change | **Yes** (add tier thresholds) |
| Blocking for migration | **No** (can import with null tier) |
| Risk level | **Low** (nullable field, feature-flagged) |

---

## Approval

- [ ] Engineering Lead
- [ ] Merge Captain
- [ ] Product (tier definitions)
