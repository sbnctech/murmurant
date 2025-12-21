# Guarantee to Product Surface Map

Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

Status: Implementation Audit
Audience: Engineering, Product
Last updated: 2025-12-21

---

## Purpose

This document maps guarantees from COMMITTEE_AND_LEADERSHIP_ENABLEMENT.md
and RBAC_DELEGATION_MATRIX.md to concrete product surfaces.

For each guarantee:
- UI Surface: Where a user sees or interacts with this
- API Surface: Which endpoint enforces it
- Audit Artifact: What evidence proves it happened

Guarantees without product surfaces are "paper guarantees" - documented
but not yet visible in the product.

---

## Safe Delegation Guarantees

### SD-1: Role capabilities cannot exceed committee scope

| Aspect | Surface | Status |
|--------|---------|--------|
| Guarantee | Committee scope filters all capability checks | Documented |
| UI Surface | None visible (enforcement is invisible to user) | N/A |
| API Surface | `src/lib/auth/session.ts` - scope validation | Partial |
| Audit Artifact | Capability denial logged with scope reason | **NOT IMPLEMENTED** |

**Gap:** No UI shows a user their effective scope. No audit entry when
scope-based denial occurs.

---

### SD-2: Chairs cannot assign roles to others

| Aspect | Surface | Status |
|--------|---------|--------|
| Guarantee | `roles:assign` is admin-only capability | Documented |
| UI Surface | Role assignment UI hidden from non-admins | **NOT IMPLEMENTED** |
| API Surface | `/api/v1/admin/transitions/[id]/assignments` | Exists |
| Audit Artifact | Assignment creation logged with assignedBy | Partial |

**Gap:** No dedicated role assignment UI exists. Assignments happen through
transitions page or direct database access.

---

### SD-3: Chairs cannot escalate their own permissions

| Aspect | Surface | Status |
|--------|---------|--------|
| Guarantee | Cannot grant capabilities you don't have | Documented |
| UI Surface | N/A (enforcement is server-side) | N/A |
| API Surface | Validation on assignment creation | **NOT IMPLEMENTED** |
| Audit Artifact | Escalation attempt logged | **NOT IMPLEMENTED** |

**Gap:** No validation prevents granting capabilities the assigner lacks.
This is a paper guarantee with no enforcement.

---

### SD-4: Delegated access is always bounded

| Aspect | Surface | Status |
|--------|---------|--------|
| Guarantee | All role assignments require term reference | Documented |
| UI Surface | Term selection required in assignment flow | **NOT IMPLEMENTED** |
| API Surface | Schema constraint (termId required) | Implemented |
| Audit Artifact | RoleAssignment includes termId | Implemented |

**Gap:** Schema enforces termId requirement. No UI flow exists to create
assignments with term selection.

---

### SD-5: Cross-committee access requires explicit grant

| Aspect | Surface | Status |
|--------|---------|--------|
| Guarantee | Committee scope is default filter | Documented |
| UI Surface | Committee picker/filter in admin views | Partial |
| API Surface | `/api/v1/me/committees` returns user's committees | Implemented |
| Audit Artifact | Cross-committee access logged | **NOT IMPLEMENTED** |

**Gap:** API returns user's committees. No explicit grant mechanism for
cross-committee access. No audit when cross-committee access occurs.

---

## Time-Bounded Authority Guarantees

### TB-1: Access activates at scheduled time

| Aspect | Surface | Status |
|--------|---------|--------|
| Guarantee | effectiveAt field on RoleAssignment | Documented |
| UI Surface | Date display on assignment | **NOT IMPLEMENTED** |
| API Surface | Permission check includes date validation | **NOT IMPLEMENTED** |
| Audit Artifact | Activation timestamp in assignment record | Schema exists |

**Gap:** Schema has startDate but permission checks do not validate against
current date. A future-dated assignment is immediately effective.

---

### TB-2: Access expires at scheduled time

| Aspect | Surface | Status |
|--------|---------|--------|
| Guarantee | endsAt field on RoleAssignment | Documented |
| UI Surface | End date display on assignment | **NOT IMPLEMENTED** |
| API Surface | Permission check includes date validation | **NOT IMPLEMENTED** |
| Audit Artifact | Expiration timestamp in assignment record | Schema exists |

**Gap:** Schema has endDate but permission checks do not validate against
current date. An expired assignment remains effective until manually removed.

---

### TB-3: Transition window is built in

| Aspect | Surface | Status |
|--------|---------|--------|
| Guarantee | Term has transitionStartDate | Documented |
| UI Surface | `/admin/transitions` page | Implemented |
| API Surface | TransitionPlan model | Implemented |
| Audit Artifact | Transition plan record | Implemented |

**Implemented:** Transition planning UI and data model exist.

---

### TB-4: No indefinite access without renewal

| Aspect | Surface | Status |
|--------|---------|--------|
| Guarantee | All assignments require term | Documented |
| UI Surface | Term selection in assignment | **NOT IMPLEMENTED** |
| API Surface | Schema constraint (termId required) | Implemented |
| Audit Artifact | termId in RoleAssignment | Implemented |

