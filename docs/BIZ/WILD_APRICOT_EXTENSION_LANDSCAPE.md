# Wild Apricot Extension Landscape

```
Audience: Product, Engineering, Board
Purpose: Map WA integrations to ClubOS requirements for roadmap planning
Classification: Strategy Document
```

---

## Overview

Wild Apricot customers rely on third-party integrations and extensions to fill gaps in the core platform. Before migration, ClubOS must understand what these integrations accomplish and decide how to address each category.

This document catalogs the major integration categories, what customers use them for, and what ClubOS should provide.

---

## Integration Categories

### 1. Automation Platforms (Zapier, Make, Power Automate)

**What customers are trying to achieve:**

- Trigger actions when members join, renew, or lapse
- Sync member data to external CRMs (Salesforce, HubSpot)
- Post notifications to Slack or Teams when events are created
- Add registrants to mailing list segments in Mailchimp
- Create tasks in project management tools when volunteers sign up

**ClubOS positioning: Via webhook**

Organizations expect to connect ClubOS to their existing automation workflows. ClubOS does not need to build native integrations to every downstream system. A webhook/event stream lets automation platforms handle the glue.

**Minimum technical requirements:**

- Webhook endpoints for key lifecycle events:
  - `member.created`, `member.renewed`, `member.lapsed`
  - `event.published`, `event.cancelled`
  - `registration.created`, `registration.cancelled`, `registration.paid`
- Signed payloads (HMAC) for verification
- Retry with exponential backoff on delivery failure
- Event replay endpoint for recovery
- Stable payload schema with versioning

**Migration risk if missing: High**

Organizations with established Zapier workflows will not migrate until they can reconnect their automations. This is a blocking requirement for many mid-size clubs.

---

### 2. Spreadsheet Sync (Google Sheets, Excel Online)

**What customers are trying to achieve:**

- Board treasurer exports member list monthly for dues tracking
- Event chairs pull registration lists for check-in sheets
- Volunteers maintain activity rosters in familiar spreadsheet format
- Finance committee reconciles membership revenue against bank statements

**ClubOS positioning: Via export**

Spreadsheet sync is primarily a data extraction need. ClubOS provides clean exports; organizations import them into their preferred tools.

**Minimum technical requirements:**

- CSV/XLSX export for members, events, registrations, activities
- Timezone-safe date formatting (ISO 8601 or explicit timezone)
- Stable column schema (documented, versioned)
- Filterable exports (by date range, tier, status)
- Scheduled export option (future consideration)

**Migration risk if missing: Medium**

Most organizations can adapt to periodic exports. However, clubs with complex financial reporting may delay migration if export formats do not match their existing workflows.

---

### 3. Email Marketing (Mailchimp, Constant Contact, SendGrid)

**What customers are trying to achieve:**

- Send newsletters to all active members
- Target renewal reminders to members expiring soon
- Announce events to activity group subscribers
- Maintain suppression lists for unsubscribes

**ClubOS positioning: Native + via webhook**

ClubOS should handle transactional email (confirmations, reminders) natively. Marketing email campaigns are better handled by dedicated platforms. ClubOS provides the audience segments; marketing platforms send the campaigns.

**Minimum technical requirements:**

- Native: Transactional email delivery (SMTP or API-based)
- Native: Unsubscribe handling with audit trail
- Webhook: `member.created`, `member.updated` for list sync
- Export: Audience segments as CSV for manual import
- Future: Direct Mailchimp/Constant Contact segment sync (API integration)

**Migration risk if missing: Medium**

Organizations can manually export and import lists. But clubs with sophisticated email automation will want webhook-based sync to avoid manual steps.

---

### 4. SMS and Text Messaging (Twilio, EZTexting)

**What customers are trying to achieve:**

- Send event reminders to registered attendees
- Alert activity chairs about last-minute changes
- Reach members who do not check email

**ClubOS positioning: Non-goal (v1)**

SMS requires per-message costs, carrier compliance (TCPA), and opt-in management. This is significant scope for modest benefit in the target customer segment.

**Minimum technical requirements (if reconsidered):**

- Phone number storage with consent flag
- Webhook events for SMS platform triggers
- Opt-out handling

**Migration risk if missing: Low**

Most WA organizations do not use SMS. Those that do typically use standalone SMS platforms and can continue doing so.

---

### 5. Accounting (QuickBooks, Xero, Wave)

**What customers are trying to achieve:**

- Record membership dues as revenue
- Categorize income by membership tier
- Reconcile event registration fees with deposits
- Generate financial reports for board meetings

**ClubOS positioning: Via export**

Accounting systems are specialized. ClubOS should not attempt to replicate double-entry bookkeeping. Instead, provide clean transaction exports that accountants can import.

**Minimum technical requirements:**

- Transaction export with:
  - Date, amount, description, category
  - Member reference (optional, for matching)
  - Payment method
