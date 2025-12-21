# Feature Risk and Field Testing Model

Status: Normative
Applies to: All ClubOS feature development and release decisions
Last updated: 2025-12-21

This document defines how ClubOS evaluates feature risk and gates releases
to prevent reintroduction of Wild Apricot-style failure modes.

Safety is a release gate, not a best practice.

---

## 1. Why WA Regressions Happen

Wild Apricot's most damaging failures are not one-time bugs.
They are systemic regressions caused by release practices that:

| Practice | Consequence |
|----------|-------------|
| Ship to all tenants simultaneously | One bad release affects every customer |
| No risk scoring | High-impact changes treated the same as cosmetic fixes |
| No field testing gates | Features go from dev to GA with no intermediate validation |
| No rollback mechanism | Bad releases require forward-fix under pressure |
| No tenant isolation | Pilot failures become production incidents |
| Implicit behavioral changes | Users discover breakage, not changelogs |

These are not engineering failures. They are process failures.

ClubOS prevents them by requiring explicit risk evaluation and staged rollout
for every feature that touches user-facing behavior, data, or permissions.

---

## 2. Feature Risk Scoring

Every feature MUST be scored on three dimensions before release approval.

### 2.1 Cognitive Load

How much does this feature change what users expect or must learn?

| Score | Definition | Examples |
|-------|------------|----------|
| 1 - Invisible | No user-facing change | Performance optimization, internal refactor |
| 2 - Familiar | Behavior consistent with existing patterns | New filter option on existing list |
| 3 - Learnable | Requires brief orientation | New dashboard widget, additional form field |
| 4 - Disruptive | Changes established workflows | Restructured navigation, renamed concepts |
| 5 - Breaking | Invalidates prior training | Permission model change, data model migration |

**Scoring rule:** If documentation or training must be updated, score is at least 3.

### 2.2 Blast Radius

How many tenants, users, or records are affected if something goes wrong?

| Score | Definition | Examples |
|-------|------------|----------|
| 1 - Single record | One entity affected | Editing a single event |
| 2 - Single user | One user's session or data | Profile update, preference change |
| 3 - Single tenant | All users in one organization | Tenant settings, membership level change |
| 4 - Tenant cohort | Multiple tenants in a release group | Pilot feature, cohort-scoped flag |
| 5 - Global | All tenants simultaneously | Schema migration, auth change, API contract |

**Scoring rule:** Score based on worst-case failure, not intended behavior.

### 2.3 Reversibility

How easily can the change be undone without data loss or user impact?

| Score | Definition | Examples |
|-------|------------|----------|
| 1 - Instant | Feature flag toggle, no side effects | UI experiment, optional feature |
| 2 - Fast | Rollback within minutes, no data loss | Stateless service change |
| 3 - Recoverable | Requires restore from backup or undo | Data migration with snapshot |
| 4 - Degraded | Rollback possible but loses recent data | Async job with partial completion |
| 5 - Irreversible | Cannot undo without manual intervention | Destructive migration, external API calls |

**Scoring rule:** If rollback requires an engineer, score is at least 3.

### 2.4 Composite Risk Score

```
Risk Score = Cognitive Load + Blast Radius + (Reversibility × 2)
```

Reversibility is weighted 2× because irreversibility compounds all other risks.

| Composite Score | Risk Tier | Required Field Test Stage |
|-----------------|-----------|---------------------------|
| 4–6 | Low | Internal only |
| 7–9 | Moderate | Internal + Opt-in pilot |
| 10–12 | High | Internal + Opt-in + Limited rollout |
| 13+ | Critical | Full staged rollout required |

Features scoring 13+ also require explicit sign-off from a designated release owner.

---

## 3. Field Test Stages

All features progress through defined stages. Skipping stages requires documented justification and risk owner sign-off.

### 3.1 Stage 0: Internal

| Attribute | Requirement |
|-----------|-------------|
| Participants | ClubOS team and designated test accounts only |
| Duration | Minimum 48 hours of active use |
| Data | Synthetic or cloned, never production |
| Exit criteria | No P0/P1 bugs, all acceptance tests pass |
| Rollback | Immediate, no external impact |

### 3.2 Stage 1: Opt-in Pilot

| Attribute | Requirement |
|-----------|-------------|
| Participants | Tenants who explicitly request early access |
| Duration | Minimum 1 week with active usage |
| Data | Production data, pilot tenant only |
| Exit criteria | No regressions, positive pilot feedback, support load acceptable |
| Rollback | Per-tenant disable within 1 hour |
| Communication | Pilot tenants acknowledge experimental status |

Pilot tenants MUST have a documented rollback path before opt-in.

### 3.3 Stage 2: Limited Rollout

| Attribute | Requirement |
|-----------|-------------|
| Participants | Up to 20% of tenants, selected for diversity |
| Duration | Minimum 2 weeks |
| Data | Production data |
| Exit criteria | Error rates within baseline, no escalations, metrics stable |
| Rollback | Cohort-level disable within 4 hours |
| Communication | Release notes published, support briefed |

