# WA Import Sample Mapping Reference

```
Purpose: Concrete examples of WA-to-ClubOS data transformation
Audience: Migration developers, QA testers
```

---

## Sample Data Files

This document provides complete examples of WA export data and the corresponding ClubOS records that should be created.

---

## 1. Events Mapping

### WA Events Export (CSV)

```csv
Event ID,Event name,Description,Tags,Location,Start date,End date,Registration limit,Registration enabled,Access level
EVT-001,Welcome Coffee,Monthly new member welcome gathering. Meet fellow newcomers and learn about club activities.,Social; Newcomer Welcome,Handlebar Coffee - 128 E Canon Perdido St,01/15/2025 09:00,01/15/2025 11:00,30,Yes,Public
EVT-002,Sunset Wine Tasting,Tour of local Santa Ynez wineries with transportation provided.,Dining; Wine; Outdoor,Foxen Winery - 7600 Foxen Canyon Rd,02/10/2025 13:00,02/10/2025 18:00,24,Yes,Members only
EVT-003,Morning Hike - Inspiration Point,Moderate 4-mile hike with ocean views. Bring water and snacks.,Outdoor; Hiking,Inspiration Point Trailhead,02/24/2025 08:00,02/24/2025 12:00,20,Yes,Members only
EVT-004,Board Meeting - February,Monthly board meeting. Open to all members.,Governance; Board,Zoom Meeting,02/05/2025 18:00,02/05/2025 20:00,,No,Members only
EVT-005,Museum Visit - SBMA,Guided tour of current exhibition at Santa Barbara Museum of Art.,Cultural; Art; Museum,Santa Barbara Museum of Art,03/01/2025 10:00,03/01/2025 12:00,15,Yes,Members only
```

### Transformed ClubOS Records

#### Event Records

```json
[
  {
    "id": "uuid-event-001",
    "title": "Welcome Coffee",
    "description": "Monthly new member welcome gathering. Meet fellow newcomers and learn about club activities.",
    "category": "Social",
    "location": "Handlebar Coffee - 128 E Canon Perdido St",
    "startTime": "2025-01-15T09:00:00-08:00",
    "endTime": "2025-01-15T11:00:00-08:00",
    "capacity": 30,
    "requiresRegistration": true,
    "status": "PUBLISHED",
    "isPublished": true,
    "publishedAt": "2025-01-08T09:00:00-08:00",
    "committeeId": "uuid-social-committee"
  },
  {
    "id": "uuid-event-002",
    "title": "Sunset Wine Tasting",
    "description": "Tour of local Santa Ynez wineries with transportation provided.",
    "category": "Dining",
    "location": "Foxen Winery - 7600 Foxen Canyon Rd",
    "startTime": "2025-02-10T13:00:00-08:00",
    "endTime": "2025-02-10T18:00:00-08:00",
    "capacity": 24,
    "requiresRegistration": true,
    "status": "PUBLISHED",
    "isPublished": true,
    "publishedAt": "2025-02-03T09:00:00-08:00",
    "committeeId": "uuid-dining-committee"
  },
  {
    "id": "uuid-event-003",
    "title": "Morning Hike - Inspiration Point",
    "description": "Moderate 4-mile hike with ocean views. Bring water and snacks.",
    "category": "Outdoor",
    "location": "Inspiration Point Trailhead",
    "startTime": "2025-02-24T08:00:00-08:00",
    "endTime": "2025-02-24T12:00:00-08:00",
    "capacity": 20,
    "requiresRegistration": true,
    "status": "PUBLISHED",
    "isPublished": true,
    "publishedAt": "2025-02-17T09:00:00-08:00",
    "committeeId": "uuid-outdoor-committee"
  },
  {
    "id": "uuid-event-004",
    "title": "Board Meeting - February",
    "description": "Monthly board meeting. Open to all members.",
    "category": "Governance",
    "location": "Zoom Meeting",
    "startTime": "2025-02-05T18:00:00-08:00",
    "endTime": "2025-02-05T20:00:00-08:00",
    "capacity": null,
    "requiresRegistration": false,
    "status": "PUBLISHED",
    "isPublished": true,
    "publishedAt": "2025-01-29T09:00:00-08:00",
    "committeeId": "uuid-board"
  },
  {
    "id": "uuid-event-005",
    "title": "Museum Visit - SBMA",
    "description": "Guided tour of current exhibition at Santa Barbara Museum of Art.",
    "category": "Cultural",
    "location": "Santa Barbara Museum of Art",
    "startTime": "2025-03-01T10:00:00-08:00",
    "endTime": "2025-03-01T12:00:00-08:00",
    "capacity": 15,
    "requiresRegistration": true,
    "status": "PUBLISHED",
    "isPublished": true,
    "publishedAt": "2025-02-22T09:00:00-08:00",
    "committeeId": "uuid-cultural-committee"
  }
]
```

