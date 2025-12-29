# Murmurant - Runbook: Backup Verification (Paper Drill)

Status: Canonical Runbook
Applies to: Pre-deployment readiness and incidents
Last updated: 2025-12-21

Objective:
Verify backup coverage and restore viability without executing real backups.

This runbook is a documentation drill only.

---

## 1. Trigger Conditions

- Readiness review
- Incident involving data safety
- Pre-deployment checkpoint

---

## 2. Preconditions

- Decision Log opened using docs/reliability/DECISION_LOG_TEMPLATE.md
- docs/reliability/BACKUP_EXECUTION_AND_RETENTION.md reviewed
- Authoritative data inventory reviewed

---

## 3. Human Steps (No Automation)

1) List authoritative datasets
   - Members, roles, pages, blocks, events, financials, audit logs

2) Confirm backup types required
   - Full backups
   - PITR/WAL or equivalent

3) Confirm retention requirements
   - Full >= 30 days
   - PITR >= 7 days
   - Monthly >= 12 months
   - Audit >= 24 months

4) Confirm integrity requirements
   - checksum/hash
   - timestamp
   - dataset id

5) Confirm restore procedure exists end-to-end
   - Steps are explicit
   - Verification criteria exist

---

## 4. Verification Output

Record in Decision Log:
- Datasets covered (yes/no)
- Retention meets requirements (yes/no)
- Restore procedure completeness (yes/no)
- Gaps and owners

---

## 5. Warnings

- Do not assume backups exist.
- Absence of error is not proof of backup success.
- Any gap is a deployment blocker.

