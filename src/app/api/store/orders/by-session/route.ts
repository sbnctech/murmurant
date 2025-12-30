/**
 * Store Order by Session API
 *
 * GET /api/store/orders/by-session - Get order by Stripe checkout session ID
 *
 * Authorization: None (public API - order lookup by session)
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ============================================================================
// GET /api/store/orders/by-session?sessionId=xxx
// ============================================================================

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "Session ID required" }, { status: 400 });
  }

  try {
    // Find order by idempotencyKey (which stores the checkout session ID)
    const order = await prisma.storeOrder.findFirst({
      where: {
        idempotencyKey: sessionId,
      },
      include: {
        items: {
          select: {
            productName: true,
            variantName: true,
            quantity: true,
            totalPriceCents: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        email: order.guestEmail,
        fulfillmentType: order.fulfillmentType,
        subtotalCents: order.subtotalCents,
        shippingCents: order.shippingCents,
        taxCents: order.taxCents,
        totalCents: order.totalCents,
        items: order.items,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
      },
    });
  } catch (error) {
    console.error("[STORE ORDERS] Lookup error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}
