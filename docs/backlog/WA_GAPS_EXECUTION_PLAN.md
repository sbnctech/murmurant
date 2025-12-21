# WA Gaps Execution Plan

Copyright (c) Santa Barbara Newcomers Club
Status: Canonical Execution Plan
Last Updated: 2025-12-21

---

## Purpose

This document converts the WILD_APRICOT_GAPS_BACKLOG.md into an actionable
execution plan with explicit tracks, priorities, owners, dependencies,
and testable acceptance criteria.

**Source:** [WILD_APRICOT_GAPS_BACKLOG.md](./WILD_APRICOT_GAPS_BACKLOG.md)

---

## Track Mapping

| Track | Description | Owner Role |
|-------|-------------|------------|
| A | Editor and Publishing | System |
| B | Reliability Stubs + CI | System |
| C | Reliability Enablement | System/Backup |
| D | Operations (Runbooks) | System |
| E | Infra and Resilience | System |
| F | Solutions Onboarding | System |
| G | WA Gap Closure | System |
| H | Events and Registrations | System |
| J | Finance and Payments | Finance |
| K | Communications | Comms |

---

## P0 Next 10 (Sequenced)

Critical items that must be completed in order. Each unlocks downstream work.

| Seq | Gap ID | Title | Track | Owner | Depends On | Est Days |
|-----|--------|-------|-------|-------|------------|----------|
| 1 | WA-GAP-015 | Soft delete pattern | G/Data | System | None | 3 |
| 2 | WA-GAP-016 | Cancel vs Delete semantics | H | System | WA-GAP-015 | 2 |
| 3 | WA-GAP-029 | Draft preview before publish | A | System | A3 spec | 3 |
| 4 | WA-GAP-011 | Comprehensive action logging | B | System | B1 stubs | 2 |
| 5 | WA-GAP-044 | Email deliverability | K | Comms | None | 3 |
| 6 | WA-GAP-017 | Trash view (recycle bin) | G/Data | System | WA-GAP-015 | 2 |
| 7 | WA-GAP-022 | On-demand backup trigger | C | Backup | C6 scaffold | 3 |
| 8 | WA-GAP-003 | Role builder UI | G/RBAC | System | None | 4 |
| 9 | WA-GAP-035 | Mobile check-in | H | System | WA-GAP-005 | 5 |
| 10 | WA-GAP-020 | Comprehensive data export | G/Data | System | None | 3 |

**Total estimated effort:** 30 days (non-parallel)

**Parallelization opportunities:**
- Items 1, 5, 8, 10 can run in parallel (no dependencies)
- Items 2, 6 depend on item 1
- Item 3 depends on A3 spec (Track A)
- Item 4 depends on B1 (Track B)

---

## Execution Plan by Track

### Track A: Editor and Publishing (Gaps)

| Gap ID | Title | Priority | Owner | Dependencies | Status |
|--------|-------|----------|-------|--------------|--------|
| WA-GAP-029 | Draft preview before publish | P0 | System | A3 lifecycle spec | BACKLOG |
| WA-GAP-028 | Page version history | P2 | System | A3, A4 | BACKLOG |
| WA-GAP-031 | SEO field control | P2 | System | A4 | BACKLOG |
| WA-GAP-032 | Publish scheduling | P2 | System | A3, background jobs | BACKLOG |

#### WA-GAP-029: Draft preview before publish

**Acceptance Criteria:**
- [ ] Preview shows exactly what will be published
- [ ] Preview respects audience rules (server-side enforcement)
- [ ] Preview URL shareable with time-limited token
- [ ] Preview isolated from production (cannot affect live pages)
- [ ] Mobile preview mode available
- [ ] Test: Preview matches published output exactly

**Dependencies:** A3 Publishing lifecycle spec

---

#### WA-GAP-028: Page version history

**Acceptance Criteria:**
- [ ] Each publish creates immutable version record
- [ ] Version list visible in editor (newest first)
- [ ] Rollback to previous version via single action
- [ ] Diff view shows changes between versions
- [ ] Version metadata: actor, timestamp, commit message
- [ ] Test: Rollback restores previous content exactly

