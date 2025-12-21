# Wild Apricot Issues - SBNC Impact and ClubOS Remedies

Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

Status: Board-Ready Reference
Audience: Board, Officers, Committee Chairs
Last updated: 2025-12-21

---

## Purpose

This document maps 50 known Wild Apricot limitations to their specific
impact on SBNC operations, existing policy/training mitigations, and
how ClubOS product features eliminate the need for those mitigations.

---

## Case Study: The Event Deletion Cascade (December 2024)

### What Happened

An SBNC event was canceled and refunds were handled manually through
proper financial procedures. Later, when the event record was deleted
from Wild Apricot to "clean up" the calendar, WA automatically:

- Voided all invoices associated with that event
- Created duplicate credits on member accounts
- Required manual cleanup of financial records

### Why WA Allowed This

- WA permissions are coarse: anyone who can manage events can also delete them
- There is no "waitlist manager" or "check-in only" role
- Delete and Cancel are not distinguished in the interface
- WA did not warn about financial side effects before deletion

### SBNC Mitigation (Current)

- Training: "Never delete events; only cancel them"
- Policy: Only designated officers should touch event records after payments exist
- Manual: Finance team reviews credits monthly for anomalies

### ClubOS Remedy

- Cancel vs Delete are distinct operations with different permission requirements
- Deleting an event with financial history requires elevated approval
- Immutable audit log captures who did what and when
- A "waitlist manager" capability exists that cannot touch finances or delete

---

## How ClubOS Prevents "Every Chair Is an Admin"

### The WA Pattern

In Wild Apricot, the only way to give a committee chair useful access
is to make them a "limited administrator." But WA's admin roles are
coarse-grained:

- Event managers can delete events (financial side effects)
- Member editors can export all member data (privacy risk)
- Website editors can publish to public pages (reputation risk)

This leads to "everyone is an admin" because there is no middle ground.

### The SBNC Problem

- 20+ volunteers need some system access
- Each one represents a potential incident
- Training cannot cover every hidden WA behavior
- Audit trail does not reliably identify who did what

### ClubOS Approach: Capability-Based Permissions

ClubOS separates permissions into discrete capabilities:

| Role | Can Do | Cannot Do |
|------|--------|-----------|
| Event Check-In | Mark attendance | Change registrations, refund, delete |
| Waitlist Manager | Move people on/off waitlist | Change prices, issue refunds |
| Content Editor | Edit draft pages | Publish to public, delete pages |
| Member Viewer | See member directory | Export data, edit records |
| Committee Chair | Manage committee members | Access other committees, financials |

Each capability is independently granted. No one gets "admin" by default.

### ClubOS Approach: Audit Trail

Every privileged action creates an audit record:

- Who performed the action (not just "an admin")
- What changed (before and after values)
- When it happened (timestamp)
- Why it was allowed (which capability authorized it)

Audit records are immutable and retained for compliance review.

---

## Issue Catalog: 50 WA Limitations

### Permissions and Access Control

**WA-001: Coarse Admin Roles**

- SBNC Impact: Cannot give committee chairs limited access without exposing
  destructive capabilities. Every "admin" can accidentally break things.
- Current Mitigation: Training, hope, and incident response when things break.
- ClubOS Remedy: Granular capability-based permissions. Chairs get only what
  they need for their specific role.

**WA-002: No Role Inheritance or Hierarchy**

- SBNC Impact: When a chair changes, permissions must be manually removed
  from the old person and added to the new one. Steps are often missed.
- Current Mitigation: Annual audit of who has admin access (when remembered).
- ClubOS Remedy: Roles tied to positions. When someone leaves a position,
  their access automatically adjusts.

**WA-003: No Time-Limited Access**

- SBNC Impact: Temporary helpers (event day volunteers) get permanent access
  that is never revoked.
- Current Mitigation: Manual revocation (inconsistently performed).
- ClubOS Remedy: Time-boxed access grants that expire automatically.

