# Murmurant Brand and Customer-Facing Voice

```
Status: Living Document
Audience: Contributors, Operators, Customer Communications
Purpose: Formalize the implicit brand and voice developed during design
Authority: Normative for customer-facing materials
```

---

## 1. Purpose and Scope

### Why This Document Exists

Murmurant is not a generic SaaS product. The product experience, migration process, and customer trust model are inseparable from the business model itself. Brand and voice are not marketing concerns to be addressed later; they are product requirements that shape every interaction.

This document formalizes the brand and voice that emerged implicitly during extensive design work. The goal is to make that intent durable, reviewable, and enforceable.

### Product Behavior Is Part of the Brand

How the system behaves is a brand statement:

- If the system does something silently, that breaks trust
- If the system refuses to explain itself, that breaks trust
- If the system traps customers, that breaks trust

Every interaction, every message, every default choice communicates who Murmurant is.

---

## 2. Who Murmurant Is to the Customer

### Relationship Model

Murmurant is a **steward**, not a vendor.

| Murmurant Is | Murmurant Is Not |
|-----------|---------------|
| A careful partner | A feature factory |
| An assistant that waits for instructions | An optimizer that acts autonomously |
| Transparent about risk | Confident about everything |
| Invested in the customer's success | Invested in lock-in |

### Authority Posture

Murmurant operates under **operator authority**. The customer controls:

- When migration happens
- What data is committed
- Whether to proceed or abort
- What policies apply to their organization

Murmurant provides:

- Recommendations with reasoning
- Tools with visibility
- Defaults that can be overridden
- Warnings before irreversible actions

### How Murmurant Earns Trust

Trust is not claimed; it is demonstrated through behavior:

1. **Slowness** - We do not rush consequential decisions
2. **Visibility** - We show what is happening and why
3. **Reversibility** - We make it safe to change your mind
4. **Accountability** - We explain what we did and what we recommend
5. **Fidelity** - We preserve what you built, not what we would have built

Key insight from design work:

> "Fast" is not a selling point. "Nothing bad can happen without you noticing" is.

---

## 3. Voice and Tone Principles

### Plainspoken, Adult Language

Write for intelligent, busy people who have limited time but care deeply about getting things right.

- Use everyday language
- Be direct about what you mean
- Assume competence, not expertise
- Respect the reader's attention

### Explicit About Risk and Limits

Murmurant does not pretend to be smarter than it is:

- Acknowledge what we cannot determine
- State assumptions explicitly
- Warn about edge cases
- Document failure modes

### Calm, Procedural, Respectful

The tone should reflect how a careful professional explains a consequential process:

- No urgency pressure
- No enthusiasm inflation
- No minimization of concerns
- No dismissal of complexity

### Zero "AI Magic" Framing

Murmurant uses automation, but never frames it as intelligence:

- We do not say the system "understands" or "knows"
- We do not attribute judgment to algorithms
- We do not claim capabilities we cannot verify
- We describe processes, not predictions

---

## 4. Language Rules

### Preferred Phrases

| Instead of... | Use... |
|---------------|--------|
| "AI-powered" | "Automated" or describe the process |
| "Smart" | "Based on [specific criteria]" |
| "Seamless" | Describe what happens and what the operator controls |
| "Easy" | Describe the steps |
| "Just click..." | "When you are ready, select..." |
| "Don't worry" | Explain why the concern is addressed |
| "We'll take care of it" | Describe what will happen and when |

### Discouraged or Forbidden Phrases

| Phrase | Problem |
|--------|---------|
| "Automatically handles..." | Implies hidden behavior |
| "Best practice" | Imposes external authority |
| "Industry standard" | Vague appeal to unnamed consensus |
| "Simple" | Dismisses legitimate complexity |
| "Intelligent" | Anthropomorphizes software |
| "You should..." | Presumptuous about customer context |
| "Trust us" | Trust is demonstrated, not requested |

### Terms Requiring Care

- **Migration**: Not a feature; a consequential process with risk
- **Sync**: Clarify direction, authority, and reversibility
- **Default**: State what it is and how to change it
- **Automatic**: State what triggers it and how to prevent it
- **Error**: State what happened, why, and what to do

---

## 5. What Murmurant Refuses to Do (Brand Non-Negotiables)

These are not limitations to apologize for. They are design choices that protect customers.

### No Silent Automation

Consequential actions require:

- Explicit operator trigger
- Visible confirmation
- Auditable record

If something happens without the operator's knowledge, we have failed.

### No Identity Erasure

Migration preserves organizational identity:

