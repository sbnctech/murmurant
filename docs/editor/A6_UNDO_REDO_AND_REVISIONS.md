# A6: Undo/Redo and Revisions (SPEC ONLY)

Copyright (c) Santa Barbara Newcomers Club

**Status**: Draft Specification - No Implementation
**Depends on**: A1-A5 (ordering, editing, schemas, lifecycle, publishing surface)

## Summary

Define a minimal, safe undo/redo experience for the page editor that is appropriate for non-technical club admins and consistent with ClubOS reliability posture. This document specifies the approach; implementation follows in A7.

## Problem

Currently, editors can make mistakes with no built-in way to revert:

- Accidentally delete a block's content
- Reorder blocks incorrectly
- Remove a block they meant to keep
- Edit the wrong field

The only recovery path today is "Discard Draft" which loses ALL draft changes, or manually re-entering content. This is frustrating and error-prone for volunteer admins.

## Goals

1. Provide intuitive undo/redo for common editing mistakes
2. Maintain audit trail integrity (every applied undo/redo is logged)
3. Prevent accidental undos across publish boundaries
4. Keep the UX simple enough for non-technical users

## Non-Goals

- Collaborative editing / multi-user merge
- Branching or versioning across published history
- Time travel / full revision history browser
- Conflict resolution between concurrent editors
- Keyboard shortcuts (optional future enhancement)

## User Stories

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| U1 | Webmaster | Undo the last edit I made to a block | I can fix a typo I just introduced |
| U2 | Webmaster | Redo an undo if I changed my mind | I don't lose work I meant to keep |
| U3 | Webmaster | See that undo is unavailable after publishing | I understand the publish is a checkpoint |
| U4 | Webmaster | Have my undo history survive a page refresh | I don't lose my safety net mid-session |

## Recommended Approach: Option B (Server-Persisted Revision Stack)

### Options Considered

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A | Client-only session undo | Simple, no backend changes | Lost on refresh, no audit trail |
| B | Server-persisted revision stack | Survives refresh, auditable, bounded | More complex, storage cost |
| C | Snapshot-based "Restore previous" | Simple model, clear semantics | Not true undo/redo, coarse-grained |

### Decision: Option B

**Rationale**:

1. **Survives refresh** - Admins often refresh accidentally or navigate away; losing undo history is frustrating (violates U4)
2. **Auditable** - Every undo/redo writes an audit entry; Option A cannot do this reliably
3. **Bounded storage** - We cap at N revisions per draft (e.g., 20); old revisions pruned on save
4. **Aligns with Charter P7** - Full audit trail for privileged actions

## UX Sketch

### Toolbar Additions

```
[Undo] [Redo]   |   [Preview] [Discard Draft] [Publish]
```

- **Undo button**: Disabled when no undo history available
- **Redo button**: Disabled when no redo history available
- Both buttons disabled during save operations
- Both buttons disabled if page is ARCHIVED

### Behavior

| Action | Effect on Undo Stack | Effect on Redo Stack |
|--------|---------------------|----------------------|
| Edit block data | Push current state | Clear redo stack |
| Reorder blocks | Push current state | Clear redo stack |
| Add block | Push current state | Clear redo stack |
| Remove block | Push current state | Clear redo stack |
| Undo | Pop from undo, push to redo | - |
| Redo | Pop from redo, push to undo | - |
| Publish | Clear both stacks | Clear both stacks |
| Discard Draft | Clear both stacks | Clear both stacks |

### Visual Feedback

- Tooltip on Undo: "Undo last change" or "Nothing to undo"
- Tooltip on Redo: "Redo" or "Nothing to redo"
- Brief toast on undo/redo: "Undone: [action summary]"

## Data Model Implications (No Schema Changes in A6)

Future A7 will add:

```
model PageRevision {
  id            String   @id @default(uuid())
  pageId        String   @db.Uuid
  content       Json     // Snapshot of page.content at this point
  action        String   // "edit_block", "reorder", "add_block", "remove_block"
  actionSummary String?  // Human-readable: "Edited hero block"
  createdAt     DateTime @default(now())
  createdById   String?  @db.Uuid

  page Page @relation(fields: [pageId], references: [id], onDelete: Cascade)
}
```

