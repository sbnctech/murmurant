# Membership Model Truth Table (SBNC)

Purpose
- Provide a single-page reference for how Murmurant interprets membership status, membership tier, and lifecycle transitions.

Core entities
- Wild Apricot (WA) has one entity: Contact.
- Murmurant mirrors this by storing people in one entity (Member), which corresponds to a WA Contact.
- Whether a person is "a member" is derived from MembershipStatus (and related rules), not from a separate Contact vs Member table.

Key fields
- MembershipStatus (state)
  - Codes (seeded): active, lapsed, pending_new, pending_renewal, suspended, not_a_member, unknown
- MembershipTier (entitlement class)
  - Codes (seeded): newbie_member, member, extended_member, unknown
- WA import fields
  - waMembershipLevelRaw (raw WA membership level string, when available)
  - membershipTierId (resolved tier)

Definition: "member vs contact"
- A person is treated as a member when MembershipStatus is active (and potentially other member-ish statuses if we decide later).
- A person is treated as a contact-only record when MembershipStatus is not_a_member (or unknown).

Truth table (interpretation)
- Status answers: Are they currently a member, and what lifecycle state are they in?
- Tier answers: What class of membership entitlement do they have (when relevant)?

| MembershipStatus | MembershipTier     | Treat as member? | Typical meaning / UI behavior |
|-----------------|--------------------|------------------|-------------------------------|
| pending_new     | newbie_member      | No               | Applicant in onboarding flow. |
| pending_new     | unknown            | No               | Applicant, tier not resolved. |
| active          | newbie_member      | Yes              | Newbie window (first 90 days). |
| active          | member             | Yes              | Standard member window (up to 2 years from join). |
| active          | extended_member    | Yes              | Extended member (offered, accepted, paid). |
| active          | unknown            | Yes              | Member, but tier unresolved (flag for admin review). |
| pending_renewal | member             | TBD              | Renewal workflow state (policy TBD). |
| pending_renewal | extended_member    | TBD              | Renewal workflow state (policy TBD). |
| suspended       | any                | No (default)     | Suspended (policy TBD; likely no privileges). |
| lapsed          | any                | No               | Former member; historical record preserved. |
| not_a_member    | any                | No               | Contact only (no membership privileges). |
| unknown         | any                | No (default)     | Data incomplete; treat as contact until resolved. |

SBNC lifecycle rules (business rules)
1) Joiner sequence (tier)
- New joiners receive Newbie Member for 90 days.
- After 90 days, Newbie Member transitions to Member until the 2-year mark.

2) Two-year decision point (tier + payment)
- At the 2-year mark, Extended Member requires offer + acceptance + payment.
- If not offered or not accepted or not paid, membership ends.

3) New rule: when membership ends, status becomes lapsed
- When membership ends due to end of Member tier time OR end of Extended Member tier time:
  - MembershipStatus transitions to lapsed.
  - MembershipTier may remain as the last known tier for history, but "treat as member" becomes No.

Wild Apricot membership level mapping (import)
- WA Level: ExtendedNewcomer -> Murmurant Tier: extended_member
- WA Level: NewbieNewcomer  -> Murmurant Tier: newbie_member
- WA Level: NewcomerMember  -> Murmurant Tier: member
- WA Level: Admins          -> Murmurant Tier: unknown (Admins is a role concept, not a membership tier)
- Missing/unknown WA level  -> Murmurant Tier: unknown + warning for admin review

Open policy items (to confirm)
- Definition of "2 years" (730 days vs calendar years).
- Grace period after offer (if any).
- Whether Extended Member has a fixed end date or is renewable.
- Whether pending_renewal is treated as member for privileges.
