# Passkey Authentication Implementation

Murmurant supports passwordless authentication using WebAuthn/FIDO2 passkeys. This document describes the implementation, configuration, and usage.

## Overview

Passkeys provide phishing-resistant, passwordless authentication using public-key cryptography. Users can authenticate using:

- **Platform authenticators**: Touch ID, Face ID, Windows Hello
- **Security keys**: YubiKey, Titan Security Key
- **Password managers**: 1Password, Dashlane (with passkey support)

## Architecture

### Components

1. **Passkey Service** (`src/lib/passkey/service.ts`)
   - Registration ceremony (begin/finish)
   - Authentication ceremony (begin/finish)
   - Credential management (list, revoke)

2. **Session Service** (`src/lib/passkey/session.ts`)
   - HttpOnly cookie-based sessions
   - Idle timeout (24 hours)
   - Max lifetime (7 days)

3. **Magic Link Service** (`src/lib/passkey/magicLink.ts`)
   - Fallback authentication via email
   - Single-use tokens with 15-minute expiry

4. **Configuration** (`src/lib/passkey/config.ts`)
   - rpID and origin validation
   - Environment-based configuration

### Database Models

```prisma
model PasskeyCredential {
  id            String    @id @default(uuid())
  userAccountId String
  credentialId  String    @unique
  publicKey     String
  counter       BigInt    @default(0)
  transports    String[]
  deviceName    String?
  aaguid        String?
  isRevoked     Boolean   @default(false)
  revokedAt     DateTime?
  revokedById   String?
  revokedReason String?
  lastUsedAt    DateTime?
  createdAt     DateTime  @default(now())
}

model AuthChallenge {
  id            String   @id @default(uuid())
  challenge     String   @unique
  type          String   // "registration" | "authentication"
  userAccountId String?
  email         String?
  ipAddress     String?
  expiresAt     DateTime
  usedAt        DateTime?
  createdAt     DateTime @default(now())
}
```

## API Endpoints

### Passkey Registration

**POST /api/v1/auth/passkey/register/begin**
- Requires: Authenticated session
- Returns: WebAuthn registration options + challengeId

**POST /api/v1/auth/passkey/register/finish**
- Requires: Authenticated session
- Body: `{ challengeId, response, deviceName? }`
- Returns: `{ success, credentialId, deviceName }`

### Passkey Authentication

**POST /api/v1/auth/passkey/login/begin**
- Body: `{ email? }` (optional for discoverable credentials)
- Returns: WebAuthn authentication options + challengeId

**POST /api/v1/auth/passkey/login/finish**
- Body: `{ challengeId, response }`
- Returns: `{ success, email }` + Sets session cookie

### Magic Link (Fallback)

**POST /api/v1/auth/magic-link/send**
- Body: `{ email }`
- Returns: `{ success, message }`
- Side effect: Sends email with magic link

**POST /api/v1/auth/magic-link/verify**
- Body: `{ token }`
- Returns: `{ success, email }` + Sets session cookie

### Passkey Management (User)

**GET /api/v1/me/passkeys**
- Requires: Authenticated session
- Returns: List of user's passkeys

**DELETE /api/v1/me/passkeys**
- Requires: Authenticated session
- Body: `{ passkeyId, reason? }`
- Returns: 204 No Content

### Passkey Management (Admin)

**GET /api/v1/admin/users/:id/passkeys**
- Requires: `users:manage` capability
- Returns: List of user's passkeys with user info

**DELETE /api/v1/admin/users/:id/passkeys**
- Requires: `users:manage` capability
- Body: `{ passkeyId, reason }` (reason must be >=10 characters)
- Returns: 204 No Content

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PASSKEY_RP_ID` | Relying party ID (domain) | Production | `localhost` |
| `PASSKEY_ORIGIN` | Expected origin URL | Production | `http://localhost:3000` |
| `PASSKEY_RP_NAME` | Display name for authenticator prompts | No | `Murmurant` |

### Example Configuration

**Development:**
```bash
# Not required - defaults work for localhost
```

**Production:**
```bash
PASSKEY_RP_ID=sbnc.club
PASSKEY_ORIGIN=https://sbnc.club
PASSKEY_RP_NAME="Santa Barbara Newcomers Club"
```

## Security Considerations

### WebAuthn Security

