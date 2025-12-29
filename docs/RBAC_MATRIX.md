# Murmurant RBAC Matrix

**Version:** 1.0.0
**Charter Reference:** P1 (Provable Identity), P2 (Default Deny), P9 (Fail Closed)

This document is the canonical reference for Role-Based Access Control in Murmurant.

---

## Role Hierarchy

Murmurant uses a **capability-based** permission system. Roles are templates that grant capabilities.

| Tier | Role | Description |
|------|------|-------------|
| **Admin** | `admin` | Full system access (dev/support only) |
| **Board** | `president` | Executive authority, transitions, governance oversight |
| | `past-president` | Advisory role, read-only access |
| | `vp-activities` | Event approval, activity coordination |
| | `vp-communications` | Newsletter, campaigns, communications |
| | `secretary` | Minutes, board records, governance docs |
| | `parliamentarian` | Rules, interpretations, governance flags |
| **Staff** | `webmaster` | Publishing only (NO member data, NO finance) |
| **Committee** | `event-chair` | Own committee's events only |
| **Member** | `member` | No elevated access |
| **Public** | (none) | Unauthenticated - public pages only |

---

## Capability Matrix

Legend: ✓ = Has capability | ✗ = Does not have | (scope) = Limited scope

### Core Capabilities

| Capability | admin | president | past-pres | vp-act | vp-comm | event-chair | webmaster | secretary | parliam | member |
|------------|:-----:|:---------:|:---------:|:------:|:-------:|:-----------:|:---------:|:---------:|:-------:|:------:|
| `admin:full` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

### Member Data

| Capability | admin | president | past-pres | vp-act | vp-comm | event-chair | webmaster | secretary | parliam | member |
|------------|:-----:|:---------:|:---------:|:------:|:-------:|:-----------:|:---------:|:---------:|:-------:|:------:|
| `members:view` | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `members:history` | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `registrations:view` | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `exports:access` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

### Events

| Capability | admin | president | past-pres | vp-act | vp-comm | event-chair | webmaster | secretary | parliam | member |
|------------|:-----:|:---------:|:---------:|:------:|:-------:|:-----------:|:---------:|:---------:|:-------:|:------:|
| `events:view` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `events:edit` | ✓ | ✓ | ✗ | ✓ | ✗ | ✗¹ | ✗ | ✗ | ✗ | ✗ |
| `events:delete` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `events:submit` | ✓ | ✗ | ✗ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `events:approve` | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `events:schedule:view` | ✓ | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `events:enews:edit` | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

¹ Event chairs can edit their **own** committee's events via object-scoped checks

### Finance

| Capability | admin | president | past-pres | vp-act | vp-comm | event-chair | webmaster | secretary | parliam | member |
|------------|:-----:|:---------:|:---------:|:------:|:-------:|:-----------:|:---------:|:---------:|:-------:|:------:|
| `finance:view` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `finance:manage` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

### Transitions

| Capability | admin | president | past-pres | vp-act | vp-comm | event-chair | webmaster | secretary | parliam | member |
|------------|:-----:|:---------:|:---------:|:------:|:-------:|:-----------:|:---------:|:---------:|:-------:|:------:|
| `transitions:view` | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `transitions:approve` | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

### Publishing & Communications

| Capability | admin | president | past-pres | vp-act | vp-comm | event-chair | webmaster | secretary | parliam | member |
|------------|:-----:|:---------:|:---------:|:------:|:-------:|:-----------:|:---------:|:---------:|:-------:|:------:|
| `publishing:manage` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| `comms:manage` | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| `comms:send` | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

### User & Role Management

| Capability | admin | president | past-pres | vp-act | vp-comm | event-chair | webmaster | secretary | parliam | member |
|------------|:-----:|:---------:|:---------:|:------:|:-------:|:-----------:|:---------:|:---------:|:-------:|:------:|
| `users:manage` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `roles:assign` | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `roles:view` | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

### Governance

| Capability | admin | president | past-pres | vp-act | vp-comm | event-chair | webmaster | secretary | parliam | member |
|------------|:-----:|:---------:|:---------:|:------:|:-------:|:-----------:|:---------:|:---------:|:-------:|:------:|
| `governance:flags:read` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| `governance:flags:write` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| `governance:flags:resolve` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| `governance:rules:manage` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| `governance:annotations:read` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| `governance:annotations:write` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| `governance:annotations:publish` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| `governance:interpretations:*` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| `governance:policies:*` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| `governance:docs:read` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| `governance:docs:write` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |

### Meetings & Minutes

