# How Murmurant Is Built

**Audience**: Non-profit executive directors, board members, operations leaders

---

## 1. Why Software Systems Often Fail Organizations

Organizations depend on software to manage their members, events, communications, and operations. When that software fails, the consequences are real:

- **Data disappears.** A system update, a bug, or a mistake can erase years of records. Sometimes you notice immediately. Sometimes you notice months later.

- **Changes happen without your knowledge.** Some systems make decisions on your behalf—updating records, sending emails, modifying settings—because the software decided it was a good idea.

- **Mistakes become permanent.** Some actions cannot be undone. If something goes wrong, there may be no path back.

- **You cannot prove what happened.** When disputes arise, you cannot answer basic questions: Who did this? When? Why?

- **You get locked in.** Once your data lives in a system, extracting it can be difficult or impossible.

These are not theoretical concerns. Organizations experience them regularly.

---

## 2. Why Migrations Are Risky for Real Organizations

Moving from one system to another is one of the most stressful things an organization can undertake:

- **Your history is at stake.** Membership records, event history, payment records, and communications represent years of work.

- **You are dependent on others.** During migration, you must trust that someone else will handle your data correctly. You may not see what is happening or understand the process.

- **Timing is uncertain.** You do not know how long it will take, when problems will appear, or how long you will be in a half-migrated state.

- **Rollback feels impossible.** Once you commit to a new system, going back seems impractical. This makes the decision feel irreversible.

- **Your members will notice if something goes wrong.** A botched migration can embarrass your organization and damage trust that took years to build.

These fears are reasonable. They are based on real experiences.

---

## 3. How Murmurant Is Intentionally Built Differently

Murmurant is designed around a foundational principle: **the system proposes, humans decide**.

This is not a marketing statement. It is how every part of the system works.

- **The system never acts alone.** Murmurant does not make decisions on your behalf. Every consequential action requires human approval.

- **You see before you commit.** Before any change takes effect, you see exactly what will happen. This is the actual change, shown for your review.

- **Walking away is always safe.** Until you explicitly approve a change, nothing has happened. There is no penalty for caution.

- **Everything is recorded.** Every decision, approval, and change is logged. If you need to understand what happened and why, the record exists.

---

## 4. Human Authority vs. Automation

Some software tries to be "smart." It makes decisions for you, automates processes, and optimizes without asking. This can seem convenient, but you lose control.

Murmurant takes a different approach.

**What Murmurant automates:**

- Displaying information you have already approved
- Recording that an action occurred
- Calculating totals and counts
- Showing scheduled reminders

These are mechanical tasks where the answer is obvious and consequences are minimal.

**What Murmurant does not automate:**

- Approving changes to your content
- Deciding who is a member in good standing
- Sending communications to your members
- Modifying your data

For these actions, the system prepares everything, but a human makes the decision.

**Why this matters:** When something goes wrong in an automated system, you may not know until damage is done. When a human is in the loop, problems are caught before they become permanent.

---

## 5. Preview Before Change

One of Murmurant's guarantees is that you see exactly what will happen before it happens.

**How preview works:**

When you ask Murmurant to make a change—updating a record, publishing a page, migrating data—the system first shows you what will change. This preview uses the same logic that the actual change would use.

**What this means in practice:**

- Before publishing a page, you see exactly how it will appear
- Before running a migration, you see every record that will be created or modified
- Before sending a communication, you see the actual message

**Why we do this:** Surprises destroy trust. If you approve a change and something different happens, you lose confidence in the system. Preview eliminates this category of problem.

---

## 6. Abortability and Rollback

Until you explicitly commit to a change, you can always walk away.

**What "abort" means:**

Abort means stopping a process before it completes and ensuring nothing has changed. It is not the same as "undo"—abort happens before the action, not after.

**When you can abort:**

- During preview: You are reviewing proposed changes and decide not to proceed
- During review: You have been shown what will happen and choose not to approve
- Before commit: You have prepared everything but decide not to finalize

In all these cases, aborting is safe. The system returns to exactly the state it was in before you started.

**After commit:**

Once you commit a change, it is real. However, Murmurant is designed so that committed changes are either reversible or clearly marked as permanent before you approve them.

**Why this matters:** Fear of making mistakes prevents people from taking action. Knowing you can always stop removes the fear that holds organizations back.

---

## 7. Auditability and Verification

Trust is not just about promises. It is about evidence.

**What Murmurant records:**

Every consequential action is logged:

- **Who** performed the action
- **What** was changed
- **When** it happened
- **Why** it was done (if a reason was provided)

This record cannot be edited or deleted. It is a permanent history of what actually happened.

**Why this matters:**

When disputes arise, when something goes wrong, or when you need to understand your own history, the audit log provides answers:

- "Who approved this membership change?"
- "When did we change our event policy?"
- "What did this record look like before the update?"

**How this builds trust:** You do not need to trust that Murmurant did the right thing. You can verify. The record is always available, always complete, and always accurate.

---

## 8. What Murmurant Explicitly Does Not Do

Understanding what a system does not do is as important as understanding what it does.

**Murmurant does not:**

- **Make decisions without your approval.** No automated rules decide who is a member, what content is published, or when communications are sent.

- **Send communications you did not authorize.** Murmurant never sends an email to your members unless a human specifically approved that message.

- **Modify your data silently.** Every change is logged and visible. There are no background processes that alter records without your knowledge.

- **Assume what you meant.** If something is ambiguous, Murmurant asks for clarification rather than guessing.

- **Commit based on timeouts.** Inaction does not equal approval. Nothing happens because you forgot to say no.

- **Apply partial changes.** Changes apply completely or not at all. You will not end up in a half-changed state.

---

## 9. What This Means for You as a Customer

If you are considering Murmurant, here is what you can count on:

**You remain in control.** Your organization makes the decisions. Murmurant is a tool that serves your intentions, not a system that manages your organization on your behalf.

**You will not be surprised.** Before anything changes, you see what will change. Preview is the actual change, shown for your approval.

**Caution is welcome.** Walking away from a proposed change is always safe. There is no penalty for reviewing options and deciding not to proceed.

**You can verify.** When something happens, you can find out what, when, who, and why. The record exists, it is accurate, and it is permanent.

**Mistakes are recoverable.** For most actions, if something goes wrong, you can undo it. For actions that cannot be undone, you are warned before you commit.

---

## A Note on Trust

Trust is built through consistent behavior over time, not through promises.

Murmurant is designed so that every interaction reinforces the same principles: you are in control, you see before you commit, you can walk away, and you can verify what happened.

We do not ask you to trust us. We ask you to observe how the system behaves and draw your own conclusions.

---

## Related Information

For technical details on how these principles are implemented, see the [Core Trust Surface](../ARCH/CORE_TRUST_SURFACE.md) documentation.

---

*This document describes how Murmurant is built. If your experience differs from what is described here, we want to know.*
