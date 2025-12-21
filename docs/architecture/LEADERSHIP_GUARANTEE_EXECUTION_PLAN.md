# Leadership Guarantee Execution Plan

Copyright (c) Santa Barbara Newcomers Club
Status: Implementation Roadmap
Last Updated: 2025-12-21

---

## Purpose

This document closes the gap between leadership guarantee documentation and
implementation. It identifies "paper guarantees" from the leadership enablement
specification and provides a phased execution plan.

**Scope Constraints:**

- Does NOT redesign RBAC (capability model is fixed)
- Does NOT create governance workflows (organization-specific)
- DOES enforce time-bounded, auditable delegation

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Total guarantees documented | 22 |
| Guarantees with full implementation | 4 (18%) |
| Guarantees with partial implementation | 9 (41%) |
| Paper guarantees (no enforcement) | 9 (41%) |

**Critical finding:** Time-bounded authority is documented but not enforced.
Expired assignments remain effective until manually removed.

---

## Paper Guarantee Inventory

### Definition

A "paper guarantee" is a documented commitment with either:

- No enforcement mechanism in code
- No visibility in product UI
- No audit artifact proving compliance

### Identified Paper Guarantees

| ID | Guarantee | Current State |
|----|-----------|---------------|
| SD-3 | Chairs cannot escalate permissions | No validation |
| TB-1 | Access activates at scheduled time | Not checked |
| TB-2 | Access expires at scheduled time | Not checked |
| TB-5 | Expiry notifications sent | No job exists |
| TB-6 | Emergency override with reason | No UI or reason capture |
| DM-1 | President delegation workflow | No workflow |
| DM-2 | VP scoped delegation | No workflow |
| DM-3 | Chairs cannot assign roles | No server enforcement |
| DM-4 | No cross-domain delegation | No scope validation |

---

## Gap Categorization

### 1. Access Control Gaps

These gaps allow unauthorized access or prevent authorized access.

| Gap ID | Description | Risk Level | Guarantee Violated |
|--------|-------------|------------|-------------------|
| AC-1 | Date-based access not enforced | **CRITICAL** | TB-1, TB-2 |
| AC-2 | Escalation prevention missing | **HIGH** | SD-3 |
| AC-3 | Delegation scope not validated | **HIGH** | DM-3, DM-4 |
| AC-4 | Cross-committee access uncontrolled | MEDIUM | SD-5 |

**AC-1: Date-Based Access Not Enforced**

```
CURRENT STATE:
  RoleAssignment has startDate and endDate fields
  Permission checks do NOT validate against current date

CONSEQUENCE:
  - Future-dated assignment grants immediate access
  - Expired assignment retains access indefinitely
  - Time-bounded authority is fictional
```

**AC-2: Escalation Prevention Missing**

```
CURRENT STATE:
  No validation that assigner has capabilities being granted
  Anyone with assignment API access can grant any capability

CONSEQUENCE:
  - Self-escalation possible
  - Lateral escalation possible
  - Privilege creep undetected
```

**AC-3: Delegation Scope Not Validated**

```
CURRENT STATE:
  Delegation authority documented but not enforced
  Event chair could assign board roles (if API accessible)
  No scope boundary enforcement

CONSEQUENCE:
  - Scope boundaries are suggestions, not rules
  - Delegation matrix is paper only
```

---

### 2. Lifecycle Gaps

These gaps break the assignment lifecycle or transition workflow.

| Gap ID | Description | Risk Level | Guarantee Violated |
|--------|-------------|------------|-------------------|
| LC-1 | No acceptance workflow | MEDIUM | SD-4, AU-2 |
| LC-2 | No renewal mechanism | MEDIUM | TB-4 |
| LC-3 | Transition checklist not audited | LOW | AU-6 |
| LC-4 | Term selection missing from UI | MEDIUM | SD-4 |

**LC-1: No Acceptance Workflow**

```
CURRENT STATE:
  RoleAssignment created = immediately effective
  No pending state requiring user acceptance
  No acceptedBy, acceptedAt tracking

CONSEQUENCE:
  - Cannot prove user agreed to role
  - No opt-out before duties begin
  - Assignment without consent
```

