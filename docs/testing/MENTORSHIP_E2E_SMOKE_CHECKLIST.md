# Mentorship E2E Smoke Checklist

**PR**: #114 (Mentorship Dashboard Card)
**Test Duration**: 10-15 minutes
**Tester**: Board officer (no engineering help required)

---

## Prerequisites

Before starting:

1. Access the app at the staging URL (ask dev for URL if unknown)
2. Have access to test accounts for:
   - VP Membership role
   - President role
3. Have database access to verify EmailOutbox and AuditLog entries (or ask dev to check)
4. Confirm at least one member exists with `agreedToMentor = true`
5. Confirm at least one newbie (member joined in last 90 days) exists without a mentor

---

## Section 1: VP Membership Can View and Create Match

**Role**: Log in as VP Membership

### 1.1 Card Visibility

- [ ] Navigate to `/admin`
- [ ] Look for element with `data-test-id="mentorship-card"`
- [ ] **Expected**: Card appears with title "Mentorship Program"
- [ ] **Expected**: Summary stats show: "Awaiting Mentor", "Available Mentors", "Active Pairs"
- [ ] **Expected**: "Create Match" section is visible (NOT showing "View Only")

**If it fails**: Card not rendered or shows 403 error. Check VP Membership has `mentorship:view` and `mentorship:assign` capabilities. Verify auth cookie is set.

### 1.2 Create a Match

- [ ] In the "Select Newbie" dropdown, select a newbie
- [ ] **Expected**: Newbie details appear below (email, status, event registration)
- [ ] In the "Select Mentor" dropdown, select an available mentor
- [ ] **Expected**: Mentor details appear below (email, current assignments)
- [ ] Optionally add notes (e.g., "Both interested in hiking")
- [ ] Click "Create Match" button
- [ ] **Expected**: Green success message appears: "Successfully matched [Mentor] with [Newbie]"
- [ ] **Expected**: Newbie moves from "Awaiting Mentor" list to "Active Pairs" list
- [ ] **Expected**: Summary counts update accordingly

**If it fails**: Check browser console for errors. Verify both newbie and mentor IDs are valid UUIDs. Check API response at `/api/v1/admin/mentorship/match`.

---

## Section 2: President Read-Only View

**Role**: Log in as President

### 2.1 Card Visibility (Read-Only)

- [ ] Navigate to `/admin`
- [ ] Look for element with `data-test-id="mentorship-card"`
- [ ] **Expected**: Card appears with title "Mentorship Program (View Only)"
- [ ] **Expected**: Summary stats are visible
- [ ] **Expected**: "Newbies Awaiting Mentor" list is visible
- [ ] **Expected**: "Active Mentor Pairs" list is visible

### 2.2 Cannot Create Match

- [ ] **Expected**: NO "Create Match" section visible
- [ ] **Expected**: NO newbie/mentor dropdowns visible
- [ ] **Expected**: NO "Create Match" button visible

**If it fails**: President should have `mentorship:view` but NOT `mentorship:assign`. Check `canCreateMatch` flag in API response at `/api/v1/admin/mentorship/dashboard`.

---

## Section 3: Duplicate Prevention (409)

**Role**: Log in as VP Membership

### 3.1 Attempt Duplicate Assignment

- [ ] Note a newbie who already has an ACTIVE mentor assignment (from Section 1.2 or existing data)
- [ ] Attempt to create a new match for the SAME newbie via API:
  ```
  POST /api/v1/admin/mentorship/match
  Body: { "newbieMemberId": "<same-newbie-id>", "mentorMemberId": "<any-mentor-id>" }
  ```
  (Use browser dev tools Network tab or curl)
- [ ] **Expected**: HTTP 409 response
- [ ] **Expected**: Error message: "This newbie already has an active mentor assignment"
- [ ] **Expected**: Error code: `NEWBIE_ALREADY_MATCHED`

**If it fails**: Check if previous assignment was actually created with status ACTIVE. Check MentorshipAssignment table.

---

## Section 4: Mentor Opt-In Requirement (422)

**Role**: Log in as VP Membership

### 4.1 Attempt Match with Non-Opted-In Mentor

- [ ] Identify a member who has `agreedToMentor = false` (or use database to temporarily set one)
- [ ] Attempt to create a match with this non-opted-in member as mentor via API:
  ```
  POST /api/v1/admin/mentorship/match
  Body: { "newbieMemberId": "<newbie-id>", "mentorMemberId": "<non-opted-in-member-id>" }
  ```