**WA-004: No Separation of Test and Production**

- SBNC Impact: Testing new features requires using real member data.
  Mistakes affect actual members.
- Current Mitigation: Test carefully and fix mistakes manually.
- ClubOS Remedy: Separate test environment with synthetic data.

**WA-005: API Keys Are All-or-Nothing**

- SBNC Impact: Any script that reads member data can also modify it.
  A bug can corrupt the database.
- Current Mitigation: Careful script development, limited script use.
- ClubOS Remedy: Scoped API tokens with read-only or write-limited permissions.

---

### Audit and Accountability

**WA-006: Weak Audit Trail**

- SBNC Impact: When something goes wrong, we cannot reliably determine
  who did it. Accountability is impossible.
- Current Mitigation: Ask around, check email timestamps, guess.
- ClubOS Remedy: Immutable audit log with actor attribution for all
  privileged actions.

**WA-007: No Before/After Diff in History**

- SBNC Impact: We can see that a record changed but not what changed.
  Diagnosing problems requires guesswork.
- Current Mitigation: Keep external notes about important changes.
- ClubOS Remedy: Full before/after snapshots in audit records.

**WA-008: Audit Logs Are Not Exportable**

- SBNC Impact: Cannot provide evidence for disputes, audits, or legal
  inquiries without screenshots.
- Current Mitigation: Take screenshots when problems are noticed.
- ClubOS Remedy: Exportable, searchable audit records.

**WA-009: No Alert on Suspicious Activity**

- SBNC Impact: Bulk deletions or exports happen without anyone knowing
  until damage is discovered.
- Current Mitigation: Hope someone notices before it is too late.
- ClubOS Remedy: Configurable alerts for high-risk actions.

**WA-010: Session Management Is Opaque**

- SBNC Impact: Cannot tell who is logged in, cannot force logout of
  a compromised or departed user.
- Current Mitigation: Change shared passwords when people leave.
- ClubOS Remedy: Session visibility and forced logout capability.

---

### Data Safety (Delete, Cancel, Undo)

**WA-011: No Cancel vs Delete Distinction**

- SBNC Impact: Deleting an event to clean up the calendar has hidden
  financial side effects (see Case Study above).
- Current Mitigation: Training to never delete, only cancel.
- ClubOS Remedy: Cancel and Delete are separate operations with
  different permissions and warnings.

**WA-012: No Soft Delete for Members**

- SBNC Impact: Deleting a member removes their history. If done by
  mistake, the data is unrecoverable.
- Current Mitigation: Mark as inactive instead of deleting.
- ClubOS Remedy: Soft delete with recovery period. Hard delete requires
  elevated approval.

**WA-013: No Undo for Bulk Operations**

- SBNC Impact: A botched import or bulk update cannot be reversed.
  Manual cleanup takes hours or days.
- Current Mitigation: Test on small batches, keep backup exports.
- ClubOS Remedy: Bulk operations create restore points. Undo is available
  within a time window.

**WA-014: Cascading Deletes Are Silent**

- SBNC Impact: Deleting a parent record (event, membership level) deletes
  related records without warning.
- Current Mitigation: Avoid deleting anything that might have children.
- ClubOS Remedy: Cascade warnings before execution. Option to orphan
  rather than delete children.

**WA-015: No Trash or Recycle Bin**

- SBNC Impact: Deleted content is gone immediately. No recovery period.
- Current Mitigation: Be very careful. Maintain external backups.
- ClubOS Remedy: 30-day trash with admin recovery capability.

---

### Events and Registration

**WA-016: Event Managers Can Delete Events**

- SBNC Impact: Anyone trusted to manage check-in can accidentally or
  intentionally delete the entire event.
- Current Mitigation: Limit who gets event management access.
- ClubOS Remedy: Delete requires separate permission not granted by default.

**WA-017: No Waitlist-Only Role**

