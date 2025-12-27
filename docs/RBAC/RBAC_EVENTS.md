# Event RBAC Invariants

> Row-level security, admin action guards, and audit logging for ClubOS events.

## Security Invariants

These invariants are **non-negotiable**. All code paths must preserve them.

| ID   | Invariant                                              | Enforcement         |
|------|--------------------------------------------------------|---------------------|
| SI-1 | Members see only PUBLISHED/COMPLETED events            | Query filter + check |
| SI-2 | Event Chairs can view/edit their own events (any status) | Ownership check    |
| SI-3 | VP Activities can view/edit ALL events                 | Capability check    |
| SI-4 | Admin can view/edit/delete ALL events                  | Capability check    |
| SI-5 | Only Admin can delete events (VP cannot)               | `events:delete` cap |
| SI-6 | Content editing restricted to DRAFT/CHANGES_REQUESTED  | Status check        |
| SI-7 | Public users see only PUBLISHED events with time filter | Query filter       |

## Role Capabilities Matrix

| Role            | View All | Edit Own | Edit All | Status Change | Delete |
|-----------------|:--------:|:--------:|:--------:|:-------------:|:------:|
| Public          | -        | -        | -        | -             | -      |
| Member          | -        | -        | -        | -             | -      |
| Event Chair     | Own      | Own      | -        | Submit only   | -      |
| VP Activities   | All      | -        | All      | All (no delete)| -     |
| Admin           | All      | -        | All      | All           | Yes    |

## Event Status Transitions

```
DRAFT ─────────────────► PENDING_APPROVAL ─────► APPROVED ─────► PUBLISHED
  │                            │                    │               │
  │                            ▼                    │               │
  │                     CHANGES_REQUESTED ──────────┘               │
  │                                                                 │
  └──────────────────────────► CANCELED ◄───────────────────────────┘
                                                                    │
                                                           ────► COMPLETED
                                                            (derived from
                                                             endTime past)
```

### Transition Permissions

| From             | To                   | Event Chair | VP Activities | Admin |
|------------------|----------------------|:-----------:|:-------------:|:-----:|
| DRAFT            | PENDING_APPROVAL     | ✓           | ✓             | ✓     |
| CHANGES_REQUESTED| PENDING_APPROVAL     | ✓           | ✓             | ✓     |
| PENDING_APPROVAL | APPROVED             | -           | ✓             | ✓     |
| PENDING_APPROVAL | CHANGES_REQUESTED    | -           | ✓             | ✓     |
| APPROVED         | PUBLISHED            | -           | ✓             | ✓     |
| Any (not COMPLETED)| CANCELED           | -           | ✓             | ✓     |

## Audit Requirements

### Audit Guard Invariants

| ID   | Invariant                                              |
|------|--------------------------------------------------------|
| AG-1 | All guarded actions produce audit entries              |
| AG-2 | Denied actions are logged with denial reason           |
| AG-3 | Actor identity is always captured                      |
| AG-4 | Before/after state captured for mutations              |

### Audit Log Fields

Every event action audit entry includes:

```typescript
{
  action: AuditAction;           // UPDATE, DELETE, EVENT_REGISTER, etc.
  resourceType: "Event";
  resourceId: string;            // Event UUID
  memberId: string;              // Actor's member ID
  metadata: {
    guardAction: EventAction;    // view, edit_content, edit_status, delete, register
    decision: "ALLOWED" | "DENIED";
    actorRole: GlobalRole;
    eventStatus: EventStatus;
    isEventChair: boolean;
    invariant?: string;          // Which SI-* rule applied
    reason: string;              // Human-readable explanation
  };
  before?: object;               // Previous state (for mutations)
  after?: object;                // New state (for mutations)
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
```

## Row-Level Policy Functions

### Viewing Events

```typescript
import { canViewEvent, getEventQueryFilter } from '@/lib/rbac';

// Check single event
const decision = canViewEvent(actor, eventContext);
if (!decision.allowed) {
  return forbidden(decision.reason);
}

// Build query filter for listing
const filter = getEventQueryFilter(actor);
const events = await prisma.event.findMany({ where: filter });
```

