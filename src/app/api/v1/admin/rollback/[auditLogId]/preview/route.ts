import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { errors } from "@/lib/api";
import {
  previewRollback,
  getConfirmationToken,
} from "@/lib/governance/rollback";

interface RouteParams {
  params: Promise<{ auditLogId: string }>;
}

/**
 * GET /api/v1/admin/rollback/:auditLogId/preview
 *
 * Preview a rollback operation without executing it.
 * Shows what would happen, any warnings, and blocking conditions.
 * Requires admin:full capability.
 *
 * For compensatable actions, returns a confirmation token
 * that must be included in the execute request.
 *
 * Charter P1/P2: Require admin:full capability.
 * Charter P4: No hidden rules - preview shows exactly what will happen.
 * Charter P7: Observability - full visibility into rollback effects.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(request, "admin:full");
  if (!auth.ok) return auth.response;

  const { auditLogId } = await params;

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(auditLogId)) {
    return errors.validation("Invalid audit log ID format");
  }

  try {
    const preview = await previewRollback(auditLogId, auth.context);

    // Generate confirmation token for compensatable actions
    let confirmationToken: string | undefined;
    if (
      preview.rollbackable &&
      preview.classification === "COMPENSATABLE"
    ) {
      confirmationToken = getConfirmationToken(auditLogId);
    }

    return NextResponse.json({
      ...preview,
      confirmationToken,
    });
  } catch (error) {
    console.error("Error previewing rollback:", error);
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return errors.validation("Audit log not found");
      }
      return errors.internal(error.message);
    }
    return errors.internal("Failed to preview rollback");
  }
}