#### EventTag Records

```json
[
  { "eventId": "uuid-event-001", "tag": "Social" },
  { "eventId": "uuid-event-001", "tag": "Newcomer Welcome" },

  { "eventId": "uuid-event-002", "tag": "Dining" },
  { "eventId": "uuid-event-002", "tag": "Wine" },
  { "eventId": "uuid-event-002", "tag": "Outdoor" },

  { "eventId": "uuid-event-003", "tag": "Outdoor" },
  { "eventId": "uuid-event-003", "tag": "Hiking" },

  { "eventId": "uuid-event-004", "tag": "Governance" },
  { "eventId": "uuid-event-004", "tag": "Board" },

  { "eventId": "uuid-event-005", "tag": "Cultural" },
  { "eventId": "uuid-event-005", "tag": "Art" },
  { "eventId": "uuid-event-005", "tag": "Museum" }
]
```

#### MigrationIdMap Records

```json
[
  { "runId": "mig-2025-01-15-001", "entityType": "event", "waId": "EVT-001", "clubosId": "uuid-event-001" },
  { "runId": "mig-2025-01-15-001", "entityType": "event", "waId": "EVT-002", "clubosId": "uuid-event-002" },
  { "runId": "mig-2025-01-15-001", "entityType": "event", "waId": "EVT-003", "clubosId": "uuid-event-003" },
  { "runId": "mig-2025-01-15-001", "entityType": "event", "waId": "EVT-004", "clubosId": "uuid-event-004" },
  { "runId": "mig-2025-01-15-001", "entityType": "event", "waId": "EVT-005", "clubosId": "uuid-event-005" }
]
```

---

## 2. Tag Normalization Examples

### Input → Output

| WA Tags Field | Primary Category | All Tags Array |
|---------------|------------------|----------------|
| `Social; Newcomer Welcome` | `Social` | `["Social", "Newcomer Welcome"]` |
| `Dining; Wine; Outdoor` | `Dining` | `["Dining", "Wine", "Outdoor"]` |
| `Outdoor; Hiking` | `Outdoor` | `["Outdoor", "Hiking"]` |
| `Governance; Board` | `Governance` | `["Governance", "Board"]` |
| `Cultural; Art; Museum` | `Cultural` | `["Cultural", "Art", "Museum"]` |
| `Special Event; Holiday; Annual` | `Special Events` | `["Special Event", "Holiday", "Annual"]` |
| `Workshop; Learning; Photography` | `Learning` | `["Workshop", "Learning", "Photography"]` |
| `Happy Hour; Mixer` | `Social` | `["Happy Hour", "Mixer"]` |
| `Wine Tasting` | `Dining` | `["Wine Tasting"]` |
| `Beach Walk` | `Outdoor` | `["Beach Walk"]` |
| `Theater; SBCAST` | `Cultural` | `["Theater", "SBCAST"]` |
| (empty) | `General` | `[]` |

### Category Mapping Rules Applied

```yaml
# Pattern matching (order matters - first match wins)
Social:      ["Social*", "Newcomer*", "Happy Hour*", "Mixer*", "Coffee*"]
Outdoor:     ["Outdoor*", "Hike*", "Hiking*", "Walk*", "Beach*", "Garden*", "Kayak*"]
Dining:      ["Dining*", "Wine*", "Restaurant*", "Lunch*", "Dinner*", "Food*"]
Cultural:    ["Cultural*", "Art*", "Music*", "Theater*", "Museum*", "Concert*"]
Learning:    ["Learning*", "Workshop*", "Lecture*", "Class*", "Seminar*"]
Governance:  ["Governance*", "Board*", "Committee*", "Annual Meeting*", "Election*"]
Special:     ["Special*", "Annual*", "Holiday*", "Gala*", "Anniversary*"]
General:     (default fallback)
```

---

## 3. Committees Mapping

### WA Groups Export (CSV)

