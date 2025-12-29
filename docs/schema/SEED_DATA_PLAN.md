# Seed Data Plan for Demo and Testing

## Goals

The seed script creates realistic sample data that makes Murmurant feel like a real club management system. This data serves several purposes:

1. **Demo for Leadership** - When showing Murmurant to the President or Board, we want screens to look populated and realistic, not empty or filled with "Test User 1" placeholders.

2. **Developer Testing** - Engineers need data to test queries, APIs, and UI components. The seed provides consistent, predictable data that makes debugging easier.

3. **Workflow Validation** - We need to verify that real club workflows function correctly: waitlist promotions, leadership transitions between terms, event registration limits, and photo album associations.

4. **Documentation Examples** - Screenshots and examples in documentation will use seed data, so it should look professional and representative of actual club operations.

The seed data is fictional but realistic. Names are invented, but the patterns match how a real newcomers club operates.

---

## Entities to Seed

### MembershipStatus (5 records)

These must be created first because Members reference them.

| Code | Label | isActive | isEligibleForRenewal | isBoardEligible |
|------|-------|----------|---------------------|-----------------|
| PROSPECT | Prospect | false | false | false |
| NEWCOMER | Newcomer | true | true | false |
| EXTENDED | Extended Member | true | true | true |
| ALUMNI | Alumni | true | false | false |
| LAPSED | Lapsed | false | true | false |

### Members (12 records)

A mix of membership levels, ages, and backgrounds. Names are fictional.

| Name | Status | Notes |
|------|--------|-------|
| Alice Chen | Extended | Board President, longtime member |
| Bob Martinez | Extended | Tech Chair, handles website |
| Carol Johnson | Newcomer | Joined 6 months ago, very active |
| David Kim | Newcomer | New member, just joined |
| Eleanor Wright | Extended | DiningIn Chair |
| Frank Patel | Extended | Past President (Alumni role) |
| Grace Thompson | Newcomer | Hiking enthusiast |
| Henry Wilson | Lapsed | Was active, membership expired |
| Irene Santos | Extended | Membership Chair |
| Jack O'Brien | Newcomer | Event host volunteer |
| Karen Liu | Prospect | Attended one event, not yet joined |
| Larry Davis | Alumni | Moved away, stays in touch |

### Committees (5 records)

| Name | Slug | Description |
|------|------|-------------|
| Board of Directors | board | Club leadership and governance |
| Membership | membership | New member recruitment and retention |
| Activities | activities | General event planning |
| DiningIn | diningin | Monthly dinner events at member homes |
| Outdoor Adventures | outdoor | Hikes, walks, and nature activities |

### CommitteeRoles (per committee)

Each committee gets these roles:
- Chair (sortOrder: 1)
- Vice Chair (sortOrder: 2)
- Member (sortOrder: 3)

The Board also gets:
- President (sortOrder: 1)
- Vice President (sortOrder: 2)
- Secretary (sortOrder: 3)
- Treasurer (sortOrder: 4)

### Terms (2 records)

| Name | Start | End | isCurrent |
|------|-------|-----|-----------|
| 2023-2024 Club Year | 2023-07-01 | 2024-06-30 | false |
| 2024-2025 Club Year | 2024-07-01 | 2025-06-30 | true |

### RoleAssignments (10-12 records)

Connect members to committees and roles for both terms to show leadership transitions.

| Member | Committee | Role | Term |
|--------|-----------|------|------|
| Alice Chen | Board | President | 2024-2025 |
| Frank Patel | Board | President | 2023-2024 |
| Bob Martinez | Board | Tech Chair | 2024-2025 |
| Bob Martinez | Board | Tech Chair | 2023-2024 |
| Eleanor Wright | DiningIn | Chair | 2024-2025 |
| Irene Santos | Membership | Chair | 2024-2025 |
| Carol Johnson | Activities | Vice Chair | 2024-2025 |
| Jack O'Brien | Outdoor | Member | 2024-2025 |

### Events (8 records)

A mix of event types, dates, and capacities.

| Title | Category | Date | Capacity | Notes |
|-------|----------|------|----------|-------|
| Welcome Coffee | Social | Past | 20 | Intro event for new members |
| Spring Hike at Valley Trail | Outdoor | Past | 15 | Had waitlist |
| April DiningIn | DiningIn | Past | 24 | Multiple host homes |
| Wine Tasting Social | Social | Past | 30 | Popular event |
| Summer Beach Walk | Outdoor | Future | 20 | Upcoming |
| May DiningIn | DiningIn | Future | 24 | Registration open |
| Game Night | Social | Future | 16 | Limited capacity |
| Photography Workshop | Activities | Future | 12 | Special interest |

### EventRegistrations (25-30 records)

Distributed across events with various statuses.

| Status | Count | Notes |
|--------|-------|-------|
| CONFIRMED | 18 | Members with secured spots |
| WAITLISTED | 4 | For events at capacity |
| CANCELLED | 3 | Members who withdrew |
| NO_SHOW | 2 | Did not attend past events |
| PENDING | 3 | Recent signups not yet confirmed |

Key scenarios to cover:
- Spring Hike has 15 confirmed + 2 waitlisted (at capacity)
- April DiningIn has mix of confirmed across sub-events
- One member (Henry) has a NO_SHOW on record
- Carol Johnson is registered for multiple upcoming events

