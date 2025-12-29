# Policy Crosswalk Document

Comprehensive mapping of embedded policies in the Murmurant codebase to formal Policy IDs.

**Last Updated:** 2025-12-25
**Charter Reference:** docs/ARCHITECTURAL_CHARTER.md

Copyright (c) Santa Barbara Newcomers Club

---

## Purpose

This document maps each policy from [INDEX.md](./INDEX.md) to its enforcement location in the codebase. Use this to:

- Find where a policy is implemented
- Verify policy enforcement exists in code
- Identify gaps between documented policies and implementation

---

## Authorization Policies (AUTH-###)

| Policy ID | Policy Name | Current Location | Description | Ambiguities/Conflicts |
|-----------|-------------|------------------|-------------|----------------------|
| AUTH-001 | Default Deny Authentication | src/lib/auth.ts:420-487 | All API routes require valid authentication token (session cookie, Bearer token, or E2E test header). Missing/invalid token returns 401. | Test tokens present for development (Bearer test-{role}-{memberId}). |
| AUTH-002 | Capability-Based Authorization | src/lib/auth.ts:50-336 | System uses fine-grained capabilities instead of role-based authorization. Every auth check uses capability verification, not role string comparison (Charter N2). | Capabilities defined in ROLE_CAPABILITIES map (lines 130-296). |
| AUTH-003 | Admin Role (admin:full) | src/lib/auth.ts:130-155, 331-336 | Full admin access: implies all 38+ capabilities including publishing, finance, exports, users management, events deletion. | Only admin role has admin:full. |
| AUTH-004 | Webmaster Role Restrictions | src/lib/auth.ts:24-31, 226-238 | Webmaster can manage publishing and comms templates ONLY. Cannot: export data, view/manage finance, change entitlements, access service history. | Debug mode (WEBMASTER_DEBUG_READONLY env var) adds read-only access. |
| AUTH-005 | VP Activities Role Scope | src/lib/auth.ts:186-201 | VP of Activities can: view/edit ALL events (peer trust model), approve events, view transitions. Cannot delete events. | Two VPs trusted as peers with mutual override capability. |
| AUTH-006 | Event Chair Role Scope | src/lib/auth.ts:215-225 | Event chairs can: view/edit/submit only their own events (eventChairId=memberId). Cannot approve or delete. | Single owner model. VP and Admin can override. |
| AUTH-007 | Impersonation Blocking | src/lib/auth.ts:639-645 | Capabilities blocked during impersonation: finance:manage, comms:send, users:manage, events:delete, admin:full. | BLOCKED_WHILE_IMPERSONATING list. |
| AUTH-008 | Session Token Validation | src/lib/auth.ts:369-405 | Sessions stored in HttpOnly cookies. Production: murmurant_session. Development: murmurant_dev_session fallback. | Session validation in getSession(). |
| AUTH-009 | Test Token Format | src/lib/auth.ts:849-1014 | Development test tokens: "test-{role}-{memberId}". Legacy tokens ("admin-token", "test-admin") also supported. | Two formats maintained for backward compatibility. |
| AUTH-010 | President Capability Set | src/lib/auth.ts:156-174 | President: members:view/history, registrations:view, events:view/edit, exports:access, finance:view (read-only), transitions:view/approve. NO finance:manage, users:manage, events:delete. | Separation of powers enforced. |

---

## Event Policies (EVENT-###)