```csv
Group ID,Group name,Description,Access type,Member count,Created date
GRP-001,Board of Directors,Elected officers and board members,Closed,9,01/01/2010
GRP-002,Activities Committee,Plans and coordinates club activities and events,Closed,12,01/01/2015
GRP-003,Social Committee,Organizes social gatherings and newcomer events,Closed,8,01/01/2015
GRP-004,Membership Committee,Handles membership applications and renewals,Closed,5,01/01/2015
GRP-005,Communications Committee,Manages newsletter and website content,Closed,6,01/01/2018
GRP-006,Outdoor Activities,Plans hikes walks and outdoor adventures,Closed,10,01/01/2016
GRP-007,Dining Group,Coordinates restaurant outings and wine tastings,Closed,7,01/01/2016
GRP-008,Cultural Exploration,Plans museum visits concerts and cultural events,Closed,6,01/01/2017
GRP-009,Interest Group: Book Club,Monthly book discussion group,Open,25,03/15/2019
GRP-010,Interest Group: Photography,Photography walks and workshops,Open,18,06/01/2020
```

### Transformed ClubOS Records

#### Committee Records

```json
[
  {
    "id": "uuid-board",
    "name": "Board of Directors",
    "slug": "board",
    "description": "Elected officers and board members",
    "isActive": true
  },
  {
    "id": "uuid-activities-committee",
    "name": "Activities Committee",
    "slug": "activities-committee",
    "description": "Plans and coordinates club activities and events",
    "isActive": true
  },
  {
    "id": "uuid-social-committee",
    "name": "Social Committee",
    "slug": "social-committee",
    "description": "Organizes social gatherings and newcomer events",
    "isActive": true
  },
  {
    "id": "uuid-membership-committee",
    "name": "Membership Committee",
    "slug": "membership-committee",
    "description": "Handles membership applications and renewals",
    "isActive": true
  },
  {
    "id": "uuid-communications-committee",
    "name": "Communications Committee",
    "slug": "communications-committee",
    "description": "Manages newsletter and website content",
    "isActive": true
  },
  {
    "id": "uuid-outdoor-committee",
    "name": "Outdoor Activities",
    "slug": "outdoor-activities",
    "description": "Plans hikes walks and outdoor adventures",
    "isActive": true
  },
  {
    "id": "uuid-dining-committee",
    "name": "Dining Group",
    "slug": "dining-group",
    "description": "Coordinates restaurant outings and wine tastings",
    "isActive": true
  },
  {
    "id": "uuid-cultural-committee",
    "name": "Cultural Exploration",
    "slug": "cultural-exploration",
    "description": "Plans museum visits concerts and cultural events",
    "isActive": true
  }
]
```

**Note:** Interest Groups (GRP-009, GRP-010) are skipped per configuration:

```yaml
_pattern_skip:
  - "Interest Group:*"
```

#### CommitteeRole Records (Auto-seeded)

For each committee, these roles are created:

```json
[
  { "committeeId": "uuid-board", "name": "President", "slug": "president", "sortOrder": 1 },
  { "committeeId": "uuid-board", "name": "Vice President", "slug": "vice-president", "sortOrder": 2 },
  { "committeeId": "uuid-board", "name": "Secretary", "slug": "secretary", "sortOrder": 3 },
  { "committeeId": "uuid-board", "name": "Treasurer", "slug": "treasurer", "sortOrder": 4 },
  { "committeeId": "uuid-board", "name": "Member", "slug": "member", "sortOrder": 10 },

  { "committeeId": "uuid-activities-committee", "name": "Chair", "slug": "chair", "sortOrder": 1 },
  { "committeeId": "uuid-activities-committee", "name": "Co-Chair", "slug": "co-chair", "sortOrder": 2 },
  { "committeeId": "uuid-activities-committee", "name": "Member", "slug": "member", "sortOrder": 10 }
]
```

---

## 4. Group Membership Mapping

### WA Group Membership Export (CSV)

```csv
Group ID,Contact ID,First name,Last name,Email,Role,Added date
GRP-001,CON-101,Jane,Smith,jane.smith@email.com,President,01/01/2024
GRP-001,CON-102,Robert,Johnson,robert.j@email.com,Vice President,01/01/2024
GRP-001,CON-103,Maria,Garcia,maria.g@email.com,Secretary,01/01/2024
GRP-001,CON-104,David,Lee,david.lee@email.com,Treasurer,01/01/2024
GRP-001,CON-105,Susan,Brown,susan.b@email.com,Member,01/01/2024
GRP-002,CON-106,Patricia,Wilson,pat.wilson@email.com,Chair,06/01/2024
GRP-002,CON-107,James,Taylor,james.t@email.com,Co-Chair,06/01/2024
GRP-002,CON-108,Jennifer,Anderson,jen.a@email.com,Member,06/01/2024
GRP-003,CON-109,Michael,Thomas,mike.t@email.com,Chair,01/01/2024
GRP-003,CON-101,Jane,Smith,jane.smith@email.com,Member,03/01/2024
```

