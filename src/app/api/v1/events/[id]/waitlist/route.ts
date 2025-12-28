/**
 * Event Waitlist API
 * GET /api/v1/events/:id/waitlist - Get waitlist
 * POST /api/v1/events/:id/waitlist - Join waitlist
 */
import { NextRequest, NextResponse } from "next/server";
import { errors, apiSuccess } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: eventId } = await params;
  void request;

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true },
    });

    if (!event) {
      return errors.notFound("Event", eventId);
    }

    const entries = await prisma.eventRegistration.findMany({
      where: { eventId, status: "WAITLISTED" },
      include: { member: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { waitlistPosition: "asc" },
    });

    return apiSuccess({
      eventId,
      eventTitle: event.title,
      waitlist: entries.map((e) => ({
        id: e.id,
        position: e.waitlistPosition,
        memberId: e.member.id,
        name: `${e.member.firstName} ${e.member.lastName}`,
        joinedAt: e.registeredAt.toISOString(),
      })),
      total: entries.length,
    });
  } catch (error) {
    console.error("Error fetching waitlist:", error);
    return errors.internal("Failed to fetch waitlist");
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: eventId } = await params;
  void request;

  try {
    const session = await getCurrentSession();
    if (!session) {
      return errors.unauthorized("Not authenticated");
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event || !event.isPublished) {
      return errors.notFound("Event", eventId);
    }

    const existing = await prisma.eventRegistration.findFirst({
      where: { eventId, memberId: session.memberId, status: { notIn: ["CANCELLED"] } },
    });

    if (existing) {
      return NextResponse.json({ error: "Already on waitlist or registered" }, { status: 409 });
    }

    const maxPos = await prisma.eventRegistration.aggregate({
      where: { eventId, status: "WAITLISTED" },
      _max: { waitlistPosition: true },
    });

    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        memberId: session.memberId,
        status: "WAITLISTED",
        waitlistPosition: (maxPos._max.waitlistPosition ?? 0) + 1,
        registeredAt: new Date(),
      },
    });

    return NextResponse.json({ id: registration.id, status: "WAITLISTED", position: registration.waitlistPosition }, { status: 201 });
  } catch (error) {
    console.error("Error joining waitlist:", error);
    return errors.internal("Failed to join waitlist");
  }
}
