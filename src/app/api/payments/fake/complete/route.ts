/**
 * Fake Payment Completion
 *
 * POST /api/payments/fake/complete - Simulate payment completion
 *
 * Charter P9: DISABLED in production unless PAYMENTS_FAKE_ENABLED=true
 */

import { NextRequest, NextResponse } from "next/server";
import { getFakePaymentProvider } from "@/lib/payments";

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

  const formData = await req.formData();
  const ref = formData.get("ref") as string;
  const action = formData.get("action") as string;
  const successUrl = formData.get("successUrl") as string;
  const cancelUrl = formData.get("cancelUrl") as string;

  if (!ref || !action) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  const provider = getFakePaymentProvider();

  if (!provider.isAvailable()) {
    return NextResponse.json(
      { error: "Fake provider not available" },
      { status: 503 }
    );
  }

  let result;

  switch (action) {
    case "success":
      result = await provider.simulatePaymentCompletion(ref, true);
      if (result.success) {
        return NextResponse.redirect(new URL(successUrl ?? "/member/registrations", req.url));
      }
      break;

    case "fail":
      result = await provider.simulatePaymentCompletion(ref, false);
      if (result.success || result.error) {
        // Redirect to cancel URL with error indication
        const errorUrl = new URL(cancelUrl ?? "/member/events", req.url);
        errorUrl.searchParams.set("payment", "failed");
        return NextResponse.redirect(errorUrl);
      }
      break;

    case "cancel":
      result = await provider.handleWebhook({
        type: "payment_intent.cancelled",
        providerRef: ref,
        timestamp: new Date(),
      });
      if (result.success || result.error) {
        const cancelledUrl = new URL(cancelUrl ?? "/member/events", req.url);
        cancelledUrl.searchParams.set("payment", "cancelled");
        return NextResponse.redirect(cancelledUrl);
      }
      break;

    default:
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
  }

  return NextResponse.json(
    { error: result?.error ?? "Unknown error" },
    { status: 500 }
  );
}
