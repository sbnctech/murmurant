/**
 * Motions Library - Meeting motion CRUD operations
 *
 * Copyright © 2025 Murmurant, Inc.
 *
 * Motions are linked to meetings and track:
 * - Motion text
 * - Who moved/seconded
 * - Vote tallies
 * - Result (passed/failed/tabled/withdrawn)
 */

import { prisma } from "@/lib/prisma";
import { MotionResult, Prisma } from "@prisma/client";
import type {
  CreateMotionInput,
  UpdateMotionInput,
  RecordVoteInput,
  PaginationInput,
} from "./schemas";

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Create a new motion for a meeting.
 * Automatically assigns the next motion number.
 */
export async function createMotion(
  data: CreateMotionInput,
  createdById: string
) {
  // Get the next motion number for this meeting
  const lastMotion = await prisma.governanceMotion.findFirst({
    where: { meetingId: data.meetingId },
    orderBy: { motionNumber: "desc" },
    select: { motionNumber: true },
  });

  const motionNumber = (lastMotion?.motionNumber ?? 0) + 1;

  return prisma.governanceMotion.create({
    data: {
      meetingId: data.meetingId,
      motionNumber,
      motionText: data.motionText,
      movedById: data.movedById,
      secondedById: data.secondedById,
      createdById,
    },
    include: {
      meeting: { select: { id: true, date: true, type: true } },
      movedBy: { select: { id: true, firstName: true, lastName: true } },
      secondedBy: { select: { id: true, firstName: true, lastName: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

/**
 * Get motion by ID.
 */
export async function getMotionById(id: string) {
  return prisma.governanceMotion.findUnique({
    where: { id },
    include: {
      meeting: { select: { id: true, date: true, type: true, title: true } },
      movedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      secondedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      annotations: {
        where: { isPublished: true },
        orderBy: { createdAt: "asc" },
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
  });
}

/**
 * List motions for a meeting.
 */
export async function listMotionsByMeeting(
  meetingId: string,
  pagination: PaginationInput = { page: 1, limit: 50 }
) {
  const where: Prisma.GovernanceMotionWhereInput = { meetingId };

  const [items, total] = await Promise.all([
    prisma.governanceMotion.findMany({
      where,
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
      orderBy: { motionNumber: "asc" },
      include: {
        movedBy: { select: { id: true, firstName: true, lastName: true } },
        secondedBy: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { annotations: true } },
      },
    }),
    prisma.governanceMotion.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}

/**
 * List all motions with filters.
 */
export async function listMotions(
  filters: {
    meetingId?: string;
    result?: MotionResult;
    hasResult?: boolean;
  } = {},
  pagination: PaginationInput = { page: 1, limit: 20 }
) {
  const where: Prisma.GovernanceMotionWhereInput = {};

  if (filters.meetingId) {
    where.meetingId = filters.meetingId;
  }
  if (filters.result) {
    where.result = filters.result;
  }
  if (filters.hasResult !== undefined) {
    where.result = filters.hasResult ? { not: null } : null;
  }

  const [items, total] = await Promise.all([
    prisma.governanceMotion.findMany({
      where,
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
      orderBy: [{ meeting: { date: "desc" } }, { motionNumber: "asc" }],
      include: {
        meeting: { select: { id: true, date: true, type: true } },
        movedBy: { select: { id: true, firstName: true, lastName: true } },
        secondedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.governanceMotion.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}

/**
 * Update motion details.
 */
export async function updateMotion(id: string, data: UpdateMotionInput) {
  const updateData: Prisma.GovernanceMotionUpdateInput = {};

  if (data.motionText !== undefined) {
    updateData.motionText = data.motionText;
  }
  if (data.movedById !== undefined) {
    updateData.movedBy = data.movedById
      ? { connect: { id: data.movedById } }
      : { disconnect: true };
  }
  if (data.secondedById !== undefined) {
    updateData.secondedBy = data.secondedById
      ? { connect: { id: data.secondedById } }
      : { disconnect: true };
  }
  if (data.votesYes !== undefined) {
    updateData.votesYes = data.votesYes;
  }
  if (data.votesNo !== undefined) {
    updateData.votesNo = data.votesNo;
  }
  if (data.votesAbstain !== undefined) {
    updateData.votesAbstain = data.votesAbstain;
  }
  if (data.result !== undefined) {
    updateData.result = data.result;
  }
  if (data.resultNotes !== undefined) {
    updateData.resultNotes = data.resultNotes;
  }

  return prisma.governanceMotion.update({
    where: { id },
    data: updateData,
    include: {
      meeting: { select: { id: true, date: true, type: true } },
      movedBy: { select: { id: true, firstName: true, lastName: true } },
      secondedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

/**
 * Record vote results for a motion.
 * Convenience function that updates vote counts and result in one call.
 */
export async function recordVote(data: RecordVoteInput) {
  return prisma.governanceMotion.update({
    where: { id: data.motionId },
    data: {
      votesYes: data.votesYes,
      votesNo: data.votesNo,
      votesAbstain: data.votesAbstain,
      result: data.result,
      resultNotes: data.resultNotes,
    },
    include: {
      meeting: { select: { id: true, date: true, type: true } },
      movedBy: { select: { id: true, firstName: true, lastName: true } },
      secondedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

/**
 * Delete a motion.
 * Cascades to delete associated annotations.
 */
export async function deleteMotion(id: string) {
  // Check if motion has already been voted on
  const motion = await prisma.governanceMotion.findUnique({
    where: { id },
    select: { result: true },
  });

  if (!motion) {
    throw new Error("Motion not found");
  }

  if (motion.result !== null) {
    throw new Error(
      "Cannot delete a motion that has already been voted on. " +
      "Consider marking it as WITHDRAWN instead."
    );
  }

  return prisma.governanceMotion.delete({
    where: { id },
  });
}

/**
 * Get motion statistics for a meeting.
 */
export async function getMeetingMotionStats(meetingId: string) {
  const motions = await prisma.governanceMotion.findMany({
    where: { meetingId },
    select: { result: true },
  });

  return {
    total: motions.length,
    passed: motions.filter((m) => m.result === "PASSED").length,
    failed: motions.filter((m) => m.result === "FAILED").length,
    tabled: motions.filter((m) => m.result === "TABLED").length,
    withdrawn: motions.filter((m) => m.result === "WITHDRAWN").length,
    pending: motions.filter((m) => m.result === null).length,
  };
}
