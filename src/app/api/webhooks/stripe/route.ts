/**
 * Stripe Webhooks API
 *
 * POST /api/webhooks/stripe - Handle Stripe webhook events
 *
 * Handles both:
 * - Payment intents (for event registrations)
 * - Checkout sessions (for store orders)
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

// Stripe event types we handle
type StripeEventType =
  | "payment_intent.succeeded"
  | "payment_intent.payment_failed"
  | "checkout.session.completed"
  | "checkout.session.expired"
  | "customer.subscription.created"
  | "customer.subscription.updated"
  | "customer.subscription.deleted"
  | "invoice.paid"
  | "invoice.payment_failed";

interface StripeEvent {
  id: string;
  type: StripeEventType;
  data: {
    object: Record<string, unknown>;
  };
}

/**
 * Verify Stripe webhook signature
 * In production, use Stripe SDK: stripe.webhooks.constructEvent()
 */
function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret) {
    console.warn("Missing webhook signature or secret");
    return false;
  }

  // TODO: Implement proper signature verification using Stripe SDK
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  return signature.includes("whsec_") || secret.length > 0;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

    if (!verifyWebhookSignature(body, signature, webhookSecret)) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event: StripeEvent = JSON.parse(body);

    console.log(`Processing Stripe webhook: ${event.type}`, {
      eventId: event.id,
    });

    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data.object);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;

      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case "checkout.session.expired":
        await handleCheckoutSessionExpired(event.data.object);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdate(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionCancelled(event.data.object);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handlePaymentSucceeded(
  paymentIntent: Record<string, unknown>
): Promise<void> {
  console.log("Payment succeeded:", paymentIntent.id);
}

async function handlePaymentFailed(
  paymentIntent: Record<string, unknown>
): Promise<void> {
  console.log("Payment failed:", paymentIntent.id);
}

/**
 * Handle Stripe Checkout session completion (used for store orders)
 */
async function handleCheckoutSessionCompleted(
  session: Record<string, unknown>
): Promise<void> {
  const sessionId = session.id as string;
  const metadata = session.metadata as Record<string, string> | undefined;

  console.log("Checkout session completed:", sessionId);

  if (!metadata?.orderId) {
    console.log("No orderId in metadata - not a store order");
    return;
  }

  const orderId = metadata.orderId;

  try {
    // Update order status to PAID
    const order = await prisma.storeOrder.update({
      where: { id: orderId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        stripePaymentIntentId: session.payment_intent as string | undefined,
      },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    console.log(`[STORE] Order ${order.orderNumber} marked as PAID`);

    // Decrement inventory for physical products
    for (const item of order.items) {
      if (item.product.type !== "DIGITAL" && item.product.trackInventory) {
        if (item.variantId) {
          // Decrement variant stock
          await prisma.productVariant.update({
            where: { id: item.variantId },
            data: {
              quantity: { decrement: item.quantity },
            },
          });
        } else {
          // Decrement product stock
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              quantity: { decrement: item.quantity },
            },
          });
        }
      }

      // Create digital delivery records for digital products
      if (item.product.type === "DIGITAL") {
        await prisma.digitalDelivery.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            maxDownloads: item.product.downloadLimit || null,
            // No expiration for now - can be added later if needed
          },
        });
      }
    }

    console.log(`[STORE] Inventory updated for order ${order.orderNumber}`);

    // TODO: Send order confirmation email
  } catch (error) {
    console.error(`[STORE] Failed to process order ${orderId}:`, error);
    throw error;
  }
}

/**
 * Handle Stripe Checkout session expiration
 */
async function handleCheckoutSessionExpired(
  session: Record<string, unknown>
): Promise<void> {
  const sessionId = session.id as string;
  const metadata = session.metadata as Record<string, string> | undefined;

  console.log("Checkout session expired:", sessionId);

  if (!metadata?.orderId) {
    return;
  }

  // Revert order back to CART status so user can try again
  try {
    await prisma.storeOrder.update({
      where: { id: metadata.orderId },
      data: {
        status: "CART",
        idempotencyKey: null, // Clear so they can start fresh checkout
      },
    });

    console.log(`[STORE] Order ${metadata.orderId} reverted to CART after session expiry`);
  } catch (error) {
    console.error(`[STORE] Failed to revert order ${metadata.orderId}:`, error);
  }
}

async function handleSubscriptionUpdate(
  subscription: Record<string, unknown>
): Promise<void> {
  console.log("Subscription updated:", subscription.id);
}

async function handleSubscriptionCancelled(
  subscription: Record<string, unknown>
): Promise<void> {
  console.log("Subscription cancelled:", subscription.id);
}

async function handleInvoicePaid(
  invoice: Record<string, unknown>
): Promise<void> {
  console.log("Invoice paid:", invoice.id);
}

async function handleInvoicePaymentFailed(
  invoice: Record<string, unknown>
): Promise<void> {
  console.log("Invoice payment failed:", invoice.id);
}
