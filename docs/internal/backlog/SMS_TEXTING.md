<!--
  Copyright © 2025 Murmurant, Inc. All rights reserved.

  ⚠️ INTERNAL DOCUMENT
-->

# Outbound SMS/Texting

**Status**: Backlog
**Priority**: P2
**Epic**: Communications
**Created**: 2025-12-29

## Summary

Enable clubs to send SMS messages to members for time-sensitive communications. Includes strong guardrails to prevent member spam and control costs.

## Problem

Some communications need immediacy:

- "Tomorrow's hike is cancelled due to weather"
- "Reminder: Board meeting starts in 1 hour"
- "We're at Table 12 at the restaurant"
- "Carpool is leaving in 15 minutes"

Email isn't reliable for urgent, time-sensitive messages. But texting can easily become annoying and costs money per message.

## Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Texts are for urgent/time-sensitive only** | UI guidance, approval workflows, templates |
| **Members control what they receive** | Granular opt-in by category |
| **Clubs can't accidentally overspend** | Quotas, alerts, approval thresholds |
| **Respect quiet hours** | Don't send at 2am |
| **Comply with regulations** | TCPA, carrier requirements |

---

## Feature Design

### Message Composer

```
┌─────────────────────────────────────────────────────────────┐
│  Send Text Message                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  To: [Select recipients ▼]                                  │
│       ○ Individual member                                   │
│       ○ Activity group: [Hiking Group ▼]                   │
│       ○ Event attendees: [Tomorrow's Hike ▼]               │
│       ○ All members (requires approval)                     │
│                                                             │
│  Recipients: 24 members (18 opted in to texts)             │
│  Estimated cost: $0.18                                      │
│                                                             │
│  Message type: [Event update ▼]                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Tomorrow's hike is CANCELLED due to weather         │   │
│  │ forecast. We'll reschedule for next Saturday.       │   │
│  │ Check your email for details.                       │   │
│  │                                                     │   │
│  │                                          89/160 ▼   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ☑ Include opt-out link (required)                         │
│                                                             │
│  ⚠️ Texts are for urgent, time-sensitive messages only.    │
│     For routine updates, use email instead.                 │
│                                                             │
│  Schedule: (•) Send now                                     │
│            ( ) Schedule: [Date] [Time]                      │
│                                                             │
│                              [Preview] [Send to 18 members] │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Message Categories

Members opt into categories, not blanket "all texts":

| Category | Example | Default |
|----------|---------|---------|
| **Event updates** | Cancellations, location changes, reminders | Opt-in |
| **Activity group** | Group-specific urgent updates | Opt-in per group |
| **Administrative** | Membership expiring, payment issues | Opt-in |
| **Emergency** | Safety alerts, facility closures | Opt-in (encouraged) |

### Member Preferences

```
┌─────────────────────────────────────────────────────────────┐
│  Text Message Preferences                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Mobile: (805) 555-1234  [Edit]                            │
│                                                             │
│  I want to receive texts for:                               │
│                                                             │
│    ☑ Event updates                                         │
│      Cancellations, time/location changes, day-of info     │
│                                                             │
│    ☑ Hiking Group updates                                  │
│    ☐ Book Club updates                                     │
│    ☑ Wine Tasting updates                                  │
│                                                             │
│    ☐ Administrative notices                                │
│      Membership renewal reminders, payment issues           │
│                                                             │
│    ☑ Emergency alerts                                      │
│      Safety notices, facility closures                      │
│                                                             │
│  ────────────────────────────────────────────────────────── │
│                                                             │
│  Quiet hours: Don't text me between [9:00 PM] and [8:00 AM]│
│                                                             │
│  To stop all texts, reply STOP to any message.              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Anti-Spam Controls

### Frequency Limits

