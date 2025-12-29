# Murmurant API Reference

Internal API documentation for Murmurant endpoints.

Copyright (c) Santa Barbara Newcomers Club

---

## Overview

All API routes are located under `/api/v1/`. Authentication is required for most endpoints.

### Authentication

- **Session-based**: Cookie authentication via `murmurant_session` token
- **Capability-based authorization**: Endpoints check for specific capabilities

### Response Format

All responses are JSON with the following structure:

**Success:**
```json
{
  "data": { ... },
  "message": "Optional success message"
}
```

**Error:**
```json
{
  "error": "Error Type",
  "message": "Human-readable description"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (not logged in) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate, invalid state transition) |
| 500 | Internal Server Error |

---

## Member Endpoints

### GET /api/v1/members

List members with filtering and pagination.

**Capability Required:** `members:view`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by membership status code |
| search | string | Search by name or email |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20, max: 100) |

**Response:**
```json
{
  "members": [
    {
      "id": "uuid",
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane@example.com",
      "membershipStatus": { "code": "active", "label": "Active" }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

### GET /api/v1/members/{id}

Get member details.

**Capability Required:** `members:view`

**Response:**
```json
{
  "id": "uuid",
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "phone": "805-555-1234",
  "joinedAt": "2024-01-15T00:00:00Z",
  "membershipStatus": { "code": "active", "label": "Active" },
  "membershipTier": { "code": "member", "name": "Member" },
  "roleAssignments": [
    {
      "committee": { "name": "Social Committee" },
      "role": { "name": "Chair" },
      "term": { "name": "2024-2025" }
    }
  ]
}
```

### GET /api/v1/members/{id}/service-history

Get member's service history narrative.

**Capability Required:** `members:history`

**Response:**
```json
{
  "history": [
    {
      "id": "uuid",
      "serviceType": "COMMITTEE_CHAIR",
      "roleTitle": "Chair",
      "committeeName": "Social Committee",
      "termName": "2024-2025",
      "startAt": "2024-02-01T00:00:00Z",
      "endAt": null
    }
  ]
}
```

---

## Event Endpoints

### GET /api/v1/events

List events with filtering.

**Capability Required:** Public (published only) or `events:view` (all)

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by EventStatus |
| category | string | Filter by category |
| startAfter | date | Events starting after this date |
| startBefore | date | Events starting before this date |
| page | number | Page number |
| limit | number | Items per page |

**Response:**
```json
{
  "events": [
    {
      "id": "uuid",
      "title": "Holiday Party",
      "startTime": "2024-12-15T18:00:00Z",
      "endTime": "2024-12-15T21:00:00Z",
      "location": "Community Center",
      "status": "PUBLISHED",
      "capacity": 100,
      "registeredCount": 45
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 50 }
}
```

### GET /api/v1/events/{id}

Get event details.

**Response includes:** Full event details, ticket tiers, registration status

### POST /api/v1/events/{id}/status

Change event status (state machine transition).

**Capability Required:** `events:submit` (chairs) or `events:approve` (VP)

**Request:**
```json
{
  "action": "submit" | "approve" | "request_changes" | "publish" | "cancel",
  "note": "Optional reason for the action"
}
```

**Response:**
```json
{
  "event": { "id": "uuid", "status": "PENDING_APPROVAL" },
  "message": "Event submitted for approval"
}
```

### POST /api/v1/events/{id}/register

Register current user for an event.

**Request:**
```json
{
  "ticketTierId": "uuid",
  "guestCount": 0
}
```

### DELETE /api/v1/events/{id}/register

Cancel registration for current user.

---

## Event Notes & Postmortem

### GET /api/v1/events/{id}/notes

Get event notes (Chair Notebook).

**Capability Required:** Event chair or `events:edit`

### POST /api/v1/events/{id}/notes

Add a note to an event.

**Request:**
```json
{
  "noteType": "PLANNING" | "VENUE" | "WRAP_UP" | "LESSON" | "HANDOFF",
  "content": "Note content in markdown",
  "isPrivate": false
}
```

### GET /api/v1/events/{id}/postmortem

Get event postmortem.

### POST /api/v1/events/{id}/postmortem

Create/update postmortem.

**Request:**
```json
{
  "setupNotes": "Setup instructions...",
  "contactsUsed": "Vendor contacts...",
  "attendanceRating": 4,
  "logisticsRating": 5,
  "whatWorked": "Great turnout...",
  "whatDidNot": "Parking issues...",
  "whatToChangeNextTime": "Reserve more parking..."
}
```

### POST /api/v1/events/{id}/postmortem/status

Change postmortem status.

**Request:**
```json
{
  "action": "submit" | "approve" | "return" | "unlock"
}
```

---

## Officer Dashboard Endpoints

### GET /api/v1/officer/activities/dashboard

VP Activities dashboard data (events pending approval, etc.).

**Capability Required:** `events:approve`

### GET /api/v1/officer/communications/dashboard

VP Communications dashboard data.

**Capability Required:** `events:schedule:view`

**Response:**
```json
{
  "visible": true,
  "eventsOpeningThisWeek": [...],
  "newlyAnnouncedEvents": [...],
  "eventsFillingFast": [...],
  "newMembers": [...],
  "membersCompletingThisMonth": [...],
  "enewsDrafts": [...],
  "stats": {
    "totalEventsThisWeek": 5,
    "totalNewMembers": 12,
    "totalAtRisk": 3,
    "upcomingEvents": 25
  }
}
```

### GET /api/v1/officer/secretary/dashboard

Secretary dashboard (meetings, minutes, motions).

**Capability Required:** `meetings:read`

### GET /api/v1/officer/parliamentarian/dashboard

Parliamentarian dashboard (annotations, flags, interpretations).

**Capability Required:** `governance:annotations:read`

---

## Support Case Endpoints

### GET /api/v1/support/cases

List support cases.

**Capability Required:** `admin:full`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by SupportCaseStatus |
| category | string | Filter by SupportCaseCategory |

### POST /api/v1/support/cases

Create a new support case.

**Request:**
```json
{
  "submitterName": "Jane Doe",
  "submitterEmail": "jane@example.com",
  "channel": "EMAIL",
  "description": "Issue description..."
}
```

### GET /api/v1/support/cases/{id}

Get support case details with notes.

### PATCH /api/v1/support/cases/{id}

Update support case.

**Request:**
```json
{
  "status": "IN_PROGRESS",
  "category": "BUG",
  "note": "Starting investigation..."
}
```

### POST /api/v1/support/cases/{id}/notes

Add a note to a support case.

**Request:**
```json
{
  "noteType": "internal" | "status_change" | "clarification_sent" | "response_sent",
  "content": "Note content..."
}
```

### GET /api/v1/support/dashboard

Support case dashboard statistics.

**Capability Required:** `admin:full`

---

## Governance Endpoints

### GET /api/v1/governance/meetings

List governance meetings.

### GET /api/v1/governance/meetings/{id}

Get meeting details with minutes and motions.

### POST /api/v1/governance/meetings/{id}/minutes

Create or update meeting minutes.

### POST /api/v1/governance/meetings/{id}/minutes/status

Change minutes status (submit, approve, publish).

### GET /api/v1/governance/annotations

List governance annotations.

### POST /api/v1/governance/annotations

Create an annotation.

### GET /api/v1/governance/flags

List governance review flags.

### POST /api/v1/governance/flags

Create a review flag.

---

## Me Endpoints (Current User)

### GET /api/v1/me

Get current user profile.

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "memberId": "uuid",
  "globalRole": "member",
  "member": {
    "firstName": "Jane",
    "lastName": "Doe"
  }
}
```

### GET /api/v1/me/registrations

Get current user's event registrations.

### GET /api/v1/me/profile

Get member profile with editable fields.

### PATCH /api/v1/me/profile

Update member profile.

---

## Authentication Endpoints

### POST /api/v1/auth/passkey/register/options

Get WebAuthn registration options.

### POST /api/v1/auth/passkey/register/verify

Verify and complete passkey registration.

### POST /api/v1/auth/passkey/login/options

Get WebAuthn authentication options.

### POST /api/v1/auth/passkey/login/verify

Verify passkey and create session.

### POST /api/v1/auth/magic-link/send

Send magic link email for passwordless login.

### POST /api/v1/auth/magic-link/verify

Verify magic link token and create session.

### POST /api/v1/auth/logout

End current session.

---

## Admin Endpoints

### POST /api/v1/admin/events/{id}/duplicate

Clone an event.

**Capability Required:** `events:edit`

**Response:** New event in DRAFT status with placeholder dates.

### GET /api/v1/admin/impersonate/{memberId}

Start impersonation session.

**Capability Required:** `admin:full`

### DELETE /api/v1/admin/impersonate

End impersonation session.

---

## Webhook Endpoints

### POST /api/v1/webhooks/email

Receive email provider webhooks (bounces, complaints).

**Header:** `X-Webhook-Secret: {secret}`

### POST /api/v1/webhooks/payment

Receive payment provider webhooks.

**Header:** `Stripe-Signature: {signature}`

---

## Capability Reference

| Capability | Description |
|------------|-------------|
| `publishing:manage` | Pages, themes, templates |
| `comms:manage` | Email templates, audiences |
| `comms:send` | Send email campaigns |
| `members:view` | View member details |
| `members:history` | View service history |
| `events:view` | View all events |
| `events:edit` | Edit events |
| `events:approve` | Approve events (VP Activities) |
| `events:submit` | Submit for approval |
| `events:schedule:view` | View event schedule (VP Comms) |
| `events:enews:edit` | Edit eNews blurbs |
| `finance:view` | View financial data |
| `finance:manage` | Manage financial data |
| `users:manage` | Manage user accounts |
| `admin:full` | Full admin access |
| `meetings:read` | View meetings |
| `governance:annotations:read` | View annotations |
| `governance:annotations:write` | Create annotations |
| `governance:flags:read` | View flags |
| `governance:flags:write` | Create flags |

---

## Rate Limiting

- **Default:** 100 requests per minute per IP
- **Authenticated:** 300 requests per minute per user
- **Webhooks:** 1000 requests per minute

**Headers returned:**
- `X-RateLimit-Limit`: Requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

---

## Changelog

### v1 (Current)
- Initial API version
- All endpoints documented above

---

Last updated: December 2025