**LC-2: No Renewal Mechanism**

```
CURRENT STATE:
  Term ends, assignment expires (if date check worked)
  No process to extend or renew
  Manual recreation required

CONSEQUENCE:
  - Access cliff at term end
  - No continuity for multi-term roles
  - Administrative burden
```

---

### 3. Notification Gaps

These gaps leave users uninformed about access changes.

| Gap ID | Description | Risk Level | Guarantee Violated |
|--------|-------------|------------|-------------------|
| NT-1 | No expiry warning notifications | **HIGH** | TB-5 |
| NT-2 | No assignment notification | MEDIUM | (implicit) |
| NT-3 | No transition reminders | LOW | TB-3 |

**NT-1: No Expiry Warning Notifications**

```
CURRENT STATE:
  No background job monitors upcoming expirations
  Users lose access without warning
  No 7-day or 1-day advance notice

CONSEQUENCE:
  - Surprise access loss
  - Incomplete handoffs
  - Operational disruption
```

---

### 4. Audit Gaps

These gaps prevent accountability and compliance verification.

| Gap ID | Description | Risk Level | Guarantee Violated |
|--------|-------------|------------|-------------------|
| AD-1 | assignedBy not tracked | MEDIUM | AU-2 |
| AD-2 | endReason not captured | MEDIUM | AU-3 |
| AD-3 | Scope denial not logged | MEDIUM | SD-1 |
| AD-4 | Escalation attempts not logged | **HIGH** | SD-3 |
| AD-5 | No audit log viewer UI | MEDIUM | AU-1, AU-5 |

**AD-1: assignedBy Not Tracked**

```
CURRENT STATE:
  RoleAssignment lacks assignedBy field
  AuditLog has actorId but separate lookup required
  No direct attribution on assignment record

CONSEQUENCE:
  - "Who assigned this person?" requires audit log query
  - No direct accountability on assignment
```

**AD-2: endReason Not Captured**

```
CURRENT STATE:
  RoleAssignment lacks endReason field
  No distinction between: completed, resigned, removed, declined
  All terminations look the same

CONSEQUENCE:
  - Cannot distinguish voluntary vs involuntary departure
  - No context for why someone left role
  - Historical analysis impossible
```

---

## Phased Implementation Plan

### Phase 1: Safety-Critical (Sprint 1-2)

**Goal:** Prevent unauthorized access and escalation.

| Item | Gap | Work Required | Acceptance Criteria |
|------|-----|---------------|---------------------|
| 1.1 | AC-1 | Add date validation to permission checks | Future-dated assignments deny access |
| 1.2 | AC-1 | Add expiry check to permission checks | Expired assignments deny access |
| 1.3 | AC-2 | Add escalation validation to assignment creation | Cannot grant capabilities assigner lacks |
| 1.4 | AC-3 | Add delegation scope validation | Delegation respects scope boundaries |
| 1.5 | AD-4 | Log escalation/scope violation attempts | Audit entry on blocked attempts |

**1.1-1.2: Date-Based Permission Validation**

```typescript
// Location: src/lib/auth/session.ts or capability check

function hasActiveAssignment(assignment: RoleAssignment): boolean {
  const now = new Date();

  // Check start date
  if (assignment.startDate && assignment.startDate > now) {
    return false; // Not yet effective
  }

  // Check end date
  if (assignment.endDate && assignment.endDate < now) {
    return false; // Expired
  }

  return true;
}
```

**1.3: Escalation Prevention**

```typescript
// Location: Assignment creation service

function validateNoEscalation(
  assignerId: string,
  grantedCapabilities: Capability[]
): void {
  const assignerCapabilities = getEffectiveCapabilities(assignerId);

  for (const cap of grantedCapabilities) {
    if (!assignerCapabilities.includes(cap)) {
      throw new ForbiddenError(
        `Cannot grant ${cap}: assigner lacks this capability`
      );
    }
  }
}
```

**1.4: Delegation Scope Validation**

