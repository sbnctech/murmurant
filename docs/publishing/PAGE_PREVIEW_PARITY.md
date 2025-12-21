# Page Editor v1.1 — Preview Parity Contract

## Goal

Guarantee that preview rendering is identical to production rendering for all published pages.

---

## 1. Definition of Parity

**Parity** means: given the same `Page` record, the preview and production renders produce identical HTML output, excluding only the differences listed in Section 4.

Formally:
```
render(page, context="preview") === render(page, context="production")
```

Where `===` means:
- Same DOM structure
- Same visible text content
- Same applied styles (from theme tokens)
- Same breadcrumb trail (filtered by viewer audience)
- Same block order and content

---

## 2. What Preview MUST Show

| Element | Requirement |
|---------|-------------|
| **Page title** | Rendered from `page.title` |
| **Breadcrumbs** | Rendered from `page.breadcrumb` when non-null |
| **All blocks** | Rendered in `block.order` sequence |
| **Theme tokens** | Applied from `page.theme.tokens` |
| **Custom CSS** | Applied from `page.theme.cssText` |
| **Block content** | Exact content from `block.data` |
| **Links** | Functional hrefs (may be sandboxed) |
| **Images** | Loaded from actual src URLs |

---

## 3. What Preview MUST NOT Show

| Element | Reason |
|---------|--------|
| **Editor chrome** | Not part of page content |
| **Block selection handles** | Editor-only affordance |
| **Placeholder content** | Preview shows real data only |
| **Draft watermarks** | Distorts visual fidelity |
| **"Save" or "Publish" buttons** | Not page content |
| **Loading skeletons** | Production shows content immediately |
| **Simulated data** | No mock events, mock users, etc. |

---

## 4. Known Acceptable Differences

| Difference | Justification |
|------------|---------------|
| `data-testid` attributes | Testing infrastructure only; no visual impact |
| Wrapper `<div>` for preview isolation | Required for iframe/portal; no visual impact |
| URL domain (localhost vs production) | Environment difference; content identical |
| `aria-` attributes for preview mode | Accessibility context; no visual impact |

All other differences are **parity violations**.

---

## 5. Enforcement Strategy

### 5.1 Shared Renderer Constraint

- Both preview and production MUST use the same `BlockRenderer` component
- No conditional branches based on `isPreview` flag
- Theme application uses the same `generateCssVariables()` function

### 5.2 Acceptance Tests

| Test ID | Assertion |
|---------|-----------|
| `PARITY-001` | Preview of page with 3 blocks matches production block count |
| `PARITY-002` | Preview breadcrumb text matches production breadcrumb text |
| `PARITY-003` | Preview theme colors match production theme colors |
| `PARITY-004` | Preview hero title matches production hero title |
| `PARITY-005` | Preview with null breadcrumb shows no breadcrumb (both contexts) |
| `PARITY-006` | Preview block order matches production block order |
| `PARITY-007` | Preview custom CSS applies same as production |

### 5.3 CI Gate

```
Given: A page with content
When: Rendered in preview mode
And: Rendered in production mode
Then: Normalized HTML diff is empty (excluding Section 4 items)
```

### 5.4 Visual Regression (Optional)

Screenshot comparison between:
- `/admin/content/pages/[id]/preview` (preview route)
- `/[slug]` (production route for same page)

Threshold: 0% pixel difference (after masking editor chrome).

---

## Summary

| Principle | Implementation |
|-----------|----------------|
| Same renderer | `BlockRenderer` used in both contexts |
| Same data | `page.content`, `page.breadcrumb`, `page.theme` |
| Same filtering | Audience rules applied identically |
| No preview-only behavior | No `if (isPreview)` conditionals in render path |
| Testable | Assertions map directly to this spec |
