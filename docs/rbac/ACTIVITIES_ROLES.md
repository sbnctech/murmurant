# Activities Roles: VP and Event Chair Guide

**Audience**: VPs of Activities, Event Chairs, and future Tech Chairs
**Purpose**: Explain the activities hierarchy and how permissions work

---

## The Big Picture

SBNC activities are organized in a hierarchy:

```
                         ADMIN
                    (Tech Chair, Board)
                           |
                           | full control (including delete)
                           |
           +---------------+---------------+
           |                               |
    VP of Activities              VP of Activities
      (Sarah M.)                    (John K.)
           |                               |
           | can view/edit/publish         | can view/edit/publish
           | ALL events                    | ALL events
           |                               |
     +-----+-----+                   +-----+-----+
     |           |                   |           |
   Hiking     Social             Wine        Book Club
   Chair      Chair              Chair         Chair
   (Alice)    (Bob)              (Carol)      (David)
     |           |                   |           |
     v           v                   v           v
  Events      Events              Events      Events
```

> **Current Implementation Note**: In the current version, VPs can access ALL events, not just their supervised groups. Committee-based scoping is planned for a future release.

---

## Current vs Future Implementation

```
+==================================================================+
|                    CURRENT IMPLEMENTATION                         |
+==================================================================+

                          ADMIN
                            |
            can view/edit/delete ALL events
                            |
            +---------------+---------------+
            |                               |
     VP of Activities              VP of Activities
            |                               |
      can view/edit/publish           can view/edit/publish
         ALL events                      ALL events
            |                               |
            +---------------+---------------+
                            |
                      ALL EVENTS
                    (no scoping)


+==================================================================+
|                    FUTURE IMPLEMENTATION                          |
+==================================================================+

                          ADMIN
                            |
            can view/edit/delete ALL events
                            |
            +---------------+---------------+
            |                               |
     VP of Activities              VP of Activities
      (Sarah M.)                     (John K.)
            |                               |
      supervises                      supervises
      Hiking, Social                  Wine, Book Club
            |                               |
    +-------+-------+             +---------+---------+
    |               |             |                   |
  Hiking         Social         Wine              Book Club
  Events         Events         Events            Events
```

---

## Why This Structure?

### The Problem It Solves

Before this model, we had a few options:

**Option A: Everyone is Admin**
- Risk: Anyone can accidentally delete events or see sensitive data
- Result: No accountability, mistakes are hard to trace

**Option B: Strict Approval Workflow**
- Risk: Bottlenecks when VPs are unavailable
- Result: Events don't get published on time

**Option C: Mutual Trust Model** (What we chose)
- VPs and Chairs trust each other
- VPs can edit Chair events directly
- No approval queue, but audit trail exists
- Result: Fast workflow with accountability

### The Mutual Trust Philosophy

```
+------------------------------------------------------------------+
|                                                                  |
|    "Trust, but verify"                                           |
|                                                                  |
|    - Event Chairs create and manage their events                 |
|    - VPs can step in when needed, without asking permission      |
|    - All changes are logged for accountability                   |
|    - Nobody can do irreversible damage (delete is Admin-only)    |
|                                                                  |
+------------------------------------------------------------------+
```

This model works because:
1. SBNC volunteers are trusted community members
2. Minor mistakes can always be fixed
3. Speed matters for event coordination
4. VP oversight catches problems before publication

---

## Role Definitions

### VP of Activities

**Who has this role**: VPs responsible for club activities

**What they can do (current implementation)**:

| Action | Allowed? | Notes |
|--------|----------|-------|
| View ALL events | Yes | Includes drafts from all committees |
| Edit ALL events | Yes | Direct edit, no approval needed |
| Create events | Yes | Can create in any committee |
| **Publish events** | **Yes** | Key privilege - makes events public |
| Delete events | **No** | Admin only |
| View registrations | Yes | For all events |
| Export data | Yes | All data |

**What they cannot do**:
- Delete any events (Admin only)
- Change committee assignments (Admin only)
- Add or remove users (Admin only)