```typescript
// Location: Assignment creation service

function validateDelegationScope(
  delegatorId: string,
  targetScope: Scope,
  roleId: string
): void {
  const delegatorScope = getDelegationScope(delegatorId);

  if (!delegatorScope.includes(targetScope)) {
    throw new ForbiddenError(
      `Cannot delegate to ${targetScope}: outside your delegation scope`
    );
  }

  if (!canDelegateRole(delegatorId, roleId)) {
    throw new ForbiddenError(
      `Cannot delegate ${roleId}: not in your delegation authority`
    );
  }
}
```

**Deliverables:**

- [ ] Permission check includes date validation
- [ ] Escalation blocked with audit entry
- [ ] Delegation scope enforced
- [ ] Unit tests for all boundary conditions
- [ ] E2E test: future-dated assignment denied
- [ ] E2E test: expired assignment denied
- [ ] E2E test: escalation attempt blocked

---

### Phase 2: Operational Clarity (Sprint 3-4)

**Goal:** Complete lifecycle tracking and notifications.

| Item | Gap | Work Required | Acceptance Criteria |
|------|-----|---------------|---------------------|
| 2.1 | AD-1 | Add assignedBy field to RoleAssignment | Field populated on creation |
| 2.2 | AD-2 | Add endReason field to RoleAssignment | Required on termination |
| 2.3 | NT-1 | Create expiry notification job | 7-day and 1-day warnings sent |
| 2.4 | LC-1 | Add assignment acceptance workflow | Pending state until accepted |
| 2.5 | AD-3 | Log scope-based access denials | Audit entry on denial |

**2.1-2.2: Schema Additions**

```prisma
// Location: prisma/schema.prisma

model RoleAssignment {
  // ... existing fields ...

  assignedById   String?    // Who created this assignment
  assignedBy     Member?    @relation("AssignedBy", fields: [assignedById], references: [id])
  assignedAt     DateTime   @default(now())

  acceptedAt     DateTime?  // When holder accepted

  endedAt        DateTime?  // When assignment ended
  endedById      String?    // Who ended it (if not automatic)
  endReason      String?    // completed | resigned | removed | declined | expired
}
```

**2.3: Expiry Notification Job**

```typescript
// Location: src/jobs/expiryNotifications.ts

async function sendExpiryNotifications(): Promise<void> {
  const now = new Date();
  const sevenDays = addDays(now, 7);
  const oneDay = addDays(now, 1);

  // Find assignments expiring in 7 days (not yet notified at 7-day mark)
  const sevenDayWarnings = await prisma.roleAssignment.findMany({
    where: {
      endDate: { gte: now, lte: sevenDays },
      sevenDayWarningSentAt: null,
    },
  });

  for (const assignment of sevenDayWarnings) {
    await sendExpiryWarningEmail(assignment, '7_day');
    await prisma.roleAssignment.update({
      where: { id: assignment.id },
      data: { sevenDayWarningSentAt: now },
    });
  }

  // Similar for 1-day warnings
}
```

**2.4: Acceptance Workflow**

```
Assignment Lifecycle:

  PENDING -----> ACTIVE -----> COMPLETED
     |              |
     |              +-----> RESIGNED
     |              |
     +-----> DECLINED      +-----> REMOVED

PENDING: Created but not accepted
ACTIVE: Accepted and within date range
COMPLETED: Term ended normally
RESIGNED: Holder left before term end
REMOVED: Admin terminated assignment
DECLINED: Holder rejected assignment
```

**Deliverables:**

- [ ] assignedBy tracked on all assignments
- [ ] endReason required on termination
- [ ] Expiry notification job running
- [ ] Acceptance workflow in API
- [ ] Scope denial logged
- [ ] Migration for new schema fields

---

### Phase 3: UX Polish (Sprint 5-6)

**Goal:** Make guarantees visible and manageable through UI.

