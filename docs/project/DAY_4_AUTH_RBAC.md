# Day 4: Authentication and Role-Based Access Control

This document describes the authentication and authorization system implemented for ClubOS admin APIs.

## Overview

ClubOS uses a simple header-based authentication system suitable for local development. Admin endpoints require a valid Bearer token with the ADMIN role.

## Authentication Flow

1. Client sends request with `Authorization: Bearer <token>` header
2. Server validates token against `UserAccount.apiToken` field
3. If valid, checks user's role for authorization
4. Returns appropriate response (200, 401, or 403)

## Token Format

```
Authorization: Bearer <token>
```

## Dev Tokens (Local Testing Only)

These tokens are created by the seed script and should NEVER be used in production:

| User | Email | Role | Token |
|------|-------|------|-------|
| Alice Chen | alice@example.com | ADMIN | `dev-admin-token-alice-12345` |
| Carol Johnson | carol@example.com | MEMBER | `dev-member-token-carol-67890` |

To get tokens, run:
```bash
npm run db:seed
```

## Error Responses

All error responses use a consistent JSON shape:

```json
{
  "error": {
    "code": "UNAUTHORIZED|FORBIDDEN",
    "message": "Human-readable error description"
  }
}
```

### 401 Unauthorized

Missing or invalid authentication token.

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing Authorization header"
  }
}
```

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid token"
  }
}
```

### 403 Forbidden

Valid token but insufficient permissions.

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin access required"
  }
}
```

## Protected Endpoints

All `/api/admin/*` endpoints require admin authentication:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/members` | GET | List all members |
| `/api/admin/members/[id]` | GET | Get member details |
| `/api/admin/events` | GET | List all events |
| `/api/admin/events/[id]` | GET | Get event details |
| `/api/admin/registrations` | GET | List all registrations |
| `/api/admin/registrations/[id]` | GET | Get registration details |
| `/api/admin/registrations/search` | GET | Search registrations |
| `/api/admin/activity` | GET | Get activity feed |
| `/api/admin/dashboard` | GET | Get dashboard summary |
| `/api/admin/search` | GET | Global search |
| `/api/admin/summary` | GET | Get admin summary |
| `/api/admin/export/members` | GET | Export members CSV |
| `/api/admin/export/events` | GET | Export events CSV |
| `/api/admin/export/activity` | GET | Export activity CSV |
| `/api/admin/export/registrations` | GET | Export registrations CSV |

## Public Endpoints

These endpoints do not require authentication:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/v1/health` | GET | Health check (v1) |
| `/api/v1/events` | GET | List published events |
| `/api/v1/events/[id]` | GET | Get event details |

## Frontend Integration

### Example: Fetching Admin Data

```typescript
const ADMIN_TOKEN = "dev-admin-token-alice-12345";

const response = await fetch("/api/admin/members", {
  headers: {
    "Authorization": `Bearer ${ADMIN_TOKEN}`,
  },
});

if (response.status === 401) {
  // Redirect to login
}

if (response.status === 403) {
  // Show "access denied" message
}

const data = await response.json();
```

### Example: Handling Auth Errors

```typescript
async function fetchWithAuth(url: string, token: string) {
  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    throw new Error("Authentication required");
  }

  if (response.status === 403) {
    throw new Error("Admin access required");
  }

  return response.json();
}
```

## Implementation Details

### Auth Library (`src/lib/auth.ts`)

- `parseBearerToken(req)` - Extract token from Authorization header
- `requireAuth(req)` - Require any valid token (returns user or 401)
- `requireAdmin(req)` - Require admin role (returns user or 401/403)
- `unauthorized(message)` - Create 401 response
- `forbidden(message)` - Create 403 response

### Database Schema

```prisma
enum UserRole {
  MEMBER
  ADMIN
}

model UserAccount {
  apiToken  String?   @unique
  role      UserRole  @default(MEMBER)
  // ... other fields
}
```

## Testing

### Environment Variables for Tests

You can configure tokens via environment variables:

```bash
export ADMIN_API_TOKEN="dev-admin-token-alice-12345"
export MEMBER_API_TOKEN="dev-member-token-carol-67890"
```

If not set, tests use the default seed tokens.

### Run RBAC Tests

```bash
npx playwright test tests/api/admin-auth-rbac.spec.ts
```

Tests cover:
- 401 without Authorization header
- 403 with member token
- 200 with admin token
- Invalid token handling
- Malformed Authorization header
