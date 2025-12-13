# Implementation Authorization Checklist

Worker 1 — Implementation Authorization Checklist — Report

This checklist MUST be completed and approved before any
non-trivial implementation work begins.

---

## 1. Contract Readiness

| Item | PASS | FAIL |
|------|------|------|
| API contract exists and is approved | File exists in docs/api/, has "READY FOR REVIEW" | File missing or draft |
| Widget contract exists and is approved | File exists in docs/widgets/, has "READY FOR REVIEW" | File missing or draft |
| Storage / provider interface exists | Interface file exists in docs/ or src/lib/ | No interface defined |
| Non-goals explicitly documented | "Non-Goals" or "Out of Scope" section present | Section missing |

- [ ] API contract exists and is approved
- [ ] Widget contract exists and is approved
- [ ] Storage / provider interface exists
- [ ] Non-goals explicitly documented

---

## 2. Security & Trust Boundaries

| Item | PASS | FAIL |
|------|------|------|
| Widgets are treated as untrusted UI | No authorization logic in widget code | Widget contains auth checks |
| All authorization enforced server-side | Every endpoint has requireAuth/requireRole | Any endpoint missing auth |
| No secrets exposed to client | No API keys, tokens, or credentials in client bundle | Secrets found in client code |
| Providers invoked server-side only | All provider calls in src/server/ or src/lib/ | Provider calls in src/app/ client components |

- [ ] Widgets are treated as untrusted UI
- [ ] All authorization enforced server-side
- [ ] No secrets exposed to client
- [ ] Providers invoked server-side only

---

## 3. RBAC Verification

| Item | PASS | FAIL |
|------|------|------|
| Allow tests exist | At least one test per role that should succeed | No allow tests |
| Deny tests exist | At least one test per role that should fail | No deny tests |
| Role matrix documented | Table mapping roles to permissions exists | No matrix |
| Least-privilege confirmed | No role has more permissions than documented | Role exceeds documented scope |

- [ ] Allow tests exist
- [ ] Deny tests exist
- [ ] Role matrix documented
- [ ] Least-privilege confirmed

---

## 4. Privacy Guarantees

| Item | PASS | FAIL |
|------|------|------|
| Privacy filtering documented | Document states what is filtered and when | No filtering docs |
| Opt-out behavior defined | Document states what happens when member opts out | Opt-out undefined |
| Lapsed member behavior defined | Document states retention/visibility for lapsed | Lapsed behavior undefined |
| Audit trail required for mutations | All write operations log actor/target/timestamp | Mutations without audit |

- [ ] Privacy filtering documented
- [ ] Opt-out behavior defined
- [ ] Lapsed member behavior defined
- [ ] Audit trail required for mutations

---

## 5. Audit & Observability

| Item | PASS | FAIL |
|------|------|------|
| Actor / target / before / after / timestamp | Audit log schema includes all five fields | Any field missing |
| Idempotency enforced | Write endpoints require idempotency_key param | Writes without idempotency |
| Replay protection documented | Document states how duplicates are handled | No replay docs |

- [ ] Actor / target / before / after / timestamp
- [ ] Idempotency enforced
- [ ] Replay protection documented

---

## 6. Testing Requirements

| Item | PASS | FAIL |
|------|------|------|
| Unit tests | tests/ directory contains relevant .spec.ts files | No unit tests |
| Permission tests | Tests verify role-based access control | No permission tests |
| Deny-path tests mandatory | Tests verify unauthorized access is rejected | Only happy-path tests |
| Null provider used where applicable | Tests use mock/null provider, not real services | Tests require live provider |

- [ ] Unit tests
- [ ] Permission tests
- [ ] Deny-path tests mandatory
- [ ] Null provider used where applicable

---

## 7. Agent Operating Rules

| Item | PASS | FAIL |
|------|------|------|
| Single-screen report required | Report fits in terminal without scrolling | Report exceeds one screen |
| git status -sb included | Report contains git status output | Status missing |
| No merge or rebase main | Branch created from main, no mid-work merges | Evidence of merge/rebase |
| READY FOR REVIEW or BLOCKED stated | Final line states one of these exactly | Ambiguous status |

- [ ] Single-screen report required
- [ ] git status -sb included
- [ ] No merge or rebase main
- [ ] READY FOR REVIEW or BLOCKED stated

---

## Verdict
READY FOR REVIEW
