/**
 * Cart Service
 *
 * Handles shopping cart operations with session-based persistence.
 * Carts are stored as StoreOrder records with status = CART.
 *
 * Charter Compliance:
 * - P3: Order status state machine
 * - N5: Idempotent operations
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";

const CART_SESSION_COOKIE = "cart_session";
const CART_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type CartItem = {
  id: string;
  productId: string;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  sku: string | null;
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
  imageUrl: string | null;
  inStock: boolean;
  maxQuantity: number;
};

export type Cart = {
  id: string;
  sessionId: string;
  items: CartItem[];
  subtotalCents: number;
  itemCount: number;
};

/**
 * Get or create a cart session ID from cookies.
 * Returns the session ID (creates one if none exists).
 */
export async function getOrCreateSessionId(): Promise<string> {
  const cookieStore = await cookies();
  const existingSessionId = cookieStore.get(CART_SESSION_COOKIE)?.value;

  if (existingSessionId) {
    return existingSessionId;
  }

  const newSessionId = randomUUID();
  cookieStore.set(CART_SESSION_COOKIE, newSessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: CART_SESSION_MAX_AGE,
    path: "/",
  });

  return newSessionId;
}

/**
 * Get session ID from cookies (read-only, for API routes).
 */
export async function getSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(CART_SESSION_COOKIE)?.value || null;
}

/**
 * Get or create a cart for the current session.
 */
export async function getOrCreateCart(sessionId: string): Promise<Cart> {
  // Try to find existing cart
  let order = await prisma.storeOrder.findFirst({
    where: {
      sessionId,
      status: "CART",
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              imageUrl: true,
              trackInventory: true,
              quantity: true,
              type: true,
            },
          },
          variant: {
            select: {
              imageUrl: true,
              quantity: true,
            },
          },
        },
      },
    },
  });

  // Create new cart if none exists
  if (!order) {
    order = await prisma.storeOrder.create({
      data: {
        sessionId,
        status: "CART",
        subtotalCents: 0,
        shippingCents: 0,
        taxCents: 0,
        totalCents: 0,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                imageUrl: true,
                trackInventory: true,
                quantity: true,
                type: true,
              },
            },
            variant: {
              select: {
                imageUrl: true,
                quantity: true,
              },
            },
          },
        },
      },
    });
  }

  // Map to cart format
  const items: CartItem[] = order.items.map((item) => {
    const isDigital = item.product.type === "DIGITAL";
    const trackInventory = item.product.trackInventory && !isDigital;
    const availableStock = item.variant?.quantity ?? item.product.quantity;
    const inStock = !trackInventory || availableStock > 0;
    const maxQuantity = trackInventory ? availableStock : 999;

    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      productName: item.productName,
      variantName: item.variantName,
      sku: item.sku,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      totalPriceCents: item.totalPriceCents,
      imageUrl: item.variant?.imageUrl || item.product.imageUrl,
      inStock,
      maxQuantity,
    };
  });

  return {
    id: order.id,
    sessionId: order.sessionId || sessionId,
    items,
    subtotalCents: order.subtotalCents,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

/**
 * Add an item to the cart.
 */
export async function addToCart(
  sessionId: string,
  productId: string,
  variantId: string | null,
  quantity: number
): Promise<Cart> {
  // Get the product and variant details
  const product = await prisma.product.findUnique({
    where: { id: productId, isActive: true, isPublic: true },
    include: {
      variants: variantId
        ? { where: { id: variantId, isActive: true } }
        : undefined,
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  const variant = variantId ? product.variants?.[0] : null;
  if (variantId && !variant) {
    throw new Error("Variant not found");
  }

  // Check inventory
  const trackInventory = product.trackInventory && product.type !== "DIGITAL";
  const availableStock = variant?.quantity ?? product.quantity;

  if (trackInventory && quantity > availableStock) {
    throw new Error(`Only ${availableStock} items available`);
  }

  // Get or create cart
  const cart = await getOrCreateCart(sessionId);

  // Check if item already exists in cart
  const existingItem = cart.items.find(
    (item) => item.productId === productId && item.variantId === variantId
  );

  const unitPrice = variant?.priceCents ?? product.priceCents;

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;

    if (trackInventory && newQuantity > availableStock) {
      throw new Error(`Only ${availableStock} items available`);
    }

    // Update existing item
    await prisma.storeOrderItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: newQuantity,
        totalPriceCents: unitPrice * newQuantity,
      },
    });
  } else {
    // Add new item
    await prisma.storeOrderItem.create({
      data: {
        orderId: cart.id,
        productId,
        variantId,
        productName: product.name,
        variantName: variant?.name || null,
        sku: variant?.sku || null,
        quantity,
        unitPriceCents: unitPrice,
        totalPriceCents: unitPrice * quantity,
      },
    });
  }

  // Recalculate cart totals
  await recalculateCartTotals(cart.id);

  return getOrCreateCart(sessionId);
}

