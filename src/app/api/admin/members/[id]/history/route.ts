// Copyright (c) Santa Barbara Newcomers Club
// Member history API - requires members:history capability

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, hasCapability } from "@/lib/auth";

type MemberHistoryStats = {
  eventsAttended: number;
  volunteerRoles: number;
  leadershipRoles: number;
  yearsActive: number;
};

type MemberHistoryResponse = {
  memberId: string;
  memberName: string;
  summaryText: string;
  stats: MemberHistoryStats;
  timeline: Array<{
    id: string;
    serviceType: string;
    roleTitle: string;
    committeeName: string | null;
    eventTitle: string | null;
    startAt: string;
    endAt: string | null;
    isActive: boolean;
  }>;
};

/**
 * Generate a prose summary of the member's service history.
 */
function generateSummaryText(
  memberName: string,
  stats: MemberHistoryStats,
  timeline: MemberHistoryResponse["timeline"]
): string {
  const parts: string[] = [];

  // Opening
  parts.push(`${memberName} has been an active member of Santa Barbara Newcomers Club.`);

  // Years active
  if (stats.yearsActive > 0) {
    const yearsText = stats.yearsActive === 1 ? "1 year" : `${stats.yearsActive} years`;
    parts.push(`Over ${yearsText} of membership involvement.`);
  }

  // Leadership roles
  if (stats.leadershipRoles > 0) {
    const leadershipRecords = timeline.filter(
      (t) => t.serviceType === "BOARD_OFFICER" || t.serviceType === "COMMITTEE_CHAIR"
    );
    if (leadershipRecords.length > 0) {
      const rolesList = leadershipRecords
        .slice(0, 3)
        .map((r) => r.roleTitle + (r.committeeName ? ` (${r.committeeName})` : ""))
        .join(", ");
      parts.push(`Leadership contributions include: ${rolesList}.`);
    }
  }

  // Volunteer roles
  if (stats.volunteerRoles > 0) {
    const volText = stats.volunteerRoles === 1 ? "1 volunteer position" : `${stats.volunteerRoles} volunteer positions`;
    parts.push(`Has served in ${volText}.`);
  }

  // Events attended
  if (stats.eventsAttended > 0) {
    const eventsText = stats.eventsAttended === 1 ? "1 event" : `${stats.eventsAttended} events`;
    parts.push(`Attended ${eventsText}.`);
  }

  // Active roles
  const activeRoles = timeline.filter((t) => t.isActive);
  if (activeRoles.length > 0) {
    const activeList = activeRoles.map((r) => r.roleTitle).join(", ");
    parts.push(`Currently serving as: ${activeList}.`);
  }

  return parts.join(" ");
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check auth if provided - enforce members:history capability
  const authHeader = req.headers.get("Authorization");
  if (authHeader) {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;

    // If authenticated, check capability
    if (!hasCapability(auth.context.globalRole, "members:history")) {
      return NextResponse.json(
        { error: "Forbidden", message: "Required capability: members:history" },
        { status: 403 }
      );
    }
  }
  // In v0 permissive mode (no auth header), allow access for browser requests

  const { id } = await params;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch member basic info
  const member = await prisma.member.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      joinedAt: true,
    },
  });

  if (!member) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const memberName = `${member.firstName} ${member.lastName}`;

  // Fetch service history and registration count directly via Prisma
  // (Avoiding serviceHistory module import due to Zod/Prisma enum loading issues)
  const [serviceRecords, eventRegistrations] = await Promise.all([
    prisma.memberServiceHistory.findMany({
      where: { memberId: id },
      orderBy: [{ startAt: "desc" }, { createdAt: "desc" }],
    }),
    prisma.eventRegistration.count({
      where: {
        memberId: id,
        status: { in: ["CONFIRMED", "PENDING"] },
      },
    }),
  ]);

  // Calculate service counts by type
  const leadershipRoles = serviceRecords.filter(
    (r) => r.serviceType === "BOARD_OFFICER" || r.serviceType === "COMMITTEE_CHAIR"
  ).length;
  const volunteerRoles = serviceRecords.filter(
    (r) => r.serviceType === "COMMITTEE_MEMBER" || r.serviceType === "EVENT_HOST"
  ).length;

  // Calculate years active (from join date to now)
  const joinDate = member.joinedAt;
  const now = new Date();
  const yearsActive = Math.floor(
    (now.getTime() - joinDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );

  const stats: MemberHistoryStats = {
    eventsAttended: eventRegistrations,
    volunteerRoles,
    leadershipRoles,
    yearsActive: Math.max(0, yearsActive),
  };

  // Build timeline from service records
  const timeline = serviceRecords.map((record) => ({
    id: record.id,
    serviceType: record.serviceType,
    roleTitle: record.roleTitle,
    committeeName: record.committeeName,
    eventTitle: record.eventTitle,
    startAt: record.startAt.toISOString(),
    endAt: record.endAt?.toISOString() ?? null,
    isActive: record.endAt === null,
  }));

  // Generate summary text
  const summaryText = generateSummaryText(memberName, stats, timeline);

  const response: MemberHistoryResponse = {
    memberId: id,
    memberName,
    summaryText,
    stats,
    timeline,
  };

  return NextResponse.json(response);
}
