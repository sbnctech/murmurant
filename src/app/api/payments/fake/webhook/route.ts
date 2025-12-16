/**
 * Fake Payment Webhook
 *
 * POST /api/payments/fake/webhook - Receive simulated webhook events
 *
 * Charter P9: DISABLED in production unless PAYMENTS_FAKE_ENABLED=true
 * Charter N5: Idempotent (duplicate webhooks are ignored)
 */

import { NextRequest, NextResponse } from "next/server";
import { getFakePaymentProvider } from "@/lib/payments";
import { PaymentWebhookEvent } from "@/lib/payments/types";

/**
 * Check if fake provider is enabled
 * Charter P9: Disabled in production unless explicitly enabled
 */
function isFakeProviderEnabled(): boolean {
  const isProduction = process.env.NODE_ENV === "production";
  const explicitlyEnabled = process.env.PAYMENTS_FAKE_ENABLED === "true";

  // In production, only available if explicitly enabled
  if (isProduction && !explicitlyEnabled) {
    return false;
  }
  return true;
}

export async function POST(req: NextRequest) {
  // Charter P9: Disabled in production unless PAYMENTS_FAKE_ENABLED=true
  // Return 404 (not 403) to reduce discovery
  if (!isFakeProviderEnabled()) {
    return new NextResponse(null, { status: 404 });
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

    // Return 409 for duplicate webhooks (replay protection)
    if (result.isDuplicate) {
      return NextResponse.json(
        {
          success: true,
          intentId: result.intentId,
          isDuplicate: true,
          message: "Webhook already processed",
        },
        { status: 409 }
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
