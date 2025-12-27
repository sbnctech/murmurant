# Board Memo: Platform vs. Policy Separation

**To:** SBNC Board of Directors & Prospective ClubOS Adopters
**From:** ClubOS Technical Team
**Date:** December 2024
**Subject:** Why Separating Platform Safety from Organizational Policy Matters

---

## Executive Summary

ClubOS is being developed as a **reusable membership platform** that can serve multiple organizations. This memo explains a critical architectural decision: separating the platform's safety guarantees from each organization's governance policies.

**The key insight:** The software that keeps your data secure should not dictate how you run your club.

---

## What Is Being Separated

### Platform Invariants (Safety Guarantees)

These are non-negotiable technical protections built into ClubOS:

- **Access control**: Only authorized people can see sensitive data
- **Audit trails**: Every important action is logged for accountability
- **Data integrity**: The system prevents accidental corruption
- **Privacy protection**: Personal information cannot be accidentally exposed

These protections apply to every organization using ClubOS. They are not configurable because relaxing them would create security risks.

### Organizational Policy (Governance Choices)

These are decisions that each organization makes for itself:

- How long is your "new member" period? (SBNC uses 90 days)
- What roles exist on your board? (SBNC has president, VP-activities, etc.)
- When does registration open for events? (SBNC uses Tuesday 8 AM)
- What is your meeting approval workflow?
- What membership tiers do you offer?

These choices reflect your bylaws, traditions, and community preferences. ClubOS should support your choices, not impose SBNC's choices on you.

---

## Why This Separation Matters

### For Portability

A garden club in Maine should not inherit Santa Barbara Newcomers Club's governance rules. When ClubOS separates platform from policy, new organizations can adopt the software and configure their own:

- Role structures
- Membership lifecycles
- Scheduling rules
- Approval workflows

### For Adoption

Organizations evaluating ClubOS will ask: "Will this software try to tell us how to run our club?" The answer must be "no." The platform provides tools and safety; your board provides policy.

### For Maintainability

When SBNC's governance is embedded in code, any change to SBNC policy requires a software update. When policy is configuration:

- SBNC can adjust policies without developer involvement
- Other organizations' policies don't affect SBNC
- Software updates focus on features and security, not governance

### For Legal and Ethical Clarity

If ClubOS hard-codes SBNC rules, other organizations might inadvertently adopt them. This creates confusion about whose bylaws actually govern. Clean separation ensures each organization's policies are explicit and intentional.

---

## How SBNC Benefits

### Template Value

SBNC's configuration becomes a "reference implementation"—a working example that new organizations can study and adapt. This is valuable intellectual property without being controlling.

### Early Adopter Advantage

As the founding user, SBNC's needs shape the platform's capabilities. Features SBNC requests become available to all, but SBNC gets them first.

### Potential Revenue Relationship

If ClubOS becomes a commercial product, SBNC could benefit through:

- Licensing arrangements for the template
- Royalty relationships for referrals
- Reduced operating costs through shared infrastructure

*Note: Any commercial arrangements require separate board approval and legal review.*

### Mission Alignment

A successful ClubOS helps other clubs thrive, which aligns with SBNC's broader mission of community building.

---

## What SBNC Does NOT Become

### Not a Default Rules Engine

Other organizations using ClubOS do not automatically inherit SBNC bylaws, role structures, or governance workflows. SBNC policies are one example, not the template.

### Not a Governance Authority

ClubOS does not make SBNC's board the arbiter of how other clubs should operate. Each organization retains full autonomy over their policies.

### Not Liable for Others' Choices

When policy is clearly separated from platform, SBNC has no responsibility for how other organizations configure their governance.

---

## Conflict of Interest Awareness

**Reference:** GitHub Issue #261

If SBNC board members or volunteers have roles in both SBNC governance and ClubOS development/commercialization, potential conflicts of interest may arise:

- Decisions about which features to prioritize
- Pricing or licensing terms if ClubOS becomes commercial
- Whether SBNC policies should influence platform design

### Recommended Practices

1. **Disclosure**: Board members should disclose any involvement in ClubOS development or potential commercial interests

2. **Recusal**: When conflicts arise, affected members should recuse from relevant votes

3. **Documentation**: Decisions about ClubOS and SBNC's relationship should be documented in meeting minutes

4. **Legal counsel**: Before any commercial arrangement, the board should consult with legal counsel about fiduciary duties and organizational structure

*This memo does not constitute legal advice. Each organization should consult their own counsel regarding governance and commercialization decisions.*

---

## Summary

| Aspect | Platform (Invariant) | Policy (Configurable) |
|--------|---------------------|----------------------|
| **Owned by** | ClubOS codebase | Each organization |
| **Examples** | Security, audit logs, privacy | Roles, thresholds, workflows |
| **Can be changed by** | Developers only | Organization admins |
| **Applies to** | All organizations | One organization |

The separation of platform from policy is not just a technical decision—it's an ethical one. It respects each organization's autonomy while providing shared infrastructure for safety and functionality.

---

## Related Issues

- **#232**: [P1] Policy Isolation Epic
- **#261**: Conflict of Interest Awareness
- **#263**: Commercialization Readiness

---

*Questions about this memo should be directed to the ClubOS technical team or discussed at the next board meeting.*
