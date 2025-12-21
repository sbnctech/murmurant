# A7: Undo/Redo Implementation

## Overview

A7 implements the server-persisted revision stack for undo/redo functionality as specified in A6. This provides non-technical administrators with a familiar, forgiving editing experience while maintaining full audit trails.

## Features

- **Server-Persisted Revisions**: Undo/redo survives page refresh
- **Bounded Storage**: Maximum 20 revisions per page
- **Keyboard Shortcuts**: Cmd+Z (undo), Cmd+Shift+Z or Cmd+Y (redo)
- **Visual Indicators**: Button states + "X undos available" indicator
- **Full Audit Trail**: Every undo/redo operation is logged

## Architecture

### Data Model

```prisma
model PageRevision {
  id            String   @id @default(uuid())
  pageId        String
  content       Json     // Full page content snapshot
  action        String   // edit_block, reorder, add_block, remove_block, edit_metadata
  actionSummary String?  // Human-readable: "Edited hero block"
  stackPosition Int      // Positive = undo available, Negative = redo available
  createdAt     DateTime @default(now())
  createdById   String?

  page      Page    @relation(...)
  createdBy Member? @relation(...)
}
```

### Stack Position System

- **Position > 0**: Available for undo (position 1 is most recent)
- **Position < 0**: Available for redo (position -1 is most recent)
- When undoing: Position 1 moves to -1, all others shift
- When redoing: Position -1 moves to 1, all others shift
- New edits clear all redo entries (positions < 0)

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/content/pages/[id]/undo` | POST | Apply undo |
| `/api/admin/content/pages/[id]/redo` | POST | Apply redo |
| `/api/admin/content/pages/[id]/revisions` | GET | Get revision state |

All endpoints require `publishing:manage` capability.

### Responses

```typescript
// Undo/Redo response
{
  success: boolean;
  content: PageContent;
  actionSummary: string;
  revisionState: {
    canUndo: boolean;
    canRedo: boolean;
    undoCount: number;
    redoCount: number;
    currentPosition: number;
    totalRevisions: number;
  };
}
```

## Integration Points

### Block Operations

All block operations now:

1. Create a revision snapshot BEFORE applying changes
2. Include `revisionState` in API responses
3. Support undo/redo for:
   - Block edits (`edit_block`)
   - Block reorder (`reorder`)
   - Block add (`add_block`)
   - Block remove (`remove_block`)

### Lifecycle Boundaries

Revisions are **cleared** on:

- **Publish**: Content becomes the new baseline
- **Discard Draft**: Content reverts to published state

This ensures no undo across publish boundaries, as specified in A6.

## UI Components

### Undo/Redo Buttons

Located in the blocks header:

```
Blocks (3)                          [Undo] [Redo]  3 undos available
```

- Buttons disabled when no undo/redo available
- Tooltips show keyboard shortcuts
- Loading states during operations

### Keyboard Shortcuts

- **Cmd+Z** (Mac) / **Ctrl+Z** (Windows): Undo
- **Cmd+Shift+Z** (Mac) / **Ctrl+Shift+Z** (Windows): Redo
- **Cmd+Y** (Mac) / **Ctrl+Y** (Windows): Redo (Windows style)

### Audit Log Integration

New action colors in audit log panel:

- **UNDO**: Purple (`#9c27b0`)
- **REDO**: Deep purple (`#673ab7`)

## Files Changed

### New Files

- `src/lib/publishing/revisions.ts` - Core revision management
- `src/app/api/admin/content/pages/[id]/undo/route.ts` - Undo endpoint
- `src/app/api/admin/content/pages/[id]/redo/route.ts` - Redo endpoint
- `src/app/api/admin/content/pages/[id]/revisions/route.ts` - State endpoint
- `tests/unit/publishing/revisions.spec.ts` - Unit tests

### Modified Files

- `prisma/schema.prisma` - Added PageRevision model, UNDO/REDO to AuditAction
- `src/lib/publishing/index.ts` - Export revisions module
- `src/lib/publishing/permissions.ts` - UNDO/REDO in createAuditLog types
- `src/app/api/admin/content/pages/[id]/route.ts` - Clear revisions on publish/discard
- `src/app/api/admin/content/pages/[id]/blocks/route.ts` - Create revisions
- `src/app/api/admin/content/pages/[id]/blocks/[blockId]/route.ts` - Create revisions
- `src/app/admin/content/pages/[id]/PageEditorClient.tsx` - Undo/redo UI

## Testing

### Unit Tests

```bash
npm run test:unit tests/unit/publishing/revisions.spec.ts
```

Tests cover:

- Action summary generation
- Revision state interface shapes
- MAX_REVISIONS constant

### Manual Testing

1. Create or edit a page
2. Make several block edits
3. Verify undo/redo buttons enable
4. Test keyboard shortcuts
5. Verify revision indicator updates
6. Publish page and verify revisions clear
7. Check audit log for UNDO/REDO entries

## Charter Compliance

- **P4** (Capability Enforcement): All endpoints require `publishing:manage`
- **P7** (Audit Trail): Every undo/redo creates audit log entry
- **P5** (Progressive Enhancement): Graceful fallback if revisions unavailable
- **N5** (Ad-hoc Permissions): Uses standard capability system