/**
 * Update item quantity in cart.
 */
export async function updateCartItem(
  sessionId: string,
  itemId: string,
  quantity: number
): Promise<Cart> {
  if (quantity < 1) {
    return removeFromCart(sessionId, itemId);
  }

  // Get cart and verify ownership
  const cart = await getOrCreateCart(sessionId);
  const item = cart.items.find((i) => i.id === itemId);

  if (!item) {
    throw new Error("Item not found in cart");
  }

  // Check inventory
  if (item.maxQuantity < quantity) {
    throw new Error(`Only ${item.maxQuantity} items available`);
  }

  // Update item
  await prisma.storeOrderItem.update({
    where: { id: itemId },
    data: {
      quantity,
      totalPriceCents: item.unitPriceCents * quantity,
    },
  });

  // Recalculate totals
  await recalculateCartTotals(cart.id);

  return getOrCreateCart(sessionId);
}

/**
 * Remove item from cart.
 */
export async function removeFromCart(
  sessionId: string,
  itemId: string
): Promise<Cart> {
  // Get cart and verify ownership
  const cart = await getOrCreateCart(sessionId);
  const item = cart.items.find((i) => i.id === itemId);

  if (!item) {
    throw new Error("Item not found in cart");
  }

  // Delete item
  await prisma.storeOrderItem.delete({
    where: { id: itemId },
  });

  // Recalculate totals
  await recalculateCartTotals(cart.id);

  return getOrCreateCart(sessionId);
}

/**
 * Clear all items from cart.
 */
export async function clearCart(sessionId: string): Promise<Cart> {
  const cart = await getOrCreateCart(sessionId);

  await prisma.storeOrderItem.deleteMany({
    where: { orderId: cart.id },
  });

  await prisma.storeOrder.update({
    where: { id: cart.id },
    data: {
      subtotalCents: 0,
      totalCents: 0,
    },
  });

  return getOrCreateCart(sessionId);
}

/**
 * Recalculate cart totals.
 */
async function recalculateCartTotals(orderId: string): Promise<void> {
  const items = await prisma.storeOrderItem.findMany({
    where: { orderId },
    select: { totalPriceCents: true },
  });

  const subtotalCents = items.reduce((sum, item) => sum + item.totalPriceCents, 0);

  await prisma.storeOrder.update({
    where: { id: orderId },
    data: {
      subtotalCents,
      totalCents: subtotalCents, // Will add shipping/tax later
    },
  });
}

/**
 * Associate cart with a member (when they log in).
 */
export async function associateCartWithMember(
  sessionId: string,
  memberId: string
): Promise<void> {
  await prisma.storeOrder.updateMany({
    where: {
      sessionId,
      status: "CART",
      customerId: null,
    },
    data: {
      customerId: memberId,
    },
  });
}

/**
 * Get cart item count for header display.
 */
export async function getCartItemCount(sessionId: string | null): Promise<number> {
  if (!sessionId) return 0;

  const order = await prisma.storeOrder.findFirst({
    where: {
      sessionId,
      status: "CART",
    },
    include: {
      items: {
        select: { quantity: true },
      },
    },
  });

  if (!order) return 0;

  return order.items.reduce((sum, item) => sum + item.quantity, 0);
}
