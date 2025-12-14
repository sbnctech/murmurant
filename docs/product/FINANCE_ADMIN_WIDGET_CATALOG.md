# Finance Admin Widget Catalog (v1)

## Goal
Define the initial set of finance/admin widgets needed to run operations safely with least privilege.

## Principles
- Widgets are renderers, not deciders.
- All eligibility and filtering is server-side.
- Every widget declares RBAC sensitivity (Low/Medium/High).

## Widget List (v1)

### 1) Finance Approval Queue (Medium)
- Audience: Finance Manager, VP Finance, President, Board (scoped)
- Purpose: Show items requiring action
- Data: finance approvals (pre-filtered)

### 2) Reimbursement Submission Status (Low)
- Audience: Requester
- Purpose: Show my submissions and states
- Data: own items only

### 3) Missing Receipt / Incomplete Packet Queue (Medium)
- Audience: Finance Manager
- Purpose: Identify items blocked by missing artifacts
- Data: flags only; no bank info

### 4) Over-Threshold Items (High)
- Audience: VP Finance, President
- Purpose: Show items exceeding policy thresholds
- Data: amounts, status, audit-safe requester display

### 5) Board Approval Queue (High)
- Audience: Board
- Purpose: Show items requiring board vote and outcome state
- Data: summary only; deep links to board packet

### 6) Finance Deny/Exception Log (High)
- Audience: Finance Manager (read), President (read)
- Purpose: See blocked actions and reasons (audit)
- Data: actor role, action, reason, timestamp (no secrets)

## Shared Contract Dependencies
- List Gadget Contract
- Query Filter Catalog (allowlisted keys)
- ViewerContext (role + scope)
- Deep link rules (no privilege escalation)

## Rollout
- Phase 1: read-only widgets + deny tests
- Phase 2: safe mutation flows (separate contracts)
