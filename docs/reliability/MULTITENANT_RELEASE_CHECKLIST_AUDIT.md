# Multi-Tenant Release Checklist Audit

Copyright (c) Santa Barbara Newcomers Club

Status: Gap Analysis
Audited: 2025-12-21

---

## Purpose

This document audits MULTITENANT_RELEASE_READINESS.md against actual CI/CD
configuration. Each checklist item is annotated with:

- **ENFORCED**: Automated check blocks release if failed
- **PARTIAL**: Some automation exists but not complete
- **MANUAL**: Requires human verification, no automation

---

## Current CI/CD Infrastructure

### GitHub Workflows (`.github/workflows/`)

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `charter.yml` | PR, push to main | Charter governance, required files, risk patterns, migration safety |
| `ci-prisma-build.yml` | PR, push to main | Prisma validation, type check, build (conditional) |

### CI Scripts (`scripts/ci/`)

| Script | Purpose |
|--------|---------|
| `check-migration-safety.sh` | Detects DROP TABLE, DROP COLUMN, UPDATE/DELETE without WHERE |
| `check-route-audit.sh` | Route audit verification |
| `validate-policies.ts` | Policy validation |

### Package.json Scripts

| Script | Purpose |
|--------|---------|
| `typecheck` | TypeScript compilation check |
| `lint` | ESLint rules |
| `test:unit` | Vitest unit tests |
| `test:immunity` | Immunity-specific tests |
| `test-admin:stable` | Playwright admin E2E (excludes quarantine) |
| `test-api:stable` | Playwright API E2E (excludes quarantine) |
| `prisma:check-migrations` | Runs migration safety script |
| `green` | Full validation: typecheck + lint + unit + seed + e2e |

### Netlify Deployment

| Branch | Environment |
|--------|-------------|
| `main` | Production |
| `sandbox` | Sandbox/staging |

---

## Checklist Audit by Section

### Section 3: Release Classification

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Every release MUST be classified | **MANUAL** | No PR template or automation requires classification |
| Classification recorded in release manifest | **MANUAL** | No manifest system exists |
| Classification cannot change after promotion | **MANUAL** | No channel/promotion system exists |
| Mechanism changes require decision memo | **MANUAL** | No enforcement |

**Gap**: No release classification system exists. Releases are just merges to main.

**Automation needed**:
- PR template with required classification field
- CI check that classification is present
- Release manifest format and storage

---

### Section 4: Channels and Eligibility

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Releases progress through dev -> experimental -> candidate -> stable | **MANUAL** | Only sandbox and main branches exist |
| Minimum duration in each channel | **MANUAL** | No automation |
| Promotion requires documented approval | **MANUAL** | No approval workflow |
| SEV-1 halts promotion | **MANUAL** | No incident integration |

**Gap**: No channel system exists. Currently: sandbox (dev) -> main (production).

**Current reality**:
- `sandbox` branch = development/testing
- `main` branch = production
- No experimental or candidate channels
- No minimum soak periods enforced

**Automation needed later**:
- Feature flag system for tenant-scoped rollout
- Channel promotion workflow
- Soak timer enforcement

---

### Section 5: Tenant Exposure Plan

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Tenant Exposure Plan documented before experimental | **MANUAL** | No template enforcement |
| Opt-in requirement documented | **MANUAL** | Single-tenant currently |
| Duration and exit criteria defined | **MANUAL** | No automation |

**Gap**: Entire tenant exposure plan is manual documentation.

**Current reality**: Single tenant (SBNC), so exposure plan is implicit.

**Automation needed later**:
- Tenant exposure plan template in PR
- Required approval from tenant admin

---

### Section 6: Data Safety Verification

