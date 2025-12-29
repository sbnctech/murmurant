# Member DTO Schemas

This document defines the request and response data transfer objects (DTOs) for member-related API endpoints.

---

## GET /api/members/:id

Retrieves detailed information about a specific member.

### Path Parameters

| Parameter | Type   | Required | Description           |
|-----------|--------|----------|-----------------------|
| `id`      | string | Yes      | Member identifier     |

### Response: MemberDetailResponse

**HTTP 200 OK**

```typescript
interface MemberDetailResponse {
  member: MemberDetail;
  registrations: MemberRegistration[];
}

interface MemberDetail {
  id: string;                    // Unique member identifier
  firstName: string;             // Member's first name
  lastName: string;              // Member's last name
  email: string;                 // Email address
  phone: string | null;          // Phone number (optional)
  status: MemberStatus;          // Current membership status
  joinedAt: string;              // ISO 8601 timestamp
  membershipType: string | null; // e.g., "Individual", "Family"
  notes: string | null;          // Admin notes (admin view only)
}

type MemberStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING";

interface MemberRegistration {
  id: string;                    // Registration identifier
  eventId: string;               // Reference to event
  eventTitle: string;            // Event title for display
  status: RegistrationStatus;    // Registration status
  registeredAt: string;          // ISO 8601 timestamp
}

type RegistrationStatus = "REGISTERED" | "WAITLISTED" | "CANCELLED";
```

### Example Response

```json
{
  "member": {
    "id": "m-uuid-12345",
    "firstName": "Alice",
    "lastName": "Johnson",
    "email": "alice@example.com",
    "phone": "+15551234567",
    "status": "ACTIVE",
    "joinedAt": "2024-01-15T00:00:00Z",
    "membershipType": "Individual",
    "notes": null
  },
  "registrations": [
    {
      "id": "r-uuid-001",
      "eventId": "e-uuid-101",
      "eventTitle": "Welcome Hike",
      "status": "REGISTERED",
      "registeredAt": "2025-05-20T14:30:00Z"
    },
    {
      "id": "r-uuid-002",
      "eventId": "e-uuid-102",
      "eventTitle": "Wine Mixer",
      "status": "WAITLISTED",
      "registeredAt": "2025-05-21T10:00:00Z"
    }
  ]
}
```

### Error Responses

| HTTP Status | Error Code          | When                              |
|-------------|---------------------|-----------------------------------|
| 401         | UNAUTHORIZED        | Missing or invalid token          |
| 403         | FORBIDDEN           | User cannot view this member      |
| 404         | RESOURCE_NOT_FOUND  | Member ID does not exist          |

---

## GET /api/admin/members

Retrieves a paginated list of all members with aggregated metrics.

### Query Parameters

| Parameter | Type   | Required | Default | Description                    |
|-----------|--------|----------|---------|--------------------------------|
| `page`    | number | No       | 1       | Page number (1-indexed)        |
| `limit`   | number | No       | 50      | Items per page (max 100)       |
| `status`  | string | No       | all     | Filter by status               |
| `search`  | string | No       | -       | Search name or email           |
| `sort`    | string | No       | name    | Sort field                     |
| `order`   | string | No       | asc     | Sort order: "asc" or "desc"    |

### Response: MemberListResponse

**HTTP 200 OK**

```typescript
interface MemberListResponse {
  members: MemberSummary[];
  pagination: PaginationMeta;
}

interface MemberSummary {
  id: string;
  name: string;                  // Full name (firstName + lastName)
  email: string;
  phone: string | null;
  status: MemberStatus;
  joinedAt: string;
  registrationCount: number;     // Total registrations
  waitlistedCount: number;       // Current waitlist entries
}

interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
```

### Example Response

