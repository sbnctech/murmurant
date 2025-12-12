import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

type ActivityItem = {
  id: string;
  type: "REGISTRATION";
  memberId: string;
  memberName: string;
  eventId: string;
  eventTitle: string;
  status: string;
  registeredAt: string;
};

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);

  // Parse pagination params with defaults
  const pageParam = searchParams.get("page");
  const pageSizeParam = searchParams.get("pageSize");
  const limitParam = searchParams.get("limit");

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

  // Legacy limit param support (for backward compatibility)
  if (limitParam !== null && pageParam === null && pageSizeParam === null) {
    const limit = parseInt(limitParam, 10);
    if (!isNaN(limit) && limit > 0) {
      const dbRegistrations = await prisma.eventRegistration.findMany({
        take: limit,
        orderBy: { registeredAt: "desc" },
        include: {
          member: { select: { firstName: true, lastName: true } },
          event: { select: { title: true } },
        },
      });

      const activity: ActivityItem[] = dbRegistrations.map((r) => ({
        id: r.id,
        type: "REGISTRATION" as const,
        memberId: r.memberId,
        memberName: `${r.member.firstName} ${r.member.lastName}`,
        eventId: r.eventId,
        eventTitle: r.event.title,
        status: r.status,
        registeredAt: r.registeredAt.toISOString(),
      }));

      return NextResponse.json({ activity });
    }
  }

  // Get total count
  const totalItems = await prisma.eventRegistration.count();

  // Fetch paginated registrations
  const dbRegistrations = await prisma.eventRegistration.findMany({
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: { registeredAt: "desc" },
    include: {
      member: { select: { firstName: true, lastName: true } },
      event: { select: { title: true } },
    },
  });

  const items: ActivityItem[] = dbRegistrations.map((r) => ({
    id: r.id,
    type: "REGISTRATION" as const,
    memberId: r.memberId,
    memberName: `${r.member.firstName} ${r.member.lastName}`,
    eventId: r.eventId,
    eventTitle: r.event.title,
    status: r.status,
    registeredAt: r.registeredAt.toISOString(),
  }));

  const totalPages = Math.ceil(totalItems / pageSize);

  return NextResponse.json({
    activity: items,
    items,
    page,
    pageSize,
    totalItems,
    totalPages,
  });
}
