Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

# Blocks and Widgets (v1)
Last updated: 2025-12-14

## Purpose
Define the initial block palette and the widget contract used by the Page Document.  
Keep the palette intentionally small for safety and maintainability.

## Design Principles
- Small number of block types, each with clear behavior.
- No arbitrary HTML injection by default.
- All blocks must be renderable server-side.
- Widgets are configured declaratively but execute safely via server code.
- Data access for widgets is always RBAC-filtered server-side.
- "Deny by default" for any capability not explicitly allowed.

## Governance: Who Can Add Widget Types
Only the Tech Chair can make a new widgetType available to a club site.

Rule:
- widgetType is a server-side allowlist (code + config) controlled by the Tech Chair.
- Non-Tech-Chair editors may only choose from the allowlist.

Rationale:
- New widget types imply new capabilities, data access patterns, and security posture.

## Block Types (v1)
Recommended initial set:

Content blocks:
- heading
- richText
- divider
- callout
- buttonRow
- image
- spacer

Structure blocks:
- section
- columns

Widget blocks:
- widget

Special (restricted) widget types:
- htmlEmbedWidget (Tech Chair only; see HTML widget policy)

Notes:
- section and columns may be implemented as layout constructs rather than blocks, but v1 can keep them as blocks for simplicity.
- image should support alt text and optional caption.

## Block Specs (v1)
All blocks share:
- id (string)
- type (string)
- props (object)
- visibility (optional object)

### heading
props:
- level (1-3)
- text (string)

### richText
props:
- format (string, default "tiptap-json")
- content (object)

### divider
props:
- variant (string, optional)

### callout
props:
- tone (info|warning|success|neutral)
- title (string, optional)
- content (rich text object)

### buttonRow
props:
- buttons (array)
  - label (string)
  - href (string)
  - variant (primary|secondary|link)
  - requiresAuth (bool, optional)

### image
props:
- assetId (uuid) or src (string, for public assets only)
- alt (string)
- caption (string, optional)
- size (small|medium|large, optional)

### spacer
props:
- size (xs|sm|md|lg)

### columns
props:
- columns (2|3)
- gap (sm|md|lg)
- blocksLeft (array of blocks)
- blocksRight (array of blocks)
- blocksThird (array of blocks, optional)

## Widget Block Contract (v1)
type = "widget"

props:
- widgetType (string)
- config (object)
- instanceId (uuid, optional)

Rules:
- widgetType must be in an allowlist controlled by the Tech Chair.
- config must pass widgetType-specific schema validation.
- instanceId references persistent widget-owned state (if needed).
- widgets must not accept raw SQL, raw queries, or executable code via config.

Widget types (initial candidates):
- eventList
- announcementList
- quickLinks
- photoGallery
- adminQueueSummary (admin-only)
- htmlEmbedWidget (restricted; Tech Chair only)

## Widget Size and Editor UX
Widgets should be handled consistently in the Page Document, but editor UX may differ:

Small widgets:
- Inline preview in the editor
- Simple config panel

Large widgets:
- Collapsed block in the editor with a clear title and summary
- "Configure" opens a side panel
- Optional full-preview modal

The page editor configures placement and presentation.  
Domain editors manage underlying content and assets.

## Persistent Data: Three Categories
A) Presentation config (per page placement)
- Stored in Page Document config

B) Domain data (system-of-record)
- Stored in first-class tables (events, members, finance, photos)
- Accessed through RBAC-safe server APIs

C) Widget-owned persistent state (rare)
- Stored in WidgetInstance table keyed by instanceId
- Must be auditable and RBAC-controlled
- Must never allow arbitrary query execution

## Validation and Backward Compatibility
- Page Document has schemaVersion.
- Each block and widget must have a stable schema.
- When schemaVersion increases, provide a migration step:
  - either a server-side normalize step or a stored migration for versions.

## Security Notes
- Widget config must never include raw SQL, arbitrary filters, or code.
- If a widget supports filters/sorts, they must be from a whitelist and interpreted server-side.
- The widget runtime must enforce deny-by-default capabilities.

## HTML Widget (Special Case)
The HTML widget is a privileged escape hatch and must follow a separate policy:
- docs/pages/HTML_WIDGET_POLICY.md
