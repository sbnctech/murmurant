// Copyright (c) Santa Barbara Newcomers Club
// Admin registration detail API - requires registrations:view capability
// Charter: P1 (identity provable), P2 (default deny), P9 (fail closed)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/auth";

type RegistrationDetailResponse = {
  registration: {
    id: string;
    memberId: string;
    memberName: string;
    eventId: string;
    eventTitle: string;
    status: string;
    registeredAt: string;
  };
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Charter P1/P2: Require authenticated identity with registrations:view capability
  const auth = await requireCapability(req, "registrations:view");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  let registration;
  try {
    registration = await prisma.eventRegistration.findUnique({
      where: { id },
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
  } catch {
    // Invalid UUID format or other Prisma error
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!registration) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const response: RegistrationDetailResponse = {
    registration: {
      id: registration.id,
      memberId: registration.memberId,
      memberName: `${registration.member.firstName} ${registration.member.lastName}`,
      eventId: registration.eventId,
      eventTitle: registration.event.title,
      status: registration.status,
      registeredAt: registration.registeredAt.toISOString(),
    },
  };

  return NextResponse.json(response);
}
