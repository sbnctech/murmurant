# VP Communications Weekly eNews Module

Copyright (c) Santa Barbara Newcomers Club

> **Purpose**: Specification for the weekly eNews compilation dashboard. The system removes "research drudgery" by auto-compiling candidate content while keeping the VP Communications in full editorial control.

---

## Table of Contents

- [Design Philosophy](#design-philosophy)
- [Weekly Workflow](#weekly-workflow)
- [Dashboard Layout](#dashboard-layout)
- [Section Specifications](#section-specifications)
  - [Upcoming Events Highlights](#1-upcoming-events-highlights)
  - [Welcome Our Newest Members](#2-welcome-our-newest-members)
  - [Members Leaving This Month](#3-members-leaving-this-month)
  - [Recurring Announcements](#4-recurring-announcements)
- [Subject Line Generator](#subject-line-generator)
- [Edits Needed Checklist](#edits-needed-checklist)
- [What Changed Since Last Week](#what-changed-since-last-week)
- [Data Sources](#data-sources)
- [API Endpoints](#api-endpoints)
- [RBAC Capabilities](#rbac-capabilities)
- [Charter Compliance](#charter-compliance)

---

## Design Philosophy

**Human-authored, machine-assisted.**

The VP Communications (see Persona 7: Grace Lin) is a skilled writer who wants to craft engaging newsletters. Murmurant removes the tedious research—gathering event details, finding new members, identifying expiring memberships—while leaving all editorial decisions to the human.

### What the system does:

- Auto-compiles candidate content from database queries
- Generates suggested blurbs that can be edited or replaced
- Flags items needing attention (missing blurbs, incomplete data)
- Tracks week-over-week changes so nothing is accidentally dropped
- Provides one-click copy-to-clipboard for each section

### What the system does NOT do:

- Auto-send without human review
- Make editorial decisions about what to include
- Override VP Communications edits with auto-generated content

---

## Weekly Workflow

### Timeline (Pacific Time)

| Day | Time | Action | Actor |
|-----|------|--------|-------|
| **Monday** | Any | Review draft dashboard, note "edits needed" items | VP Comms |
| **Tuesday** | Any | Finalize event blurbs with event chairs if needed | VP Comms |
| **Wednesday** | Any | Write welcome messages, verify leaving members list | VP Comms |
| **Thursday** | Any | Review recurring announcements, update if needed | VP Comms |
| **Friday** | 5:00 PM | Cutoff for new events to be included | System |
| **Saturday** | Any | Final review, compose subject line, preview | VP Comms |
| **Sunday** | 8:00 AM | eNews sent to all active members | System |

### Workflow States

```
┌─────────────────────────────────────────────────────────────────┐
│                         eNews Week Cycle                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  COMPILING ──► DRAFTING ──► REVIEW ──► APPROVED ──► SENT       │
│      │            │           │           │           │          │
│   (auto)       (VP edits)  (VP final)  (VP approve) (auto)      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

| State | Description |
|-------|-------------|
| `COMPILING` | System is gathering data for the week (Mon 12:01 AM) |
| `DRAFTING` | VP Communications is editing content |
| `REVIEW` | Content finalized, VP reviewing full preview |
| `APPROVED` | VP has approved for send |
| `SENT` | eNews delivered (Sunday 8:00 AM) |

---

## Dashboard Layout

**Route**: `/admin/communications/enews`

**Capability Required**: `communications:enews:edit`

### Header Section

```
┌─────────────────────────────────────────────────────────────────┐
│  Weekly eNews                                     Week of Dec 22 │
│  ─────────────────────────────────────────────────────────────── │
│  Status: DRAFTING                     [Preview] [Approve & Send] │
│                                                                   │
│  Subject Line:                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ This Week: Holiday Party, New Year's Hike, and 5 More!     │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  [Suggest Subject Lines ▼]                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Main Content Area (Tabs)

```
┌─────────────────────────────────────────────────────────────────┐
│  [Events] [New Members] [Leaving Members] [Announcements] [Diff]│
│  ═══════                                                         │
│                                                                   │
│  ┌─ Section content here ─────────────────────────────────────┐ │
│  │                                                             │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Edits Needed: 3 items                          [Copy Section]   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Section Specifications

### 1. Upcoming Events Highlights

**Purpose**: Feature events announcing this week or with registration opening this week.

#### Data Source

```sql
-- Events publishing this Sunday
SELECT * FROM events
WHERE status = 'PUBLISHED'
  AND publish_at >= :this_sunday
  AND publish_at < :next_sunday
ORDER BY start_time ASC;

-- Events with registration opening this week
SELECT * FROM events
WHERE status = 'PUBLISHED'
  AND registration_opens_at >= :this_sunday
  AND registration_opens_at < :next_sunday
ORDER BY registration_opens_at ASC;
```

#### Display Fields

| Field | Source | Editable |
|-------|--------|----------|
| Event Title | `event.title` | No (links to event) |
| Date & Time | `event.startTime` | No |
| Location | `event.location` | No |
| Committee | `committee.name` | No |
| Blurb | `event.enewsBlurbDraft` | Yes |
| Link | `event.publicUrl` | No |

#### Auto-Generated Blurb Template

If `enewsBlurbDraft` is empty, system generates:

```
Join [Committee Name] for [Event Title] on [Day, Month Date] at [Location].
[First sentence of event description, max 100 chars...]
```

#### Flagged Conditions

- 🟡 **Missing blurb**: Event has no `enewsBlurbDraft` (auto-generated shown)
- 🟡 **Long blurb**: Blurb exceeds 280 characters
- 🔴 **Missing location**: Event has no location specified
- 🔴 **Past event**: Event start time is before eNews send time

#### UI Card Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ 🎉 Holiday Party                                    Dec 28, 6 PM │
│    Social Committee • Casa de la Guerra                          │
│ ─────────────────────────────────────────────────────────────────│
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Ring in the season at our annual Holiday Party! Join       │ │
│ │ fellow members for appetizers, drinks, and festive cheer.  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ [Edit Blurb] [View Event]                     🔗 Copy Link       │
│                                                                   │
│ ⚠️ Registration opens Tuesday, Dec 24 at 8:00 AM                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2. Welcome Our Newest Members

**Purpose**: Introduce members who joined in the past month, with their previous location.

#### Data Source

```sql
SELECT
  m.id,
  m.first_name,
  m.last_name,
  m.joined_at,
  m.previous_city,
  m.previous_state
FROM members m
JOIN membership_status ms ON m.membership_status_id = ms.id
WHERE ms.code = 'active'
  AND m.joined_at >= :one_month_ago
  AND m.joined_at < :today
ORDER BY m.joined_at DESC;
```

#### Display Fields

| Field | Source | Notes |
|-------|--------|-------|
| Name | `firstName lastName` | First and last name only |
| Previous Location | `previousCity, previousState` | From WA custom field |
| Joined Date | `joinedAt` | For internal reference only |

#### Auto-Generated Format

```
Please welcome our newest members:
• Jane Smith (Portland, OR)
• Bob Johnson (Chicago, IL)
• Maria Garcia (Austin, TX)
```

#### Privacy Considerations (POL-PRI-001)

- Only display first name and last name
- Previous location is opt-in during signup
- Members who opted out of directory are excluded

#### Flagged Conditions

- 🟡 **Missing location**: Member has no previous city/state
- 🟡 **Many new members**: More than 10 (suggest grouping by origin)

#### UI Card Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ 👋 New Members This Month                          12 new members│
│ ─────────────────────────────────────────────────────────────────│
│                                                                   │
│ • Jane Smith (Portland, OR)                          Joined 12/15│
│ • Bob Johnson (Chicago, IL)                          Joined 12/12│
│ • Maria Garcia (Austin, TX)                          Joined 12/10│
│ • David Lee                                ⚠️ No location on file│
│ ... and 8 more                                                   │
│                                                                   │
│ [Edit Welcome Message] [View All]                  🔗 Copy Section│
└─────────────────────────────────────────────────────────────────┘
```

---

### 3. Members Leaving This Month

**Purpose**: Acknowledge departing members and encourage connections before they go.

This section has two subsections:

#### 3a. Extended Members Expiring

Members with `membershipTier = extended_member` whose membership expires this month.

```sql
SELECT m.*, ms.code as status_code, mt.code as tier_code
FROM members m
JOIN membership_status ms ON m.membership_status_id = ms.id
JOIN membership_tier mt ON m.membership_tier_id = mt.id
WHERE mt.code = 'extended_member'
  AND ms.code = 'active'
  AND m.membership_expires_at >= :month_start
  AND m.membership_expires_at < :next_month_start
ORDER BY m.last_name ASC;
```

#### 3b. Newcomer Members Not Renewing to Extended

Members with `membershipTier = member` (standard 2-year newcomer) who:

- Are at or past their 2-year mark
- Have NOT been offered extended membership, OR
- Were offered but declined, OR
- Were offered but have not paid

```sql
SELECT m.*, ms.code as status_code, mt.code as tier_code
FROM members m
JOIN membership_status ms ON m.membership_status_id = ms.id
JOIN membership_tier mt ON m.membership_tier_id = mt.id
WHERE mt.code = 'member'
  AND ms.code IN ('active', 'pending_renewal')
  AND m.membership_expires_at >= :month_start
  AND m.membership_expires_at < :next_month_start
ORDER BY m.last_name ASC;
```

#### Display Fields

| Field | Source | Notes |
|-------|--------|-------|
| Name | `firstName lastName` | |
| Tier | `membershipTier.name` | Extended Member or Member |
| Expiration | `membershipExpiresAt` | |
| Years as Member | Calculated from `joinedAt` | |

#### Auto-Generated Format

```
We'll miss these members whose time with us is ending:

Extended Members completing their journey:
• Carol Hayes (5 years) - Thank you for your leadership!
• Robert Kim (3 years)

Members completing their newcomer period:
• Alice Martin (2 years)
• Frank Chen (2 years)

If you haven't already, reach out to say goodbye!
```

#### Editorial Notes

- VP Comms may personalize messages for long-serving or active members
- Members who served on committees may get special recognition
- This section is optional—VP Comms may choose to omit entirely

#### Flagged Conditions

- 🟡 **Former officer**: Member served on board (suggest recognition)
- 🟡 **Event chair**: Member chaired events (suggest thank you)

#### UI Card Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ 👋 Members Completing Their Journey                   6 members │
│ ─────────────────────────────────────────────────────────────────│
│                                                                   │
│ Extended Members (3):                                             │
│ • Carol Hayes (5 years) ⭐ Past President                        │
│ • Robert Kim (3 years)                                           │
│ • Patricia Wong (4 years) ⭐ Committee Chair                     │
│                                                                   │
│ Newcomer Members (3):                                             │
│ • Alice Martin (2 years)                                         │
│ • Frank Chen (2 years)                                           │
│ • Susan Park (2 years)                                           │
│                                                                   │
│ [Edit Farewell Message] [View All]                 🔗 Copy Section│
│                                                                   │
│ ☐ Include this section in eNews                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 4. Recurring Announcements

**Purpose**: Standard reminders that appear periodically (monthly, quarterly, etc.).

#### Announcement Types

| Type | Frequency | Example |
|------|-----------|---------|
| `MEMBERSHIP_RULES` | Monthly | "Remember: membership is for those who moved to SB in the last 18 months..." |
| `GUEST_POLICY` | Monthly | "Guests are welcome at most events. Each member may bring up to 2 guests..." |
| `VOLUNTEER_CALL` | Quarterly | "Interested in getting more involved? Contact our Volunteer Coordinator..." |
| `RENEWAL_REMINDER` | As needed | "Memberships expiring this month: Don't forget to renew!" |
| `CUSTOM` | One-time | Board-approved special announcements |

#### Data Model

```prisma
model RecurringAnnouncement {
  id            String   @id @default(uuid())
  type          String   // MEMBERSHIP_RULES, GUEST_POLICY, etc.
  title         String
  content       String   // Rich text (Markdown)
  frequency     String   // WEEKLY, MONTHLY, QUARTERLY, YEARLY, CUSTOM
  lastIncluded  DateTime?
  nextScheduled DateTime?
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

#### UI Card Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ 📢 Recurring Announcements                                       │
│ ─────────────────────────────────────────────────────────────────│
│                                                                   │
│ ☑️ Membership Rules Reminder              Monthly (last: Nov 24) │
│    "Remember: membership is for those who moved to SB..."        │
│    [Edit] [Skip This Week]                                       │
│                                                                   │
│ ☐ Guest Policy                           Monthly (last: Dec 1)  │
│    "Guests are welcome at most events..."                        │
│    [Edit] [Include This Week]                                    │
│                                                                   │
│ ☑️ Volunteer Opportunities               Quarterly (last: Oct 6) │
│    "Looking for ways to get involved?..."                        │
│    [Edit] [Skip This Week]                                       │
│                                                                   │
│ [+ Add Custom Announcement]                        🔗 Copy Section│
└─────────────────────────────────────────────────────────────────┘
```

---

## Subject Line Generator

The system suggests subject lines based on content.

### Generation Rules

1. **Lead with a highlight event** if there's a flagship event this week
2. **Include count** of total events: "...and 5 more events!"
3. **Seasonal hooks** for December, summer, etc.
4. **Character limit**: 60 characters max for mobile preview

### Example Suggestions

```
┌─────────────────────────────────────────────────────────────────┐
│ Subject Line Suggestions:                                        │
│                                                                   │
│ ○ This Week: Holiday Party, New Year's Hike, and 5 More!        │
│ ○ 7 Events This Week + Welcome to Our 12 New Members            │
│ ○ Don't Miss: Holiday Party Registration Opens Tuesday!          │
│ ○ December Events: Your Weekly SBNC Update                       │
│                                                                   │
│ [Use Selected] [Write Custom]                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Edits Needed Checklist

A running checklist of items requiring VP Communications attention.

### Checklist Items

| Priority | Item | Action |
|----------|------|--------|
| 🔴 High | Missing event blurb | Write or approve auto-generated |
| 🔴 High | Event missing location | Contact event chair |
| 🟡 Medium | Blurb too long (>280 chars) | Shorten |
| 🟡 Medium | New member missing location | Use "Location not provided" |
| 🟡 Medium | Former officer leaving | Consider recognition |
| 🟢 Low | Recurring announcement due | Review and approve |

### UI Display

```
┌─────────────────────────────────────────────────────────────────┐
│ ✅ Edits Needed                                          3 items │
│ ─────────────────────────────────────────────────────────────────│
│                                                                   │
│ 🔴 Holiday Party has no blurb                                    │
│    [Write Blurb] [Use Auto-Generated]                            │
│                                                                   │
│ 🟡 "Wine Tasting" blurb is 312 characters (max 280)              │
│    [Edit Blurb]                                                  │
│                                                                   │
│ 🟡 Carol Hayes (Past President) is leaving - consider recognition│
│    [Add Recognition] [Dismiss]                                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## What Changed Since Last Week

Shows additions, removals, and modifications compared to last week's eNews.

### Change Categories

| Category | Description |
|----------|-------------|
| `EVENT_ADDED` | New event appearing this week |
| `EVENT_REMOVED` | Event was in last week's, not in this week's |
| `EVENT_MODIFIED` | Event details changed (title, time, location) |
| `MEMBER_ADDED` | New member joined since last week |
| `MEMBER_REMOVED` | Member no longer in "new members" window |
| `LEAVING_ADDED` | Member now in "leaving this month" |
| `ANNOUNCEMENT_ADDED` | Recurring announcement now due |

### UI Display

```
┌─────────────────────────────────────────────────────────────────┐
│ 📊 What Changed Since Last Week                                  │
│ ─────────────────────────────────────────────────────────────────│
│                                                                   │
│ Events:                                                          │
│ + New Year's Day Hike (added)                                    │
│ + Book Club January Meeting (added)                              │
│ - Holiday Cookie Exchange (was last week, now passed)            │
│ ~ Wine Tasting location changed: Carr Winery → Municipal Winery │
│                                                                   │
│ Members:                                                         │
│ + Jane Smith joined Dec 18                                       │
│ + Bob Johnson joined Dec 16                                      │
│ - Alice Brown no longer in 30-day window                         │
│                                                                   │
│ Announcements:                                                   │
│ + Membership Rules reminder due (monthly)                        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Sources

### Required Schema Additions

```prisma
model Member {
  // ... existing fields ...

  // Previous location (for "Welcome New Members" section)
  previousCity     String?
  previousState    String?

  // Membership expiration (for "Leaving This Month" section)
  membershipExpiresAt DateTime?
}

model RecurringAnnouncement {
  id            String   @id @default(uuid())
  type          String   // MEMBERSHIP_RULES, GUEST_POLICY, etc.
  title         String
  content       String
  frequency     String   // WEEKLY, MONTHLY, QUARTERLY, YEARLY
  lastIncluded  DateTime?
  nextScheduled DateTime?
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model EnewsDraft {
  id             String   @id @default(uuid())
  weekStart      DateTime @unique // Sunday of the week
  status         String   @default("COMPILING") // COMPILING, DRAFTING, REVIEW, APPROVED, SENT
  subjectLine    String?
  eventsJson     Json?    // Cached event data with VP edits
  newMembersJson Json?    // Cached new member data
  leavingJson    Json?    // Cached leaving member data
  announcementsJson Json? // Selected announcements
  approvedAt     DateTime?
  approvedById   String?
  sentAt         DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

### Wild Apricot Field Mapping

| WA Field Name | Murmurant Field | Notes |
|---------------|--------------|-------|
| `City / Town from` | `previousCity` | Custom field in WA |
| `State / Region from` | `previousState` | Custom field in WA |
| `MembershipExpirationDate` | `membershipExpiresAt` | Standard WA field |

---

## API Endpoints

### GET `/api/v1/admin/communications/enews/current`

Returns the current week's eNews draft with all compiled data.

**Authorization**: `communications:enews:view`

**Response**:
```json
{
  "week": {
    "start": "2024-12-22T08:00:00.000Z",
    "end": "2024-12-28T08:00:00.000Z"
  },
  "status": "DRAFTING",
  "subjectLine": "This Week: Holiday Party and 5 More!",
  "sections": {
    "events": [...],
    "newMembers": [...],
    "leavingMembers": [...],
    "announcements": [...]
  },
  "editsNeeded": [...],
  "changesSinceLastWeek": {...}
}
```

### PUT `/api/v1/admin/communications/enews/current`

Update the current week's eNews draft.

**Authorization**: `communications:enews:edit`

### POST `/api/v1/admin/communications/enews/current/approve`

Approve the eNews for sending.

**Authorization**: `communications:enews:approve`

### GET `/api/v1/admin/communications/enews/preview`

Generate HTML preview of the eNews.

**Authorization**: `communications:enews:view`

---

## RBAC Capabilities

| Capability | Description | Default Roles |
|------------|-------------|---------------|
| `communications:enews:view` | View eNews dashboard and preview | VP Communications, Admin |
| `communications:enews:edit` | Edit blurbs, subject lines, select announcements | VP Communications, Admin |
| `communications:enews:approve` | Approve eNews for sending | VP Communications, Admin |
| `communications:announcements:manage` | Create/edit recurring announcements | VP Communications, Admin |

---

## Charter Compliance

| Principle | Implementation |
|-----------|----------------|
| **P1** (Identity) | All edits tracked with authenticated user ID |
| **P2** (Default Deny) | Dashboard requires explicit `communications:enews:*` capabilities |
| **P3** (State Machine) | eNews workflow has explicit states: COMPILING → DRAFTING → REVIEW → APPROVED → SENT |
| **P4** (No Hidden Rules) | All auto-generation logic documented; VP can see and override |
| **P5** (Undoable) | VP can revert to auto-generated content at any time |
| **P6** (Human-First) | Clear labels, preview before send, no jargon |
| **P7** (Observability) | "What Changed" diff visible; audit log for approvals |
| **P9** (Fail Closed) | If data fetch fails, show error; don't send incomplete eNews |

---

## Related Documents

- [POSTING_AND_REGISTRATION_SCHEDULE.md](../events/POSTING_AND_REGISTRATION_SCHEDULE.md) - Event publishing policy
- [POLICY_REGISTRY.yaml](../policies/POLICY_REGISTRY.yaml) - POL-EVT-002 eNews Inclusion
- [PERSONAS.md](../personas/PERSONAS.md) - Persona 7: Grace Lin (VP Communications)
- [MEMBERSHIP_MODEL_TRUTH_TABLE.md](../membership/MEMBERSHIP_MODEL_TRUTH_TABLE.md) - Tier definitions

---

*Last updated: 2024-12-20*
*Maintainer: Murmurant Development Team*
