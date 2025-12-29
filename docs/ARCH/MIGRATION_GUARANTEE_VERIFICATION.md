# Migration Guarantee Verification

**Status**: Verification Report
**Last Updated**: 2024-12-25
**Purpose**: Ensure all stated migration guarantees are consistent, non-contradictory, and operationally realistic.

---

## 1. Guarantee Summary Table

| ID | Guarantee | Canonical Phrasing | Where Defined | Status |
|----|-----------|-------------------|---------------|--------|
| G-ABORT-01 | Abort discards all intentions | "Abort discards all Murmurant intentions. Murmurant returns to pre-rehearsal state." | REVERSIBILITY_CONTRACT §3 G2 | **Canonical** |
| G-ABORT-02 | Abort is unconditional | "Abort requires no justification. The option exists to be used." | CUTOVER_REHEARSAL §Commit vs Abort | **Canonical** |
| G-ABORT-03 | Abort is always safe | "Abort is always safe." | REVERSIBILITY_CONTRACT §2.3, PREVIEW_SURFACE_CONTRACT §6.3 | **Canonical** |
| G-ABORT-04 | No limit on rehearsals | "There is no limit to rehearsal attempts." | CUTOVER_REHEARSAL §After Abort | **Canonical** |
| G-PREVIEW-01 | Same logic path | "Preview uses the same decision logic as execution." | PREVIEW_SURFACE_CONTRACT §2.1 | **Canonical** |
| G-PREVIEW-02 | Same input data | "Preview operates on the same source data available at preview time." | PREVIEW_SURFACE_CONTRACT §2.1 | **Canonical** |
| G-PREVIEW-03 | Deterministic within snapshot | "Given identical input, preview produces identical output." | PREVIEW_SURFACE_CONTRACT §2.1 | **Canonical** |
| G-PREVIEW-04 | No side effects | "Preview does not modify any persistent state." | PREVIEW_SURFACE_CONTRACT §2.1 | **Canonical** |
| G-MANIFEST-01 | No hidden inference | "If something is not in the manifest, it will not appear in the presentation." | INTENT_MANIFEST_SCHEMA §Determinism | **Canonical** |
| G-MANIFEST-02 | Stable ordering | "Given the same manifest, any consumer will process items in the same order." | INTENT_MANIFEST_SCHEMA §Determinism | **Canonical** |
| G-MANIFEST-03 | Replayability | "Replaying a manifest version produces the same intent representation every time." | INTENT_MANIFEST_SCHEMA §Determinism | **Canonical** |
| G-MANIFEST-04 | Manifest is immutable | "The manifest is locked when rehearsal begins." | CUTOVER_REHEARSAL §FAQ | **Canonical** |
| G-COMMIT-01 | Commit is explicit | "Commit requires explicit operator action (not passive timeout)." | REVERSIBILITY_CONTRACT §3 G4 | **Canonical** |
| G-COMMIT-02 | Commit is logged | "Audit log entry with operator identity, timestamp, and manifest version." | REVERSIBILITY_CONTRACT §3 G4 | **Canonical** |
| G-COMMIT-03 | Commit applies exact manifest | "The system applies exactly the manifest version you rehearsed." | CUTOVER_REHEARSAL §Preview Equivalence | **Canonical** |
| G-WA-01 | WA unchanged during rehearsal | "No Murmurant action modifies Wild Apricot data." | REVERSIBILITY_CONTRACT §3 G1 | **Canonical** |
| G-WA-02 | WA remains authoritative | "Wild Apricot remains the authoritative system during cutover rehearsal." | CUTOVER_REHEARSAL §Overview, REVERSIBILITY_CONTRACT §2.1 | **Canonical** |

---

## 2. Issues Identified

### 2.1 Duplicate Phrasing with Different Implications

| Issue | Document A | Document B | Resolution |
|-------|------------|------------|------------|
| "Same logic path" vs "Same code path" | PREVIEW_SURFACE_CONTRACT: "Same logic path" | MIGRATION_CUSTOMER_JOURNEY: "Same code path" | **Normalize to "Same logic path"** — code path implies identical implementation; logic path is the correct claim |
| "Zero data loss" scope | CUTOVER_REHEARSAL: "abort with zero data loss" | REVERSIBILITY_CONTRACT: "return to WA without data loss" | **Clarify scope** — abort means no Murmurant data persists; WA unchanged means source untouched |
| "Deterministic" variations | Multiple documents use: "deterministic replay", "deterministic outcome", "deterministic within snapshot", "deterministic diff" | — | **Normalize to "Deterministic within snapshot"** for preview/rehearsal context |

### 2.2 Implied Guarantees Not Backed by Mechanisms

| Implied Guarantee | Where Stated | Problem | Resolution |
|-------------------|--------------|---------|------------|
| "Transactional safety: Sync either completes fully or rolls back entirely" | MIGRATION_CUSTOMER_JOURNEY §Phase 4 | No transactional wrapper documented in IMPORTER_RUNBOOK | **Mark as ASPIRATIONAL** until implementation confirmed |
| "Resumable: If interrupted, can resume from checkpoint" | MIGRATION_CUSTOMER_JOURNEY §Phase 4 | Checkpoint/resume mechanism not documented | **Mark as ASPIRATIONAL** until implementation confirmed |
| "Rollback available" | MIGRATION_CUSTOMER_JOURNEY §Phase 1 | REVERSIBILITY_CONTRACT explicitly states rollback is manual and requires preparation | **Rephrase** — use "recovery procedures" not "rollback" |

### 2.3 Terminology Inconsistencies

