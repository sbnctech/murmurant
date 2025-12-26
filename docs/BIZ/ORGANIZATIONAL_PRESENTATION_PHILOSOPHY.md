# Organizational Presentation Philosophy

```
Audience: Customers, Board Members, Non-Technical Decision-Makers
Purpose: Explain how ClubOS handles organizational identity during migration
```

---

## Our Core Promise

> **ClubOS helps your organization arrive intact.**

When you migrate from Wild Apricot to ClubOS, we do not just move your data. We help you bring your organization's identity - how you present yourselves to your members.

Your member-facing content, your navigation structure, your event descriptions - these are not just files. They represent years of decisions about who you are and how you want to be seen. We treat that with care.

**Note:** ClubOS is a membership management platform, not a general-purpose website builder. We migrate your member-facing content and data, not your entire public website.

---

## Why Presentation Matters

### Data Is Not Identity

Your member list is important. Your event history is valuable. But your organization is more than a database.

When someone visits your website, they see:
- How you describe your mission
- How you organize your activities
- What you choose to highlight
- How you welcome newcomers

This is your **organizational identity**. Moving your data without preserving this identity means you lose something important.

### Your Website Reflects Your Intent

We cannot attend your board meetings. We cannot read your bylaws. But we can see how you present yourselves in Wild Apricot.

Your current website is the clearest signal of how you want your organization to be perceived. We use this as our guide.

---

## How ClubOS Approaches This

### Assisted Reconstruction

We do not ask you to start from a blank page. Instead, we:

1. **Discover** - We analyze your Wild Apricot site to understand your current member content and structure
2. **Suggest** - We generate draft ClubOS content pages based on what we find (this is not a website clone)
3. **Review** - You see exactly what we are proposing before anything happens
4. **Approve** - Nothing changes until you say yes

This is **assisted reconstruction** - the system does the heavy lifting, but you remain in control. The result of this process is an **Intent Manifest**: a reviewable record of what we propose before any changes occur.

### Human-in-the-Loop

At every step that matters, a human makes the decision:

| Step | Who Decides |
|------|-------------|
| What pages to create | You review and approve |
| How navigation is organized | You review and approve |
| When to go live | You explicitly commit |
| Whether to abort | You can always say no |

We do not automate consequential decisions. We automate the tedious work so you can focus on the important choices.

### Preview and Validation

Before anything is published, you can:

- See how your member-facing content will appear in ClubOS
- Compare key elements with your Wild Apricot site (appearance will differ; ClubOS has its own design system)
- Request changes before committing
- Walk away if it does not feel right

The preview is not a promise. It is a preview. You decide if we got it right.

### No Forced Automation

Some systems automate everything and hope for the best. We do not.

If something needs your judgment, we ask. If something can go wrong silently, we surface it. If you need to understand what is happening, we explain.

---

## What This Is NOT

We want to be clear about what we are not doing:

### Not Scraping HTML Verbatim

Wild Apricot pages are built with their own technology. We cannot and do not simply copy the HTML. We extract the **intent** - what you are trying to communicate - and reconstruct it in ClubOS.

### Not Cloning Themes

Wild Apricot themes are proprietary. We do not replicate them pixel-for-pixel. Instead, we approximate your visual intent - your general color choices, your content priorities - using ClubOS templates. The result will look different; our goal is recognizable, not identical.

### Not Locking You In

If the migration does not meet your expectations, you can abort. Wild Apricot remains exactly as it was. We do not trap you.

---

## Safety Guarantees

We take safety seriously:

### Wild Apricot Remains Authoritative Until Commit

During the entire migration process, your Wild Apricot site is the truth. We read from it; we do not write to it. Nothing changes there.

Only when you explicitly commit the migration does ClubOS become your new home. Until then, you can walk away at any time.

### Abort Is Always Possible

At any point before final commit, you can abort the migration:
- Your Wild Apricot site is unchanged
- Your ClubOS preview is discarded
- No harm done

### Nothing Publishes Without Approval

We do not automatically publish anything. Every page, every section, every piece of content requires your explicit approval before it goes live.

---

## Reversibility Contract

Our safety guarantees are not just philosophy—they are a formal contract.

The [Reversibility Contract](../ARCH/REVERSIBILITY_CONTRACT.md) formalizes this promise:

> **You can return to Wild Apricot without data loss or identity erasure at any point before final commit.**

This contract specifies:

- **Abort is always safe**: Before commit, you can walk away and Wild Apricot remains exactly as it was
- **Wild Apricot remains authoritative**: During cutover rehearsal, WA is the source of truth—ClubOS only records intentions
- **Commit is explicit**: No passive timeouts, no automatic transitions—you must explicitly approve
- **Preserved artifacts enable recovery**: Even after commit, we preserve snapshots and mapping tables

If you need the technical details of what we guarantee (and what we do not), read the Reversibility Contract. It is written to be precise, not promotional.

---

## Relationship to Migration

Presentation reconstruction is not a "later phase" or "nice to have."

It is part of what we consider a successful migration. When we say your migration is complete, we mean:

- Your data is in ClubOS
- Your member-facing content is recognizable in ClubOS (though styled differently)
- Your members can find the information they expect (events, activities, member resources)

If members cannot find the core content they relied on in Wild Apricot, the migration is not complete.

---

## Related Documents

For technical details and procedures:

- [Intent Manifest Schema](../ARCH/INTENT_MANIFEST_SCHEMA.md) - What the manifest captures and guarantees
- [Reversibility Contract](../ARCH/REVERSIBILITY_CONTRACT.md) - Formal guarantees for migration safety
- [Migration Runbook](../IMPORTING/IMPORTER_RUNBOOK.md) - How migration operations work
- [Cutover Rehearsal Mode](../IMPORTING/CUSTOMER_MIGRATION_CUTOVER_REHEARSAL.md) - How rehearsal and commit work
- [Migration Customer Journey](../IMPORTING/MIGRATION_CUSTOMER_JOURNEY.md) - What customers experience during migration

---

## Questions?

If you have questions about how your organization's presentation will be handled during migration, please ask. We are happy to explain our approach and address any concerns.

Your organization's identity matters to us because it matters to you.

---

_This document reflects ClubOS's commitment to treating organizational presentation as a first-order migration concern._
