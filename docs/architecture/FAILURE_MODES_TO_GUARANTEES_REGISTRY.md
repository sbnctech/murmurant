# ClubOS - Failure Modes to Guarantees Registry

Copyright (c) Santa Barbara Newcomers Club

Status: Canonical Specification
Applies to: Competitive analysis and architectural validation
Last updated: 2025-12-21

---

## Purpose

This registry maps every documented Wild Apricot failure mode to a corresponding ClubOS architectural guarantee. The goal is not feature comparison but **guarantee enforcement**: ensuring that ClubOS cannot exhibit the same failure patterns that frustrate users of competing systems.

Guarantees are stronger than features. A feature can exist but fail silently. A guarantee is a promise backed by mechanisms, tests, and operational controls.

**Core Principle:** Every failure mode documented in the competitive analysis must be addressed by one of:

- An architectural guarantee (enforced by code)
- A process guarantee (enforced by procedure)
- An explicit out-of-scope decision (documented rationale)

Silence is not acceptable. Undocumented gaps become undiscovered failures.

---

## Related Documents

- [Wild Apricot Top 50 Issues](../competitive/WILD_APRICOT_TOP_50_ISSUES.md) - Source inventory
- [Wild Apricot Sources Ledger](../competitive/WILD_APRICOT_SOURCES_LEDGER.md) - Evidence citations
- [Architectural Charter](../ARCHITECTURAL_CHARTER.md) - Principles P1-P10, anti-patterns N1-N8
- [System Guarantees](../reliability/SYSTEM_GUARANTEES.md) - Core reliability promises
- [Guarantee to Mechanism Matrix](../reliability/GUARANTEE_TO_MECHANISM_MATRIX.md) - Enforcement mapping
- [Multitenant Release Readiness](../reliability/MULTITENANT_RELEASE_READINESS.md) - Tenant isolation
- [Readiness Gaps and Risk Acceptance](../reliability/READINESS_GAPS_AND_RISK_ACCEPTANCE.md) - Known gaps

---

## Status Definitions

| Status | Meaning |
|--------|---------|
| DONE | Guarantee is implemented, tested, and enforced in production |
| IN-PROGRESS | Guarantee is partially implemented; work is active |
| PLANNED | Guarantee is designed but not yet implemented |
| OUT-OF-SCOPE | Failure mode is acknowledged but explicitly not addressed (with rationale) |

---

## Category: Permissions (WA-001 through WA-006)

These failures stem from coarse, rigid, page-based access control. ClubOS addresses them through capability-based, object-scoped authorization evaluated server-side.

| WA ID | Failure Mode | What Goes Wrong in WA | ClubOS Guarantee | Mechanism | Status |
|-------|--------------|----------------------|------------------|-----------|--------|
| WA-001 | Coarse admin roles | Only 4 preset admin levels. Cannot define custom roles or granular permissions. Admins get too many or too few permissions. | **Capability-based authorization with fine-grained permissions** | Role-capability mapping with object-scoped grants. Capabilities are composable and assignable per user. Charter P2: default deny, least privilege. | DONE |
| WA-002 | No object-scoped permissions | Cannot limit admin to specific events, committees, or content areas. All-or-nothing access. | **Object-scoped authorization** | Every permission check includes object context (event ID, committee ID, etc.). Authorization evaluated as `role X has capability Y scoped to object Z`. Charter P2, N2. | DONE |
| WA-003 | Event chair can delete events | No way to allow waitlist management without granting event deletion. Coarse role bundling. | **Separate capabilities for distinct actions** | `event:manage_waitlist` is distinct from `event:delete`. Capabilities are unbundled. Destructive actions require explicit capability. | DONE |
| WA-004 | Read-only admin can export all contacts | Read-only setting permits downloading entire contact list ("HUGE exception"). | **Export is a separate capability, not implied by read** | `member:export` capability is distinct from `member:view`. Export actions are audited and gated independently. Charter N7: minimize PII exposure. | DONE |
| WA-005 | Page access by navigation hiding | Security by obscurity; direct URLs bypass restrictions. No true page-level access control. | **Server-side authorization on every request** | Visibility is evaluated server-side on every page render. No client-only hiding. Direct URL access is denied if not authorized. Charter N1, P2. | DONE |
| WA-006 | No per-chapter permissions | Multi-chapter orgs cannot have per-chapter membership managers. All admins see all data. | **Tenant-scoped and committee-scoped permissions** | Multi-tenant model with tenant isolation. Within tenant, committee-scoped grants allow per-group delegation. See Multitenant Release Readiness. | IN-PROGRESS |

