# Finance Workflow Specification

## Purpose
Define auditable, role-gated financial workflows.

## Roles
- Requestor
- Finance Manager
- VP of Finance
- President
- Board

## Objects
- Reimbursement
- Vendor Payment
- Refund
- Event Closeout

## Approval States
- Draft
- Submitted
- Finance Review
- VP Approval
- President Approval
- Board Approval (conditional)
- Approved
- Rejected

## Gates
- Separation of duties
- Budget availability
- Amount thresholds
- Board-required categories

## Audit
- Append-only
- Actor, role, timestamp, before/after