**Partial:** Schema enforces term requirement. No renewal workflow exists.

---

### TB-5: Automatic notifications before expiry

| Aspect | Surface | Status |
|--------|---------|--------|
| Guarantee | System sends 7-day and 1-day warnings | Documented |
| UI Surface | Notification in member dashboard | **NOT IMPLEMENTED** |
| API Surface | Background job for expiry notifications | **NOT IMPLEMENTED** |
| Audit Artifact | Notification send record | **NOT IMPLEMENTED** |

**Gap:** No notification system for role expiration warnings.

---

### TB-6: Admin can override in emergency

| Aspect | Surface | Status |
|--------|---------|--------|
| Guarantee | Admin:full can adjust any assignment | Documented |
| UI Surface | Assignment edit in admin | **NOT IMPLEMENTED** |
| API Surface | `/api/v1/admin/transitions/[id]/assignments` | Exists |
| Audit Artifact | Override logged with reason | **NOT IMPLEMENTED** |

**Gap:** API exists for assignment management. No UI for editing assignments.
No explicit "emergency override" with reason capture.

---

## Auditability Guarantees

### AU-1: All assignments logged

| Aspect | Surface | Status |
|--------|---------|--------|
| Guarantee | AuditLog entry on create/update/end | Documented |
| UI Surface | Audit log viewer | **NOT IMPLEMENTED** |
| API Surface | AuditLog model | Implemented |
| Audit Artifact | AuditLog records | Partial |

**Gap:** AuditLog model exists. Not all assignment operations create entries.
No UI to view audit logs.

---

### AU-2: Actor attribution

| Aspect | Surface | Status |
|--------|---------|--------|
| Guarantee | assignedBy, acceptedBy fields | Documented |
| UI Surface | "Assigned by" display | **NOT IMPLEMENTED** |
| API Surface | memberId in AuditLog | Implemented |
| Audit Artifact | Actor ID in audit records | Implemented |

**Partial:** AuditLog has memberId. RoleAssignment lacks assignedBy field.

---

### AU-3: Reason recorded

| Aspect | Surface | Status |
|--------|---------|--------|
| Guarantee | endReason field on RoleAssignment | Documented |
| UI Surface | Reason capture on termination | **NOT IMPLEMENTED** |
| API Surface | Field in schema | **NOT IMPLEMENTED** |
| Audit Artifact | Reason in audit record | **NOT IMPLEMENTED** |

**Gap:** RoleAssignment schema lacks endReason field. No UI captures
termination reason.

---

### AU-4: Historical queries possible

| Aspect | Surface | Status |
|--------|---------|--------|
| Guarantee | Role assignment history persists | Documented |
| UI Surface | `/admin/service-history` page | Implemented |
| API Surface | `/api/v1/admin/service-history` | Implemented |
| Audit Artifact | Historical records queryable | Implemented |

**Implemented:** Service history UI and API exist.

---

### AU-5: Before/after diff available

| Aspect | Surface | Status |
|--------|---------|--------|
| Guarantee | Audit entry includes field changes | Documented |
| UI Surface | Diff viewer in audit log | **NOT IMPLEMENTED** |
| API Surface | before/after JSON in AuditLog | Implemented |
| Audit Artifact | before/after in audit records | Implemented |

**Partial:** AuditLog has before/after fields. No UI to display diffs.

---

### AU-6: Checklist progress tracked

| Aspect | Surface | Status |
|--------|---------|--------|
| Guarantee | TransitionChecklist items logged | Documented |
| UI Surface | Checklist in transitions page | Partial |
| API Surface | TransitionAssignment model | Implemented |
| Audit Artifact | Checklist item completion records | **NOT IMPLEMENTED** |

**Partial:** Transition assignments exist. Individual checklist item
completion is not audited.

---

## Delegation Matrix Guarantees

### DM-1: President can delegate all (global scope)

| Aspect | Surface | Status |
|--------|---------|--------|
| Guarantee | President has full delegation authority | Documented |
| UI Surface | Delegation UI for President | **NOT IMPLEMENTED** |
| API Surface | Capability check for delegation | **NOT IMPLEMENTED** |
| Audit Artifact | Delegation logged with audit required | **NOT IMPLEMENTED** |

**Gap:** No delegation workflow exists. Paper guarantee only.

---

### DM-2: VP Activities can delegate Event Chairs (scoped)

| Aspect | Surface | Status |
|--------|---------|--------|
| Guarantee | VP Activities can assign Event Chair role | Documented |
| UI Surface | Chair assignment UI for VP | **NOT IMPLEMENTED** |
| API Surface | Scoped delegation check | **NOT IMPLEMENTED** |
| Audit Artifact | Time-bounded delegation record | **NOT IMPLEMENTED** |

**Gap:** No scoped delegation workflow. Paper guarantee only.

---

### DM-3: Chairs cannot assign roles

| Aspect | Surface | Status |
|--------|---------|--------|
| Guarantee | Event Chair cannot delegate | Documented |
| UI Surface | Assignment UI hidden from chairs | Implicit |
| API Surface | Capability check on assignment | **NOT IMPLEMENTED** |
| Audit Artifact | Denied attempt logged | **NOT IMPLEMENTED** |