> **Future**: Committee-based scoping will limit VPs to their supervised groups.

### Event Chair

**Who has this role**: Activity group leaders (Hiking Chair, Social Chair, etc.)

**Current implementation**: Event Chair role exists but scoped access is not yet implemented. Currently behaves like Member role.

**Planned capabilities** (future release):

| Action | Allowed? | Notes |
|--------|----------|-------|
| View events in own group | Yes | Will include their drafts |
| Edit events in own group | Yes | Full edit capability |
| Create events in own group | Yes | Primary responsibility |
| Publish events | No | VP must publish |
| Delete events | No | Admin only |

**What they will not be able to do**:
- See events in other groups
- Publish their own events (VP does this)
- Delete events
- Edit other Chairs' events

---

## The Publication Workflow

This is the most important workflow to understand:

```
Event Chair creates event
           |
           v
   +---------------+
   |  DRAFT EVENT  |
   | (not visible  |
   |  to members)  |
   +---------------+
           |
           | Chair edits until ready
           v
   +---------------+
   | Chair marks   |
   | "ready for    |
   |  review"      |
   +---------------+
           |
           | VP reviews
           v
   +---------------+
   | VP PUBLISHES  |
   +---------------+
           |
           v
   +---------------+
   |   LIVE EVENT  |
   | (visible to   |
   |  all members) |
   +---------------+
```

### Why VPs Publish (Not Chairs)

1. **Quality Control**: VP reviews before public release
2. **Coordination**: VP can check for scheduling conflicts
3. **Consistency**: Ensures events meet club standards
4. **Backup**: If Chair forgets, VP can still publish

### What If VP Is Unavailable?

If both VPs are unavailable and an event urgently needs publishing:
- Contact the Tech Chair (Admin)
- Admin can publish any event
- This should be rare

---

## Supervision Model

### Current State: No Scoping

In the current implementation, **all VPs can see and edit all events**. There is no committee-based restriction.

### Planned: Committee-Based Scoping

The planned model will assign each VP to supervise specific committees:

```
Sarah Martinez (VP)           John Kim (VP)
        |                            |
        | will supervise             | will supervise
        |                            |
   +----+----+                  +----+----+
   |         |                  |         |
 Hiking   Social             Wine     Book Club
```

### Planned Scope Rules (Future)

| Scenario | Sarah Will... | John Will... |
|----------|---------------|--------------|
| Hiking event | View, Edit, Publish | No access |
| Social event | View, Edit, Publish | No access |
| Wine event | No access | View, Edit, Publish |
| Book Club event | No access | View, Edit, Publish |
| Unassigned event | No access | No access |

### Why Strict Scope? (Future Benefits)

- Prevents accidental changes to wrong events
- Clear accountability for each activity area
- VPs don't get overwhelmed with irrelevant events
- Security: limits blast radius of any mistakes

> **Implementation Status**: Committee-based scoping requires schema changes (adding `committeeId` to events) and is tracked in the VP_ACTIVITIES_SCOPE.md document.

---

## Common Scenarios

### Scenario 1: VP Publishes an Event (Current)

```
1. Admin or VP creates "Sunset Trail Hike" event
2. Details are filled in
3. VP reviews and clicks "Publish"
4. Event appears on public calendar (visible to members)
```

### Scenario 2: VP Fixes a Typo (Current)

```
1. Published event says "Satruday" (typo)
2. Any VP notices the error
3. VP edits directly, fixes to "Saturday"
4. No approval needed - fixed immediately
```

### Scenario 3: Member Tries Admin Action

```
1. Member tries to access /api/admin/events
2. System checks: Is user admin or VP?
3. Answer: No (member role)
4. Member sees: 403 Forbidden - "Admin access required"
```

### Scenario 4: VP Tries to Delete (Current)

```
1. VP tries to delete an event
2. System checks: Can VP delete? (canDeleteEvents)
3. Answer: No (only admin can delete)
4. VP sees: 403 Forbidden
5. VP must ask Admin to delete if needed
```

