/**
 * Governance Motion by ID API
 *
 * GET /api/v1/officer/governance/motions/:id - Get motion with annotations
 * PATCH /api/v1/officer/governance/motions/:id - Update motion
 * DELETE /api/v1/officer/governance/motions/:id - Delete motion (only if not voted)
 * POST /api/v1/officer/governance/motions/:id - Record vote
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { auditMutation } from "@/lib/audit";
import {
  getMotionById,
  updateMotion,
  deleteMotion,
  recordVote,
} from "@/lib/governance/motions";
import { MotionResult } from "@prisma/client";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/v1/officer/governance/motions/:id
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "meetings:motions:read");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const motion = await getMotionById(id);

    if (!motion) {
      return NextResponse.json(
        { error: "Not Found", message: "Motion not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ motion });
  } catch (error) {
    console.error("Error getting motion:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to get motion" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/officer/governance/motions/:id
 * Update motion details (text, mover, seconder)
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "meetings:minutes:draft:edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const body = await req.json();
    const { motionText, movedById, secondedById, resultNotes } = body;

    const motion = await updateMotion(id, {
      motionText,
      movedById,
      secondedById,
      resultNotes,
    });

    await auditMutation(req, auth.context, {
      action: "UPDATE",
      capability: "meetings:minutes:draft:edit",
      objectType: "GovernanceMotion",
      objectId: id,
    });

    return NextResponse.json({ motion });
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes("not found") || message.includes("Record to update not found")) {
      return NextResponse.json(
        { error: "Not Found", message: "Motion not found" },
        { status: 404 }
      );
    }
    console.error("Error updating motion:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to update motion" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/officer/governance/motions/:id
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "meetings:minutes:draft:edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    await deleteMotion(id);

    await auditMutation(req, auth.context, {
      action: "DELETE",
      capability: "meetings:minutes:draft:edit",
      objectType: "GovernanceMotion",
      objectId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes("not found") || message.includes("Motion not found")) {
      return NextResponse.json(
        { error: "Not Found", message: "Motion not found" },
        { status: 404 }
      );
    }
    if (message.includes("Cannot delete")) {
      return NextResponse.json(
        { error: "Conflict", message },
        { status: 409 }
      );
    }
    console.error("Error deleting motion:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to delete motion" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/officer/governance/motions/:id
 * Record vote results for a motion
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "meetings:minutes:draft:edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const body = await req.json();
    const { votesYes, votesNo, votesAbstain, result, resultNotes } = body;

    // Validate result if provided
    if (result) {
      const validResults: MotionResult[] = ["PASSED", "FAILED", "TABLED", "WITHDRAWN"];
      if (!validResults.includes(result)) {
        return NextResponse.json(
          { error: "Bad Request", message: `Invalid result. Must be one of: ${validResults.join(", ")}` },
          { status: 400 }
        );
      }
    }

    const motion = await recordVote({
      motionId: id,
      votesYes,
      votesNo,
      votesAbstain,
      result,
      resultNotes,
    });

    await auditMutation(req, auth.context, {
      action: "UPDATE",
      capability: "meetings:minutes:draft:edit",
      objectType: "GovernanceMotion",
      objectId: id,
      metadata: { action: "record_vote", result, votesYes, votesNo, votesAbstain },
    });

    return NextResponse.json({ motion });
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes("not found") || message.includes("Record to update not found")) {
      return NextResponse.json(
        { error: "Not Found", message: "Motion not found" },
        { status: 404 }
      );
    }
    console.error("Error recording vote:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to record vote" },
      { status: 500 }
    );
  }
}
