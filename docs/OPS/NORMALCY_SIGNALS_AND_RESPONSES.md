# Normalcy Signals and Responses (Spec)
Derived from: docs/WHAT_IS_NORMAL.md

This document maps "not normal" red flags into enforceable or observable system signals
and expected system responses. It is a design input for RBAC, audit, alerts, and UI.

## Red flags -> signals -> system response

| Red Flag (from WHAT_IS_NORMAL) | Detectable? | Required System Signal | Who Sees It | Expected System Response |
|---|---|---|---|---|
| Silent failures where actions appear to succeed but nothing changes | Yes | Action recorded with no state delta | Actor + Admin | Warning banner; audit annotation required |
| Repeated manual work to fix the same issue without root cause review | Yes | Same override or correction repeated | Admin / Board | Escalation report; trend indicator |
| Leaders avoiding actions due to fear of breaking the system | Indirect | High preview usage + low commit rate | Admin | Promote preview; provide rollback confidence |
| Missing or inconsistent signals (status, roles, permissions) | Yes | Validation errors; missing joins; inconsistent status | Admin | Hard validation; blocking warnings where appropriate |
| No audit trail for decisions that affect members | Yes | State change without audit entry | System | Block action (hard fail) |
| Emergency access or workarounds becoming routine | Yes | Elevated role duration exceeds threshold | Board / Parliamentarian | Forced review; auto-expire elevation |

## Design principles

- Normal should feel easy and safe.
- Abnormal should be visible, reviewable, and slightly uncomfortable.
- Nothing bad should be silent.

