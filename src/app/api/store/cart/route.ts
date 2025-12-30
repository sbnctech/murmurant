/**
 * Store Cart API
 *
 * GET /api/store/cart - Get current cart
 * POST /api/store/cart - Add item to cart
 * DELETE /api/store/cart - Clear cart
 *
 * Authorization: None (public API, session-based)
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getOrCreateSessionId,
  getOrCreateCart,
  addToCart,
  clearCart,
} from "@/lib/store/cart";

// ============================================================================
// GET /api/store/cart - Get Cart
// ============================================================================

export async function GET() {
  try {
    const sessionId = await getOrCreateSessionId();
    const cart = await getOrCreateCart(sessionId);

    return NextResponse.json({ cart });
  } catch (error) {
    console.error("[STORE CART] Get error:", error);
    return NextResponse.json(
      { error: "Failed to get cart" },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/store/cart - Add Item to Cart
// ============================================================================

interface AddToCartBody {
  productId: string;
  variantId?: string | null;
  quantity?: number;
}

export async function POST(req: NextRequest) {
  let body: AddToCartBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.productId) {
    return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
  }

  const quantity = body.quantity ?? 1;
  if (quantity < 1) {
    return NextResponse.json({ error: "Quantity must be at least 1" }, { status: 400 });
  }

  try {
    const sessionId = await getOrCreateSessionId();
    const cart = await addToCart(
      sessionId,
      body.productId,
      body.variantId || null,
      quantity
    );

    return NextResponse.json({ cart });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add to cart";
    console.error("[STORE CART] Add error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// ============================================================================
// DELETE /api/store/cart - Clear Cart
// ============================================================================

export async function DELETE() {
  try {
    const sessionId = await getOrCreateSessionId();
    const cart = await clearCart(sessionId);

    return NextResponse.json({ cart });
  } catch (error) {
    console.error("[STORE CART] Clear error:", error);
    return NextResponse.json(
      { error: "Failed to clear cart" },
      { status: 500 }
    );
  }
}
