# Salvage Plan: Issue #202 - WA Migration/Importing Wave

**Status:** Parked
**Tracking Issue:** [#202](https://github.com/sbnctech/murmurant/issues/202)
**Theme Label:** `theme-migration`
**Date:** 2025-12-21

---

## Executive Summary

The Migration wave contains data import infrastructure for moving from Wild Apricot to Murmurant. This is operationally critical but isolated from other waves. The PRs are loosely coupled and can be integrated independently.

**Recommendation:** Land documentation and scripts first. Schema changes require careful ordering. Email infrastructure can wait until after core migration works.

---

## 1. Inventory of Parked PRs

| PR | Title | Files | Key Content | Risk |
|----|-------|-------|-------------|------|
| #120 | feat(migration): WA to Murmurant data migration pipeline | 15 | Migration engine, CSV parser, config | MEDIUM |
| #134 | feat(importing): MembershipTier and WA level mapping | 10 | MembershipTier model, tier resolution | MEDIUM |
| #119 | feat(email): email tracking and VP Tech dashboard | 6 | DeliveryLog enhancements, email health | LOW |
| #117 | feat(comms): Email templates and composer system | 15 | EmailIdentity, templates, composer UI | LOW |

---

## 2. Hotspot Analysis

### Critical Hotspots

```
prisma/schema.prisma          - Touched by: #134, #119, #117
scripts/migration/**          - Touched by: #120
src/lib/importing/**          - Touched by: #134
src/lib/email/**              - Touched by: #119
src/app/admin/comms/**        - Touched by: #117
```

### Overlap Matrix

```
     #120  #134  #119  #117
#120   -   MED   NONE  NONE
#134  MED   -    NONE  NONE
#119  NONE NONE   -    LOW
#117  NONE NONE  LOW    -
```

The Migration PRs are well-isolated. Email PRs (#119, #117) are their own mini-wave.

---

## 3. Micro-PR Decomposition

### Wave A: Migration Scripts (LOW Risk)

| Micro-PR | Source | Content | Deps |
|----------|--------|---------|------|
| A1 | #120 | scripts/migration/README.md | None |
| A2 | #120 | scripts/migration/lib/types.ts | None |
| A3 | #120 | scripts/migration/lib/config.ts | A2 |
| A4 | #120 | scripts/migration/config/migration-config.yaml | A3 |
| A5 | #120 | scripts/migration/lib/csv-parser.ts | A2 |
| A6 | #120 | scripts/migration/lib/migration-engine.ts | A3, A5 |
| A7 | #120 | scripts/migration/migrate.ts (CLI entry) | A6 |
| A8 | #120 | scripts/migration/reset-sandbox.ts | A2 |
| A9 | #120 | scripts/migration/sample-pack/** | None |

**Risk mitigation:**
- Scripts are isolated - no app impact
- Add npm scripts for migrate:dry-run, migrate:live, migrate:reset

### Wave B: Membership Tier (MEDIUM Risk - Schema)

| Micro-PR | Source | Content | Deps |
|----------|--------|---------|------|
| B1 | #134 | docs/IMPORTING/MEMBERSHIP_TIER_MAPPING.md | None |
| B2 | #134 | prisma: MembershipTier model + migration | None |
| B3 | #134 | prisma: Member.membershipTierId + waMembershipLevelRaw | B2 |
| B4 | #134 | src/lib/importing/wildapricot/transformers.ts | B3 |
| B5 | #134 | src/lib/importing/wildapricot/importer.ts (tier resolution) | B4 |
| B6 | #134 | scripts/importing/seed_membership_tiers.ts | B2 |
| B7 | #134 | tests/unit/importing/wa-transformers.spec.ts | B4 |
| B8 | #134 | src/app/api/v1/admin/import/status/route.ts (tier counts) | B5 |

**Risk mitigation:**
- Land B2 (schema) before B3 (member field)
- Tier seeder is DRY_RUN by default
- Member.membershipTierId is nullable - safe migration

### Wave C: Email Tracking (LOW Risk)

| Micro-PR | Source | Content | Deps |
|----------|--------|---------|------|
| C1 | #119 | docs/email/EMAIL_TRACKING.md | None |
| C2 | #119 | prisma: DeliveryLog enhancements, EmailSuppressionList | None |
| C3 | #119 | src/lib/email/tracking.ts | C2 |
| C4 | #119 | src/app/api/webhooks/email/route.ts | C3 |
| C5 | #119 | src/app/api/v1/admin/email-health/route.ts | C3 |
| C6 | #119 | src/app/api/v1/admin/email-health/config/route.ts | C3 |

**Risk mitigation:**
- Email tracking is additive
- Privacy defaults: open/click tracking OFF
- Webhook handler is new endpoint

### Wave D: Email Templates (LOW Risk)

| Micro-PR | Source | Content | Deps |
|----------|--------|---------|------|
| D1 | #117 | docs/comms/EMAIL_SYSTEM.md | None |
| D2 | #117 | prisma: EmailIdentity model | None |
| D3 | #117 | src/app/api/v1/admin/comms/identities/* | D2 |
| D4 | #117 | src/app/api/v1/admin/comms/templates/* | D2 |
| D5 | #117 | src/app/api/v1/admin/comms/compose/route.ts | D3, D4 |
| D6 | #117 | src/app/api/v1/admin/comms/outbox/route.ts | D5 |
| D7 | #117 | src/app/admin/comms/identities/* | D3 |
| D8 | #117 | src/app/admin/comms/compose/* | D5 |

**Risk mitigation:**
- Email system is new feature
- Role-based identity access (admin only)
- Test-send before bulk send

---

## 4. Integration Order

```
Phase 1: Migration Scripts (Wave A)
   └─ A1 → A2 → A3 → A4 → A5 → A6 → A7 → A8 → A9
   └─ GATE: npm run migrate:dry-run works

Phase 2: Membership Tier (Wave B)
   └─ B1 → B2 → B3 → B4 → B5 → B6 → B7 → B8
   └─ GATE: Tier seeder runs, import status shows tier counts

Phase 3: Email Tracking (Wave C) - CAN PARALLELIZE WITH D
   └─ C1 → C2 → C3 → C4 → C5 → C6
   └─ GATE: Webhook handler processes test event

Phase 4: Email Templates (Wave D) - CAN PARALLELIZE WITH C
   └─ D1 → D2 → D3 → D4 → D5 → D6 → D7 → D8
   └─ GATE: Test email sends successfully
```

---

## 5. Risk Assessment

### Migration Data Risk: MEDIUM

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| CSV parsing fails on real WA export | MEDIUM | MEDIUM | Sample pack validates format |
| Duplicate member creation | LOW | HIGH | Idempotent import by email |
| Event date parsing issues | MEDIUM | LOW | WA uses MM/DD/YYYY, tested in parser |

### Schema Risk: MEDIUM

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| MembershipTier conflicts with other schema changes | LOW | MEDIUM | Land B2 early, coordinate with other waves |
| EmailIdentity schema conflicts | LOW | LOW | Email wave is isolated |

### Operational Risk: LOW

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Import corrupts production data | LOW | CRITICAL | Always run dry-run first |
| Email bounces harm sender reputation | MEDIUM | MEDIUM | Auto-suppress hard bounces |

---

## 6. Merge Captain Checklist

### Pre-Merge (Per Micro-PR)

- [ ] Branch created from current main
- [ ] Cherry-pick or manually copy code from source PR
- [ ] Run `npm run typecheck`
- [ ] Run `npm run lint`
- [ ] If migration scripts: test with sample data
- [ ] If schema change: run `prisma validate` and `prisma generate`

### Wave A Completion Gate

- [ ] `npm run migrate:dry-run -- --data-dir ./scripts/migration/sample-pack` succeeds
- [ ] Dry-run report generated
- [ ] Reset-sandbox works (with CONFIRM_RESET=1)

### Wave B Completion Gate

- [ ] MembershipTier seeder runs: `DRY_RUN=1 npx tsx scripts/importing/seed_membership_tiers.ts`
- [ ] Import status endpoint returns `membershipTierCounts`
- [ ] WA level mapping tests pass

### Post-Merge

- [ ] CI green on main
- [ ] Update tracking issue #202 with progress

---

## 7. Estimated Merge Effort

| Wave | Micro-PRs | Est. Time per PR | Total |
|------|-----------|------------------|-------|
| A (Scripts) | 9 | 10 min | 90 min |
| B (Tier) | 8 | 20 min | 160 min |
| C (Tracking) | 6 | 15 min | 90 min |
| D (Templates) | 8 | 20 min | 160 min |

**Total estimated effort:** ~8.5 hours

---

## 8. What NOT to Salvage

The following should be validated before integration:

- **WA API credentials** - Should not be in code, use env vars
- **Production member data** - Never commit real PII
- **Email sending credentials** - Env vars only

---

## 9. Migration Workflow (Future Ops Reference)

Once all waves are landed, the migration workflow is:

```bash
# 1. Export data from Wild Apricot (manual in WA admin)
# 2. Place exports in data directory
mkdir -p ./wa-export
cp members.csv events.csv registrations.csv ./wa-export/

# 3. Dry run to validate
npm run migrate:dry-run -- --data-dir ./wa-export

# 4. Review dry-run report
cat ./scripts/migration/reports/dry-run-*.json

# 5. Live import (requires explicit --yes)
npm run migrate:live -- --yes --data-dir ./wa-export

# 6. Verify import status
curl /api/v1/admin/import/status
```

---

## Appendix: WA Export Field Mapping

### Members CSV

| WA Field | Murmurant Field | Notes |
|----------|--------------|-------|
| Contact ID | waContactId | Stored for reconciliation |
| First name | firstName | Required |
| Last name | lastName | Required |
| Email | email | Unique key |
| Phone | phone | Optional |
| Member since | joinedAt | Date parsing |
| Membership level | membershipTierId | Via tier mapping |

### Events CSV

| WA Field | Murmurant Field | Notes |
|----------|--------------|-------|
| Event ID | waEventId | Stored for reconciliation |
| Event name | title | Unique key (with date) |
| Start date | startDate | Date parsing |
| End date | endDate | Optional |
| Location | location | Optional |

### Registrations CSV

| WA Field | Murmurant Field | Notes |
|----------|--------------|-------|
| Registration ID | waRegistrationId | Stored for reconciliation |
| Contact ID | member (via waContactId) | Foreign key |
| Event ID | event (via waEventId) | Foreign key |
| Registration status | status | Enum mapping |
| Registration date | registeredAt | Date parsing |
