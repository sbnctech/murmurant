# Implementation Guardrails

**Status**: Canonical
**Version**: 1.0
**Last Updated**: 2025-12-25
**Audience**: Engineers implementing migration, preview, and suggestion workflows

---

## Purpose

This document defines **constraints that future code MUST respect**. It does not design the implementation—it establishes the rules of the road.

These guardrails derive from the Intent Manifest Schema, Preview Surface Contract, Suggestion Review Workflow, and Architectural Charter. Any implementation that claims to implement these features must satisfy these constraints.

**This document is prescriptive, not descriptive.** It defines what the system MUST do and MUST NOT do, regardless of how it is built.

---

## 1. What Must NEVER Be Bypassed

These constraints are absolute. There are no exceptions, no escape hatches, no "just this once."

### 1.1 Authorization Checks

| Rule | Rationale |
|------|-----------|
| Every privileged action MUST pass through the canonical authorization module | Prevents scattered, inconsistent permission checks |
| Authorization MUST be evaluated server-side | Client-side checks are insufficient; hiding UI elements is not security |
| Authorization MUST be object-scoped, not page-scoped | "Can edit events" is insufficient; "can edit THIS event" is required |
| Authorization failures MUST be logged | Enables security auditing and intrusion detection |

**Never**: Bypass authorization "temporarily" during development, create shortcuts for admins, or assume UI visibility implies permission.

### 1.2 Human Approval Gates

| Rule | Rationale |
|------|-----------|
| Suggestions MUST NOT auto-apply | Human authority must approve every consequential action |
| Commit MUST require explicit operator action | No passive timeouts, no implicit transitions |
| Manifest application MUST be tied to a specific reviewed version | Prevents "what you see is not what you get" |
| Abort MUST always be available before commit | Customer control is non-negotiable |

**Never**: Create workflows where suggestions become actions without human approval, or where timeouts trigger commit.

### 1.3 Preview Fidelity

| Rule | Rationale |
|------|-----------|
| Preview MUST use the same logic path as execution | Ensures preview accurately predicts outcome |
| Preview MUST NOT modify persistent state | Preview is read-only by definition |
| Known deltas MUST be documented explicitly | Customers must know what differences to expect |
| Uncertainty MUST be surfaced, not hidden | Honest communication builds trust |

**Never**: Create preview that uses simplified logic, silently skips edge cases, or modifies data "just for preview."

### 1.4 Invariant Validation

| Rule | Rationale |
|------|-----------|
| ID mapping invariants MUST be validated before commit | Orphaned records are data loss |
| Count invariants MUST match at pipeline boundaries | Mismatches indicate corruption or logic errors |
| Determinism invariants MUST pass for rollback | Non-deterministic pipelines cannot be safely reversed |

**Never**: Skip invariant checks "because the data looks fine," suppress violations silently, or allow partial commits.

---

## 2. What Requires Human Authorization

These actions MUST NOT proceed without explicit human approval from an operator with appropriate capability.

### 2.1 Migration and Cutover

| Action | Required Capability | Authorization Evidence |
|--------|--------------------:|------------------------|
| Commit migration to production | `migration:commit` | Audit log with operator identity, timestamp, manifest version |
| Apply intent manifest | `content:edit` + domain scope | Audit log with manifest hash binding |
| Rollback after commit | `content:rollback` | Audit log with rollback artifact reference |
| Delete migration artifacts | `migration:admin` | Audit log with artifact inventory |

### 2.2 Suggestions and Content

| Action | Required Capability | Authorization Evidence |
|--------|--------------------:|------------------------|
| Accept suggestion | `suggestion:approve` | Audit log with suggestion ID and decision |
| Apply accepted suggestion | `content:edit` + domain scope | Audit log with suggestion reference |
| Reject suggestion | `suggestion:review` | Audit log with rejection reason |
| Modify suggestion | `suggestion:edit` | Audit log with diff |

### 2.3 System Configuration

