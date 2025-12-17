/**
 * Rollback Policy Registry
 *
 * Defines which actions can be rolled back and under what conditions.
 *
 * Charter Principles:
 * - P5: Every important action must be undoable
 * - N3: No hidden rules - behavior must be explainable
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  RollbackPolicy,
  CascadeCheck,
  CascadeCheckResult,
  AuditLogForRollback,
  policyKey,
} from "./types";

// ============================================================================
// CASCADE CHECK IMPLEMENTATIONS
// ============================================================================

/**
 * Check if an event has any registrations.
 * Non-blocking: warns but doesn't prevent rollback.
 */
export const checkEventRegistrations: CascadeCheck["check"] = async (
  _resourceType: string,
  resourceId: string
): Promise<CascadeCheckResult> => {
  const count = await prisma.eventRegistration.count({
    where: { eventId: resourceId },
  });

  if (count > 0) {
    return {
      passed: false,
      message: `Event has ${count} registration(s). Unpublishing will hide it from members but preserve registrations.`,
      data: { registrationCount: count },
    };
  }

  return {
    passed: true,
    message: "No registrations found",
  };
};

/**
 * Check if capacity change would orphan existing registrations.
 * Blocking: prevents rollback if new capacity < current registrations.
 */
export const checkCapacityChangeImpact: CascadeCheck["check"] = async (
  _resourceType: string,
  resourceId: string,
  auditLog: AuditLogForRollback
): Promise<CascadeCheckResult> => {
  const targetCapacity = auditLog.before?.capacity as number | undefined;
  if (targetCapacity === undefined) {
    return { passed: true, message: "No capacity change in rollback" };
  }

  const confirmedCount = await prisma.eventRegistration.count({
    where: {
      eventId: resourceId,
      status: "CONFIRMED",
    },
  });

  if (targetCapacity < confirmedCount) {
    return {
      passed: false,
      message: `Cannot reduce capacity to ${targetCapacity}: ${confirmedCount} confirmed registrations exist`,
      data: { targetCapacity, confirmedCount },
    };
  }

  return {
    passed: true,
    message: `Capacity change safe: ${confirmedCount} confirmed of ${targetCapacity} target`,
  };
};

/**
 * Check if member has active role assignments.
 * Non-blocking: warns about affected roles.
 */
export const checkMemberRoleAssignments: CascadeCheck["check"] = async (
  _resourceType: string,
  resourceId: string
): Promise<CascadeCheckResult> => {
  const count = await prisma.roleAssignment.count({
    where: {
      memberId: resourceId,
      endDate: null, // Active assignments
    },
  });

  if (count > 0) {
    return {
      passed: false,
      message: `Member has ${count} active role assignment(s). Status change may affect their access.`,
      data: { activeRoleCount: count },
    };
  }

  return {
    passed: true,
    message: "No active role assignments",
  };
};

/**
 * Check if a newer service record supersedes this one.
 * Blocking: prevents reopening if superseded.
 */
export const checkSupersedingServiceRecord: CascadeCheck["check"] = async (
  _resourceType: string,
  resourceId: string
): Promise<CascadeCheckResult> => {
  const record = await prisma.memberServiceHistory.findUnique({
    where: { id: resourceId },
    select: {
      memberId: true,
      committeeId: true,
      serviceType: true,
      endAt: true,
    },
  });

  if (!record || !record.endAt) {
    return { passed: true, message: "Record not found or already open" };
  }

  // Check for newer record for same member + committee + service type
  const superseding = await prisma.memberServiceHistory.findFirst({
    where: {
      memberId: record.memberId,
      committeeId: record.committeeId,
      serviceType: record.serviceType,
      startAt: { gt: record.endAt },
    },
  });

  if (superseding) {
    return {
      passed: false,
      message: "A newer service record exists. Reopening would create overlap.",
      data: { supersedingRecordId: superseding.id },
    };
  }

  return {
    passed: true,
    message: "No superseding record found",
  };
};

/**
 * Check if a transition plan has been applied.
 * Blocking: cannot roll back approvals after application.
 */
