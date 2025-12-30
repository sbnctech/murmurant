// Copyright © 2025 Murmurant, Inc.
// Admin members list API - requires members:view capability
// Charter: P1 (identity provable), P2 (default deny), P9 (fail closed)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/auth";

type AdminMemberListItem = {
  id: string;
  name: string;
  email: string;
  status: string;
  phone: string | null;
  joinedAt: string;
  registrationCount: number;
  waitlistedCount: number;
};

export async function GET(req: NextRequest) {
  // Charter P1/P2: Require authenticated identity with members:view capability
  const auth = await requireCapability(req, "members:view");
  if (!auth.ok) return auth.response;

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

  // Get total count for pagination
  const totalItems = await prisma.member.count({
    where: {
      membershipStatus: {
        isActive: true,
      },
    },
  });

  const totalPages = Math.ceil(totalItems / pageSize);
  const skip = (page - 1) * pageSize;

  // Fetch members with related data
  const members = await prisma.member.findMany({
    where: {
      membershipStatus: {
        isActive: true,
      },
    },
    include: {
      membershipStatus: true,
      _count: {
        select: {
          eventRegistrations: true,
        },
      },
    },
    orderBy: {
      lastName: "asc",
    },
    skip,
    take: pageSize,
  });

  // Get waitlisted counts for these members
  const memberIds = members.map((m) => m.id);
  const waitlistedCounts = await prisma.eventRegistration.groupBy({
    by: ["memberId"],
    where: {
      memberId: { in: memberIds },
      status: "WAITLISTED",
    },
    _count: true,
  });

  const waitlistedMap = new Map(
    waitlistedCounts.map((w) => [w.memberId, w._count])
  );

  const items: AdminMemberListItem[] = members.map((m) => ({
    id: m.id,
    name: `${m.firstName} ${m.lastName}`,
    email: m.email,
    status: m.membershipStatus.code,
    phone: m.phone,
    joinedAt: m.joinedAt.toISOString(),
    registrationCount: m._count.eventRegistrations,
    waitlistedCount: waitlistedMap.get(m.id) ?? 0,
  }));

  return NextResponse.json({
    items,
    page,
    pageSize,
    totalItems,
    totalPages,
  });
}
