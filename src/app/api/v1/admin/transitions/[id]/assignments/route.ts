import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { errors } from "@/lib/api";
import { addAssignment, createAssignmentSchema } from "@/lib/serviceHistory";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/v1/admin/transitions/:id/assignments
 *
 * Add an assignment to a transition plan (DRAFT status only).
 * Requires users:manage capability.
 *
 * Request body:
 * - memberId: UUID (required)
 * - serviceType: ServiceType (required)
 * - roleTitle: string (required)
 * - committeeId: UUID (optional)
 * - isOutgoing: boolean (required)
 * - existingServiceId: UUID (optional, for outgoing)
 * - notes: string (optional)
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "users:manage");
  if (!auth.ok) return auth.response;

  const { id: planId } = await params;

  try {
    const body = await req.json();

    const parseResult = createAssignmentSchema.safeParse(body);
    if (!parseResult.success) {
      return errors.validation(
        parseResult.error.issues.map((e) => e.message).join(", ")
      );
    }

    const assignment = await addAssignment(planId, parseResult.data);

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("Error adding assignment:", error);
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return errors.notFound("TransitionPlan", planId);
      }
      if (error.message.includes("DRAFT")) {
        return errors.conflict("Can only add assignments to DRAFT plans", {
          planId,
        });
      }
      return errors.internal(error.message);
    }
    return errors.internal("Failed to add assignment");
  }
}
