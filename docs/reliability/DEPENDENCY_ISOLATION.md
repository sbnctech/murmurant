# ClubOS — Dependency Isolation and Blast Radius Control

Status: Canonical Specification  
Applies to: All runtime domains  
Last updated: 2025-12-20

This document defines how ClubOS isolates failures so that
a fault in one domain does not cascade into systemic failure.

This document is normative.

---

## 1. Core Principle

No single failure may:
- Corrupt unrelated data
- Disable unrelated read paths
- Escalate privileges
- Freeze the organization unnecessarily

Isolation is preferred over availability.

---

## 2. Defined Failure Domains

ClubOS explicitly separates the following domains:

- Member Identity & Roles
- Authorization / Permissions
- Pages & Publishing
- Blocks & Content
- Events & Registrations
- Financial Records
- Admin UI
- Public UI
- Background Jobs
- External Integrations
- Observability

Domains communicate through defined contracts only.

---

## 3. Isolation Rules

- A failure in one domain MUST NOT cause writes in another
- Cross-domain writes MUST be transactional or blocked
- Shared data access MUST be read-only unless explicitly authorized

Implicit coupling is forbidden.

---

## 4. External Dependencies

Failures in external systems MUST:
- Be isolated at the boundary
- Never block core data reads
- Never corrupt authoritative data

External failures degrade features, not the system.

---

## 5. Background Jobs

- Job failure MUST NOT affect request paths
- Jobs MUST be retryable and idempotent
- Jobs MAY be paused without data loss

Jobs are optional acceleration, not core availability.

---

## 6. Admin vs Public Isolation

- Admin failures MUST NOT affect public reads
- Public failures MUST NOT affect admin recovery
- Privileged paths MUST be independently operable

Recovery paths must remain accessible.

---

## 7. Degraded Behavior

If a domain is unsafe:
- Writes in that domain MUST halt
- Reads MAY continue if safe
- Other domains MUST remain operational

Prefer partial capability over full shutdown.

---

## 8. Blast Radius Definition

Each domain MUST define:
- What it depends on
- What depends on it
- What happens when it fails

Undefined blast radius is forbidden.

---

## 9. Explicit Non-Guarantees

ClubOS does NOT guarantee:
- Seamless cross-domain availability
- Transparent failure masking
- Automatic failover across domains

---

## 10. Enforcement

- New dependencies require explicit declaration
- Undeclared coupling is a merge blocker
- Violations are SEV-1 incidents

This document enforces survivability over elegance.
