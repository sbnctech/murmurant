# Migration Invariants

**Status**: Implementation Phase
**Last Updated**: 2024-12-24
**Related Issues**: #202, #277

This document describes the invariant validation layer for the Murmurant migration pipeline.

---

## What Are Invariants?

Invariants are conditions that must **always** be true at specific points in the migration pipeline. They serve as runtime sanity checks that catch data corruption, logic errors, or unexpected states before they propagate.

### Why Invariants Matter

1. **Early failure detection**: Catch problems immediately rather than after partial writes
2. **Debuggability**: Violations include structured error codes and paths for quick diagnosis
3. **Determinism**: Ensure the same input always produces the same output
4. **Rollback safety**: Validate that rollback artifacts are complete and consistent

---

## Invariant Categories

### 1. ID Mapping Invariants

These ensure the WA-to-Murmurant ID mapping is consistent and complete.

| Code | Description |
|------|-------------|
| `MISSING_WA_ID` | A mapping entry lacks a Wild Apricot ID |
| `MISSING_MURMURANT_ID` | A mapping entry lacks a Murmurant ID |
| `DUPLICATE_WA_ID` | Same WA ID appears multiple times in mappings |
| `DUPLICATE_MURMURANT_ID` | Same Murmurant ID appears multiple times in mappings |
| `ORPHANED_MAPPING` | Mapping references a record that was not processed |
| `COUNT_MISMATCH` | Mapping array length does not match count field |

### 2. Bundle Shape Invariants

These ensure the migration report structure is valid.

| Code | Description |
|------|-------------|
| `MISSING_RUN_ID` | Report lacks a unique run identifier |
| `MISSING_REQUIRED_FIELD` | A required field is null or missing |
| `INVALID_ENTITY_REPORT` | Entity report structure is malformed |
| `NEGATIVE_COUNT` | A count field has a negative value |
| `COUNT_MISMATCH` | created + updated + skipped + errors != parsed |
| `RECORDS_EXCEED_PARSED` | Records array larger than parsed count |

### 3. Determinism Invariants

These ensure migration runs are reproducible.

| Code | Description |
|------|-------------|
| `NON_DETERMINISTIC_COUNTS` | Entity counts do not sum correctly |
| `INVALID_TIMESTAMP` | Timestamp is missing or malformed |

---

## Module Location

```
scripts/migration/lib/invariants.ts
```

### Exported Functions

```typescript
// Core assertion - throws on any violation
function assertNoViolations(violations: InvariantViolation[]): void

// ID mapping validation
function validateIdMapping(report: IdMappingReport): InvariantViolation[]

// Bundle structure validation
function validateBundleShape(report: MigrationReport): InvariantViolation[]

// Determinism validation
function validateDeterminismSummary(summary: DeterminismSummary): InvariantViolation[]

// Combined validation
function validateMigrationReport(report: MigrationReport): InvariantCheckResult
```

### Violation Type

```typescript
interface InvariantViolation {
  code: string;      // e.g., "DUPLICATE_WA_ID"
  message: string;   // Human-readable description
  path?: string;     // e.g., "members.mappings[3]"
  details?: Record<string, unknown>;
}
```

---

## Usage Patterns

### Fail-Fast Assertion

Use `assertNoViolations` when invariant violations should halt execution:

```typescript
import { validateIdMapping, assertNoViolations } from "./lib/invariants";

const violations = validateIdMapping(idMappingReport);
assertNoViolations(violations); // Throws if any violations
```

### Collect and Report

Use individual validators when you want to collect all violations:

```typescript
import { validateBundleShape, validateIdMapping } from "./lib/invariants";

const allViolations = [
  ...validateBundleShape(report),
  ...validateIdMapping(idMappingReport),
];

if (allViolations.length > 0) {
  console.error("Validation failed:", allViolations);
  process.exit(1);
}
```

---

## Future Integration Points

> **Note**: This module does NOT modify the migration engine in this PR.
> Integration will happen in a future PR after review.

### Planned Call Sites

1. **Pre-migration**: Validate config and input files
2. **Post-parse**: Validate parsed records before processing
3. **Post-migration**: Validate the migration report bundle
4. **Pre-rollback**: Validate rollback manifest completeness
5. **Post-rollback**: Verify rollback restored expected state

### Integration Diagram

```
[CSV Parse] -> [validateBundleShape] -> [Process Records]
                     |
                     v
              [assertNoViolations]
                     |
              [Migration Engine] -> [validateIdMapping] -> [Write Reports]
                     |
                     v
              [Rollback Check] -> [validateDeterminismSummary]
```

---

## Why This Is Safe

This PR introduces the invariants module **without wiring it into the engine**:

1. **No behavior change**: Migration engine code is untouched
2. **No schema change**: Prisma schema is untouched
3. **Pure functions**: All validators are side-effect free
4. **Fully tested**: Unit tests cover all violation types
5. **Opt-in**: Integration requires explicit future PR

The invariant functions can be imported and used independently for:
- Manual validation during development
- CI pipeline checks on migration artifacts
- Test assertions for migration output

---

## Test Coverage

Tests are located at:
```
tests/unit/migration/invariants.spec.ts
```

### Test Categories

| Category | Tests |
|----------|-------|
| `assertNoViolations` | Empty array, single violation, multiple violations |
| `validateIdMapping` | Happy path, missing fields, duplicates, count mismatches |
| `validateBundleShape` | Happy path, missing fields, negative counts, count inconsistencies |
| `validateDeterminismSummary` | Happy path, missing fields, invalid timestamps, non-deterministic counts |
| `validateMigrationReport` | Combined validation |

---

## References

- [Issue #202](https://github.com/sbnctech/murmurant/issues/202) - Migration Wave
- [Issue #277](https://github.com/sbnctech/murmurant/issues/277) - Rollback and Recovery
- [Migration Pipeline Design](../IMPORTING/WA_MIGRATION_RUNBOOK.md)
