/**
 * Migration Invariants Module
 *
 * Pure validation functions that check invariants on migration artifacts.
 * These functions are side-effect free and can be tested in isolation.
 *
 * This module does NOT wire into the migration engine (yet).
 * See: docs/ARCH/MIGRATION_INVARIANTS.md
 *
 * Related: Issue #202 (Migration Wave), Issue #277 (Rollback/Recovery)
 */

import type {
  MigrationReport,
  EntityReport,
} from "./types";
import type { IdMappingReport, IdMappingEntry } from "./id-mapping";

// =============================================================================
// Types
// =============================================================================

/**
 * Represents a single invariant violation.
 */
export interface InvariantViolation {
  /** Short code identifying the violation type (e.g., "DUPLICATE_WA_ID") */
  code: string;
  /** Human-readable description of the violation */
  message: string;
  /** Path to the violating data (e.g., "members.mappings[3]") */
  path?: string;
  /** Additional context about the violation */
  details?: Record<string, unknown>;
}

/**
 * Result of running invariant checks.
 */
export interface InvariantCheckResult {
  valid: boolean;
  violations: InvariantViolation[];
}

// =============================================================================
// Error Codes
// =============================================================================

export const VIOLATION_CODES = {
  // ID Mapping violations
  MISSING_WA_ID: "MISSING_WA_ID",
  MISSING_CLUBOS_ID: "MISSING_CLUBOS_ID",
  DUPLICATE_WA_ID: "DUPLICATE_WA_ID",
  DUPLICATE_CLUBOS_ID: "DUPLICATE_CLUBOS_ID",
  ORPHANED_MAPPING: "ORPHANED_MAPPING",
  EMPTY_MAPPING: "EMPTY_MAPPING",

  // Bundle shape violations
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  INVALID_ENTITY_REPORT: "INVALID_ENTITY_REPORT",
  NEGATIVE_COUNT: "NEGATIVE_COUNT",
  COUNT_MISMATCH: "COUNT_MISMATCH",
  MISSING_RUN_ID: "MISSING_RUN_ID",

  // Determinism violations
  NON_DETERMINISTIC_COUNTS: "NON_DETERMINISTIC_COUNTS",
  RECORDS_EXCEED_PARSED: "RECORDS_EXCEED_PARSED",
  INVALID_TIMESTAMP: "INVALID_TIMESTAMP",
} as const;

// =============================================================================
// Core Assertion
// =============================================================================

/**
 * Throws an error if there are any violations.
 * Use this to fail-fast when invariants must hold.
 *
 * @param violations - Array of violations to check
 * @throws Error with readable message listing all violations
 */
export function assertNoViolations(violations: InvariantViolation[]): void {
  if (violations.length === 0) {
    return;
  }

  const messages = violations.map((v, i) => {
    const pathInfo = v.path ? ` at ${v.path}` : "";
    return `  ${i + 1}. [${v.code}]${pathInfo}: ${v.message}`;
  });

  throw new Error(
    `Migration invariant violations detected (${violations.length}):\n${messages.join("\n")}`
  );
}

// =============================================================================
// ID Mapping Validators
// =============================================================================

/**
 * Validates an ID mapping report for common invariant violations.
 *
 * Checks:
 * - No duplicate WA IDs within an entity type
 * - No duplicate ClubOS IDs within an entity type
 * - All entries have both waId and clubosId
 * - Counts are consistent with mapping arrays
 */
export function validateIdMapping(
  report: IdMappingReport
): InvariantViolation[] {
  const violations: InvariantViolation[] = [];

  // Check run ID
  if (!report.runId || typeof report.runId !== "string") {
    violations.push({
      code: VIOLATION_CODES.MISSING_RUN_ID,
      message: "ID mapping report missing runId",
      path: "runId",
    });
  }

  // Validate member mappings
  violations.push(
    ...validateIdMappingEntries(report.members.mappings, "members")
  );

  // Validate event mappings
  violations.push(
    ...validateIdMappingEntries(report.events.mappings, "events")
  );

  // Check count consistency
  if (report.members.counts.mapped !== report.members.mappings.length) {
    violations.push({
      code: VIOLATION_CODES.COUNT_MISMATCH,
      message: `Members mapped count (${report.members.counts.mapped}) does not match mappings length (${report.members.mappings.length})`,
      path: "members.counts.mapped",
      details: {
        expected: report.members.mappings.length,
        actual: report.members.counts.mapped,
      },
    });
  }

  if (report.events.counts.mapped !== report.events.mappings.length) {
    violations.push({
      code: VIOLATION_CODES.COUNT_MISMATCH,
      message: `Events mapped count (${report.events.counts.mapped}) does not match mappings length (${report.events.mappings.length})`,
      path: "events.counts.mapped",
      details: {
        expected: report.events.mappings.length,
        actual: report.events.counts.mapped,
      },
    });
  }

  return violations;
}

