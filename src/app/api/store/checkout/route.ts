/**
 * Store Checkout API
 *
 * POST /api/store/checkout - Create Stripe checkout session
 *
 * Authorization: None (public API, session-based)
 *
 * Charter Compliance:
 * - N5: Idempotency via checkout session ID stored on order
 * - P7: Audit logging for checkout attempts
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionId } from "@/lib/store/cart";
import Stripe from "stripe";

// ============================================================================
// POST /api/store/checkout - Create Checkout Session
// ============================================================================

interface CheckoutBody {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  fulfillmentType: "SHIPPING" | "PICKUP" | "DIGITAL_DELIVERY";
  shippingAddress?: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
    phone?: string;
  };
  pickupLocation?: string;
}

export async function POST(req: NextRequest) {
  let body: CheckoutBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate required fields
  if (!body.email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  if (!body.fulfillmentType) {
    return NextResponse.json({ error: "Fulfillment type is required" }, { status: 400 });
  }

  // Get session ID
  const sessionId = await getSessionId();
  if (!sessionId) {
    return NextResponse.json({ error: "No cart session found" }, { status: 400 });
  }

  try {
    // Get cart with items
    const order = await prisma.storeOrder.findFirst({
      where: {
        sessionId,
        status: "CART",
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                slug: true,
                imageUrl: true,
                type: true,
                trackInventory: true,
                quantity: true,
              },
            },
            variant: {
              select: {
                name: true,
                quantity: true,
              },
            },
          },
        },
      },
    });

    if (!order || order.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Validate inventory before checkout
    for (const item of order.items) {
      if (item.product.type !== "DIGITAL" && item.product.trackInventory) {
        const availableStock = item.variant?.quantity ?? item.product.quantity;
        if (item.quantity > availableStock) {
          return NextResponse.json(
            { error: `Not enough stock for ${item.productName}. Available: ${availableStock}` },
            { status: 400 }
          );
        }
      }
    }

    // Check if any items require shipping
    const hasPhysicalItems = order.items.some((item) => item.product.type === "PHYSICAL");
    if (hasPhysicalItems && body.fulfillmentType === "SHIPPING" && !body.shippingAddress) {
      return NextResponse.json(
        { error: "Shipping address is required for physical items" },
        { status: 400 }
      );
    }

    // Initialize Stripe
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      console.error("[STORE CHECKOUT] STRIPE_SECRET_KEY not configured");
      return NextResponse.json({ error: "Payment system not configured" }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-12-15.clover",
    });

    // Build line items for Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = order.items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.productName + (item.variantName ? ` - ${item.variantName}` : ""),
          images: item.product.imageUrl ? [item.product.imageUrl] : undefined,
        },
        unit_amount: item.unitPriceCents,
      },
      quantity: item.quantity,
    }));

    // Create Stripe checkout session
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.get("host")}`;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      customer_email: body.email,
      success_url: `${baseUrl}/store/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/store/cart`,
      metadata: {
        orderId: order.id,
        sessionId: sessionId,
        fulfillmentType: body.fulfillmentType,
      },
    };

    // Add shipping collection if needed
    if (body.fulfillmentType === "SHIPPING") {
      sessionParams.shipping_options = [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: 0, // Free shipping for now
              currency: "usd",
            },
            display_name: "Standard Shipping",
            delivery_estimate: {
              minimum: {
                unit: "business_day",
                value: 3,
              },
              maximum: {
                unit: "business_day",
                value: 7,
              },
            },
          },
        },
      ];
    }

    const checkoutSession = await stripe.checkout.sessions.create(sessionParams);

    // Create shipping address if provided
    let shippingAddressId: string | null = null;
    if (body.fulfillmentType === "SHIPPING" && body.shippingAddress) {
      const shippingAddress = await prisma.shippingAddress.create({
        data: {
          firstName: body.shippingAddress.firstName,
          lastName: body.shippingAddress.lastName,
          addressLine1: body.shippingAddress.addressLine1,
          addressLine2: body.shippingAddress.addressLine2 || null,
          city: body.shippingAddress.city,
          state: body.shippingAddress.state,
          postalCode: body.shippingAddress.postalCode,
          country: body.shippingAddress.country || "US",
          phone: body.shippingAddress.phone || null,
        },
      });
      shippingAddressId = shippingAddress.id;
    }

    // Update order with checkout info
    await prisma.storeOrder.update({
      where: { id: order.id },
      data: {
        status: "PENDING_PAYMENT",
        guestEmail: body.email,
        guestFirstName: body.firstName || null,
        guestLastName: body.lastName || null,
        guestPhone: body.phone || null,
        fulfillmentType: body.fulfillmentType,
        idempotencyKey: checkoutSession.id, // Store checkout session ID for idempotency
        checkoutStartedAt: new Date(),
        ...(shippingAddressId && { shippingAddressId }),
        ...(body.pickupLocation && { pickupLocation: body.pickupLocation }),
      },
    });

    console.log(`[STORE CHECKOUT] Created session ${checkoutSession.id} for order ${order.id}`);

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error("[STORE CHECKOUT] Error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