**Dependencies:** Publishing lifecycle (A3), page model (A4)

---

#### WA-GAP-031: SEO field control

**Acceptance Criteria:**
- [ ] SEO title override per page (distinct from H1)
- [ ] Meta description field per page
- [ ] Open Graph image selection per page
- [ ] Canonical URL override
- [ ] Robots meta control (index/noindex, follow/nofollow)
- [ ] Test: Meta tags render correctly in HTML head

**Dependencies:** Page editor completion (A4)

---

#### WA-GAP-032: Publish scheduling

**Acceptance Criteria:**
- [ ] Schedule publish date/time via calendar picker
- [ ] Timezone-aware scheduling (org timezone)
- [ ] Scheduled items visible in publish queue
- [ ] Cancel scheduled publish before execution
- [ ] Audit log on scheduled execution
- [ ] Test: Page publishes at scheduled time

**Dependencies:** Publishing lifecycle (A3), background job infrastructure

---

### Track G: WA Gap Closure - Data Safety

| Gap ID | Title | Priority | Owner | Dependencies | Status |
|--------|-------|----------|-------|--------------|--------|
| WA-GAP-015 | Soft delete pattern | P0 | System | None | BACKLOG |
| WA-GAP-017 | Trash view | P1 | System | WA-GAP-015 | BACKLOG |
| WA-GAP-018 | Bulk operation preview | P1 | System | None | BACKLOG |
| WA-GAP-020 | Comprehensive data export | P1 | System | None | BACKLOG |

#### WA-GAP-015: Soft delete pattern

**Acceptance Criteria:**
- [ ] Delete operations set `deletedAt` timestamp (not hard delete)
- [ ] Recovery window: 30 days (configurable per tier)
- [ ] Hard delete requires `admin:full` + explicit confirmation
- [ ] Deleted items excluded from normal queries via default filter
- [ ] Admin can view deleted items via trash view
- [ ] Test: Deleted item recoverable within window
- [ ] Test: Deleted item excluded from member views

**Dependencies:** None (foundational)

**Schema changes:**
```prisma
model Member {
  deletedAt  DateTime?
  deletedBy  String?   @db.Uuid
}
// Similar for Event, Page, etc.
```

---

#### WA-GAP-017: Trash view (recycle bin)

**Acceptance Criteria:**
- [ ] Admin UI shows trash view per resource type
- [ ] Restore action moves item back to active
- [ ] Permanent delete from trash (with confirmation)
- [ ] Auto-purge after retention period (background job)
- [ ] Trash items never visible in public/member views
- [ ] Test: Restore preserves all original data

**Dependencies:** WA-GAP-015 (soft delete pattern)

---

#### WA-GAP-018: Bulk operation preview

**Acceptance Criteria:**
- [ ] Bulk operations show preview of affected records
- [ ] Confirmation dialog displays exact count
- [ ] Audit log entry per affected record (batch ID links them)
- [ ] Dry-run mode shows what would happen
- [ ] Progress indicator for long operations
- [ ] Test: Preview matches actual execution

**Dependencies:** None

---

#### WA-GAP-020: Comprehensive data export

**Acceptance Criteria:**
- [ ] Export all member data to CSV/JSON
- [ ] Export event data with registration details
- [ ] Export financial records (if `finance:view` granted)
- [ ] Include related data (not flat tables)
- [ ] Machine-readable schema documentation included
- [ ] Test: Export/import round-trip preserves data

**Dependencies:** Data model stabilization

**API Endpoint:**
```
GET /api/v1/admin/export?type=members&format=csv
GET /api/v1/admin/export?type=events&format=json
```

---

### Track G: WA Gap Closure - RBAC

| Gap ID | Title | Priority | Owner | Dependencies | Status |
|--------|-------|----------|-------|--------------|--------|
| WA-GAP-003 | Role builder UI | P1 | System | None | BACKLOG |
| WA-GAP-005 | Check-in capability | P1 | System | None | BACKLOG |
| WA-GAP-006 | Role hierarchy | P1 | System | WA-GAP-003 | BACKLOG |
| WA-GAP-007 | Time-limited roles | P2 | System | WA-GAP-003 | BACKLOG |

