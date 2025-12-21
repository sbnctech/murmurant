# Cognitive Load Review Gate

A Checklist for Detecting Complexity Regressions in PRs

---

## Purpose

This gate prevents ClubOS from reintroducing the cognitive load problems that
make Wild Apricot difficult to operate. It complements the WA-Immunity Review
Gate by focusing specifically on **learnability and predictability**.

Use this gate for any PR that:

- Adds new UI or admin features
- Introduces new concepts, terms, or entities
- Changes existing behavior or workflows
- Adds configuration options or settings
- Modifies error messages or help text

**If any question is answered "No" → Block merge until resolved.**

---

## How to Use

1. Read each indicator section
2. Answer Yes or No to each question by reading the PR diff
3. If No: Add a comment using the provided template
4. If all Yes: Approve the cognitive load gate

**Non-experts can use this.** Each question is answerable by reading code and
UI strings. No system knowledge or running the application required.

---

## The 5 Cognitive Load Regression Indicators

### CL-1: Proprietary Terminology

*Does this PR introduce terms that don't match standard SaaS vocabulary?*

**Why it matters:** Wild Apricot uses "gadgets," "levels," "contact types,"
and other terms that don't transfer from other tools. Every proprietary term
increases learning time and error rate.

| # | Detection Question | Yes/No |
|---|-------------------|--------|
| 1 | Do all new entity names match common SaaS terms? (member, event, page, role, permission, invoice, payment) | |
| 2 | Do all new action names match common verbs? (create, edit, delete, publish, archive, cancel) | |
| 3 | Could a Mailchimp/Stripe/WordPress user guess what this term means? | |

**How to detect in PR:**

- Search for new `type`, `interface`, `enum` definitions
- Check new UI labels, button text, and menu items
- Look for new column names in Prisma schema
- Review error message text for unfamiliar terms

**Blocking threshold:** ANY new term that fails question 3.

**Examples:**

| Violation | Fix |
|-----------|-----|
| "Gadget" | "Widget" or "Component" |
| "Level" (for permissions) | "Role" or "Permission" |
| "Contact" (for member) | "Member" |
| "Bundle" (for group) | "Group" or "Collection" |

---

### CL-2: Hidden Rules

*Does this PR add behavior that cannot be predicted from the UI?*

**Why it matters:** Wild Apricot has many behaviors that only experts know:
template inheritance, system page behaviors, implicit email triggers. These
require oral tradition to operate safely.

| # | Detection Question | Yes/No |
|---|-------------------|--------|
| 1 | Is every conditional behavior visible in the UI before execution? | |
| 2 | If behavior varies based on context, is the current context displayed? | |
| 3 | Are there any `if` conditions in the logic that the user cannot see? | |

**How to detect in PR:**

- Look for conditional logic (`if`, `switch`, ternary) in mutation handlers
- Check if the condition's inputs are visible in the corresponding UI
- Search for "silent" or "auto" or "implicit" in code or comments
- Look for behaviors triggered by side effects, not explicit user action

**Blocking threshold:** ANY hidden conditional that affects user-visible outcome.

**Examples:**

| Violation | Fix |
|-----------|-----|
| Auto-send email when status changes | Show "This will send an email" before status change |
| Different behavior for "system" vs regular pages | No special categories, or make category visible |
| Price varies by hidden membership attribute | Show effective price before checkout |
| Template inheritance rules not visible | Show "Inherited from: [template name]" |

---

### CL-3: Implicit Dependencies

*Does this PR create connections between entities that aren't visible?*

**Why it matters:** Wild Apricot's hidden cascades (delete event → void invoices)
are a primary source of destructive errors. Dependencies must be explicit.

| # | Detection Question | Yes/No |
|---|-------------------|--------|
| 1 | When entity A is modified, are all effects on entity B shown first? | |
| 2 | Can the user see all entities that depend on the one they're editing? | |
| 3 | Are foreign key relationships reflected in the UI, not just the schema? | |

**How to detect in PR:**

- Look for cascading updates or deletes in Prisma schema (`onDelete: Cascade`)
- Search for multiple `prisma.*.update` or `prisma.*.delete` calls in one function
- Check if the UI shows dependency counts (e.g., "3 registrations will be affected")
- Look for event/observer patterns that trigger side effects

**Blocking threshold:** ANY cross-entity effect not previewed in UI.

**Examples:**

| Violation | Fix |
|-----------|-----|
| Delete event also voids registrations | Show "5 registrations will be canceled" before delete |
| Changing membership level triggers renewal | Show "This will trigger a renewal email" |
| Editing template updates all pages using it | Show "12 pages use this template" with list |
| Archiving user deactivates their API keys | Show affected resources before archive |

---

### CL-4: Unpredictable Outcomes

*Does the same action always produce the same visible result?*

