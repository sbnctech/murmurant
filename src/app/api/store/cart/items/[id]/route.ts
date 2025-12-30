/**
 * Store Cart Item API
 *
 * PATCH /api/store/cart/items/:id - Update item quantity
 * DELETE /api/store/cart/items/:id - Remove item from cart
 *
 * Authorization: None (public API, session-based)
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getOrCreateSessionId,
  updateCartItem,
  removeFromCart,
} from "@/lib/store/cart";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// ============================================================================
// PATCH /api/store/cart/items/:id - Update Item Quantity
// ============================================================================

interface UpdateItemBody {
  quantity: number;
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  let body: UpdateItemBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.quantity !== "number") {
    return NextResponse.json({ error: "Quantity is required" }, { status: 400 });
  }

  try {
    const sessionId = await getOrCreateSessionId();
    const cart = await updateCartItem(sessionId, id, body.quantity);

    return NextResponse.json({ cart });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update item";
    console.error("[STORE CART ITEM] Update error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// ============================================================================
// DELETE /api/store/cart/items/:id - Remove Item
// ============================================================================

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const sessionId = await getOrCreateSessionId();
    const cart = await removeFromCart(sessionId, id);

    return NextResponse.json({ cart });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove item";
    console.error("[STORE CART ITEM] Remove error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
