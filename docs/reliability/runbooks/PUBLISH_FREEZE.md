# Murmurant - Runbook: Publishing Freeze (Human Procedure)

Status: Canonical Runbook
Applies to: Production incidents and readiness drills
Last updated: 2025-12-21

Objective:
Prevent new or modified content from becoming public while investigation
or remediation proceeds.

This runbook is documentation only.
It does not assume PUBLISH_GUARD exists or is enabled.

---

## 1. Trigger Conditions

- Suspected publishing correctness issue
- Unauthorized content exposure or audience leak
- Dependency failure affecting publish integrity
- Security incident involving content

Default: Freeze publishing rather than risk incorrect publication.

---

## 2. Preconditions

- Decision Log opened using docs/reliability/DECISION_LOG_TEMPLATE.md
- Publishing Owner reachable (or System Owner assumes authority)
- Communication channel available for admins/operators

---

## 3. Human Actions (No Automation)

1) Declare publishing freeze in the Decision Log
   - State that NO publish actions are permitted until cleared.

2) Notify admins/operators
   - Explicitly block: publish, unpublish, republish, audience changes.

3) Preserve current state references
   - Record known page slugs or identifiers involved
   - Record timestamps

4) Begin investigation
   - Identify suspected leak surface
   - Capture evidence

---

## 4. Verification

- Admins/operators acknowledge the freeze
- No publish actions are executed after the declaration timestamp

---

## 5. Rollback (Resume Publishing)

Resume publishing only if ALL are true:

- Publishing correctness issue is resolved
- Audience enforcement is validated (server-side)
- System Owner (or Publishing Owner) approves
- Decision Log records rationale and verification performed

---

## 6. Warnings

- Do not publish "small fixes" during a freeze.
- Do not assume drafts are safe.
- If audience enforcement is uncertain, treat as SEV-1.

