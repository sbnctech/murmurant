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
                           | full control
                           |
           +---------------+---------------+
           |                               |
    VP of Activities              VP of Activities
      (Sarah M.)                    (John K.)
           |                               |
           | supervises                    | supervises
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

**Who has this role**: Two VPs, each supervising different activity groups

**What they can do**:

| Action | Allowed? | Notes |
|--------|----------|-------|
| View events in supervised groups | Yes | Includes drafts |
| Edit events in supervised groups | Yes | Direct edit, no approval needed |
| Create events in supervised groups | Yes | Can create on behalf of Chair |
| **Publish events** | **Yes** | Key privilege - makes events public |
| Unpublish events | Yes | Can pull back if needed |
| Delete events | No | Admin only |
| View registrations | Yes | For supervised events |
| Export data | Yes | For supervised groups |

**What they cannot do**:
- See events in other VP's groups
- Delete any events
- Change committee assignments
- Add or remove users

### Event Chair

**Who has this role**: Activity group leaders (Hiking Chair, Social Chair, etc.)

**What they can do**:

| Action | Allowed? | Notes |
|--------|----------|-------|
| View events in own group | Yes | Includes their drafts |
| Edit events in own group | Yes | Full edit capability |
| Create events in own group | Yes | Primary responsibility |
| Publish events | No | VP must publish |
| Delete events | No | Admin only |
| View registrations | Yes | For own events |
| Export data | Yes | For own group |

**What they cannot do**:
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

### How VP Supervision Works

Each VP supervises specific committees:

```
Sarah Martinez (VP)           John Kim (VP)
        |                            |
        | supervises                 | supervises
        |                            |
   +----+----+                  +----+----+
   |         |                  |         |
 Hiking   Social             Wine     Book Club
```

### Scope Rules

| Scenario | Sarah Can... | John Can... |
|----------|--------------|-------------|
| Hiking event | View, Edit, Publish | No access |
| Social event | View, Edit, Publish | No access |
| Wine event | No access | View, Edit, Publish |
| Book Club event | No access | View, Edit, Publish |
| Unassigned event | No access | No access |

### Why Strict Scope?

- Prevents accidental changes to wrong events
- Clear accountability for each activity area
- VPs don't get overwhelmed with irrelevant events
- Security: limits blast radius of any mistakes

---

## Common Scenarios

### Scenario 1: Event Chair Creates a Hike

```
1. Alice (Hiking Chair) creates "Sunset Trail Hike"
2. Alice fills in details, adds photo
3. Alice marks "Ready for review"
4. Sarah (VP) sees notification
5. Sarah reviews and clicks "Publish"
6. Event appears on public calendar
```

### Scenario 2: VP Fixes a Typo

```
1. Alice published event says "Satruday" (typo)
2. Sarah (VP) notices the error
3. Sarah edits directly, fixes to "Saturday"
4. System logs: "Event modified by Sarah Martinez"
5. (Optional) Alice gets email notification
6. No approval needed - fixed immediately
```

### Scenario 3: Event Chair Is Sick

```
1. Bob (Social Chair) is hospitalized
2. Social mixer needs last-minute changes
3. Sarah (VP) can edit Bob's event directly
4. Sarah can also publish if Bob hadn't yet
5. Club operations continue without interruption
```

### Scenario 4: Wrong VP Tries to Access

```
1. John (VP Wine/Book) tries to view Hiking event
2. System checks: Is John's VP scope include Hiking?
3. Answer: No
4. John sees: 403 Forbidden - "Event not in your scope"
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

### For Event Chairs

1. You have full control over your group's events
2. You cannot publish - ask your VP when ready
3. Your VP can edit your events (that's okay, it's by design)
4. If you see unexpected changes, check the audit log

### For VPs

1. You can see and edit all events in your supervised groups
2. You are the gatekeeper for publication
3. Use your edit power responsibly - notify Chairs of changes
4. You cannot see events outside your scope (by design)

### For Tech Chair / Admins

1. You have full access to everything
2. Use Admin sparingly - prefer VP/Chair for day-to-day
3. You're the only one who can delete events
4. You manage role assignments

---

## Related Documents

- [AUTH_AND_RBAC.md](./AUTH_AND_RBAC.md) - Overall auth system
- [VP_ACTIVITIES_SCOPE.md](./VP_ACTIVITIES_SCOPE.md) - Technical implementation
- [VP_ACTIVITIES_ACCESS_MATRIX.md](./VP_ACTIVITIES_ACCESS_MATRIX.md) - Detailed permission tables

---

*Document maintained by ClubOS development team. Last updated: December 2024*
