# Chatbot Plugin Interface Contract

Worker 2 — Q-030 Chatbot Plugin Interface — Report

---

## Purpose

Define a strict, auditable interface between the chatbot UI and ClubOS backend services. The chatbot is treated as an **untrusted UI client**—it may request data and navigation assistance, but it cannot mutate state or bypass access controls.

This interface enables:

- Read-only data queries scoped to the viewer's role
- Guided navigation via deep links
- How-to support with contextual help
- Consistent error handling and refusal patterns

---

## Non-Goals

- No direct database access from chatbot
- No mutation operations (create, update, delete)
- No bypass of RBAC enforcement
- No caching of sensitive data client-side
- No execution of arbitrary queries
- No access to audit logs or system internals

---

## Plugin Interface Responsibilities

The chatbot plugin interface is responsible for:

| Responsibility | Owner |
|----------------|-------|
| Authenticate viewer identity | Platform (not chatbot) |
| Enforce role-based access | Platform (not chatbot) |
| Execute pre-approved query templates | Platform |
| Return filtered, safe responses | Platform |
| Log all queries for audit | Platform |
| Present results to user | Chatbot UI |
| Handle errors gracefully | Chatbot UI |

The chatbot UI is a presentation layer only. All access control, data filtering, and audit logging occur server-side.

---

## Allowed Operations (Explicit List)

The chatbot MAY request:

| Operation | Description | Example |
|-----------|-------------|---------|
| `query.run` | Execute a pre-approved query template | "What events am I registered for?" |
| `help.lookup` | Retrieve help content by topic or context | "How do I cancel a registration?" |
| `navigate.suggest` | Get deep link to relevant page | "Where do I update my profile?" |
| `context.get` | Get current viewer context (role, name, status) | Display personalized greeting |
| `glossary.lookup` | Define a club-specific term | "What does 'lapsed' mean?" |
| `escalate.request` | Request handoff to human support | "I need to talk to someone" |

Each operation has:

- Defined input schema
- Defined output schema
- Role requirements
- Audit logging

---

## Forbidden Operations (Explicit List)

The chatbot MUST NOT:

| Forbidden Operation | Reason |
|---------------------|--------|
| Execute arbitrary SQL or queries | Security: injection risk |
| Create, update, or delete any record | Mutations require explicit user action in UI |
| Access other users' data | Privacy: only viewer's own data or authorized aggregates |
| Retrieve raw audit logs | Security: audit logs are admin-only |
| Cache PII client-side | Privacy: sensitive data must not persist |
| Bypass query templates | Security: all queries must be pre-approved |
| Access payment tokens or card numbers | Security: never exposed through any interface |
| Impersonate another user | Security: viewer context is immutable |
| Disable or modify logging | Audit: all operations must be logged |

Attempts to perform forbidden operations return a structured refusal, not an error.

---

## Access Control Model

### Viewer Context

Every chatbot request includes a ViewerContext provided by the platform:

```
ViewerContext {
  user_id: string
  roles: Role[]
  committee_ids: string[]
  membership_status: 'active' | 'lapsed' | 'prospect'
  session_id: string
}
```

The chatbot cannot modify ViewerContext. It is injected server-side from the authenticated session.

### Query Scoping

All queries are scoped by ViewerContext:

| Scope | Meaning | Example |
|-------|---------|---------|
| self | Only viewer's own records | My registrations |
| committee | Records in viewer's committees | Events I chair |
| global | Aggregates visible to viewer's role | Total member count (admin only) |

Queries that exceed the viewer's scope return empty results, not errors.

### Role Enforcement

Each query template declares required roles:

```
QueryTemplate {
  query_id: string
  required_roles: Role[]
  scope: 'self' | 'committee' | 'global'
  ...
}
```

If viewer lacks required role, the query returns:

```
{
  "status": "denied",
  "reason": "insufficient_role",
  "message": "This information requires [Role] access."
}
```

---

## Query Execution Rules

### Pre-Approved Templates Only

- All queries execute against pre-defined templates
- Templates are versioned and documented
- No dynamic query construction from user input
- Parameters are validated against schema before execution

### Parameter Validation