| Capability | admin | president | past-pres | vp-act | vp-comm | event-chair | webmaster | secretary | parliam | member |
|------------|:-----:|:---------:|:---------:|:------:|:-------:|:-----------:|:---------:|:---------:|:-------:|:------:|
| `meetings:read` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| `meetings:motions:read` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| `meetings:motions:annotate` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| `meetings:minutes:draft:*` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| `meetings:minutes:read_all` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| `meetings:minutes:finalize` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

### Files

| Capability | admin | president | past-pres | vp-act | vp-comm | event-chair | webmaster | secretary | parliam | member |
|------------|:-----:|:---------:|:---------:|:------:|:-------:|:-----------:|:---------:|:---------:|:-------:|:------:|
| `files:upload` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| `files:manage` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `files:view_all` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

---

## Security Invariants

These invariants MUST hold true. Tests verify these.

### SI-1: Admin-Only Capabilities

Only `admin` role has:
- `admin:full`
- `events:delete`
- `users:manage`
- `files:manage`
- `finance:manage`

### SI-2: Finance Isolation

The following roles NEVER have `finance:view` or `finance:manage`:
- `webmaster`
- `event-chair`
- `vp-communications`
- `secretary`
- `parliamentarian`
- `member`

### SI-3: Webmaster Restrictions

`webmaster` is explicitly restricted from:
- `members:view` (unless `WEBMASTER_DEBUG_READONLY=true`)
- `members:history`
- `registrations:view` (unless `WEBMASTER_DEBUG_READONLY=true`)
- `exports:access`
- `finance:view` / `finance:manage`
- `users:manage`
- `comms:send` (can manage templates, cannot send)

### SI-4: Event Chair Scoping

`event-chair` can only edit events where `event.eventChairId === memberId`.
This is enforced via object-scoped checks in `requireEventEditAccess()`.

### SI-5: Default Deny

- Unauthenticated requests: 401
- Missing capability: 403
- No role inference from client state
- All checks are server-side

### SI-6: Impersonation Safety

When admin is impersonating a member, these capabilities are BLOCKED:
- `finance:manage`
- `comms:send`
- `users:manage`
- `events:delete`
- `admin:full`

---

## Time-Bounded Authority

Role assignments have `startDate` and `endDate`. Capabilities are only active when:
- `startDate <= now` (assignment has started)
- `endDate IS NULL` OR `endDate > now` (assignment has not ended)

This is enforced by `getActiveRoleAssignments()` and `hasMemberCapability()`.

---

## Page Visibility

| Visibility | Who Can View |
|------------|--------------|
| `PUBLIC` | Anyone (unauthenticated OK) |
| `MEMBERS_ONLY` | Authenticated members |
| `ROLE_RESTRICTED` | Based on `audienceRule` evaluation |
| `DRAFT` | Users with edit permission only |

---

## Event Visibility (by Status)

| Status | Visible To |
|--------|------------|
| `DRAFT` | Event chair, VP Activities, Admin |
| `PENDING_APPROVAL` | Event chair, VP Activities, Admin |
| `CHANGES_REQUESTED` | Event chair, VP Activities, Admin |
| `APPROVED` | Event chair, VP Activities, Admin |
| `PUBLISHED` | All authenticated members |
| `CANCELED` | Hidden (VP/Admin can query) |

---

## Enforcement Functions

| Function | Purpose |
|----------|---------|
| `requireAuth()` | Validates authentication, returns 401 if missing |
| `requireCapability(cap)` | Checks capability, returns 403 if missing |
| `requireCapabilitySafe(cap)` | Like above, but blocks during impersonation |
| `requireCapabilityWithScope(cap, scope)` | Adds object-scoping to check |
| `requireEventEditAccess(eventId)` | Event-specific with ownership check |
| `requireEventDeleteAccess(eventId)` | Admin-only delete check |
| `requireAdminOnly()` | Requires `admin:full` capability |
| `requireVPOrAdmin()` | Requires `events:edit` capability |

---

## Testing Requirements

Per Charter N6, all permission boundaries must have tests:

1. **Positive tests**: Verify allowed access works
2. **Negative tests**: Verify denied access returns 401/403
3. **Escalation tests**: Verify lower roles cannot access higher capabilities
4. **Bypass tests**: Verify no hidden paths to admin access

Test files:
- `tests/unit/auth-capabilities.spec.ts` - Unit tests for capability system
- `tests/contracts/rbac.contract.spec.ts` - API-level contract tests
- `tests/contracts/rbac-escalation.contract.spec.ts` - Privilege escalation tests

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2024-12 | Initial RBAC matrix documentation |