/**
 * Validates a single entity type's ID mapping entries.
 */
function validateIdMappingEntries(
  mappings: IdMappingEntry[],
  entityType: string
): InvariantViolation[] {
  const violations: InvariantViolation[] = [];

  if (!Array.isArray(mappings)) {
    violations.push({
      code: VIOLATION_CODES.INVALID_ENTITY_REPORT,
      message: `${entityType} mappings is not an array`,
      path: `${entityType}.mappings`,
    });
    return violations;
  }

  const seenWaIds = new Map<string, number>();
  const seenClubosIds = new Map<string, number>();

  mappings.forEach((entry, index) => {
    const path = `${entityType}.mappings[${index}]`;

    // Check for missing WA ID
    if (!entry.waId || typeof entry.waId !== "string") {
      violations.push({
        code: VIOLATION_CODES.MISSING_WA_ID,
        message: "Mapping entry missing waId",
        path,
        details: { entry },
      });
    } else {
      // Track for duplicates
      const prevIndex = seenWaIds.get(entry.waId);
      if (prevIndex !== undefined) {
        violations.push({
          code: VIOLATION_CODES.DUPLICATE_WA_ID,
          message: `Duplicate WA ID: ${entry.waId}`,
          path,
          details: { waId: entry.waId, firstIndex: prevIndex, secondIndex: index },
        });
      } else {
        seenWaIds.set(entry.waId, index);
      }
    }

    // Check for missing ClubOS ID
    if (!entry.clubosId || typeof entry.clubosId !== "string") {
      violations.push({
        code: VIOLATION_CODES.MISSING_CLUBOS_ID,
        message: "Mapping entry missing clubosId",
        path,
        details: { entry },
      });
    } else {
      // Track for duplicates
      const prevIndex = seenClubosIds.get(entry.clubosId);
      if (prevIndex !== undefined) {
        violations.push({
          code: VIOLATION_CODES.DUPLICATE_CLUBOS_ID,
          message: `Duplicate ClubOS ID: ${entry.clubosId}`,
          path,
          details: { clubosId: entry.clubosId, firstIndex: prevIndex, secondIndex: index },
        });
      } else {
        seenClubosIds.set(entry.clubosId, index);
      }
    }
  });

  return violations;
}

// =============================================================================
// Bundle Shape Validators
// =============================================================================

/**
 * Validates a migration report bundle for structural invariants.
 *
 * Checks:
 * - Required top-level fields exist
 * - Entity reports have valid structure
 * - Counts are non-negative
 * - Created + updated + skipped + errors = parsed
 */
export function validateBundleShape(
  report: MigrationReport
): InvariantViolation[] {
  const violations: InvariantViolation[] = [];

  // Check required top-level fields
  if (!report.runId || typeof report.runId !== "string") {
    violations.push({
      code: VIOLATION_CODES.MISSING_RUN_ID,
      message: "Migration report missing runId",
      path: "runId",
    });
  }

  if (!report.startedAt || !(report.startedAt instanceof Date || typeof report.startedAt === "string")) {
    violations.push({
      code: VIOLATION_CODES.MISSING_REQUIRED_FIELD,
      message: "Migration report missing startedAt",
      path: "startedAt",
    });
  }

  // Validate entity reports
  violations.push(...validateEntityReport(report.members, "members"));
  violations.push(...validateEntityReport(report.events, "events"));
  violations.push(...validateEntityReport(report.registrations, "registrations"));

  // Validate summary counts
  if (report.summary) {
    const summaryFields = ["totalRecords", "created", "updated", "skipped", "errors"];
    for (const field of summaryFields) {
      const value = (report.summary as Record<string, unknown>)[field];
      if (typeof value === "number" && value < 0) {
        violations.push({
          code: VIOLATION_CODES.NEGATIVE_COUNT,
          message: `Summary ${field} cannot be negative`,
          path: `summary.${field}`,
          details: { value },
        });
      }
    }
  }

  return violations;
}

/**
 * Validates an entity report's structure and counts.
 */
