# PR Review Checklist

A mechanical checklist for reviewing Murmurant pull requests. Follow this systematically to catch security and correctness issues before merge.

---

## Quick Triage

Before deep review, answer these questions:

- [ ] **Does this PR touch auth, RBAC, or permissions?** → Complete the Auth & RBAC section
- [ ] **Does this PR touch impersonation logic?** → Complete the Impersonation Safety section
- [ ] **Does this PR modify state transitions?** → Complete the Lifecycle Changes section
- [ ] **Does this PR add/modify API endpoints?** → Complete all sections

If none apply, skip to the Tests and Observability sections.

---

## Auth & RBAC

### Default-Deny Verification

- [ ] New endpoints use `requireCapability()` or `requireCapabilitySafe()`
- [ ] No endpoints rely solely on UI/page-level gating
- [ ] No inline `role === "admin"` checks (anti-pattern N2)

**If this fails, do not merge.** Look for patterns like:

```typescript
// BAD: Inline role check
if (auth.role === "admin") { ... }

// GOOD: Capability check
const auth = await requireCapability(req, "events:edit");
```

Fix: Replace role checks with `hasCapability()` or `requireCapability()`.

### Capability Enforcement

- [ ] Correct capability is checked (not a broader one)
- [ ] Object-scoped checks where applicable (not just role-based)
- [ ] Capability exists in the defined list (`src/lib/auth.ts`)

**If this fails, do not merge.** Look for missing scope:

```typescript
// BAD: Global check when object-scoped is needed
requireCapability(req, "events:edit");

// GOOD: With object scope
requireCapability(req, "events:edit", { eventId });
```

### 401 vs 403 Semantics

- [ ] Missing/invalid auth returns 401 Unauthorized
- [ ] Valid auth but lacking capability returns 403 Forbidden
- [ ] Error messages don't leak internal details

**If this fails, do not merge.** Check the response patterns:

```typescript
// 401: Authentication failed
{ error: "Unauthorized", message: "Missing or invalid authentication" }

// 403: Authorization failed
{ error: "Access denied", message: "Required capability: events:edit" }
```

---

## Impersonation Safety

### Blocked Capabilities Enforced

- [ ] Dangerous capabilities use `requireCapabilitySafe()` (not `requireCapability()`)
- [ ] Dangerous capabilities list: `finance:manage`, `comms:send`, `users:manage`, `events:delete`, `admin:full`
- [ ] New dangerous capabilities are added to the blocked list

**If this fails, do not merge.** Look for:

```typescript
// BAD: Dangerous capability without safe check
const auth = await requireCapability(req, "finance:manage");

// GOOD: Uses safe variant
const auth = await requireCapabilitySafe(req, "finance:manage");
```

The safe variant returns 403 with a clear message if impersonating.

### Read-Only Behavior Preserved

- [ ] View/read capabilities are NOT blocked (members:view, events:view, etc.)
- [ ] Impersonation allows seeing what the member would see
- [ ] No mutations occur when impersonating (unless explicitly allowed)

**If this fails, do not merge.** Check that read operations don't accidentally use `requireCapabilitySafe()`:

```typescript
// CORRECT: Read operations use regular check
const auth = await requireCapability(req, "members:view");
```

---

## Lifecycle Changes

### Transition Allowed by State Machine

- [ ] State change uses the transition function, not direct field update
- [ ] Transition is defined in the state machine rules
- [ ] Role/capability required for transition is checked

**If this fails, do not merge.** Look for direct updates:

```typescript
// BAD: Direct status update
await prisma.event.update({ where: { id }, data: { status: "published" } });

// GOOD: Via state machine
await transitionEventStatus(event, "publish", actor);
```

### Boundary Conditions Tested

- [ ] Edge cases at transition boundaries are covered
- [ ] Invalid transitions are rejected (not silently ignored)
- [ ] Timestamps are set correctly on transition

**If this fails, do not merge.** Check for missing tests:

```typescript
// Should have tests like:
it("rejects transition from DRAFT to PUBLISHED", ...)
it("requires VP Activities to approve", ...)
it("sets approvedAt timestamp on approval", ...)
```

---

## Tests

### Contract Test Updated or Added

- [ ] If RBAC logic changed: `tests/contracts/rbac.contract.spec.ts` updated
- [ ] If impersonation logic changed: `tests/contracts/impersonation.contract.spec.ts` updated
- [ ] If lifecycle logic changed: relevant `tests/unit/` test updated

**If this fails, do not merge.** Contract tests should be deterministic (no network, no time dependency):

```typescript
describe("RBAC Contract", () => {
  it("admin has all capabilities", () => {
    expect(hasCapability("admin", "events:delete")).toBe(true);
  });

  it("member cannot delete events", () => {
    expect(hasCapability("member", "events:delete")).toBe(false);
  });
});
```

### Guardrail Not Bypassed

- [ ] No changes to `KNOWN_GAPS` array without justification
- [ ] No disabling of security checks in CI
- [ ] New endpoints added to guardrail coverage

**If this fails, do not merge.** Check `.github/workflows/security-guardrails.yml` and `scripts/ci/check-auth-guardrails.ts` for changes.

### Permission Boundary Tests

- [ ] Positive test: Authorized user can perform action
- [ ] Negative test: Unauthorized user is rejected
- [ ] Error responses are tested (401, 403)

**If this fails, do not merge.** Add boundary tests:

```typescript
describe("POST /api/admin/events", () => {
  it("returns 401 without auth", async () => { ... });
  it("returns 403 for member role", async () => { ... });
  it("returns 200 for admin", async () => { ... });
});
```

---

## Observability

### Audit Log Impact Considered

- [ ] Mutations call `auditMutation()` or `auditCreate/Update/Delete()`
- [ ] Before/after state captured for updates
- [ ] Metadata includes relevant context

**If this fails, do not merge.** Look for missing audit calls:

```typescript
// Every mutation should have:
await auditMutation(req, auth, {
  action: "UPDATE",
  capability: "events:edit",
  objectType: "Event",
  objectId: eventId,
  metadata: { before, after }
});
```

### Error Handling

- [ ] Errors are logged (not swallowed silently)
- [ ] User-facing messages are human-friendly
- [ ] Stack traces not exposed in production responses

**If this fails, do not merge.** Look for empty catch blocks:

```typescript
// BAD: Silent catch
try { ... } catch (e) { }

// GOOD: Log and handle
try { ... } catch (e) {
  console.error("Operation failed:", e);
  return errorResponse("Something went wrong");
}
```

---

## Final Checklist

Before approving:

- [ ] All applicable sections above are checked
- [ ] `npm run green` passes
- [ ] PR size is within limits (≤300 LOC or has split plan)
- [ ] Hotspots are declared if touched
- [ ] "Why This Is Safe" section is completed in PR description

---

## Quick Reference

### Capability Check Patterns

| Operation Type | Function | When to Use |
|---------------|----------|-------------|
| Standard auth | `requireCapability(req, cap)` | Most endpoints |
| Dangerous ops | `requireCapabilitySafe(req, cap)` | Finance, email, role changes |
| Check only | `hasCapability(role, cap)` | Conditional logic |

### State Machine Domains

| Domain | File | Key States |
|--------|------|------------|
| Events | `src/lib/events/status.ts` | DRAFT → PENDING → APPROVED → PUBLISHED |
| Membership | `src/lib/membership/lifecycle.ts` | pending → active → suspended → lapsed |
| Pages | `src/lib/publishing/pageLifecycle.ts` | DRAFT → PUBLISHED → ARCHIVED |

### Related Documents

- **Threat Model**: `docs/SECURITY/THREAT_MODEL.md`
- **Security Invariants**: `docs/CI/INVARIANTS.md`
- **Charter Principles**: `docs/ARCHITECTURAL_CHARTER.md`
