/**
 * POST /api/v1/events/{eventId}/postmortem/approve
 *
 * VP Activities approves postmortem.
 * Only from SUBMITTED status.
 *
 * Charter compliance:
 * - P3 (State machine): SUBMITTED -> APPROVED
 * - P7 (Audit logging): Status change logged with approver
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { NextRequest } from "next/server";
import { requireAuth, hasCapability, type GlobalRole } from "@/lib/auth";
import { apiSuccess } from "@/lib/api/responses";
import { errors } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";
import { auditMutation } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function canApprovePostmortem(role: GlobalRole): boolean {
  return hasCapability(role, "admin:full") || role === "vp-activities";
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: eventId } = await params;

  if (!uuidRegex.test(eventId)) {
    return errors.notFound("Event", eventId);
  }

  const authResult = await requireAuth(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const { memberId, globalRole } = authResult.context;

  // Only VP Activities or admin can approve
  if (!canApprovePostmortem(globalRole)) {
    return errors.forbidden();
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { postmortem: true },
    });

    if (!event) {
      return errors.notFound("Event", eventId);
    }

    if (!event.postmortem) {
      return errors.notFound("Postmortem", eventId);
    }

    // Can only approve from SUBMITTED status
    if (event.postmortem.status !== "SUBMITTED") {
      return errors.validation(
        `Cannot approve postmortem in ${event.postmortem.status} status. Must be SUBMITTED.`
      );
    }

    // Update status to APPROVED
    const postmortem = await prisma.eventPostmortem.update({
      where: { id: event.postmortem.id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedBy: memberId,
      },
      include: {
        approver: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    await auditMutation(request, authResult.context, {
      action: "UPDATE",
      capability: "admin:full",
      objectType: "EventPostmortem",
      objectId: postmortem.id,
      metadata: {
        eventId,
        previousStatus: "SUBMITTED",
        newStatus: "APPROVED",
        action: "approve",
      },
    });

    return apiSuccess({
      postmortem: {
        id: postmortem.id,
        eventId: postmortem.eventId,
        status: postmortem.status,
        approvedAt: postmortem.approvedAt?.toISOString(),
        approver: postmortem.approver
          ? {
              id: postmortem.approver.id,
              name: `${postmortem.approver.firstName} ${postmortem.approver.lastName}`,
            }
          : null,
        updatedAt: postmortem.updatedAt.toISOString(),
      },
      message: "Postmortem approved",
    });
  } catch (error) {
    console.error("Error approving postmortem:", error);
    return errors.internal("Failed to approve postmortem");
  }
}
