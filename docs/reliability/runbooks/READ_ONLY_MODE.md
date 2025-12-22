# ClubOS - Runbook: Read-Only Mode (Human Procedure)

Status: Canonical Runbook
Applies to: Production incidents and readiness drills
Last updated: 2025-12-21

Objective:
Safely halt all writes when data integrity is uncertain, while preserving
safe read access where possible.

This runbook is documentation only.
It does not assume WRITE_GUARD exists or is enabled.

---

## 1. Trigger Conditions

Enter read-only posture when any of the following are true:

- Suspected data corruption
- Invariant violation (observed or suspected)
- Write safety cannot be guaranteed
- Incident scope is unclear and could affect authoritative data

Default: If in doubt, stop writes.

---

## 2. Preconditions

- Decision Log opened using docs/reliability/DECISION_LOG_TEMPLATE.md
- System Owner reachable (or escalation path invoked)
- Communication channel available for admins/operators

---

## 3. Human Actions (No Automation)

1) Declare read-only posture in the Decision Log
   - State that ALL writes are prohibited until cleared.

2) Notify operators and admins
   - Explicit instruction: no admin writes, no publishing, no membership changes.

3) Preserve evidence
   - Do not delete logs or attempt cleanup.

4) Start investigation
   - Identify likely failure domain(s)
   - Capture timestamps and symptoms

---

## 4. Verification

- Admins/operators acknowledge the freeze
- No write actions are performed after the declaration timestamp
- Any attempted write is treated as a policy violation and logged

---

## 5. Rollback (Resume Writes)

Resume writes only if ALL are true:

- System Owner approves
- A verification step is completed (see docs/reliability/DATA_INVARIANTS.md)
- Any suspected corruption is ruled out or corrected
- Decision Log records the rationale for resuming writes

---

## 6. Warnings

- Do not resume writes based on optimism or partial evidence.
- "Fast recovery" is forbidden if correctness is uncertain.
- If verification is incomplete, remain read-only.

