# Murmurant Constitutional Audit Report

**Audit Date**: 2025-12-16
**Auditor**: Constitutional Audit Task
**Charter Version**: 1.0
**Status**: Initial Audit

---

## Executive Summary

This audit evaluated the Murmurant codebase against the Architectural Charter principles (P1-P10) and anti-patterns (N1-N8). The audit identified **23 violations** across **6 categories** that require remediation.

| Severity | Count | Description |
|----------|-------|-------------|
| CRITICAL | 9 | Missing authentication on admin routes |
| HIGH | 6 | Inline role checks instead of capability checks |
| MEDIUM | 5 | Silent error handling (no logging) |
| LOW | 3 | Technical error messages exposed to users |

---

## Compliance Matrix

| Principle | Status | Violations | Notes |
|-----------|--------|------------|-------|
| P1: Identity and authorization provable | PARTIAL | 9 | 9 admin routes lack auth checks |
| P2: Default deny, least privilege | FAIL | 9 | Routes allow access by default |
| P3: State machines over booleans | PARTIAL | 1 | `isPublished` boolean found |
| P4: No hidden rules | PASS | 0 | - |
| P5: Undoable/reversible actions | PASS | 0 | Soft delete patterns used |
| P6: Human-first UI language | PARTIAL | 3 | "Forbidden" in error messages |
| P7: Observability | PARTIAL | 5+ | Silent catch blocks |
| P8: Stable schema/APIs | PASS | 0 | - |
| P9: Security fails closed | PARTIAL | 9 | Open routes = fail open |
| P10: Chatbots not authorities | PASS | 0 | - |

| Anti-Pattern | Status | Violations | Notes |
|--------------|--------|------------|-------|
| N1: UI-only security | PASS | 0 | - |
| N2: Coarse role checks | FAIL | 6 | Inline role checks in eventAuth.ts |
| N3: Rigid workflows | PASS | 0 | - |
| N4: Hidden admin settings | PASS | 0 | - |
| N5: Automation without audit | PARTIAL | Unknown | Need deeper audit |
| N6: No permission boundary tests | PARTIAL | 15+ | 27 routes, ~12 test files |
| N7: Excess PII exposure | PASS | 0 | - |
| N8: Template fragility | PASS | 0 | - |

---

## Critical Violations

### V1: Admin Routes Without Authentication [P1, P2, P9]

**Severity**: CRITICAL
**Count**: 9 routes

The following admin API routes lack authentication checks:

| Route | File |
|-------|------|
| GET /api/admin/members | src/app/api/admin/members/route.ts |
| GET/POST /api/admin/members/[id] | src/app/api/admin/members/[id]/route.ts |
| GET /api/admin/events | src/app/api/admin/events/route.ts |
| GET/PUT/DELETE /api/admin/events/[id] | src/app/api/admin/events/[id]/route.ts |
| GET /api/admin/search | src/app/api/admin/search/route.ts |
| GET /api/admin/summary | src/app/api/admin/summary/route.ts |
| GET /api/admin/registrations | src/app/api/admin/registrations/route.ts |
| GET /api/admin/registrations/[id] | src/app/api/admin/registrations/[id]/route.ts |
| GET /api/admin/registrations/search | src/app/api/admin/registrations/search/route.ts |

**Charter Violation**:

- P1: "Every privileged action must be attributable to a real authenticated identity"
- P2: "Access must be denied by default"
- P9: "If security checks fail... deny action"

**Required Fix**:
Add `requireAuth()` or `requireCapability()` to each route handler.

---

### V2: Inline Role Checks [N2]

**Severity**: HIGH
**Count**: 6 occurrences

The following files contain direct role checks instead of capability-based authorization:

**File**: `src/lib/eventAuth.ts`

```typescript
// Lines 35, 42
function hasVPAccess(role: GlobalRole): boolean {
  return role === "admin" || role === "vp-activities";
}

function canDelete(role: GlobalRole): boolean {
  return role === "admin";
}
```

**File**: `src/lib/serviceHistory/approvals.ts`

```typescript
// Lines 23, 75, 91, 202
if (role === "president") { ... }
```

**Charter Violation**:

- N2: "Roles may exist, but access must be capability- and scope-driven"

**Required Fix**:
Refactor to use capability checks:

```typescript
// Correct pattern
if (hasCapability(user, "events:delete")) { ... }
```

---

### V3: Silent Error Handling [P7]

**Severity**: MEDIUM
**Count**: 5+ occurrences

Multiple files have empty catch blocks that swallow errors without logging:

| File | Line |
|------|------|
| src/lib/files/localAdapter.ts | 96, 123 |
| src/lib/email.ts | 33, 65, 92 |
| src/components/officer/MinutesPipeline.tsx | 163, 186 |
| src/app/officer/meetings/page.tsx | 91 |
| src/components/officer/BoardRecordsLibrary.tsx | 152, 174, 192, 209 |
| src/app/admin/page.tsx | 104, 116 |

**Example**:

```typescript
} catch {
  // Empty - error is silently swallowed
}
```

**Charter Violation**:

- P7: "Never silent failures (especially for cron, sends, transitions)"

**Required Fix**:

```typescript
} catch (error) {
  console.error("Operation failed:", error);
  // Handle appropriately
}
```

