# Embedded Widgets Security Model

## Question
Do we allow a user to embed Murmurant widgets into their own HTML/JS? If yes, how do we do it safely without breaking RBAC?

## Core Principle
Embedded widgets are **untrusted UI**.
All authorization and privacy decisions must be enforced **server-side** in Murmurant using ViewerContext.

## Supported Embed Patterns

### Pattern A: Iframe Embed (Preferred for security)
- Host site embeds an iframe pointing to a Murmurant embed route.
- Murmurant requires authentication and applies RBAC exactly as it does for first-party pages.

Pros:
- Simplest security model
- No secrets in host HTML
- Works with existing session cookies

Cons:
- Styling/size constraints
- Cross-domain UX constraints

### Pattern B: JS SDK + Short-Lived Embed Session (Preferred for native UX)
- Host site loads a Murmurant JS bundle and mounts a widget into a div.
- Widget calls Murmurant APIs.
- Access is via:
  - existing authenticated Murmurant session (cookie), OR
  - an **embed session token** minted by Murmurant, short-lived, origin-bound, scope-limited.

Pros:
- Native look and feel
- More layout control

Cons:
- Higher implementation complexity
- Requires careful token, CSP, and origin handling

## Non-Acceptable Patterns
- Static API keys or long-lived tokens pasted into HTML
- Passworded/unlisted gallery links used as the security boundary
- Client-side filtering that assumes UI will enforce privacy

## Required Security Invariants
1. Server-side authorization on every request (ViewerContext)
2. Data returned is pre-filtered and redacted server-side
3. No secrets embedded in HTML/JS
4. Embed sessions are:
   - short-lived (minutes)
   - scoped (widget_id + allowed entities + allowed operations)
   - origin-bound (allowed hostnames)
5. CORS restricted to org allowlist
6. Rate limits per user/org/origin
7. Audit logging of:
   - widget render events
   - query templates invoked
   - result size (not full payload)

## Operational Restrictions
- Widgets must reference server-stored configuration by widget_id
- Host cannot submit arbitrary query language
- Allowed filters/sorts must be whitelisted per entity (see QUERY_FILTER_CATALOG.md)
- PII fields require explicit permission gates; redactions are default

## Open Decisions
- Whether Pattern B is allowed for member-only widgets in v1, or iframe-only initially
- Embed session TTL and rotation policy
- Whether embed supports cross-org usage (default: no)

## Verdict
- SAFE if Pattern A is supported and Pattern B follows all invariants above.
- UNSAFE if secrets or shareable links become the enforcement mechanism.
