# Guarantee Map Audit Report

Copyright (c) Santa Barbara Newcomers Club

Status: Audit Complete
Auditor: Claude (Worker 1)
Date: 2025-12-21

---

## Audit Criteria

For each guarantee in GUARANTEE_TO_PRODUCT_SURFACE_MAP.md, this audit answers:

> "Where is this enforced, and how do we know if it fails?"

Guarantees are evaluated for:

1. **Clear enforcement point** - Specific file/function that blocks violations
2. **Testable condition** - A test that would fail if guarantee is broken
3. **Code vs convention** - Is enforcement in code or just policy?

---

## Category 1: No Enforcement Point (Critical)

These guarantees have NO code that enforces them. They are paper-only.

| ID | Guarantee | Status | Risk |
|----|-----------|--------|------|
| SD-3 | Chairs cannot escalate permissions | PAPER ONLY | **CRITICAL**: No validation prevents granting capabilities assigner lacks |
| TB-1 | Access activates at scheduled time | PAPER ONLY | **CRITICAL**: Future-dated assignments immediately effective |
| TB-2 | Access expires at scheduled time | PAPER ONLY | **CRITICAL**: Expired assignments remain effective |
| TB-5 | Automatic notifications before expiry | PAPER ONLY | Users lose access without warning |
| DM-1 | President can delegate all | PAPER ONLY | No delegation workflow exists |
| DM-2 | VP Activities can delegate chairs | PAPER ONLY | No scoped delegation workflow |
| DM-3 | Chairs cannot assign roles | PAPER ONLY | No server-side check; UI hiding is NOT enforcement |
| DM-4 | No cross-domain delegation | PAPER ONLY | No cross-scope validation |
| AU-3 | Reason recorded on termination | PAPER ONLY | Schema lacks `endReason` field |

**Finding:** 9 of 22 guarantees (41%) have zero enforcement code.

---

## Category 2: Unclear Enforcement Point

These guarantees claim implementation but the enforcement location is ambiguous.

### SD-1: Role capabilities cannot exceed committee scope

**Problem:** Status says "Partial" but doesn't specify:
- Which capability checks include scope filtering?
- Which don't?
- What's the specific function that enforces scope?

**Listed enforcement:** `src/lib/auth/session.ts - scope validation`

**Question:** Does `requireCapability()` check committee scope, or only global role?

**Testable?** Cannot write a test without knowing the enforcement path.

---

### SD-2: Chairs cannot assign roles to others

**Problem:** Claims `roles:assign` is "admin-only capability" but:
- Where is this capability checked?
- The API endpoint exists but does it verify `roles:assign`?

**Listed enforcement:** `/api/v1/admin/transitions/[id]/assignments`

**Question:** Does this endpoint call `requireCapability("roles:assign")`?

**Testable?** Need to verify the endpoint actually checks the capability.

---

### SD-5: Cross-committee access requires explicit grant

**Problem:** The listed API surface doesn't enforce anything:
- `/api/v1/me/committees` returns data but doesn't block access
- "Committee scope is default filter" - but where is this filter applied?

**Question:** What code blocks access to Committee B's data for a user in Committee A?

**Testable?** Cannot write a test without knowing where filtering happens.

---

### TB-6: Admin can override in emergency

**Problem:** Ambiguous definition:
- What distinguishes "emergency override" from normal edit?
- No reason capture mechanism exists
- No audit trail for emergency actions

**Question:** How would we detect an emergency override vs. routine change?

**Testable?** No - the concept itself is undefined.

---

### AU-1: All assignments logged

**Problem:** Status says "Partial" - which operations log and which don't?

**Listed gap:** "Not all assignment operations create entries"

**Question:** Which assignment operations are NOT logged?
- CREATE?
- UPDATE?
- DELETE/END?

**Testable?** Need complete list of operations to verify all are logged.

---

### AU-6: Checklist progress tracked

**Problem:** TransitionAssignment model exists but:
- "Individual checklist item completion is not audited"
- Guarantee says "logged" but items aren't logged

**Question:** Does this guarantee mean:
- (a) The checklist data structure is tracked? (Implemented)
- (b) Each item completion creates an audit entry? (Not implemented)

**Testable?** Depends on which interpretation is correct.

---

## Category 3: Convention-Based Enforcement (Risky)

These guarantees rely on implicit behavior, not explicit code.

### DM-3: Chairs cannot assign roles

**Current "enforcement":** "UI hidden by virtue of not existing for anyone"

**Why this fails:**
- API may still accept requests from chairs
- No server-side capability check
- No denied attempt logged

**Risk:** A chair with API knowledge could create unauthorized assignments.

**Required:** Server-side `requireCapability("roles:assign")` on assignment endpoints.

---

### SD-4 + TB-4: Term-bounded assignments

**Current enforcement:** Schema constraint (`termId` required)

