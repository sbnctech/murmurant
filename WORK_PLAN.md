# Murmurant Charter Compliance Work Plan

**Created**: 2025-12-16
**Source**: Constitutional Audit Report
**Status**: Ready for Execution

---

## Overview

This work plan addresses 23 charter violations identified in the Constitutional Audit. Tasks are organized by priority and estimated complexity.

---

## Phase 1: Critical Security Fixes (Immediate)

### Task 1.1: Add Authentication to Admin Member Routes

**Severity**: CRITICAL
**Charter Violations**: P1, P2, P9
**Estimated Effort**: 2 hours

**Files to modify**:

- `src/app/api/admin/members/route.ts`
- `src/app/api/admin/members/[id]/route.ts`
- `src/app/api/admin/members/[id]/history/route.ts`

**Implementation**:

```typescript
import { requireAuth, requireCapability } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.ok) return authResult.response;

  // For member list, require members:view capability
  if (!hasCapability(authResult.context, "members:view")) {
    return NextResponse.json(
      { error: "Access denied", message: "You don't have permission to view members" },
      { status: 403 }
    );
  }

  // ... existing logic
}
```

**Tests to add**:

- `tests/api/admin-members-auth.spec.ts` with 401/403 tests

---

### Task 1.2: Add Authentication to Admin Event Routes

**Severity**: CRITICAL
**Charter Violations**: P1, P2, P9
**Estimated Effort**: 2 hours

**Files to modify**:

- `src/app/api/admin/events/route.ts`
- `src/app/api/admin/events/[id]/route.ts`

**Implementation**:
Use existing `requireEventViewAccess()` and `requireEventEditAccess()` from `eventAuth.ts`.

**Tests to add**:

- `tests/api/admin-events-auth.spec.ts` with 401/403 tests

---

### Task 1.3: Add Authentication to Admin Registration Routes

**Severity**: CRITICAL
**Charter Violations**: P1, P2, P9
**Estimated Effort**: 2 hours

**Files to modify**:

- `src/app/api/admin/registrations/route.ts`
- `src/app/api/admin/registrations/[id]/route.ts`
- `src/app/api/admin/registrations/search/route.ts`

**Implementation**:

```typescript
const authResult = await requireAuth(req);
if (!authResult.ok) return authResult.response;

if (!hasCapability(authResult.context, "registrations:view")) {
  return NextResponse.json(
    { error: "Access denied", message: "You don't have permission to view registrations" },
    { status: 403 }
  );
}
```

**Tests to add**:

- `tests/api/admin-registrations-auth.spec.ts`

---

### Task 1.4: Add Authentication to Admin Utility Routes

**Severity**: CRITICAL
**Charter Violations**: P1, P2, P9
**Estimated Effort**: 1 hour

**Files to modify**:

- `src/app/api/admin/search/route.ts`
- `src/app/api/admin/summary/route.ts`

**Implementation**:
Add `requireAuth()` check at top of each handler.

---

## Phase 2: Authorization Refactoring (High Priority)

### Task 2.1: Replace Inline Role Checks in eventAuth.ts

**Severity**: HIGH
**Charter Violations**: N2
**Estimated Effort**: 3 hours

**File**: `src/lib/eventAuth.ts`

**Current code**:

```typescript
function hasVPAccess(role: GlobalRole): boolean {
  return role === "admin" || role === "vp-activities";
}
```

**Refactored code**:

```typescript
import { hasCapability, AuthContext } from "@/lib/auth";

function hasVPAccess(context: AuthContext): boolean {
  return hasCapability(context, "events:view_all") ||
         hasCapability(context, "admin:full");
}
```

**Required capability additions to auth.ts**:

- `events:view_all` - view all events including drafts
- `events:edit_all` - edit all events
- `events:delete` - delete events (admin only)

---

### Task 2.2: Replace Inline Role Checks in approvals.ts

**Severity**: HIGH
**Charter Violations**: N2
**Estimated Effort**: 2 hours

**File**: `src/lib/serviceHistory/approvals.ts`

Replace `role === "president"` checks with:

```typescript
if (hasCapability(context, "transitions:approve_as_president")) {
  // President-specific approval logic
}
```

