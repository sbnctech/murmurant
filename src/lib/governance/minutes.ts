/**
 * Minutes Library - Meeting minutes CRUD with status machine
 *
 * Copyright (c) Santa Barbara Newcomers Club
 *
 * Charter Principles:
 * - P1: Identity provable (all actions tracked by actor)
 * - P3: Explicit state machine for minutes workflow
 * - P5: Published minutes immutable (versioning)
 * - P7: Full audit trail
 *
 * Status Machine:
 * DRAFT -> SUBMITTED -> (REVISED | APPROVED) -> PUBLISHED -> ARCHIVED
 *
 * Permissions:
 * - Secretary: edit DRAFT/REVISED, submit, publish (if APPROVED)
 * - President: approve or revise SUBMITTED minutes
 * - meetings:minutes:finalize required to approve
 */

import { prisma } from "@/lib/prisma";
import { MinutesStatus, Prisma } from "@prisma/client";
import type {
  CreateMinutesInput,
  UpdateMinutesInput,
  PaginationInput,
} from "./schemas";

// ============================================================================
// Status Machine Rules
// ============================================================================

/**
 * Valid status transitions for the minutes workflow.
 * Key is current status, value is array of allowed next statuses.
 */
export const MINUTES_STATUS_TRANSITIONS: Record<MinutesStatus, MinutesStatus[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["REVISED", "APPROVED"],
  REVISED: ["SUBMITTED"],
  APPROVED: ["PUBLISHED"],
  PUBLISHED: ["ARCHIVED"],
  ARCHIVED: [],
};

/**
 * Statuses where Secretary can edit content.
 */
export const SECRETARY_EDITABLE_STATUSES: MinutesStatus[] = ["DRAFT", "REVISED"];

/**
 * Check if a status transition is valid.
 */
export function isValidStatusTransition(
  currentStatus: MinutesStatus,
  newStatus: MinutesStatus
): boolean {
  return MINUTES_STATUS_TRANSITIONS[currentStatus].includes(newStatus);
}

/**
 * Get human-readable description of what can happen in each status.
 */
