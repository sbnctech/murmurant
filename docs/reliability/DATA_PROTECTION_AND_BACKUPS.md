# Murmurant — Data Protection and Backups

Status: Canonical Specification  
Applies to: All environments (dev, staging, production)  
Last updated: 2025-12-20

This document defines how Murmurant protects, backs up, restores, and governs
all critical data. Data loss is the single highest-risk failure mode for the
organization.

This document is normative.

---

## 1. Core Principle

All data in Murmurant is classified as either:

- **Authoritative** (system of record)
- **Derived** (rebuildable)
- **Ephemeral** (discardable)

Authoritative data MUST be recoverable after catastrophic failure.

---

## 2. Data Inventory

### 2.1 Members
- Type: Authoritative
- Includes:
  - Identity
  - Membership status
  - Roles
  - Committees
- Source of truth: Primary database
- Loss tolerance: NONE

### 2.2 Events
- Type: Authoritative
- Includes:
  - Event definitions
  - Registrations
  - Attendance
- Source of truth: Primary database
- Loss tolerance: NONE (historical integrity required)

### 2.3 Payments / Financial Records
- Type: Authoritative
- Includes:
  - Transaction references
  - Invoices
  - Reconciliation metadata
- Source of truth: Primary database + external payment processor
- Loss tolerance: NONE

### 2.4 Pages / Published Content
- Type: Authoritative
- Includes:
  - Drafts
  - Published pages
  - Visibility rules
- Source of truth: Primary database
- Loss tolerance: LOW (restorable from backup only)

### 2.5 Permissions / Roles
- Type: Authoritative
- Includes:
  - Role assignments
  - Admin privileges
- Source of truth: Primary database
- Loss tolerance: NONE (security-critical)

### 2.6 Audit Logs
- Type: Authoritative
- Includes:
  - Admin actions
  - Content changes
- Source of truth: Append-only storage
- Loss tolerance: LOW (some loss acceptable, never silent)

### 2.7 Sessions / Tokens
- Type: Ephemeral
- Loss tolerance: FULL
- Recovery: Re-authentication

---

## 3. Backup Requirements

### 3.1 Backup Frequency
- Full logical backup: DAILY minimum
- Incremental backups: Optional
- On-demand snapshot before migrations: REQUIRED

### 3.2 Backup Scope
Backups MUST include:
- Schema
- Data
- Referential integrity

Backups MUST NOT rely on:
- Cached views
- Derived aggregates
- Client-side state

---

## 4. Retention Policy

- Daily backups retained: minimum 30 days
- Monthly backups retained: minimum 12 months
- Legal/financial retention may exceed this

Deletion of backups requires:
- Explicit authorization
- Logged action

---

## 5. Restore Guarantees

### 5.1 Restore Time Objective (RTO)
- Target: < 24 hours
- Best effort, not guaranteed

### 5.2 Restore Point Objective (RPO)
- Target: < 24 hours data loss
- Zero-loss is not guaranteed, but prioritized

### 5.3 Restore Authority
Only designated admins may perform restores.

All restores MUST:
- Be logged
- Be verified
- Produce a written confirmation

---

## 6. Verification

- Backups MUST be periodically verified by restore testing.
- A backup that has not been restored at least once is considered untrusted.

---

## 7. Explicit Non-Guarantees

Murmurant does NOT guarantee:
- Zero data loss in all scenarios
- Continuous availability during restore
- Automatic restore without human intervention

---

## 8. Enforcement

- Any system change that bypasses backups MUST NOT be merged.
- Any migration without a pre-migration backup MUST NOT run.
- Violations are treated as system defects, not feature debt.

---

## 9. Relationship to Other Documents

This document is enforced by:
- OPERATIONAL_GUARANTEES.md
- INCIDENT_RESPONSE_AND_RUNBOOKS.md
- ENFORCEMENT_RULES.md (future)