---

## Phase 3: Error Handling Improvements (Medium Priority)

### Task 3.1: Add Logging to Silent Catch Blocks

**Severity**: MEDIUM
**Charter Violations**: P7
**Estimated Effort**: 3 hours

**Files to modify**:

- `src/lib/files/localAdapter.ts` (lines 96, 123)
- `src/lib/email.ts` (lines 33, 65, 92)
- `src/components/officer/MinutesPipeline.tsx` (lines 163, 186)
- `src/app/officer/meetings/page.tsx` (line 91)
- `src/components/officer/BoardRecordsLibrary.tsx` (lines 152, 174, 192, 209)
- `src/app/admin/page.tsx` (lines 104, 116)

**Pattern to apply**:

```typescript
// Before
} catch {
  // Silent failure
}

// After
} catch (error) {
  console.error("[ComponentName] Operation failed:", error);
  // Set error state for UI feedback
  setError("Unable to complete action. Please try again.");
}
```

---

### Task 3.2: Create Human-Friendly Error Message Templates

**Severity**: LOW
**Charter Violations**: P6
**Estimated Effort**: 2 hours

**Create**: `src/lib/errors/messages.ts`

```typescript
export const ERROR_MESSAGES = {
  ACCESS_DENIED: {
    error: "Access denied",
    message: "You don't have permission to perform this action. Contact your administrator if you need access.",
  },
  NOT_FOUND: {
    error: "Not found",
    message: "The requested item could not be found.",
  },
  UNAUTHORIZED: {
    error: "Sign in required",
    message: "Please sign in to continue.",
  },
  VALIDATION_FAILED: {
    error: "Invalid input",
    message: "Please check your input and try again.",
  },
};
```

**Update files**:

- `src/lib/auth.ts`
- `src/lib/eventAuth.ts`
- All routes returning `{ error: "Forbidden" }`

---

## Phase 4: Test Coverage (Medium Priority)

### Task 4.1: Add Permission Boundary Tests

**Severity**: MEDIUM
**Charter Violations**: N6
**Estimated Effort**: 4 hours

**Create test files for each admin route**:

