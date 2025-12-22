# Release Classification (CI Contract)

Purpose
- Every PR must declare exactly one release classification so merges are predictable and CI gating is consistent.

Canonical format (required)
Use the PR template checkboxes and check exactly one:

- [ ] experimental
- [ ] candidate
- [ ] stable

Fallback format (accepted)
If a PR is created/edited via CLI, the first non-empty line may be a single token:

experimental
candidate
stable

Rules
1) Exactly one classification must be selected.
2) If multiple are detected, CI fails with an actionable error.
3) If none is detected, CI fails with an actionable error.

Examples

Valid (checkbox)
- [x] candidate

Valid (token)
candidate

Invalid (none)
- [ ] experimental
- [ ] candidate
- [ ] stable

Invalid (multiple)
- [x] experimental
- [x] stable
