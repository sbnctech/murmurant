/**
 * GET /api/v1/me/registrations
 *
 * Returns the current member's event registrations.
 * Used by the MyRegistrationsGadget on the member dashboard.
 *
 * Query params:
 *   upcoming: "true" (default) - only upcoming events
 *   limit: number (default 10)
 *
 * Response:
 * {
 *   registrations: [
 *     {
 *       id: string,
 *       status: "CONFIRMED" | "PENDING" | "WAITLISTED" | "CANCELLED" | ...,
 *       event: {
 *         id: string,
 *         title: string,
 *         startTime: string,
 *         location: string | null
 *       }
 *     }
 *   ]
 * }
 *
 * Charter: P1 (identity provable), P2 (default deny)
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/passkey";
import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/api";

export async function GET(req: NextRequest) {
  // Check authentication
  const session = await getCurrentSession();
  if (!session) {
    return errors.unauthorized("Not authenticated");
  }

  // Parse query params
  const { searchParams } = new URL(req.url);
  const upcomingOnly = searchParams.get("upcoming") !== "false";
  const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);

  // Fetch registrations with conditional filter
  const registrations = await prisma.eventRegistration.findMany({
    where: {
      memberId: session.memberId,
      status: { notIn: ["CANCELLED"] },
      ...(upcomingOnly && {
        event: { startTime: { gte: new Date() } },
      }),
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          startTime: true,
          location: true,
        },
      },
    },
    orderBy: {
      event: { startTime: "asc" },
    },
    take: limit,
  });

  // Transform for response - flattened format for gadget consumption
  const now = new Date();
  const result = registrations.map((reg) => ({
    id: reg.id,
    eventId: reg.event.id,
    eventTitle: reg.event.title,
    eventDate: reg.event.startTime.toISOString(),
    eventLocation: reg.event.location,
    status: reg.status,
    registeredAt: reg.createdAt.toISOString(),
    isPast: reg.event.startTime < now,
  }));

  return NextResponse.json({ registrations: result });
}
