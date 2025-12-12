import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type MemberResult = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  joinedAt: string;
  status: string;
};

type EventResult = {
  id: string;
  title: string;
  category: string | null;
  startTime: string;
};

type RegistrationResult = {
  id: string;
  memberId: string;
  eventId: string;
  status: string;
  registeredAt: string;
  memberName: string;
  eventTitle: string;
};

type SearchResults = {
  members: MemberResult[];
  events: EventResult[];
  registrations: RegistrationResult[];
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get("q") ?? "").trim();

  if (!query) {
    return NextResponse.json({
      results: {
        members: [],
        events: [],
        registrations: [],
      },
    });
  }

  // Search members by name or email (case-insensitive)
  const matchedMembers = await prisma.member.findMany({
    where: {
      OR: [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    },
    include: {
      membershipStatus: true,
    },
    orderBy: {
      lastName: "asc",
    },
  });

  // Search events by title (case-insensitive)
  const matchedEvents = await prisma.event.findMany({
    where: {
      title: { contains: query, mode: "insensitive" },
    },
    orderBy: {
      startTime: "asc",
    },
  });

  // Search registrations by member name or event title
  const matchedRegistrations = await prisma.eventRegistration.findMany({
    where: {
      OR: [
        { member: { firstName: { contains: query, mode: "insensitive" } } },
        { member: { lastName: { contains: query, mode: "insensitive" } } },
        { event: { title: { contains: query, mode: "insensitive" } } },
      ],
    },
    include: {
      member: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      event: {
        select: {
          title: true,
        },
      },
    },
    orderBy: {
      registeredAt: "asc",
    },
  });

  const results: SearchResults = {
    members: matchedMembers.map((m) => ({
      id: m.id,
      firstName: m.firstName,
      lastName: m.lastName,
      email: m.email,
      phone: m.phone ?? "",
      joinedAt: m.joinedAt.toISOString(),
      status: m.membershipStatus.isActive ? "ACTIVE" : "INACTIVE",
    })),
    events: matchedEvents.map((e) => ({
      id: e.id,
      title: e.title,
      category: e.category,
      startTime: e.startTime.toISOString(),
    })),
    registrations: matchedRegistrations.map((r) => ({
      id: r.id,
      memberId: r.memberId,
      eventId: r.eventId,
      status: r.status,
      registeredAt: r.registeredAt.toISOString(),
      memberName: `${r.member.firstName} ${r.member.lastName}`,
      eventTitle: r.event.title,
    })),
  };

  return NextResponse.json({ results });
}
