import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

type AdminEventListItem = {
  id: string;
  title: string;
  category: string | null;
  startTime: string;
  registrationCount: number;
  waitlistedCount: number;
  eventChairId: string | null;
};

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);

  // Parse pagination params with defaults
  const pageParam = searchParams.get("page");
  const pageSizeParam = searchParams.get("pageSize");

  let page = 1;
  let pageSize = 20;

  if (pageParam !== null) {
    const parsed = parseInt(pageParam, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      page = parsed;
    }
  }

  if (pageSizeParam !== null) {
    const parsed = parseInt(pageSizeParam, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      pageSize = Math.min(parsed, 100);
    }
  }

  // Get total count for pagination
  const totalItems = await prisma.event.count();

  const totalPages = Math.ceil(totalItems / pageSize);
  const skip = (page - 1) * pageSize;

  // Fetch events with registration counts
  const events = await prisma.event.findMany({
    include: {
      _count: {
        select: {
          registrations: true,
        },
      },
    },
    orderBy: {
      startTime: "asc",
    },
    skip,
    take: pageSize,
  });

  // Get waitlisted counts for these events
  const eventIds = events.map((e) => e.id);
  const waitlistedCounts = await prisma.eventRegistration.groupBy({
    by: ["eventId"],
    where: {
      eventId: { in: eventIds },
      status: "WAITLISTED",
    },
    _count: true,
  });

  const waitlistedMap = new Map(
    waitlistedCounts.map((w) => [w.eventId, w._count])
  );

  const items: AdminEventListItem[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    category: e.category,
    startTime: e.startTime.toISOString(),
    registrationCount: e._count.registrations,
    waitlistedCount: waitlistedMap.get(e.id) ?? 0,
  }));

  return NextResponse.json({
    items,
    page,
    pageSize,
    totalItems,
    totalPages,
  });
}