| Action | Required Capability | Authorization Evidence |
|--------|--------------------:|------------------------|
| Change visibility rules | `content:edit` + domain scope | Audit log with before/after state |
| Modify audience constraints | `content:edit` + domain scope | Audit log with affected scope |
| Enable/disable rehearsal mode | `migration:admin` | Audit log with mode transition |

**Never**: Allow any of these actions to proceed via API call without corresponding audit entry, or via automated process without human trigger.

---

## 3. What Must Be Logged

Every item below MUST produce an audit log entry. Logging is not optional, not "nice to have," and not subject to performance trade-offs.

### 3.1 State Transitions

| Event | Required Log Fields |
|-------|---------------------|
| Suggestion created | `suggestionId`, `createdBy`, `timestamp`, `domain` |
| Suggestion state change | `suggestionId`, `previousState`, `newState`, `actor`, `timestamp`, `reason` (if rejected) |
| Manifest version created | `manifestId`, `manifestVersion`, `createdBy`, `timestamp` |
| Manifest committed | `manifestId`, `manifestVersion`, `committedBy`, `timestamp` |
| Manifest aborted | `manifestId`, `manifestVersion`, `abortedBy`, `timestamp`, `reason` |

### 3.2 Authorization Events

| Event | Required Log Fields |
|-------|---------------------|
| Authorization granted | `actor`, `capability`, `object`, `timestamp` |
| Authorization denied | `actor`, `attemptedCapability`, `object`, `timestamp`, `reason` |
| Capability escalation | `actor`, `fromCapabilities`, `toCapabilities`, `grantedBy`, `timestamp` |

### 3.3 Data Operations

| Event | Required Log Fields |
|-------|---------------------|
| Content modified | `contentId`, `modifiedBy`, `timestamp`, `changeType`, `affectedScope` |
| Content published | `contentId`, `publishedBy`, `timestamp`, `manifestReference` |
| Rollback executed | `rollbackId`, `executedBy`, `timestamp`, `artifactReference`, `scope` |
| Verification gate passed | `gateId`, `runId`, `timestamp`, `entityCounts` |
| Verification gate failed | `gateId`, `runId`, `timestamp`, `violations` |

### 3.4 Failures

| Event | Required Log Fields |
|-------|---------------------|
| Application failure | `operationId`, `errorCode`, `timestamp`, `context`, `suggestedResolution` |
| Invariant violation | `violationCode`, `path`, `timestamp`, `details` |
| External dependency failure | `dependencyId`, `errorCode`, `timestamp`, `retryable` |

**Never**: Swallow exceptions without logging, log to console only, or defer logging until "later."

---

## 4. What Must Be Reversible

ClubOS is built on the principle that consequential actions should be undoable. The following defines what reversibility means for each category.

### 4.1 Always Reversible (Before Commit)

| Action | Reversal Mechanism |
|--------|-------------------|
| Suggestion creation | Discard suggestion |
| Suggestion modification | Revert to previous version or discard |
| Manifest generation | Regenerate or discard |
| Preview generation | Ephemeral; no reversal needed |
| Rehearsal activity | Intent journal discarded on abort |

**Guarantee**: All activity before commit produces zero persistent changes to production data.

### 4.2 Reversible With Artifacts (After Commit)

| Action | Reversal Mechanism | Required Artifact |
|--------|-------------------|-------------------|
| Content publication | Apply previous manifest version | Preserved manifest history |
| Member data import | Restore from pre-migration snapshot | WA data snapshot |
| ID mapping | Restore mappings from bundle | Preserved mapping tables |
| Policy application | Apply previous policy bundle | Policy version history |

**Guarantee**: Rollback is possible if and only if the required artifacts exist and are intact.

### 4.3 Not Reversible (By Design)

| Action | Why Not Reversible | Mitigation |
|--------|-------------------|------------|
| Audit log entries | Audit trail must be immutable | Append-only; corrections are new entries |
| External notifications sent | Cannot unsend email | Preview and approval gates |
| Third-party API calls | External state is not controlled | Idempotency where possible; explicit warnings |
| Deletion of expired artifacts | Storage reclamation | Configurable retention; explicit warnings |

