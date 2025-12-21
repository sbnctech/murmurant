# ClubOS Delivery Model, Pricing, and Tiers

Status: Internal Planning Document
Audience: Strategy, Product, Operations
Last Updated: 2025-12-21

This document defines how ClubOS packages reliability, support, and
governance capabilities into distinct service tiers. It is not a
price list. It is a framework for deciding what belongs where.

---

## 1. Core Customer Personas

### 1.1 Volunteer Admin

**Profile:** Unpaid volunteer managing membership for a local club.
Typically rotating role with 1-2 year tenure. Limited technical
background. Uses the system during evenings and weekends.

**Primary Goals:**
- Keep member records accurate enough for events
- Avoid embarrassing the club publicly
- Hand off cleanly to successor

**Failure Sensitivity:** HIGH
- Cannot debug issues themselves
- Cannot tolerate ambiguity in system behavior
- Will abandon the system before learning workarounds

**Operational Maturity:** LOW
- No change management process
- No backup verification habits
- No incident response experience

**Risk Profile:**
Volunteer admins create risk through well-intentioned mistakes.
They need guardrails, not training. They will not read documentation.


### 1.2 Professional Operator

**Profile:** Paid staff member (part-time or full-time) responsible
for membership operations. Accountable to executive director or board.
Uses the system during business hours. May manage multiple tools.

**Primary Goals:**
- Maintain accurate records for reporting
- Process renewals and applications efficiently
- Support audit and compliance requests

**Failure Sensitivity:** MEDIUM
- Can tolerate brief outages with communication
- Will escalate unresolved issues appropriately
- Expects recovery within defined timeframes

**Operational Maturity:** MEDIUM
- Has basic change management habits
- Understands backup importance (may not verify)
- Can follow incident procedures if provided

**Risk Profile:**
Professional operators create risk through process gaps, not ignorance.
They need visibility, not hand-holding. They will read documentation
if it is concise and actionable.


### 1.3 Enterprise Organization

**Profile:** Large nonprofit, professional association, or federated
organization with board oversight, audit requirements, and regulatory
exposure. Multiple staff roles. Formal governance structure.

**Primary Goals:**
- Demonstrate fiduciary compliance
- Maintain auditable records indefinitely
- Support organizational continuity across leadership changes

**Failure Sensitivity:** LOW (for incidents), HIGH (for compliance)
- Can tolerate planned downtime with advance notice
- Cannot tolerate audit failures or data loss
- Expects contractual SLAs with consequences

**Operational Maturity:** HIGH
- Has formal change approval processes
- Has disaster recovery requirements
- Has incident response expectations

**Risk Profile:**
Enterprise organizations create risk through complexity and scale.
They need contractual accountability, not just features. They will
negotiate terms and expect vendor partnership.

---

## 2. Capability Maturity Tiers

### 2.1 Starter

**Who It Is For:**
Small clubs (under 200 members) with volunteer-only operations.
No paid staff. No board-level compliance requirements.

**Reliability Guarantees:**
- System availability target: best-effort
- Data durability: standard backups, self-service restore
- Support: community and documentation only
- Incident response: none guaranteed

**Explicitly Excluded:**
- Dedicated support contact
- Assisted data recovery
- Custom policy configuration
- Audit log exports
- Uptime SLA


### 2.2 Managed

**Who It Is For:**
Mid-size organizations (200-2000 members) with at least one paid
operator. Need predictable operations but not formal compliance.

**Reliability Guarantees:**
- System availability target: 99.5% monthly
- Data durability: daily backups, assisted restore on request
- Support: email support with 48-hour response target
- Incident response: status page updates, post-incident summary

**Explicitly Excluded:**
- Phone support
- Custom SLA terms
- Change approval workflows
- Dedicated account management
- On-call escalation


### 2.3 Governed

**Who It Is For:**
Organizations with board oversight, audit requirements, or regulatory
exposure. Need demonstrable controls and recovery capabilities.

**Reliability Guarantees:**
- System availability target: 99.9% monthly (SLA with credits)
- Data durability: hourly backups, point-in-time recovery
- Support: priority email and scheduled calls
- Incident response: dedicated communication, root cause analysis

**Includes:**
- Audit log retention (configurable)
- Change approval workflows (optional)
- Annual compliance review call
- Designated account contact

**Explicitly Excluded:**
- 24/7 on-call support
- Custom integrations
- Dedicated infrastructure
- Legal indemnification beyond standard terms


### 2.4 Enterprise

**Who It Is For:**
Large organizations requiring contractual accountability, custom
terms, and vendor partnership. Typically 5000+ members or federated
structures with chapter/affiliate relationships.

