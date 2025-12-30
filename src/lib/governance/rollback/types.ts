/**
 * Rollback System Type Definitions
 *
 * Charter Principles:
 * - P1: Identity and authorization must be provable
 * - P5: Every important action must be undoable
 * - P9: Security must fail closed
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { AuditAction } from "@prisma/client";
import { Capability, AuthContext } from "@/lib/auth";

// ============================================================================
// CLASSIFICATION
// ============================================================================

/**
 * How reversible an action is:
 * - FULLY_REVERSIBLE: Direct undo (e.g., unpublish an event)
 * - COMPENSATABLE: Undo via compensating action (e.g., revert status change)
 * - IRREVERSIBLE: Cannot be undone (e.g., emails sent)
 */
export type RollbackClassification =
  | "FULLY_REVERSIBLE"
  | "COMPENSATABLE"
  | "IRREVERSIBLE";

// ============================================================================
// ROLLBACK WINDOW
// ============================================================================

/**
 * Time-based constraints on when rollback is allowed.
 */
export interface RollbackWindow {
  /** Hours after action when standard rollback is allowed */
  hours: number;
  /** Capability required to rollback after window expires (optional) */
  escalationCapability?: Capability;
}

// ============================================================================
// CASCADE CHECKS
// ============================================================================

/**
 * Result of a cascade check.
 */
export interface CascadeCheckResult {
  /** Whether the check passed */
  passed: boolean;
  /** Human-readable message about the check result */
  message: string;
  /** Additional data about what was found */
  data?: Record<string, unknown>;
}

/**
 * A check that runs before rollback to detect side effects.
 */
export interface CascadeCheck {
  /** Human-readable description of what this check does */
  description: string;
  /** If true, failing this check blocks rollback entirely */
  blocking: boolean;
  /** The check function */
  check: (
    resourceType: string,
    resourceId: string,
    auditLog: AuditLogForRollback
  ) => Promise<CascadeCheckResult>;
}

// ============================================================================
// ROLLBACK POLICY
// ============================================================================

/**
 * Defines the rollback rules for a specific resource type + action combination.
 */
export interface RollbackPolicy {
  /** The type of resource (e.g., "Event", "Member") */
  resourceType: string;
  /** The action that was performed (CREATE, UPDATE, DELETE, etc.) */
  action: AuditAction;
  /** How reversible this action is */
  classification: RollbackClassification;
  /** Human-readable description of what rollback does */
  description: string;
  /** Capability required to perform rollback */
  requiredCapability: Capability;
  /** Time window constraints (null = unlimited) */
  window: RollbackWindow | null;
  /** Who can perform rollback: original actor only, any authorized user, or escalated */
  allowedActors: "original" | "any" | "escalated";
  /** Whether user must confirm before rollback executes */
  requiresConfirmation: boolean;
  /** Checks to run before rollback */
  cascadeChecks: CascadeCheck[];
  /** Warning message to display (especially for irreversible actions) */
  warningMessage?: string;
}

// ============================================================================
// AUDIT LOG TYPES (for rollback context)
// ============================================================================

/**
 * Minimal audit log fields needed for rollback operations.
 */
export interface AuditLogForRollback {
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

// ============================================================================
// ROLLBACK REQUEST/RESPONSE
// ============================================================================

/**
 * Request to preview or execute a rollback.
 */
export interface RollbackRequest {
  /** The audit log entry ID to roll back */
  auditLogId: string;
  /** Required: reason for rollback (for audit trail) */
  reason: string;
  /** Confirmation token (required if policy.requiresConfirmation is true) */
  confirmationToken?: string;
  /** If true, only preview without executing */
  dryRun?: boolean;
}

/**
 * Preview of what a rollback would do.
 */
export interface RollbackPreview {
  /** Whether rollback is possible */
  canRollback: boolean;
  /** The policy that applies (null if not rollbackable) */
  policy: RollbackPolicy | null;
  /** Current state of the resource */
  currentState: Record<string, unknown>;
  /** State the resource would be restored to */
  targetState: Record<string, unknown>;
  /** Results of cascade checks */
  cascadeEffects: CascadeCheckResult[];
  /** Warning messages to display */
  warnings: string[];
  /** Whether confirmation is required */
  requiresConfirmation: boolean;
  /** Token to include when executing (valid 10 minutes) */
  confirmationToken?: string;
  /** If canRollback is false, why */
  blockingReason?: string;
}

/**
 * Result of executing a rollback.
 */
export interface RollbackResult {
  /** Whether rollback succeeded */
  success: boolean;
  /** The audit log ID of the rollback action itself */
  rollbackAuditLogId?: string;
  /** The restored state */
  restoredState?: Record<string, unknown>;
  /** Error message if failed */
  error?: string;
}

// ============================================================================
// ROLLBACK AUDIT METADATA
// ============================================================================

/**
 * Metadata added to audit log entries for rollback actions.
 * This allows distinguishing rollbacks from normal mutations.
 */
export interface RollbackAuditMetadata {
  /** Flag indicating this is a rollback action */
  isRollback: true;
  /** The original audit log entry being rolled back */
  originalAuditLogId: string;
  /** The original action that was performed */
  originalAction: AuditAction;
  /** The member ID of the original actor (null if system) */
  originalActorId: string | null;
  /** When the original action occurred */
  originalTimestamp: string;
  /** User-provided reason for rollback */
  reason: string;
  /** Any cascade actions that were also rolled back */
  cascadeActions?: {
    resourceType: string;
    resourceId: string;
    action: string;
  }[];
}

// ============================================================================
// EXECUTOR CONTEXT
// ============================================================================

/**
 * Context passed to rollback executor functions.
 */
export interface RollbackContext {
  /** The authenticated actor performing the rollback */
  actor: AuthContext;
  /** The audit log entry being rolled back */
  auditLog: AuditLogForRollback;
  /** The policy that governs this rollback */
  policy: RollbackPolicy;
  /** User-provided reason for rollback */
  reason: string;
}

// ============================================================================
// POLICY REGISTRY KEY
// ============================================================================

/**
 * Creates a policy registry key from resource type and action.
 */
export function policyKey(resourceType: string, action: AuditAction): string {
  return `${resourceType}:${action}`;
}