| Item | Gap | Work Required | Acceptance Criteria |
|------|-----|---------------|---------------------|
| 3.1 | SD-2 | Build role assignment admin UI | Create/edit assignments via UI |
| 3.2 | LC-4 | Add term selection to assignment | Term picker required |
| 3.3 | AD-5 | Build audit log viewer | Filterable, searchable, diff display |
| 3.4 | TB-6 | Build emergency override UI | Override with reason capture |
| 3.5 | NT-2 | Add in-app notifications | Dashboard shows upcoming expirations |

**3.1-3.2: Role Assignment UI**

```
/admin/members/[id]/roles

+--------------------------------------------------+
| Sarah Johnson - Role Assignments                  |
+--------------------------------------------------+
| Active Roles                                      |
+--------------------------------------------------+
| Activities Chair                                  |
|   Term: 2025-2026                                |
|   Effective: Feb 1, 2025 - Jan 31, 2026          |
|   Assigned by: Jane Smith on Jan 15, 2025        |
|   Status: ACTIVE                                  |
|   [Edit] [End Early]                             |
+--------------------------------------------------+
| + Add Role Assignment                             |
+--------------------------------------------------+

Add Assignment Dialog:
+--------------------------------------------------+
| Assign Role to Sarah Johnson                      |
+--------------------------------------------------+
| Role: [Activities Chair ▼]                        |
| Term: [2025-2026 ▼] (required)                   |
| Start Date: [Feb 1, 2025]                        |
| End Date: [Jan 31, 2026]                         |
|                                                   |
| Note: Role grants capabilities:                   |
|   - events:create (activities scope)              |
|   - events:edit (activities scope)                |
|   - events:publish (activities scope)             |
|                                                   |
| [Cancel] [Assign]                                 |
+--------------------------------------------------+
```

**3.3: Audit Log Viewer**

```
/admin/audit-log

+--------------------------------------------------+
| Audit Log                                         |
+--------------------------------------------------+
| Filters: [Object Type ▼] [Actor ▼] [Date Range]  |
+--------------------------------------------------+
| Jan 20, 2025 2:30 PM                             |
| Carol Admin edited Member profile                 |
|   Member: Bob Smith                              |
|   Changed: email                                  |
|   Before: bob@oldcompany.com                     |
|   After: bob@newcompany.com                      |
+--------------------------------------------------+
| Jan 20, 2025 1:15 PM                             |
| Jane Smith assigned role                          |
|   Member: Sarah Johnson                          |
|   Role: Activities Chair                          |
|   Term: 2025-2026                                |
+--------------------------------------------------+
```

**3.4: Emergency Override**

```
End Assignment Early Dialog:
+--------------------------------------------------+
| End Assignment Early                              |
+--------------------------------------------------+
| Sarah Johnson - Activities Chair                  |
| Current end date: Jan 31, 2026                   |
|                                                   |
| New end date: [Today ▼]                          |
|                                                   |
| Reason: (required)                                |
| ( ) Resigned - holder requested                   |
| ( ) Removed - board decision                      |
| ( ) Transferred - moving to different role        |
| ( ) Other: [________________]                     |
|                                                   |
| Note: This action will be logged with your        |
| identity and the reason provided.                 |
|                                                   |
| [Cancel] [End Assignment]                         |
+--------------------------------------------------+
```

**Deliverables:**

- [ ] Role assignment CRUD in admin UI
- [ ] Term picker enforced
- [ ] Audit log viewer with filters
- [ ] Emergency override with reason
- [ ] Dashboard notification widget

---

## Dependency Graph

```
Phase 1 (Safety-Critical)
    |
    +-- 1.1 Date validation (start)
    |     |
    +-- 1.2 Date validation (end)
    |
    +-- 1.3 Escalation prevention
    |     |
    +-- 1.4 Delegation scope validation
    |     |
    +-- 1.5 Log blocked attempts (depends on 1.3, 1.4)

Phase 2 (Operational Clarity)
    |
    +-- 2.1 assignedBy field (schema)
    |     |
    +-- 2.2 endReason field (schema) --> can run migration together
    |
    +-- 2.3 Expiry notification job (depends on nothing)
    |
    +-- 2.4 Acceptance workflow (depends on 2.1)
    |
    +-- 2.5 Scope denial logging (depends on 1.4)

Phase 3 (UX Polish)
    |
    +-- 3.1 Assignment UI (depends on 2.1, 2.2, 2.4)
    |     |
    +-- 3.2 Term picker (part of 3.1)
    |
    +-- 3.3 Audit log viewer (depends on 2.5)
    |
    +-- 3.4 Override UI (depends on 2.2, 3.1)
    |
    +-- 3.5 Dashboard notifications (depends on 2.3)
```