**Reliability Guarantees:**
- System availability: negotiated SLA with financial consequences
- Data durability: custom retention, dedicated backup verification
- Support: named contacts, defined escalation paths
- Incident response: joint review, remediation planning

**Includes:**
- Custom policy enforcement
- Integration support
- Quarterly business reviews
- Executive escalation path
- Contract negotiation

**Explicitly Excluded:**
- On-premise deployment
- Source code access
- Unlimited customization
- Liability beyond negotiated caps

---

## 3. Capabilities That Drive Tier Separation

The following capabilities justify tier differentiation because they
require human judgment, specialized expertise, or ongoing labor.

### 3.1 Audit Depth

| Tier | Capability |
|------|------------|
| Starter | 30-day activity log, self-service view |
| Managed | 1-year activity log, CSV export |
| Governed | Configurable retention, API access, tamper evidence |
| Enterprise | Custom retention, legal hold, third-party audit support |

**Why It Matters:** Audit depth requires storage, indexing, and
expertise to interpret. Shallow audit is a feature; deep audit is
a service.


### 3.2 Restore Assistance

| Tier | Capability |
|------|------------|
| Starter | Self-service restore from last backup |
| Managed | Assisted restore with 48-hour turnaround |
| Governed | Priority restore with 4-hour turnaround |
| Enterprise | Point-in-time recovery with dedicated support |

**Why It Matters:** Restore requires human verification to avoid
making problems worse. Speed and accuracy require expertise and
availability.


### 3.3 Incident Response Involvement

| Tier | Capability |
|------|------------|
| Starter | Status page only |
| Managed | Status page plus email summary |
| Governed | Proactive notification, root cause analysis |
| Enterprise | Joint incident review, remediation planning |

**Why It Matters:** Incident communication is labor-intensive and
high-stakes. Organizations pay for reduced uncertainty, not just
faster fixes.


### 3.4 Custom Policy Enforcement

| Tier | Capability |
|------|------------|
| Starter | Default policies only |
| Managed | Configurable policies from preset options |
| Governed | Custom policies with review |
| Enterprise | Custom policies with ongoing enforcement support |

**Why It Matters:** Policy enforcement requires understanding the
customer's governance model. Misconfigured policies create liability.


### 3.5 Change Approval Workflows

| Tier | Capability |
|------|------------|
| Starter | Not available |
| Managed | Not available |
| Governed | Optional, self-configured |
| Enterprise | Custom workflows, integration with existing tools |

**Why It Matters:** Change approval is organizational overhead that
only mature organizations can use effectively. Forcing it on smaller
customers creates friction without benefit.

---

## 4. Pricing Anchors (Non-Numeric)

### 4.1 Starter

**What Customers Are Paying For:**
Access to a working system with reasonable defaults. No human
involvement expected. Self-service is the contract.

**Risk Transferred to Vendor:**
Minimal. Customer accepts responsibility for their own operations.
Vendor provides tools, not outcomes.

**Labor Included:**
None beyond system operation. Documentation is the support model.


### 4.2 Managed

**What Customers Are Paying For:**
Predictable operations with a human backstop. Someone will respond
if things go wrong. Recovery is possible, not just theoretical.

**Risk Transferred to Vendor:**
Moderate. Vendor commits to response times and recovery capability.
Customer retains operational responsibility.

**Labor Included:**
Reactive support (email). Periodic backup verification. Incident
summarization. Approximately 1-2 hours/month average.


### 4.3 Governed

**What Customers Are Paying For:**
Demonstrable controls for board and auditor consumption. Evidence
that the vendor takes reliability seriously. Partnership, not just
service.

**Risk Transferred to Vendor:**
Significant. Vendor commits to SLA with consequences. Vendor provides
evidence of compliance controls. Audit failures reflect on vendor.

**Labor Included:**
Proactive support. Compliance review. Root cause analysis. Account
relationship. Approximately 4-8 hours/month average.


### 4.4 Enterprise

**What Customers Are Paying For:**
Contractual accountability with negotiated terms. Vendor becomes a
partner in organizational risk management. Executive-level relationship.

**Risk Transferred to Vendor:**
Substantial. Vendor accepts contractual liability within negotiated
limits. Vendor commits to remediation, not just recovery.

**Labor Included:**
Named account management. Custom integration support. Quarterly
reviews. Executive escalation. Variable, typically 10-20 hours/month.

---

## 5. Why Reliability Is a Revenue Feature

Reliability is not overhead. It is the core product for organizations
that cannot afford failure.

### 5.1 Human Review Is Valuable

Automated systems can detect problems. Humans must decide what to do.

- Automated alerts are cheap
- Human triage is expensive
- Human judgment is what customers pay for