| Requirement | Status | Evidence |
|-------------|--------|----------|
| No cross-tenant data access | **MANUAL** | No automated tenant isolation tests |
| Tenant ID in all new queries | **MANUAL** | No static analysis |
| No shared mutable state | **MANUAL** | No automated check |
| Audit log entries include tenant ID | **MANUAL** | No automated check |
| Backup/restore unchanged or updated | **MANUAL** | No automation |
| Data migration idempotent and reversible | **PARTIAL** | `check-migration-safety.sh` catches destructive patterns |
| Test data is not production data | **MANUAL** | Seed scripts exist but no verification |

**Hard Stops**:

| Condition | Status | Evidence |
|-----------|--------|----------|
| Unclear release classification | **MANUAL** | No classification enforcement |
| No rollback path defined | **MANUAL** | No rollback documentation requirement |
| Unknown restore path | **MANUAL** | No automation |
| Cross-tenant data access risk | **MANUAL** | No automated detection |
| Audit logging regression | **MANUAL** | No audit coverage check |
| Kill switch not configured | **MANUAL** | No kill switch verification |
| Data migration not reversible | **PARTIAL** | Dangerous patterns detected, reversibility not verified |

**Automation that EXISTS**:

```bash
# From ci_charter_checks.sh - invokes migration safety:
scripts/ci/check-migration-safety.sh

# Detects and blocks:
# - DROP TABLE (requires MIGRATION_APPROVED annotation)
# - DROP COLUMN (requires MIGRATION_APPROVED annotation)
# - UPDATE without WHERE (requires approval or WHERE clause)
# - DELETE without WHERE (requires approval or WHERE clause)
```

**Automation needed**:
- Tenant ID presence in new queries (static analysis)
- Audit log coverage check
- Tenant isolation tests in CI

---

### Section 7: Kill Switch and Rollback

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Kill switch configurable without deployment | **PARTIAL** | Feature flags can be env vars, but no standard system |
| Kill switch testable in dev | **MANUAL** | No testing workflow |
| Kill switch activation logged | **MANUAL** | No audit integration |
| Kill switch won't cause data loss | **MANUAL** | No verification |
| Rollback trigger defined | **MANUAL** | No documentation requirement |
| Rollback procedure documented | **MANUAL** | No documentation requirement |
| Rollback verification defined | **MANUAL** | No documentation requirement |
| Communication plan exists | **MANUAL** | No documentation requirement |

**Gap**: No standardized kill switch or rollback system.

**Current reality**:
- Feature flags are ad-hoc environment variables
- Rollback = revert commit and redeploy
- No instant disable mechanism

**Automation needed**:
- Feature flag service with tenant scoping
- Kill switch registry with activation logging
- Rollback playbook enforcement

---

### Section 8: Observability and Attribution

| Requirement | Status | Evidence |
|-------------|--------|----------|
| New user actions logged with actor/tenant ID | **PARTIAL** | Audit logging exists but coverage not verified |
| New errors logged with stack trace | **PARTIAL** | Next.js error handling, no coverage check |
| Release version in logs | **MANUAL** | No version tagging in logs |
| Metrics baseline established | **MANUAL** | No metrics system |
| Alert thresholds defined | **MANUAL** | No alerting system |
| Admin actions attributable | **PARTIAL** | Audit log captures actor, coverage not verified |
| Tenant ID in all log entries | **MANUAL** | No verification |
| Logs flowing from tenants | **MANUAL** | No monitoring dashboard |
| Error rate within bounds | **MANUAL** | No error rate monitoring |

**What EXISTS**:
- AuditLog model with actorId, before/after
- Error handling in API routes

**Automation needed**:
- Audit coverage verification in CI
- Error rate monitoring
- Release version tagging

---

### Section 9: Decision Memo and Promotion Rules

| Requirement | Status | Evidence |
|-------------|--------|----------|
| dev -> experimental: Dev lead + Tenant Exposure Plan | **MANUAL** | No approval workflow |
| experimental -> candidate: Dev lead + QA | **MANUAL** | No approval workflow |
| candidate -> stable: System Owner + GO/NO-GO memo | **MANUAL** | No approval workflow |
| GO/NO-GO memo required for stable | **MANUAL** | No enforcement |
| Memo stored in release archive | **MANUAL** | No archive system |

