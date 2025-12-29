# Salvage Plan: Issue #203 - Eligibility Engine Wave

**Status:** Parked
**Tracking Issue:** [#203](https://github.com/sbnctech/murmurant/issues/203)
**Theme Label:** `theme-eligibility`
**Date:** 2025-12-21

---

## Executive Summary

The Eligibility wave implements ticket/event access control based on membership status, committee membership, and custom overrides. The PRs are well-structured with clear dependencies: schema → service → API → UI.

**Recommendation:** Land in strict order. Schema PR (#78) unlocks all others. Feature-flag the UI until service is stable.

---

## 1. Inventory of Parked PRs

| PR | Title | Files | Key Content | Risk |
|----|-------|-------|-------------|------|
| #78 | db(schema): add event eligibility models | 8 | TicketType, TicketEligibilityOverride, EventSponsorship, CommitteeMembership | HIGH |
| #82 | feat(eligibility): evaluation service + unit tests | 12 | Pure eligibility logic, 27 unit tests | LOW |
| #79 | feat(admin): read-only eligibility viewer | 9 | Admin eligibility page, API endpoints | MEDIUM |
| #81 | admin(eligibility): read-only panel | 2 | EligibilityPanel component for event detail | LOW |
| #84 | feat(admin): ticket types page with eligibility | 2 | Ticket types admin page | LOW |

---

## 2. Hotspot Analysis

### Critical Hotspots

```
prisma/schema.prisma              - Touched by: #78, #82
src/server/eligibility/**         - Touched by: #82, #78
src/app/admin/events/[id]/**      - Touched by: #81, #79
src/app/admin/eligibility/**      - Touched by: #79
src/app/admin/ticket-types/**     - Touched by: #84
```

### Dependency Graph

```
#78 (Schema)
 └─ #82 (Service + Tests)
     ├─ #79 (Admin Viewer)
     │   └─ #81 (Event Detail Panel)
     └─ #84 (Ticket Types Page)
```

All PRs depend on #78. Service (#82) unlocks UI PRs.

---

## 3. Micro-PR Decomposition

### Wave A: Schema Foundation (HIGH Risk)

| Micro-PR | Source | Content | Deps |
|----------|--------|---------|------|
| A1 | #78 | docs: eligibility wave dispatch plan | None |
| A2 | #78 | prisma: TicketType model | None |
| A3 | #78 | prisma: TicketEligibilityOverride model | A2 |
| A4 | #78 | prisma: EventSponsorship model | None |
| A5 | #78 | prisma: CommitteeMembership model | None |
| A6 | #78 | prisma: migration file | A2, A3, A4, A5 |
| A7 | #78 | prisma/seed.ts updates for eligibility | A6 |

**Risk mitigation:**
- Land all schema changes in one migration
- Test seed on clean database
- Verify prisma generate succeeds

### Wave B: Eligibility Service (LOW Risk)

| Micro-PR | Source | Content | Deps |
|----------|--------|---------|------|
| B1 | #82 | src/server/eligibility/types.ts | Wave A complete |
| B2 | #82 | src/server/eligibility/eligibilityChecks.ts (pure logic) | B1 |
| B3 | #82 | src/server/eligibility/eligibility.ts (database integration) | B2 |
| B4 | #82 | src/app/api/v1/events/[id]/tickets/eligibility/route.ts | B3 |
| B5 | #82 | tests/unit/eligibility.spec.ts | B2 |
| B6 | #82 | tests/api/v1/eligibility.spec.ts | B4 |

**Risk mitigation:**
- Pure logic functions (B2) have no side effects
- 27 unit tests cover all eligibility paths
- API returns structured result, no mutations

### Wave C: Admin Viewer (MEDIUM Risk)

| Micro-PR | Source | Content | Deps |
|----------|--------|---------|------|
| C1 | #79 | src/app/api/admin/eligibility/route.ts | Wave B complete |
| C2 | #79 | src/app/admin/eligibility/page.tsx | C1 |
| C3 | #79 | src/app/api/v1/committees/route.ts | Wave A complete |
| C4 | #79 | src/app/api/v1/events/[id]/ticket-types/route.ts | Wave A complete |
| C5 | #79 | src/app/api/v1/me/committee-memberships/route.ts | Wave A complete |
| C6 | #79 | tests/api/v1/eligibility-contract.spec.ts | C1 |

**Risk mitigation:**
- Feature-flag: FEATURE_ELIGIBILITY_ADMIN=1
- Read-only endpoints, no mutations
- VP/Admin capability required

### Wave D: Event Detail Panel (LOW Risk)

| Micro-PR | Source | Content | Deps |
|----------|--------|---------|------|
| D1 | #81 | src/app/admin/events/[id]/EligibilityPanel.tsx | Wave C complete |
| D2 | #81 | src/app/admin/events/[id]/page.tsx (import panel) | D1 |

**Risk mitigation:**
- Feature-flag: NEXT_PUBLIC_FEATURE_ELIGIBILITY_PANEL=1
- Fails open with "Eligibility unavailable"
- Client component fetches from API

### Wave E: Ticket Types Page (LOW Risk)

| Micro-PR | Source | Content | Deps |
|----------|--------|---------|------|
| E1 | #84 | src/app/admin/ticket-types/page.tsx | Wave C complete |
| E2 | #84 | src/app/api/admin/ticket-types/route.ts | Wave A complete |

**Risk mitigation:**
- Feature-flag: NEXT_PUBLIC_FEATURE_TICKET_ELIGIBILITY=1
- Stub endpoint returns 501 until TicketType model available
- Graceful "unavailable" state

---

## 4. Integration Order

```
Phase 1: Schema (Wave A)
   └─ A1 → A2 → A3 → A4 → A5 → A6 → A7
   └─ GATE: prisma generate && prisma db push succeeds

Phase 2: Service (Wave B)
   └─ B1 → B2 → B3 → B4 → B5 → B6
   └─ GATE: 27 unit tests + API tests pass

Phase 3: Admin Viewer (Wave C)
   └─ C1 → C2 → C3 → C4 → C5 → C6
   └─ GATE: /admin/eligibility loads with feature flag

Phase 4: Event Panel (Wave D)
   └─ D1 → D2
   └─ GATE: Event detail shows eligibility panel

Phase 5: Ticket Types (Wave E)
   └─ E1 → E2
   └─ GATE: /admin/ticket-types loads with feature flag
```

---

## 5. Risk Assessment

### Schema Risk: HIGH

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| TicketType conflicts with other schema changes | MEDIUM | HIGH | Land Wave A first, before other themes |
| Migration fails on production | LOW | HIGH | Test on snapshot first |
| Seed data conflicts | LOW | MEDIUM | Conditional seeding |

### Admin Surface Risk: MEDIUM

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Eligibility calculation wrong | MEDIUM | MEDIUM | 27 unit tests, manual verification |
| Panel breaks event detail page | LOW | LOW | Feature-flagged, fails open |

### Business Logic Risk: MEDIUM

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Newbie-to-Newcomer special case wrong | MEDIUM | MEDIUM | Specific unit tests for this case |
| Committee date validation incorrect | LOW | MEDIUM | Tests for start/end date edge cases |
| Override precedence wrong | LOW | HIGH | Tests verify DENY_OVERRIDE > ALLOW_OVERRIDE |

---

## 6. Merge Captain Checklist

### Pre-Merge (Per Micro-PR)

- [ ] Branch created from current main
- [ ] Cherry-pick or manually copy code from source PR
- [ ] Run `npm run typecheck`
- [ ] Run `npm run lint`
- [ ] If schema change: run `prisma validate` and `prisma generate`
- [ ] If eligibility logic: run eligibility unit tests

### Wave A Completion Gate (CRITICAL)

- [ ] `npx prisma generate` succeeds
- [ ] `npx prisma db push` succeeds on test database
- [ ] Seed runs without errors
- [ ] No foreign key constraint violations

### Wave B Completion Gate

- [ ] All 27 unit tests pass
- [ ] API eligibility endpoint returns structured response
- [ ] Typecheck clean

### Wave C Completion Gate

- [ ] With FEATURE_ELIGIBILITY_ADMIN=1, /admin/eligibility loads
- [ ] Eligibility lookup returns correct ALLOW/DENY
- [ ] Non-admin users get 403

### Post-Merge

- [ ] CI green on main
- [ ] Update tracking issue #203 with progress

---

## 7. Estimated Merge Effort

| Wave | Micro-PRs | Est. Time per PR | Total |
|------|-----------|------------------|-------|
| A (Schema) | 7 | 25 min | 175 min |
| B (Service) | 6 | 15 min | 90 min |
| C (Viewer) | 6 | 20 min | 120 min |
| D (Panel) | 2 | 15 min | 30 min |
| E (Tickets) | 2 | 15 min | 30 min |

**Total estimated effort:** ~7.5 hours

---

## 8. What NOT to Salvage

The following should be verified before integration:

- **Eligibility override without audit** - All overrides must be audited
- **Direct database queries in components** - Must go through service layer
- **Hard-coded committee IDs** - Use configuration or lookup

---

## 9. Eligibility Logic Reference

### Decision Flow

```
evaluateEligibility(member, event, ticketType)
  │
  ├─ Check DENY_OVERRIDE → immediate DENY
  │
  ├─ Check ALLOW_OVERRIDE → immediate ALLOW
  │
  ├─ Check membership status on event date
  │   └─ Inactive → DENY (reason: MEMBERSHIP_INACTIVE)
  │
  ├─ Check ticket constraints
  │   ├─ sponsorCommitteeRequired? → check committee membership
  │   └─ workingCommitteeRequired? → check committee membership
  │
  └─ All checks pass → ALLOW
```

### Eligibility Result Shape

```typescript
interface EligibilityResult {
  ticketTypeId: string;
  decision: 'ALLOW' | 'DENY';
  reasons: EligibilityReason[];
  computedAt: Date;
}

type EligibilityReason =
  | 'MEMBERSHIP_ACTIVE'
  | 'MEMBERSHIP_INACTIVE'
  | 'SPONSOR_COMMITTEE_MEMBER'
  | 'SPONSOR_COMMITTEE_NOT_MEMBER'
  | 'WORKING_COMMITTEE_MEMBER'
  | 'WORKING_COMMITTEE_NOT_MEMBER'
  | 'OVERRIDE_ALLOW'
  | 'OVERRIDE_DENY'
  | 'NEWBIE_TO_NEWCOMER_ALLOWED';
```

---

## Appendix: Schema Models (From #78)

```prisma
model TicketType {
  id                    String   @id @default(cuid())
  eventId               String
  name                  String
  description           String?
  price                 Decimal  @default(0)
  maxQuantity           Int?
  sponsorCommitteeRequired  Boolean @default(false)
  workingCommitteeRequired  Boolean @default(false)
  // ... relations
}

model TicketEligibilityOverride {
  id            String   @id @default(cuid())
  ticketTypeId  String
  memberId      String
  action        OverrideAction  // ALLOW, DENY
  reason        String?
  createdBy     String
  createdAt     DateTime @default(now())
  // ... relations
}

model CommitteeMembership {
  id            String   @id @default(cuid())
  memberId      String
  committeeId   String
  role          String?
  startDate     DateTime
  endDate       DateTime?
  // ... relations
}

model EventSponsorship {
  id            String   @id @default(cuid())
  eventId       String
  committeeId   String
  role          String?  // PRIMARY, CO_SPONSOR
  // ... relations
}
```
