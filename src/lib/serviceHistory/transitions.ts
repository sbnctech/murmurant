/**
 * Transition Plan Operations
 *
 * Handles creation, modification, and application of leadership transitions.
 * Transitions move through a state machine: DRAFT -> PENDING_APPROVAL -> APPROVED -> APPLIED
 */

import { prisma } from "@/lib/prisma";
import { TransitionStatus, ServiceType } from "@prisma/client";
import type {
  TransitionPlanSummary,
  TransitionPlanDetail,
  TransitionAssignmentDetail,
  CreateTransitionPlanInput,
  CreateAssignmentInput,
  ApplyTransitionResult,
  PaginationParams,
  PaginatedResult,
} from "./types";

/**
 * Transform a Prisma transition plan to summary format
 */
function toTransitionPlanSummary(
  plan: {
    id: string;
    name: string;
    description: string | null;
    targetTermId: string;
    targetTerm: { name: string };
    effectiveAt: Date;
    status: TransitionStatus;
    presidentApprovedAt: Date | null;
    presidentApprovedBy: { firstName: string; lastName: string } | null;
    vpActivitiesApprovedAt: Date | null;
    vpActivitiesApprovedBy: { firstName: string; lastName: string } | null;
    createdAt: Date;
    _count: { assignments: number };
  }
): TransitionPlanSummary {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    targetTermId: plan.targetTermId,
    targetTermName: plan.targetTerm.name,
    effectiveAt: plan.effectiveAt.toISOString(),
    status: plan.status,
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
    assignmentCount: plan._count.assignments,
    createdAt: plan.createdAt.toISOString(),
  };
}

/**
 * Transform an assignment to detail format
 */
function toAssignmentDetail(
  assignment: {
    id: string;
    memberId: string;
    member: { firstName: string; lastName: string };
    serviceType: ServiceType;
    roleTitle: string;
    committeeId: string | null;
    committee: { name: string } | null;
    isOutgoing: boolean;
    existingServiceId: string | null;
    notes: string | null;
  }
): TransitionAssignmentDetail {
  return {
    id: assignment.id,
    memberId: assignment.memberId,
    memberName: `${assignment.member.firstName} ${assignment.member.lastName}`,
    serviceType: assignment.serviceType,
    roleTitle: assignment.roleTitle,
    committeeId: assignment.committeeId,
    committeeName: assignment.committee?.name ?? null,
    isOutgoing: assignment.isOutgoing,
    existingServiceId: assignment.existingServiceId,
    notes: assignment.notes,
  };
}

/**
 * Common include for transition plan queries
 */
const transitionPlanInclude = {
  targetTerm: { select: { name: true } },
  presidentApprovedBy: { select: { firstName: true, lastName: true } },
  vpActivitiesApprovedBy: { select: { firstName: true, lastName: true } },
  createdBy: { select: { firstName: true, lastName: true } },
  appliedBy: { select: { firstName: true, lastName: true } },
  _count: { select: { assignments: true } },
};

const assignmentInclude = {
  member: { select: { firstName: true, lastName: true } },
  committee: { select: { name: true } },
};

/**
 * Create a new transition plan
 */
export async function createTransitionPlan(
  data: CreateTransitionPlanInput,
  createdById: string
): Promise<TransitionPlanSummary> {
  const plan = await prisma.transitionPlan.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      targetTermId: data.targetTermId,
      effectiveAt: data.effectiveAt,
      status: TransitionStatus.DRAFT,
      createdById,
    },
    include: transitionPlanInclude,
  });

  return toTransitionPlanSummary(plan);
}

/**
 * Get a transition plan by ID with all details
 */
export async function getTransitionPlan(
  planId: string
): Promise<TransitionPlanDetail | null> {
  const plan = await prisma.transitionPlan.findUnique({
    where: { id: planId },
    include: {
      ...transitionPlanInclude,
      assignments: {
        include: assignmentInclude,
        orderBy: [{ isOutgoing: "desc" }, { roleTitle: "asc" }],
      },
    },
  });

  if (!plan) return null;

  const incomingAssignments = plan.assignments
    .filter((a) => !a.isOutgoing)
    .map(toAssignmentDetail);

  const outgoingAssignments = plan.assignments
    .filter((a) => a.isOutgoing)
    .map(toAssignmentDetail);

  return {
    ...toTransitionPlanSummary(plan),
    appliedAt: plan.appliedAt?.toISOString() ?? null,
    appliedByName: plan.appliedBy
      ? `${plan.appliedBy.firstName} ${plan.appliedBy.lastName}`
      : null,
    createdByName: plan.createdBy
      ? `${plan.createdBy.firstName} ${plan.createdBy.lastName}`
      : null,
    incomingAssignments,
    outgoingAssignments,
  };
}

/**
 * List transition plans with filters and pagination
 */
