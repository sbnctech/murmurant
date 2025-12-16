// Copyright (c) Santa Barbara Newcomers Club
// Admin member detail API - requires members:view capability
// Charter: P1 (identity provable), P2 (default deny), P9 (fail closed)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/auth";

type MemberDetailResponse = {
  member: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    joinedAt: string;
    status: string;
  };
  registrations: Array<{
    id: string;
    eventId: string;
    eventTitle: string;
    status: string;
    registeredAt: string;
  }>;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Charter P1/P2: Require authenticated identity with members:view capability
  const auth = await requireCapability(req, "members:view");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  // Validate UUID format to avoid Prisma errors
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      membershipStatus: true,
      eventRegistrations: {
        include: {
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          registeredAt: "desc",
        },
      },
    },
  });

  if (!member) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const response: MemberDetailResponse = {
    member: {
      id: member.id,
      name: `${member.firstName} ${member.lastName}`,
      email: member.email,
      phone: member.phone,
      joinedAt: member.joinedAt.toISOString(),
      status: member.membershipStatus.code,
    },
    registrations: member.eventRegistrations.map((r) => ({
      id: r.id,
      eventId: r.eventId,
      eventTitle: r.event.title,
      status: r.status,
      registeredAt: r.registeredAt.toISOString(),
    })),
  };

  return NextResponse.json(response);
}
