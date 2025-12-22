# ClubOS — Incident Response and Runbooks

Status: Canonical Specification  
Applies to: Production operations  
Last updated: 2025-12-20

This document defines how incidents are detected, classified, responded to,
and documented in ClubOS.

This document is normative.

---

## 1. Core Principle

Incidents are handled to:
- Protect data integrity first
- Preserve member trust second
- Restore service third
- Optimize speed last

Fast recovery is meaningless if it causes corruption.

---

## 2. Incident Severity Levels

### SEV-1 — Critical
Definition:
- Data corruption
- Data loss
- Authentication bypass
- Organization-wide outage

Required response:
- Immediate human intervention
- Writes disabled if applicable
- Incident record REQUIRED

---

### SEV-2 — Major
Definition:
- Admin UI unavailable
- Publishing blocked
- Member-facing errors affecting many users

Required response:
- Human review within 1 hour
- Temporary mitigations allowed
- Incident record REQUIRED

---

### SEV-3 — Minor
Definition:
- Single feature degraded
- Non-critical integration failure
- Performance degradation

Required response:
- Human review within 24 hours
- Incident record OPTIONAL

---

## 3. Incident Detection Sources

An incident may be detected by:
- Automated alerts
- Admin UI warnings
- Log review
- User reports
- Developer observation

All sources are valid.

---

## 4. Authority During Incidents

During an incident:
- Any FULL ADMIN may declare an incident
- Any FULL ADMIN may disable writes
- No individual may override safety guards
- No code changes during live incident response

---

## 5. Mandatory Runbooks

The following runbooks MUST exist and be maintained:

- Database restore
- Permission rollback
- Publishing freeze
- Emergency read-only mode
- Admin access recovery

Missing runbooks are a release blocker.

---

## 6. Incident Record Requirements

For SEV-1 and SEV-2 incidents, a written record MUST include:

- Timestamp (start / end)
- Severity
- Systems affected
- User impact
- Actions taken
- Data integrity assessment
- Follow-up actions

Blame is explicitly prohibited.

---

## 7. Post-Incident Review

After any SEV-1 incident:
- A review MUST be conducted
- Preventive actions MUST be identified
- Guardrails MUST be strengthened if applicable

No incident may be closed without review.

---

## 8. Explicit Non-Goals

Incident response does NOT aim to:
- Eliminate all outages
- Prevent all human error
- Achieve zero incidents

The goal is survivability and trust.

---

## 9. Enforcement

- Features without runbooks MUST NOT ship
- Incident shortcuts are forbidden
- Documentation is part of the system

