/**
 * POST /api/v1/events/{eventId}/postmortem/return
 *
 * VP Activities returns postmortem for revision.
 * Only from SUBMITTED status.
 *
 * Charter compliance:
 * - P3 (State machine): SUBMITTED -> DRAFT
 * - P7 (Audit logging): Status change logged
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

function canReturnPostmortem(role: GlobalRole): boolean {
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

  const { globalRole } = authResult.context;

  // Only VP Activities or admin can return for revision
  if (!canReturnPostmortem(globalRole)) {
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

    // Can only return from SUBMITTED status
    if (event.postmortem.status !== "SUBMITTED") {
      return errors.validation(
        `Cannot return postmortem in ${event.postmortem.status} status. Must be SUBMITTED.`
      );
    }

    // Update status back to DRAFT
    const postmortem = await prisma.eventPostmortem.update({
      where: { id: event.postmortem.id },
      data: { status: "DRAFT" },
    });

    await auditMutation(request, authResult.context, {
      action: "UPDATE",
      capability: "admin:full",
      objectType: "EventPostmortem",
      objectId: postmortem.id,
      metadata: {
        eventId,
        previousStatus: "SUBMITTED",
        newStatus: "DRAFT",
        action: "return",
      },
    });

    return apiSuccess({
      postmortem: {
        id: postmortem.id,
        eventId: postmortem.eventId,
        status: postmortem.status,
        updatedAt: postmortem.updatedAt.toISOString(),
      },
      message: "Postmortem returned for revision",
    });
  } catch (error) {
    console.error("Error returning postmortem:", error);
    return errors.internal("Failed to return postmortem");
  }
}
