# Murmurant - Runbook: Security Containment Event (Human Procedure)

Status: Canonical Runbook
Applies to: Production incidents and readiness drills
Last updated: 2025-12-21

Objective:
Contain blast radius immediately when a security assumption fails.

This runbook is documentation only.
It does not assume any automated containment switches exist.

---

## 1. Trigger Conditions (SEV-1 by default)

- Suspected authentication bypass
- Authorization bug (audience leak, privilege escalation)
- Token leakage or credential compromise
- Insider misuse or untraceable admin action

Default: Deny and contain immediately.

---

## 2. Preconditions

- Decision Log opened using docs/reliability/DECISION_LOG_TEMPLATE.md
- Security Incident Owner reachable (or System Owner assumes authority)
- Evidence preservation plan acknowledged

---

## 3. Human Actions (No Automation)

1) Declare SEV-1 security incident in Decision Log

2) Suspend all write and admin actions
   - Instruction: no role changes, no publishing, no membership edits.

3) Restrict access scope
   - Limit admin access to smallest set of trusted operators
   - Reduce public exposure if uncertain

4) Preserve evidence
   - Do not delete logs, records, or artifacts
   - Capture timestamps, affected routes, and suspected accounts

5) Begin investigation
   - Identify breach surface
   - Identify data exposure risk

---

## 4. Verification

- Write and admin actions are halted by policy
- Restricted operator set is confirmed
- Evidence is preserved and referenced

---

## 5. Rollback (End Containment)

Containment may end only if ALL are true:

- Root cause understood
- Remediation applied
- Verification performed (no leak, no bypass)
- System Owner and Security Owner approve
- Decision Log records rationale

---

## 6. Warnings

- Automatic recovery from security incidents is forbidden.
- Cleanup before evidence capture is forbidden.
- If scope is unclear, prefer global restriction.