### Transformed ClubOS Records

#### RoleAssignment Records

```json
[
  {
    "id": "uuid-assignment-001",
    "memberId": "uuid-member-101",
    "committeeId": "uuid-board",
    "committeeRoleId": "uuid-role-president",
    "termId": "uuid-term-2024-2025",
    "startDate": "2024-01-01T00:00:00-08:00",
    "endDate": null
  },
  {
    "id": "uuid-assignment-002",
    "memberId": "uuid-member-102",
    "committeeId": "uuid-board",
    "committeeRoleId": "uuid-role-vp",
    "termId": "uuid-term-2024-2025",
    "startDate": "2024-01-01T00:00:00-08:00",
    "endDate": null
  },
  {
    "id": "uuid-assignment-003",
    "memberId": "uuid-member-103",
    "committeeId": "uuid-board",
    "committeeRoleId": "uuid-role-secretary",
    "termId": "uuid-term-2024-2025",
    "startDate": "2024-01-01T00:00:00-08:00",
    "endDate": null
  },
  {
    "id": "uuid-assignment-004",
    "memberId": "uuid-member-104",
    "committeeId": "uuid-board",
    "committeeRoleId": "uuid-role-treasurer",
    "termId": "uuid-term-2024-2025",
    "startDate": "2024-01-01T00:00:00-08:00",
    "endDate": null
  },
  {
    "id": "uuid-assignment-005",
    "memberId": "uuid-member-105",
    "committeeId": "uuid-board",
    "committeeRoleId": "uuid-role-member",
    "termId": "uuid-term-2024-2025",
    "startDate": "2024-01-01T00:00:00-08:00",
    "endDate": null
  },
  {
    "id": "uuid-assignment-006",
    "memberId": "uuid-member-106",
    "committeeId": "uuid-activities-committee",
    "committeeRoleId": "uuid-role-chair",
    "termId": "uuid-term-2024-2025",
    "startDate": "2024-06-01T00:00:00-07:00",
    "endDate": null
  }
]
```

**Note:** Jane Smith (CON-101) has two assignments:

- President of Board (uuid-board)
- Member of Social Committee (uuid-social-committee)

This is valid - members can serve on multiple committees.

---

## 5. Registrations Mapping

### WA Registrations Export (CSV)

```csv
Registration ID,Contact ID,Event ID,First name,Last name,Email,Registration date,Registration status,Cancellation date,Guests,Payment status
REG-001,CON-101,EVT-001,Jane,Smith,jane.smith@email.com,01/10/2025 14:30,Confirmed,,0,N/A
REG-002,CON-102,EVT-001,Robert,Johnson,robert.j@email.com,01/11/2025 09:15,Confirmed,,1,N/A
REG-003,CON-103,EVT-001,Maria,Garcia,maria.g@email.com,01/12/2025 10:00,Cancelled,01/13/2025 08:00,0,N/A
REG-004,CON-104,EVT-002,David,Lee,david.lee@email.com,01/20/2025 11:30,Confirmed,,0,Paid
REG-005,CON-105,EVT-002,Susan,Brown,susan.b@email.com,01/21/2025 16:45,Waitlisted,,2,Pending
REG-006,CON-106,EVT-003,Patricia,Wilson,pat.wilson@email.com,02/15/2025 08:00,Confirmed,,0,N/A
REG-007,CON-107,EVT-003,James,Taylor,james.t@email.com,02/16/2025 09:30,No show,,0,N/A
```

### Transformed ClubOS Records

#### EventRegistration Records

