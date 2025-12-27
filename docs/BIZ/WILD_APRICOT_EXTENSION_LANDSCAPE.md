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

## Wild Apricot Integration Taxonomy

Wild Apricot integrations fall into three categories:

### WA Native Integrations

Built into the WA platform or available through WA's marketplace.

| Integration | What It Does | Admin Pain Points |
|-------------|--------------|-------------------|
| WA Payments (internal) | Collects dues and event fees via WA's payment processor | High fees, limited reporting, no recurring without workarounds |
| WA Email (internal) | Sends newsletters and announcements | Poor deliverability, limited templates, no A/B testing |
| WA Member Directory | Displays member info on site | Limited customization, privacy controls confusing |
| WA Event Calendar | Displays events on site | Cannot filter by activity, styling limited |
| WA Forms | Collects custom data | No conditional logic, data scattered across tables |

**Risk profile:** These "just work" but admins cannot modify or extend them. When WA changes behavior, admins have no recourse.

### Third-Party Platforms (Zapier, Make, etc.)

Automation platforms that connect WA to external services via WA's API triggers.

| Platform | Common Use Cases | Admin Pain Points |
|----------|-----------------|-------------------|
| Zapier | New member -> Mailchimp, Registration -> Google Sheets | Per-task pricing, debugging is opaque, triggers can miss events |
| Make (Integromat) | Complex workflows with branching logic | Steeper learning curve, EU data residency concerns |
| Power Automate | Microsoft-centric shops (Teams, SharePoint) | Requires M365 license, limited WA connector |

**Risk profile:** Admins build these themselves but rarely document them. When the admin leaves, the workflow breaks and nobody knows how to fix it. Trigger reliability varies.

### DIY Integrations (API, Webhooks, Scripts)

Custom code written by tech-savvy volunteers or contractors.

| Approach | Common Use Cases | Admin Pain Points |
|----------|-----------------|-------------------|
| WA API polling | Nightly sync to external database, custom reports | Requires developer, no webhook = must poll, rate limits |
| Manual CSV exports | Monthly treasurer report, mail merge for invitations | Tedious, error-prone, columns change without notice |
| ICS feed consumption | Subscribe in Google Calendar | WA ICS has timezone bugs, recurring events unreliable |
| Custom scripts | Board eligibility checks, dues reconciliation | Undocumented, breaks when WA changes, bus factor of 1 |

**Risk profile:** Highest. When the volunteer who built it graduates or loses interest, the integration becomes unmaintainable.

---

## Typical Club Use Cases

These are the integration needs we hear most often:

| Use Case | Current WA Approach | Pain Points |
|----------|---------------------|-------------|
| **Collect dues online** | WA Payments or PayPal | High fees, poor recurring, confusing member experience |
| **Sync members to Mailchimp** | Zapier or manual export | Zapier costs add up, manual is tedious, unsubscribes diverge |
| **Calendar in Google/Outlook** | ICS feed subscription | Timezone bugs, events appear on wrong day, no activity filtering |
| **Treasurer's monthly report** | CSV export + Excel | Column order changes, dates format differently, manual cleanup |
| **Event reminder emails** | WA built-in or Mailchimp | WA delivery unreliable, Mailchimp requires sync |
| **Check-in at events** | Print attendee list or third-party app | No real-time updates, QR codes extra cost |
| **Board eligibility tracking** | Manual spreadsheet | Error-prone, nobody audits, disputes at election time |
| **New member welcome flow** | Zapier -> email sequence | Trigger misses sometimes, hard to debug, volunteer dependency |

---

## ClubOS Positioning: Equivalent / Non-Goal / Later

| WA Capability | ClubOS v1 | Rationale |
|---------------|-----------|-----------|
| Online payments (dues, events) | **Equivalent** (Native Stripe) | Core capability, cannot migrate without it |
| ICS calendar feeds | **Equivalent** (RFC 5545 compliant) | Day-one member expectation |
| Member/event/registration CSV | **Equivalent** (Stable schemas) | Treasurer and event chair workflows |
| Webhook event stream | **Equivalent** (Design spec below) | Enables Zapier/Make without custom code |
| Transactional email | **Equivalent** (Native) | Confirmations and reminders expected |
| Newsletter/marketing email | **Non-goal** | Mailchimp/Constant Contact do this better |
| SMS messaging | **Non-goal** | TCPA compliance burden, low demand |
| Form builder | **Non-goal** | Google Forms/Typeform/JotForm exist |
| Direct Mailchimp sync | **Later** (v2) | Webhook covers 80% of need |
| Direct Salesforce sync | **Later** (v2+) | Niche need, Zapier bridge works |
| Scheduled exports | **Later** (v2) | Manual download acceptable initially |
| Calendar widget (embed) | **Later** (v1.1) | Link to ClubOS page is acceptable workaround |

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

