# Automation Compatibility: Wild Apricot to Murmurant

```
Audience: Operators, Migration Coordinators, Product
Purpose: Map WA automation patterns to Murmurant equivalents
Classification: Migration Documentation
```

---

## Overview

This document inventories automation and integration patterns used with Wild Apricot and maps them to Murmurant equivalents. For each pattern, we specify:

- What it is and how WA customers use it
- Murmurant v1 equivalent (if any)
- Planned v2 support (if applicable)
- Explicit non-goals
- Migration risks and operator expectations

**Scope**: Zapier, Make/Integromat, Google Sheets exports, ICS calendar feeds, email exports and notifications.

---

## Assumptions

The following assumptions inform this document:

1. **WA API access**: We assume publicly documented WA API behavior. We do not have access to private WA documentation or internal trigger mechanisms.

2. **Webhook semantics**: Where webhook behavior is specified, we document what Murmurant intends to provide. Exact delivery guarantees (at-least-once vs exactly-once) are stated where known; ambiguities are flagged.

3. **Automation platform behavior**: Zapier and Make behaviors are based on their public documentation. Platform-specific quirks may require testing during migration.

4. **Customer workflows**: Common automation patterns are derived from public WA community forums and typical membership organization needs.

---

## 1. Zapier Integration

### What WA Customers Do

Wild Apricot provides a Zapier integration with the following triggers and actions:

**Common WA Zapier Triggers:**

| Trigger | What It Does |
|---------|--------------|
| New Contact | Fires when a contact (member or non-member) is created |
| Updated Contact | Fires when contact fields change |
| New Member | Fires when someone becomes a member |
| New Event Registrant | Fires when someone registers for an event |
| New Donation | Fires when a donation is received |

**Common WA Zapier Actions:**

| Action | What It Does |
|--------|--------------|
| Create Contact | Adds a contact to WA |
| Update Contact | Modifies contact fields |
| Add Event Registration | Registers someone for an event |

**Typical Customer Workflows:**

- New member -> Add to Mailchimp list
- New member -> Create Slack notification
- New registration -> Add to Google Sheet
- Updated contact -> Sync to HubSpot/Salesforce
- New donation -> Post to accounting system

### Murmurant v1 Equivalent

**Status: Partial (webhook foundation only)**

Murmurant v1 does not include a native Zapier integration. However, the webhook infrastructure provides the foundation for automation platform connectivity.

**What Murmurant v1 Provides:**

| Capability | Status | Notes |
|------------|--------|-------|
| Outbound webhooks | Planned | Event stream for lifecycle events |
| Webhook triggers | Planned | `member.created`, `member.updated`, `registration.created`, etc. |
| Zapier app | Not included | Requires Zapier developer account and app submission |

**Webhook Event Stream (Planned for v1):**

```
member.created      - New member added
member.updated      - Member fields changed
member.renewed      - Membership renewed
member.lapsed       - Membership lapsed
member.deleted      - Member removed

event.created       - New event created
event.published     - Event made public
event.cancelled     - Event cancelled
event.updated       - Event details changed

registration.created   - Someone registered
registration.cancelled - Registration cancelled
registration.paid      - Payment received
```

**Ambiguity: Webhook Delivery Semantics**

The following webhook behaviors are not yet fully specified:

| Behavior | Status |
|----------|--------|
| Delivery guarantee | Assumed at-least-once; exactly-once not guaranteed |
| Retry policy | Planned: exponential backoff, max 5 attempts |
| Payload signing | Planned: HMAC-SHA256 signature header |
| Event ordering | Not guaranteed; consumers must handle out-of-order |
| Replay capability | Under consideration; not confirmed for v1 |

**Operator action required**: Organizations with Zapier workflows must rebuild them using Murmurant webhooks. Direct Zapier app connectivity is not available in v1.

### Planned v2 Support

| Capability | Target |
|------------|--------|
| Native Zapier app | v2 consideration |
| Pre-built Zap templates | v2 consideration |
| Webhook replay endpoint | v2 consideration |

### Non-Goals

| Capability | Why Excluded |
|------------|--------------|
| WA Zapier trigger emulation | Cannot replicate WA-specific event semantics |
| Bidirectional Zapier sync | Creates authority confusion (see NON_GOALS.md) |
| Zapier action: create member | v1 focuses on outbound events; inbound API is separate scope |

### Migration Risk

**Risk Level: High**

Organizations with established Zapier workflows cannot migrate until they can reconnect automations. This blocks migration for automation-dependent organizations.

**Mitigation:**

