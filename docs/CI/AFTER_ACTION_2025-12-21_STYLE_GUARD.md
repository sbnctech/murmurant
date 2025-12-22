# After Action Report (AAR): Style Guard CI + Chipdown Cycle
Date: 2025-12-21 to 2025-12-22
Owner: Merge Captain
Scope: PRs #192, #193, #194 (style-guard baseline + CI wiring + first chipdown)

## Executive Summary
This merge cycle was harder than it should have been because CI contracts were not fully satisfied before PRs were opened:
- Release classification gate failed due to missing required marker in PR bodies.
- Typecheck failed because a CI script used by a unit test was not a TS module and did not export the function expected by the test.
- style-guard workflow failed because Prisma runs during postinstall and the workflow did not provide DATABASE_URL in the correct YAML location.
- Tooling and shell details (zsh globbing + quoted paths, patch drift, PR base drift) created extra rework.

Net effect: multiple CI failures, multiple retries, PR rework across branches, and reduced confidence in the merge sequence.

## Timeline (Condensed)
1) PR #192 opened (baseline guardrails). CI failed:
   - Release classification gate: no classification in PR body.
   - Typecheck: scripts/ci/check-release-classification.ts not a module; test import failed.
2) PR #193 opened (CI wiring). CI failed:
   - Release classification gate.
   - style-guard job: npm ci triggers prisma generate; DATABASE_URL missing.
3) PR #194 opened (chipdown). Depended on baseline branch; CI failed due to upstream failures.
4) Fix attempts introduced additional friction:
   - Quick "export {}" made the file a module but did not export parseReleaseClassification.
   - Later edits mismatched unit test contract (tests expected a structured result object).
   - YAML env was inserted at wrong indentation (env must be under job, not sibling of runs-on).
5) Resolution steps:
   - Add release classification to PR bodies.
   - Align parseReleaseClassification implementation to unit test contract and export it.
   - Rewrite workflow YAML with DATABASE_URL under jobs.style-guard.env.
   - Retarget PR bases after merge order is satisfied.

## What Went Wrong (Root Causes)
### RC1: CI gates were added but not operationally integrated
Symptoms:
- PR body classification was required, but authors did not consistently include it.
Why:
- No PR template checkbox or default text guiding the author.
- No local preflight check for PR body gates.

### RC2: Script/test contract mismatch for release classification
Symptoms:
- Typecheck failure: "not a module" then "function not exported" then contract mismatch.
Why:
- Unit tests expect a parseReleaseClassification return object (valid/classification/error/selectedCount),
  while the script previously returned a simpler union type or null.
- The script was treated as a CLI-only file, but tests import it as a module.

### RC3: Workflow assumptions about Prisma were not encoded
Symptoms:
- style-guard workflow failed during npm ci because prisma generate runs in postinstall and requires DATABASE_URL.
Why:
- Workflow did not set DATABASE_URL.
- Initial quick patch placed env at the wrong YAML level.

### RC4: Branch/base drift and patch applicability issues
Symptoms:
- Patch "does not apply" when trying to replay a local change on a clean branch.
Why:
- The file context changed between branches (main vs baseline vs CI wiring branch).
- The chipdown PR was based on baseline branch to pick up scripts, then later needed retargeting.

### RC5: Shell and tooling paper cuts (avoidable)
Symptoms:
- zsh: "no matches found" due to parentheses in path when not quoted.
- gh pr checks JSON schema changes ("conclusion" field not available) broke automation script.
Why:
- Scripts assumed bash-like globbing behavior or older gh JSON fields.

## What Went Well
- Once contracts were identified (PR body marker, module export, workflow env), fixes were straightforward.
- The "make it deterministic" approach (rewrite workflow file fully) reduced guesswork.
- Merge order discipline (baseline -> CI wiring -> chipdown) was correct.

## Action Items (Prevent Recurrence)
### A1: Make release classification easy and unavoidable (High)
- Update PR template to include a required checkbox section:
  - [ ] Release classification: experimental | candidate | stable
- Add a tiny "PR BODY STARTER" snippet in the template so the gate passes by default.

### A2: Stabilize the release-classification module contract (High)
- Treat scripts/ci/check-release-classification.ts as a library + CLI:
  - Export parseReleaseClassification() that returns the structured object expected by tests.
  - Keep CLI behavior using that function.
- Add a comment header in the script that states the contract and where it is tested.

### A3: Encode Prisma assumptions into workflow patterns (High)
- Any workflow that runs npm ci must define DATABASE_URL at the job level.
- Add docs/CI/PRISMA_RULES.md (or extend existing) with "postinstall runs prisma generate" note.
- Add a standard workflow snippet file or doc block that includes the env line.

### A4: Preflight before opening PRs (High)
Add a local preflight script (or Make target) that runs:
- npm run -s typecheck
- npm run -s ci:style-guard:baseline (when relevant)
- git status --porcelain must be empty
- grep in PR body for release classification (or instruct "use PR template")
This should be part of MERGE_CAPTAIN.zsh and also suggested to contributors.

### A5: Harden gh-based automation against schema changes (Medium)
- Prefer human-readable parsing of "gh pr checks" output, not JSON fields that may change.
- If JSON is needed, log available fields and fail soft.

### A6: Reduce branch/base drift (Medium)
- For dependency PRs, explicitly label "STACKED ON #192" and set base accordingly.
- After base PR merges, immediately retarget dependent PRs and rerun checks.
- Avoid mixing multiple concerns in a dependent PR (scripts + chipdown in one PR) unless unavoidable.

### A7: Shell safety rules (Medium)
- Always quote paths, especially with parentheses: "src/app/(member)/..."
- Prefer: git add -- "path" rather than unquoted globs.

## Proposed Process Update (Merge Captain Checklist)
Before opening/stacking PRs:
1) Confirm required CI gates and what triggers them (release classification, prisma env, style guard).
2) Run local preflight commands.
3) Ensure PR template text is used (classification line present).
4) If stacking, document base PR number and use correct base branch at PR creation.

## Backlog Notes (Not part of this incident but related)
- Add a "Theme Preview" page for design token validation.
- Add a "Brand Assets" pack for logo/bullet in SVG/PNG/PDF and standard sizes.

