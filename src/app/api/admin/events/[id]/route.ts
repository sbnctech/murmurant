/**
 * Admin Events API - Single Event Operations
 *
 * GET /api/admin/events/:id - Get event details with registrations
 * PATCH /api/admin/events/:id - Update event (with clone safeguards)
 * DELETE /api/admin/events/:id - Delete event
 *
 * Clone Safeguards (Charter P6):
 * - Cloned events with placeholder dates (epoch) cannot be submitted or published
 * - Cloned events must have explicit startTime set before workflow actions
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireEventViewAccess,
  requireEventEditAccess,
  requireEventDeleteAccess,
} from "@/lib/eventAuth";
import { EventStatus } from "@prisma/client";

// Epoch date used as placeholder for cloned events
const EPOCH_DATE = new Date(0).getTime();

/**
 * Check if a date is the placeholder epoch date (1970-01-01)
 */
function isPlaceholderDate(date: Date): boolean {
  return date.getTime() === EPOCH_DATE;
}

type EventDetailResponse = {
  event: {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    location: string | null;
    startTime: string;
    endTime: string | null;
    capacity: number | null;
    isPublished: boolean;
    eventChairId: string | null;
    status: EventStatus;
    // Clone tracking
    clonedFromId: string | null;
    clonedAt: string | null;
    isClonedDraft: boolean; // True if cloned with placeholder dates
    registrations: Array<{
      id: string;
      memberId: string;
      memberName: string;
      status: string;
      registeredAt: string;
    }>;
  };
};

// Validate UUID format
const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Check authorization (admin or event chair)
  const auth = await requireEventViewAccess(req, id);
  if (!auth.ok) {
    return auth.response;
  }

  // Fetch event with registrations and member details
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      registrations: {
        include: {
          member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          registeredAt: "asc",
        },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Determine if this is a cloned draft with placeholder dates
  const isClonedDraft =
    !!event.clonedFromId &&
    event.status === EventStatus.DRAFT &&
    isPlaceholderDate(event.startTime);

  const response: EventDetailResponse = {
    event: {
      id: event.id,
      title: event.title,
      description: event.description,
      category: event.category,
      location: event.location,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime?.toISOString() ?? null,
      capacity: event.capacity,
      isPublished: event.isPublished,
      eventChairId: event.eventChairId,
      status: event.status,
      clonedFromId: event.clonedFromId,
      clonedAt: event.clonedAt?.toISOString() ?? null,
      isClonedDraft,
      registrations: event.registrations.map((r) => ({
        id: r.id,
        memberId: r.memberId,
        memberName: `${r.member.firstName} ${r.member.lastName}`,
        status: r.status,
        registeredAt: r.registeredAt.toISOString(),
      })),
    },
  };

  return NextResponse.json(response);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Check authorization (admin or event chair)
  const auth = await requireEventEditAccess(req, id);
  if (!auth.ok) {
    return auth.response;
  }

  const body = await req.json();

  // Fetch current event to check clone status and dates
  const currentEvent = await prisma.event.findUnique({
    where: { id },
    select: {
      startTime: true,
      clonedFromId: true,
      status: true,
    },
  });

  if (!currentEvent) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Clone safeguards (Charter P6)
  // Cloned events with placeholder dates cannot be submitted/published
  const isClonedEvent = !!currentEvent.clonedFromId;
  const hasPlaceholderDate = isPlaceholderDate(currentEvent.startTime);
  const newStartTime = body.startTime ? new Date(body.startTime) : null;
  const willHavePlaceholderDate = newStartTime
    ? isPlaceholderDate(newStartTime)
    : hasPlaceholderDate;

  // Check status transitions
  const requestedStatus = body.status as EventStatus | undefined;
  const requestedPublish = body.isPublished as boolean | undefined;

  // Statuses that require valid dates (cannot advance with placeholder)
  const WORKFLOW_STATUSES: EventStatus[] = [
    EventStatus.PENDING_APPROVAL,
    EventStatus.APPROVED,
    EventStatus.PUBLISHED,
  ];

  // Block publishing or status advancement if cloned event has placeholder date
  if (isClonedEvent && willHavePlaceholderDate) {
    const isAdvancingStatus =
      requestedStatus && WORKFLOW_STATUSES.includes(requestedStatus);

    const isPublishing = requestedPublish === true;

    if (isAdvancingStatus || isPublishing) {
      return NextResponse.json(
        {
          error: "Cloned event requires explicit dates",
          message:
            "This event was cloned and still has placeholder dates. " +
            "You must set a valid start time before submitting for approval or publishing.",
          code: "CLONE_REQUIRES_DATES",
          isCloned: true,
        },
        { status: 400 }
      );
    }
  }

  // Only allow updating specific fields
  const allowedFields = [
    "title",
    "description",
    "category",
    "location",
    "startTime",
    "endTime",
    "capacity",
    "isPublished",
    "status",
    "eventChairId",
    "registrationDeadline",
    "publishAt",
  ];

  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      // Convert date strings to Date objects
      if (
        ["startTime", "endTime", "registrationDeadline", "publishAt"].includes(
          field
        ) &&
        body[field]
      ) {
        updateData[field] = new Date(body[field]);
      } else {
        updateData[field] = body[field];
      }
    }
  }

  const updatedEvent = await prisma.event.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({
    event: {
      id: updatedEvent.id,
      title: updatedEvent.title,
      description: updatedEvent.description,
      category: updatedEvent.category,
      location: updatedEvent.location,
      startTime: updatedEvent.startTime.toISOString(),
      endTime: updatedEvent.endTime?.toISOString() ?? null,
      capacity: updatedEvent.capacity,
      isPublished: updatedEvent.isPublished,
      eventChairId: updatedEvent.eventChairId,
      status: updatedEvent.status,
      clonedFromId: updatedEvent.clonedFromId,
    },
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Check authorization (admin only - event chairs cannot delete)
  const auth = await requireEventDeleteAccess(req, id);
  if (!auth.ok) {
    return auth.response;
  }

  // Delete all registrations first, then the event
  await prisma.eventRegistration.deleteMany({
    where: { eventId: id },
  });

  await prisma.event.delete({
    where: { id },
  });

  return new NextResponse(null, { status: 204 });
}
