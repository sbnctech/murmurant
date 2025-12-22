# Release Channels

Copyright (c) Santa Barbara Newcomers Club

A plain-language guide to how changes flow from development to production.

---

## What Are Release Channels?

Release channels are stages that every change must pass through before reaching production. Each channel has:

- A specific purpose
- Clear entry and exit criteria
- Someone responsible for promotion decisions

Think of channels like quality gates. Each gate checks that the change is safe before letting it proceed.

---

## The Four Channels

Changes flow through these channels in order:

```
sandbox --> experimental --> candidate --> stable
   |            |               |            |
   v            v               v            v
Dev/Test    Early Adopters   All Users   Production
```

You cannot skip channels. A change must prove itself at each stage before moving forward.

---

## Channel 1: Sandbox

**Purpose:** Development and initial testing

**Who uses it:** Developers and QA

**What happens here:**

- New features are built and tested
- Bugs are discovered and fixed
- Tests are written and run
- Code is reviewed

**Environment:**

- Branch: `sandbox`
- URL: Staging environment (clubos-staging-sbnc.netlify.app)
- Data: Test data only (never production data)

**Entry criteria:**

- Code compiles without errors
- All tests pass locally
- Pull request opened and reviewed

**Exit criteria:**

- All CI checks pass
- No known critical bugs
- Feature works as intended on staging
- Ready for wider testing

**Who approves promotion:** Developer or Tech Lead

---

## Channel 2: Experimental

**Purpose:** Early adopter validation

**Who uses it:** Volunteer testers from the organization (opt-in only)

**What happens here:**

- Real users test the feature
- Feedback is collected
- Edge cases are discovered
- Performance is observed

**Environment:**

- Branch: Feature flag enabled on sandbox
- URL: Staging with feature flag
- Data: Test accounts for volunteers

**Entry criteria:**

- Passed all sandbox testing
- Documentation written for testers
- Rollback plan documented
- Feature flag configured

**Exit criteria:**

- No critical issues from testers
- Positive feedback on usability
- Minimum soak period complete (1-2 weeks)
- No performance degradation

**Who approves promotion:** Tech Lead + QA

**Current status:** *Aspirational* - We do not yet have formal experimental testers. Today, this channel is often combined with sandbox.

---

## Channel 3: Candidate

**Purpose:** Final soak before production

**Who uses it:** All users except those who opted out

**What happens here:**

- Feature runs in near-production conditions
- Monitoring for errors and performance
- Final opportunity to catch issues
- Confidence building before stable

**Environment:**

- Branch: `main` with feature flag (if guarded)
- URL: Production environment with limited exposure
- Data: Production data (with appropriate safeguards)

**Entry criteria:**

- Passed experimental testing
- All exit criteria from experimental met
- Kill switch tested and verified
- Rollback procedure tested

**Exit criteria:**

- Minimum soak period complete (1 week)
- No SEV-1 or SEV-2 incidents
- Metrics within normal bounds
- No user complaints

**Who approves promotion:** System Owner (requires GO/NO-GO memo)

**Current status:** *Aspirational* - Today, most features go directly from sandbox to stable. Candidate channel will be used for high-risk changes.

---

## Channel 4: Stable

**Purpose:** General availability for all users

**Who uses it:** Everyone

**What happens here:**

- Feature is fully available
- Normal monitoring continues
- Support handles any issues

**Environment:**

- Branch: `main`
- URL: Production (clubos-prod-sbnc.netlify.app)
- Data: Production data

**Entry criteria:**

- GO/NO-GO decision memo signed
- All prior channel criteria met
- Release notes written
- Support notified

**Exit criteria:** N/A (this is the target)

**Who approves promotion:** System Owner

---

## Release Classification

Every release must be classified before entering any channel. Classification determines how carefully we handle it.

| Class | Examples | Risk Level | Approval |
|-------|----------|------------|----------|
| **UI-only** | Button color, label text, layout fix | Low | Developer |
| **Workflow change** | New filter, optional field, UI flow | Medium | Developer + QA |
| **Capability exposure** | New admin feature (hidden), new API | Medium-High | Developer + System Owner |
| **Mechanism change** | Database migration, auth change, backup procedure | High | System Owner + explicit risk sign-off |