**Why it matters:** Users build mental models based on consistency. When the
same action sometimes works and sometimes doesn't (based on hidden state),
users cannot learn the system.

| # | Detection Question | Yes/No |
|---|-------------------|--------|
| 1 | Does clicking button X always do the same thing, regardless of hidden state? | |
| 2 | If behavior varies, does the button label/state change to reflect it? | |
| 3 | Are edge cases handled with clear errors, not silent alternative behavior? | |

**How to detect in PR:**

- Look for early returns or guards in mutation handlers
- Check if disabled states are reflected in UI (`disabled`, different styling)
- Search for fallback behaviors (`||`, `??`, default values in destructuring)
- Look for mode-dependent logic that isn't reflected in UI state

**Blocking threshold:** ANY action that silently does something different based
on hidden state.

**Examples:**

| Violation | Fix |
|-----------|-----|
| "Save" button saves draft OR publishes based on hidden flag | Two buttons: "Save Draft" and "Publish" |
| Delete succeeds or fails silently based on dependencies | Show error: "Cannot delete: 3 registrations exist" |
| Form submission does different things for new vs returning members | Different forms or clear mode indicator |
| Export includes different columns based on user role (silently) | Show "Exporting: Name, Email, Phone" before export |

---

### CL-5: Training-Dependent Safety

*Does this PR rely on user knowledge to prevent mistakes?*

**Why it matters:** WA's safety model is "just train people." This fails because
volunteer turnover is high, training decays, and novel situations aren't covered.
Safety must be enforced by mechanism, not memory.

| # | Detection Question | Yes/No |
|---|-------------------|--------|
| 1 | Would a first-day volunteer understand the risk of this action? | |
| 2 | Is destructive potential communicated in the UI, not just documentation? | |
| 3 | Are high-risk actions blocked or confirmed by mechanism, not convention? | |

**How to detect in PR:**

- Look for comments like "be careful," "only use if," "advanced users"
- Check if risky actions have confirmation dialogs
- Search for documentation that says "make sure to" or "remember to"
- Look for operations that are dangerous but have the same UI weight as safe ones

**Blocking threshold:** ANY high-risk action without mechanical safeguard.

**Examples:**

| Violation | Fix |
|-----------|-----|
| "Delete All" button looks same as "Delete One" | Different color, requires typing confirmation |
| Bulk email send with single click | Preview + "Send to 500 members?" confirmation |
| Admin can grant any permission to anyone | Can only grant permissions you have yourself |
| Dangerous setting in normal settings list | Separate "Advanced" section with warning |

---

## Quick Reference Card

```
COGNITIVE LOAD REVIEW GATE

CL-1: Proprietary Terminology
  Q: Does the term match standard SaaS vocabulary?
  Q: Could a Mailchimp/Stripe user guess the meaning?

CL-2: Hidden Rules
  Q: Is every conditional behavior visible in UI?
  Q: Can user see the context that changes behavior?

CL-3: Implicit Dependencies
  Q: Are cross-entity effects shown before execution?
  Q: Can user see what depends on this entity?

CL-4: Unpredictable Outcomes
  Q: Does same action always produce same result?
  Q: Does UI state reflect when behavior will vary?

CL-5: Training-Dependent Safety
  Q: Would a first-day volunteer understand the risk?
  Q: Is destructive potential shown in UI, not docs?

If ANY answer is No → Block merge
```

---

## Integration Points

### PR Review Integration

Add to PR template:

```markdown
## Cognitive Load Gate

- [ ] CL-1: No proprietary terminology introduced
- [ ] CL-2: No hidden rules added
- [ ] CL-3: No implicit dependencies created
- [ ] CL-4: No unpredictable outcomes introduced
- [ ] CL-5: No training-dependent safety

If any box unchecked, explain in comments or link to exemption.
```

### Architecture Review Integration

For new feature proposals, require:

| Gate | Architecture Review Question |
|------|------------------------------|
| CL-1 | What terms does this feature introduce? Are they standard? |
| CL-2 | What behaviors vary based on context? How are they surfaced? |
| CL-3 | What entities does this feature connect? How are connections shown? |
| CL-4 | What modes or states affect behavior? How does UI reflect them? |
| CL-5 | What mistakes can a new user make? How does the design prevent them? |

Add to architecture review template (if feature touches UI or workflows).

### Release Readiness Integration

Add to release readiness checklist:

```markdown
## Cognitive Load Verification

- [ ] No new proprietary terms in UI text or schema
- [ ] All new conditional behaviors documented in UI
- [ ] All new entity relationships shown in admin views
- [ ] All mode-dependent behavior reflected in UI state
- [ ] All high-risk actions have mechanical safeguards

Sign-off: _____________ Date: _______
```