export async function listTransitionPlans(
  filters: {
    status?: TransitionStatus;
    targetTermId?: string;
  },
  pagination: PaginationParams
): Promise<PaginatedResult<TransitionPlanSummary>> {
  const where: { status?: TransitionStatus; targetTermId?: string } = {};
  if (filters.status) where.status = filters.status;
  if (filters.targetTermId) where.targetTermId = filters.targetTermId;

  const skip = (pagination.page - 1) * pagination.limit;

  const [plans, totalItems] = await Promise.all([
    prisma.transitionPlan.findMany({
      where,
      include: transitionPlanInclude,
      orderBy: [{ effectiveAt: "desc" }, { createdAt: "desc" }],
      skip,
      take: pagination.limit,
    }),
    prisma.transitionPlan.count({ where }),
  ]);

  const totalPages = Math.ceil(totalItems / pagination.limit);

  return {
    items: plans.map(toTransitionPlanSummary),
    page: pagination.page,
    limit: pagination.limit,
    totalItems,
    totalPages,
    hasNext: pagination.page < totalPages,
    hasPrev: pagination.page > 1,
  };
}

/**
 * Update a transition plan (DRAFT only)
 */
export async function updateTransitionPlan(
  planId: string,
  data: Partial<CreateTransitionPlanInput>
): Promise<TransitionPlanSummary> {
  const existing = await prisma.transitionPlan.findUnique({
    where: { id: planId },
  });

  if (!existing) {
    throw new Error(`Transition plan not found: ${planId}`);
  }

  if (existing.status !== TransitionStatus.DRAFT) {
    throw new Error(`Can only update plans in DRAFT status`);
  }

  const plan = await prisma.transitionPlan.update({
    where: { id: planId },
    data: {
      name: data.name,
      description: data.description,
      targetTermId: data.targetTermId,
      effectiveAt: data.effectiveAt,
    },
    include: transitionPlanInclude,
  });

  return toTransitionPlanSummary(plan);
}

/**
 * Delete a transition plan (DRAFT or CANCELLED only)
 */
export async function deleteTransitionPlan(planId: string): Promise<void> {
  const existing = await prisma.transitionPlan.findUnique({
    where: { id: planId },
  });

  if (!existing) {
    throw new Error(`Transition plan not found: ${planId}`);
  }

  if (
    existing.status !== TransitionStatus.DRAFT &&
    existing.status !== TransitionStatus.CANCELLED
  ) {
    throw new Error(`Can only delete plans in DRAFT or CANCELLED status`);
  }

  await prisma.transitionPlan.delete({ where: { id: planId } });
}

/**
 * Add an assignment to a transition plan
 */
export async function addAssignment(
  planId: string,
  data: CreateAssignmentInput
): Promise<TransitionAssignmentDetail> {
  const plan = await prisma.transitionPlan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    throw new Error(`Transition plan not found: ${planId}`);
  }

  if (plan.status !== TransitionStatus.DRAFT) {
    throw new Error(`Can only add assignments to DRAFT plans`);
  }

  const assignment = await prisma.transitionAssignment.create({
    data: {
      transitionPlanId: planId,
      memberId: data.memberId,
      serviceType: data.serviceType,
      roleTitle: data.roleTitle,
      committeeId: data.committeeId ?? null,
      isOutgoing: data.isOutgoing,
      existingServiceId: data.existingServiceId ?? null,
      notes: data.notes ?? null,
    },
    include: assignmentInclude,
  });

  return toAssignmentDetail(assignment);
}

/**
 * Remove an assignment from a transition plan
 */
export async function removeAssignment(assignmentId: string): Promise<void> {
  const assignment = await prisma.transitionAssignment.findUnique({
    where: { id: assignmentId },
    include: { transitionPlan: true },
  });

  if (!assignment) {
    throw new Error(`Assignment not found: ${assignmentId}`);
  }

  if (assignment.transitionPlan.status !== TransitionStatus.DRAFT) {
    throw new Error(`Can only remove assignments from DRAFT plans`);
  }

  await prisma.transitionAssignment.delete({ where: { id: assignmentId } });
}

/**
 * Auto-detect outgoing assignments based on current active service records
 *
 * For each incoming assignment, finds if there's a current holder of that role
 * and creates corresponding outgoing assignments.
 */
export async function detectOutgoingAssignments(
  planId: string
): Promise<TransitionAssignmentDetail[]> {
  const plan = await prisma.transitionPlan.findUnique({
    where: { id: planId },
    include: {
      assignments: {
        where: { isOutgoing: false },
      },
    },
  });

  if (!plan) {
    throw new Error(`Transition plan not found: ${planId}`);
  }

  if (plan.status !== TransitionStatus.DRAFT) {
    throw new Error(`Can only detect outgoing for DRAFT plans`);
  }

  const createdAssignments: TransitionAssignmentDetail[] = [];

  for (const incoming of plan.assignments) {
    // Find current active service record for this role
    const currentService = await prisma.memberServiceHistory.findFirst({
      where: {
        serviceType: incoming.serviceType,
        roleTitle: incoming.roleTitle,
        committeeId: incoming.committeeId,
        endAt: null,
      },
      include: {
        member: { select: { firstName: true, lastName: true } },
      },
    });

    if (currentService && currentService.memberId !== incoming.memberId) {
      // Check if outgoing assignment already exists
      const existingOutgoing = await prisma.transitionAssignment.findFirst({
        where: {
          transitionPlanId: planId,
          existingServiceId: currentService.id,
          isOutgoing: true,
        },
      });

      if (!existingOutgoing) {
        const assignment = await prisma.transitionAssignment.create({
          data: {
            transitionPlanId: planId,
            memberId: currentService.memberId,
            serviceType: currentService.serviceType,
            roleTitle: currentService.roleTitle,
            committeeId: currentService.committeeId,
            isOutgoing: true,
            existingServiceId: currentService.id,
            notes: `Auto-detected from current service record`,
          },
          include: assignmentInclude,
        });

        createdAssignments.push(toAssignmentDetail(assignment));
      }
    }
  }

  return createdAssignments;
}

