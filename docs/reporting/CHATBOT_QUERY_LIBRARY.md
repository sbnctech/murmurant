# Chatbot Query Library

**Purpose**: Initial library of vetted questions for ClubOS reporting chatbot
**Audience**: All authorized users (role-based access)
**Status**: Specification (questions to be implemented as saved queries)

---

## Overview

This document contains the initial library of 65 saved questions for the ClubOS
reporting chatbot. Questions are organized by category and target audience.

Each question has been vetted for:
- Data availability in ClubOS schema
- Appropriate access controls
- Clear output expectations

---

## President - Membership Health

**Audience**: President, Board members
**Sensitivity**: Medium (aggregate counts, no PII)
**Suggested scope**: president, board

1. How many active members do we have?
2. How many new members joined in the last 30 days?
3. How many members are approaching their membership expiration in the next 30 days?
4. How many Year 1 members (NewbieNewcomer) do we have?
5. How many Year 2 members (NewcomerMember) do we have?

---

## President - Member Engagement

**Audience**: President, Board members
**Sensitivity**: Medium (engagement metrics)
**Suggested scope**: president, board

1. How many members attended events in the last 30 days?
2. What percentage of active members attended at least one event this month?
3. Which active members have never attended an event?
4. Who are our most engaged members?

---

## President - Event Performance

**Audience**: President, Board members
**Sensitivity**: Low (event counts and capacity)
**Suggested scope**: president, board, vp_activities

1. How many events did we host in the last 30 days?
2. How many events do we have scheduled in the next 30 days?
3. What are our top 10 most attended events this year?
4. Which events are at capacity?

---

## President - Financial

**Audience**: President, Treasurer
**Sensitivity**: High (financial data)
**Suggested scope**: president, finance

1. What's the total outstanding balance from unpaid invoices?
2. How much membership revenue did we collect this year?
3. How much event revenue did we generate in the last 30 days?

---

## President - Board Updates

**Audience**: President, Board members
**Sensitivity**: Low to Medium (summary metrics for board reporting)
**Suggested scope**: president, board

1. How many total members do we have?
2. How many members joined in the last 90 days?
3. What percentage of ticketed events this month sold out?
4. How many events do we have scheduled for next month?
5. How many Newcomers do we have?
6. How many Extended members do we have?

---

## VP Activities - Chair Oversight

**Audience**: VP of Activities
**Sensitivity**: Medium (chair performance tracking)
**Suggested scope**: vp_activities

1. Who are the current committee chairs?
2. Which committee chairs haven't organized events in the last 60 days?
3. How many events has each committee chair organized this year?
4. Which Year 3 members aren't organizing events?

---

## VP Activities - Event Calendar

**Audience**: VP of Activities, Event Chairs
**Sensitivity**: Low (schedule information)
**Suggested scope**: vp_activities, event_chair

1. What events are scheduled for the next 7 days?
2. What events are scheduled for the next 30 days?
3. What events occur next weekend?
4. What events next week occur outside of normal working hours?
5. Which upcoming events are at capacity?
6. Which upcoming events have low registration?

---

## VP Activities - Attendance

**Audience**: VP of Activities
**Sensitivity**: Medium (attendance tracking)
**Suggested scope**: vp_activities

1. What's the average attendance per event this month?
2. How many Year 1 members attended events last month?
3. How many newbies attended events last week?
4. Which events had the highest attendance in the last 3 months?
5. Which members attended events in the last 30 days?
6. How many events happened in September?
7. Who are our top 10 most engaged members this year?
8. Which members attended the Hiking & Biking event?
9. Show me all event registrations for the last 3 months
10. Which members attended the most events in the last 3 months?
11. How many members attended fewer than 5 events in the last 90 days?
12. Show me member engagement by bucket for the last 90 days

---

## VP Membership - Member Lifecycle

**Audience**: VP of Membership
**Sensitivity**: Medium to High (member details)
**Suggested scope**: vp_membership

