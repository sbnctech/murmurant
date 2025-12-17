/**
 * GET /api/v1/admin/email-health
 *
 * VP Tech dashboard endpoint for email deliverability health.
 * Returns delivery statistics, alerts, and suppression summary.
 *
 * Query params:
 * - days: Number of days to analyze (default: 7, max: 90)
 *
 * Charter Principles:
 * - P1: Identity provable - requires comms:manage or admin:full capability
 * - P7: Observability - provides metrics for monitoring email health
 * - P10: Privacy - open/click tracking OFF by default
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import {
  getDeliveryStats,
  getEmailHealthAlerts,
  getSuppressionSummary,
  getRecentCampaignStats,
  getTrackingConfig,
} from "@/lib/email/tracking";

export async function GET(request: NextRequest) {
  // Require comms:manage capability (VP Tech has this via admin:full)
  const auth = await requireCapability(request, "comms:manage");
  if (!auth.ok) return auth.response;

  // Parse query params
  const searchParams = request.nextUrl.searchParams;
  const daysParam = searchParams.get("days");
  const days = Math.min(Math.max(parseInt(daysParam || "7", 10) || 7, 1), 90);

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Fetch all data in parallel
  const [stats, alerts, suppressionSummary, recentCampaigns, config] =
    await Promise.all([
      getDeliveryStats(startDate, endDate),
      getEmailHealthAlerts(days),
      getSuppressionSummary(),
      getRecentCampaignStats(10),
      getTrackingConfig(),
    ]);

  return NextResponse.json({
    stats,
    alerts,
    suppression: suppressionSummary,
    recentCampaigns,
    config: {
      trackOpens: config.trackOpens,
      trackClicks: config.trackClicks,
      trackBounces: config.trackBounces,
      trackComplaints: config.trackComplaints,
      retentionDays: config.retentionDays,
    },
    _meta: {
      generatedAt: new Date().toISOString(),
      periodDays: days,
    },
  });
}
