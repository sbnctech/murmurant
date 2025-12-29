Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

# HTML Widget Policy (Restricted Escape Hatch)
Last updated: 2025-12-14

## Purpose
Define rigorous safeguards for a privileged widget type that can contain raw HTML/JS.  
This is an escape hatch for edge cases, not a primary authoring path.

## Governance
- Only the Tech Chair can:
  - create an HTML widget instance
  - edit an HTML widget instance
  - publish a page that introduces or changes HTML widget content

A site may additionally disable HTML widgets entirely.

## Default Posture
- Disabled by default on new deployments.
- If enabled, "deny by default" for capabilities and integrations.

## Allowed Use Cases (Examples)
- Embedding a vetted third-party widget that cannot be supported otherwise (with strict sandboxing).
- Temporary bridge during migration, with an explicit sunset plan.
- Minimal markup (non-executable) for layout that cannot be achieved with standard blocks (preferred: extend block palette instead).

## Disallowed Use Cases
- Arbitrary scripts that access member data or privileged APIs.
- Anything that attempts to bypass RBAC.
- Tracking pixels or analytics scripts not approved by governance.
- Inline credential storage or secrets.
- Any code that makes network calls to unapproved domains.

## Safeguards: At Instantiation / Configuration Time
The system must enforce:

1) Strong ownership + audit
- creator must be Tech Chair
- all edits recorded with actorId, timestamp, diff summary

2) Static validation (required)
- parse HTML and reject:
  - <script> tags (unless explicitly allowed under a stricter "approved script" mode)
  - inline event handlers (onclick=, onload=, etc.)
  - javascript: URLs
  - iframes without sandbox attributes

3) Domain allowlist (required)
- any iframe src or external asset src must match an allowlist of domains
- allowlist is configured by Tech Chair
- no wildcards unless explicitly approved

4) Size limits (required)
- enforce max HTML length
- enforce max number of iframes/assets

5) Secrets and tokens (required)
- no secrets in HTML
- no hard-coded tokens
- no environment leakage
- no access to server runtime secrets

## Safeguards: At Render / Runtime
The system must enforce:

1) Iframe sandboxing (required for any executable content)
- render executable embeds only inside a sandboxed iframe
- sandbox attributes must be strict (minimal permissions)
- no same-origin unless explicitly justified
- no top-navigation unless explicitly justified

2) CSP (Content Security Policy)
- define CSP headers to restrict:
  - script-src
  - frame-src
  - img-src
  - connect-src
- for HTML widget routes, use the strictest CSP compatible with the embed.

3) Capability gating
- HTML widget gets zero access to Murmurant APIs by default.
- Any API access must go through a narrowly scoped server endpoint with RBAC checks and explicit allowlisting.

4) RBAC is not optional
- HTML widgets must not be used to display privileged data unless that data is fetched server-side and rendered via approved components.
- If privileged display is required, create a proper widget type instead.

## Publishing Controls
- Publishing a page that changes HTML widget content should require:
  - page:publish permission AND widget:html:admin permission
- Require a change summary on publish for HTML changes.
- Optional (recommended): two-person review for high-risk pages (finance/membership).

## Operational Guidance
- Prefer creating a proper widget type over using HTML.
- If HTML is used, require a sunset ticket:
  - why it exists
  - what replaces it
  - target removal date

## Implementation Notes (for CC)
- Treat HTML widget instances as stored objects with versioning (WidgetInstanceVersion).
- Validate + sanitize on save.
- Always re-validate on publish.
- Render through sandboxed iframe boundary when any active content is present.
