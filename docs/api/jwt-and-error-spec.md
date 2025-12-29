# Murmurant JWT and Error Response Specification

This document defines the authentication token structure and standardized error response format for all Murmurant API endpoints.

---

## JWT Specification

### Overview

Murmurant uses JSON Web Tokens (JWT) for API authentication. Tokens are issued by the authentication service and must be included in all authenticated requests.

### Token Transport

Include the JWT in the `Authorization` header using the Bearer scheme:

```
Authorization: Bearer <token>
```

### Access Token Claims

| Claim       | Type   | Required | Description                                         |
|-------------|--------|----------|-----------------------------------------------------|
| `sub`       | string | Yes      | Subject - auth provider user identifier             |
| `iat`       | number | Yes      | Issued At - Unix timestamp (seconds)                |
| `exp`       | number | Yes      | Expiration - Unix timestamp (seconds)               |
| `aud`       | string | Yes      | Audience - must be "murmurant-api"                     |
| `iss`       | string | Yes      | Issuer - auth service identifier                    |
| `globalRole`| string | Yes      | User role: "member" or "admin"                      |
| `memberId`  | string | No       | Murmurant member record ID (null if not linked)        |
| `profile`   | object | No       | Cached user display information                     |
| `sessionId` | string | No       | Session identifier for revocation support           |

### Profile Object

When present, the `profile` claim contains:

| Field       | Type   | Description                    |
|-------------|--------|--------------------------------|
| `firstName` | string | User's first name              |
| `lastName`  | string | User's last name               |
| `email`     | string | User's email address           |

### Example Access Token (Decoded)

**Member Token:**

```json
{
  "sub": "auth0|abc123def456",
  "iat": 1702300000,
  "exp": 1702303600,
  "aud": "murmurant-api",
  "iss": "https://auth.murmurant.example",
  "globalRole": "member",
  "memberId": "m-uuid-12345",
  "profile": {
    "firstName": "Alice",
    "lastName": "Johnson",
    "email": "alice@example.com"
  },
  "sessionId": "sess-uuid-67890"
}
```

**Admin Token:**

```json
{
  "sub": "auth0|xyz789ghi012",
  "iat": 1702300000,
  "exp": 1702303600,
  "aud": "murmurant-api",
  "iss": "https://auth.murmurant.example",
  "globalRole": "admin",
  "memberId": "m-uuid-54321",
  "profile": {
    "firstName": "Carol",
    "lastName": "Admin",
    "email": "carol@murmurant.example"
  },
  "sessionId": "sess-uuid-11111"
}
```

### Token Lifetimes

| Token Type    | Lifetime | Notes                                    |
|---------------|----------|------------------------------------------|
| Access Token  | 1 hour   | Short-lived, used for API requests       |
| Refresh Token | 7 days   | Used to obtain new access tokens         |

### Refresh Token Strategy

Murmurant uses a **rotating refresh token** strategy:

1. **Initial Login**: User authenticates and receives both access and refresh tokens.

2. **Token Refresh**: When the access token expires, the client sends the refresh token to obtain a new pair:
   ```
   POST /api/auth/refresh
   Content-Type: application/json

   {
     "refreshToken": "<current-refresh-token>"
   }
   ```

3. **Response**:
   ```json
   {
     "accessToken": "<new-access-token>",
     "refreshToken": "<new-refresh-token>",
     "expiresIn": 3600
   }
   ```

4. **Token Rotation**: Each refresh request invalidates the old refresh token and issues a new one. This limits the window for token theft.

5. **Refresh Token Storage**: Refresh tokens are stored server-side with:
   - `tokenHash` - SHA-256 hash of the token
   - `userId` - Associated user
   - `sessionId` - Links to the session
   - `expiresAt` - Expiration timestamp
   - `revokedAt` - Null unless explicitly revoked

6. **Revocation**: Calling `POST /api/auth/logout` invalidates all tokens for the session.

### Token Validation Rules

When validating an access token, the API must verify:

1. **Signature** - Token is signed by a trusted issuer
2. **Expiration** - `exp` is in the future
3. **Audience** - `aud` equals "murmurant-api"
4. **Issuer** - `iss` matches expected auth service
5. **Session** - `sessionId` is not revoked (if revocation checking is enabled)

### Permission Resolution

The JWT provides baseline authorization via `globalRole`:

- **member**: Can access member-facing endpoints, view own data
- **admin**: Can access all admin endpoints

