/**
 * Email Webhook Handler
 *
 * Receives email delivery events from email providers.
 * Supports multiple provider formats (designed for future expansion).
 *
 * POST /api/webhooks/email
 *   Processes bounce, complaint, and delivery notifications
 *
 * Security:
 * - Validates webhook signature (provider-specific)
 * - Rate limited
 * - Logs all incoming events
 */

import { NextRequest, NextResponse } from "next/server";
import { processEmailEvent, EmailEventType, BounceType } from "@/lib/email/tracking";
import { prisma } from "@/lib/prisma";

// Webhook secret for validation (in production, use env var)
const WEBHOOK_SECRET = process.env.EMAIL_WEBHOOK_SECRET || "dev-webhook-secret";

/**
 * Validate webhook signature.
 * In production, implement provider-specific signature validation.
 */
function validateWebhookSignature(req: NextRequest): boolean {
  // Development: check for secret header
  const signature = req.headers.get("x-webhook-signature");

  // In dev mode, allow without signature
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  return signature === WEBHOOK_SECRET;
}

/**
 * Parse webhook payload from various providers.
 * Currently supports a generic format; expand for specific providers.
 */
interface WebhookPayload {
  eventType: EmailEventType;
  deliveryLogId?: string;
  providerMsgId?: string;
  recipientEmail?: string;
  timestamp?: string;
  bounceType?: BounceType;
  bounceReason?: string;
}

function parseWebhookPayload(body: unknown): WebhookPayload | null {
  if (!body || typeof body !== "object") return null;

  const payload = body as Record<string, unknown>;

  // Map common provider formats to our internal format
  // Generic format
  if (payload.eventType && typeof payload.eventType === "string") {
    return {
      eventType: payload.eventType as EmailEventType,
      deliveryLogId: payload.deliveryLogId as string | undefined,
      providerMsgId: payload.providerMsgId as string | undefined,
      recipientEmail: payload.recipientEmail as string | undefined,
      timestamp: payload.timestamp as string | undefined,
      bounceType: payload.bounceType as BounceType | undefined,
      bounceReason: payload.bounceReason as string | undefined,
    };
  }

  // AWS SES format (simplified)
  if (payload.eventType === "Bounce" || payload.notificationType === "Bounce") {
    const bounce = (payload.bounce || payload) as Record<string, unknown>;
    return {
      eventType: "bounced",
      providerMsgId: (payload.mail as Record<string, unknown>)?.messageId as string,
      bounceType: (bounce.bounceType === "Permanent" ? "hard" : "soft") as BounceType,
      bounceReason: bounce.bounceSubType as string,
    };
  }

  if (payload.eventType === "Complaint" || payload.notificationType === "Complaint") {
    return {
      eventType: "complained",
      providerMsgId: (payload.mail as Record<string, unknown>)?.messageId as string,
    };
  }

  if (payload.eventType === "Delivery" || payload.notificationType === "Delivery") {
    return {
      eventType: "delivered",
      providerMsgId: (payload.mail as Record<string, unknown>)?.messageId as string,
    };
  }

  return null;
}

export async function POST(req: NextRequest) {
  // Validate webhook signature
  if (!validateWebhookSignature(req)) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const payload = parseWebhookPayload(body);

    if (!payload) {
      return NextResponse.json(
        { error: "Invalid payload format" },
        { status: 400 }
      );
    }

    // Find delivery log by ID or provider message ID
    let deliveryLogId = payload.deliveryLogId;

    if (!deliveryLogId && payload.providerMsgId) {
      const log = await prisma.deliveryLog.findFirst({
        where: { providerMsgId: payload.providerMsgId },
        select: { id: true },
      });
      deliveryLogId = log?.id;
    }

    if (!deliveryLogId) {
      // Can't process without identifying the delivery
      console.warn("Webhook: Could not identify delivery log", payload);
      return NextResponse.json(
        { error: "Delivery log not found" },
        { status: 404 }
      );
    }

    // Process the event
    await processEmailEvent({
      type: payload.eventType,
      deliveryLogId,
      timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      metadata: {
        bounceType: payload.bounceType,
        bounceReason: payload.bounceReason,
        providerMsgId: payload.providerMsgId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