Tenant selection MUST include variation in:

- Organization size
- Feature usage patterns
- Geographic distribution (if applicable)

### 3.4 Stage 3: General Availability (GA)

| Attribute | Requirement |
|-----------|-------------|
| Participants | All tenants |
| Duration | Permanent (unless deprecated) |
| Data | Production data |
| Exit criteria | 30 days with no rollback triggers |
| Rollback | Emergency only, requires incident declaration |
| Communication | Changelog, documentation, optional training |

GA does not mean "done." GA means "proven safe at scale."

---

## 4. Tenant Safety Rules

These rules are non-negotiable. Violations block release.

### 4.1 Tenant Isolation

- A failure in one tenant MUST NOT affect other tenants
- Tenant data MUST NOT leak across boundaries during any stage
- Pilot features MUST be fully scoped to participating tenants

### 4.2 Tenant Consent

- Tenants MUST NOT receive breaking changes without advance notice
- Opt-in pilots require explicit tenant acknowledgment
- Tenants MAY defer non-critical updates for up to 30 days (if supported)

### 4.3 Tenant Visibility

- Tenants MUST be able to identify which features are in pilot/rollout
- Tenants MUST have a channel to report issues tied to specific releases
- Tenants MUST receive notification when a feature exits pilot

### 4.4 Tenant Recovery

- Every tenant MUST have a documented restore path
- Tenant-scoped rollback MUST be testable before any pilot begins
- Backup verification MUST occur within 7 days of any data-affecting release

---

## 5. Rollback and Kill Switch Requirements

### 5.1 Kill Switch Definition

A kill switch is a mechanism that immediately disables a feature without:

- Requiring a code deployment
- Affecting unrelated functionality
- Losing data created while the feature was active

### 5.2 Kill Switch Requirements by Risk Tier

| Risk Tier | Kill Switch Required | Activation Time | Scope |
|-----------|---------------------|-----------------|-------|
| Low | Optional | N/A | N/A |
| Moderate | Required | < 15 minutes | Per-tenant |
| High | Required | < 5 minutes | Per-tenant or cohort |
| Critical | Required | < 1 minute | Global, per-cohort, and per-tenant |

### 5.3 Rollback Plan Contents

Every feature with Risk Tier Moderate or higher MUST have a rollback plan that includes:

1. **Trigger criteria**: What conditions activate rollback
2. **Decision owner**: Who authorizes rollback
3. **Execution steps**: How to perform rollback (without code deploy)
4. **Verification steps**: How to confirm rollback succeeded
5. **Data handling**: What happens to data created during the feature's operation
6. **Communication template**: Pre-written message for affected tenants

### 5.4 Rollback Drills

- Kill switches MUST be tested in staging before any pilot begins
- High and Critical features MUST have a documented rollback drill result
- Rollback drills MUST be repeated after any change to the rollback mechanism

---

## 6. Release Guarantees

These guarantees define ClubOS's commitment to release safety.

### 6.1 No Surprise Breaking Changes

Tenants will never wake up to discover that:

- Workflows they depend on have changed without notice
- Data has been modified, moved, or deleted unexpectedly
- Permissions have been altered without explicit action

### 6.2 Staged Rollout for All Risky Changes

Features with composite Risk Score ≥ 10 will always:

- Pass through at least 3 field test stages
- Have a functional kill switch before pilot
- Include rollback verification in exit criteria

### 6.3 Tenant Control

Tenants will always:

- Know what release cohort they are in
- Have the ability to report issues tied to specific features
- Receive advance notice of changes requiring action

### 6.4 Recovery Assurance

ClubOS will always:

- Maintain tenant-scoped restore capability
- Test rollback mechanisms before they are needed
- Prioritize recoverability over speed of release

### 6.5 Accountability

Every release will have:

- A named release owner responsible for go/no-go decisions
- Documented risk scoring with rationale
- Traceable field test progression

---

## 7. Alignment with Multitenant Readiness

This model integrates with the Multitenant Release Readiness Checklist:

| Readiness Checklist Item | Feature Risk Model Mapping |
|--------------------------|---------------------------|
| Tenant isolation verified | Tenant Safety Rule 4.1 |
| Rollback path documented | Section 5.3 |
| Kill switch tested | Section 5.4 |
| Pilot tenant selected | Stage 1 requirements |
| Blast radius assessed | Risk Score dimension 2.2 |
| Recovery drill completed | Tenant Safety Rule 4.4 |

A feature cannot pass the Multitenant Release Readiness Checklist without
completing the field test stages required by its Risk Tier.

---

## 8. Summary: Release Gate Checklist

Before any feature progresses to the next stage:

- [ ] Risk score calculated and documented
- [ ] Required field test stage identified
- [ ] Kill switch implemented (if required by tier)
- [ ] Rollback plan written (if Moderate+)
- [ ] Rollback drill completed (if High+)
- [ ] Tenant isolation verified
- [ ] Exit criteria defined for current stage
- [ ] Release owner identified

This checklist is a gate, not a guideline.
Features that cannot satisfy these requirements do not ship.
