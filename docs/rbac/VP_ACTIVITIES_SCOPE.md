# VP of Activities Authorization Scope

## Overview

This document defines authorization rules for the VP of Activities role in Murmurant. The VP of Activities supervises Event Chairs and needs access to events managed by their direct reports, but not events outside their scope.

## Business Context

- The club has **two VPs of Activities** (e.g., VP Activities A-L, VP Activities M-Z, or by activity type)
- Each **Event Chair** reports to exactly one VP of Activities
- Event Chairs create and manage events within their assigned activity area
- VPs need oversight of their Event Chairs' events for coordination and approval

## Data Model Requirements

### Current Schema Gap

The current `Event` model has no ownership field:

```prisma
model Event {
  id          String   @id @default(uuid())
  title       String
  // ... other fields
  // NO ownership or committee link
}
```

### Proposed Schema Extension

To support VP of Activities scoping, we need:

1. **Link Events to Committees** (activity groups)
2. **Define VP-to-Committee supervisory relationships**

#### Option A: Event.committeeId (Recommended)

Add a nullable `committeeId` to Event:

```prisma
model Event {
  id          String     @id @default(uuid())
  title       String
  description String?
  category    String?
  location    String?
  startTime   DateTime
  endTime     DateTime?
  capacity    Int?
  isPublished Boolean    @default(false)

  // NEW: Link to owning committee (activity group)
  committeeId String?    @db.Uuid
  committee   Committee? @relation(fields: [committeeId], references: [id])

  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  registrations EventRegistration[]
  photoAlbum    PhotoAlbum?

  @@index([committeeId])
}
```

#### Option B: Supervisory Committee Relationship

Add a `supervisorCommitteeId` to Committee for hierarchy:

```prisma
model Committee {
  id                    String      @id @default(uuid())
  name                  String
  slug                  String      @unique
  description           String?
  isActive              Boolean     @default(true)

  // NEW: Parent committee for hierarchy
  supervisorCommitteeId String?     @db.Uuid
  supervisorCommittee   Committee?  @relation("CommitteeHierarchy",
                                              fields: [supervisorCommitteeId],
                                              references: [id])
  subCommittees         Committee[] @relation("CommitteeHierarchy")

  // existing relations...
}
```

## Authorization Logic

### Role Definitions

| Role | Slug | Access Level |
|------|------|--------------|
| VP of Activities | `vp-activities` | Read/write events in supervised committees |
| Event Chair | `event-chair` | Read/write events in own committee only |
| Admin | `admin` | Full access to all events |
| Member | `member` | Read published events only |

### Access Matrix

| Action | Admin | VP Activities | Event Chair | Member |
|--------|-------|---------------|-------------|--------|
| List all events | Yes | Scoped to supervised committees | Scoped to own committee | Published only |
| View event detail | Yes | Supervised committees | Own committee | Published only |
| Create event | Yes | Supervised committees | Own committee | No |
| Edit event | Yes | Supervised committees | Own committee | No |
| Delete event | Yes | No | No | No |
| Publish event | Yes | Supervised committees | No | No |

### Authorization Flow

```
1. Authenticate user (get memberId)
2. Load user's RoleAssignments for current term
3. Determine highest privilege level:
   a. globalRole === 'admin' -> full access
   b. Has VP Activities role -> get supervised committee IDs
   c. Has Event Chair role -> get own committee ID
   d. Default -> member (published events only)
4. Apply scope filter to queries
```

## Prisma Query Constraints

### Get VP's Supervised Committees

```typescript
// Get committee IDs supervised by a VP of Activities
async function getVPSupervisedCommitteeIds(
  memberId: string,
  termId: string
): Promise<string[]> {
  // Find the VP's role assignment
  const vpAssignment = await prisma.roleAssignment.findFirst({
    where: {
      memberId,
      termId,
      committeeRole: {
        slug: 'vp-activities',
      },
    },
    include: {
      committee: true,
    },
  });

  if (!vpAssignment) {
    return [];
  }

  // Get committees supervised by this VP's committee
  // (committees where supervisorCommitteeId matches VP's committee)
  const supervisedCommittees = await prisma.committee.findMany({
    where: {
      supervisorCommitteeId: vpAssignment.committeeId,
      isActive: true,
    },
    select: { id: true },
  });

  return supervisedCommittees.map(c => c.id);
}
```

### Filter Events for VP Access

```typescript
// Get events accessible to a VP of Activities
async function getEventsForVP(
  memberId: string,
  termId: string
): Promise<Event[]> {
  const supervisedCommitteeIds = await getVPSupervisedCommitteeIds(
    memberId,
    termId
  );

  if (supervisedCommitteeIds.length === 0) {
    return [];
  }

  return prisma.event.findMany({
    where: {
      committeeId: {
        in: supervisedCommitteeIds,
      },
    },
    orderBy: { startTime: 'asc' },
  });
}
```

### Check Event Access Permission

