# Magic Link Authentication - Implementation Guide

Murmurant uses email-based magic link authentication with server-side DB-backed sessions.

## Overview

Magic link authentication provides a passwordless login experience:

1. User enters their email on the login page
2. System sends a single-use magic link to that email
3. User clicks the link and is authenticated
4. A secure session is created with cookie-based authentication

## Security Architecture

### Charter Compliance

- **P1 (Provable Identity)**: Identity verified via email ownership
- **P7 (Observability)**: All auth events are audited
- **P9 (Fail Closed)**: Invalid tokens are rejected without information leakage

### Token Security

- **256-bit entropy**: Tokens generated with `crypto.randomBytes(32)`
- **scrypt hashing**: Tokens stored as hashes with per-token 128-bit salt
- **Constant-time comparison**: `timingSafeEqual` prevents timing attacks
- **Single-use tokens**: Marked as used atomically on verification

### Session Security

- **DB-backed sessions**: Sessions stored in PostgreSQL, not in-memory
- **Cookie settings**:
  - `httpOnly: true` - Prevents XSS token theft
  - `secure: true` (production) - HTTPS only
  - `sameSite: 'lax'` - CSRF protection
  - `path: '/'` - Site-wide scope
  - `__Host-` prefix (production) - Additional cookie security
- **Session lifecycle**:
  - 30-day max lifetime
  - 24-hour idle timeout
  - Cookie rotation on each login
  - Revocation support with audit trail

### No Account Enumeration

The `/api/auth/request-link` endpoint always returns `200 OK` with a generic message, regardless of whether the email exists in the system. This prevents attackers from discovering valid email addresses.

## API Endpoints

### POST /api/auth/request-link

Request a magic link.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (always 200):**
```json
{
  "ok": true,
  "message": "If this email is registered, you will receive a sign-in link shortly."
}
```

**Rate Limiting:**
- 3 requests per minute per email
- 6 requests per minute per IP

### GET /auth/verify

Verify magic link token (Next.js page).

**Query Parameters:**
- `token`: The magic link token from the email

**Behavior:**
- Valid token: Creates session, sets cookie, redirects to `/` or `/admin`
- Invalid/expired token: Shows error page with "Request New Link" option

### POST /api/auth/logout

End the current session.

**Response:**
```json
{
  "ok": true
}
```

### GET /api/auth/me

Get current user information.

**Response (authenticated):**
```json
{
  "authenticated": true,
  "user": {
    "userAccountId": "uuid",
    "memberId": "uuid",
    "email": "user@example.com",
    "globalRole": "member"
  },
  "capabilities": ["events:view", "members:view:self", ...]
}
```

**Response (unauthenticated):**
```json
{
  "authenticated": false,
  "error": "Not authenticated"
}
```

## Code Structure

```
src/lib/auth/
├── index.ts         # Re-exports for clean imports
├── tokens.ts        # Token generation and scrypt hashing
├── cookies.ts       # Cookie configuration and __Host- prefix
├── session.ts       # DB-backed session management
└── audit.ts         # Auth-specific audit logging

src/app/
├── api/auth/
│   ├── request-link/route.ts  # Magic link request
│   ├── logout/route.ts        # Logout endpoint
│   └── me/route.ts            # Current user info
└── auth/
    └── verify/page.tsx        # Magic link verification page
```

## Environment Variables

Required environment variables for magic link auth:

```bash
# Admin email - this user gets admin role on first login
ADMIN_EMAIL=admin@yourclub.org

# Database connection (required for session storage)
DATABASE_URL=postgresql://user:pass@host:5432/murmurant
```

## Database Schema

### Session Model

```prisma
model Session {
  id             String    @id @default(uuid()) @db.Uuid
  tokenHash      String    @unique  // scrypt hash of session token
  userAccountId  String    @db.Uuid
  email          String
  globalRole     String
  ipAddress      String?
  userAgent      String?
  expiresAt      DateTime
  lastActivityAt DateTime  @default(now())
  createdAt      DateTime  @default(now())
  revokedAt      DateTime?
  revokedById    String?   @db.Uuid
  revokedReason  String?
}
```

### AuditAction Enum

Auth-related audit actions:
- `LOGIN` - Successful authentication
- `LOGOUT` - User logout
- `SESSION_REVOKED` - Admin revoked session
- `EMAIL_LINK_SENT` - Magic link email sent
- `EMAIL_LINK_USED` - Magic link token consumed

## Testing

### Unit Tests

```bash
# Run auth unit tests
npx vitest run tests/unit/auth/
```

Tests cover:
- Token generation entropy (256 bits)
- scrypt hashing with per-token salt
- Constant-time token verification
- Cookie configuration security
- `__Host-` prefix requirements

### API Integration Tests

```bash
# Run auth API tests (requires server)
npx playwright test tests/api/auth-endpoints.spec.ts
```

Tests cover:
- No account enumeration
- Rate limiting behavior
- Error handling
- Session cookie properties

### E2E Tests

```bash
# Run auth E2E tests
npx playwright test tests/e2e/auth-capability-access.spec.ts
```

Tests cover:
- Unauthenticated access denial
- Magic link flow UI
- Session cookie httpOnly behavior
- Logout flow

## Development Notes

### Local Development

In development mode:
- Cookie name: `murmurant_session` (no `__Host-` prefix)
- `secure: false` (allows http://localhost)
- Magic link URLs are logged to console (not sent via email)

### Production

In production mode:
- Cookie name: `__Host-murmurant_session`
- `secure: true` (HTTPS required)
- Magic links sent via configured email service

### Session Cleanup

Expired sessions should be cleaned up periodically:

```typescript
import { cleanupExpiredSessions } from "@/lib/auth/session";

// Run via cron job
await cleanupExpiredSessions(); // Removes sessions expired > 30 days
```

## Troubleshooting

### "Invalid or Expired Link" Error

- Token is single-use (already used)
- Token has expired (30-minute lifetime)
- Token was malformed or tampered with

### Session Not Persisting

- Verify database connection is working
- Check that cookies are being set (inspect Network tab)
- In production, ensure HTTPS is configured

### Rate Limited

- Wait 1 minute before retrying
- Contact admin if you believe this is in error

## Migration from In-Memory Sessions

The previous implementation used in-memory sessions (`@/lib/passkey/session`). The new DB-backed sessions provide:

1. **Persistence**: Sessions survive server restarts
2. **Scalability**: Works with multiple server instances
3. **Auditability**: Full session lifecycle is logged
4. **Revocation**: Admins can revoke specific sessions
