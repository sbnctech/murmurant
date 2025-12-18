/**
 * Governance Motions API
 *
 * GET /api/v1/officer/governance/motions - List motions
 * POST /api/v1/officer/governance/motions - Create motion for a meeting
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { auditMutation } from "@/lib/audit";
import {
  createMotion,
  listMotions,
  listMotionsByMeeting,
} from "@/lib/governance/motions";
import { MotionResult } from "@prisma/client";

/**
 * GET /api/v1/officer/governance/motions
 */
export async function GET(req: NextRequest) {
  const auth = await requireCapability(req, "meetings:motions:read");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const meetingId = searchParams.get("meetingId");
  const result = searchParams.get("result") as MotionResult | null;
  const hasResult = searchParams.get("hasResult");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  try {
    // If filtering by specific meeting, use optimized query
    if (meetingId && !result && hasResult === null) {
      const motionResult = await listMotionsByMeeting(meetingId, { page, limit });
      return NextResponse.json({
        motions: motionResult.items,
        pagination: motionResult.pagination,
      });
    }

    // General list with filters
    const motionResult = await listMotions(
      {
        meetingId: meetingId || undefined,
        result: result || undefined,
        hasResult: hasResult === null ? undefined : hasResult === "true",
      },
      { page, limit }
    );

    return NextResponse.json({
      motions: motionResult.items,
      pagination: motionResult.pagination,
    });
  } catch (error) {
    console.error("Error listing motions:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to list motions" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/officer/governance/motions
 */
export async function POST(req: NextRequest) {
  const auth = await requireCapability(req, "meetings:minutes:draft:edit");
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { meetingId, motionText, movedById, secondedById } = body;

    if (!meetingId || !motionText) {
      return NextResponse.json(
        { error: "Bad Request", message: "meetingId and motionText are required" },
        { status: 400 }
      );
    }

    const motion = await createMotion(
      {
        meetingId,
        motionText,
        movedById,
        secondedById,
      },
      auth.context.memberId
    );

    await auditMutation(req, auth.context, {
      action: "CREATE",
      capability: "meetings:minutes:draft:edit",
      objectType: "GovernanceMotion",
      objectId: motion.id,
      metadata: { meetingId, motionNumber: motion.motionNumber },
    });

    return NextResponse.json({ motion }, { status: 201 });
  } catch (error) {
    console.error("Error creating motion:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to create motion" },
      { status: 500 }
    );
  }
}