- CSV format compatible with QBO import
- Date range filtering
- Stable schema

**Migration risk if missing: Medium**

Treasurers need to close books. If ClubOS cannot produce an importable transaction list, treasurers must manually re-key data. This creates friction but is not a blocker.

---

### 6. Calendar Sync (Google Calendar, Outlook, Apple Calendar)

**What customers are trying to achieve:**

- Subscribe to club calendar in personal calendar app
- See upcoming events alongside personal appointments
- Get reminders from their preferred calendar system
- Share activity-specific calendars with group members

**ClubOS positioning: Via export (ICS feeds)**

Calendar sync is a solved problem: ICS feeds. ClubOS publishes standard ICS endpoints; calendar apps subscribe.

**Minimum technical requirements:**

- ICS feed for all public events
- ICS feed per activity (filtered)
- Proper VTIMEZONE with IANA tzid (no floating times)
- Stable UID generation for event identity
- SEQUENCE increment on event updates
- Feed URL stability (no breaking changes)

**Migration risk if missing: High**

Calendar sync is a core expectation. Organizations will not cutover if members lose their calendar subscriptions. This is a day-one requirement.

---

### 7. Forms and Surveys (Google Forms, Typeform, JotForm)

**What customers are trying to achieve:**

- Collect volunteer interest forms
- Run post-event satisfaction surveys
- Gather new member application data
- Process special requests (scholarship applications, board nominations)

**ClubOS positioning: Non-goal (v1)**

Form builders are deep products. ClubOS should not compete with Typeform. Instead, allow external forms to submit data via API or embed safely.

**Minimum technical requirements:**

- API endpoint to accept form submissions (future)
- Safe embed allowlist for trusted form domains
- Documentation for form-to-ClubOS data flow patterns

**Migration risk if missing: Low**

Organizations already use external form tools with WA. They can continue using them with ClubOS. The main requirement is that ClubOS does not block embedding.

---

### 8. Payment Processing (Stripe, PayPal, Square)

**What customers are trying to achieve:**

- Collect membership dues online
- Accept event registration fees
- Process donations
- Offer recurring payment plans

**ClubOS positioning: Native (Stripe)**

Payment processing is core to membership management. ClubOS should handle this natively with a single, well-supported payment provider.

**Minimum technical requirements:**

- Stripe integration for:
  - One-time payments (dues, registration fees)
  - Recurring subscriptions (membership plans)
  - Refund processing with audit trail
- PCI compliance via Stripe Elements (no raw card handling)
- Webhook handling for payment events
- Transaction records with clear status

**Migration risk if missing: Critical**

Organizations cannot migrate if they cannot collect dues. Payment processing is a hard requirement for go-live.

---

### 9. Website Widgets and Embeds

**What customers are trying to achieve:**

- Embed event calendar on external website
- Show membership signup form on landing page
- Display member count or activity roster
- Integrate with WordPress, Squarespace, Wix

**ClubOS positioning: Via export + embed**

ClubOS is not a website builder. But organizations need to display ClubOS data on their existing sites.

**Minimum technical requirements:**

- Embeddable calendar widget (iframe or JS)
- Public event feed (JSON or ICS)
- Embeddable registration form (iframe)
- CORS-safe public API endpoints for read-only data
- Documentation for common CMS integrations

**Migration risk if missing: Medium**

Organizations with heavily customized WA widget integrations will need to rebuild. This is expected and accepted, but ClubOS should provide equivalent primitives.

---

## Summary Matrix

| Category | ClubOS Approach | Priority | Migration Risk |
|----------|-----------------|----------|----------------|
| Automation (Zapier/Make) | Via webhook | High | High |
| Spreadsheet sync | Via export | Medium | Medium |
| Email marketing | Native + webhook | Medium | Medium |
| SMS/Text | Non-goal (v1) | Low | Low |
| Accounting | Via export | Medium | Medium |
| Calendar sync | Via export (ICS) | High | High |
| Forms/Surveys | Non-goal (v1) | Low | Low |
| Payment processing | Native (Stripe) | Critical | Critical |
| Website widgets | Via export + embed | Medium | Medium |

---

## ClubOS Integration Roadmap

This section translates the extension landscape into a prioritized roadmap. Each tier reflects migration impact: what must exist before customers can switch.

### P0: Must-Have for Migration

These capabilities block migration. Without them, organizations cannot operate.

| Integration | Customer Goal | Approach | If Missing |
|-------------|---------------|----------|------------|
| **Payment collection** | "We need to collect dues and event fees online" | Native (Stripe) | Cannot operate. Migration impossible. |
| **Calendar feeds** | "Members subscribe to our calendar in Google/Outlook" | Export (ICS) | Members lose calendar sync. High friction, many complaints. |
| **Webhook events** | "When someone joins, our Zapier flow adds them to Mailchimp" | Webhook | Automation-dependent orgs will not migrate. Blocks mid-size clubs. |
| **Member export** | "Our treasurer downloads the member list monthly" | Export (CSV) | Treasurer cannot reconcile. Board will block migration. |

