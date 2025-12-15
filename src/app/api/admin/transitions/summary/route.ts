import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { errors } from "@/lib/api";
import { TransitionStatus } from "@prisma/client";
import { getTermBoundaries } from "@/lib/serviceHistory";
import { startOfClubDayUtc } from "@/lib/timezone";

/**
 * GET /api/admin/transitions/summary
 *
 * Returns a summary of transition plans for the current or next term.
 *
 * Query params:
 * - term: "current" | "next" (default: "next")
 *
 * Response:
 * - termStart: ISO date
 * - termEnd: ISO date
 * - counts: { draft, pendingApproval, approved, applied, cancelled, total }
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  // Webmaster cannot see transitions
  if (auth.context.globalRole === "webmaster") {
    return errors.forbidden("transitions:view", auth.context.globalRole);
  }

  try {
    const { searchParams } = new URL(req.url);
    const term = searchParams.get("term") || "next";

    const boundaries = getTermBoundaries();
    let termStart: Date;
    let termEnd: Date;

    if (term === "current") {
      termStart = boundaries.currentTermStart;
      termEnd = boundaries.currentTermEnd;
    } else {
      termStart = boundaries.nextTermStart;
      termEnd = boundaries.nextTermEnd;
    }

    // Find plans for this term (effectiveAt within the term boundary)
    const startOfTermDay = startOfClubDayUtc(termStart);
    const endOfTermDay = new Date(startOfClubDayUtc(termEnd).getTime() + 24 * 60 * 60 * 1000);

    const plans = await prisma.transitionPlan.findMany({
      where: {
        effectiveAt: {
          gte: startOfTermDay,
          lt: endOfTermDay,
        },
      },
      select: {
        status: true,
      },
    });

    // Count by status
    const counts = {
      draft: 0,
      pendingApproval: 0,
      approved: 0,
      applied: 0,
      cancelled: 0,
      total: plans.length,
    };

    for (const plan of plans) {
      switch (plan.status) {
        case TransitionStatus.DRAFT:
          counts.draft++;
          break;
        case TransitionStatus.PENDING_APPROVAL:
          counts.pendingApproval++;
          break;
        case TransitionStatus.APPROVED:
          counts.approved++;
          break;
        case TransitionStatus.APPLIED:
          counts.applied++;
          break;
        case TransitionStatus.CANCELLED:
          counts.cancelled++;
          break;
      }
    }

    return NextResponse.json({
      term,
      termStart: termStart.toISOString(),
      termEnd: termEnd.toISOString(),
      counts,
    });
  } catch (error) {
    console.error("Error fetching transition summary:", error);
    if (error instanceof Error) {
      return errors.internal(error.message);
    }
    return errors.internal("Failed to fetch transition summary");
  }
}