**Gap**: No promotion or approval workflow exists.

**Current reality**: Merge to main = deploy to production.

---

## Summary: Enforcement Status

| Section | Total Items | Enforced | Partial | Manual |
|---------|-------------|----------|---------|--------|
| 3. Classification | 4 | 0 | 0 | 4 |
| 4. Channels | 4 | 0 | 0 | 4 |
| 5. Tenant Exposure | 3 | 0 | 0 | 3 |
| 6. Data Safety | 7 + 7 hard stops | 0 | 2 | 12 |
| 7. Kill Switch | 8 | 0 | 1 | 7 |
| 8. Observability | 10 | 0 | 3 | 7 |
| 9. Decision Memo | 5 | 0 | 0 | 5 |
| **Total** | **48** | **0** | **6** | **42** |

**Enforcement rate: 0% fully enforced, 12.5% partially automated, 87.5% manual**

---

## What IS Currently Enforced (via CI)

These checks WILL fail a PR/push if violated:

| Check | Enforced By | Blocking? |
|-------|-------------|-----------|
| Charter files exist (ARCHITECTURAL_CHARTER.md, CLAUDE.md) | charter.yml | Yes |
| No auth bypass patterns in code | charter.yml | Warning only |
| Destructive migrations require approval annotation | check-migration-safety.sh | Yes |
| Prisma schema valid | ci-prisma-build.yml | Yes |
| TypeScript compiles | ci-prisma-build.yml | Yes |
| Build succeeds | ci-prisma-build.yml | Yes |

---

## Priority Automation Recommendations

### Phase 1: Minimum Viable Safety (Before Multi-Tenant)

1. **Release Classification in PR Template**
   - Add required field to PR template
   - CI check that field is completed

2. **Tenant Isolation Tests**
   - Add tests that verify queries include tenant ID
   - Block PR if tenant isolation violated

3. **Audit Coverage Check**
   - CI script to verify new privileged actions have audit logging
   - Block PR if coverage regresses

### Phase 2: Channel System (With Multi-Tenant)

4. **Feature Flag Service**
   - Tenant-scoped feature flags
   - Kill switch capability
   - Activation logging

5. **Channel Promotion Workflow**
   - Minimum soak period enforcement
   - Required approvals per transition
   - GO/NO-GO memo requirement

### Phase 3: Full Observability

6. **Error Rate Monitoring**
   - Baseline establishment
   - Threshold alerting
   - Automatic promotion block on SEV-1

7. **Release Version Tagging**
   - Version in all log entries
   - Deployment tracking

---

## Immediate Actions

These can be done NOW without multi-tenant:

| Action | Effort | Impact |
|--------|--------|--------|
| Add classification to PR template | Low | Documents intent |
| Add tenant ID assertion to existing tests | Medium | Catches violations |
| Add audit coverage script | Medium | Prevents regressions |
| Document rollback procedure for main | Low | Emergency preparedness |

---

## Cross-References

- [MULTITENANT_RELEASE_READINESS.md](./MULTITENANT_RELEASE_READINESS.md) - Source checklist
- [RELEASE_GOVERNANCE_PLAYBOOK.md](../OPS/RELEASE_GOVERNANCE_PLAYBOOK.md) - Gate sequence
- [FEATURE_RISK_AND_FIELD_TESTING_MODEL.md](../OPS/FEATURE_RISK_AND_FIELD_TESTING_MODEL.md) - Risk scoring
- [WA_IMMUNITY_REVIEW_GATE.md](./WA_IMMUNITY_REVIEW_GATE.md) - Data integrity review

---

*This audit reflects the actual enforcement status as of 2025-12-21.
Checklist requirements without automation are aspirational, not enforced.*
