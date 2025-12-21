# Release Governance Playbook

Copyright (c) Santa Barbara Newcomers Club
Status: Normative
Last Updated: 2025-12-21

---

## Purpose

This playbook defines the exact sequence of gates for releasing ClubOS features.
It consolidates existing review gates into a single enforceable workflow.

**Constraints:**

- No new process roles (works with 2-3 engineers)
- Every gate has a binary pass/fail
- Skipping requires documented justification
- One engineer can execute the entire flow

---

## Gate Sequence Overview

```
FEATURE PR                    TENANT ROLLOUT                 GA PROMOTION
    |                              |                              |
    v                              v                              v
+--------+                   +-----------+                  +-----------+
| G1: CI |                   | G5: Pilot |                  | G8: GA    |
+--------+                   | Entry     |                  | Readiness |
    |                        +-----------+                  +-----------+
    v                              |                              |
+--------+                         v                              v
| G2: WA |                   +-----------+                  +-----------+
| Immun. |                   | G6: Pilot |                  | G9: GA    |
+--------+                   | Exit      |                  | Approval  |
    |                        +-----------+                  +-----------+
    v                              |                              |
+--------+                         v                              v
| G3: CL |                   +-----------+                  +-----------+
| Review |                   | G7: Limit |                  | G10: GA   |
+--------+                   | Rollout   |                  | Monitor   |
    |                        +-----------+                  +-----------+
    v
+--------+
| G4: PR |
| Merge  |
+--------+
```

---

## Phase 1: Feature PR Gates

These gates apply to every PR that modifies user-facing behavior, data, or
permissions.

### G1: CI Gate (Automated)

**Type:** Mandatory, Automated
**Owner:** CI System
**Blocking:** Yes

| Check | Pass Criteria |
|-------|---------------|
| Build | `npm run build` succeeds |
| Types | `npm run typecheck` reports 0 errors |
| Unit tests | `npm run test:unit` passes |
| Lint | `npm run lint` reports 0 errors |
| E2E (stable) | `npm run test-e2e:stable` passes |

**Skip conditions:** None. CI cannot be skipped.

---

### G2: WA-Immunity Gate (Manual Review)

**Type:** Mandatory for mutations, permissions, state changes
**Owner:** PR Author + Reviewer
**Blocking:** Yes

**Source:** [WA_IMMUNITY_REVIEW_GATE.md](../reliability/WA_IMMUNITY_REVIEW_GATE.md)

| Pattern | Question | Required Answer |
|---------|----------|-----------------|
| MF-1 | Does delete leave financial records intact? | Yes |
| MF-1 | Are side effects visible in preview? | Yes |
| MF-2 | Is delete soft (deletedAt), not hard? | Yes |
| MF-2 | Are content changes versioned? | Yes |
| MF-3 | Is capability specific, not admin:full? | Yes |
| MF-3 | Can capability be scoped to one object? | Yes |
| MF-4 | Does user see errors? | Yes |
| MF-4 | Do background failures notify admin? | Yes |
| MF-5 | Is state an enum, not boolean flags? | Yes |
| MF-5 | Are transitions validated? | Yes |
| MF-6 | Does mutation create audit entry? | Yes |
| MF-6 | Are background jobs attributed? | Yes |
| MF-7 | Is there a kill switch for high-risk? | Yes (if applicable) |
| MF-7 | Is there a rollback plan? | Yes (if applicable) |

**Skip conditions:**

- Documentation-only changes
- Test-only changes
- Read-only features with no mutations

**Skip format:** Add to PR description:
```
WA-Immunity Gate: N/A
Reason: [documentation-only | test-only | read-only]
```

---

### G3: Cognitive Load Gate (Manual Review)

**Type:** Mandatory for UI/workflow changes
**Owner:** PR Author + Reviewer
**Blocking:** Yes

**Source:** [COGNITIVE_LOAD_REVIEW_GATE.md](../reliability/COGNITIVE_LOAD_REVIEW_GATE.md)

| Pattern | Question | Required Answer |
|---------|----------|-----------------|
| CL-1 | Do all new terms match standard SaaS vocabulary? | Yes |
| CL-1 | Could a Mailchimp/Stripe user guess the meaning? | Yes |
| CL-2 | Is every conditional behavior visible in UI? | Yes |
| CL-2 | Can user see the context that changes behavior? | Yes |
| CL-3 | Are cross-entity effects shown before execution? | Yes |
| CL-3 | Can user see what depends on this entity? | Yes |
| CL-4 | Does same action always produce same result? | Yes |
| CL-4 | Does UI state reflect when behavior will vary? | Yes |
| CL-5 | Would a first-day volunteer understand the risk? | Yes |
| CL-5 | Is destructive potential shown in UI, not docs? | Yes |

**Skip conditions:**