- Document webhook event mapping from WA triggers to Murmurant events
- Provide sample Zapier webhook configurations
- Include automation inventory in migration intake checklist

### Operator Expectations

Before cutover, operators should:

1. Inventory all existing Zaps connected to WA
2. Map each Zap trigger to equivalent Murmurant webhook event
3. Rebuild Zaps using webhook trigger (not native WA trigger)
4. Test rebuilt Zaps in parallel before cutover
5. Accept that some WA-specific triggers may not have direct equivalents

---

## 2. Make (Integromat) Integration

### What WA Customers Do

Make (formerly Integromat) provides similar functionality to Zapier with different terminology:

**WA Make Modules:**

| Module Type | Examples |
|-------------|----------|
| Triggers | Watch Contacts, Watch Events, Watch Donations |
| Actions | Create Contact, Update Contact, Create Registration |
| Searches | Get Contact, List Events, List Registrations |

**Typical Customer Scenarios:**

- Sync new members to CRM every 15 minutes
- Create Google Calendar events from WA events
- Generate reports in Google Sheets weekly
- Send custom SMS via Twilio on registration

### Murmurant v1 Equivalent

**Status: Via webhook (same as Zapier)**

Make supports webhook triggers. Organizations can connect Make to Murmurant using the same webhook infrastructure.

**What Murmurant v1 Provides:**

| Capability | Status |
|------------|--------|
| Webhook endpoint | Planned |
| Make app | Not included |

### Planned v2 Support

| Capability | Target |
|------------|--------|
| Native Make integration | v2 consideration |

### Non-Goals

Same as Zapier: no native app, no bidirectional sync, no inbound actions via Make.

### Migration Risk

**Risk Level: High** (same as Zapier)

Make scenarios require rebuild using webhook triggers.

### Operator Expectations

Same as Zapier. Operators rebuild scenarios using Make's HTTP/Webhook module.

---

## 3. Google Sheets Exports

### What WA Customers Do

WA customers export data to Google Sheets in two ways:

**Manual Export:**

- Export members/events/registrations as CSV
- Import CSV into Google Sheets
- Use for board reports, check-in lists, financial reconciliation

**Automated Export (via Zapier/Make):**

- Trigger: new member/registration/donation
- Action: append row to Google Sheet
- Creates real-time log of activity

**Common Export Use Cases:**

| Use Case | Data Exported | Frequency |
|----------|---------------|-----------|
| Treasurer report | Members with dues status | Monthly |
| Event check-in | Registration list | Per event |
| Board dashboard | Member counts by tier | Quarterly |
| Volunteer roster | Activity participants | On demand |
| Donation tracking | Donation amounts | Ongoing |

### Murmurant v1 Equivalent

**Status: Export only (no automated sync)**

Murmurant v1 provides manual data exports. Automated Google Sheets sync requires webhook + Zapier/Make.

**What Murmurant v1 Provides:**

| Capability | Status | Notes |
|------------|--------|-------|
| Member CSV export | Planned | Filterable by status, tier, date |
| Event CSV export | Planned | Includes all event metadata |
| Registration CSV export | Planned | Links events to members |
| Transaction CSV export | Planned | QBO-compatible format |
| Activity roster export | Planned | Per-activity filtering |

**Export Format Guarantees:**

| Property | Guarantee |
|----------|-----------|
| Date format | ISO 8601 (YYYY-MM-DD) with explicit timezone |
| Encoding | UTF-8 |
| Column headers | Documented, versioned schema |
| Delimiter | Comma (CSV standard) |

### Planned v2 Support

| Capability | Target |
|------------|--------|
| Scheduled exports | v2 consideration |
| Direct Google Sheets API | v2 consideration |
| Export to email | v2 consideration |

### Non-Goals

| Capability | Why Excluded |
|------------|--------------|
| Real-time Sheets sync | Use webhook + automation platform instead |
| Two-way Sheets sync | Creates data authority conflicts |
| Excel Online integration | Same approach as Sheets (manual export) |

### Migration Risk

**Risk Level: Medium**

Most organizations can adapt to manual exports. Risk increases for organizations with:

- Highly automated reporting pipelines
- External systems consuming WA exports on schedule
- Custom column mappings they have built tooling around

**Mitigation:**

- Document export column schema changes from WA to Murmurant
- Provide column mapping guide for common fields
- Rebuild automated pipelines using webhook + Sheets action

### Operator Expectations

1. Review current WA export workflows
2. Note any column dependencies in downstream tools
3. Test Murmurant exports for compatibility with existing Sheets
4. Rebuild any automated export -> Sheets pipelines using webhooks

---

## 4. ICS Calendar Feeds

