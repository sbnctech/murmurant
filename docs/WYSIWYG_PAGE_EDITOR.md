# WYSIWYG Page Editor

## Overview

The WYSIWYG Page Editor provides a drag-and-drop interface for creating and editing pages in ClubOS. It supports SBNC's publishing needs including public and member-only pages while maintaining compatibility with themes and templates.

## Architecture

### Technology Stack

- **Drag-and-Drop:** @dnd-kit (core, sortable, utilities)
- **Rich Text Editing:** Tiptap (React-based ProseMirror wrapper)
- **Framework:** React 19 with Next.js 16 App Router

### Component Structure

```
src/components/editor/
├── PageEditor.tsx         # Main editor orchestrator
├── BlockPalette.tsx       # Block type selection panel
├── SortableBlockList.tsx  # Drag-drop block list with @dnd-kit
├── BlockEditors.tsx       # Individual block type editors
└── RichTextEditor.tsx     # Tiptap-based rich text for text blocks
```

### Routes

- `/admin/content/pages` - Page list (existing)
- `/admin/content/pages/new` - Create new page
- `/admin/content/pages/[id]` - Edit existing page

## Block Types

The editor supports 11 block types organized by category:

### Content

- **Hero** - Full-width header with background image, title, subtitle, CTA
- **Text** - Rich text content with formatting (bold, italic, lists, headings)
- **Cards** - Grid of content cards (2-4 columns)
- **FAQ** - Accordion-style Q&A sections

### Media

- **Image** - Single image with alt text, caption, optional link
- **Gallery** - Image grid with optional lightbox

### Interactive

- **Event List** - Dynamic list of upcoming events (widget)
- **Contact** - Contact form with configurable fields
- **CTA** - Call-to-action button with customizable style

### Layout

- **Divider** - Horizontal line separator
- **Spacer** - Vertical spacing control

## Features

### Drag-and-Drop Reordering

Blocks can be reordered by dragging the handle on the left side. Uses @dnd-kit for accessible, keyboard-navigable drag-and-drop.

### Rich Text Editing

Text blocks use Tiptap editor with toolbar for:

- Bold, italic, strikethrough
- Headings (H2, H3)
- Bullet and numbered lists
- Blockquotes
- Undo/redo

### Page Lifecycle

Pages follow the status workflow:

- **DRAFT** - Initial state, not visible to public
- **PUBLISHED** - Visible according to visibility settings
- **ARCHIVED** - Hidden from all users

### Visibility Settings

- **PUBLIC** - Visible to everyone
- **MEMBERS_ONLY** - Requires authentication
- **ROLE_RESTRICTED** - Requires specific role (with audience rules)

### Auto-Save Warning

The editor warns users before navigating away with unsaved changes via `beforeunload` event.

### Preview

Inline preview iframe shows live changes (requires page to be saved first).

## Permissions

The editor requires `publishing:manage` capability, which is granted to:

- webmaster
- admin

The webmaster role can create, edit, and publish pages but cannot delete published pages (requires `admin:full`).

## API Endpoints

All endpoints require `publishing:manage` capability.

### List Pages

```
GET /api/admin/content/pages
Query: page, pageSize, status, visibility, search
```

### Create Page

```
POST /api/admin/content/pages
Body: { slug, title, description?, visibility?, content? }
```

### Get Page

```
GET /api/admin/content/pages/[id]
```

### Update Page

```
PUT /api/admin/content/pages/[id]
Body: { title?, slug?, description?, visibility?, content?, seoTitle?, seoDescription? }
```

### Delete Page

```
DELETE /api/admin/content/pages/[id]
Note: Deleting PUBLISHED pages requires admin:full
```

### Publish/Unpublish/Archive

```
POST /api/admin/content/pages/[id]?action=publish
POST /api/admin/content/pages/[id]?action=unpublish
POST /api/admin/content/pages/[id]?action=archive
```

## Future Enhancements

### Planned Widget Blocks

- Event list (implemented)
- Mentorship card
- Member directory
- Photo gallery from events

### Advanced Features

- Custom CSS per page (Tech Chair role only)
- Template-based page creation
- Scheduled publishing
- Page versioning/history
- Asset manager integration

## Testing

E2E tests in `tests/admin/admin-content-page-editor.spec.ts` cover:

- Creating new pages with blocks
- Adding and reordering blocks
- Editing block content
- Publish/unpublish workflow
- Unsaved changes warning
- Deleting blocks
- Block palette completeness

Run tests:

```bash
npx playwright test tests/admin/admin-content-page-editor.spec.ts
```

## Configuration

No additional configuration required. The editor uses existing theme system for styling previews.

## Troubleshooting

### Blocks Not Saving

Ensure you click "Save" before publishing. Unsaved changes prevent publishing.

### Preview Not Updating

The preview iframe loads the public page URL. Save changes first, then refresh preview.

### Rich Text Formatting Lost

Content is stored as HTML. Ensure the BlockRenderer component handles all formatting tags.
