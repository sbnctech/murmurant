/**
 * Rollback Policies Registry
 *
 * Charter Principles:
 * - P4: No hidden rules - rollback behavior is policy-driven
 * - P5: Every important action must be undoable
 *
 * Defines rollback policies for each resource type and action.
 */

import { prisma } from "@/lib/prisma";
import {
  RollbackPolicy,
  CascadeCheckResult,
  policyKey,
  RollbackWindow,
} from "./types";

// =============================================================================
// TIME WINDOWS
// =============================================================================

export const STANDARD_WINDOW: RollbackWindow = {
  maxAgeMs: 24 * 60 * 60 * 1000, // 24 hours
  description: "Within 24 hours of original action",
};

export const EXTENDED_WINDOW: RollbackWindow = {
  maxAgeMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  description: "Within 7 days of original action",
};

// =============================================================================
// CASCADE CHECK FUNCTIONS
// =============================================================================

/**
 * Check if event has registrations.
 */
export async function checkEventRegistrations(
  resourceId: string
): Promise<CascadeCheckResult> {
  const count = await prisma.eventRegistration.count({
    where: {
      eventId: resourceId,
      status: { in: ["PENDING", "CONFIRMED"] },
    },
  });

  return {
    passed: count === 0,
    blocking: false, // Warning only
    message:
      count > 0
        ? `Event has ${count} active registration(s). Unpublishing will hide event from members.`
        : "No active registrations",
  };
}

/**
 * Check if capacity change would affect existing registrations.
 */
export async function checkCapacityChangeImpact(
  resourceId: string
): Promise<CascadeCheckResult> {
  const event = await prisma.event.findUnique({
    where: { id: resourceId },
    include: {
      _count: {
        select: {
          registrations: {
            where: { status: "CONFIRMED" },
          },
        },
      },
    },
  });

  if (!event) {
    return { passed: false, blocking: true, message: "Event not found" };
  }

  const confirmedCount = event._count.registrations;

  // If rolling back would set capacity below confirmed registrations, block
  return {
    passed: true,
    blocking: false,
    message:
      confirmedCount > 0
        ? `Event has ${confirmedCount} confirmed registration(s)`
        : "No confirmed registrations",
  };
}

/**
 * Check if member has role assignments that would be affected.
 */
export async function checkMemberRoleAssignments(
  resourceId: string
): Promise<CascadeCheckResult> {
  const count = await prisma.roleAssignment.count({
    where: {
      memberId: resourceId,
      endDate: null, // Active assignments
    },
  });

  return {
    passed: true,
    blocking: false,
    message:
      count > 0
        ? `Member has ${count} active role assignment(s)`
        : "No active role assignments",
  };
}

/**
 * Check if a superseding service record exists.
 */
export async function checkSupersedingServiceRecord(
  _resourceId: string
): Promise<CascadeCheckResult> {
  // TODO: Implement check for newer service records
  // This would query memberServiceHistory for records with later startAt
  return {
    passed: true,
    blocking: false,
    message: "No superseding service record",
  };
}

/**
 * Check if transition plan has been applied.
 */
export async function checkTransitionNotApplied(
  resourceId: string
): Promise<CascadeCheckResult> {
  const plan = await prisma.transitionPlan.findUnique({
    where: { id: resourceId },
  });

  if (!plan) {
    return { passed: false, blocking: true, message: "Transition plan not found" };
  }

  // Check if applied by looking at appliedAt field
  const isApplied = plan.appliedAt !== null;

  return {
    passed: !isApplied,
    blocking: isApplied,
    message: isApplied
      ? "Transition plan has already been applied - cannot be rolled back"
      : "Transition plan has not been applied",
  };
}

// =============================================================================
// POLICY REGISTRY
// =============================================================================

