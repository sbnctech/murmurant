<!--
  Copyright © 2025 Murmurant, Inc. All rights reserved.

  DRAFT — Requires legal review before publication
-->

# Terms of Service: Analytics & Service Improvement

## Draft Language for Legal Review

The following sections should be incorporated into murmurant's Terms of Service. This language covers our collection and use of aggregated usage data.

---

### Section: How We Help You Succeed

**Purpose statement (for plain-language summary):**

> We want your club to thrive. To help you get better results, we monitor how
> clubs use murmurant and what outcomes they achieve. This helps us improve
> our product and give you personalized recommendations. We never sell your
> data or share information that identifies your club or members.

---

### Section: Service Analytics

**Draft legal language:**

#### 1. Product Usage Data

To provide and improve our Services, we automatically collect information about how you and your members interact with murmurant, including:

- Feature usage patterns (which tools you use, how often)
- Performance metrics (page load times, error rates)
- Aggregate engagement statistics (event attendance rates, renewal rates, member activity levels)

This data helps us:

- Identify and fix technical issues
- Understand which features are most valuable
- Prioritize improvements to the platform

#### 2. Personalized Insights & Recommendations

With your consent, we analyze your club's metrics to provide personalized recommendations for improving member engagement, retention, and satisfaction. These insights are based on:

- Your club's performance over time
- Patterns we've observed across our customer base
- Best practices from high-performing clubs

You can enable or disable personalized insights at any time in your account settings.

#### 3. Benchmarking Services

If you opt in to our benchmarking program, we include your club's anonymized, aggregated metrics in comparative analyses. This allows us to show you how your club performs relative to similar organizations.

**What we share in benchmarks:**

- Statistical summaries (percentiles, averages) across groups of similar clubs
- Your club's position relative to these summaries

**What we never share:**

- Your club's name or identifying information
- Individual member data
- Your specific metrics with other customers

Benchmarking requires a minimum number of participating clubs in each comparison group to prevent identification. You can opt out of benchmarking at any time.

#### 4. Aggregate & Anonymized Research

We may use aggregated, anonymized data from across our customer base to:

- Publish industry research and reports
- Develop new features and services
- Train machine learning models to improve our recommendations

This data is stripped of any information that could identify your club or members. We do not sell access to your data.

#### 5. Your Data Controls

You have control over how we use your data:

| Data Type | Your Control |
|-----------|--------------|
| Essential product analytics | Required for service operation |
| Personalized insights | Opt-in; disable anytime |
| Benchmark participation | Opt-in; disable anytime |
| Third-party analytics (your GA4) | You configure; we never access |

To adjust these settings, visit Settings → Analytics & Insights.

---

### Section: Third-Party Analytics (Your Google Analytics)

If you choose to connect your own Google Analytics property, we transmit event data directly to your account. We do not:

- Access your Google Analytics data
- Store data sent to your analytics property
- Use your analytics data for our purposes

Your Google Analytics data is governed by your agreement with Google, not these Terms.

---

### Section: Data Retention

| Data Type | Retention Period |
|-----------|------------------|
| Product usage logs | 90 days |
| Aggregated club metrics | Duration of your account + 1 year |
| Anonymized benchmark data | Indefinitely (cannot be linked to you) |

Upon account termination, we delete your identifiable data within 30 days. Anonymized data that has already been aggregated into benchmarks cannot be removed, as it is no longer associated with your account.

---

## Plain-Language Summary (For UI/Onboarding)

For use in settings pages, onboarding flows, or help documentation:

```
┌─────────────────────────────────────────────────────────────┐
│  How Murmurant Uses Data to Help You                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  We're committed to helping your club succeed. Here's how   │
│  we use data to make that happen:                           │
│                                                             │
│  * Product improvement                                      │
│    We monitor how clubs use murmurant so we can fix bugs,   │
│    improve features, and build what you need most.          │
│                                                             │
│  * Personalized recommendations (opt-in)                    │
│    We analyze your club's metrics to suggest ways to        │
│    improve engagement, retention, and member satisfaction.  │
│                                                             │
│  * Benchmarking (opt-in)                                    │
│    See how your club compares to similar organizations.     │
│    Your identity is never revealed to other clubs.          │
│                                                             │
│  What we DON'T do:                                          │
│    - Sell your data                                         │
│    - Share your club's identity with other customers        │
│    - Access your members' personal information for          │
│      purposes unrelated to running your club                │
│                                                             │
│  [Manage Data Settings]                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Consent Flow (For Settings UI)

```
┌─────────────────────────────────────────────────────────────┐
│  Analytics & Insights                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Essential Analytics                              [Always On]│
│  ─────────────────                                          │
│  Basic usage data that helps us keep murmurant running      │
│  smoothly. Required for service operation.                  │
│                                                             │
│  Personalized Insights                            [Enabled ▼]│
│  ─────────────────────                                      │
│  Let us analyze your club's performance and provide         │
│  customized recommendations to help you improve.            │
│                                                             │
│  What you get:                                              │
│  - Health score and trend tracking                          │
│  - Alerts when key metrics need attention                   │
│  - Specific suggestions based on your club's patterns       │
│                                                             │
│  Benchmark Comparisons                            [Enabled ▼]│
│  ─────────────────────                                      │
│  Contribute anonymized metrics to see how your club         │
│  compares to similar organizations.                         │
│                                                             │
│  What you get:                                              │
│  - See where you rank on key metrics                        │
│  - Learn what "good" looks like for clubs your size         │
│  - Identify your biggest opportunities for improvement      │
│                                                             │
│  Your club name and member data are never shared with       │
│  other customers.                                           │
│                                                             │
│  ────────────────────────────────────────────────────────── │
│  Full details in our Terms of Service and Privacy Policy    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Messaging Principles

When writing about data collection:

| Instead of... | Say... |
|---------------|--------|
| "We monitor your activity" | "We track how clubs use features" |
| "We collect data about you" | "We gather insights to help you improve" |
| "Data collection" | "Usage analytics" or "performance metrics" |
| "We analyze your behavior" | "We identify patterns that drive success" |
| "Your data helps us" | "This helps us help you" |
| "We retain data" | "We keep metrics to show your progress over time" |
| "We may share aggregated data" | "We compare anonymized statistics across clubs" |

### Framing

Always frame data use in terms of **value to the customer**:

- Bad: "We need this data to improve our product"
- Good: "This helps us build features you'll love"

- Bad: "We analyze your metrics"
- Good: "We provide insights to help your club thrive"

- Bad: "Your anonymized data is included in benchmarks"
- Good: "See how you compare to similar clubs"

---

## Legal Review Checklist

Before publishing, legal should verify:

- [ ] Complies with GDPR (if serving EU customers)
- [ ] Complies with CCPA (California customers)
- [ ] Clear distinction between required vs. opt-in data
- [ ] Accurate description of what's anonymized vs. identifiable
- [ ] Retention periods are defensible
- [ ] Right to deletion is properly scoped
- [ ] Benchmark program consent is freely given, specific, informed
- [ ] No dark patterns in consent UI
- [ ] Links to full Terms and Privacy Policy

---

## File Placement

This language should be incorporated into:

1. **Terms of Service** — Legal terms (binding)
2. **Privacy Policy** — Data handling details
3. **Help Center** — Plain-language explanation
4. **Onboarding flow** — Consent collection
5. **Settings UI** — Ongoing control