```typescript
interface TextFrequencyLimits {
  // Per-member limits
  maxTextsPerMemberPerDay: number;      // Default: 3
  maxTextsPerMemberPerWeek: number;     // Default: 7
  maxTextsPerMemberPerMonth: number;    // Default: 15

  // Quiet hours (member's local time)
  quietHoursStart: string;  // Default: "21:00"
  quietHoursEnd: string;    // Default: "08:00"

  // Exceptions
  emergencyBypassesLimits: boolean;     // Default: true
  emergencyBypassesQuietHours: boolean; // Default: true
}
```

### Limit Enforcement

When composing a message:

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️ Some recipients will not receive this message           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  24 selected → 18 will receive                              │
│                                                             │
│  Excluded:                                                  │
│  • 3 members haven't opted into event texts                │
│  • 2 members hit their weekly text limit                   │
│  • 1 member is in quiet hours (will queue until 8am)       │
│                                                             │
│  [Send to 18 now] [Queue all 21 for appropriate times]     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Global Org Limits

Prevent runaway texting:

```typescript
interface OrgTextSettings {
  // Who can send
  textSendersRole: 'ADMIN_ONLY' | 'BOARD_AND_CHAIRS' | 'ANY_LEADER';

  // Approval thresholds
  requireApprovalAbove: number;        // Texts to 50+ people need approval
  approverRole: 'ADMIN' | 'PRESIDENT';

  // Emergency override
  emergencyBypassApproval: boolean;

  // Daily org-wide limits
  maxTextsPerDay: number;              // Default: 500
  alertAtPercent: number;              // Alert admin at 80% of limit
}
```

---

## Cost Controls

### Pricing Model

Texting costs money. Options:

| Model | How it works | Pros | Cons |
|-------|--------------|------|------|
| **Included quota** | X texts/month included in plan | Simple, predictable | May under/over provision |
| **Pay as you go** | $0.01/text, billed monthly | Fair, scales | Unpredictable costs |
| **Prepaid credits** | Buy blocks of 1000 texts | Controlled spend | Runs out |

**Recommendation**: Included quota + overage pricing

- Starter: 100 texts/month included
- Growth: 500 texts/month included
- Pro: 2000 texts/month included
- Overage: $0.015/text

### Usage Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  Text Message Usage                              December   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Plan allowance: 500 texts                                  │
│  Used this month: 347 texts                                 │
│  Remaining: 153 texts                                       │
│                                                             │
│  ████████████████████████████████░░░░░░░░░░░  69%          │
│                                                             │
│  Projected month-end: 485 texts (within plan)               │
│                                                             │
│  ────────────────────────────────────────────────────────── │
│                                                             │
│  Top senders this month:                                    │
│  • Jane S. (Events Chair): 142 texts                       │
│  • Bob T. (Hiking Group): 98 texts                         │
│  • Admin: 67 texts                                          │
│  • Mary K. (Book Club): 40 texts                           │
│                                                             │
│  ────────────────────────────────────────────────────────── │
│                                                             │
│  ⚙️ Alert me when usage reaches: [80%▼] of plan            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Overage Protection

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️ Approaching Text Limit                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  You've used 485 of 500 texts this month.                  │
│                                                             │
│  Options:                                                   │
│  • Wait until January 1 (resets in 3 days)                 │
│  • Enable overage at $0.015/text                           │
│  • Upgrade to Growth plan (500 → 2000 texts)               │
│                                                             │
│  Current overage setting: [Disabled - Block at limit▼]     │
│                                                             │
│  [Keep current settings]  [Enable overage]  [Upgrade plan] │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Spending Limits

```typescript
interface TextSpendingLimits {
  // Overage controls
  allowOverage: boolean;
  maxOveragePerMonth: number;          // e.g., $50 max overage

  // Alerts
  alertAtUsagePercent: number;         // Alert at 80%
  alertRecipients: string[];           // Email addresses

  // Hard stop
  blockAtLimit: boolean;               // Stop sending when quota exhausted
  emergencyReserve: number;            // Keep 20 texts for emergencies
}
```

---

## Compliance (TCPA)