#### WA-GAP-003: Role builder UI

**Acceptance Criteria:**
- [ ] Admin can create named custom roles
- [ ] Each role has explicit capability list (checkboxes)
- [ ] Role assignment creates audit entry
- [ ] Cannot assign capabilities user does not have
- [ ] UI shows role -> capability mapping clearly
- [ ] Test: Custom role grants only selected capabilities

**Dependencies:** Existing capability model

---

#### WA-GAP-005: Check-in capability separation

**Acceptance Criteria:**
- [ ] `events:checkin` capability distinct from `events:manage`
- [ ] Check-in role can mark attendance only
- [ ] Check-in role cannot edit event details
- [ ] Check-in role cannot access financial data
- [ ] Mobile-friendly check-in interface
- [ ] Test: Check-in role blocked from event edit

**Dependencies:** Capability model (already exists)

---

#### WA-GAP-006: Role hierarchy

**Acceptance Criteria:**
- [ ] Hierarchy: admin > board > chair > member
- [ ] Cannot escalate own permissions
- [ ] Committee scope limits visibility
- [ ] Board-level actions require board role minimum
- [ ] Clear UI indication of role level
- [ ] Test: Chair cannot grant board permissions

**Dependencies:** WA-GAP-003 (role builder)

---

#### WA-GAP-007: Time-limited roles

**Acceptance Criteria:**
- [ ] Role assignments can have end date
- [ ] Automatic revocation on expiration (cron job)
- [ ] Audit log records grant and revocation
- [ ] Admin notification 7 days before expiration
- [ ] Manual extension available via UI
- [ ] Test: Role auto-revokes on expiration

**Dependencies:** WA-GAP-003 (role builder)

---

### Track G: WA Gap Closure - Audit

| Gap ID | Title | Priority | Owner | Dependencies | Status |
|--------|-------|----------|-------|--------------|--------|
| WA-GAP-011 | Comprehensive action logging | P1 | System | B1 | BACKLOG |
| WA-GAP-012 | Audit log export | P2 | System | WA-GAP-011 | BACKLOG |
| WA-GAP-013 | Sensitive action alerts | P2 | Security | WA-GAP-011 | BACKLOG |

#### WA-GAP-011: Comprehensive action logging

**Acceptance Criteria:**
- [ ] All write operations create audit entry
- [ ] Entries include: action, resource, actor, timestamp
- [ ] Bulk operations logged individually (batch ID)
- [ ] Query available for compliance review
- [ ] Retention policy: 24 months minimum
- [ ] Test: Every write path creates audit entry

**Dependencies:** B1 (audit stub)

---

#### WA-GAP-012: Audit log export

**Acceptance Criteria:**
- [ ] Export to CSV/JSON formats
- [ ] Date range filtering
- [ ] Action type filtering
- [ ] Actor filtering
- [ ] Resource type filtering
- [ ] Tamper-evident export (SHA-256 checksum)
- [ ] Test: Export checksum matches content

**Dependencies:** WA-GAP-011 (comprehensive logging)

**API Endpoint:**
```
GET /api/v1/admin/audit/export?from=2025-01-01&to=2025-12-31
```

---

#### WA-GAP-013: Sensitive action alerts

**Acceptance Criteria:**
- [ ] Configurable alert rules per org
- [ ] Email notification for triggered rules
- [ ] High-risk actions predefined: delete, permission change, bulk ops
- [ ] Custom rule creation UI
- [ ] Audit of alert configuration changes
- [ ] Test: Alert fires on matching action

**Dependencies:** WA-GAP-011, notification infrastructure

---

### Track G: WA Gap Closure - Integration

| Gap ID | Title | Priority | Owner | Dependencies | Status |
|--------|-------|----------|-------|--------------|--------|
| WA-GAP-051 | Outbound webhooks | P2 | System | None | BACKLOG |

#### WA-GAP-051: Outbound webhooks

