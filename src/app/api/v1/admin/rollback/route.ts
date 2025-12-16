import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { errors } from "@/lib/api";
import {
  listRollbackableActions,
  validateRollbackListQuery,
} from "@/lib/governance/rollback";

/**
 * GET /api/v1/admin/rollback
 *
 * List recent rollbackable actions.
 * Requires admin:full capability.
 *
 * Query parameters:
 * - limit: number (1-100, default 20)
 * - resourceType: string (optional filter)
 * - since: ISO datetime (optional filter)
 *
 * Charter P1: Identity and authorization must be provable.
 * Charter P2: Default deny - explicit capability check.
 * Charter P7: Observability - visibility into what can be rolled back.
 */
export async function GET(request: NextRequest) {
  const auth = await requireCapability(request, "admin:full");
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      limit: searchParams.get("limit") ?? undefined,
      resourceType: searchParams.get("resourceType") ?? undefined,
      since: searchParams.get("since") ?? undefined,
    };

    const validation = validateRollbackListQuery(queryParams);
    if (!validation.success) {
      return errors.validation(
        validation.error.issues.map((e) => e.message).join(", ")
      );
    }

    const actions = await listRollbackableActions(auth.context, validation.data);

    return NextResponse.json({
      actions,
      count: actions.length,
    });
  } catch (error) {
    console.error("Error listing rollbackable actions:", error);
    if (error instanceof Error) {
      return errors.internal(error.message);
    }
    return errors.internal("Failed to list rollbackable actions");
  }
}
