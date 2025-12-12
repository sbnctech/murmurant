import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type AdminRegistrationListItem = {
  id: string;
  memberId: string;
  memberName: string;
  eventId: string;
  eventTitle: string;
  status: string;
  registeredAt: string;
};

export async function GET(req: NextRequest) {
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

  // Get total count
  const totalItems = await prisma.eventRegistration.count();

  // Fetch registrations with member and event data
  const dbRegistrations = await prisma.eventRegistration.findMany({
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: { registeredAt: "desc" },
    include: {
      member: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      event: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  const items: AdminRegistrationListItem[] = dbRegistrations.map((r) => ({
    id: r.id,
    memberId: r.memberId,
    memberName: `${r.member.firstName} ${r.member.lastName}`,
    eventId: r.eventId,
    eventTitle: r.event.title,
    status: r.status,
    registeredAt: r.registeredAt.toISOString(),
  }));

  const totalPages = Math.ceil(totalItems / pageSize);

  return NextResponse.json({
    items,
    page,
    pageSize,
    totalItems,
    totalPages,
  });
}
