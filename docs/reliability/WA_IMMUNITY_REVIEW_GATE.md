# WA-Immunity Review Gate

A Simple Checklist for PR Reviews

---

## Purpose

This checklist prevents ClubOS from reintroducing Wild Apricot's structural
failures. Use it for any PR that:

- Adds or modifies data mutations
- Adds or modifies permissions
- Adds or modifies entity states
- Adds or modifies background jobs
- Changes release or deployment behavior

**If any question is answered "No" → Block merge until resolved.**

---

## How to Use

1. Read each question
2. Answer Yes or No based on the PR's code
3. If No: Add a comment explaining what needs to change
4. If all Yes: Approve the review gate

**Non-experts can use this.** Each question is designed to be answerable by
reading the PR diff without deep system knowledge.

---

## The Gate: 7 Meta-Failure Patterns

### MF-1: Hidden Cascades

*Does this action only affect what the user clicked on?*

| # | Question | Yes/No |
|---|----------|--------|
| 1 | Does deleting/canceling this entity leave financial records intact? | |
| 2 | Are all side effects visible in a preview before execution? | |

**Block if No:** Deleting or modifying one thing should not silently change
other things. Financial records must never be affected by non-financial
operations.

**Example violation:** `deleteEvent()` that also voids invoices.

---

### MF-2: Irreversible Actions

*Can the user undo this or recover from a mistake?*

| # | Question | Yes/No |
|---|----------|--------|
| 1 | Does deletion use `deletedAt` (soft delete), not `DELETE FROM`? | |
| 2 | For content changes: is there a revision or version saved? | |

**Block if No:** Hard deletes are forbidden for user-created data. Content
edits must be reversible. If the PR uses `prisma.delete()` or SQL `DELETE`,
ask why.

**Example violation:** `await prisma.page.delete({ where: { id } })` instead of
`await prisma.page.update({ where: { id }, data: { deletedAt: new Date() } })`

---

### MF-3: Coarse Permissions

*Can this permission be granted narrowly, or is it all-or-nothing?*

| # | Question | Yes/No |
|---|----------|--------|
| 1 | Does new functionality use a specific capability (not `admin:full`)? | |
| 2 | Can this capability be scoped to a specific object or committee? | |

**Block if No:** New features should not require broad admin access. If the
only way to use the feature is with `admin:full`, the permission model needs
work.

**Example violation:** A check-in feature that requires `events:manage` instead
of a specific `events:checkin` capability.

---

### MF-4: Silent Failures

*Will the user know if this fails?*

| # | Question | Yes/No |
|---|----------|--------|
| 1 | Do errors surface to the user with an actionable message? | |
| 2 | For background jobs: do failures create an admin notification? | |

**Block if No:** Swallowing errors or `catch () {}` blocks without user feedback
recreate WA's silent failure mode. Background jobs must surface failures.

**Example violation:** `try { ... } catch { /* do nothing */ }`

---

### MF-5: Implicit State Machines

*Is the entity's state stored, not computed?*

| # | Question | Yes/No |
|---|----------|--------|
| 1 | Does the entity have a `status` enum (not boolean flags like `isActive`)? | |
| 2 | Are state transitions validated at the service/model layer? | |

**Block if No:** Adding `isPublished`, `isCanceled`, `isActive` boolean fields
creates implicit state machines that WA suffers from. Use explicit status enums.

**Example violation:** `published: boolean` instead of `status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'`

---

### MF-6: Unattributed Mutations

*Can we answer "who did this and when?"*

| # | Question | Yes/No |
|---|----------|--------|
| 1 | Does this mutation call `createAuditEntry()` with actor and before/after? | |
| 2 | For background jobs: is the job attributed to a service account? | |

**Block if No:** Every data mutation must be auditable. If the PR modifies data
without calling `createAuditEntry()`, ask why.

**Example violation:** Direct `prisma.member.update()` without corresponding
audit log creation.

---

### MF-7: Single-Point-of-Failure Releases

*Can this be rolled back or disabled quickly?*

| # | Question | Yes/No |
|---|----------|--------|
| 1 | For high-risk features: is there a kill switch or feature flag? | |
| 2 | Is there a documented rollback plan if this causes problems? | |

**Block if No:** Features that affect all tenants simultaneously with no
rollback mechanism are global risk events. High-risk features need kill
switches.

**Example violation:** Deploying a new payment flow with no feature flag to
disable it if payment processing fails.

---

## Quick Reference Card

Print this and tape it next to your monitor:

