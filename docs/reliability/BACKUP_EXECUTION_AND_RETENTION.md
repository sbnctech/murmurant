# Murmurant — Backup Execution and Retention

Status: Canonical Specification  
Applies to: All environments (dev, staging, production)  
Last updated: 2025-12-20

This document defines how Murmurant executes, stores, verifies, and governs backups
of authoritative data. Backups are the final defense against irreversible failure.

This document is normative.

---

## 1. Core Principle

Backups exist to guarantee **recoverability**, not availability.

A system that is fast but unrecoverable is a failed system.

---

## 2. Data Covered

The following data classes MUST be backed up:

### 2.1 Authoritative Data (MANDATORY)
- Members
- Membership status and history
- Roles and permissions
- Committees
- Pages and published content
- Blocks and ordering
- Events and registrations
- Financial records
- Audit logs
- Configuration state required to interpret data

Loss tolerance: **NONE**

### 2.2 Derived Data (OPTIONAL)
- Cached views
- Search indexes
- Aggregations

Loss tolerance: **Rebuildable**

Derived data MAY be excluded from backups.

---

## 3. Backup Types

Murmurant uses multiple backup layers:

### 3.1 Full Backups
- Snapshot of all authoritative data
- Used for disaster recovery

### 3.2 Incremental / WAL / PITR
- Captures changes between full backups
- Enables point-in-time restore

At least one restore path MUST allow recovery to within 15 minutes of failure.

---

## 4. Backup Frequency

Minimum required schedule (production):

| Backup Type | Frequency |
|------------|-----------|
| Full       | Daily     |
| Incremental / PITR | Continuous or ≤ 15 min |
| Metadata / Config  | On change + daily |

Non-production environments MAY relax frequency but MUST support restore.

---

## 5. Backup Execution Model

Backups MUST be:

- **Pull-based** (backup system reads from source)
- OR **append-only** (write-once streams)

Backups MUST NOT:
- Depend on application runtime health
- Run inside request paths
- Share credentials with production writers

Backup execution MUST be isolated from normal system operation.

---

## 6. Storage and Isolation

Backup storage MUST:

- Be physically or logically separate from production
- Use separate credentials and access controls
- Be immutable or append-only where supported

The following are FORBIDDEN:
- Storing backups in the same database
- Storing backups with shared admin credentials
- Storing backups without encryption at rest

---

## 7. Retention Policy

Minimum retention requirements:

| Data Type | Retention |
|---------|-----------|
| Full backups | ≥ 30 days |
| Incremental / PITR | ≥ 7 days |
| Monthly snapshots | ≥ 12 months |
| Audit backups | ≥ 24 months |

Retention MUST be automated and auditable.

---

## 8. Integrity and Verification

Each backup MUST produce:

- A success/failure signal
- A checksum or cryptographic hash
- A timestamp
- A dataset identifier

Backups without integrity metadata are INVALID.

Backup success MUST NOT be inferred from absence of error.

---

## 9. Access Control

Only the following roles MAY access backup systems:

- System Owner
- Explicitly designated Recovery Operators

Backup access MUST:
- Be logged
- Be attributable
- Require strong authentication

Application admins MUST NOT have implicit backup access.

---

## 10. Failure Handling

If a backup fails:

- Failure MUST be logged
- Alert MUST be raised
- Failure MUST be visible in admin observability

Repeated backup failure (>1 cycle) is a **SEV-1 incident**.

Silent backup failure is forbidden.

---

## 11. Auditability

Backup activity MUST be auditable:

- Backup start
- Backup completion
- Backup failure
- Restore attempts

Logs MUST include:
- Timestamp
- Dataset
- Actor or system identity
- Outcome

---

## 12. Explicit Non-Guarantees

Backups do NOT guarantee:

- Zero data loss
- Instant restoration
- Automatic recovery
- Human-free operation

Backups guarantee **recoverability**, not convenience.

---

## 13. Enforcement

- Any feature introducing authoritative data MUST be included in backups
- Backup exclusion requires explicit written justification
- Missing backup coverage is a merge blocker
- Backup specs supersede developer assumptions

This document is the authoritative source for backup behavior in Murmurant.
