# Murmurant Safety Net

This document answers the questions a skeptical senior engineer or auditor would ask about how Murmurant prevents catastrophic mistakes.

---

## What Prevents Catastrophic Mistakes?

Murmurant uses a **defense-in-depth** approach with multiple layers of protection:

### Layer 1: Architecture (Design Time)

| Constraint | What It Prevents | Enforcement |
|-----------|------------------|-------------|
| **Default-deny capability system** | Privilege escalation | Every protected action requires explicit capability |
| **Blocked capabilities during impersonation** | Admin abuse of member context | 5 dangerous capabilities automatically blocked |
| **Explicit state machines** | Invalid workflow states | Transitions validated against allowed rules |
| **Delegation rules (SD-3, DM-3)** | Granting privileges you don't have | Runtime checks prevent escalation |

### Layer 2: Runtime (Request Time)

| Check | What It Catches | Location |
|-------|----------------|----------|
| `requireCapability()` | Missing authorization | Every protected endpoint |
| `requireCapabilitySafe()` | Impersonation abuse | Dangerous operations |
| Session validation | Expired/invalid tokens | Auth middleware |
| State transition validation | Invalid workflows | Lifecycle functions |

### Layer 3: Tests (Development Time)

| Test Type | What It Verifies | When It Runs |
|-----------|-----------------|--------------|
| **Contract tests** | Security invariants hold | `npm run test:unit` |
| **Unit tests** | Individual functions behave correctly | `npm run test:unit` |
| **E2E tests** | Full request/response flows | `npm run test-admin:stable` |
| **API tests** | Permission boundaries | `npm run test-api:stable` |

### Layer 4: CI (Merge Time)

| Guardrail | What It Blocks | Trigger |
|-----------|---------------|---------|
| `security-guardrails.yml` | Unsafe auth patterns | PRs touching auth/API |
| `npm run green` | Type errors, test failures | Every PR |
| Hotspot rules | Unreviewed critical changes | PRs touching schema, CI, auth |

### Layer 5: Process (Review Time)

| Process | What It Catches | Document |
|---------|-----------------|----------|
| PR Review Checklist | Human review gaps | `docs/CI/PR_REVIEW_CHECKLIST.md` |
| "Why This Is Safe" section | Missing safety analysis | `.github/pull_request_template.md` |
| Merge Captain approval | Hotspot conflicts | `docs/CI/CONTRIBUTING.md` |

---

## What Catches Regressions Early?

### Contract Tests (Fastest Feedback)

Contract tests run in milliseconds and verify security invariants:

```bash
npm run test:unit -- tests/contracts/
```

**What they catch:**

- Role X incorrectly has capability Y
- Impersonation blocking list is incomplete
- State machine allows invalid transition

**Why they're reliable:**

- Deterministic (no network, no time, no random)
- Fast enough to run on every file save
- Tied directly to code, not mocked APIs

### CI Guardrails (Before Merge)

The `security-guardrails.yml` workflow runs static analysis:

```bash
npm run test:guardrails
```

**What it catches:**

- New endpoint using `requireCapability()` for dangerous operation (should use `requireCapabilitySafe()`)
- Admin route missing auth check
- New unsafe pattern not in known gaps

**Why it's reliable:**

- Runs on every PR touching auth or API
- Fails the build (can't be ignored)
- Known gaps are explicit and reviewed

### Type System (Compile Time)

TypeScript catches entire classes of errors:

```bash
npm run typecheck
```

**What it catches:**

- Wrong capability name (string literal types)
- Missing required auth context
- Invalid state values

---

## What Still Relies on Human Review?

Some things cannot be fully automated:

| Area | Why It Needs Human Review | Mitigation |
|------|--------------------------|------------|
| **Business logic correctness** | Code can be type-safe but wrong | PR review checklist, E2E tests |
| **New capability appropriateness** | Machines can't judge "should admin have X?" | Charter principles, review rubric |
| **Audit log adequacy** | Can verify presence, not completeness | Review checklist item |
| **Error message quality** | Syntax-correct isn't user-friendly | Charter P6 (human-first language) |
| **Security of new patterns** | Novel code might introduce novel risks | Threat model, review checklist |

### The Review Checklist Bridges the Gap

`docs/CI/PR_REVIEW_CHECKLIST.md` provides a mechanical process for reviewers:

- Explicit questions to ask for each category
- "If this fails, do not merge" guidance
- Links to relevant code and tests

---

## Why This System Is Safer Than Ad-Hoc Testing

### Ad-Hoc Testing Problems

| Problem | What Goes Wrong |
|---------|-----------------|
| **Coverage gaps** | "I tested the happy path but not the error case" |
| **Regression blind spots** | "It worked before, I didn't think to re-test" |
| **Inconsistent standards** | "Developer A tests auth, Developer B doesn't" |
| **No enforcement** | "I meant to add tests but forgot" |

### How Murmurant Addresses Each

| Solution | How It Helps |
|----------|--------------|
| **Contract tests** | Deterministic tests for every security invariant |
| **CI guardrails** | Automated checks run on every PR |
| **PR template** | Forces authors to consider safety explicitly |
| **Review checklist** | Mechanical process ensures consistency |
| **Threat model** | Shared understanding of what matters |

### The Key Insight

> **Contract tests verify invariants, not implementations.**

When you write a contract test like "admin has all capabilities," it will catch:

- Code refactoring that accidentally removes a capability
- Merges that conflict on the capability list
- New code that adds a capability but forgets to give it to admin

You don't have to remember to test these scenarios—the contract test does it for you.

---

## How to Verify This System Works

### For Developers

1. **Break something intentionally** and verify the test catches it:

   ```bash
   # In src/lib/auth.ts, remove "events:delete" from admin's capabilities
   npm run test:unit -- tests/contracts/rbac
   # Should fail with "admin has all capabilities"
   ```

2. **Add an unsafe pattern** and verify the guardrail catches it:

   ```bash
   # Add requireCapability(req, "finance:manage") to a new route
   npm run test:guardrails
   # Should fail with "should use requireCapabilitySafe"
   ```

### For Auditors

1. **Review the threat model** (`docs/SECURITY/THREAT_MODEL.md`)
   - Does it cover the assets you'd expect?
   - Are the mitigations implemented?

2. **Run the test suite** and check coverage:

   ```bash
   npm run green
   ```

3. **Review the known gaps** in `AUDIT_REPORT.md`
   - Are they being addressed?
   - Are new gaps being added responsibly?

---

## Quick Links

| Document | Purpose |
|----------|---------|
| `docs/SECURITY/THREAT_MODEL.md` | What we're protecting and from whom |
| `docs/CI/PR_REVIEW_CHECKLIST.md` | Mechanical review process |
| `docs/CI/INVARIANTS.md` | Security invariant documentation |
| `docs/ARCHITECTURAL_CHARTER.md` | Core principles (P1-P10) |
| `AUDIT_REPORT.md` | Known violations and remediation |

---

## Summary

Murmurant safety comes from **layered defenses**:

1. **Architecture** → Default-deny, explicit state machines
2. **Runtime** → Capability checks on every request
3. **Tests** → Contract tests verify invariants
4. **CI** → Guardrails block unsafe patterns
5. **Process** → Review checklist ensures consistency

No single layer is perfect, but together they catch different types of mistakes at different stages. This is why a change that passes CI, has tests, and survives review is meaningfully safer than ad-hoc testing.
