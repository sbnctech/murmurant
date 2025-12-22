# ClubOS — Operational Ownership and On-Call Guarantees

Status: Canonical Specification  
Applies to: Production operations  
Last updated: 2025-12-20

This document defines human operational ownership in ClubOS.
Reliability is meaningless without clear authority and responsibility.

This document is normative.

---

## 1. Core Principle

Every critical system MUST have:
- A named owner
- A defined escalation path
- Explicit authority boundaries

Ambiguous ownership is a reliability failure.

---

## 2. Operational Roles

ClubOS defines the following roles:

### System Owner
- Ultimately accountable for system integrity
- Owns final recovery decisions
- Approves irreversible actions

### On-Call Operator
- First responder to incidents
- May execute predefined runbooks
- May activate degraded modes

### Reviewer
- Conducts post-incident review
- Has no emergency authority

One person may hold multiple roles, but roles remain distinct.

---

## 3. On-Call Expectations

ClubOS does NOT guarantee:
- 24/7 immediate response
- Sub-minute recovery

ClubOS DOES guarantee:
- A defined on-call rotation or fallback
- A documented response expectation window
- Visibility when no one is available

---

## 4. Authority Boundaries

On-call operators MAY:
- Disable features
- Freeze writes
- Place system in read-only mode

On-call operators MUST NOT:
- Modify data directly
- Bypass permissions
- Perform irreversible actions

---

## 5. Escalation Rules

Escalation MUST occur when:
- Data integrity is uncertain
- Security failure is suspected
- Recovery requires irreversible action

No operator may escalate to themselves.

---

## 6. Incident Decision Logging

All emergency actions MUST:
- Be logged
- Include rationale
- Identify the actor

Missing decision logs invalidate the action.

---

## 7. Burnout and Sustainability

ClubOS prioritizes:
- Predictable load
- Bounded responsibility
- Sustainable operations

Heroics are considered a failure mode.

---

## 8. Explicit Non-Guarantees

ClubOS does NOT guarantee:
- Immediate human response
- Expert availability at all times
- Perfect judgment under stress

The system is designed to survive imperfect humans.

---

## 9. Enforcement

- Features without clear ownership MUST NOT ship
- Runbooks without owners are invalid
- Authority ambiguity is a SEV-1 risk

This document defines how humans safely operate ClubOS.
