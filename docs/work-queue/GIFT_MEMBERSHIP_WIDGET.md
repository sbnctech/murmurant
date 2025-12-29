Gift Membership Widget + Workflow

Goal
Enable a non-member (e.g., a real estate agent) to purchase a "Gift Membership" for a recipient new to the area.
Recipient receives an email and/or SMS with a link to complete a pre-paid membership application.
Agent receives confirmation when the recipient completes the application.
Agent can print a polished gift certificate (PDF) to hand to the recipient.

Primary users
1) Gift Purchaser (Agent)
- Not a member, not a contact in Murmurant
- Needs fast checkout and professional-looking certificate
2) Recipient (New resident)
- Needs a warm, welcoming, simple onboarding experience
3) Admin/VP Membership
- Needs visibility into gift pipeline, completion status, and exceptions

Core experience (v1)
A) Agent flow (public website)
1. Gift Membership landing page
   - Explains gift concept, what is included, how redemption works
2. Purchase form (minimal friction)
   - Purchaser name, email, phone (optional)
   - Brokerage/company (optional)
   - Recipient name, recipient email, recipient phone (optional)
   - Message to recipient (optional)
   - Choose tier: default Newbie Member gift (or configurable)
   - Consent + privacy disclosures
3. Payment
   - Creates GiftOrder + GiftToken
4. Confirmation
   - Shows success + "Print certificate" + "Send gift link now" (email/SMS)
   - Also emails purchaser a receipt and a copy/link to certificate

B) Recipient flow (redeem + apply)
1. Recipient receives email/SMS with "Redeem Gift Membership" link
2. Redeem page
   - Shows gift details (purchaser name optionally, custom message)
   - Confirms membership is prepaid
3. Pre-paid Membership Application (special UI)
   - Prefills whatever the agent provided
   - Requires recipient to complete required membership fields
   - Submit -> creates MembershipApplication linked to GiftOrder
4. Completion page
   - Next steps, welcome messaging, support contact

C) Agent notifications
- When recipient completes application:
  - Email agent "Your client completed their gift membership application"
  - Optional SMS agent (phase 2)
- Optional reminders if not redeemed after N days (phase 2)

D) Certificate (printable PDF)
- Professional, well-formatted gift certificate PDF
- Includes:
  - Recipient name (if provided)
  - Gifted tier (e.g., Newbie Member)
  - Redemption URL and short code
  - Expiration policy (or "no expiration" if chosen)
  - SBNC branding + contact info
  - Agent name/company (if provided)
- Should be generated server-side and stored via file storage system
- Also provide a browser print view (HTML) for quick printing

Membership tier rule (SBNC)
- Gift Membership purchases should map to the tier granted at redemption time.
- New joiners receive Newbie Member for 90 days, then Member until 2-year mark.
- At 2 years, Extended Member requires offer + acceptance + payment; otherwise membership ceases.

Data model (draft)
- GiftOrder
  - id, status: created | paid | redeemed | completed | cancelled | expired
  - purchaserName, purchaserEmail, purchaserPhone?, purchaserCompany?
  - recipientName?, recipientEmail?, recipientPhone?
  - giftMessage?
  - membershipTierCode (e.g., newbie_member)
  - amountPaid, currency, paymentProvider, paymentRef
  - createdAt, paidAt, redeemedAt, completedAt
- GiftToken
  - id, token (opaque), orderId
  - expiresAt (optional)
  - redeemedAt, redemptionCount (should be 0/1 in v1)
- GiftCertificate
  - id, orderId, fileId (stored PDF), generatedAt
- Linkages
  - GiftOrder -> MembershipApplication (once submitted)
  - GiftOrder -> Member (once approved/converted)

Security + abuse prevention
- Token must be unguessable (long random)
- Redemption link should not expose sensitive purchaser info unless explicitly allowed
- Rate limit token lookup and SMS/email sends
- Prevent multiple redemptions per token (v1)
- Audit log for key actions: paid, sent, redeemed, submitted, approved

Email/SMS requirements (v1/v2)
v1 (minimum)
- Email recipient gift link
- Email purchaser receipt + certificate link
- Email purchaser completion notice
v2 (optional)
- SMS recipient gift link
- SMS purchaser completion notice
- Reminder cadences with opt-out

Admin workflow (v1)
- Admin view: gift orders list + statuses
- Filters: paid, unredeemed, redeemed-not-submitted, submitted-awaiting-review, completed
- Ability to resend recipient link
- Ability to regenerate certificate
- Manual override: mark cancelled/refunded (integration dependent)

Open questions (later)
- Should gift always be a specific tier (Newbie) or selectable?
- Expiration policy (none vs 6/12 months)
- Does gift automatically approve membership, or still requires committee approval?
- Payment provider choice and refund handling
- SMS provider choice and opt-in compliance

Acceptance criteria (for later implementation)
- End-to-end: agent purchases -> recipient redeems -> application submitted -> agent notified
- Certificate PDF generated, printable, and matches SBNC brand
- All key events audited
