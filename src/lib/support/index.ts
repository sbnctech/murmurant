/**
 * Support Case Management
 *
 * Utilities for Tech Lead support intake workflow.
 * See docs/operations/TECH_LEAD_SUPPORT_GUIDE.md for full process.
 *
 * Charter P7: Observability - every support request tracked to closure.
 * Charter P3: Explicit state machine - no silent drops.
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import {
  SupportCaseStatus,
  SupportCaseCategory,
  SupportCaseChannel,
  SupportCaseResolution,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AuthContext } from "@/lib/auth";

// ============================================================================
// TYPES
// ============================================================================

export type CreateCaseParams = {
  submitterName: string;
  submitterEmail?: string;
  submitterId?: string;
  channel: SupportCaseChannel;
  description: string;
  context?: Record<string, unknown>;
  initialCategory?: SupportCaseCategory;
  ownerId?: string;
};

export type UpdateCaseParams = {
  caseId: string;
  actor: AuthContext;
  status?: SupportCaseStatus;
  category?: SupportCaseCategory;
  resolution?: SupportCaseResolution;
  resolutionNotes?: string;
  preventiveAction?: string;
  linkedPR?: string;
  linkedDocs?: string;
  aiRootCause?: string;
  aiProposedActions?: Record<string, unknown>;
  aiRiskLevel?: string;
  aiEffortLevel?: string;
};

export type AddNoteParams = {
  caseId: string;
  authorId?: string;
  noteType: "status_change" | "clarification_sent" | "response_sent" | "internal" | "ai_analysis";
  content: string;
  metadata?: Record<string, unknown>;
};

export type CaseWithNotes = Prisma.SupportCaseGetPayload<{
  include: {
    submitter: { select: { firstName: true; lastName: true; email: true } };
    owner: { select: { firstName: true; lastName: true; email: true } };
    notes: {
      include: { author: { select: { firstName: true; lastName: true } } };
      orderBy: { createdAt: "desc" };
    };
  };
}>;

// ============================================================================
// CASE LIFECYCLE
// ============================================================================

/**
 * Create a new support case.
 */
