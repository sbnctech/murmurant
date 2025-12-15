import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { errors } from "@/lib/api";
import { cancelTransitionPlan } from "@/lib/serviceHistory";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/v1/admin/transitions/:id/cancel
 *
 * Cancel a transition plan.
 * Changes status to CANCELLED.
 * Cannot cancel already applied plans.
 *
 * Requires users:manage capability.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "users:manage");
  if (!auth.ok) return auth.response;

  const { id: planId } = await params;

  try {
    const plan = await cancelTransitionPlan(planId);

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Error cancelling transition:", error);
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return errors.notFound("TransitionPlan", planId);
      }
      if (error.message.includes("applied")) {
        return errors.conflict("Cannot cancel an already applied plan", {
          planId,
        });
      }
      return errors.internal(error.message);
    }
    return errors.internal("Failed to cancel transition");
  }
}
