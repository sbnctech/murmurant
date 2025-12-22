# Editor Wave Followups Plan (Post-merge Micro-PR Salvage)

Status
- Editor/publishing integration wave tracked in PR #186.
- Non-editor hotspot PRs are parked and blocked by editor wave.

Rules
- No mass rebases.
- Salvage via micro-PRs after #186 merges.
- Avoid hotspots unless a micro-PR is explicitly scoped:
  - prisma/schema.prisma
  - package.json / package-lock.json
  - core admin nav/search/layout hotspots

Workstreams After #186 Lands

A) Stabilization (small, safe, fast)
1. Smoke checks (local + CI)
   - npm run typecheck
   - npm run test:unit
   - npm run test-admin:stable (if available)
2. Verify editor routes render without runtime errors
   - /admin/content/pages
   - /admin/content/pages/new
   - /admin/content/pages/[id]
3. Verify public slug route
   - /(public)/[slug]

B) Parked PR Salvage Strategy (micro-PR order)
Goal: merge high-value, low-conflict items first, keep main green.

Suggested order (edit as needed):
1. Docs-only and tooling PRs (no hotspots)
   - Prefer: docs/**, scripts/docs/**, tests/docs-only
2. Small UI changes outside publishing/editor paths
3. API-only changes that do not touch publishing/editor
4. Cross-tenant, auth, membership PRs only when isolated
5. Hotspot PRs last, one theme at a time

Parked PRs (current)
- 78
- 82
- 84
- 85
- 95
- 107
- 116
- 118
- 134
- 135
- 136
- 138

Per-PR micro-salvage template
For each parked PR:
1. Create a fresh branch from main (post-186 merge)
2. Identify smallest coherent slice (one feature, one test set)
3. Apply as:
   - manual edits, or
   - cherry-pick individual commits only if clean and minimal
4. Add/adjust tests
5. Keep PR small (ideally < 300 LOC net; split if larger)
6. Merge ASAP to reduce drift

Hotspot quarantine
- If a change must touch a hotspot, it becomes a dedicated themed wave owned by merge captain.
- Do not mix hotspot work with unrelated changes.

Definition of Done
- #186 merged
- Stabilization passes on main
- Parked PRs either salvaged via micro-PRs or re-scoped into a later themed integration wave