This section translates the extension landscape into a prioritized roadmap.

### P0: Must-Have for Migration

| Integration | Customer Goal | Approach | If Missing |
|-------------|---------------|----------|------------|
| **Payment collection** | "We need to collect dues online" | Native (Stripe) | Cannot operate. Migration impossible. |
| **Calendar feeds** | "Members subscribe in Google/Outlook" | Export (ICS) | Members lose calendar sync. High friction. |
| **Webhook events** | "Our Zapier adds new members to Mailchimp" | Webhook | Automation-dependent orgs will not migrate. |
| **Member export** | "Treasurer downloads the member list" | Export (CSV) | Board will block migration. |

**P0 commitment:** These four must work before any production migration.

---

### P1: High Value, Common Need

| Integration | Customer Goal | Approach | If Missing |
|-------------|---------------|----------|------------|
| **Transaction export** | "Import payments into QuickBooks" | Export (CSV) | Treasurer re-keys manually. |
| **Activity calendar feeds** | "Hiking group wants their own feed" | Export (ICS) | Activity chairs complain. |
| **Transactional email** | "Send confirmation on registration" | Native | Members feel ignored. |
| **Unsubscribe handling** | "Members need to opt out" | Native | Compliance risk. |
| **Registration export** | "Event chair needs attendee list" | Export (CSV) | Unprofessional check-in. |

**P1 commitment:** Deliver within first quarter post-launch.

---

### P2: Nice-to-Have

| Integration | Customer Goal | Approach | If Missing |
|-------------|---------------|----------|------------|
| **Calendar widget** | "Show calendar on WordPress" | Embed (iframe) | Link to ClubOS instead. |
| **Registration form embed** | "Sign up from main website" | Embed (iframe) | Link to ClubOS. |
| **Public event feed** | "Webmaster wants JSON" | Export (JSON) | Use ICS feed. |
| **Mailchimp sync** | "Auto-update mailing list" | Webhook | Manual export/import. |
| **Scheduled exports** | "Email me list every Monday" | Export (scheduled) | Manual download. |

**P2 commitment:** Build as capacity allows.

---

### Non-Goals (v1)

| Integration | Why Non-Goal | Workaround |
|-------------|--------------|------------|
| **SMS messaging** | TCPA compliance, cost | Use Twilio/EZTexting directly |
| **Form builder** | Deep product | Use Google Forms/Typeform |
| **Direct CRM integration** | Niche need | Use Zapier as bridge |

---

## Minimum Viable Integration Surface

This section specifies the technical contracts external systems can rely on.

### 1. Exports: CSV/JSON Stable Schemas

**Members Export (CSV)**

| Column | Type | Description |
|--------|------|-------------|
| id | string | ClubOS member ID (stable, unique) |
| email | string | Primary email address |
| first_name | string | First name |
| last_name | string | Last name |
| status | enum | `active`, `lapsed`, `pending`, `alumni` |
| tier | string | Membership tier name |
| joined_at | ISO 8601 | Join date (UTC) |
| expires_at | ISO 8601 | Expiration date (UTC), null if lifetime |

**Events Export (CSV)**

| Column | Type | Description |
|--------|------|-------------|
| id | string | ClubOS event ID (stable, unique) |
| title | string | Event title |
| starts_at | ISO 8601 | Start time (UTC instant) |
| ends_at | ISO 8601 | End time (UTC instant) |
| timezone | IANA tzid | Display timezone (e.g., `America/Los_Angeles`) |
| status | enum | `draft`, `published`, `cancelled`, `archived` |

**Registrations Export (CSV)**

| Column | Type | Description |
|--------|------|-------------|
| id | string | Registration ID (stable, unique) |
| event_id | string | Associated event ID |
| member_id | string | Associated member ID |
| status | enum | `registered`, `waitlisted`, `cancelled`, `attended` |
| guests | integer | Guest count |

**Transactions Export (CSV)**

| Column | Type | Description |
|--------|------|-------------|
| id | string | Transaction ID (stable, unique) |
| member_id | string | Associated member ID |
| type | enum | `dues`, `registration`, `donation`, `refund` |
| amount | decimal | Amount (negative for refunds) |
| created_at | ISO 8601 | Transaction timestamp (UTC) |

**Schema stability guarantee:** Column names and types are stable within a major version. New columns may be added at the end.

### 2. Webhooks / Event Stream (Design Only)

**Event Types**

| Event | Trigger | Payload Includes |
|-------|---------|------------------|
| `member.created` | New member joins | member object |
| `member.renewed` | Membership renewed | member object |
| `member.lapsed` | Membership expired | member object |
| `event.published` | Event published | event object |
| `registration.created` | Member registers | registration, event |
| `payment.completed` | Payment processed | transaction, member |

