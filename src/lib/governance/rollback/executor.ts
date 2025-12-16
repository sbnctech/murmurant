/**
 * Rollback Executor
 *
 * Charter Principles:
 * - P1: Identity and authorization must be provable (who did the rollback)
 * - P4: No hidden rules - preview shows exactly what will happen
 * - P7: Observability - full visibility into rollback effects
 * - P9: Security must fail closed (validation before execution)
 */

import { prisma } from "@/lib/prisma";
import { createAuditEntry } from "@/lib/audit";
import { AuthContext } from "@/lib/auth";
import { NextRequest } from "next/server";
import { getRollbackPolicy, isRollbackable } from "./policies";
import {
  RollbackRequest,
  RollbackPreview,
  RollbackResult,
  AuditLogEntry,
  CascadeCheckResult,
} from "./types";
import crypto from "crypto";

// =============================================================================
// CONFIRMATION TOKEN MANAGEMENT
// =============================================================================

const confirmationTokens = new Map<string, { auditLogId: string; expiresAt: Date }>();

/**
 * Generate a confirmation token for a rollback.
 * Valid for 10 minutes.
 */
export function getConfirmationToken(auditLogId: string): string {
  const token = crypto.randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  confirmationTokens.set(token, { auditLogId, expiresAt });

  // Clean up expired tokens periodically
  for (const [key, value] of confirmationTokens.entries()) {
    if (value.expiresAt < new Date()) {
      confirmationTokens.delete(key);
    }
  }

  return token;
}

/**
 * Validate a confirmation token.
 */
function validateConfirmationToken(
  token: string,
  auditLogId: string
): boolean {
  const stored = confirmationTokens.get(token);
  if (!stored) return false;
  if (stored.auditLogId !== auditLogId) return false;
  if (stored.expiresAt < new Date()) {
    confirmationTokens.delete(token);
    return false;
  }
  return true;
}

/**
 * Consume (invalidate) a confirmation token after use.
 */
function consumeConfirmationToken(token: string): void {
  confirmationTokens.delete(token);
}

// =============================================================================
// STATE FETCHERS
// =============================================================================

type StateFetcher = (id: string) => Promise<Record<string, unknown> | null>;

const stateFetchers: Record<string, StateFetcher> = {
  Event: async (id) => {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return null;
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      isPublished: event.isPublished,
      startTime: event.startTime,
      endTime: event.endTime,
      capacity: event.capacity,
      location: event.location,
    };
  },

  Member: async (id) => {
    const member = await prisma.member.findUnique({
      where: { id },
      include: { membershipStatus: true },
    });
    if (!member) return null;
    return {
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      membershipStatusId: member.membershipStatusId,
      membershipStatusCode: member.membershipStatus.code,
    };
  },

  RoleAssignment: async (id) => {
    const assignment = await prisma.roleAssignment.findUnique({
      where: { id },
      include: {
        member: true,
        committee: true,
        committeeRole: true,
      },
    });
    if (!assignment) return null;
    return {
      id: assignment.id,
      memberId: assignment.memberId,
      memberName: `${assignment.member.firstName} ${assignment.member.lastName}`,
      committeeId: assignment.committeeId,
      committeeName: assignment.committee.name,
      committeeRoleId: assignment.committeeRoleId,
      roleName: assignment.committeeRole.name,
      startDate: assignment.startDate,
      endDate: assignment.endDate,
    };
  },

  MemberServiceHistory: async (id) => {
    const record = await prisma.memberServiceHistory.findUnique({
      where: { id },
    });
    if (!record) return null;
    return {
      id: record.id,
      memberId: record.memberId,
      serviceType: record.serviceType,
      roleTitle: record.roleTitle,
      committeeId: record.committeeId,
      startAt: record.startAt,
      endAt: record.endAt,
    };
  },

  TransitionPlan: async (id) => {
    const plan = await prisma.transitionPlan.findUnique({
      where: { id },
    });
    if (!plan) return null;
    return {
      id: plan.id,
      targetTermId: plan.targetTermId,
      presidentApprovedAt: plan.presidentApprovedAt,
      vpActivitiesApprovedAt: plan.vpActivitiesApprovedAt,
      appliedAt: plan.appliedAt,
    };
  },

  Page: async (id) => {
    const page = await prisma.page.findUnique({ where: { id } });
    if (!page) return null;
    return {
      id: page.id,
      title: page.title,
      slug: page.slug,
      status: page.status,
    };
  },
};

/**
 * Get current state of a resource.
 */
