<!--
  Copyright © 2025 Murmurant, Inc. All rights reserved.

  INTERNAL DOCUMENT - Contains strategic product decisions
-->

# Analytics, Advisory & Benchmarking

**Status**: Backlog
**Priority**: P2
**Epic**: Platform / Growth
**Created**: 2025-12-29

## Summary

Three-layer analytics strategy:

1. **GA4 Integration**: Clubs connect their GA4 property for their own analysis
2. **Murmurant Metrics**: We capture key metrics to advise customers and improve our product
3. **Benchmarking**: Anonymous cross-customer comparisons to help clubs improve

## Why This Matters

| Capability | Value to Customer | Value to Murmurant |
|------------|-------------------|-------------------|
| GA4 Integration | Their data, their analysis | Table stakes feature |
| Advisory insights | "Here's how to improve" | Stickiness, upsell, retention |
| Benchmarking | "You're in top 20% for retention" | Network effect moat |

---

## Layer 1: Customer GA4 Integration

Customers connect their own GA4 property. We fire events, they analyze.

### Configuration

```
┌─────────────────────────────────────────────────────────────┐
│  Google Analytics                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Measurement ID: [G-XXXXXXXXXX]                            │
│  API Secret: [••••••••••••] (for server-side events)       │
│                                                             │
│  Events to track:                                           │
│    ☑ Member signup              ☑ Event registration       │
│    ☑ Membership renewal         ☑ Event check-in           │
│    ☑ Donation                   ☑ Activity group join      │
│    ☑ Survey response            ☑ Page views               │
│                                                             │
│  User properties:                                           │
│    ☑ Membership type            ☑ Member status            │
│    ☑ Member since (cohort)      ☑ Activity group count     │
│                                                             │
│                                        [Test] [Save]        │
└─────────────────────────────────────────────────────────────┘
```

### Events Taxonomy

| Event | Parameters | GA4 Standard? |
|-------|------------|---------------|
| `sign_up` | method, membership_type, value | Yes |
| `purchase` | transaction_id, value, items[] | Yes |
| `membership_renewal` | membership_type, value, renewal_type | Custom |
| `event_registration` | event_name, event_id, value, ticket_type | Custom |
| `event_checkin` | event_name, event_id | Custom |
| `donation` | transaction_id, value, campaign | Custom |
| `join_group` | group_name, group_id | Yes (join_group) |
| `survey_complete` | survey_name, survey_type, nps_score | Custom |

### Implementation

```typescript
// Client-side: Fire to customer's GA4
class CustomerAnalytics {
  constructor(private ga4Id: string | null) {}

  trackSignUp(params: SignUpParams) {
    if (!this.ga4Id) return;
    gtag('event', 'sign_up', {
      method: params.method,
      membership_type: params.membershipType,
      value: params.amount,
      currency: 'USD',
    });
  }

  trackEventRegistration(params: RegistrationParams) {
    if (!this.ga4Id) return;
    gtag('event', 'event_registration', {
      event_name: params.eventName,
      event_id: params.eventId,
      value: params.amount,
    });
  }

  setUserProperties(member: Member) {
    if (!this.ga4Id) return;
    gtag('set', 'user_properties', {
      membership_type: member.membershipType,
      membership_status: member.status,
      member_since: member.joinDate.substring(0, 7),
    });
  }
}
```

---

## Layer 2: Murmurant Metrics (For Advisory)

We capture aggregated metrics to help customers improve. This is OUR data about their usage.

### What We Capture

```prisma
model ClubMetricsSnapshot {
  id              String   @id @default(uuid()) @db.Uuid
  clubId          String   @db.Uuid

  // Time period
  periodStart     DateTime
  periodEnd       DateTime
  periodType      PeriodType  // DAILY, WEEKLY, MONTHLY

  // Membership
  totalMembers    Int
  activeMembers   Int
  newMembers      Int
  expiredMembers  Int
  renewalRate     Float?      // % who renewed this period

  // Engagement
  eventsHeld      Int
  totalRegistrations Int
  avgAttendanceRate Float?    // registrations that checked in

  // Activity groups
  activeGroups    Int
  groupParticipation Float?   // % of members in 1+ group

  // Donations
  donationCount   Int
  donationTotal   Decimal?

  // Engagement score (computed)
  engagementScore Float?      // 0-100 composite

  // NPS (if surveys enabled)
  npsScore        Int?        // -100 to 100
  npsResponses    Int?

  createdAt       DateTime @default(now())

  @@unique([clubId, periodStart, periodType])
  @@index([clubId, periodType])
}

enum PeriodType {
  DAILY
  WEEKLY
  MONTHLY
  QUARTERLY
}
```

