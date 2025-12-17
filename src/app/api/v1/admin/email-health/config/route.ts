/**
 * Email Tracking Configuration API
 *
 * GET /api/v1/admin/email-health/config
 *   Returns current tracking configuration
 *
 * PATCH /api/v1/admin/email-health/config
 *   Updates tracking configuration
 *
 * Authorization: Requires admin role (not webmaster)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getTrackingConfig } from "@/lib/email/tracking";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const config = await getTrackingConfig();

  return NextResponse.json({ config });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();

    // Validate allowed fields
    const allowedFields = [
      "trackOpens",
      "trackClicks",
      "trackBounces",
      "trackComplaints",
      "autoSuppressHardBounce",
      "autoSuppressComplaint",
      "retentionDays",
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        if (field === "retentionDays") {
          const days = parseInt(body[field], 10);
          if (isNaN(days) || days < 7 || days > 365) {
            return NextResponse.json(
              { error: "retentionDays must be between 7 and 365" },
              { status: 400 }
            );
          }
          updateData[field] = days;
        } else {
          updateData[field] = Boolean(body[field]);
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Get existing config or create
    let config = await prisma.emailTrackingConfig.findFirst();

    if (config) {
      config = await prisma.emailTrackingConfig.update({
        where: { id: config.id },
        data: updateData,
      });
    } else {
      config = await prisma.emailTrackingConfig.create({
        data: {
          trackOpens: false,
          trackClicks: false,
          trackBounces: true,
          trackComplaints: true,
          autoSuppressHardBounce: true,
          autoSuppressComplaint: true,
          retentionDays: 90,
          ...updateData,
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "UPDATE",
        resourceType: "email_tracking_config",
        resourceId: config.id,
        memberId: auth.context.memberId,
        after: (updateData as unknown as Prisma.InputJsonValue),
      },
    });

    return NextResponse.json({ config });
  } catch (error) {
    console.error("Config update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