| Policy ID | Policy Name | Current Location | Description | Ambiguities/Conflicts |
|-----------|-------------|------------------|-------------|----------------------|
| EVENT-001 | Event Status State Machine | src/lib/events/status.ts:6-36 | Explicit state machine: DRAFT -> PENDING_APPROVAL -> APPROVED -> PUBLISHED -> COMPLETED; can CANCEL from most states. | No branching except via chair transitions. |
| EVENT-002 | Chair Event Submission | src/lib/events/status.ts:242-270 | Chair submits DRAFT -> PENDING_APPROVAL. Cloned event safeguard: events with placeholder dates (epoch 1970-01-01) cannot be submitted. | Placeholder date check prevents broken clones. |
| EVENT-003 | VP Event Approval | src/lib/events/status.ts:275-286 | VP approves PENDING_APPROVAL -> APPROVED, sets approvedAt timestamp and approvedById. Approval notes optional but stored. | No automatic publish. Requires explicit publish transition. |
| EVENT-004 | Event Content Editability | src/lib/events/status.ts:135, 464-494 | Event content editable only in DRAFT or CHANGES_REQUESTED status. Once PENDING_APPROVAL or later, only status transitions allowed. | EDITABLE_STATES hardcoded. |
| EVENT-005 | Event Cancellation Policy | src/lib/events/status.ts:124-130, 332-345 | VP only: can cancel from any state except COMPLETED. Cancellation reason stored. isPublished set to false on cancel. | Retroactive cancellation possible. |
| EVENT-006 | Event Deletion vs Cancellation | src/lib/eventAuth.ts:209-262 | ONLY admin can delete events. VP CANNOT delete. Deletion is physical removal; cancellation is logical state change. | Clear separation enforced. |
| EVENT-007 | Event Chair Authorization | src/lib/eventAuth.ts:55-69, 79-138 | User is event chair if memberId matches event.eventChairId. Chairs can view/edit own events only. VP/Admin bypass ownership checks. | Peer trust model for VPs. |
| EVENT-008 | VP Peer Trust Model | src/lib/eventAuth.ts:12-20 | VP of Activities can view/edit ALL events without ownership check. Two VPs exist as peers. Cannot delete events. | No conflict resolution for concurrent edits. |
| EVENT-009 | Event Publication Schedule | src/lib/events/scheduling.ts:1-90 | For registration-required events: announce Sunday (eNews), open registration Tuesday 8 AM Pacific. | Hardcoded SBNC policy. |
| EVENT-010 | Default Registration Open Time | src/lib/events/scheduling.ts:29-30 | Registration opens at 8 AM Pacific (DEFAULT_REGISTRATION_OPEN_HOUR=8). | No timezone handling in constant. |
| EVENT-011 | Event Archive Policy | src/lib/events/scheduling.ts:33 | Events archived 30 days after endTime (ARCHIVE_DAYS_AFTER_END=30). | No enforcement job visible. |

---

## Membership Policies (MEMBER-###)

| Policy ID | Policy Name | Current Location | Description | Ambiguities/Conflicts |
|-----------|-------------|------------------|-------------|----------------------|
| MEMBER-001 | Member Lifecycle State Machine | src/lib/membership/lifecycle.ts:14-26 | Eight states: not_a_member, pending_new, active_newbie, active_member, offer_extended, active_extended, lapsed, suspended, unknown. | State machine is READ-ONLY inference. |
| MEMBER-002 | Newbie Period (90 Days) | src/lib/membership/lifecycle.ts:111 | New members start in active_newbie. After 90 days, transition to active_member. Uses getPolicyDefault("membership.newbieDays"). | **Now policy-driven.** |
| MEMBER-003 | Two-Year Extended Offer | src/lib/membership/lifecycle.ts:112 | At 2-year mark (730 days), member state becomes offer_extended. Uses getPolicyDefault("membership.extendedDays"). | **Now policy-driven.** |
| MEMBER-004 | Active Member State | src/lib/membership/lifecycle.ts:104, 229-243 | Active member: past 90 days, before 2 years, or extended member who has not lapsed. | State derived from tier. |
| MEMBER-005 | Suspension Policy | src/lib/membership/lifecycle.ts:108 | Admin can suspend any active member. No automatic suspension. Indefinite until admin lifts. | Manual action only. |
| MEMBER-006 | Lapsed Member | src/lib/membership/lifecycle.ts:119 | Membership ends (lapsed). Historical record preserved. Member can rejoin by new application. | Terminal state for lifecycle. |
| MEMBER-007 | Service History Visibility | src/lib/auth.ts (members:history capability) | Viewable by: President, VP Activities, Admin. Restricted from webmaster, event chairs. | Governance roles included. |

---

## Finance Policies (FINANCE-###)