---

## Category: Audit (WA-007 through WA-011)

These failures stem from inadequate logging, attribution, and traceability. ClubOS addresses them through mandatory audit trails for all privileged actions.

| WA ID | Failure Mode | What Goes Wrong in WA | ClubOS Guarantee | Mechanism | Status |
|-------|--------------|----------------------|------------------|-----------|--------|
| WA-007 | Limited admin action logging | No comprehensive audit log of administrator actions. Cannot run reports on who did what, when. | **Comprehensive audit logging for all privileged actions** | Every admin action produces an audit log entry with actor, action, object, timestamp, and outcome. Charter P1: every privileged action must be attributable. | DONE |
| WA-008 | No actor attribution on changes | When destructive actions occur, audit trail limitations prevent reliable identification of who performed the action. | **Actor attribution is mandatory** | Audit entries include authenticated actor identity. Anonymous or unattributed actions are forbidden. Charter P1. | DONE |
| WA-009 | Audit logs not exportable | Cannot extract logs for compliance review or external analysis. Trapped in system. | **Audit logs are exportable** | Admin API endpoint for audit log export. Logs are queryable and exportable in structured format (JSON/CSV). | PLANNED |
| WA-010 | No before/after diff on edits | Logs show "edited" but not what changed. Cannot reconstruct history of modifications. | **Field-level change tracking for critical entities** | Audit entries for edits include before/after values for changed fields. Enables diff reconstruction. | PLANNED |
| WA-011 | Email send history incomplete | Cannot reliably trace what was sent to whom. Delivery tracking weak and unreliable. | **Send log with per-recipient tracking** | MessageCampaign has SendLog with recipient, template, sent timestamp, and delivery status. Charter P3: comms lifecycle state machine. | IN-PROGRESS |

---

## Category: Data (WA-012 through WA-020)

These failures stem from limited backup, export, import, and data management capabilities. ClubOS addresses them through robust data protection and explicit data handling workflows.

