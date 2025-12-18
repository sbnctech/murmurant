/**
 * Meetings Library - Board meeting CRUD operations
 *
 * Copyright (c) Santa Barbara Newcomers Club
 *
 * Charter Principles:
 * - P1: Identity provable (createdBy tracked)
 * - P7: Full audit trail via AuditLog
 */

import { prisma } from "@/lib/prisma";
import { GovernanceMeetingType, Prisma } from "@prisma/client";
import type {
  CreateMeetingInput,
  UpdateMeetingInput,
  PaginationInput,
} from "./schemas";

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Create a new governance meeting.
 */
export async function createMeeting(
  data: CreateMeetingInput,
  createdById: string
) {
  const meetingDate = new Date(data.date);

  return prisma.governanceMeeting.create({
    data: {
      date: meetingDate,
      type: data.type,
      title: data.title,
      location: data.location,
      attendanceCount: data.attendanceCount,
      quorumMet: data.quorumMet ?? true,
      createdById,
    },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      minutes: { select: { id: true, status: true, version: true } },
      motions: { select: { id: true, motionNumber: true, result: true } },
    },
  });
}

/**
 * Get meeting by ID with related data.
 */
export async function getMeetingById(id: string) {
  return prisma.governanceMeeting.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      minutes: {
        orderBy: { version: "desc" },
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          lastEditedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      },
      motions: {
        orderBy: { motionNumber: "asc" },
        include: {
          movedBy: { select: { id: true, firstName: true, lastName: true } },
          secondedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
  });
}

/**
 * List meetings with filters and pagination.
 */
export async function listMeetings(
  filters: {
    type?: GovernanceMeetingType;
    startDate?: string;
    endDate?: string;
  } = {},
  pagination: PaginationInput = { page: 1, limit: 20 }
) {
  const where: Prisma.GovernanceMeetingWhereInput = {};

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) {
      where.date.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.date.lte = new Date(filters.endDate);
    }
  }

  const [items, total] = await Promise.all([
    prisma.governanceMeeting.findMany({
      where,
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
      orderBy: { date: "desc" },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        minutes: {
          select: { id: true, status: true, version: true },
          orderBy: { version: "desc" },
          take: 1,
        },
        motions: {
          select: { id: true },
        },
      },
    }),
    prisma.governanceMeeting.count({ where }),
  ]);

  // Transform to add counts
  const itemsWithCounts = items.map((meeting) => ({
    ...meeting,
    latestMinutes: meeting.minutes[0] ?? null,
    motionCount: meeting.motions.length,
    minutes: undefined, // Remove full minutes array
    motions: undefined, // Remove full motions array
  }));

  return {
    items: itemsWithCounts,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}

/**
 * Update meeting details.
 * Cannot change date or type after creation.
 */
export async function updateMeeting(id: string, data: UpdateMeetingInput) {
  return prisma.governanceMeeting.update({
    where: { id },
    data: {
      title: data.title,
      location: data.location,
      attendanceCount: data.attendanceCount,
      quorumMet: data.quorumMet,
    },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

/**
 * Delete a meeting.
 * Only allowed if no minutes or motions exist.
 */
export async function deleteMeeting(id: string) {
  // Check for dependent records
  const meeting = await prisma.governanceMeeting.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          minutes: true,
          motions: true,
        },
      },
    },
  });

  if (!meeting) {
    throw new Error("Meeting not found");
  }

  if (meeting._count.minutes > 0) {
    throw new Error(
      `Cannot delete meeting with ${meeting._count.minutes} minutes record(s). ` +
      `Delete minutes first.`
    );
  }

  if (meeting._count.motions > 0) {
    throw new Error(
      `Cannot delete meeting with ${meeting._count.motions} motion(s). ` +
      `Delete motions first.`
    );
  }

  return prisma.governanceMeeting.delete({
    where: { id },
  });
}

/**
 * Check if a meeting exists for a given date and type.
 */
export async function meetingExists(
  date: string,
  type: GovernanceMeetingType
): Promise<boolean> {
  const meeting = await prisma.governanceMeeting.findUnique({
    where: {
      date_type: {
        date: new Date(date),
        type,
      },
    },
    select: { id: true },
  });

  return meeting !== null;
}