### PhotoAlbums and Photos (2 albums, 6-8 photos)

| Album | Event | Photo Count |
|-------|-------|-------------|
| Spring Hike 2024 | Spring Hike at Valley Trail | 4 |
| April DiningIn Memories | April DiningIn | 3 |

Photos use placeholder URLs (e.g., `/images/seed/hike-01.jpg`) that can be replaced with real images later.

### EmailLog (5-8 records)

Sample email history for testing communication tracking.

| Recipient | Subject | Status |
|-----------|---------|--------|
| carol@example.com | Welcome to the Club! | DELIVERED |
| david@example.com | Your Registration is Confirmed | DELIVERED |
| grace@example.com | Waitlist Update: Spot Available | DELIVERED |
| henry@example.com | Membership Renewal Reminder | BOUNCED |
| Multiple | May DiningIn Announcement | SENT |

---

## Test Scenarios Enabled by Seed

The seed data specifically supports testing these workflows:

1. **Member Event History**
   - "Show all events Carol Johnson has attended or is registered for"
   - Tests: EventRegistration queries filtered by memberId

2. **Current Committee Roster**
   - "List all current Board members for 2024-2025"
   - Tests: RoleAssignment queries filtered by termId where isCurrent=true

3. **Leadership Transitions**
   - "Who was President before Alice Chen?"
   - Tests: RoleAssignment queries across multiple terms

4. **Waitlist Management**
   - "Show all waitlisted members for Spring Hike in position order"
   - Tests: EventRegistration queries filtered by status=WAITLISTED, ordered by waitlistPosition

5. **Event Host Lookup**
   - "Find all DiningIn events and their chair"
   - Tests: Joining Event, Committee, and RoleAssignment

6. **Membership Status Filtering**
   - "List all active members eligible for board service"
   - Tests: Member queries joined with MembershipStatus flags

7. **Photo Album Display**
   - "Show all photos from the Spring Hike"
   - Tests: Photo queries filtered by albumId, Album queries by eventId

8. **Email History**
   - "What emails has this member received?"
   - Tests: EmailLog queries filtered by memberId

9. **No-Show Tracking**
   - "Which members have no-shows on record?"
   - Tests: EventRegistration queries filtered by status=NO_SHOW

10. **Registration Capacity**
    - "Is this event full? How many on waitlist?"
    - Tests: Counting registrations by status per event

---

## Seed Script Structure (Outline)

### File Location

```
scripts/dev/seed.ts
```

### Execution Order

The seed script must insert records in this order to satisfy foreign key constraints:

1. **MembershipStatus** (no dependencies)
2. **Members** (depends on MembershipStatus)
3. **Committees** (no dependencies)
4. **CommitteeRoles** (depends on Committees)
5. **Terms** (no dependencies)
6. **RoleAssignments** (depends on Members, Committees, CommitteeRoles, Terms)
7. **UserAccounts** (depends on Members)
8. **Events** (no dependencies)
9. **EventRegistrations** (depends on Events, Members)
10. **PhotoAlbums** (depends on Events)
11. **Photos** (depends on PhotoAlbums, Members)
12. **EmailLogs** (depends on Members)

### Script Outline

```
1. Import Prisma client
2. Connect to database

3. Clear existing data (in reverse order of insertion)
   - Delete EmailLogs
   - Delete Photos
   - Delete PhotoAlbums
   - Delete EventRegistrations
   - Delete Events
   - Delete UserAccounts
   - Delete RoleAssignments
   - Delete Terms
   - Delete CommitteeRoles
   - Delete Committees
   - Delete Members
   - Delete MembershipStatuses

4. Seed MembershipStatus records (upsert by code)

5. Seed Members
   - Create array of member data
   - Insert all members
   - Store IDs in a lookup map for later use

6. Seed Committees
   - Insert committee records
   - Store IDs in lookup map

7. Seed CommitteeRoles
   - For each committee, insert standard roles
   - Store IDs in lookup map

8. Seed Terms
   - Insert past and current term
   - Store IDs in lookup map

9. Seed RoleAssignments
   - Link members to committees/roles/terms
   - Use lookup maps to resolve foreign keys

10. Seed UserAccounts
    - Create accounts for admin users (Alice, Bob)
    - Use bcrypt for password hashing

11. Seed Events
    - Insert past and future events
    - Store IDs in lookup map

12. Seed EventRegistrations
    - Create registrations with various statuses
    - Assign waitlist positions where applicable

13. Seed PhotoAlbums
    - Create albums linked to past events
    - Store IDs in lookup map

14. Seed Photos
    - Add photos to albums
    - Set uploaders to appropriate members

15. Seed EmailLogs
    - Create sample email history

16. Disconnect from database
17. Log completion summary
```

### Running the Seed Script

```
npx ts-node scripts/dev/seed.ts
```

Or via a package.json script:

```
npm run seed
```

### Idempotence

The seed script clears all data before inserting. This means:
- Running it twice produces the same result
- It can be used to reset the database to a known state
- It should NEVER be run against production data

A safety check at the start of the script should verify the DATABASE_URL does not point to a production database.