**Gap:** UI is hidden by virtue of not existing for anyone. No server-side
enforcement of delegation prohibition for chairs.

---

### DM-4: No cross-domain delegation

| Aspect | Surface | Status |
|--------|---------|--------|
| Guarantee | Cannot delegate outside your scope | Documented |
| UI Surface | Scope filter in delegation UI | **NOT IMPLEMENTED** |
| API Surface | Cross-scope validation | **NOT IMPLEMENTED** |
| Audit Artifact | Cross-domain attempt logged | **NOT IMPLEMENTED** |

**Gap:** No cross-domain validation. Paper guarantee only.

---

### DM-5: Finance approvals cannot grant permissions

| Aspect | Surface | Status |
|--------|---------|--------|
| Guarantee | Finance workflow is approval-only | Documented |
| UI Surface | Finance approval queue | Partial |
| API Surface | Finance approval endpoints | Partial |
| Audit Artifact | Approval record (no permission grant) | Partial |

**Partial:** Finance approval exists as separate workflow. No risk of
permission grant because finance and RBAC are separate systems.

---

## Summary: Paper Guarantees

The following guarantees are documented but have no product visibility:

### High Priority (Security/Compliance)

| ID | Guarantee | Risk if Unimplemented |
|----|-----------|----------------------|
| SD-3 | Chairs cannot escalate permissions | Permission creep via self-assignment |
| TB-1 | Access activates at scheduled time | Future-dated access is immediately effective |
| TB-2 | Access expires at scheduled time | Expired access remains effective |
| TB-5 | Expiry notifications | Users lose access without warning |
| DM-3 | Chairs cannot assign roles | Unauthorized delegation possible |
| DM-4 | No cross-domain delegation | Scope boundary violations |

### Medium Priority (Auditability)

| ID | Guarantee | Risk if Unimplemented |
|----|-----------|----------------------|
| SD-1 | Scope-based denial logged | Cannot investigate access denials |
| AU-1 | All assignments logged | Incomplete audit trail |
| AU-3 | Reason recorded | Cannot explain why someone left role |
| AU-6 | Checklist progress tracked | Cannot prove handoff completed |

### Lower Priority (User Experience)

| ID | Guarantee | Risk if Unimplemented |
|----|-----------|----------------------|
| SD-2 | Role assignment UI | Assignments require database access |
| SD-5 | Cross-committee grant UI | No explicit grant mechanism |
| TB-6 | Emergency override UI | Manual database intervention needed |
| AU-2 | assignedBy display | Attribution requires audit log lookup |
| AU-5 | Diff viewer | Before/after requires raw JSON reading |

---

## Implementation Scorecard

| Category | Documented | Schema | API | UI | Audit | Score |
|----------|------------|--------|-----|-----|-------|-------|
| Safe Delegation (5) | 5 | 2 | 1 | 0 | 0 | 3/20 |
| Time-Bounded (6) | 6 | 4 | 1 | 1 | 2 | 8/24 |
| Auditability (6) | 6 | 3 | 2 | 1 | 2 | 8/24 |
| Delegation Matrix (5) | 5 | 0 | 0 | 0 | 0 | 0/20 |
| **Total** | **22** | **9** | **4** | **2** | **4** | **19/88** |

**Overall: 22% of guarantees have complete product surface coverage.**

---

## Recommendations

### Immediate (Security)

1. **Implement date-based permission validation** (TB-1, TB-2)
   - Permission checks must compare against current date
   - Prevents stale access from expired assignments

2. **Add escalation prevention** (SD-3)
   - Validate assigner has capabilities being granted
   - Log and reject escalation attempts

3. **Server-side delegation scope enforcement** (DM-3, DM-4)
   - Validate delegator's scope before allowing assignment
   - Do not rely on UI hiding

### Short-term (Auditability)

4. **Complete audit logging for assignments** (AU-1, AU-3)
   - Add assignedBy to RoleAssignment
   - Add endReason to RoleAssignment
   - Ensure all assignment operations create audit entries

5. **Add audit log viewer UI** (AU-1, AU-5)
   - Filterable by object, actor, date
   - Diff display for before/after

### Medium-term (User Experience)

6. **Build role assignment UI** (SD-2, DM-1, DM-2)
   - Term selection required
   - Scope filtering
   - Delegation authority enforcement

7. **Add expiry notification system** (TB-5)
   - Background job for upcoming expirations
   - Email and in-app notifications

---

## See Also

- [Committee and Leadership Enablement](./COMMITTEE_AND_LEADERSHIP_ENABLEMENT.md) - Source guarantees
- [RBAC Delegation Matrix](../rbac/RBAC_DELEGATION_MATRIX.md) - Delegation rules
- [Safe Delegation and Permission Model](./SAFE_DELEGATION_AND_PERMISSION_MODEL.md) - Philosophy
- [Architectural Charter](../ARCHITECTURAL_CHARTER.md) - Core principles
