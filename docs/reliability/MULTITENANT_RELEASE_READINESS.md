Copyright (c) Santa Barbara Newcomers Club

# ClubOS - Multi-Tenant Release Readiness

Status: Canonical Specification
Applies to: All multi-tenant releases
Last updated: 2025-12-21

This document defines the requirements and gates for releasing changes
to a multi-tenant ClubOS environment. It ensures that no tenant is
exposed to risk without explicit acknowledgment and rollback capability.

This document is normative.

---

## 1. Purpose

Multi-tenant releases require additional scrutiny because:

- A single defect can impact all tenants simultaneously
- Tenant data isolation must be preserved at all times
- Rollback must not corrupt or expose cross-tenant data
- Different tenants may have different risk tolerances

This specification ensures that releases are classified, gated, and
promoted through defined channels with explicit approval at each stage.

---

## 2. Definitions

**Tenant**
A distinct organization using ClubOS with isolated data and configuration.
Tenants share infrastructure but must never access each other's data.

**Channel**
A release track that determines which tenants receive a change and when.
Channels have different stability expectations and eligibility rules.

**Release Classification**
A category that determines the risk profile of a change and the
approval requirements for promotion through channels.

**Kill Switch**
A mechanism to disable a feature or rollback a change without
requiring a new deployment. Kill switches must be pre-configured
before any release reaches tenants.

**Promotion**
Moving a release from one channel to the next (e.g., candidate to stable).
Promotion requires explicit approval and documented exit criteria.

---

## 3. Release Classification

Every release MUST be classified before entering any channel.
Classification determines approval requirements and rollback expectations.

| Class | Description | Examples | Approval Required | Rollback Requirement |
|-------|-------------|----------|-------------------|----------------------|
| UI-only | Visual changes with no data mutation | Button styling, label text, layout tweaks | Dev lead | Revert commit |
| Workflow change (non-destructive) | New user flows that do not modify existing data | New filtering UI, additional form fields (optional) | Dev lead + QA | Feature flag disable |
| Capability exposure (guarded) | New capability defined but not enabled by default | New admin panel (hidden), new API endpoint (gated) | Dev lead + System Owner | Kill switch + feature flag |
| Mechanism change (high risk) | Changes to data model, auth, audit, or recovery paths | Schema migration, permission model change, backup procedure | System Owner + explicit risk acceptance | Full rollback plan with restore verification |

**Rules:**

- If classification is unclear, the release MUST NOT proceed
- Classification is recorded in the release manifest and cannot be changed after promotion begins
- Mechanism changes require a separate decision memo before entering candidate channel

---

## 4. Channels and Eligibility

Releases progress through channels in order. Skipping channels is forbidden.

| Channel | Purpose | Tenant Eligibility | Duration | Exit Criteria |
|---------|---------|-------------------|----------|---------------|
| dev | Internal testing only | Dev/test tenants only | Unlimited | All tests pass, no regressions |
| experimental | Early adopter validation | Opt-in tenants with explicit consent | 1-2 weeks minimum | No SEV-1/SEV-2 incidents, positive feedback |
| candidate | Pre-stable soak period | All tenants except those on stable-only | 1 week minimum | No incidents, metrics within bounds |
| stable | General availability | All tenants | Permanent until superseded | N/A (this is the target) |

**Channel Rules:**

- A release MUST spend minimum duration in each channel before promotion
- Promotion requires documented approval (see Section 9)
- Any SEV-1 incident immediately halts promotion and triggers rollback evaluation
- Tenants may opt out of experimental but cannot opt out of stable

---

## 5. Tenant Exposure Plan

Before any release enters the experimental channel, a Tenant Exposure Plan
MUST be documented and approved.

**Required Elements:**

| Element | Description | Example |
|---------|-------------|---------|
| Tenant list | Which tenants will receive the release in experimental | "SBNC-dev, SBNC-staging, Partner-A-staging" |
| Opt-in requirement | How tenants consent to experimental exposure | "Written confirmation from tenant admin" |
| Duration | How long the experimental period will last | "2 weeks minimum, 4 weeks maximum" |
| Exit criteria | What must be true to promote to candidate | "Zero data incidents, <5% error rate increase" |
| Owner | Who is responsible for monitoring and decision | "Jane Doe, System Owner" |

**Tenant Exposure Plan Template:**

```
Release: [release-id]
Classification: [class]
Experimental Tenants: [list]
Opt-in Method: [method]
Start Date: [date]
Minimum Duration: [duration]
Exit Criteria:
  - [criterion 1]
  - [criterion 2]
Owner: [name]
Approved By: [name, date]
```