```
WA-IMMUNITY REVIEW GATE

MF-1: Hidden Cascades
  Q: Does delete leave financial records intact?
  Q: Are side effects visible in preview?

MF-2: Irreversible Actions
  Q: Is delete soft (deletedAt), not hard (DELETE)?
  Q: Are content changes versioned?

MF-3: Coarse Permissions
  Q: Is the capability specific, not admin:full?
  Q: Can it be scoped to one object?

MF-4: Silent Failures
  Q: Does the user see errors?
  Q: Do background failures notify admin?

MF-5: Implicit State Machines
  Q: Is state an enum, not boolean flags?
  Q: Are transitions validated?

MF-6: Unattributed Mutations
  Q: Does mutation create audit entry?
  Q: Are background jobs attributed?

MF-7: SPOF Releases
  Q: Is there a kill switch for high-risk?
  Q: Is there a rollback plan?

If ANY answer is No → Block merge
```

---

## Merge Decision Matrix

| Pattern | All Yes | Any No |
|---------|---------|--------|
| MF-1 | Approve | Block: "Add cascade preview" or "Protect financial records" |
| MF-2 | Approve | Block: "Use soft delete" or "Add revision history" |
| MF-3 | Approve | Block: "Add scoped capability" or "Remove admin:full dependency" |
| MF-4 | Approve | Block: "Surface error to user" or "Add failure notification" |
| MF-5 | Approve | Block: "Use status enum" or "Add transition validation" |
| MF-6 | Approve | Block: "Add audit logging" or "Attribute background job" |
| MF-7 | Approve | Block: "Add kill switch" or "Document rollback plan" |

---

## Reviewer Comments Template

Copy-paste for common issues:

### Block: Hidden Cascade

```
WA-Immunity Gate: MF-1 Violation

This operation affects entities beyond what the user explicitly targeted.
Please add:
- [ ] Preview showing all affected records
- [ ] Confirmation before execution
- [ ] Protection for financial records

See: docs/architecture/WA_FUTURE_FAILURE_IMMUNITY.md#mf-1-hidden-cascades
```

### Block: Hard Delete

```
WA-Immunity Gate: MF-2 Violation

This PR uses hard delete (DELETE FROM / prisma.delete).
ClubOS requires soft delete with recovery window.

Please change to:
- [ ] Use `deletedAt` timestamp instead of delete
- [ ] Add to trash view for recovery

See: docs/architecture/WA_FUTURE_FAILURE_IMMUNITY.md#mf-2-irreversible-actions
```

### Block: Coarse Permission

```
WA-Immunity Gate: MF-3 Violation

This feature requires admin:full or a too-broad capability.
Please:
- [ ] Add a scoped capability for this specific action
- [ ] Ensure capability can be granted per-object

See: docs/architecture/WA_FUTURE_FAILURE_IMMUNITY.md#mf-3-coarse-permissions
```

### Block: Silent Failure

```
WA-Immunity Gate: MF-4 Violation

This error is swallowed or not surfaced to the user.
Please:
- [ ] Return actionable error message to UI
- [ ] For background jobs: create admin notification on failure

See: docs/architecture/WA_FUTURE_FAILURE_IMMUNITY.md#mf-4-silent-failures
```

### Block: Boolean State Flag

```
WA-Immunity Gate: MF-5 Violation

This PR adds boolean flags (isActive, isPublished) instead of explicit state.
Please:
- [ ] Use status enum with defined values
- [ ] Add transition validation at service layer

See: docs/architecture/WA_FUTURE_FAILURE_IMMUNITY.md#mf-5-implicit-state-machines
```

### Block: Missing Audit

```
WA-Immunity Gate: MF-6 Violation

This mutation does not create an audit log entry.
Please add:
- [ ] createAuditEntry() call with actor and before/after
- [ ] For background jobs: attribute to service account

See: docs/architecture/WA_FUTURE_FAILURE_IMMUNITY.md#mf-6-unattributed-mutations
```

### Block: No Rollback Plan

```
WA-Immunity Gate: MF-7 Violation

This high-risk feature has no rollback mechanism.
Please add:
- [ ] Feature flag for instant disable
- [ ] Documented rollback procedure
- [ ] Required stages for field testing

See: docs/architecture/WA_FUTURE_FAILURE_IMMUNITY.md#mf-7-single-point-of-failure-releases
```

---

## When to Skip This Gate

This gate can be skipped for:

- Documentation-only changes
- Test-only changes
- CI/tooling changes that don't affect runtime
- Read-only features with no data mutation

Mark in PR description: `WA-Immunity Gate: N/A - [reason]`

---

## See Also

- [WA_FUTURE_FAILURE_IMMUNITY.md](../architecture/WA_FUTURE_FAILURE_IMMUNITY.md) - Full pattern definitions
- [DATA_INVARIANTS.md](./DATA_INVARIANTS.md) - Data protection rules
- [SYSTEM_GUARANTEES.md](./SYSTEM_GUARANTEES.md) - Architectural commitments
- [RELEASE_MODEL_AND_FIELD_TESTING.md](../ops/RELEASE_MODEL_AND_FIELD_TESTING.md) - Rollout process

---

*This document is normative for PR reviews.
Non-compliance blocks merge.*
