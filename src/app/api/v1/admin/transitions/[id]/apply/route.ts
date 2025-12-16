import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { errors } from "@/lib/api";
import { auditMutation } from "@/lib/audit";
import { applyTransition } from "@/lib/serviceHistory";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/v1/admin/transitions/:id/apply
 *
 * Manually apply an approved transition plan.
 * This executes the transition:
 * 1. Closes all outgoing service records (sets endAt)
 * 2. Creates new service records for all incoming assignments
 * 3. Marks the plan as APPLIED
 *
 * Requires users:manage capability.
 * Plan must be in APPROVED status.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "users:manage");
  if (!auth.ok) return auth.response;

  const { id: planId } = await params;

  try {
    const result = await applyTransition(planId, auth.context.memberId);

    await auditMutation(req, auth.context, {
      action: "UPDATE",
      capability: "users:manage",
      objectType: "TransitionPlan",
      objectId: planId,
      metadata: {
        action: "apply",
        newStatus: "APPLIED",
        recordsClosed: result.recordsClosed,
        recordsCreated: result.recordsCreated,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error applying transition:", error);
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return errors.notFound("TransitionPlan", planId);
      }
      if (error.message.includes("APPROVED")) {
        return errors.conflict("Can only apply APPROVED plans", {
          planId,
        });
      }
      return errors.internal(error.message);
    }
    return errors.internal("Failed to apply transition");
  }
}
