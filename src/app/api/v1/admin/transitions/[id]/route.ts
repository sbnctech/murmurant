import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { errors } from "@/lib/api";
import {
  getTransitionPlan,
  updateTransitionPlan,
  deleteTransitionPlan,
  updateTransitionPlanSchema,
} from "@/lib/serviceHistory";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/admin/transitions/:id
 *
 * Get a transition plan with all details and assignments.
 * Requires members:view capability.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "members:view");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const plan = await getTransitionPlan(id);

    if (!plan) {
      return errors.notFound("TransitionPlan", id);
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Error fetching transition plan:", error);
    return errors.internal("Failed to fetch transition plan");
  }
}

/**
 * PATCH /api/v1/admin/transitions/:id
 *
 * Update a transition plan (DRAFT status only).
 * Requires users:manage capability.
 *
 * Request body:
 * - name: string (optional)
 * - description: string (optional)
 * - targetTermId: UUID (optional)
 * - effectiveAt: ISO date (optional)
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "users:manage");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const body = await req.json();

    const parseResult = updateTransitionPlanSchema.safeParse(body);
    if (!parseResult.success) {
      return errors.validation(
        parseResult.error.issues.map((e) => e.message).join(", ")
      );
    }

    const plan = await updateTransitionPlan(id, parseResult.data);

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Error updating transition plan:", error);
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return errors.notFound("TransitionPlan", id);
      }
      if (error.message.includes("DRAFT")) {
        return errors.conflict("Can only update plans in DRAFT status", {
          planId: id,
        });
      }
      return errors.internal(error.message);
    }
    return errors.internal("Failed to update transition plan");
  }
}

/**
 * DELETE /api/v1/admin/transitions/:id
 *
 * Delete a transition plan (DRAFT or CANCELLED status only).
 * Requires users:manage capability.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "users:manage");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    await deleteTransitionPlan(id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting transition plan:", error);
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return errors.notFound("TransitionPlan", id);
      }
      if (error.message.includes("DRAFT") || error.message.includes("CANCELLED")) {
        return errors.conflict("Can only delete plans in DRAFT or CANCELLED status", {
          planId: id,
        });
      }
      return errors.internal(error.message);
    }
    return errors.internal("Failed to delete transition plan");
  }
}