/**
 * Submit a transition plan for approval
 */
export async function submitForApproval(
  planId: string
): Promise<TransitionPlanSummary> {
  const plan = await prisma.transitionPlan.findUnique({
    where: { id: planId },
    include: { _count: { select: { assignments: true } } },
  });

  if (!plan) {
    throw new Error(`Transition plan not found: ${planId}`);
  }

  if (plan.status !== TransitionStatus.DRAFT) {
    throw new Error(`Can only submit DRAFT plans for approval`);
  }

  if (plan._count.assignments === 0) {
    throw new Error(`Cannot submit plan with no assignments`);
  }

  const updated = await prisma.transitionPlan.update({
    where: { id: planId },
    data: { status: TransitionStatus.PENDING_APPROVAL },
    include: transitionPlanInclude,
  });

  return toTransitionPlanSummary(updated);
}

/**
 * Cancel a transition plan
 */
export async function cancelTransitionPlan(
  planId: string
): Promise<TransitionPlanSummary> {
  const plan = await prisma.transitionPlan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    throw new Error(`Transition plan not found: ${planId}`);
  }

  if (plan.status === TransitionStatus.APPLIED) {
    throw new Error(`Cannot cancel an already applied plan`);
  }

  const updated = await prisma.transitionPlan.update({
    where: { id: planId },
    data: { status: TransitionStatus.CANCELLED },
    include: transitionPlanInclude,
  });

  return toTransitionPlanSummary(updated);
}

/**
 * Apply a transition plan
 *
 * This executes the transition:
 * 1. Closes all outgoing service records (sets endAt)
 * 2. Creates new service records for all incoming assignments
 * 3. Marks the plan as APPLIED
 *
 * Must be fully approved (both president and VP activities) or APPROVED status.
 */
export async function applyTransition(
  planId: string,
  appliedById: string
): Promise<ApplyTransitionResult> {
  const plan = await prisma.transitionPlan.findUnique({
    where: { id: planId },
    include: {
      targetTerm: { select: { name: true } },
      assignments: {
        include: {
          committee: { select: { name: true } },
        },
      },
    },
  });

  if (!plan) {
    throw new Error(`Transition plan not found: ${planId}`);
  }

  if (plan.status !== TransitionStatus.APPROVED) {
    throw new Error(`Can only apply APPROVED plans`);
  }

  const now = new Date();
  let recordsClosed = 0;
  let recordsCreated = 0;

  await prisma.$transaction(async (tx) => {
    // Close outgoing service records
    const outgoingAssignments = plan.assignments.filter((a) => a.isOutgoing);
    for (const assignment of outgoingAssignments) {
      if (assignment.existingServiceId) {
        await tx.memberServiceHistory.update({
          where: { id: assignment.existingServiceId },
          data: { endAt: plan.effectiveAt },
        });
        recordsClosed++;
      }
    }

    // Create incoming service records
    const incomingAssignments = plan.assignments.filter((a) => !a.isOutgoing);
    for (const assignment of incomingAssignments) {
      await tx.memberServiceHistory.create({
        data: {
          memberId: assignment.memberId,
          serviceType: assignment.serviceType,
          roleTitle: assignment.roleTitle,
          committeeId: assignment.committeeId,
          committeeName: assignment.committee?.name ?? null,
          termId: plan.targetTermId,
          termName: plan.targetTerm.name,
          startAt: plan.effectiveAt,
          transitionPlanId: planId,
          notes: assignment.notes,
          createdById: appliedById,
        },
      });
      recordsCreated++;
    }

    // Mark plan as applied
    await tx.transitionPlan.update({
      where: { id: planId },
      data: {
        status: TransitionStatus.APPLIED,
        appliedAt: now,
        appliedById,
      },
    });
  });

  return {
    success: true,
    planId,
    recordsClosed,
    recordsCreated,
    appliedAt: now.toISOString(),
  };
}

/**
 * Get pending transitions that are due for application
 */
export async function getDueTransitions(): Promise<TransitionPlanSummary[]> {
  const now = new Date();

  const plans = await prisma.transitionPlan.findMany({
    where: {
      status: TransitionStatus.APPROVED,
      effectiveAt: { lte: now },
      appliedAt: null,
    },
    include: transitionPlanInclude,
    orderBy: { effectiveAt: "asc" },
  });

  return plans.map(toTransitionPlanSummary);
}
