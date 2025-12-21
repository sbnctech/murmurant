# Page Editor v1.1 — Preview Parity Contract

## Goal

Preview rendering MUST match production rendering exactly.

---

## 1. Definition of Parity

Given the same `Page` record:
```
render(page, mode="preview") === render(page, mode="production")
```

Identical means:
- Same DOM structure
- Same visible text
- Same applied styles
- Same breadcrumb trail
- Same block order

---

## 2. Preview MUST Show

| Element | Source |
|---------|--------|
| Page title | `page.title` |
| Breadcrumbs | `page.breadcrumb` (when non-null) |
| All blocks | `page.content.blocks` in order |
| Theme tokens | `page.theme.tokens` |
| Custom CSS | `page.theme.cssText` |

---

## 3. Preview MUST NOT Show

| Element | Reason |
|---------|--------|
| Editor chrome | Not page content |
| Block handles | Editor-only |
| Placeholders | Real data only |
| Draft watermarks | Distorts fidelity |
| Loading states | Production is immediate |

---

## 4. Acceptable Differences

| Difference | Justification |
|------------|---------------|
| `data-testid` attrs | No visual impact |
| Iframe wrapper | Isolation requirement |
| localhost URLs | Environment only |

---

## 5. Enforcement

### 5.1 Shared Renderer

Both modes use identical `BlockRenderer`. No `if (isPreview)` branches.

### 5.2 Acceptance Tests

| ID | Assertion |
|----|-----------|
| PARITY-001 | Block count matches |
| PARITY-002 | Breadcrumb text matches |
| PARITY-003 | Theme colors match |
| PARITY-004 | Hero title matches |
| PARITY-005 | Null breadcrumb = no breadcrumb (both modes) |
| PARITY-006 | Block order matches |

### 5.3 CI Gate

Normalized HTML diff between preview and production must be empty.

---

## Summary

- Same renderer, same data, same output
- No preview-only conditionals
- Tests map 1:1 to this spec
