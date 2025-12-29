# Murmurant - A4 Page Lifecycle Basics

Status: Implemented
Applies to: Admin editor
Last updated: 2025-12-21
Depends on: A1 Block Ordering, A2 Block Editing, A3 Block Schemas

## Goal

Enable correct Draft vs Published semantics in the page editor without changing
publishing/preview plumbing beyond what is required for lifecycle correctness.

## In-Scope

- Page lifecycle state machine (DRAFT -> PUBLISHED -> ARCHIVED)
- Publish action: copies content to publishedContent, updates status
- Unpublish action: sets status back to DRAFT
- Discard draft action: restores content from publishedContent
- Status banner in editor UI showing current state
- Draft changes indicator when published page has unsaved edits
- Confirmation modals for lifecycle actions

## Out-of-Scope (Explicit)

- Drag-and-drop block ordering
- Preview token system
- Public site rendering changes
- Reliability mechanism enablement (WRITE_GUARD, PUBLISH_GUARD remain inert)
- Scheduled publishing
- Version history / rollback UI

## Data Model

### Page Table Changes

Added field:
- `publishedContent` (JSON, nullable): Frozen snapshot of content when published

Existing fields used:
- `status` (PageStatus enum: DRAFT | PUBLISHED | ARCHIVED)
- `publishedAt` (DateTime, nullable): When page was last published
- `content` (JSON): Working draft content (blocks)

### Content Semantics

- `content`: Always contains the working draft. Edits always modify this.
- `publishedContent`: Contains the frozen snapshot from last publish. Immutable unless
  explicitly republished or page is unpublished.

## State Machine

```
                    publish
   +-------+  ----------------->  +-----------+
   | DRAFT |                      | PUBLISHED |
   +-------+  <-----------------  +-----------+
                   unpublish            |
       |                                |
       |           archive              v
       +----------------------->  +----------+
                                  | ARCHIVED |
       <------------------------  +----------+
                                (no transitions out)

Special action:
- discardDraft: Only valid when PUBLISHED with hasDraftChanges=true
                Copies publishedContent back to content
```

### Transition Rules

| Current Status | Allowed Actions                          |
|----------------|------------------------------------------|
| DRAFT          | publish, archive                         |
| PUBLISHED      | unpublish, archive, discardDraft (if changes) |
| ARCHIVED       | (none - requires admin restoration)      |

### Draft Change Detection

`hasDraftChanges = JSON.stringify(content) !== JSON.stringify(publishedContent)`

When publishedContent is null (never published), hasDraftChanges is always false.

## API Endpoints

### POST /api/admin/content/pages/[id]?action={action}

All actions require `publishing:manage` capability.

#### ?action=publish

Publishes the page by:
1. Copying current `content` to `publishedContent`
2. Setting `status` to "PUBLISHED"
3. Setting `publishedAt` to current timestamp
4. Creating audit log entry

Response (200):
```json
{
  "page": { ... },
  "message": "Page published successfully"
}
```

Errors:
- 400: Cannot publish an archived page
- 401: Missing or invalid auth
- 404: Page not found

#### ?action=unpublish

Unpublishes the page by:
1. Setting `status` to "DRAFT"
2. Keeping `publishedContent` for reference
3. Creating audit log entry

Response (200):
```json
{
  "page": { ... },
  "message": "Page unpublished"
}
```

Errors:
- 400: Cannot unpublish a draft page
- 401: Missing or invalid auth
- 404: Page not found

#### ?action=discardDraft

Discards draft changes by:
1. Copying `publishedContent` back to `content`
2. Creating audit log entry

Response (200):
```json
{
  "page": { ... },
  "message": "Draft changes discarded"
}
```

Errors:
- 400: No draft changes to discard (content === publishedContent)
- 400: Cannot discard draft on non-published page
- 401: Missing or invalid auth
- 404: Page not found

#### ?action=archive

Archives the page by:
1. Setting `status` to "ARCHIVED"
2. Creating audit log entry

Response (200):
```json
{
  "page": { ... },
  "message": "Page archived"
}
```

Errors:
- 400: Cannot archive an already archived page
- 401: Missing or invalid auth
- 404: Page not found

## UI Components

### Lifecycle Status Banner

Located at the top of the page editor, shows:
- Status badge (DRAFT/PUBLISHED/ARCHIVED with color coding)
- Draft changes indicator (when PUBLISHED with unsaved edits)
- Last published timestamp

Colors:
- DRAFT: Orange background, orange badge
- PUBLISHED: Green background, green badge
- ARCHIVED: Gray background, gray badge

### Action Buttons

Conditionally rendered based on lifecycle state:

| Button | Shown When |
|--------|------------|
| Publish | status=DRAFT OR (status=PUBLISHED AND hasDraftChanges) |
| Publish Changes | status=PUBLISHED AND hasDraftChanges |
| Discard Draft | status=PUBLISHED AND hasDraftChanges |
| Unpublish | status=PUBLISHED |

### Confirmation Modal

All lifecycle actions show a confirmation modal with:
- Action-specific title and message
- Cancel button
- Confirm button (colored appropriately)
- Loading state during API call

## Testing

### Unit Tests (tests/unit/publishing/pageLifecycle.spec.ts)

- State transition validation (isValidTransition)
- Next status calculation (getNextStatus)
- Draft change detection (hasDraftChanges)
- Lifecycle state computation (computeLifecycleState)
- Message generation (getLifecycleMessage)
- Audit data generation (getLifecycleAuditData)

### API Tests (tests/admin/admin-page-editor-blocks.spec.ts)

- 401 without auth for all lifecycle actions
- 404 for non-existent page
- 400 for invalid action parameter
- State machine validation

## Manual Test Checklist

- [ ] Create new page (status should be DRAFT)
- [ ] DRAFT page shows Publish button, no Unpublish or Discard
- [ ] Click Publish -> confirmation modal appears
- [ ] Confirm Publish -> status changes to PUBLISHED, publishedAt shown
- [ ] Edit a block on PUBLISHED page -> Draft changes indicator appears
- [ ] Publish Changes and Discard Draft buttons now visible
- [ ] Click Discard Draft -> content reverts to published version
- [ ] Click Unpublish -> status changes to DRAFT
- [ ] Buttons update based on new status
- [ ] Lifecycle actions show loading state during API call
- [ ] API errors display in error box

## Related Documents

- [A1 Block Ordering UI Wiring](./A1_BLOCK_ORDERING_UI_WIRING.md)
- [A2 Block Editing UI](./A2_BLOCK_EDITING_UI.md)
- [A3 Block Schemas and Editors](./A3_BLOCK_SCHEMAS_AND_EDITORS.md)
