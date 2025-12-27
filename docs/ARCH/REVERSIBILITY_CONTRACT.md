# Reversibility Contract

**Status**: Canonical
**Version**: 1.0
**Last Updated**: 2024-12-24
**Related Issues**: #202 (WA Migration), #277 (Cutover Rehearsal), #301 (Rehearsal Mode)

---

## 1. Purpose

This document formalizes ClubOS's promise to customers during migration:

> **The customer can return to Wild Apricot without data loss or identity erasure at any point before final commit.**

This is not a feature. It is a trust contract. Migration is consequential. Customers must be able to change their mind without penalty.

---

## 2. Definitions

### 2.1 Authoritative System

The **authoritative system** is the single system of record for an organization's data at any given moment. There is exactly one authoritative system.

| Phase | Authoritative System | Consequence |
|-------|---------------------|-------------|
| Pre-migration | Wild Apricot | All member actions occur in WA |
| Cutover rehearsal | Wild Apricot | ClubOS records intentions; WA remains source of truth |
| Post-commit | ClubOS | WA should be archived or decommissioned |

**There is never a period where both systems are authoritative.**

### 2.2 Cutover Rehearsal vs Commit

**Cutover Rehearsal**: A time-bounded period during which:

- Wild Apricot remains authoritative
- ClubOS receives mirrored data and records new actions as intentions
- The customer validates ClubOS behavior
- No permanent changes occur in ClubOS

**Commit**: The irrevocable transition point where:

- ClubOS becomes authoritative
- The intent journal is applied to ClubOS permanently
- Wild Apricot ceases to be the source of truth
- Reversibility guarantees no longer apply

### 2.3 Abort vs Rollback vs Recovery

| Term | When It Applies | What Happens | Data State |
|------|-----------------|--------------|------------|
| **Abort** | Before commit | Intent journal discarded; ClubOS returns to pre-rehearsal state | No data loss; WA unchanged |
| **Rollback** | After commit | Restore from backup or re-import from preserved WA snapshot | Requires preserved artifacts |
| **Recovery** | After system failure | Restore from backup; may involve data loss depending on backup currency | Depends on backup strategy |

**Abort is always safe. Rollback requires preparation. Recovery is a contingency.**

### 2.4 Identity Preservation (Presentation Intent)

**Identity preservation** means the customer's organizational presentation survives migration:

- Navigation structure
- Content organization
- Visual hierarchy and emphasis
- Audience visibility rules

Identity is captured in the **Intent Manifest**. The manifest is:

- Human-reviewable before commit
- Versioned and immutable per version
- Discardable without side effects (on abort)

If the customer cannot recognize their organization in ClubOS, the migration is incomplete.

---

## 3. Guarantees

ClubOS makes the following explicit guarantees during cutover rehearsal and wing-walking:

### G1: Wild Apricot Remains Unchanged Until Commit

No ClubOS action modifies Wild Apricot data. WA is read-only from ClubOS's perspective.

**Verification**: WA data hash before and after rehearsal must match.

### G2: Abort Discards All ClubOS Intentions

If the customer aborts before commit:

- All intent journal entries are discarded
- No member, event, or content records persist from rehearsal
- ClubOS returns to pre-rehearsal state
- The customer may start a new rehearsal

**Verification**: ClubOS entity counts match pre-rehearsal baseline.

### G3: Intent Manifest Is Reviewable Before Any Commit

The customer can:

- View the complete intent manifest before commit
- Compare manifest to source (WA) data
- Request clarification on any entry
- Reject and regenerate if unsatisfied

**Verification**: Commit requires explicit operator sign-off with manifest version binding.

### G4: Commit Is Explicit and Logged

Commit requires:

- Operator with `migration:commit` permission
- Explicit confirmation action (not passive timeout)
- Audit log entry with operator identity, timestamp, and manifest version

**Verification**: Commit audit entry must exist; implicit commits are forbidden.

### G5: Preserved Artifacts Enable Rollback

Before commit, the following artifacts must exist:

- WA data snapshot (as of rehearsal start)
- Intent manifest (versioned, signed)
- Mapping tables (WA ID to ClubOS ID)
- Verification report (pre-commit)

These artifacts enable rollback if required after commit.

