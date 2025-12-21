# Page Editor v1.1 - Block Ordering Rules

**Status:** Draft
**Scope:** New pages only (no legacy page migration)
**Last Updated:** 2025-12-20

---

## Goal

Define how blocks can be ordered, moved, and constrained in the Page Editor. All reordering is explicit, user-initiated, and results in a direct 1:1 mapping between editor order and rendered output.

---

## Core Principle

**Order in editor == Order in render**

The array index of a block in `content.blocks[]` determines its position on the page. No intermediate layout engine, no implicit grouping, no smart positioning.

---

## 1. Allowed Operations

### 1.1 Move Up / Move Down

- Each block has visible "Move Up" and "Move Down" buttons
- Clicking "Move Up" swaps the block with the one above it
- Clicking "Move Down" swaps the block with the one below it
- Buttons are disabled (not hidden) when at boundary

### 1.2 Drag Handle (Optional - Phase 2)

- If implemented, each block shows a visible drag handle icon (grip dots)
- Drag only permitted via the handle (not the entire block)
- Drop indicator shows insertion point during drag
- Drop commits the reorder immediately

### 1.3 Keyboard Navigation (Accessibility)

- When a block is focused:
  - `Alt+ArrowUp` or `Ctrl+Shift+ArrowUp`: Move block up
  - `Alt+ArrowDown` or `Ctrl+Shift+ArrowDown`: Move block down
- Focus remains on the moved block after reorder
- Screen reader announces new position ("Block 3 of 5")

---

## 2. Disallowed Operations

| Operation | Reason |
|-----------|--------|
| **Nesting** | Blocks cannot contain other blocks. Flat array only. |
| **Auto-wrap** | No automatic grouping of adjacent blocks into containers. |
| **Grouping** | No "group these blocks" feature. Each block is independent. |
| **Columns/Grid** | No side-by-side block placement. Vertical stack only. |
| **Implicit reorder** | No "smart" reordering based on block type or content. |
| **Template injection** | Adding a template does not reorder existing blocks. |

---

## 3. Edge Cases

### 3.1 First Block

- "Move Up" button is **disabled** (visually grayed out)
- Keyboard shortcut `Alt+ArrowUp` is a **no-op** (no error, no feedback)
- Block remains in position

### 3.2 Last Block

- "Move Down" button is **disabled** (visually grayed out)
- Keyboard shortcut `Alt+ArrowDown` is a **no-op**
- Block remains in position

### 3.3 Single Block

- Both "Move Up" and "Move Down" are **disabled**
- Drag (if implemented) has no valid drop target

### 3.4 Empty Page

- No blocks to reorder
- "Add Block" is the only available action
- First block added becomes position 0

### 3.5 Concurrent Editing (Future)

- If two users edit the same page:
  - Last save wins (no merge)
  - Optimistic UI may show stale order until refresh
- Out of scope for v1.1

---

## 4. Failure Behavior

All failures are **no-op** (silent, no error toast, no state change):

| Scenario | Behavior |
|----------|----------|
| Move first block up | No-op |
| Move last block down | No-op |
| Drag block to invalid position | Snap back to original position |
| API returns error on save | Show error toast, revert to last saved state |
| Block ID not found | No-op (defensive, should not occur) |

### 4.1 Validation

- Block order is validated on save, not on each move
- Invalid order (duplicate indices, gaps) triggers save failure
- Client normalizes order before save: `blocks.map((b, i) => ({ ...b, order: i }))`

---

## 5. Data Model Impact

### 5.1 Schema (No Change)

```typescript
type PageContent = {
  schemaVersion: number;
  blocks: Block[];
};

type Block = {
  id: string;       // UUID, stable across reorders
  type: BlockType;  // "hero", "text", etc.
  order: number;    // 0-indexed position
  data: object;     // Block-specific content
};
```

### 5.2 Reorder Logic

```typescript
// Move block at index `from` to index `to`
function reorderBlocks(blocks: Block[], from: number, to: number): Block[] {
  const result = [...blocks];
  const [moved] = result.splice(from, 1);
  result.splice(to, 0, moved);
  return result.map((b, i) => ({ ...b, order: i }));
}
```

### 5.3 What Changes on Reorder

| Field | Changes? |
|-------|----------|
| `block.id` | No - stable identifier |
| `block.type` | No |
| `block.order` | **Yes** - renumbered 0 to N-1 |
| `block.data` | No |
| Array position | **Yes** - determines render order |

### 5.4 What Does NOT Change

- No new fields added to blocks
- No metadata (movedAt, movedBy, previousOrder)
- No separate ordering table
- No versioning of order history

---

## 6. Examples

### Example 1: Move Up

**Before:**
```
[0] Hero
[1] Text      <- user clicks "Move Up"
[2] Image
```

**After:**
```
[0] Text      <- now at top
[1] Hero
[2] Image
```

### Example 2: Move Down at Boundary

**Before:**
```
[0] Hero
[1] Text
[2] Image     <- user clicks "Move Down"
```

**After:**
```
[0] Hero
[1] Text
[2] Image     <- unchanged (no-op)
```

### Example 3: Drag Reorder

**Before:**
```
[0] Hero
[1] Text
[2] FAQ
[3] CTA       <- user drags to position 1
```

**After:**
```
[0] Hero
[1] CTA       <- dropped here
[2] Text
[3] FAQ
```

---

## 7. Non-Goals

The following are explicitly **out of scope** for v1.1:

- **Undo/Redo**: No history stack for block operations
- **Copy/Paste blocks**: No clipboard for blocks
- **Multi-select**: Cannot select and move multiple blocks at once
- **Block templates**: No "insert template" that adds multiple blocks
- **Responsive reorder**: No different order for mobile vs desktop
- **Animation**: No transition animations on reorder
- **Conflict resolution**: No merge strategy for concurrent edits

---

## 8. Open Questions

| # | Question | Status |
|---|----------|--------|
| 1 | Should drag-and-drop be included in v1.1 or deferred to v1.2? | **Pending** |
| 2 | Should we show a toast on successful reorder or keep it silent? | **Pending** |
| 3 | Should keyboard shortcuts be customizable? | **No** (hardcoded) |
| 4 | Should we support touch devices for drag? | **Deferred** to v1.2 |

---

## Summary

| Aspect | Decision |
|--------|----------|
| Data structure | Flat array, `order` field renumbered on change |
| Move operations | Up/Down buttons, optional drag, keyboard shortcuts |
| Nesting | Not supported |
| Grouping | Not supported |
| Failure mode | No-op (silent) |
| Validation | On save, not on each move |
| Concurrent edit | Last save wins |

---

*This document defines rules only. No code implementation included.*
