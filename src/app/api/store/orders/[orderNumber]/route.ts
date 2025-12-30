/**
 * Public Store Order API
 *
 * GET /api/store/orders/:orderNumber - Get order by order number (public lookup)
 *
 * Authorization: Requires email verification (order email must match query param)
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ orderNumber: string }>;
};

// ============================================================================
// GET /api/store/orders/:orderNumber - Public Order Lookup
// ============================================================================

export async function GET(req: NextRequest, context: RouteContext) {
  const { orderNumber } = await context.params;
  const email = req.nextUrl.searchParams.get("email");

  // Parse order number
  const orderNum = parseInt(orderNumber, 10);
  if (isNaN(orderNum)) {
    return NextResponse.json({ error: "Invalid order number" }, { status: 400 });
  }

  // Email is required for public lookup (prevents enumeration)
  if (!email) {
    return NextResponse.json(
      { error: "Email is required to look up order" },
      { status: 400 }
    );
  }

  try {
    const order = await prisma.storeOrder.findFirst({
      where: {
        orderNumber: orderNum,
        guestEmail: email.toLowerCase(),
        status: { not: "CART" }, // Don't show cart orders
      },
      include: {
        items: {
          select: {
            id: true,
            productName: true,
            variantName: true,
            sku: true,
            quantity: true,
            unitPriceCents: true,
            totalPriceCents: true,
          },
        },
        shippingAddress: {
          select: {
            firstName: true,
            lastName: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            state: true,
            postalCode: true,
            country: true,
          },
        },
        digitalDeliveries: {
          select: {
            id: true,
            productId: true,
            downloadToken: true,
            downloadCount: true,
            maxDownloads: true,
            expiresAt: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found. Please check the order number and email." },
        { status: 404 }
      );
    }

    // Build response
    const response = {
      orderNumber: order.orderNumber,
      status: order.status,
      fulfillmentType: order.fulfillmentType,
      customerName: order.guestFirstName && order.guestLastName
        ? `${order.guestFirstName} ${order.guestLastName}`
        : null,
      email: order.guestEmail,

      // Pricing
      subtotalCents: order.subtotalCents,
      shippingCents: order.shippingCents,
      taxCents: order.taxCents,
      totalCents: order.totalCents,

      // Items
      items: order.items,

      // Timestamps
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      pickedUpAt: order.pickedUpAt,
      completedAt: order.completedAt,

      // Shipping details (if applicable)
      shippingAddress: order.shippingAddress,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
      carrier: order.carrier,

      // Pickup details (if applicable)
      pickupLocation: order.pickupLocation,
      pickupCode: order.pickupCode,
      pickupInstructions: order.pickupInstructions,

      // Digital downloads (if applicable)
      digitalDeliveries: order.digitalDeliveries.map((d) => ({
        productId: d.productId,
        downloadUrl: `/api/store/download/${d.downloadToken}`,
        downloadsRemaining: d.maxDownloads ? d.maxDownloads - d.downloadCount : null,
        expiresAt: d.expiresAt,
      })),
    };

    return NextResponse.json({ order: response });
  } catch (error) {
    console.error("[STORE ORDERS] Lookup error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}