```typescript
type EventPermission = 'view' | 'edit' | 'publish' | 'delete';

async function canAccessEvent(
  memberId: string,
  eventId: string,
  permission: EventPermission,
  termId: string
): Promise<boolean> {
  // Load event with committee
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { committeeId: true, isPublished: true },
  });

  if (!event) return false;

  // Members can view published events
  if (permission === 'view' && event.isPublished) {
    return true;
  }

  // Load user's role assignments
  const assignments = await prisma.roleAssignment.findMany({
    where: {
      memberId,
      termId,
    },
    include: {
      committeeRole: true,
      committee: true,
    },
  });

  // Check for admin (would be in global role, not shown here)

  // Check for VP Activities
  const vpAssignment = assignments.find(
    a => a.committeeRole.slug === 'vp-activities'
  );

  if (vpAssignment) {
    // VP can access events in supervised committees
    const supervisedIds = await getVPSupervisedCommitteeIds(memberId, termId);

    if (event.committeeId && supervisedIds.includes(event.committeeId)) {
      // VP can view, edit, publish - but not delete
      return permission !== 'delete';
    }
  }

  // Check for Event Chair
  const chairAssignment = assignments.find(
    a => a.committeeRole.slug === 'event-chair' &&
         a.committeeId === event.committeeId
  );

  if (chairAssignment) {
    // Event Chair can view and edit own committee's events
    return permission === 'view' || permission === 'edit';
  }

  return false;
}
```

### Middleware Helper

```typescript
// Middleware to inject event scope into request context
async function withEventScope(
  memberId: string,
  globalRole: 'admin' | 'member',
  termId: string
): Promise<EventScopeContext> {
  // Admin bypasses all scoping
  if (globalRole === 'admin') {
    return { scope: 'all', committeeIds: null };
  }

  // Check for VP role
  const vpCommitteeIds = await getVPSupervisedCommitteeIds(memberId, termId);
  if (vpCommitteeIds.length > 0) {
    return { scope: 'supervised', committeeIds: vpCommitteeIds };
  }

  // Check for Event Chair role
  const chairAssignment = await prisma.roleAssignment.findFirst({
    where: {
      memberId,
      termId,
      committeeRole: { slug: 'event-chair' },
    },
  });

  if (chairAssignment) {
    return { scope: 'owned', committeeIds: [chairAssignment.committeeId] };
  }

  // Default: member, published only
  return { scope: 'public', committeeIds: null };
}

type EventScopeContext = {
  scope: 'all' | 'supervised' | 'owned' | 'public';
  committeeIds: string[] | null;
};
```

## Example Data Setup

### Committees

| Committee | Slug | Supervisor |
|-----------|------|------------|
| Activities Leadership | `activities-leadership` | null |
| Hiking | `hiking` | `activities-leadership` |
| Social | `social` | `activities-leadership` |
| Wine Tasting | `wine-tasting` | `activities-leadership` |
| Book Club | `book-club` | `activities-leadership` |

### Role Assignments (Current Term)

| Member | Committee | Role |
|--------|-----------|------|
| Sarah Martinez | Activities Leadership | VP Activities |
| John Kim | Activities Leadership | VP Activities |
| Alice Chen | Hiking | Event Chair |
| Bob Wilson | Social | Event Chair |
| Carol Johnson | Wine Tasting | Event Chair |
| David Lee | Book Club | Event Chair |

### VP Supervision Mapping

To split supervision between two VPs, add a mapping:

| VP Member | Supervised Committees |
|-----------|----------------------|
| Sarah Martinez | Hiking, Social |
| John Kim | Wine Tasting, Book Club |

This requires either:
- A `vpMemberId` field on Committee, or
- A separate `VPSupervision` junction table

## Test Plan

### Unit Tests (Authorization Logic)

```typescript
describe('VP Activities Authorization', () => {
  describe('getVPSupervisedCommitteeIds', () => {
    it('returns empty array for non-VP member', async () => {
      const ids = await getVPSupervisedCommitteeIds(regularMemberId, currentTermId);
      expect(ids).toEqual([]);
    });

    it('returns supervised committee IDs for VP', async () => {
      const ids = await getVPSupervisedCommitteeIds(vpMemberId, currentTermId);
      expect(ids).toContain(hikingCommitteeId);
      expect(ids).toContain(socialCommitteeId);
      expect(ids).not.toContain(wineCommitteeId); // supervised by other VP
    });

    it('returns empty for VP from past term', async () => {
      const ids = await getVPSupervisedCommitteeIds(formerVpMemberId, currentTermId);
      expect(ids).toEqual([]);
    });
  });

  describe('canAccessEvent', () => {
    it('VP can view event in supervised committee', async () => {
      const result = await canAccessEvent(vpMemberId, hikingEventId, 'view', currentTermId);
      expect(result).toBe(true);
    });

    it('VP can edit event in supervised committee', async () => {
      const result = await canAccessEvent(vpMemberId, hikingEventId, 'edit', currentTermId);
      expect(result).toBe(true);
    });

    it('VP can publish event in supervised committee', async () => {
      const result = await canAccessEvent(vpMemberId, hikingEventId, 'publish', currentTermId);
      expect(result).toBe(true);
    });

    it('VP cannot delete event', async () => {
      const result = await canAccessEvent(vpMemberId, hikingEventId, 'delete', currentTermId);
      expect(result).toBe(false);
    });

    it('VP cannot access event outside supervised committees', async () => {
      const result = await canAccessEvent(vpMemberId, wineEventId, 'view', currentTermId);
      expect(result).toBe(false);
    });

    it('VP cannot access event with no committee', async () => {
      const result = await canAccessEvent(vpMemberId, unassignedEventId, 'view', currentTermId);
      expect(result).toBe(false);
    });
  });

  describe('getEventsForVP', () => {
    it('returns only events from supervised committees', async () => {
      const events = await getEventsForVP(vpMemberId, currentTermId);

      const committeeIds = events.map(e => e.committeeId);
      expect(committeeIds.every(id => [hikingId, socialId].includes(id!))).toBe(true);
    });

    it('includes unpublished events', async () => {
      const events = await getEventsForVP(vpMemberId, currentTermId);

      const hasUnpublished = events.some(e => !e.isPublished);
      expect(hasUnpublished).toBe(true);
    });
  });
});
```