export const ROLLBACK_POLICIES: Map<string, RollbackPolicy> = new Map([
  // Event Policies
  [
    policyKey("Event", "PUBLISH"),
    {
      resourceType: "Event",
      action: "PUBLISH",
      classification: "COMPENSATABLE",
      description:
        "Can unpublish event if no confirmed registrations exist. " +
        "Existing registrations will be preserved but hidden from members.",
      requiredCapability: "admin:full",
      window: STANDARD_WINDOW,
      requiresConfirmation: true,
      cascadeChecks: [checkEventRegistrations],
      warningMessage:
        "Unpublishing will hide this event from member view. " +
        "Any existing registrations will remain in the database.",
    },
  ],
  [
    policyKey("Event", "UNPUBLISH"),
    {
      resourceType: "Event",
      action: "UNPUBLISH",
      classification: "FULLY_REVERSIBLE",
      description: "Can re-publish event at any time.",
      requiredCapability: "admin:full",
      window: null, // No time limit
      requiresConfirmation: false,
      cascadeChecks: [],
    },
  ],
  [
    policyKey("Event", "UPDATE"),
    {
      resourceType: "Event",
      action: "UPDATE",
      classification: "FULLY_REVERSIBLE",
      description:
        "Can restore previous event details from audit log within 72 hours.",
      requiredCapability: "admin:full",
      window: { maxAgeMs: 72 * 60 * 60 * 1000, description: "Within 72 hours" },
      requiresConfirmation: false,
      cascadeChecks: [checkCapacityChangeImpact],
    },
  ],

  // Member Policies
  [
    policyKey("Member", "UPDATE"),
    {
      resourceType: "Member",
      action: "UPDATE",
      classification: "FULLY_REVERSIBLE",
      description: "Can restore previous member details from audit log.",
      requiredCapability: "admin:full",
      window: EXTENDED_WINDOW,
      requiresConfirmation: false,
      cascadeChecks: [checkMemberRoleAssignments],
    },
  ],

  // RoleAssignment Policies
  [
    policyKey("RoleAssignment", "CREATE"),
    {
      resourceType: "RoleAssignment",
      action: "CREATE",
      classification: "COMPENSATABLE",
      description: "Can end role assignment by setting endDate.",
      requiredCapability: "admin:full",
      window: STANDARD_WINDOW,
      requiresConfirmation: true,
      cascadeChecks: [],
      warningMessage: "Ending this role assignment may affect member permissions.",
    },
  ],
  [
    policyKey("RoleAssignment", "DELETE"),
    {
      resourceType: "RoleAssignment",
      action: "DELETE",
      classification: "COMPENSATABLE",
      description: "Can restore role assignment from audit log.",
      requiredCapability: "admin:full",
      window: EXTENDED_WINDOW,
      requiresConfirmation: true,
      cascadeChecks: [],
    },
  ],

  // MemberServiceHistory Policies
  [
    policyKey("MemberServiceHistory", "UPDATE"),
    {
      resourceType: "MemberServiceHistory",
      action: "UPDATE",
      classification: "FULLY_REVERSIBLE",
      description: "Can restore previous service record state.",
      requiredCapability: "admin:full",
      window: EXTENDED_WINDOW,
      requiresConfirmation: false,
      cascadeChecks: [checkSupersedingServiceRecord],
    },
  ],

  // TransitionPlan Policies
  [
    policyKey("TransitionPlan", "UPDATE"),
    {
      resourceType: "TransitionPlan",
      action: "UPDATE",
      classification: "FULLY_REVERSIBLE",
      description:
        "Can restore previous approval state if plan not yet applied.",
      requiredCapability: "admin:full",
      window: null,
      requiresConfirmation: false,
      cascadeChecks: [checkTransitionNotApplied],
    },
  ],

  // Page Policies
  [
    policyKey("Page", "PUBLISH"),
    {
      resourceType: "Page",
      action: "PUBLISH",
      classification: "FULLY_REVERSIBLE",
      description: "Can unpublish page at any time.",
      requiredCapability: "admin:full",
      window: null,
      requiresConfirmation: false,
      cascadeChecks: [],
    },
  ],
  [
    policyKey("Page", "UNPUBLISH"),
    {
      resourceType: "Page",
      action: "UNPUBLISH",
      classification: "FULLY_REVERSIBLE",
      description: "Can re-publish page at any time.",
      requiredCapability: "admin:full",
      window: null,
      requiresConfirmation: false,
      cascadeChecks: [],
    },
  ],
  [
    policyKey("Page", "UPDATE"),
    {
      resourceType: "Page",
      action: "UPDATE",
      classification: "FULLY_REVERSIBLE",
      description: "Can restore previous page content from audit log.",
      requiredCapability: "admin:full",
      window: EXTENDED_WINDOW,
      requiresConfirmation: false,
      cascadeChecks: [],
    },
  ],

  // MessageCampaign Policies (IRREVERSIBLE)
  [
    policyKey("MessageCampaign", "SEND"),
    {
      resourceType: "MessageCampaign",
      action: "SEND",
      classification: "IRREVERSIBLE",
      description: "Sent messages cannot be recalled once delivered.",
      requiredCapability: "admin:full",
      window: null,
      requiresConfirmation: false,
      cascadeChecks: [],
      warningMessage:
        "SEND actions are irreversible. Emails cannot be recalled once sent.",
    },
  ],
]);

// =============================================================================
// POLICY LOOKUP FUNCTIONS
// =============================================================================

/**
 * Get the rollback policy for a resource type and action.
 */
export function getRollbackPolicy(
  resourceType: string,
  action: string
): RollbackPolicy | null {
  return ROLLBACK_POLICIES.get(policyKey(resourceType, action)) ?? null;
}

/**
 * Check if an action is rollbackable.
 */
export function isRollbackable(resourceType: string, action: string): boolean {
  const policy = getRollbackPolicy(resourceType, action);
  return policy !== null && policy.classification !== "IRREVERSIBLE";
}

/**
 * Get all policies for a resource type.
 */
export function getPoliciesForResource(resourceType: string): RollbackPolicy[] {
  return Array.from(ROLLBACK_POLICIES.values()).filter(
    (p) => p.resourceType === resourceType
  );
}

/**
 * Get all irreversible policies.
 */
export function getIrreversiblePolicies(): RollbackPolicy[] {
  return Array.from(ROLLBACK_POLICIES.values()).filter(
    (p) => p.classification === "IRREVERSIBLE"
  );
}
