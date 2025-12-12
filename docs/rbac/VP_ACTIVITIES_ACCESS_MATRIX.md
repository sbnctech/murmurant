# VP of Activities - Access Matrix and Authorization Model

## Executive Summary

This document defines the authority boundaries for the VP of Activities role, answering key questions about what VPs can do, how they differ from Event Chairs, and how scope should be enforced.

---

## Question 1: What Can a VP Do Beyond an Event Chair?

### Capability Comparison

| Capability | Event Chair | VP of Activities | Difference |
|------------|-------------|------------------|------------|
| **Scope** | Single committee | Multiple supervised committees | VP sees across committees |
| **Create events** | Own committee only | Any supervised committee | VP can create in Chair's area |
| **Edit events** | Own committee only | Any supervised committee | VP can edit Chair's events |
| **View draft events** | Own committee only | All supervised committees | VP has oversight visibility |
| **Publish events** | No | Yes (supervised scope) | **Key differentiator** |
| **Unpublish events** | No | Yes (supervised scope) | VP can pull back events |
| **Delete events** | No | No | Admin only |
| **View registrations** | Own events | Supervised events | VP sees registration data |
| **Export data** | Own committee | Supervised committees | VP can export for reporting |
| **Reassign events** | No | Between supervised committees | VP can move events |

### Narrative Explanation

The VP of Activities role exists for **oversight and coordination**, not just expanded editing. Key distinctions:

1. **Publication Authority**: Event Chairs draft events; VPs review and publish them. This creates a natural approval workflow without requiring a separate "approval" action.

2. **Cross-Committee Visibility**: VPs need to see all events under their supervision to prevent scheduling conflicts and ensure consistent quality.

3. **Intervention Capability**: When an Event Chair is unavailable (vacation, illness, resignation), the VP can step in to manage their events without admin intervention.

4. **No Destructive Actions**: VPs cannot delete events or modify events outside their scope. This limits blast radius of mistakes.

---

## Question 2: Should VPs Edit Events Directly or Only Approve?

### Recommendation: Direct Edit with Audit Trail

**Approach: VPs CAN edit directly**, but with logging and optional notification.

### Rationale

| Model | Pros | Cons |
|-------|------|------|
| **Approval-only** | Clear separation of duties; Chair retains ownership | Slower workflow; bottleneck if VP unavailable; requires approval UI |
| **Direct edit** | Faster intervention; simpler implementation; VP can fix typos/emergencies | Chair may feel ownership undermined; changes could go unnoticed |
| **Edit with notification** | Balance of speed and awareness | Requires notification system |

### Recommended Model: Direct Edit + Audit

```
VP edits event directly
  -> Change logged to audit trail (who, what, when)
  -> Optional: Email notification to Event Chair
  -> No blocking approval required
```

### When VP Should Edit Directly

- Correcting factual errors (wrong date, location typo)
- Emergency changes (venue cancellation)
- Chair is unavailable and deadline approaching
- Standardizing format/style across events

### When VP Should Request Chair Edit

- Substantive content changes (different activity)
- Changes that affect Chair's workload
- Non-urgent improvements

### Implementation Note

Add `lastModifiedById` to Event model to track who made changes:

```prisma
model Event {
  // ... existing fields
  lastModifiedById String?  @db.Uuid
  lastModifiedBy   Member?  @relation("EventModifier",
                                     fields: [lastModifiedById],
                                     references: [id])
}
```

---

## Question 3: How Should Scope Be Enforced?

### Data Relationship Model

```
                    ┌─────────────────────┐
                    │       Admin         │
                    │   (global access)   │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
    ┌─────────────────┐ ┌─────────────────┐
    │  VP Activities  │ │  VP Activities  │
    │   (Sarah M.)    │ │   (John K.)     │
    │                 │ │                 │
    │ supervises:     │ │ supervises:     │
    │ - Hiking        │ │ - Wine Tasting  │
    │ - Social        │ │ - Book Club     │
    └────────┬────────┘ └────────┬────────┘
             │                   │
      ┌──────┴──────┐     ┌──────┴──────┐
      │             │     │             │
      ▼             ▼     ▼             ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  Hiking  │ │  Social  │ │   Wine   │ │   Book   │
│  Chair   │ │  Chair   │ │  Chair   │ │  Chair   │
│ (Alice)  │ │  (Bob)   │ │ (Carol)  │ │ (David)  │
└────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
     │            │            │            │
     ▼            ▼            ▼            ▼
  Events       Events       Events       Events
```

### Enforcement Layers

#### Layer 1: Database Relationships (Required)

```prisma
// Event belongs to a committee
model Event {
  committeeId String?    @db.Uuid
  committee   Committee? @relation(fields: [committeeId], references: [id])
}

// Committee has a supervising VP (via member assignment)
model Committee {
  supervisorMemberId String?  @db.Uuid
  supervisor         Member?  @relation("CommitteeSupervisor",
                                        fields: [supervisorMemberId],
                                        references: [id])
}
```