### Integration Tests (API Layer)

```typescript
describe('GET /api/admin/events (VP Access)', () => {
  it('VP sees only supervised committee events', async () => {
    const response = await request
      .get('/api/admin/events')
      .set('Authorization', `Bearer test-vp-${vpMemberId}`);

    expect(response.status).toBe(200);

    const eventIds = response.body.items.map((e: Event) => e.id);
    expect(eventIds).toContain(hikingEventId);
    expect(eventIds).toContain(socialEventId);
    expect(eventIds).not.toContain(wineEventId);
  });

  it('VP cannot access event detail outside scope', async () => {
    const response = await request
      .get(`/api/admin/events/${wineEventId}`)
      .set('Authorization', `Bearer test-vp-${vpMemberId}`);

    expect(response.status).toBe(403);
  });
});

describe('PUT /api/admin/events/:id (VP Access)', () => {
  it('VP can update event in supervised committee', async () => {
    const response = await request
      .put(`/api/admin/events/${hikingEventId}`)
      .set('Authorization', `Bearer test-vp-${vpMemberId}`)
      .send({ title: 'Updated Hike Title' });

    expect(response.status).toBe(200);
  });

  it('VP cannot update event outside scope', async () => {
    const response = await request
      .put(`/api/admin/events/${wineEventId}`)
      .set('Authorization', `Bearer test-vp-${vpMemberId}`)
      .send({ title: 'Attempted Update' });

    expect(response.status).toBe(403);
  });
});

describe('POST /api/admin/events/:id/publish (VP Access)', () => {
  it('VP can publish event in supervised committee', async () => {
    const response = await request
      .post(`/api/admin/events/${draftHikingEventId}/publish`)
      .set('Authorization', `Bearer test-vp-${vpMemberId}`);

    expect(response.status).toBe(200);
  });
});

describe('DELETE /api/admin/events/:id (VP Access)', () => {
  it('VP cannot delete events (admin only)', async () => {
    const response = await request
      .delete(`/api/admin/events/${hikingEventId}`)
      .set('Authorization', `Bearer test-vp-${vpMemberId}`);

    expect(response.status).toBe(403);
  });
});
```

### Edge Case Tests

```typescript
describe('VP Authorization Edge Cases', () => {
  it('handles member with both VP and Event Chair roles', async () => {
    // Member is VP for Hiking/Social but also Event Chair for a specific group
    // VP role should take precedence for broader access
  });

  it('handles event with no committee assignment', async () => {
    // Legacy events or admin-created events may have null committeeId
    // Only admins should access these
  });

  it('handles inactive committees', async () => {
    // Events in inactive committees should not be accessible
    // except by admin for historical purposes
  });

  it('handles term transitions', async () => {
    // When term changes, VP access should use new term's assignments
    // Old VP loses access, new VP gains access
  });

  it('handles concurrent VP supervision of same committee', async () => {
    // If somehow two VPs supervise same committee, both should have access
    // (degenerate case, but should not break)
  });
});
```

## Implementation Notes

### Migration Path

1. Add `committeeId` column to Event table (nullable for existing events)
2. Add `supervisorCommitteeId` column to Committee table (nullable)
3. Seed committee hierarchy and VP assignments
4. Update admin event endpoints to respect scoping
5. Backfill existing events with appropriate committee assignments

### Performance Considerations

- Cache VP's supervised committee IDs in session/token claims
- Index Event.committeeId for efficient filtering
- Consider denormalizing VP scope for frequently-accessed endpoints

### Security Notes

- Always verify term is current when checking VP access
- Log access attempts for audit trail
- VP cannot escalate to admin privileges
- Committee reassignment should invalidate cached scopes

## Related Documents

- [Event Chair Access Rules](../project/prompts/PROMPT_WORKER_3_EVENT_CHAIR_ACCESS.md)
- [Schema Overview](../schema/OVERVIEW.md)
- [Day 4 RBAC Objective](../project/DAY_3_STATUS_AND_DAY_4_OBJECTIVE.md)
