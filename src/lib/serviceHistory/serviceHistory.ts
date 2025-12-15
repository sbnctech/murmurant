/**
 * Service History Operations
 *
 * Core CRUD operations for immutable service history records.
 * Service records are append-only - they are never deleted, only closed.
 */

import { prisma } from "@/lib/prisma";
import { ServiceType } from "@prisma/client";
import type {
  ServiceHistoryRecord,
  ServiceHistoryFilters,
  CreateServiceRecordInput,
  PaginationParams,
  PaginatedResult,
} from "./types";

/**
 * Transform a Prisma record to a ServiceHistoryRecord
 */
function toServiceHistoryRecord(
  record: {
    id: string;
    memberId: string;
    serviceType: ServiceType;
    roleTitle: string;
    committeeId: string | null;
    committeeName: string | null;
    eventId: string | null;
    eventTitle: string | null;
    termId: string | null;
    termName: string | null;
    startAt: Date;
    endAt: Date | null;
    notes: string | null;
    createdAt: Date;
    member: { firstName: string; lastName: string };
  }
): ServiceHistoryRecord {
  return {
    id: record.id,
    memberId: record.memberId,
    memberName: `${record.member.firstName} ${record.member.lastName}`,
    serviceType: record.serviceType,
    roleTitle: record.roleTitle,
    committeeId: record.committeeId,
    committeeName: record.committeeName,
    eventId: record.eventId,
    eventTitle: record.eventTitle,
    termId: record.termId,
    termName: record.termName,
    startAt: record.startAt.toISOString(),
    endAt: record.endAt?.toISOString() ?? null,
    notes: record.notes,
    isActive: record.endAt === null,
    createdAt: record.createdAt.toISOString(),
  };
}

/**
 * Build Prisma where clause from filters
 */
function buildWhereClause(filters: ServiceHistoryFilters) {
  const where: {
    memberId?: string;
    committeeId?: string;
    termId?: string;
    eventId?: string;
    serviceType?: ServiceType;
    endAt?: null | { gte?: Date; lte?: Date };
    startAt?: { gte?: Date; lte?: Date };
  } = {};

  if (filters.memberId) where.memberId = filters.memberId;
  if (filters.committeeId) where.committeeId = filters.committeeId;
  if (filters.termId) where.termId = filters.termId;
  if (filters.eventId) where.eventId = filters.eventId;
  if (filters.serviceType) where.serviceType = filters.serviceType;
  if (filters.activeOnly) where.endAt = null;
  if (filters.startAfter) where.startAt = { gte: filters.startAfter };
  if (filters.endBefore) {
    where.endAt = where.endAt ?? {};
    if (typeof where.endAt === "object" && where.endAt !== null) {
      where.endAt.lte = filters.endBefore;
    }
  }

  return where;
}

/**
 * Get paginated service history with filters
 */
