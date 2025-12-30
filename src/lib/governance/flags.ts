/**
 * Review Flags Library - Governance review flags
 *
 * Copyright © 2025 Murmurant, Inc.
 *
 * Review flags can be attached to:
 * - Pages
 * - Files
 * - Policies
 * - Events
 * - Bylaws
 *
 * Flag types:
 * - INSURANCE_REVIEW: Needs insurance team review
 * - LEGAL_REVIEW: Needs legal review
 * - POLICY_REVIEW: Needs policy compliance review
 * - COMPLIANCE_CHECK: General compliance check
 * - GENERAL: Other review needed
 *
 * Charter Principles:
 * - P1: Identity provable (createdBy/resolvedBy tracked)
 * - governance:flags:create and governance:flags:resolve capabilities
 */

import { prisma } from "@/lib/prisma";
import { ReviewFlagType, ReviewFlagStatus, Prisma } from "@prisma/client";
import type {
  CreateFlagInput,
  UpdateFlagInput,
  ResolveFlagInput,
  PaginationInput,
} from "./schemas";

// ============================================================================
// Types
// ============================================================================

export type FlagTargetType = "page" | "file" | "policy" | "event" | "bylaw" | "minutes" | "motion";

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Create a new review flag.
 */
export async function createFlag(
  data: CreateFlagInput,
  createdById: string
) {
  return prisma.governanceReviewFlag.create({
    data: {
      targetType: data.targetType,
      targetId: data.targetId,
      flagType: data.flagType,
      title: data.title,
      notes: data.notes,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      status: "OPEN",
      createdById,
    },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
}

/**
 * Get flag by ID.
 */
export async function getFlagById(id: string) {
  return prisma.governanceReviewFlag.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      resolvedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
}

/**
 * List flags for a specific target.
 */
export async function listFlagsByTarget(
  targetType: FlagTargetType,
  targetId: string,
  options: {
    status?: ReviewFlagStatus;
    pagination?: PaginationInput;
  } = {}
) {
  const pagination = options.pagination ?? { page: 1, limit: 50 };

  const where: Prisma.GovernanceReviewFlagWhereInput = {
    targetType,
    targetId,
    ...(options.status && { status: options.status }),
  };

  const [items, total] = await Promise.all([
    prisma.governanceReviewFlag.findMany({
      where,
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        resolvedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.governanceReviewFlag.count({ where }),
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
 * List all flags with filters.
 */
export async function listFlags(
  filters: {
    targetType?: FlagTargetType;
    targetId?: string;
    flagType?: ReviewFlagType;
    status?: ReviewFlagStatus;
    createdById?: string;
    overdue?: boolean;
  } = {},
  pagination: PaginationInput = { page: 1, limit: 20 }
) {
  const where: Prisma.GovernanceReviewFlagWhereInput = {};

  if (filters.targetType) {
    where.targetType = filters.targetType;
  }
  if (filters.targetId) {
    where.targetId = filters.targetId;
  }
  if (filters.flagType) {
    where.flagType = filters.flagType;
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.createdById) {
    where.createdById = filters.createdById;
  }
  if (filters.overdue) {
    where.dueDate = { lt: new Date() };
    where.status = { in: ["OPEN", "IN_PROGRESS"] };
  }

  const [items, total] = await Promise.all([
    prisma.governanceReviewFlag.findMany({
      where,
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        resolvedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.governanceReviewFlag.count({ where }),
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
 * Get open flags count grouped by type.
 */
export async function getOpenFlagsCounts() {
  const flags = await prisma.governanceReviewFlag.groupBy({
    by: ["flagType"],
    where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
    _count: { id: true },
  });

  return flags.reduce(
    (acc, flag) => ({
      ...acc,
      [flag.flagType]: flag._count.id,
    }),
    {} as Record<ReviewFlagType, number>
  );
}

/**
 * Get overdue flags.
 */
export async function getOverdueFlags(pagination: PaginationInput = { page: 1, limit: 20 }) {
  return listFlags(
    { overdue: true },
    pagination
  );
}

/**
 * Update a flag.
 */
export async function updateFlag(id: string, data: UpdateFlagInput) {
  return prisma.governanceReviewFlag.update({
    where: { id },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.dueDate !== undefined && {
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      }),
      ...(data.status && { status: data.status }),
    },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      resolvedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

/**
 * Start working on a flag (OPEN -> IN_PROGRESS).
 */
export async function startFlag(id: string) {
  const flag = await prisma.governanceReviewFlag.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!flag) {
    throw new Error("Flag not found");
  }

  if (flag.status !== "OPEN") {
    throw new Error(`Cannot start flag in ${flag.status} status. Must be OPEN.`);
  }

  return prisma.governanceReviewFlag.update({
    where: { id },
    data: { status: "IN_PROGRESS" },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

/**
 * Resolve a flag (mark as RESOLVED or DISMISSED).
 */
export async function resolveFlag(data: ResolveFlagInput, resolvedById: string) {
  const flag = await prisma.governanceReviewFlag.findUnique({
    where: { id: data.flagId },
    select: { status: true },
  });

  if (!flag) {
    throw new Error("Flag not found");
  }

  if (flag.status === "RESOLVED" || flag.status === "DISMISSED") {
    throw new Error(`Flag is already ${flag.status}.`);
  }

  return prisma.governanceReviewFlag.update({
    where: { id: data.flagId },
    data: {
      status: data.status,
      resolution: data.resolution,
      resolvedAt: new Date(),
      resolvedById,
    },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      resolvedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

/**
 * Reopen a resolved/dismissed flag.
 */
export async function reopenFlag(id: string) {
  const flag = await prisma.governanceReviewFlag.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!flag) {
    throw new Error("Flag not found");
  }

  if (flag.status !== "RESOLVED" && flag.status !== "DISMISSED") {
    throw new Error(`Cannot reopen flag in ${flag.status} status.`);
  }

  return prisma.governanceReviewFlag.update({
    where: { id },
    data: {
      status: "OPEN",
      resolvedAt: null,
      resolvedById: null,
      resolution: null,
    },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

/**
 * Delete a flag.
 * Only OPEN or DISMISSED flags can be deleted.
 */
export async function deleteFlag(id: string) {
  const flag = await prisma.governanceReviewFlag.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!flag) {
    throw new Error("Flag not found");
  }

  if (flag.status === "IN_PROGRESS") {
    throw new Error("Cannot delete flag that is IN_PROGRESS. Resolve or dismiss it first.");
  }

  if (flag.status === "RESOLVED") {
    throw new Error("Cannot delete resolved flag. Historical record must be preserved.");
  }

  return prisma.governanceReviewFlag.delete({
    where: { id },
  });
}

// ============================================================================
// Compatibility Functions (for existing API routes)
// ============================================================================

/**
 * Legacy-compatible flag creation.
 * Maps minutesId/boardRecordId/motionId to targetType/targetId.
 */
export async function createGovernanceFlag(data: {
  flagType: string;
  title: string;
  description: string;
  minutesId?: string;
  boardRecordId?: string;
  motionId?: string;
  createdById: string;
}) {
  // Map legacy FK-style params to polymorphic targetType/targetId
  let targetType: FlagTargetType = "minutes";
  let targetId: string | undefined;

  if (data.motionId) {
    targetType = "motion";
    targetId = data.motionId;
  } else if (data.minutesId) {
    targetType = "minutes";
    targetId = data.minutesId;
  } else if (data.boardRecordId) {
    targetType = "minutes";
    targetId = data.boardRecordId;
  }

  if (!targetId) {
    throw new Error("Must specify minutesId, boardRecordId, or motionId");
  }

  // Map legacy flagType strings to ReviewFlagType enum
  const flagTypeMap: Record<string, "INSURANCE_REVIEW" | "LEGAL_REVIEW" | "POLICY_REVIEW" | "COMPLIANCE_CHECK" | "GENERAL"> = {
    "RULES_QUESTION": "POLICY_REVIEW",
    "BYLAWS_CHECK": "COMPLIANCE_CHECK",
    "INSURANCE_REVIEW": "INSURANCE_REVIEW",
    "LEGAL_REVIEW": "LEGAL_REVIEW",
    "OTHER": "GENERAL",
    // Direct mapping for new types
    "POLICY_REVIEW": "POLICY_REVIEW",
    "COMPLIANCE_CHECK": "COMPLIANCE_CHECK",
    "GENERAL": "GENERAL",
  };

  const mappedFlagType = flagTypeMap[data.flagType] || "GENERAL";

  return createFlag(
    {
      targetType,
      targetId,
      flagType: mappedFlagType,
      title: data.title,
      notes: data.description,
    },
    data.createdById
  );
}

/**
 * Legacy-compatible flag listing.
 * Supports limit/offset pagination and legacy FK-style filters.
 */
export async function listGovernanceFlags(filters: {
  status?: string;
  flagType?: string;
  minutesId?: string;
  boardRecordId?: string;
  motionId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const page = filters.offset && filters.limit
    ? Math.floor(filters.offset / filters.limit) + 1
    : 1;
  const limit = filters.limit || 50;

  // Build filter conditions
  let targetType: FlagTargetType | undefined;
  let targetId: string | undefined;

  if (filters.motionId) {
    targetType = "motion";
    targetId = filters.motionId;
  } else if (filters.minutesId) {
    targetType = "minutes";
    targetId = filters.minutesId;
  } else if (filters.boardRecordId) {
    targetType = "minutes";
    targetId = filters.boardRecordId;
  }

  // Map legacy flagType to ReviewFlagType
  const flagTypeMap: Record<string, "INSURANCE_REVIEW" | "LEGAL_REVIEW" | "POLICY_REVIEW" | "COMPLIANCE_CHECK" | "GENERAL"> = {
    "RULES_QUESTION": "POLICY_REVIEW",
    "BYLAWS_CHECK": "COMPLIANCE_CHECK",
    "INSURANCE_REVIEW": "INSURANCE_REVIEW",
    "LEGAL_REVIEW": "LEGAL_REVIEW",
    "OTHER": "GENERAL",
    "POLICY_REVIEW": "POLICY_REVIEW",
    "COMPLIANCE_CHECK": "COMPLIANCE_CHECK",
    "GENERAL": "GENERAL",
  };

  // Map status string to ReviewFlagStatus
  const statusMap: Record<string, "OPEN" | "IN_PROGRESS" | "RESOLVED" | "DISMISSED"> = {
    "OPEN": "OPEN",
    "IN_REVIEW": "IN_PROGRESS",
    "IN_PROGRESS": "IN_PROGRESS",
    "RESOLVED": "RESOLVED",
    "DISMISSED": "DISMISSED",
  };

  const result = await listFlags(
    {
      targetType,
      targetId,
      flagType: filters.flagType ? flagTypeMap[filters.flagType] : undefined,
      status: filters.status ? statusMap[filters.status] : undefined,
    },
    { page, limit }
  );

  return {
    flags: result.items,
    total: result.pagination.total,
  };
}
