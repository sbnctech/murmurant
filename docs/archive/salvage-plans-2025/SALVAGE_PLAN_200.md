# Salvage Plan: Issue #200 - Editor/Publishing Integration Wave

**Status:** Parked
**Tracking Issue:** [#200](https://github.com/sbnctech/murmurant/issues/200)
**Theme Label:** `theme-editor`
**Date:** 2025-12-21

---

## Executive Summary

The Editor/Publishing wave contains the largest and most complex parked work. Two draft PRs remain open (#186, #143), and several closed PRs contain salvageable code. The integration PR (#186) attempted to merge multiple features but created significant conflict surfaces.

**Recommendation:** Do NOT rebase #186. Instead, decompose into 6-8 focused micro-PRs that can land independently.

---

## 1. Inventory of Parked PRs

### Still Open (Draft)

| PR | Title | Files | State | Risk Level |
|----|-------|-------|-------|------------|
| #186 | integration(editor): editor wave merge (143 + 121 + 145) | 41 | OPEN | HIGH |
| #143 | feat(publishing): breadcrumb schema, rendering, and editor UI | 21 | OPEN | MEDIUM |

### Closed (Salvage Candidates)

| PR | Title | Files | Key Content |
|----|-------|-------|-------------|
| #145 | docs: add multitenancy architecture plan | 78 | MULTITENANCY_PLAN.md, reliability docs, editor docs |
| #138 | docs(ui): inventory remaining Stripe references | 276 | Docs only - largely merged already |
| #136 | docs(arch): clarify blocks vs sections | 273 | ARCHITECTURE_BLOCKS_AND_SECTIONS.md |
| #135 | demo: modern home stripes + view-as | 269 | View-as system, stripes layout, home gadgets |
| #121 | feat: Add WYSIWYG drag-and-drop page editor | 12 | Core editor components, dnd-kit, tiptap |

---

## 2. Hotspot Analysis

### Critical Hotspots (Conflict Magnets)

```
prisma/schema.prisma          - Touched by: #145, #138, #136, #135, #143, #186
package-lock.json             - Touched by: #186, #145, #138, #136, #135, #121
src/app/admin/content/**      - Touched by: #186, #143, #145
src/components/editor/**      - Touched by: #186, #121
```

### Overlap Matrix

```
     #186  #143  #145  #138  #136  #135  #121
#186   -   HIGH  HIGH  LOW   LOW   LOW   HIGH
#143  HIGH   -   MED   LOW   LOW   LOW   MED
#145  HIGH  MED   -    MED   MED   MED   LOW
#121  HIGH  MED  LOW   LOW   LOW   LOW    -
```

---

## 3. Micro-PR Decomposition

### Wave A: Documentation Only (Zero Risk)

| Micro-PR | Source | Content | Deps |
|----------|--------|---------|------|
| A1 | #145 | docs/architecture/MULTITENANCY_PLAN.md | None |
| A2 | #145 | docs/architecture/TENANT_VERSIONING_STRATEGY.md | None |
| A3 | #145 | docs/reliability/* (runbooks, tabletops) | None |
| A4 | #145 | docs/editor/A1-A7 implementation guides | None |
| A5 | #136 | docs/ARCHITECTURE_BLOCKS_AND_SECTIONS.md | None |

**Estimated effort per micro-PR:** 5 minutes (copy-paste, no conflicts expected)

### Wave B: Schema Changes (HIGH Risk - Serialize)

| Micro-PR | Source | Content | Deps |
|----------|--------|---------|------|
| B1 | #143 | Page.breadcrumb field (nullable JSON) | None |
| B2 | #145 | Block ordering fields (if needed) | B1 |

**Risk mitigation:**
- Run `prisma validate` and `prisma generate` before each commit
- Create migration file for each schema change
- Test against current production data shape

### Wave C: Publishing Library (LOW Risk)

| Micro-PR | Source | Content | Deps |
|----------|--------|---------|------|
| C1 | #143 | src/lib/publishing/schemas.ts (Zod validation) | None |
| C2 | #143 | src/lib/publishing/audience.ts | C1 |
| C3 | #143 | src/components/publishing/Breadcrumbs.tsx | C1 |
| C4 | #143 | tests/unit/publishing/breadcrumb-*.spec.ts | C3 |

**Risk mitigation:**
- Pure library code, no side effects
- Unit tests validate correctness before merge

### Wave D: Editor Components (MEDIUM Risk)

| Micro-PR | Source | Content | Deps |
|----------|--------|---------|------|
| D1 | #121 | package.json deps (@dnd-kit, tiptap) | None |
| D2 | #121 | src/components/editor/RichTextEditor.tsx | D1 |
| D3 | #121 | src/components/editor/BlockEditors.tsx | D2 |
| D4 | #121 | src/components/editor/SortableBlockList.tsx | D1 |
| D5 | #121 | src/components/editor/BlockPalette.tsx | D3 |
| D6 | #121 | src/components/editor/PageEditor.tsx | D2, D3, D4, D5 |

**Risk mitigation:**
- Add components without wiring to routes first
- Test each component in isolation

### Wave E: Editor Admin Routes (HIGH Risk)

| Micro-PR | Source | Content | Deps |
|----------|--------|---------|------|
| E1 | #143 | src/app/admin/content/pages/[id]/preview/page.tsx | C3 |
| E2 | #143 | src/app/admin/content/pages/new/page.tsx | D6 |
| E3 | #186 | src/app/admin/content/pages/[id]/PageEditorClient.tsx | D6, E1, E2 |
| E4 | #186 | Admin API routes for pages (create, update) | E3 |

**Risk mitigation:**
- These touch admin surfaces - require E2E tests
- Deploy behind feature flag initially

### Wave F: View-As System (MEDIUM Risk)

| Micro-PR | Source | Content | Deps |
|----------|--------|---------|------|
| F1 | #135 | src/lib/view-context.ts | None |
| F2 | #135 | src/components/view-as/* | F1 |
| F3 | #135 | src/app/ViewAsWrapper.tsx | F2 |
| F4 | #135 | tests/unit/home/* | F3 |

**Risk mitigation:**
- View-as is scoped to tech-lead only
- Feature-flag for production

---

## 4. Integration Order

```
Phase 1: Documentation (Wave A)
   └─ Can run in parallel, no deps

Phase 2: Schema (Wave B)
   └─ Must serialize: B1 → B2

Phase 3: Library Code (Wave C)
   └─ C1 → C2 → C3 → C4

Phase 4: Editor Components (Wave D)
   └─ D1 → (D2, D3, D4) → D5 → D6

Phase 5: Admin Routes (Wave E)
   └─ E1 → E2 → E3 → E4

Phase 6: View-As (Wave F)
   └─ F1 → F2 → F3 → F4
```

---

## 5. Risk Assessment

### Schema Risk: HIGH

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Page.breadcrumb conflicts with other schema changes | MEDIUM | HIGH | Land B1 early, serialize all schema PRs |
| Migration fails on production data | LOW | HIGH | Test migration on production snapshot first |

### Editor/Admin Surface Risk: HIGH

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| PageEditorClient breaks existing page editing | MEDIUM | HIGH | Feature-flag new editor, keep old path |
| Block ordering breaks existing pages | LOW | MEDIUM | Default new field to null, don't require |

### Publishing Risk: LOW

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breadcrumbs render incorrectly | LOW | LOW | Opt-in per page, null = hidden |
| Audience filtering breaks pages | LOW | MEDIUM | Unit tests cover edge cases |

---

## 6. Merge Captain Checklist

### Pre-Merge (Per Micro-PR)

- [ ] Branch created from current main
- [ ] Cherry-pick or manually copy code from source PR
- [ ] Run `npm run typecheck`
- [ ] Run `npm run lint`
- [ ] Run `npm run test:unit` for affected areas
- [ ] If schema change: run `prisma validate` and `prisma generate`
- [ ] Verify no unintended file changes

### Post-Merge

- [ ] CI green on main
- [ ] No regression in production preview
- [ ] Update tracking issue #200 with progress

### Wave Completion Gates

- [ ] Wave A complete → Update #200: "Docs landed"
- [ ] Wave B complete → Update #200: "Schema landed"
- [ ] Wave C complete → Update #200: "Publishing library landed"
- [ ] Wave D complete → Update #200: "Editor components landed"
- [ ] Wave E complete → Update #200: "Admin routes landed"
- [ ] Wave F complete → Close #200

---

## 7. Estimated Merge Effort

| Wave | Micro-PRs | Est. Time per PR | Total |
|------|-----------|------------------|-------|
| A (Docs) | 5 | 5 min | 25 min |
| B (Schema) | 2 | 30 min | 60 min |
| C (Library) | 4 | 15 min | 60 min |
| D (Editor) | 6 | 20 min | 120 min |
| E (Routes) | 4 | 45 min | 180 min |
| F (View-As) | 4 | 20 min | 80 min |

**Total estimated effort:** ~9 hours of focused merge work

---

## 8. What NOT to Salvage

The following should be discarded and re-implemented if needed:

- **#186 integration branch** - Too many conflicts, rebase not recommended
- **Any code that touches both editor AND schema** - Split into separate PRs
- **Stripes-to-Sections mechanical rename** - Already partially done in main

---

## Appendix: File-Level Mapping

### From #143 (Breadcrumbs)

```
prisma/schema.prisma                           → Wave B (B1)
src/lib/publishing/schemas.ts                  → Wave C (C1)
src/lib/publishing/audience.ts                 → Wave C (C2)
src/components/publishing/Breadcrumbs.tsx      → Wave C (C3)
src/app/admin/content/pages/new/page.tsx       → Wave E (E2)
src/app/admin/content/pages/[id]/preview/      → Wave E (E1)
tests/unit/publishing/*                        → Wave C (C4)
```

### From #121 (WYSIWYG Editor)

```
package.json                                   → Wave D (D1)
src/components/editor/RichTextEditor.tsx       → Wave D (D2)
src/components/editor/BlockEditors.tsx         → Wave D (D3)
src/components/editor/SortableBlockList.tsx    → Wave D (D4)
src/components/editor/BlockPalette.tsx         → Wave D (D5)
src/components/editor/PageEditor.tsx           → Wave D (D6)
```

### From #145 (Multitenancy Docs)

```
docs/architecture/MULTITENANCY_PLAN.md         → Wave A (A1)
docs/architecture/TENANT_VERSIONING_STRATEGY.md → Wave A (A2)
docs/reliability/*                             → Wave A (A3)
docs/editor/A1-A7*.md                          → Wave A (A4)
```