**Acceptance Criteria:**
- [ ] Webhook configuration UI in admin settings
- [ ] Event types: member.created, member.updated, event.published, registration.confirmed
- [ ] Payload includes resource data and actor attribution
- [ ] Retry with exponential backoff (3 attempts, 1m/5m/30m)
- [ ] Webhook delivery log with status visible in admin
- [ ] Signature verification (HMAC-SHA256) for receiver validation
- [ ] Test: Webhook fires on triggering event
- [ ] Test: Failed delivery retries correctly

**Dependencies:** None (but requires background job infrastructure)

**Cognitive Load Justification:** Without webhooks, integrations require polling
or custom development. Standard webhook patterns transfer from other SaaS tools.

---

### Track G: WA Gap Closure - UX/Help

| Gap ID | Title | Priority | Owner | Dependencies | Status |
|--------|-------|----------|-------|--------------|--------|
| WA-GAP-052 | In-context help text | P2 | System | None | BACKLOG |

#### WA-GAP-052: In-context help text

**Acceptance Criteria:**
- [ ] Help text visible on all admin screens (tooltip or inline)
- [ ] Help text explains "why" not just "how" (Charter P6)
- [ ] Error messages include: what happened, why, what to do next
- [ ] State machine transitions have transition-specific guidance
- [ ] Permission denials explain which capability is missing
- [ ] Help content is maintainable (not hard-coded strings)
- [ ] Test: All admin routes have help text coverage

**Dependencies:** None

**Charter Reference:** P6 (Human-first UI language)

**Cognitive Load Justification:** In-context help eliminates need for external
documentation lookup. Volunteers can understand the system from within the UI.

---

### Track H: Events and Registrations

| Gap ID | Title | Priority | Owner | Dependencies | Status |
|--------|-------|----------|-------|--------------|--------|
| WA-GAP-016 | Cancel vs Delete semantics | P0 | System | WA-GAP-015 | BACKLOG |
| WA-GAP-035 | Mobile check-in | P1 | System | WA-GAP-005 | BACKLOG |
| WA-GAP-037 | Recurring events | P2 | System | None | BACKLOG |

#### WA-GAP-016: Cancel vs Delete semantics

**Acceptance Criteria:**
- [ ] Event cancellation preserves all financial records
- [ ] Event deletion blocked if financial records exist
- [ ] Refunds require explicit action (not automatic)
- [ ] Clear UI distinction: Cancel (status) vs Delete (removal)
- [ ] Audit trail for both paths
- [ ] Test: Cancelled event retains invoice references
- [ ] Test: Delete blocked when invoices exist

**Dependencies:** WA-GAP-015 (soft delete for delete path)

---

#### WA-GAP-035: Mobile check-in

**Acceptance Criteria:**
- [ ] Mobile-optimized check-in UI (touch-friendly)
- [ ] QR code scanning option
- [ ] Works offline with sync on reconnect
- [ ] Check-in role separation enforced
- [ ] Real-time attendance count display
- [ ] Test: Offline check-ins sync correctly

**Dependencies:** WA-GAP-005 (check-in capability)

---

#### WA-GAP-037: Recurring events

**Acceptance Criteria:**
- [ ] Create recurring event pattern (weekly, monthly, etc.)
- [ ] Generate instances from pattern
- [ ] Edit single instance or entire series
- [ ] Exception handling (skip specific dates)
- [ ] Clear UI for series vs individual instance
- [ ] Test: Series edit affects all future instances

**Dependencies:** None (but complex - P2 for reason)

---

### Track C: Backup and Restore (Gaps)

| Gap ID | Title | Priority | Owner | Dependencies | Status |
|--------|-------|----------|-------|--------------|--------|
| WA-GAP-022 | On-demand backup trigger | P1 | Backup | C6 | BACKLOG |
| WA-GAP-024 | Point-in-time recovery | P1 | Backup | C6 | BACKLOG |
| WA-GAP-025 | Backup verification | P1 | Backup | WA-GAP-022 | BACKLOG |
| WA-GAP-026 | Historical data recovery | P1 | Backup | WA-GAP-015, C6 | BACKLOG |

#### WA-GAP-022: On-demand backup trigger

**Acceptance Criteria:**
- [ ] Admin can trigger backup manually via UI
- [ ] Backup includes complete data snapshot
- [ ] Download link available after completion
- [ ] Backup status visible in admin dashboard
- [ ] Rate-limited: 1 per hour maximum
- [ ] Test: Manual backup produces valid archive