### Computed Metrics

```typescript
interface ClubHealthMetrics {
  // Retention
  renewalRate: number;              // % of expiring members who renew
  churnRate: number;                // % who don't renew
  netMemberGrowth: number;          // new - churned

  // Engagement
  eventAttendanceRate: number;      // avg % of members attending events
  activityGroupPenetration: number; // % of members in 1+ group
  avgEventsPerMember: number;       // events attended per member (30d)

  // Event health
  avgEventFillRate: number;         // registrations / capacity
  avgEventShowRate: number;         // check-ins / registrations

  // New member activation
  newMemberEventRate: number;       // % of new members attending event in 30d
  newMemberGroupRate: number;       // % of new members joining group in 30d

  // Financial
  avgRevenuePerMember: number;      // (dues + events + donations) / members
  donorRate: number;                // % of members who donated

  // Satisfaction (if NPS enabled)
  npsScore: number;                 // -100 to 100
  npsTrend: number;                 // change from last period
}
```

### Advisory Insights Engine

Generate actionable recommendations based on metrics:

```typescript
interface AdvisoryInsight {
  category: 'RETENTION' | 'ENGAGEMENT' | 'ACTIVATION' | 'REVENUE' | 'SATISFACTION';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  metric: string;
  currentValue: number;
  benchmark: number;           // Comparison to similar clubs
  percentile: number;          // Where they rank (0-100)

  headline: string;            // "Your renewal rate is below average"
  explanation: string;         // Why this matters
  recommendations: string[];   // What to do about it
}

// Example insights
const insights: AdvisoryInsight[] = [
  {
    category: 'RETENTION',
    severity: 'WARNING',
    metric: 'renewalRate',
    currentValue: 0.65,
    benchmark: 0.78,
    percentile: 25,
    headline: "Your renewal rate is in the bottom 25%",
    explanation: "65% of your members renewed last month, compared to 78% for similar-sized clubs.",
    recommendations: [
      "Enable automated renewal reminders (you have this turned off)",
      "Start renewals 60 days before expiration instead of 30",
      "Consider a 'win-back' email campaign for recently expired members",
    ],
  },
  {
    category: 'ACTIVATION',
    severity: 'CRITICAL',
    metric: 'newMemberEventRate',
    currentValue: 0.22,
    benchmark: 0.55,
    percentile: 10,
    headline: "New members aren't attending events",
    explanation: "Only 22% of new members attend an event in their first 30 days. Top clubs see 55%+.",
    recommendations: [
      "Add a 'New Member Welcome' event each month",
      "Send new members a personal event invitation from a board member",
      "Consider a 'first event free' promotion",
    ],
  },
];
```

### Consent Model

```typescript
interface AnalyticsConsent {
  // Required for basic functionality
  essentialMetrics: true;  // Always on - aggregate counts for our product

  // Customer opts in
  advisoryInsights: boolean;    // We analyze their data to give recommendations
  benchmarkParticipation: boolean; // Their anonymized data joins benchmark pool

  // What we show if they opt in
  showBenchmarkComparisons: boolean; // They see how they compare to others
}
```

