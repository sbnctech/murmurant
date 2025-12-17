// Copyright (c) Santa Barbara Newcomers Club
// Admin registration search API - requires registrations:view capability
// Charter: P1 (identity provable), P2 (default deny), P9 (fail closed)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RegistrationStatus } from "@prisma/client";
import { requireCapability } from "@/lib/auth";

type EnrichedRegistration = {
  id: string;
  memberId: string;
  memberName: string;
  eventId: string;
  eventTitle: string;
  status: string;
  registeredAt: string;
};

export async function GET(req: NextRequest) {
  // Charter P1/P2: Require authenticated identity with registrations:view capability
  const auth = await requireCapability(req, "registrations:view");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const memberIdFilter = searchParams.get("memberId");
  const eventIdFilter = searchParams.get("eventId");
  const statusFilter = searchParams.get("status");

  // Build Prisma where clause
  const where: {
    memberId?: string;
    eventId?: string;
    status?: RegistrationStatus;
  } = {};

  if (memberIdFilter) {
    where.memberId = memberIdFilter;
  }

  if (eventIdFilter) {
    where.eventId = eventIdFilter;
  }

  if (statusFilter && Object.values(RegistrationStatus).includes(statusFilter as RegistrationStatus)) {
    where.status = statusFilter as RegistrationStatus;
  }

  const dbRegistrations = await prisma.eventRegistration.findMany({
    where,
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

  const registrations: EnrichedRegistration[] = dbRegistrations.map((r) => ({
    id: r.id,
    memberId: r.memberId,
    memberName: `${r.member.firstName} ${r.member.lastName}`,
    eventId: r.eventId,
    eventTitle: r.event.title,
    status: r.status,
    registeredAt: r.registeredAt.toISOString(),
  }));

  return NextResponse.json({ registrations });
}
