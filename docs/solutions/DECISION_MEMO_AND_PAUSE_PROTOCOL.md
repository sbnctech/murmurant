# Decision Memo and Pause Protocol

Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

---

## Purpose

This document defines when and how ClubOS engagements pause for client decisions. Pausing is not failure. Pausing prevents scope drift, wasted work, and incorrect implementations.

If we cannot proceed safely, we stop and wait for clarity.

---

## When to Pause

An engagement MUST pause when any of the following conditions exist:

| Condition | Example |
|-----------|---------|
| **Governance ambiguity** | Two board members give conflicting direction |
| **Missing decision-maker** | Required approver is unavailable for 5+ business days |
| **Data conflict** | Source data contradicts stated policy |
| **Scope creep detected** | Request exceeds agreed deliverables |
| **Risk acceptance required** | Proceeding requires accepting documented risk |
| **Blocker unresolved** | RED-status item from readiness assessment |
| **Policy undefined** | System behavior depends on policy that does not exist |

---

## What Continues During Pause

The following work MAY continue while awaiting a decision:

- Documentation of the issue
- Research into options
- Preparation of decision memo
- Work on unrelated, unblocked deliverables
- Answering clarifying questions

---

## What Never Continues During Pause

The following work MUST NOT proceed until the pause is resolved:

| Activity | Reason |
|----------|--------|
| Implementation of disputed feature | May require rework |
| Data migration of contested records | May corrupt canonical data |
| Permission model changes | Security implications |
| Publishing to production | Cannot undo public exposure |
| Training on undecided workflows | Teaches wrong behavior |
| Billing for blocked deliverables | Work not complete |

---

## Pause Initiation

To initiate a pause:

1. Identify the blocking issue
2. Document it in a Decision Memo (see template)
3. Send memo to designated decision-maker(s)
4. Set explicit decision deadline (recommend 5 business days)
5. Log pause in engagement tracker
6. Notify all affected parties

---

## Pause Resolution

A pause resolves when:

- Decision-maker provides written decision, OR
- Decision-maker accepts a recommended path, OR
- Blocking condition no longer applies

Resolution MUST be documented. Verbal decisions are not sufficient for implementation.

---

## SLA Non-Guarantees During Pause

Consistent with ClubOS reliability principles, we make explicit what we do NOT guarantee:

| Non-Guarantee | Explanation |
|---------------|-------------|
| Immediate response | We will acknowledge within 2 business days, not instantly |
| Timeline preservation | Pause duration extends project timeline 1:1 |
| Scope absorption | We will not absorb pause delays into fixed scope |
| Decision-making | We provide options; client makes decisions |
| Workarounds | We will not implement temporary hacks to avoid decisions |

If a pause extends beyond 15 business days without resolution, the engagement enters formal hold status. Resume requires new scheduling and may require re-scoping.

---

## Escalation Path

If a decision cannot be obtained from the designated contact:

1. Request escalation to executive sponsor (from intake)
2. If no response in 5 business days, send formal hold notice
3. Hold notice triggers billing pause and timeline reset

---

## Examples and Scripted Language

### Example 1: Conflicting Board Direction

**Situation:** VP Activities says event registration should require payment upfront. President says events should allow pay-at-door.

**Script:**
> "We have received conflicting direction on event payment policy. This affects how we configure registration. We are pausing event registration implementation until we receive a single written decision. Please see the attached Decision Memo for options and our recommendation."

---

### Example 2: Missing Approver

**Situation:** Membership Chair is on vacation. Data migration requires their validation.

**Script:**
> "Member data migration requires validation from the Membership Chair before we proceed. They are currently unavailable until [date]. We are pausing migration work and will resume when they return. Other work continues as scheduled."

---

### Example 3: Undefined Policy

**Situation:** Client wants automated renewal reminders, but has no documented policy on grace periods.

**Script:**
> "To configure renewal reminders, we need to know your grace period policy. How many days after expiration can a member still renew at the standard rate? Please provide this policy in writing. We are pausing reminder configuration until we receive it."

---

### Example 4: Scope Creep Detected

**Situation:** Client asks for a custom reporting dashboard not in the original scope.

**Script:**
> "Custom reporting dashboards are not included in the current engagement scope. We can add this as a change order with revised timeline and pricing, or we can complete the current scope first and address it separately. Please confirm how you would like to proceed."

---

### Example 5: Risk Acceptance Required

**Situation:** Client wants to skip backup verification to meet a deadline.

**Script:**
> "Proceeding without backup verification introduces risk of unrecoverable data loss. This requires explicit written acceptance from [Executive Sponsor]. Please see the attached Decision Memo. We cannot proceed until this is signed."

---

## Decision Memo Template

See [templates/DECISION_MEMO_TEMPLATE.md](./templates/DECISION_MEMO_TEMPLATE.md) for the standard format.

---

## Related Documents

- [SCOPE_BOUNDARIES_AND_NON_GOALS.md](./SCOPE_BOUNDARIES_AND_NON_GOALS.md) - What is in and out of scope
- [READINESS_ASSESSMENT.md](./READINESS_ASSESSMENT.md) - Engagement readiness gates
- [Reliability: Read Safety](../reliability/READ_SAFETY.md) - Fail-closed philosophy
