# From Wild Apricot Failure Modes to ClubOS Guarantees

A Comparison for Board Members and Technology Decision-Makers

---

## Executive Summary

Wild Apricot's persistent user complaints are not isolated bugs or missing features. They reflect **architectural decisions** that cannot be fixed through incremental updates:

- **Coarse permissions by design.** WA's four preset admin levels force organizations to grant too much access or too little. The platform was not built for granular delegation.

- **Audit as an afterthought.** WA's logging captures some actions but cannot reliably answer "who did this and why?" The data model lacks actor attribution and before/after tracking.

- **Destructive actions without safeguards.** Deleting an event voids invoices and creates member credits automatically. There is no cancel-vs-delete distinction because the underlying state machine does not separate these concepts.

- **Publishing without preview.** Changes go live immediately because there is no draft/publish lifecycle in the page model.

- **Backup as a patchwork.** Organizations must use a "rabbit-warren" of export methods because comprehensive backup was never a first-class feature.

These are not complaints about UI polish. They are structural limitations that persist across years of user feedback because fixing them would require rebuilding core systems.

**ClubOS addresses these at the architecture level.** The system was designed from the start with granular capabilities, immutable audit logging, explicit state machines, draft/preview/publish lifecycles, and backup as a core guarantee.

---

## WA Allows / ClubOS Guarantees

### Destructive Actions

| WA Allows | ClubOS Guarantees | Status |
|-----------|-------------------|--------|
| Deleting an event voids all invoices and creates automatic member credits | Event cancellation preserves all financial records; deletion blocked when financial records exist | Implemented |
| No distinction between cancel and delete for events | Explicit state machine: DRAFT, PENDING_APPROVAL, APPROVED, PUBLISHED, CANCELED, COMPLETED. Cancel is a status change; delete is removal. | Implemented |
| Invoice voiding cascades to registration state in confusing ways | Financial records are append-only. Voiding creates a new record; it does not mutate history. | Implemented |
| Bulk operations have no preview, no undo, and unclear error messages | Bulk operations show preview of affected records, require confirmation, and log each action individually | Planned |

### Permissions and Delegation

| WA Allows | ClubOS Guarantees | Status |
|-----------|-------------------|--------|
| Only 4 preset admin levels; cannot define custom roles | 40+ granular capabilities that can be combined into custom roles | Implemented |
| Event managers can delete events (cannot separate waitlist management from deletion) | Separate capabilities: `events:edit`, `events:manage`, `events:delete`. Delete requires admin. | Implemented |
| Read-only admin can export entire contact list | Export requires explicit `exports:access` capability, separate from view permissions | Implemented |
| No way to limit admin to specific events or committees | Object-scoped authorization: capabilities can be granted for specific resources | Implemented |
| Page security by hiding navigation; direct URLs bypass restrictions | Server-side audience enforcement on every request. No client-side security. | Implemented |
| Check-in requires full event access | Separate `events:checkin` capability for check-in-only roles | Planned |

### Audit and Accountability

| WA Allows | ClubOS Guarantees | Status |
|-----------|-------------------|--------|
| Cannot determine who deleted a record or made a change | Every privileged action logged with authenticated actor ID | Implemented |
| Audit shows "edited" but not what changed | Audit entries include before and after JSON for every mutation | Implemented |
| Cannot export audit logs for compliance review | Audit logs stored in database with export capability | Planned |
| No real-time notification of high-risk actions | Alert rules for sensitive actions (delete, permission change) | Planned |

### Publishing and Preview

| WA Allows | ClubOS Guarantees | Status |
|-----------|-------------------|--------|
| Page changes go live immediately with no preview | Draft/preview/publish lifecycle with explicit state transitions | Implemented |
| No staging environment; test on production | Preview URLs isolated from production; shareable for review | Implemented |
| Limited undo; no version history for member data | Page revision history with rollback capability | Implemented |
| Email sends immediately; no approval workflow | Campaign state machine: DRAFT, APPROVED, SCHEDULED, SENT. Separate `comms:send` capability. | Implemented |

### Backup and Recovery

| WA Allows | ClubOS Guarantees | Status |
|-----------|-------------------|--------|
| No comprehensive one-step backup; must use multiple export methods | Human-in-the-loop backup with documented restore procedure | Planned |
| Cannot restore to a specific point in time | Point-in-time recovery design with 15-minute RPO target | Planned |
| No way to verify backup integrity | Backup verification with restore testing | Planned |
| Accidental deletion has no recovery path within the platform | Soft delete with 30-day recovery window before permanent removal | Planned |

