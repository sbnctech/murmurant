# Authentication and RBAC

This document describes the authentication and role-based access control (RBAC) system for ClubOS API routes.

## Overview

ClubOS uses a simple header-based authentication system for the v1 API. Authentication is performed via Bearer tokens in the `Authorization` header.

## Dev Tokens (Temporary)

For development and testing, the following static tokens are accepted:

| Token | Role | Description |
|-------|------|-------------|
| `test-admin-token` | admin | Primary admin test token |
| `admin-dev` | admin | Alternative admin token |
| `vp-dev` | admin | VP Activities (admin-level access) |
| `chair-dev` | member | Event Chair (member-level access) |
| `test-member-token` | member | Primary member test token |
| `member-dev` | member | Alternative member token |

Dynamic tokens with custom member IDs:
- `test-admin-{memberId}` - Admin with custom memberId
- `test-member-{memberId}` - Member with custom memberId

**Note:** These tokens are intentionally simple for development. Production will use JWT/OAuth.

## Roles

| Role | Description |
|------|-------------|
| `admin` | Full access to all admin endpoints |
| `member` | Access to member-facing endpoints only |

## Error Responses

- **401 Unauthorized**: Missing or invalid token
- **403 Forbidden**: Valid token but insufficient permissions

## Usage in API Routes

### Example: Protect an Admin Endpoint

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  // auth.context.memberId, auth.context.email, auth.context.globalRole
  return NextResponse.json({ data: "admin-only data" });
}
```

### Example: Protect with Multiple Roles

```typescript
import { requireRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ["admin", "member"]);
  if (!auth.ok) return auth.response;

  // Authenticated user with admin or member role
  return NextResponse.json({ userId: auth.context.memberId });
}
```

## Auth Module Exports

| Function | Description |
|----------|-------------|
| `parseBearerToken(req)` | Extract token from Authorization header |
| `requireAuth(req)` | Require any valid authentication |
| `requireAdmin(req)` | Require admin role |
| `requireRole(req, roles)` | Require one of the specified roles |

## Testing with Auth

When writing tests, include the Authorization header:

```typescript
const ADMIN_HEADERS = { Authorization: "Bearer test-admin-token" };

test("admin endpoint", async ({ request }) => {
  const response = await request.get("/api/admin/members", {
    headers: ADMIN_HEADERS,
  });
  expect(response.status()).toBe(200);
});
```

## Future Enhancements

- [ ] JWT token validation
- [ ] OAuth integration
- [ ] Database-backed user sessions
- [ ] Fine-grained permissions (beyond admin/member)
- [ ] Row-level authorization (e.g., event chair can only edit their events)
