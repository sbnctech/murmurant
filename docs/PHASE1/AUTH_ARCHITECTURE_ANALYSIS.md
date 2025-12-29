# Authentication Architecture Analysis

**Date:** 2025-12-27
**Status:** JWT Auth NOT RECOMMENDED

---

## Current Auth System

Murmurant already has a robust authentication system that is **more secure than JWT**:

### Authentication Methods

1. **Passkeys (WebAuthn/FIDO2)** - Primary, most secure
   - Phishing-resistant
   - No shared secrets
   - Hardware-backed credentials

2. **Magic Links** - Secondary
   - Email-verified login
   - Single-use tokens
   - Time-limited (expires quickly)

### Session Management

Location: `src/lib/auth/session.ts`

```typescript
// Sessions are DB-backed with:
- Token hashing (raw tokens never stored)
- Idle timeout
- Absolute expiration
- Revocation support
- IP/User-Agent tracking
```

### Why NOT JWT?

| Feature | Current System | JWT |
|---------|---------------|-----|
| Token revocation | ✅ Instant (DB) | ❌ Wait for expiry |
| Session visibility | ✅ Full history | ❌ Stateless |
| Security | ✅ Passkey-based | ⚠️ Password-based |
| Phishing resistance | ✅ Native | ❌ None |

---

## Existing Code Structure

```
src/lib/auth/           <-- Production auth (passkeys + magic links)
├── session.ts          - DB-backed sessions
├── tokens.ts           - Secure token generation
├── cookies.ts          - Cookie management
├── delegation.ts       - Impersonation
└── audit.ts            - Security logging

src/services/auth/      <-- Service abstraction (stubs)
├── AuthService.ts      - Interface
├── NativeAuthService.ts - Unimplemented stubs
└── MockAuthService.ts  - Testing mock
```

---

## Recommendations

1. **Do NOT implement JWT auth** - Would be a security downgrade
2. **Keep passkey-first approach** - Industry best practice
3. **Consider**: If API auth needed, use:
   - API keys with HMAC signing
   - OAuth2 with PKCE for external clients
   - mTLS for service-to-service

---

## If Password Auth Required

For backwards compatibility or specific use cases requiring password auth:

1. Add to existing `lib/auth/` patterns
2. Use same session infrastructure
3. Enforce strong passwords + rate limiting
4. Consider password-to-passkey migration prompts

The `NativeAuthService` stubs exist for this scenario but should integrate with the existing session system rather than introducing JWT.