| WA ID | Failure Mode | What Goes Wrong in WA | ClubOS Guarantee | Mechanism | Status |
|-------|--------------|----------------------|------------------|-----------|--------|
| WA-012 | No user-controlled backups | No comprehensive one-step backup. Must use "rabbit-warren of methods." Saved searches and email templates not backed up. | **Comprehensive, scheduled, verifiable backups** | Automated backups per DATA_PROTECTION_AND_BACKUPS.md. Backup includes all user-configurable data. Restore drills verify recoverability. | DONE |
| WA-013 | Limited data export options | Financial exports lack member details. Hours of manual sorting for QuickBooks import. | **Structured exports with configurable fields** | Export endpoints support field selection. Financial exports include member linkage. Export actions are audited. | PLANNED |
| WA-014 | No point-in-time restore | Cannot roll back database to a specific moment. No undo for bulk operations. | **Point-in-time recovery (PITR) capability** | Database PITR enabled per BACKUP_EXECUTION_AND_RETENTION.md. Restore to specific timestamp possible with human approval. | DONE |
| WA-015 | Bulk update limitations | Mass member updates require export-to-CSV, edit-in-Excel, re-import workflow. Custom fields and group memberships cannot be bulk-updated. Admin discovers limitation mid-workflow. | **Bulk operations with preview and confirmation** | Bulk update UI shows preview of affected records before commit. Confirmation required. All changes audited. Errors reported per-row. | PLANNED |
| WA-016 | Data import errors unclear | Import failures give vague messages. Cannot undo contact imports - overwrites existing data. | **Import validation with clear error reporting** | Import process validates before commit. Errors include row number and field. Import is transactional: all-or-nothing. | PLANNED |
| WA-017 | Duplicate member handling weak | No clear merge or dedupe workflow. Import can overwrite group memberships unexpectedly. | **Explicit duplicate detection and merge workflow** | Import detects potential duplicates and presents for review. Merge preserves history. No silent overwrites. | PLANNED |
| WA-018 | Field validation inconsistent | Email fields accept malformed addresses that later cause send failures. Phone fields accept non-numeric characters that break integrations. Profile images silently reject oversized files. Admin discovers issues only when downstream operations fail. | **Consistent field validation at schema and application layers** | Prisma schema enforces types. Application layer validates format before save. Validation errors are immediate, specific, and actionable. No silent rejections. | IN-PROGRESS |
| WA-019 | Cannot bulk import photos | Member photos must be uploaded one at a time. 700+ member orgs cannot import ID photos in bulk. | **Bulk media import capability** | Media import endpoint accepts batch uploads. Photos linked to members via stable identifiers. | PLANNED |
| WA-020 | Export names in single column | Financial exports put names in one column. Cannot sort by last name without manual workaround. | **Exports use structured, separate fields** | All exports separate firstName, lastName, email, etc. No concatenated fields. | PLANNED |

---

## Category: Events (WA-021 through WA-028)

These failures stem from destructive defaults, missing workflows, and poor mobile support. ClubOS addresses them through explicit state machines and non-destructive operations.

| WA ID | Failure Mode | What Goes Wrong in WA | ClubOS Guarantee | Mechanism | Status |
|-------|--------------|----------------------|------------------|-----------|--------|
| WA-021 | Delete event cascades to invoices | Deleting event voids all invoices and creates credits on member accounts. Financial cleanup nightmare. | **Event cancellation is non-destructive** | Events use soft-delete. Cancellation transitions state without voiding invoices. Financial records remain intact. Charter P5: undoable/reversible. | DONE |
| WA-022 | No cancel vs delete distinction | Single destructive action with financial side effects. No soft-cancel workflow. | **Explicit cancel vs archive vs delete states** | Event lifecycle: draft -> published -> cancelled -> archived. Each transition is explicit. Delete requires admin capability and confirmation. Charter P3. | DONE |
| WA-023 | Waitlist bypassed on cancellation | When someone cancels, new registrants bypass waitlist queue. | **RESOLVED in WA v5.18** | N/A - Wild Apricot fixed this with automatic waitlist promotion. ClubOS implements FIFO waitlist promotion as standard. | DONE |
| WA-024 | Admins cannot add to waitlist | Administrators cannot manually add members to waitlist - only self-service. | **Admin can manage waitlist directly** | Admins with `event:manage_waitlist` can add, remove, or reorder waitlist entries. Action is audited. | DONE |
| WA-025 | Waitlist visibility bug | When moved from waitlist, members show as "anonymous user" due to default privacy flag. | **Consistent member visibility rules** | Registration visibility is controlled by explicit privacy settings. Waitlist promotion preserves visibility state. No default-to-anonymous. | DONE |
| WA-026 | Check-in UX poor on mobile | Check-in requires desktop-like interface. No check-in-only permission. | **Mobile-optimized check-in with scoped permission** | Host mode widget optimized for mobile. `event:host_checkin` capability is scoped to event. Charter P2. | IN-PROGRESS |
| WA-027 | Event cloning loses settings | Cloning an event does not copy: custom registration fields, payment settings, confirmation email templates, or capacity limits. Event chair discovers missing settings after publishing, requiring last-minute corrections. | **Event templates preserve full configuration** | Event cloning copies all settings including registration types, pricing, capacity, custom fields, and email templates. Clone preview shows what will be copied. | PLANNED |
| WA-028 | No event approval workflow | Events go live without review step. No registration approval workflow. | **Optional approval workflow for events and registrations** | Events can require approval before publish. Registrations can require approval. Charter P3: workflow state machines. | PLANNED |

