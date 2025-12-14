# Chatbot Query Execution API v1

Purpose
- Allow chatbot to execute read-only queries via allowlisted templates.
- Enforce RBAC on every request.
- Return results plus deep-link suggestions.

Request
- intent: "QUERY"
- template_id: string
- params: object (template allowlist)
- response_style: "SUMMARY" | "TABLE" | "DETAIL"

Response
- answer: string
- data: object (optional, redacted)
- deep_links: array of { href, label }
- policy: { read_only: true }

Hard gates
- No mutations
- No arbitrary filters/sorts
- Template-only queries
- Server RBAC + redactions always
