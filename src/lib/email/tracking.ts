/**
 * Email Tracking Service
 * Copyright (c) Santa Barbara Newcomers Club
 *
 * Processes email delivery events and manages the suppression list.
 * Privacy-first: open/click tracking OFF by default.
 *
 * Reference: docs/email/EMAIL_TRACKING.md
 */

import { prisma } from "@/lib/prisma";
import { AuditAction, DeliveryStatus } from "@prisma/client";

// Types for email events
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
  providerMsgId: string;
  recipientEmail: string;
  timestamp: Date;
  bounceType?: BounceType;
  bounceReason?: string;
  metadata?: Record<string, unknown>;
}

export interface EmailHealthStats {
  period: { start: Date; end: Date };
  sent: number;
  delivered: number;
  bounced: number;
  complained: number;
  unsubscribed: number;
  opened: number;
  clicked: number;
  deliveryRate: number;
  bounceRate: number;
  complaintRate: number;
}

export interface EmailHealthAlert {
  level: "warning" | "critical";
  type: string;
  message: string;
  value: number;
  threshold: number;
}

// Threshold constants for alerts
const ALERT_THRESHOLDS = {
  bounceRateWarning: 0.02, // 2%
  bounceRateCritical: 0.05, // 5%
  complaintRateWarning: 0.001, // 0.1%
  complaintRateCritical: 0.005, // 0.5%
};

/**
 * Get or create the tracking configuration
 */
