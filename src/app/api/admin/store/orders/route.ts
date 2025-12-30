/**
 * Admin Store Orders API
 *
 * GET /api/admin/store/orders - List all orders with filtering
 *
 * Authorization: Admin only
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOnly } from "@/lib/eventAuth";
import { StoreOrderStatus } from "@prisma/client";

// ============================================================================
// GET /api/admin/store/orders - List Orders
// ============================================================================

export async function GET(req: NextRequest) {
  const authResult = await requireAdminOnly(req);
  if (!authResult.ok) {
    return authResult.response;
  }

  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "20", 10), 100);
  const status = searchParams.get("status") as StoreOrderStatus | null;
  const search = searchParams.get("search");

  const skip = (page - 1) * pageSize;

  try {
    // Build where clause
    const where: Record<string, unknown> = {
      status: { not: "CART" }, // Don't show cart orders
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { guestEmail: { contains: search, mode: "insensitive" } },
        { guestFirstName: { contains: search, mode: "insensitive" } },
        { guestLastName: { contains: search, mode: "insensitive" } },
        { orderNumber: isNaN(parseInt(search)) ? undefined : parseInt(search) },
      ].filter((o) => Object.values(o)[0] !== undefined);
    }

    const [orders, totalItems] = await Promise.all([
      prisma.storeOrder.findMany({
        where,
        include: {
          items: {
            select: {
              id: true,
              productName: true,
              variantName: true,
              quantity: true,
              totalPriceCents: true,
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
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.storeOrder.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / pageSize);

    return NextResponse.json({
      items: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        fulfillmentType: order.fulfillmentType,
        customerName: order.customer
          ? `${order.customer.firstName} ${order.customer.lastName}`
          : order.guestFirstName && order.guestLastName
            ? `${order.guestFirstName} ${order.guestLastName}`
            : order.guestEmail,
        email: order.customer?.email || order.guestEmail,
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        totalCents: order.totalCents,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
      })),
      page,
      pageSize,
      totalItems,
      totalPages,
    });
  } catch (error) {
    console.error("[ADMIN ORDERS] List error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
