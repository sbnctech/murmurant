# Merge Churn Prevention Policy (Murmurant)
Date: 2025-12-22
Owner: Merge Captain

Purpose
Prevent multi-hour merge cycles, CI churn, and morale damage by reducing blast radius and enforcing contract-first changes in shared hotspots.

Non-negotiables
1) Keep main green.
2) Prefer safety over speed.
3) No "hero merges". If it is messy, split it.

Definitions
- Hotspots: files and areas where small edits cause wide conflicts or CI breakage.
- Contract: a single source of truth describing required inputs/outputs for a gate or interface.
- Contract tests: unit tests that assert the contract using canonical examples.

Hotspots (treat as owned areas)
- .github/workflows/**
- scripts/ci/**
- package.json, package-lock.json
- prisma/schema.prisma, prisma/migrations/**
- src/app/admin/** core nav/search/layout (publishing/editor hotspots)

Hotspot ownership and merge rights
- Merge Captain is the owner of hotspots during merge cycles.
- During a merge crunch, only Merge Captain merges hotspot PRs.
- Others may open hotspot PRs, but they stay queued until Merge Captain picks them up.

Contract-first rule for CI gates
If a change can block merges, it must follow this sequence:
A) Contract PR (docs/template)
- Add or update a contract doc in docs/CI/
- Include canonical examples (valid/invalid)
- Update PR template or documentation that humans actually use
B) Implementation PR (code/tests)
- Implement against the contract
- Add/adjust contract tests
- Keep CLI wrappers thin
- Ensure local preflight covers this path when feasible

Never combine A and B in one PR unless it is trivial and low-risk.

PR sizing and scope rules
- Maximum one primary purpose per PR.
- If a PR touches a hotspot, it must be micro-sized.
- If it needs more than ~30 minutes of review, it is too big for a hotspot PR.
- Do not mix "behavior change" with "formatting" or "baseline churn".

No mass rebases
- Do not rebase long-lived PRs during crunch.
- If a PR conflicts heavily, close it and salvage with micro-PRs.
- Use a short-lived integration branch only when there is a single theme and a single owner.

Themed integration branches
When conflicts accumulate:
1) Pick ONE theme (example: editors/publishing, CI/guardrails, membership-tiers).
2) Create an integration branch owned by Merge Captain.
3) Merge queued PRs for that theme into the integration branch in small increments.
4) Keep the integration branch green at all times.
5) Merge the integration branch to main as soon as it is stable.

Preflight discipline (required for hotspot PRs)
Before opening or updating a hotspot PR:
- npm run -s typecheck
- If present: scripts/ci/preflight-local.zsh
- If touching CI gates: add or update contract tests

If preflight is not run, expect churn and rework.

CI gate change checklist (must be satisfied)
- Contract doc exists or is updated (docs/CI/*.md)
- Unit tests cover:
  - happy path(s)
  - empty input
  - none selected
  - multiple selections
- CLI wrapper:
  - reads input consistently
  - exits non-zero on invalid
  - prints clear error on invalid
- Human workflow:
  - PR template or docs match the parser expectations

Fail-fast on ambiguity
If a gate depends on human inputs (PR body, labels, templates), enforce exactly one canonical format.
Avoid "support many formats" unless contract tests exist for each format.

What to do when a merge cycle goes sideways
1) Stop. Do not keep patching in-place.
2) Capture intent as acceptance criteria in an issue.
3) Close churny PR(s).
4) Rebuild in two steps: Contract PR then Implementation PR.
5) Merge Contract PR first, then Implementation PR.
This resets the system and avoids sunk-cost spirals.

Work queue discipline
- Park conflicting PRs; do not churn them.
- Merge clean PRs first.
- Prefer docs-only "lights-out" jobs during hotspot conflicts.

Cadence
- Run merge captain daily at 11:00pm local:
  cd "$HOME/murmurant" && zsh ./MERGE_CAPTAIN.zsh

Success metrics (track monthly)
- Number of "red CI due to contract mismatch" incidents: target 0
- Median time from PR green to merged: target < 30 minutes
- Number of force-pushes to resolve CI churn: target near 0
- Number of closed-and-rebuilt PRs: track, but accept as healthy reset behavior