- Backend-only changes with no UI impact
- API-only changes (still check CL-3 for cascades)
- Performance optimizations with no behavioral change

**Skip format:** Add to PR description:
```
Cognitive Load Gate: N/A
Reason: [backend-only | api-only | performance-only]
```

---

### G4: PR Merge Gate (Final Approval)

**Type:** Mandatory
**Owner:** Reviewer
**Blocking:** Yes

| Check | Pass Criteria |
|-------|---------------|
| G1 passed | CI status green |
| G2 passed or N/A | WA-Immunity checklist complete or justified skip |
| G3 passed or N/A | Cognitive Load checklist complete or justified skip |
| Risk score documented | For non-trivial changes, risk score in PR description |
| LGTM | At least one approval from team member |

**PR Description Template:**

```markdown
## Summary
[What this PR does]

## Risk Score
- Cognitive Load: [1-5]
- Blast Radius: [1-5]
- Reversibility: [1-5]
- Composite: [4-15]
- Risk Tier: [Low | Moderate | High | Critical]

## Gates
- [ ] G1: CI passing
- [ ] G2: WA-Immunity (or N/A: reason)
- [ ] G3: Cognitive Load (or N/A: reason)

## Rollback Plan
[Required for Moderate+ risk tier]
```

---

## Phase 2: Tenant Rollout Gates

These gates apply when deploying features to production tenants.

### G5: Pilot Entry Gate

**Type:** Mandatory for Risk Score >= 7
**Owner:** Release Owner (any engineer on the PR)
**Blocking:** Yes

| Check | Pass Criteria |
|-------|---------------|
| Risk score >= 7 | Feature requires pilot validation |
| Pilot tenant identified | At least one tenant has opted in |
| Kill switch implemented | Feature can be disabled per-tenant in < 15 min |
| Kill switch tested | Disable/enable verified in staging |
| Rollback plan documented | Section 5.3 of Feature Risk Model complete |
| Internal testing complete | 48+ hours of team usage without P0/P1 |

**Skip conditions:**

- Risk Score 4-6 (Low tier) can skip to G7 Limited Rollout
- Risk Score < 4 can skip directly to G8 GA Readiness

**Skip format:** Add to release notes:
```
Pilot Entry: Skipped
Risk Score: [score]
Justification: Low risk tier, [brief rationale]
```

---

### G6: Pilot Exit Gate

**Type:** Mandatory for piloted features
**Owner:** Release Owner
**Blocking:** Yes

| Check | Pass Criteria |
|-------|---------------|
| Duration met | Minimum 1 week with active pilot usage |
| No regressions | No P0/P1 bugs in pilot tenant |
| Pilot feedback | Tenant confirmed acceptable experience |
| Support load | No unusual support volume from pilot |
| Kill switch verified | Tested disable/enable during pilot |
| Metrics stable | Error rates, latency within baseline |

**Evidence required:**

- Pilot tenant sign-off (email, Slack, or issue comment)
- Metrics dashboard screenshot showing stability
- Support ticket count for pilot period

---

### G7: Limited Rollout Gate

**Type:** Mandatory for Risk Score >= 10
**Owner:** Release Owner
**Blocking:** Yes

| Check | Pass Criteria |
|-------|---------------|
| Pilot exit complete | G6 passed |
| Rollout cohort defined | Up to 20% of tenants selected |
| Tenant diversity | Cohort includes size/usage variation |
| Release notes published | Changelog available |
| Support briefed | Support team knows about feature |
| Monitoring configured | Alerts for error rate increase |

**Duration:** Minimum 2 weeks before GA promotion.

**Skip conditions:**

- Risk Score 7-9 (Moderate) can proceed to GA after pilot exit
- Must document skip with release owner sign-off

---

## Phase 3: GA Promotion Gates

These gates apply when promoting a feature to all tenants.

### G8: GA Readiness Gate

**Type:** Mandatory
**Owner:** Release Owner
**Blocking:** Yes

| Check | Pass Criteria |
|-------|---------------|
| All required stages complete | Per risk tier requirements |
| 30 days stable | No rollback triggers since last stage |
| Documentation updated | User-facing docs reflect feature |
| Changelog published | Feature listed in changelog |
| No open blockers | No P0/P1 bugs related to feature |

**Required stages by risk tier:**

| Risk Tier | Required Stages Before GA |
|-----------|---------------------------|
| Low (4-6) | Internal only |
| Moderate (7-9) | Internal + Pilot |
| High (10-12) | Internal + Pilot + Limited |
| Critical (13+) | Internal + Pilot + Limited + Extended |

---

### G9: GA Approval Gate

**Type:** Mandatory for Risk Score >= 10
**Owner:** Release Owner
**Blocking:** Yes

