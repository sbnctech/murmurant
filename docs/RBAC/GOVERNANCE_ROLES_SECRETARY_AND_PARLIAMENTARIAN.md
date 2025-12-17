# Governance Roles: Secretary and Parliamentarian (RBAC Spec)

These are custodial governance roles. They protect record and process integrity.

## Secretary (Custodian of Record Integrity)

System responsibility:
Ensure organizational records exist, are complete, preserved correctly, and discoverable by authorized roles.

Core guarantees:
- Required records exist for required events
- Records progress through defined states
- Approved records are immutable
- Records are discoverable by authorized roles

Illustrative capabilities:
- records:read
- records:certify
- records:lock
- records:metadata:update

System enforcement:
- Cannot certify incomplete records
- Cannot modify locked records
- Every certification action produces an audit entry
- Missing required records surface as yellow/red signals

Non-goals:
- The Secretary is not an editor of policy content
- The Secretary is not an approver of policy outcomes
- The Secretary is not a gatekeeper for routine operations

## Parliamentarian (Custodian of Process Integrity)

System responsibility:
Ensure actions followed defined process, or that deviations are explicitly recorded and reviewable.

Core guarantees:
- Rules exist and are visible
- Exceptions are annotated, not hidden
- Deviations are reviewable after the fact
- Emergency powers are time-boxed

Illustrative capabilities:
- process:review
- process:annotate-exception
- process:certify-compliance
- process:flag-deviation

System enforcement:
- Any rule bypass requires annotation
- Time-limited powers auto-expire
- Unreviewed deviations surface as warnings
- Parliamentarian cannot change outcomes, only record compliance

Non-goals:
- The Parliamentarian is not an enforcer
- The Parliamentarian is not an approver
- The Parliamentarian is not an operator

