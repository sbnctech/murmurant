# Page Editor v1.1 - Block Visibility Rules

Copyright (c) Santa Barbara Newcomers Club

**Status:** Draft
**Date:** December 20, 2025

---

## Purpose

Block visibility determines which content blocks render to which audiences at request time.

---

## Ground Rules

1. **Visibility is explicit per block** - Each block carries its own visibility setting
2. **Defaults are boring and safe** - New blocks default to the most restrictive applicable setting
3. **No inheritance from page-level rules** - Block visibility is independent; page visibility is a separate gate
4. **Server-only enforcement** - Visibility is never evaluated client-side; all filtering happens at render time

---

## 1. Visibility States

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

### Truth Table

| Page | Block | Viewer | Renders? |
|------|-------|--------|----------|
| public | public | anonymous | YES |
| public | public | member | YES |
| public | member | anonymous | NO |
| public | member | member | YES |
| public | officer | anonymous | NO |
| public | officer | member | NO |
| public | officer | officer | YES |
| member | public | anonymous | NO (page gate) |
| member | public | member | YES |
| member | member | member | YES |
| member | officer | member | NO |
| member | officer | officer | YES |
| officer | * | non-officer | NO (page gate) |
| officer | * | officer | YES |

### Rule

```
block_visible = (viewer passes page gate) AND (viewer passes block gate)
```

---

## 3. Preview Behavior

### Editor Preview Modes

| Mode | What Renders | Hidden Blocks |
|------|--------------|---------------|
| Edit | All blocks with visibility badges | N/A |
| Preview: Public | `public` only | Dashed placeholder |
| Preview: Member | `public` + `member` | Dashed placeholder |
| Preview: Officer | All blocks | None hidden |

### Visibility Badges (Edit Mode)

| Visibility | Badge |
|------------|-------|
| public | (none) |
| member | "Members" |
| officer | "Officers" |

---

## 4. Rendering Guarantees

1. **No leakage** - Hidden blocks are never included in response HTML
2. **No client filtering** - Server omits hidden blocks entirely
3. **Consistent ordering** - Hidden blocks do not affect visible block layout
4. **No metadata leakage** - IDs, titles, content of hidden blocks not exposed

### Pipeline

```
1. Load page (all blocks)
2. Determine viewer access level
3. Filter: keep blocks where viewer >= block.visibility
4. Render remaining blocks
5. Return HTML
```

---

## 5. Failure Modes

| Scenario | Behavior |
|----------|----------|
| Unknown visibility value | Treat as `officer` (fail closed) |
| `visibility: null` | Use page default |
| `visibility: undefined` | Use page default |
| Missing visibility field | Treat as `public` (migration compat) |
| Custom rule not found | Treat as `officer` (fail closed) |
| Custom rule throws | Treat as `officer` (fail closed) |

All failures logged with block ID, page ID, reason, timestamp.

---

## 6. Examples

### Example 1: Public Page, Mixed Blocks

```yaml
page:
  slug: "/about"
  visibility: public
  blocks:
    - id: b1
      visibility: public      # Everyone sees
    - id: b2
      visibility: member      # Members only
    - id: b3
      visibility: officer     # Officers only
```

- Anonymous: b1
- Member: b1, b2
- Officer: b1, b2, b3

### Example 2: Member Page

```yaml
page:
  slug: "/member-resources"
  visibility: member
  blocks:
    - id: b1
      visibility: public      # Irrelevant - page blocks anonymous
    - id: b2
      visibility: member
```

- Anonymous: nothing (page gate fails)
- Member: b1, b2

### Example 3: Officer Note on Public Page

```yaml
page:
  slug: "/calendar"
  visibility: public
  blocks:
    - id: b1
      visibility: public
      content: "Upcoming events"
    - id: b2
      visibility: officer
      content: "NOTE: Budget pending for picnic"
```

- Public: b1
- Officer: b1, b2

---

## 7. Intentionally Unsupported (v1.1)

| Feature | Reason |
|---------|--------|
| Block inherits page visibility | Explicit is clearer |
| Time-based visibility | Requires scheduler |
| User-specific visibility | Use roles instead |
| Membership-tier visibility | Use custom rules (future) |
| Client-side toggle | Security risk |
| Nested block visibility | No nested blocks in v1 |
| Bulk visibility editing | Edit individually |
| Visibility templates | Use page templates |

---

## 8. Schema

```typescript
type BlockVisibility = "public" | "member" | "officer" | `custom:${string}`;

interface Block {
  id: string;
  type: BlockType;
  order: number;
  visibility: BlockVisibility;
  data: Record<string, unknown>;
}
```

### Migration

Existing blocks without visibility: add `visibility: "public"` (data migration).

---

## 9. Security

| Threat | Mitigation |
|--------|------------|
| Bypass via direct block access | Blocks not individually addressable |
| Editor leaks hidden content | Edit requires page-level permission |
| Cache shows wrong content | Cache keys include viewer access level |

---

*Spec only. No UI mocks. No code.*
