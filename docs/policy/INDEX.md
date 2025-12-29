# Murmurant Policy Master Index

Copyright (c) Santa Barbara Newcomers Club

> **Purpose**: This document provides a complete taxonomy and index of all policies enforced by Murmurant. It serves as the single source of truth for policy discovery, categorization, and cross-referencing.

---

## Quick Navigation

- [Policy Categories](#policy-categories)
- [Core Principles (P1-P10)](#core-principles-p1-p10)
- [Anti-Patterns (N1-N8)](#anti-patterns-n1-n8)
- [Risk Guardrails (R1-R6)](#risk-guardrails-r1-r6)
- [Operational Policies (POL-XXX)](#operational-policies-pol-xxx)
- [What Changed Recently](#what-changed-recently)

---

## Policy Categories

Murmurant policies are organized into three tiers:

| Tier | Prefix | Scope | Change Authority |
|------|--------|-------|------------------|
| **Core Principles** | P1-P10 | Architectural invariants | Charter amendment only |
| **Anti-Patterns** | N1-N8 | Prohibited behaviors | Charter amendment only |
| **Operational Policies** | POL-XXX | Club-specific rules | Board approval |

### Operational Policy Categories

| Category Code | Full Name | Description |
|--------------|-----------|-------------|
| **EVT** | Events | Event publishing, registration, and lifecycle policies |
| **MBR** | Membership | Membership status, renewal, and classification policies |
| **PRI** | Privacy | Member data visibility and protection policies |
| **COM** | Communications | Email, newsletter, and notification policies |
| **FIN** | Finance | Payment processing and financial record policies |
| **GOV** | Governance | Board procedures, voting, and officer policies |

---

## Core Principles (P1-P10)

These are the non-negotiable architectural principles that govern all Murmurant development. They are defined in `docs/ARCHITECTURAL_CHARTER.md`.

| ID | Title | Summary |
|----|-------|---------|
| **P1** | Identity and Authorization Must Be Provable | Every privileged action attributable to authenticated identity. Authorization decisions server-side and explainable. |
| **P2** | Default Deny, Least Privilege, Object Scope | Access denied by default. Permissions narrow. Authorization object-aware, not page-based. |
| **P3** | State Machines Over Ad-Hoc Booleans | All workflow domains have explicit states and transitions. No accumulating boolean flags. |
| **P4** | No Hidden Rules | Rules documented in plain English, discoverable in UI, inspectable in system. |
| **P5** | Every Important Action Must Be Undoable | Support undo/rollback, preview before commit, confirmation for destructive actions. |
| **P6** | Human-First UI Language | Everyday language, consistent terms, no developer jargon. Errors explain what happened, why, and what to do. |
| **P7** | Observability Is a Product Feature | Clear status indicators, meaningful logs, dashboards for "what changed", alerts for failures. |
| **P8** | Schema and APIs Are Stable Contracts | Backward compatibility or migration plan. Stable identifiers. Meaningful history. |
| **P9** | Security Must Fail Closed | If security checks fail, deny action, log incident, provide safe feedback. |
| **P10** | Chatbots Are Contributors, Not Authorities | Policies evaluated by code, tests verify behavior, schema constraints prevent invalid states. |

### Principle Cross-References

Each principle connects to specific enforcement mechanisms:

- **P1 + P7**: Audit logging required for all privileged actions
- **P2 + P9**: Default deny enforced at API layer
- **P3**: State machine enums in Prisma schema
- **P4 + P6**: UI help text and error message standards
- **P5**: Soft delete patterns and revision history
- **P8**: Migration files required for schema changes

---

## Anti-Patterns (N1-N8)

These are explicitly prohibited behaviors - the "never do this" rules to avoid legacy system problems.

| ID | Title | What It Prevents |
|----|-------|------------------|
| **N1** | Never Base Security on Page Visibility | "Members-only page" style gating without API enforcement |
| **N2** | Never Allow Coarse Roles to Replace Capabilities | Rigid role hierarchies without capability-based scoping |
| **N3** | Never Lock Workflows into Vendor Rigidity | Hard-coded workflows instead of configurable templates |
| **N4** | Never Create Hidden Admin Settings | Settings discoverable only by accident |
| **N5** | Never Let Automation Mutate Data Without Controls | Unaudited, non-idempotent automated changes |
| **N6** | Never Ship Without Permission Boundary Tests | Missing positive/negative authorization tests |
| **N7** | Never Store or Expose More PII Than Necessary | Excessive PII collection or ungated exports |
| **N8** | Never Allow Template Fragility | Unsafe template editing without preview/validation |

---

## Risk Guardrails (R1-R6)

These address specific risks from chatbot-maintained code.

| ID | Risk | Guardrail |
|----|------|-----------|
| **R1** | Inconsistent enforcement paths | One authorization module, lint rules for bypass detection |
| **R2** | Schema drift and breaking changes | Migration files required, backward compatibility notes, automated tests |
| **R3** | Proliferation of one-off helpers | No ad-hoc utilities in route files; shared libraries only |
| **R4** | Tests that don't reflect reality | E2E tests for forbidden access, role transitions, major flows |
| **R5** | Security regression via temporary bypass | Bypass mechanisms forbidden in production, CI checks |
| **R6** | Documentation mismatch | Docs required for behavior changes, chatbot trained only on approved docs |

---

## Operational Policies (POL-XXX)

These are club-specific policies approved by the Board of Directors. Full definitions are in `docs/policies/POLICY_REGISTRY.yaml`.

### Events (EVT)

| Policy ID | Title | Summary | Enforcement |
|-----------|-------|---------|-------------|
| **POL-EVT-001** | Event Publishing Schedule | Events published Sundays, registration opens Tuesdays 8AM Pacific | Automatic |
| **POL-EVT-002** | eNews Inclusion Policy | All published events included in weekly eNews digest | Automatic |

### Membership (MBR)

| Policy ID | Title | Summary | Enforcement |
|-----------|-------|---------|-------------|
| **POL-MBR-001** | Ending This Month Classification | Members expiring within calendar month classified for renewal outreach | Automatic |

### Privacy (PRI)

| Policy ID | Title | Summary | Enforcement |
|-----------|-------|---------|-------------|
| **POL-PRI-001** | Name and Location Display | Member names/city visible to authenticated members; addresses never displayed | Automatic |

### Communications (COM)

| Policy ID | Title | Summary | Enforcement |
|-----------|-------|---------|-------------|
| **POL-COM-001** | Email Sender Identity | All emails from @sbnewcomers.org with SPF/DKIM/DMARC | Automatic |

### Finance (FIN)

*No finance policies currently defined. Future policies will cover:*

- Payment processing rules
- Refund policies
- Financial record retention

### Governance (GOV)

*No governance policies currently defined. Future policies will cover:*

- Board meeting procedures
- Voting requirements
- Officer election rules

---

## Policy Status Summary

| Category | Active | Draft | Deprecated | Total |
|----------|--------|-------|------------|-------|
| Events | 2 | 0 | 0 | 2 |
| Membership | 1 | 0 | 0 | 1 |
| Privacy | 1 | 0 | 0 | 1 |
| Communications | 1 | 0 | 0 | 1 |
| Finance | 0 | 0 | 0 | 0 |
| Governance | 0 | 0 | 0 | 0 |
| **Total** | **5** | **0** | **0** | **5** |

---

## What Changed Recently

### December 2024

| Date | Change | Policy IDs Affected |
|------|--------|---------------------|
| 2024-12-20 | Created Policy Registry with initial 5 policies | POL-EVT-001, POL-EVT-002, POL-MBR-001, POL-PRI-001, POL-COM-001 |
| 2024-12-20 | Created Policy Master Index | - |
| 2024-12-19 | Added safe event cloning safeguards (P3, P6 enforcement) | - |
| 2024-12-18 | Added View As Member support tool (P7 observability) | - |

### Upcoming Reviews

| Policy ID | Next Review Date | Review Authority |
|-----------|-----------------|------------------|
| POL-EVT-001 | 2025-01-01 | Board of Directors |
| POL-EVT-002 | 2025-01-01 | Board of Directors |
| POL-MBR-001 | 2025-01-01 | Board of Directors |
| POL-PRI-001 | 2025-01-01 | Board of Directors |
| POL-COM-001 | 2025-01-01 | Board of Directors |

---

## Related Documents

### Core Documents

- [Architectural Charter](../ARCHITECTURAL_CHARTER.md) - Core principles, anti-patterns, and guardrails
- [Policy Registry](../policies/POLICY_REGISTRY.yaml) - Machine-readable policy definitions

### By Domain

**Authorization & RBAC**

- [AUTH_AND_RBAC.md](../rbac/AUTH_AND_RBAC.md)
- [VP_ACTIVITIES_SCOPE.md](../rbac/VP_ACTIVITIES_SCOPE.md)
- [ACTIVITIES_ROLES.md](../rbac/ACTIVITIES_ROLES.md)

**Governance**

- [MINUTES_WORKFLOW.md](../governance/MINUTES_WORKFLOW.md)
- [PARLIAMENTARIAN_ROLE.md](../governance/PARLIAMENTARIAN_ROLE.md)
- [SECRETARY_DASHBOARD.md](../governance/SECRETARY_DASHBOARD.md)

**Events**

- [EVENT_LIFECYCLE_DESIGN.md](../events/EVENT_LIFECYCLE_DESIGN.md)
- [EVENT_STATUS_LIFECYCLE.md](../events/EVENT_STATUS_LIFECYCLE.md)
- [POSTING_AND_REGISTRATION_SCHEDULE.md](../events/POSTING_AND_REGISTRATION_SCHEDULE.md)

---

## How to Add a New Policy

1. **Draft the policy** in `docs/policies/POLICY_REGISTRY.yaml` with status: `draft`
2. **Assign a Policy ID** following the format `POL-{CATEGORY}-{NUMBER}`
3. **Document enforcement points** in the `enforcementPoints` field
4. **Get Board approval** and update status to `active`
5. **Update this index** with the new policy summary
6. **Implement enforcement** in the codebase, referencing the Policy ID in comments

---

*Last updated: 2024-12-20*
*Maintainer: Murmurant Development Team*
