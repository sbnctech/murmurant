/**
 * Stripe Payment Service Implementation
 * Full Stripe integration for payments and subscriptions
 */

import Stripe from "stripe";
import type { PaymentService } from "./PaymentService";
import type {
  PaymentIntent,
  PaymentResult,
  RefundResult,
  Subscription,
  Invoice,
  PaymentMethod,
  PaymentStatus,
} from "./types";

/**
 * Map Stripe payment intent status to our PaymentStatus type
 */
function mapStripePaymentStatus(
  status: Stripe.PaymentIntent.Status
): PaymentStatus {
  switch (status) {
    case "succeeded":
      return "succeeded";
    case "canceled":
      return "canceled";
    case "processing":
    case "requires_action":
    case "requires_capture":
    case "requires_confirmation":
    case "requires_payment_method":
      return "pending";
    default:
      return "failed";
  }
}

/**
 * Map Stripe subscription status to our Subscription status type
 */
function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status
): Subscription["status"] {
  switch (status) {
    case "active":
      return "active";
    case "canceled":
      return "canceled";
    case "past_due":
      return "past_due";
    case "trialing":
      return "trialing";
    case "paused":
      return "paused";
    default:
      return "canceled";
  }
}

/**
 * Map Stripe invoice status to our Invoice status type
 */
function mapStripeInvoiceStatus(
  status: Stripe.Invoice.Status | null
): Invoice["status"] {
  switch (status) {
    case "draft":
      return "draft";
    case "open":
      return "open";
    case "paid":
      return "paid";
    case "void":
      return "void";
    case "uncollectible":
      return "uncollectible";
    default:
      return "draft";
  }
}