SMS has legal requirements. Non-negotiable:

### Opt-In Requirements

```typescript
interface TextConsent {
  memberId: string;
  phoneNumber: string;

  // Consent record
  consentedAt: DateTime;
  consentMethod: 'WEB_FORM' | 'PAPER_FORM' | 'VERBAL' | 'IMPORTED';
  consentText: string;       // Exact language they agreed to

  // Categories consented
  categories: TextCategory[];

  // Opt-out tracking
  optedOutAt?: DateTime;
  optOutMethod?: 'REPLY_STOP' | 'WEB' | 'REQUEST';
}
```

### Required Message Elements

Every text must include:

- Org name identification
- Opt-out instructions (or link)

```
[SBNC] Tomorrow's hike is cancelled due to weather.
Reply STOP to unsubscribe.
```

### STOP Handling

Automatic, immediate opt-out when member replies STOP:

```typescript
// Inbound webhook from SMS provider
async function handleInboundSMS(message: InboundSMS) {
  const stopWords = ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'];

  if (stopWords.includes(message.body.trim().toUpperCase())) {
    await optOutMember(message.from);
    await sendConfirmation(message.from,
      "You've been unsubscribed from [Org Name] texts. " +
      "Reply START to resubscribe."
    );
  }
}
```

---

## Data Model

```prisma
model TextMessage {
  id              String   @id @default(uuid()) @db.Uuid

  // Content
  body            String
  category        TextCategory

  // Sender
  sentById        String   @db.Uuid
  sentAt          DateTime

  // Targeting
  recipientType   RecipientType  // INDIVIDUAL, GROUP, EVENT, ALL
  recipientConfig Json?

  // Results
  recipientCount  Int
  deliveredCount  Int?
  failedCount     Int?
  optOutCount     Int?

  // Cost tracking
  segmentCount    Int      // 160 chars = 1 segment
  estimatedCost   Decimal

  // Status
  status          MessageStatus

  deliveries      TextDelivery[]

  createdAt       DateTime @default(now())
}

enum TextCategory {
  EVENT_UPDATE
  ACTIVITY_GROUP
  ADMINISTRATIVE
  EMERGENCY
}

enum MessageStatus {
  DRAFT
  SCHEDULED
  SENDING
  SENT
  PARTIALLY_FAILED
  FAILED
}

model TextDelivery {
  id              String   @id @default(uuid()) @db.Uuid
  messageId       String   @db.Uuid
  memberId        String   @db.Uuid
  phoneNumber     String

  // Delivery status
  status          DeliveryStatus
  carrierStatus   String?
  deliveredAt     DateTime?
  failedAt        DateTime?
  failureReason   String?

  // Cost
  segments        Int      @default(1)
  cost            Decimal?

  message         TextMessage @relation(fields: [messageId], references: [id])

  @@index([messageId])
  @@index([memberId])
}

enum DeliveryStatus {
  QUEUED           // Waiting (quiet hours, rate limit)
  SENT             // Sent to carrier
  DELIVERED        // Confirmed delivered
  FAILED           // Delivery failed
  OPTED_OUT        // Member had opted out
  RATE_LIMITED     // Hit frequency limit
}

// Track member text frequency for rate limiting
model MemberTextLog {
  id              String   @id @default(uuid()) @db.Uuid
  memberId        String   @db.Uuid
  messageId       String   @db.Uuid

  sentAt          DateTime
  category        TextCategory

  @@index([memberId, sentAt])
}

// Consent tracking for compliance
model TextConsent {
  id              String   @id @default(uuid()) @db.Uuid
  memberId        String   @db.Uuid
  phoneNumber     String

  // Consent details
  consentedAt     DateTime
  consentMethod   ConsentMethod
  consentLanguage String   @db.Text  // Exact text they agreed to
  ipAddress       String?

  // Current status
  isActive        Boolean  @default(true)
  optedOutAt      DateTime?
  optOutMethod    String?

  // Categories
  categories      TextCategory[]

  @@unique([memberId, phoneNumber])
  @@index([phoneNumber])
}

enum ConsentMethod {
  WEB_FORM
  PAPER_FORM
  VERBAL
  IMPORTED
}
```

