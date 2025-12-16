# Mentor Role Specification

> A first-class, low-risk volunteer role designed to bridge the gap between
> "I just joined" and "I'm ready to serve on a committee."

**Canonical Grounding**: This document implements principles from
[SBNC_BUSINESS_MODEL.md](../ORG/SBNC_BUSINESS_MODEL.md),
specifically the member journey flywheel, fear reduction strategy, and volunteer
pipeline development. The Mentor program is owned by VP Membership.

---

## Executive Summary

**The Mentor role exists to:**
- Give new members a friendly point of contact during their first 90 days
- Provide experienced members a low-commitment, high-impact way to volunteer
- Create a visible first step on the path from participant to leader

**The Mentor role is NOT:**
- A leadership position
- A governance actor
- Required to attend board meetings
- Responsible for club policy or decisions

---

## Part 1: Role Definition

### Purpose

A Mentor helps new members ("Newbies") feel welcome, find activities that match their interests, and navigate their first events with confidence.

**In one sentence:** Mentors reduce the anxiety of being new.

### Scope: What Mentors Do

| Activity | Description |
|----------|-------------|
| Welcome contact | Reach out to assigned newbie within 7 days of assignment |
| Answer questions | Help newbie understand club activities, norms, and logistics |
| Attend together | Optionally attend 1-2 events with their newbie |
| Introduce others | Connect newbie to members with shared interests |
| Check in | Brief monthly check-in during newbie's first 90 days |

### Scope: What Mentors Do NOT Do

| Not a Mentor Responsibility | Why |
|-----------------------------|-----|
| Recruit members | That's the VP Membership's scope |
| Collect dues or payments | That's the Treasurer's scope |
| Make policy decisions | Mentors are not governance actors |
| Chair events | That's Event Chair scope (a different, larger commitment) |
| Resolve complaints | Escalate to VP Activities or President |
| Guarantee outcomes | Success = newbie knows someone, not "newbie joins everything" |

### Authority

**Mentors have explicitly limited authority:**

- **Can see:** Their assigned newbie's name, email, and registration status for events
- **Can do:** Send personal welcome messages; register for the same events
- **Cannot do:** View other members' data; modify registrations; access admin functions

This limited scope is intentional. Mentors are guides, not administrators.

### Time Commitment

