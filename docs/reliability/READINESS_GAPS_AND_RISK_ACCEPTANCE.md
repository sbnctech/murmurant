# Murmurant — Readiness Gaps, Known Risks, and Explicit Acceptances

Status: Canonical Specification
Applies to: Pre-deployment readiness and governance
Last updated: 2025-12-21

This document defines how Murmurant records what is NOT ready,
what risks are known and accepted, and under what conditions
deployment may proceed despite incomplete mechanisms.

This document is normative.

Undocumented risk is an unmanaged risk.

---

## 1. Core Principle

Murmurant does NOT require perfection before deployment.
Murmurant DOES require **explicit acknowledgment** of gaps and risks.

If a gap exists:
- It MUST be documented
- It MUST have an owner
- It MUST have a rationale
- It MUST have an exit condition

Silence is forbidden.

---

## 2. Definitions

### Readiness Gap
A missing, incomplete, or non-enabled mechanism that is required
for full production robustness but is intentionally not yet active.

### Known Risk
A potential failure mode or operational weakness introduced
by a readiness gap.

### Risk Acceptance
A conscious, documented decision by an authorized owner
to proceed despite a known risk.

---

## 3. What MUST Be Recorded Here

This document MUST list:

- All production-critical mechanisms that are:
  - Defined but not Stubbed
  - Stubbed but not Implemented
  - Implemented but not Enabled
- All operational capabilities that are planned but not live
- All assumptions that would be invalid in a real incident

If something is discussed elsewhere, it must still be summarized here.

---

## 4. Risk Acceptance Authority

Only the following roles may accept risk:

- System Owner (required)
- Security Owner (for security risks)
- Backup/Recovery Owner (for data risks)

Risk acceptance MUST:
- Be written
- Name the accepting authority
- State scope and duration
- Be reversible

---

## 5. Risk Acceptance Matrix (Authoritative)

Each gap MUST be represented as a row.

Columns:
- Gap / Missing Capability
- Impacted Guarantees
- Risk Introduced
- Why This Is Acceptable *for now*
- Accepting Authority
- Review Date / Exit Condition

Example (illustrative):

| Gap | Impacted Guarantees | Risk Introduced | Rationale | Accepted By | Review / Exit |
|----|--------------------|----------------|-----------|-------------|---------------|
| Backups not yet running | Recoverability | Data loss if incident occurs now | Pre-launch, no real users yet | System Owner | Before first production deploy |
| Failure injection not executed | Confidence in degraded modes | Undetected failure behavior | Docs-only phase | System Owner | Before enabling WRITE_GUARD |

All real entries MUST be concrete and specific.

---

## 6. Relationship to Deployment Readiness

docs/reliability/DEPLOYMENT_READINESS_CHECKLIST.md
requires this document to exist and be reviewed.

Deployment MAY proceed ONLY IF:
- All readiness gaps are documented here
- All gaps have explicit risk acceptance
- No gap violates a **hard stop** guarantee (see below)

---

## 7. Non-Acceptable Risks (Hard Stops)

The following risks CANNOT be accepted:

- Unknown ownership of authoritative data
- Unknown restore path for authoritative data
- Silent writes when invariants may be violated
- Unauthorized access without containment plan
- Inability to stop writes or publishing by policy

If any of the above exist, deployment MUST NOT proceed.

---

## 8. Review and Expiration

Risk acceptance is NOT permanent.

Rules:
- Every accepted risk MUST have a review date or exit condition
- Expired acceptances are INVALID
- Re-acceptance requires explicit reaffirmation

Accepted risk without review is a governance failure.

---

## 9. Auditability

This document serves as:
- Evidence of informed decision-making
- Input to incident reviews
- Context for post-incident learning

During an incident, reviewers MUST check whether:
- The incident involved an accepted risk
- The acceptance was still valid
- The rationale held

---

## 10. Explicit Non-Goals

This document does NOT:
- Excuse negligence
- Replace engineering work
- Minimize the seriousness of gaps
- Allow permanent deferral

The goal is honesty and control.

---

## 11. Enforcement

- Undocumented gaps block deployment
- Implicit risk acceptance is forbidden
- Repeated incidents tied to accepted risks REQUIRE escalation
- This document MUST be reviewed before any production deployment

This document defines how Murmurant deploys responsibly before it is complete.

