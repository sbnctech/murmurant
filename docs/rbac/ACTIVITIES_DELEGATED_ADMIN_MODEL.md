# Activities Delegated Admin Model (VP of Activities -> Chairs)

Status: Draft (READY FOR REVIEW)

## Goal
Allow VP of Activities to manage event-chair RBAC safely and scalably, without granting broad admin power.

## Core Constraints
- All authorization decisions are server-side.
- Delegation is hierarchical and scoped.
- No actor can grant permissions equal to or greater than their own.
- All mutations are audited (actor, target, before/after, scope, timestamp, reason).

## Roles
### VP_ACTIVITIES (Delegated Admin: Activities)
Scope: Activities domain; may act across all events.
Allowed:
- Assign/remove EVENT_CHAIR for a specific event_id.
- View (read-only) chair assignments across events.
- View (read-only) committee rosters for events.
Forbidden:
- Grant non-activities admin roles (finance, system, superadmin).
- Modify global RBAC policy definitions.
- Modify identity/email routing rules.

### EVENT_CHAIR (Scoped Delegated Admin)
Scope: One or more explicit event_id values.
Allowed:
- Assign/remove COMMITTEE_MEMBER and EVENT_VOLUNTEER scoped to event_id.
- Manage event operations that are already permitted by chair role (registrants visibility remains role-filtered).
Forbidden:
- Assign EVENT_CHAIR to anyone (no chair-making).
- Assign roles across events outside scope.
- Elevate privileges beyond event domain.

## Data Model (Conceptual)
- RoleAssignment:
  - subject_id
  - role_key
  - scope_type (event)
  - scope_id (event_id)
  - granted_by_actor_id
  - reason
  - created_at
  - revoked_at (nullable)

## API Surface (High Level)
- POST /api/admin/activities/events/:eventId/chair
  - body: { subject_id, reason }
- DELETE /api/admin/activities/events/:eventId/chair/:subjectId
  - body: { reason }
- GET /api/admin/activities/chairs?event_id=&status=
  - returns role-filtered list

## Authorization Rules
- Only VP_ACTIVITIES (or SYSTEM_ADMIN) may assign/remove EVENT_CHAIR.
- EVENT_CHAIR may assign/remove COMMITTEE_MEMBER/EVENT_VOLUNTEER for their scoped events only.
- Server validates:
  - actor role
  - actor scope
  - requested role_key
  - requested scope (event_id)
  - target eligibility (active member, not banned, etc. if applicable)
- Deny-path tests mandatory for all endpoints.

## Audit Requirements
- Every grant/revoke writes an append-only audit record:
  - actor_id, target_id, action, role_key, scope, reason, before, after, timestamp
- Audit visible to:
  - SYSTEM_ADMIN
  - VP_ACTIVITIES (activities-only view)

## Safety Defaults
- Time-bounded grants optional (recommended) for EVENT_CHAIR.
- Chair grants require explicit event_id and reason.
- UI must never expose raw permission toggles; only role assignment.

## Out of Scope
- Payments/finance privileges
- Cross-domain delegated admin
- Identity/email policy changes
