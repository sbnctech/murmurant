# Maintainability Guardrails (Humans and Agents)

Goals
- Future maintainers can safely change the system without tribal knowledge.
- Agents can operate with strict constraints and predictable structure.

Rules
1. Small PRs
- One deliverable per PR.
- No drive-by edits.
- If a change touches more than 5 files, justify in PR body.

2. Contracts are source of truth
- Code changes must cite the contract section they implement.
- If contract is unclear, update docs first (separate PR).

3. Fail closed
- Deny by default when ViewerContext, auth, or RBAC is missing.
- No silent fallback to broader access.

4. No secrets in widgets
- Widgets must not store credentials or tokens.
- Widgets receive only opaque ViewerContext and server-rendered data.

5. Server-side filtering only
- Widgets must not implement privacy rules.
- Widgets must not infer eligibility (member level, role, opt-outs).

6. Logging and audit
- All write actions require audit log entry (append-only).
- Audit includes actor, target, before/after, timestamp.

7. Documentation for every endpoint
- Purpose
- Inputs
- Outputs
- Auth/RBAC requirements
- Privacy filtering notes
- Error codes

8. Testing requirements
- Permission tests must cover allow and deny.
- Deny tests are mandatory for every new endpoint.

9. Agent operating mode
- Agents must end with a single-screen report:
  - git status -sb
  - files changed
  - 5 bullets max
  - READY FOR REVIEW or BLOCKED
- Agents must not merge or rebase main.
