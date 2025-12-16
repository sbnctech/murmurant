import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { errors } from "@/lib/api";
import {
  executeRollback,
  validateRollbackRequest,
  RollbackRequest,
} from "@/lib/governance/rollback";

interface RouteParams {
  params: Promise<{ auditLogId: string }>;
}

/**
 * POST /api/v1/admin/rollback/:auditLogId
 *
 * Execute a rollback operation.
 * Requires admin:full capability.
 *
 * Request body:
 * - reason: string (10-500 chars, required) - explanation for rollback
 * - confirmationToken: string (optional) - required for compensatable actions
 * - dryRun: boolean (optional) - if true, validate but don't execute
 *
 * Charter P1: Identity and authorization must be provable - fully audited.
 * Charter P2: Default deny - explicit capability check.
 * Charter P4: No hidden rules - rollback behavior is policy-driven.
 * Charter P9: Fail closed - errors block the rollback.
 * Charter N5: All mutations audited - rollback itself creates audit log.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const body = await request.json();

    const validation = validateRollbackRequest(body);
    if (!validation.success) {
      return errors.validation(
        validation.error.issues.map((e) => e.message).join(", ")
      );
    }

    const rollbackRequest: RollbackRequest = {
      auditLogId,
      ...validation.data,
    };

    const result = await executeRollback(
      rollbackRequest,
      auth.context,
      request
    );

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          resourceId: result.resourceId,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      resourceId: result.resourceId,
      rollbackAuditLogId: result.rollbackAuditLogId,
      warnings: result.warnings,
    });
  } catch (error) {
    console.error("Error executing rollback:", error);
    if (error instanceof Error) {
      return errors.internal(error.message);
    }
    return errors.internal("Failed to execute rollback");
  }
}
