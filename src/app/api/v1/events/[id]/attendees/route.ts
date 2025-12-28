/**
 * Event Attendees API
 * GET /api/v1/events/:id/attendees - List event attendees (admin only)
 */
import { NextRequest } from "next/server";
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
    const session = await getCurrentSession();
    if (!session) {
      return errors.unauthorized("Not authenticated");
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true },
    });

    if (!event) {
      return errors.notFound("Event", eventId);
    }

    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId, status: { in: ["CONFIRMED", "PENDING", "PENDING_PAYMENT"] } },
      include: {
        member: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { registeredAt: "asc" },
    });

    return apiSuccess({
      eventId,
      eventTitle: event.title,
      attendees: registrations.map((r) => ({
        id: r.id,
        memberId: r.member.id,
        name: `${r.member.firstName} ${r.member.lastName}`,
        email: r.member.email,
        status: r.status,
        registeredAt: r.registeredAt.toISOString(),
      })),
      total: registrations.length,
    });
  } catch (error) {
    console.error("Error fetching attendees:", error);
    return errors.internal("Failed to fetch attendees");
  }
}
