# Customer Guide: Cutover Rehearsal Mode

**For:** Club administrators migrating from Wild Apricot to Murmurant
**Related Issues:** #202 (WA Migration Epic), #277 (Cutover Rehearsal Mode), #232 (Production Runbook)
**Related Architecture:** [Intent Manifest Schema](../ARCH/INTENT_MANIFEST_SCHEMA.md), [Preview Surface Contract](../ARCH/PREVIEW_SURFACE_CONTRACT.md)

---

## Overview

Cutover Rehearsal Mode is a safety feature that lets you **test your migration before making it permanent**. Think of it like a dress rehearsal before opening night—you can try everything out, catch any issues, and confidently proceed when you're ready.

During Cutover Rehearsal:

- **Wild Apricot remains your authoritative system** (members continue using WA normally)
- **Murmurant records all changes as "intentions"** (not committed yet)
- **You can abort with zero data loss** if something is not right
- **When satisfied, you commit** and Murmurant becomes authoritative

**Rehearsal is bound to a specific Intent Manifest.** Every rehearsal operates on a versioned, immutable snapshot of what will happen. This guarantees that what you preview is exactly what you will get.

---

## Why Cutover Rehearsal Mode?

### The Migration Challenge

Migrating from one membership system to another is a significant operation. You have:

- Years of member data and history
- Active registrations and upcoming events
- Financial records and membership renewals in progress

A traditional "big bang" migration puts all of this at risk. If something goes wrong after the switch, rolling back is painful or impossible.

### The Cutover Rehearsal Solution

Cutover Rehearsal Mode gives you a **reversible window** to validate the migration:

| Phase | Duration | What Happens |
|-------|----------|--------------|
| **Pre-Migration** | Ongoing | WA is authoritative. Normal operations. |
| **Cutover Rehearsal** | 24-72 hours | Both systems active. Murmurant records intentions. |
| **Commit** | Instant | Intentions become permanent. Murmurant is authoritative. |
| **OR Abort** | Instant | All intentions discarded. Back to WA only. |

---

## Binding to Intent Manifest

### Every Rehearsal Has a Manifest

Cutover rehearsal is not free-form testing. It operates on a specific **Intent Manifest**—a versioned, immutable document that captures exactly what the migration will do.

| Manifest Property | What It Means |
|-------------------|---------------|
| `manifestId` | Unique identifier for this migration configuration |
| `manifestVersion` | Monotonically increasing version number |
| `createdAt` | When the manifest was generated |
| `createdBy` | Which operator created it |

When you enter rehearsal, the system locks to a specific manifest version. This version does not change during rehearsal.

### What the Manifest Guarantees

The manifest ensures:

- **No hidden changes**: Everything that will happen is documented in the manifest
- **Deterministic replay**: The same manifest produces the same result every time
- **Auditable decisions**: Every action traces back to a manifest entry
- **Version control**: If you need to adjust and re-rehearse, a new manifest version is created

### Commit Applies Exactly the Manifest

When you commit, the system applies exactly the manifest version you rehearsed. There are no last-minute additions, no "improvements," no surprises.

If anything has changed that would cause the result to differ from your preview, the commit fails safely rather than proceeding with unexpected changes.

---

## Preview Equivalence

### What You Preview Is What You Get

Murmurant guarantees **preview equivalence**: the outcome of commit will match what you saw during rehearsal, within documented bounds.

| Guarantee | Meaning |
|-----------|---------|
| **Same logic path** | Commit uses identical decision logic as rehearsal |
| **Same input data** | Commit operates on the same source data snapshot |
| **Deterministic outcome** | Given identical input, commit produces identical result |

### Known Deltas (Expected Differences)

Certain differences between preview and commit are expected and documented:

| Delta | Cause | Why It Is Safe |
|-------|-------|----------------|
| **Timestamps** | System timestamps generated at commit time | Timestamps are for audit, not logic |
| **Generated IDs** | UUIDs and sequence numbers assigned at commit | IDs are internal references, not customer data |
| **External state** | Third-party systems may have changed | Commit validates preconditions; fails safely if violated |

These are not bugs. They are honest acknowledgment of how distributed systems work.

### Unexpected Deltas Trigger Abort

If the system detects an unexpected difference between what was previewed and what would be committed, it:

1. **Halts** before making any changes
2. **Reports** the specific discrepancy
3. **Requires** explicit re-approval or abort

You are never surprised by silent changes.

---

## What Happens During Cutover Rehearsal

### For Your Members

- Members continue using Wild Apricot normally during rehearsal
- They may preview Murmurant (if you enable preview access)
- No member action is required during this phase
- Members experience zero disruption if you abort

### For Your Administrators

During rehearsal, you can:

1. **Verify member data** — Check that profiles, tiers, and history migrated correctly
2. **Test event operations** — Create test events, view registrations
3. **Validate policies** — Confirm scheduling, membership lifecycle, and governance settings
4. **Train staff** — Practice common workflows in the real system

All actions during rehearsal are recorded in the **Intent Journal**—a tamper-evident log that can be replayed (on commit) or discarded (on abort).

### Behind the Scenes

Murmurant maintains **one authoritative system at a time**:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   PRE-MIGRATION          CUTOVER REHEARSAL         POST-COMMIT │
│                                                                 │
│   ┌─────────┐            ┌─────────┐               ┌─────────┐ │
│   │   WA    │  ───────>  │   WA    │   ───────>    │ Murmurant  │ │
│   │ (auth)  │            │ (auth)  │               │ (auth)  │ │
│   └─────────┘            └─────────┘               └─────────┘ │
│                          ┌─────────┐                           │
│                          │ Murmurant  │                           │
│                          │(journal)│                           │
│                          └─────────┘                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Intent Journal