```json
[
  {
    "id": "uuid-reg-001",
    "eventId": "uuid-event-001",
    "memberId": "uuid-member-101",
    "status": "CONFIRMED",
    "registeredAt": "2025-01-10T14:30:00-08:00",
    "cancelledAt": null,
    "guestCount": 0
  },
  {
    "id": "uuid-reg-002",
    "eventId": "uuid-event-001",
    "memberId": "uuid-member-102",
    "status": "CONFIRMED",
    "registeredAt": "2025-01-11T09:15:00-08:00",
    "cancelledAt": null,
    "guestCount": 1
  },
  {
    "id": "uuid-reg-003",
    "eventId": "uuid-event-001",
    "memberId": "uuid-member-103",
    "status": "CANCELLED",
    "registeredAt": "2025-01-12T10:00:00-08:00",
    "cancelledAt": "2025-01-13T08:00:00-08:00",
    "guestCount": 0
  },
  {
    "id": "uuid-reg-004",
    "eventId": "uuid-event-002",
    "memberId": "uuid-member-104",
    "status": "CONFIRMED",
    "registeredAt": "2025-01-20T11:30:00-08:00",
    "cancelledAt": null,
    "guestCount": 0
  },
  {
    "id": "uuid-reg-005",
    "eventId": "uuid-event-002",
    "memberId": "uuid-member-105",
    "status": "WAITLISTED",
    "registeredAt": "2025-01-21T16:45:00-08:00",
    "cancelledAt": null,
    "guestCount": 2
  },
  {
    "id": "uuid-reg-006",
    "eventId": "uuid-event-003",
    "memberId": "uuid-member-106",
    "status": "CONFIRMED",
    "registeredAt": "2025-02-15T08:00:00-08:00",
    "cancelledAt": null,
    "guestCount": 0
  },
  {
    "id": "uuid-reg-007",
    "eventId": "uuid-event-003",
    "memberId": "uuid-member-107",
    "status": "NO_SHOW",
    "registeredAt": "2025-02-16T09:30:00-08:00",
    "cancelledAt": null,
    "guestCount": 0
  }
]
```

---

## 6. Edge Cases and Error Handling

### Missing Member Reference

**WA Data:**
```csv
REG-008,CON-999,EVT-001,Unknown,Person,unknown@email.com,01/14/2025 10:00,Confirmed,,0,N/A
```

**Handling:**
- Member lookup by `CON-999` fails (member not in ClubOS)
- Log error: `{ waId: "REG-008", error: "Member not found", waContactId: "CON-999" }`
- Skip registration
- Include in error report

### Invalid Date Format

**WA Data:**
```csv
EVT-006,Special Event,Description,Social,TBD,TBD,TBD,30,Yes,Public
```

**Handling:**
- Date parse fails for "TBD"
- Log error: `{ waId: "EVT-006", field: "startTime", error: "Invalid date format", value: "TBD" }`
- Skip event
- Include in error report

### Duplicate Event (Idempotency)

**First Import:**
```csv
EVT-001,Welcome Coffee,Description,Social,Location,01/15/2025 09:00,01/15/2025 11:00,30,Yes,Public
```
→ Creates `uuid-event-001`

**Second Import (same file):**
```csv
EVT-001,Welcome Coffee,Description,Social,Location,01/15/2025 09:00,01/15/2025 11:00,30,Yes,Public
```
→ Matches existing by `(title, startTime)` within 1 hour tolerance
→ Skips (does not update)
→ Log: `{ waId: "EVT-001", action: "skipped", reason: "existing_match" }`

### Tag with No Category Match

**WA Data:**
```csv
EVT-007,Tech Workshop,Description,Technology; Computers,Location,03/15/2025 14:00,03/15/2025 16:00,20,Yes,Members only
```

**Handling:**
- "Technology" and "Computers" don't match any category pattern
- Primary category defaults to "General"
- Tags still preserved: `["Technology", "Computers"]`

```json
{
  "id": "uuid-event-007",
  "category": "General",
  "tags": [
    { "eventId": "uuid-event-007", "tag": "Technology" },
    { "eventId": "uuid-event-007", "tag": "Computers" }
  ]
}
```

### Committee Role Not Recognized

**WA Data:**
```csv
GRP-002,CON-110,Alex,Wong,alex.w@email.com,Event Coordinator,07/01/2024
```

**Handling:**
- "Event Coordinator" not in role mapping
- Defaults to "member" role
- Log: `{ waId: "CON-110", warning: "Role defaulted to member", originalRole: "Event Coordinator" }`

---

## 7. Sample Import Report

