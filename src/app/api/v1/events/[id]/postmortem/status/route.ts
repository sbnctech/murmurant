/**
 * Event Postmortem Status API
 *
 * POST /api/v1/events/:id/postmortem/status - Change postmortem status
 *
 * Actions:
 * - submit: DRAFT -> SUBMITTED (Chair only)
 * - approve: SUBMITTED -> APPROVED (VP only)
 * - return: SUBMITTED -> DRAFT (VP only)
 * - unlock: APPROVED -> UNLOCKED (VP only)
 *
 * Charter Compliance:
 * - P1: Identity via session auth
 * - P2: Default deny authorization
 * - P3: Explicit state machine
 * - P7: Audit logging for status changes
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, hasCapability, type GlobalRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PostmortemStatus } from "@prisma/client";
import { createAuditEntry } from "@/lib/audit";

// UUID validation
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type StatusAction = "submit" | "approve" | "return" | "unlock";

/**
 * Check if user has VP-level access
 */
function hasVPAccess(role: GlobalRole): boolean {
  return hasCapability(role, "events:edit");
}

/**
 * POST /api/v1/events/:id/postmortem/status
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;

  if (!uuidRegex.test(eventId)) {
    return NextResponse.json(
      { error: "Not Found", message: "Event not found" },
      { status: 404 }
    );
  }

  const auth = await requireAuth(req);
  if (!auth.ok) {
    return auth.response;
  }

  // Parse body
  let body: {
    action?: StatusAction;
    note?: string;
    // Optional contact overrides for submit action
    submittedByName?: string;
    submittedByEmail?: string;
    submittedByPhone?: string;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const validActions: StatusAction[] = ["submit", "approve", "return", "unlock"];
  if (!body.action || !validActions.includes(body.action)) {
    return NextResponse.json(
      {
        error: "Bad Request",
        message: "Invalid action. Must be one of: submit, approve, return, unlock",
      },
      { status: 400 }
    );
  }

  // Check event exists
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, eventChairId: true, title: true },
  });

  if (!event) {
    return NextResponse.json(
      { error: "Not Found", message: "Event not found" },
      { status: 404 }
    );
  }

  // Fetch postmortem
  const postmortem = await prisma.eventPostmortem.findUnique({
    where: { eventId },
  });

  if (!postmortem) {
    return NextResponse.json(
      { error: "Not Found", message: "Postmortem not found" },
      { status: 404 }
    );
  }

  const isChair = event.eventChairId === auth.context.memberId;
  const isVP = hasVPAccess(auth.context.globalRole);

  // Define valid transitions and who can perform them
  type TransitionDef = {
    from: PostmortemStatus;
    to: PostmortemStatus;
    requiredRole: "chair" | "vp";
    auditAction: string;
  };

  const transitions: Record<StatusAction, TransitionDef> = {
    submit: {
      from: "DRAFT",
      to: "SUBMITTED",
      requiredRole: "chair",
      auditAction: "POSTMORTEM_SUBMITTED",
    },
    approve: {
      from: "SUBMITTED",
      to: "APPROVED",
      requiredRole: "vp",
      auditAction: "POSTMORTEM_APPROVED",
    },
    return: {
      from: "SUBMITTED",
      to: "DRAFT",
      requiredRole: "vp",
      auditAction: "POSTMORTEM_RETURNED",
    },
    unlock: {
      from: "APPROVED",
      to: "UNLOCKED",
      requiredRole: "vp",
      auditAction: "POSTMORTEM_UNLOCKED",
    },
  };

  const transition = transitions[body.action];

  // Check current status
  if (postmortem.status !== transition.from) {
    return NextResponse.json(
      {
        error: "Bad Request",
        message: "Cannot " + body.action + " from " + postmortem.status + " status",
      },
      { status: 400 }
    );
  }

  // Check authorization
  if (transition.requiredRole === "chair" && !isChair && !isVP) {
    return NextResponse.json(
      { error: "Forbidden", message: "Only the event chair can perform this action" },
      { status: 403 }
    );
  }

  if (transition.requiredRole === "vp" && !isVP) {
    return NextResponse.json(
      { error: "Forbidden", message: "This action requires VP Activities access" },
      { status: 403 }
    );
  }

  // Build update data
  const updateData: Record<string, unknown> = {
    status: transition.to,
  };

  // Add author contact fields if submitting
  if (body.action === "submit") {
    updateData.submittedAt = new Date();

    // Fetch member contact info
    const member = await prisma.member.findUnique({
      where: { id: auth.context.memberId! },
      select: { firstName: true, lastName: true, email: true, phone: true },
    });

    // Use body overrides if provided, otherwise use member profile
    updateData.submittedByName = body.submittedByName ||
      (member ? `${member.firstName} ${member.lastName}` : null);
    updateData.submittedByEmail = body.submittedByEmail || member?.email || null;
    updateData.submittedByPhone = body.submittedByPhone || member?.phone || null;
  }

  // Add approval fields if approving
  if (body.action === "approve") {
    updateData.approvedAt = new Date();
    updateData.approvedBy = auth.context.memberId;
  }

  // Clear approval fields if unlocking
  if (body.action === "unlock") {
    updateData.approvedAt = null;
    updateData.approvedBy = null;
  }

  // Update postmortem
  const updated = await prisma.eventPostmortem.update({
    where: { eventId },
    data: updateData,
  });

  // Audit log
  await createAuditEntry({
    action: "UPDATE",
    resourceType: "EventPostmortem",
    resourceId: postmortem.id,
    actor: auth.context,
    req,
    before: { status: postmortem.status },
    after: { status: updated.status },
    metadata: {
      transition: transition.auditAction,
      eventId,
      eventTitle: event.title,
      note: body.note,
    },
  });

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    message: getSuccessMessage(body.action),
  });
}

function getSuccessMessage(action: StatusAction): string {
  switch (action) {
    case "submit":
      return "Postmortem submitted for review";
    case "approve":
      return "Postmortem approved";
    case "return":
      return "Postmortem returned for revision";
    case "unlock":
      return "Postmortem unlocked for editing";
  }
}
