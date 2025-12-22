# A5: Publishing Surface + Admin Listing Polish

## Summary

This milestone adds the public-facing page rendering routes and polishes the admin page listing with lifecycle indicators. It builds on A4's lifecycle state machine to expose content through public URLs while maintaining proper content separation.

## Principles Applied

- **P1: Provable Identity** - Preview route requires authentication with content admin role
- **P2: Object-Scoped Authorization** - Only content admins can access preview; public route checks page status
- **P3: Explicit State Machine** - Content selection follows mode-based rules (published/draft/preview)
- **P7: Audit Trail** - Activity log panel shows all page lifecycle events

## Features Implemented

### 1. Admin Pages Index Polish (`/admin/content/pages`)

Enhanced the pages listing with:

- **Status Badge** - Color-coded DRAFT/PUBLISHED/ARCHIVED badge
- **Has Changes Indicator** - Yellow badge when draft differs from published content
- **Published Date Column** - Shows when page was last published
- **Quick Actions Column**:
  - Edit - Opens page editor
  - View - Opens published page (only for PUBLISHED pages)
  - Preview - Opens preview with draft content

### 2. Public Page Route (`/pages/[slug]`)

Renders published content for public consumption:

- Uses `publishedContent` (frozen snapshot), not `content` (working draft)
- Returns 404 for DRAFT or ARCHIVED pages
- Returns 404 for MEMBERS_ONLY or ROLE_RESTRICTED pages (login redirect in future)
- Applies theme CSS variables

### 3. Preview Route (`/pages/[slug]/preview`)

Shows draft content for content admins:

- Requires authentication (redirects to login if not authenticated)
- Requires content admin role (webmaster/communications-chair)
- Shows preview banner with:
  - "Has unpublished changes" indicator
  - "Not yet published" indicator for drafts
  - Link to editor
  - Link to published version (if published)
- Uses preview content selection mode (prefer draft, fallback to published)

### 4. Content Selection Logic (`contentSelection.ts`)

Centralized content selection:

```typescript
selectContent(content, publishedContent, mode) -> ContentSelectionResult
```

Modes:

- **published** - Always returns publishedContent (public route)
- **draft** - Returns content (editor)
- **preview** - Prefers content, falls back to publishedContent

Helper functions:

- `detectDraftChanges(content, publishedContent)` - JSON deep comparison
- `isPagePubliclyVisible(status, publishedContent)` - Check if page should be public
- `hasPreviewableDraft(content, publishedContent)` - Check if draft exists

### 5. Audit Log Panel (Page Editor)

Collapsible panel showing last 10 activity entries:

- Action badge (CREATE, UPDATE, PUBLISH, UNPUBLISH, DISCARD_DRAFT, etc.)
- Action summary
- Actor name
- Timestamp

API endpoint: `GET /api/admin/content/pages/[id]/audit`

## Content Flow Diagram

```
                                   ┌─────────────────┐
                                   │   Editor        │
                                   │   (content)     │
                                   └────────┬────────┘
                                            │ save
                                            ▼
┌────────────┐    publish    ┌─────────────────────────┐
│  content   │ ────────────► │   publishedContent      │
│  (draft)   │               │   (frozen snapshot)     │
└────────────┘               └───────────┬─────────────┘
       │                                 │
       │ preview mode                    │ published mode
       ▼                                 ▼
┌────────────────┐               ┌────────────────┐
│ /pages/[slug]/ │               │ /pages/[slug]  │
│    preview     │               │   (public)     │
└────────────────┘               └────────────────┘
```

## Files Changed

### New Files

- `src/lib/publishing/contentSelection.ts` - Content selection logic
- `src/app/(public)/[slug]/preview/page.tsx` - Preview route
- `src/app/api/admin/content/pages/[id]/audit/route.ts` - Audit log API
- `tests/unit/publishing/contentSelection.spec.ts` - Unit tests (26 tests)
- `docs/editor/A5_PUBLISHING_SURFACE.md` - This document

### Modified Files

- `src/app/api/admin/content/pages/route.ts` - Added hasDraftChanges to list
- `src/app/admin/content/pages/PagesTable.tsx` - Added columns and indicators
- `src/app/(public)/[slug]/page.tsx` - Use publishedContent via selectContent
- `src/app/admin/content/pages/[id]/PageEditorClient.tsx` - Added AuditLogPanel

## API Changes

### GET `/api/admin/content/pages`

Response now includes:

```typescript
{
  items: Array<{
    id: string;
    slug: string;
    title: string;
    status: string;
    visibility: string;
    publishedAt: string | null;
    updatedAt: string;
    hasDraftChanges: boolean;  // NEW
  }>;
  // ... pagination
}
```

### GET `/api/admin/content/pages/[id]/audit`

New endpoint:

```typescript
{
  entries: Array<{
    id: string;
    action: string;
    timestamp: string;
    actor: {
      id: string | null;
      name: string;
    };
    summary: string;
  }>;
}
```

## Test Coverage

- 26 unit tests for content selection logic
- Existing A4 tests cover lifecycle operations

## Next Steps (A6+)

- Navigation tree rendering
- Template-based page creation
- Media library integration
- SEO/meta fields editing
