# Embed Widget SDK Contract (v1)

## Goal
Allow safe embedding of Murmurant widgets into external pages without breaking RBAC.

## Default: Iframe-First (Recommended)
- Embed uses an iframe pointing to a Murmurant route.
- The embedded page enforces auth and RBAC server-side.
- Host page never receives raw data.

### Pattern A: Authenticated Embed (Member Portal)
- User is already logged in to Murmurant
- iframe renders within same origin (or approved domain)

### Pattern B: Public Embed (No auth)
- Only for explicitly public widgets (Low sensitivity)
- No member data
- Rate limits and caching

## Optional: Tokenized Embed (Advanced, Controlled)
- Short-lived, signed token grants read-only access to a specific widget instance.
- Token encodes:
  - widget_id
  - scope (org_id, optional committee/event)
  - expiry
  - sensitivity (must be Low)
- Token does NOT grant broader API access.

## Restrictions (Hard)
- No arbitrary JS execution inside Murmurant.
- No postMessage that returns sensitive data.
- No "custom query" parameters beyond allowlisted filters/sorts.
- Embed domains must be allowlisted (CORS + frame-ancestors).

## RBAC Preservation
- All data access remains server-side.
- Tokens are scoped and time-bounded.
- High/Medium sensitivity widgets cannot be token-embedded in v1.

## Non-Goals (v1)
- No third-party sites embedding admin widgets.
- No cross-org embedding.
