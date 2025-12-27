# Trust and Risk FAQ

**Audience**: Board members, operations directors, and organizational leaders evaluating ClubOS
**Last Updated**: 2025-12-25

---

## Overview

This document answers common questions about risk, control, and trust during ClubOS adoption and migration. The answers reflect how the system actually works, not marketing aspirations.

---

## Questions and Answers

### What if the migration is wrong?

You will see exactly what the migration intends to do before it happens.

Before any data moves, ClubOS generates a preview showing every record that would be created, updated, or skipped. You review this preview. If something looks wrong, you stop. No data has moved. You investigate, we correct the issue, and you preview again.

Migration does not proceed until you explicitly approve.

### What if we don't like the result?

You have multiple opportunities to say no.

1. **Before migration**: You preview all changes. If you don't like what you see, you abort. Nothing happens.
2. **During rehearsal**: You can run a complete rehearsal that validates the migration without committing. If the rehearsal reveals problems, you abort. Nothing happens.
3. **After commit**: Some changes can be rolled back using preserved artifacts. Not all changes are reversible after commit—this is stated clearly before you approve.

We do not pressure you to proceed. Taking time to decide is expected.

### Can we stop halfway?

Yes, with one important distinction.

**Before commit**: You can stop at any point. Stopping discards uncommitted work. Your source system and ClubOS both remain unchanged.

**After commit**: Stopping depends on what has already been applied. ClubOS uses atomic operations where possible, but some multi-step processes may partially complete. If you need to reverse committed changes, that requires a rollback procedure, which may not be available for all operations.

The rule: aborting before commit is always safe. Reversing after commit depends on the specific operation.

### Who is in control?

You are.

ClubOS proposes. You decide. The system generates recommendations, previews, and migration plans. None of these take effect without your explicit approval.

Specifically:

- **You** review the preview before anything changes
- **You** approve or reject each suggested change
- **You** trigger the commit that applies changes
- **You** can abort at any point before commit

The system does not make decisions on your behalf. If something requires judgment, the system asks.

### What happens if something goes wrong?

The system fails visibly, not silently.

If an operation fails:

- You see an error message explaining what failed
- The system logs the failure with details for investigation
- Partially completed operations are either rolled back or left in a clearly marked state
- You are never left wondering whether something worked

We do not hide errors. If we cannot complete an operation, we tell you.

### How do we verify accuracy?

You verify. We provide the tools.

**Count comparisons**: The system shows record counts from your source system alongside what ClubOS received. You confirm the numbers match.

**Sample verification**: You spot-check individual records to confirm data transferred correctly. We provide tools to locate specific members, events, or transactions.

**Recognition tests**: You review the migrated data and confirm it matches your expectations. This is your responsibility because only you know what your data should look like.

We do not certify accuracy. You do. We give you visibility to make that judgment.

### How is this different from other vendors?

We show you what will happen before it happens.

Many systems apply changes and then show you the result. ClubOS shows you the intended result first. You approve or reject before anything changes.

Other differences:

- **No black boxes**: Every decision the system makes is explainable in plain English
- **No silent automation**: The system does not modify your data without your knowledge
- **No forced timelines**: You proceed when you are ready, not when a project plan says so
- **Preserved artifacts**: Migration artifacts are retained so you can audit what happened later

We cannot speak to what other vendors do. We can tell you what we do: explicit preview, explicit approval, explicit audit trail.

### What is NOT automated?

Several things require your judgment and cannot be delegated to the system.

**Policy decisions**: How should membership levels map? What registration statuses should carry over? Which events are relevant? You decide.

**Data quality**: If source data has inconsistencies, you choose how to resolve them. The system surfaces problems; you fix them.

**Verification**: You confirm that migrated data is correct. The system cannot know what your data "should" look like.

**Timing**: You decide when to migrate, when to go live, and when to cut over. We do not set deadlines.

**Rollback decisions**: If something goes wrong after commit, you decide whether and how to recover. We provide tools, not mandates.

The system handles mechanics. You handle judgment.

---

## What We Do Not Promise

Honesty requires stating limits.

- **We do not promise zero errors.** Complex migrations surface edge cases. We promise visibility into what happens and the ability to stop before commit.

- **We do not promise instant rollback for everything.** Some operations are reversible; some are not. We tell you which before you commit.

- **We do not promise the system will catch every problem.** You are responsible for reviewing previews and verifying results. We provide tools, not guarantees.

- **We do not promise future features.** This document describes current capabilities. If a feature does not exist today, do not assume it will exist tomorrow.

---

## Related Documentation

- [Customer Migration Cutover Rehearsal](../IMPORTING/CUSTOMER_MIGRATION_CUTOVER_REHEARSAL.md)
- [Preview Surface Contract](../ARCH/PREVIEW_SURFACE_CONTRACT.md)
- [Suggestion Review Workflow](../ARCH/SUGGESTION_REVIEW_WORKFLOW.md)
- [Intent Manifest Schema](../ARCH/INTENT_MANIFEST_SCHEMA.md)

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2025-12-25 | System | Initial FAQ |