export async function createCase(params: CreateCaseParams): Promise<{ id: string; caseNumber: number }> {
  const supportCase = await prisma.supportCase.create({
    data: {
      submitterName: params.submitterName,
      submitterEmail: params.submitterEmail,
      submitterId: params.submitterId,
      channel: params.channel,
      description: params.description,
      context: (params.context as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      category: params.initialCategory ?? "UNKNOWN",
      initialCategory: params.initialCategory,
      status: "OPEN",
      ownerId: params.ownerId,
    },
    select: { id: true, caseNumber: true },
  });

  return supportCase;
}

/**
 * Update case status and/or classification.
 */
export async function updateCase(params: UpdateCaseParams): Promise<void> {
  const { caseId, actor, status, ...updates } = params;

  // Get current case for status change tracking
  const current = await prisma.supportCase.findUnique({
    where: { id: caseId },
    select: { status: true },
  });

  if (!current) {
    throw new Error("Case not found");
  }

  // Build update data
  const updateData: Prisma.SupportCaseUpdateInput = {};

  if (status) updateData.status = status;
  if (updates.category) updateData.category = updates.category;
  if (updates.resolution) updateData.resolution = updates.resolution;
  if (updates.resolutionNotes) updateData.resolutionNotes = updates.resolutionNotes;
  if (updates.preventiveAction) updateData.preventiveAction = updates.preventiveAction;
  if (updates.linkedPR) updateData.linkedPR = updates.linkedPR;
  if (updates.linkedDocs) updateData.linkedDocs = updates.linkedDocs;
  if (updates.aiRootCause) updateData.aiRootCause = updates.aiRootCause;
  if (updates.aiProposedActions) updateData.aiProposedActions = updates.aiProposedActions as Prisma.InputJsonValue;
  if (updates.aiRiskLevel) updateData.aiRiskLevel = updates.aiRiskLevel;
  if (updates.aiEffortLevel) updateData.aiEffortLevel = updates.aiEffortLevel;

  // Handle closure
  if (status === "CLOSED") {
    updateData.closedAt = new Date();
    updateData.closedBy = { connect: { id: actor.memberId } };
  }

  await prisma.supportCase.update({
    where: { id: caseId },
    data: updateData,
  });

  // Log status change
  if (status && status !== current.status) {
    await addNote({
      caseId,
      authorId: actor.memberId,
      noteType: "status_change",
      content: `Status changed from ${current.status} to ${status}`,
      metadata: { fromStatus: current.status, toStatus: status },
    });
  }
}

/**
 * Close a case with required closure fields.
 */
export async function closeCase(params: {
  caseId: string;
  actor: AuthContext;
  category: SupportCaseCategory;
  resolution: SupportCaseResolution;
  resolutionNotes: string;
  preventiveAction?: string;
}): Promise<void> {
  await prisma.supportCase.update({
    where: { id: params.caseId },
    data: {
      status: "CLOSED",
      category: params.category,
      resolution: params.resolution,
      resolutionNotes: params.resolutionNotes,
      preventiveAction: params.preventiveAction,
      closedAt: new Date(),
      closedBy: { connect: { id: params.actor.memberId } },
    },
  });

  await addNote({
    caseId: params.caseId,
    authorId: params.actor.memberId,
    noteType: "status_change",
    content: `Case closed: ${params.resolutionNotes}`,
    metadata: {
      resolution: params.resolution,
      preventiveAction: params.preventiveAction,
    },
  });
}

// ============================================================================
// NOTES
// ============================================================================

/**
 * Add a note to a case.
 */
export async function addNote(params: AddNoteParams): Promise<void> {
  await prisma.supportCaseNote.create({
    data: {
      caseId: params.caseId,
      authorId: params.authorId,
      noteType: params.noteType,
      content: params.content,
      metadata: (params.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
    },
  });
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get a case with all notes.
 */
export async function getCaseWithNotes(caseId: string): Promise<CaseWithNotes | null> {
  return prisma.supportCase.findUnique({
    where: { id: caseId },
    include: {
      submitter: { select: { firstName: true, lastName: true, email: true } },
      owner: { select: { firstName: true, lastName: true, email: true } },
      notes: {
        include: { author: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

/**
 * Get a case by case number.
 */
export async function getCaseByCaseNumber(caseNumber: number): Promise<CaseWithNotes | null> {
  return prisma.supportCase.findUnique({
    where: { caseNumber },
    include: {
      submitter: { select: { firstName: true, lastName: true, email: true } },
      owner: { select: { firstName: true, lastName: true, email: true } },
      notes: {
        include: { author: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

/**
 * List open cases.
 */
export async function listOpenCases(): Promise<
  Array<{
    id: string;
    caseNumber: number;
    submitterName: string;
    channel: SupportCaseChannel;
    status: SupportCaseStatus;
    category: SupportCaseCategory;
    receivedAt: Date;
    description: string;
  }>
> {
  return prisma.supportCase.findMany({
    where: {
      status: { notIn: ["CLOSED"] },
    },
    select: {
      id: true,
      caseNumber: true,
      submitterName: true,
      channel: true,
      status: true,
      category: true,
      receivedAt: true,
      description: true,
    },
    orderBy: { receivedAt: "desc" },
  });
}

/**
 * Get case statistics.
 */
export async function getCaseStats(): Promise<{
  open: number;
  awaitingInfo: number;
  inProgress: number;
  closedThisWeek: number;
  avgResolutionDays: number | null;
}> {
  const [open, awaitingInfo, inProgress, closedThisWeek, avgResolution] = await Promise.all([
    prisma.supportCase.count({ where: { status: "OPEN" } }),
    prisma.supportCase.count({ where: { status: "AWAITING_INFO" } }),
    prisma.supportCase.count({ where: { status: "IN_PROGRESS" } }),
    prisma.supportCase.count({
      where: {
        status: "CLOSED",
        closedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.$queryRaw<[{ avg_days: number | null }]>`
      SELECT AVG(EXTRACT(EPOCH FROM ("closedAt" - "receivedAt")) / 86400) as avg_days
      FROM "SupportCase"
      WHERE status = 'CLOSED'
      AND "closedAt" IS NOT NULL
      AND "closedAt" > NOW() - INTERVAL '30 days'
    `,
  ]);

  return {
    open,
    awaitingInfo,
    inProgress,
    closedThisWeek,
    avgResolutionDays: avgResolution[0]?.avg_days
      ? Math.round(avgResolution[0].avg_days * 10) / 10
      : null,
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Valid status transitions.
 */
const VALID_TRANSITIONS: Record<SupportCaseStatus, SupportCaseStatus[]> = {
  OPEN: ["AWAITING_INFO", "IN_PROGRESS", "ESCALATED", "CLOSED"],
  AWAITING_INFO: ["OPEN", "IN_PROGRESS", "CLOSED"],
  IN_PROGRESS: ["AWAITING_INFO", "ESCALATED", "RESOLVED", "CLOSED"],
  ESCALATED: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [], // Terminal state
};

/**
 * Check if a status transition is valid.
 */
export function isValidTransition(from: SupportCaseStatus, to: SupportCaseStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Closure requirements check.
 */
export function canClose(supportCase: {
  category: SupportCaseCategory;
  resolution: SupportCaseResolution | null;
  resolutionNotes: string | null;
}): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  if (supportCase.category === "UNKNOWN") {
    missing.push("Final category must be set (not UNKNOWN)");
  }
  if (!supportCase.resolution) {
    missing.push("Resolution path must be selected");
  }
  if (!supportCase.resolutionNotes) {
    missing.push("Resolution notes are required");
  }

  return { valid: missing.length === 0, missing };
}