**Delivery Contract**

- **Format:** JSON payload over HTTPS POST
- **Authentication:** HMAC-SHA256 signature in `X-ClubOS-Signature` header
- **Retry policy:** Exponential backoff (1s, 5s, 30s, 5m, 1h)
- **Idempotency:** Each event includes unique `event_id`
- **Replay:** `/webhooks/replay` endpoint for recovery

**Note:** Webhook implementation is design-only. Code implementation follows separately.

### 3. ICS Calendar Feeds

**Feed Endpoints**

| Endpoint | Description |
|----------|-------------|
| `/calendar/public.ics` | All published public events |
| `/calendar/activity/{slug}.ics` | Events for a specific activity |
| `/calendar/member/{token}.ics` | Personalized feed (token-authenticated) |

**ICS Compliance (per CALENDAR_INTEROP_GUIDE.md)**

- **VTIMEZONE:** Every feed includes full VTIMEZONE component with IANA tzid
- **DTSTART/DTEND:** Timed events use `DTSTART;TZID=America/Los_Angeles:YYYYMMDDTHHMMSS`
- **All-day events:** Use `DTSTART;VALUE=DATE:YYYYMMDD`
- **UID stability:** Format: `event-{id}@clubos.example.com`
- **DTSTAMP:** Always in UTC

**What this means for users:**

- Events appear at correct local time regardless of subscriber's timezone
- DST transitions are handled correctly
- Calendar clients receive updates when events change

**Feed URL stability guarantee:** Feed URLs do not change.

---

## Integration Deep Dives

This section provides detailed analysis of each major integration category.

### Deep Dive: Automation Platforms (Zapier / Make / Power Automate)

#### What Clubs Are Trying to Do

| Trigger | Action | Why |
|---------|--------|-----|
| New member joins | Add to Mailchimp list | Welcome email sequence |
| Member renews | Update CRM record | Donor tracking |
| Member lapses | Send to follow-up sequence | Win-back campaign |
| Event created | Post to Slack channel | Staff awareness |
| Registration received | Add row to Google Sheet | Check-in roster |
| Payment completed | Create QuickBooks entry | Financial tracking |

#### Data Dependencies

| Automation Type | Data Required | Frequency |
|-----------------|---------------|-----------|
| Member sync | Member object (email, name, status, tier, dates) | Real-time |
| Event notifications | Event object (title, dates, location) | On publish |
| Registration sync | Registration + member + event | Real-time |
| Payment tracking | Transaction + member | Real-time |

#### What ClubOS Must Provide

- **P0:** Webhook events (`member.created`, `member.renewed`, `member.lapsed`, `registration.created`, `payment.completed`)
- **P0:** HMAC-signed payloads, retry with backoff, event replay
- **P1:** Zapier app in marketplace
- **P2:** Native Make module, two-way sync

---

### Deep Dive: Spreadsheet Sync (Google Sheets / Excel)

#### What Clubs Are Trying to Do

| Use Case | Who | Frequency |
|----------|-----|-----------|
| Dues reconciliation | Treasurer | Monthly |
| Event check-in roster | Event chair | Per event |
| Activity roster | Activity chair | Ad-hoc |
| Board eligibility audit | Governance | Annually |
| Mail merge | Comms volunteer | Occasional |

#### Data Dependencies

| Export Type | Columns Needed |
|-------------|----------------|
| Member list | ID, name, email, status, tier, join date, expiry |
| Event registrations | Member info, event, status, guests, payment |
| Transaction history | Date, amount, type, member, description |

#### What ClubOS Must Provide

- **P0:** CSV export for members, registrations
- **P0:** Stable column schema, ISO 8601 dates
- **P1:** CSV export for transactions, activity rosters, filterable exports
- **P2:** Scheduled exports, XLSX format

---

### Deep Dive: Calendar Subscriptions (ICS Feeds)

#### What Clubs Are Trying to Do

| Subscriber | Calendar App | Why |
|------------|--------------|-----|
| Members | Google Calendar | See events alongside personal schedule |
| Activity participants | Apple Calendar | Get reminders for activity events |
| Board members | Outlook | Block time for board meetings |
| Webmaster | External site | Display events on WordPress |

#### Data Dependencies

| Feed Type | Events Included | Access |
|-----------|-----------------|--------|
| Public feed | All published public events | Anonymous |
| Activity feed | Events for specific activity | Anonymous |
| Personal feed | Events member is registered for | Token-auth |

#### What ClubOS Must Provide

- **P0:** ICS feed for all public events, VTIMEZONE with IANA tzid, stable UIDs
- **P1:** Per-activity feeds, personal feeds
- **P2:** Calendar widget embed, JSON event feed

---

### Deep Dive: Email Marketing (Mailchimp / Constant Contact)

#### What Clubs Are Trying to Do