---

### V4: Technical Error Messages [P6]

**Severity**: LOW
**Count**: 3+ occurrences

Error responses expose technical terminology to users:

| File | Issue |
|------|-------|
| src/lib/auth.ts:458 | `{ error: "Forbidden" }` |
| src/lib/eventAuth.ts:120,189,228 | `{ error: "Forbidden" }` |
| src/app/api/admin/content/themes/route.ts | `{ error: "Forbidden" }` |

**Charter Violation**:

- P6: "Never 'Forbidden', '500', stack traces, or technical exception text shown to users"

**Required Fix**:
Use human-friendly error messages:

```typescript
// Instead of
{ error: "Forbidden", message: "..." }

// Use
{ error: "Access denied", message: "You don't have permission to do this. Contact your administrator if you need access." }
```

---

### V5: Ad-Hoc Boolean Flags [P3]

**Severity**: MEDIUM
**Count**: 1 occurrence

**File**: `src/lib/governance/rulesGuidance.ts`

```typescript
if (publishedOnly) where.isPublished = true;
```

**Charter Violation**:

- P3: "Never accumulating boolean flags that imply state"

**Required Fix**:
Use explicit status enum instead of `isPublished` boolean.

---

### V6: Timezone-Unsafe Date Operations [Charter N/A but best practice]

**Severity**: LOW
**Count**: 2 occurrences

| File | Issue |
|------|-------|
| src/lib/publishing/email.ts:86 | `new Date().getFullYear()` without timezone |
| src/app/admin/comms/lists/MailingListsTable.tsx:90 | `.toLocaleString()` locale-dependent |

These are not direct charter violations but represent risky patterns that could cause inconsistent behavior.

---

### V7: Missing Permission Boundary Tests [N6]

**Severity**: MEDIUM
**Count**: ~15 routes

27 admin API routes exist, but only 12 test files contain permission-related assertions (403, Forbidden, denied).

**Charter Violation**:

- N6: "Every sensitive endpoint must have positive tests (allowed), negative tests (denied), regression tests"

**Required Fix**:
Add permission boundary tests for all admin routes, including:

- Test with admin token (should succeed)
- Test with unauthorized role (should return 403)
- Test without token (should return 401)

---

## Compliant Patterns Found

The following patterns demonstrate charter compliance:

1. **Capability-based auth in auth.ts**: `hasCapability()`, `requireCapability()` functions
2. **Audit logging in publishing routes**: AuditLog creation in content/comms APIs
3. **State machine patterns**: PageStatus, CampaignStatus enums with explicit states
4. **Timezone utilities**: `src/lib/timezone.ts` provides safe date handling
5. **Soft delete patterns**: ARCHIVED status instead of hard delete
6. **data-test-id attributes**: Consistent test hooks in UI components

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation Priority |
|------|------------|--------|---------------------|
| Unauthorized data access | HIGH | HIGH | CRITICAL |
| Silent failures in production | MEDIUM | HIGH | HIGH |
| Inconsistent authorization | MEDIUM | MEDIUM | HIGH |
| Poor user experience on errors | LOW | LOW | LOW |

---

## Recommendations

### Immediate Actions (Before Next Release)

1. Add authentication to all 9 unauthenticated admin routes
2. Create negative test cases for all admin endpoints

### Short-Term Actions (Next Sprint)

3. Refactor inline role checks to capability checks
4. Replace silent catch blocks with logged error handling
5. Add human-friendly error message templates

### Medium-Term Actions (Next Quarter)

6. Replace `isPublished` booleans with status enums
7. Complete test coverage for all permission boundaries
8. Create automated charter compliance checks

---

## Appendix: Files Requiring Changes

| Priority | File | Violations |
|----------|------|------------|
| CRITICAL | src/app/api/admin/members/route.ts | P1, P2, P9 |
| CRITICAL | src/app/api/admin/members/[id]/route.ts | P1, P2, P9 |
| CRITICAL | src/app/api/admin/events/route.ts | P1, P2, P9 |
| CRITICAL | src/app/api/admin/events/[id]/route.ts | P1, P2, P9 |
| CRITICAL | src/app/api/admin/search/route.ts | P1, P2, P9 |
| CRITICAL | src/app/api/admin/summary/route.ts | P1, P2, P9 |
| CRITICAL | src/app/api/admin/registrations/route.ts | P1, P2, P9 |
| CRITICAL | src/app/api/admin/registrations/[id]/route.ts | P1, P2, P9 |
| CRITICAL | src/app/api/admin/registrations/search/route.ts | P1, P2, P9 |
| HIGH | src/lib/eventAuth.ts | N2 |
| HIGH | src/lib/serviceHistory/approvals.ts | N2 |
| MEDIUM | src/lib/files/localAdapter.ts | P7 |
| MEDIUM | src/lib/email.ts | P7 |
| MEDIUM | src/components/officer/*.tsx | P7 |
| LOW | src/lib/auth.ts | P6 |

---

## Sign-Off

- [ ] Audit findings reviewed by repository owner
- [ ] WORK_PLAN.md created with remediation tasks
- [ ] Critical issues scheduled for immediate fix
- [ ] Charter compliance script created

