# Publishing and Content Lifecycle

```
Audience: Operators, Developers, Board Members
Purpose: Explain how Murmurant manages content from creation to archival
Charter Reference: P3 (State machines), P5 (Reversibility), P7 (Observability)
```

Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

---

## Overview

Murmurant uses a predictable publishing lifecycle for all content (pages, templates, themes). Every piece of content moves through defined states with clear transitions, preview capabilities, and rollback options.

**Core Guarantees:**

1. **Draft changes are never public** - Only published content is visible to members/public
2. **Preview respects RBAC** - Only authorized users can see unpublished content
3. **Rollback is always possible** - Published content is preserved until explicitly replaced
4. **All actions are audited** - Who did what, when, with full before/after state

---

## Content States

```
                    ┌─────────────────────────────────┐
                    │                                 │
                    ▼                                 │
    ┌─────────┐  publish  ┌───────────┐   archive   ┌──────────┐
    │  DRAFT  │ ────────► │ PUBLISHED │ ──────────► │ ARCHIVED │
    └─────────┘           └───────────┘             └──────────┘
         ▲                      │                        │
         │     unpublish        │                        │
         └──────────────────────┘                        │
                                                         │
                              (restore requires admin)   │
                              ◄──────────────────────────┘
```

### Draft

**What it means:** Work in progress. Not visible to the public or members.

**Who can see it:**
- The creator (author)
- Content administrators (webmaster, communications-chair)
- Full administrators (president, board-member)

**What you can do:**
- Edit content freely
- Preview the page
- Publish when ready
- Delete without approval

**Transitions:**
- → PUBLISHED (via publish action)
- → ARCHIVED (via archive action, rarely used for drafts)

---

### Published

**What it means:** Live content, visible according to visibility rules.

**Who can see it:**
- **PUBLIC visibility**: Everyone
- **MEMBERS_ONLY visibility**: Authenticated members with active status
- **ROLE_RESTRICTED visibility**: Members matching audience rules

**What you can do:**
- Continue editing (creates draft changes)
- Preview draft changes before re-publishing
- Unpublish (revert to draft)
- Archive (hide from public, preserve history)

**Transitions:**
- → DRAFT (via unpublish action)
- → ARCHIVED (via archive action)

**Key behavior:** When you edit a published page, your changes accumulate as "draft changes." The public still sees the last published version until you publish again.

---

### Archived

**What it means:** Hidden from the site, preserved for history.

**Who can see it:**
- Full administrators only (in admin interface)

**What you can do:**
- View historical content
- Restore to draft (admin action)

**Transitions:**
- → DRAFT (via restore action, admin only)

**Note:** Archiving is reversible, but deletion is permanent. When in doubt, archive.

---

## The Publishing Snapshot

When you publish a page, Murmurant creates a **publishing snapshot**:

```
Before Publish:
┌──────────────────────────────────────┐
│ Page                                 │
│   content: { blocks: [...] }         │  ← Your current edits
│   publishedContent: null             │  ← Nothing published yet
│   status: DRAFT                      │
└──────────────────────────────────────┘

After Publish:
┌──────────────────────────────────────┐
│ Page                                 │
│   content: { blocks: [...] }         │  ← Matches published
│   publishedContent: { blocks: [...] }│  ← Frozen snapshot
│   status: PUBLISHED                  │
│   publishedAt: 2025-12-26T10:00:00Z  │
└──────────────────────────────────────┘
```

**Why this matters:**

1. **Public sees `publishedContent`** - Your draft edits are invisible
2. **You can detect changes** - Compare `content` vs `publishedContent`
3. **Rollback is instant** - Restore `content` from `publishedContent`

---

## Preview Links

Preview lets content administrators see unpublished changes before publishing.

### Accessing Preview

**URL pattern:** `/{slug}/preview`

**Example:** `/about-us/preview`

### RBAC Enforcement

Preview is restricted to authorized users:

| Role | Can Preview |
|------|-------------|
| President | Yes |
| Board Member | Yes |
| Webmaster | Yes |
| Communications Chair | Yes |
| VP Membership | No |
| Activity Chair | No |
| Regular Member | No |
| Public (not logged in) | No |

