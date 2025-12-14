Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

# Navigation Model (v1)
Last updated: 2025-12-14

## Purpose
Define how menus (navigation) are constructed, stored, and rendered in a role-aware way.

Goals:
- Non-technical operators can manage navigation safely.
- Visitors see navigation appropriate to their membership/role/group.
- Multiple navigation styles are supported without rewriting content.
- Navigation changes are auditable and reversible.

Non-goals (v1):
- Arbitrary CSS/HTML in menus by general editors.
- Client-only hiding of unauthorized links.
- A complex “drag-anything-anywhere” site builder.

## Core Concepts
- Navigation Set: a named menu configuration (e.g., "primary", "footer", "member").
- Navigation Style: a rendering pattern (e.g., top bar, side rail, footer columns).
- Menu Item: a typed entry (link, header, divider, section).
- Visibility Rules: the conditions under which an item is shown.
- Policy Decision: visibility is decided server-side based on the actor context.

## Who Can Edit Navigation (v1)
Recommended permissions:
- nav:read (default)
- nav:edit (edit navigation draft)
- nav:publish (publish navigation)
- nav:admin (manage nav sets used by themes/layouts)

Default posture:
- A small set of trusted roles (Tech Chair + designated content admins) can edit and publish nav.
- Most editors manage pages, not global navigation.

## Data Model (Proposed)
Store navigation in Postgres with versioning.

Tables:
- NavigationSet
  - id (uuid)
  - key (string, unique)            "primary", "footer", "member"
  - title (string)
  - status (draft|published)
  - currentPublishedVersionId (uuid, fk)
  - createdAt, createdBy
  - updatedAt, updatedBy

- NavigationVersion
  - id (uuid)
  - navigationSetId (uuid, fk)
  - versionNumber (int)
  - documentJson (jsonb)
  - publishedAt (timestamp, nullable)
  - publishedBy (uuid, nullable)
  - changeSummary (string, optional)

Note:
- NavigationVersion mirrors PageVersion for operator familiarity.
- Rollback is pointer-based (fast rollback).

## Navigation Document (v1)
Top-level:
- schemaVersion (int)
- styleHints (optional object)     token-like hints, not CSS
- items (array of MenuItem)

MenuItem common fields:
- id (string)
- type (string)                   link|section|header|divider
- label (string, optional)
- visibility (optional object)

MenuItem types:

1) link
- label (string)
- href (string) OR pageSlug (string)
- target (sameTab|newTab, optional)
- iconKey (string, optional)
- badge (string, optional)

2) section
- label (string)
- items (array of MenuItem)

3) header
- label (string)

4) divider
- no props

Visibility (v1):
- audience (public|member|admin|custom)
- rolesAny (array of role keys, optional)
- groupsAny (array of group keys, optional)

Rules:
- Items are filtered server-side by visibility.
- A section is hidden if it has no visible children after filtering.
- pageSlug resolves to a page only if that page is visible to the actor.

## Multiple Navigation Styles
We support multiple navigation styles via:
- multiple Navigation Sets (primary/footer/member/etc.)
- theme/layout chooses which set(s) to render and where
- a renderer uses "style" (layout component) + "document" (data)

Examples of styles:
- Top bar (primary) + optional dropdown sections
- Side rail (member/admin dashboard)
- Footer columns (footer)

Style choice is not stored in each item as CSS. Instead:
- theme defines how a given nav set is rendered
- nav document may include minor style hints such as "compact" or "showIcons" (optional)

## Construction Workflow (Operator UX)
Two ways to build nav (v1):
A) Direct nav editor
- A simple tree editor for the Navigation Set:
  - add items
  - reorder
  - set visibility
  - set link target (pageSlug or URL)
  - preview as role
  - publish and rollback

B) Template-driven nav (optional)
- Theme can ship a default nav template.
- Operator can “copy to editable” to manage local nav thereafter.

## Rendering Workflow (Runtime)
When rendering any page:
1) Determine the active theme/layout for the page.
2) Determine which nav sets are required (e.g., primary + footer).
3) Load current published NavigationVersion for each required set.
4) Filter items server-side based on actor context:
   - anonymous/member/role/group
5) Resolve pageSlug -> href only if page is visible to actor.
6) Render using the theme’s nav components:
   - TopBarNav
   - SideRailNav
   - FooterNav

Security rule:
- Do not render links the actor cannot access.
- Do not rely on client-side hiding.

## Link Resolution
- For internal pages:
  - use pageSlug and generate href from routing rules
  - if the page is not visible, omit the item
- For external links:
  - allow https:// only by default
  - optional domain allowlist for “official” outbound links

## Admin vs Member Navigation
We keep separate nav sets:
- "primary" for public site
- "member" for authenticated members
- "admin" for admin console

Rationale:
- Keeps public navigation simple.
- Makes admin navigation explicit and auditable.

## Audit Log Events (Minimum)
- nav.created
- nav.draft.updated
- nav.published
- nav.rolledBack
- permission.changed (if nav permissions change)

Audit record includes:
- actorId
- timestamp
- navigationSet key
- fromVersion -> toVersion
- changeSummary

## Operational Safety
- Publish requires change summary (recommended).
- Preview as role must be one click.
- One-click rollback to previous version.
- Warn on broken external links (best-effort validation on save).
- Warn if a nav item points to a page slug that no longer exists.

## Open Questions
- Do we allow per-link "requiresAuth" flag, or rely only on visibility rules?
- Do we allow scheduled publish/unpublish for navigation (later)?
- Do we want a governance role beyond Tech Chair for site-wide nav editing (e.g., "Content Admin")?
