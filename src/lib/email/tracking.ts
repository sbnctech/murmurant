/**
 * Email Tracking Service
 *
 * Handles email delivery events and updates tracking status.
 * Privacy-conscious: open/click tracking is OFF by default.
 *
 * Events tracked:
 * - sent: Email handed to provider
 * - delivered: Provider confirmed delivery
 * - bounced: Email bounced (hard/soft)
 * - complained: Recipient marked as spam
 * - unsubscribed: Recipient clicked unsubscribe
 * - opened: Recipient opened email (if enabled)
 * - clicked: Recipient clicked link (if enabled)
 */

import { prisma } from "@/lib/prisma";
import { DeliveryStatus, AuditAction } from "@prisma/client";

export type DeliveryStats = {
  total: number;
  delivered: number;
  bounced: number;
  complained: number;
  unsubscribed: number;
  bounceRate: number;
  complaintRate: number;
  deliveryRate: number;
  topBounceDomains: { domain: string; count: number }[];
};
export type EmailEventType =
  | "sent"
  | "delivered"
  | "bounced"
  | "complained"
  | "unsubscribed"
  | "opened"
  | "clicked";

export type BounceType = "hard" | "soft" | "undetermined";

export interface EmailEvent {
  type: EmailEventType;
  deliveryLogId: string;
  timestamp: Date;
  metadata?: {
    bounceType?: BounceType;
    bounceReason?: string;
    providerMsgId?: string;
  };
}

/**
 * Get email tracking configuration.
 * Creates default config if none exists.
 */
export async function getTrackingConfig() {
  let config = await prisma.emailTrackingConfig.findFirst();

  if (!config) {
    config = await prisma.emailTrackingConfig.create({
      data: {
        trackOpens: false,
        trackClicks: false,
        trackBounces: true,
        trackComplaints: true,
        autoSuppressHardBounce: true,
        autoSuppressComplaint: true,
        retentionDays: 90,
      },
    });
  }

  return config;
}

/**
 * Process an email event and update tracking status.
 */
export async function processEmailEvent(event: EmailEvent): Promise<void> {
  const config = await getTrackingConfig();

  // Check if this event type should be tracked
  if (event.type === "opened" && !config.trackOpens) return;
  if (event.type === "clicked" && !config.trackClicks) return;
  if (event.type === "bounced" && !config.trackBounces) return;
  if (event.type === "complained" && !config.trackComplaints) return;

  const deliveryLog = await prisma.deliveryLog.findUnique({
    where: { id: event.deliveryLogId },
    include: { campaign: true },
  });

  if (!deliveryLog) {
    console.warn(`DeliveryLog not found: ${event.deliveryLogId}`);
    return;
  }

  // Update delivery log based on event type
  const updateData = getUpdateDataForEvent(event);
  const newStatus = getStatusForEvent(event.type);

  await prisma.deliveryLog.update({
    where: { id: event.deliveryLogId },
    data: {
      ...updateData,
      status: newStatus,
    },
  });

  // Handle suppression for hard bounces and complaints
  if (event.type === "bounced" && event.metadata?.bounceType === "hard") {
    if (config.autoSuppressHardBounce) {
      await addToSuppressionList(
        deliveryLog.recipientEmail,
        "hard_bounce",
        event.deliveryLogId
      );
    }
  }

  if (event.type === "complained") {
    if (config.autoSuppressComplaint) {
      await addToSuppressionList(
        deliveryLog.recipientEmail,
        "complaint",
        event.deliveryLogId
      );
    }
  }

  // Create audit log entry for significant events
  if (shouldAuditEvent(event.type)) {
    await createAuditLogEntry(event, deliveryLog);
  }
}

/**
 * Add email to suppression list.
 */
async function addToSuppressionList(
  email: string,
  reason: string,
  sourceLogId: string
): Promise<void> {
  await prisma.emailSuppressionList.upsert({
    where: { email },
    create: {
      email,
      reason,
      sourceLogId,
    },
    update: {
      reason,
      sourceLogId,
      addedAt: new Date(),
    },
  });
}

/**
 * Check if email is suppressed.
 */
export async function isEmailSuppressed(email: string): Promise<boolean> {
  const suppression = await prisma.emailSuppressionList.findUnique({
    where: { email },
  });

  if (!suppression) return false;

  // Check if suppression has expired
  if (suppression.expiresAt && suppression.expiresAt < new Date()) {
    return false;
  }

  return true;
}