async function getCurrentState(
  resourceType: string,
  resourceId: string
): Promise<Record<string, unknown> | null> {
  const fetcher = stateFetchers[resourceType];
  if (!fetcher) return null;
  return fetcher(resourceId);
}

// =============================================================================
// ROLLBACK EXECUTORS
// =============================================================================

type RollbackExecutor = (
  auditLog: AuditLogEntry,
  actor: AuthContext,
  req?: NextRequest
) => Promise<RollbackResult>;

const rollbackExecutors: Record<string, RollbackExecutor> = {
  "Event:PUBLISH": async (auditLog, actor, req) => {
    // Compensating action: set isPublished to false
    await prisma.event.update({
      where: { id: auditLog.resourceId },
      data: { isPublished: false },
    });

    await createAuditEntry({
      action: "UNPUBLISH",
      resourceType: "Event",
      resourceId: auditLog.resourceId,
      actor,
      req,
      before: { isPublished: true },
      after: { isPublished: false },
      metadata: {
        isRollback: true,
        originalAuditLogId: auditLog.id,
        originalAction: auditLog.action,
        originalTimestamp: auditLog.createdAt,
      },
    });

    return { success: true, resourceId: auditLog.resourceId };
  },

  "Event:UNPUBLISH": async (auditLog, actor, req) => {
    // Direct undo: set isPublished to true
    await prisma.event.update({
      where: { id: auditLog.resourceId },
      data: { isPublished: true },
    });

    await createAuditEntry({
      action: "PUBLISH",
      resourceType: "Event",
      resourceId: auditLog.resourceId,
      actor,
      req,
      before: { isPublished: false },
      after: { isPublished: true },
      metadata: {
        isRollback: true,
        originalAuditLogId: auditLog.id,
        originalAction: auditLog.action,
        originalTimestamp: auditLog.createdAt,
      },
    });

    return { success: true, resourceId: auditLog.resourceId };
  },

  "Event:UPDATE": async (auditLog, actor, req) => {
    if (!auditLog.before) {
      return { success: false, error: "No previous state available to restore" };
    }

    // Restore previous state
    const before = auditLog.before;
    await prisma.event.update({
      where: { id: auditLog.resourceId },
      data: {
        title: before.title as string | undefined,
        description: before.description as string | null | undefined,
        location: before.location as string | null | undefined,
        startTime: before.startTime
          ? new Date(before.startTime as string)
          : undefined,
        endTime: before.endTime
          ? new Date(before.endTime as string)
          : undefined,
        capacity: before.capacity as number | null | undefined,
      },
    });

    await createAuditEntry({
      action: "UPDATE",
      resourceType: "Event",
      resourceId: auditLog.resourceId,
      actor,
      req,
      before: auditLog.after ?? undefined,
      after: before,
      metadata: {
        isRollback: true,
        originalAuditLogId: auditLog.id,
        originalAction: auditLog.action,
        originalTimestamp: auditLog.createdAt,
      },
    });

    return {
      success: true,
      resourceId: auditLog.resourceId,
      restoredState: before,
    };
  },

  "Member:UPDATE": async (auditLog, actor, req) => {
    if (!auditLog.before) {
      return { success: false, error: "No previous state available to restore" };
    }

    const before = auditLog.before;
    await prisma.member.update({
      where: { id: auditLog.resourceId },
      data: {
        firstName: before.firstName as string | undefined,
        lastName: before.lastName as string | undefined,
        email: before.email as string | undefined,
        phone: before.phone as string | null | undefined,
        membershipStatusId: before.membershipStatusId as string | undefined,
      },
    });

    await createAuditEntry({
      action: "UPDATE",
      resourceType: "Member",
      resourceId: auditLog.resourceId,
      actor,
      req,
      before: auditLog.after ?? undefined,
      after: before,
      metadata: {
        isRollback: true,
        originalAuditLogId: auditLog.id,
        originalAction: auditLog.action,
        originalTimestamp: auditLog.createdAt,
      },
    });

    return {
      success: true,
      resourceId: auditLog.resourceId,
      restoredState: before,
    };
  },

  "RoleAssignment:CREATE": async (auditLog, actor, req) => {
    // Compensating action: set endDate to now
    await prisma.roleAssignment.update({
      where: { id: auditLog.resourceId },
      data: { endDate: new Date() },
    });

    await createAuditEntry({
      action: "UPDATE",
      resourceType: "RoleAssignment",
      resourceId: auditLog.resourceId,
      actor,
      req,
      before: { endDate: null },
      after: { endDate: new Date() },
      metadata: {
        isRollback: true,
        originalAuditLogId: auditLog.id,
        originalAction: auditLog.action,
        originalTimestamp: auditLog.createdAt,
        rollbackType: "end_assignment",
      },
    });

    return { success: true, resourceId: auditLog.resourceId };
  },

  "Page:PUBLISH": async (auditLog, actor, req) => {
    await prisma.page.update({
      where: { id: auditLog.resourceId },
      data: { status: "DRAFT" },
    });

    await createAuditEntry({
      action: "UNPUBLISH",
      resourceType: "Page",
      resourceId: auditLog.resourceId,
      actor,
      req,
      before: { status: "PUBLISHED" },
      after: { status: "DRAFT" },
      metadata: {
        isRollback: true,
        originalAuditLogId: auditLog.id,
        originalAction: auditLog.action,
        originalTimestamp: auditLog.createdAt,
      },
    });

    return { success: true, resourceId: auditLog.resourceId };
  },

  "Page:UNPUBLISH": async (auditLog, actor, req) => {
    await prisma.page.update({
      where: { id: auditLog.resourceId },
      data: { status: "PUBLISHED" },
    });

    await createAuditEntry({
      action: "PUBLISH",
      resourceType: "Page",
      resourceId: auditLog.resourceId,
      actor,
      req,
      before: { status: "DRAFT" },
      after: { status: "PUBLISHED" },
      metadata: {
        isRollback: true,
        originalAuditLogId: auditLog.id,
        originalAction: auditLog.action,
        originalTimestamp: auditLog.createdAt,
      },
    });

    return { success: true, resourceId: auditLog.resourceId };
  },
};

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

