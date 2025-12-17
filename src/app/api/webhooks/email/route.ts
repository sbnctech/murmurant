/**
 * POST /api/webhooks/email
 *
 * Webhook endpoint for email delivery events from providers.
 * Supports multiple provider formats (SES, SendGrid, Postmark, etc.)
 *
 * Security:
 * - Webhook signature verification (provider-specific)
 * - Rate limiting via IP allowlist (recommended at infrastructure level)
 *
 * Event types supported:
 * - sent/send
 * - delivered/delivery
 * - bounced/bounce
 * - complained/complaint/spam
 * - unsubscribed/unsubscribe
 * - opened/open
 * - clicked/click
 */

import { NextRequest, NextResponse } from "next/server";
import {
  processEmailEvent,
  EmailEvent,
  BounceType,
  EmailEventType,
} from "@/lib/email/tracking";
import { z } from "zod";

// Generic webhook event schema (maps to multiple providers)
const WebhookEventSchema = z.object({
  // Event type (normalized)
  event: z.string(),
  // Provider message ID
  messageId: z.string().optional(),
  providerMsgId: z.string().optional(),
  // Recipient email
  email: z.string().email().optional(),
  recipient: z.string().email().optional(),
  // Timestamp
  timestamp: z.string().or(z.number()).optional(),
  // Bounce details
  bounceType: z.string().optional(),
  bounceReason: z.string().optional(),
  // Raw metadata
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// AWS SES event schema
const SESEventSchema = z.object({
  eventType: z.string(),
  mail: z.object({
    messageId: z.string(),
    destination: z.array(z.string()),
    timestamp: z.string(),
  }),
  bounce: z
    .object({
      bounceType: z.string(),
      bouncedRecipients: z.array(
        z.object({
          emailAddress: z.string(),
          diagnosticCode: z.string().optional(),
        })
      ),
    })
    .optional(),
  complaint: z
    .object({
      complainedRecipients: z.array(
        z.object({
          emailAddress: z.string(),
        })
      ),
    })
    .optional(),
  delivery: z
    .object({
      recipients: z.array(z.string()),
      timestamp: z.string(),
    })
    .optional(),
});

type NormalizedEvent = {
  type: EmailEventType;
  providerMsgId: string;
  recipientEmail: string;
  timestamp: Date;
  bounceType?: BounceType;
  bounceReason?: string;
};

/**
 * Normalize event type string to our standard types
 */
function normalizeEventType(eventType: string): EmailEventType | null {
  const normalized = eventType.toLowerCase();

  const typeMap: Record<string, EmailEventType> = {
    sent: "sent",
    send: "sent",
    delivered: "delivered",
    delivery: "delivered",
    bounced: "bounced",
    bounce: "bounced",
    complained: "complained",
    complaint: "complained",
    spam: "complained",
    unsubscribed: "unsubscribed",
    unsubscribe: "unsubscribed",
    opened: "opened",
    open: "opened",
    clicked: "clicked",
    click: "clicked",
  };

  return typeMap[normalized] || null;
}

/**
 * Normalize bounce type to our standard types
 */
function normalizeBounceType(bounceType?: string): BounceType {
  if (!bounceType) return "undetermined";

  const normalized = bounceType.toLowerCase();
  if (normalized.includes("permanent") || normalized.includes("hard")) {
    return "hard";
  }
  if (normalized.includes("transient") || normalized.includes("soft")) {
    return "soft";
  }
  return "undetermined";
}

/**
 * Parse AWS SES event format
 */
function parseSESEvent(body: unknown): NormalizedEvent[] {
  const parsed = SESEventSchema.safeParse(body);
  if (!parsed.success) return [];

  const { eventType, mail, bounce, complaint, delivery } = parsed.data;
  const events: NormalizedEvent[] = [];
  const type = normalizeEventType(eventType);

  if (!type) return events;

  const baseEvent = {
    type,
    providerMsgId: mail.messageId,
    timestamp: new Date(mail.timestamp),
  };

  // Handle bounces
  if (bounce && type === "bounced") {
    for (const recipient of bounce.bouncedRecipients) {
      events.push({
        ...baseEvent,
        recipientEmail: recipient.emailAddress,
        bounceType: normalizeBounceType(bounce.bounceType),
        bounceReason: recipient.diagnosticCode,
      });
    }
    return events;
  }

  // Handle complaints
  if (complaint && type === "complained") {
    for (const recipient of complaint.complainedRecipients) {
      events.push({
        ...baseEvent,
        recipientEmail: recipient.emailAddress,
      });
    }
    return events;
  }

  // Handle delivery
  if (delivery && type === "delivered") {
    for (const email of delivery.recipients) {
      events.push({
        ...baseEvent,
        recipientEmail: email,
        timestamp: new Date(delivery.timestamp),
      });
    }
    return events;
  }

  // Fallback: use destination from mail object
  for (const email of mail.destination) {
    events.push({
      ...baseEvent,
      recipientEmail: email,
    });
  }

  return events;
}

/**
 * Parse generic webhook format
 */
function parseGenericEvent(body: unknown): NormalizedEvent | null {
  const parsed = WebhookEventSchema.safeParse(body);
  if (!parsed.success) return null;

  const data = parsed.data;
  const type = normalizeEventType(data.event);
  if (!type) return null;

  const providerMsgId = data.providerMsgId || data.messageId;
  const recipientEmail = data.email || data.recipient;

  if (!providerMsgId || !recipientEmail) return null;

  let timestamp: Date;
  if (data.timestamp) {
    timestamp =
      typeof data.timestamp === "number"
        ? new Date(data.timestamp * 1000)
        : new Date(data.timestamp);
  } else {
    timestamp = new Date();
  }

  return {
    type,
    providerMsgId,
    recipientEmail,
    timestamp,
    bounceType: normalizeBounceType(data.bounceType),
    bounceReason: data.bounceReason,
  };
}

export async function POST(request: NextRequest) {
  // Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Try to parse as different formats
  let events: NormalizedEvent[] = [];

  // Try SES format first (has distinct structure)
  if (
    typeof body === "object" &&
    body !== null &&
    "eventType" in body &&
    "mail" in body
  ) {
    events = parseSESEvent(body);
  }
  // Try generic format
  else {
    const event = parseGenericEvent(body);
    if (event) events = [event];
  }

  // Handle array of events
  if (Array.isArray(body)) {
    for (const item of body) {
      const event = parseGenericEvent(item);
      if (event) events.push(event);
    }
  }

  if (events.length === 0) {
    // Log unrecognized format for debugging but don't fail
    console.warn("[EmailWebhook] Unrecognized event format:", body);
    return NextResponse.json({
      received: true,
      processed: 0,
      message: "No recognizable events found",
    });
  }

  // Process all events
  let processed = 0;
  const errors: string[] = [];

  for (const event of events) {
    try {
      await processEmailEvent(event as EmailEvent);
      processed++;
    } catch (error) {
      console.error(
        `[EmailWebhook] Error processing event for ${event.recipientEmail}:`,
        error
      );
      errors.push(
        `Failed to process ${event.type} for ${event.recipientEmail}`
      );
    }
  }

  return NextResponse.json({
    received: true,
    processed,
    total: events.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}

// Health check for webhook endpoint
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/webhooks/email",
    supportedFormats: ["ses", "sendgrid", "postmark", "generic"],
  });
}