**Why this is adequate:** Database rejects null `termId`. This IS code enforcement.

**But:** The guarantee TB-4 says "without renewal" - no renewal workflow exists.
Does the guarantee require a renewal process, or just a term reference?

---

### DM-5: Finance approvals cannot grant permissions

**Current enforcement:** Architectural separation (finance ≠ RBAC)

**Why this is adequate:** Different systems cannot grant each other's permissions.

**Status:** ✓ Enforced by design.

---

## Category 4: Ambiguous Guarantee Definitions

These guarantees need clarification before they can be properly enforced.

### TB-4: No indefinite access without renewal

**Ambiguity:** Does this mean:
- (a) Assignment must reference a term (implemented via schema)
- (b) Assignment must go through explicit renewal workflow (not implemented)

**Recommendation:** Clarify in source doc. If (b), create renewal workflow spec.

---

### AU-5: Before/after diff available

**Ambiguity:** Does this mean:
- (a) Diffs are captured in AuditLog (implemented)
- (b) Diffs are displayable in UI (not implemented)

**Recommendation:** Split into AU-5a (capture) and AU-5b (display).

---

### TB-6: Admin can override in emergency

**Ambiguity:** No definition of "emergency" vs. routine edit.

**Recommendation:** Either:
- Remove "emergency" qualifier (any admin edit is an override)
- Define emergency flag + reason requirement

---

## Guarantees Passing Audit

These guarantees have clear enforcement and testable conditions.

| ID | Guarantee | Enforcement | Test Condition |
|----|-----------|-------------|----------------|
| SD-4 | Delegated access bounded | Schema: `termId NOT NULL` | DB rejects null termId |
| TB-3 | Transition window built in | TransitionPlan model + UI | Term has transitionStartDate |
| AU-4 | Historical queries possible | `/api/v1/admin/service-history` | Can query past assignments |
| DM-5 | Finance ≠ permissions | Architectural separation | Different systems |

---

## Summary: Enforcement Gaps by Risk

### CRITICAL (Security) - Block before Migration Mode

| ID | Gap | Required Fix |
|----|-----|--------------|
| TB-1 + TB-2 | Time bounds not enforced | Add date validation to capability checks |
| SD-3 | Escalation not prevented | Add capability superset validation |
| DM-3 | Chair delegation not blocked | Add server-side `roles:assign` check |
| DM-4 | Cross-scope not blocked | Add committee scope validation |

### HIGH (Data Integrity)

| ID | Gap | Required Fix |
|----|-----|--------------|
| AU-1 | Incomplete audit logging | Identify and instrument missing paths |
| AU-3 | No termination reason | Add `endReason` to schema |

### MEDIUM (Auditability)

| ID | Gap | Required Fix |
|----|-----|--------------|
| SD-1 | Scope denial not logged | Add audit entry on scope-based 403 |
| SD-5 | Cross-committee not logged | Add audit entry on cross-committee access |
| AU-6 | Checklist items not audited | Add per-item completion audit entries |

### LOW (UX - Can defer)

| ID | Gap | Required Fix |
|----|-----|--------------|
| TB-5 | No expiry notifications | Background job + notification system |
| DM-1, DM-2 | No delegation UI | Build delegation workflow UI |
| TB-6 | No emergency override UI | Build override UI with reason capture |

---

## Recommended Clarifications

Add to GUARANTEE_TO_PRODUCT_SURFACE_MAP.md:

1. **For each guarantee, add:**
   - `Enforcement File:` exact path to enforcement code
   - `Test File:` path to test that verifies enforcement
   - `Failure Signal:` what happens when guarantee is violated

2. **Resolve ambiguities:**
   - TB-4: Clarify if renewal workflow is required
   - TB-6: Define emergency vs. routine
   - AU-5: Split capture vs. display
   - AU-6: Clarify item-level vs. assignment-level logging

3. **For "Partial" status, specify:**
   - What IS implemented
   - What is NOT implemented
   - Explicit path to complete

---

## Next Actions

1. **Immediate:** Implement TB-1 + TB-2 (time-bounded authority)
   - Already has WIP code stashed
   - Blocks all other delegation guarantees

2. **Before Migration Mode:**
   - SD-3: Escalation prevention
   - DM-3: Server-side chair block
   - DM-4: Cross-scope validation
   - AU-1: Complete audit logging

3. **Update source doc:** Add enforcement file + test file columns

---

## Cross-References

- Source doc: [GUARANTEE_TO_PRODUCT_SURFACE_MAP.md](./GUARANTEE_TO_PRODUCT_SURFACE_MAP.md)
- Implementation briefs: [GUARANTEE_IMPLEMENTATION_BRIEFS.md](../implementation/GUARANTEE_IMPLEMENTATION_BRIEFS.md)
- Charter: [ARCHITECTURAL_CHARTER.md](../ARCHITECTURAL_CHARTER.md)