**Implementation:** The preview route checks `isContentAdmin(user)` before rendering.

### Preview Behavior

```
┌────────────────────────────────────────────────────────────┐
│ ⚠️ PREVIEW MODE                                            │
│ You are viewing unpublished draft content                  │
│ [Edit Page] [View Published]                               │
├────────────────────────────────────────────────────────────┤
│                                                            │
│              (Page content renders here)                   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Content selection logic:**
1. If `content` differs from `publishedContent` → show `content` (draft)
2. If no draft changes → show `publishedContent`
3. If never published → show `content`

**Preview indicators:**
- Yellow banner at top
- "Draft" or "Unpublished Changes" label
- Quick links to editor and published version

---

## Rollback Mechanism

Murmurant provides two levels of rollback:

### Level 1: Discard Draft Changes

**When:** You've edited a published page but want to undo all changes.

**How:** Click "Discard Changes" in the editor.

**What happens:**
1. `content` is overwritten with `publishedContent`
2. Edit history (undo/redo stack) is cleared
3. Page remains PUBLISHED with original content

**Availability:** Only when:
- Page is PUBLISHED
- `content` differs from `publishedContent`

```
Before Discard:
  content: { blocks: [new, edited, stuff] }
  publishedContent: { blocks: [original, content] }

After Discard:
  content: { blocks: [original, content] }  ← Restored!
  publishedContent: { blocks: [original, content] }
```

### Level 2: Undo/Redo Stack

**When:** You want to undo specific edits within your current session.

**How:** Cmd+Z / Cmd+Shift+Z or Undo/Redo buttons in editor.

**What happens:**
- Each edit creates a revision snapshot
- Up to 20 revisions kept per page
- Stack clears on publish or discard

**Stack structure:**
```
Position:   ... -2  -1  [0]  +1  +2 ...
                     │
                     └── Current state
            ────────────────────────────►
            Redo stack    Undo stack