#### Layer 2: Query-Time Filtering (Required)

```typescript
// All event queries for VP include scope filter
const events = await prisma.event.findMany({
  where: {
    committeeId: { in: vpSupervisedCommitteeIds },
    // ... other filters
  },
});
```

#### Layer 3: API Middleware (Required)

```typescript
// Before any event mutation, verify scope
async function enforceEventScope(
  memberId: string,
  eventId: string,
  action: 'view' | 'edit' | 'publish'
): Promise<void> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { committeeId: true },
  });

  const allowedIds = await getAccessibleCommitteeIds(memberId);

  if (!event?.committeeId || !allowedIds.includes(event.committeeId)) {
    throw new ForbiddenError('Event not in your scope');
  }
}
```

#### Layer 4: UI Filtering (Defense in Depth)

```typescript
// Frontend only shows events user can access
// But NEVER rely on this alone - always enforce server-side
```

---

## Detailed Access Matrix

### Event Operations

| Operation | Admin | VP Activities | Event Chair | Member |
|-----------|:-----:|:-------------:|:-----------:|:------:|
| **List all events** | All | Supervised committees | Own committee | Published only |
| **View event detail** | All | Supervised committees | Own committee | Published only |
| **View draft events** | All | Supervised committees | Own committee | No |
| **Create event** | Any committee | Supervised committees | Own committee | No |
| **Edit event metadata** | All | Supervised committees | Own committee | No |
| **Edit event content** | All | Supervised committees | Own committee | No |
| **Publish event** | All | Supervised committees | No | No |
| **Unpublish event** | All | Supervised committees | No | No |
| **Delete event** | All | No | No | No |
| **Cancel event** | All | Supervised committees | Own committee | No |
| **Clone/copy event** | All | Supervised committees | Own committee | No |

### Registration Operations

| Operation | Admin | VP Activities | Event Chair | Member |
|-----------|:-----:|:-------------:|:-----------:|:------:|
| **View registrations** | All events | Supervised events | Own events | Own only |
| **Export registrations** | All events | Supervised events | Own events | No |
| **Manually add registration** | All events | Supervised events | Own events | No |
| **Cancel registration** | All events | Supervised events | Own events | Own only |
| **Manage waitlist** | All events | Supervised events | Own events | No |

### Administrative Operations

| Operation | Admin | VP Activities | Event Chair | Member |
|-----------|:-----:|:-------------:|:-----------:|:------:|
| **View audit log** | All | Supervised scope | Own events | No |
| **Export reports** | All | Supervised scope | Own committee | No |
| **Assign Event Chair** | Yes | No | No | No |
| **Change VP assignments** | Yes | No | No | No |
| **Manage committees** | Yes | No | No | No |

---

## Over-Permissioning Risks

### Risk 1: VP Edits Without Chair Knowledge

**Scenario**: VP makes changes to an event; Chair doesn't know and provides conflicting information to members.

**Mitigation**:
- Log all VP edits with timestamp and modifier ID
- Optional email notification to Chair when VP edits their event
- Event detail page shows "Last modified by [name] on [date]"

### Risk 2: VP Publishes Incomplete Event

**Scenario**: VP publishes an event the Chair wasn't ready to release.

**Mitigation**:
- Add `readyForReview` flag that Chair sets
- VP can still override but flag provides signal
- Consider requiring Chair to mark "ready" before VP publish (stricter workflow)

### Risk 3: Scope Creep via Committee Assignment

**Scenario**: VP assigns themselves as supervisor of committees outside their intended scope.

**Mitigation**:
- Only Admin can modify committee supervisor assignments
- VP cannot edit Committee model
- Audit log for supervisor changes

### Risk 4: Cross-VP Data Leakage

**Scenario**: VP A accidentally sees events from VP B's committees due to query bug.

**Mitigation**:
- Strict parameterized queries (no string interpolation)
- Integration tests verify scope isolation
- Periodic audit of access logs

### Risk 5: Term Transition Confusion

**Scenario**: Old VP retains access after term ends; new VP doesn't have access yet.

**Mitigation**:
- Scope checks always use current term
- Clear term transition process
- Admin reviews role assignments at term boundaries

### Risk Assessment Summary

| Risk | Likelihood | Impact | Mitigation Priority |
|------|------------|--------|---------------------|
| VP edits without Chair knowledge | High | Low | Medium (audit log) |
| VP publishes incomplete event | Medium | Medium | Low (workflow) |
| Scope creep via assignment | Low | High | High (admin-only) |
| Cross-VP data leakage | Low | High | High (testing) |
| Term transition confusion | Medium | Medium | Medium (process) |

---

## Recommended API Enforcement Model

### Architecture

