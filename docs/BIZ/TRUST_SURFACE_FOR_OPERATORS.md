# Core Trust Surface for Operators

How Murmurant protects your organization from mistakes, surprises, and harm.

**Audience:** Club presidents, board members, and administrators
**Last Updated:** 2025-12-25

---

## What This Document Explains

When you use software to run your organization, you are trusting it with important things: your members' information, your events, your money, and your reputation.

This document explains five promises Murmurant makes to protect you. These are not marketing claims. They are design principles that affect every feature in the system.

---

## The Five Guarantees

### 1. Human Authority

**The promise:** Important decisions require a human to approve them. The system suggests, but you decide.

**What could go wrong without this:**

Imagine software that automatically sends an email to all 700 members because it "detected" they should receive an update. Or software that automatically cancels event registrations when it thinks there is a problem. Or software that changes membership statuses based on rules you did not set.

Systems that make consequential decisions on their own create chaos when they make mistakes. And they always make mistakes eventually.

**What you see instead:**

Murmurant shows you what it proposes to do and waits for your approval:

- Before a migration runs, you review exactly what will be imported
- Before an email sends, you see the recipient list and content
- Before a role changes, you confirm the specific change
- Before anything publishes, you preview it

The system does the analysis. You make the call.

**Real examples:**

| Scenario | Without Human Authority | With Human Authority |
|----------|------------------------|---------------------|
| Migration from old system | "We imported 847 members" (hope it's right) | "Here are 847 members we plan to import. Review and approve." |
| Event registration closes | Automatic at capacity, no override | System suggests closing; you decide when |
| Board role changes | Effective immediately when entered | Preview shows what changes; you confirm |
| Newsletter send | Sent when scheduled, no review | Draft, review, approve, then send |

---

### 2. Preview Fidelity

**The promise:** What you see in preview is what will happen. The preview uses the same rules and data as the real operation.

**What could go wrong without this:**

You preview an email and it looks perfect. You approve it. But when it actually sends, different rules apply, and it goes to the wrong people. Or you preview a migration, everything looks correct, and after you commit you discover half the data was transformed differently.

Previews that lie are worse than no preview at all. They create false confidence.

**What you see instead:**

Murmurant previews use the exact same logic as execution:

- The preview reads the same data you will use
- The preview applies the same policies
- The preview shows you counts, mappings, and decisions
- If the preview shows 200 members affected, 200 members will be affected

If something changes between preview and execution (another admin made changes, time passed), Murmurant tells you and asks you to re-preview.

**Real examples:**

| Scenario | Low-Fidelity Preview | High-Fidelity Preview |
|----------|---------------------|----------------------|
| Member import | "This will import some members" | "This will import 423 active, 89 lapsed, 12 with errors. Here are the details." |
| Email audience | "Recipients: Active Members" | "Recipients: 634 members. Here are their names and emails." |
| Event publishing | "This event will be visible" | "This event will appear on the calendar for 700 members starting tomorrow at 8 AM Pacific." |
| Role assignment | "Grace will become Secretary" | "Grace gains: view all minutes, edit governance docs. Grace loses: Events committee access." |

---

### 3. Abortability

**The promise:** You can always stop. Until you explicitly commit, nothing permanent happens.

**What could go wrong without this:**

You start a migration and halfway through you realize something is wrong. But the system has already changed half your data, and stopping now would leave you in a broken state. Or you schedule an email send, then discover an error, but the system is already "processing" and cannot be interrupted.

Systems that cannot be safely stopped trap you. Once you start, you must finish, even when continuing is wrong.

**What you see instead:**

Murmurant keeps your source of truth unchanged until you commit:

- During migration, Wild Apricot remains authoritative until final commit
- During event setup, nothing is visible to members until you publish
- During email composition, nothing sends until you explicitly release it
- If you abort at any point, you are back where you started

Abort is always safe. You never have to finish something that is going wrong.

**Real examples:**

| Scenario | Without Abortability | With Abortability |
|----------|---------------------|-------------------|
| Migration | "Partially complete. Please continue to avoid data loss." | "Aborted. Wild Apricot unchanged. Murmurant draft discarded. Try again when ready." |
| Event creation | "Event created but hidden. Delete manually if unwanted." | "Aborted. No event exists. No one saw anything." |
| Email campaign | "Email queued. Cannot stop delivery in progress." | "Campaign aborted before send. No emails delivered." |
| Payment refund | "Refund initiated. Cannot undo." | "Refund requested. Confirm to proceed. Cancel to keep charge." |

---

### 4. Auditability

**The promise:** Every important action is recorded with who did it and why. You can always answer "what happened and who made that change."

**What could go wrong without this:**

A board member asks why a particular person was removed from the membership list. No one knows. The system just shows the current state, not how it got there. Or money is missing from an event, and there is no record of who processed refunds or when.

Systems without audit trails turn disputes into mysteries. When something goes wrong, no one can explain how.

**What you see instead:**

Murmurant records administrative actions:

- Role changes include who assigned them and when
- Membership status changes include who approved and the reason
- Refunds include who processed them and the justification
- Published content includes who published and when

When questions arise, the audit trail answers them.

**Real examples:**

| Scenario | Without Audit Trail | With Audit Trail |
|----------|--------------------|--------------------|
| "Why is Jane no longer a member?" | Unknown. Someone must have removed her. | "Membership set to Alumni by Ellen on Nov 12 at 2:34 PM. Reason: Resigned per email." |
| "Who changed the event capacity?" | No record. Check with everyone who has access. | "Capacity changed from 50 to 75 by Jack on Dec 1 at 9:15 AM." |
| "Who approved that newsletter?" | It was sent; we do not know who clicked send. | "Approved by Grace on Dec 10 at 4:00 PM. Sent Dec 11 at 8:00 AM." |
| "Why was this refund issued?" | No documentation exists. | "Refund of $25 by Treasurer on Dec 15. Note: Duplicate registration, member request." |

---

### 5. Determinism

**The promise:** Given the same inputs, the system produces the same outputs. No randomness, no hidden variation, no "it worked yesterday but not today."

**What could go wrong without this:**

You test a migration with a sample and it works perfectly. You run the full migration and get completely different results because the system behaves differently at scale or under load. Or you preview an email to yourself, it looks fine, but when it sends to everyone, the formatting is different because the system varied its behavior.

Non-deterministic systems are impossible to trust. You can never be confident that testing means anything.

**What you see instead:**

Murmurant uses the same logic every time:

- Preview runs the same code as execution
- Small tests predict large runs
- The same input data produces the same output
- When behavior must differ (timestamps, for example), it is documented

If you test something and it works, running it for real will work the same way.

**Real examples:**

| Scenario | Non-Deterministic | Deterministic |
|----------|------------------|---------------|
| Migration test | Works in preview; fails in production due to "timing issues" | Works in preview; works in production. Same logic, same results. |
| Email preview | Preview shows one thing; sent email looks different | Preview matches sent email exactly (except timestamp) |
| Event registration | Sometimes double-charges due to race conditions | One charge per registration. Duplicates rejected clearly. |
| Role calculation | Changes based on server load or time of day | Same role rules produce same role assignments, always |

---

## How These Guarantees Work Together

The five guarantees reinforce each other:

1. **Human Authority** means you make the decision
2. **Preview Fidelity** means you make an informed decision
3. **Abortability** means you can change your mind
4. **Auditability** means you can explain what happened
5. **Determinism** means testing is meaningful

Without all five, trust breaks down. A system that previews accurately but cannot be aborted traps you. A system that can be aborted but leaves no audit trail creates confusion. A system that is deterministic but hides decisions from humans removes your agency.

---

## When Uncertainty Exists

Sometimes the system cannot make a confident prediction. When this happens, Murmurant marks the uncertainty explicitly:

| Marker | What It Means |
|--------|---------------|
| "Requires your decision" | The system found multiple valid options and needs your input |
| "Cannot verify" | External data is unavailable; proceed only if you have independent confirmation |
| "May differ at execution" | Something may change between preview and commit (another admin editing, time passing) |
| "Policy unclear" | Your organization's rules do not clearly cover this case |

Uncertainty markers are not failures. They are honest communication. We do not guess when we are uncertain.

---

## What Murmurant Does NOT Promise

We want to be clear about limits:

### No Guarantee of Perfect Recovery

If you explicitly commit a migration and then discover a problem, reversing it may require manual work. We preserve the ability to recover, but recovery is not automatic.

### No Protection from Authorized Users

If someone with legitimate access makes a mistake or acts maliciously, the system logs what happened but cannot prevent authorized actions. Your access controls determine who can do what.

### No Instant Undo for External Effects

If Murmurant sends an email, the email is sent. We cannot unsend it. If Murmurant charges a credit card, the charge happened. We can refund, but we cannot erase the transaction.

### No Immunity from Your Own Decisions

If you review a preview carefully and approve it, and it does exactly what the preview showed, but you later wish you had decided differently - that is not a system failure. The system did what you asked.

---

## Questions to Ask

When evaluating whether to proceed with any significant operation, ask:

1. **Did I see a preview?** If not, can I request one?
2. **Can I abort if something looks wrong?** At what point does abort become unavailable?
3. **Who approved this?** Is there a record?
4. **What exactly will happen?** Are the counts, names, and effects clear?
5. **If I test this, will the real thing behave the same way?**

If any answer is unclear, ask before proceeding. The system should be able to answer these questions.

---

## Related Documents

- [System Guarantees](../reliability/SYSTEM_GUARANTEES.md) - Technical specification of what the system guarantees
- [Preview Surface Contract](../ARCH/PREVIEW_SURFACE_CONTRACT.md) - How previews work in detail
- [Organizational Presentation Philosophy](ORGANIZATIONAL_PRESENTATION_PHILOSOPHY.md) - How Murmurant handles your organization's identity
- [SBNC Operator Checklist](../OPS/SBNC_OPERATOR_CHECKLIST.md) - Pre-publish, publish, verify, rollback procedures
- [Inline Widget Troubleshooting](../OPS/INLINE_WIDGET_TROUBLESHOOTING.md) - Problem diagnosis and resolution

---

## Summary

Murmurant is designed so you can trust it with your organization. The five guarantees - Human Authority, Preview Fidelity, Abortability, Auditability, and Determinism - are not features you can turn off or options you can configure. They are how the system works.

When something matters, you decide. Before you decide, you see what will happen. If you change your mind, you can stop. Everything is recorded. Testing means something.

This is what it means to operate with trust.
