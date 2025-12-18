/**
 * Annotations Library - Governance document annotations
 *
 * Copyright (c) Santa Barbara Newcomers Club
 *
 * Annotations can be attached to:
 * - Motions (procedural notes from Parliamentarian)
 * - Bylaws sections
 * - Policy documents
 * - Pages
 * - Files
 *
 * Charter Principles:
 * - P1: Identity provable (createdBy tracked)
 * - Parliamentarian creates interpretations/annotations
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type {
  CreateAnnotationInput,
  UpdateAnnotationInput,
  PaginationInput,
} from "./schemas";

// ============================================================================
// Types
// ============================================================================

export type AnnotationTargetType = "motion" | "bylaw" | "policy" | "page" | "file" | "minutes";

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Create a new annotation.
 */
export async function createAnnotation(
  data: CreateAnnotationInput,
  createdById: string
) {
  return prisma.governanceAnnotation.create({
    data: {
      targetType: data.targetType,
      targetId: data.targetId,
      motionId: data.motionId,
      anchor: data.anchor,
      body: data.body,
      isPublished: data.isPublished ?? false,
      createdById,
    },
    include: {
      motion: {
        select: { id: true, motionNumber: true, motionText: true },
      },
      createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
}

/**
 * Get annotation by ID.
 */
export async function getAnnotationById(id: string) {
  return prisma.governanceAnnotation.findUnique({
    where: { id },
    include: {
      motion: {
        select: {
          id: true,
          motionNumber: true,
          motionText: true,
          meeting: { select: { id: true, date: true, type: true } },
        },
      },
      createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
}

/**
 * List annotations for a specific target.
 */
export async function listAnnotationsByTarget(
  targetType: AnnotationTargetType,
  targetId: string,
  options: {
    includeUnpublished?: boolean;
    pagination?: PaginationInput;
  } = {}
) {
  const pagination = options.pagination ?? { page: 1, limit: 50 };

  const where: Prisma.GovernanceAnnotationWhereInput = {
    targetType,
    targetId,
    ...(options.includeUnpublished ? {} : { isPublished: true }),
  };

  const [items, total] = await Promise.all([
    prisma.governanceAnnotation.findMany({
      where,
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
      orderBy: { createdAt: "asc" },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.governanceAnnotation.count({ where }),
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
 * List annotations for a motion.
 */
export async function listAnnotationsByMotion(
  motionId: string,
  options: {
    includeUnpublished?: boolean;
    pagination?: PaginationInput;
  } = {}
) {
  const pagination = options.pagination ?? { page: 1, limit: 50 };

  const where: Prisma.GovernanceAnnotationWhereInput = {
    motionId,
    ...(options.includeUnpublished ? {} : { isPublished: true }),
  };

  const [items, total] = await Promise.all([
    prisma.governanceAnnotation.findMany({
      where,
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
      orderBy: { createdAt: "asc" },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.governanceAnnotation.count({ where }),
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
 * List all annotations with filters.
 */
export async function listAnnotations(
  filters: {
    targetType?: AnnotationTargetType;
    targetId?: string;
    motionId?: string;
    isPublished?: boolean;
    createdById?: string;
  } = {},
  pagination: PaginationInput = { page: 1, limit: 20 }
) {
  const where: Prisma.GovernanceAnnotationWhereInput = {};

  if (filters.targetType) {
    where.targetType = filters.targetType;
  }
  if (filters.targetId) {
    where.targetId = filters.targetId;
  }
  if (filters.motionId) {
    where.motionId = filters.motionId;
  }
  if (filters.isPublished !== undefined) {
    where.isPublished = filters.isPublished;
  }
  if (filters.createdById) {
    where.createdById = filters.createdById;
  }

  const [items, total] = await Promise.all([
    prisma.governanceAnnotation.findMany({
      where,
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
      orderBy: { createdAt: "desc" },
      include: {
        motion: {
          select: { id: true, motionNumber: true, motionText: true },
        },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.governanceAnnotation.count({ where }),
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
 * Update an annotation.
 */
export async function updateAnnotation(id: string, data: UpdateAnnotationInput) {
  return prisma.governanceAnnotation.update({
    where: { id },
    data: {
      ...(data.anchor !== undefined && { anchor: data.anchor }),
      ...(data.body && { body: data.body }),
      ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
    },
    include: {
      motion: {
        select: { id: true, motionNumber: true, motionText: true },
      },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

/**
 * Publish an annotation (make visible to non-governance users).
 */
export async function publishAnnotation(id: string) {
  return prisma.governanceAnnotation.update({
    where: { id },
    data: { isPublished: true },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

/**
 * Unpublish an annotation.
 */
export async function unpublishAnnotation(id: string) {
  return prisma.governanceAnnotation.update({
    where: { id },
    data: { isPublished: false },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

/**
 * Delete an annotation.
 */
export async function deleteAnnotation(id: string) {
  return prisma.governanceAnnotation.delete({
    where: { id },
  });
}

/**
 * Check if annotation exists.
 */
export async function annotationExists(id: string): Promise<boolean> {
  const annotation = await prisma.governanceAnnotation.findUnique({
    where: { id },
    select: { id: true },
  });
  return annotation !== null;
}

/**
 * Get annotation counts for a target (for dashboard/summary views).
 * Supports filtering by minutesId, motionId, or direct targetType/targetId.
 */
export async function getAnnotationCounts(filters: {
  minutesId?: string;
  boardRecordId?: string;
  motionId?: string;
  targetType?: AnnotationTargetType;
  targetId?: string;
}) {
  const where: Prisma.GovernanceAnnotationWhereInput = {};

  // Support legacy minutesId filter (maps to targetType="minutes")
  if (filters.minutesId) {
    where.targetType = "minutes";
    where.targetId = filters.minutesId;
  }

  // Support legacy boardRecordId filter (maps to targetType="minutes")
  if (filters.boardRecordId) {
    where.targetType = "minutes";
    where.targetId = filters.boardRecordId;
  }

  // Direct motion filter
  if (filters.motionId) {
    where.motionId = filters.motionId;
  }

  // Direct target filters
  if (filters.targetType) {
    where.targetType = filters.targetType;
  }
  if (filters.targetId) {
    where.targetId = filters.targetId;
  }

  const [total, published, unpublished] = await Promise.all([
    prisma.governanceAnnotation.count({ where }),
    prisma.governanceAnnotation.count({ where: { ...where, isPublished: true } }),
    prisma.governanceAnnotation.count({ where: { ...where, isPublished: false } }),
  ]);

  return {
    total,
    published,
    unpublished,
  };
}
