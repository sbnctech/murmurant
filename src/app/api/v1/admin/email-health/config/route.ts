/**
 * GET/PATCH /api/v1/admin/email-health/config
 *
 * Manage email tracking configuration.
 * Privacy-first: open/click tracking OFF by default.
 *
 * GET: Returns current tracking configuration
 * PATCH: Updates tracking configuration
 *
 * Charter Principles:
 * - P1: Identity provable - requires admin:full capability
 * - P7: Observability - configuration changes are logged
 * - P10: Privacy-conscious defaults (trackOpens/trackClicks OFF)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { getTrackingConfig, updateTrackingConfig } from "@/lib/email/tracking";
import { prisma } from "@/lib/prisma";
import { AuditAction } from "@prisma/client";
import { z } from "zod";

const ConfigUpdateSchema = z
  .object({
    trackOpens: z.boolean().optional(),
    trackClicks: z.boolean().optional(),
    trackBounces: z.boolean().optional(),
    trackComplaints: z.boolean().optional(),
    autoSuppressHardBounce: z.boolean().optional(),
    autoSuppressComplaint: z.boolean().optional(),
    retentionDays: z.number().int().min(7).max(365).optional(),
  })
  .strict();

export async function GET(request: NextRequest) {
  // Require admin capability for viewing full config
  const auth = await requireCapability(request, "admin:full");
  if (!auth.ok) return auth.response;

  const config = await getTrackingConfig();

  return NextResponse.json({
    id: config.id,
    trackOpens: config.trackOpens,
    trackClicks: config.trackClicks,
    trackBounces: config.trackBounces,
    trackComplaints: config.trackComplaints,
    autoSuppressHardBounce: config.autoSuppressHardBounce,
    autoSuppressComplaint: config.autoSuppressComplaint,
    retentionDays: config.retentionDays,
    updatedAt: config.updatedAt.toISOString(),
  });
}

export async function PATCH(request: NextRequest) {
  // Require admin capability for updating config
  const auth = await requireCapability(request, "admin:full");
  if (!auth.ok) return auth.response;

  // Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = ConfigUpdateSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const updates = parseResult.data;

  // Get current config for audit log
  const currentConfig = await getTrackingConfig();
  const before = {
    trackOpens: currentConfig.trackOpens,
    trackClicks: currentConfig.trackClicks,
    trackBounces: currentConfig.trackBounces,
    trackComplaints: currentConfig.trackComplaints,
    autoSuppressHardBounce: currentConfig.autoSuppressHardBounce,
    autoSuppressComplaint: currentConfig.autoSuppressComplaint,
    retentionDays: currentConfig.retentionDays,
  };

  // Update config
  const updated = await updateTrackingConfig(currentConfig.id, updates);

  // Log the configuration change
  await prisma.auditLog.create({
    data: {
      action: AuditAction.UPDATE,
      resourceType: "email_tracking_config",
      resourceId: currentConfig.id,
      memberId: auth.context.memberId,
      before,
      after: updates,
      metadata: {
        changedFields: Object.keys(updates),
      },
    },
  });

  return NextResponse.json({
    id: updated.id,
    trackOpens: updated.trackOpens,
    trackClicks: updated.trackClicks,
    trackBounces: updated.trackBounces,
    trackComplaints: updated.trackComplaints,
    autoSuppressHardBounce: updated.autoSuppressHardBounce,
    autoSuppressComplaint: updated.autoSuppressComplaint,
    retentionDays: updated.retentionDays,
    updatedAt: updated.updatedAt.toISOString(),
    message: "Configuration updated successfully",
  });
}