**Rule:** If you are unsure how to classify a change, treat it as the higher risk level.

---

## The GO/NO-GO Decision

Before promoting to stable, high-risk changes require a formal GO/NO-GO decision.

**What it includes:**

- Checklist of all requirements met
- Known risks and why they are accepted
- Rollback plan verified
- Signatures from approvers

**When required:**

- All mechanism changes
- Any change that touches financial data
- Any change that affects permissions/access
- Any change requested by System Owner

**Template location:** See [Release Checklist](../release/RELEASE_CHECKLIST.md) for the full GO/NO-GO template.

---

## Kill Switches and Rollback

Every change should have a way to undo it quickly.

### Kill Switch

A kill switch lets you disable a feature without deploying new code.

**Requirements:**

- Must be configurable via environment variable or admin setting
- Must be testable before the feature reaches candidate
- Activation must be logged
- Must not cause data loss or corruption

### Rollback

If a kill switch is not enough, you may need to rollback.

**Rollback options (in order of preference):**

1. **Feature flag disable** - Fastest, no deploy needed
2. **Revert commit** - Creates new commit undoing the change
3. **Restore from backup** - Last resort for data issues

**See also:** [Release Process - Rollback Procedures](../deployment/RELEASE_PROCESS.md#rollback-procedures)

---

## Who Can Approve Promotions?

| Transition | Approver | What They Check |
|------------|----------|-----------------|
| PR to sandbox | Developer or Reviewer | Code quality, tests pass |
| sandbox to experimental | Tech Lead | Feature complete, safe to test |
| experimental to candidate | Tech Lead + QA | User feedback positive, no issues |
| candidate to stable | System Owner | GO/NO-GO checklist complete |

**Current state:** Today, most changes flow directly from sandbox to stable. The experimental and candidate channels are used for high-risk changes.

---

## How Channels Map to Git Today

| Channel | Branch | Environment | Status |
|---------|--------|-------------|--------|
| sandbox | `sandbox` | Staging | Active |
| experimental | Feature flag on `sandbox` | Staging | Aspirational |
| candidate | Feature flag on `main` | Production (limited) | Aspirational |
| stable | `main` | Production | Active |

**Aspirational:** These channels are defined but not yet in regular use. As we mature, we will formalize them.

---

## Quick Reference: Promotion Checklist

Use this checklist when promoting between channels:

### Sandbox to Experimental

- [ ] All CI checks pass
- [ ] Feature works as intended
- [ ] Documentation ready for testers
- [ ] Feature flag configured
- [ ] Rollback plan documented

### Experimental to Candidate

- [ ] Minimum soak period complete
- [ ] No critical issues from testers
- [ ] Positive user feedback
- [ ] Kill switch tested
- [ ] Metrics baseline established

### Candidate to Stable

- [ ] Minimum soak period complete (1 week)
- [ ] No SEV-1/SEV-2 incidents
- [ ] Metrics within normal bounds
- [ ] GO/NO-GO memo signed
- [ ] Rollback plan verified

---

## Common Questions

**Q: What if I need to ship a hotfix quickly?**

A: Hotfixes can go directly to stable if they fix a critical production issue. See [Hotfix Process](../deployment/RELEASE_PROCESS.md#hotfix-process). You still need approval, but the process is accelerated.

**Q: Who is the System Owner?**

A: The System Owner is the person responsible for production stability. Currently, this is the project lead. When in doubt, ask.

**Q: What is a SEV-1 incident?**

A: A SEV-1 incident means the system is down or unusable for all users. SEV-2 means major functionality is broken for some users. Either blocks promotion to stable.

**Q: Can I skip the experimental channel?**

A: For low-risk changes (UI-only, simple workflows), yes. For anything touching data, permissions, or money, no.

---

## Related Documentation

- [Release Process](../deployment/RELEASE_PROCESS.md) - Step-by-step deployment guide
- [Release Checklist](../release/RELEASE_CHECKLIST.md) - Pre-merge and tagging requirements
- [Rollback Procedures](../deployment/RELEASE_PROCESS.md#rollback-procedures) - How to undo changes

---

## Changelog

| Date | Change |
|------|--------|
| 2025-12-21 | Initial version created |
