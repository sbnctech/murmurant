import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { errors } from "@/lib/api";
import { removeAssignment } from "@/lib/serviceHistory";

interface RouteParams {
  params: Promise<{ id: string; aid: string }>;
}

/**
 * DELETE /api/v1/admin/transitions/:id/assignments/:aid
 *
 * Remove an assignment from a transition plan (DRAFT status only).
 * Requires users:manage capability.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "users:manage");
  if (!auth.ok) return auth.response;

  const { id: planId, aid: assignmentId } = await params;

  try {
    await removeAssignment(assignmentId);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error removing assignment:", error);
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return errors.notFound("TransitionAssignment", assignmentId);
      }
      if (error.message.includes("DRAFT")) {
        return errors.conflict("Can only remove assignments from DRAFT plans", {
          planId,
          assignmentId,
        });
      }
      return errors.internal(error.message);
    }
    return errors.internal("Failed to remove assignment");
  }
}