- [ ] **Expected**: HTTP 422 response
- [ ] **Expected**: Error message: "This member has not agreed to be a mentor"
- [ ] **Expected**: Error code: `MENTOR_NOT_ELIGIBLE`

**If it fails**: Check the member's `agreedToMentor` field in the Member table. Ensure it's explicitly `false`.

---

## Section 5: Capacity Limit (422)

**Role**: Log in as VP Membership

### 5.1 Attempt Match Exceeding Capacity

- [ ] Note the default capacity limit is **1** active assignment per mentor
- [ ] Find a mentor who already has 1 ACTIVE assignment
- [ ] Attempt to create another match for this mentor via API:
  ```
  POST /api/v1/admin/mentorship/match
  Body: { "newbieMemberId": "<different-newbie-id>", "mentorMemberId": "<at-capacity-mentor-id>" }
  ```
- [ ] **Expected**: HTTP 422 response
- [ ] **Expected**: Error message: "This mentor has reached the maximum of 1 active assignment(s)"
- [ ] **Expected**: Error code: `MENTOR_AT_CAPACITY`

**If it fails**: Check MentorshipAssignment table for mentor's active assignment count. Verify system setting for max assignments (default: 1).

---

## Section 6: Email Notifications

**Role**: Database access required (or ask dev)

### 6.1 Verify EmailOutbox Entries

After creating a successful match (Section 1.2):

- [ ] Query EmailOutbox table for entries related to the assignment
  ```sql
  SELECT * FROM "EmailOutbox"
  WHERE "metadata"::text LIKE '%<assignment-id>%'
  ORDER BY "createdAt" DESC;
  ```
- [ ] **Expected**: 2 entries found
- [ ] **Expected**: One entry with `to` = newbie's email, subject contains "Meet your mentor"
- [ ] **Expected**: One entry with `to` = mentor's email, subject contains "matched with a new mentee"

**If it fails**: Check `queueMentorMatchEmails` function. Verify Prisma EmailOutbox model exists.

---

## Section 7: Action Log Entry

**Role**: Database access required (or ask dev)

### 7.1 Verify AuditLog Entry

After creating a successful match (Section 1.2):

- [ ] Query AuditLog table for the MENTOR_ASSIGNED action:
  ```sql
  SELECT * FROM "AuditLog"
  WHERE "action" = 'MENTOR_ASSIGNED'
  ORDER BY "createdAt" DESC
  LIMIT 5;
  ```
- [ ] **Expected**: Entry exists with:
  - `action` = `MENTOR_ASSIGNED`
  - `resourceType` = `MentorAssignment`
  - `resourceId` = newbie's member ID
  - `after` JSON contains mentorId, mentorName, newbieId, newbieName
  - `metadata` JSON contains summary like "Assigned [Mentor] as mentor for [Newbie]"

**If it fails**: Check `logMentorAssigned` function in `src/lib/mentorship/logging.ts`. Verify AuditAction enum includes MENTOR_ASSIGNED.

---

## Quick Reference: Error Codes

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `NEWBIE_ALREADY_MATCHED` | 409 | Newbie already has an active mentor |
| `MENTOR_NOT_ELIGIBLE` | 422 | Mentor hasn't opted in (`agreedToMentor = false`) |
| `MENTOR_AT_CAPACITY` | 422 | Mentor at max active assignments (default: 1) |
| `SAME_MEMBER` | 400 | Cannot be your own mentor |

---

## Test Data Requirements

Before running tests, ensure:

1. At least 2 newbies exist (members joined in last 90 days, no active mentor assignment)
2. At least 2 mentors exist (members with `agreedToMentor = true`)
3. At least 1 mentor is at capacity (has 1 active assignment)
4. At least 1 member has `agreedToMentor = false`

---

## Pass/Fail Summary

| Section | Pass | Fail | Notes |
|---------|------|------|-------|
| 1. VP Membership View + Create | | | |
| 2. President Read-Only | | | |
| 3. Duplicate Prevention (409) | | | |
| 4. Mentor Opt-In (422) | | | |
| 5. Capacity Limit (422) | | | |
| 6. Email Notifications | | | |
| 7. Action Log Entry | | | |

**Overall Result**: ______ / 7 sections passed

---

*Generated by Agent 5: Mentorship smoke tester*
