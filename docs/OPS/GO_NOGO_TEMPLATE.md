<!--
  Copyright © 2025 Murmurant, Inc. All rights reserved.
-->

# Go/No-Go Declaration Template

```
Status: TEMPLATE
Version: 1.0
Created: 2025-12-29
Related: WORK_QUEUE.md D3, WA_CUTOVER_PLAN.md
```

---

## Instructions

This template is used to make formal Go/No-Go decisions for deployments,
migrations, or other significant operational changes. Copy this template,
fill in all sections, and obtain required sign-offs before proceeding.

---

## 1. Decision Summary

| Field | Value |
|-------|-------|
| **Decision ID** | `GNGO-YYYY-MM-DD-###` |
| **Decision Date** | _[Date of decision meeting]_ |
| **Subject** | _[Brief description of what's being decided]_ |
| **Decision** | ⬜ GO / ⬜ NO-GO / ⬜ CONDITIONAL GO |
| **Target Date** | _[When the action will be taken if GO]_ |

---

## 2. Context

### 2.1 What is being deployed/changed?

_[Describe the change in plain language. What will be different after this action?]_

### 2.2 Why now?

_[Explain the timing. What makes this the right time?]_

### 2.3 What happens if we don't proceed?

_[Describe the impact of delaying or not proceeding]_

---

## 3. Readiness Checklist

### 3.1 Technical Readiness

| Criterion | Status | Evidence | Owner |
|-----------|--------|----------|-------|
| All tests passing | ⬜ Ready / ⬜ Not Ready | _[Link to CI run]_ | |
| Zero critical bugs | ⬜ Ready / ⬜ Not Ready | _[Link to bug tracker]_ | |
| Performance validated | ⬜ Ready / ⬜ Not Ready | _[Link to perf report]_ | |
| Security review complete | ⬜ Ready / ⬜ Not Ready | _[Link to review]_ | |
| Rollback tested | ⬜ Ready / ⬜ Not Ready | _[Link to test results]_ | |
| Monitoring configured | ⬜ Ready / ⬜ Not Ready | _[Link to dashboards]_ | |
| Documentation updated | ⬜ Ready / ⬜ Not Ready | _[Link to docs]_ | |

### 3.2 Operational Readiness

| Criterion | Status | Evidence | Owner |
|-----------|--------|----------|-------|
| Runbooks updated | ⬜ Ready / ⬜ Not Ready | _[Link to runbooks]_ | |
| On-call scheduled | ⬜ Ready / ⬜ Not Ready | _[Schedule link]_ | |
| Support team briefed | ⬜ Ready / ⬜ Not Ready | _[Meeting notes]_ | |
| Communication drafted | ⬜ Ready / ⬜ Not Ready | _[Draft link]_ | |
| Rollback owner assigned | ⬜ Ready / ⬜ Not Ready | _[Name]_ | |

### 3.3 Business Readiness

| Criterion | Status | Evidence | Owner |
|-----------|--------|----------|-------|
| Stakeholder approval | ⬜ Ready / ⬜ Not Ready | _[Approval record]_ | |
| User communication sent | ⬜ Ready / ⬜ Not Ready | _[Email/notice link]_ | |
| Quiet period confirmed | ⬜ Ready / ⬜ Not Ready | _[Calendar link]_ | |
| Fallback plan agreed | ⬜ Ready / ⬜ Not Ready | _[Plan document]_ | |

---

## 4. Risk Assessment

### 4.1 Identified Risks

| Risk | Likelihood | Impact | Mitigation | Owner |
|------|------------|--------|------------|-------|
| _[Risk 1]_ | Low/Med/High | Low/Med/High | _[How mitigated]_ | |
| _[Risk 2]_ | Low/Med/High | Low/Med/High | _[How mitigated]_ | |
| _[Risk 3]_ | Low/Med/High | Low/Med/High | _[How mitigated]_ | |

### 4.2 Blockers

| Blocker | Status | Resolution Path | ETA |
|---------|--------|-----------------|-----|
| _[Blocker 1]_ | ⬜ Resolved / ⬜ Open | _[How to resolve]_ | |
| _[Blocker 2]_ | ⬜ Resolved / ⬜ Open | _[How to resolve]_ | |

---

## 5. Decision Criteria

### 5.1 GO Criteria (all must be true)

- [ ] All "Ready" items in Section 3 are checked
- [ ] No High-Impact blockers in Section 4.2
- [ ] All required sign-offs obtained (Section 7)
- [ ] Rollback procedure tested and documented
- [ ] Monitoring and alerting in place

### 5.2 NO-GO Criteria (any triggers NO-GO)

- [ ] Any critical blocker unresolved
- [ ] Missing required sign-off
- [ ] Rollback not tested
- [ ] Insufficient on-call coverage
- [ ] External dependency unavailable

### 5.3 CONDITIONAL GO Criteria

A CONDITIONAL GO may be declared when:
- Minor issues exist but have known workarounds
- All critical criteria are met
- Specific conditions must be met before execution

**Conditions for this CONDITIONAL GO:**
_[List specific conditions that must be met]_

---

## 6. Execution Plan

### 6.1 Timeline

| Time | Activity | Owner | Duration |
|------|----------|-------|----------|
| T-24h | Final readiness review | | 1 hour |
| T-1h | Pre-deployment checklist | | 30 min |
| T+0 | Begin deployment | | |
| T+30m | Smoke tests | | 15 min |
| T+1h | Operator validation | | 30 min |
| T+2h | All-clear or rollback decision | | |

### 6.2 Rollback Trigger

Initiate rollback if:
- _[Condition 1]_
- _[Condition 2]_
- _[Condition 3]_

### 6.3 Communication Plan

| Audience | When | Channel | Message |
|----------|------|---------|---------|
| Internal team | T-1h | Slack | "Deployment starting" |
| Users | T+1h | Email | "Update complete" |
| Stakeholders | T+2h | Email | "Summary report" |

---

## 7. Sign-offs

### 7.1 Required Sign-offs

| Role | Name | Sign-off | Date | Notes |
|------|------|----------|------|-------|
| Technical Lead | | ⬜ Approved / ⬜ Rejected | | |
| Operations Lead | | ⬜ Approved / ⬜ Rejected | | |
| Product Owner | | ⬜ Approved / ⬜ Rejected | | |

### 7.2 Optional Sign-offs

| Role | Name | Sign-off | Date | Notes |
|------|------|----------|------|-------|
| Security | | ⬜ Approved / ⬜ N/A | | |
| Legal | | ⬜ Approved / ⬜ N/A | | |

---

## 8. Decision Record

### 8.1 Final Decision

| Field | Value |
|-------|-------|
| **Decision** | ⬜ GO / ⬜ NO-GO / ⬜ CONDITIONAL GO |
| **Decision Date** | |
| **Decision Maker** | |
| **Rationale** | _[Brief explanation of decision]_ |

### 8.2 If NO-GO

| Field | Value |
|-------|-------|
| **Reason** | _[Why NO-GO was declared]_ |
| **Remediation** | _[What needs to happen before next attempt]_ |
| **Next Review Date** | |

### 8.3 If CONDITIONAL GO

| Condition | Must Be Met By | Owner | Verified |
|-----------|---------------|-------|----------|
| _[Condition 1]_ | _[Date/time]_ | | ⬜ |
| _[Condition 2]_ | _[Date/time]_ | | ⬜ |

---

## 9. Post-Decision Actions

- [ ] Communicate decision to all stakeholders
- [ ] Update project tracking systems
- [ ] Schedule execution (if GO)
- [ ] Document lessons learned (if NO-GO)
- [ ] Archive this decision record

---

## 10. Appendix

### 10.1 Related Documents

| Document | Link |
|----------|------|
| Technical spec | |
| Rollback procedure | |
| Monitoring dashboard | |
| User communication | |

### 10.2 Meeting Notes

_[Attach or link to notes from Go/No-Go meeting]_

---

_Template version 1.0 - Last updated 2025-12-29_
