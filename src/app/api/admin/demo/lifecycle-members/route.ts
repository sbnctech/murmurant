/**
 * GET /api/admin/demo/lifecycle-members
 *
 * Returns demo members with their lifecycle state for the Lifecycle Explainer demo.
 * Demo members are identified by email pattern: demo.*@sbnc.example
 *
 * Each member includes the expectedLifecycleState computed using inferLifecycleState().
 * Requires admin:full capability.
 *
 * Response:
 * - 200: { members: LifecycleDemoMember[] }
 * - 401: Not authenticated
 * - 403: Not authorized
 *
 * Charter: P1 (identity provable), P2 (default deny)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/auth";
import {
  explainMemberLifecycle,
  type LifecycleState,
} from "@/lib/membership/lifecycle";

/**
 * Next transition info for demo display.
 */
type NextTransitionInfo = {
  event: string;
  toState: LifecycleState;
  condition: string;
  isAutomatic: boolean;
  estimatedDate: string | null;
};

/**
 * Demo member with lifecycle state for display in the demo UI.
 */
type LifecycleDemoMember = {
  id: string;
  name: string;
  email: string;
  status: string;
  statusLabel: string;
  tier: string | null;
  tierName: string | null;
  joinedAt: string;
  daysSinceJoin: number;
  expectedLifecycleState: LifecycleState;
  stateLabel: string;
  description: string;
  // Enhanced fields from explainMemberLifecycle()
  inferenceReason: string;
  narrative: string;
  nextTransitions: NextTransitionInfo[];
  milestones: {
    newbieEndDate: string;
    twoYearMark: string;
    isNewbiePeriod: boolean;
    isPastTwoYears: boolean;
  };
};

/**
 * Demo member email patterns ordered for logical display.
 */
const DEMO_MEMBER_ORDER = [
  "demo.pending@sbnc.example",
  "demo.newbie@sbnc.example",
  "demo.member@sbnc.example",
  "demo.offer_extended@sbnc.example",
  "demo.extended@sbnc.example",
  "demo.lapsed@sbnc.example",
  "demo.suspended@sbnc.example",
  "demo.unknown@sbnc.example",
];

export async function GET(req: NextRequest) {
  // Require admin:full for demo access
  const auth = await requireCapability(req, "admin:full");
  if (!auth.ok) return auth.response;

  // Fetch demo members by email pattern
  const members = await prisma.member.findMany({
    where: {
      email: {
        startsWith: "demo.",
        endsWith: "@sbnc.example",
      },
    },
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
  });

  // Transform to response format with full lifecycle explanation
  const lifecycleMembers: LifecycleDemoMember[] = members.map((m) => {
    // Get full lifecycle explanation
    const explanation = explainMemberLifecycle({
      membershipStatusCode: m.membershipStatus.code,
      membershipTierCode: m.membershipTier?.code ?? null,
      joinedAt: m.joinedAt,
      waMembershipLevelRaw: m.waMembershipLevelRaw,
    });

    return {
      id: m.id,
      name: `${m.firstName} ${m.lastName}`,
      email: m.email,
      status: m.membershipStatus.code,
      statusLabel: m.membershipStatus.label,
      tier: m.membershipTier?.code ?? null,
      tierName: m.membershipTier?.name ?? null,
      joinedAt: m.joinedAt.toISOString(),
      daysSinceJoin: explanation.relevantData.daysSinceJoin,
      expectedLifecycleState: explanation.currentState,
      stateLabel: explanation.stateLabel,
      description: explanation.stateDescription,
      // Enhanced fields
      inferenceReason: explanation.inferenceReason,
      narrative: explanation.narrative,
      nextTransitions: explanation.nextTransitions.map((t) => ({
        event: t.event,
        toState: t.toState,
        condition: t.condition,
        isAutomatic: t.isAutomatic,
        estimatedDate: t.estimatedDate?.toISOString() ?? null,
      })),
      milestones: {
        newbieEndDate: explanation.milestones.newbieEndDate.toISOString(),
        twoYearMark: explanation.milestones.twoYearMark.toISOString(),
        isNewbiePeriod: explanation.milestones.isNewbiePeriod,
        isPastTwoYears: explanation.milestones.isPastTwoYears,
      },
    };
  });

  // Sort by demo member order for consistent display
  lifecycleMembers.sort((a, b) => {
    const aIndex = DEMO_MEMBER_ORDER.indexOf(a.email);
    const bIndex = DEMO_MEMBER_ORDER.indexOf(b.email);
    // Put unknown emails at the end
    const aOrder = aIndex === -1 ? DEMO_MEMBER_ORDER.length : aIndex;
    const bOrder = bIndex === -1 ? DEMO_MEMBER_ORDER.length : bIndex;
    return aOrder - bOrder;
  });

  return NextResponse.json({
    members: lifecycleMembers,
    timestamp: new Date().toISOString(),
  });
}