**Verification**: Artifact checklist must be complete before commit is enabled.

---

## 4. Non-Guarantees

ClubOS explicitly does not guarantee:

### NG1: Rollback After Commit

Once committed, reverting to WA is a manual process. ClubOS does not automate rollback. The customer must:

- Retain WA access and data
- Use preserved artifacts to restore WA if needed
- Accept that post-commit ClubOS changes are not automatically reversible

**Why**: Bidirectional sync is complex, error-prone, and creates split-brain risk. One-way migration with preserved artifacts is safer.

### NG2: Continuous Sync

ClubOS does not maintain live sync with WA. During rehearsal:

- WA data at rehearsal start is the baseline
- WA changes during rehearsal may be synced incrementally (optional)
- Post-commit, WA is no longer synced

**Why**: Continuous sync creates ambiguity about which system is authoritative.

### NG3: Automatic Recovery from WA Downtime

If WA is unavailable during rehearsal, ClubOS cannot fetch updated data. Rehearsal may need to restart when WA is available.

**Why**: ClubOS depends on WA for source data; there is no data reconstruction capability.

### NG4: Preservation of WA-Specific Features

ClubOS is not a WA clone. WA features without ClubOS equivalents are not preserved:

- WA-specific field types
- WA theme customizations
- WA third-party integrations

**Why**: Fidelity of intent, not fidelity of implementation.

---

## 5. Preconditions for Guarantee

The reversibility guarantee requires the following preconditions:

### 5.1 Verification Gates

Before commit is enabled, automated verification must confirm:

| Gate | Check | Blocking? |
|------|-------|-----------|
| **Entity count match** | Source and target counts reconcile | Yes |
| **ID mapping complete** | Every WA ID has a ClubOS ID or explicit skip reason | Yes |
| **Policy validation** | Membership tiers, schedules, and rules are valid | Yes |
| **Intent manifest signed** | Manifest version is locked and hashed | Yes |
| **Artifact preservation** | Required artifacts exist and are accessible | Yes |

Commit is disabled until all blocking gates pass.

### 5.2 Manifest Hash/Version Binding

The commit action is bound to a specific manifest version:

- Manifest version is included in commit request
- System verifies manifest has not changed since operator review
- If manifest changed, commit is rejected; operator must re-review

This prevents "what you see is not what you get" scenarios.

### 5.3 Operator Sign-Off Requirements

Commit requires:

- Operator with `migration:commit` capability
- Explicit confirmation (button click, CLI command, or API call with confirmation token)
- Acknowledgment of manifest version being committed
- Optional: Secondary approval for high-stakes migrations

---

## 6. Required Artifacts for Reversibility

The following artifacts must exist before commit is enabled:

### 6.1 Data Artifacts

| Artifact | Contents | Storage |
|----------|----------|---------|
| **WA Snapshot** | Complete WA data as of rehearsal start | Immutable blob storage |
| **Intent Manifest** | Versioned, signed manifest | Migration bundle |
| **ID Mapping Table** | WA ID -> ClubOS ID mappings | Migration bundle |
| **Policy Bundle** | Captured organizational policies | Migration bundle |

### 6.2 Verification Artifacts

| Artifact | Contents | Storage |
|----------|----------|---------|
| **Pre-Commit Verification Report** | Entity counts, validation results, gate status | Migration bundle |
| **Manifest Diff** | Changes from previous manifest version (if any) | Migration bundle |
| **Operator Approval Record** | Who approved, when, which manifest version | Audit log |

### 6.3 Audit Artifacts

| Artifact | Contents | Storage |
|----------|----------|---------|
| **Intent Journal** | All intentions recorded during rehearsal | Append-only log |
| **Commit Audit Entry** | Commit action with operator, timestamp, manifest version | Audit log |
| **Abort Audit Entry** | Abort action if applicable | Audit log |

---

## 7. Failure Modes and Required Operator Actions

### 7.1 Verification Gate Failure

**Symptom**: One or more verification gates show red.

**Operator Action**:

1. Review failing gate details
2. Determine root cause (data issue, policy misconfiguration, system error)
3. Correct issue and re-run verification
4. Do not proceed until all gates pass
5. If issue cannot be resolved, abort and investigate

**Evidence**: Verification report with failure details.

