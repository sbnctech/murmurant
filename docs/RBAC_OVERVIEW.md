# Murmurant Authorization Guide

**Audience**: SBNC Tech Chair and club administrators
**Last Updated**: December 2024

## What This Document Covers

This guide explains how Murmurant controls who can access what data. It's written in plain English for non-technical readers.

---

## Quick Summary

Murmurant has two types of access control:

1. **Role-Based Access Control (RBAC)** - Controls what *actions* you can perform based on your role (Admin vs Member)
2. **Data Ownership** - Controls what *data* you can see based on who owns it

Think of it like a building:
- **RBAC** = Who has keys to which rooms (Admin office, Member lounge)
- **Data Ownership** = Who owns the files in each room

---

## The Two Roles

### Admin Role

Admins can:
- View all member profiles
- See all event registrations
- Export data (CSV downloads)
- Access the admin dashboard
- View activity logs

**Who should be an Admin?**
- Tech Chair
- Membership Chair
- Board members who need data access

### Member Role

Members can:
- View their own profile
- See their own event registrations
- Register for public events

**Who is a Member?**
- All SBNC members with an account

---

## How It Works: A Visual Guide

```
                    Murmurant Authorization Model
                    ==========================

    ┌─────────────────────────────────────────────────────────┐
    │                     PUBLIC WEBSITE                       │
    │                                                          │
    │   Anyone can see:                                        │
    │   • Public event listings                                │
    │   • Club information                                     │
    │                                                          │
    │                         │                                │
    │                         ▼                                │
    │                    ┌─────────┐                           │
    │                    │  LOGIN  │                           │
    │                    └────┬────┘                           │
    │                         │                                │
    └─────────────────────────┼───────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
    ┌──────────────────┐            ┌──────────────────┐
    │   MEMBER AREA    │            │   ADMIN AREA     │
    │                  │            │                  │
    │  • My Profile    │            │  • All Members   │
    │  • My Events     │            │  • All Events    │
    │  • My History    │            │  • All Signups   │
    │                  │            │  • CSV Exports   │
    │                  │            │  • Activity Log  │
    │                  │            │  • Dashboard     │
    └──────────────────┘            └──────────────────┘
```

---

## RBAC vs Data Ownership Explained

### Role-Based Access Control (RBAC)

**What it controls**: Which *features* and *pages* you can access

**Example**:
- The "Export Members" button only appears for Admins
- The "/admin/dashboard" page requires Admin role
- Members see a "403 Forbidden" error if they try to access admin pages

**How it's checked**: Every time you request an admin page, the system asks:
*"Is this user an Admin?"*

```
    User Request                  Server Check                  Result
    ────────────                  ────────────                  ──────

    Admin requests               Is user an Admin?             ✓ Allow
    /admin/members          ──►  Yes, they are.           ──►  Show page

    Member requests              Is user an Admin?             ✗ Deny
    /admin/members          ──►  No, just a Member.       ──►  403 Forbidden
```

### Data Ownership

**What it controls**: Which *records* you can see within a feature

**Example**:
- A Member can only see their own registrations
- An Admin can see everyone's registrations

**How it's checked**: When loading data, the system filters by ownership:
*"Show only records this user owns (or all records if Admin)"*

```
    User Request                  Data Filter                   Result
    ────────────                  ───────────                   ──────

    Member "Alice"               Filter: owner = Alice         Alice sees only
    requests "My Events"    ──►  (Members see own data)   ──►  her 3 events

    Admin "Bob" requests         Filter: none                  Bob sees all
    /admin/registrations    ──►  (Admins see all data)    ──►  156 registrations
```

---

## API Endpoint Security

### Protected Endpoints (Admin Only)

These require an Admin role:

| Endpoint | What It Does |
|----------|--------------|
| `/api/admin/members` | List all members |
| `/api/admin/events` | List all events |
| `/api/admin/registrations` | List all registrations |
| `/api/admin/dashboard` | Dashboard statistics |
| `/api/admin/export/*` | CSV data exports |
| `/api/admin/activity` | Activity log |
| `/api/admin/search` | Global search |

### Public Endpoints (No Login Required)

| Endpoint | What It Does |
|----------|--------------|
| `/api/health` | System health check |
| `/api/v1/events` | Public event listings |

---

## Error Messages Explained

When authorization fails, you'll see one of these errors:

### 401 Unauthorized

**Meaning**: You're not logged in, or your session expired.

**What to do**: Log in again.

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing Authorization header"
  }
}
```

### 403 Forbidden

**Meaning**: You're logged in, but don't have permission for this action.

**What to do**: Contact an Admin if you need access.

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin access required"
  }
}
```

---

## Common Questions

### Q: How do I become an Admin?

A: An existing Admin must update your account role. This is typically done by the Tech Chair or a board member with database access.

### Q: Can I have both roles?

A: No. You have one role: Admin or Member. Admins have all Member capabilities plus additional admin features.

### Q: What if I'm locked out?

A: Contact the Tech Chair. They can reset your access or verify your role.

### Q: Are there audit logs?

A: Yes. All admin actions are logged in the activity feed at `/admin/activity`.

### Q: Can Members see other Members' data?

A: No. Members can only see their own profile and registrations. Only Admins can see all member data.

---

## For Developers

Technical implementation details are in:
- `src/lib/auth.ts` - Authentication and authorization helpers
- `docs/project/DAY_4_AUTH_RBAC.md` - Technical specification

### Token Format (Dev/Test Only)

For local development:
- Admin token: `test-admin-{memberId}` or `admin-token`
- Member token: `test-member-{memberId}` or `member-token`

---

## Summary Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│                        AUTHORIZATION FLOW                          │
│                                                                    │
│    ┌──────────┐     ┌──────────────┐     ┌──────────────────┐     │
│    │          │     │              │     │                  │     │
│    │ Request  │────►│ Authenticated│────►│ Role Check       │     │
│    │          │     │ ?            │     │ (RBAC)           │     │
│    └──────────┘     └──────┬───────┘     └────────┬─────────┘     │
│                            │                      │               │
│                     NO     │              NO      │               │
│                     ▼      │              ▼       │               │
│              ┌──────────┐  │       ┌──────────┐   │               │
│              │   401    │  │       │   403    │   │               │
│              │ Unauth   │  │       │ Forbidden│   │               │
│              └──────────┘  │       └──────────┘   │               │
│                            │                      │               │
│                     YES    │              YES     │               │
│                     ▼      │              ▼       │               │
│              ┌─────────────┴──────────────┴────┐  │               │
│              │                                 │  │               │
│              │   Data Filter (Ownership)       │  │               │
│              │   • Admin: See all records      │  │               │
│              │   • Member: See own records     │  │               │
│              │                                 │  │               │
│              └─────────────┬───────────────────┘  │               │
│                            │                      │               │
│                            ▼                      │               │
│                     ┌──────────┐                  │               │
│                     │   200    │                  │               │
│                     │ Success  │                  │               │
│                     └──────────┘                  │               │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

*This document is maintained by the Murmurant development team. For questions, contact the Tech Chair.*