### Advisory Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  Club Health Dashboard                           [Export]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Overall Health Score: 72/100  ▲ +5 from last month        │
│  ████████████████████████████████░░░░░░░░                  │
│                                                             │
│  You're doing better than 68% of similar clubs              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Needs Attention                                            │
│                                                             │
│  New Member Activation: 22%                                 │
│  Only 22% of new members attend an event in 30 days.        │
│  Similar clubs: 55%  |  You rank: Bottom 10%                │
│  [View Recommendations]                                      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Room for Improvement                                       │
│                                                             │
│  Renewal Rate: 65%                                          │
│  Similar clubs: 78%  |  You rank: 25th percentile           │
│  [View Recommendations]                                      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Doing Well                                                 │
│                                                             │
│  Event Attendance: 85%                                      │
│  Similar clubs: 72%  |  You rank: Top 15%                   │
│                                                             │
│  Activity Group Participation: 62%                          │
│  Similar clubs: 45%  |  You rank: Top 20%                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Layer 3: Competitive Benchmarking

Anonymous aggregation across customers to answer "How do we compare?"

### Benchmark Cohorts

Group clubs for fair comparison:

```typescript
interface BenchmarkCohort {
  // Size-based
  memberCountBucket: '1-50' | '51-200' | '201-500' | '501-1000' | '1000+';

  // Type-based (from club profile)
  clubType: 'NEWCOMER' | 'SOCIAL' | 'HOBBY' | 'PROFESSIONAL' | 'SERVICE';

  // Geography (optional)
  region?: 'NORTHEAST' | 'SOUTHEAST' | 'MIDWEST' | 'SOUTHWEST' | 'WEST';

  // Maturity
  clubAgeBucket: '<1yr' | '1-3yr' | '3-10yr' | '10+yr';
}

// Example: "Newcomer clubs with 200-500 members"
```

### Benchmark Metrics

What we compute across cohorts:

```typescript
interface CohortBenchmarks {
  cohort: BenchmarkCohort;
  sampleSize: number;          // "Based on 47 similar clubs"

  metrics: {
    renewalRate: BenchmarkStat;
    eventAttendanceRate: BenchmarkStat;
    newMemberActivation: BenchmarkStat;
    activityGroupPenetration: BenchmarkStat;
    avgEventsPerMonth: BenchmarkStat;
    npsScore: BenchmarkStat;
  };
}

interface BenchmarkStat {
  p25: number;   // 25th percentile
  p50: number;   // Median
  p75: number;   // 75th percentile
  mean: number;  // Average
}
```

### Privacy & Anonymization

```typescript
// Rules for benchmark inclusion
const BENCHMARK_RULES = {
  // Minimum cohort size to prevent identification
  minCohortSize: 10,

  // Don't expose individual club data
  neverExpose: ['clubName', 'clubId', 'memberNames', 'revenue'],

  // Only show percentiles, not raw values
  showAsPercentile: true,

  // Lag data to prevent real-time tracking
  dataLagDays: 7,

  // Require explicit opt-in
  requireOptIn: true,
};

// What customers see
interface MyBenchmarkPosition {
  metric: string;
  myValue: number;           // Their actual value
  percentile: number;        // Where they rank (0-100)
  cohortMedian: number;      // What "typical" looks like
  cohortTop25: number;       // What "good" looks like

  // NOT exposed
  // otherClubValues: never;
  // cohortClubIds: never;
}
```

### Benchmark Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  How You Compare                                            │
│  Benchmarked against 47 similar clubs (200-500 members,     │
│  newcomer/social type)                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Renewal Rate                                               │
│  ──────────────────────────────────────────                 │
│         25%      50%      75%                               │
│          │        │        │                                │
│  ├───────┼────────┼────────┼───────┤                       │
│  60%     70%     78%      85%     95%                       │
│                   ▲                                         │
│                  You: 78%                                   │
│                                                             │
│  You're at the median — room to improve                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  New Member Activation (30-day event attendance)            │
│  ──────────────────────────────────────────                 │
│         25%      50%      75%                               │
│          │        │        │                                │
│  ├───────┼────────┼────────┼───────┤                       │
│  20%     35%     55%      70%     90%                       │
│     ▲                                                       │
│   You: 22%                                                  │
│                                                             │
│  You're in the bottom 25% — see recommendations             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Foundation (2 sprints)

- [ ] GA4 client-side integration
- [ ] Customer GA4 configuration UI
- [ ] Basic event firing (sign_up, purchase, event_registration)
- [ ] User properties

### Phase 2: Murmurant Metrics (2 sprints)