### Future Scenario: Committee-Scoped Access

```
(After scoping is implemented)
1. Sarah (VP Hiking/Social) tries to view Wine event
2. System checks: Is event in Sarah's supervised committees?
3. Answer: No
4. Sarah sees: 403 Forbidden - "Event not in your scope"
```

---

## ASCII Diagram: Complete Role Hierarchy

```
+============================================================+
|                        CLUB OS ROLES                        |
+============================================================+

                          +-------+
                          | ADMIN |
                          +---+---+
                              |
          Full access to everything
          Can delete, can assign roles
                              |
         +--------------------+--------------------+
         |                                         |
    +----+----+                              +-----+-----+
    |   VP    |                              |    VP     |
    | Sarah M |                              |  John K   |
    +----+----+                              +-----+-----+
         |                                         |
    Supervises:                               Supervises:
    - Hiking                                  - Wine Tasting
    - Social                                  - Book Club
         |                                         |
    +----+----+----+                    +----+----+----+
    |         |    |                    |         |    |
    v         v    v                    v         v    v
+------+  +------+                  +------+  +------+
|Hiking|  |Social|                  | Wine |  | Book |
|Chair |  |Chair |                  |Chair |  | Club |
|Alice |  | Bob  |                  |Carol |  |David |
+--+---+  +--+---+                  +--+---+  +--+---+
   |         |                        |         |
   v         v                        v         v
Events    Events                   Events    Events
(Hiking)  (Social)                 (Wine)    (Book)


+============================================================+
|                      PERMISSION FLOW                        |
+============================================================+

Request: "Edit Hiking Event #123"

Step 1: Authentication
        Is user logged in?
        |
        +-- No --> 401 Unauthorized
        |
        +-- Yes --> Continue

Step 2: Role Check
        What role does user have?
        |
        +-- Admin --> ALLOW (full access)
        |
        +-- VP --> Check scope (Step 3)
        |
        +-- Chair --> Check ownership (Step 3)
        |
        +-- Member --> DENY (403 Forbidden)

Step 3: Scope Check
        Is event in user's scope?
        |
        For VP Sarah:
        |  Is event in Hiking or Social?
        |  +-- Yes --> ALLOW
        |  +-- No --> DENY
        |
        For Chair Alice:
        |  Is event in Hiking (her group)?
        |  +-- Yes --> ALLOW
        |  +-- No --> DENY

+============================================================+
```

---

## Key Takeaways

### For VPs (Current)

1. You can see and edit **ALL events** (no scoping yet)
2. You can publish events - this is your key privilege
3. You **cannot** delete events - ask Admin if needed
4. Use your edit power responsibly

### For Event Chairs (Current)

1. Event Chair role exists but behaves like Member currently
2. Committee-scoped access is planned for future release
3. Once implemented, you'll have full control over your group's events

### For Tech Chair / Admins

1. You have full access to everything
2. You're the **only** role that can delete events
3. Use Admin sparingly - prefer VP for day-to-day event management
4. You manage role assignments

### Quick Permission Summary (Current)

```
+----------------+--------+-----+-------+--------+
|   Permission   | Admin  | VP  | Chair | Member |
+----------------+--------+-----+-------+--------+
| View drafts    |  Yes   | Yes |  No   |   No   |
| Edit events    |  Yes   | Yes |  No   |   No   |
| Publish        |  Yes   | Yes |  No   |   No   |
| DELETE         |  YES   | No  |  No   |   No   |
+----------------+--------+-----+-------+--------+
```

---

## Related Documents

- [AUTH_AND_RBAC.md](./AUTH_AND_RBAC.md) - Overall auth system
- [VP_ACTIVITIES_SCOPE.md](./VP_ACTIVITIES_SCOPE.md) - Technical implementation
- [VP_ACTIVITIES_ACCESS_MATRIX.md](./VP_ACTIVITIES_ACCESS_MATRIX.md) - Detailed permission tables

---

*Document maintained by ClubOS development team. Last updated: December 2024*