- We reconstruct, we do not replace
- We ask for approval, we do not assume
- We show the customer what they will look like

If the customer cannot recognize their organization in Murmurant, the migration is not complete.

### No Forced "Best Practices"

Murmurant provides defaults, not mandates:

- SBNC policy is Tenant Zero, not the template for all customers
- Every policy value must be changeable without code changes
- We do not assume our way is the right way

### No Irreversible Actions Without Consent

Before any action that cannot be undone:

- Explicit warning
- Confirmation step
- Audit trail

Abort must always be possible until final commit.

---

## 6. Migration and Presentation as Brand

### Why Recognizability Matters

Organizations have identity. Their website, pages, and navigation reflect years of decisions about who they are and how they want to be seen.

Migration is not a data copy. Migration is helping an organization arrive intact.

### Why Fidelity Exceeds Automation

We do not optimize for speed; we optimize for accuracy:

- We extract intent, not just data
- We present drafts for review, not finished products
- We ask questions when intent is unclear

The customer is the authority on what their organization should look like.

### Why Abortability Is a Brand Promise

At any point before final commit:

- Wild Apricot remains unchanged
- Murmurant preview can be discarded
- No harm done

This is not a feature. This is the foundation of trust.

---

## 7. Examples

### On-Brand Explanation

> Before migrating your event registrations, Murmurant will show you a preview of how they will appear. You will see which members are matched, which require manual review, and which cannot be imported. Nothing will be committed to your live site until you explicitly confirm. If you decide not to proceed, your Wild Apricot data remains unchanged.

Why this works:

- States what will happen before it happens
- Makes operator control explicit
- Acknowledges edge cases
- Provides clear abort path

### Off-Brand Explanation

> Our smart migration engine seamlessly transfers all your data with just one click. Don't worry about the technical details - we'll handle everything automatically!

Why this fails:

- Claims intelligence that does not exist
- Promises seamlessness that hides complexity
- Dismisses legitimate concerns ("don't worry")
- Removes operator control ("automatically")
- Uses enthusiasm as a substitute for information

---

## 8. How This Document Evolves

### Living Document Status

This document captures brand intent as currently understood. It should evolve as:

- Customer feedback reveals gaps
- New features require new language
- Edge cases emerge that require clarification

### Change Control

Changes to this document require:

- Clear rationale for the change
- Review for consistency with existing principles
- Update to related materials if language rules change

### Relationship to Other Documents

This document complements:

**Business Model:**
- [BUSINESS_MODEL_CANONICAL.md](./BUSINESS_MODEL_CANONICAL.md) - Core business model rules
- [Organizational Presentation Philosophy](./ORGANIZATIONAL_PRESENTATION_PHILOSOPHY.md) - Customer-facing migration explanation
- [Architectural Charter](../ARCHITECTURAL_CHARTER.md) - Technical design principles
- [ChatGPT Design Transcript](./_ARCHIVE/CHATGPT_TRANSCRIPTS/CHATGPT_BUSINESS_MODEL_TRANSCRIPT_2025-12-24.md) - Design reasoning archive

**Visual Brand & Public Messaging:**
- [BRAND-GUIDE.md](../brand/BRAND-GUIDE.md) - Visual identity, logo, colors, typography
- [MURMURANT_FAQ.md](../brand/MURMURANT_FAQ.md) - Quick answers for board and prospects
- [VOICE_AND_MESSAGING.md](../brand/VOICE_AND_MESSAGING.md) - Public communication guidelines

**AI & Chatbot Voice:**
- [CHATBOT_GUARDRAILS.md](../internal/CHATBOT_GUARDRAILS.md) - How brand voice applies to AI-powered customer interactions, including response categories, deflection patterns, and system prompt templates

---

## Brand Review Checklist for Customer-Facing Documents

Before publishing any customer-facing material, verify:

- [ ] **No silent automation claims** - All automated actions are explicitly triggered and visible
- [ ] **Operator control is explicit** - Customer knows when and how to proceed, pause, or abort
- [ ] **Risk is acknowledged** - Failure modes and edge cases are stated, not hidden
- [ ] **Language is plain** - No jargon, no enthusiasm inflation, no "smart" or "AI" framing
- [ ] **Defaults are stated** - Customer knows what happens if they make no choice
- [ ] **Reversibility is clear** - Customer knows how to undo or abort
- [ ] **Identity is preserved** - Customer's organization is recognizable, not templated
- [ ] **Trust is demonstrated** - Claims are supported by visible behavior, not assertions

---

_This document formalizes the brand and voice that emerged during Murmurant design. It is a living reference for maintaining consistency across all customer-facing materials._
