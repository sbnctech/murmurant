import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type MemberResponse = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  joinedAt: string;
  status: string;
};

export async function GET() {
  // Fetch active members (those with active membership status)
  const members = await prisma.member.findMany({
    where: {
      membershipStatus: {
        isActive: true,
      },
    },
    include: {
      membershipStatus: true,
    },
    orderBy: {
      lastName: "asc",
    },
  });

  const response: MemberResponse[] = members.map((m) => ({
    id: m.id,
    firstName: m.firstName,
    lastName: m.lastName,
    email: m.email,
    phone: m.phone ?? "",
    joinedAt: m.joinedAt.toISOString(),
    status: m.membershipStatus.isActive ? "ACTIVE" : "INACTIVE",
  }));

  return NextResponse.json({ members: response });
}