```json
{
  "runId": "mig-2025-01-15-001",
  "timestamp": "2025-01-15T10:30:00-08:00",
  "duration_seconds": 45,
  "source": {
    "events_file": "wa-events-export-2025-01-15.csv",
    "registrations_file": "wa-registrations-export-2025-01-15.csv",
    "committees_file": "wa-groups-export-2025-01-15.csv",
    "group_members_file": "wa-group-members-export-2025-01-15.csv"
  },
  "results": {
    "committees": {
      "total_input": 10,
      "created": 8,
      "updated": 0,
      "skipped": 2,
      "errors": 0,
      "skipped_reasons": {
        "interest_group_pattern": 2
      }
    },
    "committee_roles": {
      "total_input": 0,
      "created": 24,
      "updated": 0,
      "skipped": 0,
      "errors": 0,
      "note": "Auto-seeded from committee creation"
    },
    "role_assignments": {
      "total_input": 10,
      "created": 9,
      "updated": 0,
      "skipped": 0,
      "errors": 1,
      "error_breakdown": {
        "member_not_found": 1
      }
    },
    "events": {
      "total_input": 7,
      "created": 6,
      "updated": 0,
      "skipped": 0,
      "errors": 1,
      "error_breakdown": {
        "invalid_date": 1
      }
    },
    "event_tags": {
      "total_input": 0,
      "created": 15,
      "updated": 0,
      "skipped": 0,
      "errors": 0,
      "note": "Derived from event tags field"
    },
    "registrations": {
      "total_input": 8,
      "created": 7,
      "updated": 0,
      "skipped": 0,
      "errors": 1,
      "error_breakdown": {
        "member_not_found": 1
      }
    }
  },
  "errors": [
    {
      "entity": "events",
      "waId": "EVT-006",
      "field": "startTime",
      "error": "Invalid date format",
      "value": "TBD"
    },
    {
      "entity": "registrations",
      "waId": "REG-008",
      "field": "memberId",
      "error": "Member not found",
      "waContactId": "CON-999"
    },
    {
      "entity": "role_assignments",
      "waId": "GRP-002:CON-999",
      "field": "memberId",
      "error": "Member not found",
      "waContactId": "CON-999"
    }
  ],
  "warnings": [
    {
      "entity": "role_assignments",
      "waId": "GRP-002:CON-110",
      "field": "role",
      "warning": "Role defaulted to member",
      "originalRole": "Event Coordinator"
    }
  ],
  "category_distribution": {
    "Social": 2,
    "Dining": 1,
    "Outdoor": 1,
    "Governance": 1,
    "Cultural": 1,
    "General": 1
  },
  "tag_distribution": {
    "Social": 2,
    "Newcomer Welcome": 1,
    "Dining": 1,
    "Wine": 1,
    "Outdoor": 2,
    "Hiking": 1,
    "Governance": 1,
    "Board": 1,
    "Cultural": 1,
    "Art": 1,
    "Museum": 1,
    "Technology": 1,
    "Computers": 1
  },
  "id_map_location": "scripts/migration/reports/mig-2025-01-15-001-id-map.json"
}
```

---

## 8. Sample Verification Queries

### Post-Import Checks

```sql
-- Verify event count matches expected
SELECT COUNT(*) as event_count FROM "Event"
WHERE id IN (SELECT clubos_id FROM migration_id_map WHERE run_id = 'mig-2025-01-15-001' AND entity_type = 'event');
-- Expected: 6

-- Verify all events have categories
SELECT id, title, category FROM "Event"
WHERE id IN (SELECT clubos_id FROM migration_id_map WHERE run_id = 'mig-2025-01-15-001' AND entity_type = 'event')
AND category IS NULL;
-- Expected: 0 rows

-- Verify tag counts
SELECT tag, COUNT(*) as count
FROM "EventTag"
WHERE event_id IN (SELECT clubos_id FROM migration_id_map WHERE run_id = 'mig-2025-01-15-001' AND entity_type = 'event')
GROUP BY tag
ORDER BY count DESC;

-- Verify committee-event links
SELECT c.name as committee, COUNT(e.id) as event_count
FROM "Committee" c
LEFT JOIN "Event" e ON e.committee_id = c.id
WHERE c.id IN (SELECT clubos_id FROM migration_id_map WHERE run_id = 'mig-2025-01-15-001' AND entity_type = 'committee')
GROUP BY c.name;
```

---

## Related Documents

- [Import Pipeline Specification](./WA_IMPORT_PIPELINE_EVENTS_TAGS_COMMITTEES.md)
- [Implementation Backlog](./WA_IMPORT_PIPELINE_BACKLOG.md)
- [Migration Config](../../scripts/migration/config/migration-config.yaml)

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2025-12-26 | Worker 5 | Initial sample mapping reference |
