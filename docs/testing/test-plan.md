# Murmurant Test Plan

**Version:** 1.0
**Last Updated:** Day 2 Sprint
**Owner:** Session 5 (Tester)

---

## Overview

This document outlines the integration testing strategy for Murmurant. It defines integration surfaces, failure modes, test priorities, and a Day-2 through Day-7 roadmap for building a robust test harness.

---

## Integration Surfaces

Murmurant has four primary integration surfaces that require coordinated testing:

### 1. Schema Layer (Session 1)

**Components:**

- Prisma schema (`prisma/schema.prisma`)
- Database migrations (`prisma/migrations/`)
- PostgreSQL database connection

**Integration Points:**

- Prisma Client generation
- Migration application
- Foreign key constraint enforcement
- Index creation and query optimization

### 2. API Layer (Session 3 - Wire)

**Components:**

- Next.js API routes (`src/app/api/`)
- Admin endpoints (`/api/admin/*`)
- Public endpoints (`/api/members`, `/api/events`)
- Health check (`/api/health`)

**Integration Points:**

- Request/response serialization
- Pagination handling
- Search and filter parameters
- Error response formatting

### 3. UI Layer (Session 2 - Page)

**Components:**

- Member layout (`src/components/layout/MemberLayout.tsx`)
- GadgetHost (`src/components/gadgets/GadgetHost.tsx`)
- My Club page (`src/app/(member)/member/page.tsx`)
- Admin dashboard (`src/app/admin/`)

**Integration Points:**

- Component mounting and rendering
- Layout composition
- Data display from API responses
- Navigation and routing

### 4. Tooling Layer (Session 4)

**Components:**

- Development scripts (`scripts/dev/`)
- Pre-commit hooks
- Documentation linting
- Makefile commands

**Integration Points:**

- Script execution environment
- Git hook triggers
- CI/CD pipeline integration

---

## Failure Modes

### Critical Failures (Block Deployment)

| ID | Surface | Failure Mode | Detection Method |
|----|---------|--------------|------------------|
| F1 | Schema | Prisma validation fails | `npx prisma validate` |
| F2 | Schema | Migration drift | Migration checksum mismatch |
| F3 | API | Health endpoint down | `/api/health` returns non-200 |
| F4 | API | Core endpoints 500 | Response status check |
| F5 | UI | Page crash on load | Playwright page error listener |
| F6 | UI | Layout fails to render | Missing data-test-id elements |

### High Priority Failures (Fix Before Release)

| ID | Surface | Failure Mode | Detection Method |
|----|---------|--------------|------------------|
| F7 | Schema | Missing foreign key | Schema content scan |
| F8 | Schema | Missing index | Query performance degradation |
| F9 | API | Incorrect response format | Response structure validation |
| F10 | API | Pagination broken | Page parameter test |
| F11 | UI | Console errors | Console message capture |
| F12 | UI | Gadget mount failure | Component visibility check |

### Medium Priority Failures (Track and Fix)

| ID | Surface | Failure Mode | Detection Method |
|----|---------|--------------|------------------|
| F13 | API | Slow response time | Response timing measurement |
| F14 | UI | Responsive layout issues | Viewport size tests |
| F15 | Tooling | Script execution failure | Exit code check |

---

## Test Priorities

### Priority 1: Smoke Tests (Day 2)

**Objective:** Ensure basic system health before any development work.

**Tests:**

- [ ] Schema validates
- [ ] Migrations exist and are structured correctly
- [ ] Health endpoint responds
- [ ] Core admin endpoints return arrays
- [ ] Member layout renders
- [ ] GadgetHost mounts without errors

**Location:** `tests/smoke/`

**Run Command:**

```bash
npx playwright test tests/smoke/
```

### Priority 2: Contract Tests (Day 3-4)

**Objective:** Verify API contracts match DTO specifications.

**Tests:**

- [ ] Member DTO structure validation
- [ ] Event DTO structure validation
- [ ] Registration DTO structure validation
- [ ] Error response format validation
- [ ] Pagination metadata validation

**Location:** `tests/contract/` (to be created)

### Priority 3: Integration Tests (Day 4-5)

**Objective:** Verify cross-layer integration works correctly.

**Tests:**

- [ ] API returns data that UI can display
- [ ] Search results match database content
- [ ] Pagination works end-to-end
- [ ] Export generates correct format

**Location:** `tests/integration/` (to be created)

### Priority 4: Regression Tests (Day 6-7)

**Objective:** Prevent previously fixed issues from recurring.

**Tests:**

- [ ] All previously failing scenarios
- [ ] Edge cases discovered during development
- [ ] User-reported issues

**Location:** `tests/regression/` (to be created)

---

## Day-2 to Day-7 Roadmap

### Day 2 (Current Sprint)

**Deliverables:**

1. [x] Create `tests/smoke/` directory structure
2. [x] `schema-smoke.test.ts` - Prisma validation, model presence
3. [x] `api-smoke.test.ts` - Health check, core endpoints
4. [x] `ui-smoke.test.ts` - Layout rendering, gadget mounting
5. [x] `docs/testing/test-plan.md` - This document

**Success Criteria:**

- All smoke tests pass
- CI can run smoke tests as gate

### Day 3

**Deliverables:**

