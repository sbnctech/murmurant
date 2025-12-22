# Editor/Publishing Sequencing Plan (Avoid PR Explosion)

**Last updated:** 2025-12-22

---

## Goal

- Land Editor/Publishing work without rebases, without long-lived conflicts, and without breaking main.

---

## Current State

- Two draft PRs remain: #186 (integration/editor-wave) and #143 (breadcrumb schema/editor UI)
- Risk: both touch shared editor/publishing surfaces and can conflict heavily.

---

## Sequencing Doctrine

- Do NOT rebase #186 or #143.
- Use a Merge-Captain-owned short-lived integration branch ONLY when ready.
- Prefer micro-PR salvage to reduce surface area.

---

## Decision Tree

### A) If #186 and #143 are large and overlapping:

- Park both PRs.
- Salvage via micro-PRs in this order:
  1. Pure docs/specs (no code)
  2. Pure UI components with no routing changes
  3. Isolated schema/DB changes (only with explicit schema authorization)
  4. Editor rendering and block schemas
  5. Editor UI wiring
  6. Breadcrumb schema and metadata emission
  7. E2E tests and regression guards

### B) If one PR cleanly dominates as the "base":

- Choose ONE as canonical base (Merge Captain decision).
- Salvage the other into micro-PRs that apply atop the base after it lands.

---

## Hotspots to Avoid in Early Waves

- `prisma/schema.prisma`
- `package.json` / `package-lock.json`
- `src/app/admin/**` core layout/nav/search
- `src/app/admin/content/pages/**` (treat as editor hotspot)

---

## Execution Checklist (Merge Captain)

- [ ] Create integration branch: `integration/editor-publishing-<date>`
- [ ] Cherry-pick or re-implement micro-PRs (no rebases)
- [ ] Keep PRs <= 300 LOC
- [ ] Merge continuously to keep integration branch green
- [ ] Merge integration branch to main when green + reviewed

---

*This plan is normative for editor/publishing work sequencing.*
