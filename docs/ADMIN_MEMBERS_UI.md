# Admin Members Explorer

## Overview

The Admin Members Explorer provides a dedicated interface for viewing and managing club members. It displays member profiles, contact information, and event registration history in a structured, browsable format.

This feature is currently backed by mock data. The underlying data helpers return static member and registration records for development and testing purposes.

## Routes

### /admin/members

The members list page displays all members with summary metrics.

- Shows a table of members with basic profile information
- Displays registration counts for each member
- Shows waitlisted registration counts
- Links to individual member detail pages

### /admin/members/[id]

The member detail page shows a single member profile.

- Displays full member information (name, email, phone, status, join date)
- Lists all event registrations for this member
- Shows registration status for each event (REGISTERED, WAITLISTED, CANCELLED)
- Includes registration timestamps

## Data Sources

### GET /api/admin/members

Returns a list of all members with aggregated registration metrics.

**Response fields:**

| Field              | Type   | Description                              |
|--------------------|--------|------------------------------------------|
| id                 | string | Unique member identifier                 |
| name               | string | Full name (first + last)                 |
| email              | string | Member email address                     |
| status             | string | ACTIVE or INACTIVE                       |
| phone              | string | Phone number (may be null)               |
| joinedAt           | string | ISO 8601 timestamp of membership start   |
| registrationCount  | number | Total event registrations                |
| waitlistedCount    | number | Registrations with WAITLISTED status     |

### GET /api/admin/members/[id]

Returns detailed information for a single member.

**Response structure:**

- **member** object:
  - id - Unique member identifier
  - name - Full name
  - email - Email address
  - status - ACTIVE or INACTIVE
  - phone - Phone number (may be null)
  - joinedAt - ISO 8601 timestamp

- **registrations** array (each item):
  - id - Registration identifier
  - eventId - Reference to event
  - eventTitle - Human-readable event name
  - status - REGISTERED, WAITLISTED, or CANCELLED
  - registeredAt - ISO 8601 timestamp of registration

## Testing

The Admin Members Explorer is covered by the following test files:

**API tests:**

- tests/api/admin-members-list.spec.ts - Tests the /api/admin/members endpoint
- tests/api/admin-member-detail.spec.ts - Tests the /api/admin/members/[id] endpoint

**UI tests:**

- tests/admin/admin-members-explorer.spec.ts - Tests the members list page
- tests/admin/admin-member-detail-page.spec.ts - Tests the member detail page

Run tests with:

```bash
make test-api     # Run API tests only
make test-admin   # Run UI tests only
make test         # Run all tests
```

## Future Enhancements

Planned improvements for the Admin Members Explorer:

- Replace mock members and registrations with database-backed queries
- Add filters and search on the members list (by name, email, status)
- Add pagination and sort controls for large member lists
- Show additional profile fields as Murmurant evolves (address, membership tier, etc.)
- Add member edit and create functionality
- Export member lists to CSV
