# Trust Invariants

**Status**: Canonical
**Last Updated**: 2025-12-25
**Related Documents**:
- [Intent Manifest Schema](./INTENT_MANIFEST_SCHEMA.md)
- [Intent to Rendering Contract](./INTENT_TO_RENDERING_CONTRACT.md)
- [Preview Surface Contract](./PREVIEW_SURFACE_CONTRACT.md)
- [Suggestion Review Workflow](./SUGGESTION_REVIEW_WORKFLOW.md)

---

## Purpose

This document enumerates invariants that must remain true in any implementation of the intent-to-rendering pipeline. These are not guidelines or recommendations. They are non-negotiable constraints.

Implementations may vary in language, architecture, or storage mechanism. These invariants must hold regardless.

Each invariant is phrased testably. If an invariant cannot be verified, the implementation is incomplete.

---

## 1. Invariants Before Preview

These invariants must hold before any preview is rendered.

| ID | Invariant | Verification |
|----|-----------|--------------|
| **BP-1** | No preview may render without an approved manifest version ID. | Query: every preview record references a manifest ID with `status = approved`. |
| **BP-2** | The manifest referenced by preview must be immutable. | Attempt to modify an approved manifest returns error or creates new version. |
| **BP-3** | Every manifest must have a recorded creator identity. | Query: `createdBy` field is non-null for all manifests. |
| **BP-4** | Every manifest must have a recorded creation timestamp. | Query: `createdAt` field is non-null for all manifests. |
| **BP-5** | No manifest may be approved without human action. | Audit log contains an explicit approval event with actor identity for every approved manifest. |
| **BP-6** | Source system reference must be recorded at manifest creation. | Query: `sourceSystem` field is non-null for all manifests. |

---

## 2. Invariants During Preview

These invariants must hold while a preview is active.

| ID | Invariant | Verification |
|----|-----------|--------------|
| **DP-1** | Preview must not mutate any persistent state. | Before/after comparison: no database writes, no file changes, no external calls with side effects. |
| **DP-2** | Preview must use the same render path as production. | Code inspection: preview and production share rendering logic; no preview-only code paths. |
| **DP-3** | Preview must be deterministic given the same manifest version. | Render same manifest twice; output must be byte-identical (excluding timestamps in metadata). |
| **DP-4** | Unknowns must be surfaced, not hidden. | Query: manifest with `unknowns[].required = true` cannot proceed to commit. |
| **DP-5** | Preview must be attributable to an operator. | Audit log contains preview event with actor identity and manifest version. |
| **DP-6** | Preview session must have bounded lifetime. | Preview expires or requires re-generation after configurable duration. |

---

## 3. Invariants Before Commit

These invariants must hold before any commit to production.

| ID | Invariant | Verification |
|----|-----------|--------------|
| **BC-1** | No commit may occur without explicit human authorization. | Audit log contains commit authorization event with actor identity. |
| **BC-2** | Commit must reference the exact manifest version that was previewed. | Commit record includes `manifestId` and `manifestVersion`; these match the previewed version. |
| **BC-3** | All required unknowns must be resolved before commit. | Query: no `unknowns[].required = true` entries remain unresolved. |
| **BC-4** | Commit authorization must occur after preview, not before. | Timestamp ordering: `previewedAt < commitAuthorizedAt`. |
| **BC-5** | Committer identity must be recorded. | Commit record includes non-null `committedBy` field. |
| **BC-6** | Commit must be idempotent for the same manifest version. | Attempting to commit an already-committed manifest version returns success without side effects. |
| **BC-7** | No commit may proceed if source data changed since preview. | System validates preconditions; if violated, commit fails with explicit error. |

---

## 4. Invariants After Commit

These invariants must hold after a commit is executed.

| ID | Invariant | Verification |
|----|-----------|--------------|
| **AC-1** | Committed manifest version must be marked as committed. | Query: manifest has `status = committed` and `committedAt` timestamp. |
| **AC-2** | Committed manifest version cannot be re-committed. | Attempt to commit same version again returns error or no-op. |
| **AC-3** | Committed manifest version cannot be modified. | Attempt to modify returns error; changes require new version. |
| **AC-4** | Audit log must record commit completion. | Audit log contains commit-completed event with manifest version and timestamp. |
| **AC-5** | Rendered output must be traceable to manifest version. | Production pages reference or can be queried by `manifestId` and `manifestVersion`. |
| **AC-6** | Commit must be atomic. | Either all changes apply or none apply; no partial state. |