---

## Category: Finance (WA-029 through WA-035)

These failures stem from confusing refund workflows, coupled data, and silent payment failures. ClubOS addresses them through separated concerns and clear financial trails.

| WA ID | Failure Mode | What Goes Wrong in WA | ClubOS Guarantee | Mechanism | Status |
|-------|--------------|----------------------|------------------|-----------|--------|
| WA-029 | Refund workflow confusing | Recording refund in WA doesn't return money to donor. Must separately process through gateway. | **Refund tracking is explicit and separated from gateway action** | ClubOS distinguishes between "refund recorded" and "refund processed." Status reflects actual gateway state. User guidance is clear. | PLANNED |
| WA-030 | Invoice voiding cascades | Voiding invoice affects registration state. Financial and registration data coupled confusingly. | **Financial and registration state are decoupled** | Invoice status does not automatically change registration status. Each domain has its own lifecycle. Transitions are explicit. | PLANNED |
| WA-031 | No payment audit trail | Payment records lack explicit linkage to source (event vs donation vs dues). When member disputes charge, treasurer cannot identify which transaction applies. Credits appear on accounts with no origin explanation. | **Complete financial audit trail with linkage** | Every payment, credit, refund has audit entry with source reference. Invoice-to-registration-to-event chain is queryable. Transaction origin is always visible. Charter P1, P7. | PLANNED |
| WA-032 | Renewal reminders confuse auto-renewers | Members on auto-renewal still receive renewal reminder emails causing confusion and duplicate payments. | **Auto-renewal status suppresses renewal reminders** | Renewal reminder logic checks payment method. Auto-renewing members receive different messaging. | PLANNED |
| WA-033 | No manual donations option | Donations only support online payment. Cannot invoice or record cash/check donations. | **Manual payment recording for all transaction types** | Admin can record offline payments (cash, check) for donations, dues, event fees. Payment source is tracked. | PLANNED |
| WA-034 | Financial reports limited | Only 5 built-in reports. Custom reporting requires export and Excel. | **Flexible financial reporting** | Query-builder for financial reports. Saved report definitions. Export to multiple formats. | PLANNED |
| WA-035 | Payment gateway errors silent | Wild Apricot Payments has errored without intuitive alerts. Missed donations. | **Payment errors are surfaced and alerted** | Payment gateway errors produce admin alerts. Failed payments are visible in dashboard. Charter P7: observability. | PLANNED |

---

## Category: Website (WA-036 through WA-042)

These failures stem from dated editing tools, no staging workflow, and limited content management. ClubOS addresses them through modern publishing workflows with preview and revision control.

