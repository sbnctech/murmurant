/**
 * Admin Store Order Detail API
 *
 * GET /api/admin/store/orders/:id - Get order details
 * PATCH /api/admin/store/orders/:id - Update order (fulfillment, notes)
 *
 * Authorization: Admin only
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOnly } from "@/lib/eventAuth";
import { StoreOrderStatus } from "@prisma/client";
import { randomBytes } from "crypto";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// ============================================================================
// GET /api/admin/store/orders/:id - Get Order Details
// ============================================================================

export async function GET(req: NextRequest, context: RouteContext) {
  const authResult = await requireAdminOnly(req);
  if (!authResult.ok) {
    return authResult.response;
  }

  const { id } = await context.params;

  try {
    const order = await prisma.storeOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                type: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        shippingAddress: true,
        digitalDeliveries: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("[ADMIN ORDERS] Get error:", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

// ============================================================================
// PATCH /api/admin/store/orders/:id - Update Order
// ============================================================================

interface UpdateOrderBody {
  action?: "mark_shipped" | "mark_ready_for_pickup" | "mark_picked_up" | "mark_delivered" | "cancel" | "refund";
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  pickupLocation?: string;
  pickupInstructions?: string;
  adminNotes?: string;
}

// Valid status transitions
const VALID_TRANSITIONS: Record<StoreOrderStatus, StoreOrderStatus[]> = {
  CART: [],
  PENDING_PAYMENT: ["CART", "CANCELLED"],
  PAID: ["PROCESSING", "SHIPPED", "READY_FOR_PICKUP", "CANCELLED", "REFUND_PENDING"],
  PROCESSING: ["SHIPPED", "READY_FOR_PICKUP", "CANCELLED", "REFUND_PENDING"],
  SHIPPED: ["DELIVERED", "CANCELLED", "REFUND_PENDING"],
  READY_FOR_PICKUP: ["PICKED_UP", "CANCELLED", "REFUND_PENDING"],
  DELIVERED: ["COMPLETED", "REFUND_PENDING"],
  PICKED_UP: ["COMPLETED", "REFUND_PENDING"],
  COMPLETED: ["REFUND_PENDING"],
  CANCELLED: [],
  REFUND_PENDING: ["REFUNDED"],
  REFUNDED: [],
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  const authResult = await requireAdminOnly(req);
  if (!authResult.ok) {
    return authResult.response;
  }

  const { id } = await context.params;

  let body: UpdateOrderBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const order = await prisma.storeOrder.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    // Handle status transitions based on action
    if (body.action) {
      let newStatus: StoreOrderStatus | null = null;

      switch (body.action) {
        case "mark_shipped":
          newStatus = "SHIPPED";
          if (!body.trackingNumber) {
            return NextResponse.json(
              { error: "Tracking number is required for shipping" },
              { status: 400 }
            );
          }
          updateData.trackingNumber = body.trackingNumber;
          updateData.trackingUrl = body.trackingUrl || null;
          updateData.carrier = body.carrier || null;
          updateData.shippedAt = new Date();
          break;

        case "mark_ready_for_pickup":
          newStatus = "READY_FOR_PICKUP";
          updateData.pickupLocation = body.pickupLocation || order.pickupLocation;
          updateData.pickupInstructions = body.pickupInstructions || null;
          // Generate pickup code if not exists
          if (!order.pickupCode) {
            updateData.pickupCode = randomBytes(3).toString("hex").toUpperCase();
          }
          break;

        case "mark_picked_up":
          newStatus = "PICKED_UP";
          updateData.pickedUpAt = new Date();
          break;

        case "mark_delivered":
          newStatus = "DELIVERED";
          updateData.deliveredAt = new Date();
          break;

        case "cancel":
          newStatus = "CANCELLED";
          updateData.cancelledAt = new Date();
          break;

        case "refund":
          newStatus = "REFUND_PENDING";
          break;
      }

      if (newStatus) {
        // Validate transition
        const validNextStates = VALID_TRANSITIONS[order.status];
        if (!validNextStates.includes(newStatus)) {
          return NextResponse.json(
            { error: `Cannot transition from ${order.status} to ${newStatus}` },
            { status: 400 }
          );
        }
        updateData.status = newStatus;
      }
    }

    // Update admin notes if provided
    if (body.adminNotes !== undefined) {
      updateData.adminNotes = body.adminNotes;
    }

    // Only update if there are changes
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const updatedOrder = await prisma.storeOrder.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        shippingAddress: true,
      },
    });

    console.log(`[ADMIN ORDERS] Order ${order.orderNumber} updated:`, updateData);

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error("[ADMIN ORDERS] Update error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
