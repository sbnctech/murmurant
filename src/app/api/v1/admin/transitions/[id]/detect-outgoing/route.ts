import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { errors } from "@/lib/api";
import { detectOutgoingAssignments } from "@/lib/serviceHistory";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/v1/admin/transitions/:id/detect-outgoing
 *
 * Auto-detect outgoing assignments based on current active service records.
 * For each incoming assignment, finds if there's a current holder of that role
 * and creates corresponding outgoing assignments.
 *
 * Requires users:manage capability.
 * Only works on DRAFT plans.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "users:manage");
  if (!auth.ok) return auth.response;

  const { id: planId } = await params;

  try {
    const createdAssignments = await detectOutgoingAssignments(planId);

    return NextResponse.json({
      message: `Detected ${createdAssignments.length} outgoing assignment(s)`,
      assignments: createdAssignments,
    });
  } catch (error) {
    console.error("Error detecting outgoing assignments:", error);
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return errors.notFound("TransitionPlan", planId);
      }
      if (error.message.includes("DRAFT")) {
        return errors.conflict("Can only detect outgoing for DRAFT plans", {
          planId,
        });
      }
      return errors.internal(error.message);
    }
    return errors.internal("Failed to detect outgoing assignments");
  }
}
