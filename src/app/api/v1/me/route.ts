/**
 * GET /api/v1/me
 *
 * Returns the current authenticated member's profile information.
 * Used by the member dashboard for personalized content.
 *
 * Response:
 * {
 *   id: string,
 *   firstName: string,
 *   lastName: string,
 *   email: string,
 *   joinedAt: string,
 *   memberSince: string,        // Human-readable tenure
 *   membershipStatus: { code: string, label: string },
 *   membershipTier: { code: string, name: string } | null,
 *   upcomingRegistrations: number,
 *   globalRole: string
 * }
 *
 * Charter: P1 (identity provable), P2 (default deny)
 */

import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/passkey";
import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/api";

/**
 * Calculate human-readable membership tenure.
 */
function calculateTenure(joinedAt: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - joinedAt.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 30) {
    return diffDays === 1 ? "1 day" : `${diffDays} days`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return diffMonths === 1 ? "1 month" : `${diffMonths} months`;
  }

  const diffYears = Math.floor(diffMonths / 12);
  const remainingMonths = diffMonths % 12;

  if (remainingMonths === 0) {
    return diffYears === 1 ? "1 year" : `${diffYears} years`;
  }

  return `${diffYears} year${diffYears > 1 ? "s" : ""}, ${remainingMonths} month${remainingMonths > 1 ? "s" : ""}`;
}

export async function GET() {
  // Check authentication
  const session = await getCurrentSession();
  if (!session) {
    return errors.unauthorized("Not authenticated");
  }

  // Fetch member with relations
  const member = await prisma.member.findUnique({
    where: { id: session.memberId },
    include: {
      membershipStatus: {
        select: { code: true, label: true },
      },
      membershipTier: {
        select: { code: true, name: true },
      },
      eventRegistrations: {
        where: {
          status: { in: ["CONFIRMED", "PENDING", "PENDING_PAYMENT"] },
          event: {
            startTime: { gte: new Date() },
          },
        },
        select: { id: true },
      },
    },
  });

  if (!member) {
    return errors.notFound("Member", session.memberId);
  }

  // Calculate tenure
  const memberSince = calculateTenure(member.joinedAt);

  return NextResponse.json({
    id: member.id,
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    joinedAt: member.joinedAt.toISOString(),
    memberSince,
    membershipStatus: member.membershipStatus,
    membershipTier: member.membershipTier,
    upcomingRegistrations: member.eventRegistrations.length,
    globalRole: session.globalRole,
  });
}