### What WA Customers Do

Wild Apricot provides ICS (iCalendar) feeds for event subscriptions:

**WA ICS Feed Types:**

| Feed Type | URL Pattern | Contents |
|-----------|-------------|----------|
| All events | `/widget/Calendar.ashx` | All public events |
| Filtered feed | Query parameters | Events by category/tag |
| Personal calendar | Member-specific URL | Registered events only |

**How Members Use It:**

- Subscribe URL in Google Calendar, Apple Calendar, Outlook
- Events appear automatically as they are published
- Changes sync (with delay based on client refresh)

**Typical Issues with WA ICS:**

- Timezone handling varies (some events use floating time)
- Refresh delays (Google Calendar: 12-24 hours)
- Personal feeds require member auth

### Murmurant v1 Equivalent

**Status: Planned (with improvements)**

Murmurant v1 includes ICS calendar feed support with explicit timezone handling.

**What Murmurant v1 Provides:**

| Capability | Status | Notes |
|------------|--------|-------|
| All-events ICS feed | Planned | Public events only |
| Per-activity ICS feed | Planned | Filter by activity group |
| RFC 5545 compliance | Planned | Standard iCalendar format |
| VTIMEZONE with IANA tzid | Planned | `America/Los_Angeles` |
| Stable UIDs | Planned | Prevents duplicate events |
| SEQUENCE increment | Planned | Signals event updates |

**ICS Export Guarantees:**

| Property | Guarantee |
|----------|-----------|
| Timezone | TZID=America/Los_Angeles (configurable per org) |
| DST handling | VTIMEZONE component with correct rules |
| All-day events | VALUE=DATE (no timezone conversion issues) |
| Recurring events | RRULE with TZID |
| Event identity | Stable UID per event |

See [Calendar Interoperability Guide](../ARCH/CALENDAR_INTEROP_GUIDE.md) for detailed ICS behavior.

### Planned v2 Support

| Capability | Target |
|------------|--------|
| Personal calendar feed | v2 consideration |
| Category/tag filtering | v2 consideration |
| iCal VALARM (reminders) | v2 consideration |

### Non-Goals

| Capability | Why Excluded |
|------------|--------------|
| Real-time push to calendars | ICS is pull-based; refresh is client-controlled |
| CalDAV write access | Read-only feeds; Murmurant is source of truth |
| Meeting invitations (iTIP) | Adds complexity; standard subscription is sufficient |

### Migration Risk

**Risk Level: High**

Calendar sync is a core member expectation. If ICS feeds break, members cannot see upcoming events.

**Specific Risks:**

| Risk | Impact |
|------|--------|
| URL changes | Members must resubscribe |
| Timezone differences | Events appear at wrong time |
| Missing events | Events not in feed after migration |

**Mitigation:**

- Communicate new ICS URL to members before cutover
- Test ICS feed with major calendar clients (Google, Apple, Outlook)
- Verify timezone handling matches WA behavior
- Provide troubleshooting guide for common sync issues

### Operator Expectations

1. Obtain new Murmurant ICS feed URL
2. Test subscription in target calendar clients
3. Verify event times display correctly (especially around DST)
4. Communicate URL change to members before cutover
5. Expect refresh delay (not a Murmurant issue)

---

## 5. Email Exports and Notifications

### What WA Customers Do

Wild Apricot sends emails in two categories:

**System Emails (Transactional):**

| Email Type | Trigger |
|------------|---------|
| Registration confirmation | Member registers for event |
| Payment receipt | Payment processed |
| Renewal reminder | Membership expiring soon |
| Password reset | Member requests reset |
| Welcome email | New member joins |

**Marketing Emails (Bulk):**

| Email Type | Method |
|------------|--------|
| Newsletters | WA email blast feature |
| Event announcements | WA email blast |
| Custom campaigns | Export list -> Mailchimp/Constant Contact |

**Email Export:**

- Export member list with email addresses
- Filter by status, tier, activity membership
- Import to external email marketing platform

### Murmurant v1 Equivalent

**Status: Transactional only; marketing via export**

Murmurant v1 handles transactional email natively. Marketing email uses external platforms.

**What Murmurant v1 Provides:**

| Capability | Status | Notes |
|------------|--------|-------|
| Registration confirmation | Planned | Template-based |
| Payment receipt | Planned | Stripe integration |
| Renewal reminder | Planned | Configurable timing |
| Welcome email | Planned | On membership activation |
| Password reset | N/A | Passkey-first auth |
| Email list export | Planned | CSV with email + consent status |
| Unsubscribe handling | Planned | With audit trail |

**What Murmurant v1 Does NOT Provide:**

