# Murmurant - Engineering Philosophy

Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

Last updated: 2025-12-21


## Purpose

Murmurant is a system of record for a real organization.
We optimize for correctness, authorization safety, recoverability, and trust.
We do not optimize for raw feature velocity.


## How We Build

We use spec-first, guarantee-driven development.

- Guarantees first, features second.
- Failure is a first-class input (not an edge case).
- Ambiguity resolves toward denial, safety, and reversibility.
- Defaults are conservative.
- Human operation is part of the system (runbooks, decision logs, tabletops).
- We separate "Defined -> Stubbed -> Implemented -> Enabled".
  - Stubs must be inert by default.
  - Enablement must be explicit, reviewable, and reversible.


## Non-Negotiables

- No silent data loss of authoritative data.
- No unauthorized access or audience leaks.
- No partial writes that can corrupt state.
- No "best-effort" behavior that hides uncertainty.
- No production changes without rollback story and auditability.
- No deployment without named ownership and explicit risk acceptance.


## Suitable For

This approach is suitable for:

- Systems of record (membership, events, financial history, governance).
- Small teams and volunteer operations where failures are expensive.
- Long-lived systems that must be maintainable by future admins.
- Environments where trust and correctness matter more than speed.


## Not Optimized For

This approach is not optimized for:

- Throwaway MVPs where failure is cheap.
- Growth-at-all-cost feature experimentation.
- Systems where eventual inconsistency is acceptable.


## Definition of "Ready"

"Ready" means: safe to deploy if directed.
It does NOT mean: already operating in production.

Readiness is governed by:
- docs/reliability/DEPLOYMENT_READINESS_CHECKLIST.md
- docs/reliability/READINESS_GAPS_AND_RISK_ACCEPTANCE.md
- docs/reliability/GUARANTEE_TO_MECHANISM_MATRIX.md


## Review Rule

If a change conflicts with a guarantee, it must not ship.
