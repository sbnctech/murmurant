/**
 * POST /api/v1/events/{eventId}/postmortem/submit
 *
 * Submit postmortem for VP review.
 * Only Event Chair can submit, only from DRAFT status.
 *
 * Charter compliance:
 * - P3 (State machine): DRAFT -> SUBMITTED
 * - P7 (Audit logging): Status change logged
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { NextRequest } from "next/server";
import { requireAuth, hasCapability } from "@/lib/auth";
import { apiSuccess } from "@/lib/api/responses";
import { errors } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";
import { auditMutation } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

    // Only event chair or admin can submit
    const isAdmin = hasCapability(globalRole, "admin:full");
    const isEventChair = event.eventChairId === memberId;

    if (!isAdmin && !isEventChair) {
      return errors.forbidden();
    }

    // Can only submit from DRAFT status
    if (event.postmortem.status !== "DRAFT") {
      return errors.validation(
        `Cannot submit postmortem in ${event.postmortem.status} status. Must be DRAFT.`
      );
    }

    // Update status to SUBMITTED
    const postmortem = await prisma.eventPostmortem.update({
      where: { id: event.postmortem.id },
      data: { status: "SUBMITTED" },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    await auditMutation(request, authResult.context, {
      action: "UPDATE",
      capability: isAdmin ? "admin:full" : "events:postmortem:submit",
      objectType: "EventPostmortem",
      objectId: postmortem.id,
      metadata: {
        eventId,
        previousStatus: "DRAFT",
        newStatus: "SUBMITTED",
      },
    });

    return apiSuccess({
      postmortem: {
        id: postmortem.id,
        eventId: postmortem.eventId,
        status: postmortem.status,
        updatedAt: postmortem.updatedAt.toISOString(),
      },
      message: "Postmortem submitted for review",
    });
  } catch (error) {
    console.error("Error submitting postmortem:", error);
    return errors.internal("Failed to submit postmortem");
  }
}