- SBNC Impact: Waitlist helpers have full event editing capability.
- Current Mitigation: Training and supervision.
- ClubOS Remedy: Waitlist Manager role that can only move people on/off waitlist.

**WA-018: Check-In Cannot Be Separated from Registration**

- SBNC Impact: Event day volunteers can see and change registration details,
  not just mark attendance.
- Current Mitigation: Use paper check-in lists for sensitive events.
- ClubOS Remedy: Check-In role sees only name and attendance status.

**WA-019: No Event Templates with Locked Fields**

- SBNC Impact: Recurring events must be recreated manually. Errors in
  pricing or capacity happen regularly.
- Current Mitigation: Copy from previous event and check every field.
- ClubOS Remedy: Event templates with locked pricing and capacity.
  Only unlocked fields can be edited.

**WA-020: Registration Confirmation Timing Is Unpredictable**

- SBNC Impact: Members complain they did not receive confirmation.
  Staff cannot tell if email was sent.
- Current Mitigation: Ask members to check spam, resend manually.
- ClubOS Remedy: Email delivery status visible in member record.

---

### Member Management

**WA-021: Membership Status Transitions Are Hidden**

- SBNC Impact: Members change from Active to Lapsed without explanation.
  Staff cannot predict or explain the transition.
- Current Mitigation: Run reports frequently and investigate anomalies.
- ClubOS Remedy: Explicit state machine with visible transition rules.
  All transitions logged with reason.

**WA-022: Renewal Logic Is Not Configurable**

- SBNC Impact: WA's renewal timing does not match SBNC bylaws. Manual
  overrides are required.
- Current Mitigation: Manually adjust renewal dates.
- ClubOS Remedy: Configurable renewal rules per membership level.

**WA-023: No Member Merge Without Data Loss**

- SBNC Impact: Duplicate records cannot be combined without losing
  payment history or event attendance from one record.
- Current Mitigation: Manually transfer important data before merge.
- ClubOS Remedy: Merge preserves all history from both records.

**WA-024: Custom Fields Cannot Be Required Conditionally**

- SBNC Impact: New member applications require different fields than
  renewals, but WA cannot enforce this.
- Current Mitigation: Manual review of applications for completeness.
- ClubOS Remedy: Conditional field requirements based on membership
  level or application type.

**WA-025: No Family/Household Linking**

- SBNC Impact: Spouses must be tracked manually. Communications go to
  individuals, not households.
- Current Mitigation: Naming conventions and manual association.
- ClubOS Remedy: Household entity with linked members. Communications
  can target households.

---

### Financial and Payments

**WA-026: Refunds Do Not Reverse Automatically**

- SBNC Impact: Processing a refund in the payment processor does not
  update WA records. Manual reconciliation required.
- Current Mitigation: Update WA manually after every refund.
- ClubOS Remedy: Refunds sync bidirectionally with payment processor.

**WA-027: Payment Failures Silently Change Status**

- SBNC Impact: A declined card causes membership to lapse without
  notification to staff.
- Current Mitigation: Run failed payment reports weekly.
- ClubOS Remedy: Payment failures trigger alerts and grace period
  before status change.

**WA-028: No Invoice Preview Before Sending**

- SBNC Impact: Errors in invoices are discovered after members receive
  them. Looks unprofessional.
- Current Mitigation: Double-check before clicking send.
- ClubOS Remedy: Invoice preview with approval step before sending.

**WA-029: Credits Are Invisible to Members**

- SBNC Impact: Members do not know they have credits. Staff must inform
  them manually.
- Current Mitigation: Email members when credits are issued.
- ClubOS Remedy: Credits visible in member portal with usage history.

**WA-030: No Proration Controls**

- SBNC Impact: Mid-year memberships are prorated unpredictably.
  Manual price adjustments required.
- Current Mitigation: Override prices manually for mid-year joins.
- ClubOS Remedy: Configurable proration rules per membership level.

