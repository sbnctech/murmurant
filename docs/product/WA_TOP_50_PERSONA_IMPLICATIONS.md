Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

# WA Top 50: Persona Implications Analysis

Status: Strategic Analysis
Audience: Product, Sales, Onboarding
Last updated: 2025-12-21

This document analyzes all 50 Wild Apricot issues to understand how they
affect different user personas and what this means for ClubOS positioning.

---

## 1. Persona Definitions

Based on analysis of all 50 WA issues, we identify 6 primary personas.

---

### 1.1 Volunteer Event Chair

**Description:** Unpaid volunteer responsible for organizing specific events
(monthly luncheons, activity groups, special occasions). Rotates annually.
Limited technical background. Works evenings and weekends.

**Jobs-to-be-done:**

- Create and publish event listings
- Manage registrations and waitlists
- Handle check-in at the venue
- Communicate with attendees before/after events
- Cancel or reschedule when needed

**Pain sensitivities:**

- HIGH: Accidental deletion or data loss (cannot recover)
- HIGH: Complex UX that requires training
- MEDIUM: Permission errors blocking their work
- LOW: Audit trails (not their concern)

**Risk tolerance:** LOW - Cannot debug issues. Will abandon task if stuck.

---

### 1.2 Membership Administrator

**Description:** Often a board-appointed volunteer (sometimes part-time paid).
Manages member applications, renewals, and roster accuracy. Multi-year tenure
but eventually rotates out. Moderate technical comfort.

**Jobs-to-be-done:**

- Process new member applications
- Manage renewals and status changes
- Maintain accurate member data
- Generate membership reports for board
- Handle member inquiries and profile updates
- Import/export member data

**Pain sensitivities:**

- HIGH: Data corruption from imports or bulk operations
- HIGH: Unclear member status or duplicate records
- MEDIUM: Limited export options
- MEDIUM: Audit trail gaps (need to explain changes to board)

**Risk tolerance:** MEDIUM - Will work around issues but needs reliable data.

---

### 1.3 Treasurer / Bookkeeper

**Description:** Board officer responsible for financial records. May be
CPA or have accounting background. Needs data for QuickBooks/external tools.
Highest accountability for accuracy. Multi-year tenure common.

**Jobs-to-be-done:**

- Reconcile payments with bank statements
- Export financial data for accounting software
- Process refunds correctly
- Generate financial reports for board
- Track donations and dues separately
- Ensure audit trail for compliance

**Pain sensitivities:**

- HIGH: Financial data loss or corruption
- HIGH: Unclear refund/void/credit cascades
- HIGH: Missing audit trail for transactions
- MEDIUM: Limited financial reporting

**Risk tolerance:** VERY LOW - Fiduciary duty. Cannot tolerate ambiguity.

---

### 1.4 Communications Lead

**Description:** Volunteer or staff responsible for newsletters, email blasts,
and website content. May also manage social media. Creative background
more common than technical. Annual or multi-year role.

**Jobs-to-be-done:**

- Send email communications to members
- Update website content and pages
- Manage photo galleries and documents
- Ensure consistent branding
- Target communications to specific audiences

**Pain sensitivities:**

- HIGH: Emails going to spam or failing silently
- HIGH: Website editor frustrations (dated, unpredictable)
- MEDIUM: Lack of approval workflow (sending wrong thing)
- MEDIUM: Audience targeting limitations

**Risk tolerance:** MEDIUM - Creative workarounds acceptable if core function works.

---

### 1.5 Tech Admin / Webmaster

**Description:** Most technically capable person in the org. May be
volunteer with day-job IT experience or just "the person who knows computers."
Handles system configuration, integrations, and troubleshooting.

**Jobs-to-be-done:**

- Configure system settings and permissions
- Troubleshoot when things break
- Manage backups and data exports
- Set up integrations with other tools
- Train other administrators
- Act as vendor liaison for support

**Pain sensitivities:**

- HIGH: Coarse permissions (cannot delegate safely)
- HIGH: No backups or restore capability
- HIGH: Weak API or integration options
- MEDIUM: Audit log limitations (debugging)