| WA ID | Failure Mode | What Goes Wrong in WA | ClubOS Guarantee | Mechanism | Status |
|-------|--------------|----------------------|------------------|-----------|--------|
| WA-036 | Website editor dated | WYSIWYG editor produces inconsistent HTML across browsers. Pasted Word content introduces hidden formatting that breaks layout. Saved pages render differently than preview. Webmaster cannot predict final appearance. | **Modern block-based content editing** | Publishing uses structured blocks (not raw HTML). Preview matches published output exactly. Paste from Word is sanitized. Rendering is deterministic. | IN-PROGRESS |
| WA-037 | No draft/preview workflow | Changes go live immediately. No staging or preview before publish. | **Draft -> Preview -> Publish workflow** | Pages have explicit publish state. Preview is separate URL with auth. Changes require explicit publish action. Charter P3. | DONE |
| WA-038 | Templates look dated | Website themes look dated. Promised updates not materialized. | **Non-destructive theme updates** | Theme changes do not require content migration. New themes apply without breaking existing pages. Theme updates are non-destructive. Visual design is subjective; ClubOS guarantees functional theming, not aesthetic superiority. | OUT-OF-SCOPE |
| WA-039 | Limited undo and no contact history | Only 10 undo actions per session. No version history for contact/member data changes. | **Revision history for content and member data** | Pages have revision history. Member profile changes are audited with before/after. Charter P5. | PLANNED |
| WA-040 | Image orientation issues | Images upload upside down or rotated. EXIF data not read properly. | **Automatic EXIF-aware image processing** | Image upload pipeline reads EXIF orientation and corrects automatically. | PLANNED |
| WA-041 | Low storage limits | Even Enterprise plan only gets 1.6GB storage. Individual file limit is 100MB. | **Reasonable storage limits** | Storage limits are tenant-configurable. Limits are clearly communicated. Overage handling is defined. | OUT-OF-SCOPE |
| WA-042 | No website import/export | No import or export tool for website content. Makes migrations difficult. | **Content export for portability** | Pages and media can be exported in portable format. Supports migration to/from ClubOS. | PLANNED |

**WA-038 Rationale for OUT-OF-SCOPE:** "Looking dated" is aesthetic judgment, not an observable failure. ClubOS guarantees that theme changes are non-destructive and do not require content migration. Visual design preferences are subjective and outside the scope of architectural guarantees.

**WA-041 Rationale for OUT-OF-SCOPE:** Storage pricing is a business model decision, not an architectural failure. ClubOS may have different storage tiers, but the comparison is commercial, not technical.

---

## Category: Comms (WA-043 through WA-045)

These failures stem from email deliverability issues, manual retry burdens, and missing approval workflows. ClubOS addresses them through robust email handling and communications governance.

| WA ID | Failure Mode | What Goes Wrong in WA | ClubOS Guarantee | Mechanism | Status |
|-------|--------------|----------------------|------------------|-----------|--------|
| WA-043 | Email deliverability issues | Emails sent from custom domains fail DKIM/SPF checks due to incomplete setup instructions. Members report not receiving event confirmations. Admin discovers problem only after member complaints. | **Validated email authentication with monitoring** | ClubOS validates DKIM/SPF/DMARC during custom domain setup. Setup wizard blocks completion until DNS records verify. Delivery monitoring alerts admin to bounce rate spikes. | PLANNED |
| WA-044 | Email failures require manual resend | When email blasts have delivery failures, admin must manually "Resend to Failed" multiple times. | **Automatic retry with exponential backoff for transient failures** | Transient failures (greylisting) retry automatically. Permanent failures are surfaced for review. Charter P7. | PLANNED |
| WA-045 | No approval workflow for sends | Anyone with email access can send immediately. No review step for mass communications. | **Optional approval workflow for mass communications** | Large sends can require two-person approval. Approval workflow per Charter P3: comms lifecycle. | PLANNED |

---

## Category: API (WA-046 through WA-047)

These failures stem from API design limitations. ClubOS addresses them through well-designed, complete APIs.

| WA ID | Failure Mode | What Goes Wrong in WA | ClubOS Guarantee | Mechanism | Status |
|-------|--------------|----------------------|------------------|-----------|--------|
| WA-046 | API pagination limits performance | Pagination forces multiple API calls. 1300 records require 13 iterations (30 seconds vs 2 seconds). | **Efficient API pagination with reasonable page sizes** | API supports cursor-based pagination with configurable page size. Bulk endpoints for large datasets. | IN-PROGRESS |
| WA-047 | Cannot define event fields via API | Cannot define EventRegistrationFields or RegistrationTypes through API. Major gap for integrations. | **Full CRUD API for all configurable entities** | All admin-configurable entities (events, registration types, custom fields) are API-accessible. | PLANNED |

---

## Category: Other (WA-048 through WA-050)

These failures are business/support issues rather than architectural failures. ClubOS addresses what is architecturally relevant.

