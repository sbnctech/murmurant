# Migration Risk Register

```
Audience: Board Members, Executive Directors, Non-Technical Decision-Makers
Purpose: Document risks associated with Wild Apricot to Murmurant migration
Classification: Governance Document
```

---

## Overview

This document identifies risks associated with migrating an organization from Wild Apricot to Murmurant. Each risk includes likelihood, impact, mitigation measures, and abort signals.

All mitigations reference existing documented mechanisms. No speculative or unimplemented features are listed.

---

## Risk Rating Definitions

**Likelihood:**

| Rating | Definition |
|--------|------------|
| Low | Unlikely to occur under normal operation |
| Medium | May occur; has been observed in similar migrations |
| High | Expected to occur without active mitigation |

**Impact:**

| Rating | Definition |
|--------|------------|
| Low | Minor inconvenience; easily correctable |
| Medium | Noticeable disruption; requires operator intervention |
| High | Significant harm to operations, reputation, or finances |
| Critical | Existential threat to organization operations |

---

## Risk Register

### R1: Member Data Loss

| Attribute | Value |
|-----------|-------|
| **Risk** | Member records are lost or corrupted during migration |
| **Likelihood** | Low |
| **Impact** | Critical |
| **Category** | Data Integrity |

**Mitigation:**

- Wild Apricot remains the authoritative source until explicit commit (docs/BIZ/ORGANIZATIONAL_PRESENTATION_PHILOSOPHY.md)
- Migration runs in dry-run mode first; live import requires explicit `--yes` flag (scripts/migration/README.md)
- Members are matched by email; duplicates are flagged, not silently merged
- All imports are idempotent; safe to re-run without duplication
- Audit log entries record every privileged action (ARCHITECTURAL_CHARTER.md, P1)

**Abort Signal:**

- Dry-run report shows unexpected record counts
- Reconciliation report shows unmatched or conflicting records
- Operator observes missing members in preview

---

### R2: Calendar and Event Corruption

| Attribute | Value |
|-----------|-------|
| **Risk** | Events appear at wrong times, wrong dates, or are missing |
| **Likelihood** | Medium |
| **Impact** | High |
| **Category** | Data Integrity |

**Mitigation:**

- Events are matched by title and start time with tolerance window (scripts/migration/README.md)
- All event times stored as UTC instants; displayed in organization timezone (docs/ARCH/CALENDAR_TIME_MODEL.md)
- Timezone handling uses IANA identifiers, not ambiguous abbreviations
- Preview mode allows visual verification before commit
- Nothing publishes without explicit operator approval (ORGANIZATIONAL_PRESENTATION_PHILOSOPHY.md)

**Abort Signal:**

- Preview shows events on incorrect dates
- Time zone conversions produce unexpected results
- Event count mismatch between Wild Apricot and Murmurant preview

---

### R3: Permission Escalation

| Attribute | Value |
|-----------|-------|
| **Risk** | Users gain administrative access they should not have |
| **Likelihood** | Low |
| **Impact** | Critical |
| **Category** | Security |

**Mitigation:**

- Default deny policy; access denied unless explicitly granted (ARCHITECTURAL_CHARTER.md, P2)
- Authorization decisions are server-side, object-scoped, not UI-only
- No "implicit admin" behavior; every privileged action requires explicit authorization
- Audit log entries for all privileged actions (ARCHITECTURAL_CHARTER.md, P1)
- Role assignments require explicit operator action; not inferred from Wild Apricot data

**Abort Signal:**

- Audit log shows unexpected privilege grants
- Users report access to areas they should not see
- Security review identifies misconfigured roles

---

### R4: Financial Record Errors

| Attribute | Value |
|-----------|-------|
| **Risk** | Payment history, dues status, or financial records are incorrect after migration |
| **Likelihood** | Medium |
| **Impact** | High |
| **Category** | Data Integrity |

**Mitigation:**

- Financial records are read from Wild Apricot; Murmurant does not modify Wild Apricot data
- Membership levels and tier assignments are explicit, not inferred
- Dues status derived from auditable membership records
- Policy capture process documents financial rules before migration (scripts/migration/capture-policies.ts)
- Dry-run reports include financial record counts for verification

**Abort Signal:**

- Membership tier counts do not match Wild Apricot
- Dues-paid status inconsistent with Wild Apricot records
- Financial summary report shows discrepancies

---

### R5: Volunteer and Staff Overload

| Attribute | Value |
|-----------|-------|
| **Risk** | Migration process overwhelms volunteers or staff with unexpected work |
| **Likelihood** | Medium |
| **Impact** | Medium |
| **Category** | Operational |

**Mitigation:**

- Assisted reconstruction reduces manual work; system generates drafts for human review (ORGANIZATIONAL_PRESENTATION_PHILOSOPHY.md)
- Operators approve batches, not individual records
- Preview mode allows paced review without time pressure
- Abort is always possible; no penalty for pausing or stopping
- Migration can be paused and resumed; no forced timeline

**Abort Signal:**

- Volunteers report confusion or frustration with process
- Review backlog grows beyond manageable levels
- Quality of approvals declines (rubber-stamping)

---

### R6: Reputational Harm

| Attribute | Value |
|-----------|-------|
| **Risk** | Public-facing content is incorrect, embarrassing, or missing after migration |
| **Likelihood** | Medium |
| **Impact** | High |
| **Category** | Reputation |