- **Server-side verification**: All credential verification happens on the server
- **Challenge validation**: Challenges are single-use with 5-minute expiry
- **Signature counter**: Validated to detect cloned authenticators
- **Origin/rpID binding**: Credentials are cryptographically bound to the domain

### Session Security

- **HttpOnly cookies**: Session tokens are not accessible to JavaScript
- **Secure flag**: Enabled in production (requires HTTPS)
- **SameSite=Lax**: Prevents CSRF while allowing top-level navigation
- **Idle timeout**: 24 hours without activity
- **Max lifetime**: 7 days absolute

### Audit Logging

All passkey events are audit-logged:

- `PASSKEY_REGISTERED`: New passkey added
- `PASSKEY_USED`: Successful login
- `PASSKEY_REVOKED`: Passkey revoked (includes reason)
- `PASSKEY_LOGIN_FAILED`: Failed authentication attempt
- `EMAIL_LINK_SENT`: Magic link sent
- `EMAIL_LINK_USED`: Magic link used for login

## Usage Examples

### Client-Side Registration (Browser)

```typescript
import { startRegistration } from "@simplewebauthn/browser";

// 1. Begin registration
const beginRes = await fetch("/api/v1/auth/passkey/register/begin", {
  method: "POST",
  credentials: "include",
});
const { options, challengeId } = await beginRes.json();

// 2. Create credential
const credential = await startRegistration(options);

// 3. Finish registration
const finishRes = await fetch("/api/v1/auth/passkey/register/finish", {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    challengeId,
    response: credential,
    deviceName: "My MacBook",
  }),
});
```

### Client-Side Login (Browser)

```typescript
import { startAuthentication } from "@simplewebauthn/browser";

// 1. Begin authentication
const beginRes = await fetch("/api/v1/auth/passkey/login/begin", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "user@example.com" }),
});
const { options, challengeId } = await beginRes.json();

// 2. Authenticate
const credential = await startAuthentication(options);

// 3. Finish authentication
const finishRes = await fetch("/api/v1/auth/passkey/login/finish", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ challengeId, response: credential }),
});

// Session cookie is automatically set
```

## User Interface

### Login Page (`/login`)

The login page provides two authentication methods:

1. **Passkey Login** (Primary)
   - Click "Sign in with Passkey" button
   - Browser prompts for Touch ID, Face ID, or security key
   - On success, user is redirected to member home or admin

2. **Magic Link Login** (Fallback)
   - Enter email address
   - Click "Send sign-in link"
   - Check email for magic link
   - Click link to authenticate

### Security Settings (`/account/security`)

Authenticated users can manage their passkeys:

1. **View Passkeys**
   - List of all registered passkeys
   - Device name, creation date, last used date

2. **Add Passkey**
   - Click "Add Passkey" button
   - Optionally enter a device name
   - Complete WebAuthn ceremony
   - Passkey is registered and listed

3. **Remove Passkey**
   - Click "Remove" on any passkey
   - Confirm deletion
   - Passkey is revoked (soft delete)

4. **Session Info**
   - View current session details
   - Sign out button

### UI Components (`src/components/auth/`)

- `PasskeyLoginButton.tsx` - WebAuthn login button with error handling
- `MagicLinkForm.tsx` - Email-based login form with success state
- `PasskeyManager.tsx` - Full passkey management interface

## Recovery Flows

### User Lost All Passkeys

1. User requests magic link via email
2. User clicks link to verify email ownership
3. User registers new passkey while authenticated

### Admin Revocation

Admins with `users:manage` capability can:
1. View all passkeys for a user
2. Revoke any passkey with a documented reason
3. Actions are audit-logged for compliance

## Testing

### Unit Tests

```bash
npm run test:unit -- tests/unit/passkey/
```

### E2E Tests

WebAuthn testing requires special setup:
- Use WebAuthn virtual authenticators in Chrome/Firefox
- Configure test environment with proper rpID/origin

## Future Enhancements

- [x] Rate limiting per IP on auth endpoints
- [x] Login page UI with passkey and magic link options
- [x] Passkey management UI for enrolled users
- [ ] Conditional UI for passkey availability detection
- [ ] Cross-device authentication (hybrid authenticators)
- [ ] Backup codes as additional recovery method
- [ ] Passkey sync status display