| Policy ID | Policy Name | Current Location | Description | Ambiguities/Conflicts |
|-----------|-------------|------------------|-------------|----------------------|
| FINANCE-001 | Payment Provider Abstraction | src/lib/payments/index.ts:15-39 | Payment provider set via PAYMENT_PROVIDER env var. Default: "fake". | Relies on environment config. |
| FINANCE-002 | Fake Provider Dev-Only | src/lib/payments/fake-provider.ts | FakePaymentProvider for development/staging. | No production enforcement visible. |
| FINANCE-003 | Payment Idempotency | src/lib/payments/index.ts:8 | All payment operations are idempotent (Charter N5). | Implementation in provider. |
| FINANCE-004 | Finance View Capability | src/lib/auth.ts:65, 147, 163 | finance:view: Admin, President only. VP Activities, Webmaster excluded. | Restricted to leadership. |
| FINANCE-005 | Finance Manage Capability | src/lib/auth.ts:66, 148 | finance:manage: ONLY admin. Blocked during impersonation. | Treasurer role not yet implemented. |
| FINANCE-006 | ACH Feature Flag | src/lib/config/featureFlags.ts | MURMURANT_ACH_ENABLED controls ACH availability. | Demo-only implementation. |

---

## Audit & Logging Policies (AUDIT-###)

| Policy ID | Policy Name | Current Location | Description | Ambiguities/Conflicts |
|-----------|-------------|------------------|-------------|----------------------|
| AUDIT-001 | Privileged Action Logging | src/lib/audit.ts:55-106 | Every privileged mutation calls createAuditEntry(). Logs action, resource, before/after state, actor, IP, user-agent. | Audit failure does not block operation. |
| AUDIT-002 | Audit Log Entry Structure | src/lib/audit.ts:16-24 | AuditEntryParams: action (enum), resourceType, resourceId, actor, before/after state, metadata. | Resource type is free text. |
| AUDIT-003 | Audit Log Client IP | src/lib/audit.ts:37-52 | Client IP extracted from x-forwarded-for, x-real-ip, or null. | Trusts proxy headers. |
| AUDIT-004 | Audit Log Request ID | src/lib/audit.ts:30-32 | Unique request ID generated for tracing (req_{timestamp}_{random}). | Not cryptographically secure. |
| AUDIT-005 | Event Status Transition Audit | src/lib/events/status.ts:431-451 | Event status transitions logged with fromStatus, toStatus, transition action, optional note. | Metadata includes actor role. |

---

## Communication Policies (COMMS-###)

| Policy ID | Policy Name | Current Location | Description | Ambiguities/Conflicts |
|-----------|-------------|------------------|-------------|----------------------|
| COMMS-001 | Comms Manage Capability | src/lib/auth.ts:52, 134, 206, 228 | comms:manage: manage templates, audiences, campaigns. Webmaster, Admin, VP Communications have it. | Management != sending. |
| COMMS-002 | Comms Send Capability | src/lib/auth.ts:53, 135, 207 | comms:send: send campaigns. ONLY admin and VP Communications. Webmaster CANNOT send. | Blocked during impersonation. |
| COMMS-003 | Campaign Management API | src/app/api/admin/comms/campaigns/route.ts:83-94 | Campaign creation requires BOTH comms:manage AND comms:send capabilities. | Capability stacking enforced. |
| COMMS-004 | VP Communications Role | src/lib/auth.ts:202-214 | VP Communications: view events, schedule view, enews edit, comms send. CANNOT edit events, approve, see members/finance. | Narrowly scoped. |
| COMMS-005 | eNews Schedule View | src/lib/auth.ts:62, 145, 194, 205 | events:schedule:view: VP Activities and VP Communications. | Coordination capability. |
| COMMS-006 | eNews Blurb Editing | src/lib/auth.ts:63 | events:enews:edit: VP Communications only (plus admin). | Separate from event editing. |
| COMMS-007 | eNews Publication Schedule | src/lib/events/scheduling.ts:5-10 | Sunday announce, Tuesday 8 AM open. | Hardcoded SBNC policy. |

---

## Governance Policies (GOV-###)