export const checkTransitionNotApplied: CascadeCheck["check"] = async (
  _resourceType: string,
  resourceId: string
): Promise<CascadeCheckResult> => {
  const plan = await prisma.transitionPlan.findUnique({
    where: { id: resourceId },
    select: { status: true },
  });

  if (!plan) {
    return { passed: true, message: "Plan not found" };
  }

  if (plan.status === "APPLIED") {
    return {
      passed: false,
      message: "Transition plan has been applied. Approval rollback is no longer possible.",
      data: { status: plan.status },
    };
  }

  return {
    passed: true,
    message: `Plan status is ${plan.status}`,
  };
};

// ============================================================================
// ROLLBACK POLICIES REGISTRY
// ============================================================================

/**
 * Registry of all rollback policies keyed by "ResourceType:Action".
 *
 * Policy classification:
 * - FULLY_REVERSIBLE: Direct undo, no side effects
 * - COMPENSATABLE: Requires compensating action
 * - IRREVERSIBLE: Cannot be undone
 */
export const ROLLBACK_POLICIES: Record<string, RollbackPolicy> = {
  // ==========================================================================
  // EVENT POLICIES
  // ==========================================================================

  [policyKey("Event", "PUBLISH")]: {
    resourceType: "Event",
    action: "PUBLISH",
    classification: "FULLY_REVERSIBLE",
    description: "Unpublish an event that was previously published",
    requiredCapability: "events:edit",
    window: null, // Can unpublish anytime
    allowedActors: "any",
    requiresConfirmation: false,
    cascadeChecks: [
      {
        description: "Check if event has registrations",
        blocking: false,
        check: checkEventRegistrations,
      },
    ],
    warningMessage:
      "Unpublishing will hide this event from members. Existing registrations will be preserved.",
  },

  [policyKey("Event", "UNPUBLISH")]: {
    resourceType: "Event",
    action: "UNPUBLISH",
    classification: "FULLY_REVERSIBLE",
    description: "Re-publish an event that was unpublished",
    requiredCapability: "events:edit",
    window: null,
    allowedActors: "any",
    requiresConfirmation: false,
    cascadeChecks: [],
  },

  [policyKey("Event", "UPDATE")]: {
    resourceType: "Event",
    action: "UPDATE",
    classification: "FULLY_REVERSIBLE",
    description: "Restore event to previous state",
    requiredCapability: "events:edit",
    window: { hours: 72 }, // 3 days
    allowedActors: "any",
    requiresConfirmation: false,
    cascadeChecks: [
      {
        description: "Check if capacity change affects registrations",
        blocking: true,
        check: checkCapacityChangeImpact,
      },
    ],
  },

  // ==========================================================================
  // MEMBER POLICIES
  // ==========================================================================

  [policyKey("Member", "UPDATE")]: {
    resourceType: "Member",
    action: "UPDATE",
    classification: "COMPENSATABLE",
    description: "Revert member changes to previous state",
    requiredCapability: "users:manage",
    window: { hours: 168, escalationCapability: "admin:full" }, // 7 days
    allowedActors: "any",
    requiresConfirmation: true,
    cascadeChecks: [
      {
        description: "Check if member has active role assignments",
        blocking: false,
        check: checkMemberRoleAssignments,
      },
    ],
    warningMessage:
      "Reverting membership status may affect the member's access to member-only features.",
  },

  // ==========================================================================
  // ROLE ASSIGNMENT POLICIES
  // ==========================================================================

  [policyKey("RoleAssignment", "CREATE")]: {
    resourceType: "RoleAssignment",
    action: "CREATE",
    classification: "COMPENSATABLE",
    description: "End a role assignment that was recently created",
    requiredCapability: "users:manage",
    window: { hours: 24 },
    allowedActors: "any",
    requiresConfirmation: true,
    cascadeChecks: [],
    warningMessage:
      "This will set an end date on the role assignment, not delete it.",
  },

  // ==========================================================================
  // SERVICE HISTORY POLICIES
  // ==========================================================================

  [policyKey("ServiceRecord", "UPDATE")]: {
    resourceType: "ServiceRecord",
    action: "UPDATE",
    classification: "COMPENSATABLE",
    description: "Reopen a service record that was closed",
    requiredCapability: "users:manage",
    window: { hours: 72 },
    allowedActors: "any",
    requiresConfirmation: true,
    cascadeChecks: [
      {
        description: "Check for superseding service records",
        blocking: true,
        check: checkSupersedingServiceRecord,
      },
    ],
    warningMessage: "Reopening will clear the end date from this service record.",
  },

  // ==========================================================================
  // TRANSITION PLAN POLICIES
  // ==========================================================================

  [policyKey("TransitionPlan", "UPDATE")]: {
    resourceType: "TransitionPlan",
    action: "UPDATE",
    classification: "FULLY_REVERSIBLE",
    description: "Revoke approval or revert transition plan changes",
    requiredCapability: "transitions:approve",
    window: null, // Until applied
    allowedActors: "any",
    requiresConfirmation: true,
    cascadeChecks: [
      {
        description: "Check if transition has been applied",
        blocking: true,
        check: checkTransitionNotApplied,
      },
    ],
    warningMessage:
      "Revoking approval will return the plan to PENDING_APPROVAL status.",
  },

  // ==========================================================================
  // PAGE/CONTENT POLICIES
  // ==========================================================================

  [policyKey("Page", "PUBLISH")]: {
    resourceType: "Page",
    action: "PUBLISH",
    classification: "FULLY_REVERSIBLE",
    description: "Unpublish a page",
    requiredCapability: "publishing:manage",
    window: null,
    allowedActors: "any",
    requiresConfirmation: false,
    cascadeChecks: [],
  },

  [policyKey("Page", "UPDATE")]: {
    resourceType: "Page",
    action: "UPDATE",
    classification: "FULLY_REVERSIBLE",
    description: "Restore page to previous version",
    requiredCapability: "publishing:manage",
    window: { hours: 72 },
    allowedActors: "any",
    requiresConfirmation: false,
    cascadeChecks: [],
  },

  // ==========================================================================
  // IRREVERSIBLE ACTIONS
  // ==========================================================================

  [policyKey("MessageCampaign", "SEND")]: {
    resourceType: "MessageCampaign",
    action: "SEND",
    classification: "IRREVERSIBLE",
    description: "Email campaigns cannot be recalled once sent",
    requiredCapability: "comms:send",
    window: null,
    allowedActors: "any",
    requiresConfirmation: false,
    cascadeChecks: [],
    warningMessage:
      "SEND actions are irreversible. Emails cannot be recalled once sent. " +
      "If you sent in error, consider sending a correction email.",
  },

  // Note: EventRegistration refunds and TransitionPlan applications are
  // irreversible actions. They are logged as UPDATE actions with specific
  // status changes (REFUNDED, APPLIED). These cannot be rolled back:
  // - Refunds: Financial transactions cannot be reversed through the system
  // - Applied transitions: Service history records require manual correction
};