### Editing Events

```typescript
import { canEditEventContent, EDITABLE_STATES } from '@/lib/rbac';

// Check before allowing edit
const decision = canEditEventContent(actor, eventContext);
if (!decision.allowed) {
  return forbidden(decision.reason);
}

// SI-6: Content editing only in DRAFT or CHANGES_REQUESTED
if (!EDITABLE_STATES.includes(event.status)) {
  return badRequest("Event cannot be edited in this status");
}
```

### Status Transitions

```typescript
import { canEditEventStatus } from '@/lib/rbac';

const decision = canEditEventStatus(actor, eventContext, "APPROVED");
if (!decision.allowed) {
  return forbidden(decision.reason);
}
```

### Deleting Events

```typescript
import { canDeleteEvent } from '@/lib/rbac';

// SI-5: Only admin can delete
const decision = canDeleteEvent(actor, eventContext);
if (!decision.allowed) {
  // VP trying to delete? Suggest cancellation
  return forbidden(decision.reason);
}
```

## Admin Action Guards

Guards combine policy checks with audit logging:

```typescript
import { guardEditEventContent, GuardContext } from '@/lib/rbac';

const ctx: GuardContext = {
  actor: authContext,
  req: request,
  event: eventContext,
};

const result = await guardEditEventContent(ctx);
if (!result.ok) {
  return NextResponse.json(
    { error: result.error },
    { status: result.code === "UNAUTHORIZED" ? 401 : 403 }
  );
}

// Proceed with edit - audit already logged
```

## Escalation Detection

Suspicious patterns are detected and logged:

```typescript
import { detectEscalationPattern, logEscalationAttempt } from '@/lib/rbac';

const decision = canEditEventContent(actor, event);
if (!decision.allowed) {
  const escalation = detectEscalationPattern(
    "edit_content",
    actor,
    event,
    decision.reason
  );

  if (escalation) {
    await logEscalationAttempt(escalation, req);
    // Triggers security alert
  }
}
```

### Escalation Types

| Type             | Description                                      |
|------------------|--------------------------------------------------|
| role_bypass      | Member trying to access officer-only features    |
| status_bypass    | Trying to edit event in non-editable status      |
| ownership_bypass | Chair trying to edit another chair's event       |
| capability_bypass| Non-admin trying to delete                       |

## Charter Compliance

This implementation follows the Architectural Charter:

- **P1 (Identity Provable)**: All actions tied to `memberId` in audit logs
- **P2 (Default Deny)**: `getEventQueryFilter()` restricts by default
- **P3 (State Machines)**: EventStatus enum, not booleans
- **P7 (Observability)**: Comprehensive audit logging
- **P9 (Fail Closed)**: Missing auth returns 401, missing capability returns 403
- **N1 (No UI Security)**: All checks are server-side
- **N2 (Capabilities)**: Uses `hasCapability()`, not role strings
- **N5 (Audit All)**: Every mutation goes through guards

## Testing Requirements

Tests must verify:

1. **SI-1 through SI-7**: Each invariant has positive and negative tests
2. **AG-1 through AG-4**: Audit entries created correctly
3. **Escalation detection**: Each type produces security alert
4. **Query filters**: Correct events returned for each role

See: `/tests/unit/rbac/event-row-policy.spec.ts`

## Files

| File                                    | Purpose                        |
|-----------------------------------------|--------------------------------|
| `src/lib/rbac/event-row-policy.ts`      | Row-level security policies    |
| `src/lib/rbac/admin-action-guard.ts`    | Action guards with audit       |
| `src/lib/rbac/index.ts`                 | Module exports                 |
| `tests/unit/rbac/event-row-policy.spec.ts` | Policy unit tests           |
| `tests/unit/rbac/admin-action-guard.spec.ts` | Guard unit tests           |