export async function getServiceHistory(
  filters: ServiceHistoryFilters,
  pagination: PaginationParams
): Promise<PaginatedResult<ServiceHistoryRecord>> {
  const where = buildWhereClause(filters);
  const skip = (pagination.page - 1) * pagination.limit;

  const [records, totalItems] = await Promise.all([
    prisma.memberServiceHistory.findMany({
      where,
      include: {
        member: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: [{ startAt: "desc" }, { createdAt: "desc" }],
      skip,
      take: pagination.limit,
    }),
    prisma.memberServiceHistory.count({ where }),
  ]);

  const totalPages = Math.ceil(totalItems / pagination.limit);

  return {
    items: records.map(toServiceHistoryRecord),
    page: pagination.page,
    limit: pagination.limit,
    totalItems,
    totalPages,
    hasNext: pagination.page < totalPages,
    hasPrev: pagination.page > 1,
  };
}

/**
 * Get all service history for a specific member
 */
export async function getMemberServiceHistory(
  memberId: string
): Promise<ServiceHistoryRecord[]> {
  const records = await prisma.memberServiceHistory.findMany({
    where: { memberId },
    include: {
      member: {
        select: { firstName: true, lastName: true },
      },
    },
    orderBy: [{ startAt: "desc" }, { createdAt: "desc" }],
  });

  return records.map(toServiceHistoryRecord);
}

/**
 * Get currently active roles for a member
 */
export async function getActiveRoles(
  memberId: string
): Promise<ServiceHistoryRecord[]> {
  const records = await prisma.memberServiceHistory.findMany({
    where: {
      memberId,
      endAt: null,
    },
    include: {
      member: {
        select: { firstName: true, lastName: true },
      },
    },
    orderBy: { startAt: "desc" },
  });

  return records.map(toServiceHistoryRecord);
}

/**
 * Get a single service history record by ID
 */
export async function getServiceHistoryById(
  id: string
): Promise<ServiceHistoryRecord | null> {
  const record = await prisma.memberServiceHistory.findUnique({
    where: { id },
    include: {
      member: {
        select: { firstName: true, lastName: true },
      },
    },
  });

  if (!record) return null;
  return toServiceHistoryRecord(record);
}

/**
 * Create a new service record
 *
 * Service records are immutable once created. To end a service,
 * use closeServiceRecord to set the endAt date.
 */
export async function createServiceRecord(
  data: CreateServiceRecordInput,
  createdById: string
): Promise<ServiceHistoryRecord> {
  // Denormalize committee and term names if IDs provided
  let committeeName = data.committeeName;
  let termName = data.termName;

  if (data.committeeId && !committeeName) {
    const committee = await prisma.committee.findUnique({
      where: { id: data.committeeId },
      select: { name: true },
    });
    committeeName = committee?.name ?? undefined;
  }

  if (data.termId && !termName) {
    const term = await prisma.term.findUnique({
      where: { id: data.termId },
      select: { name: true },
    });
    termName = term?.name ?? undefined;
  }

  const record = await prisma.memberServiceHistory.create({
    data: {
      memberId: data.memberId,
      serviceType: data.serviceType,
      roleTitle: data.roleTitle,
      committeeId: data.committeeId ?? null,
      committeeName: committeeName ?? null,
      eventId: data.eventId ?? null,
      eventTitle: data.eventTitle ?? null,
      termId: data.termId ?? null,
      termName: termName ?? null,
      startAt: data.startAt,
      notes: data.notes ?? null,
      transitionPlanId: data.transitionPlanId ?? null,
      createdById,
    },
    include: {
      member: {
        select: { firstName: true, lastName: true },
      },
    },
  });

  return toServiceHistoryRecord(record);
}

/**
 * Close an active service record by setting endAt
 *
 * This is the only mutation allowed on a service record.
 * Once endAt is set, the record is considered complete.
 */
export async function closeServiceRecord(
  serviceId: string,
  endAt: Date
): Promise<ServiceHistoryRecord> {
  // Verify the record exists and is not already closed
  const existing = await prisma.memberServiceHistory.findUnique({
    where: { id: serviceId },
  });

  if (!existing) {
    throw new Error(`Service record not found: ${serviceId}`);
  }

  if (existing.endAt !== null) {
    throw new Error(`Service record already closed: ${serviceId}`);
  }

  const record = await prisma.memberServiceHistory.update({
    where: { id: serviceId },
    data: { endAt },
    include: {
      member: {
        select: { firstName: true, lastName: true },
      },
    },
  });

  return toServiceHistoryRecord(record);
}

/**
 * Check if a member has any active service of a specific type
 */
export async function hasActiveService(
  memberId: string,
  serviceType?: ServiceType
): Promise<boolean> {
  const where: { memberId: string; endAt: null; serviceType?: ServiceType } = {
    memberId,
    endAt: null,
  };

  if (serviceType) {
    where.serviceType = serviceType;
  }

  const count = await prisma.memberServiceHistory.count({ where });
  return count > 0;
}

/**
 * Get service history counts by type for a member
 */
export async function getServiceCounts(
  memberId: string
): Promise<Record<ServiceType, { total: number; active: number }>> {
  const allRecords = await prisma.memberServiceHistory.groupBy({
    by: ["serviceType"],
    where: { memberId },
    _count: true,
  });

  const activeRecords = await prisma.memberServiceHistory.groupBy({
    by: ["serviceType"],
    where: { memberId, endAt: null },
    _count: true,
  });

  const result: Record<ServiceType, { total: number; active: number }> = {
    BOARD_OFFICER: { total: 0, active: 0 },
    COMMITTEE_CHAIR: { total: 0, active: 0 },
    COMMITTEE_MEMBER: { total: 0, active: 0 },
    EVENT_HOST: { total: 0, active: 0 },
  };

  for (const record of allRecords) {
    result[record.serviceType].total = record._count;
  }

  for (const record of activeRecords) {
    result[record.serviceType].active = record._count;
  }

  return result;
}
