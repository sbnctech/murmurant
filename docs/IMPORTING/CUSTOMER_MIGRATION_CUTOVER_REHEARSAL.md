# Customer Guide: Cutover Rehearsal Mode

**For:** Club administrators migrating from Wild Apricot to ClubOS
**Related Issues:** #202 (WA Migration Epic), #277 (Cutover Rehearsal Mode), #232 (Production Runbook)

---

## Overview

Cutover Rehearsal Mode is a safety feature that lets you **test your migration before making it permanent**. Think of it like a dress rehearsal before opening night—you can try everything out, catch any issues, and confidently proceed when you're ready.

During Cutover Rehearsal:

- **Wild Apricot remains your authoritative system** (members continue using WA normally)
- **ClubOS records all changes as "intentions"** (not committed yet)
- **You can abort with zero data loss** if something isn't right
- **When satisfied, you commit** and ClubOS becomes authoritative

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
| **Cutover Rehearsal** | 24-72 hours | Both systems active. ClubOS records intentions. |
| **Commit** | Instant | Intentions become permanent. ClubOS is authoritative. |
| **OR Abort** | Instant | All intentions discarded. Back to WA only. |

---

## What Happens During Cutover Rehearsal

### For Your Members

- Members continue using Wild Apricot normally during rehearsal
- They may preview ClubOS (if you enable preview access)
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

ClubOS maintains **one authoritative system at a time**:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   PRE-MIGRATION          CUTOVER REHEARSAL         POST-COMMIT │
│                                                                 │
│   ┌─────────┐            ┌─────────┐               ┌─────────┐ │
│   │   WA    │  ───────>  │   WA    │   ───────>    │ ClubOS  │ │
│   │ (auth)  │            │ (auth)  │               │ (auth)  │ │
│   └─────────┘            └─────────┘               └─────────┘ │
│                          ┌─────────┐                           │
│                          │ ClubOS  │                           │
│                          │(journal)│                           │
│                          └─────────┘                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Intent Journal

The Intent Journal is an append-only log of every change made in ClubOS during rehearsal. It provides:

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

On **Commit**, these entries are replayed against the ClubOS database, making them permanent.

On **Abort**, the journal is discarded, and ClubOS returns to pre-rehearsal state.

---

## Commit vs. Abort

### When to Commit

Commit when you have:

- [ ] Verified sample of member profiles (spot-check 10+ members)
- [ ] Confirmed all membership tiers mapped correctly
- [ ] Tested event creation and registration workflows
- [ ] Validated policy settings (timezone, schedules, thresholds)
- [ ] Trained key administrators on ClubOS workflows
- [ ] Resolved all blocking issues from verification gates
- [ ] Obtained board/leadership approval (if required)

### When to Abort

Abort if you encounter:

- Critical data discrepancies that can't be resolved
- Unexpected member-facing issues
- Integration problems with payment processors
- Need more preparation time
- Any reason—abort is always safe

### After Commit

Once committed:

- ClubOS becomes the authoritative system
- Wild Apricot should be put in read-only mode
- Members should be directed to ClubOS
- The intent journal is archived for audit purposes

### After Abort

If you abort:

- Wild Apricot remains authoritative (nothing changed)
- All ClubOS rehearsal data is discarded
- You can start fresh with another rehearsal attempt
- There's no limit to rehearsal attempts

---

## Timeline Example

Here's a typical cutover rehearsal timeline:

### Day -7: Preparation

- Run verification report on WA data
- Configure policies in ClubOS
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

### Can members use ClubOS during rehearsal?

Optionally, yes. You can enable preview access for members to explore ClubOS while WA remains authoritative. Any member actions in ClubOS during rehearsal are recorded in the intent journal.

### What if WA data changes during rehearsal?

The rehearsal window should be kept short (24-72 hours) to minimize drift. Any registrations or membership changes in WA during this period can be synced using the incremental sync process.

### Is there a time limit on rehearsal?

No hard limit, but we recommend keeping rehearsal under 72 hours to minimize the chance of WA data drift and member confusion.

### Can we do multiple rehearsals?

Yes. You can abort and restart rehearsal as many times as needed. Each rehearsal starts fresh.

### What happens to payment processing?

Payment processing remains with WA during rehearsal. On commit, payment configuration is transitioned to ClubOS. Detailed payment cutover is covered in the Production Migration Runbook.

### Who can commit or abort?

Only designated migration operators with the `migration:commit` permission can commit or abort. This is typically limited to the club's primary administrator and the ClubOS migration team.

---

## Getting Help

If you encounter issues during cutover rehearsal:

1. **Check the verification report** — Most issues are caught by automated verification
2. **Review the intent journal** — See exactly what changed
3. **Contact ClubOS support** — We can help diagnose issues without affecting your data
4. **Abort if uncertain** — It's always safe to abort and try again

---

## Related Documentation

- [Migration Customer Journey](./MIGRATION_CUSTOMER_JOURNEY.md) — What customers experience during migration
- [WA Policy Capture](./WA_POLICY_CAPTURE.md) — Configuring organization policies
- [Importer Runbook](./IMPORTER_RUNBOOK.md) — Technical data import procedures

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2025-12-24 | System | Initial documentation |
