# ClubOS — Release Safety and Change Control

Status: Canonical Specification  
Applies to: Production deployments  
Last updated: 2025-12-20

This document defines how changes are introduced into ClubOS safely.
Uncontrolled change is a primary cause of operational failure.

This document is normative.

---

## 1. Core Principle

Every change must be:
- Intentional
- Reviewable
- Reversible
- Observable

Speed is secondary to control.

---

## 2. Change Classes

All changes fall into one of the following classes:

### 2.1 Documentation Only
- No code
- No configuration
- No runtime impact

Deployment rules:
- May merge anytime

---

### 2.2 Low-Risk Code Change
Definition:
- Pure UI changes
- Internal refactors
- Read-only features
- No data mutation

Deployment rules:
- Requires review
- No emergency deploys
- Rollback optional

---

### 2.3 High-Risk Code Change
Definition:
- Data model changes
- Permission logic
- Publishing behavior
- Admin actions
- Background jobs

Deployment rules:
- Requires explicit approval
- Must include rollback plan
- Must define degraded behavior
- Must reference runbook

---

### 2.4 Emergency Change
Definition:
- Active incident mitigation
- Security vulnerability
- Data integrity threat

Deployment rules:
- Allowed only during incident
- Must be documented post-hoc
- Temporary by default

---

## 3. Deployment Gates

A production deploy MUST NOT proceed unless:

- CI passes
- Charter checks pass
- Migration safety checks pass
- A rollback strategy exists (if applicable)
- The change class is declared

Failure of any gate blocks deploy.

---

## 4. Rollback Requirements

For any high-risk change:
- Rollback steps MUST be documented
- Rollback MUST NOT require data mutation
- Rollback MUST be executable by a human

If rollback is impossible, deploy is forbidden.

---

## 5. Migration Rules

Database migrations MUST:
- Be forward-only
- Be idempotent where possible
- Avoid destructive changes
- Support rollback via application logic

Data deletion is NEVER part of an automatic migration.

---

## 6. Deployment Timing Rules

Production deployments SHOULD:
- Avoid peak usage hours
- Avoid board meetings and major events
- Avoid known integration windows

Emergency deploys are exempt.

---

## 7. Kill Switches

Critical systems MUST support:
- Feature-level disablement
- Publishing freeze
- Read-only mode

Kill switches must be server-side.

---

## 8. Auditability

Every production deploy MUST be traceable to:
- A PR
- An author
- A timestamp
- A change class

Anonymous deploys are forbidden.

---

## 9. Explicit Non-Goals

Release safety does NOT aim to:
- Eliminate bugs
- Guarantee perfect releases
- Enable continuous unsafe deploys

The goal is controlled evolution.

---

## 10. Enforcement

- Undeclared change class blocks merge
- Missing rollback blocks merge
- Ambiguity resolves toward delay