Organizations pay for someone to care about their problem, not just
acknowledge it.


### 5.2 Incident Discipline Is Rare

Most vendors treat incidents as embarrassments to minimize. Mature
vendors treat incidents as opportunities to demonstrate competence.

- Status page updates show transparency
- Root cause analysis shows accountability
- Remediation planning shows partnership

Organizations pay for reduced uncertainty during incidents, which
requires discipline and communication skills.


### 5.3 Recovery Readiness Is Invisible Until Needed

Backup systems are cheap. Tested recovery procedures are expensive.

- Untested backups are worthless
- Verified recovery takes ongoing labor
- Fast recovery requires practice

Organizations pay for confidence that recovery will work, which
requires regular investment in verification.


### 5.4 Monetization Implications

| Capability | Cost Structure | Revenue Potential |
|------------|---------------|-------------------|
| Automated monitoring | Fixed (low) | Baseline, not premium |
| Human triage | Variable (labor) | Premium, scales with urgency |
| Incident communication | Variable (skill) | Premium, scales with stakes |
| Recovery verification | Fixed (ongoing) | Premium, hard to commoditize |
| Compliance evidence | Variable (expertise) | Premium, high switching cost |

Reliability revenue scales with customer risk tolerance and
operational maturity, not member count.

---

## 6. Guardrails

### 6.1 What Should Never Be Discounted

- **Data recovery assistance.** Recovery labor is real. Discounting
  it signals that we do not value the expertise required.

- **Incident response involvement.** Human attention during crisis
  is scarce. Discounting it creates unsustainable expectations.

- **Audit log retention.** Storage and indexing have real costs.
  Discounting suggests we will cut corners on durability.

- **SLA commitments.** SLAs with credits require investment in
  reliability. Discounting them without reducing commitments is
  unsustainable.


### 6.2 What Should Never Be Bundled Into Low Tiers

- **Change approval workflows.** Organizations that need them can
  pay for them. Organizations that do not need them will be confused.

- **Custom policy enforcement.** Requires human review and ongoing
  attention. Cannot be automated safely.

- **Dedicated account contact.** Creates expectation of relationship.
  Cannot be delivered at scale without investment.

- **Contractual SLAs.** Legal commitments require operational
  investment. Cannot be offered without infrastructure.


### 6.3 What Would Damage Trust If Mispriced

- **Charging for basic data access.** Customers own their data.
  Charging for export creates hostage dynamics.

- **Charging for security updates.** Security is table stakes.
  Tiering security creates perverse incentives.

- **Charging for incident notification.** Customers deserve to know
  when something is wrong. Hiding incidents behind paywalls is
  unethical.

- **Charging for backup existence.** Backups are baseline durability.
  Charging for their existence suggests we would not otherwise
  protect data.

---

## 7. What We Will Not Sell As Self-Service

The following capabilities require human involvement and cannot be
safely automated or self-provisioned:

1. **Point-in-time recovery.** Requires understanding of what went
   wrong and when. Customer cannot safely choose restore point
   without guidance.

2. **Custom policy configuration.** Requires understanding of
   customer's governance model. Misconfiguration creates liability.

3. **Audit evidence packages.** Requires understanding of what
   auditors need. Incorrect evidence is worse than no evidence.

4. **Incident root cause analysis.** Requires engineering expertise.
   Automated summaries are insufficient for accountability.

5. **Data migration from other systems.** Requires validation of
   data integrity. Automated imports create garbage-in problems.

6. **Compliance attestation.** Requires human review of controls.
   Automated compliance is not compliance.

7. **Contract negotiation.** Requires legal and business judgment.
   Self-service contracts create unmanageable risk.

These capabilities are sold as services, not features. They require
conversation before commitment.

---

*This document is for internal planning. It is not a customer-facing
price list or feature comparison. Pricing decisions require review
of market positioning, competitive dynamics, and unit economics not
covered here.*

---

## See Also

- [Reliability and Delivery Synthesis](./RELIABILITY_AND_DELIVERY_SYNTHESIS.md) - Board-ready summary
- [Delivery Model Strategy](./DELIVERY_MODEL_STRATEGY.md) - Solutions-led rationale
- [Readiness Gaps](./reliability/READINESS_GAPS_AND_RISK_ACCEPTANCE.md) - Risk acceptance framework
- [Work Queue](./backlog/WORK_QUEUE.md) - Implementation priorities
- [Solutions Intake Bundle](./solutions/INTAKE_DELIVERABLE_BUNDLE.md) - Client onboarding artifacts
- [Priced Engagement Blueprint](./solutions/PRICED_ENGAGEMENT_READINESS_BLUEPRINT.md) - Discovery phase structure