---

### Communications and Email

**WA-031: Bounce Handling Silently Disables Contacts**

- SBNC Impact: Members stop receiving emails without explanation.
  No notification to staff that contact was disabled.
- Current Mitigation: Run bounce reports and investigate.
- ClubOS Remedy: Bounce alerts to admins. Members see their own
  delivery status in portal.

**WA-032: No Email Scheduling**

- SBNC Impact: All emails send immediately. Cannot schedule for optimal
  delivery time.
- Current Mitigation: Prepare emails and set calendar reminders to send.
- ClubOS Remedy: Schedule emails for future delivery.

**WA-033: Limited Segmentation for Email Lists**

- SBNC Impact: Cannot easily target emails to specific combinations
  (e.g., Active members in a specific committee who attended an event).
- Current Mitigation: Export, filter in Excel, reimport as saved search.
- ClubOS Remedy: Flexible query builder for email targeting.

**WA-034: No Email Template Versioning**

- SBNC Impact: Edits to templates affect all past references.
  Cannot see what template looked like when email was sent.
- Current Mitigation: Take screenshots of important templates.
- ClubOS Remedy: Template versions preserved. Sent emails reference
  the version used.

**WA-035: Reply-To Cannot Be Dynamic**

- SBNC Impact: All replies go to one address. Cannot route replies
  to the relevant committee or officer.
- Current Mitigation: Include "for questions, email X" in body.
- ClubOS Remedy: Dynamic reply-to based on email type and sender.

---

### Website and Publishing

**WA-036: Publishing Is Immediate with No Preview**

- SBNC Impact: Typos and errors go live instantly. No review step.
- Current Mitigation: Edit carefully. Fix mistakes after they are noticed.
- ClubOS Remedy: Draft/Preview/Publish workflow. Changes reviewed before
  going live.

**WA-037: No Content Approval Workflow**

- SBNC Impact: Any editor can publish to public pages. No oversight
  for important announcements.
- Current Mitigation: Limit who has website access.
- ClubOS Remedy: Approval required for public pages. Sensitive content
  requires designated approver.

**WA-038: No Page Version History**

- SBNC Impact: Cannot see what a page looked like before edits.
  Cannot revert mistakes.
- Current Mitigation: Copy page content to document before major changes.
- ClubOS Remedy: Full version history with diff view and one-click revert.

**WA-039: Widgets Are Limited and Inflexible**

- SBNC Impact: Member-facing features require WA widget limitations
  or external development.
- Current Mitigation: Accept limitations or build outside WA.
- ClubOS Remedy: Flexible components with configurable behavior.

**WA-040: No Member-Only Content Beyond Login Wall**

- SBNC Impact: All logged-in members see the same content. Cannot
  restrict by membership level or committee.
- Current Mitigation: Put sensitive content in external systems.
- ClubOS Remedy: Audience-based content visibility. Different members
  see different content.

---

### Reporting and Analytics

**WA-041: Reports Are Slow and Limited**

- SBNC Impact: Complex reports time out. Must export and analyze in Excel.
- Current Mitigation: Schedule time for report generation and analysis.
- ClubOS Remedy: Efficient reporting with saved report definitions.

**WA-042: No Dashboard for Key Metrics**

- SBNC Impact: Must run multiple reports to understand current status.
  No at-a-glance summary.
- Current Mitigation: Create manual dashboards in spreadsheets.
- ClubOS Remedy: Configurable dashboard with key metrics.

**WA-043: Historical Trend Data Is Difficult**

- SBNC Impact: Comparing this year to last year requires manual
  data collection and Excel work.
- Current Mitigation: Annual report preparation is time-intensive.
- ClubOS Remedy: Built-in trend analysis and year-over-year comparisons.

**WA-044: Cannot Share Reports with Non-Admins**

- SBNC Impact: Board members who need reports must become admins
  or receive exported files.