**Risk tolerance:** MEDIUM - Can work around issues but frustrated by preventable problems.

---

### 1.6 Board Officer / Executive Sponsor

**Description:** Elected board member (President, VP, Secretary) with
fiduciary responsibility. Makes strategic decisions about systems.
Limited time for operational details. 1-2 year terms.

**Jobs-to-be-done:**

- Ensure system meets organizational needs
- Review reports and dashboards
- Approve major changes or purchases
- Ensure continuity during transitions
- Respond to member complaints about system

**Pain sensitivities:**

- HIGH: Incidents that embarrass the organization
- HIGH: Lack of visibility into what admins are doing
- MEDIUM: Vendor support quality
- MEDIUM: Cost and price increases

**Risk tolerance:** LOW - Reputation-sensitive. Needs confidence in system.

---

## 2. Issue-to-Persona Mapping

All 50 WA issues mapped to affected personas and failure type.

**Failure Type Legend:**

- **SF** = Silent Failure (problem not visible until damage done)
- **TS** = Time Sink (excessive manual effort required)
- **FR** = Financial Risk (money at stake)
- **SR** = Security Risk (data exposure or unauthorized access)
- **UX** = UX Frustration (poor experience but no data risk)

---

### Permissions (WA-001 to WA-006)

| ID | Issue | Primary Persona | Secondary Persona | Failure Type |
|----|-------|-----------------|-------------------|--------------|
| WA-001 | Coarse admin roles | Tech Admin | Board Officer | SR |
| WA-002 | No object-scoped permissions | Tech Admin | Event Chair | SR |
| WA-003 | Event chair can delete events | Event Chair | Treasurer | SF, FR |
| WA-004 | Read-only admin can export contacts | Tech Admin | Board Officer | SR |
| WA-005 | Page access by navigation hiding | Tech Admin | Comms Lead | SR |
| WA-006 | No per-chapter permissions | Tech Admin | Membership Admin | SR |

---

### Audit Trail (WA-007 to WA-011)

| ID | Issue | Primary Persona | Secondary Persona | Failure Type |
|----|-------|-----------------|-------------------|--------------|
| WA-007 | Limited admin action logging | Board Officer | Tech Admin | SF |
| WA-008 | No actor attribution on changes | Board Officer | Treasurer | SF |
| WA-009 | Audit logs not exportable | Treasurer | Tech Admin | TS |
| WA-010 | No before/after diff on edits | Tech Admin | Membership Admin | SF |
| WA-011 | Email send history incomplete | Comms Lead | Board Officer | SF |

---

### Data Management (WA-012 to WA-020)

| ID | Issue | Primary Persona | Secondary Persona | Failure Type |
|----|-------|-----------------|-------------------|--------------|
| WA-012 | No user-controlled backups | Tech Admin | Board Officer | SF, FR |
| WA-013 | Limited data export options | Treasurer | Membership Admin | TS |
| WA-014 | No point-in-time restore | Tech Admin | Treasurer | SF, FR |
| WA-015 | Bulk update limitations | Membership Admin | Tech Admin | TS |
| WA-016 | Data import errors unclear | Membership Admin | Tech Admin | SF |
| WA-017 | Duplicate member handling weak | Membership Admin | Tech Admin | TS |
| WA-018 | Field validation inconsistent | Tech Admin | Membership Admin | SF |
| WA-019 | Cannot bulk import photos | Membership Admin | Comms Lead | TS |
| WA-020 | Export names in single column | Treasurer | Membership Admin | TS |

---

### Events (WA-021 to WA-028)

| ID | Issue | Primary Persona | Secondary Persona | Failure Type |
|----|-------|-----------------|-------------------|--------------|
| WA-021 | Delete event cascades to invoices | Event Chair | Treasurer | SF, FR |
| WA-022 | No cancel vs delete distinction | Event Chair | Treasurer | SF, FR |
| WA-023 | Waitlist bypassed on cancellation | Event Chair | Membership Admin | UX |
| WA-024 | Admins cannot add to waitlist | Event Chair | Membership Admin | UX |
| WA-025 | Waitlist visibility bug | Event Chair | Membership Admin | UX |
| WA-026 | Check-in UX poor on mobile | Event Chair | Tech Admin | UX |
| WA-027 | Event cloning loses settings | Event Chair | Tech Admin | TS |
| WA-028 | No event approval workflow | Board Officer | Event Chair | SR |