export function getStatusDescription(status: MinutesStatus): string {
  switch (status) {
    case "DRAFT":
      return "Secretary is editing. Can submit for President review.";
    case "SUBMITTED":
      return "Awaiting President review. President can approve or request revisions.";
    case "REVISED":
      return "President requested changes. Secretary can edit and resubmit.";
    case "APPROVED":
      return "President approved. Secretary can now publish.";
    case "PUBLISHED":
      return "Published to members. Can be archived for historical record.";
    case "ARCHIVED":
      return "Historical record. No further changes allowed.";
    default:
      return "Unknown status";
  }
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Create new minutes for a meeting.
 * Starts in DRAFT status.
 */
export async function createMinutes(
  data: CreateMinutesInput,
  createdById: string
) {
  // Check if minutes already exist for this meeting
  const existingMinutes = await prisma.governanceMinutes.findFirst({
    where: { meetingId: data.meetingId },
    orderBy: { version: "desc" },
  });

  const version = existingMinutes ? existingMinutes.version + 1 : 1;

  return prisma.governanceMinutes.create({
    data: {
      meetingId: data.meetingId,
      content: data.content as Prisma.InputJsonValue,
      summary: data.summary,
      version,
      status: "DRAFT",
      createdById,
      lastEditedById: createdById,
    },
    include: {
      meeting: true,
      createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
}

/**
 * Get minutes by ID.
 */
export async function getMinutesById(id: string) {
  return prisma.governanceMinutes.findUnique({
    where: { id },
    include: {
      meeting: true,
      createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      lastEditedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      submittedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      reviewedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      approvedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      publishedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
}

/**
 * List minutes with filters and pagination.
 */
export async function listMinutes(
  filters: { meetingId?: string; status?: MinutesStatus } = {},
  pagination: PaginationInput = { page: 1, limit: 20 }
) {
  const where: Prisma.GovernanceMinutesWhereInput = {};

  if (filters.meetingId) {
    where.meetingId = filters.meetingId;
  }
  if (filters.status) {
    where.status = filters.status;
  }

  const [items, total] = await Promise.all([
    prisma.governanceMinutes.findMany({
      where,
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
      orderBy: [{ meeting: { date: "desc" } }, { version: "desc" }],
      include: {
        meeting: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        lastEditedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.governanceMinutes.count({ where }),
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
 * Update minutes content.
 * Only allowed in DRAFT or REVISED status.
 *
 * @throws Error if status doesn't allow editing
 */
export async function updateMinutes(
  id: string,
  data: UpdateMinutesInput,
  editorId: string
) {
  const minutes = await prisma.governanceMinutes.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!minutes) {
    throw new Error("Minutes not found");
  }

  if (!SECRETARY_EDITABLE_STATUSES.includes(minutes.status)) {
    throw new Error(
      `Cannot edit minutes in ${minutes.status} status. ` +
      `Editable statuses: ${SECRETARY_EDITABLE_STATUSES.join(", ")}`
    );
  }

  return prisma.governanceMinutes.update({
    where: { id },
    data: {
      ...(data.content && { content: data.content as Prisma.InputJsonValue }),
      ...(data.summary !== undefined && { summary: data.summary }),
      lastEditedById: editorId,
    },
    include: {
      meeting: true,
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      lastEditedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

// ============================================================================
// Workflow Actions
// ============================================================================

/**
 * Submit minutes for President review.
 * Transition: DRAFT | REVISED -> SUBMITTED
 *
 * @throws Error if current status doesn't allow submission
 */
export async function submitMinutes(id: string, submitterId: string) {
  const minutes = await prisma.governanceMinutes.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!minutes) {
    throw new Error("Minutes not found");
  }

  if (!isValidStatusTransition(minutes.status, "SUBMITTED")) {
    throw new Error(
      `Cannot submit minutes from ${minutes.status} status. ` +
      `Allowed from: ${Object.entries(MINUTES_STATUS_TRANSITIONS)
        .filter(([, v]) => v.includes("SUBMITTED"))
        .map(([k]) => k)
        .join(", ")}`
    );
  }

  return prisma.governanceMinutes.update({
    where: { id },
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
      submittedById: submitterId,
    },
    include: {
      meeting: true,
      submittedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

/**
 * President approves minutes.
 * Transition: SUBMITTED -> APPROVED
 *
 * @throws Error if current status doesn't allow approval
 */
export async function approveMinutes(id: string, approverId: string) {
  const minutes = await prisma.governanceMinutes.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!minutes) {
    throw new Error("Minutes not found");
  }

  if (!isValidStatusTransition(minutes.status, "APPROVED")) {
    throw new Error(
      `Cannot approve minutes from ${minutes.status} status. ` +
      `Must be in SUBMITTED status.`
    );
  }

  return prisma.governanceMinutes.update({
    where: { id },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      approvedById: approverId,
      reviewedAt: new Date(),
      reviewedById: approverId,
    },
    include: {
      meeting: true,
      approvedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

/**
 * President requests revisions.
 * Transition: SUBMITTED -> REVISED
 *
 * @throws Error if current status doesn't allow revision request
 */
export async function requestRevision(
  id: string,
  reviewerId: string,
  reviewNotes?: string
) {
  const minutes = await prisma.governanceMinutes.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!minutes) {
    throw new Error("Minutes not found");
  }

  if (!isValidStatusTransition(minutes.status, "REVISED")) {
    throw new Error(
      `Cannot request revision from ${minutes.status} status. ` +
      `Must be in SUBMITTED status.`
    );
  }

  return prisma.governanceMinutes.update({
    where: { id },
    data: {
      status: "REVISED",
      reviewedAt: new Date(),
      reviewedById: reviewerId,
      reviewNotes: reviewNotes ?? null,
    },
    include: {
      meeting: true,
      reviewedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

/**
 * Publish approved minutes.
 * Transition: APPROVED -> PUBLISHED
 *
 * After publishing, content becomes immutable. Any corrections require
 * creating a new version.
 *
 * @throws Error if minutes are not approved
 */
export async function publishMinutes(id: string, publisherId: string) {
  const minutes = await prisma.governanceMinutes.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!minutes) {
    throw new Error("Minutes not found");
  }

  if (!isValidStatusTransition(minutes.status, "PUBLISHED")) {
    throw new Error(
      `Cannot publish minutes from ${minutes.status} status. ` +
      `Minutes must be APPROVED before publishing.`
    );
  }

  return prisma.governanceMinutes.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
      publishedById: publisherId,
    },
    include: {
      meeting: true,
      publishedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

/**
 * Archive published minutes.
 * Transition: PUBLISHED -> ARCHIVED
 */
export async function archiveMinutes(id: string) {
  const minutes = await prisma.governanceMinutes.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!minutes) {
    throw new Error("Minutes not found");
  }

  if (!isValidStatusTransition(minutes.status, "ARCHIVED")) {
    throw new Error(
      `Cannot archive minutes from ${minutes.status} status. ` +
      `Minutes must be PUBLISHED before archiving.`
    );
  }

  return prisma.governanceMinutes.update({
    where: { id },
    data: {
      status: "ARCHIVED",
    },
    include: {
      meeting: true,
    },
  });
}

/**
 * Create a new version of published minutes (for corrections).
 * The new version starts in DRAFT status and goes through the full workflow.
 */
export async function createMinutesRevision(
  minutesId: string,
  createdById: string
) {
  const original = await prisma.governanceMinutes.findUnique({
    where: { id: minutesId },
    select: {
      meetingId: true,
      content: true,
      summary: true,
      version: true,
      status: true,
    },
  });

  if (!original) {
    throw new Error("Original minutes not found");
  }

  if (original.status !== "PUBLISHED" && original.status !== "ARCHIVED") {
    throw new Error(
      "Can only create revisions of PUBLISHED or ARCHIVED minutes"
    );
  }

  return prisma.governanceMinutes.create({
    data: {
      meetingId: original.meetingId,
      content: original.content as Prisma.InputJsonValue,
      summary: original.summary,
      version: original.version + 1,
      status: "DRAFT",
      createdById,
      lastEditedById: createdById,
    },
    include: {
      meeting: true,
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

/**
 * Delete draft minutes.
 * Only DRAFT status can be deleted.
 */
export async function deleteMinutes(id: string) {
  const minutes = await prisma.governanceMinutes.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!minutes) {
    throw new Error("Minutes not found");
  }

  if (minutes.status !== "DRAFT") {
    throw new Error(
      `Cannot delete minutes in ${minutes.status} status. ` +
      `Only DRAFT minutes can be deleted.`
    );
  }

  return prisma.governanceMinutes.delete({
    where: { id },
  });
}