export class StripePaymentService implements PaymentService {
  private stripe: Stripe;

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is required");
    }
    this.stripe = new Stripe(key, {
      apiVersion: "2024-12-18.acacia",
      typescript: true,
    });
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, string>
  ): Promise<PaymentIntent> {
    const intent = await this.stripe.paymentIntents.create({
      amount,
      currency: currency.toLowerCase(),
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      id: intent.id,
      amount: intent.amount,
      currency: intent.currency,
      status: mapStripePaymentStatus(intent.status),
      clientSecret: intent.client_secret ?? undefined,
      metadata: (intent.metadata as Record<string, string>) ?? undefined,
      createdAt: new Date(intent.created * 1000),
    };
  }

  async confirmPayment(intentId: string): Promise<PaymentResult> {
    try {
      const intent = await this.stripe.paymentIntents.retrieve(intentId);

      // If already succeeded, return success
      if (intent.status === "succeeded") {
        return {
          success: true,
          paymentId: intent.id,
          status: "succeeded",
        };
      }

      // If requires confirmation, confirm it
      if (intent.status === "requires_confirmation") {
        const confirmedIntent = await this.stripe.paymentIntents.confirm(
          intentId
        );
        return {
          success: confirmedIntent.status === "succeeded",
          paymentId: confirmedIntent.id,
          status: mapStripePaymentStatus(confirmedIntent.status),
        };
      }

      // Return current status
      return {
        success: intent.status === "succeeded",
        paymentId: intent.id,
        status: mapStripePaymentStatus(intent.status),
      };
    } catch (error) {
      const stripeError = error as Stripe.errors.StripeError;
      return {
        success: false,
        paymentId: intentId,
        status: "failed",
        errorMessage: stripeError.message,
        errorCode: stripeError.code,
      };
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<RefundResult> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentId,
        amount: amount,
      });

      return {
        success: refund.status === "succeeded" || refund.status === "pending",
        refundId: refund.id,
        amount: refund.amount,
        status:
          refund.status === "succeeded"
            ? "succeeded"
            : refund.status === "pending"
              ? "pending"
              : "failed",
      };
    } catch (error) {
      const stripeError = error as Stripe.errors.StripeError;
      return {
        success: false,
        refundId: "",
        amount: amount ?? 0,
        status: "failed",
        errorMessage: stripeError.message,
      };
    }
  }

  async createSubscription(
    customerId: string,
    priceId: string
  ): Promise<Subscription> {
    const subscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: {
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice.payment_intent"],
    });

    return {
      id: subscription.id,
      customerId: subscription.customer as string,
      priceId: subscription.items.data[0]?.price.id ?? priceId,
      status: mapStripeSubscriptionStatus(subscription.status),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    await this.stripe.subscriptions.cancel(subscriptionId);
  }

  async getPaymentHistory(customerId: string): Promise<Invoice[]> {
    const invoices = await this.stripe.invoices.list({
      customer: customerId,
      limit: 100,
    });

    return invoices.data.map((invoice) => ({
      id: invoice.id,
      customerId: invoice.customer as string,
      subscriptionId:
        typeof invoice.subscription === "string"
          ? invoice.subscription
          : invoice.subscription?.id,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: mapStripeInvoiceStatus(invoice.status),
      paidAt: invoice.status_transitions?.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000)
        : undefined,
      createdAt: new Date(invoice.created * 1000),
      description: invoice.description ?? undefined,
    }));
  }

  // Optional payment method management

  async listPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    const methods = await this.stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });

    const customer = await this.stripe.customers.retrieve(customerId);
    const defaultPaymentMethod =
      typeof customer !== "string" && !customer.deleted
        ? (customer.invoice_settings?.default_payment_method as string | null)
        : null;

    return methods.data.map((pm) => ({
      id: pm.id,
      type: "card" as const,
      last4: pm.card?.last4,
      brand: pm.card?.brand,
      expiryMonth: pm.card?.exp_month,
      expiryYear: pm.card?.exp_year,
      isDefault: pm.id === defaultPaymentMethod,
    }));
  }

  async addPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<PaymentMethod> {
    const pm = await this.stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    return {
      id: pm.id,
      type: "card" as const,
      last4: pm.card?.last4,
      brand: pm.card?.brand,
      expiryMonth: pm.card?.exp_month,
      expiryYear: pm.card?.exp_year,
      isDefault: false,
    };
  }

  async removePaymentMethod(paymentMethodId: string): Promise<void> {
    await this.stripe.paymentMethods.detach(paymentMethodId);
  }

  // Additional utility methods for Stripe-specific operations

  /**
   * Create or retrieve a Stripe customer
   */
  async getOrCreateCustomer(
    email: string,
    name?: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    // Check if customer already exists
    const existing = await this.stripe.customers.list({
      email,
      limit: 1,
    });

    if (existing.data.length > 0) {
      return existing.data[0].id;
    }

    // Create new customer
    const customer = await this.stripe.customers.create({
      email,
      name,
      metadata,
    });

    return customer.id;
  }

  /**
   * Create a checkout session for hosted payments
   */
  async createCheckoutSession(options: {
    customerId?: string;
    priceId?: string;
    amount?: number;
    currency?: string;
    mode: "payment" | "subscription";
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }): Promise<{ sessionId: string; url: string }> {
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    if (options.priceId) {
      lineItems.push({
        price: options.priceId,
        quantity: 1,
      });
    } else if (options.amount) {
      lineItems.push({
        price_data: {
          currency: options.currency ?? "usd",
          product_data: {
            name: "Payment",
          },
          unit_amount: options.amount,
        },
        quantity: 1,
      });
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: options.customerId,
      line_items: lineItems,
      mode: options.mode,
      success_url: options.successUrl,
      cancel_url: options.cancelUrl,
      metadata: options.metadata,
    });

    return {
      sessionId: session.id,
      url: session.url ?? "",
    };
  }

  /**
   * Construct and verify webhook event
   */
  constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
    webhookSecret: string
  ): Stripe.Event {
    return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }
}

// Singleton instance
let stripeInstance: StripePaymentService | null = null;

export function getStripePaymentService(): StripePaymentService {
  if (!stripeInstance) {
    stripeInstance = new StripePaymentService();
  }
  return stripeInstance;
}

export function resetStripePaymentService(): void {
  stripeInstance = null;
}