**Dependencies:** C6 backup infrastructure

---

#### WA-GAP-024: Point-in-time recovery

**Acceptance Criteria:**
- [ ] WAL archiving enabled (database level)
- [ ] Recovery to specific timestamp possible
- [ ] Recovery window: 7 days minimum
- [ ] Recovery requires support (not self-service)
- [ ] Verification procedure after recovery
- [ ] Test: PITR restores to exact timestamp

**Dependencies:** C6 backup infrastructure, database provider

---

#### WA-GAP-025: Backup verification

**Acceptance Criteria:**
- [ ] Automated backup verification weekly
- [ ] Restore test to isolated environment
- [ ] Verification report generated
- [ ] Alert on verification failure
- [ ] Documented in compliance reports
- [ ] Test: Verification catches corrupted backup

**Dependencies:** WA-GAP-022 (backup trigger)

---

#### WA-GAP-026: Historical data recovery

**Acceptance Criteria:**
- [ ] Soft delete provides immediate recovery path
- [ ] Backups provide fallback for hard deletes
- [ ] Recovery procedure documented in runbook
- [ ] Tier-specific recovery SLAs
- [ ] Audit trail of recovery actions
- [ ] Test: Recovery workflow end-to-end

**Dependencies:** WA-GAP-015, C6 backup infrastructure

---

### Track J: Finance and Payments

| Gap ID | Title | Priority | Owner | Dependencies | Status |
|--------|-------|----------|-------|--------------|--------|
| WA-GAP-039 | Multiple payment processors | P1 | Finance | None | BACKLOG |
| WA-GAP-041 | Streamlined refunds | P1 | Finance | WA-GAP-039 | BACKLOG |
| WA-GAP-042 | Invoice customization | P2 | Finance | None | BACKLOG |

#### WA-GAP-039: Multiple payment processors

**Acceptance Criteria:**
- [ ] Stripe integration (primary) - complete
- [ ] PayPal option (secondary)
- [ ] Processor selection at org level
- [ ] Transaction fees transparent in UI
- [ ] Processor-agnostic reporting
- [ ] Test: Payment flows through selected processor

**Dependencies:** Payment abstraction layer

---

#### WA-GAP-041: Streamlined refunds

**Acceptance Criteria:**
- [ ] Refund initiated from registration detail view
- [ ] Full or partial refund options
- [ ] Refund reason required (dropdown + text)
- [ ] Audit trail complete
- [ ] Email notification to member
- [ ] Test: Refund processed through correct gateway

**Dependencies:** WA-GAP-039 (processor abstraction)

---

#### WA-GAP-042: Invoice customization

**Acceptance Criteria:**
- [ ] Custom logo on invoices
- [ ] Configurable footer text
- [ ] Tax/fee line items displayed
- [ ] PDF export
- [ ] Email delivery with PDF attachment
- [ ] Test: Invoice renders with org branding

**Dependencies:** Invoice model, email templates

---

### Track K: Communications

| Gap ID | Title | Priority | Owner | Dependencies | Status |
|--------|-------|----------|-------|--------------|--------|
| WA-GAP-044 | Email deliverability | P1 | Comms | None | BACKLOG |
| WA-GAP-047 | Campaign scheduling | P1 | Comms | None | BACKLOG |

#### WA-GAP-044: Email deliverability

**Acceptance Criteria:**
- [ ] SPF/DKIM/DMARC configured for sending domain
- [ ] Dedicated sending domain option (tier-based)
- [ ] Bounce handling and automatic list hygiene
- [ ] Deliverability reporting in admin
- [ ] Unsubscribe compliance (CAN-SPAM, GDPR)
- [ ] Test: Emails pass SPF/DKIM checks

**Dependencies:** Email infrastructure selection (Resend, SendGrid, etc.)

---

#### WA-GAP-047: Campaign scheduling

