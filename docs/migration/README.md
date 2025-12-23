# ClubOS Migration System

This document defines the migration philosophy, architecture, and operational model for migrating organizations from legacy platforms (Wild Apricot, ClubExpress) to ClubOS.

---

## Core Philosophy: Wing-Walk Migration

The ClubOS migration system follows a **wing-walk** approach: we never let go of one handhold until we have a firm grip on the next. This means:

- **Parallel simulation first** - ClubOS must prove it can produce identical outcomes before taking over
- **Backend-first validation** - Correctness is proven through CLI, logs, and reports, not UI
- **Reversible at every step** - Every phase supports dry run, diff, and rollback
- **Steward sign-off gates** - Human approval required before irreversible actions

This is not a one-off script. This is a **repeatable migration factory**.

---

## Migration Stages

The migration proceeds through explicit, independently-runnable stages:

### 1. Extract

Ingest source platform exports (CSV, JSON). Validate schema, headers, and referential integrity.

- Input: Raw export files from Wild Apricot or ClubExpress
- Output: Validated raw records with parse errors flagged
- Gate: All required files present, headers match expected schema

### 2. Normalize

Convert source concepts to canonical ClubOS migration models. No database writes occur here.

- Input: Parsed records from Extract stage
- Output: Canonical records (MemberImport, EventImport, RegistrationImport)
- Gate: All records pass required field validation

### 3. Simulate

Replay events against ClubOS domain logic. Compare results with source platform "ground truth."

- Input: Normalized records + ClubOS business rules
- Output: Simulated outcomes (membership states, registration counts, waitlist positions)
- Gate: Simulated outcomes match source platform exactly

### 4. Load (Sandbox)

Write records into an isolated sandbox database. Never touches production.

- Input: Verified normalized records
- Output: Records written to sandbox DB with ID mappings
- Gate: All writes succeed, referential integrity maintained

### 5. Verify

Run deterministic checks against loaded data. Produce machine-readable report.

- Input: Sandbox database state
- Output: Verification report (counts, states, invariants)
- Gate: All invariants pass, no orphaned records

### 6. Parallel Sync

Re-run deltas as source platform data changes. Idempotent operations only.

- Input: New/changed records from source platform
- Output: Incremental updates to sandbox
- Gate: Delta sync produces consistent state

### 7. Cutover Readiness

Final gate that answers: "Is it safe to turn off the source platform?"

- Input: All previous stage reports
- Output: GO / NO-GO verdict with detailed rationale
- Gate: All invariants pass, steward sign-off obtained

---

## Invariants

Migration correctness is enforced through explicit invariants. Violations halt progression.

### Data Integrity Invariants

- No orphaned registrations (every registration references valid member + event)
- No duplicate members (email uniqueness)
- No over-capacity events (registration count ≤ capacity)
- No invalid state transitions (state machines must be respected)

### Parity Invariants

- Member counts match source platform
- Event counts match source platform
- Registration counts match source platform per event
- Financial totals match within tolerance

### Temporal Invariants

- All dates are valid and in expected ranges
- Event start times precede end times
- Registration dates precede event start times (where required)

---

## Reporting

Every migration run emits both human-readable and machine-readable reports.

### Report Structure

```json
{
  "runId": "uuid",
  "orgId": "sbnc",
  "stage": "verify",
  "status": "PASS",
  "timestamp": "2025-01-15T10:30:00Z",
  "checks": {
    "memberCount": { "expected": 450, "actual": 450, "pass": true },
    "eventCount": { "expected": 120, "actual": 120, "pass": true },
    "orphanedRegistrations": { "count": 0, "pass": true }
  },
  "hash": "sha256:abc123...",
  "cutoverReady": true
}
```

### Report Requirements

- Deterministic: Same input produces identical report hash
- Self-contained: Report includes all context needed to reproduce
- Actionable: Failures include specific remediation steps

---

## Steward Model

The migration system assumes a human **System Steward** with authority to:

- Pause/resume migration at any stage
- Review reports and resolve discrepancies
- Grant explicit sign-off before cutover
- Override automation when necessary (with audit trail)

### Automation Boundaries

The system will NOT automatically:

- Write to production database
- Delete source platform data
- Send notifications to end users
- Proceed past failed invariants

---

## Source Platform Adapters

### Wild Apricot (WA)

- Primary pathway: CSV exports (members, events, registrations)
- Field mappings defined in `config/migration-config.yaml`
- Status translations handle WA membership level nomenclature
- ID reconciliation by email (members), title+time (events)

### ClubExpress (CE)

- Primary pathway: CSV exports
- Optional: Web Services API where available (never required)
- Adapter implementation: `adapters/club-express/` (planned)

---

## Directory Structure

```
scripts/migration/
├── cli.ts                    # CLI entrypoint
├── engine/
│   ├── migration-engine.ts   # Stage orchestrator
│   ├── invariants.ts         # Invariant definitions
│   └── diff.ts               # Parity comparison
├── stages/
│   ├── extract.ts
│   ├── normalize.ts
│   ├── simulate.ts
│   ├── load.ts
│   ├── verify.ts
│   └── sync.ts
├── adapters/
│   └── wild-apricot/         # WA-specific parsing/mapping
├── lib/
│   ├── types.ts              # Type definitions
│   ├── config.ts             # Config loader
│   └── csv-parser.ts         # CSV parsing utilities
├── config/
│   └── migration-config.yaml # Field mappings
├── reports/                  # Generated reports
└── sample-pack/              # Test data
```

---

## Success Criteria

The migration system is complete when:

1. Migration runs end-to-end via CLI without manual intervention
2. WA + ClubOS produce matching outcomes for all test scenarios
3. Cutover readiness is deterministic and machine-verifiable
4. Migration can be repeated for additional orgs with config-only changes
5. No heroics required to operate

---

## Related Documents

- [MIGRATION_PACKS.md](./MIGRATION_PACKS.md) - Platform-specific pack definitions
- [OPERATOR_GUIDE.md](./OPERATOR_GUIDE.md) - Step-by-step operational procedures (planned)
- [FAILURE_MODES.md](./FAILURE_MODES.md) - Common failures and remediation (planned)
