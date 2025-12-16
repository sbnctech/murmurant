/**
 * Fake Payment Provider
 *
 * A simulated payment provider for development and staging environments.
 * Supports redirect checkout simulation, webhook generation, and idempotency testing.
 *
 * Charter Principles:
 * - P9: DISABLED in production (fail closed)
 * - N5: Fully idempotent
 * - P3: Explicit state machine transitions
 */

import { prisma } from "@/lib/prisma";
import { PaymentIntentStatus } from "@prisma/client";
import {
  PaymentProvider,
  CreatePaymentIntentOptions,
  CreatePaymentIntentResult,
  PaymentIntentStatusResult,
  WebhookProcessResult,
  PaymentWebhookEvent,
} from "./types";

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

/**
 * Generate a fake provider reference ID
 */
function generateProviderRef(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `fake_pi_${timestamp}_${random}`;
}

export class FakePaymentProvider implements PaymentProvider {
  readonly name = "fake";

  /**
   * Check if fake provider is available
   * Charter P9: Fake provider is DISABLED in production unless PAYMENTS_FAKE_ENABLED=true
   */
  isAvailable(): boolean {
    if (!isFakeProviderEnabled()) {
      console.warn("[FakePaymentProvider] Fake provider is disabled in production");
      return false;
    }
    return true;
  }

  /**
   * Create a payment intent with idempotency
   *
   * If the idempotencyKey already exists, returns the existing intent
   * without creating a duplicate.
   */
  async createPaymentIntent(
    options: CreatePaymentIntentOptions
  ): Promise<CreatePaymentIntentResult> {
    // Charter P9: Fail closed in production
    if (!this.isAvailable()) {
      throw new Error("Fake payment provider is not available in production");
    }

    const {
      registrationId,
      amountCents,
      idempotencyKey,
      currency = "USD",
      description,
      successUrl,
      cancelUrl,
      metadata,
    } = options;

    // Check for existing intent with this idempotency key
    const existingIntent = await prisma.paymentIntent.findUnique({
      where: { idempotencyKey },
    });

    if (existingIntent) {
      // Return existing intent - idempotent behavior
      return {
        intentId: existingIntent.id,
        providerRef: existingIntent.providerRef ?? "",
        status: existingIntent.status,
        checkoutUrl: existingIntent.checkoutUrl ?? undefined,
        isDuplicate: true,
      };
    }

    // Create new payment intent
    const providerRef = generateProviderRef();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const checkoutUrl = `${baseUrl}/api/payments/fake/checkout?ref=${providerRef}`;

    const intent = await prisma.paymentIntent.create({
      data: {
        registrationId,
        idempotencyKey,
        providerRef,
        provider: "fake",
        status: PaymentIntentStatus.CREATED,
        amountCents,
        currency,
        description,
        checkoutUrl,
        metadata: {
          successUrl,
          cancelUrl,
          ...metadata,
        } as object,
      },
    });

    // Update registration status to PENDING_PAYMENT
    await prisma.eventRegistration.update({
      where: { id: registrationId },
      data: { status: "PENDING_PAYMENT" },
    });

    return {
      intentId: intent.id,
      providerRef,
      status: intent.status,
      checkoutUrl,
      isDuplicate: false,
    };
  }

  /**
   * Get current status of a payment intent
   */
  async getPaymentIntentStatus(
    intentId: string
  ): Promise<PaymentIntentStatusResult | null> {
    const intent = await prisma.paymentIntent.findUnique({
      where: { id: intentId },
    });

    if (!intent) {
      return null;
    }

    return {
      intentId: intent.id,
      status: intent.status,
      failureReason: intent.failureReason ?? undefined,
      amountCents: intent.amountCents,
      currency: intent.currency,
    };
  }

  /**
   * Handle webhook from fake provider
   *
   * Idempotent: Processing the same webhook twice will not
   * result in duplicate state changes.
   */
  async handleWebhook(
    payload: unknown,
    _signature?: string
  ): Promise<WebhookProcessResult> {
    // Charter P9: Fail closed in production
    if (!this.isAvailable()) {
      return {
        success: false,
        isDuplicate: false,
        error: "Fake payment provider is not available in production",
      };
    }

    const event = payload as PaymentWebhookEvent;

    // Find the payment intent by provider reference
    const intent = await prisma.paymentIntent.findFirst({
      where: { providerRef: event.providerRef },
      include: { registration: true },
    });

    if (!intent) {
      return {
        success: false,
        isDuplicate: false,
        error: `Payment intent not found for provider ref: ${event.providerRef}`,
      };
    }

    // Check if webhook was already processed (idempotency)
    if (intent.webhookReceivedAt) {
      return {
        success: true,
        intentId: intent.id,
        isDuplicate: true,
        newStatus: intent.status,
      };
    }

    let newStatus: PaymentIntentStatus;
    let registrationStatus: "CONFIRMED" | "DRAFT" | "CANCELLED";

    switch (event.type) {
      case "payment_intent.succeeded":
        newStatus = PaymentIntentStatus.SUCCEEDED;
        registrationStatus = "CONFIRMED";
        break;
      case "payment_intent.failed":
        newStatus = PaymentIntentStatus.FAILED;
        registrationStatus = "DRAFT"; // Allow retry
        break;
      case "payment_intent.cancelled":
        newStatus = PaymentIntentStatus.CANCELLED;
        registrationStatus = "CANCELLED";
        break;
      case "refund.completed":
        newStatus = PaymentIntentStatus.REFUNDED;
        registrationStatus = "CANCELLED";
        break;
      default:
        return {
          success: false,
          isDuplicate: false,
          error: `Unknown event type: ${event.type}`,
        };
    }

    // Update payment intent and registration in a transaction
    await prisma.$transaction([
      prisma.paymentIntent.update({
        where: { id: intent.id },
        data: {
          status: newStatus,
          webhookReceivedAt: new Date(),
          failureReason: event.failureReason,
        },
      }),
      prisma.eventRegistration.update({
        where: { id: intent.registrationId },
        data: {
          status: registrationStatus,
          confirmedAt:
            registrationStatus === "CONFIRMED" ? new Date() : undefined,
        },
      }),
    ]);

    return {
      success: true,
      intentId: intent.id,
      isDuplicate: false,
      newStatus,
    };
  }

  /**
   * Simulate completing a payment (for testing)
   * This generates a webhook event as if the user completed checkout
   */
  async simulatePaymentCompletion(
    providerRef: string,
    success: boolean = true
  ): Promise<WebhookProcessResult> {
    const event: PaymentWebhookEvent = {
      type: success ? "payment_intent.succeeded" : "payment_intent.failed",
      providerRef,
      timestamp: new Date(),
      failureReason: success ? undefined : "Simulated failure",
    };

    return this.handleWebhook(event);
  }

  /**
   * Simulate a delayed webhook (for testing race conditions)
   */
  async simulateDelayedWebhook(
    providerRef: string,
    delayMs: number
  ): Promise<WebhookProcessResult> {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return this.simulatePaymentCompletion(providerRef, true);
  }
}

// Singleton instance
let fakeProviderInstance: FakePaymentProvider | null = null;

export function getFakePaymentProvider(): FakePaymentProvider {
  if (!fakeProviderInstance) {
    fakeProviderInstance = new FakePaymentProvider();
  }
  return fakeProviderInstance;
}