| Check | Pass Criteria |
|-------|---------------|
| G8 passed | GA Readiness complete |
| Risk owner sign-off | Named engineer approves GA |
| Rollback mechanism preserved | Kill switch remains active for 30 days post-GA |
| Tenant communication sent | Tenants notified of new feature |

**Sign-off format:**

```
GA Approval for: [Feature Name]
Risk Score: [score]
Stages Completed: [list]
Approved by: [name]
Date: [date]

I confirm this feature has passed all required gates and is ready for GA.
```

---

### G10: GA Monitoring Gate

**Type:** Mandatory for 30 days post-GA
**Owner:** Release Owner
**Blocking:** No (observational)

| Check | Observation Period |
|-------|-------------------|
| Error rate baseline | 7 days |
| Support ticket volume | 14 days |
| User adoption metrics | 30 days |
| No rollback triggers | 30 days |

**Exit criteria:**

- 30 days with no rollback triggers
- Kill switch can be removed (or left dormant)
- Feature considered stable

---

## Gate Summary Matrix

### Mandatory vs Skippable

| Gate | Type | Skip Conditions |
|------|------|-----------------|
| G1: CI | Mandatory | Never |
| G2: WA-Immunity | Mandatory | Doc/test/read-only changes |
| G3: Cognitive Load | Mandatory | Backend/API/perf-only changes |
| G4: PR Merge | Mandatory | Never |
| G5: Pilot Entry | Mandatory | Risk < 7 |
| G6: Pilot Exit | Mandatory | If piloted |
| G7: Limited Rollout | Mandatory | Risk < 10 |
| G8: GA Readiness | Mandatory | Never |
| G9: GA Approval | Mandatory | Risk < 10 |
| G10: GA Monitoring | Observational | Never (but non-blocking) |

### Gate Applicability by PR Type

| PR Type | G1 | G2 | G3 | G4 | G5+ |
|---------|-----|-----|-----|-----|-----|
| Bug fix (mutations) | Yes | Yes | Maybe | Yes | Per risk |
| Bug fix (read-only) | Yes | N/A | N/A | Yes | No |
| New feature | Yes | Yes | Yes | Yes | Per risk |
| Refactor (no behavior change) | Yes | N/A | N/A | Yes | No |
| Documentation | Yes | N/A | N/A | Yes | No |
| Tests only | Yes | N/A | N/A | Yes | No |
| Performance | Yes | N/A | N/A | Yes | Per risk |
| Security fix | Yes | Yes | Maybe | Yes | Expedited |

---

## Release Blocker Checklist

**Use this checklist before any production deployment.**

This is the single, canonical list. If any item is unchecked, release is blocked.

### Pre-Merge (Every PR)

```markdown
## Release Blocker Checklist - PR

### Automated
- [ ] Build passes
- [ ] Type check passes
- [ ] Unit tests pass
- [ ] Lint passes
- [ ] E2E stable tests pass

### WA-Immunity (or N/A with reason)
- [ ] MF-1: No hidden cascades
- [ ] MF-2: Soft delete, versioned content
- [ ] MF-3: Scoped capabilities
- [ ] MF-4: Errors surfaced
- [ ] MF-5: Explicit state machines
- [ ] MF-6: Audit logging
- [ ] MF-7: Kill switch if high-risk

### Cognitive Load (or N/A with reason)
- [ ] CL-1: Standard terminology
- [ ] CL-2: No hidden rules
- [ ] CL-3: Dependencies visible
- [ ] CL-4: Predictable outcomes
- [ ] CL-5: Mechanical safety

### Approval
- [ ] Risk score documented
- [ ] At least one LGTM
```

### Pre-Pilot (Risk >= 7)

```markdown
## Release Blocker Checklist - Pilot Entry

- [ ] Risk score calculated: ___
- [ ] Risk tier determined: ___
- [ ] Pilot tenant identified: ___
- [ ] Kill switch implemented
- [ ] Kill switch tested in staging
- [ ] Rollback plan documented
- [ ] Internal testing complete (48+ hours)
- [ ] Pilot tenant acknowledged experimental status
```

### Pre-GA (Risk >= 7)

```markdown
## Release Blocker Checklist - GA Promotion

- [ ] All required stages complete for risk tier
- [ ] Pilot feedback positive
- [ ] Limited rollout stable (if required)
- [ ] 30 days since last rollback trigger
- [ ] Documentation updated
- [ ] Changelog published
- [ ] Support team briefed
- [ ] Risk owner sign-off (if Critical)
- [ ] Tenant communication drafted
```

---

## Skip Justification Templates

### Skipping WA-Immunity Gate

```markdown
WA-Immunity Gate: Skipped
Reason: [Select one]
- Documentation-only change
- Test-only change
- Read-only feature (no mutations)
- CI/tooling change (no runtime impact)

Confirmed by: [name]
```

### Skipping Cognitive Load Gate