The Intent Journal is an append-only log of every change made in Murmurant during rehearsal. It provides:

- **Full auditability** — Every action is recorded with who, what, and when
- **Deterministic replay** — On commit, intentions replay in exact order
- **Zero-loss abort** — Discarding the journal leaves no trace
- **Verification gates** — Each intention is validated before recording

### Example Intent Journal Entries

| Timestamp | Actor | Intent Type | Details |
|-----------|-------|-------------|---------|
| 2025-01-15 09:23:41 | admin@club.org | MEMBER_UPDATE | Updated phone for member #1234 |
| 2025-01-15 10:05:12 | admin@club.org | EVENT_CREATE | Created "January Social" |
| 2025-01-15 14:32:08 | system | REGISTRATION_SYNC | Synced 5 registrations from WA |

On **Commit**, these entries are replayed against the Murmurant database, making them permanent.

On **Abort**, the journal is discarded, and Murmurant returns to pre-rehearsal state.

---

## Commit vs. Abort

### Abort Is a Successful Outcome

**Discovering a reason to abort is the system working correctly.**

If rehearsal reveals a problem—data discrepancy, policy misconfiguration, integration issue—that discovery is success, not failure. The entire point of rehearsal is to surface issues before they become permanent.

| Outcome | What It Means |
|---------|---------------|
| **Commit after clean rehearsal** | Everything validated. Proceed with confidence. |
| **Abort after discovering issue** | Safety net caught something. No harm done. Fix and retry. |
| **Abort due to uncertainty** | Reasonable caution. Take more time. Try again when ready. |

All three outcomes are valid. None indicates failure of the migration process.

### When to Commit

Commit when you have:

- [ ] Verified sample of member profiles (spot-check 10+ members)
- [ ] Confirmed all membership tiers mapped correctly
- [ ] Tested event creation and registration workflows
- [ ] Validated policy settings (timezone, schedules, thresholds)
- [ ] Trained key administrators on Murmurant workflows
- [ ] Resolved all blocking issues from verification gates
- [ ] Obtained board/leadership approval (if required)

### When to Abort

Abort if you encounter:

- Critical data discrepancies that cannot be resolved during rehearsal
- Unexpected member-facing issues
- Integration problems with payment processors
- Need more preparation time
- Any reason—abort is always safe

**You do not need to justify abort.** The option exists to be used.

### After Commit

Once committed:

- Murmurant becomes the authoritative system
- Wild Apricot should be put in read-only mode
- Members should be directed to Murmurant
- The intent journal is archived for audit purposes

### After Abort

If you abort:

- Wild Apricot remains authoritative (nothing changed)
- All Murmurant rehearsal data is discarded
- You can start fresh with another rehearsal attempt
- There is no limit to rehearsal attempts

---

## Timeline Example

Here is a typical cutover rehearsal timeline:

### Day -7: Preparation

- Run verification report on WA data
- Configure policies in Murmurant
- Complete pre-migration checklist

### Day 0: Enter Cutover Rehearsal

- Start cutover rehearsal mode (automated script)
- WA continues as authoritative
- Begin validation checks

### Day 1-2: Validation Period

- Test member workflows
- Verify data accuracy
- Train administrators
- Address any issues

### Day 3: Decision Point

**Option A: Commit**

- Finalize commitment
- Archive WA access
- Announce to members

**Option B: Abort**

- Discard rehearsal data
- Return to WA-only
- Address issues and retry later

---

## Frequently Asked Questions

### Can members use Murmurant during rehearsal?

Optionally, yes. You can enable preview access for members to explore Murmurant while WA remains authoritative. Any member actions in Murmurant during rehearsal are recorded in the intent journal.

### What if WA data changes during rehearsal?

The rehearsal window should be kept short (24-72 hours) to minimize drift. Any registrations or membership changes in WA during this period can be synced using the incremental sync process.

### Is there a time limit on rehearsal?

No hard limit, but we recommend keeping rehearsal under 72 hours to minimize the chance of WA data drift and member confusion.

### Can we do multiple rehearsals?

Yes. You can abort and restart rehearsal as many times as needed. Each rehearsal starts fresh with a new manifest version.

### What happens to payment processing?

Payment processing remains with WA during rehearsal. On commit, payment configuration is transitioned to Murmurant. Detailed payment cutover is covered in the Production Migration Runbook.

### Who can commit or abort?

Only designated migration operators with the `migration:commit` permission can commit or abort. This is typically limited to the club's primary administrator and the Murmurant migration team.

### What if the manifest changes during rehearsal?

It does not. The manifest is locked when rehearsal begins. If you need to change the migration configuration, you must abort, generate a new manifest version, and start a new rehearsal.

---

## Getting Help

If you encounter issues during cutover rehearsal:

1. **Check the verification report** — Most issues are caught by automated verification
2. **Review the intent journal** — See exactly what changed
3. **Contact Murmurant support** — We can help diagnose issues without affecting your data
4. **Abort if uncertain** — It is always safe to abort and try again

---

## Related Documentation

- [Migration Customer Journey](./MIGRATION_CUSTOMER_JOURNEY.md) — What customers experience during migration
- [WA Policy Capture](./WA_POLICY_CAPTURE.md) — Configuring organization policies
- [Importer Runbook](./IMPORTER_RUNBOOK.md) — Technical data import procedures
- [Intent Manifest Schema](../ARCH/INTENT_MANIFEST_SCHEMA.md) — Technical manifest specification
- [Preview Surface Contract](../ARCH/PREVIEW_SURFACE_CONTRACT.md) — Preview guarantees and bounds

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2025-12-25 | System | Added manifest binding, preview equivalence, abort as success |
| 2025-12-24 | System | Initial documentation |
