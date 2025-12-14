Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

# Page Editor (v1)
Last updated: 2025-12-14

## Purpose
Define a page editing experience suitable for non-technical volunteers and admins.  
The editor assembles typed blocks and configures widgets safely.

## Target Personas
- Older volunteer admins (little to no technical background)
- Committee chairs and officers who need to update content occasionally
- Technical chair or contractor who maintains templates and themes
- Support chatbot (read-only) that helps explain what is visible and why

## Editor Style Recommendation
Block-based editor with guardrails:
- Notion-like block composition
- Strong block palette restrictions
- Role-aware preview
- Draft/publish workflow with versioning and rollback

For rich text inside blocks:
- Use a proven editor (example: Tiptap / ProseMirror family)
- Store rich text as structured JSON, not HTML

## Core Editor Capabilities (v1)
1) Create and manage pages
- Create page (slug, title)
- Edit draft
- Publish and rollback
- Archive page

2) Compose page
- Add blocks from allowed palette
- Reorder blocks (drag handle)
- Edit block props
- Insert widget blocks and configure widget settings

3) Preview
- Preview the page as:
  - Anonymous
  - Member
  - Selected role
  - Selected group membership
- Preview must not grant additional access; it only simulates visibility.

4) Safety and supportability
- Autosave drafts
- Clear validation errors (human-readable)
- Change summary required on publish (recommended; may be optional in v1)
- Audit log entries for publish and rollback

## Widget Availability and Restrictions
- The widget palette is driven by a server-side allowlist controlled by the Tech Chair.
- Non-Tech-Chair editors can only select existing approved widget types.
- Only the Tech Chair can:
  - add/enable a new widget type for a site
  - create or configure an HTML widget instance that contains raw HTML/JS (see HTML widget policy)

Editor UX requirement:
- Restricted widgets must be visibly labeled (e.g., "Tech Chair only").
- Attempting to edit or publish restricted widget content without permission must fail with a clear message.

## Editor UX Patterns (v1)
- Left: page outline (regions and blocks)
- Center: live preview
- Right: properties panel for selected block/widget

Block controls:
- Add block above/below
- Duplicate block
- Delete block
- Move block up/down

Widget controls:
- Title and widgetType label always visible
- Summary of key settings
- "Configure" opens a panel
- Large widgets may show a placeholder preview or open a modal preview

## Permissions (v1)
Define editor permissions:
- page:read (view published)
- page:edit (edit drafts)
- page:publish (publish/rollback)
- page:admin (manage visibility policies, layouts, templates)
- widget:catalog:admin (Tech Chair only; manage widget allowlist)
- widget:html:admin (Tech Chair only; create/configure HTML widgets)

Default posture:
- Most volunteers can read.
- Only designated roles can edit.
- Publish is limited to a small set of roles.
- Widget catalog and HTML widgets are Tech Chair only.

## Themes and Templates (v1)
A page chooses from an allowlist:
- layout (e.g., default, landing, dashboard)
- template (optional; a starter Page Document)
- themeVariant (optional; limited set)

Editors cannot write CSS.  
Themes and CSS are maintained by technical roles.

## Accessibility Requirements (v1)
- Heading levels must be valid
- Images require alt text
- Buttons must have accessible labels
- Color/tone choices must remain accessible in themes

## Reliability Requirements
- Draft saving must be robust under poor connectivity.
- Editor must provide clear confirmation on save/publish.
- If preview rendering fails, the editor must show an understandable error and preserve the draft.

## Open Questions
- Do we allow inline editing in the preview, or edit in the side panel only?
- Do we support multi-region layouts in v1 or keep a single main region?
- Do we allow per-block visibility settings in v1 or only per-page visibility?