| Policy ID | Policy Name | Current Location | Description | Ambiguities/Conflicts |
|-----------|-------------|------------------|-------------|----------------------|
| GOV-001 | Meetings Access | src/lib/auth.ts:72-81 | meetings:read, meetings:motions:read, meetings:minutes capabilities. Secretary and Parliamentarian have access. | Workflow separated by capability. |
| GOV-002 | Secretary Minutes Workflow | src/lib/auth.ts:241-245 | Secretary: create/edit/submit draft minutes, read all minutes. Cannot finalize (President approves). | Workflow separation enforced. |
| GOV-003 | Parliamentarian Governance Role | src/lib/auth.ts:269-277 | Parliamentarian: read rules, manage flags, publish annotations, manage interpretations. | Full governance control. |
| GOV-004 | Governance Flags | src/lib/auth.ts:88-91 | governance:flags: read/write/resolve. Secretary/Parliamentarian create, Parliamentarian resolves. | Flag-based issue tracking. |
| GOV-005 | Governance Annotations | src/lib/auth.ts:93-95 | governance:annotations: read/write/publish. Secretary writes (unpublished), Parliamentarian publishes. | Document annotations. |
| GOV-006 | Interpretations Log | src/lib/auth.ts:97-99 | governance:interpretations: create/edit/publish. Parliamentarian manages. | Precedent tracking. |

---

## Implicit Policies & Missing Implementations

| Issue ID | Category | Issue | Location | Notes |
|----------|----------|-------|----------|-------|
| IMPLICIT-001 | Event Registration | Waitlist promotion is inferred but no automatic policy | src/lib/events/ticketTiers.ts | Manual promotion only via /promote endpoint. |
| IMPLICIT-002 | Membership | Newbie->member transition inferred, not triggered | src/lib/membership/lifecycle.ts | Background job required but not visible. |
| IMPLICIT-003 | Membership | 2-year offer inferred, not triggered | src/lib/membership/lifecycle.ts | Extended offer sending system not found. |
| IMPLICIT-004 | Finance | Refund rules not explicit | src/lib/payments/ | Likely in route handlers. Needs documentation. |
| IMPLICIT-005 | Membership | Extended membership grace period undefined | src/lib/membership/lifecycle.ts | Duration not specified. |
| IMPLICIT-006 | Scheduling | Event archive enforcement missing | src/lib/events/scheduling.ts | ARCHIVE_DAYS_AFTER_END constant exists, no job. |
| IMPLICIT-007 | Communications | Campaign rate limiting missing | src/app/api/admin/comms/campaigns/ | No rate limiting visible. |
| IMPLICIT-008 | Authorization | VP concurrent edit conflict | src/lib/eventAuth.ts | No locking for simultaneous edits. |
| IMPLICIT-009 | Registration | Unregister/cancellation policy missing | Not found | No explicit unregister policy located. |

---

## Configuration & Hardcoded Values

### Scheduling/Timezone Constants

| Constant | Value | Location | Policy Key | Status |
|----------|-------|----------|------------|--------|
| `SBNC_TIMEZONE` | "America/Los_Angeles" | src/lib/events/scheduling.ts:27 | `scheduling.timezone` | Not wired (see Future Work) |
| `CLUB_TIMEZONE` | "America/Los_Angeles" | src/lib/timezone.ts:1 | `scheduling.timezone` | Not wired (see Future Work) |
| `DEFAULT_REGISTRATION_OPEN_HOUR` | 8 | src/lib/events/scheduling.ts:30 | `scheduling.registrationOpenHour` | Not wired (see Future Work) |
| `ARCHIVE_DAYS_AFTER_END` | 30 | src/lib/events/scheduling.ts:33 | `scheduling.eventArchiveDays` | Not wired (see Future Work) |

### Membership Constants

| Constant | Value | Location | Policy Key | Status |
|----------|-------|----------|------------|--------|
| `NEWBIE_PERIOD_DAYS` | 90 | src/lib/membership/lifecycle.ts:111 | `membership.newbieDays` | **Wired via getPolicyDefault()** |
| `TWO_YEAR_DAYS` | 730 | src/lib/membership/lifecycle.ts:112 | `membership.extendedDays` | **Wired via getPolicyDefault()** |

### Security Constants (Not Configurable)

| Constant | Value | Location | Should Be Configurable? |
|----------|-------|----------|-------------------------|
| `BLOCKED_WHILE_IMPERSONATING` | 5 capabilities | src/lib/auth.ts:639-645 | No - core security feature |
| `ROLE_CAPABILITIES` | 38+ entries | src/lib/auth.ts:130-296 | Consider database-driven roles |

---

## Future Work: Policy Layer Wiring

### Gap Analysis

