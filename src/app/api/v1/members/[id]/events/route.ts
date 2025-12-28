import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  apiSuccess,
  errors,
  parsePaginationParams,
  createPagination,
} from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/members/:id/events
 *
 * Get a member's event registrations.
 * Requires authentication.
 *
 * Query params:
 * - page: number (default 1)
 * - limit: number (default 20, max 100)
 * - upcoming: boolean (filter to future events only)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;

  // Verify member exists
  const member = await prisma.member.findUnique({ where: { id } });
  if (!member) {
    return errors.notFound("Member", id);
  }

  const searchParams = request.nextUrl.searchParams;
  const { page, limit } = parsePaginationParams(searchParams);
  const upcoming = searchParams.get("upcoming") === "true";

  const where: Prisma.EventRegistrationWhereInput = {
    memberId: id,
  };

  if (upcoming) {
    where.event = {
      startTime: { gte: new Date() },
    };
  }

  const [registrations, totalItems] = await Promise.all([
    prisma.eventRegistration.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { registeredAt: "desc" },
      include: {
        event: true,
      },
    }),
    prisma.eventRegistration.count({ where }),
  ]);

  return apiSuccess({
    data: registrations.map((r) => ({
      id: r.id,
      status: r.status,
      registeredAt: r.registeredAt.toISOString(),
      event: {
        id: r.event.id,
        title: r.event.title,
        startTime: r.event.startTime.toISOString(),
        endTime: r.event.endTime?.toISOString() ?? null,
        location: r.event.location,
      },
    })),
    pagination: createPagination(page, limit, totalItems),
  });
}
