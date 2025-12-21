# Editor Rules (Non-Negotiable Invariants)

These are invariants. If any rule is violated, it is a bug.

## Scope Guardrails

- The editor is for NEW pages only.
- The editor MUST NOT modify, migrate, or reinterpret any legacy page.
- The editor MUST NOT change global navigation by default.

## Explicitness

- Nothing happens unless explicitly configured in the page data.
- No inferred hierarchy.
- No auto-generated menus.
- No implicit SEO behavior.

## Rendering Contract

- Production rendering is the source of truth.
- Preview MUST match production output exactly.
- No preview-only features.
- No editor-only rendering branches.

## Data Model Discipline

- A page is defined by stored page data, not runtime inference.
- Stored page data MUST be sufficient to explain all rendered output.
- No hidden server-side lookups that change meaning of the stored data.

## Feature Opt-In

- All optional UX features are OFF by default.
- Each optional feature must have an explicit per-page flag.
- Feature flags are evaluated per page, not globally.

## Breadcrumbs (v1)

- Breadcrumbs are hidden by default.
- Breadcrumbs require explicit per-page opt-in.
- Breadcrumbs are manually defined (no inference).
- Breadcrumbs are presentational only.
- Breadcrumbs MUST NOT affect routing, navigation, access control, or hierarchy.

## Safety and Failure Behavior

- Malformed data MUST NOT crash the page.
- Malformed data MUST degrade safely by disabling only the malformed feature.
- The page should remain readable and usable.

## Access and Crawl Control (IP Protection)

- Admin/editor surfaces MUST be non-indexable.
- Member-only or internal pages MUST default to non-indexable unless explicitly enabled.
- Crawlers must not be able to discover drafts, admin routes, or internal JSON endpoints via links.

## Testing Requirements

- Every invariant must have an acceptance test (prose or automated).
- Any new feature must include:
  - a rule update (if it changes invariants)
  - an acceptance test update
  - a rendering proof that preview matches production

## Change Control

- New capabilities must be additive and explicit.
- No breaking changes to stored page data formats without a migration plan.
- Migration plans must be reversible, testable, and isolated.