1. How many members do we have at each membership level?
2. Which members have incorrect status?
3. Which lapsed members are still attending events?
4. Which members have expired but are still marked as Active?
5. Which members moved here from Virginia?
6. Where did your members live before joining newcomers?
7. What are the top ten previous residence areas of our members?
8. What are the top 5 previous residence areas?
9. What members have been in the club for over 6 months and less than 15 months and have attended less than 3 events?
10. How many member last names begin with each letter in the alphabet?

---

## Data Quality and Integrity

**Audience**: Tech Chair, Admin
**Sensitivity**: Medium (data validation)
**Suggested scope**: tech_audit, admin

1. List members who are active but not NewbieNewcomer, NewcomerMember, or ExtendedNewcomer level
2. Which active members have no membership level assigned?
3. Which members have missing email addresses?
4. Which events have no organizer assigned?
5. Which events have more registrations than their limit?
6. Which members have duplicate email addresses?
7. Which events are in the past but still marked as active?
8. Which members have join dates in the future?
9. Which lapsed members attended events in the last 30 days?
10. Which contacts are signed up for future events but are not active members?
11. List contacts who are signed up for events restricted to newcomers, newbies and extended newcomers but have lapsed or inappropriate membership status. Focus on future events

---

## Event Availability and Registration

**Audience**: All members (self-service)
**Sensitivity**: Low (public event information)
**Suggested scope**: member

1. What events have openings for newbies?
2. What events are sold out?
3. What future events have no more openings?
4. What events have openings?
5. What events have space available?
6. Which events can I still register for?

---

## Suggested Reporting Scopes

The following scopes are suggested for mapping categories to access controls:

| Scope | Description | Categories Accessible |
|-------|-------------|----------------------|
| president | Full executive access | All categories |
| board | Board-level summaries | President categories, VP summaries (aggregates) |
| vp_activities | Activities oversight | VP Activities, Event Performance |
| vp_membership | Membership oversight | VP Membership, Member Engagement |
| finance | Financial access | President - Financial (aggregates) |
| tech_audit | System oversight | Data Quality, full audit logs |
| event_chair | Event management | Event Calendar (own events), Availability |
| member | Self-service | Event Availability only |

### Scope Hierarchy

```
president
    |
    +-- board
    |     |
    |     +-- vp_activities
    |     |
    |     +-- vp_membership
    |     |
    |     +-- finance
    |
    +-- tech_audit
           |
           +-- admin
```

### Sensitive Data Access

Questions that return PII or financial details require elevated scopes:
- Member names/emails: vp_membership, president, tech_audit
- Financial amounts: finance, president
- Attendance details: vp_activities, president
- Data quality issues: tech_audit, admin

Aggregate counts are available at lower scope levels.

---

## Question Count Summary

| Category | Count |
|----------|-------|
| President - Membership Health | 5 |
| President - Member Engagement | 4 |
| President - Event Performance | 4 |
| President - Financial | 3 |
| President - Board Updates | 6 |
| VP Activities - Chair Oversight | 4 |
| VP Activities - Event Calendar | 6 |
| VP Activities - Attendance | 12 |
| VP Membership - Member Lifecycle | 10 |
| Data Quality and Integrity | 11 |
| Event Availability and Registration | 6 |
| **Total** | **71** |

Note: The library contains 71 questions. Additional questions may be added based on
operational needs and user feedback.

---

## Adding New Questions

To add a new saved question to the library:

1. Define natural language prompt
2. Identify required data domains (members, events, registrations, etc.)
3. Classify sensitivity (low/medium/high)
4. Assign required scope(s)
5. Document expected output shape
6. Test query against sample data
7. Add to appropriate category in this document
8. Create corresponding saved_query record in system

---

## Related Documents

- docs/REPORTING_AND_CHATBOT.md - Reporting architecture and security model
- docs/rbac/AUTH_AND_RBAC.md - Role and scope definitions
- SYSTEM_SPEC.md - System requirements

---

*Document maintained by ClubOS development team. Last updated: December 2024*