```markdown
Cognitive Load Gate: Skipped
Reason: [Select one]
- Backend-only (no UI changes)
- API-only (check CL-3 separately)
- Performance optimization (no behavior change)
- Refactor (no user-visible change)

Confirmed by: [name]
```

### Skipping Pilot Stage

```markdown
Pilot Entry: Skipped
Risk Score: [score]
Reason: Low risk tier (score < 7)

Justification:
- Cognitive Load: [1-2] - [reason]
- Blast Radius: [1-2] - [reason]
- Reversibility: [1-2] - [reason]

Confirmed by: [name]
```

### Skipping Limited Rollout

```markdown
Limited Rollout: Skipped
Risk Score: [score]
Reason: Moderate risk tier (score 7-9)

Pilot Exit Status: Passed
Pilot Duration: [duration]
Pilot Tenant Feedback: [summary]

Proceeding directly to GA because:
- [specific justification]

Confirmed by: [name]
```

---

## Expedited Path (Security Fixes)

Security fixes may use an expedited path with these modifications:

| Normal Gate | Expedited Modification |
|-------------|------------------------|
| G5: Pilot Entry | 24-hour internal testing (not 48 hours) |
| G6: Pilot Exit | 48-hour pilot (not 1 week) |
| G7: Limited Rollout | May skip with security owner sign-off |
| G9: GA Approval | Same-day approval permitted |

**Requirements for expedited path:**

1. Security vulnerability confirmed
2. Fix does not introduce new features
3. Fix is minimal and targeted
4. Security owner (any engineer) signs off
5. Post-GA monitoring extended to 60 days

**Expedited sign-off:**

```markdown
Expedited Release: Security Fix
Vulnerability: [brief description, no details]
CVE: [if applicable]
Fix Scope: [files/functions affected]
Expedited by: [name]
Date: [date]

I confirm this is a security fix requiring expedited release.
Post-GA monitoring extended to 60 days.
```

---

## Rollback Triggers

Any of these conditions triggers immediate rollback consideration:

| Trigger | Severity | Action |
|---------|----------|--------|
| P0 bug in production | Critical | Rollback within 1 hour |
| Data corruption detected | Critical | Rollback within 15 minutes |
| Error rate 2x baseline | High | Investigate, rollback if not resolved in 4 hours |
| 3+ support tickets same issue | Moderate | Investigate, consider rollback |
| Tenant escalation | Moderate | Investigate, per-tenant disable if needed |
| Performance degradation >50% | High | Rollback if not resolved in 2 hours |

**Rollback decision authority:**

Any engineer can trigger rollback for Critical severity.
Moderate/High requires release owner or any two engineers.

---

## Process for 2-3 Engineer Team

This playbook is designed for small teams:

| Role | Who | Responsibilities |
|------|-----|------------------|
| PR Author | Engineer A | Complete G1-G3, document risk score |
| PR Reviewer | Engineer B | Verify G2-G3, approve G4 |
| Release Owner | Author or Reviewer | Own G5-G10 for their features |

**One engineer can:**

- Author a PR and self-assess G2/G3 (reviewer verifies)
- Be release owner for their own features
- Approve rollback for Critical issues

**Two engineers required for:**

- PR approval (author + reviewer)
- Rollback for Moderate/High (if no single release owner)

**No dedicated roles needed:**

- No "release manager" - release owner is the feature author
- No "QA lead" - CI and gates replace manual QA
- No "security review" - WA-Immunity gate covers security patterns

---

## See Also

| Document | Relationship |
|----------|--------------|
| [WA_IMMUNITY_REVIEW_GATE.md](../reliability/WA_IMMUNITY_REVIEW_GATE.md) | G2 checklist source |
| [COGNITIVE_LOAD_REVIEW_GATE.md](../reliability/COGNITIVE_LOAD_REVIEW_GATE.md) | G3 checklist source |
| [FEATURE_RISK_AND_FIELD_TESTING_MODEL.md](./FEATURE_RISK_AND_FIELD_TESTING_MODEL.md) | Risk scoring and stages |
| [WA_FUTURE_FAILURE_IMMUNITY.md](../architecture/WA_FUTURE_FAILURE_IMMUNITY.md) | Meta-failure patterns |

---

## Summary

| Phase | Gates | Blocking | Skip Conditions |
|-------|-------|----------|-----------------|
| Feature PR | G1, G2, G3, G4 | All except noted | Doc/test/backend/API only |
| Tenant Rollout | G5, G6, G7 | All except noted | Low risk tier |
| GA Promotion | G8, G9, G10 | G8/G9 blocking | Risk < 10 for G9 |

**Default to blocking.** When uncertain, require the gate.

**One checklist.** The Release Blocker Checklist is the single source of truth.

**No exceptions without documentation.** Every skip must be justified in writing.

---

*This playbook is normative. Releases that bypass these gates are blocked.*
