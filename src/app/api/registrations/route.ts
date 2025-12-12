import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const dbRegistrations = await prisma.eventRegistration.findMany({
    select: {
      id: true,
      memberId: true,
      eventId: true,
      status: true,
      registeredAt: true,
    },
    orderBy: {
      registeredAt: "desc",
    },
  });

  const registrations = dbRegistrations.map((r) => ({
    id: r.id,
    memberId: r.memberId,
    eventId: r.eventId,
    status: r.status,
    registeredAt: r.registeredAt.toISOString(),
  }));

  return NextResponse.json({ registrations });
}