| Purpose | Tool | Why Not WA Email? |
|---------|------|-------------------|
| Monthly newsletter | Mailchimp | Better templates, analytics |
| Event announcements | Constant Contact | Higher deliverability |
| Renewal reminders | Email platform | Automated sequences |
| Welcome series | Mailchimp | Drip campaigns |

#### Data Dependencies

| Sync Type | Data Required | Frequency |
|-----------|---------------|-----------|
| Full list sync | All members: email, name, status, tier | Weekly |
| New member add | Member object | Real-time |
| Unsubscribe sync | Unsubscribe events | Real-time (critical) |

#### What ClubOS Must Provide

- **P0:** CSV export with email/status/tier, `member.created` webhook, native unsubscribe handling
- **P1:** `member.updated` webhook, segment exports
- **P2:** Native Mailchimp integration, two-way unsubscribe sync

---

### Deep Dive: Payment/Financial Reporting

#### What Clubs Are Trying to Do

| Task | Data Needed | Destination |
|------|-------------|-------------|
| Monthly close | All transactions | QuickBooks/Xero |
| Dues reconciliation | Dues payments vs. deposits | Spreadsheet |
| Event revenue | Registration fees by event | Board packet |
| Tax prep (990) | Revenue categories | Accountant |

#### What ClubOS Must Provide

- **P0:** Transaction CSV (date, amount, type, member), date filtering, refunds as negative
- **P1:** QuickBooks-compatible format, per-event summary
- **P2:** Direct QuickBooks integration, automated exports

---

## Integration Contract: Webhooks + Exports First

**Confirmed approach for ClubOS v1:**

ClubOS provides integrations via webhooks and exports rather than native connectors.

| Approach | Pros | Cons |
|----------|------|------|
| Native integrations | Best UX | Must build and maintain each |
| Webhooks + exports | Universal, low maintenance | Requires Zapier for glue |
| Public API only | Maximum flexibility | Requires developer |

**Decision:** Webhooks + exports for v1, native integrations for v2+

### What This Means for Migration

| Integration | v1 Approach | How Customer Connects |
|-------------|-------------|----------------------|
| Mailchimp | Webhook + CSV | Zapier or manual import |
| Google Sheets | CSV export | Manual download or Zapier |
| Slack | Webhook | Zapier |
| QuickBooks | CSV export | Manual import |
| Calendar apps | ICS feed | Native subscription |

---

## Discovery Questions for Intake Calls

Copy this section for intake calls.

### Automation Questions

1. **Do you use Zapier, Make, or Power Automate?** What workflows? Who set them up?

2. **When someone joins, what happens automatically?** Added to email list? Posted to Slack?

3. **If automations stopped, what would break?** Critical vs. nice-to-have?

### Spreadsheet Questions

4. **Who exports data regularly?** Treasurer, event chairs, activity leaders?

5. **What do they export, and where does it go?** Member list → Sheets? Registrations → Excel?

6. **What columns and format do they need?**

### Calendar Questions

7. **Do members subscribe to your calendar?** How many? One calendar or per-activity?

8. **Issues with wrong times or duplicates?**

### Email Questions

9. **How do you send email to members?** WA built-in or Mailchimp/Constant Contact?

10. **How does the list stay synchronized?** Manual export? Zapier?

11. **What happens when someone unsubscribes?**

### Financial Questions

12. **What accounting software do you use?**

13. **How does payment data get there?**

14. **Walk me through month-end close.**

### Summary Questions

15. **Which integrations are must-haves for day one?**

16. **Who maintains these? What if they're unavailable?**

## Migration Intake Checklist

During policy capture, ask the customer:

1. What automations do you have connected to Wild Apricot?
2. What external systems receive data from WA?
3. Do members subscribe to a calendar feed?
4. What payment methods do you accept?
5. Do you embed WA widgets on external websites?

---

## Related Documents

- [Non-Goals and Exclusions](./NON_GOALS_AND_EXCLUSIONS.md)
- [Calendar Interoperability Guide](../ARCH/CALENDAR_INTEROP_GUIDE.md)
- [Implementation Backlog](./IMPLEMENTATION_BACKLOG.md)

---

## Revision History

| Date | Change |
|------|--------|
| 2025-12-26 | Add Integration Deep Dives, Integration Contract, Discovery Questions |
| 2025-12-26 | Add Minimum Viable Integration Surface (export schemas, webhook design, ICS spec) |
| 2025-12-26 | Add WA Integration Taxonomy, Typical Club Use Cases, ClubOS Positioning table |
| 2025-12-26 | Add ClubOS Integration Roadmap (P0/P1/P2 tiers) |
| 2025-12-26 | Initial extension landscape |

---

_This document reflects publicly available information about Wild Apricot integrations and common membership organization needs._
