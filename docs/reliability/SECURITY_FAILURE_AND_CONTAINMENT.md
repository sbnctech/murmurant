# ClubOS — Security Failure and Containment Guarantees

Status: Canonical Specification  
Applies to: All production environments  
Last updated: 2025-12-20

This document defines how ClubOS behaves when security assumptions fail.
The objective is containment, visibility, and preservation of trust.

This document is normative.

---

## 1. Core Principle

When security is uncertain:
- Deny access rather than guess
- Contain blast radius immediately
- Prefer false negatives over false positives

Security failures are SEV-1 by default.

---

## 2. Failure Classes

Security failures include:
- Authentication bypass
- Authorization bugs
- Role misconfiguration
- Token leakage
- Insider misuse
- Unexpected privilege escalation

---

## 3. Immediate Containment Rules

On suspected security failure:
- Writes MUST be disabled
- Admin actions MAY be restricted
- Public access MAY be reduced

Containment takes precedence over availability.

---

## 4. Authorization as a Hard Gate

Authorization failures:
- MUST block access
- MUST NOT fall back
- MUST NOT infer intent

Server-side enforcement only.

---

## 5. Blast Radius Limitation

Security failures MUST be scoped:
- To the smallest affected role
- To the smallest affected resource
- To the shortest duration possible

Global disablement is allowed if scope is unclear.

---

## 6. Audit and Detection

All security-sensitive actions MUST:
- Be logged
- Be attributable
- Be reviewable

Missing audit data is itself a security failure.

---

## 7. Human-in-the-Loop Requirement

Automatic recovery from security failures is forbidden.
Resolution requires:
- Human review
- Explicit remediation
- Verification before restore

---

## 8. Degraded Mode Interaction

Security uncertainty:
- Forces degraded mode
- May trigger read-only operation
- May restrict admin access

---

## 9. Explicit Non-Guarantees

ClubOS does NOT guarantee:
- Zero vulnerabilities
- Automatic detection of all abuse
- Prevention of insider misuse

The goal is containment and trust.

---

## 10. Enforcement

- Features without security failure behavior MUST NOT merge
- Ambiguity resolves toward denial
- Violations are SEV-1 incidents

This document defines how ClubOS survives security failure.
