# ClubOS Service API Contracts

This document defines the API contracts for ClubOS service interfaces. All endpoints follow RESTful conventions and return JSON responses.

## Common Response Format

All API responses follow this structure:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

## Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate) |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Auth Service

### POST /api/auth/login

Authenticate a user and create a session.

**Auth Required:** No

**Request Body:**
```typescript
{
  email: string;
  password: string;
  remember?: boolean;
}
```

**Response (200):**
```typescript
{
  success: true;
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      role: "member" | "admin" | "superadmin";
    };
    sessionId: string;
    expiresAt: string;
  };
}
```

**Error Codes:**
- `INVALID_CREDENTIALS` (401) - Email or password incorrect
- `ACCOUNT_LOCKED` (403) - Too many failed attempts
- `ACCOUNT_INACTIVE` (403) - Account not activated

---

### POST /api/auth/logout

End the current session.

**Auth Required:** Yes

**Response (200):**
```typescript
{
  success: true;
  data: { message: "Logged out successfully" };
}
```

---

### POST /api/auth/register

Create a new user account.

**Auth Required:** No

**Request Body:**
```typescript
{
  email: string;
  password: string;
  name: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
}
```

**Response (201):**
```typescript
{
  success: true;
  data: {
    userId: string;
    message: "Account created. Check email for verification.";
  };
}
```

---

### GET /api/auth/session

Get current session information.

**Auth Required:** Yes

**Response (200):**
```typescript
{
  success: true;
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      capabilities: string[];
    };
    expiresAt: string;
  };
}
```

---

## Member Service

### GET /api/members

List members with pagination and filtering.

**Auth Required:** Yes (member role)

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20, max: 100) |
| `search` | string | Search by name or email |
| `status` | string | Filter by status |
| `sortBy` | string | Sort field |
| `sortOrder` | string | asc or desc |

**Response (200):**
```typescript
{
  success: true;
  data: {
    members: Array<{
      id: string;
      name: string;
      email: string;
      status: string;
      joinDate: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
```

---

### GET /api/members/:id

Get a single member's details.

**Auth Required:** Yes

**Response (200):**
```typescript
{
  success: true;
  data: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: { street: string; city: string; state: string; zip: string };
    status: string;
    joinDate: string;
    committees: Array<{ id: string; name: string; role: string }>;
  };
}
```

---

### POST /api/members

Create a new member (admin only).

**Auth Required:** Yes (admin role)

**Request Body:**
```typescript
{
  email: string;
  name: string;
  phone?: string;
  status?: string;
}
```

**Response (201):**
```typescript
{
  success: true;
  data: { id: string; email: string; name: string };
}
```

---

### PATCH /api/members/:id

Update member information.

**Auth Required:** Yes (admin or self)

**Request Body:** (all fields optional)
```typescript
{
  name?: string;
  phone?: string;
  address?: { ... };
  status?: string;  // Admin only
}
```

---

### DELETE /api/members/:id

Deactivate a member (soft delete).

**Auth Required:** Yes (admin role)

---

## Event Service

### GET /api/events

List events with filtering.

**Auth Required:** Optional

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `status` | string | draft, published, cancelled |
| `from` | string | Start date (ISO 8601) |
| `to` | string | End date (ISO 8601) |

**Response (200):**
```typescript
{
  success: true;
  data: {
    events: Array<{
      id: string;
      title: string;
      date: string;
      location: string;
      capacity?: number;
      registered: number;
      status: string;
    }>;
    pagination: { ... };
  };
}
```

---

### GET /api/events/:id

Get event details.

**Auth Required:** Optional (for public events)

---

### POST /api/events

Create a new event.

**Auth Required:** Yes (admin or committee chair)

**Request Body:**
```typescript
{
  title: string;
  description: string;
  date: string;
  endDate?: string;
  location: string;
  capacity?: number;
  price?: number;
  isPublic?: boolean;
}
```

---

### PATCH /api/events/:id

Update an event.

**Auth Required:** Yes (admin or event organizer)

---

### POST /api/events/:id/register

Register for an event.

**Auth Required:** Yes (member role)

**Request Body:**
```typescript
{
  guests?: number;
  notes?: string;
}
```

**Response (201):**
```typescript
{
  success: true;
  data: {
    registrationId: string;
    status: "registered" | "waitlisted";
    confirmationNumber: string;
  };
}
```

---

### DELETE /api/events/:id/register

Cancel event registration.

**Auth Required:** Yes (member role)

---

## Payment Service

### POST /api/payments/intent

Create a payment intent.

**Auth Required:** Yes

**Request Body:**
```typescript
{
  type: "event" | "dues" | "donation";
  referenceId: string;
  amount: number;
  currency?: string;
}
```

**Response (200):**
```typescript
{
  success: true;
  data: {
    intentId: string;
    clientSecret: string;
    amount: number;
  };
}
```

---

### POST /api/payments/confirm

Confirm a completed payment.

**Auth Required:** Yes

---

### GET /api/payments/history

Get payment history for current user.

**Auth Required:** Yes

---

### POST /api/subscriptions

Create a recurring subscription.

**Auth Required:** Yes

---

### DELETE /api/subscriptions/:id

Cancel a subscription.

**Auth Required:** Yes

---

## Email Service

### POST /api/email/send

Send a single email.

**Auth Required:** Yes (admin role)

**Request Body:**
```typescript
{
  to: string | string[];
  templateId?: string;
  subject?: string;
  body?: string;
  variables?: Record<string, unknown>;
}
```

---

### POST /api/email/bulk

Send bulk emails.

**Auth Required:** Yes (admin role)

**Request Body:**
```typescript
{
  recipients: Array<{ email: string; variables?: Record<string, unknown> }>;
  templateId: string;
  scheduledAt?: string;
}
```

---

### GET /api/email/templates

List email templates.

**Auth Required:** Yes (admin role)

---

### POST /api/email/templates

Create an email template.

**Auth Required:** Yes (admin role)

---

## Rate Limiting

All endpoints are rate limited:

| Endpoint Type | Limit |
|---------------|-------|
| Auth endpoints | 10 requests/minute |
| Read endpoints | 100 requests/minute |
| Write endpoints | 30 requests/minute |
| Bulk operations | 5 requests/minute |

Rate limit headers are included in all responses:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`