```json
{
  "members": [
    {
      "id": "m-uuid-12345",
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "phone": "+15551234567",
      "status": "ACTIVE",
      "joinedAt": "2024-01-15T00:00:00Z",
      "registrationCount": 5,
      "waitlistedCount": 1
    },
    {
      "id": "m-uuid-67890",
      "name": "Bob Smith",
      "email": "bob@example.com",
      "phone": null,
      "status": "ACTIVE",
      "joinedAt": "2024-02-20T00:00:00Z",
      "registrationCount": 3,
      "waitlistedCount": 0
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "totalItems": 127,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## GET /api/admin/members/:id/history

Retrieves the activity history for a specific member.

### Path Parameters

| Parameter | Type   | Required | Description           |
|-----------|--------|----------|-----------------------|
| `id`      | string | Yes      | Member identifier     |

### Query Parameters

| Parameter | Type   | Required | Default | Description                    |
|-----------|--------|----------|---------|--------------------------------|
| `limit`   | number | No       | 50      | Maximum items to return        |
| `type`    | string | No       | all     | Filter by activity type        |

### Response: MemberHistoryResponse

**HTTP 200 OK**

```typescript
interface MemberHistoryResponse {
  memberId: string;
  history: HistoryEntry[];
}

type HistoryEntry =
  | RegistrationHistoryEntry
  | StatusChangeHistoryEntry
  | PaymentHistoryEntry;

interface RegistrationHistoryEntry {
  type: "REGISTRATION";
  eventId: string;
  eventTitle: string;
  status: RegistrationStatus;
  timestamp: string;             // ISO 8601
}

interface StatusChangeHistoryEntry {
  type: "STATUS_CHANGE";
  fromStatus: MemberStatus;
  toStatus: MemberStatus;
  reason: string | null;
  changedBy: string | null;      // Admin who made the change
  timestamp: string;
}

interface PaymentHistoryEntry {
  type: "PAYMENT";
  amount: number;
  currency: string;
  description: string;
  status: "pending" | "paid" | "refunded";
  timestamp: string;
}
```

### Example Response

```json
{
  "memberId": "m-uuid-12345",
  "history": [
    {
      "type": "REGISTRATION",
      "eventId": "e-uuid-101",
      "eventTitle": "Welcome Hike",
      "status": "REGISTERED",
      "timestamp": "2025-05-20T14:30:00Z"
    },
    {
      "type": "STATUS_CHANGE",
      "fromStatus": "PENDING",
      "toStatus": "ACTIVE",
      "reason": "Application approved",
      "changedBy": "admin@murmurant.example",
      "timestamp": "2024-01-15T00:00:00Z"
    }
  ]
}
```

---

## PATCH /api/admin/members/:id/status

Updates a member's status.

### Path Parameters

| Parameter | Type   | Required | Description           |
|-----------|--------|----------|-----------------------|
| `id`      | string | Yes      | Member identifier     |

### Request: MemberStatusUpdateRequest

```typescript
interface MemberStatusUpdateRequest {
  status: MemberStatus;          // Required: new status
  reason?: string;               // Optional: reason for change
  notify?: boolean;              // Optional: send notification (default: true)
}
```

### Example Request

```json
{
  "status": "INACTIVE",
  "reason": "Membership lapsed - non-payment",
  "notify": true
}
```

### Response: MemberStatusUpdateResponse

**HTTP 200 OK**

```typescript
interface MemberStatusUpdateResponse {
  member: {
    id: string;
    name: string;
    status: MemberStatus;
    statusChangedAt: string;
    previousStatus: MemberStatus;
  };
  notificationSent: boolean;
}
```

### Example Response

```json
{
  "member": {
    "id": "m-uuid-12345",
    "name": "Alice Johnson",
    "status": "INACTIVE",
    "statusChangedAt": "2025-06-01T12:00:00Z",
    "previousStatus": "ACTIVE"
  },
  "notificationSent": true
}
```

### Error Responses

| HTTP Status | Error Code         | When                                    |
|-------------|--------------------|-----------------------------------------|
| 400         | VALIDATION_ERROR   | Invalid status value                    |
| 401         | UNAUTHORIZED       | Missing or invalid token                |
| 403         | FORBIDDEN          | User is not an admin                    |
| 404         | RESOURCE_NOT_FOUND | Member ID does not exist                |
| 409         | CONFLICT           | Member already has the requested status |
