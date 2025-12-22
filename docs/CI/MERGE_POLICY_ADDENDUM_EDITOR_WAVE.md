# Merge Policy Addendum: Editor/Publishing Wave

Scope: Editor/publishing integration waves that touch hotspot paths.

Rules
- Do not rebase wave branches.
- Do not cherry-pick commits out of wave branches into unrelated branches.
- Follow-up fixes land on the wave branch while the PR is open, or as micro-PRs after merge.
- Park conflicting PRs; label as parked + blocked-by-editor-wave; salvage later via micro-PRs.

Micro-PR salvage template (post-wave)
1. Create a fresh branch from main (post-wave merge)
2. Identify the smallest coherent slice (one feature, one test set)
3. Apply as manual edits or minimal clean cherry-picks
4. Add/adjust tests
5. Keep PR small (target < 300 net LOC; split if larger)
6. Merge ASAP to reduce drift
