import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { errors } from "@/lib/api";
import { auditMutation } from "@/lib/audit";
import { submitForApproval } from "@/lib/serviceHistory";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/v1/admin/transitions/:id/submit
 *
 * Submit a transition plan for approval.
 * Changes status from DRAFT to PENDING_APPROVAL.
 * Requires at least one assignment in the plan.
 *
 * Requires users:manage capability.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "users:manage");
  if (!auth.ok) return auth.response;

  const { id: planId } = await params;

  try {
    const plan = await submitForApproval(planId);

    await auditMutation(req, auth.context, {
      action: "UPDATE",
      capability: "users:manage",
      objectType: "TransitionPlan",
      objectId: planId,
      metadata: { action: "submit_for_approval", newStatus: plan.status },
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Error submitting plan for approval:", error);
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return errors.notFound("TransitionPlan", planId);
      }
      if (error.message.includes("DRAFT")) {
        return errors.conflict("Can only submit DRAFT plans for approval", {
          planId,
        });
      }
      if (error.message.includes("no assignments")) {
        return errors.validation("Cannot submit plan with no assignments");
      }
      return errors.internal(error.message);
    }
    return errors.internal("Failed to submit plan for approval");
  }
}