- [ ] ClubMetricsSnapshot model and daily job
- [ ] Compute derived metrics (renewal rate, engagement, etc.)
- [ ] Basic health dashboard
- [ ] Consent management UI

### Phase 3: Advisory Insights (2 sprints)

- [ ] Insights engine (rules-based initially)
- [ ] Recommendation templates
- [ ] Advisory dashboard UI
- [ ] Alerts for critical metrics

### Phase 4: Benchmarking (2 sprints)

- [ ] Cohort definition and assignment
- [ ] Benchmark aggregation job (with privacy rules)
- [ ] Percentile calculations
- [ ] Benchmark comparison UI
- [ ] Opt-in flow

### Phase 5: Server-Side & Advanced (1 sprint)

- [ ] Measurement Protocol for server events
- [ ] Data layer for GTM users
- [ ] Export/API for metrics

---

## Data Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Customer's GA4                           │
│                    (Their property)                         │
└─────────────────────────────────────────────────────────────┘
                          ▲
                          │ Events fired client-side
                          │
┌─────────────────────────────────────────────────────────────┐
│                  Murmurant Application                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ Member/Event│───▶│   Metrics   │───▶│  Benchmark  │     │
│  │   Actions   │    │  Snapshot   │    │ Aggregation │     │
│  └─────────────┘    │   (daily)   │    │  (weekly)   │     │
│                     └─────────────┘    └─────────────┘     │
│                            │                  │             │
│                            ▼                  ▼             │
│                     ┌─────────────┐    ┌─────────────┐     │
│                     │  Advisory   │    │  Benchmark  │     │
│                     │  Insights   │    │   Cohorts   │     │
│                     └─────────────┘    └─────────────┘     │
│                            │                  │             │
│                            ▼                  ▼             │
│                     ┌─────────────────────────────┐        │
│                     │    Club Health Dashboard    │        │
│                     └─────────────────────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Consent & Privacy

### Opt-In Levels

| Level | What It Enables | Default |
|-------|-----------------|---------|
| **Essential** | Basic product metrics (for our monitoring) | Always on |
| **GA4 Integration** | Events fire to their GA4 property | Opt-in |
| **Advisory Insights** | We analyze their data for recommendations | Opt-in |
| **Benchmark Participation** | Their anonymized data joins benchmark pool | Opt-in |
| **Benchmark Viewing** | They see how they compare | Requires participation |

### Consent UI

```
┌─────────────────────────────────────────────────────────────┐
│  Analytics & Insights Settings                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Google Analytics Integration                               │
│  ───────────────────────────                                │
│  Connect your GA4 property to track member and event        │
│  activity on your site.                                     │
│  [Configure GA4]                                            │
│                                                             │
│  Murmurant Advisory Insights                     [Enabled]  │
│  ───────────────────────────                                │
│  Allow Murmurant to analyze your club's metrics and         │
│  provide personalized recommendations for improvement.      │
│                                                             │
│  Benchmark Participation                         [Enabled]  │
│  ───────────────────────────                                │
│  Contribute anonymized metrics to help benchmark clubs      │
│  of similar size and type. Your club name and member        │
│  data are never shared.                                     │
│                                                             │
│  In return, you'll see how your club compares to others.    │
│                                                             │
│  Currently benchmarking against 47 similar clubs            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Competitive Moat

This creates a **network effect**:

- More customers → better benchmarks → more valuable insights
- Customers who opt in get value they can't get elsewhere
- Benchmarks improve as we learn what "good" looks like
- Advisory insights get smarter with more data

Competitors would need to:

1. Build the same metrics infrastructure
2. Acquire enough customers to make benchmarks meaningful
3. Develop the same institutional knowledge about what works

---

## Open Questions

1. **How much to show free vs. paid?**
   - Recommendation: Basic health score free, detailed benchmarks paid

2. **AI-powered insights?**
   - Recommendation: Start rules-based, add AI later

3. **Real-time vs. batch?**
   - Recommendation: Daily batch for metrics, real-time for GA4 events

4. **Expose via API?**
   - Recommendation: Yes for advisory clients who want to build on top

---

_Backlog spec version 1.0 - Created 2025-12-29_