/**
 * Preview a rollback without executing it.
 */
export async function previewRollback(
  auditLogId: string,
  _actor: AuthContext
): Promise<RollbackPreview> {
  const auditLog = await prisma.auditLog.findUnique({
    where: { id: auditLogId },
  });

  if (!auditLog) {
    throw new Error(`Audit log ${auditLogId} not found`);
  }

  const policy = getRollbackPolicy(auditLog.resourceType, auditLog.action);

  if (!policy) {
    return {
      rollbackable: false,
      classification: null,
      policy: null,
      currentState: null,
      targetState: null,
      cascadeEffects: [],
      warnings: [],
      blockingReasons: ["No rollback policy defined for this action"],
      requiresConfirmation: false,
    };
  }

  if (policy.classification === "IRREVERSIBLE") {
    return {
      rollbackable: false,
      classification: "IRREVERSIBLE",
      policy,
      currentState: null,
      targetState: null,
      cascadeEffects: [],
      warnings: [policy.warningMessage ?? "This action cannot be undone"],
      blockingReasons: ["This action is irreversible"],
      requiresConfirmation: false,
    };
  }

  // Check time window
  if (policy.window) {
    const ageMs = Date.now() - auditLog.createdAt.getTime();
    if (ageMs > policy.window.maxAgeMs) {
      return {
        rollbackable: false,
        classification: policy.classification,
        policy,
        currentState: null,
        targetState: null,
        cascadeEffects: [],
        warnings: [],
        blockingReasons: [
          `Rollback window expired. Action was ${Math.floor(ageMs / (1000 * 60 * 60))} hours ago, limit is ${policy.window.description}.`,
        ],
        requiresConfirmation: false,
      };
    }
  }

  // Get current and target state
  const currentState = await getCurrentState(
    auditLog.resourceType,
    auditLog.resourceId
  );
  const targetState = (auditLog.before as Record<string, unknown>) ?? null;

  // Run cascade checks
  const cascadeEffects: CascadeCheckResult[] = [];
  const warnings: string[] = [];
  const blockingReasons: string[] = [];

  for (const check of policy.cascadeChecks) {
    const result = await check(auditLog.resourceId);
    cascadeEffects.push(result);

    if (!result.passed) {
      if (result.blocking) {
        blockingReasons.push(result.message);
      } else {
        warnings.push(result.message);
      }
    }
  }

  if (policy.warningMessage) {
    warnings.push(policy.warningMessage);
  }

  return {
    rollbackable: blockingReasons.length === 0,
    classification: policy.classification,
    policy,
    currentState,
    targetState,
    cascadeEffects,
    warnings,
    blockingReasons,
    requiresConfirmation: policy.requiresConfirmation,
  };
}

/**
 * Execute a rollback.
 */
