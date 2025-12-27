# Migration Customer Journey

> How a club experiences the move from Wild Apricot to ClubOS

This document walks through the migration from the customer's perspective. It shows what they see, decisions they must make, where anxiety naturally occurs, and where ClubOS provides reassurance.

---

## Table of Contents

- [Overview: The Migration Promise](#overview-the-migration-promise)
- [Phase 1: Initial Engagement](#phase-1-initial-engagement)
- [Phase 2: Policy Capture](#phase-2-policy-capture)
- [Phase 3: Dry Run Preview](#phase-3-dry-run-preview)
- [Phase 4: Full Sync](#phase-4-full-sync)
- [Phase 5: Verification and Sign-Off](#phase-5-verification-and-sign-off)
- [Phase 6: Cutover Decision](#phase-6-cutover-decision)
- [Phase 7: Post-Migration](#phase-7-post-migration)
- [Anxiety and Reassurance Summary](#anxiety-and-reassurance-summary)

---

## Overview: The Migration Promise

**What the customer needs to believe:**

1. Their data will arrive complete and correct
2. Nothing will break during the transition
3. They can back out if something goes wrong
4. The process respects their organization's identity

**The migration philosophy:**

ClubOS treats migration as a trust-building exercise. Every step is designed to give the customer visibility and control. The operator (ClubOS staff) works alongside the customer—never behind closed doors.

---

## Phase 1: Initial Engagement

### What the Customer Sees

- Introduction to the migration process
- Explanation of the timeline and phases
- Clear statement: "Your data stays in Wild Apricot until you explicitly approve cutover"

### Decisions the Customer Makes

| Decision | Stakes | Time Pressure |
|----------|--------|---------------|
| Proceed with migration? | Low (reversible) | None |
| Identify migration coordinator | Low | None |
| Schedule policy capture session | Low | None |

### Anxiety Points

| Concern | Root Fear |
|---------|-----------|
| "How long will this take?" | Disruption to operations |
| "Will our members notice?" | Reputation with membership |
| "What if we lose data?" | Irreversible harm |

### Reassurance Points

- **Parallel operation**: Both systems can run simultaneously during transition
- **Dry run first**: Full preview before any real changes
- **Abort available**: Before commit, you can stop and discard all migration work; after commit, recovery procedures exist
- **Operator partnership**: A human guide accompanies every step

---

## Phase 2: Policy Capture

### What the Customer Sees

- Structured conversation about their membership policies
- Document showing captured rules for their review
- Validation report confirming policies are coherent

### Decisions the Customer Makes

| Decision | Stakes | Time Pressure |
|----------|--------|---------------|
| Approve membership tier mapping | Medium | None |
| Confirm renewal date rules | Medium | None |
| Verify pricing structure | Medium | None |
| Sign off on policy capture document | Medium | None |

### The Policy Capture Conversation

The operator walks through each policy area:

**Required Policies:**
1. **Member levels → ClubOS tiers**: "Here's how we'll map your Wild Apricot levels..."
2. **Lifecycle dates**: "When does someone become 'Lapsed'? When are they 'Alumni'?"
3. **Renewal periods**: "Rolling dates or fixed anniversary?"

**Optional Policies:**
4. **Guest access**: "How do prospective members interact before joining?"
5. **Household linking**: "Do couples share membership?"

### Anxiety Points

| Concern | Root Fear |
|---------|-----------|
| "What if we describe our policies wrong?" | Incorrect migration |
| "I don't understand some of these concepts" | Making uninformed decisions |
| "Our policies are complicated—can the system handle them?" | Being forced to oversimplify |

### Reassurance Points

- **Review before use**: Captured policies are shown back for approval
- **Plain English**: Policies are documented in readable language, not code
- **Validation**: System checks for logical contradictions before proceeding
- **Iteration allowed**: Can revise policies during dry run phase
- **Checklist confirmation**: Nothing proceeds without explicit sign-off

---

## Phase 3: Dry Run Preview

### What the Customer Sees

- Migration runs in preview mode (no real database changes)
- Complete report of what *would* happen
- Summary statistics: members imported, events imported, etc.
- Any warnings or anomalies highlighted

The dry run produces an **Intent Manifest**—a reviewable record of exactly what the migration intends to do. This manifest becomes the basis for preview, verification, and eventual commit. Nothing renders or commits without first passing through the manifest.

### Decisions the Customer Makes

| Decision | Stakes | Time Pressure |
|----------|--------|---------------|
| Review dry run output | Low | None |
| Approve proceeding to full sync | Medium | None |
| Request policy adjustments if needed | Low | None |

### The Dry Run Report Shows

```
DRY RUN SUMMARY
===============
Members:     847 would be imported
Events:      156 would be imported
Activities:   23 would be imported

Warnings:
- 3 members have missing email addresses
- 12 registrations reference deleted events

No blocking errors found.
```

### Anxiety Points

| Concern | Root Fear |
|---------|-----------|
| "Those warnings sound bad" | Hidden data problems |
| "What happens to the edge cases?" | Important members falling through cracks |
| "How do I know the real sync will match?" | Dry run might not be accurate |

### Reassurance Points

- **Warnings are normal**: Every migration has some data quality findings
- **Nothing happened yet**: Dry run made no changes—this is purely informational
- **Same logic path**: Real sync uses identical decision logic as dry run
- **Operator reviews too**: ClubOS staff review all warnings before recommending proceed
- **Can repeat**: Run dry runs as many times as needed

---

## Phase 4: Full Sync

### What the Customer Sees

- Notification that sync is beginning
- Progress updates during sync
- Completion notification with summary
- Access to ClubOS system for verification

### Decisions the Customer Makes

| Decision | Stakes | Time Pressure |
|----------|--------|---------------|
| Authorize full sync to begin | Medium | None |
| Confirm receipt of completion report | Low | None |

### What Happens During Sync

1. Members imported from Wild Apricot
2. Membership history preserved
3. Events and registrations connected
4. Activities and groups linked
5. Import log recorded for every record

### Anxiety Points

| Concern | Root Fear |
|---------|-----------|
| "What if it fails partway through?" | Corrupted half-state |
| "How long will this take?" | Uncertainty during wait |
| "What if I need to use WA during sync?" | Operational disruption |

### Reassurance Points

- **Transactional safety**: Sync either completes fully or, if a technical error occurs, the database transaction is discarded (no partial state). This is automatic failure recovery, not a system-initiated abort—the customer controls whether to retry.
- **Wild Apricot unchanged**: Source system is read-only during migration
- **Progress visibility**: Can monitor sync progress in real time
- **Idempotent**: Re-running sync is safe if needed (operations can be repeated without harm)
- **Recovery documented**: Rollback procedures ready if needed

---

## Phase 5: Verification and Sign-Off

### What the Customer Sees

- Verification toolkit to check migration accuracy
- Side-by-side comparisons (WA vs ClubOS)
- Specific checks for member counts, event counts, registration links
- Pass/fail report for each verification category

### Decisions the Customer Makes

| Decision | Stakes | Time Pressure |
|----------|--------|---------------|
| Review member sample | Medium | None |
| Verify event linkages | Medium | None |
| Confirm registration counts | Medium | None |
| Sign off on migration accuracy | High | Reasonable |

### Verification Checks Available

| Check | What It Verifies |
|-------|------------------|
| Member Count | Total imported matches source |
| Tier Distribution | Members in correct membership levels |
| Event Count | All events transferred |
| Registration Links | Registrations point to correct events/members |
| Activity Membership | Activity/group rosters intact |
| Household Links | Family groupings preserved |

### Anxiety Points

| Concern | Root Fear |
|---------|-----------|
| "How do I know nothing was dropped?" | Silent data loss |
| "I can't check every single record" | Incomplete verification |
| "What if I find a problem now?" | Wasted effort, restart |

### Reassurance Points

- **Count verification**: System generates count comparisons; operators verify samples
- **Sampling strategy**: Operator guides which records to verify manually
- **Problems fixable**: Post-import corrections are possible
- **No commitment yet**: Cutover requires separate explicit decision
- **Script-assisted**: Verification tools do the tedious work

---

## Phase 6: Cutover Decision

### What the Customer Sees

- Summary of verification results
- Clear statement of what cutover means
- Explicit choice: proceed or delay

### Decisions the Customer Makes

| Decision | Stakes | Time Pressure |
|----------|--------|---------------|
| Approve cutover to ClubOS | High | Customer-controlled |
| Schedule member notification | Medium | Customer-controlled |
| Decommission Wild Apricot access | Medium | Customer-controlled |

### What "Cutover" Means

> **Cutover = Wild Apricot becomes read-only archive. ClubOS becomes the live system.**

After cutover:
- Members log into ClubOS, not Wild Apricot
- Event registrations happen in ClubOS
- Renewals process through ClubOS
- Wild Apricot data preserved for reference

### Anxiety Points

| Concern | Root Fear |
|---------|-----------|
| "What if members can't log in?" | Member frustration |
| "What if we need to go back?" | Irreversibility |
| "Our board hasn't approved yet" | Organizational politics |

### Reassurance Points

- **You control the timing**: Cutover happens when you explicitly authorize it, not before. The system never initiates cutover.
- **Rollback exists**: Customer-initiated emergency procedures documented for reversal. The system never auto-reverts.
- **Soft launch possible**: Can invite subset of members first
- **Communication templates**: Help announcing the change to members
- **Support ready**: Operator available during initial go-live

---

## Phase 7: Post-Migration

### What the Customer Sees

- Normal ClubOS operations
- Access to migration logs if needed
- Continued access to Wild Apricot (read-only) for reference
- Support channels for questions

### Decisions the Customer Makes

| Decision | Stakes | Time Pressure |
|----------|--------|---------------|
| When to fully retire Wild Apricot | Low | None |
| Training for additional staff | Low | Customer-paced |
| Configuration of ClubOS preferences | Low | Ongoing |

### Anxiety Points

| Concern | Root Fear |
|---------|-----------|
| "What if something was missed?" | Latent problems |
| "We're on our own now" | Loss of support |
| "Members are complaining" | Operational pressure |

### Reassurance Points

- **Post-migration corrections possible**: Data can be adjusted
- **Support continues**: Operator relationship doesn't end at cutover
- **Wild Apricot archived**: Historical reference always available
- **Feedback welcome**: Issues reported improve the process for future clubs

---

## Anxiety and Reassurance Summary

### The Customer's Core Fears

| Fear | Underlying Concern |
|------|-------------------|
| Data loss | Irreversible harm to organization |
| Member disruption | Reputation damage with membership |
| Operational downtime | Inability to conduct normal business |
| Complexity overwhelm | Feeling out of control |
| Incorrect decisions | Blame for problems |

### How ClubOS Addresses Each Fear

| Fear | Reassurance Mechanism |
|------|----------------------|
| Data loss | Dry run preview, idempotent sync, abort before commit / recovery after |
| Member disruption | Parallel operation, soft launch option, communication templates |
| Operational downtime | Wild Apricot continues until explicit cutover |
| Complexity overwhelm | Operator guides every step, plain-English documentation |
| Incorrect decisions | Multiple review points, no commitment until explicit sign-off |

### The Trust Architecture

ClubOS migration builds trust through:

1. **Visibility**: Customer sees exactly what will happen before it happens
2. **Control**: Every consequential step requires explicit human approval. The system proposes; humans decide.
3. **Reversibility**: Abort before commit discards all work; recovery procedures documented for after commit. The system never auto-reverts.
4. **Partnership**: Operator accompanies—never operates behind the scenes
5. **Patience**: No artificial time pressure on decisions. The system never forces a deadline.

---

## Related Documentation

- [Intent Manifest Schema](../ARCH/INTENT_MANIFEST_SCHEMA.md) — What the manifest captures and guarantees
- [Importer Runbook](./IMPORTER_RUNBOOK.md) — Technical migration procedures
- [Wild Apricot Policy Capture](./WA_POLICY_CAPTURE.md) — Policy capture process
- [Cutover Rehearsal Mode](./CUSTOMER_MIGRATION_CUTOVER_REHEARSAL.md) — Test migration before committing
- [Organizational Presentation Philosophy](../BIZ/ORGANIZATIONAL_PRESENTATION_PHILOSOPHY.md) — Trust principles

---

*This document describes the migration experience as of December 2025. It reflects only capabilities that exist today.*
