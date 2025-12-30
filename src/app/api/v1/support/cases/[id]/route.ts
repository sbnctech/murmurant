/**
 * Support Case Detail API
 *
 * GET /api/v1/support/cases/:id - Get case details with notes
 * PATCH /api/v1/support/cases/:id - Update case status/classification
 *
 * Access Control:
 * - Tech Lead / Admin: Full access
 *
 * Charter Compliance:
 * - P1: Identity via session auth
 * - P2: Default deny authorization
 * - P3: Explicit state machine for status
 * - P7: Audit logging via notes
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SupportCaseStatus, Prisma } from "@prisma/client";

// UUID validation
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Valid status transitions
const VALID_TRANSITIONS: Record<SupportCaseStatus, SupportCaseStatus[]> = {
  OPEN: ["AWAITING_INFO", "IN_PROGRESS", "ESCALATED", "CLOSED"],
  AWAITING_INFO: ["OPEN", "IN_PROGRESS", "CLOSED"],
  IN_PROGRESS: ["AWAITING_INFO", "ESCALATED", "RESOLVED", "CLOSED"],
  ESCALATED: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [], // Terminal state
};

/**
 * GET /api/v1/support/cases/:id
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!uuidRegex.test(id)) {
    return NextResponse.json(
      { error: "Not Found", message: "Case not found" },
      { status: 404 }
    );
  }

  const auth = await requireCapability(req, "admin:full");
  if (!auth.ok) {
    return auth.response;
  }

  // Fetch case with notes
  const supportCase = await prisma.supportCase.findUnique({
    where: { id },
    include: {
      submitter: { select: { id: true, firstName: true, lastName: true, email: true } },
      owner: { select: { id: true, firstName: true, lastName: true, email: true } },
      closedBy: { select: { id: true, firstName: true, lastName: true } },
      notes: {
        include: { author: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!supportCase) {
    return NextResponse.json(
      { error: "Not Found", message: "Case not found" },
      { status: 404 }
    );
  }

  // Build response
  const response = {
    id: supportCase.id,
    caseNumber: supportCase.caseNumber,
    submitterName: supportCase.submitterName,
    submitterEmail: supportCase.submitterEmail,
    submitter: supportCase.submitter
      ? {
          id: supportCase.submitter.id,
          name: supportCase.submitter.firstName + " " + supportCase.submitter.lastName,
          email: supportCase.submitter.email,
        }
      : null,
    channel: supportCase.channel,
    status: supportCase.status,
    category: supportCase.category,
    initialCategory: supportCase.initialCategory,
    description: supportCase.description,
    context: supportCase.context,
    receivedAt: supportCase.receivedAt.toISOString(),
    createdAt: supportCase.createdAt.toISOString(),
    updatedAt: supportCase.updatedAt.toISOString(),
    closedAt: supportCase.closedAt?.toISOString() ?? null,
    closedBy: supportCase.closedBy
      ? {
          id: supportCase.closedBy.id,
          name: supportCase.closedBy.firstName + " " + supportCase.closedBy.lastName,
        }
      : null,
    owner: supportCase.owner
      ? {
          id: supportCase.owner.id,
          name: supportCase.owner.firstName + " " + supportCase.owner.lastName,
          email: supportCase.owner.email,
        }
      : null,
    // Resolution fields
    resolution: supportCase.resolution,
    resolutionNotes: supportCase.resolutionNotes,
    preventiveAction: supportCase.preventiveAction,
    linkedPR: supportCase.linkedPR,
    linkedDocs: supportCase.linkedDocs,
    // AI analysis fields
    aiRootCause: supportCase.aiRootCause,
    aiProposedActions: supportCase.aiProposedActions,
    aiRiskLevel: supportCase.aiRiskLevel,
    aiEffortLevel: supportCase.aiEffortLevel,
    // Notes
    notes: supportCase.notes.map((n) => ({
      id: n.id,
      noteType: n.noteType,
      content: n.content,
      metadata: n.metadata,
      createdAt: n.createdAt.toISOString(),
      author: n.author
        ? { id: n.author.id, name: n.author.firstName + " " + n.author.lastName }
        : null,
    })),
    // Valid transitions from current status
    validTransitions: VALID_TRANSITIONS[supportCase.status] || [],
  };

  return NextResponse.json(response);
}

/**
 * PATCH /api/v1/support/cases/:id
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!uuidRegex.test(id)) {
    return NextResponse.json(
      { error: "Not Found", message: "Case not found" },
      { status: 404 }
    );
  }

  const auth = await requireCapability(req, "admin:full");
  if (!auth.ok) {
    return auth.response;
  }

  // Fetch current case
  const currentCase = await prisma.supportCase.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!currentCase) {
    return NextResponse.json(
      { error: "Not Found", message: "Case not found" },
      { status: 404 }
    );
  }

  // Parse body
  const body = await req.json();

  // Validate status transition if status is being changed
  if (body.status && body.status !== currentCase.status) {
    const validTransitions = VALID_TRANSITIONS[currentCase.status];
    if (!validTransitions.includes(body.status)) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Invalid status transition from " + currentCase.status + " to " + body.status,
        },
        { status: 400 }
      );
    }
  }

  // Build update data
  const updateData: Prisma.SupportCaseUpdateInput = {};

  // Status fields
  if (body.status) updateData.status = body.status;
  if (body.category) updateData.category = body.category;
  if (body.ownerId) updateData.owner = { connect: { id: body.ownerId } };

  // Resolution fields
  if (body.resolution) updateData.resolution = body.resolution;
  if (body.resolutionNotes !== undefined) updateData.resolutionNotes = body.resolutionNotes;
  if (body.preventiveAction !== undefined) updateData.preventiveAction = body.preventiveAction;
  if (body.linkedPR !== undefined) updateData.linkedPR = body.linkedPR;
  if (body.linkedDocs !== undefined) updateData.linkedDocs = body.linkedDocs;

  // AI analysis fields
  if (body.aiRootCause !== undefined) updateData.aiRootCause = body.aiRootCause;
  if (body.aiProposedActions !== undefined) {
    updateData.aiProposedActions = body.aiProposedActions as Prisma.InputJsonValue;
  }
  if (body.aiRiskLevel !== undefined) updateData.aiRiskLevel = body.aiRiskLevel;
  if (body.aiEffortLevel !== undefined) updateData.aiEffortLevel = body.aiEffortLevel;

  // Handle closure
  if (body.status === "CLOSED") {
    updateData.closedAt = new Date();
    updateData.closedBy = { connect: { id: auth.context.memberId! } };
  }

  // Update case
  const updated = await prisma.supportCase.update({
    where: { id },
    data: updateData,
    select: { id: true, caseNumber: true, status: true, category: true },
  });

  // Add status change note if status changed
  if (body.status && body.status !== currentCase.status) {
    await prisma.supportCaseNote.create({
      data: {
        caseId: id,
        authorId: auth.context.memberId,
        noteType: "status_change",
        content: "Status changed from " + currentCase.status + " to " + body.status,
        metadata: {
          fromStatus: currentCase.status,
          toStatus: body.status,
          note: body.note,
        },
      },
    });
  }

  return NextResponse.json({
    id: updated.id,
    caseNumber: updated.caseNumber,
    status: updated.status,
    category: updated.category,
    message: "Case updated",
  });
}