For features with Risk Score ≥ 10 (per Feature Risk Model):

- Require cognitive load review as release gate
- New user walkthrough test before GA
- Volunteer usability feedback during pilot

---

## Reviewer Comments Templates

### Block: Proprietary Term

```
Cognitive Load Gate: CL-1 Violation

This PR introduces non-standard terminology: "[term]"

Standard SaaS users will not recognize this term. Please:
- [ ] Rename to standard equivalent (member, event, role, etc.)
- [ ] Or document why standard term doesn't apply

See: docs/reliability/COGNITIVE_LOAD_REVIEW_GATE.md#cl-1-proprietary-terminology
```

### Block: Hidden Rule

```
Cognitive Load Gate: CL-2 Violation

This PR adds behavior that users cannot predict from the UI:
[describe the hidden conditional]

Please:
- [ ] Show the condition's state in the UI
- [ ] Or show a preview of what will happen before action

See: docs/reliability/COGNITIVE_LOAD_REVIEW_GATE.md#cl-2-hidden-rules
```

### Block: Implicit Dependency

```
Cognitive Load Gate: CL-3 Violation

This PR creates a cross-entity effect that isn't visible:
[describe entity A → entity B effect]

Please:
- [ ] Show affected entities before action executes
- [ ] Or show dependency count on the source entity

See: docs/reliability/COGNITIVE_LOAD_REVIEW_GATE.md#cl-3-implicit-dependencies
```

### Block: Unpredictable Outcome

```
Cognitive Load Gate: CL-4 Violation

This action produces different results based on hidden state:
[describe the variation]

Please:
- [ ] Use different buttons/labels for different outcomes
- [ ] Or show current mode/state in the UI

See: docs/reliability/COGNITIVE_LOAD_REVIEW_GATE.md#cl-4-unpredictable-outcomes
```

### Block: Training-Dependent Safety

```
Cognitive Load Gate: CL-5 Violation

This high-risk action relies on user knowledge for safety:
[describe the risk]

Please:
- [ ] Add confirmation dialog with clear consequence
- [ ] Or add mechanical guard (permission check, dependency block)
- [ ] Or make risk visually distinct (color, placement, warning)

See: docs/reliability/COGNITIVE_LOAD_REVIEW_GATE.md#cl-5-training-dependent-safety
```

---

## Scoring Guide

Use this to evaluate borderline cases:

| Indicator | Low Risk (Allow) | Medium Risk (Review) | High Risk (Block) |
|-----------|------------------|----------------------|-------------------|
| CL-1 | Term is industry-standard | Term is uncommon but guessable | Term requires ClubOS glossary |
| CL-2 | All conditions visible | Some conditions in tooltips | Conditions only in code/docs |
| CL-3 | Dependencies shown inline | Dependencies in confirmation | Dependencies not shown |
| CL-4 | One button = one outcome | Outcome varies with visible state | Outcome varies with hidden state |
| CL-5 | Mechanical safeguard exists | Warning shown but no blocker | "Be careful" only in docs |

**Default to Block.** When uncertain, ask: "Would a volunteer on day one make
a mistake here?"

---

## When to Skip This Gate

This gate can be skipped for:

- Backend-only changes with no UI impact
- API-only changes (check CL-3 for cascade effects)
- Documentation-only changes
- Test-only changes
- Performance optimizations with no behavioral change

Mark in PR description: `Cognitive Load Gate: N/A - [reason]`

---

## Relationship to Other Gates

| Gate | Focus | Overlap |
|------|-------|---------|
| WA-Immunity Gate | Data integrity, permissions, audit | CL-3 overlaps with MF-1 (cascades) |
| Cognitive Load Gate | Learnability, predictability, safety | CL-5 overlaps with MF-2 (irreversibility) |
| Feature Risk Gate | Release process, rollout, rollback | Uses CL score as input to risk score |

**Run all applicable gates.** A PR may pass WA-Immunity but fail Cognitive Load
(or vice versa).

---

## See Also

- [COGNITIVE_LOAD_AND_TALENT_MARKET_ADVANTAGE.md](../architecture/COGNITIVE_LOAD_AND_TALENT_MARKET_ADVANTAGE.md) - Why cognitive load matters
- [WA_IMMUNITY_REVIEW_GATE.md](./WA_IMMUNITY_REVIEW_GATE.md) - Complementary data integrity gate
- [FEATURE_RISK_AND_FIELD_TESTING_MODEL.md](../ops/FEATURE_RISK_AND_FIELD_TESTING_MODEL.md) - Risk scoring model
- [WA_FUTURE_FAILURE_IMMUNITY.md](../architecture/WA_FUTURE_FAILURE_IMMUNITY.md) - Meta-failure patterns

---

*This document is normative for PR reviews.
Non-compliance blocks merge.*