| Route | Test File |
|-------|-----------|
| /api/admin/members/* | tests/api/admin-members-auth.spec.ts |
| /api/admin/events/* | tests/api/admin-events-auth.spec.ts |
| /api/admin/registrations/* | tests/api/admin-registrations-auth.spec.ts |
| /api/admin/search | tests/api/admin-search-auth.spec.ts |
| /api/admin/summary | tests/api/admin-summary-auth.spec.ts |

**Test template**:

```typescript
import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test.describe("Admin Members API Authorization", () => {
  test("admin token can access members list", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/members`, {
      headers: { Authorization: "Bearer test-admin-token" },
    });
    expect(response.status()).toBe(200);
  });

  test("unauthenticated request returns 401", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/members`);
    expect(response.status()).toBe(401);
  });

  test("member token returns 403", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/members`, {
      headers: { Authorization: "Bearer test-member-token" },
    });
    expect(response.status()).toBe(403);
  });
});
```

---

## Phase 5: Long-Term Improvements (Low Priority)

### Task 5.1: Replace isPublished Boolean with Status Enum

**Severity**: LOW
**Charter Violations**: P3
**Estimated Effort**: 4 hours

**File**: `src/lib/governance/rulesGuidance.ts` and related

Replace `isPublished: boolean` with:

```prisma
enum RulesGuidanceStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

**Migration required**.

---

### Task 5.2: Audit Automation for No-Audit Mutations

**Severity**: MEDIUM
**Charter Violations**: N5
**Estimated Effort**: 6 hours

Audit all POST/PUT/DELETE handlers to ensure AuditLog entries are created.

**Create**: `src/lib/audit/createAuditEntry.ts`

```typescript
export async function createAuditEntry({
  action,
  resourceType,
  resourceId,
  actorId,
  before,
  after,
  metadata,
}: AuditEntryParams) {
  return prisma.auditLog.create({
    data: {
      action,
      resourceType,
      resourceId,
      performedBy: actorId,
      before: before ? JSON.stringify(before) : null,
      after: after ? JSON.stringify(after) : null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}
```

---

## Execution Order

| Week | Tasks | Effort |
|------|-------|--------|
| 1 | 1.1, 1.2, 1.3, 1.4 | 7 hours |
| 2 | 2.1, 2.2, 4.1 (partial) | 9 hours |
| 3 | 3.1, 3.2, 4.1 (complete) | 9 hours |
| 4 | 5.1, 5.2 | 10 hours |

---

## Acceptance Criteria

Each task is complete when:

1. Code changes implemented
2. Unit/E2E tests added and passing
3. `npm run green` passes
4. Charter principles cited in PR description
5. Documentation updated if behavior changed

---

## Phase 2.x: Capability Normalization and Scope Hardening

### Task 2.x.1: Normalize requireAdmin to Capability-Based

**Status**: COMPLETED
**Charter Violations Addressed**: N2
**PR**: feat/capability-scope-hardening

**Changes made**:
- `requireAdmin()` in auth.ts now uses `hasCapability(role, "admin:full")` instead of `role !== "admin"`
- `requireAdminOnly()` and `requireVPOrAdmin()` in eventAuth.ts normalized to use capabilities
- `hasVPAccess()` and `canDelete()` in eventAuth.ts use `hasCapability()` instead of role strings
- Inline role checks in `/api/admin/transitions/summary` and `/api/v1/admin/transitions/widget` replaced with capability checks

### Task 2.x.2: Add Object Scope to High-Risk Endpoints

**Status**: COMPLETED (explicit scopes) / DEFERRED (full ownership validation)

**Endpoints with explicit scopes**:
| Endpoint | Capability | Scope |
|----------|------------|-------|
| `/api/v1/admin/members/[id]` GET/PATCH | members:view | `{ memberId: id }` |
| `/api/v1/admin/members/[id]/history` GET | members:history | `{ memberId: id }` |
| `/api/v1/admin/members/[id]/status` PATCH | members:view | `{ memberId: id }` |
| `/api/v1/admin/registrations/[id]` GET/DELETE | registrations:view | `{ registrationId: id }` |

**New auth functions added**:
- `requireCapabilityWithScope()` - Requires capability with explicit object scope parameter
- `canAccessMember()` - Helper to check member-scoped access (self or admin)
- `ObjectScope` type - Union type for scoped authorizations

**Deferred** (full ownership validation):
- Database queries to validate scope ownership are left as TODOs in route handlers
- Rationale: Requires event/registration/member lookup which depends on business logic
- Pattern is established; full validation can be added when routes are wired

### Task 2.x.3: Deny-Path Tests

**Status**: COMPLETED
**File**: `tests/api/capability-deny-paths.spec.ts`

**Test coverage**:
- Member endpoints: member role → 403, webmaster → 403, admin → 200/404
- Registration endpoints: unauthorized roles → 403
- Transition endpoints: webmaster/event-chair → 403, president/admin → allowed
- Unauthenticated access → 401 for all protected endpoints
- N2 compliance: Verifies requireAdmin uses capability, not role string
- P6 compliance: Verifies error message says "Access denied" not "Forbidden"

---

## Tracking

| Task | Assigned | Status | PR | Notes |
|------|----------|--------|-----|-------|
| 1.1 | - | Not Started | - | - |
| 1.2 | - | Not Started | - | - |
| 1.3 | - | Not Started | - | - |
| 1.4 | - | Not Started | - | - |
| 2.1 | - | Completed | feat/capability-scope-hardening | Merged with 2.x |
| 2.2 | - | Not Started | - | - |
| 2.x.1 | AI | Completed | feat/capability-scope-hardening | requireAdmin normalized |
| 2.x.2 | AI | Completed | feat/capability-scope-hardening | Explicit scopes added |
| 2.x.3 | AI | Completed | feat/capability-scope-hardening | Deny-path tests added |
| 3.1 | - | Not Started | - | - |
| 3.2 | - | Not Started | - | - |
| 4.1 | - | Partial | feat/capability-scope-hardening | Deny-path tests added |
| 5.1 | - | Not Started | - | - |
| 5.2 | - | Not Started | - | - |

