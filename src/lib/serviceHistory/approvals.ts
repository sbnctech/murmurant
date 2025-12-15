/**
 * Transition Approval Workflow
 *
 * Handles the dual approval process requiring both President and VP Activities
 * to approve transition plans before they can be applied.
 */

import { prisma } from "@/lib/prisma";
import { TransitionStatus } from "@prisma/client";
import type { ApproverRole, ApprovalResult } from "./types";

/**
 * Check if a member can approve as a specific role
 *
 * This checks if the member currently holds the appropriate board position:
 * - "president" role requires active BOARD_OFFICER service with "President" title
 * - "vp-activities" role requires active BOARD_OFFICER service with "VP Activities" title
 */
export async function canApprove(
  memberId: string,
  role: ApproverRole
): Promise<boolean> {
  const roleTitle = role === "president" ? "President" : "VP Activities";

  const activeService = await prisma.memberServiceHistory.findFirst({
    where: {
      memberId,
      serviceType: "BOARD_OFFICER",
      roleTitle,
      endAt: null,
    },
  });

  return activeService !== null;
}

/**
 * Record an approval for a transition plan
 *
 * The plan must be in PENDING_APPROVAL status.
 * If both approvals are now recorded, the plan moves to APPROVED status.
 */
export async function recordApproval(
  planId: string,
  approverId: string,
  role: ApproverRole
): Promise<ApprovalResult> {
  // Verify the approver can approve for this role
  const canApproveRole = await canApprove(approverId, role);
  if (!canApproveRole) {
    throw new Error(`Member ${approverId} is not authorized to approve as ${role}`);
  }

  const plan = await prisma.transitionPlan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    throw new Error(`Transition plan not found: ${planId}`);
  }

  if (plan.status !== TransitionStatus.PENDING_APPROVAL) {
    throw new Error(`Can only approve plans in PENDING_APPROVAL status`);
  }

  const now = new Date();
  const updateData: {
    presidentApprovedAt?: Date;
    presidentApprovedById?: string;
    vpActivitiesApprovedAt?: Date;
    vpActivitiesApprovedById?: string;
    status?: TransitionStatus;
  } = {};

  if (role === "president") {
    if (plan.presidentApprovedAt !== null) {
      throw new Error(`Plan already approved by president`);
    }
    updateData.presidentApprovedAt = now;
    updateData.presidentApprovedById = approverId;
  } else {
    if (plan.vpActivitiesApprovedAt !== null) {
      throw new Error(`Plan already approved by VP Activities`);
    }
    updateData.vpActivitiesApprovedAt = now;
    updateData.vpActivitiesApprovedById = approverId;
  }

  // Check if this approval completes the dual approval requirement
  const willBeFullyApproved =
    (role === "president" && plan.vpActivitiesApprovedAt !== null) ||
    (role === "vp-activities" && plan.presidentApprovedAt !== null);

  if (willBeFullyApproved) {
    updateData.status = TransitionStatus.APPROVED;
  }

  await prisma.transitionPlan.update({
    where: { id: planId },
    data: updateData,
  });

  return {
    success: true,
    planId,
    approverRole: role,
    approvedAt: now.toISOString(),
    fullyApproved: willBeFullyApproved,
  };
}

/**
 * Check if a transition plan is fully approved
 */
export async function isFullyApproved(planId: string): Promise<boolean> {
  const plan = await prisma.transitionPlan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    throw new Error(`Transition plan not found: ${planId}`);
  }

  return (
    plan.presidentApprovedAt !== null && plan.vpActivitiesApprovedAt !== null
  );
}

/**
 * Get approval status for a transition plan
 */
export async function getApprovalStatus(planId: string): Promise<{
  presidentApproved: boolean;
  presidentApprovedAt: string | null;
  presidentApprovedByName: string | null;
  vpActivitiesApproved: boolean;
  vpActivitiesApprovedAt: string | null;
  vpActivitiesApprovedByName: string | null;
  fullyApproved: boolean;
}> {
  const plan = await prisma.transitionPlan.findUnique({
    where: { id: planId },
    include: {
      presidentApprovedBy: { select: { firstName: true, lastName: true } },
      vpActivitiesApprovedBy: { select: { firstName: true, lastName: true } },
    },
  });

  if (!plan) {
    throw new Error(`Transition plan not found: ${planId}`);
  }

  return {
    presidentApproved: plan.presidentApprovedAt !== null,
    presidentApprovedAt: plan.presidentApprovedAt?.toISOString() ?? null,
    presidentApprovedByName: plan.presidentApprovedBy
      ? `${plan.presidentApprovedBy.firstName} ${plan.presidentApprovedBy.lastName}`
      : null,
    vpActivitiesApproved: plan.vpActivitiesApprovedAt !== null,
    vpActivitiesApprovedAt: plan.vpActivitiesApprovedAt?.toISOString() ?? null,
    vpActivitiesApprovedByName: plan.vpActivitiesApprovedBy
      ? `${plan.vpActivitiesApprovedBy.firstName} ${plan.vpActivitiesApprovedBy.lastName}`
      : null,
    fullyApproved:
      plan.presidentApprovedAt !== null && plan.vpActivitiesApprovedAt !== null,
  };
}

/**
 * Revoke an approval (returns plan to PENDING_APPROVAL if it was APPROVED)
 *
 * Only the approver who gave the approval can revoke it.
 */
export async function revokeApproval(
  planId: string,
  revokerId: string,
  role: ApproverRole
): Promise<void> {
  const plan = await prisma.transitionPlan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    throw new Error(`Transition plan not found: ${planId}`);
  }

  if (
    plan.status !== TransitionStatus.PENDING_APPROVAL &&
    plan.status !== TransitionStatus.APPROVED
  ) {
    throw new Error(`Can only revoke approvals for PENDING_APPROVAL or APPROVED plans`);
  }

  const updateData: {
    presidentApprovedAt?: null;
    presidentApprovedById?: null;
    vpActivitiesApprovedAt?: null;
    vpActivitiesApprovedById?: null;
    status?: TransitionStatus;
  } = {};

  if (role === "president") {
    if (plan.presidentApprovedById !== revokerId) {
      throw new Error(`Only the original approver can revoke their approval`);
    }
    updateData.presidentApprovedAt = null;
    updateData.presidentApprovedById = null;
  } else {
    if (plan.vpActivitiesApprovedById !== revokerId) {
      throw new Error(`Only the original approver can revoke their approval`);
    }
    updateData.vpActivitiesApprovedAt = null;
    updateData.vpActivitiesApprovedById = null;
  }

  // If plan was APPROVED, it must go back to PENDING_APPROVAL
  if (plan.status === TransitionStatus.APPROVED) {
    updateData.status = TransitionStatus.PENDING_APPROVAL;
  }

  await prisma.transitionPlan.update({
    where: { id: planId },
    data: updateData,
  });
}
