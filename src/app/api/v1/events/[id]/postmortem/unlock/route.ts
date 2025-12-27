/**
 * POST /api/v1/events/{eventId}/postmortem/unlock
 *
 * VP Activities unlocks an approved postmortem for further editing.
 * Only from APPROVED status.
 *
 * Charter compliance:
 * - P3 (State machine): APPROVED -> UNLOCKED
 * - P7 (Audit logging): Status change logged
 *
 * Copyright (c) Santa Barbara Newcomers Club
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

function canUnlockPostmortem(role: GlobalRole): boolean {
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

  // Only VP Activities or admin can unlock
  if (!canUnlockPostmortem(globalRole)) {
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

    // Can only unlock from APPROVED status
    if (event.postmortem.status !== "APPROVED") {
      return errors.validation(
        `Cannot unlock postmortem in ${event.postmortem.status} status. Must be APPROVED.`
      );
    }

    // Update status to UNLOCKED
    const postmortem = await prisma.eventPostmortem.update({
      where: { id: event.postmortem.id },
      data: { status: "UNLOCKED" },
    });

    // Audit log for unlock (P1, P7)
    await auditMutation(request, authResult.context, {
      action: "UPDATE",
      capability: "postmortem:unlock",
      objectType: "EventPostmortem",
      objectId: postmortem.id,
      metadata: {
        eventId,
        previousStatus: "APPROVED",
        newStatus: "UNLOCKED",
      },
    });

    return apiSuccess({
      postmortem: {
        id: postmortem.id,
        eventId: postmortem.eventId,
        status: postmortem.status,
        updatedAt: postmortem.updatedAt.toISOString(),
      },
      message: "Postmortem unlocked for editing",
    });
  } catch (error) {
    console.error("Error unlocking postmortem:", error);
    return errors.internal("Failed to unlock postmortem");
  }
}