The policy layer (`src/lib/policy/getPolicy.ts`) already defines policy keys for scheduling:

- `scheduling.timezone` (default: "America/Los_Angeles")
- `scheduling.registrationOpenHour` (default: 8)
- `scheduling.eventArchiveDays` (default: 30)

However, the runtime code still uses hardcoded constants instead of `getPolicy()` because:

1. **getPolicy() requires orgId**: The policy API signature is `getPolicy(key, { orgId })`. This ensures future multi-tenant support.

2. **Scheduling functions lack orgId context**: Functions like `getNextSunday()`, `getFollowingTuesday()`, and `getEventOperationalStatus()` don't receive `orgId` as a parameter.

3. **Significant refactoring required**: Wiring these constants to `getPolicy()` would require:
   - Adding `orgId` parameter to all scheduling functions
   - Updating all call sites (API routes, tests, components)
   - Changing function signatures in test fixtures

### Risk Assessment

| Change | Risk Level | Reason |
|--------|------------|--------|
| Wire `SBNC_TIMEZONE` | High | Used in 10+ locations for date formatting |
| Wire `CLUB_TIMEZONE` | High | Foundation of ALL timezone helpers |
| Wire `DEFAULT_REGISTRATION_OPEN_HOUR` | Medium | Only used in `getFollowingTuesday()` |
| Wire `ARCHIVE_DAYS_AFTER_END` | Medium | Only used in `getEventOperationalStatus()` |

### Recommended Approach (Future Issue)

1. **Create tracking issue**: Document this gap formally in GitHub
2. **Thread orgId through scheduling layer**: Start from API route entry points and propagate `orgId` through the call stack
3. **Replace constants incrementally**: Begin with lower-risk constants (`ARCHIVE_DAYS_AFTER_END`) to build confidence
4. **Parallel exports**: During transition, keep existing constants as deprecated aliases that call `getPolicyDefault()`
5. **Test coverage**: Add contract tests verifying policy-driven behavior

### Example Migration Pattern

```typescript
// Before (current):
export const SBNC_TIMEZONE = "America/Los_Angeles";

export function getNextSunday(fromDate: Date = new Date()): Date {
  // Uses SBNC_TIMEZONE directly
}

// After (future):
// No exported constant - use getPolicy()

export function getNextSunday(
  fromDate: Date = new Date(),
  options: { orgId: string }
): Date {
  const tz = getPolicy("scheduling.timezone", { orgId: options.orgId });
  // Uses policy-driven timezone
}
```

### What Was Already Done

The membership lifecycle constants were successfully migrated:

```typescript
// src/lib/membership/lifecycle.ts:111-112
const NEWBIE_PERIOD_DAYS = getPolicyDefault("membership.newbieDays");
const TWO_YEAR_DAYS = getPolicyDefault("membership.extendedDays");
```

This pattern works because lifecycle functions receive member context and can derive `orgId` from the member's organization. The scheduling layer needs similar context threading.

---

## Recommendations

1. **Database-Driven Roles**: Consider moving ROLE_CAPABILITIES to database for runtime configuration
2. **Automatic Transitions**: Implement background job for membership state transitions
3. **Refund Policy**: Document and implement explicit refund rules
4. **Unregister Policy**: Define cancellation/refund behavior for registrations
5. **Event Conflict Resolution**: Implement locking or conflict detection for concurrent VP edits
6. **Campaign Rate Limiting**: Add rate limiting to prevent accidental mass sends
7. **Audit Resilience**: Ensure audit failures alert admins
8. **Grace Period Duration**: Hardcode and document extended membership grace period
9. **Scheduling Policy Wiring**: Complete the orgId threading work to connect scheduling constants to the policy layer (see Future Work section)

---

## Related Documentation

- [INDEX.md](./INDEX.md) - Policy taxonomy and master index
- [ARCHITECTURAL_CHARTER.md](../ARCHITECTURAL_CHARTER.md) - Non-negotiable principles
- [AUTH_AND_RBAC.md](../rbac/AUTH_AND_RBAC.md) - Role-based access control guide
- [getPolicy.ts](../../src/lib/policy/getPolicy.ts) - Policy access layer implementation
- [Policy Types](../../src/lib/policy/types.ts) - Policy key definitions
