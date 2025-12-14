Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

# Page Model and Rendering (v1)
Last updated: 2025-12-14

## Purpose
Define a safe, maintainable way to build and render pages at runtime using declarative "page documents".  
Pages are data. Rendering is code.

Goals:
- Non-technical volunteers can create and maintain pages safely.
- Role-aware experiences (RBAC) are enforced server-side.
- Edits are versioned, auditable, and reversible.
- The system remains maintainable by an hourly contractor or an AI assistant.

Non-goals (v1):
- Arbitrary HTML editing by general editors.
- User-supplied scripts.
- Visual design freedom that bypasses themes/tokens.

## Core Concepts
- Page: A logical page identified by slug and audience rules.
- Page Version: An immutable snapshot of the Page Document at publish time.
- Page Document: JSON that declares layout and blocks. It is not executable code.
- Block: A typed unit that renders via approved React components.
- Widget Block: A block whose content is computed at render time by a server-side widget runtime using RBAC-safe APIs.

## Governance: Widget Types and HTML Widgets
- Only the Tech Chair can make a new widgetType available to a club site (server-side allowlist).
- Only the Tech Chair can create/configure an HTML widget instance that contains raw HTML/JS.
- The HTML widget is an escape hatch and must follow docs/pages/HTML_WIDGET_POLICY.md.

## Data Model (Proposed Tables)
Pages and versions should be stored in Postgres.

Suggested tables:
- Page
  - id (uuid)
  - slug (string, unique)
  - title (string)
  - status (draft|published|archived)
  - visibilityPolicyId (uuid, optional)
  - createdAt, createdBy
  - updatedAt, updatedBy

- PageVersion
  - id (uuid)
  - pageId (uuid, fk)
  - versionNumber (int)
  - documentJson (jsonb)
  - publishedAt (timestamp)
  - publishedBy (uuid)
  - changeSummary (string, optional)

- PageDraft (optional in v1; may be stored as Page.status=draft + Page.documentJson)
  - id (uuid)
  - pageId (uuid)
  - documentJson (jsonb)
  - updatedAt, updatedBy

- VisibilityPolicy (optional in v1; may be embedded in Page Document initially)
  - id (uuid)
  - rulesJson (jsonb)
  - createdAt, createdBy

## Page Document (v1) Structure
The Page Document is declarative JSON with a schemaVersion.

Top-level:
- schemaVersion (int)
- layout (string)  
- regions (array of Region)

Region:
- id (string)  
- blocks (array of Block)

Block (common fields):
- id (string)
- type (string)
- props (object)
- visibility (optional object)

Visibility (v1):
- audience (public|member|admin|custom)
- groupsAny (array of group keys, optional)
- rolesAny (array of role keys, optional)

Widget Block:
- type = "widget"
- props.widgetType (string)
- props.config (object)
- props.instanceId (uuid, optional)

The Page Document must be validated server-side against a JSON schema and a whitelist of allowed block types and widget types.

## Runtime Rendering Flow
Server-rendered or hybrid rendering is acceptable.  
The key requirement is RBAC enforcement server-side.

Render flow:
1. Resolve the request context:
   - actor identity (anonymous or authenticated)
   - roles and groups
   - effective permissions

2. Load the page:
   - find Page by slug
   - load the currently published PageVersion (for public routes)
   - optionally load draft if in editor/preview mode and authorized

3. Validate and normalize:
   - validate schemaVersion
   - validate allowed blocks
   - validate widgetType allowlist (site-level)
   - fill defaults

4. Render blocks in order:
   - for content blocks, render via approved components
   - for widget blocks, call Widget Runtime:
     - enforce deny-by-default capabilities
     - fetch RBAC-filtered data via server APIs
     - return safe view model for rendering

5. Apply visibility:
   - do not rely on client-only filtering
   - remove blocks server-side that actor cannot see

## Widget Runtime: Safety Requirements
Widget runtime must:
- Enforce RBAC server-side for all data access.
- Deny by default any capability not explicitly allowed for that widget type.
- Log access for sensitive widgets (finance, membership, PII-adjacent).
- Avoid arbitrary query execution from page document config.
- Accept only validated configuration objects (schema per widgetType).

## Preview as Role (Admin-only)
Editors must be able to preview the page as:
- Anonymous
- Member
- Specific role (e.g., Chair, VP, Board)
- Specific group membership (v1: pick from existing groups)

Preview mode must never grant additional access.  
Preview only simulates visibility and rendered content.

## Themes and CSS (Integration Point)
Page documents must not contain CSS.  
Styling is controlled by:
- Theme tokens (design system variables)
- Approved layouts
- Component-level variants

Future extension:
- Allow per-page theme variant selection (e.g., "default", "event", "membership") with a limited whitelist.

## Audit and Rollback
- Every publish creates a new immutable PageVersion.
- A rollback operation sets the current published pointer to an earlier version (or creates a new version copying old content).
- All publishes and rollbacks are written to an audit log:
  - who
  - when
  - what page
  - from version -> to version
  - reason / changeSummary

## Open Questions (Track in issues)
- Do we store drafts as a separate table or on Page?
- Do we implement VisibilityPolicy as a reusable object in v1 or later?
- How do we localize page content in future versions?
