# Contributing: Docs

This repository treats docs as first-class artifacts. The goal is to keep documentation coherent, scannable, and safe to merge.

## Non-negotiables

- ASCII-only content (no smart quotes, no Unicode dashes).
- Docs PRs must be scoped (one intent per PR).
- Prefer additive edits over rewrites unless the PR is explicitly a cleanup pass.
- Cross-reference updates are required when adding new rules (SYSTEM_SPEC.md section links).

## Docs-only PR checklist

- [ ] ASCII-only content
- [ ] Clear titles and headings
- [ ] Cross-references updated
- [ ] No changes under src/**, tests/**, prisma/** unless explicitly intended
- [ ] npm run lint passes

## Drift prevention

- If a topic spans multiple files, pick one canonical doc and link to it from others.
- When rules conflict, prefer the newest source. If unclear, mark TBD and ask the owner.

