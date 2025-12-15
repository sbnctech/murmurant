import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