export async function getTrackingConfig() {
  let config = await prisma.emailTrackingConfig.findFirst();

  if (!config) {
    // Create default config (privacy-first defaults)
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
 * Update tracking configuration
 */
export async function updateTrackingConfig(
  configId: string,
  updates: {
    trackOpens?: boolean;
    trackClicks?: boolean;
    trackBounces?: boolean;
    trackComplaints?: boolean;
    autoSuppressHardBounce?: boolean;
    autoSuppressComplaint?: boolean;
    retentionDays?: number;
  }
) {
  return prisma.emailTrackingConfig.update({
    where: { id: configId },
    data: updates,
  });
}

/**
 * Process an email delivery event from webhook
 */
export async function processEmailEvent(
  event: EmailEvent,
  actorMemberId?: string
): Promise<void> {
  const config = await getTrackingConfig();

  // Find the delivery log by provider message ID
  const deliveryLog = await prisma.deliveryLog.findFirst({
    where: { providerMsgId: event.providerMsgId },
  });

  if (!deliveryLog) {
    console.warn(
      `[EmailTracking] No delivery log found for providerMsgId: ${event.providerMsgId}`
    );
    return;
  }

  // Process based on event type
  switch (event.type) {
    case "sent":
      await handleSentEvent(deliveryLog.id, event, actorMemberId);
      break;

    case "delivered":
      await handleDeliveredEvent(deliveryLog.id, event, actorMemberId);
      break;

    case "bounced":
      if (config.trackBounces) {
        await handleBouncedEvent(
          deliveryLog.id,
          event,
          config.autoSuppressHardBounce,
          actorMemberId
        );
      }
      break;

    case "complained":
      if (config.trackComplaints) {
        await handleComplainedEvent(
          deliveryLog.id,
          event,
          config.autoSuppressComplaint,
          actorMemberId
        );
      }
      break;

    case "unsubscribed":
      await handleUnsubscribedEvent(deliveryLog.id, event, actorMemberId);
      break;

    case "opened":
      if (config.trackOpens) {
        await handleOpenedEvent(deliveryLog.id, event);
      }
      break;

    case "clicked":
      if (config.trackClicks) {
        await handleClickedEvent(deliveryLog.id, event);
      }
      break;
  }
}

async function handleSentEvent(
  deliveryLogId: string,
  event: EmailEvent,
  actorMemberId?: string
) {
  await prisma.$transaction([
    prisma.deliveryLog.update({
      where: { id: deliveryLogId },
      data: {
        status: DeliveryStatus.SENT,
        sentAt: event.timestamp,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: AuditAction.EMAIL_SENT,
        resourceType: "delivery_log",
        resourceId: deliveryLogId,
        memberId: actorMemberId,
        metadata: {
          recipientEmail: event.recipientEmail,
          providerMsgId: event.providerMsgId,
        },
      },
    }),
  ]);
}

async function handleDeliveredEvent(
  deliveryLogId: string,
  event: EmailEvent,
  actorMemberId?: string
) {
  await prisma.$transaction([
    prisma.deliveryLog.update({
      where: { id: deliveryLogId },
      data: {
        status: DeliveryStatus.DELIVERED,
        deliveredAt: event.timestamp,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: AuditAction.EMAIL_DELIVERED,
        resourceType: "delivery_log",
        resourceId: deliveryLogId,
        memberId: actorMemberId,
        metadata: {
          recipientEmail: event.recipientEmail,
          providerMsgId: event.providerMsgId,
        },
      },
    }),
  ]);
}

async function handleBouncedEvent(
  deliveryLogId: string,
  event: EmailEvent,
  autoSuppress: boolean,
  actorMemberId?: string
) {
  await prisma.$transaction(async (tx) => {
    await tx.deliveryLog.update({
      where: { id: deliveryLogId },
      data: {
        status: DeliveryStatus.BOUNCED,
        bouncedAt: event.timestamp,
        bounceType: event.bounceType || "undetermined",
        bounceReason: event.bounceReason,
      },
    });

    await tx.auditLog.create({
      data: {
        action: AuditAction.EMAIL_BOUNCED,
        resourceType: "delivery_log",
        resourceId: deliveryLogId,
        memberId: actorMemberId,
        metadata: {
          recipientEmail: event.recipientEmail,
          providerMsgId: event.providerMsgId,
          bounceType: event.bounceType,
          bounceReason: event.bounceReason,
        },
      },
    });

    // Auto-suppress hard bounces
    if (autoSuppress && event.bounceType === "hard") {
      await tx.emailSuppressionList.upsert({
        where: { email: event.recipientEmail },
        create: {
          email: event.recipientEmail,
          reason: "hard_bounce",
          sourceLogId: deliveryLogId,
          notes: event.bounceReason,
        },
        update: {
          reason: "hard_bounce",
          sourceLogId: deliveryLogId,
          notes: event.bounceReason,
          addedAt: new Date(),
        },
      });
    }
  });
}

async function handleComplainedEvent(
  deliveryLogId: string,
  event: EmailEvent,
  autoSuppress: boolean,
  actorMemberId?: string
) {
  await prisma.$transaction(async (tx) => {
    await tx.deliveryLog.update({
      where: { id: deliveryLogId },
      data: {
        status: DeliveryStatus.COMPLAINED,
        complainedAt: event.timestamp,
      },
    });

    await tx.auditLog.create({
      data: {
        action: AuditAction.EMAIL_COMPLAINED,
        resourceType: "delivery_log",
        resourceId: deliveryLogId,
        memberId: actorMemberId,
        metadata: {
          recipientEmail: event.recipientEmail,
          providerMsgId: event.providerMsgId,
        },
      },
    });

    // Auto-suppress complaints
    if (autoSuppress) {
      await tx.emailSuppressionList.upsert({
        where: { email: event.recipientEmail },
        create: {
          email: event.recipientEmail,
          reason: "complaint",
          sourceLogId: deliveryLogId,
        },
        update: {
          reason: "complaint",
          sourceLogId: deliveryLogId,
          addedAt: new Date(),
        },
      });
    }
  });
}

async function handleUnsubscribedEvent(
  deliveryLogId: string,
  event: EmailEvent,
  actorMemberId?: string
) {
  await prisma.$transaction([
    prisma.deliveryLog.update({
      where: { id: deliveryLogId },
      data: {
        status: DeliveryStatus.UNSUBSCRIBED,
        unsubscribedAt: event.timestamp,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: AuditAction.EMAIL_UNSUBSCRIBED,
        resourceType: "delivery_log",
        resourceId: deliveryLogId,
        memberId: actorMemberId,
        metadata: {
          recipientEmail: event.recipientEmail,
          providerMsgId: event.providerMsgId,
        },
      },
    }),
  ]);
}

async function handleOpenedEvent(deliveryLogId: string, event: EmailEvent) {
  // Only update if not already set (first open)
  await prisma.deliveryLog.updateMany({
    where: {
      id: deliveryLogId,
      openedAt: null,
    },
    data: {
      openedAt: event.timestamp,
    },
  });
}

async function handleClickedEvent(deliveryLogId: string, event: EmailEvent) {
  // Only update if not already set (first click)
  await prisma.deliveryLog.updateMany({
    where: {
      id: deliveryLogId,
      clickedAt: null,
    },
    data: {
      clickedAt: event.timestamp,
    },
  });
}

/**
 * Check if an email is on the suppression list
 */
export async function isEmailSuppressed(email: string): Promise<boolean> {
  const suppression = await prisma.emailSuppressionList.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!suppression) return false;

  // Check if suppression has expired
  if (suppression.expiresAt && suppression.expiresAt < new Date()) {
    // Remove expired suppression
    await prisma.emailSuppressionList.delete({ where: { email } });
    return false;
  }

  return true;
}

/**
 * Add an email to the suppression list manually
 */
export async function addToSuppressionList(
  email: string,
  reason: string,
  notes?: string,
  expiresAt?: Date
) {
  return prisma.emailSuppressionList.upsert({
    where: { email: email.toLowerCase() },
    create: {
      email: email.toLowerCase(),
      reason,
      notes,
      expiresAt,
    },
    update: {
      reason,
      notes,
      expiresAt,
      addedAt: new Date(),
    },
  });
}

/**
 * Remove an email from the suppression list
 */
export async function removeFromSuppressionList(email: string) {
  return prisma.emailSuppressionList.delete({
    where: { email: email.toLowerCase() },
  });
}

/**
 * Get delivery statistics for a time period
 */
export async function getDeliveryStats(
  startDate: Date,
  endDate: Date
): Promise<EmailHealthStats> {
  const logs = await prisma.deliveryLog.groupBy({
    by: ["status"],
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: true,
  });

  // Count opens and clicks separately (they don't change status)
  const [openedCount, clickedCount] = await Promise.all([
    prisma.deliveryLog.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        openedAt: { not: null },
      },
    }),
    prisma.deliveryLog.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        clickedAt: { not: null },
      },
    }),
  ]);

  // Build stats from grouped data
  const statusCounts: Record<string, number> = {};
  for (const log of logs) {
    statusCounts[log.status] = log._count;
  }

  const sent =
    (statusCounts.SENT || 0) +
    (statusCounts.DELIVERED || 0) +
    (statusCounts.BOUNCED || 0) +
    (statusCounts.COMPLAINED || 0) +
    (statusCounts.UNSUBSCRIBED || 0);

  const delivered = statusCounts.DELIVERED || 0;
  const bounced = statusCounts.BOUNCED || 0;
  const complained = statusCounts.COMPLAINED || 0;
  const unsubscribed = statusCounts.UNSUBSCRIBED || 0;

  return {
    period: { start: startDate, end: endDate },
    sent,
    delivered,
    bounced,
    complained,
    unsubscribed,
    opened: openedCount,
    clicked: clickedCount,
    deliveryRate: sent > 0 ? delivered / sent : 0,
    bounceRate: sent > 0 ? bounced / sent : 0,
    complaintRate: sent > 0 ? complained / sent : 0,
  };
}

