/**
 * GET /api/admin/demo/member-list
 *
 * Demo-optimized member list API - returns members with tier and lifecycle hints.
 * Read-only endpoint for demo purposes.
 * Requires admin:full capability.
 *
 * Response:
 * - 200: { items, page, pageSize, totalItems, totalPages }
 * - 401: Not authenticated
 * - 403: Not authorized
 *
 * Charter: P1 (identity provable), P2 (default deny)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/auth";

type DemoMemberListItem = {
  id: string;
  name: string;
  email: string;
  status: string;
  statusLabel: string;
  tier: string | null;
  tierName: string | null;
  joinedAt: string;
  lifecycleHint: string;
};

/**
 * Calculate lifecycle hint based on tier and join date.
 *
 * Tier logic:
 * - newbie_member: "Newbie expires in X days" (90-day window from joinedAt)
 * - member: "Standard member" or "Member for X years"
 * - extended_member: "Extended (Third Year)"
 * - unknown/null: "Status pending"
 */
function calculateLifecycleHint(
  tierCode: string | null,
  joinedAt: Date
): string {
  const now = new Date();
  const daysSinceJoin = Math.floor(
    (now.getTime() - joinedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  switch (tierCode) {
    case "newbie_member": {
      // Newbie period is 90 days from join date
      const newbiePeriodDays = 90;
      const daysRemaining = newbiePeriodDays - daysSinceJoin;

      if (daysRemaining > 0) {
        return `Newbie expires in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}`;
      } else {
        return "Newbie period ended (pending tier update)";
      }
    }

    case "member": {
      // Standard member - show tenure
      const yearsSinceJoin = Math.floor(daysSinceJoin / 365);
      if (yearsSinceJoin < 1) {
        const monthsSinceJoin = Math.floor(daysSinceJoin / 30);
        if (monthsSinceJoin < 1) {
          return `Member for ${daysSinceJoin} day${daysSinceJoin !== 1 ? "s" : ""}`;
        }
        return `Member for ${monthsSinceJoin} month${monthsSinceJoin !== 1 ? "s" : ""}`;
      }
      return `Member for ${yearsSinceJoin} year${yearsSinceJoin !== 1 ? "s" : ""}`;
    }

    case "extended_member": {
      return "Extended (Third Year)";
    }

    case "admin":
    case "admins": {
      return "Administrator";
    }

    case "unknown":
    case null: {
      return "Status pending";
    }

    default: {
      return tierCode ? `Tier: ${tierCode}` : "Unknown tier";
    }
  }
}

export async function GET(req: NextRequest) {
  // Require admin:full for demo access
  const auth = await requireCapability(req, "admin:full");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);

  // Parse pagination params with defaults
  const pageParam = searchParams.get("page");
  const pageSizeParam = searchParams.get("pageSize");
  const statusFilter = searchParams.get("status"); // Optional: filter by status code
  const tierFilter = searchParams.get("tier"); // Optional: filter by tier code

  let page = 1;
  let pageSize = 25;

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

  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (statusFilter) {
    where.membershipStatus = { code: statusFilter };
  }

  if (tierFilter) {
    where.membershipTier = { code: tierFilter };
  }

  // Get total count for pagination
  const totalItems = await prisma.member.count({ where });

  const totalPages = Math.ceil(totalItems / pageSize);
  const skip = (page - 1) * pageSize;

  // Fetch members with status and tier
  const members = await prisma.member.findMany({
    where,
    include: {
      membershipStatus: {
        select: {
          code: true,
          label: true,
        },
      },
      membershipTier: {
        select: {
          code: true,
          name: true,
        },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    skip,
    take: pageSize,
  });

  const items: DemoMemberListItem[] = members.map((m) => ({
    id: m.id,
    name: `${m.firstName} ${m.lastName}`,
    email: m.email,
    status: m.membershipStatus.code,
    statusLabel: m.membershipStatus.label,
    tier: m.membershipTier?.code ?? null,
    tierName: m.membershipTier?.name ?? null,
    joinedAt: m.joinedAt.toISOString(),
    lifecycleHint: calculateLifecycleHint(
      m.membershipTier?.code ?? null,
      m.joinedAt
    ),
  }));

  // Get available filters for the UI
  const [statusOptions, tierOptions] = await Promise.all([
    prisma.membershipStatus.findMany({
      select: { code: true, label: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.membershipTier.findMany({
      select: { code: true, name: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return NextResponse.json({
    items,
    page,
    pageSize,
    totalItems,
    totalPages,
    filters: {
      statusOptions,
      tierOptions,
    },
  });
}
