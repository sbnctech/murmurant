# Editor / Publishing Integration Branch Playbook

Editor and publishing work is high-risk and must be handled differently.

This playbook defines how it is safely integrated.

---

## When This Playbook Applies

If work touches:

- page editor
- publishing pipeline
- content blocks
- rendering + persistence together

This playbook is mandatory.

---

## Integration Model

- One dedicated integration branch
- Owned by the Merge Captain
- No parallel editor branches
- No rebases

---

## Pre-Integration Requirements

Before code resumes:

1. All work decomposed into micro-PRs
2. Merge order written and agreed
3. Forbidden files listed
4. Tests identified for each stage

No exceptions.

---

## Allowed PR Types Inside the Wave

- pure rendering
- pure editor state
- pure schema helpers (no migrations)
- pure tests

Mixed PRs are forbidden.

---

## Forbidden Actions

- rebasing
- schema + UI in same PR
- long-lived feature branches
- speculative refactors

---

## Completion Criteria

The wave is complete when:

- integration branch is green
- micro-PRs are merged sequentially
- main remains green throughout

Editor work must be boring to be safe.

---

*This playbook is normative for all editor and publishing work.*