- Revisions stored per-page, capped at 20 per draft session
- Cleared on publish or discard draft
- Index on (pageId, createdAt DESC) for efficient retrieval

## API Implications (No Code Changes in A6)

Future A7 will add:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/content/pages/[id]/undo` | POST | Apply undo, return new content |
| `/api/admin/content/pages/[id]/redo` | POST | Apply redo, return new content |
| `/api/admin/content/pages/[id]/revisions` | GET | List available undo/redo states |

All endpoints require `publishing:manage` capability.

## Audit Logging Requirements

| Action | Audit Entry |
|--------|-------------|
| Undo applied | `UNDO` with before/after snapshots |
| Redo applied | `REDO` with before/after snapshots |
| Revisions pruned | `REVISION_PRUNE` with count pruned |

These require adding `UNDO`, `REDO`, `REVISION_PRUNE` to the `AuditAction` enum in A7.

## Hard Constraints

1. **No undo across publish boundaries** - Publishing clears the revision stack. To "undo" a publish, user must use Discard Draft (which restores from publishedContent).

2. **Permission checks enforced** - Undo/redo endpoints check `publishing:manage` capability. No client-side bypass.

3. **No silent writes** - Every applied undo/redo creates an audit log entry with actor, timestamp, before/after.

4. **Bounded storage** - Maximum 20 revisions per page draft. Oldest pruned when limit exceeded.

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Undo after publish | Button disabled; stack was cleared |
| Undo after discard draft | Button disabled; stack was cleared |
| Refresh mid-session | Undo/redo available (server-persisted) |
| Concurrent edit by another user | Last write wins; undo applies to current user's view |
| Validation failure on redo | Show error, do not apply, keep redo available |
| Page archived | Undo/redo buttons disabled |

## Security and RBAC

- All revision operations require `publishing:manage` capability
- Revisions are scoped to page; no cross-page access
- Revision data is internal; not exposed in public routes
- Audit log entries include actor memberId for accountability

## Rollout Plan

| Phase | Milestone | Scope |
|-------|-----------|-------|
| A6 | Spec | This document (no code changes) |
| A7 | Implement | Schema migration, API endpoints, basic UI |
| A8 | Polish | Keyboard shortcuts, revision browser, pruning job |

## Acceptance Criteria (for A7 implementation)

- [ ] Undo button appears in editor toolbar
- [ ] Redo button appears in editor toolbar
- [ ] Undo reverts last block edit
- [ ] Redo re-applies undone edit
- [ ] Undo/redo survive page refresh
- [ ] Publish clears undo/redo stacks
- [ ] Discard Draft clears undo/redo stacks
- [ ] Each undo/redo creates audit log entry
- [ ] Revision stack capped at 20 entries
- [ ] Buttons disabled when stack empty
- [ ] Buttons disabled for archived pages

## Test Plan (for A7)

| Test | Type | Description |
|------|------|-------------|
| Undo single edit | Unit | Edit block, undo, verify restored |
| Redo after undo | Unit | Edit, undo, redo, verify content |
| Undo clears redo on new edit | Unit | Edit, undo, edit again, verify redo empty |
| Publish clears stacks | Unit | Edit, publish, verify undo disabled |
| Refresh persistence | Integration | Edit, refresh, verify undo available |
| Permission check | API | Non-admin cannot call undo endpoint |
| Audit logging | API | Verify UNDO action in audit log |
| Stack limit | Unit | Make 25 edits, verify only 20 revisions |

## See Also

- [A1: Block Ordering](./A1_BLOCK_ORDERING_UI_WIRING.md)
- [A2: Block Editing](./A2_BLOCK_EDITING_UI.md)
- [A3: Block Schemas](./A3_BLOCK_SCHEMAS_AND_EDITORS.md)
- [A4: Page Lifecycle](./A4_PAGE_LIFECYCLE_BASICS.md)
- [A5: Publishing Surface](./A5_PUBLISHING_SURFACE.md)
- [Architectural Charter](../ARCHITECTURAL_CHARTER.md) - P7 Audit Trail
- [Reliability Posture](../reliability/) - Deployment readiness
