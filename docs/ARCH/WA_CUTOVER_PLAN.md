<!--
  Copyright © 2025 Murmurant, Inc. All rights reserved.
-->

# F5: Wild Apricot Gradual Cutover Plan

```
Status: PROPOSED
Version: 1.0
Created: 2025-12-29
Related: MIGRATION_INTEGRATION_ARCHITECTURE.md, WORK_QUEUE.md F5
```

---

## 1. Overview

This document defines the criteria and process for migrating entity types from
Wild Apricot (WA) authoritative to Murmurant (MM) authoritative. The cutover
happens per-entity-type, not all-at-once, reducing risk and allowing validation.

### 1.1 Migration Stages Recap

| Stage | WA Role | MM Role | Entities Affected |
|-------|---------|---------|-------------------|
| Stage 1 | Source of truth | UI + cached reads | Members, Events, Registrations |
| Stage 2 | Source of truth | UI + write-through | Members, Events, Registrations |
| **Stage 3** | Backup/archive | **Source of truth** | Per-entity cutover |

This document focuses on **Stage 2 → Stage 3** transitions for each entity type.

---

## 2. Per-Entity Cutover Order

Entities are migrated in order of risk, lowest first:

| Order | Entity Type | Risk Level | Dependencies |
|-------|-------------|------------|--------------|
| 1 | Pages/Content | Low | None (already MM authoritative) |
| 2 | Governance | Low | None (already MM authoritative) |
| 3 | Events | Medium | Members (for organizers) |
| 4 | Registrations | Medium | Events, Members |
| 5 | Members | High | Core identity, payments |
| 6 | Payments | Critical | Members, external processor |

### 2.1 Rationale

- **Pages/Content**: Already MM authoritative, no cutover needed
- **Events**: Can create in MM, registrations still flow to WA
- **Registrations**: Tied to events, requires event cutover first
- **Members**: Core identity, affects all other entities
- **Payments**: Deferred, may remain WA indefinitely

---

## 3. Cutover Criteria

### 3.1 Technical Readiness (All Entities)

| Criterion | Threshold | Verification |
|-----------|-----------|--------------|
| Zero pending writes | 48+ hours | `getPendingWriteStatus().queueDepth === 0` |
| Sync error rate | < 0.1% | Audit log analysis |
| Write-through success rate | > 99% | Audit log analysis |
| Reconciliation discrepancies | < 0.1% | Nightly reconciliation report |
| Cache hit rate | > 80% | `getSyncStatus().cacheStats.hitRate` |
| Data integrity tests | 100% pass | Validation suite |

### 3.2 Entity-Specific Criteria

#### Events Cutover

| Criterion | Threshold | Notes |
|-----------|-----------|-------|
| Events created in MM | > 50% of new events | Adoption metric |
| Event sync accuracy | 100% | All WA events mirrored |
| Registration flow tested | Pass | E2E tests with WA |

#### Registrations Cutover

| Criterion | Threshold | Notes |
|-----------|-----------|-------|
| Events cutover complete | Yes | Dependency |
| Registration sync accuracy | 100% | All registrations mirrored |
| Payment flow tested | Pass | If payments involved |

#### Members Cutover

| Criterion | Threshold | Notes |
|-----------|-----------|-------|
| Member sync accuracy | 100% | All members mirrored |
| Profile edit flow tested | Pass | Write-through verified |
| Membership status sync | Pass | Lapsed/active transitions |
| Email sync verified | Pass | Communication integrity |

---

## 4. Pre-Cutover Checklist

### 4.1 Technical Checklist

- [ ] **Data Validation Suite passes** (Section 6)
- [ ] **Zero pending writes** for 48+ hours
- [ ] **Reconciliation clean** for 7+ days
- [ ] **All write-through operations tested** in staging
- [ ] **Rollback procedure tested** in staging
- [ ] **Backup completed** before cutover window
- [ ] **Monitoring dashboards configured**
- [ ] **Alert thresholds set** for post-cutover

### 4.2 Operational Checklist

- [ ] **Operator trained** on MM-only workflows
- [ ] **Support documentation updated**
- [ ] **Communication sent** to affected users
- [ ] **Rollback owner assigned**
- [ ] **Cutover window scheduled** (low-activity period)
- [ ] **WA access preserved** for 30 days post-cutover

### 4.3 Stakeholder Checklist

- [ ] **Technical lead sign-off**
- [ ] **Operator sign-off**
- [ ] **48-hour quiet period** before cutover
- [ ] **Go/No-Go meeting held**

---

## 5. Rollback Procedures

### 5.1 Rollback Decision Criteria

Initiate rollback if ANY of:

- Data corruption detected
- > 5% of operations failing
- Critical business function blocked
- Operator requests rollback

### 5.2 Rollback Steps

#### Immediate Actions (0-5 minutes)

1. **Disable MM writes** - Set `WA_WRITE_THROUGH_ENABLED=false`
2. **Alert operators** - Send notification
3. **Log decision** - Document reason in incident log

#### Short-term (5-30 minutes)

1. **Verify WA accessibility** - Confirm WA is operational
2. **Redirect users to WA** - Update UI messaging
3. **Preserve MM state** - Snapshot current data

#### Recovery (30+ minutes)

1. **Analyze discrepancies** - Compare MM vs WA data
2. **Plan data reconciliation** - Identify what needs merging
3. **Execute reconciliation** - Carefully merge changes
4. **Update documentation** - Record lessons learned

