Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

# Preview-as-Role and Versioning
Last updated: 2025-12-14

## Purpose
Define the safety and governance model for previewing pages as different roles and for publishing with rollback.

## Preview-as-Role (Admin-only)
Preview-as-role is for understanding what a user will see.  
It is not a way to gain access.

Preview modes:
- Anonymous
- Member
- Selected role
- Selected group membership (from known groups)

Rules:
- Preview never bypasses RBAC checks for data access.
- Preview only changes the visibility evaluation and the widget render context.
- Preview is clearly labeled in the UI to avoid confusion.

Implementation notes:
- The server computes an "effective actor context" for preview.
- The widget runtime uses that effective context for RBAC filtering.
- Sensitive widgets may show redacted views or "not authorized" even in preview, unless the preview role truly has permission.

## Draft vs Published
- Draft is editable and not visible to normal users.
- Published is immutable per version.

Rules:
- Public routes load the currently published version.
- Editors can load drafts only if they have page:edit permission.
- Publishing creates a new PageVersion with a new version number.

## Publishing Workflow (v1)
Minimum:
- Validate the Page Document
- Save new PageVersion
- Update the "current published version" pointer for the Page
- Record an audit log entry

Recommended:
- Require a change summary on publish
- Require stronger permission for publish than for edit

## Rollback Workflow
Rollback options:
- Fast rollback: change the published pointer to a previous PageVersion
- Copy rollback: create a new PageVersion from an older version and publish it

Rules:
- Rollbacks are recorded in the audit log with reason.
- The UI must show which version is currently live.

## Audit Log Events (Minimum)
- page.created
- page.draft.updated
- page.published
- page.rolledBack
- widgetInstance.updated (if applicable)
- permission.changed (if applicable)

Each audit record should include:
- actorId
- timestamp
- entity type and id
- action
- metadata (page slug, from version, to version)

## Operational Safety for Volunteer Operators
- Make publish explicit and slightly slower than saving a draft.
- Provide "Preview as member" and "Preview as anonymous" as one-click options.
- Provide a one-click rollback to the previous version.
- Provide clear messages when a block or widget is hidden due to visibility rules.

## Open Questions
- Do we require two-person review for high-risk pages (finance) in v1?
- Do we want scheduled publish/unpublish in later versions?
