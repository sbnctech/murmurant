SBNC Membership Lifecycle (Authoritative Business Rule Draft)

Concept
A new SBNC member progresses through time-based membership phases:

1) Newbie membership
- Begins at join date (Day 0)
- Duration: 90 days
- Purpose: onboarding period (Newbie Member)

2) Regular membership
- Begins immediately after Newbie ends (Day 91)
- Continues until the 2-year mark from join date
- Purpose: full membership benefits (Member)

3) Extended membership (optional, paid)
- At the 2-year mark, the member must be offered Extended membership
- Extended membership becomes active only if the member explicitly accepts AND pays the Extended Member fee
- If not accepted/paid, membership ceases at the 2-year mark

Key decision points
- T+90 days: automatic transition Newbie -> Regular (no new application)
- T+2 years: offer Extended; member either:
  - accepts + pays -> becomes Extended Member
  - declines or does not pay -> membership ceases

Implications for Murmurant
- MembershipTier should be derived from join_date + current_date + extended_acceptance/payment state
- Extended status is not automatic; it is an offer + acceptance + payment

Data model hints (non-binding)
- Member.joinedAt (required)
- Member.extendedOfferedAt (nullable)
- Member.extendedAcceptedAt (nullable)
- Member.extendedPaidAt (nullable)
- MembershipTier derived:
  - if now < joinedAt + 90d -> Newbie Member
  - else if now < joinedAt + 2y -> Member
  - else if extendedPaidAt set (and accepted) -> Extended Member
  - else -> Not Active

Open items
- Exact handling of leap years and "2 years" definition (730 days vs calendar years)
- Grace period for payment after offer (if any)
- Whether Extended membership has an end date (not specified yet)
