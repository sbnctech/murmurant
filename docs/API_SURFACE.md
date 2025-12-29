# Murmurant API Surface

This document describes the HTTP API endpoints available in Murmurant. All endpoints currently use mock data; the database layer is not yet active.

## Version and Scope

**API Version:** v1

Endpoints are labeled as:
- **[v1]** - Included in the initial release
- **[DEFERRED]** - Planned for future releases

---

## Authentication and Authorization

### JWT Token Structure

All authenticated requests must include a valid JWT in the `Authorization` header:

```
Authorization: Bearer <token>
```

**JWT Claims (v1):**

```json
{
  "sub": "user-uuid-here",
  "iat": 1702300000,
  "exp": 1702386400,
  "aud": "murmurant-api",
  "globalRole": "member",
  "memberId": "member-uuid-here",
  "profile": {
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.org"
  },
  "sessionId": "session-uuid-here"
}
```

**Claim Definitions:**

| Claim       | Type   | Required | Description                                    |
|-------------|--------|----------|------------------------------------------------|
| `sub`       | string | Yes      | Auth provider's user identifier                |
| `iat`       | number | Yes      | Token issued-at timestamp (Unix seconds)       |
| `exp`       | number | Yes      | Token expiration timestamp (Unix seconds)      |
| `aud`       | string | Yes      | Must be "murmurant-api"                        |
| `globalRole`| string | Yes      | "member" or "admin"                            |
| `memberId`  | string | No       | Murmurant member record ID (if linked)         |
| `profile`   | object | No       | Cached display info (firstName, lastName, email)|
| `sessionId` | string | No       | Session identifier for token revocation        |

**Permission Model:**
- `globalRole` determines baseline access (member vs admin)
- Resource-level permissions (e.g., "can edit this event") use RoleAssignment lookups, not JWT claims
- Committee chairs, event hosts, and other scoped roles are stored in the RoleAssignment table

---

## Error Responses

All API errors return a consistent JSON structure:

```json
{
  "code": "RESOURCE_NOT_FOUND",
  "message": "Member with ID 12345 not found",
  "details": {
    "resourceType": "member",
    "resourceId": "12345",
    "requestId": "optional-correlation-id"
  }
}
```

**Standard Error Codes (v1):**

| Code               | HTTP Status | Description                                      |
|--------------------|-------------|--------------------------------------------------|
| `VALIDATION_ERROR` | 400         | Request body or parameters are invalid           |
| `UNAUTHORIZED`     | 401         | No valid token provided                          |
| `FORBIDDEN`        | 403         | Valid token but insufficient permissions         |
| `RESOURCE_NOT_FOUND`| 404        | Requested entity does not exist                  |
| `CONFLICT`         | 409         | Action conflicts with current state              |
| `CAPACITY_EXCEEDED`| 422         | Event is full (registration rejected)            |
| `RATE_LIMITED`     | 429         | Too many requests                                |
| `INTERNAL_ERROR`   | 500         | Unexpected server error                          |

---

## Behavioral Decisions for V1

### Waitlist Handling

- Waitlist promotions are **manual** in v1
- Admins must explicitly call `POST /api/admin/registrations/{id}/promote`
- No automatic promotion when spots open
- Future versions may add auto-promotion with configurable rules

### Payments

- Murmurant **tracks payment status only** in v1
- Payment states: `pending`, `paid`, `refunded`
- No payment gateway integration; admins update payment status manually
- Future versions may integrate with payment processors

### Notifications

The following actions trigger automatic notifications in v1:

| Action                  | Notification Type           |
|-------------------------|----------------------------|
| Registration confirmed  | Email to member            |
| Waitlist promotion      | Email to promoted member   |
| Event cancellation      | Email to all registrants   |
| Member status change    | Email to affected member   |

Notifications are domain events triggered by specific API actions, not arbitrary side effects.

### Guests

- Guest registration is a **future feature**
- The data model anticipates a `RegistrationGuest` entity
- No guest endpoints in v1

### Audit Logging

- Full audit logging is **deferred** in v1
- API design assumes future immutable logs for:
  - Member status changes
  - RoleAssignment changes
  - Event cancellations
  - Waitlist promotions
  - Refunds or payment adjustments

---

## System Operations

### GET /api/health (Legacy)

