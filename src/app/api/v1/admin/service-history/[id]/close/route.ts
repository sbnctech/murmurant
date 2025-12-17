import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { errors } from "@/lib/api";
import { auditMutation } from "@/lib/audit";
import { closeServiceRecord, closeServiceRecordSchema } from "@/lib/serviceHistory";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/v1/admin/service-history/:id/close
 *
 * Close an active service record by setting its endAt date.
 * Requires users:manage capability.
 *
 * Request body:
 * - endAt: ISO date (required) - the date the service ended
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "users:manage");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const body = await req.json();

    const parseResult = closeServiceRecordSchema.safeParse(body);
    if (!parseResult.success) {
      return errors.validation(
        parseResult.error.issues.map((e) => e.message).join(", ")
      );
    }

    const record = await closeServiceRecord(id, parseResult.data.endAt);

    await auditMutation(req, auth.context, {
      action: "UPDATE",
      capability: "users:manage",
      objectType: "ServiceRecord",
      objectId: id,
      metadata: { action: "close", endAt: parseResult.data.endAt },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error("Error closing service record:", error);
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return errors.notFound("ServiceRecord", id);
      }
      if (error.message.includes("already closed")) {
        return errors.conflict("Service record is already closed", {
          serviceId: id,
        });
      }
      return errors.internal(error.message);
    }
    return errors.internal("Failed to close service record");
  }
}