```
QueryRequest {
  query_id: string           // Must match known template
  params: Record<string, any> // Validated against template schema
  viewer_context: ViewerContext // Injected by platform
}
```

Invalid parameters return validation error with field-level details.

### Result Limits

| Constraint | Default | Max |
|------------|---------|-----|
| Row limit | 50 | 500 |
| Response size | 64KB | 256KB |
| Query timeout | 5s | 30s |

Results exceeding limits are truncated with continuation token.

### No Side Effects

Query execution MUST NOT:

- Modify any database record
- Send emails or notifications
- Trigger background jobs
- Write to external systems

Queries are pure reads.

---

## How-To Support vs Data Query Behavior

### How-To Support (help.lookup)

Purpose: Answer "how do I do X?" questions

Behavior:

- Returns static help content (markdown)
- May include deep links to relevant pages
- Role-aware: shows content appropriate to viewer's role
- Does not access viewer's data
- Example: "How do I cancel a registration?" returns step-by-step guide

### Data Query (query.run)

Purpose: Answer "what is X?" or "show me Y" questions

Behavior:

- Executes query template against live data
- Returns viewer-scoped results
- Filtered by RBAC before return
- Example: "What events am I registered for?" returns registration list

### Distinguishing Intent

The chatbot UI determines intent from user input. The platform does not interpret natural language—it receives structured requests.

| User Says | Chatbot Sends | Operation |
|-----------|---------------|-----------|
| "How do I cancel?" | `help.lookup("cancel_registration")` | How-to |
| "What am I registered for?" | `query.run("registrations.self")` | Data query |
| "Take me to my profile" | `navigate.suggest("profile")` | Navigation |

---

## Error Handling and Refusal Patterns

### Structured Responses

All responses follow a consistent structure:

```
Response {
  status: 'success' | 'denied' | 'error' | 'empty'
  data?: any
  message?: string
  reason?: string
  deep_link?: string
}
```

### Refusal (Not Error)

When a request is denied due to access control:

```
{
  "status": "denied",
  "reason": "insufficient_role",
  "message": "This query requires VP or Admin role."
}
```

Refusals are logged but do not expose what data exists.

### Error (System Failure)

When a request fails due to system issues:

```
{
  "status": "error",
  "reason": "query_timeout",
  "message": "Request took too long. Please try again."
}
```

Errors do not expose internal details.

### Empty (No Results)

When a query succeeds but returns no data:

```
{
  "status": "empty",
  "message": "No upcoming events found.",
  "deep_link": "/events/calendar"
}
```

Empty results include helpful next steps.

### What Not to Reveal

Responses MUST NOT reveal:

- Whether denied data exists
- Internal table or column names
- Stack traces or error details
- Other users' existence or data

---

## Audit and Logging Expectations

### Every Request Logged

All chatbot operations are logged with:

| Field | Description |
|-------|-------------|
| timestamp | Server time of request |
| session_id | Viewer's session |
| user_id | Viewer's identity |
| operation | query.run, help.lookup, etc. |
| query_id | Template ID (for queries) |
| params_hash | Hash of parameters (not raw values) |
| status | success, denied, error, empty |
| result_count | Number of rows returned |
| duration_ms | Execution time |
| ip_address | Requestor IP |

### Sensitive Data Handling

- Raw query parameters are NOT logged if they contain search terms
- Result data is NOT logged (only count)
- Denied requests are logged with reason but not what was requested

### Retention

- Chatbot audit logs retained for 2 years minimum
- Logs are append-only
- No role can delete chatbot audit entries

---

## Interface Summary

```
+------------------+     +-----------------------+     +------------------+
|   Chatbot UI     | --> |  Plugin Interface     | --> |  ClubOS Backend  |
|  (untrusted)     |     |  (validation layer)   |     |  (trusted)       |
+------------------+     +-----------------------+     +------------------+
        |                         |                           |
        |  Structured requests    |  ViewerContext injected   |
        |  (query.run, etc.)      |  RBAC enforced            |
        |                         |  Audit logged             |
        |                         |                           |
        |  <-- Filtered results   |  <-- Scoped data          |
        |      Safe messages      |      No mutations         |
```

---

## Verdict

READY FOR REVIEW
