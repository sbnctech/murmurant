/**
 * Member Lifecycle Explainer API
 *
 * GET /api/v1/admin/members/:id/lifecycle
 *
 * Returns a detailed explanation of a member's lifecycle state,
 * how they reached it, and what happens next.
 *
 * This is a READ-ONLY endpoint for demo and admin visibility.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { explainMemberLifecycle, MemberLifecycleInput } from "@/lib/membership/lifecycle";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  // Require members:view capability (admin, president, vp-activities, event-chair, etc.)
  const auth = await requireCapability(req, "members:view");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  // Fetch member with related data
  const member = await prisma.member.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      joinedAt: true,
      waMembershipLevelRaw: true,
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
  });

  if (!member) {
    return NextResponse.json(
      { error: "Member not found" },
      { status: 404 }
    );
  }

  // Build lifecycle input
  const lifecycleInput: MemberLifecycleInput = {
    membershipStatusCode: member.membershipStatus.code,
    membershipTierCode: member.membershipTier?.code ?? null,
    joinedAt: member.joinedAt,
    waMembershipLevelRaw: member.waMembershipLevelRaw,
  };

  // Generate explanation
  const explanation = explainMemberLifecycle(lifecycleInput);

  return NextResponse.json({
    member: {
      id: member.id,
      name: `${member.firstName} ${member.lastName}`,
      email: member.email,
      membershipStatus: member.membershipStatus.label,
      membershipTier: member.membershipTier?.name ?? "Unknown",
    },
    lifecycle: explanation,
  });
}