/**
 * Get recent campaign statistics for dashboard
 */
export async function getRecentCampaignStats(limit: number = 10) {
  return prisma.messageCampaign.findMany({
    where: {
      status: "SENT",
    },
    orderBy: { sentAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      sentAt: true,
      totalRecipients: true,
      successCount: true,
      failureCount: true,
      _count: {
        select: {
          deliveryLogs: true,
        },
      },
    },
  });
}

/**
 * Generate health alerts based on current metrics
 */
export async function getEmailHealthAlerts(
  days: number = 7
): Promise<EmailHealthAlert[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await getDeliveryStats(startDate, endDate);
  const alerts: EmailHealthAlert[] = [];

  // Check bounce rate
  if (stats.bounceRate >= ALERT_THRESHOLDS.bounceRateCritical) {
    alerts.push({
      level: "critical",
      type: "bounce_rate",
      message: `Critical: Bounce rate is ${(stats.bounceRate * 100).toFixed(1)}% (threshold: ${ALERT_THRESHOLDS.bounceRateCritical * 100}%)`,
      value: stats.bounceRate,
      threshold: ALERT_THRESHOLDS.bounceRateCritical,
    });
  } else if (stats.bounceRate >= ALERT_THRESHOLDS.bounceRateWarning) {
    alerts.push({
      level: "warning",
      type: "bounce_rate",
      message: `Warning: Bounce rate is ${(stats.bounceRate * 100).toFixed(1)}% (threshold: ${ALERT_THRESHOLDS.bounceRateWarning * 100}%)`,
      value: stats.bounceRate,
      threshold: ALERT_THRESHOLDS.bounceRateWarning,
    });
  }

  // Check complaint rate
  if (stats.complaintRate >= ALERT_THRESHOLDS.complaintRateCritical) {
    alerts.push({
      level: "critical",
      type: "complaint_rate",
      message: `Critical: Complaint rate is ${(stats.complaintRate * 100).toFixed(2)}% (threshold: ${ALERT_THRESHOLDS.complaintRateCritical * 100}%)`,
      value: stats.complaintRate,
      threshold: ALERT_THRESHOLDS.complaintRateCritical,
    });
  } else if (stats.complaintRate >= ALERT_THRESHOLDS.complaintRateWarning) {
    alerts.push({
      level: "warning",
      type: "complaint_rate",
      message: `Warning: Complaint rate is ${(stats.complaintRate * 100).toFixed(2)}% (threshold: ${ALERT_THRESHOLDS.complaintRateWarning * 100}%)`,
      value: stats.complaintRate,
      threshold: ALERT_THRESHOLDS.complaintRateWarning,
    });
  }

  return alerts;
}

/**
 * Get suppression list summary
 */
export async function getSuppressionSummary() {
  const [total, byReason] = await Promise.all([
    prisma.emailSuppressionList.count(),
    prisma.emailSuppressionList.groupBy({
      by: ["reason"],
      _count: true,
    }),
  ]);

  const reasons: Record<string, number> = {};
  for (const r of byReason) {
    reasons[r.reason] = r._count;
  }

  return { total, byReason: reasons };
}

/**
 * Cleanup old delivery logs based on retention policy
 */
export async function cleanupOldDeliveryLogs(): Promise<number> {
  const config = await getTrackingConfig();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - config.retentionDays);

  const result = await prisma.deliveryLog.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
    },
  });

  return result.count;
}

/**
 * Record a new email send (called when sending email)
 */
export async function recordEmailSent(params: {
  campaignId: string;
  recipientId?: string;
  recipientEmail: string;
  providerMsgId: string;
}): Promise<string> {
  const log = await prisma.deliveryLog.create({
    data: {
      campaignId: params.campaignId,
      recipientId: params.recipientId,
      recipientEmail: params.recipientEmail,
      providerMsgId: params.providerMsgId,
      status: DeliveryStatus.PENDING,
    },
  });

  return log.id;
}