Fine-grained permissions (e.g., "can edit this specific event") are resolved by querying the `RoleAssignment` table at runtime, not stored in the JWT.

---

## Error Response Specification

### Standard Error Body

All API errors return a consistent JSON structure:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error description",
  "details": {
    "field": "value",
    "requestId": "req-uuid-12345"
  }
}
```

### Error Body Fields

| Field     | Type   | Required | Description                                      |
|-----------|--------|----------|--------------------------------------------------|
| `code`    | string | Yes      | Machine-readable error code (UPPER_SNAKE_CASE)   |
| `message` | string | Yes      | Human-readable description for developers        |
| `details` | object | No       | Additional context about the error               |

### Standard Error Codes

| Code                | HTTP Status | When to Use                                        |
|---------------------|-------------|----------------------------------------------------|
| `VALIDATION_ERROR`  | 400         | Request body or query params fail validation       |
| `UNAUTHORIZED`      | 401         | No token provided or token is invalid/expired      |
| `FORBIDDEN`         | 403         | Valid token but user lacks required permission     |
| `RESOURCE_NOT_FOUND`| 404         | Requested entity does not exist                    |
| `METHOD_NOT_ALLOWED`| 405         | HTTP method not supported for this endpoint        |
| `CONFLICT`          | 409         | Action conflicts with current state                |
| `CAPACITY_EXCEEDED` | 422         | Event is full, cannot add more registrations       |
| `RATE_LIMITED`      | 429         | Too many requests, try again later                 |
| `INTERNAL_ERROR`    | 500         | Unexpected server error                            |
| `SERVICE_UNAVAILABLE`| 503        | Dependent service is down                          |

### Error Response Examples

**Validation Error (400):**

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "details": {
    "fields": {
      "email": "Invalid email format",
      "startTime": "Must be a future date"
    },
    "requestId": "req-abc123"
  }
}
```

**Unauthorized (401):**

```json
{
  "code": "UNAUTHORIZED",
  "message": "Access token is missing or invalid",
  "details": {
    "reason": "token_expired",
    "requestId": "req-def456"
  }
}
```

**Forbidden (403):**

```json
{
  "code": "FORBIDDEN",
  "message": "You do not have permission to perform this action",
  "details": {
    "requiredRole": "admin",
    "currentRole": "member",
    "requestId": "req-ghi789"
  }
}
```

**Resource Not Found (404):**

```json
{
  "code": "RESOURCE_NOT_FOUND",
  "message": "Member with ID m-12345 not found",
  "details": {
    "resourceType": "member",
    "resourceId": "m-12345",
    "requestId": "req-jkl012"
  }
}
```

**Conflict (409):**

```json
{
  "code": "CONFLICT",
  "message": "Member is already registered for this event",
  "details": {
    "existingRegistrationId": "r-99999",
    "requestId": "req-mno345"
  }
}
```

**Capacity Exceeded (422):**

```json
{
  "code": "CAPACITY_EXCEEDED",
  "message": "Event has reached maximum capacity",
  "details": {
    "eventId": "e-12345",
    "currentCount": 50,
    "maxCapacity": 50,
    "waitlistAvailable": true,
    "requestId": "req-pqr678"
  }
}
```

**Rate Limited (429):**

```json
{
  "code": "RATE_LIMITED",
  "message": "Too many requests. Please try again later.",
  "details": {
    "retryAfter": 60,
    "limit": 100,
    "window": "1 minute",
    "requestId": "req-stu901"
  }
}
```

**Internal Error (500):**

```json
{
  "code": "INTERNAL_ERROR",
  "message": "An unexpected error occurred",
  "details": {
    "requestId": "req-vwx234"
  }
}
```

### Request ID

Every error response should include a `requestId` in the details object. This ID:

- Is generated at the start of each request
- Is included in server logs
- Helps support teams trace issues
- Should be displayed to users for support reference

### Error Handling Guidelines

1. **Never expose stack traces** in production error responses
2. **Always include requestId** for traceability
3. **Use specific error codes** when possible (not just INTERNAL_ERROR)
4. **Keep messages actionable** - tell the user what they can do
5. **Log detailed context server-side** even when returning minimal client info

---

## TypeScript Type Definitions

For implementation reference, see:

- `src/server/auth/jwtTypes.ts` - JWT claim interfaces
- `src/server/api/errors.ts` - Error response types and helpers
