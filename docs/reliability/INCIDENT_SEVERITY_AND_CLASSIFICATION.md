# Murmurant — Incident Severity and Classification

Status: Canonical Specification
Applies to: All incidents, all environments
Last updated: 2025-12-21

This document defines how incidents are classified in Murmurant,
what severity means, and what actions are REQUIRED at each level.

This document is normative.
Severity ambiguity is a reliability failure.

---

## 1. Core Principle

Severity is determined by **risk to correctness, trust, and safety**,
not by user sentiment, time pressure, or inconvenience.

If correctness or authorization is uncertain:
- Severity MUST be elevated
- Writes MUST stop
- Humans MUST intervene

---

## 2. Severity Levels (Authoritative)

Murmurant uses three severity levels only.

### SEV-1 — Critical (System Safety at Risk)

Definition:
Any incident where **data correctness, authorization, or recoverability**
is uncertain or violated.

This includes BOTH confirmed failures and credible suspicion.

Mandatory triggers (non-exhaustive):
- Data corruption (observed or suspected)
- Invariant violation
- Unauthorized data access or audience leak
- Privilege escalation or missing audit trail
- Backup failure beyond tolerance
- Restore path unclear during an incident
- Security assumptions invalidated
- Writes occurring when safety is uncertain

Required posture:
- Writes MUST stop
- Admin actions MUST be restricted
- Decision Log REQUIRED
- Human-in-the-loop REQUIRED
- Incident review REQUIRED before closure

SEV-1 is the default when unsure.

---

### SEV-2 — Degraded but Safe

Definition:
The system is **operationally impaired**, but correctness,
authorization, and recoverability are NOT in doubt.

Examples:
- External dependency outage with isolation working
- Elevated latency
- Partial feature unavailability
- Observability gaps with no data risk

Required posture:
- Degrade affected features
- Preserve core guarantees
- Decision Log REQUIRED
- Writes MAY continue if safety is proven

Escalate to SEV-1 if uncertainty emerges.

---

### SEV-3 — Minor / Localized

Definition:
Localized issues with no impact on correctness, authorization,
or recoverability.

Examples:
- UI bugs
- Non-authoritative display issues
- Known-safe failures with clear boundaries

Required posture:
- Track and fix
- No degraded mode required
- Decision Log optional

SEV-3 MUST NOT block incident response for higher severity events.

---

## 3. Severity Assignment Rules

- Severity is assigned by the **On-call Operator** initially
- System Owner may elevate but MUST NOT downgrade without evidence
- Any participant may request escalation

Forbidden:
- Downgrading severity to reduce workload
- Closing incidents without review when SEV-1 occurred

---

## 4. Severity → Mandatory Actions Matrix

| Severity | Writes | Admin Actions | Decision Log | Runbooks | Review Required |
|--------|--------|---------------|--------------|----------|-----------------|
| SEV-1  | STOP   | RESTRICT      | REQUIRED     | REQUIRED | REQUIRED        |
| SEV-2  | CONDITIONAL | ALLOWED | REQUIRED     | OPTIONAL | RECOMMENDED     |
| SEV-3  | ALLOWED | ALLOWED       | OPTIONAL     | OPTIONAL | OPTIONAL        |

---

## 5. Relationship to Runbooks

Severity determines which runbooks MUST be considered.

Examples:
- SEV-1 data risk → READ_ONLY_MODE.md
- SEV-1 auth issue → SECURITY_CONTAINMENT.md
- SEV-2 dependency outage → feature degradation only

Runbooks do NOT determine severity.
Severity determines runbook applicability.

---

## 6. Relationship to Tabletop Scenarios

Each tabletop scenario MUST:
- Declare an initial severity
- Identify escalation triggers
- Define failure conditions that mandate SEV-1

Tabletops that cannot be classified are invalid.

---

## 7. Incident Closure Rules

An incident may be closed only if:
- Severity is justified with evidence
- Decision Log is complete
- Required reviews are scheduled or completed
- Follow-up actions have owners

SEV-1 incidents MUST NOT be closed without review.

---

## 8. Explicit Non-Goals

Severity classification does NOT aim to:
- Minimize incident count
- Avoid uncomfortable decisions
- Optimize for speed
- Protect reputations

The goal is safety and trust.

---

## 9. Enforcement

- Misclassification of severity is itself an incident
- Repeated under-classification is a governance failure
- Features without clear severity behavior MUST NOT merge

This document is the authoritative source for incident severity in Murmurant.