### 5.3 Rollback Testing

Before production cutover:

1. Deploy to staging
2. Simulate cutover
3. Introduce failure condition
4. Execute rollback
5. Verify data integrity
6. Document results

---

## 6. Data Validation Suite

### 6.1 Validation Categories

| Category | Description | Frequency |
|----------|-------------|-----------|
| Completeness | All WA records exist in MM | Nightly |
| Accuracy | Field values match | Nightly |
| Consistency | Relationships intact | Nightly |
| Freshness | Sync lag acceptable | Continuous |

### 6.2 Member Validation

```typescript
interface MemberValidation {
  // Completeness
  allWaMembersInMm: boolean;
  missingMembers: number[];

  // Accuracy
  emailMismatches: Array<{ waId: number; waEmail: string; mmEmail: string }>;
  nameMismatches: Array<{ waId: number; waName: string; mmName: string }>;
  statusMismatches: Array<{ waId: number; waStatus: string; mmStatus: string }>;

  // Consistency
  orphanedMmMembers: string[]; // In MM but not WA
  duplicateEmails: string[];

  // Summary
  totalChecked: number;
  passRate: number;
}
```

### 6.3 Event Validation

```typescript
interface EventValidation {
  // Completeness
  allWaEventsInMm: boolean;
  missingEvents: number[];

  // Accuracy
  titleMismatches: Array<{ waId: number; waTitle: string; mmTitle: string }>;
  dateMismatches: Array<{ waId: number; waDate: string; mmDate: string }>;
  registrationCountMismatches: Array<{ waId: number; waCount: number; mmCount: number }>;

  // Summary
  totalChecked: number;
  passRate: number;
}
```

### 6.4 Registration Validation

```typescript
interface RegistrationValidation {
  // Completeness
  allWaRegistrationsInMm: boolean;
  missingRegistrations: number[];

  // Accuracy
  statusMismatches: Array<{ waId: number; waStatus: string; mmStatus: string }>;
  eventMismatches: Array<{ waId: number; waEventId: number; mmEventId: string }>;

  // Consistency
  orphanedRegistrations: string[]; // Registration without member or event

  // Summary
  totalChecked: number;
  passRate: number;
}
```

### 6.5 Validation Thresholds

| Metric | Warning | Critical | Block Cutover |
|--------|---------|----------|---------------|
| Missing records | > 0 | > 10 | > 0 |
| Field mismatches | > 1% | > 5% | > 1% |
| Orphaned records | > 0 | > 10 | > 0 |
| Overall pass rate | < 99.9% | < 99% | < 99.9% |

---

## 7. Post-Cutover Monitoring

### 7.1 First 24 Hours (Intensive)

| Metric | Check Frequency | Alert Threshold |
|--------|-----------------|-----------------|
| Error rate | Every 5 min | > 1% |
| Operation latency | Every 5 min | p99 > 5s |
| User complaints | Continuous | Any |
| Data discrepancies | Hourly | Any |

### 7.2 First Week (Elevated)

| Metric | Check Frequency | Alert Threshold |
|--------|-----------------|-----------------|
| Error rate | Every 15 min | > 0.5% |
| Reconciliation status | Daily | Any discrepancy |
| User satisfaction | Daily | Negative trend |

### 7.3 Ongoing (Normal)

| Metric | Check Frequency | Alert Threshold |
|--------|-----------------|-----------------|
| Error rate | Hourly | > 0.1% |
| Reconciliation | Weekly | > 0 discrepancies |
| Audit log review | Weekly | Anomalies |

---

## 8. Communication Plan

### 8.1 Pre-Cutover (1 week before)

**Audience**: All members
**Message**: "We're upgrading our membership system. You may notice some changes on [date]. No action required."

### 8.2 Cutover Day

**Audience**: All members
**Message**: "Our system upgrade is complete. If you experience any issues, contact [support email]."

### 8.3 Post-Cutover (If Issues)

**Audience**: Affected users
**Message**: "We've identified an issue with [specific function]. Our team is working on it. Expected resolution: [time]."

---

## 9. Cutover Timeline Template

| Time | Activity | Owner | Duration |
|------|----------|-------|----------|
| T-7d | Final validation suite run | Engineering | 1 hour |
| T-3d | Staging rollback test | Engineering | 2 hours |
| T-2d | Pre-cutover communication | Operations | - |
| T-1d | Final go/no-go meeting | All | 30 min |
| T-0h | Begin cutover window | Engineering | - |
| T+0:15 | Disable WA writes | Engineering | 5 min |
| T+0:30 | Enable MM authoritative | Engineering | 5 min |
| T+1:00 | Smoke tests | Engineering | 30 min |
| T+2:00 | Operator validation | Operations | 30 min |
| T+4:00 | Intensive monitoring begins | Engineering | 20 hours |
| T+24h | All-clear (or rollback) | All | - |

---

## 10. Related Documents

| Document | Purpose |
|----------|---------|
| [MIGRATION_INTEGRATION_ARCHITECTURE.md](./MIGRATION_INTEGRATION_ARCHITECTURE.md) | Overall migration architecture |
| [WA_API_SECURITY.md](./WA_API_SECURITY.md) | WA API security model |
| [WORK_QUEUE.md](../backlog/WORK_QUEUE.md) | Task tracking |

---

_This document defines the F5 cutover plan. Implementation requires stakeholder approval before execution._
