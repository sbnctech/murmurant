# Authentication and Role-Based Access Control (RBAC)

**Audience**: SBNC Tech Chair and club administrators
**Purpose**: Explain how ClubOS controls who can access what

---

## Plain-English Summary

ClubOS uses two layers of security to protect club data:

1. **Authentication** - Proves who you are (like showing your ID at the door)
2. **Authorization** - Decides what you can do (like checking if your badge opens certain rooms)

Think of it like entering a secure building:

```
You arrive at ClubOS
        |
        v
   +----------+
   |  LOGIN   |  <-- Authentication: "Who are you?"
   +----------+
        |
        v
   Are you a valid member?
        |
   NO   |   YES
   |    |    |
   v    |    v
 401    | +----------+
Denied  | | ROLE     |  <-- Authorization: "What can you do?"
        | | CHECK    |
        | +----------+
        |      |
        | +---------+---------+
        | |         |         |
        | v         v         v
        | ADMIN   VP/CHAIR  MEMBER
        | (full)  (limited) (basic)
```

---

## The Two Layers Explained

### Layer 1: Authentication (Who Are You?)

Before you can do anything in ClubOS, you must prove your identity.

**How it works today (development mode)**:
- You send a special token in your request header
- ClubOS checks if this token belongs to a real user
- If valid, you're "logged in"

**What happens if authentication fails**:
- You see a **401 Unauthorized** error
- Message: "Missing or invalid authorization header"
- Solution: Log in again or check your credentials

### Layer 2: Authorization (What Can You Do?)

Once ClubOS knows who you are, it checks what you're allowed to do.

**Two types of authorization**:

1. **Global Role** - Your overall permission level (Admin vs Member)
2. **Committee Role** - Your specific job in a committee (VP, Event Chair)

---

## Understanding Roles

### Global Roles (Everyone Has One)

| Role | What It Means | Example People |
|------|---------------|----------------|
| **Admin** | Full access to everything | Tech Chair, Board Members |
| **Member** | Basic access to own data | Regular club members |

### Committee Roles (Some People Have These)

| Role | What It Means | Example People |
|------|---------------|----------------|
| **VP of Activities** | Oversees event chairs, can publish events | Sarah Martinez, John Kim |
| **Event Chair** | Manages events for one activity group | Alice (Hiking), Bob (Social) |

---

## What Each Role Can Do

### Quick Reference Card

```
+------------------+------------------------------------------+
|      ADMIN       |                                          |
|                  |  - See everything                        |
|                  |  - Edit everything                       |
|                  |  - Delete events                         |
|                  |  - Manage users and committees           |
|                  |  - Export all data                       |
+------------------+------------------------------------------+

+------------------+------------------------------------------+
| VP OF ACTIVITIES |                                          |
|                  |  - See events in supervised groups       |
|                  |  - Edit events in supervised groups      |
|                  |  - PUBLISH events (key privilege)        |
|                  |  - Export supervised group data          |
|                  |  - Cannot delete events                  |
+------------------+------------------------------------------+

+------------------+------------------------------------------+
|   EVENT CHAIR    |                                          |
|                  |  - See events in own group only          |
|                  |  - Create/edit events in own group       |
|                  |  - Cannot publish (VP does that)         |
|                  |  - Cannot delete events                  |
+------------------+------------------------------------------+

+------------------+------------------------------------------+
|     MEMBER       |                                          |
|                  |  - See published events only             |
|                  |  - See own profile and registrations     |
|                  |  - Register for events                   |
|                  |  - Cannot see other members' data        |
+------------------+------------------------------------------+
```

---

## How RBAC Differs from Data Ownership

This is an important distinction:

### RBAC (Role-Based Access Control)

- Controls **what features** you can use
- Based on your **role** (Admin, VP, Chair, Member)
- Example: "Can this person access the admin dashboard?"

### Data Ownership

- Controls **which records** you can see within a feature
- Based on **who owns** the data
- Example: "Which events can this VP see?" (only supervised ones)

### Diagram: RBAC + Data Ownership Together

```
User Request: "Show me the events"
                    |
                    v
         +-------------------+
         |   RBAC Check      |
         |   Can user access |
         |   event features? |
         +-------------------+
                    |
        +-----------+-----------+
        |                       |
        v                       v
    NO (403)                YES
    Forbidden          +-------------------+
                       |  Ownership Check  |
                       |  Which events     |
                       |  belong to user?  |
                       +-------------------+
                                |
                    +-----------+-----------+
                    |           |           |
                    v           v           v
                 Admin       VP/Chair    Member
                 (all)      (scoped)    (published)
```

---

## Error Messages You Might See

### 401 Unauthorized

**What it means**: You're not logged in, or your session expired.

```
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing Authorization header"
  }
}
```

**What to do**: Log in again.

### 403 Forbidden

**What it means**: You're logged in, but don't have permission.

```
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin access required"
  }
}
```

**What to do**: Contact an Admin if you need access.

---

## Common Questions

### Q: I'm a member. Why can't I see all events?

A: Members only see **published** events. Draft events are only visible to Event Chairs, VPs, and Admins.

### Q: I'm an Event Chair. Why can't I publish my event?

A: Publishing is a VP privilege. This creates a review workflow where VPs approve events before they go public. Ask your VP to publish when ready.

### Q: I'm a VP. Why can't I see some events?

A: VPs only see events in committees they supervise. If you need access to other committees, contact an Admin.

### Q: Can someone have multiple roles?

A: Yes. A person could be an Event Chair for Hiking AND have a VP role. The system uses your "highest" privilege for each action.

### Q: How do I become an Admin?

A: An existing Admin must update your account. This is typically reserved for the Tech Chair and key board members.

---

## For Developers

See these technical documents:
- [VP Activities Scope](./VP_ACTIVITIES_SCOPE.md) - Data model and query patterns
- [VP Activities Access Matrix](./VP_ACTIVITIES_ACCESS_MATRIX.md) - Detailed permission tables
- [RBAC Overview](../RBAC_OVERVIEW.md) - High-level authorization flow

### Key Implementation Files

- `src/lib/auth.ts` - Authentication helpers
- `src/lib/eventScope.ts` - Authorization scope logic (future)

---

## Summary

```
                    ClubOS Security Model
                    =====================

     AUTHENTICATION              AUTHORIZATION
     ==============              =============

     "Who are you?"              "What can you do?"
           |                            |
           v                            v
      +----------+               +-------------+
      |  Token   |               | Global Role |
      |  Check   |               | (Admin/Mem) |
      +----------+               +-------------+
           |                            |
      Valid? --> Yes             +------+------+
           |                     |             |
           v                     v             v
      Get User              Committee     Data Filter
      Identity              Roles         (Ownership)
                            (VP/Chair)
```

The system is designed to be:
- **Simple** - Two global roles cover most cases
- **Flexible** - Committee roles add granular control
- **Safe** - Destructive actions require Admin
- **Auditable** - All actions can be logged

---

*Document maintained by ClubOS development team. Last updated: December 2024*