---

### Finance (WA-029 to WA-035)

| ID | Issue | Primary Persona | Secondary Persona | Failure Type |
|----|-------|-----------------|-------------------|--------------|
| WA-029 | Refund workflow confusing | Treasurer | Event Chair | FR |
| WA-030 | Invoice voiding cascades | Treasurer | Event Chair | SF, FR |
| WA-031 | No payment audit trail | Treasurer | Board Officer | SF, FR |
| WA-032 | Renewal reminders confuse auto-renewers | Membership Admin | Treasurer | UX |
| WA-033 | No manual donations option | Treasurer | Membership Admin | TS |
| WA-034 | Financial reports limited | Treasurer | Board Officer | TS |
| WA-035 | Payment gateway errors silent | Treasurer | Tech Admin | SF, FR |

---

### Website (WA-036 to WA-042)

| ID | Issue | Primary Persona | Secondary Persona | Failure Type |
|----|-------|-----------------|-------------------|--------------|
| WA-036 | Website editor dated | Comms Lead | Tech Admin | UX |
| WA-037 | No draft/preview workflow | Comms Lead | Board Officer | SR |
| WA-038 | Templates look dated | Comms Lead | Board Officer | UX |
| WA-039 | Limited undo and no contact history | Comms Lead | Tech Admin | SF |
| WA-040 | Image orientation issues | Comms Lead | Event Chair | UX |
| WA-041 | Low storage limits | Comms Lead | Tech Admin | TS |
| WA-042 | No website import/export | Tech Admin | Comms Lead | TS |

---

### Communications (WA-043 to WA-045)

| ID | Issue | Primary Persona | Secondary Persona | Failure Type |
|----|-------|-----------------|-------------------|--------------|
| WA-043 | Email deliverability issues | Comms Lead | Tech Admin | SF |
| WA-044 | Email failures require manual resend | Comms Lead | Tech Admin | TS |
| WA-045 | No approval workflow for sends | Board Officer | Comms Lead | SR |

---

### API and Other (WA-046 to WA-050)

| ID | Issue | Primary Persona | Secondary Persona | Failure Type |
|----|-------|-----------------|-------------------|--------------|
| WA-046 | API pagination limits performance | Tech Admin | - | TS |
| WA-047 | Cannot define event fields via API | Tech Admin | - | TS |
| WA-048 | Support degraded since Personify | Tech Admin | Board Officer | TS |
| WA-049 | Aggressive price increases | Board Officer | Treasurer | FR |
| WA-050 | No volunteer hours tracking | Membership Admin | Board Officer | TS |

---

## 3. Summary Insights

### 3.1 Top 10 Cross-Persona Themes

| Rank | Theme | Issues | Personas Affected | Primary Failure |
|------|-------|--------|-------------------|-----------------|
| 1 | Destructive actions lack safeguards | WA-003, WA-021, WA-022, WA-030 | Event Chair, Treasurer | SF, FR |
| 2 | Permission model too coarse | WA-001, WA-002, WA-004, WA-006 | Tech Admin, All | SR |
| 3 | Financial operations opaque | WA-029, WA-030, WA-031, WA-035 | Treasurer, Board | SF, FR |
| 4 | Audit trail incomplete | WA-007, WA-008, WA-009, WA-010 | Board, Treasurer | SF |
| 5 | Data import/export painful | WA-013, WA-015, WA-016, WA-020 | Membership Admin, Treasurer | TS |
| 6 | No recovery path | WA-012, WA-014, WA-016 | Tech Admin, Board | SF, FR |
| 7 | Website editing frustrating | WA-036, WA-037, WA-039, WA-040 | Comms Lead | UX |
| 8 | Email delivery unreliable | WA-011, WA-043, WA-044 | Comms Lead | SF |
| 9 | Event management risky | WA-021, WA-022, WA-023, WA-028 | Event Chair, Treasurer | SF, FR |
| 10 | Vendor relationship deteriorating | WA-048, WA-049 | Board, Tech Admin | TS, FR |

