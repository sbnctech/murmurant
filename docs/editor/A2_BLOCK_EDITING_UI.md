# Murmurant - A2 Block Editing UI

Status: Draft (implementation target)
Applies to: Admin editor
Last updated: 2025-12-21

## Goal

Enable inline editing of block content within the page editor. Each block shows an Edit button that reveals a form-based editor for that block's data fields. Changes persist to the database via API.

## Non-goals (explicit)

- Preview/publish workflow changes
- Rich text (WYSIWYG) editors for text blocks
- Image upload/media library integration
- Drag-and-drop field reordering within blocks
- Undo/redo history

## Acceptance criteria

1. Each block in the editor list displays an "Edit" button
2. Clicking "Edit" expands an inline editor panel below that block
3. Only one block can be edited at a time (opening another closes the current)
4. Editor panel displays form fields appropriate to the block type
5. "Save" button persists changes via `POST /api/admin/content/pages/[id]/blocks?action=update`
6. "Cancel" button discards unsaved changes and closes the panel
7. Saving shows a loading state and disables form controls
8. On save error, display error message and keep form open
9. On save success, collapse editor panel and update block data in list
10. Changes are visible immediately in the block list after save

## Data model

Blocks are stored in `Page.content` as JSON:

```json
{
  "schemaVersion": 1,
  "blocks": [
    { "id": "uuid", "type": "hero", "order": 0, "data": { ... } },
    { "id": "uuid", "type": "text", "order": 1, "data": { ... } }
  ]
}
```

The update API modifies the `data` field for a single block. Block `id`, `type`, and `order` are immutable via this action.

## API: POST /api/admin/content/pages/[id]/blocks?action=update

Request body:

```json
{
  "blockId": "uuid",
  "data": { ... }
}
```

Response (200):

```json
{
  "page": { ... },
  "block": { "id": "uuid", "type": "...", "order": N, "data": { ... } },
  "message": "Block updated"
}
```

Error responses:

- 401: Missing or invalid auth
- 404: Page not found
- 400: Block not found, invalid data, or validation errors

Authorization: Requires `publishing:manage` capability.

Audit log: Creates entry with `action: UPDATE`, `operation: update_block`, includes `before` and `after` block data.

## Block editor forms by type

Each block type has specific editable fields:

### hero

- title (text input, required)
- subtitle (text input)
- alignment (select: left/center/right)
- ctaText (text input)
- ctaLink (text input)
- ctaStyle (select: primary/secondary/outline)

### text

- content (textarea for HTML)
- alignment (select: left/center/right)

### image

- src (text input, required)
- alt (text input, required)
- caption (text input)
- alignment (select: left/center/right)
- linkUrl (text input)

### cta

- text (text input, required)
- link (text input, required)
- style (select: primary/secondary/outline)
- size (select: small/medium/large)
- alignment (select: left/center/right)

### divider

- style (select: solid/dashed/dotted)
- width (select: full/half/quarter)

### spacer

- height (select: small/medium/large)

### cards, event-list, gallery, faq, contact

These have nested/array data. Initial implementation will:

- Show read-only JSON view or simple summary
- Mark as "Advanced editing coming soon"

Full editing for complex block types is out of scope for A2.

## Component structure

```
PageEditorClient
├── BlockList
│   └── BlockItem (per block)
│       ├── BlockControls (Move Up/Down, Edit)
│       └── BlockEditorPanel (conditional)
│           └── [BlockTypeForm] (hero, text, etc.)
```

## Implementation constraints

- Single source of truth: `blocks` state in PageEditorClient
- Optimistic update: Update local state before API call
- Revert on failure: Restore previous state if API fails
- Form validation: Client-side required field checks before submit
- No external dependencies: Use native HTML form elements only

## Work checklist

- [x] Add `?action=update` handler to blocks API route
- [x] Add Edit button to each block in PageEditorClient
- [x] Add editing state: `editingBlockId: string | null`
- [x] Create BlockEditorPanel component
- [x] Create form components for simple block types (hero, text, image, cta, divider, spacer)
- [x] Add placeholder for complex block types (cards, event-list, gallery, faq, contact)
- [x] Wire save/cancel to API and state
- [x] Add API tests for update action
- [x] Add component tests for editor panel
- [x] Run typecheck and unit tests

## Related Documents

- [A1 Block Ordering UI Wiring](./A1_BLOCK_ORDERING_UI_WIRING.md) - Block ordering with Move Up/Down controls
- [A3 Block Schemas and Editors](./A3_BLOCK_SCHEMAS_AND_EDITORS.md) - Schema validation and improved editors