```

**Important:** Undo/redo history does NOT survive publishing. Once you publish, the undo stack clears. This is intentional—publishing is a checkpoint.

---

## Lifecycle Actions

### Publish

**Prerequisites:**
- Page must be DRAFT or have draft changes
- User must have content admin role
- Content must pass validation

**Steps:**
1. Validate page content structure
2. Copy `content` → `publishedContent`
3. Set `status` = PUBLISHED
4. Set `publishedAt` = now
5. Clear revision stack
6. Create audit log entry

**API:** `POST /api/admin/content/pages/{id}?action=publish`

---

### Unpublish

**Prerequisites:**
- Page must be PUBLISHED
- User must have content admin role

**Steps:**
1. Set `status` = DRAFT
2. Keep `publishedContent` intact (for rollback)
3. Create audit log entry

**Note:** Unpublished pages keep their `publishedContent` snapshot. If you re-publish, you can still discard back to the previous version.

**API:** `POST /api/admin/content/pages/{id}?action=unpublish`

---

### Archive

**Prerequisites:**
- Any status except already ARCHIVED
- User must have content admin role

**Steps:**
1. Set `status` = ARCHIVED
2. Page hidden from public site
3. Content preserved
4. Create audit log entry

**API:** `POST /api/admin/content/pages/{id}?action=archive`

---

### Discard Draft

**Prerequisites:**
- Page must be PUBLISHED
- Must have draft changes (`content` ≠ `publishedContent`)
- User must have edit permission

**Steps:**
1. Copy `publishedContent` → `content`
2. Clear revision stack
3. Create audit log entry

**API:** `POST /api/admin/content/pages/{id}?action=discardDraft`

---

## Visibility and Audience Rules

Publishing state is independent of visibility. A published page can still be restricted.

### Visibility Levels

| Level | Who Can See |
|-------|-------------|
| PUBLIC | Everyone, including non-members |
| MEMBERS_ONLY | Authenticated members with active membership |
| ROLE_RESTRICTED | Members matching specific audience rules |

### Audience Rules

For ROLE_RESTRICTED pages, you define who can see the content:

```json
{
  "roles": ["board-member", "committee-chair"],
  "membershipStatuses": ["active", "honorary"],
  "committeeIds": ["activities-committee"],
  "joinedAfterDays": 90,
  "excludeMemberIds": ["member-xyz"]
}
```

**Rule evaluation:** All specified conditions must match (AND logic). If any condition fails, access is denied.

---

## Audit Trail

Every lifecycle action creates an audit log entry:

```json
{
  "action": "PAGE_PUBLISHED",
  "resourceType": "Page",
  "resourceId": "page-abc-123",
  "before": { "status": "DRAFT" },
  "after": { "status": "PUBLISHED", "publishedAt": "2025-12-26T10:00:00Z" },
  "metadata": { "contentHash": "sha256:..." },
  "memberId": "member-xyz",
  "createdAt": "2025-12-26T10:00:00Z"
}
```

**Tracked actions:**
- PAGE_CREATED
- PAGE_UPDATED
- PAGE_PUBLISHED
- PAGE_UNPUBLISHED
- PAGE_ARCHIVED
- PAGE_RESTORED
- PAGE_DELETED
- DRAFT_DISCARDED

---

## Scheduled Publishing (Future)

The schema supports `publishAt` for scheduled publishing, but this is not yet implemented.

**Planned behavior:**
- Set `publishAt` to a future timestamp
- Page remains DRAFT until then
- System publishes automatically at scheduled time
- No background jobs required (checked on page request)

---

## Common Scenarios

### Scenario 1: Create and Publish a New Page

1. Create page → status = DRAFT
2. Add content blocks
3. Preview to verify
4. Publish → status = PUBLISHED, content frozen

### Scenario 2: Update a Published Page

1. Edit published page → draft changes accumulate
2. Preview to verify changes
3. Option A: Publish → changes go live
4. Option B: Discard → revert to published version

### Scenario 3: Temporarily Hide a Page

1. Archive the page → hidden from public
2. Content preserved
3. Later: Restore → back to DRAFT
4. Review and republish

### Scenario 4: Undo a Bad Edit

1. Edit published page
2. Realize mistake
3. Cmd+Z to undo specific changes
4. Or: Discard all draft changes to revert

---

## Developer Reference

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/publishing/pageLifecycle.ts` | State machine implementation |
| `src/lib/publishing/revisions.ts` | Undo/redo stack management |
| `src/lib/publishing/permissions.ts` | RBAC for content operations |
| `src/lib/publishing/contentSelection.ts` | Draft vs published selection |
| `src/lib/publishing/audience.ts` | Audience rule evaluation |
| `src/app/(public)/[slug]/preview/page.tsx` | Preview route |
| `src/app/api/admin/content/pages/[id]/route.ts` | Lifecycle API |

### State Transition Validation

```typescript
import { isValidTransition } from '@/lib/publishing/pageLifecycle';

// Check if transition is allowed
const canPublish = isValidTransition('DRAFT', 'publish');  // true
const canArchive = isValidTransition('ARCHIVED', 'publish'); // false
```

### Draft Change Detection

```typescript
import { hasDraftChanges } from '@/lib/publishing/pageLifecycle';

// Check if page has unsaved changes
const hasChanges = hasDraftChanges(page); // true/false
```

### Permission Checks

```typescript
import { canPublishPage } from '@/lib/publishing/permissions';

// Check if user can publish
const canPublish = canPublishPage(userContext); // true/false
```

---

## Summary

| What | How |
|------|-----|
| **States** | DRAFT → PUBLISHED → ARCHIVED |
| **Preview** | `/{slug}/preview` (content admins only) |
| **Rollback** | Discard draft changes restores last published |
| **Undo/Redo** | 20-step stack, clears on publish |
| **Visibility** | PUBLIC, MEMBERS_ONLY, ROLE_RESTRICTED |
| **Audit** | Full before/after logging on all actions |

---

## Related Documents

- [Architectural Charter](../ARCHITECTURAL_CHARTER.md) - Principles P3, P5, P7
- [Publishing System Plan](../publishing/PUBLISHING_SYSTEM_PLAN.md) - Technical spec
- [RBAC Overview](../RBAC_OVERVIEW.md) - Permission system
- [Template Theme Model](../publishing/TEMPLATE_THEME_MODEL.md) - Theme architecture

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2025-12-26 | System | Initial documentation of publishing lifecycle |
