import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireEventViewAccess,
  requireEventEditAccess,
  requireEventDeleteAccess,
} from "@/lib/eventAuth";

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
  ];

  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      // Convert date strings to Date objects
      if ((field === "startTime" || field === "endTime") && body[field]) {
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
