Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

# Why Wild Apricot Cannot Economically Fix These Issues

Status: Sales Enablement (1-Slide Outline)
Audience: Board, Prospects, Internal Strategy
Last updated: 2025-12-21

---

## Slide: Architectural Constraints, Not Lack of Intent

**Headline:**
Wild Apricot's architecture makes fixing core issues prohibitively expensive

---

### Bullets

1. **Hardcoded 4-role permission model baked into every feature**
   - Changing to granular permissions would break every integration,
     workflow, and customer expectation built over 15+ years

2. **Financial and registration data coupled at the schema level**
   - "Delete event" cascades to invoices because they share foreign keys;
     decoupling requires rewriting the entire financial subsystem

3. **Audit trail was an afterthought, not a foundation**
   - Adding actor attribution and before/after diffs would require
     instrumenting every write path across all modules

4. **Backward compatibility locks in bad defaults**
   - 20,000+ customers depend on current behavior; safe changes require
     opt-in migrations that most customers will never complete

5. **Personify acquisition prioritized revenue extraction over R&D**
   - Engineering resources allocated to pricing tiers and upsells,
     not architectural remediation (support degradation is evidence)

---

## Speaker Notes

Use these notes to expand on each bullet during presentation.

---

**Opening framing:**

"This is not about intent or competence. Wild Apricot's team could fix
these issues if they started fresh. But they cannot start fresh. They
have 20,000+ customers on a 15-year-old architecture. Every fix risks
breaking something else. Let me show you why."

---

**Bullet 1: Hardcoded permission model**

The 4-role model (Admin, Limited Admin, Event Manager, Read-Only) is not
a configuration choice - it is embedded in code paths throughout the
system. WA-001, WA-002, WA-003, WA-004, and WA-006 all stem from this.

To add granular permissions, they would need to:
- Audit every feature for permission checks
- Add capability-based gates without breaking existing behavior
- Migrate 20,000 customers to a new model while preserving their current access

The economic reality: this is a multi-year project with zero new revenue.
No PE-owned company will fund it.

---

**Bullet 2: Coupled financial and registration data**

WA-021 (delete event cascades to invoices) and WA-030 (invoice voiding
cascades) exist because events, registrations, and invoices share database
relationships that enforce cascade behaviors.

To fix this, they would need to:
- Introduce cancel-vs-delete semantics at the data layer
- Migrate all historical data to new schema
- Test every financial report and export for regression

The risk is too high. A botched migration could corrupt financial records
for thousands of nonprofits. They will not attempt it.

---

**Bullet 3: Audit trail as afterthought**

WA-007 through WA-011 all relate to missing or incomplete audit trails.
The system was built before "who did what when" was a requirement.

Adding comprehensive audit now requires:
- Wrapping every write operation in logging
- Storing before/after state for every change
- Retrofitting actor attribution to actions that currently run without context

This is not a feature add - it is a rewrite of the persistence layer.
No customer is paying extra for audit logs. No business case exists.

---

**Bullet 4: Backward compatibility trap**

Every behavior change risks breaking a customer. Examples:
- WA-023 (waitlist bypass) was fixed in v5.18 - took years
- WA-027 (event cloning) is only partially fixed
- WA-032 (renewal reminders to auto-renewers) persists because some
  customers may have built processes around the current behavior

To make safe changes, WA would need:
- Feature flags for every change
- Opt-in migration paths
- Support capacity to handle migration issues

They have neither the engineering bandwidth nor the support capacity
(see WA-048). Changes stall indefinitely.

---

**Bullet 5: Personify acquisition dynamics**

Since Personify acquired Wild Apricot:
- Support response times have increased dramatically (WA-048)
- Price increases of ~20% annually (WA-049)
- No major architectural improvements shipped

This is consistent with PE acquisition playbook:
- Extract value from existing customer base
- Minimize R&D investment
- Maximize EBITDA for eventual resale

Architectural fixes generate no incremental revenue. They will not happen.

---

**Closing:**

"This is why we built ClubOS from scratch. We are not smarter than the
WA team. We simply do not have 15 years of technical debt and 20,000
customers depending on broken behavior. Our architecture was designed
to prevent these issues, not patch around them."

---

## References

- [Wild Apricot Top 50 Issues](./WILD_APRICOT_TOP_50_ISSUES.md) - Full issue inventory
- [ClubOS vs WA Matrix](./CLUBOS_VS_WA_50_ISSUE_MATRIX.md) - Our response to each issue
- [Persona Implications](../product/WA_TOP_50_PERSONA_IMPLICATIONS.md) - Who is affected

---

## Usage Guidelines

- Use with prospects who ask "why can't WA just fix this?"
- Do NOT use as attack material or share publicly
- Focus on architecture, not people or intent
- Pair with demo of ClubOS capabilities that WA cannot match