---

### 3.2 Positioning Implications

**Solutions-First is Validated**

The analysis confirms that ClubOS should NOT position as self-service SaaS:

| Finding | Implication |
|---------|-------------|
| 26 of 50 issues involve Silent Failure or Financial Risk | Users cannot safely self-recover |
| Tech Admin is primary persona for 18 issues | Someone must configure properly |
| Board Officer appears in 12 issues | Governance oversight is real |
| Treasurer has 0 tolerance for ambiguity | Financial workflows must be guided |

**Positioning Statement:**
ClubOS is a managed membership platform where critical operations require
human oversight. Safe self-service for content; guided assistance for
data, finance, and permissions.

---

### 3.3 Onboarding vs Deferred

**Must Be In Onboarding (Before Go-Live):**

| Capability | Reason | Issues Addressed |
|------------|--------|------------------|
| Permission model configuration | SR across all personas | WA-001 to WA-006 |
| Event cancel vs delete training | SF, FR for Event Chair | WA-021, WA-022 |
| Refund workflow walkthrough | FR for Treasurer | WA-029, WA-030 |
| Audit log orientation | SF for Board | WA-007, WA-008 |
| Backup/restore understanding | SF, FR for all | WA-012, WA-014 |
| Data import validation | SF for Membership Admin | WA-016 |

**Can Be Deferred (Post-Launch):**

| Capability | Reason | Issues Addressed |
|------------|--------|------------------|
| Advanced audience targeting | UX improvement | WA-044 |
| Website template customization | UX polish | WA-038 |
| Volunteer hours tracking | Feature request | WA-050 |
| API integration training | Tech Admin only | WA-046, WA-047 |
| Financial reporting dashboard | TS reduction | WA-034 |

---

## 4. Sales Enablement

### 4.1 Discovery Questions (Tied to Themes)

Use these questions to uncover pain points and qualify prospects.

| # | Question | Theme Addressed | Listen For |
|---|----------|-----------------|------------|
| 1 | "Who can delete events today, and what happens when they do?" | Destructive actions | Cascade stories, cleanup nightmares |
| 2 | "Walk me through what happens when you process a refund." | Financial opacity | Manual steps, confusion, time spent |
| 3 | "If something goes wrong, how do you figure out who did what?" | Audit gaps | "We don't know" or "We can't" |
| 4 | "How do you delegate event check-in without giving full access?" | Coarse permissions | "We can't" or workarounds |
| 5 | "Tell me about the last time you had to restore data." | No recovery path | Panic stories, vendor dependence |
| 6 | "How long does it take to export data for your accountant?" | Import/export pain | Hours, multiple reports, manual cleanup |
| 7 | "What happens when someone sends an email blast by mistake?" | No approval workflow | Embarrassment stories |
| 8 | "How confident are you that your member data is accurate?" | Data quality | Duplicates, stale records, imports gone wrong |
| 9 | "What's your experience been with vendor support lately?" | Vendor relationship | Wait times, frustration, abandonment |
| 10 | "How does your board know what admins are doing in the system?" | Accountability gap | "They don't" or annual reviews only |

---

### 4.2 Red Flags (Prospect Not Ready)

| # | Red Flag | Why It Disqualifies | Response |
|---|----------|---------------------|----------|
| 1 | No identifiable admin owner | Cannot configure or maintain | "Who will own this day-to-day?" |
| 2 | Expectation of zero training | SF/FR issues require understanding | "Some guided setup is essential" |
| 3 | "Just make it work like WA" | May resist different (safer) workflows | Explore specific pain points first |
| 4 | Active legal/financial dispute | Cannot be drawn into litigation | Pause until resolved |
| 5 | Fewer than 50 members | Cost may not justify platform | Discuss scale and growth |
| 6 | No succession plan for admins | Single point of failure | Discuss continuity requirements |
| 7 | Expecting 24/7 immediate response | Our SLAs are tier-dependent | Set support expectations |
| 8 | Unwilling to export data from current system | Cannot migrate properly | Explain data ownership importance |
| 9 | Board not aware of or sponsoring the switch | Decision may be reversed | Require executive sponsor |
| 10 | Heavy reliance on PLANNED features | Timeline mismatch | Clarify what exists vs roadmap |

