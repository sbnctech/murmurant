# Page Editor Backlog (Next Phase)

Purpose: This file is the system-of-record for editor work that is intentionally deferred.
Anything listed here is not forgotten. It is scheduled work.

Status codes:
- NOT_STARTED
- IN_PROGRESS
- BLOCKED
- DONE

## EPIC: Page Editor v1.2 (Editor UX + Lifecycle)

### 1) Editor UI wiring for block ordering
Status: NOT_STARTED
Owner: TBD

Scope:
- Use reorderBlocks()/moveBlockUp()/moveBlockDown() in the page editor UI.
- Provide Up/Down controls per block.
- Ensure parity between editor list order and rendered order.

Exit criteria:
- Acceptance tests for block ordering pass (Playwright or equivalent).
- No silent reorders on save.
- Order is stable across refresh and publish.

---

### 2) Drag-and-drop (optional, post-buttons)
Status: NOT_STARTED
Owner: TBD

Scope:
- Add drag handle and DnD reordering for blocks.
- Touch support can be deferred.

Exit criteria:
- Drag reorders exactly match button reorder behavior.
- Accessibility: keyboard path still works (buttons and/or shortcuts).

---

### 3) Lifecycle orchestration (draft, preview, publish)
Status: NOT_STARTED
Owner: TBD

Scope:
- Define the exact state machine and enforce it in API + UI.
- Concurrency rules (who wins on concurrent edits).
- Audit trail for publish events.

Exit criteria:
- Spec-backed lifecycle tests pass.
- Clear user-facing errors for conflicts.
- No data loss on concurrent edits.

---

### 4) Preview/publish plumbing beyond spec
Status: NOT_STARTED
Owner: TBD

Scope:
- Preview parity enforcement (rendering guarantees from specs).
- Preview URLs, permissions, expiry if needed.
- Confirm no indexing (noindex) and avoid accidental public access patterns.

Exit criteria:
- Preview parity acceptance tests pass.
- Preview never leaks unauthorized content.
- Preview routes are explicitly protected and non-indexable.

---

## EPIC: Reliability + Operations (Platform hardening)

### 5) Reliability/infra changes
Status: NOT_STARTED
Owner: TBD

Scope:
- Backups, restore drills, monitoring, alerting.
- SLOs and operational runbooks.
- Incident response playbook.

Exit criteria:
- Verified backup + restore workflow (with test restore).
- Monitoring catches failures before users do.
- Documented runbooks for common failures.
