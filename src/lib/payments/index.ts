/**
 * Payment Module
 *
 * Provides payment provider abstraction for ClubOS.
 *
 * Charter Principles:
 * - P9: Fake provider disabled in production
 * - N5: All operations are idempotent
 * - P3: Explicit state machine for payment lifecycle
 */

export * from "./types";
export * from "./fake-provider";

import { PaymentProvider } from "./types";
import { FakePaymentProvider } from "./fake-provider";

function getFakePaymentProvider() {
  return new FakePaymentProvider();
}
/**
 * Get the configured payment provider.
 *
 * In production, this will return the real payment provider (Stripe, etc.)
 * In development/staging, this returns the FakePaymentProvider.
 *
 * Charter P9: Never use fake provider in production
 */
export function getPaymentProvider(): PaymentProvider {
  const providerName = process.env.PAYMENT_PROVIDER ?? "fake";

  switch (providerName) {
    case "fake":
      return getFakePaymentProvider();
    // Future: case "stripe": return getStripeProvider();
    default:
      throw new Error(`Unknown payment provider: ${providerName}`);
  }
}

/**
 * Check if the current payment provider is available
 */
export function isPaymentProviderAvailable(): boolean {
  try {
    const provider = getPaymentProvider();
    return provider.isAvailable();
  } catch {
    return false;
  }
}
