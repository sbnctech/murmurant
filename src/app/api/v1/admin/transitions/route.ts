import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { errors } from "@/lib/api";
import {
  listTransitionPlans,
  createTransitionPlan,
  transitionFiltersSchema,
  createTransitionPlanSchema,
  paginationSchema,
} from "@/lib/serviceHistory";

/**
 * GET /api/v1/admin/transitions
 *
 * List transition plans with filters and pagination.
 * Requires transitions:view capability (admin, president, past-president, vp-activities only).
 *
 * Query params:
 * - status: TransitionStatus - filter by status
 * - targetTermId: UUID - filter by target term
 * - page: number - page number (default: 1)
 * - limit: number - items per page (default: 20, max: 100)
 */
export async function GET(req: NextRequest) {
  const auth = await requireCapability(req, "transitions:view");
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const params = Object.fromEntries(searchParams.entries());

    const filtersResult = transitionFiltersSchema.safeParse(params);
    if (!filtersResult.success) {
      return errors.validation(
        filtersResult.error.issues.map((e) => e.message).join(", ")
      );
    }

    const paginationResult = paginationSchema.safeParse(params);
    if (!paginationResult.success) {
      return errors.validation(
        paginationResult.error.issues.map((e) => e.message).join(", ")
      );
    }

    const result = await listTransitionPlans(
      filtersResult.data,
      paginationResult.data
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching transition plans:", error);
    return errors.internal("Failed to fetch transition plans");
  }
}

/**
 * POST /api/v1/admin/transitions
 *
 * Create a new transition plan.
 * Requires users:manage capability.
 *
 * Request body:
 * - name: string (required)
 * - description: string (optional)
 * - targetTermId: UUID (required)
 * - effectiveAt: ISO date (required)
 */
export async function POST(req: NextRequest) {
  const auth = await requireCapability(req, "users:manage");
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();

    const parseResult = createTransitionPlanSchema.safeParse(body);
    if (!parseResult.success) {
      return errors.validation(
        parseResult.error.issues.map((e) => e.message).join(", ")
      );
    }

    const plan = await createTransitionPlan(
      parseResult.data,
      auth.context.memberId
    );

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("Error creating transition plan:", error);
    if (error instanceof Error) {
      return errors.internal(error.message);
    }
    return errors.internal("Failed to create transition plan");
  }
}
