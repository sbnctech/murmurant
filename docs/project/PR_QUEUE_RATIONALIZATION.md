# PR Queue Rationalization

Date: 2025-12-13

Goal: Reduce drift and merge risk by establishing a clear merge order and rules for docs-only work.

## Rules that prevent drift
1. One PR, one intent.
2. Update cross-references (SYSTEM_SPEC.md section links) when adding new rules.
3. Prefer additive changes over rewrites unless explicitly doing a cleanup pass.
4. When documents conflict, prefer the most recent source; if recency is unclear, mark TBD and request an owner decision.

## Merge order recommendation

### Docs-only PRs (recommended merge order)
- #3: docs: define finance manager role and quickbooks integration boundary (docs/roles-finance-manager-workflows)
  - https://github.com/sbnctech/clubos/pull/3
- #4: docs: add workflow library stubs for key roles (docs/workflow-library-stubs)
  - https://github.com/sbnctech/clubos/pull/4
- #5: docs: define access control model roles groups capabilities (docs/rbac-groups-capabilities)
  - https://github.com/sbnctech/clubos/pull/5
- #6: docs: specify partnerships delegation for registration payment cancellation (docs/partnerships-delegation)
  - https://github.com/sbnctech/clubos/pull/6
- #7: docs: normalize terminology and cross-references (final coherence pass) (docs/coherence-pass-terminology)
  - https://github.com/sbnctech/clubos/pull/7
- #8: docs: event-specific guest release requirement (docs/guest-release-agreement)
  - https://github.com/sbnctech/clubos/pull/8
- #9: docs: clarify RBAC scope delegation and agreement gates (docs/rbac-scope-and-gates)
  - https://github.com/sbnctech/clubos/pull/9
- #10: docs: add event policy gates (venue, guests, drop-ins, insurance) (docs/event-policy-gates)
  - https://github.com/sbnctech/clubos/pull/10
- #11: docs: define agreement tracking and eligibility gates (docs/agreements-eligibility-gates)
  - https://github.com/sbnctech/clubos/pull/11
- #12: docs: external systems and SSO specification (docs/external-systems-sso)
  - https://github.com/sbnctech/clubos/pull/12
- #13: docs: reporting chatbot spec and saved query library (docs/reporting-chatbot-spec)
  - https://github.com/sbnctech/clubos/pull/13
- #14: docs: restore reporting/chatbot and readiness/persona analysis notes (wip/restore-stash-20251213-091230)
  - https://github.com/sbnctech/clubos/pull/14
- #15: docs: specify external systems, SSO plan, and JotForm/Bill.com roadmap (docs/external-systems-sso-v2)
  - https://github.com/sbnctech/clubos/pull/15
- #16: docs: specify agreements, releases, and partnership delegation gates (docs/agreements-and-partnerships-spec)
  - https://github.com/sbnctech/clubos/pull/16
- #17: docs: specify reporting and chatbot subsystem with secure query library (docs/reporting-chatbot-spec-v2)
  - https://github.com/sbnctech/clubos/pull/17
- #18: docs: harvest workflow requirements from SBNC training materials (docs/workflow-requirements-harvest)
  - https://github.com/sbnctech/clubos/pull/18

### Non-doc PRs (not covered here)
- #1: RBAC foundation: admin protection, role model, and docs (day4-rbac-auth)
- #2: Add regression prevention for admin events server component bug (chore/regression-guardrails-admin-events)

## Dependency notes

- If two docs PRs touch the same file, merge the more foundational one first (RBAC foundation before role-specific workflows before reporting).
- If a PR introduces new terms, merge it before PRs that reference those terms.
- If a PR adds new hard gates, merge it before reporting/chatbot specs that must enforce them.

