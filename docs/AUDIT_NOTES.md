# Production Auth Hardening - Audit Notes

**Branch:** `feature/production-auth-hardening`
**Date:** 2025-12-16
**Charter Principles Applied:** P1, P2, P9, N5

## Summary

This PR implements production-grade authentication and authorization hardening per the Architectural Charter requirements. The changes ensure that:

1. Test tokens and dev bypasses are rejected in production
2. All API routes enforce server-side authorization
3. Cookies use secure settings (HttpOnly, Secure, SameSite=Lax)
4. Audit logging is available for privileged mutations
5. CI enforcement prevents unprotected routes from being merged

## Changes Made

### 1. Production Auth Hardening (`src/lib/auth.ts`)

- Added `isProduction()` function to detect production mode
- Added `validateAuthSecret()` validation at module load
- Added `isAuthConfigValid()` runtime check
- Added `registrations:manage` capability for registration mutations
- Modified `requireAuth()` to:
  - Fail closed if AUTH_SECRET is missing/weak in production (P9)
  - Reject all test tokens in production mode
  - Only accept E2E bypass header in development
- Minimum AUTH_SECRET length: 32 characters (OWASP guideline)

**Charter Principles:**
- P1: Identity must be provable - real tokens only in production
- P9: Fail closed - missing/weak secrets = deny all

### 2. Route Authorization (`src/app/api/**/route.ts`)

Added `requireCapability()` or `requireAuth()` checks to all unprotected API routes:

| Route | Capability Required |
|-------|---------------------|
| `/api/v1/admin/events/*` | `events:view`, `events:edit`, `events:delete` |
| `/api/v1/admin/events/[id]/cancel` | `events:edit` |
| `/api/v1/admin/events/[id]/duplicate` | `events:edit` |
| `/api/v1/admin/registrations/*` | `registrations:view` |
| `/api/v1/admin/registrations/[id]/promote` | `registrations:manage` |
| `/api/v1/admin/registrations/[id]` DELETE | `registrations:manage` |
| `/api/v1/admin/members/[id]/status` | `members:view` |
| `/api/v1/admin/members/[id]/history` | `members:history` |
| `/api/v1/members/*` | `requireAuth` (any authenticated member) |
| `/api/v1/events/[id]/register` | `requireAuth` (any authenticated member) |
| `/api/sms/test` | `comms:send` + disabled in production |

**Charter Principles:**
- P2: Default deny, least privilege - routes require explicit capability
- P1: All authorization is server-side

### 3. CI Enforcement (`scripts/ci/check-route-auth.sh`)

- Scans all `route.ts` files for authorization patterns
- Allowlist for intentionally public routes
- Returns exit code 1 if any route lacks authorization
- Patterns checked: `requireAuth`, `requireCapability`, `requireAdmin`, `requireRole`, `CRON_SECRET`, `withAuthz`

### 4. Secure Cookie Settings (`src/lib/cookies.ts`)

New cookie utility module with:
- `SECURE_COOKIE_DEFAULTS`: HttpOnly=true, Secure=isProduction(), SameSite=lax
- `getSessionCookieOptions()`: 24-hour session cookies
- `getRefreshCookieOptions()`: 7-day refresh token cookies
- `getClearCookieOptions()`: For logout (maxAge=0)
- `validateCookieSecurity()`: Runtime validation

### 5. Audit Logging (`src/lib/audit.ts`)

Minimal audit helper for privileged mutations:
- `createAuditEntry()`: Core function logging action, actor, resource, before/after state
- Convenience functions: `auditCreate()`, `auditUpdate()`, `auditDelete()`, `auditPublish()`, `auditSend()`
- Captures: IP address, user agent, request ID

**Charter Principles:**
- N5: Never let automation mutate data without audit logs

### 6. Tests

**Unit tests (`tests/unit/`):**
- `auth-capabilities.spec.ts`: Existing - verifies capability matrix
- `auth-production.spec.ts`: New - verifies production hardening and cookie settings

**API tests (`tests/api/`):**
- `auth-deny-paths.spec.ts`: New - verifies 401/403 responses for unauthorized access

## Production Deployment Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production`
- [ ] Set `AUTH_SECRET` to a cryptographically random string >= 32 characters
- [ ] Ensure HTTPS is enabled (required for Secure cookies)
- [ ] Run `./scripts/ci/check-route-auth.sh` to verify all routes are protected
- [ ] Review this PR's changes against the Charter principles

## Test Tokens Rejected in Production

The following tokens are explicitly rejected when `NODE_ENV=production`:

- `test-*` prefixed tokens
- `admin-token`, `webmaster-token`, `vp-token`, `chair-token`, `member-token`
- `president-token`, `past-president-token`
- `secretary-token`, `parliamentarian-token`, `publisher-token`

## Files Changed

```
src/lib/auth.ts                                    # Production hardening
src/lib/cookies.ts                                 # NEW: Secure cookie utilities
src/lib/audit.ts                                   # NEW: Audit logging helper
scripts/ci/check-route-auth.sh                     # NEW: CI enforcement
src/app/api/v1/admin/events/route.ts              # Added auth
src/app/api/v1/admin/events/[id]/route.ts         # Added auth
src/app/api/v1/admin/events/[id]/cancel/route.ts  # Added auth
src/app/api/v1/admin/events/[id]/duplicate/route.ts # Added auth
src/app/api/v1/admin/registrations/route.ts       # Added auth
src/app/api/v1/admin/registrations/pending/route.ts # Added auth
src/app/api/v1/admin/registrations/[id]/route.ts  # Added auth
src/app/api/v1/admin/registrations/[id]/promote/route.ts # Added auth
src/app/api/v1/admin/members/[id]/status/route.ts # Added auth
src/app/api/v1/admin/members/[id]/history/route.ts # Added auth
src/app/api/v1/members/route.ts                   # Added auth
src/app/api/v1/members/[id]/route.ts              # Added auth
src/app/api/v1/events/[id]/register/route.ts      # Added auth
src/app/api/sms/test/route.ts                     # Added auth + production disable
tests/unit/auth-production.spec.ts                # NEW: Unit tests
tests/api/auth-deny-paths.spec.ts                 # NEW: API tests
docs/AUDIT_NOTES.md                               # NEW: This file
```

## Audit Wiring (feat/audit-logging-wiring)

**Date:** 2025-12-16
**Charter Principles Applied:** P7 (Observability), N5 (No mutation without audit)

### Canonical Helper API

Added `auditMutation()` to `src/lib/audit.ts` as the single preferred entry point:

```typescript
await auditMutation(req, auth.context, {
  action: "CREATE" | "UPDATE" | "DELETE" | "PUBLISH" | "UNPUBLISH" | "SEND" | "ARCHIVE",
  capability: "users:manage",  // The capability that authorized this action
  objectType: "TransitionPlan",
  objectId: plan.id,
  metadata: { /* minimal, no PII */ },
});
```

### Covered Endpoints

**Transition Management** (all mutations audited):

- POST/PATCH/DELETE `/api/v1/admin/transitions` - Plan CRUD
- POST `/api/v1/admin/transitions/:id/submit` - Submit for approval
- POST `/api/v1/admin/transitions/:id/approve` - Record approval
- POST `/api/v1/admin/transitions/:id/cancel` - Cancel plan
- POST `/api/v1/admin/transitions/:id/apply` - Apply transition
- POST/DELETE `/api/v1/admin/transitions/:id/assignments` - Assignment CRUD

**Service History** (all mutations audited):

- POST `/api/v1/admin/service-history` - Create record
- PATCH `/api/v1/admin/service-history/:id/close` - Close record

**Officer Management** (all mutations audited):

- POST/PATCH/DELETE `/api/v1/officer/meetings` - Meeting CRUD
- POST/PATCH/DELETE `/api/v1/officer/board-records` - Board record CRUD
- POST (actions) `/api/v1/officer/board-records/:id` - Submit/approve/publish
- POST/PATCH/DELETE `/api/v1/officer/governance/flags` - Flag CRUD
- POST (actions) `/api/v1/officer/governance/flags/:id` - Review/resolve/dismiss

**Publishing** (uses `createAuditLog` from publishing/permissions):

- `/api/admin/content/pages/*` - Page CRUD and publish actions

### Intentionally Deferred

**Stub Routes** (not yet implemented):

- `/api/v1/admin/events/*` - Event mutations (TODO: Wire when implemented)
- `/api/v1/admin/registrations/*` - Registration mutations (TODO: Wire)
- `/api/v1/admin/members/*` - Member mutations (TODO: Wire)

### CI Enforcement

Added `scripts/ci/check-route-audit.sh` to enforce audit coverage on sensitive routes.

### Tests

- Unit tests: `tests/unit/audit.spec.ts`

## Remaining Work (Future PRs)

1. **JWT Implementation**: Replace test token validation with real JWT verification
2. **Session Cookies**: Integrate `cookies.ts` when auth routes are implemented
3. **Wire Stub Routes**: Add audit to event/registration/member routes when implemented
4. **registrations:manage capability**: Wire up capability for waitlist promotion