function validateEntityReport(
  entity: EntityReport,
  entityType: string
): InvariantViolation[] {
  const violations: InvariantViolation[] = [];

  if (!entity) {
    violations.push({
      code: VIOLATION_CODES.INVALID_ENTITY_REPORT,
      message: `Missing ${entityType} entity report`,
      path: entityType,
    });
    return violations;
  }

  // Check non-negative counts
  const countFields = ["totalRows", "parsed", "created", "updated", "skipped", "errors"];
  for (const field of countFields) {
    const value = (entity as unknown as Record<string, unknown>)[field];
    if (typeof value === "number" && value < 0) {
      violations.push({
        code: VIOLATION_CODES.NEGATIVE_COUNT,
        message: `${entityType}.${field} cannot be negative`,
        path: `${entityType}.${field}`,
        details: { value },
      });
    }
  }

  // Check count consistency: created + updated + skipped + errors should equal parsed
  const sum = entity.created + entity.updated + entity.skipped + entity.errors;
  if (entity.parsed !== sum) {
    violations.push({
      code: VIOLATION_CODES.COUNT_MISMATCH,
      message: `${entityType} counts inconsistent: created(${entity.created}) + updated(${entity.updated}) + skipped(${entity.skipped}) + errors(${entity.errors}) = ${sum}, but parsed = ${entity.parsed}`,
      path: entityType,
      details: {
        created: entity.created,
        updated: entity.updated,
        skipped: entity.skipped,
        errors: entity.errors,
        parsed: entity.parsed,
        sum,
      },
    });
  }

  // Check records array exists
  if (!Array.isArray(entity.records)) {
    violations.push({
      code: VIOLATION_CODES.INVALID_ENTITY_REPORT,
      message: `${entityType}.records is not an array`,
      path: `${entityType}.records`,
    });
  } else if (entity.records.length > entity.parsed) {
    violations.push({
      code: VIOLATION_CODES.RECORDS_EXCEED_PARSED,
      message: `${entityType}.records length (${entity.records.length}) exceeds parsed count (${entity.parsed})`,
      path: `${entityType}.records`,
      details: {
        recordsLength: entity.records.length,
        parsed: entity.parsed,
      },
    });
  }

  return violations;
}

// =============================================================================
// Determinism Summary Validators
// =============================================================================

/**
 * Summary of migration counts for determinism checking.
 */
export interface DeterminismSummary {
  runId: string;
  timestamp: string;
  members: { parsed: number; created: number; updated: number; skipped: number; errors: number };
  events: { parsed: number; created: number; updated: number; skipped: number; errors: number };
  registrations: { parsed: number; created: number; updated: number; skipped: number; errors: number };
}

/**
 * Validates a determinism summary for consistency.
 *
 * Checks:
 * - All counts are non-negative
 * - Timestamp is valid ISO format
 * - Run ID is present
 */
export function validateDeterminismSummary(
  summary: DeterminismSummary
): InvariantViolation[] {
  const violations: InvariantViolation[] = [];

  // Check run ID
  if (!summary.runId || typeof summary.runId !== "string") {
    violations.push({
      code: VIOLATION_CODES.MISSING_RUN_ID,
      message: "Determinism summary missing runId",
      path: "runId",
    });
  }

  // Check timestamp
  if (!summary.timestamp || typeof summary.timestamp !== "string") {
    violations.push({
      code: VIOLATION_CODES.INVALID_TIMESTAMP,
      message: "Determinism summary missing timestamp",
      path: "timestamp",
    });
  } else {
    const parsed = Date.parse(summary.timestamp);
    if (isNaN(parsed)) {
      violations.push({
        code: VIOLATION_CODES.INVALID_TIMESTAMP,
        message: "Determinism summary has invalid timestamp format",
        path: "timestamp",
        details: { timestamp: summary.timestamp },
      });
    }
  }

  // Check entity counts
  const entities = ["members", "events", "registrations"] as const;
  for (const entityType of entities) {
    const entity = summary[entityType];
    if (!entity) {
      violations.push({
        code: VIOLATION_CODES.MISSING_REQUIRED_FIELD,
        message: `Determinism summary missing ${entityType}`,
        path: entityType,
      });
      continue;
    }

    const countFields = ["parsed", "created", "updated", "skipped", "errors"] as const;
    for (const field of countFields) {
      const value = entity[field];
      if (typeof value !== "number") {
        violations.push({
          code: VIOLATION_CODES.MISSING_REQUIRED_FIELD,
          message: `${entityType}.${field} is not a number`,
          path: `${entityType}.${field}`,
          details: { value },
        });
      } else if (value < 0) {
        violations.push({
          code: VIOLATION_CODES.NEGATIVE_COUNT,
          message: `${entityType}.${field} cannot be negative`,
          path: `${entityType}.${field}`,
          details: { value },
        });
      }
    }

    // Check count consistency
    if (entity.parsed !== undefined && typeof entity.parsed === "number") {
      const sum = (entity.created || 0) + (entity.updated || 0) + (entity.skipped || 0) + (entity.errors || 0);
      if (entity.parsed !== sum) {
        violations.push({
          code: VIOLATION_CODES.NON_DETERMINISTIC_COUNTS,
          message: `${entityType} counts do not add up: ${sum} !== ${entity.parsed}`,
          path: entityType,
          details: { ...entity, sum },
        });
      }
    }
  }

  return violations;
}

// =============================================================================
// Convenience: Check All
// =============================================================================

/**
 * Runs all applicable validators on a migration report.
 * Returns a combined result with all violations.
 */
export function validateMigrationReport(
  report: MigrationReport
): InvariantCheckResult {
  const violations: InvariantViolation[] = [];

  // Bundle shape validation
  violations.push(...validateBundleShape(report));

  return {
    valid: violations.length === 0,
    violations,
  };
}