Simple health check endpoint. Returns basic status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-06-01T12:00:00.000Z",
  "database": {
    "status": "ok"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Always `"ok"` when healthy |
| `timestamp` | string | ISO 8601 timestamp |
| `database.status` | string | Database connection status |

### GET /api/v1/health [v1] (Canonical)

**This is the canonical health endpoint.** Use this for production monitoring.

**Response (healthy):**
```json
{
  "status": "healthy",
  "timestamp": "2025-06-01T12:00:00.000Z",
  "version": "0.1.0",
  "checks": {
    "database": {
      "status": "ok",
      "latencyMs": 1
    }
  },
  "env": {
    "dbConfigured": true
  }
}
```

**Response (unhealthy - 503):**
```json
{
  "status": "unhealthy",
  "timestamp": "2025-06-01T12:00:00.000Z",
  "version": "0.1.0",
  "checks": {
    "database": {
      "status": "error",
      "error": "Connection refused"
    }
  },
  "env": {
    "dbConfigured": true
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `"healthy"` or `"unhealthy"` |
| `timestamp` | string | ISO 8601 timestamp |
| `version` | string | API version (from package.json) |
| `checks.database.status` | string | `"ok"` or `"error"` |
| `checks.database.latencyMs` | number | Database ping latency (when healthy) |
| `checks.database.error` | string | Error message (when unhealthy) |
| `env.dbConfigured` | boolean | Whether DATABASE_URL is set |

**HTTP Status Codes:**
- `200` - All checks passing
- `503` - One or more checks failing

### GET /api/version [v1]

Returns the API version and build information.

**Response:**
```json
{
  "version": "1.0.0",
  "build": "abc123",
  "environment": "production"
}
```

---

## Communication Testing

These endpoints are for testing email and SMS integrations in development.

### POST /api/email/test

Sends a test email using the configured email transport (mock in development).

**Request body (optional):**
```json
{
  "to": "recipient@example.com",
  "subject": "Test subject",
  "body": "Test email body"
}
```

**Response:**
```json
{
  "ok": true,
  "to": "recipient@example.com",
  "messageId": "mock-abc123"
}
```

### GET /api/email/test

Returns an empty list of sent emails (placeholder for future email log queries).

**Response:**
```json
{
  "emails": []
}
```

### POST /api/sms/test

Sends a test SMS using the mock SMS client.

**Request body (optional):**
```json
{
  "to": "+15551234567",
  "body": "Test SMS message"
}
```

**Response:**
```json
{
  "ok": true,
  "to": "+15551234567",
  "messageId": "mock-sms-1234567890-0"
}
```

### GET /api/sms/test

Returns a simple liveness check for the SMS endpoint.

**Response:**
```json
{
  "ok": true,
  "message": "SMS test endpoint is alive"
}
```

## Members

### GET /api/members [v1]

Returns all active members.

**Response:**
```json
{
  "members": [
    {
      "id": "m1",
      "firstName": "Alice",
      "lastName": "Johnson",
      "email": "alice@example.com",
      "status": "ACTIVE"
    },
    {
      "id": "m2",
      "firstName": "Bob",
      "lastName": "Smith",
      "email": "bob@example.com",
      "status": "ACTIVE"
    }
  ]
}
```

**Member fields:**

| Field       | Type   | Description                          |
|-------------|--------|--------------------------------------|
| `id`        | string | Unique member identifier (e.g., "m1") |
| `firstName` | string | Member's first name                  |
| `lastName`  | string | Member's last name                   |
| `email`     | string | Member's email address               |
| `status`    | string | "ACTIVE" or "INACTIVE"               |

## Events

### GET /api/events [v1]

Returns all events.

**Response:**
```json
{
  "events": [
    {
      "id": "e1",
      "title": "Welcome Hike",
      "category": "Outdoors",
      "startTime": "2025-06-01T09:00:00Z"
    },
    {
      "id": "e2",
      "title": "Wine Mixer",
      "category": "Social",
      "startTime": "2025-06-05T18:00:00Z"
    }
  ]
}
```

**Event fields:**

| Field       | Type   | Description                           |
|-------------|--------|---------------------------------------|
| `id`        | string | Unique event identifier (e.g., "e1")  |
| `title`     | string | Event title                           |
| `category`  | string | Event category (e.g., "Outdoors")     |
| `startTime` | string | ISO 8601 timestamp of event start     |

## Registrations

### GET /api/registrations [v1]

Returns all event registrations.

**Response:**
```json
{
  "registrations": [
    {
      "id": "r1",
      "memberId": "m1",
      "eventId": "e1",
      "status": "REGISTERED"
    },
    {
      "id": "r2",
      "memberId": "m2",
      "eventId": "e2",
      "status": "WAITLISTED"
    }
  ]
}
```

**Registration fields:**

| Field      | Type   | Description                                    |
|------------|--------|------------------------------------------------|
| `id`       | string | Unique registration identifier (e.g., "r1")    |
| `memberId` | string | References a member ID (e.g., "m1")            |
| `eventId`  | string | References an event ID (e.g., "e1")            |
| `status`   | string | "REGISTERED", "WAITLISTED", or "CANCELLED"     |

## Admin Endpoints

Admin endpoints power the admin dashboard and explorer pages. For UI documentation, see:

- [Admin Dashboard Overview](ADMIN_DASHBOARD_OVERVIEW.md) - Main dashboard with tiles, search, and activity
- [Admin Members UI](ADMIN_MEMBERS_UI.md) - Members explorer
- [Admin Events UI](ADMIN_EVENTS_UI.md) - Events explorer
- [Admin Registrations UI](ADMIN_REGISTRATIONS_UI.md) - Registrations explorer
- [Admin Activity Feed](ADMIN_ACTIVITY_UI.md) - Recent activity panel

### GET /api/admin/summary [v1]

Returns aggregate statistics for the admin dashboard summary tiles.

**Response:**
```json
{
  "summary": {
    "totalActiveMembers": 2,
    "totalEvents": 2,
    "totalRegistrations": 2,
    "totalWaitlistedRegistrations": 1
  }
}
```

**Summary fields:**

| Field                        | Type   | Description                        |
|------------------------------|--------|------------------------------------|
| `totalActiveMembers`         | number | Count of members with ACTIVE status |
| `totalEvents`                | number | Total number of events             |
| `totalRegistrations`         | number | Total number of registrations      |
| `totalWaitlistedRegistrations` | number | Registrations with WAITLISTED status |

### GET /api/admin/members [v1]

Returns a paginated list of all members with aggregated registration metrics.

**Query Parameters:**

| Parameter  | Type   | Default | Description                              |
|------------|--------|---------|------------------------------------------|
| `page`     | number | 1       | Page number (1-indexed)                  |
| `pageSize` | number | 20      | Items per page (max 100)                 |

**Response:**
```json
{
  "items": [
    {
      "id": "m1",
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "status": "ACTIVE",
      "phone": "+15551234567",
      "joinedAt": "2024-01-15T00:00:00Z",
      "registrationCount": 3,
      "waitlistedCount": 1
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalItems": 150,
  "totalPages": 8
}
```

**Pagination Fields:**

| Field        | Type   | Description                              |
|--------------|--------|------------------------------------------|
| `items`      | array  | Array of member objects                  |
| `page`       | number | Current page number                      |
| `pageSize`   | number | Items per page                           |
| `totalItems` | number | Total count of members                   |
| `totalPages` | number | Total number of pages                    |

**Member fields:**

| Field              | Type   | Description                              |
|--------------------|--------|------------------------------------------|
| `id`               | string | Unique member identifier (UUID)          |
| `name`             | string | Full name (first + last)                 |
| `email`            | string | Member email address                     |
| `status`           | string | Membership status code                   |
| `phone`            | string | Phone number (may be null)               |
| `joinedAt`         | string | ISO 8601 timestamp of membership start   |
| `registrationCount`| number | Total event registrations for member     |
| `waitlistedCount`  | number | Registrations with WAITLISTED status     |

### GET /api/admin/events [v1]

Returns a paginated list of all events with aggregated registration metrics.

**Query Parameters:**

| Parameter  | Type   | Default | Description                              |
|------------|--------|---------|------------------------------------------|
| `page`     | number | 1       | Page number (1-indexed)                  |
| `pageSize` | number | 20      | Items per page (max 100)                 |

**Response:**
```json
{
  "items": [
    {
      "id": "e1",
      "title": "Morning Hike at Rattlesnake Canyon",
      "category": "Outdoors",
      "startTime": "2025-06-10T08:00:00.000Z",
      "registrationCount": 2,
      "waitlistedCount": 1
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalItems": 10,
  "totalPages": 1
}
```

**Event fields:**

| Field              | Type   | Description                              |
|--------------------|--------|------------------------------------------|
| `id`               | string | Unique event identifier (UUID)           |
| `title`            | string | Event title                              |
| `category`         | string | Event category (e.g., "Outdoors", "Social") |
| `startTime`        | string | ISO 8601 timestamp of event start        |
| `registrationCount`| number | Total registrations for this event       |
| `waitlistedCount`  | number | Registrations with WAITLISTED status     |

### GET /api/v1/events [v1]

Returns a paginated list of published events with date range filtering.

**Query Parameters:**

| Parameter | Type   | Default | Description                              |
|-----------|--------|---------|------------------------------------------|
| `from`    | string | -       | Filter events starting on or after this date (ISO 8601) |
| `to`      | string | -       | Filter events starting on or before this date (ISO 8601) |
| `page`    | number | 1       | Page number (1-indexed)                  |
| `limit`   | number | 20      | Items per page                           |

**Response:**
```json
{
  "events": [
    {
      "id": "e1",
      "title": "Morning Hike at Rattlesnake Canyon",
      "description": "A moderate 5-mile hike with beautiful ocean views.",
      "category": "Outdoors",
      "location": "Rattlesnake Canyon Trailhead",
      "startTime": "2025-06-10T08:00:00.000Z",
      "endTime": "2025-06-10T12:00:00.000Z",
      "capacity": 15,
      "registeredCount": 1,
      "isWaitlistOpen": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 3,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

**Event fields (v1):**

| Field            | Type    | Description                              |
|------------------|---------|------------------------------------------|
| `id`             | string  | Unique event identifier (UUID)           |
| `title`          | string  | Event title                              |
| `description`    | string  | Event description                        |
| `category`       | string  | Event category                           |
| `location`       | string  | Event location                           |
| `startTime`      | string  | ISO 8601 timestamp of event start        |
| `endTime`        | string  | ISO 8601 timestamp of event end          |
| `capacity`       | number  | Maximum attendees                        |
| `registeredCount`| number  | Current registration count               |
| `isWaitlistOpen` | boolean | Whether waitlist is accepting entries    |

**Pagination fields (v1):**

| Field        | Type    | Description                              |
|--------------|---------|------------------------------------------|
| `page`       | number  | Current page number                      |
| `limit`      | number  | Items per page                           |
| `totalItems` | number  | Total count of events                    |
| `totalPages` | number  | Total number of pages                    |
| `hasNext`    | boolean | Whether next page exists                 |
| `hasPrev`    | boolean | Whether previous page exists             |

**Note:** Only published events are returned. Draft events are excluded

### GET /api/admin/events/[id] [v1]

Returns detailed information for a single event, including its registrations.

**Response structure:**

- **event** object: id, title, category, startTime
- **registrations** array: id, memberId, memberName, status, registeredAt

Returns 404 if the event ID is not found.

### POST /api/admin/events/[id]/duplicate [v1]

Creates a copy of an existing event with a new ID. Useful for recurring events.

**Request body (optional):**
```json
{
  "title": "Welcome Hike (June)",
  "startTime": "2025-07-01T09:00:00Z"
}
```

If not provided, the duplicated event uses the original title with " (Copy)" appended and no start time.

**Response:**
```json
{
  "event": {
    "id": "e3",
    "title": "Welcome Hike (Copy)",
    "category": "Outdoors",
    "startTime": null
  }
}
```

### PATCH /api/admin/events/[id]/cancel [v1]

Cancels an event. This is distinct from deleting; cancelled events remain in the system for record-keeping.

**Request body (optional):**
```json
{
  "reason": "Inclement weather",
  "notifyRegistrants": true
}
```

**Response:**
```json
{
  "event": {
    "id": "e1",
    "title": "Welcome Hike",
    "status": "CANCELLED",
    "cancelledAt": "2025-06-01T10:00:00Z",
    "cancelReason": "Inclement weather"
  }
}
```

**Side effects:**
- If `notifyRegistrants` is true (default), sends cancellation emails to all registrants
- All registrations for this event are marked as CANCELLED

### GET /api/admin/events/[id]/attendance [DEFERRED]

Returns attendance/check-in status for an event. Planned for future release.

---

### GET /api/admin/registrations [v1]

Returns a paginated list of all registrations with enriched member and event data.

**Query Parameters:**

| Parameter  | Type   | Default | Description                              |
|------------|--------|---------|------------------------------------------|
| `page`     | number | 1       | Page number (1-indexed)                  |
| `pageSize` | number | 20      | Items per page (max 100)                 |

**Response:**
```json
{
  "items": [
    {
      "id": "r1",
      "memberId": "m1",
      "memberName": "Alice Chen",
      "eventId": "e1",
      "eventTitle": "Morning Hike at Rattlesnake Canyon",
      "status": "CONFIRMED",
      "registeredAt": "2025-06-01T09:00:00.000Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalItems": 10,
  "totalPages": 1
}
```

**Registration fields:**

| Field         | Type   | Description                              |
|---------------|--------|------------------------------------------|
| `id`          | string | Unique registration identifier (UUID)    |
| `memberId`    | string | Reference to the member (UUID)           |
| `memberName`  | string | Full name of the member (resolved)       |
| `eventId`     | string | Reference to the event (UUID)            |
| `eventTitle`  | string | Title of the event (resolved)            |
| `status`      | string | PENDING, CONFIRMED, WAITLISTED, CANCELLED, NO_SHOW |
| `registeredAt`| string | ISO 8601 timestamp of registration       |

### GET /api/admin/registrations/pending [v1]

Returns registrations with WAITLISTED or PENDING status, useful for admin review queues.

**Response:**
```json
{
  "registrations": [
    {
      "id": "r2",
      "memberId": "m2",
      "memberName": "Bob Smith",
      "eventId": "e2",
      "eventTitle": "Wine Mixer",
      "status": "WAITLISTED",
      "registeredAt": "2025-05-21T10:00:00Z",
      "waitlistPosition": 1
    }
  ]
}
```

### GET /api/admin/registrations/[id] [v1]

Returns detailed information for a single registration, including related member and event data.

**Response structure:**

- **registration** object: id, status, registeredAt
- **member** object: id, name, email
- **event** object: id, title, category, startTime

Returns 404 if the registration ID is not found.

### POST /api/admin/registrations/[id]/promote [v1]

Promotes a waitlisted registration to confirmed status. Manual promotion only in v1.

**Request body (optional):**
```json
{
  "notify": true
}
```

**Response:**
```json
{
  "registration": {
    "id": "r2",
    "memberId": "m2",
    "eventId": "e2",
    "status": "REGISTERED",
    "promotedAt": "2025-06-01T12:00:00Z",
    "previousStatus": "WAITLISTED"
  }
}
```

**Side effects:**
- If `notify` is true (default), sends promotion confirmation email to member

**Error cases:**
- Returns `CONFLICT` if registration is not in WAITLISTED status
- Returns `CAPACITY_EXCEEDED` if event is at capacity (admin can override)

### POST /api/admin/registrations/[id]/transfer [DEFERRED]

Transfers a registration to a different member. Planned for future release.

---

### GET /api/admin/activity [v1]

Returns recent registration activity for the admin dashboard.

**Query parameters:**

| Parameter | Required | Description                                      |
|-----------|----------|--------------------------------------------------|
| `limit`   | No       | Maximum number of items to return (test use only)|

**Key fields:**

- `id` - Registration identifier
- `type` - Activity type (currently "REGISTRATION")
- `memberId` - Reference to the member
- `memberName` - Full name of the member
- `eventId` - Reference to the event
- `eventTitle` - Title of the event
- `status` - REGISTERED or WAITLISTED
- `registeredAt` - ISO 8601 timestamp of registration

Results are sorted by `registeredAt` descending (most recent first).

See also: [Admin Activity Feed](ADMIN_ACTIVITY_UI.md) for UI documentation.

### GET /api/admin/activity/search [v1]

Searches and filters the activity feed by member or event.

**Query parameters:**

| Parameter  | Required | Description                              |
|------------|----------|------------------------------------------|
| `memberId` | No       | Filter to activity for a specific member |
| `eventId`  | No       | Filter to activity for a specific event  |
| `q`        | No       | Text search across member names and event titles |

**Response structure:**

Same as `/api/admin/activity` - returns an `activity` array filtered by the specified criteria.

**Examples:**

- `/api/admin/activity/search?memberId=m1` - Activity for member m1 only
- `/api/admin/activity/search?eventId=e1` - Activity for event e1 only
- `/api/admin/activity/search?q=hike` - Activity matching "hike" in member or event

### GET /api/admin/search [v1]

Searches across members, events, and registrations.

**Query parameters:**

| Parameter | Required | Description                    |
|-----------|----------|--------------------------------|
| `q`       | Yes      | Search query string            |

**Example:** `GET /api/admin/search?q=alice`

**Response:**
```json
{
  "results": {
    "members": [
      {
        "id": "m1",
        "firstName": "Alice",
        "lastName": "Johnson",
        "email": "alice@example.com",
        "status": "ACTIVE"
      }
    ],
    "events": [],
    "registrations": [
      {
        "id": "r1",
        "memberId": "m1",
        "eventId": "e1",
        "status": "REGISTERED",
        "memberName": "Alice Johnson",
        "eventTitle": "Welcome Hike"
      }
    ]
  }
}
```

**Search behavior:**

- Members: Matches against full name or email (case-insensitive)
- Events: Matches against event title (case-insensitive)
- Registrations: Matches against member name or event title (case-insensitive)
- Registrations include enriched `memberName` and `eventTitle` fields

**Empty query response:**
```json
{
  "results": {
    "members": [],
    "events": [],
    "registrations": []
  }
}
```

### GET /api/admin/members/[id] [v1]

Returns detailed information about a specific member, including their event registrations.

**Path parameters:**

| Parameter | Description                    |
|-----------|--------------------------------|
| `id`      | Member ID (e.g., "m1")         |

**Example:** `GET /api/admin/members/m1`

**Response:**
```json
{
  "member": {
    "id": "m1",
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "status": "ACTIVE",
    "phone": "+15551234567",
    "joinedAt": "2024-01-15T00:00:00Z"
  },
  "registrations": [
    {
      "id": "r1",
      "eventId": "e1",
      "eventTitle": "Welcome Hike",
      "status": "REGISTERED",
      "registeredAt": "2025-05-20T14:30:00Z"
    }
  ]
}
```

**Member fields:**

| Field      | Type   | Description                              |
|------------|--------|------------------------------------------|
| `id`       | string | Unique member identifier                 |
| `name`     | string | Full name (first + last)                 |
| `email`    | string | Member email address                     |
| `status`   | string | "ACTIVE" or "INACTIVE"                   |
| `phone`    | string | Phone number (may be null)               |
| `joinedAt` | string | ISO 8601 timestamp of membership start   |

**Registration fields:**

| Field         | Type   | Description                              |
|---------------|--------|------------------------------------------|
| `id`          | string | Registration identifier                  |
| `eventId`     | string | Reference to event                       |
| `eventTitle`  | string | Human-readable event name                |
| `status`      | string | REGISTERED, WAITLISTED, or CANCELLED     |
| `registeredAt`| string | ISO 8601 timestamp of registration       |

**404 Response (member not found):**
```json
{
  "error": "Not found"
}
```

### GET /api/admin/members/[id]/history [v1]

Returns the activity history for a specific member (registrations, cancellations, status changes).

**Response:**
```json
{
  "memberId": "m1",
  "history": [
    {
      "type": "REGISTRATION",
      "eventId": "e1",
      "eventTitle": "Welcome Hike",
      "status": "REGISTERED",
      "timestamp": "2025-05-20T14:30:00Z"
    },
    {
      "type": "STATUS_CHANGE",
      "fromStatus": "PENDING",
      "toStatus": "ACTIVE",
      "timestamp": "2024-01-15T00:00:00Z"
    }
  ]
}
```

### PATCH /api/admin/members/[id]/status [v1]

Updates a member's status (ACTIVE, INACTIVE, SUSPENDED).

**Request body:**
```json
{
  "status": "INACTIVE",
  "reason": "Membership lapsed",
  "notify": true
}
```

**Response:**
```json
{
  "member": {
    "id": "m1",
    "name": "Alice Johnson",
    "status": "INACTIVE",
    "statusChangedAt": "2025-06-01T12:00:00Z",
    "previousStatus": "ACTIVE"
  }
}
```

**Side effects:**
- If `notify` is true (default), sends status change notification to member

### GET /api/admin/members/export [DEFERRED]

Exports member data in CSV or JSON format. Planned for future release.

---

## Mock Data Relationships

The mock data modules use consistent IDs that relate entities:

| Entity        | IDs Available | Notes                           |
|---------------|---------------|----------------------------------|
| Members       | m1, m2        | Both are ACTIVE                  |
| Events        | e1, e2        | Different categories             |
| Registrations | r1, r2        | Link members to events           |

**Relationships:**

- Registration `r1`: Member `m1` is REGISTERED for Event `e1`
- Registration `r2`: Member `m2` is WAITLISTED for Event `e2`

This structure allows testing of joins and lookups across the data model.