/**
 * Get update data for delivery log based on event type.
 */
function getUpdateDataForEvent(event: EmailEvent): Record<string, unknown> {
  switch (event.type) {
    case "sent":
      return {
    total: 0,
    delivered: 0,
    bounced: 0,
    complained: 0,
    unsubscribed: 0,
sentAt: event.timestamp };
    case "delivered":
      return { deliveredAt: event.timestamp };
    case "bounced":
      return {
        bouncedAt: event.timestamp,
        bounceType: event.metadata?.bounceType,
        bounceReason: event.metadata?.bounceReason,
      };
    case "complained":
      return { complainedAt: event.timestamp };
    case "unsubscribed":
      return { unsubscribedAt: event.timestamp };
    case "opened":
      return { openedAt: event.timestamp };
    case "clicked":
      return { clickedAt: event.timestamp };
    default:
      return {};
  }
}

/**
 * Map event type to delivery status.
 */
function getStatusForEvent(eventType: EmailEventType): DeliveryStatus {
  switch (eventType) {
    case "sent":
      return DeliveryStatus.SENT;
    case "delivered":
      return DeliveryStatus.DELIVERED;
    case "bounced":
      return DeliveryStatus.BOUNCED;
    case "complained":
      return DeliveryStatus.COMPLAINED;
    case "unsubscribed":
      return DeliveryStatus.UNSUBSCRIBED;
    case "opened":
    case "clicked":
      // These don't change the status, keep as DELIVERED
      return DeliveryStatus.DELIVERED;
    default:
      return DeliveryStatus.PENDING;
  }
}

/**
 * Determine if event should create an audit log entry.
 */
function shouldAuditEvent(eventType: EmailEventType): boolean {
  // Audit significant events only, not opens/clicks
  return ["sent", "bounced", "complained", "unsubscribed"].includes(eventType);
}

/**
 * Map event type to audit action.
 */
function getAuditAction(eventType: EmailEventType): AuditAction {
  switch (eventType) {
    case "sent":
      return AuditAction.EMAIL_SENT;
    case "bounced":
      return AuditAction.EMAIL_BOUNCED;
    case "complained":
      return AuditAction.EMAIL_COMPLAINED;
    case "unsubscribed":
      return AuditAction.EMAIL_UNSUBSCRIBED;
    default:
      return AuditAction.EMAIL_SENT;
  }
}

/**
 * Create audit log entry for email event.
 */
async function createAuditLogEntry(
  event: EmailEvent,
  deliveryLog: { id: string; recipientEmail: string; campaignId: string }
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action: getAuditAction(event.type),
      resourceType: "delivery_log",
      resourceId: deliveryLog.id,
      metadata: {
        recipientEmail: deliveryLog.recipientEmail,
        campaignId: deliveryLog.campaignId,
        eventType: event.type,
        timestamp: event.timestamp.toISOString(),
        ...(event.metadata || {}),
      },
    },
  });
}

/**
 * Record a new email send.
 * Called when email is queued/sent to provider.
 */
export async function recordEmailSent(
  campaignId: string,
  recipientEmail: string,
  recipientId?: string,
  providerMsgId?: string
): Promise<string> {
  const deliveryLog = await prisma.deliveryLog.create({
    data: {
      campaignId,
      recipientEmail,
      recipientId,
      providerMsgId,
      status: DeliveryStatus.SENT,
      sentAt: new Date(),
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      action: AuditAction.EMAIL_SENT,
      resourceType: "delivery_log",
      resourceId: deliveryLog.id,
      metadata: {
        recipientEmail,
        campaignId,
        providerMsgId,
      },
    },
  });

  return deliveryLog.id;
}

/**
 * Get email delivery statistics for a time range.
 */