| WA ID | Failure Mode | What Goes Wrong in WA | ClubOS Guarantee | Mechanism | Status |
|-------|--------------|----------------------|------------------|-----------|--------|
| WA-048 | Support degraded since Personify | Support has become "abysmal" since acquisition. Chat takes over an hour. No phone support. Weeks for email replies. | **Solutions-first delivery model with direct support** | ClubOS Solutions model includes onboarding, training, and ongoing support. Not pure self-service SaaS. See DELIVERY_MODEL_STRATEGY.md. | OUT-OF-SCOPE |
| WA-049 | Aggressive price increases | Users report 20% annual price increases. No longer viable for small nonprofits. | **Transparent, predictable pricing** | Pricing model is documented and stable. Changes require advance notice. See DELIVERY_MODEL_PRICING_AND_TIERS.md. | OUT-OF-SCOPE |
| WA-050 | No volunteer hours tracking | No native feature to track volunteer hours for recognition or discounts. Must use third-party tools. | **Volunteer engagement tracking** | Volunteer hours tracking as optional feature. Supports recognition workflows. | PLANNED |

**WA-048, WA-049 Rationale for OUT-OF-SCOPE:** These are business model and support organization issues, not architectural failures. ClubOS addresses them through its delivery model (documented separately), but they are not architectural guarantees.

---

## Summary Counts

| Status | Count | Percentage |
|--------|-------|------------|
| DONE | 15 | 30% |
| IN-PROGRESS | 6 | 12% |
| PLANNED | 25 | 50% |
| OUT-OF-SCOPE | 4 | 8% |
| **Total** | **50** | **100%** |

### By Category

| Category | Total | DONE | IN-PROGRESS | PLANNED | OUT-OF-SCOPE |
|----------|-------|------|-------------|---------|--------------|
| Permissions | 6 | 5 | 1 | 0 | 0 |
| Audit | 5 | 2 | 1 | 2 | 0 |
| Data | 9 | 2 | 1 | 6 | 0 |
| Events | 8 | 5 | 1 | 2 | 0 |
| Finance | 7 | 0 | 0 | 7 | 0 |
| Website | 7 | 1 | 1 | 3 | 2 |
| Comms | 3 | 0 | 0 | 3 | 0 |
| API | 2 | 0 | 1 | 1 | 0 |
| Other | 3 | 0 | 0 | 1 | 2 |

---

## Architectural Principles Coverage

The following charter principles are exercised by this registry:

| Principle | Applicable WA Issues |
|-----------|---------------------|
| P1: Identity and authorization provable | WA-001, WA-002, WA-007, WA-008, WA-031 |
| P2: Default deny, least privilege, object scope | WA-001, WA-002, WA-003, WA-004, WA-005, WA-006, WA-026 |
| P3: State machines over ad-hoc booleans | WA-021, WA-022, WA-028, WA-037, WA-045 |
| P5: Every important action undoable/reversible | WA-021, WA-039 |
| P7: Observability is a product feature | WA-011, WA-035, WA-044 |
| N1: Never base security on page visibility | WA-005 |
| N2: Never allow coarse rigid roles | WA-001, WA-002, WA-003 |
| N7: Never store or expose more PII than necessary | WA-004 |

---

## Enforcement

- Every PLANNED item MUST be tracked in the backlog with explicit priority
- Every IN-PROGRESS item MUST have an owner and target completion
- Every OUT-OF-SCOPE item MUST have documented rationale
- No failure mode may be silently ignored

This registry MUST be updated when:

- A new WA issue is documented
- A ClubOS guarantee status changes
- A mechanism is implemented or deprecated

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-21 | Initial creation mapping all 50 WA issues | ClubOS Architecture |
| 2025-12-21 | Alignment audit: rewrote 6 vague entries (WA-015, WA-018, WA-027, WA-031, WA-036, WA-043) with concrete failure language; reclassified WA-038 as OUT-OF-SCOPE; strengthened 3 aspirational guarantees | Worker 2 |
