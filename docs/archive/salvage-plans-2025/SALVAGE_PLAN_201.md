# Salvage Plan: Issue #201 - Auth/RBAC/Security Wave

**Status:** Parked
**Tracking Issue:** [#201](https://github.com/sbnctech/murmurant/issues/201)
**Theme Label:** `theme-auth`
**Date:** 2025-12-21

---

## Executive Summary

The Auth/RBAC wave contains foundational security infrastructure that the entire application depends on. Changes here affect every privileged route. The PRs are tightly coupled and must land in a specific order to avoid breaking existing auth.

**Recommendation:** Land in strict dependency order. Do NOT parallelize. Each PR must pass full test suite before next.

---

## 1. Inventory of Parked PRs

| PR | Title | Files | Key Content | Risk |
|----|-------|-------|-------------|------|
| #1 | RBAC foundation: admin protection, role model, and docs | 27 | Base role definitions, authz.ts, route protection | HIGH |
| #108 | fix(types): resolve officer and governance type errors | 14 | Capability type additions, stub modules | LOW |
| #102 | feat(audit): enforce privileged mutation audit logging | 3 | Audit infrastructure, CI script | MEDIUM |
| #106 | feat(audit): enforce audit logging on mutations | 5 | AuditEnforcementError, fail-closed audit | MEDIUM |
| #111 | feat(governance): add rollback system | 13 | Rollback policies, executor, validators | MEDIUM |
| #118 | feat(auth): Mandatory 2FA for Admin Roles | 311 | Full 2FA system, massive scope | CRITICAL |

---

## 2. Hotspot Analysis

### Critical Hotspots

```
src/lib/auth.ts               - Touched by: #1, #108, #118
src/lib/authz.ts              - Touched by: #1
prisma/schema.prisma          - Touched by: #118, #1
src/app/api/admin/**          - Touched by: All
```

### Dependency Graph

```
#1 (RBAC foundation)
 └─ #108 (Type fixes)
     └─ #102 (Audit infra)
         └─ #106 (Audit enforcement)
             └─ #111 (Rollback system)
                 └─ #118 (2FA - DO NOT LAND YET)
```

---

## 3. Micro-PR Decomposition

### Wave A: RBAC Foundation (HIGH Risk - Foundational)

| Micro-PR | Source | Content | Deps |
|----------|--------|---------|------|
| A1 | #1 | src/lib/authz.ts (route-level authorization) | None |
| A2 | #1 | Role definitions (ADMIN, VP_ACTIVITIES, EVENT_CHAIR) | A1 |
| A3 | #1 | Update admin routes to use requireCapability | A2 |
| A4 | #1 | docs/project/AUTH_AND_RBAC.md | A3 |
| A5 | #1 | tests/api/admin-auth-rbac.spec.ts | A3 |

**Risk mitigation:**
- Test EVERY admin route after A3 lands
- Keep old auth path as fallback during rollout

### Wave B: Type Fixes (LOW Risk)

| Micro-PR | Source | Content | Deps |
|----------|--------|---------|------|
| B1 | #108 | Capability type additions to auth.ts | Wave A complete |
| B2 | #108 | src/lib/governance/types.ts (local types) | B1 |
| B3 | #108 | Stub modules (annotations, boardRecords, flags) | B2 |

**Risk mitigation:**
- These are additive type changes
- Should not break existing code

### Wave C: Audit Infrastructure (MEDIUM Risk)

| Micro-PR | Source | Content | Deps |
|----------|--------|---------|------|
| C1 | #102 | src/lib/audit.ts (canonical audit API) | Wave B complete |
| C2 | #102 | scripts/ci/check-audit-coverage.sh | C1 |
| C3 | #102 | docs/architecture/audit.md | C2 |
| C4 | #106 | AuditEnforcementError class | C1 |
| C5 | #106 | auditMutationRequired() helper | C4 |
| C6 | #106 | tests/unit/audit-enforcement.spec.ts | C5 |

**Risk mitigation:**
- Audit is additive - doesn't break existing routes
- CI script identifies violations but doesn't block initially

### Wave D: Rollback System (MEDIUM Risk)

| Micro-PR | Source | Content | Deps |
|----------|--------|---------|------|
| D1 | #111 | src/lib/governance/rollback/types.ts | Wave C complete |
| D2 | #111 | src/lib/governance/rollback/policies.ts | D1 |
| D3 | #111 | src/lib/governance/rollback/executor.ts | D2 |
| D4 | #111 | src/lib/governance/rollback/validators.ts | D3 |
| D5 | #111 | Rollback API endpoints | D4 |
| D6 | #111 | tests/unit/rollback/* | D5 |
| D7 | #111 | docs/OPS/rollback-policies.md | D6 |

**Risk mitigation:**
- Rollback is a new feature, not modifying existing
- All routes require admin:full capability

### Wave E: 2FA (CRITICAL Risk - DEFER)

**DO NOT LAND #118 IN THIS WAVE**

PR #118 is 311 files and touches:
- Schema (new tables for 2FA state)
- Auth flow (new enrollment/verification flow)
- Every admin route (2FA enforcement)
- Package dependencies

**Recommendation:**
1. Wait until Waves A-D are stable
2. Re-implement 2FA from scratch using lessons learned
3. Consider splitting into: schema, enrollment API, verification API, enforcement middleware

---

## 4. Integration Order

```
Phase 1: RBAC Foundation (Wave A)
   └─ A1 → A2 → A3 → A4 → A5
   └─ GATE: Full admin test suite passes

Phase 2: Type Fixes (Wave B)
   └─ B1 → B2 → B3
   └─ GATE: npm run typecheck clean

Phase 3: Audit (Wave C)
   └─ C1 → C2 → C3 → C4 → C5 → C6
   └─ GATE: Audit tests pass

Phase 4: Rollback (Wave D)
   └─ D1 → D2 → D3 → D4 → D5 → D6 → D7
   └─ GATE: Rollback tests pass

Phase 5: 2FA (Wave E) - DEFERRED
   └─ Re-scope and re-implement after foundation stable
```

---

## 5. Risk Assessment

### Auth Flow Risk: CRITICAL

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing admin access | MEDIUM | CRITICAL | Test every admin route after Wave A |
| Capability check ordering issues | LOW | HIGH | Unit tests for each capability |
| Session/token handling regression | LOW | CRITICAL | E2E tests for login/logout flow |

### Audit Risk: MEDIUM

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Fail-closed audit blocks legitimate operations | MEDIUM | MEDIUM | Start with violations logged, not blocked |
| Audit log storage growth | LOW | LOW | Retention policy in Wave C |

### Schema Risk: HIGH

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| 2FA tables conflict with other schema work | HIGH | HIGH | Defer Wave E until other themes stable |
| Role/capability schema changes | MEDIUM | HIGH | Land role changes in Wave A only |

---

## 6. Merge Captain Checklist

### Pre-Merge (Per Micro-PR)

- [ ] Branch created from current main
- [ ] Cherry-pick or manually copy code from source PR
- [ ] Run `npm run typecheck`
- [ ] Run `npm run lint`
- [ ] Run `npm run test:unit -- tests/unit/`
- [ ] Run `npm run test:api -- tests/api/admin-auth-rbac.spec.ts`
- [ ] Verify no auth regressions: can admin still access admin routes?
- [ ] Verify no auth bypasses: can non-admin access admin routes? (should fail)

### Wave A Completion Gate (CRITICAL)

After Wave A completes, manually verify:
- [ ] Admin can access /admin/* routes
- [ ] Member cannot access /admin/* routes (403)
- [ ] All existing admin E2E tests pass
- [ ] Auth flow works: login → access admin → logout

### Post-Merge

- [ ] CI green on main
- [ ] No auth-related errors in production logs
- [ ] Update tracking issue #201 with progress

---

## 7. Estimated Merge Effort

| Wave | Micro-PRs | Est. Time per PR | Total |
|------|-----------|------------------|-------|
| A (RBAC) | 5 | 45 min | 225 min |
| B (Types) | 3 | 15 min | 45 min |
| C (Audit) | 6 | 20 min | 120 min |
| D (Rollback) | 7 | 25 min | 175 min |
| E (2FA) | DEFERRED | - | - |

**Total estimated effort:** ~9.5 hours (excluding 2FA)

---

## 8. What NOT to Salvage

The following should be discarded or re-implemented:

- **#118 (2FA)** - Too large, too risky. Re-implement in smaller pieces after foundation stable.
- **Any code that modifies session handling** - High regression risk
- **Any code that changes token format** - Breaking change for existing sessions

---

## 9. 2FA Re-implementation Guidance (Future)

When ready to implement 2FA, split into these phases:

1. **Schema only** - Add 2FA tables, generate migration
2. **Enrollment API** - POST /api/v1/auth/2fa/enroll (no enforcement yet)
3. **Verification API** - POST /api/v1/auth/2fa/verify
4. **Enforcement middleware** - Wrap protected routes
5. **Admin compliance dashboard** - GET /api/v1/admin/2fa/compliance

Each phase should be a separate PR with its own tests.

---

## Appendix: Capability Map (From #1 and #108)

```typescript
type Capability =
  // Admin
  | 'admin:full'
  // Members
  | 'members:view'
  | 'members:edit'
  | 'members:history'
  // Finance
  | 'finance:view'
  | 'finance:manage'
  // Events
  | 'events:view'
  | 'events:manage'
  // Publishing
  | 'publishing:view'
  | 'publishing:manage'
  // Comms
  | 'comms:send'
  | 'comms:manage'
  // Exports
  | 'exports:access'
  // Governance (from #108)
  | 'meetings:read'
  | 'meetings:motions:*'
  | 'meetings:minutes:*'
  | 'board_records:read'
  | 'board_records:draft:*'
  | 'governance:flags:*'
  | 'governance:rules:manage'
  | 'content:board:publish'
  | 'content:board:request_publish';
```