---

## 6. Data Safety Verification

Before any release enters candidate channel, the following data safety
checks MUST pass.

**Verification Checklist:**

- [ ] No cross-tenant data access possible (query isolation verified)
- [ ] Tenant ID present in all new database queries
- [ ] No shared mutable state between tenant contexts
- [ ] Audit log entries include tenant ID
- [ ] Backup and restore procedures unchanged or explicitly updated
- [ ] Data migration (if any) is idempotent and reversible
- [ ] Test tenant data used in dev/experimental is not production data

**Hard Stops (Blocking Rules):**

The following conditions MUST block promotion. No exceptions.

| Condition | Why It Blocks |
|-----------|---------------|
| Unclear release classification | Cannot determine appropriate gates |
| No rollback path defined | Cannot recover from failure |
| Unknown restore path for affected data | Cannot guarantee recoverability |
| Cross-tenant data access risk identified | Violates core isolation guarantee |
| Audit logging regression (fewer events logged) | Violates accountability guarantee |
| Kill switch not configured | Cannot disable without redeployment |
| Data migration not reversible | Cannot rollback without data loss |

If any hard stop is present, the release MUST NOT proceed until resolved.

---

## 7. Kill Switch and Rollback

Every release MUST have a defined kill switch and rollback plan before
entering experimental channel.

**Kill Switch Requirements:**

- Kill switch MUST be configurable without code deployment
- Kill switch MUST be testable in dev before experimental
- Kill switch activation MUST be logged in audit trail
- Kill switch MUST NOT cause data loss or corruption
- Kill switch MUST be documented in release manifest

**Rollback Plan Requirements:**

| Element | Requirement |
|---------|-------------|
| Rollback trigger | Defined conditions that require rollback |
| Rollback procedure | Step-by-step instructions |
| Rollback verification | How to confirm rollback succeeded |
| Data recovery (if needed) | Restore procedure reference |
| Communication plan | Who to notify and how |
| Rollback owner | Named individual responsible |

**Rollback Decision Authority:**

- UI-only: Dev lead may rollback without approval
- Workflow change: Dev lead may rollback; must notify System Owner
- Capability exposure: System Owner approval required for rollback
- Mechanism change: System Owner MUST approve; requires incident log entry

---

## 8. Observability and Attribution

Every release MUST maintain or improve observability. Observability
regressions are blocking.

**Required Observability:**

- [ ] All new user actions logged with actor ID and tenant ID
- [ ] All new errors logged with stack trace and context
- [ ] Release version identifiable in all log entries
- [ ] Metrics baseline established before experimental
- [ ] Alert thresholds defined for new error conditions

**Attribution Requirements:**

- Every admin action MUST be attributable to a named user
- Every automated action MUST be attributable to the system component
- Tenant ID MUST be present in all log entries
- Release ID MUST be present in deployment logs

**Observability Verification:**

Before promotion to candidate:

- [ ] Confirm logs are flowing from experimental tenants
- [ ] Confirm metrics are within expected bounds
- [ ] Confirm no new unattributed actions in audit log
- [ ] Confirm error rate has not increased beyond threshold

---

## 9. Decision Memo and Promotion Rules

Promotion between channels requires documented approval.

**Promotion Requirements by Transition:**

| Transition | Approver | Documentation Required |
|------------|----------|------------------------|
| dev -> experimental | Dev lead | Tenant Exposure Plan |
| experimental -> candidate | Dev lead + QA | Exit criteria met, no incidents |
| candidate -> stable | System Owner | GO/NO-GO decision memo |

**GO/NO-GO Decision Memo (Required for stable promotion):**

Every promotion to stable MUST have a written GO/NO-GO memo that includes:

```
GO/NO-GO DECISION MEMO

Release: [release-id]
Classification: [class]
Date: [date]

DECISION: GO / NO-GO

Approvers:
  - [Name], [Role], [Date]
  - [Name], [Role], [Date]

Checklist:
  - [ ] All channel durations met
  - [ ] No SEV-1 or SEV-2 incidents during soak
  - [ ] Data safety verification passed
  - [ ] Kill switch tested and functional
  - [ ] Rollback plan documented and tested
  - [ ] Observability verified
  - [ ] Exit criteria from Tenant Exposure Plan met

Known Risks Accepted:
  - [Risk 1]: [Rationale]
  - [Risk 2]: [Rationale]

Notes:
[Any additional context]

Signatures:
  - System Owner: _________________ Date: _______
  - Dev Lead: _________________ Date: _______
```

