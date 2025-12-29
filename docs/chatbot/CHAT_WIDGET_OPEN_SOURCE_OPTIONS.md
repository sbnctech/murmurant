Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

# Chatbot Widget: Open Source Options (v1)

We want a chatbot widget that:
- Is safe by default (read-only / deny-first)
- Enforces RBAC server-side
- Is auditable
- Is maintainable by non-technical operators over time
- Can be embedded (iframe-first) without exposing privileges

## What We Actually Need

UI:
- Chat transcript + input
- Optional streaming responses
- Themeable (matches site theme)
- Accessible
- Works as a widget and as a full page

Application layer (Murmurant-owned):
- Chatbot safety contract (already documented)
- RBAC-gated retrieval and responses
- Audit logging for queries and access

## OSS Strategy

Option A (Recommended): Murmurant-native widget using proven UI primitives
- Implement the widget directly in Murmurant using existing component primitives.
- Keep ALL tool use / retrieval on the server behind our safety contract.
- Treat the UI as a thin shell.

Pros:
- Small surface area, easiest to keep safe
- Fits our widget security posture
- Best long-term maintainability

Cons:
- Some assembly work (but straightforward)

Option B: Embed a full open-source chatbot product
- Treat it as an external integration and embed via sandboxed iframe.

Pros:
- Faster UI and rich features

Cons:
- Large dependency surface
- Difficult to align with Murmurant RBAC/audit/deny-first design
- Likely forces their data model and operational footprint

Guidance:
- Only consider if we can keep it strictly sandboxed and never grant it direct privileged access.

## Recommendation

Proceed with Option A:
- Build a Murmurant-native ChatWidget.
- Keep the “brains” and all data access server-side.
- Integrate with Help Widget by passing prefilled question + server context bundle.