1. Create `tests/contract/` directory
2. `member-contract.test.ts` - Member DTO validation
3. `event-contract.test.ts` - Event DTO validation
4. Add contract test target to Makefile

**Success Criteria:**

- DTO structures are documented and enforced
- Breaking changes detected before merge

### Day 4

**Deliverables:**

1. `registration-contract.test.ts` - Registration DTO validation
2. `error-contract.test.ts` - Error response format
3. `pagination-contract.test.ts` - Pagination metadata
4. Create `tests/integration/` directory

**Success Criteria:**

- All API contracts have test coverage
- Error handling is consistent

### Day 5

**Deliverables:**

1. `api-ui-integration.test.ts` - API to UI data flow
2. `search-integration.test.ts` - Search across layers
3. `export-integration.test.ts` - Export functionality
4. Add integration test target to Makefile

**Success Criteria:**

- Cross-layer integration verified
- Data flows correctly from database to UI

### Day 6

**Deliverables:**

1. Create `tests/regression/` directory
2. Catalog known issues and create regression tests
3. `admin-regression.test.ts` - Admin-specific regressions
4. `member-regression.test.ts` - Member-specific regressions

**Success Criteria:**

- Known issues have test coverage
- Regression test suite established

### Day 7

**Deliverables:**

1. Full test suite review and cleanup
2. Update CI configuration for all test suites
3. Performance baseline tests
4. Documentation update

**Success Criteria:**

- All test suites pass
- CI pipeline fully integrated
- Test coverage documented

---

## Test Execution Commands

### Quick Smoke (Pre-Development)

```bash
make smoke
# or
npx playwright test tests/smoke/
```

### Full Suite

```bash
make test
```

### Specific Layers

```bash
# Schema tests only
npx playwright test tests/smoke/schema-smoke.test.ts

# API tests only
make test-api

# Admin UI tests only
make test-admin

# Smoke tests only
npx playwright test tests/smoke/
```

### Preflight (Pre-Push)

```bash
make preflight
```

---

## Test File Naming Conventions

| Pattern | Purpose | Example |
|---------|---------|---------|
| `*-smoke.test.ts` | Day-2 smoke tests | `schema-smoke.test.ts` |
| `*-contract.test.ts` | DTO/API contract tests | `member-contract.test.ts` |
| `*-integration.test.ts` | Cross-layer tests | `api-ui-integration.test.ts` |
| `*-regression.test.ts` | Regression prevention | `admin-regression.test.ts` |
| `*.spec.ts` | Feature-specific tests | `admin-members.spec.ts` |

---

## Test Data Strategy

### Mock Data (Current)

- `src/lib/mockMembers.ts` - Member fixtures
- `src/lib/mockEvents.ts` - Event fixtures
- `src/lib/mockRegistrations.ts` - Registration fixtures

### Seed Data (Planned)

- `prisma/seed.ts` - Database seed script
- Deterministic data for reproducible tests
- Realistic data volumes for performance tests

---

## CI Integration

### Current Pipeline

1. `make doctor` - Environment check
2. `make types` - TypeScript validation
3. `make lint` - ESLint check
4. `make test` - Playwright tests

### Recommended Additions

1. Add smoke tests as first gate
2. Run contract tests before integration tests
3. Cache Playwright browsers
4. Parallel test execution for speed

---

## Monitoring and Alerting

### Test Failure Tracking

- Track test failure rates over time
- Identify flaky tests for stabilization
- Monitor test duration trends

### Coverage Metrics

- Statement coverage target: 80%
- Branch coverage target: 70%
- Integration surface coverage: 100%

---

## Appendix: Model Reference

### Prisma Models (14 total)

1. **Member** - Club members
2. **MembershipStatus** - Status codes (ACTIVE, INACTIVE, etc.)
3. **Committee** - Club committees
4. **CommitteeRole** - Roles within committees
5. **Term** - Committee terms
6. **RoleAssignment** - Member-to-role assignments
7. **UserAccount** - Authentication accounts
8. **Event** - Club events
9. **EventRegistration** - Event sign-ups
10. **Photo** - Photo records
11. **PhotoAlbum** - Photo collections
12. **EmailLog** - Email audit log

### Enums

1. **RegistrationStatus** - PENDING, CONFIRMED, WAITLISTED, CANCELLED, NO_SHOW
2. **EmailStatus** - QUEUED, SENT, DELIVERED, BOUNCED, FAILED

---

## Appendix: API Endpoints Reference

### Health

- `GET /api/health` - System health check

### Admin APIs

- `GET /api/admin/members` - List members
- `GET /api/admin/members/[id]` - Get member detail
- `GET /api/admin/events` - List events
- `GET /api/admin/events/[id]` - Get event detail
- `GET /api/admin/registrations` - List registrations
- `GET /api/admin/registrations/[id]` - Get registration detail
- `GET /api/admin/activity` - Activity log
- `GET /api/admin/dashboard` - Dashboard data
- `GET /api/admin/summary` - Summary stats
- `GET /api/admin/search` - Global search
- `GET /api/admin/export/*` - Data export endpoints

### Public APIs

- `GET /api/members` - Public member list
- `GET /api/events` - Public event list
- `GET /api/registrations` - Registration endpoint