| Capability | Status |
|------------|--------|
| Bulk email sending | Non-goal (use Mailchimp, etc.) |
| Email template designer | Non-goal (use external platform) |
| Email analytics | Non-goal (external platform provides) |

### Planned v2 Support

| Capability | Target |
|------------|--------|
| Mailchimp segment sync | v2 consideration |
| Constant Contact integration | v2 consideration |
| SendGrid transactional API | v2 consideration |

### Non-Goals

| Capability | Why Excluded |
|------------|--------------|
| Bulk email sending | Email marketing platforms do this better |
| Newsletter builder | Out of scope for membership management |
| Email deliverability management | Transactional only; bulk via external |

### Migration Risk

**Risk Level: Medium**

Transactional email is straightforward. Risk is higher for organizations that:

- Use WA's built-in email blast for all communications
- Have complex email segmentation rules in WA
- Have not used external email platforms before

**Mitigation:**

- Inventory all WA email templates and triggers
- Set up external email platform (Mailchimp, etc.) before migration
- Configure list sync workflow (export -> import or webhook -> add)
- Test transactional emails in Murmurant before cutover

### Operator Expectations

1. Identify all WA email templates in use
2. Set up external email marketing platform if not already in use
3. Configure member list sync (manual export or webhook automation)
4. Test transactional email delivery from Murmurant
5. Communicate any email sender address changes to members

---

## Summary Matrix

| Pattern | WA Feature | Murmurant v1 | v2 Planned | Non-Goal |
|---------|------------|-----------|------------|----------|
| Zapier triggers | Native app | Webhook | Native app | WA emulation |
| Zapier actions | Native app | None | API | Bidirectional sync |
| Make triggers | Native app | Webhook | Native app | WA emulation |
| Make actions | Native app | None | API | Bidirectional sync |
| Sheets manual export | CSV export | CSV export | Same | - |
| Sheets auto sync | Via Zapier/Make | Via webhook | Scheduled | Real-time sync |
| ICS all events | Feed URL | Feed URL | Same | - |
| ICS per activity | Query param | Per-activity URL | Same | - |
| ICS personal | Auth URL | None | Planned | CalDAV write |
| Transactional email | Native | Native | Same | - |
| Bulk email | Native | Export only | Segment sync | Native bulk |
| Email export | CSV | CSV | Same | - |

---

## Migration Intake: Automation Questions

During policy capture, ask the customer:

**Zapier/Make:**

1. How many Zaps or Make scenarios connect to Wild Apricot?
2. What triggers do they use? (new member, new registration, etc.)
3. What downstream systems receive data? (CRM, Sheets, Slack, etc.)
4. Who maintains these automations?

**Google Sheets:**

5. Do you export data to Google Sheets regularly?
6. What reports depend on these exports?
7. Are exports manual or automated?
8. What columns/fields are critical for downstream tools?

**Calendar:**

9. Do members subscribe to the WA calendar feed?
10. Approximately how many subscribers?
11. Which calendar clients are commonly used? (Google, Apple, Outlook)
12. Are there activity-specific calendar feeds?

**Email:**

13. Do you use WA's built-in email blast feature?
14. Do you export member lists to Mailchimp or similar?
15. What transactional emails do members expect? (confirmation, reminder, receipt)
16. Is there a newsletter schedule?

---

## Open Questions

The following items require further specification:

1. **Webhook exactly-once delivery**: Is idempotency the consumer's responsibility, or does Murmurant provide deduplication keys?

2. **Webhook event schema versioning**: How are breaking changes to payload structure communicated?

3. **Webhook subscription management**: How do organizations register webhook endpoints? Admin UI? API?

4. **Personal ICS feeds**: How does member authentication work for personal calendar feeds?

5. **Email sender domain**: What domain does Murmurant send transactional email from? Does organization get custom sender?

---

## Related Documents

- [Wild Apricot Extension Landscape](../BIZ/WILD_APRICOT_EXTENSION_LANDSCAPE.md) - Integration categories and roadmap
- [Implementation Backlog](../BIZ/IMPLEMENTATION_BACKLOG.md) - Technical requirements status
- [Calendar Interoperability Guide](../ARCH/CALENDAR_INTEROP_GUIDE.md) - ICS feed details
- [Non-Goals and Exclusions](../BIZ/NON_GOALS_AND_EXCLUSIONS.md) - Explicit scope boundaries
- [Migration Intake Checklist](./WILD_APRICOT_MIGRATION_INTAKE_CHECKLIST.md) - Discovery questions

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2025-12-26 | System | Initial automation compatibility mapping |