```
Request
   │
   ▼
┌─────────────────────────────────────────────────────────┐
│                    Auth Middleware                       │
│  - Validate JWT/session                                  │
│  - Extract memberId, globalRole                          │
│  - Attach to request context                             │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   Scope Middleware                       │
│  - Load RoleAssignments for current term                 │
│  - Determine effective role (admin > VP > Chair > member)│
│  - Calculate accessible committeeIds                     │
│  - Attach EventScopeContext to request                   │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   Route Handler                          │
│  - Use scope context for query filtering                 │
│  - Verify specific resource access before mutation       │
│  - Return 403 if out of scope                            │
└─────────────────────────────────────────────────────────┘
```

### Code Pattern

```typescript
// src/lib/eventScope.ts

export type EffectiveRole = 'admin' | 'vp-activities' | 'event-chair' | 'member';

export type EventScopeContext = {
  effectiveRole: EffectiveRole;
  committeeIds: string[] | null;  // null means "all" for admin
  canPublish: boolean;
  canDelete: boolean;
};

export async function getEventScopeContext(
  memberId: string,
  globalRole: 'admin' | 'member',
  termId: string
): Promise<EventScopeContext> {
  // Admin bypasses all scoping
  if (globalRole === 'admin') {
    return {
      effectiveRole: 'admin',
      committeeIds: null,
      canPublish: true,
      canDelete: true,
    };
  }

  // Load role assignments
  const assignments = await prisma.roleAssignment.findMany({
    where: { memberId, termId },
    include: { committeeRole: true, committee: true },
  });

  // Check for VP role
  const vpAssignment = assignments.find(
    a => a.committeeRole.slug === 'vp-activities'
  );

  if (vpAssignment) {
    const supervisedIds = await getSupervisedCommitteeIds(
      vpAssignment.committeeId
    );
    return {
      effectiveRole: 'vp-activities',
      committeeIds: supervisedIds,
      canPublish: true,
      canDelete: false,
    };
  }

  // Check for Event Chair role
  const chairAssignment = assignments.find(
    a => a.committeeRole.slug === 'event-chair'
  );

  if (chairAssignment) {
    return {
      effectiveRole: 'event-chair',
      committeeIds: [chairAssignment.committeeId],
      canPublish: false,
      canDelete: false,
    };
  }

  // Default: regular member
  return {
    effectiveRole: 'member',
    committeeIds: [],
    canPublish: false,
    canDelete: false,
  };
}

// Usage in route handler
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const scope = await getEventScopeContext(
    auth.context.memberId,
    auth.context.globalRole,
    currentTermId
  );

  // Build query with scope filter
  const where: Prisma.EventWhereInput = {};

  if (scope.committeeIds !== null) {
    if (scope.committeeIds.length === 0) {
      // Member: only published events
      where.isPublished = true;
    } else {
      // VP or Chair: scoped to committees
      where.committeeId = { in: scope.committeeIds };
    }
  }
  // Admin: no filter (committeeIds is null)

  const events = await prisma.event.findMany({ where });
  return NextResponse.json({ events });
}
```

### Mutation Protection

```typescript
// Before any event mutation
async function verifyEventAccess(
  scope: EventScopeContext,
  eventId: string,
  action: 'edit' | 'publish' | 'delete'
): Promise<{ allowed: boolean; reason?: string }> {
  // Check action-level permission
  if (action === 'delete' && !scope.canDelete) {
    return { allowed: false, reason: 'Delete requires admin role' };
  }

  if (action === 'publish' && !scope.canPublish) {
    return { allowed: false, reason: 'Publish requires VP or admin role' };
  }

  // Admin can do anything
  if (scope.committeeIds === null) {
    return { allowed: true };
  }

  // Load event's committee
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { committeeId: true },
  });

  if (!event) {
    return { allowed: false, reason: 'Event not found' };
  }

  if (!event.committeeId) {
    return { allowed: false, reason: 'Event has no committee assignment' };
  }

  if (!scope.committeeIds.includes(event.committeeId)) {
    return { allowed: false, reason: 'Event not in your scope' };
  }

  return { allowed: true };
}
```

---

## Summary

### Key Design Decisions

1. **VPs can edit directly** - No separate approval workflow; audit trail provides accountability

2. **Publication is the key VP privilege** - Event Chairs draft, VPs publish

3. **Scope enforced via data relationships** - Event -> Committee -> Supervisor chain

4. **Three-layer enforcement** - Database FK, query filters, mutation checks

5. **No delete for VP** - Destructive actions require admin

### Implementation Priorities

1. Add `committeeId` to Event model
2. Add `supervisorMemberId` to Committee model
3. Implement `getEventScopeContext()` helper
4. Update all event endpoints to use scope filtering
5. Add audit logging for VP edits
6. Write integration tests for scope isolation

---

## Related Documents

- [VP Activities Scope (Technical)](./VP_ACTIVITIES_SCOPE.md)
- [Event Chair Access Rules](../project/prompts/PROMPT_WORKER_3_EVENT_CHAIR_ACCESS.md)
- [Schema Overview](../schema/OVERVIEW.md)
