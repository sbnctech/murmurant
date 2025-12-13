# Events Widget Fit Check

Worker 3 — Events Widget Fit Check — Report

## Purpose

Determine whether the Events/Calendar widget design fits the "widgets are untrusted UI" model and identify changes required for compliance.

## Current Widget Assumptions

### Authentication

- Widget does NOT handle authentication directly
- Relies on `CONFIG.memberLevel` being set externally by the host page
- No tokens, cookies, or credentials managed by the widget

### API Endpoints Used

The widget fetches data from these endpoints (all unauthenticated):

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/chatbot/api/query` | POST | Raw SQL queries against cached event data |
| `/chatbot/api/wa-events` | GET | Live Wild Apricot events |
| `/chatbot/api/event-registrants/{id}` | GET | List of registrants (names, contact IDs) |
| `/chatbot/api/event-photos/{id}` | GET | Photo count for event |

### Data Consumed

- Event title, date, time, location, capacity, registration counts
- Registrant names and profile links (members-only UI)
- Event tags and categories
- Photo gallery links

### Embedding Context

- Designed for Wild Apricot page embedding
- Loads FullCalendar and jQuery from CDN
- Uses `window.SBNCCalendar` global API
- Host page expected to set `CONFIG.memberLevel` and `CONFIG.apiBase`

### User Actions

- View calendar in various modes (month, week, list)
- Filter events by category, time, availability
- Click event to view popup with details
- **Registration redirects to WA**: "View & Register" links to `sbnewcomers.org/event-{id}`
- "Who's Registered?" section fetches and displays registrant list

## Alignment with "Untrusted UI" Model

| Principle | Status | Notes |
|-----------|--------|-------|
| Widget is untrusted UI | ✅ Aligned | Widget cannot make privileged decisions |
| Widget never decides access | ✅ Aligned | Widget displays what API returns |
| Widget dispatches intent, never decisions | ✅ Aligned | Registration delegated to WA page |
| Widget does not store secrets | ✅ Aligned | No tokens or credentials stored |
| Widget does not enforce privacy | ⚠️ Partial | Uses `CONFIG.memberLevel` to hide/show sections |

## Violations and Risks

### 1. Raw SQL Query Endpoint (HIGH RISK)

**Issue**: Widget sends raw SQL via POST to `/chatbot/api/query`

```javascript
const sql = `SELECT Id, Name, StartDate... FROM events WHERE ${dateFilter}...`;
fetch(`${CONFIG.apiBase}/chatbot/api/query`, {
    method: 'POST',
    body: JSON.stringify({ sql })
});
```

**Risk**: SQL injection, data exfiltration, schema exposure

**Recommendation**: Replace with parameterized API endpoint that accepts structured query params

### 2. Registrant Data Exposed to Widget (MEDIUM RISK)

**Issue**: `/chatbot/api/event-registrants/{id}` returns names and contact IDs without server-side auth check

**Risk**: PII leakage if endpoint is called without valid session

**Recommendation**:
- Server must validate viewer authentication before returning registrant data
- Widget should receive only what the authenticated viewer is authorized to see

### 3. Client-Side Visibility Control (LOW RISK)

**Issue**: `CONFIG.memberLevel` is trusted to hide UI sections

```javascript
if (CONFIG.memberLevel) {
    fetchEventRegistrants(event.id);
}
```

**Risk**: Malicious host page could set `CONFIG.memberLevel = true` to expose member-only UI

**Mitigation**: This is low risk IF server endpoints enforce authorization. The widget hiding/showing UI is cosmetic; the real enforcement must be server-side.

### 4. No ViewerContext from Server (GAP)

**Issue**: Widget doesn't receive a server-signed ViewerContext

**Risk**: Widget cannot reliably know viewer permissions

**Recommendation**: API responses should include ViewerContext so widget can make appropriate UI decisions without trusting host page config

## Remediation Recommendations (Contract-Level)

### R1: Eliminate Raw SQL Endpoint

Replace `/chatbot/api/query` with structured endpoints:

- `GET /api/v1/events?from=&to=&category=&limit=`
- Response includes only fields widget needs

### R2: Server-Side Authorization for Registrant Data

The registrants endpoint MUST:

- Require authenticated session
- Return 401/403 if viewer lacks permission
- Only return registrant data viewer is authorized to see

### R3: Add ViewerContext to API Responses

API responses should include:

```json
{
  "viewerContext": {
    "isAuthenticated": true,
    "memberLevel": "member",
    "canViewRegistrants": true
  },
  "events": [...]
}
```

Widget uses this to control UI, but enforcement remains server-side.

### R4: Document Allowed Events/Actions

Define explicit widget contract (similar to Photo Gallery):

**Allowed Events**:
- `event:view` - Display event details
- `event:filter` - Apply local filters
- `event:navigate` - Change calendar view/date

**Disallowed Actions**:
- `event:register` - Must redirect to authenticated flow
- `event:cancel` - Must redirect to authenticated flow
- Direct data mutation

## Verdict

**OK WITH CHANGES**

The Events Widget largely follows the "untrusted UI" pattern by:

- Not handling authentication
- Delegating registration to authenticated WA pages
- Displaying server-provided data

However, before ClubOS integration, the following MUST be addressed:

1. **CRITICAL**: Eliminate raw SQL query endpoint
2. **HIGH**: Server-side auth for registrant data endpoint
3. **MEDIUM**: Add ViewerContext to responses

Once these changes are made, the widget will be fully compliant with the untrusted UI contract.
