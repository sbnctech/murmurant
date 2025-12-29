# Page Editor v1.1 - Block Visibility Rules

Copyright (c) Santa Barbara Newcomers Club

**Status:** Draft
**Author:** Murmurant Development Team
**Date:** December 20, 2025

---

## Purpose

This document specifies how block-level visibility works in the Murmurant page editor. Block visibility determines which content blocks are rendered to which audiences at request time.

---

## Ground Rules

1. **Visibility is explicit per block** - Each block carries its own visibility setting
2. **Defaults are boring and safe** - New blocks default to the most restrictive applicable setting
3. **No inheritance from page-level rules** - Block visibility is independent; page visibility is a separate gate
4. **Server-only enforcement** - Visibility is never evaluated client-side; all filtering happens at render time

---

## 1. Visibility States

Each block has exactly one visibility state:

| State | Value | Description |
|-------|-------|-------------|
| **Public** | `public` | Visible to anyone, including unauthenticated visitors |
| **Member** | `member` | Visible only to authenticated SBNC members |
| **Officer** | `officer` | Visible only to authenticated users with officer role |
| **Custom** | `custom:{ruleId}` | Visible based on a named rule (future; not v1.1) |

### Default Visibility

| Context | Default |
|---------|---------|
| New block on public page | `public` |
| New block on member page | `member` |
| New block on officer page | `officer` |
| Cloned block | Inherits source block visibility |

---

## 2. Interaction with Page Visibility

Page visibility and block visibility are **independent gates**. Both must pass for content to render.

### Truth Table: Page + Block Visibility

| Page Visibility | Block Visibility | Viewer | Block Renders? |
|-----------------|------------------|--------|----------------|
| public | public | anonymous | YES |
| public | public | member | YES |
| public | member | anonymous | NO |
| public | member | member | YES |
| public | officer | anonymous | NO |
| public | officer | member | NO |
| public | officer | officer | YES |
| member | public | anonymous | NO (page gate fails) |
| member | public | member | YES |
| member | member | member | YES |
| member | officer | member | NO |
| member | officer | officer | YES |
| officer | public | officer | YES |
| officer | member | officer | YES |
| officer | officer | officer | YES |
| officer | * | member | NO (page gate fails) |

### Rule Summary

```
block_visible = (viewer passes page gate) AND (viewer passes block gate)
```

The page gate is evaluated first. If the viewer cannot see the page, no blocks render regardless of block visibility.

---

## 3. Preview Behavior

Editors need to understand what different audiences will see without switching accounts.

### Editor Preview States

| Preview Mode | What Renders | UI Indication |
|--------------|--------------|---------------|
| **Edit Mode** | All blocks render with visibility badges | Badge shows visibility state |
| **Preview: Public** | Only `public` blocks | Hidden blocks show placeholder |
| **Preview: Member** | `public` + `member` blocks | Hidden blocks show placeholder |
| **Preview: Officer** | All blocks | No placeholders |

### Visibility Badge Display

In edit mode, each block displays a small badge indicating its visibility:

| Visibility | Badge |
|------------|-------|
| public | (none - default, no badge) |
| member | "Members" |
| officer | "Officers" |
| custom | "{Rule Name}" |

### Hidden Block Placeholder

In preview mode, blocks hidden from the simulated viewer show:
- Dashed border outline (editor only)
- Text: "Hidden from [audience]"
- Not rendered in actual page output

---

## 4. Rendering Guarantees

### What the Server Guarantees

1. **No leakage** - Blocks with visibility higher than the viewer's access level are never included in the response HTML
2. **No client filtering** - The server omits hidden blocks entirely; they are not sent and hidden via CSS/JS
3. **Consistent ordering** - Block order is preserved; hidden blocks do not affect layout of visible blocks
4. **No metadata leakage** - Block IDs, titles, and content of hidden blocks are not exposed in any form

### Rendering Pipeline

```
1. Load page content (all blocks)
2. Determine viewer access level
3. Filter blocks: keep only where viewer >= block.visibility
4. Render remaining blocks in order
5. Return HTML
```

### Performance Note

Block filtering happens in memory after content load. For pages with many blocks, this is acceptable. Block visibility does not affect database queries.

---

## 5. Failure Modes

### Unknown Visibility Value

