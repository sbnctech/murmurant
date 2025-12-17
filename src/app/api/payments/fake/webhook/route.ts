/**
 * Fake Payment Webhook
 *
 * POST /api/payments/fake/webhook - Receive simulated webhook events
 *
 * Charter P9: DISABLED in production
 * Charter N5: Idempotent (duplicate webhooks are ignored)
 */

import { NextRequest, NextResponse } from "next/server";
import { getFakePaymentProvider } from "@/lib/payments";
import { PaymentWebhookEvent } from "@/lib/payments/types";

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export async function POST(req: NextRequest) {
  // Charter P9: Disabled in production
  if (isProduction()) {
    return NextResponse.json(
      { error: "Fake webhook is disabled in production" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();

    // Validate webhook payload
    if (!body.type || !body.providerRef) {
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    const event: PaymentWebhookEvent = {
      type: body.type,
      providerRef: body.providerRef,
      timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
      failureReason: body.failureReason,
      metadata: body.metadata,
    };

    const provider = getFakePaymentProvider();

    if (!provider.isAvailable()) {
      return NextResponse.json(
        { error: "Fake provider not available" },
        { status: 503 }
      );
    }

    const result = await provider.handleWebhook(event);

    if (!result.success) {
      console.error("[FakeWebhook] Failed to process:", result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      intentId: result.intentId,
      isDuplicate: result.isDuplicate,
      newStatus: result.newStatus,
    });
  } catch (error) {
    console.error("[FakeWebhook] Error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
