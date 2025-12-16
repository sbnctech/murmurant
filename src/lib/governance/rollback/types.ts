/**
 * Rollback System Types
 *
 * Charter Principles:
 * - P1: Identity and authorization must be provable (who did the rollback)
 * - P2: Default deny, least privilege (capability-based permissions)
 * - P5: Every important action must be undoable
 * - P9: Security must fail closed (validation before execution)
 */

import { AuditAction } from "@prisma/client";

/**
 * Classification of how an action can be undone.
 */
export type RollbackClassification =
  | "FULLY_REVERSIBLE" // Direct undo - restore to prior state
  | "COMPENSATABLE" // Undo via compensating action
  | "IRREVERSIBLE"; // Cannot be undone

/**
 * Time window for rollback eligibility.
 */
export interface RollbackWindow {
  maxAgeMs: number;
  description: string;
}

/**
 * Result of a cascade check.
 */
export interface CascadeCheckResult {
  passed: boolean;
  blocking: boolean;
  message: string;
}

/**
 * Function type for cascade checks.
 */
export type CascadeCheckFn = (
  resourceId: string
) => Promise<CascadeCheckResult>;

/**
 * Policy for a specific resource+action combination.
 */
export interface RollbackPolicy {
  resourceType: string;
  action: AuditAction;
  classification: RollbackClassification;
  description: string;
  requiredCapability: string;
  window: RollbackWindow | null;
  requiresConfirmation: boolean;
  cascadeChecks: CascadeCheckFn[];
  warningMessage?: string;
}

/**
 * Request to execute a rollback.
 */
export interface RollbackRequest {
  auditLogId: string;
  reason: string;
  confirmationToken?: string;
  dryRun?: boolean;
}

/**
 * Result of a rollback preview.
 */
export interface RollbackPreview {
  rollbackable: boolean;
  classification: RollbackClassification | null;
  policy: RollbackPolicy | null;
  currentState: Record<string, unknown> | null;
  targetState: Record<string, unknown> | null;
  cascadeEffects: CascadeCheckResult[];
  warnings: string[];
  blockingReasons: string[];
  requiresConfirmation: boolean;
}

/**
 * Result of executing a rollback.
 */
export interface RollbackResult {
  success: boolean;
  resourceId?: string;
  rollbackAuditLogId?: string;
  restoredState?: Record<string, unknown>;
  warnings?: string[];
  error?: string;
}

/**
 * Audit log entry from database.
 */
export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  memberId: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

/**
 * Generate a unique policy key.
 */
export function policyKey(resourceType: string, action: string): string {
  return `${resourceType}:${action}`;
}
