// Copyright © 2025 Murmurant, Inc.
// Member directory page - searchable grid of club members

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { MemberDirectoryClient } from "./MemberDirectoryClient";

async function getMemberIdFromSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("member_session");
  if (!sessionCookie?.value) return null;
  return sessionCookie.value;
}

export const metadata = {
  title: "Member Directory",
  description: "Find and connect with fellow club members",
};

export default async function MemberDirectoryPage() {
  // Check authentication
  const memberId = await getMemberIdFromSession();
  if (!memberId) {
    redirect("/login?redirect=/directory");
  }

  // Fetch all active members with their committee assignments
  const members = await prisma.member.findMany({
    where: {
      membershipStatus: {
        isActive: true,
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      joinedAt: true,
      roleAssignments: {
        where: {
          endDate: null, // Current assignments only
        },
        select: {
          committee: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  // Fetch all active committees for the filter
  const committees = await prisma.committee.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });

  // Transform data for client component
  const membersForClient = members.map((m) => ({
    id: m.id,
    firstName: m.firstName,
    lastName: m.lastName,
    joinedAt: m.joinedAt.toISOString(),
    photoUrl: null, // Photo functionality not yet implemented
    committees: m.roleAssignments.map((ra) => ({
      id: ra.committee.id,
      name: ra.committee.name,
    })),
  }));

  return (
    <div data-test-id="member-directory-page">
      <h1
        style={{
          fontSize: "28px",
          fontWeight: 700,
          marginBottom: "8px",
          color: "#1f2937",
        }}
      >
        Member Directory
      </h1>
      <p
        style={{
          fontSize: "16px",
          color: "#6b7280",
          marginBottom: "24px",
        }}
      >
        Find and connect with fellow club members
      </p>

      <MemberDirectoryClient
        members={membersForClient}
        committees={committees}
      />
    </div>
  );
}