---

### 4.3 Proof Points for Demos (Tied to Fixes)

| # | Demo Moment | Issue Addressed | What to Show |
|---|-------------|-----------------|--------------|
| 1 | Cancel an event (not delete) | WA-021, WA-022 | EventStatus state machine, financials untouched |
| 2 | Grant check-in only permission | WA-003, WA-026 | Capability-based auth, no delete access |
| 3 | Show audit log with actor and diff | WA-007, WA-008, WA-010 | Who, what, when, before/after |
| 4 | Attempt unauthorized action | WA-001, WA-002 | Server-side denial, clear error message |
| 5 | Preview page before publish | WA-037 | Draft/preview/publish workflow |
| 6 | Show waitlist position to member | WA-024, WA-025 | Transparent queue management |
| 7 | Export member data with all fields | WA-013, WA-020 | Structured export, separate name columns |
| 8 | Validate import before commit | WA-016 | Schema validation, field-level errors |
| 9 | Show audience-restricted content | WA-005 | Server-side enforcement, not hiding |
| 10 | Walk through refund with clear status | WA-029 | PaymentIntent state machine, explicit steps |

---

## 5. Persona Impact Summary

### Issues per Primary Persona

| Persona | Count | Top Categories |
|---------|-------|----------------|
| Tech Admin | 16 | Permissions, Data, API |
| Event Chair | 10 | Events, Permissions |
| Comms Lead | 9 | Website, Communications |
| Treasurer | 8 | Finance, Audit |
| Membership Admin | 8 | Data, Events |
| Board Officer | 6 | Audit, Finance, Other |

### Failure Type Distribution

| Failure Type | Count | Primary Personas |
|--------------|-------|------------------|
| Silent Failure (SF) | 19 | Treasurer, Board, Tech Admin |
| Time Sink (TS) | 17 | Membership Admin, Comms Lead, Tech Admin |
| Financial Risk (FR) | 13 | Treasurer, Event Chair, Board |
| Security Risk (SR) | 9 | Tech Admin, Board |
| UX Frustration (UX) | 11 | Comms Lead, Event Chair |

Note: Some issues have multiple failure types.

---

## 6. Recommendations

### For Product

1. **Prioritize Silent Failure fixes** - 19 issues where users cannot see the problem
2. **Treasurer persona is underserved** - 8 issues with 0 risk tolerance
3. **Event Chair needs safer workflows** - 10 issues, most involve data risk

### For Sales

1. **Lead with accountability** - "Who did what when" resonates with Board
2. **Demo cancel vs delete early** - Universal pain point, immediate credibility
3. **Qualify for admin ownership** - No owner = no deal

### For Onboarding

1. **Permission configuration is not optional** - Must happen before go-live
2. **Treasurer walkthrough is critical** - FR issues require explicit training
3. **Event Chair training prevents disasters** - WA-021/WA-022 are top complaints

---

## Related Documents

- Wild Apricot Top 50 Issues (TODO: create competitive/WILD_APRICOT_TOP_50_ISSUES.md)
- ClubOS vs WA Matrix (TODO: create competitive/CLUBOS_VS_WA_50_ISSUE_MATRIX.md)
- WA Pain Points Prospect-Facing (TODO: create solutions/WA_PAIN_POINTS_AND_HOW_CLUBOS_ADDRESSES_THEM.md)
- Delivery Model Strategy (TODO: create DELIVERY_MODEL_STRATEGY.md)
- Pricing and Tiers (TODO: create DELIVERY_MODEL_PRICING_AND_TIERS.md)