**Acceptance Criteria:**
- [ ] Schedule send date/time via calendar picker
- [ ] Timezone-aware scheduling (org timezone)
- [ ] Preview before send (audience sample)
- [ ] Cancel scheduled sends before execution
- [ ] Delivery reporting after send
- [ ] Test: Campaign sends at scheduled time

**Dependencies:** Campaign model, background job infrastructure

---

### Track G: Reporting (Gaps)

| Gap ID | Title | Priority | Owner | Dependencies | Status |
|--------|-------|----------|-------|--------------|--------|
| WA-GAP-048 | Essential dashboards | P1 | System | None | BACKLOG |
| WA-GAP-049 | Configurable dashboards | P2 | System | WA-GAP-048 | BACKLOG |
| WA-GAP-050 | API for external BI | P2 | System | None | BACKLOG |

#### WA-GAP-048: Essential dashboards

**Acceptance Criteria:**
- [ ] Member count and trend dashboard
- [ ] Event attendance summary
- [ ] Revenue summary (if payments enabled)
- [ ] Renewal rate metrics
- [ ] Export to CSV
- [ ] Test: Dashboard data matches source queries

**Dependencies:** Data model stabilization

---

#### WA-GAP-049: Configurable dashboards

**Acceptance Criteria:**
- [ ] Role-specific default dashboards
- [ ] Widget customization (show/hide)
- [ ] Saved dashboard configurations per user
- [ ] Date range controls
- [ ] Refresh controls
- [ ] Test: Custom config persists across sessions

**Dependencies:** WA-GAP-048 (essential dashboards)

---

#### WA-GAP-050: API for external BI

**Acceptance Criteria:**
- [ ] Read-only API for reporting
- [ ] OAuth authentication
- [ ] Rate limiting
- [ ] Standard data formats (JSON, CSV)
- [ ] API documentation
- [ ] Test: External tool can query data

**Dependencies:** API infrastructure, authentication

---

## Summary by Track

| Track | Total | P0 | P1 | P2 | Solved |
|-------|-------|----|----|----|----|
| A (Editor/Publishing) | 4 | 1 | 1 | 2 | 2 |
| G (Data Safety) | 4 | 1 | 3 | 0 | 0 |
| G (RBAC) | 4 | 0 | 3 | 1 | 4 |
| G (Audit) | 3 | 0 | 1 | 2 | 3 |
| G (Integration) | 1 | 0 | 0 | 1 | 0 |
| G (UX/Help) | 1 | 0 | 0 | 1 | 0 |
| H (Events) | 3 | 1 | 1 | 1 | 3 |
| C (Backup) | 4 | 0 | 4 | 0 | 1 |
| J (Finance) | 3 | 0 | 2 | 1 | 1 |
| K (Comms) | 2 | 0 | 2 | 0 | 1 |
| G (Reporting) | 3 | 0 | 1 | 2 | 0 |
| **TOTAL** | **33** | **3** | **18** | **12** | **15** |

---

## Verification Commands

```bash
# Verify document structure
head -100 docs/backlog/WA_GAPS_EXECUTION_PLAN.md

# Count backlog items
grep -c "^#### WA-GAP" docs/backlog/WA_GAPS_EXECUTION_PLAN.md

# List P0 items
grep -B1 "Priority.*P0" docs/backlog/WA_GAPS_EXECUTION_PLAN.md

# Cross-reference with source
diff <(grep "WA-GAP-0[0-9][0-9]" docs/backlog/WILD_APRICOT_GAPS_BACKLOG.md | wc -l) \
     <(grep "WA-GAP-0[0-9][0-9]" docs/backlog/WA_GAPS_EXECUTION_PLAN.md | wc -l)
```

---

## See Also

- [WILD_APRICOT_GAPS_BACKLOG.md](./WILD_APRICOT_GAPS_BACKLOG.md) - Source document
- [WORK_QUEUE.md](./WORK_QUEUE.md) - Track definitions and sequencing
- [CLUBOS_VS_WA_50_ISSUE_MATRIX.md](../competitive/CLUBOS_VS_WA_50_ISSUE_MATRIX.md) - Issue mapping
- [WILD_APRICOT_TOP_50_ISSUES.md](../competitive/WILD_APRICOT_TOP_50_ISSUES.md) - Source issues