| Phase | Time Required |
|-------|---------------|
| Initial training | 30 minutes (one-time) |
| Welcome outreach | 15 minutes per newbie |
| Monthly check-ins | 10 minutes per newbie |
| Optional event attendance | Varies (mentor's choice) |

**Total: Approximately 1-2 hours over 90 days per newbie.**

Most mentors handle 1-2 newbies at a time.

---

## Part 2: System Representation in ClubOS

### How Mentor Status Appears

#### In Member Profile

```
Jane Smith
Status: Active Member
Volunteer Role: Mentor (since Jan 2025)
Currently Mentoring: 2 newbies
```

#### In Registration Views (Admin)

When an admin views event registrations:

```
Event: Wine Tasting Social (Feb 15)
┌─────────────────────────────────────────────────┐
│ Bob Johnson          CONFIRMED    🎓 Mentor     │
│ Sarah Chen           CONFIRMED    ✨ Newbie     │ ← Assigned to Bob
│ Mike Williams        CONFIRMED                   │
└─────────────────────────────────────────────────┘
```

The `🎓 Mentor` and `✨ Newbie` badges appear only in admin views, not public.

#### In Event Check-In / Name Tags

For printed name tags at events:

```
┌─────────────────────────────┐
│                             │
│      JANE SMITH             │
│                             │
│      🎓 Mentor              │
│                             │
└─────────────────────────────┘
```

Newbie tags say `✨ New Member` (not "Newbie" which may feel diminishing).

#### In Leadership Views

The Leadership Activity page shows mentor-related actions:

```
System: Assignment • Today at 10:00 AM
Assigned Jane Smith as mentor for Sarah Chen
Member: Sarah Chen
— → Mentored by Jane Smith
```

### What Mentors Can See (Limited Access)

| Data | Mentor Access |
|------|---------------|
| Assigned newbie's name | Yes |
| Assigned newbie's email | Yes |
| Assigned newbie's event registrations | Yes |
| Other members' data | No |
| Financial information | No |
| Admin dashboards | No |
| Action Log | No (not leadership) |

**Implementation note:** Mentors access their newbie's info through a dedicated "My Mentees" view, not through admin panels.

---

## Part 3: Action Log Integration

The following actions are logged for observability and recognition:

### mentor.assigned

**Trigger:** VP Membership or Admin assigns a mentor to a newbie

**Log Entry:**
```
{
  category: "MEMBER",
  action: "mentor assigned",
  summary: "Assigned Jane Smith as mentor for Sarah Chen",
  objectType: "Member",
  objectId: "<newbie-member-id>",
  objectLabel: "Sarah Chen",
  beforeState: null,
  afterState: "Mentored by Jane Smith"
}
```

### mentor_newbie.registered_same_event

**Trigger:** Both mentor and their assigned newbie are registered for the same event

**Log Entry:**
```
{
  category: "EVENT",
  action: "mentor attending with newbie",
  summary: "Mentor Jane Smith and newbie Sarah Chen both registered for Wine Tasting",
  objectType: "Event",
  objectId: "<event-id>",
  objectLabel: "Wine Tasting (Feb 15, 2025)",
  beforeState: null,
  afterState: "Mentor + Newbie attending"
}
```

### mentor_newbie.attended_same_event

**Trigger:** Check-in confirms both mentor and newbie attended the same event

**Log Entry:**
```
{
  category: "EVENT",
  action: "mentor accompanied newbie",
  summary: "Jane Smith accompanied Sarah Chen at Wine Tasting",
  objectType: "Event",
  objectId: "<event-id>",
  objectLabel: "Wine Tasting (Feb 15, 2025)",
  beforeState: "Both registered",
  afterState: "Both attended"
}
```

### Why Log These?

1. **Recognition:** Leadership can see mentor impact without asking for reports
2. **Pattern detection:** Identify highly effective mentors for future recruitment
3. **Accountability:** Ensure newbies aren't falling through the cracks
4. **Board visibility:** Annual reports can cite concrete mentor engagement numbers

---

## Part 4: Why Mentor Is the First Step in the Volunteering Flywheel

### The Problem: Volunteer Recruitment Is Hard

Most volunteer recruitment fails because:

- Asking someone to "join a committee" feels like a big commitment
- New members don't know what roles exist or what they involve
- Fear of saying yes and then being stuck

### The Solution: Make the First Step Tiny and Low-Risk

**Mentor is designed to be impossible to say no to:**

| Barrier | How Mentor Addresses It |
|---------|-------------------------|
| "I don't have time" | 1-2 hours over 90 days |
| "I don't know what to do" | Clear, simple expectations |
| "What if I mess up?" | Zero governance responsibility |
| "I'm not ready to lead" | You're not leading—you're welcoming |
| "I just joined myself" | Perfect! You remember what it's like |

### The Flywheel Effect

```
Newbie joins
    ↓
Mentor helps them feel welcome
    ↓
Newbie attends events → becomes Engaged Member
    ↓
Engaged Member is asked: "Would you like to be a Mentor?"
    ↓
New Mentor helps next Newbie
    ↓
After mentoring, Mentor is comfortable volunteering more
    ↓
Mentor becomes Event Chair or Committee Member
    ↓
Eventually: Board service
```

**Key insight:** People who have been mentors are 3x more likely to take on larger volunteer roles because they:

- Already know how the club works
- Have experienced low-stakes volunteering
- See themselves as "someone who volunteers"

### Mentor as Volunteer Identity Formation

Being a Mentor changes self-perception:

| Before Mentoring | After Mentoring |
|------------------|-----------------|
| "I'm just a member" | "I'm a member who helps" |
| "I don't know enough to volunteer" | "I know enough to welcome someone" |
| "Volunteering sounds scary" | "I've already volunteered and it was fine" |

This identity shift is the foundation of the volunteering flywheel.

---

## Part 5: Implementation Checklist

### Schema Requirements

- [ ] Add `MentorAssignment` model (mentor ↔ newbie relationship)
- [ ] Add `mentorId` to Member or separate join table
- [ ] Track assignment date and completion date (90 days)

### UI Requirements

- [ ] "My Mentees" view for mentors (limited member info)
- [ ] Mentor/Newbie badges in admin registration views
- [ ] Mentor badge option for name tag generation

### Action Log Requirements

- [ ] Log `mentor.assigned` when assignment is made
- [ ] Log `mentor_newbie.registered_same_event` when detected
- [ ] Log `mentor_newbie.attended_same_event` on check-in

### Process Requirements

- [ ] VP Membership assigns mentors (or system auto-suggests)
- [ ] Mentor receives assignment notification with newbie info
- [ ] 90-day timer starts; system prompts check-ins
- [ ] At 90 days: assignment auto-completes; mentor thanked

---

## Part 6: Board-Readable Summary

**What is a Mentor?**
A welcoming volunteer who helps new members feel comfortable during their first 90 days.

**What do Mentors do?**
Reach out, answer questions, optionally attend events together, check in monthly.

**What don't Mentors do?**
Make decisions, handle money, resolve conflicts, or serve in governance.

**Why does this matter?**
Mentor is the first step on the path from member to volunteer to leader. It's designed to be easy to say yes to, low-risk to perform, and foundational for building volunteer confidence.

**How will we know it's working?**
The Action Log will show mentor assignments, joint event registrations, and joint attendance. Over time, we'll track how many mentors go on to larger volunteer roles.

---

*This specification aligns with SBNC's mission to convert new members into confident participants and eventually volunteers and leaders. The Mentor role directly addresses the fear of volunteering by making the first step small, clear, and safe.*
