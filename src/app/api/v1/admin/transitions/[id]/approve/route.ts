import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { errors } from "@/lib/api";
import { recordApproval, canApprove, approvalSchema } from "@/lib/serviceHistory";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/v1/admin/transitions/:id/approve
 *
 * Record an approval for a transition plan.
 * The caller must be currently serving in the specified role (President or VP Activities).
 *
 * Request body:
 * - role: "president" | "vp-activities"
 *
 * Requires authentication, but uses custom approval logic
 * (caller must hold the specified board position).
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id: planId } = await params;

  try {
    const body = await req.json();

    const parseResult = approvalSchema.safeParse(body);
    if (!parseResult.success) {
      return errors.validation(
        parseResult.error.issues.map((e) => e.message).join(", ")
      );
    }

    const { role } = parseResult.data;

    // Verify the caller can approve for this role
    const canApproveResult = await canApprove(auth.context.memberId, role);
    if (!canApproveResult) {
      return errors.forbidden(
        role,
        auth.context.globalRole
      );
    }

    const result = await recordApproval(planId, auth.context.memberId, role);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error recording approval:", error);
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return errors.notFound("TransitionPlan", planId);
      }
      if (error.message.includes("PENDING_APPROVAL")) {
        return errors.conflict("Can only approve plans in PENDING_APPROVAL status", {
          planId,
        });
      }
      if (error.message.includes("already approved")) {
        return errors.conflict(error.message, { planId });
      }
      if (error.message.includes("not authorized")) {
        return errors.forbidden();
      }
      return errors.internal(error.message);
    }
    return errors.internal("Failed to record approval");
  }
}