/**
 * Irreversible actions that are not in the policy registry.
 * These are documented here for reference and UI display.
 */
export const IRREVERSIBLE_ACTIONS = [
  {
    resourceType: "EventRegistration",
    statusChange: "REFUNDED",
    description: "Refunds cannot be reversed through the system",
    warningMessage:
      "Refunds are irreversible. If issued in error, a new payment must be collected.",
  },
  {
    resourceType: "TransitionPlan",
    statusChange: "APPLIED",
    description: "Applied transitions cannot be automatically reversed",
    warningMessage:
      "Applied transitions create service history records that cannot be " +
      "automatically reversed. Manual correction through new service records is required.",
  },
];

// ============================================================================
// POLICY LOOKUP FUNCTIONS
// ============================================================================

/**
 * Get the rollback policy for a resource type and action.
 * Returns null if no policy exists (action is not rollbackable).
 */
export function getRollbackPolicy(
  resourceType: string,
  action: AuditAction
): RollbackPolicy | null {
  return ROLLBACK_POLICIES[policyKey(resourceType, action)] ?? null;
}

/**
 * Check if an action is potentially rollbackable.
 * Note: This doesn't check time windows or cascade effects.
 */
export function isRollbackable(
  resourceType: string,
  action: AuditAction
): boolean {
  const policy = getRollbackPolicy(resourceType, action);
  return policy !== null && policy.classification !== "IRREVERSIBLE";
}

/**
 * Get all policies for a specific resource type.
 */
export function getPoliciesForResource(resourceType: string): RollbackPolicy[] {
  return Object.values(ROLLBACK_POLICIES).filter(
    (p) => p.resourceType === resourceType
  );
}

/**
 * Get all irreversible action policies (for documentation/UI).
 */
export function getIrreversiblePolicies(): RollbackPolicy[] {
  return Object.values(ROLLBACK_POLICIES).filter(
    (p) => p.classification === "IRREVERSIBLE"
  );
}
