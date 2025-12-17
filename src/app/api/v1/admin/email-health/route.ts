/**
 * Email Health Dashboard API
 *
 * Provides email deliverability metrics for VP Tech dashboard.
 *
 * GET /api/v1/admin/email-health
 *   Returns: Recent campaigns, bounce rates, alerts
 *
 * Authorization: Requires admin or webmaster role
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import {
  getDeliveryStats,
  getRecentCampaignStats,
  getEmailHealthAlerts,
  getTrackingConfig,
} from "@/lib/email/tracking";

export async function GET(req: NextRequest) {
  // Webmaster and admin can view email health
  const auth = await requireCapability(req, "comms:manage");
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "30", 10);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const endDate = new Date();

    const [stats, campaigns, alerts, config] = await Promise.all([
      getDeliveryStats({ startDate, endDate }),
      getRecentCampaignStats(days),
      getEmailHealthAlerts(),
      getTrackingConfig(),
    ]);

    return NextResponse.json({
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      summary: {
        total: stats.total,
        delivered: stats.delivered,
        bounced: stats.bounced,
        complained: stats.complained,
        unsubscribed: stats.unsubscribed,
        bounceRate: Math.round(stats.bounceRate * 100) / 100,
        complaintRate: Math.round(stats.complaintRate * 1000) / 1000,
        deliveryRate: Math.round(stats.deliveryRate * 100) / 100,
      },
      topBounceDomains: stats.topBounceDomains,
      recentCampaigns: campaigns,
      alerts,
      config: {
        trackOpens: config.trackOpens,
        trackClicks: config.trackClicks,
        trackBounces: config.trackBounces,
        trackComplaints: config.trackComplaints,
        retentionDays: config.retentionDays,
      },
    });
  } catch (error) {
    console.error("Email health API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
