# Platform vs Policy Separation

> **Related Issues:** [#232 - Policy Isolation Epic](https://github.com/sbnctech/clubos/issues/232) | [#263 - Policy Configuration Layer](https://github.com/sbnctech/clubos/issues/263)

This document defines what belongs in ClubOS core platform code versus what must be configurable organization policy.

---

## Quick Reference

| Category | Platform Invariant | Organization Policy |
|----------|-------------------|---------------------|
| **Changes via** | Code deployment | Configuration / database |
| **Varies by org** | Never | Always |
| **Examples** | RBAC engine, audit logging | Membership thresholds, role names |
| **Risk if wrong** | Security vulnerability | Adoption friction |

---

## Definitions

### Platform Invariant

A **platform invariant** is a capability, behavior, or constraint that:

1. **Must be identical** across all organizations using ClubOS
2. **Cannot be disabled** without compromising security, correctness, or auditability
3. **Is architectural** — changing it requires code changes and deployment

**Think:** "If we let orgs turn this off, something breaks or becomes unsafe."

### Organization Policy

An **organization policy** is a rule, threshold, name, or workflow that:

1. **Varies legitimately** between organizations
2. **Has no single "correct" value** — different orgs have different needs
3. **Is configuration** — changing it requires database/settings changes, not deployment

**Think:** "A reasonable org might want this different, and that's fine."

---

## Decision Checklist for PR Reviewers

When reviewing code that adds a new constant, threshold, name, or behavior:

```
┌─────────────────────────────────────────────────────────────┐
│  IS THIS A PLATFORM INVARIANT OR ORGANIZATION POLICY?       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Could a reasonable org want a different value?          │
│     YES → Policy    NO → Maybe Invariant                    │
│                                                             │
│  2. Does changing it create a security risk?                │
│     YES → Invariant    NO → Probably Policy                 │
│                                                             │
│  3. Is the value derived from external requirements?        │
│     (Laws, payment processors, security standards)          │
│     YES → Invariant    NO → Probably Policy                 │
│                                                             │
│  4. Would we support a customer changing this?              │
│     YES → Policy    NO → Invariant                          │
│                                                             │
│  5. Is it a name, label, or terminology?                    │
│     YES → Almost certainly Policy                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**When in doubt:** If the value came from SBNC's practices, it's probably policy.

---

## Concrete Examples

### Platform Invariants (Do NOT make configurable)

| Invariant | Rationale |
|-----------|-----------|
| **Capability-based RBAC** | Core security model; all orgs need consistent authorization |
| **Default-deny authorization** | Security principle; cannot be disabled |
| **Impersonation blocking for dangerous capabilities** | Security invariant; prevents privilege escalation |
| **Audit logging for privileged actions** | Compliance requirement; immutable record |
| **State machine pattern for workflows** | Architectural consistency; prevents invalid transitions |
| **Session token cryptography** | Security standard; weakening creates vulnerability |
| **Password/passkey requirements** | Security baseline; cannot be lowered |
| **Input validation patterns** | Security hygiene; XSS/injection prevention |
| **Multi-tenant data isolation** | Correctness invariant; orgs cannot see each other's data |
| **Audit trail immutability** | Compliance; audit records cannot be modified |

### Organization Policies (MUST be configurable)

| Policy | Current SBNC Value | Why It's Policy |
|--------|-------------------|-----------------|
| **Newbie membership threshold** | 90 days | Other orgs may use 30, 60, 180 days |
| **Extended member threshold** | 730 days | Arbitrary; could be 365, 1000, never |
| **Timezone** | America/Los_Angeles | Obviously org-specific |
| **Registration open schedule** | Tuesday 8 AM | SBNC convention, not universal |
| **eNews announcement day** | Sunday | SBNC convention, not universal |
| **Event archive threshold** | 30 days | Preference; some orgs keep longer |
| **Role names** | "President", "VP-Activities" | Other orgs use "Chair", "Director", etc. |
| **Committee names** | "Executive Board", "Activities" | Org-specific structure |
| **Membership tier names** | "newbie_member", "extended_member" | SBNC terminology |
| **Meeting types** | BOARD, EXECUTIVE, SPECIAL, ANNUAL | Org governance structure varies |
| **KPI thresholds** | Various warning/danger levels | Org-specific targets |
| **Board eligibility rules** | 2-year membership requirement | Governance policy varies |

---

## Tenant Zero: SBNC

### Allowed but Never Required

SBNC is the **first organization** (Tenant Zero) on ClubOS. This means:

1. **SBNC values are defaults** — New orgs get SBNC's configuration as a starting template
2. **SBNC values are examples** — Documentation may reference SBNC practices as illustrations
3. **SBNC values are never mandatory** — No code should assume SBNC's policies

### What This Looks Like

```typescript
// WRONG: SBNC policy hard-coded
const NEWBIE_DAYS = 90;

// RIGHT: Organization configuration with SBNC as default
const newbieDays = org.config.membership.newbieDays ?? 90;
```

```typescript
// WRONG: SBNC role name assumed
if (user.role === 'VP-Activities') { ... }

// RIGHT: Capability-based (role names are policy)
if (await hasCapability(user, 'events:approve')) { ... }
```

### SBNC as Template

SBNC-derived materials (committee structures, job descriptions, governance examples) should be:

- Stored in `templates/` directory
- Clearly labeled as "Example - SBNC"
- Importable but not required
- Never referenced in core logic

See: [#264 - Canonical Governance Templates](https://github.com/sbnctech/clubos/issues/264)

---

## Implementation Guidance

### For New Features

1. **Identify all constants** — List every hard-coded value
2. **Apply the checklist** — Classify each as invariant or policy
3. **Externalize policies** — Move to configuration/database
4. **Document invariants** — Justify why it cannot vary

### For Existing Code

1. **Audit SBNC coupling** — See [#262](https://github.com/sbnctech/clubos/issues/262)
2. **Prioritize by risk** — Start with customer-facing policies
3. **Migrate incrementally** — One policy area at a time
4. **Maintain backwards compatibility** — SBNC deployment must continue working

### Configuration Hierarchy

```
Platform Defaults (fallback)
    ↓
Organization Config (per-tenant)
    ↓
Environment Override (dev/staging/prod)
```

---

## Red Flags in Code Review

Watch for these patterns that suggest policy is being hard-coded:

```typescript
// Red flag: Magic numbers that are lifecycle thresholds
if (daysSinceJoin < 90) { ... }

// Red flag: Hard-coded day/time values
const openDay = 'Tuesday';
const openHour = 8;

// Red flag: Hard-coded role names
if (role === 'President' || role === 'VP-Activities') { ... }

// Red flag: Hard-coded timezone
const tz = 'America/Los_Angeles';

// Red flag: SBNC-specific terminology in enum
enum MembershipTier { NEWBIE = 'newbie_member', ... }
```

### Acceptable Patterns

```typescript
// Good: Using organization configuration
const threshold = await getOrgConfig(orgId, 'membership.newbieDays');

// Good: Capability-based authorization
if (await hasCapability(user, 'events:approve')) { ... }

// Good: Configuration with default
const timezone = org.timezone ?? 'UTC';

// Good: Reference data from database
const tiers = await getMembershipTiers(orgId);
```

---

## Summary

| Question | Answer |
|----------|--------|
| "Should this be the same for every org?" | → Platform Invariant |
| "Could a reasonable org want this different?" | → Organization Policy |
| "Did this value come from SBNC?" | → Probably Policy |
| "Would changing this create a security risk?" | → Probably Invariant |

**Default assumption:** If you're not sure, treat it as policy. It's easier to lock down a policy than to unlock an invariant.

---

## Related Documentation

- [Architectural Charter](../ARCHITECTURAL_CHARTER.md) — Core principles (P1-P10)
- [INVARIANTS.md](../CI/INVARIANTS.md) — Security invariants enforced by CI
- [Issue #232](https://github.com/sbnctech/clubos/issues/232) — Policy Isolation Epic
- [Issue #263](https://github.com/sbnctech/clubos/issues/263) — Policy Configuration Layer