### 7.2 Late Abort (During Rehearsal)

**Symptom**: Customer decides to abort after significant rehearsal activity.

**Operator Action**:

1. Confirm abort is the desired action (explicit confirmation)
2. Execute abort command
3. Verify ClubOS returns to pre-rehearsal state
4. Verify WA data unchanged
5. Archive intent journal for audit purposes
6. Document reason for abort

**Evidence**: Abort audit entry; post-abort state verification.

### 7.3 Rollback After Commit

**Symptom**: Customer wants to return to WA after commit.

**Operator Action**:

1. Acknowledge this is a manual process, not automated
2. Retrieve preserved WA snapshot
3. Restore WA from snapshot (requires WA admin access)
4. Disable ClubOS for this organization
5. Communicate to members that WA is restored
6. Document reason for rollback

**Evidence**: WA snapshot retrieval; ClubOS deactivation record.

### 7.4 Proving "No Loss"

When customer requests assurance that no data was lost:

**Evidence Checklist**:

- [ ] WA snapshot hash matches pre-rehearsal hash
- [ ] Entity count reconciliation report shows zero discrepancy
- [ ] ID mapping table is complete (no orphaned records)
- [ ] Intent journal replay would produce identical ClubOS state
- [ ] Verification report shows all gates passed

If any item fails, investigate before providing assurance.

---

## 8. Future Mechanisms Required

The following mechanisms are **required for full guarantee** but may not be present today:

### 8.1 Required for Full Guarantee

| Mechanism | Purpose | Status |
|-----------|---------|--------|
| **WA Snapshot Service** | Capture and store immutable WA data snapshots | Required |
| **Manifest Signing** | Cryptographically sign manifest versions | Required |
| **Verification Gate Runner** | Automated pre-commit verification | Required |
| **Artifact Preservation Service** | Store and retrieve migration artifacts | Required |
| **Abort Command** | Cleanly discard intent journal and restore state | Required |

### 8.2 Present Today

| Mechanism | Purpose | Status |
|-----------|---------|--------|
| **Intent Journal** | Record intentions during rehearsal | Specified |
| **Intent Manifest Schema** | Structure for capturing presentation intent | Specified |
| **Preview Surface** | Render manifest for human review | Specified |
| **Audit Logging** | Record operator actions | Implemented |

### 8.3 Not Required (Design Choices)

| Mechanism | Why Not Required |
|-----------|-----------------|
| Bidirectional sync | Creates split-brain risk; one-way is safer |
| Automatic rollback | Too risky without human judgment |
| Live WA mirroring | Blurs authority boundary |

---

## 9. Brand Alignment

This contract adheres to ClubOS brand principles:

### 9.1 Plainspoken, No Hype

- This document describes what the system does and does not do
- There are no claims of "seamless" or hidden capabilities <!-- docs-trust-allow: magic -->
- Limitations are stated explicitly

### 9.2 Explicit Risks

- Non-guarantees are clearly listed
- Failure modes are documented with required actions
- The customer is not shielded from complexity

### 9.3 Customer Control

- Abort is always available before commit
- Commit requires explicit operator action
- The customer is the authority on whether to proceed

### 9.4 No Hidden Sync Claims

- ClubOS does not claim to keep WA and ClubOS in perfect sync
- Drift during rehearsal is acknowledged as a known limitation
- The customer must decide when to commit based on current state

---

## 10. Revision History

| Date | Version | Author | Change |
|------|---------|--------|--------|
| 2024-12-24 | 1.0 | System | Initial contract |

---

## 11. Cross-References

- [Intent Manifest Schema](./INTENT_MANIFEST_SCHEMA.md) - Manifest structure and guarantees
- [Preview Surface Contract](./PREVIEW_SURFACE_CONTRACT.md) - Preview guarantees and abort rights
- [Customer Cutover Rehearsal Guide](../IMPORTING/CUSTOMER_MIGRATION_CUTOVER_REHEARSAL.md) - Customer-facing rehearsal documentation
- [Migration Invariants](./MIGRATION_INVARIANTS.md) - Technical invariants for migration

---

*This contract defines what customers can rely on during migration. It is not aspirational. Implementations that claim to support wing-walking migration must satisfy this contract.*
