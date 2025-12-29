# Murmurant — Incident Lifecycle, Review, and Learning Loop

Status: Canonical Specification
Applies to: All incidents, all environments
Last updated: 2025-12-21

This document defines the required lifecycle of an incident in Murmurant:
from detection through resolution, review, and system learning.

This document is normative.
An incident that is not reviewed is not resolved.

---

## 1. Core Principle

Incidents are not failures.
**Unreviewed incidents are failures.**

The goal of incident handling is:
1) Protect correctness and trust
2) Restore safe operation
3) Learn and strengthen the system

Speed without learning is regression.

---

## 2. Incident Lifecycle (Authoritative)

Every incident MUST pass through the following phases:

1. Detection
2. Classification
3. Stabilization
4. Investigation
5. Resolution
6. Review
7. Follow-up and learning

Skipping any phase is forbidden.

---

## 3. Detection

An incident may be detected via:
- Human report (member, admin, operator)
- Test failure
- Tabletop rehearsal outcome
- Manual review or audit

Detection does NOT require certainty.
Suspicion is sufficient to open an incident.

---

## 4. Classification

- Severity MUST be assigned immediately
- Follow docs/reliability/INCIDENT_SEVERITY_AND_CLASSIFICATION.md
- When unsure, classify as SEV-1

Classification MUST be recorded in a Decision Log.

---

## 5. Stabilization

Objective: Prevent further harm.

Depending on severity, stabilization MAY include:
- Read-only posture
- Publishing freeze
- Security containment
- Access restriction

Stabilization actions:
- MUST be logged
- MUST identify the decision maker
- MUST state rationale

---

## 6. Investigation

Objective: Establish facts without causing further damage.

Rules:
- Preserve evidence
- No speculative fixes
- No silent cleanup
- No data mutation unless explicitly approved

Investigation continues until:
- Root cause is understood OR
- Scope is bounded enough to resolve safely

---

## 7. Resolution

Objective: Restore safe operation.

Resolution MAY include:
- Code changes
- Configuration changes
- Data correction (with extreme caution)
- Restore from backup

Resolution MUST NOT:
- Violate data invariants
- Bypass authorization rules
- Skip verification steps

Writes may resume ONLY after:
- Required verification passes
- Appropriate authority approves
- Decision Log records justification

---

## 8. Incident Review (Mandatory for SEV-1)

After any SEV-1 incident:

- A review MUST be conducted
- Review MUST be written
- Review MUST be blameless
- Review MUST focus on system behavior, not individuals

Minimum review contents:
- What happened (timeline)
- What guarantees were stressed or violated
- What stopped further damage
- What failed or was unclear
- What changes are required

SEV-2 reviews are strongly recommended.
SEV-3 reviews are optional.

---

## 9. Follow-Ups and Learning

Every review MUST produce:
- Concrete follow-up actions
- Named owners
- Deadlines or next checkpoints

Examples:
- New or clarified runbooks
- Updated specs
- New failure injection tests
- Stronger CI gates
- Mechanism stub → implementation promotion

Unowned follow-ups are invalid.

---

## 10. Closure Rules

An incident may be closed only if:
- Severity is justified
- Decision Log is complete
- Required review is complete or scheduled
- Follow-ups have owners

Closing an incident without learning is forbidden.

---

## 11. Explicit Non-Goals

Incident handling does NOT aim to:
- Avoid all incidents
- Assign blame
- Protect egos
- Optimize MTTR at the expense of safety

The goal is resilience over time.

---

## 12. Enforcement

- Skipping incident review is a governance failure
- Repeated incidents without learning is a SEV-1 risk
- Features that complicate incident handling MUST NOT merge

This document defines how Murmurant learns from failure.