**Never**: Promise rollback for actions in this category, or design features that assume reversibility here.

---

## 5. What Is Explicitly Undefined (By Design)

The following are intentionally left unspecified. Implementations may vary, and future decisions may constrain them further.

### 5.1 Rendering and Presentation

| Undefined | Why |
|-----------|-----|
| How the manifest is rendered visually | Rendering is decoupled from intent |
| Which UI framework is used | Implementation choice |
| Theme, typography, color schemes | Organizational preference |
| Layout algorithms | May evolve with new requirements |

**Principle**: The intent manifest describes WHAT; rendering describes HOW. They are separate concerns.

### 5.2 Storage and Persistence

| Undefined | Why |
|-----------|-----|
| Database schema for manifests | May vary by deployment |
| File format for artifacts | May vary by storage backend |
| Cache strategy for previews | Performance optimization choice |
| Retention periods for artifacts | Policy decision, not architecture |

**Principle**: Contracts define behavior, not storage. Storage may be refactored without breaking contracts.

### 5.3 Performance and Scaling

| Undefined | Why |
|-----------|-----|
| Maximum manifest size | Depends on deployment resources |
| Preview generation timeout | Operational parameter |
| Batch sizes for migration | Tuning parameter |
| Concurrent preview limits | Resource allocation choice |

**Principle**: Guardrails define correctness. Performance tuning is operational, not architectural.

### 5.4 External Integrations

| Undefined | Why |
|-----------|-----|
| Specific third-party APIs | May change over time |
| Authentication providers | Deployment choice |
| Notification channels | Organizational preference |
| Export formats | Feature evolution |

**Principle**: Guardrails constrain behavior at integration boundaries. The specific integrations are pluggable.

---

## 6. Verification Checklist

Before any implementation is merged, verify:

### Authorization

- [ ] Every privileged action routes through the canonical authorization module
- [ ] Authorization is server-side, not client-only
- [ ] Authorization is object-scoped, not page-scoped
- [ ] Authorization failures are logged with structured data

### Human Approval

- [ ] No suggestion auto-applies without human approval
- [ ] No manifest commits without explicit operator action
- [ ] Abort is always available before commit
- [ ] Commit binds to a specific manifest version

### Preview Fidelity

- [ ] Preview uses the same logic path as execution
- [ ] Preview does not modify persistent state
- [ ] Known deltas are documented in output
- [ ] Uncertainty is surfaced with explicit markers

### Logging

- [ ] All state transitions are logged
- [ ] All authorization events are logged
- [ ] All failures are logged with structured error codes
- [ ] Audit log entries are immutable

### Reversibility

- [ ] Pre-commit actions are fully reversible
- [ ] Post-commit rollback requires specified artifacts
- [ ] Non-reversible actions are explicitly marked
- [ ] Rollback is tested, not assumed

---

## 7. Relationship to Other Documents

| Document | Relationship |
|----------|--------------|
| [Architectural Charter](../ARCHITECTURAL_CHARTER.md) | Source of principles P1-P10, anti-patterns N1-N8 |
| [Intent Manifest Schema](./INTENT_MANIFEST_SCHEMA.md) | Defines manifest structure; guardrails constrain its use |
| [Preview Surface Contract](./PREVIEW_SURFACE_CONTRACT.md) | Defines preview guarantees; guardrails enforce them |
| [Suggestion Review Workflow](./SUGGESTION_REVIEW_WORKFLOW.md) | Defines states and transitions; guardrails prevent bypass |
| [Migration Invariants](./MIGRATION_INVARIANTS.md) | Defines validation logic; guardrails require its application |

---

## 8. Revision History

| Date | Version | Author | Change |
|------|---------|--------|--------|
| 2025-12-25 | 1.0 | System | Initial guardrails document |

---

*This document defines what implementations MUST do and MUST NOT do. It is not a design document—it is a constraint document. Implementations that violate these guardrails are non-conformant, regardless of whether they "work."*
