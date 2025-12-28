/**
 * Stripe Webhook Handlers
 * Process Stripe webhook events for payment and subscription updates
 *
 * NOTE: Audit logging for payment events will be added when the AuditAction
 * enum is extended to include payment-related actions.
 */

import type Stripe from "stripe";

/**
 * Webhook event handler result
 */
export interface WebhookResult {
  success: boolean;
  message: string;
  processed?: boolean;
}

/**
 * Extract subscription ID from invoice (handles both old and new API structures)
 */
function getSubscriptionId(
  invoice: Stripe.Invoice
): string | undefined {
  // Try subscription_details first (new API), fall back to subscription (old API)
  const invoiceAny = invoice as Stripe.Invoice & {
    subscription_details?: { subscription?: string | { id: string } };
    subscription?: string | { id: string };
  };

  const subFromDetails = invoiceAny.subscription_details?.subscription;
  const subDirect = invoiceAny.subscription;
  const sub = subFromDetails ?? subDirect;

  if (!sub) return undefined;
  return typeof sub === "string" ? sub : sub.id;
}

/**
 * Handle payment_intent.succeeded event
 * Called when a payment is successfully completed
 */
export async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
): Promise<WebhookResult> {
  const { id, amount, currency, metadata } = paymentIntent;

  console.log(`[Stripe Webhook] Payment succeeded: ${id}`);
  console.log(`  Amount: ${amount} ${currency.toUpperCase()}`);
  console.log(`  Metadata: ${JSON.stringify(metadata)}`);

  try {
    if (metadata?.memberId) {
      console.log(`  Member payment processed: ${metadata.memberId}`);
      // TODO: Update member payment status in database
    }

    if (metadata?.registrationId) {
      console.log(`  Registration payment processed: ${metadata.registrationId}`);
      // TODO: Update registration payment status in database
    }

    return {
      success: true,
      message: `Payment ${id} processed successfully`,
      processed: true,
    };
  } catch (error) {
    console.error(`[Stripe Webhook] Error processing payment ${id}:`, error);
    return {
      success: false,
      message: `Failed to process payment: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Handle payment_intent.payment_failed event
 * Called when a payment fails
 */
export async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent
): Promise<WebhookResult> {
  const { id, metadata, last_payment_error } = paymentIntent;

  console.log(`[Stripe Webhook] Payment failed: ${id}`);
  console.log(`  Error: ${last_payment_error?.message ?? "Unknown error"}`);
  console.log(`  Error code: ${last_payment_error?.code ?? "unknown"}`);
  console.log(`  Metadata: ${JSON.stringify(metadata)}`);

  try {
    // TODO: Send notification to member about failed payment

    return {
      success: true,
      message: `Payment failure ${id} logged`,
      processed: true,
    };
  } catch (error) {
    console.error(`[Stripe Webhook] Error logging payment failure ${id}:`, error);
    return {
      success: false,
      message: `Failed to log payment failure: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Handle invoice.paid event
 * Called when an invoice is paid (subscription renewals, etc.)
 */
export async function handleInvoicePaid(
  invoice: Stripe.Invoice
): Promise<WebhookResult> {
  const { id, customer, amount_paid, currency } = invoice;
  const subscriptionId = getSubscriptionId(invoice);

  console.log(`[Stripe Webhook] Invoice paid: ${id}`);
  console.log(`  Customer: ${customer}`);
  console.log(`  Subscription: ${subscriptionId ?? "none"}`);
  console.log(`  Amount: ${amount_paid} ${currency?.toUpperCase()}`);

  try {
    if (subscriptionId) {
      console.log(`  Subscription renewal processed`);
      // TODO: Look up member by Stripe customer ID and extend membership
    }

    return {
      success: true,
      message: `Invoice ${id} processed`,
      processed: true,
    };
  } catch (error) {
    console.error(`[Stripe Webhook] Error processing invoice ${id}:`, error);
    return {
      success: false,
      message: `Failed to process invoice: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Handle invoice.payment_failed event
 * Called when an invoice payment fails
 */
export async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice
): Promise<WebhookResult> {
  const { id, customer, attempt_count } = invoice;
  const subscriptionId = getSubscriptionId(invoice);

  console.log(`[Stripe Webhook] Invoice payment failed: ${id}`);
  console.log(`  Customer: ${customer}`);
  console.log(`  Subscription: ${subscriptionId ?? "none"}`);
  console.log(`  Attempt: ${attempt_count}`);

  try {
    // TODO: Send payment failure notification to member

    return {
      success: true,
      message: `Invoice payment failure ${id} logged`,
      processed: true,
    };
  } catch (error) {
    console.error(`[Stripe Webhook] Error logging invoice failure ${id}:`, error);
    return {
      success: false,
      message: `Failed to log invoice failure: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Handle customer.subscription.deleted event
 * Called when a subscription is canceled
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<WebhookResult> {
  const { id, customer, status } = subscription;

  console.log(`[Stripe Webhook] Subscription deleted: ${id}`);
  console.log(`  Customer: ${customer}`);
  console.log(`  Status: ${status}`);

  try {
    // TODO: Update member status based on subscription cancellation

    return {
      success: true,
      message: `Subscription ${id} deletion processed`,
      processed: true,
    };
  } catch (error) {
    console.error(`[Stripe Webhook] Error processing subscription deletion ${id}:`, error);
    return {
      success: false,
      message: `Failed to process subscription deletion: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Handle customer.subscription.updated event
 * Called when a subscription is updated (status changes, etc.)
 */
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<WebhookResult> {
  const { id, customer, status, cancel_at_period_end } = subscription;

  console.log(`[Stripe Webhook] Subscription updated: ${id}`);
  console.log(`  Customer: ${customer}`);
  console.log(`  Status: ${status}`);
  console.log(`  Cancel at period end: ${cancel_at_period_end}`);

  try {
    if (status === "past_due") {
      console.log(`  Subscription is past due`);
      // TODO: Send payment past due notification
    } else if (status === "canceled") {
      console.log(`  Subscription canceled`);
      // TODO: Update member status
    }

    return {
      success: true,
      message: `Subscription ${id} update processed`,
      processed: true,
    };
  } catch (error) {
    console.error(`[Stripe Webhook] Error processing subscription update ${id}:`, error);
    return {
      success: false,
      message: `Failed to process subscription update: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Main webhook event router
 * Routes incoming webhook events to the appropriate handler
 */
export async function handleStripeWebhook(
  event: Stripe.Event
): Promise<WebhookResult> {
  console.log(`[Stripe Webhook] Received event: ${event.type}`);

  switch (event.type) {
    case "payment_intent.succeeded":
      return handlePaymentIntentSucceeded(
        event.data.object as Stripe.PaymentIntent
      );

    case "payment_intent.payment_failed":
      return handlePaymentIntentFailed(
        event.data.object as Stripe.PaymentIntent
      );

    case "invoice.paid":
      return handleInvoicePaid(event.data.object as Stripe.Invoice);

    case "invoice.payment_failed":
      return handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);

    case "customer.subscription.deleted":
      return handleSubscriptionDeleted(
        event.data.object as Stripe.Subscription
      );

    case "customer.subscription.updated":
      return handleSubscriptionUpdated(
        event.data.object as Stripe.Subscription
      );

    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      return {
        success: true,
        message: `Event type ${event.type} not handled`,
        processed: false,
      };
  }
}
