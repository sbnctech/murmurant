# Leadership Action Log

**Canonical Grounding**: [SBNC_BUSINESS_MODEL.md](../ORG/SBNC_BUSINESS_MODEL.md)
**Purpose**: Document the action types and patterns tracked in the Leadership Activity feed

---

## Overview

The Leadership Action Log provides visibility into organizational activities that
matter for governance, volunteer coordination, and member journey tracking.

From the [canonical grounding document](../ORG/SBNC_BUSINESS_MODEL.md):

> ClubOS exists to reduce fear, increase clarity, and actively manage the tension
> between event capacity, volunteer supply, and member demand.

The Action Log serves clarity by making organizational activity visible to
leadership without requiring manual reports.

---

## Action Categories

### Member Actions

Actions related to member lifecycle and journey progression.

| Action Type | Trigger | Significance |
|-------------|---------|--------------|
| `member.joined` | New member record created | Start of member journey |
| `member.renewed` | Membership renewed | Retention success signal |
| `member.lapsed` | Membership not renewed | Potential churn indicator |

### Mentor Actions

Actions related to the mentor program (see [MENTOR.md](../roles/MENTOR.md)).

| Action Type | Trigger | Significance |
|-------------|---------|--------------|
| `mentor.assigned` | VP Membership assigns mentor to newbie | Volunteer engagement, newbie support initiated |
| `mentor_newbie.registered_same_event` | Both mentor and newbie registered for same event | Mentor actively supporting newbie |
| `mentor_newbie.attended_same_event` | Check-in confirms both attended | Successful mentorship touchpoint |

#### mentor.assigned

**Logged when**: VP Membership or Admin assigns a mentor to a new member.

**Log entry structure**:
```json
{
  "category": "MEMBER",
  "action": "mentor assigned",
  "summary": "Assigned Jane Smith as mentor for Sarah Chen",
  "objectType": "Member",
  "objectId": "<newbie-member-id>",
  "objectLabel": "Sarah Chen",
  "beforeState": null,
  "afterState": "Mentored by Jane Smith"
}
```

**Why this matters**: Tracks volunteer engagement and ensures no new member falls
through the cracks without a mentor connection.

#### mentor_newbie.registered_same_event

**Logged when**: System detects both a mentor and their assigned newbie have
registered for the same event.

**Log entry structure**:
```json
{
  "category": "EVENT",
  "action": "mentor attending with newbie",
  "summary": "Mentor Jane Smith and newbie Sarah Chen both registered for Wine Tasting",
  "objectType": "Event",
  "objectId": "<event-id>",
  "objectLabel": "Wine Tasting (Feb 15, 2025)",
  "beforeState": null,
  "afterState": "Mentor + Newbie attending"
}
```

**Why this matters**: Indicates active mentorship engagement without requiring
manual reporting from mentors.

#### mentor_newbie.attended_same_event

**Logged when**: Event check-in confirms both mentor and newbie attended the
same event.

**Log entry structure**:
```json
{
  "category": "EVENT",
  "action": "mentor accompanied newbie",
  "summary": "Jane Smith accompanied Sarah Chen at Wine Tasting",
  "objectType": "Event",
  "objectId": "<event-id>",
  "objectLabel": "Wine Tasting (Feb 15, 2025)",
  "beforeState": "Both registered",
  "afterState": "Both attended"
}
```

**Why this matters**: Confirms mentorship is happening in practice, not just
on paper. This is the strongest signal of effective mentorship.

### Event Actions

Actions related to event lifecycle.

| Action Type | Trigger | Significance |
|-------------|---------|--------------|
| `event.created` | New event created | Activity pipeline building |
| `event.published` | Event made visible to members | Availability signal |
| `event.registration_opened` | Registration window opens | Member action opportunity |
| `event.capacity_reached` | Event fills up | Demand signal, waitlist trigger |
| `event.completed` | Event date passes | Flywheel activity completed |

### Volunteer Actions

Actions related to volunteer coordination.

| Action Type | Trigger | Significance |
|-------------|---------|--------------|
| `volunteer.assigned` | Member assigned to volunteer role | Pipeline progression |
| `volunteer.completed` | Volunteer term or task completed | Recognition opportunity |
| `volunteer.declined` | Member declines volunteer opportunity | Capacity signal |

---

## Using the Action Log

### For VP Membership

- Monitor `mentor.assigned` to ensure new members are getting mentors
- Review `mentor_newbie.attended_same_event` to identify effective mentors
- Track patterns in `member.lapsed` to identify retention risks

### For VP Activities

- Monitor `event.capacity_reached` for demand management
- Review volunteer actions for workload distribution
- Identify members attending many events (potential volunteer candidates)

### For President/Board

- High-level health metrics from action patterns
- Volunteer pipeline visibility
- Early warning signals (declining mentorship, event attendance drops)

---

## Flywheel Health Indicators

The Action Log enables tracking of flywheel health (see canonical grounding, Part 2):

| Flywheel Stage | Healthy Signal | Warning Signal |
|----------------|----------------|----------------|
| Events attract members | Consistent `event.published` flow | Long gaps between events |
| Members participate | High registration-to-attendance ratio | Many no-shows |
| Participants volunteer | Regular `mentor.assigned` entries | Same few mentors repeatedly |
| Volunteers enable events | Distributed `volunteer.assigned` | Declining volunteer pool |

---

## Implementation Notes

### What Gets Logged Automatically

- Member lifecycle events (join, renew, lapse)
- Event lifecycle events (create, publish, complete)
- Mentor assignment and co-attendance detection

### What Requires Manual Action

- Mentor check-ins (optional, not required for log)
- Qualitative volunteer feedback
- Recognition decisions

### Privacy Considerations

- Action log is visible only to authorized leadership roles
- Member-specific entries accessible per RBAC rules
- Aggregate statistics may be shared more broadly

---

## Connection to Canonical Grounding

This documentation implements several principles from
[SBNC_BUSINESS_MODEL.md](../ORG/SBNC_BUSINESS_MODEL.md):

1. **Transparency by Default** - Leadership can see what's happening without
   requesting reports
2. **Volunteer Sustainability** - Workload distribution becomes visible
3. **Flywheel Monitoring** - Health of member-to-volunteer pipeline is trackable
4. **Fear Reduction** - Mentor effectiveness can be recognized and celebrated

---

*The Action Log exists to make organizational health visible, not to create
surveillance. Its purpose is enabling good leadership decisions, not controlling
member behavior.*
