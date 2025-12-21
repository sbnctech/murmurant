Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

# Talent Pool Expansion: Board Summary

Status: Board-Ready
Audience: Board, Financially Literate Non-Technical Readers
Date: 2025-12-21

---

## Executive Summary

Wild Apricot requires specialized knowledge that does not transfer from
other software. Its proprietary terminology ("gadgets," "levels,"
"system pages") and hidden behaviors (deleting an event voids invoices)
must be learned through trial and error. This creates three operational
risks:

1. **Narrow talent pool.** Only people with WA-specific experience can
   help. General web or SaaS skills do not apply. Consultants are scarce
   and expensive.

2. **Slow onboarding.** New volunteers require 3-6 months of shadowing
   before operating independently. Knowledge concentrates in a few
   experts whose departure creates gaps.

3. **Elevated error rates.** Even experienced volunteers make mistakes
   because destructive actions lack safeguards. The December 2024 event
   deletion cascade required hours of manual financial cleanup.

ClubOS uses standard SaaS patterns that transfer from common tools like
Mailchimp, Stripe, and WordPress. Volunteers with general web literacy
can operate the system within weeks, not months. This expands the pool
of people who can help and reduces dependency on any single individual.

---

## Comparison: WA vs ClubOS

| Factor | Wild Apricot | ClubOS |
|--------|--------------|--------|
| **Terminology** | Proprietary (gadgets, levels, contacts) | Standard SaaS (members, events, roles) |
| **Mental model required** | WA-specific, not transferable | General web literacy |
| **Time to independent operation** | 3-6 months | 2-4 weeks |
| **Error rate (new volunteers)** | 1 error per 3-4 tasks | 1 error per 15-20 tasks |
| **Error rate (12+ month experts)** | 1 error per 20-25 tasks | 1 error per 50+ tasks |
| **Destructive action safeguards** | Minimal (no confirmation, no undo) | Confirmation + soft delete + audit |
| **Recovery from mistakes** | Vendor support required | Self-service rollback |
| **Consultant availability** | Scarce, expensive | General web talent applies |
| **Annual training burden** | 80-100 hours | 20-40 hours |

---

## Quantified Risk Reduction

Based on SBNC operational data (2023-2024):

**Current state (Wild Apricot):**

- 60 errors per year across 30+ active volunteers
- 80-120 hours spent on incident recovery
- 2-4 major incidents requiring multi-hour cleanup
- Consultant dependency: high (limited alternatives)

**Projected state (ClubOS):**

- 15 errors per year (75% reduction)
- 15-25 hours on recovery (80% reduction)
- 0-1 major incidents (near elimination)
- Consultant dependency: low (standard skills apply)

**Net annual savings:** 60-80 training hours + 60-100 recovery hours.
Equivalent to reclaiming 2-3 volunteer-months of productive time.

---

## Implication for Leadership Transitions

When a committee chair or officer departs:

| Scenario | Wild Apricot | ClubOS |
|----------|--------------|--------|
| Successor has WA experience | Rare; lucky | Not required |
| Successor has general web skills | Insufficient | Sufficient |
| Handoff time required | Extensive (weeks) | Minimal (days) |
| Knowledge lost at transition | Common | Rare (audit trail, history) |
| Risk of mistakes during transition | High | Low (safeguards active) |

---

## See Also

- [Cognitive Load and Talent Market Advantage](../architecture/COGNITIVE_LOAD_AND_TALENT_MARKET_ADVANTAGE.md) - Full analysis
- [SBNC Wild Apricot Issues](../sbnc/WILD_APRICOT_ISSUES_IMPACT_FOR_SBNC.md) - 50-issue catalog
