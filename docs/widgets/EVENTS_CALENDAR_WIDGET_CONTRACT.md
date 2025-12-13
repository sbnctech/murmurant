# Events Calendar Widget Contract

Worker 3 — Widget Contract — Report

## Scope

This contract defines the strict boundaries for the Events Calendar Widget. The widget is **untrusted UI**. All authorization, filtering, and access control decisions occur server-side. The widget renders what it receives and dispatches intent—nothing more.

## Widget Responsibilities

The widget SHALL:

- Render event data provided by the server
- Display calendar views (month, week, day, list)
- Apply local UI filters to already-authorized data
- Navigate between date ranges
- Dispatch user intent via links or declared actions

The widget SHALL NOT:

- Make access control decisions
- Determine event visibility or eligibility
- Construct queries or filter criteria that affect what data is returned
- Cache or persist data beyond the current session
- Store credentials, tokens, or secrets

## Forbidden Behaviors

| Behavior | Reason |
|----------|--------|
| Authentication | Widget never handles login, tokens, or sessions |
| Authorization | Widget never decides who sees what |
| Eligibility checks | Widget never computes registration eligibility |
| Query construction | Widget never builds SQL or dynamic filters |
| PII storage | Widget never persists member data |
| Direct mutation | Widget never creates, updates, or deletes records |

## Allowed Actions

The widget may dispatch the following intents:

| Action | Behavior |
|--------|----------|
| `event:view` | Display event details from server-provided data |
| `event:navigate` | Request events for a different date range |
| `event:filter:local` | Filter displayed events by category, time, availability |
| `event:register:redirect` | Navigate to authenticated registration flow |
| `event:detail:redirect` | Navigate to full event detail page |

## Disallowed Actions

| Action | Reason |
|--------|--------|
| `event:register:execute` | Registration requires authenticated server flow |
| `event:cancel:execute` | Cancellation requires authenticated server flow |
| `event:create` | Admin-only, requires authenticated session |
| `event:update` | Admin-only, requires authenticated session |
| `event:delete` | Admin-only, requires authenticated session |
| `registrant:query` | Must be server-initiated with auth check |

## Required Server-Side Guarantees

The server MUST enforce the following before returning data to the widget:

1. **Authentication validation** — Verify viewer identity if session exists
2. **Authorization filtering** — Return only events the viewer may see
3. **Registrant privacy** — Never return registrant data without explicit permission check
4. **Pre-filtered responses** — Widget receives ready-to-render data, not raw records
5. **No raw query interface** — Widget cannot specify query logic

## API Shape Expectations

### Events List Endpoint

```
GET /api/v1/events?from={date}&to={date}&category={cat}&limit={n}
```

Response shape:

```json
{
  "viewerContext": {
    "isAuthenticated": boolean,
    "canViewRegistrants": boolean
  },
  "events": [
    {
      "id": "string",
      "title": "string",
      "startTime": "ISO8601",
      "endTime": "ISO8601",
      "location": "string | null",
      "category": "string | null",
      "capacity": "number | null",
      "registeredCount": "number",
      "isWaitlistOpen": "boolean",
      "registrationUrl": "string"
    }
  ],
  "pagination": { ... }
}
```

### Event Detail Endpoint

```
GET /api/v1/events/{id}
```

Response includes event details appropriate for viewer's authorization level.

### Registrants Endpoint (Authenticated Only)

```
GET /api/v1/events/{id}/registrants
```

- Returns 401 if not authenticated
- Returns 403 if viewer lacks permission
- Returns only data viewer is authorized to see

## ViewerContext Requirements

Every API response to the widget MUST include a `viewerContext` object:

```json
{
  "viewerContext": {
    "isAuthenticated": boolean,
    "memberLevel": "guest" | "member" | "admin",
    "canViewRegistrants": boolean,
    "canRegister": boolean
  }
}
```

The widget uses `viewerContext` for UI decisions only. The server enforces all restrictions regardless of what the widget requests.

## Security Invariants

These invariants MUST hold at all times:

1. **Widget never decides access** — Server filters all data before transmission
2. **Widget never stores secrets** — No tokens, passwords, or API keys
3. **Widget never constructs queries** — No SQL, no dynamic filter logic
4. **Widget never bypasses auth** — All privileged actions redirect to authenticated flows
5. **Widget treats URLs as opaque** — Registration URLs, detail URLs are server-provided
6. **Widget cannot escalate privileges** — Malicious config cannot expose restricted data

## Trust Boundary

```
┌─────────────────────────────────────────────────────────────┐
│                     TRUSTED (Server)                        │
│  - Authentication                                           │
│  - Authorization                                            │
│  - Data filtering                                           │
│  - Eligibility calculation                                  │
│  - ViewerContext generation                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Pre-filtered data + ViewerContext
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    UNTRUSTED (Widget)                       │
│  - Rendering                                                │
│  - Local filtering of already-authorized data               │
│  - Navigation                                               │
│  - Intent dispatch (links, redirects)                       │
└─────────────────────────────────────────────────────────────┘
```

## Verdict

**READY FOR REVIEW**

This contract establishes the Events Calendar Widget as untrusted UI with strict boundaries. The widget renders server-provided data and dispatches intent. All access control, authorization, and eligibility logic remains server-side.

Compliance with this contract ensures the widget cannot leak data, bypass authentication, or make unauthorized decisions regardless of how it is embedded or configured.
