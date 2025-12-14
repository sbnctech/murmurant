# Embed Widget SDK v1

Goal
- Allow third parties to embed ClubOS widgets safely without weakening RBAC.

Pattern A (recommended): iframe embed
- <iframe src="https://clubos.example/embed/widget?widget_id=...&token=...">
- Token is short-lived, signed, and origin-bound.

Pattern B (optional): small JS loader
- Loads iframe with postMessage handshake.
- Still no direct data APIs from browser without token.

Token requirements
- TTL (minutes)
- widget_id allowlist
- viewer binding (member_id or anonymous)
- origin allowlist
- rate limits

Security requirements
- Server-side RBAC always
- CORS: deny by default; allow only known origins for token issuance
- CSP for embed routes
- No cookies required for embed rendering
- All embeds treated as untrusted

Out of scope
- Custom arbitrary JS plugins
- Cross-tenant federation