**Mitigation:**

- Nothing publishes without explicit operator approval (ORGANIZATIONAL_PRESENTATION_PHILOSOPHY.md)
- Preview mode shows exactly how content will appear before commit
- Side-by-side comparison with Wild Apricot available during review
- Organizational identity is treated as first-order concern, not afterthought
- Presentation reconstruction follows documented methodology

**Abort Signal:**

- Preview content does not reflect organization's identity
- Key pages are missing or malformed
- Stakeholders express concern about public appearance

---

### R7: Service Interruption During Cutover

| Attribute | Value |
|-----------|-------|
| **Risk** | Members cannot access services during migration window |
| **Likelihood** | Low |
| **Impact** | Medium |
| **Category** | Operational |

**Mitigation:**

- Wild Apricot remains operational until explicit commit
- No forced cutover window; organization chooses timing
- Rehearsal mode allows practice without affecting production
- Rollback possible before final commit

**Abort Signal:**

- Technical issues prevent completing rehearsal
- Cutover window conflicts with critical organization activities
- Dependencies on Wild Apricot features not yet replicated in Murmurant

---

### R8: Registration and Event Sign-up Failures

| Attribute | Value |
|-----------|-------|
| **Risk** | Members cannot register for events after migration |
| **Likelihood** | Low |
| **Impact** | High |
| **Category** | Operational |

**Mitigation:**

- Registration lifecycle follows explicit state machine (ARCHITECTURAL_CHARTER.md, P3)
- Event-member relationships validated during import
- Dry-run mode exercises registration pathways
- Observability features surface registration failures (ARCHITECTURAL_CHARTER.md, P7)

**Abort Signal:**

- Dry-run shows registration mismatches
- Test registrations fail in preview environment
- Waitlist or capacity calculations incorrect

---

### R9: Communication Delivery Failures

| Attribute | Value |
|-----------|-------|
| **Risk** | Members do not receive expected communications after migration |
| **Likelihood** | Low |
| **Impact** | Medium |
| **Category** | Operational |

**Mitigation:**

- Communication lifecycle follows explicit state machine (ARCHITECTURAL_CHARTER.md, P3)
- Email delivery requires explicit approval; no automatic sends during migration
- Observability includes delivery status dashboards (ARCHITECTURAL_CHARTER.md, P7)
- Silent failures are surfaced, not hidden (ARCHITECTURAL_CHARTER.md, P7)

**Abort Signal:**

- Test communications not received
- Delivery reports show unexpected failures
- Contact information mapping incomplete

---

### R10: Irreversible Data Destruction

| Attribute | Value |
|-----------|-------|
| **Risk** | Data is permanently deleted without recovery option |
| **Likelihood** | Low |
| **Impact** | Critical |
| **Category** | Data Integrity |

**Mitigation:**

- Reversibility by design; destructive operations require explicit warning (ARCHITECTURAL_CHARTER.md, P5)
- Reset tool requires explicit confirmation phrase (scripts/migration/reset-sandbox.ts)
- Soft delete preferred over hard delete where possible
- Audit trail maintained for recovery purposes
- Wild Apricot data is never modified by Murmurant

**Abort Signal:**

- Operator uncertainty about what will be deleted
- Missing confirmation step for destructive action
- Audit log gaps

---

## Summary Matrix

| Risk | Likelihood | Impact | Primary Mitigation |
|------|------------|--------|-------------------|
| R1: Member Data Loss | Low | Critical | Dry-run mode, idempotent imports |
| R2: Calendar Corruption | Medium | High | UTC storage, preview verification |
| R3: Permission Escalation | Low | Critical | Default deny, audit logging |
| R4: Financial Errors | Medium | High | Explicit tier assignment, policy capture |
| R5: Volunteer Overload | Medium | Medium | Assisted reconstruction, paced review |
| R6: Reputational Harm | Medium | High | Preview before publish, side-by-side comparison |
| R7: Service Interruption | Low | Medium | WA operational until commit, no forced window |
| R8: Registration Failures | Low | High | State machines, dry-run validation |
| R9: Communication Failures | Low | Medium | Explicit approval, delivery dashboards |
| R10: Data Destruction | Low | Critical | Confirmation required, soft delete |

---

## Governance Notes

### Board Responsibilities

The board should ensure that:

1. Designated operators understand the abort signals for each risk
2. Migration timeline allows adequate review without pressure
3. Stakeholders have opportunity to preview before commit
4. Abort decision authority is clearly assigned

### Operator Responsibilities

Operators should:

1. Run dry-run mode before any live import
2. Review reconciliation reports for anomalies
3. Verify preview content with stakeholders
4. Document any deviations from expected behavior
5. Escalate abort signals promptly

---

## Related Documents

- [Organizational Presentation Philosophy](ORGANIZATIONAL_PRESENTATION_PHILOSOPHY.md) - Customer-facing migration approach
- [Architectural Charter](../ARCHITECTURAL_CHARTER.md) - System design principles
- [Migration Pipeline](../../scripts/migration/README.md) - Technical migration procedures

---

## Revision History

| Date | Change |
|------|--------|
| 2025-12-25 | Initial risk register |

---

_This document is intended for governance review. Technical implementation details are in referenced documents._
