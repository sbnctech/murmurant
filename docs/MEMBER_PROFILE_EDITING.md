# Member Profile Editing

## Overview

Members can view and edit their profile information from the "My SBNC" dashboard via `/my/profile`.

## User Flow

1. Member navigates to `/my` (My SBNC dashboard)
2. Clicks "Edit" or "View & Edit Profile" on the MyProfileCard
3. Views and edits their profile at `/my/profile`
4. Saves changes with immediate feedback

## Editable Fields

The following fields can be edited by members:

| Field | Validation | Notes |
|-------|------------|-------|
| First Name | Required, 1-100 chars, trimmed | |
| Last Name | Required, 1-100 chars, trimmed | |
| Phone | Optional, max 20 chars, trimmed | Can be cleared |

## Read-Only Fields

These fields are displayed but cannot be edited by members:

| Field | Reason |
|-------|--------|
| Email | Requires admin verification to change |
| Membership Status | Managed by club officers |
| Membership Tier | Determined by membership rules |
| Member Since | Historical record |

## Security

- **Authentication**: Requires valid session cookie
- **Authorization**: Members can only access their own profile (object-scoped)
- **Field Allowlist**: Server-side allowlist prevents mass assignment attacks
- **Audit Logging**: All profile updates are logged via `auditUpdate()`

## API Endpoints

### GET /api/v1/me/profile

Returns the authenticated member's profile.

**Response:**
```json
{
  "profile": {
    "id": "...",
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane@example.com",
    "phone": "555-1234",
    "joinedAt": "2022-03-15T00:00:00.000Z",
    "memberSince": "2022",
    "membershipStatus": { "code": "ACTIVE", "label": "Active Member" },
    "membershipTier": { "code": "newbie_member", "name": "Newbie Member" },
    "updatedAt": "2024-01-10T12:00:00.000Z"
  }
}
```

### PATCH /api/v1/me/profile

Updates the authenticated member's profile.

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "555-9876"
}
```

**Response:** Same as GET

## UX States

| State | Behavior |
|-------|----------|
| Loading | Skeleton form displayed |
| Error (load failed) | Error message with back link |
| Error (save failed) | Inline error message, form remains editable |
| Success | Green success banner, auto-dismisses after 3s |

## Key Files

- `/src/app/my/profile/page.tsx` - Profile edit page (client component)
- `/src/app/api/v1/me/profile/route.ts` - API endpoints
- `/src/lib/profile/index.ts` - Types, validation, utilities
- `/src/components/home/MyProfileCard.tsx` - Profile summary card
- `/tests/unit/profile/profile.spec.ts` - Unit tests

## Charter Compliance

- **P1**: Identity established via session cookie
- **P2**: Object-scoped access (own profile only)
- **P7**: All mutations audit-logged
- **P9**: Fail closed on invalid auth