export async function getDeliveryStats(options: {
  startDate: Date;
  endDate: Date;
  campaignId?: string;
}) {
  const where = {
    createdAt: {
      gte: options.startDate,
      lte: options.endDate,
    },
    ...(options.campaignId && { campaignId: options.campaignId }),
  };

  const [total, statusCounts, topBounceDomains] = await Promise.all([
    prisma.deliveryLog.count({ where }),
    prisma.deliveryLog.groupBy({
      by: ["status"],
      where,
      _count: true,
    }),
    // Get top domains with bounces
    prisma.$queryRaw<{ domain: string; count: bigint }[]>`
      SELECT
        SUBSTRING(recipient_email FROM POSITION('@' IN recipient_email) + 1) as domain,
        COUNT(*) as count
      FROM "DeliveryLog"
      WHERE status = 'BOUNCED'
        AND created_at >= ${options.startDate}
        AND created_at <= ${options.endDate}
      GROUP BY domain
      ORDER BY count DESC
      LIMIT 10
    `,
  ]);

  const stats: Record<string, number> = {
    total,
    sent: 0,
    delivered: 0,
    bounced: 0,
    failed: 0,
    complained: 0,
    unsubscribed: 0,
  };

  for (const row of statusCounts) {
    stats[row.status.toLowerCase()] = row._count;
  }

  return {
    ...stats,
    bounceRate: total > 0 ? (stats.bounced / total) * 100 : 0,
    complaintRate: total > 0 ? (stats.complained / total) * 100 : 0,
    deliveryRate: total > 0 ? (stats.delivered / total) * 100 : 0,
    topBounceDomains: topBounceDomains.map((d) => ({
      domain: d.domain,
      count: Number(d.count),
    })),
  } as DeliveryStats;

}

/**
 * Get recent campaigns with delivery stats.
 */
export async function getRecentCampaignStats(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const campaigns = await prisma.messageCampaign.findMany({
    where: {
      sentAt: {
        gte: startDate,
      },
    },
    include: {
      messageTemplate: {
        select: { name: true },
      },
      _count: {
        select: { deliveryLogs: true },
      },
    },
    orderBy: { sentAt: "desc" },
    take: 20,
  });

  // Get per-campaign stats
  const campaignStats = await Promise.all(
    campaigns.map(async (campaign) => {
      const stats = await prisma.deliveryLog.groupBy({
        by: ["status"],
        where: { campaignId: campaign.id },
        _count: true,
      });

      const statusMap: Record<string, number> = {};
      for (const row of stats) {
        statusMap[row.status.toLowerCase()] = row._count;
      }

      const total = campaign._count.deliveryLogs;
      const bounced = statusMap.bounced || 0;
      const complained = statusMap.complained || 0;

      return {
        id: campaign.id,
        name: campaign.name,
        templateName: campaign.messageTemplate.name,
        sentAt: campaign.sentAt,
        totalRecipients: total,
        delivered: statusMap.delivered || 0,
        bounced,
        complained,
        bounceRate: total > 0 ? (bounced / total) * 100 : 0,
        complaintRate: total > 0 ? (complained / total) * 100 : 0,
        needsAttention: bounced > 0 || complained > 0,
      };
    })
  );

  return campaignStats;
}

/**
 * Get alerts for email health issues.
 */
export async function getEmailHealthAlerts() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const stats = await getDeliveryStats({
    startDate: thirtyDaysAgo,
    endDate: new Date(),
  });

  const alerts: Array<{
    type: "warning" | "error";
    message: string;
    metric: string;
    value: number;
  }> = [];

  // High bounce rate alert (> 5%)
  if (stats.bounceRate > 5) {
    alerts.push({
      type: stats.bounceRate > 10 ? "error" : "warning",
      message: `Bounce rate is ${stats.bounceRate.toFixed(1)}% (threshold: 5%)`,
      metric: "bounceRate",
      value: stats.bounceRate,
    });
  }

  // High complaint rate alert (> 0.1%)
  if (stats.complaintRate > 0.1) {
    alerts.push({
      type: stats.complaintRate > 0.5 ? "error" : "warning",
      message: `Complaint rate is ${stats.complaintRate.toFixed(2)}% (threshold: 0.1%)`,
      metric: "complaintRate",
      value: stats.complaintRate,
    });
  }

  // Low delivery rate alert (< 90%)
  if (stats.total > 100 && stats.deliveryRate < 90) {
    alerts.push({
      type: stats.deliveryRate < 80 ? "error" : "warning",
      message: `Delivery rate is ${stats.deliveryRate.toFixed(1)}% (threshold: 90%)`,
      metric: "deliveryRate",
      value: stats.deliveryRate,
    });
  }

  return alerts;
}

/**
 * Clean up old delivery logs based on retention policy.
 */
export async function cleanupOldDeliveryLogs(): Promise<number> {
  const config = await getTrackingConfig();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - config.retentionDays);

  const result = await prisma.deliveryLog.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  return result.count;
}