**P0 commitment:** These four must work before any production migration.

---

### P1: High Value, Common Need

These capabilities are expected soon after cutover. Missing them creates friction but does not block operations.

| Integration | Customer Goal | Approach | If Missing |
|-------------|---------------|----------|------------|
| **Transaction export** | "I need to import dues payments into QuickBooks" | Export (CSV) | Treasurer re-keys data manually. Time-consuming, error-prone. |
| **Activity calendar feeds** | "Our hiking group wants their own calendar feed" | Export (ICS) | Activity chairs create manual workarounds. Complaints. |
| **Transactional email** | "Send confirmation when someone registers" | Native | Members feel ignored. Support burden increases. |
| **Unsubscribe handling** | "Members need to opt out of emails" | Native | Compliance risk. Spam complaints. |
| **Registration export** | "Event chair needs attendee list for check-in" | Export (CSV) | Chair uses screenshots or manual lists. Unprofessional. |

**P1 commitment:** Deliver within first quarter post-launch.

---

### P2: Nice-to-Have

These are conveniences. Organizations can work around them indefinitely.

| Integration | Customer Goal | Approach | If Missing |
|-------------|---------------|----------|------------|
| **Calendar widget** | "Show our calendar on our WordPress site" | Embed (iframe) | Org links to ClubOS calendar page instead. Minor friction. |
| **Registration form embed** | "Let people sign up from our main website" | Embed (iframe) | Org links to ClubOS registration page. Acceptable. |
| **Public event feed** | "Our webmaster wants JSON for a custom display" | Export (JSON) | Use ICS feed or link to ClubOS. Workaround exists. |
| **Mailchimp sync** | "Automatically update our mailing list segments" | Webhook | Manual export/import. Extra steps but manageable. |
| **Scheduled exports** | "Email me the member list every Monday" | Export (scheduled) | Manual download. Slight inconvenience. |

**P2 commitment:** Build as capacity allows. Not required for successful migrations.

---

### Non-Goals (v1)

These are explicitly out of scope. Organizations must continue using external tools.

| Integration | Customer Goal | Why Non-Goal | Workaround |
|-------------|---------------|--------------|------------|
| **SMS messaging** | "Text reminders to members" | TCPA compliance, per-message cost, modest demand | Continue using Twilio/EZTexting directly |
| **Form builder** | "Custom application forms" | Deep product; strong external options exist | Use Google Forms, Typeform, JotForm |
| **Direct CRM integration** | "Sync members to Salesforce without Zapier" | Niche need; webhook covers most cases | Use Zapier/Make as bridge |

**Non-goal rationale:** These add significant scope for limited migration impact. External tools handle them well.

---

## Technical Requirements Summary

### Required for v1 (blocking migration)

1. **Webhook event stream**
   - Core lifecycle events with signed delivery
   - Retry and replay capability

2. **ICS calendar feeds**
   - Proper timezone handling (VTIMEZONE with IANA tzid)
   - Per-activity filtered feeds

3. **Stripe payment integration**
   - One-time and recurring payments
   - Refund handling

4. **Clean data exports**
   - Members, events, registrations, transactions
   - CSV with stable schema

### Required for v1 (non-blocking but expected)

5. **Embeddable widgets**
   - Calendar widget
   - Registration form embed

6. **Transactional email**
   - Confirmation and reminder delivery
   - Unsubscribe handling

### Deferred (v2 or later)

7. **Direct CRM integrations** (Mailchimp, Salesforce)
8. **Scheduled exports**
9. **SMS support**
10. **Form submission API**

---

## Migration Intake Checklist

During policy capture, ask the customer:

1. What automations do you have connected to Wild Apricot?
   - Zapier zaps, Make scenarios, Power Automate flows

2. What external systems receive data from WA?
   - CRM, accounting, email marketing, project management

3. Do members subscribe to a calendar feed?
   - How many subscribers? Which calendar apps?

4. What payment methods do you accept?
   - Online only? Check? Which processor?

5. Do you embed WA widgets on external websites?
   - Which widgets? On which platforms?

Answers inform migration timing and which ClubOS features must be ready before cutover.

---

## Related Documents

- [Non-Goals and Exclusions](./NON_GOALS_AND_EXCLUSIONS.md) - What ClubOS explicitly does not do
- [Migration Risk Register](./MIGRATION_RISK_REGISTER.md) - Risk assessment for migration
- [Implementation Backlog](./IMPLEMENTATION_BACKLOG.md) - Technical requirements backlog

---

## Revision History

| Date | Change |
|------|--------|
| 2025-12-26 | Add ClubOS Integration Roadmap (P0/P1/P2 tiers) |
| 2025-12-26 | Initial extension landscape |

---

_This document reflects publicly available information about Wild Apricot integrations and common membership organization needs._