export async function executeRollback(
  request: RollbackRequest,
  actor: AuthContext,
  req?: NextRequest
): Promise<RollbackResult> {
  // Note: reason is validated but currently not stored in audit metadata
  // TODO: Pass reason to rollback executors and include in audit entries
  const { auditLogId, reason: _reason, confirmationToken, dryRun } = request;

  // Get audit log entry
  const auditLog = await prisma.auditLog.findUnique({
    where: { id: auditLogId },
  });

  if (!auditLog) {
    return { success: false, error: `Audit log ${auditLogId} not found` };
  }

  // Check policy
  const policy = getRollbackPolicy(auditLog.resourceType, auditLog.action);

  if (!policy) {
    return { success: false, error: "No rollback policy for this action" };
  }

  if (policy.classification === "IRREVERSIBLE") {
    return {
      success: false,
      error: policy.warningMessage ?? "This action cannot be undone",
    };
  }

  // Check time window
  if (policy.window) {
    const ageMs = Date.now() - auditLog.createdAt.getTime();
    if (ageMs > policy.window.maxAgeMs) {
      return {
        success: false,
        error: `Rollback window expired (${policy.window.description})`,
      };
    }
  }

  // Check confirmation token for compensatable actions
  if (policy.requiresConfirmation) {
    if (!confirmationToken) {
      return {
        success: false,
        error:
          "Confirmation token required. Preview the rollback first to get a token.",
      };
    }

    if (!validateConfirmationToken(confirmationToken, auditLogId)) {
      return {
        success: false,
        error: "Invalid or expired confirmation token",
      };
    }
  }

  // Run cascade checks
  for (const check of policy.cascadeChecks) {
    const result = await check(auditLog.resourceId);
    if (!result.passed && result.blocking) {
      return { success: false, error: result.message };
    }
  }

  // If dry run, return preview
  if (dryRun) {
    return {
      success: true,
      resourceId: auditLog.resourceId,
      warnings: [
        "Dry run - no changes made",
        policy.warningMessage ?? "",
      ].filter(Boolean),
    };
  }

  // Execute rollback
  const executorKey = `${auditLog.resourceType}:${auditLog.action}`;
  const executor = rollbackExecutors[executorKey];

  if (!executor) {
    return {
      success: false,
      error: `No rollback executor implemented for ${executorKey}`,
    };
  }

  // Consume confirmation token
  if (confirmationToken) {
    consumeConfirmationToken(confirmationToken);
  }

  // Execute the rollback
  const auditLogEntry: AuditLogEntry = {
    id: auditLog.id,
    action: auditLog.action,
    resourceType: auditLog.resourceType,
    resourceId: auditLog.resourceId,
    memberId: auditLog.memberId,
    before: auditLog.before as Record<string, unknown> | null,
    after: auditLog.after as Record<string, unknown> | null,
    metadata: auditLog.metadata as Record<string, unknown> | null,
    createdAt: auditLog.createdAt,
  };

  try {
    const result = await executor(auditLogEntry, actor, req);

    // Get the new audit log ID from the most recent entry
    if (result.success) {
      const newAuditLog = await prisma.auditLog.findFirst({
        where: {
          resourceType: auditLog.resourceType,
          resourceId: auditLog.resourceId,
        },
        orderBy: { createdAt: "desc" },
      });

      return {
        ...result,
        rollbackAuditLogId: newAuditLog?.id,
        warnings: policy.warningMessage ? [policy.warningMessage] : [],
      };
    }

    return result;
  } catch (error) {
    console.error("[ROLLBACK] Execution failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Rollback execution failed",
    };
  }
}

/**
 * List recent rollbackable actions.
 */
export async function listRollbackableActions(
  actor: AuthContext,
  options: {
    limit?: number;
    resourceType?: string;
    since?: Date;
  } = {}
): Promise<AuditLogEntry[]> {
  const { limit = 20, resourceType, since } = options;

  const auditLogs = await prisma.auditLog.findMany({
    where: {
      resourceType: resourceType,
      createdAt: since ? { gte: since } : undefined,
    },
    orderBy: { createdAt: "desc" },
    take: limit * 2, // Fetch extra to filter
  });

  // Filter to rollbackable actions
  const rollbackable = auditLogs
    .filter((log) => isRollbackable(log.resourceType, log.action))
    .slice(0, limit);

  return rollbackable.map((log) => ({
    id: log.id,
    action: log.action,
    resourceType: log.resourceType,
    resourceId: log.resourceId,
    memberId: log.memberId,
    before: log.before as Record<string, unknown> | null,
    after: log.after as Record<string, unknown> | null,
    metadata: log.metadata as Record<string, unknown> | null,
    createdAt: log.createdAt,
  }));
}
