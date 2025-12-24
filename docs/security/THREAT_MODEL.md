# ClubOS Threat Model

Last updated: December 2024

This document provides a concise threat model for ClubOS, designed to be read in under 10 minutes by security-conscious reviewers and auditors.

---

## Assets Under Protection

| Asset | Sensitivity | Location |
|-------|-------------|----------|
| **Member PII** | High | PostgreSQL `Member` table (name, email, address, phone) |
| **Financial Actions** | Critical | Payment processing, dues tracking |
| **Admin Privileges** | Critical | Role assignments, capability grants |
| **Session Tokens** | High | PostgreSQL `Session` table (hashed only) |
| **Audit Trail** | High | PostgreSQL `AuditLog` table |
| **Publishing Content** | Medium | Pages, templates, event descriptions |
| **Communication History** | Medium | Email campaigns, newsletters |

---

## Trust Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Untrusted)                       │
│  - User input (forms, URLs, query params)                       │
│  - JavaScript execution context                                  │
│  - LocalStorage/SessionStorage                                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS API LAYER                          │
│  - Request validation                                           │
│  - Authentication (session validation)                          │
│  - Authorization (capability checks)                            │
│  - Input sanitization                                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Prisma Client
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      POSTGRESQL DATABASE                         │
│  - Member records                                                │
│  - Session storage (token hashes only)                          │
│  - Audit logs                                                   │
│  - All persistent state                                         │
└─────────────────────────────────────────────────────────────────┘
```

### Key Boundary: Admin vs Member

| Context | Capabilities | Restrictions |
|---------|-------------|--------------|
| **Admin** | Full access (`admin:full`) | None |
| **President** | Transitions, member view, events | No finance:manage |
| **VP Activities** | Event edit, approve, schedule | No events:delete |
| **Member** | Self-service only | No admin capabilities |

### Key Boundary: Real User vs Impersonation Mode

When an admin impersonates a member:

- **Allowed**: Read operations (view members, events, registrations)
- **Blocked**: `finance:manage`, `comms:send`, `users:manage`, `events:delete`, `admin:full`

---

## Threat Actors

### 1. Malicious Member

**Profile**: Authenticated member attempting to access data or functions beyond their privileges.

**Attack vectors**:

- Direct API calls bypassing UI restrictions
- Parameter tampering (member IDs, event IDs)
- Session token theft/reuse
- IDOR (Insecure Direct Object Reference) attempts

**Mitigations**:

- Server-side capability checks on every request
- Object-scoped authorization (not just role-based)
- Session binding to authenticated identity

### 2. Compromised Admin Token

**Profile**: Attacker with stolen admin session token or credentials.

**Attack vectors**:

- Mass data exfiltration
- Privilege escalation for other accounts
- Financial action execution
- Audit log tampering (if possible)

**Mitigations**:

- Session idle timeout and max lifetime
- IP/UserAgent tracking in sessions
- Immutable audit log (append-only)
- Revocation support for sessions

### 3. Buggy Code

**Profile**: Well-intentioned but incorrect code that violates invariants.

**Attack vectors**:

- Missing auth checks on new endpoints
- Inline role checks instead of capability checks
- Silent error handling hiding auth failures
- State machine bypass

**Mitigations**:

- Contract tests for security invariants
- CI guardrails blocking unsafe patterns
- Default-deny architecture
- Explicit state machines (no ad-hoc booleans)

### 4. Supply Chain Compromise

**Profile**: Malicious or vulnerable dependency.

**Attack vectors**:

- XSS via compromised frontend library
- Data exfiltration via backend dependency

**Mitigations**:

- Lockfile-pinned dependencies
- Hotspot rules requiring merge captain for package.json changes
- Security advisory monitoring (Dependabot)

---

## Top Risks and Mitigations

### Risk 1: Privilege Escalation

**Scenario**: User gains capabilities they shouldn't have.

**Current Mitigations**:

- Default-deny capability system (80+ granular capabilities)
- `hasCapability()` checks on every protected action
- Delegation rules prevent granting capabilities you don't have (SD-3)
- Time-bounded role assignments (TB-1, TB-2)
- Contract tests verify role→capability mappings

**What to watch for in reviews**:

- New endpoints without `requireCapability()`
- Inline `role === "admin"` checks (anti-pattern N2)
- Missing negative test cases

### Risk 2: Impersonation Abuse

**Scenario**: Admin uses impersonation to perform actions as another user.

**Current Mitigations**:

- 5 dangerous capabilities blocked during impersonation
- `requireCapabilitySafe()` for sensitive operations
- All impersonation actions logged
- Contract tests verify blocked capabilities

**What to watch for in reviews**:

- Dangerous capabilities using `requireCapability()` instead of `requireCapabilitySafe()`
- New dangerous capabilities not added to blocked list
- Actions that bypass impersonation context

### Risk 3: Lifecycle State Corruption

**Scenario**: Entity reaches invalid state or skips required transitions.

**Current Mitigations**:

- Explicit state machines for events, memberships, pages
- Transitions validated against allowed rules
- Timestamps track every state change
- Unit tests for boundary conditions

**What to watch for in reviews**:

- Direct status field updates bypassing transition functions
- Missing transition validation
- Ad-hoc boolean flags instead of state machine states

### Risk 4: Row-Level Data Leakage

**Scenario**: User accesses records belonging to other users.

**Current Mitigations**:

- Object-scoped capability checks
- Query filters include ownership/scope constraints
- API returns only authorized data

**What to watch for in reviews**:

- APIs that accept IDs without ownership validation
- List endpoints without proper filtering
- Direct database queries bypassing authorization layer

### Risk 5: Audit Trail Gaps

**Scenario**: Privileged action occurs without audit record.

**Current Mitigations**:

- `auditMutation()` helper for consistent logging
- Audit includes before/after state for updates
- IP address and user agent captured
- Request ID for traceability

**What to watch for in reviews**:

- Mutations without `auditMutation()` or `auditCreate/Update/Delete` calls
- Catch blocks that swallow errors silently
- Automation paths bypassing audit (anti-pattern N5)

---

## What Is NOT Yet Protected

Honesty about gaps builds trust. These areas need attention:

| Gap | Current State | Risk Level | Planned Mitigation |
|-----|--------------|------------|-------------------|
| **Rate limiting** | No request rate limits | Medium | Add middleware |
| **CSRF protection** | Relies on SameSite cookies | Low | Evaluate token-based CSRF |
| **Brute force protection** | No lockout after failed auth | Medium | Add attempt tracking |
| **Encryption at rest** | Database-level only | Low | Evaluate column-level |
| **Field-level audit** | Only tracks full objects | Low | Consider diff-level detail |

### Known Violations (from AUDIT_REPORT.md)

The following issues are documented and being remediated:

- **9 Critical**: Unauthenticated admin routes (remediation in progress)
- **6 High**: Inline role checks instead of capability checks
- **5 Medium**: Silent error handling

See `AUDIT_REPORT.md` for full details and remediation status.

---

## Security Testing Coverage

| Invariant Category | Test Type | Location |
|-------------------|-----------|----------|
| **RBAC defaults** | Contract test | `tests/contracts/rbac.contract.spec.ts` |
| **Impersonation safety** | Contract test | `tests/contracts/impersonation.contract.spec.ts` |
| **Lifecycle transitions** | Unit test | `tests/unit/membership/lifecycle.spec.ts` |
| **Auth boundaries** | E2E test | `tests/api/*.spec.ts` |
| **Guardrail enforcement** | CI check | `.github/workflows/security-guardrails.yml` |

---

## Quick Reference: Charter Principles

This threat model aligns with the Architectural Charter:

- **P1**: Every action attributable to authenticated user
- **P2**: Default deny, least privilege, object scope
- **P3**: State machines over ad-hoc booleans
- **P7**: Observability is a product feature
- **P9**: Security must fail closed

See `docs/ARCHITECTURAL_CHARTER.md` for the complete charter.

---

## For Reviewers

When reviewing code changes:

1. **Check the invariant category** - Does this touch RBAC, impersonation, or lifecycle?
2. **Verify the pattern** - Is `requireCapability()` or `requireCapabilitySafe()` used correctly?
3. **Look for tests** - Are permission boundaries tested (positive AND negative)?
4. **Check audit logging** - Are mutations properly logged?

See `docs/CI/PR_REVIEW_CHECKLIST.md` for the complete review rubric.
