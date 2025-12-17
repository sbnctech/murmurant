/**
 * Payment Provider Types
 *
 * Charter Principles:
 * - P3: Explicit state machine for payment lifecycle
 * - N5: Idempotency for all payment operations
 * - P9: Fail closed on payment errors
 */

import { PaymentIntentStatus } from "@prisma/client";

/**
 * Result of creating a payment intent
 */
export interface CreatePaymentIntentResult {
  /** The internal payment intent ID */
  intentId: string;
  /** The external provider reference (e.g., Stripe PI ID) */
  providerRef: string;
  /** Current status of the payment intent */
  status: PaymentIntentStatus;
  /** URL to redirect user to for checkout (if using hosted checkout) */
  checkoutUrl?: string;
  /** Whether this was a duplicate request (idempotency key matched) */
  isDuplicate: boolean;
}

/**
 * Result of checking payment intent status
 */
export interface PaymentIntentStatusResult {
  /** The internal payment intent ID */
  intentId: string;
  /** Current status */
  status: PaymentIntentStatus;
  /** Failure reason if status is FAILED */
  failureReason?: string;
  /** Amount in cents */
  amountCents: number;
  /** Currency code */
  currency: string;
}

/**
 * Webhook event from payment provider
 */
export interface PaymentWebhookEvent {
  /** Type of event */
  type: "payment_intent.succeeded" | "payment_intent.failed" | "payment_intent.cancelled" | "refund.completed";
  /** Provider reference for the payment intent */
  providerRef: string;
  /** Timestamp of the event */
  timestamp: Date;
  /** Failure reason if applicable */
  failureReason?: string;
  /** Additional metadata from provider */
  metadata?: Record<string, unknown>;
}

/**
 * Result of processing a webhook
 */
export interface WebhookProcessResult {
  /** Whether the webhook was processed successfully */
  success: boolean;
  /** The internal payment intent ID if found */
  intentId?: string;
  /** Whether this was a duplicate webhook (already processed) */
  isDuplicate: boolean;
  /** New status after processing */
  newStatus?: PaymentIntentStatus;
  /** Error message if processing failed */
  error?: string;
}

/**
 * Options for creating a payment intent
 */
export interface CreatePaymentIntentOptions {
  /** The registration ID this payment is for */
  registrationId: string;
  /** Amount in cents */
  amountCents: number;
  /** Client-provided idempotency key */
  idempotencyKey: string;
  /** Currency code */
  currency?: string;
  /** Description for the payment */
  description?: string;
  /** Success redirect URL */
  successUrl?: string;
  /** Cancel redirect URL */
  cancelUrl?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Payment Provider Interface
 *
 * All payment providers must implement this interface.
 * The interface supports redirect-based checkout flows.
 */
export interface PaymentProvider {
  /** Provider name (e.g., "fake", "stripe") */
  readonly name: string;

  /**
   * Create a payment intent
   *
   * This should be idempotent - calling with the same idempotencyKey
   * must return the existing intent without creating a duplicate.
   *
   * Charter N5: Must be idempotent
   * Charter P9: Must fail closed on errors
   */
  createPaymentIntent(
    options: CreatePaymentIntentOptions
  ): Promise<CreatePaymentIntentResult>;

  /**
   * Get the current status of a payment intent
   */
  getPaymentIntentStatus(intentId: string): Promise<PaymentIntentStatusResult | null>;

  /**
   * Process a webhook from the payment provider
   *
   * This should be idempotent - processing the same webhook twice
   * must not result in duplicate state changes.
   *
   * Charter N5: Must be idempotent
   */
  handleWebhook(
    payload: unknown,
    signature?: string
  ): Promise<WebhookProcessResult>;

  /**
   * Check if this provider is available in the current environment
   *
   * Charter P9: Fake provider must be disabled in production
   */
  isAvailable(): boolean;
}