| Scenario | Behavior |
|----------|----------|
| Block has `visibility: "foo"` (unknown) | Treat as `officer` (most restrictive) |
| Block has `visibility: null` | Treat as page default |
| Block has `visibility: undefined` | Treat as page default |

### Missing Visibility Field

If a block lacks a visibility field entirely:
- **Migration path:** Treat as `public` for existing content (backward compatibility)
- **New blocks:** Always set visibility explicitly at creation time

### Custom Rule Not Found

| Scenario | Behavior |
|----------|----------|
| Block has `visibility: "custom:deleted-rule"` | Treat as `officer` (fail closed) |
| Custom rule evaluation throws error | Treat as `officer` (fail closed) |

### Logging

All visibility failures are logged with:
- Block ID
- Page ID
- Expected visibility value
- Reason for failure
- Timestamp

Logs are admin-visible only.

---

## 6. Examples

### Example 1: Mixed Visibility Page

A public page with blocks for different audiences:

```yaml
page:
  slug: "/about"
  visibility: public
  blocks:
    - id: b1
      type: hero
      visibility: public
      # Seen by everyone

    - id: b2
      type: text
      visibility: public
      # Seen by everyone

    - id: b3
      type: text
      visibility: member
      # "Member benefits" section
      # Only seen by logged-in members

    - id: b4
      type: text
      visibility: officer
      # "Officer notes" section
      # Only seen by officers
```

**Anonymous visitor sees:** b1, b2
**Member sees:** b1, b2, b3
**Officer sees:** b1, b2, b3, b4

### Example 2: Member Page with Public Block

A member-only page that has a public teaser:

```yaml
page:
  slug: "/events/holiday-party"
  visibility: member
  blocks:
    - id: b1
      type: hero
      visibility: public  # Irrelevant - page gate blocks anonymous

    - id: b2
      type: text
      visibility: member
```

**Anonymous visitor sees:** Nothing (page gate fails)
**Member sees:** b1, b2

Note: The `public` visibility on b1 is irrelevant because the page itself requires member access.

### Example 3: Officer Announcement Block

An officer wants to add a note visible only to other officers on a public page:

```yaml
page:
  slug: "/calendar"
  visibility: public
  blocks:
    - id: b1
      type: text
      visibility: public
      content: "Upcoming events..."

    - id: b2
      type: text
      visibility: officer
      content: "OFFICER NOTE: Budget approval pending for June picnic"
```

**Public sees:** b1 only
**Officers see:** b1, b2

---

## 7. Intentionally Unsupported

The following are explicitly **out of scope** for v1.1:

| Feature | Reason |
|---------|--------|
| **Block inheritance from page** | Adds complexity; explicit is clearer |
| **Time-based visibility** | Requires scheduler; future feature |
| **User-specific visibility** | Too granular; use roles instead |
| **Visibility based on membership tier** | Use custom rules (future) |
| **Client-side visibility toggle** | Security risk; server-only |
| **Visibility cascading to child blocks** | No nested blocks in v1 |
| **Audience preview dropdown in public view** | Editor-only feature |
| **Visibility change history/audit** | Use page revision history instead |
| **Bulk visibility editing** | Edit blocks individually |
| **Visibility templates** | Use page templates instead |

---

## 8. Schema Reference

### Block Visibility Field

```typescript
type BlockVisibility = "public" | "member" | "officer" | `custom:${string}`;

interface Block {
  id: string;
  type: BlockType;
  order: number;
  visibility: BlockVisibility;  // Required in v1.1+
  data: Record<string, unknown>;
}
```

### Migration

Existing blocks without `visibility` field:
1. Add `visibility: "public"` to all existing blocks
2. This is a data migration, not a schema migration
3. Run once; new blocks always have visibility set

---

## 9. Security Considerations

### Threat: Visibility Bypass via Direct Block Access

**Mitigation:** Blocks are not individually addressable. All access goes through page rendering, which enforces visibility.

### Threat: Editor Leaks Hidden Content

**Mitigation:** Edit mode requires appropriate page-level edit permission. If you can edit, you can see all blocks anyway.

### Threat: Cached Pages Show Wrong Content

**Mitigation:** Page caching must be audience-aware. Cache keys include viewer access level. (See caching spec, separate doc.)

---

## Related Documents

- Page Audience and Visibility (TODO: create audience.md)
- Block Content System (TODO: create blocks.md)
- Page Editor Permissions (TODO: create permissions.md)

---

*This document defines rules only. No UI mocks. No code.*
