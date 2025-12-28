/**
 * Email Status API
 *
 * GET /api/v1/admin/email/status/[id]
 *   Check email delivery status by message ID
 *
 * Authorization: Requires admin capability
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { getEmailService } from "@/services/email";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "comms:manage");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Missing message ID" },
        { status: 400 }
      );
    }

    const emailService = getEmailService();
    const status = await emailService.getEmailStatus(id);

    return NextResponse.json({
      messageId: id,
      status,
    });
  } catch (error) {
    console.error("Email status API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