**Promotion Rules:**

- NO-GO requires written rationale and remediation plan
- GO with accepted risks requires explicit risk documentation
- Promotion without memo is forbidden
- Memo MUST be stored in release archive

---

## 10. Appendix: Example Filled Checklist

**Example Release: New Audit Panel Filtering UI**

This example demonstrates a Workflow change (non-destructive) release
that adds filtering controls to the admin audit panel.

---

**Release Manifest**

```
Release ID: 2025-01-15-audit-filter-ui
Classification: Workflow change (non-destructive)
Description: Add date range and action type filters to audit panel
Files Changed: src/components/admin/AuditPanel.tsx, src/lib/audit/filters.ts
Data Changes: None
Kill Switch: Feature flag AUDIT_FILTER_UI_ENABLED (default: false)
```

---

**Tenant Exposure Plan**

```
Release: 2025-01-15-audit-filter-ui
Classification: Workflow change (non-destructive)
Experimental Tenants: SBNC-dev, SBNC-staging
Opt-in Method: Internal decision (dev/staging only)
Start Date: 2025-01-15
Minimum Duration: 1 week
Exit Criteria:
  - Zero errors in filter query execution
  - Page load time increase < 200ms
  - No cross-tenant data leakage in filter results
Owner: Jane Doe, Dev Lead
Approved By: Jane Doe, 2025-01-14
```

---

**Data Safety Verification (Completed)**

- [x] No cross-tenant data access possible (tenant ID in all queries)
- [x] Tenant ID present in all new database queries
- [x] No shared mutable state between tenant contexts
- [x] Audit log entries include tenant ID
- [x] Backup and restore procedures unchanged
- [x] No data migration required
- [x] Test tenant data used in dev/experimental is not production data

---

**Kill Switch Configuration**

```
Flag: AUDIT_FILTER_UI_ENABLED
Default: false
Enabled for: SBNC-dev, SBNC-staging (experimental)
Activation: Environment variable, no redeploy required
Tested: 2025-01-14 in dev environment
```

---

**Rollback Plan**

```
Rollback Trigger:
  - Filter queries return incorrect results
  - Page load time increases > 500ms
  - Any cross-tenant data visible in results

Rollback Procedure:
  1. Set AUDIT_FILTER_UI_ENABLED=false in config
  2. Verify filter UI is hidden for all tenants
  3. Monitor error logs for 15 minutes
  4. Notify Dev Lead of rollback completion

Rollback Verification:
  - Confirm filter controls not visible
  - Confirm audit panel loads without errors
  - Confirm no filter-related queries in logs

Communication Plan:
  - Notify Dev Lead immediately
  - Notify System Owner within 1 hour
  - No external communication required (internal feature)

Rollback Owner: Jane Doe, Dev Lead
```

---

**GO/NO-GO Decision Memo (for stable promotion)**

```
GO/NO-GO DECISION MEMO

Release: 2025-01-15-audit-filter-ui
Classification: Workflow change (non-destructive)
Date: 2025-01-29

DECISION: GO

Approvers:
  - Jane Doe, Dev Lead, 2025-01-29
  - Bob Smith, System Owner, 2025-01-29

Checklist:
  - [x] All channel durations met (2 weeks in experimental, 1 week in candidate)
  - [x] No SEV-1 or SEV-2 incidents during soak
  - [x] Data safety verification passed
  - [x] Kill switch tested and functional
  - [x] Rollback plan documented and tested
  - [x] Observability verified (all filter actions logged)
  - [x] Exit criteria from Tenant Exposure Plan met

Known Risks Accepted:
  - None

Notes:
  Filter UI performed well in experimental and candidate.
  Page load increase was 85ms (within 200ms threshold).
  No errors or cross-tenant issues observed.

Signatures:
  - System Owner: Bob Smith, 2025-01-29
  - Dev Lead: Jane Doe, 2025-01-29
```

---

## See Also

- [Deployment Readiness Checklist](./DEPLOYMENT_READINESS_CHECKLIST.md) - Pre-deploy gates
- [Readiness Gaps and Risk Acceptance](./READINESS_GAPS_AND_RISK_ACCEPTANCE.md) - Risk tracking
- [Engineering Philosophy](../ENGINEERING_PHILOSOPHY.md) - Development principles
- [Work Queue](../backlog/WORK_QUEUE.md) - Implementation priorities
