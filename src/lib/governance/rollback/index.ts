/**
 * Rollback System - Public Exports
 *
 * Charter Principles:
 * - P5: Every important action must be undoable
 *
 * Usage:
 * ```typescript
 * import {
 *   previewRollback,
 *   executeRollback,
 *   validateRollbackRequest,
 * } from "@/lib/governance/rollback";
 * ```
 */

// Types
export type {
  RollbackClassification,
  RollbackWindow,
  CascadeCheckResult,
  CascadeCheckFn,
  RollbackPolicy,
  RollbackRequest,
  RollbackPreview,
  RollbackResult,
  AuditLogEntry,
} from "./types";

export { policyKey } from "./types";

// Policies
export {
  ROLLBACK_POLICIES,
  STANDARD_WINDOW,
  EXTENDED_WINDOW,
  getRollbackPolicy,
  isRollbackable,
  getPoliciesForResource,
  getIrreversiblePolicies,
} from "./policies";

// Validators
export {
  RollbackRequestSchema,
  RollbackListQuerySchema,
  validateRollbackRequest,
  validateRollbackListQuery,
} from "./validators";

export type {
  RollbackRequestInput,
  RollbackListQueryInput,
} from "./validators";

// Executor
export {
  previewRollback,
  executeRollback,
  listRollbackableActions,
  getConfirmationToken,
} from "./executor";
