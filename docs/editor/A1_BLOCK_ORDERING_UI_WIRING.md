# ClubOS - A1 Block Ordering UI Wiring

Status: Draft (implementation target)
Applies to: Admin editor
Last updated: 2025-12-21

Goal:
Enable deterministic block ordering with simple Move Up / Move Down controls.
No drag-and-drop. No publish plumbing beyond existing spec.

Non-goals (explicit):
- Drag-and-drop ordering
- Lifecycle orchestration
- Preview/publish plumbing changes
- Reliability enablement (guards remain inert if present)

Acceptance criteria:
- Blocks render in stable order defined by persisted field (e.g., orderIndex or position).
- Admin can move a block up/down; order persists after reload.
- Cannot move first block up or last block down (buttons disabled).
- Reordering does not change block content; only ordering metadata.
- Component tests cover:
  - initial order render
  - move up/down updates UI order
  - disabled buttons at boundaries
  - persistence call invoked with correct payload

Implementation notes (constraints):
- Ordering must be explicit and deterministic.
- One source of truth for order (no derived ordering in UI).
- All writes must use existing write wrapper if present.

Work checklist:
- [ ] Confirm current data model for block ordering (field name and sort logic)
- [ ] Add UI controls per block row/card
- [ ] Wire actions to server mutation
- [ ] Update list query sort order
- [ ] Add tests
- [ ] Update any docs/backlog references if new subtask discovered

