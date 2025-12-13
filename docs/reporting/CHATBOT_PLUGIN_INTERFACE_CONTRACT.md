# Chatbot Plugin Interface Contract

Worker 1 - Chatbot Plugin Interface Contract - Report

## Goal
The ClubOS chatbot must operate ONLY through a plugin/tool interface.
No direct DB access. No direct internal imports. No secret handling in the chatbot layer.

The chatbot supports:
1) How-to support (read-only help) for using ClubOS
2) Read-only queries, filtered by RBAC and user role
3) Navigation assistance: deep-link user to the page/section to complete tasks

## Core Rules (Non-Negotiable)
- Read-only tools ONLY
- Every tool call requires ViewerContext
- Tool layer enforces authorization and privacy filtering
- Tools return normalized, minimal data (no secrets, no PII unless explicitly allowed)
- All tool calls are audited (who, what tool, parameters hash, result size, timestamp)
- Chatbot never "decides" permissions; it asks tools and displays results

## Tool Surface (Initial)
### Tool: help.search
Purpose: Search user-facing documentation / help content
Inputs:
- query: string
Outputs:
- results[]: { title, snippet, deep_link, relevance }
RBAC:
- ViewerContext required
- Returns only content allowed for the viewer (members-only docs stay members-only)

### Tool: help.get
Purpose: Fetch a specific help article by id/slug
Inputs:
- slug: string
Outputs:
- { title, body_markdown, deep_links[] }
RBAC:
- ViewerContext required

### Tool: nav.resolve
Purpose: Resolve a user's intent to a ClubOS route and anchor
Inputs:
- intent: string
- context: optional structured hints
Outputs:
- { route, anchor, label }
RBAC:
- ViewerContext required
Notes:
- This tool returns navigation targets, not data.

### Tool: query.run
Purpose: Execute a read-only query against pre-approved query templates
Inputs:
- query_id: string
- params: object (validated)
Outputs:
- { columns[], rows[], next_cursor? }
RBAC:
- ViewerContext required
Notes:
- No freeform SQL.
- Only server-owned query templates.
- Row-level filtering enforced server-side.

### Tool: events.lookup
Purpose: Read-only event lookup (used by chatbot for "what events are available?")
Inputs:
- date_range / filters
Outputs:
- normalized event list + deep_links
RBAC:
- ViewerContext required

### Tool: membership.lookup_self
Purpose: Show the viewer their own membership status and related actions
Inputs: none
Outputs:
- status + allowed_actions + deep_links
RBAC:
- ViewerContext required
Privacy:
- Self-only

## Allowed Chatbot Behaviors
- Answer questions using help.search/help.get
- Run query.run templates (RBAC filtered) and summarize results
- Provide deep links to the correct page to complete actions
- Offer "next best step" links rather than performing actions

## Forbidden Chatbot Behaviors
- Performing writes (create/update/delete)
- Bypassing tools to call internal services directly
- Returning data outside RBAC scope
- Exposing secrets, tokens, raw ids that enable scraping
- Making up results (must cite tool outputs)

## Logging & Audit
Every tool call must log:
- actor_user_id
- tool_name
- params_hash
- result_count/bytes
- timestamp
- request_id

## Open Decisions (mark as REQUIRES DECISION)
- Where help content lives (MkDocs export? in-app pages? both?)
- PII policy for staff/board directories
- Query template governance process (who can add query_ids)

## Verdict
READY FOR REVIEW