---

## Templates & Quick Actions

Pre-built templates for common use cases:

### Event Templates

```typescript
const eventTemplates = [
  {
    name: "Event Cancelled",
    category: "EVENT_UPDATE",
    template: "[{org}] {event_name} on {event_date} is CANCELLED. {reason} Check email for details.",
  },
  {
    name: "Event Reminder",
    category: "EVENT_UPDATE",
    template: "[{org}] Reminder: {event_name} is tomorrow at {event_time}. Location: {location}",
  },
  {
    name: "Location Change",
    category: "EVENT_UPDATE",
    template: "[{org}] LOCATION CHANGE for {event_name}: Now at {new_location}. See you there!",
  },
  {
    name: "Running Late",
    category: "EVENT_UPDATE",
    template: "[{org}] {event_name} starting {delay} late. New start time: {new_time}",
  },
];
```

### Quick Send from Event Page

```
┌─────────────────────────────────────────────────────────────┐
│  Holiday Party                           Saturday, Dec 14   │
│  The Lark Restaurant                              6:00 PM   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  32 registered                                              │
│                                                             │
│  [Check In]  [Email Attendees]  [Text Attendees ▼]         │
│                                  ├─────────────────────┤    │
│                                  │ Event Reminder      │    │
│                                  │ Location Change     │    │
│                                  │ Running Late        │    │
│                                  │ Cancelled           │    │
│                                  │ Custom message...   │    │
│                                  └─────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Foundation (2 sprints)

- [ ] SMS provider integration (Twilio/Telnyx)
- [ ] Basic composer (individual + group)
- [ ] Consent capture and STOP handling
- [ ] Delivery tracking

### Phase 2: Controls (1.5 sprints)

- [ ] Member preferences UI
- [ ] Frequency limits
- [ ] Quiet hours
- [ ] Category-based opt-in

### Phase 3: Cost Management (1 sprint)

- [ ] Usage dashboard
- [ ] Quota tracking
- [ ] Overage alerts and controls
- [ ] Spending limits

### Phase 4: Polish (1 sprint)

- [ ] Templates library
- [ ] Quick send from events
- [ ] Scheduled sending
- [ ] Approval workflows for large sends

---

## SMS Provider Selection

| Provider | Pricing | Pros | Cons |
|----------|---------|------|------|
| **Twilio** | ~$0.0079/msg | Market leader, reliable, great docs | More expensive |
| **Telnyx** | ~$0.004/msg | Cheaper, good API | Less known |
| **Vonage** | ~$0.0068/msg | Enterprise features | Complex pricing |
| **AWS SNS** | ~$0.00645/msg | AWS integration | Less SMS-focused |

**Recommendation**: Twilio for reliability, or Telnyx if cost-sensitive.

---

## Metrics to Track

| Metric | Purpose |
|--------|---------|
| Texts sent per club/month | Usage patterns, pricing validation |
| Opt-out rate | Are we annoying members? |
| Delivery rate | Provider quality |
| Response rate (if 2-way) | Engagement |
| Cost per club | Unit economics |
| Category breakdown | What texts are most used |
| Frequency limit hits | Are limits too tight? |

---

## Open Questions

1. **Two-way texting?**
   - Allow replies beyond STOP/START?
   - Forward replies to sender?
   - Recommendation: Not in MVP, adds complexity

2. **MMS (images)?**
   - Event flyers, photos?
   - Recommendation: Defer, much more expensive

3. **International?**
   - Non-US numbers?
   - Recommendation: US-only initially, international has complex regulations

4. **Shared short code vs. toll-free?**
   - Short code: Higher throughput, more expensive
   - Toll-free: Cheaper, good for most clubs
   - Recommendation: Toll-free for MVP
