# Claude Code Rules for ClubOS
Copyright (c) Santa Barbara Newcomers Club

This repository is maintained primarily by chatbots. Before making any change:

1) Read docs/ARCHITECTURAL_CHARTER.md (the ClubOS constitution).
2) In your plan, cite the specific principles (P1..P10) and anti-patterns (N1..N8) that apply.
3) All authorization must be server-side, default-deny, and object-scoped. UI gating is never sufficient.
4) Every privileged action must produce an audit log entry.
5) No hidden rules: behavior must be explainable in plain English and visible in the UI.
6) Workflow domains must use explicit state machines, not ad-hoc boolean flags.
7) Changes must include tests that prove permission boundaries and critical workflows remain correct.
8) If a change modifies user-visible behavior, update documentation in the same PR.

If a change violates the charter, it must not be merged.