---

## Verification Criteria

### Phase 1 Exit Criteria

- [ ] `npx playwright test leadership-access` passes
- [ ] Future-dated assignment denied (unit + E2E)
- [ ] Expired assignment denied (unit + E2E)
- [ ] Escalation blocked and logged (unit + E2E)
- [ ] Cross-scope delegation blocked (unit + E2E)
- [ ] Security review completed

### Phase 2 Exit Criteria

- [ ] Schema migration applied cleanly
- [ ] All new assignments have assignedBy
- [ ] Terminations require endReason
- [ ] Expiry job runs on schedule (cron verified)
- [ ] Expiry emails sent (E2E with test mailbox)
- [ ] Acceptance workflow in API (integration test)

### Phase 3 Exit Criteria

- [ ] Assignment UI functional (manual QA)
- [ ] Term picker enforced (E2E)
- [ ] Audit log searchable (E2E)
- [ ] Override captures reason (E2E)
- [ ] Dashboard shows upcoming expirations (E2E)

---

## Risk Mitigation

### Risk: Date validation breaks existing assignments

**Mitigation:**
1. Audit current RoleAssignment data for date issues
2. Fix invalid dates before deploying validation
3. Set reasonable defaults for NULL dates
4. Deploy validation with monitoring, not blocking

### Risk: Expiry notifications spam users

**Mitigation:**
1. Track notification sent timestamps
2. Limit to one notification per warning tier
3. Allow notification preferences
4. Test with small cohort first

### Risk: Acceptance workflow blocks critical access

**Mitigation:**
1. Auto-accept for emergency assignments (with flag)
2. Admin override to force-accept
3. Grace period before pending assignments expire
4. Clear communication about acceptance requirement

---

## Non-Goals (Explicit)

This plan does NOT include:

| Non-Goal | Rationale |
|----------|-----------|
| RBAC redesign | Capability model is stable; focus on enforcement |
| Governance workflows | Organization-specific; out of scope |
| Eligibility requirements | Policy decision, not system feature |
| Succession planning | Advisory, not blocking |
| Dispute resolution | Human judgment required |
| Committee structure changes | Data model is stable |

---

## Cross-References

| Document | Relationship |
|----------|--------------|
| [COMMITTEE_AND_LEADERSHIP_ENABLEMENT.md](./COMMITTEE_AND_LEADERSHIP_ENABLEMENT.md) | Source guarantees |
| [GUARANTEE_TO_PRODUCT_SURFACE_MAP.md](./GUARANTEE_TO_PRODUCT_SURFACE_MAP.md) | Gap analysis |
| [SAFE_DELEGATION_AND_PERMISSION_MODEL.md](./SAFE_DELEGATION_AND_PERMISSION_MODEL.md) | Delegation rules |
| [RBAC_DELEGATION_MATRIX.md](../rbac/RBAC_DELEGATION_MATRIX.md) | Delegation authority |
| [ARCHITECTURAL_CHARTER.md](../ARCHITECTURAL_CHARTER.md) | Core principles |

---

## Summary

| Phase | Focus | Items | Outcome |
|-------|-------|-------|---------|
| 1 | Safety-Critical | 5 | Time-bounded access enforced; escalation blocked |
| 2 | Operational Clarity | 5 | Full lifecycle tracking; notifications working |
| 3 | UX Polish | 5 | Visible, manageable through admin UI |

**After all phases:**

- Paper guarantees become enforced guarantees
- Time-bounded authority is structural, not manual
- Delegation respects scope boundaries
- All changes are auditable with attribution

---

*This plan converts documented guarantees into implemented constraints.
Guarantees without enforcement are not guarantees.*
