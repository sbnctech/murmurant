# Migration Philosophy: Wing-Walking Approach

This document describes the staged migration strategy for moving organizations
from Wild Apricot to Murmurant safely.

---

## The Wing-Walking Principle

> "Never let go of one handhold until you have a firm grip on the next."

Migration is not a cliff jump. It is a deliberate, staged transfer of trust
where the organization maintains control and reversibility at every step.

---

## Migration Stages

### Stage 1: Observe/Export

**What happens**: Extract member, event, and registration data from Wild Apricot
using CSV exports.

**Entry criteria**:
- Organization has admin access to Wild Apricot
- Data export formats are understood

**Exit criteria**:
- CSV files successfully exported
- Data completeness verified (row counts, key fields present)

### Stage 2: Import

**What happens**: Load exported data into Murmurant using migration tooling.
First as DRY RUN (no database writes), then as LIVE RUN.

**Entry criteria**:
- Policy bundle validated (organization policies configured)
- Tier mappings confirmed (if using membership tiers)
- DRY RUN completed with zero errors

**Exit criteria**:
- LIVE RUN completed with zero errors
- ID mappings generated and archived
- Run ID captured for potential rollback

### Stage 3: Verify

**What happens**: Run verification scripts and operator spot-checks to
confirm data integrity.

**Entry criteria**:
- LIVE RUN completed successfully
- Migration reports available

**Exit criteria**:
- Count verification passed (source vs destination)
- Spot-checks passed (5-10 random records verified)
- Referential integrity confirmed (no orphaned records)
- Application smoke test passed

### Stage 4: Shadow

**What happens**: Run Murmurant in parallel with Wild Apricot. Compare behavior
for key workflows. Organization continues using WA as primary.

**Entry criteria**:
- Verification complete
- Murmurant accessible to test users

**Exit criteria**:
- Key workflows exercised in Murmurant
- No blocking issues discovered
- Organization comfortable with Murmurant behavior

### Stage 5: Decide

**What happens**: Organization makes go/no-go decision on cutover.
This is a business decision, not a technical one.

**Entry criteria**:
- Shadow period complete
- Stakeholder feedback collected

**Exit criteria**:
- Explicit go/no-go decision recorded
- If go: cutover plan approved
- If no-go: issues documented for remediation

### Stage 6: Cutover

**What happens**: Switch production traffic to Murmurant. Decommission Wild Apricot
after a safety period.

**Entry criteria**:
- Go decision confirmed
- Cutover plan approved
- Rollback plan documented (just in case)

**Exit criteria**:
- Murmurant is primary system
- WA decommissioned (after safety hold period)
- Migration project closed

---

## Operator Trust Model

Operators must trust the migration tooling. We earn that trust through:

### Runbooks

Step-by-step guides for every phase. No guesswork required.
See: docs/IMPORTING/PRODUCTION_MIGRATION_RUNBOOK.md

### Deterministic Bundles

Same input produces same output. Policy bundles are reproducible.
No hidden state or non-deterministic behavior.

### Verification Scripts

Automated checks for count matching, referential integrity, and data quality.
Operators run these scripts; they do not just trust the importer.

### Rollback Plan

Until cutover, Wild Apricot remains the source of truth.
Even after import, rollback is possible via database restore.
Operators always have an exit path.

---

## Explicit Exclusion: Presentation Layer

Content migration (HTML pages, custom CSS, embedded media) is **excluded**
from the v1 migration scope. This is a deliberate scope boundary.

Rationale:
- HTML scraping is fragile and error-prone
- Content structure varies widely between organizations
- Risk of broken layouts and missing assets is high
- Better to handle as a separate, deferred effort

This is tracked separately. See [NON_GOALS_AND_EXCLUSIONS.md](./NON_GOALS_AND_EXCLUSIONS.md).

---

## References

- Epic #202 - WA Migration
- docs/IMPORTING/PRODUCTION_MIGRATION_RUNBOOK.md
- docs/IMPORTING/WA_POLICY_CAPTURE.md

---

Last updated: 2025-12-24