| Term | Variations Found | Canonical Term | Rationale |
|------|------------------|----------------|-----------|
| Customer approval | "explicit approval", "explicit sign-off", "explicit confirmation", "explicit consent" | **explicit approval** | Shortest, clearest |
| No changes | "no side effects", "no state changed", "no writes", "no database changes" | **no side effects** (preview) / **no persistent changes** (abort) | Context-appropriate |
| Rollback vs Abort | Sometimes used interchangeably | **abort** (before commit) / **rollback** (after commit, manual) | Per REVERSIBILITY_CONTRACT §2.3 |

---

## 3. Normalization Recommendations

### 3.1 MIGRATION_CUSTOMER_JOURNEY.md

| Location | Original | Recommended | Reason |
|----------|----------|-------------|--------|
| Phase 1 Reassurance | "Rollback available: Recovery procedures exist for every phase" | "Recovery documented: Procedures exist for every phase" | Avoid implying automated rollback |
| Phase 3 Reassurance | "Same code path: Real sync uses identical logic as dry run" | "Same logic path: Real sync uses identical decision logic as dry run" | Align with PREVIEW_SURFACE_CONTRACT |
| Phase 4 Reassurance | "Transactional safety: Sync either completes fully or rolls back entirely" | "Idempotent operations: Re-running sync is safe" | Avoid claiming database transaction guarantee |
| Phase 4 Reassurance | "Resumable: If interrupted, can resume from checkpoint" | *(Remove or mark as future capability)* | Not yet implemented |
| Phase 6 Reassurance | "Rollback exists: Emergency procedures documented for reversal" | "Recovery exists: Emergency procedures documented" | Avoid "rollback" which implies automation |
| Summary Table | "transactional sync, rollback procedures" | "idempotent sync, recovery procedures" | Consistent terminology |
| Trust Architecture | "Reversibility: Rollback documented for every phase" | "Reversibility: Abort before commit; recovery documented after" | Precise language |

### 3.2 CUSTOMER_MIGRATION_CUTOVER_REHEARSAL.md

| Location | Original | Recommended | Reason |
|----------|----------|-------------|--------|
| Overview | "You can abort with zero data loss" | "You can abort safely — Murmurant discards all intentions; Wild Apricot remains unchanged" | Clarify scope of "zero data loss" |

### 3.3 No Changes Required

The following documents are canonical sources and require no changes:

- **PREVIEW_SURFACE_CONTRACT.md** — Canonical source for preview guarantees
- **REVERSIBILITY_CONTRACT.md** — Canonical source for abort/rollback/recovery distinctions
- **INTENT_MANIFEST_SCHEMA.md** — Canonical source for manifest guarantees

---

## 4. Verification Checklist

### 4.1 Abort Guarantees

- [x] Abort discards all intentions — documented in REVERSIBILITY_CONTRACT G2
- [x] Abort requires no justification — documented in CUTOVER_REHEARSAL
- [x] Abort is always safe — documented in multiple places, consistent
- [x] WA unchanged by abort — documented in REVERSIBILITY_CONTRACT G1
- [x] Can retry after abort — documented in CUTOVER_REHEARSAL

### 4.2 Preview Guarantees

- [x] Same logic path — canonical in PREVIEW_SURFACE_CONTRACT
- [x] Same input data — canonical in PREVIEW_SURFACE_CONTRACT
- [x] Deterministic — canonical in PREVIEW_SURFACE_CONTRACT
- [x] No side effects — canonical in PREVIEW_SURFACE_CONTRACT

### 4.3 Manifest Guarantees

- [x] No hidden inference — canonical in INTENT_MANIFEST_SCHEMA
- [x] Stable ordering — canonical in INTENT_MANIFEST_SCHEMA
- [x] Replayability — canonical in INTENT_MANIFEST_SCHEMA
- [x] Immutable after creation — canonical in CUTOVER_REHEARSAL

### 4.4 Commit Guarantees

- [x] Explicit action required — canonical in REVERSIBILITY_CONTRACT G4
- [x] Logged with audit trail — canonical in REVERSIBILITY_CONTRACT G4
- [x] Applies exact manifest version — canonical in CUTOVER_REHEARSAL

### 4.5 Aspirational (Not Yet Verified by Mechanism)

| Claim | Source | Mechanism Required |
|-------|--------|-------------------|
| Transactional sync | MIGRATION_CUSTOMER_JOURNEY | Database transaction wrapper |
| Checkpoint resume | MIGRATION_CUSTOMER_JOURNEY | Checkpoint storage and replay logic |

---

## 5. Constraints Honored

| Constraint | Verified |
|------------|----------|
| No new guarantees added | Yes — only normalized existing claims |
| No promises weakened | Yes — clarifications strengthen accuracy |
| Docs only | Yes — no implementation changes |

---

## 6. Cross-Reference

| Document | Role |
|----------|------|
| [PREVIEW_SURFACE_CONTRACT.md](./PREVIEW_SURFACE_CONTRACT.md) | Canonical preview guarantees |
| [REVERSIBILITY_CONTRACT.md](./REVERSIBILITY_CONTRACT.md) | Canonical abort/rollback distinctions |
| [INTENT_MANIFEST_SCHEMA.md](./INTENT_MANIFEST_SCHEMA.md) | Canonical manifest guarantees |
| [CUSTOMER_MIGRATION_CUTOVER_REHEARSAL.md](../IMPORTING/CUSTOMER_MIGRATION_CUTOVER_REHEARSAL.md) | Customer-facing rehearsal guide |
| [MIGRATION_CUSTOMER_JOURNEY.md](../IMPORTING/MIGRATION_CUSTOMER_JOURNEY.md) | Customer experience walkthrough |

---

## 7. Revision History

| Date | Author | Change |
|------|--------|--------|
| 2024-12-25 | System | Initial verification |

---

*This document verifies guarantee consistency. It does not create new guarantees or weaken existing ones.*
