# Policy Decision Dependencies

**Purpose:** Identify unresolved policy questions that block automation in ClubOS.
**Status:** Internal working document
**Last Updated:** December 2025

---

## Membership

| Issue ID | Question | Impacted Areas | Blocks Automation |
|----------|----------|----------------|-------------------|
| M-001 | What is the definition of "2 years" for membership term: 730 calendar days, 24 calendar months, or anniversary date based? | Membership | Yes |
| M-002 | Does extended membership have a fixed end date, or is it perpetual until lapsed? | Membership | Yes |
| M-003 | What is the grace period duration after extended membership offer is sent? | Membership | Yes |
| M-004 | What are the third-year extension criteria? (Referenced in Policies and Procedures, not located) | Membership | Yes |
| M-005 | What is the current dues amount? (Board sets it; actual dollar amount not found) | Membership, Finance | Yes |
| M-006 | Does membership application require payment before approval, or after? | Membership, Finance | Yes |
| M-007 | Does SBNC require references, sponsor, or orientation step for membership applications? | Membership | No |
| M-008 | What is the exact membership committee approval policy for applications? | Membership | Yes |
| M-009 | Is waiver acceptance recorded per-event or once at joining? | Membership, Events | Yes |
| M-010 | How is media release opt-out handled? (Process not defined) | Membership | No |
| M-011 | What privileges does a pending_renewal member have? | Membership | Yes |
| M-012 | What privileges does a suspended member have? (Likely none, but not codified) | Membership | Yes |
| M-013 | Can a lapsed member late-renew, and if so, within what window? | Membership | Yes |
| M-014 | Is there an appeal process for terminated members? (Current vs. proposed bylaws unclear) | Membership, Governance | No |

---

## Events

| Issue ID | Question | Impacted Areas | Blocks Automation |
|----------|----------|----------------|-------------------|
| E-001 | What is the event cancellation and refund policy? (Policy text not found) | Events, Finance | Yes |
| E-002 | What is the no-show policy for events? | Events | No |
| E-003 | What is the guest policy for home events? (Text not found) | Events | Yes |
| E-004 | What threshold triggers Board escalation for event budgets? | Events, Finance | Yes |
| E-005 | What are the budget approval limits by role? | Events, Finance | Yes |
| E-006 | Does gift membership automatically approve, or still require committee approval? | Events, Membership | Yes |
| E-007 | What is the expiration policy for gift memberships? (None vs 6/12 months) | Events, Membership | Yes |
| E-008 | Should gift memberships always be a specific tier (Newbie) or selectable? | Events, Membership | No |
| E-009 | What is the waitlist promotion priority when registrant cancels? (FIFO assumed, not codified) | Events | No |
| E-010 | Can members self-cancel registrations, and until what cutoff? | Events | Yes |
| E-011 | What is the registration scheduling policy? (Sunday announce, Tuesday open - SBNC-specific, needs confirmation) | Events | No |

---

## Finance

| Issue ID | Question | Impacted Areas | Blocks Automation |
|----------|----------|----------------|-------------------|
| F-001 | What is the reimbursement policy? (No policy text found) | Finance | No |
| F-002 | What are the spending authority thresholds by role? (VP Activities, Committee Chair, Treasurer, Board) | Finance, Events | Yes |
| F-003 | What payment provider will be used for ClubOS? (Stripe vs. other) | Finance | Yes |
| F-004 | What is the refund policy for event cancellations by member? | Finance, Events | Yes |
| F-005 | What is the refund policy for event cancellations by club? | Finance, Events | Yes |
| F-006 | Does finance import from QuickBooks require VP Finance approval before committing? | Finance | No |
| F-007 | What is the current WA subscription tier and annual cost? | Finance | No |
| F-008 | What infrastructure costs (VPS, DNS, etc.) are currently paid outside WA? | Finance | No |

---

## Governance

| Issue ID | Question | Impacted Areas | Blocks Automation |
|----------|----------|----------------|-------------------|
| G-001 | Which version of the bylaws is currently in effect? (Draft with All Amendments vs. previous) | Governance | Yes |
| G-002 | What is the current bylaw amendment threshold? (Simple majority vs. 2/3 supermajority) | Governance | No |
| G-003 | What are the current quorum requirements? (Fixed 11-member vs. majority of Board in office) | Governance | No |
| G-004 | Who currently has removal authority for Board members? (Executive Committee vs. full Board) | Governance | No |
| G-005 | Is the current Code of Conduct 3 bullet points or 9 comprehensive sections? | Governance | No |
| G-006 | What are the current term limit waiver rules? (Presidential discretion vs. Nominating Committee) | Governance | No |
| G-007 | Are standing rules separate from bylaws, and if so, where are they documented? | Governance | No |
| G-008 | What is the officer term length? (6 months referenced, needs confirmation) | Governance | No |
| G-009 | Do committee chairs require President approval for high-risk actions (mass email, refunds)? | Governance, Events, Finance | Yes |

---

## Summary

| Domain | Total Issues | Blocking Automation | Non-Blocking |
|--------|-------------|---------------------|--------------|
| Membership | 14 | 10 | 4 |
| Events | 11 | 6 | 5 |
| Finance | 8 | 4 | 4 |
| Governance | 9 | 2 | 7 |
| **Total** | **42** | **22** | **20** |

---

## Source Documents Reviewed

- `docs/policies/sbnc/EXTRACTED_RULES.md`
- `docs/MEMBERSHIP_LIFECYCLE_STATE_MACHINE.md`
- `docs/membership/MEMBERSHIP_MODEL_TRUTH_TABLE.md`
- `docs/events/EVENT_LIFECYCLE_DESIGN.md`
- `docs/work-queue/GIFT_MEMBERSHIP_WIDGET.md`
- `docs/work-queue/MEMBERSHIP_APPLICATION_WIDGET.md`
- `docs/OPS/QUICKBOOKS_INTEGRATION_PLAN.md`
- `docs/policy/POLICY_CROSSWALK.md`
- `docs/rbac/DELEGATED_ADMIN_ACTIVITIES_MODEL.md`
- `prisma/schema.prisma`
- Various codebase TODOs and comments

---

## Notes

- Issues marked "Blocks Automation: Yes" cannot be fully automated without a policy decision.
- Issues marked "Blocks Automation: No" can proceed with reasonable defaults, but may need later adjustment.
- Several contradictions exist between source documents (e.g., current vs. proposed bylaws); these require clarification of which version is in effect.
- Some policies may exist in documents that failed OCR extraction (image-based PDFs).

---

*This document identifies questions only. It does not contain recommendations or proposed solutions.*