---

## 5. Invariants for Abort, Rollback, and Recovery

These invariants govern non-happy-path scenarios.

### Abort (Before Commit)

| ID | Invariant | Verification |
|----|-----------|--------------|
| **AB-1** | Abort must leave source system unchanged. | Before/after comparison: source system state identical. |
| **AB-2** | Abort must leave target system unchanged. | Before/after comparison: target system state identical. |
| **AB-3** | Abort must be recorded in audit log. | Audit log contains abort event with actor, reason, and timestamp. |
| **AB-4** | Aborted manifest may be discarded or retained for audit. | System policy determines retention; either is valid if documented. |
| **AB-5** | Abort must always succeed. | Abort operation cannot fail; system must never be stuck. |

### Rollback (After Commit)

| ID | Invariant | Verification |
|----|-----------|--------------|
| **RB-1** | Rollback is not guaranteed. | Documentation explicitly states rollback may not be available. |
| **RB-2** | If rollback is supported, it must create a new manifest version. | Rollback does not modify history; it appends a reverting manifest. |
| **RB-3** | Rollback must require explicit human authorization. | Audit log contains rollback authorization with actor identity. |
| **RB-4** | Rollback must be auditable. | Audit log records rollback event, source version, and target version. |

### Recovery (System Failure)

| ID | Invariant | Verification |
|----|-----------|--------------|
| **RC-1** | System failure must not leave partial commits. | After recovery, either commit completed or system is in pre-commit state. |
| **RC-2** | System failure must not corrupt audit logs. | Audit logs use append-only storage; recovery does not lose entries. |
| **RC-3** | System failure must not auto-resume commits. | After recovery, human must re-authorize any pending commit. |

---

## 6. Forbidden Patterns

These patterns are explicitly prohibited. Implementations exhibiting these patterns fail trust requirements.

### F-1: Silent Mutation

**Forbidden**: Any operation that modifies persistent state without appearing in the audit log.

```
BAD:  updateContent(pageId, newContent)  // No audit entry
GOOD: updateContent(pageId, newContent, { actor, reason })  // Audit entry created
```

### F-2: Preview with Side Effects

**Forbidden**: Preview operations that modify state, send notifications, or trigger external actions.

```
BAD:  preview() { render(); sendAnalyticsEvent(); }
GOOD: preview() { render(); }  // Analytics deferred to commit
```

### F-3: Auto-Commit

**Forbidden**: Commit that proceeds without explicit human authorization.

```
BAD:  if (previewApproved && noErrors) { commit(); }
GOOD: if (previewApproved && noErrors && humanAuthorized) { commit(); }
```

### F-4: Mutable Approved Manifests

**Forbidden**: Modifying an approved manifest in place rather than creating a new version.

```
BAD:  manifest.navigation.push(newItem); manifest.save();
GOOD: newManifest = manifest.clone(); newManifest.navigation.push(newItem); newManifest.save();
```

### F-5: Untraceable Commits

**Forbidden**: Production state that cannot be traced to a specific manifest version.

```
BAD:  page.content = newContent;  // No manifest reference
GOOD: page.content = newContent; page.sourceManifestVersion = manifestVersion;
```

### F-6: Swallowed Unknowns

**Forbidden**: Proceeding when required unknowns exist without surfacing them.

```
BAD:  if (unknowns.length > 0) { log.warn("unknowns exist"); proceed(); }
GOOD: if (unknowns.some(u => u.required)) { throw new RequiredUnknownsError(unknowns); }
```

### F-7: Preview-Production Divergence

**Forbidden**: Using different rendering logic for preview vs. production.

```
BAD:  if (isPreview) { renderSimplified(); } else { renderFull(); }
GOOD: render();  // Same path for both
```

### F-8: Commit Without Preview

**Forbidden**: Allowing commit for a manifest version that was never previewed.

```
BAD:  if (manifest.approved) { allowCommit(); }
GOOD: if (manifest.approved && manifest.previewed) { allowCommit(); }
```

---

## Verification Approach

Implementations must demonstrate compliance through:

1. **Automated tests**: Each invariant has corresponding test coverage
2. **Audit log inspection**: Manual or automated review of audit trails
3. **Code review**: Verification that forbidden patterns are absent
4. **Recovery testing**: Simulated failures confirm recovery invariants

An implementation that cannot demonstrate verification for any invariant is incomplete.

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2025-12-25 | System | Initial specification |