---

## What ClubOS Guarantees

The following guarantees are architectural commitments, not feature promises:

### Data Integrity

- No silent data mutation. Every change is logged.
- Financial records are append-only. History cannot be altered.
- Schema migrations are forward-compatible. No breaking changes without migration path.

### Access Control

- Authorization is server-side only. UI hiding is never security.
- Permissions are capability-based and object-scoped.
- Default deny. Access requires explicit grant.

### Auditability

- Every privileged action is attributed to an authenticated identity.
- Audit entries include what changed, not just that something changed.
- Audit data is retained for compliance review.

### Publishing Safety

- Draft content is never visible to unintended audiences.
- Preview does not imply publish.
- Visibility rules are evaluated server-side on every request.

### Recoverability

- All authoritative data is backed up on a defined schedule.
- Recovery procedures are documented and executable by trained operators.
- Recovery Time Objective: < 4 hours for full restoration.

---

## What ClubOS Explicitly Does NOT Do

Honest assessment of scope and limitations:

### Not in Scope

- **Arbitrary custom fields.** ClubOS uses a stable schema with typed extension points. This is intentional: schema stability prevents the data corruption issues common in flexible-field systems.

- **Multi-session / recurring event series.** MVP focuses on single events. Series support is a roadmap item, not a launch commitment.

- **Split payments.** Single payment method per transaction for reconciliation simplicity.

- **SMS notifications.** Compliance burden (TCPA) and cost. Focus on email and in-app notifications.

### Not Guaranteed

- **Zero downtime.** The system may enter degraded (read-only) mode during incidents.

- **Automatic recovery from all failures.** Human intervention is required for data recovery decisions.

- **Five-nines availability.** Target is 99.9% monthly, appropriate for a membership organization.

- **Protection against compromised admin credentials.** Security assumes credentials are protected.

---

## Why This Matters

### For Volunteer Administrators

Volunteers rotate yearly. They need systems that are safe by default:

- **Cannot accidentally delete financial history.** Cancel/delete distinction means a volunteer managing event cancellations cannot corrupt the books.

- **Cannot accidentally expose private content.** Server-side audience enforcement means a navigation mistake does not leak restricted pages.

- **Can see what happened.** When something goes wrong, the audit trail shows who did what. Training and correction become possible.

### For Committee Chairs

Chairs need delegation without full access:

- **Can grant check-in access without event edit access.** Helpers at the door do not need to see financials or modify event details.

- **Can manage their committee's content.** Object-scoped permissions mean a chair can edit their pages without accessing other committees' work.

- **Can preview before publish.** Draft/preview workflow means chairs can get feedback before content goes live.

### For Contractors and Consultants

External help needs bounded access:

- **Can be granted specific capabilities.** A website contractor gets publishing access without member data access.

- **Access is auditable.** The organization can review what a contractor did during their engagement.

- **Access can be time-limited.** Capability grants can expire, reducing ongoing access management burden.

### For the Board

Board members need confidence in data integrity:

- **Financial records are immutable.** Audit and compliance reviews can trust the historical record.

- **Access control is explainable.** Who has access to what is visible and auditable.

- **Recovery is possible.** Documented backup and restore procedures mean the organization is not dependent on a single person or vendor.

---

## Summary

Wild Apricot's limitations are architectural. They persist because fixing them would require rebuilding core systems. ClubOS was designed from the start to address these concerns:

| Category | WA Architecture | ClubOS Architecture |
|----------|-----------------|---------------------|
| Permissions | 4 preset levels | 40+ capabilities, object-scoped |
| Audit | Optional, incomplete | Required, immutable, attributable |
| Destructive actions | Immediate, cascading | State machine, soft delete, safeguards |
| Publishing | Live immediately | Draft/preview/publish lifecycle |
| Backup | Patchwork of exports | First-class feature with verification |

The choice is not between two feature lists. It is between two architectural approaches to organizational data safety.

---

## Related Documents

- [ClubOS System Guarantees](../reliability/SYSTEM_GUARANTEES.md) - Full guarantee specification
- [Data Invariants](../reliability/DATA_INVARIANTS.md) - Data integrity rules
- [Architectural Charter](../ARCHITECTURAL_CHARTER.md) - Design principles
- [Backup Execution and Retention](../reliability/BACKUP_EXECUTION_AND_RETENTION.md) - Recovery design