- Current Mitigation: Export reports and email them.
- ClubOS Remedy: Read-only report access for designated roles.

---

### Backup and Recovery

**WA-045: No User-Controlled Backups**

- SBNC Impact: Cannot take a snapshot before risky operations.
  Recovery depends on WA support.
- Current Mitigation: Manual exports before major changes.
- ClubOS Remedy: On-demand snapshots with self-service restore.

**WA-046: Export Format Is Difficult to Reimport**

- SBNC Impact: Data exports cannot be used to restore the system.
  Only useful for reference.
- Current Mitigation: Hope nothing needs full restore.
- ClubOS Remedy: Export format is restore-compatible.

**WA-047: No Point-in-Time Recovery**

- SBNC Impact: If corruption is discovered days later, no way to
  recover to a specific moment.
- Current Mitigation: Frequent exports (when remembered).
- ClubOS Remedy: Point-in-time recovery within retention window.

---

### Integration and API

**WA-048: API Rate Limits Are Aggressive**

- SBNC Impact: Scripts that sync data hit rate limits and fail
  mid-operation.
- Current Mitigation: Add delays and retry logic to scripts.
- ClubOS Remedy: Reasonable rate limits with clear documentation.

**WA-049: Webhooks Are Unreliable**

- SBNC Impact: External systems cannot reliably receive WA events.
  Must poll instead.
- Current Mitigation: Run sync scripts frequently instead of reacting
  to webhooks.
- ClubOS Remedy: Reliable webhooks with retry and delivery confirmation.

**WA-050: No Sandbox for API Testing**

- SBNC Impact: All API testing uses production data. Mistakes affect
  real members.
- Current Mitigation: Test carefully, have rollback plan.
- ClubOS Remedy: Sandbox environment with test data.

---

## Top 10 Issues SBNC Feels Most Acutely

Based on frequency of impact, severity of consequences, and volunteer
time spent on workarounds:

| Rank | Issue ID | Issue | Why It Hurts SBNC |
|------|----------|-------|-------------------|
| 1 | WA-011 | No Cancel vs Delete | Dec 2024 incident; financial cleanup took hours |
| 2 | WA-001 | Coarse Admin Roles | 20+ volunteers need access; cannot limit safely |
| 3 | WA-006 | Weak Audit Trail | Cannot determine who did what; accountability fails |
| 4 | WA-021 | Hidden Status Transitions | Members lapse unexpectedly; staff cannot explain |
| 5 | WA-031 | Bounce Handling Silently Disables | Members miss critical communications |
| 6 | WA-036 | No Publishing Preview | Errors go live immediately; embarrassing |
| 7 | WA-016 | Event Managers Can Delete | Any chair can cause financial cascade |
| 8 | WA-045 | No User-Controlled Backups | Cannot protect against mistakes |
| 9 | WA-027 | Payment Failures Change Status | Members lapse without staff awareness |
| 10 | WA-023 | No Member Merge | Duplicate records require manual cleanup |

### Why These Ten

- **Financial risk** (WA-011, WA-016, WA-027): Mistakes cost money and trust
- **Accountability gap** (WA-001, WA-006): Cannot train or correct without attribution
- **Member experience** (WA-021, WA-031): Members feel abandoned when things fail silently
- **Volunteer burden** (WA-023, WA-036, WA-045): Hours spent on preventable cleanup

---

## See Also

- [WA Pain Points Gap Analysis](../competitive/WA_PAINPOINTS_GAP_ANALYSIS.md) - Source framework
- [Tech Lead Cognitive Load](../governance/TECH_LEAD_COGNITIVE_LOAD.md) - Infrastructure risks
- [Scope Boundaries](../solutions/SCOPE_BOUNDARIES_AND_NON_GOALS.md) - What ClubOS will not solve
- [Reliability and Delivery Synthesis](../RELIABILITY_AND_DELIVERY_SYNTHESIS.md) - Board summary
