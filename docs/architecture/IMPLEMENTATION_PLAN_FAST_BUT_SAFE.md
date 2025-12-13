# Implementation Plan (Fast But Safe)
## Goal: Maintainable by humans and agents

Operating principles
- Keep the house spotless: small PRs, tight scope, no mixed concerns.
- Contracts first: code must match contracts, not invent them.
- Maintainability: boring interfaces, explicit boundaries, strong tests, clear docs.

Core invariants
- Widgets are untrusted UI.
- ClubOS is system of record and enforcement point.
- Storage providers are untrusted.
- ViewerContext is server-issued and opaque to widgets.
- All data returned to widgets is pre-filtered server-side.

Phase 0: Review Gate (hours, not days)
Deliverables
- Confirm the required contract docs exist and are consistent.
- Create a single crosswalk doc listing each contract and its "musts".
Exit criteria
- Authorization checklist marked AUTHORIZED.

Phase 1: Scaffolding Only (safe foundations)
Deliverables
- Photo module skeleton with provider interface:
  - PhotoStorageProvider interface
  - Provider registry
  - Local provider stub (NotImplemented allowed for write paths)
- API contract stubs (read-only):
  - Documented endpoints and request/response shapes
  - NotImplemented handlers for non-read paths
- ViewerContext types
- Minimal unit tests for:
  - ViewerContext required for endpoints
  - RBAC denies by default
Exit criteria
- Code compiles, lint passes, tests pass.
- No UI changes required to proceed.

Phase 2: Read Path (member-safe viewing)
Deliverables
- Photo read endpoints implemented with pre-filtering:
  - list events/albums (filtered)
  - list photos for event/album (filtered)
  - get signed URL or proxied image (policy enforced)
- Events widget read endpoints reviewed to match untrusted UI model
- Audit logging plumbing (read path metrics only, no edit yet)
Exit criteria
- Member-only access enforced end-to-end.
- No direct storage links exposed unless intentionally allowed and time-bounded.

Phase 3: Labeling (editor-only write path)
Deliverables
- Face label write endpoints (Photo Editor role only)
- Immutable audit log entries (append-only)
- Privacy preference enforcement at read time
Exit criteria
- All writes audited, all reads policy-filtered.

Phase 4: External Provider Option (SmugMug or other)
Deliverables
- Provider implementation behind PhotoStorageProvider
- Explicit risk posture:
  - If embedding external UI, access guarantees weaken
  - Prefer proxied images and signed URLs
Exit criteria
- Switching providers requires no widget rewrite.

Maintainability requirements (humans + agents)
- Keep interfaces small and stable.
- Prefer explicit types over clever code.
- Every endpoint has:
  - auth requirement
  - ViewerContext requirement
  - RBAC check
  - privacy filtering description
- Every module has:
  - README with invariants and examples
  - tests that fail closed (deny by default)
