/**
 * Cart Service Unit Tests
 *
 * Tests cart business logic - add/update/remove items, inventory checks, totals.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock modules - must be at top before any imports that use them
vi.mock("@/lib/prisma", () => ({
  prisma: {
    storeOrder: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    storeOrderItem: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock next/headers cookies
vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: vi.fn(),
      set: vi.fn(),
    }),
}));

// Now import the module and the mocked prisma
import { prisma } from "@/lib/prisma";
import {
  getOrCreateCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartItemCount,
} from "@/lib/store/cart";

describe("Cart Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getOrCreateCart", () => {
    it("creates a new cart when none exists", async () => {
      vi.mocked(prisma.storeOrder.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.storeOrder.create).mockResolvedValue({
        id: "cart-1",
        sessionId: "session-1",
        status: "CART",
        subtotalCents: 0,
        shippingCents: 0,
        taxCents: 0,
        totalCents: 0,
        fulfillmentType: null,
        customerId: null,
        guestEmail: null,
        guestFirstName: null,
        guestLastName: null,
        guestPhone: null,
        orderNumber: 1,
        shippingAddressId: null,
        pickupLocation: null,
        pickupCode: null,
        trackingNumber: null,
        carrier: null,
        adminNotes: null,
        checkoutStartedAt: null,
        paidAt: null,
        shippedAt: null,
        deliveredAt: null,
        pickedUpAt: null,
        completedAt: null,
        cancelledAt: null,
        refundedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
      } as never);

      const cart = await getOrCreateCart("session-1");

      expect(cart.id).toBe("cart-1");
      expect(cart.items).toEqual([]);
      expect(cart.subtotalCents).toBe(0);
      expect(cart.itemCount).toBe(0);
      expect(prisma.storeOrder.create).toHaveBeenCalled();
    });

    it("returns existing cart when found", async () => {
      vi.mocked(prisma.storeOrder.findFirst).mockResolvedValue({
        id: "cart-1",
        sessionId: "session-1",
        status: "CART",
        subtotalCents: 2500,
        items: [
          {
            id: "item-1",
            productId: "prod-1",
            variantId: null,
            productName: "Test Product",
            variantName: null,
            sku: null,
            quantity: 2,
            unitPriceCents: 1000,
            totalPriceCents: 2000,
            product: {
              imageUrl: "/test.jpg",
              trackInventory: true,
              quantity: 10,
              type: "PHYSICAL",
            },
            variant: null,
          },
        ],
      } as never);

      const cart = await getOrCreateCart("session-1");

      expect(cart.id).toBe("cart-1");
      expect(cart.items.length).toBe(1);
      expect(cart.items[0].productName).toBe("Test Product");
      expect(cart.items[0].quantity).toBe(2);
      expect(cart.itemCount).toBe(2);
      expect(prisma.storeOrder.create).not.toHaveBeenCalled();
    });

    it("calculates inStock and maxQuantity correctly for physical products", async () => {
      vi.mocked(prisma.storeOrder.findFirst).mockResolvedValue({
        id: "cart-1",
        sessionId: "session-1",
        status: "CART",
        subtotalCents: 1000,
        items: [
          {
            id: "item-1",
            productId: "prod-1",
            variantId: null,
            productName: "Limited Product",
            variantName: null,
            sku: null,
            quantity: 1,
            unitPriceCents: 1000,
            totalPriceCents: 1000,
            product: {
              imageUrl: null,
              trackInventory: true,
              quantity: 5,
              type: "PHYSICAL",
            },
            variant: null,
          },
        ],
      } as never);

      const cart = await getOrCreateCart("session-1");

      expect(cart.items[0].inStock).toBe(true);
      expect(cart.items[0].maxQuantity).toBe(5);
    });

    it("handles digital products with no inventory tracking", async () => {
      vi.mocked(prisma.storeOrder.findFirst).mockResolvedValue({
        id: "cart-1",
        sessionId: "session-1",
        status: "CART",
        subtotalCents: 999,
        items: [
          {
            id: "item-1",
            productId: "prod-1",
            variantId: null,
            productName: "Digital Download",
            variantName: null,
            sku: null,
            quantity: 1,
            unitPriceCents: 999,
            totalPriceCents: 999,
            product: {
              imageUrl: null,
              trackInventory: true,
              quantity: 0,
              type: "DIGITAL",
            },
            variant: null,
          },
        ],
      } as never);

      const cart = await getOrCreateCart("session-1");

      // Digital products are always in stock
      expect(cart.items[0].inStock).toBe(true);
      expect(cart.items[0].maxQuantity).toBe(999);
    });

    it("uses variant stock when variant exists", async () => {
      vi.mocked(prisma.storeOrder.findFirst).mockResolvedValue({
        id: "cart-1",
        sessionId: "session-1",
        status: "CART",
        subtotalCents: 2500,
        items: [
          {
            id: "item-1",
            productId: "prod-1",
            variantId: "var-1",
            productName: "T-Shirt",
            variantName: "Large",
            sku: "TSHIRT-L",
            quantity: 1,
            unitPriceCents: 2500,
            totalPriceCents: 2500,
            product: {
              imageUrl: "/tshirt.jpg",
              trackInventory: true,
              quantity: 0, // Parent has 0
              type: "PHYSICAL",
            },
            variant: {
              imageUrl: null,
              quantity: 15, // Variant has stock
            },
          },
        ],
      } as never);

      const cart = await getOrCreateCart("session-1");

      expect(cart.items[0].inStock).toBe(true);
      expect(cart.items[0].maxQuantity).toBe(15);
    });
  });

  describe("addToCart", () => {
    it("throws when product not found", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

      await expect(addToCart("session-1", "fake-prod", null, 1)).rejects.toThrow(
        "Product not found"
      );
    });

    it("throws when variant not found", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: "prod-1",
        name: "Product",
        priceCents: 1000,
        trackInventory: false,
        quantity: 10,
        type: "PHYSICAL",
        variants: [], // Empty - variant not found
      } as never);

      await expect(addToCart("session-1", "prod-1", "fake-variant", 1)).rejects.toThrow(
        "Variant not found"
      );
    });

    it("throws when insufficient inventory", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: "prod-1",
        name: "Limited Product",
        priceCents: 1000,
        trackInventory: true,
        quantity: 2,
        type: "PHYSICAL",
        variants: [],
      } as never);

      await expect(addToCart("session-1", "prod-1", null, 5)).rejects.toThrow(
        "Only 2 items available"
      );
    });
  });

  describe("updateCartItem", () => {
    it("throws when item not in cart", async () => {
      vi.mocked(prisma.storeOrder.findFirst).mockResolvedValue({
        id: "cart-1",
        sessionId: "session-1",
        status: "CART",
        subtotalCents: 0,
        items: [],
      } as never);

      await expect(updateCartItem("session-1", "fake-item", 2)).rejects.toThrow(
        "Item not found in cart"
      );
    });

    it("throws when exceeding max quantity", async () => {
      vi.mocked(prisma.storeOrder.findFirst).mockResolvedValue({
        id: "cart-1",
        sessionId: "session-1",
        status: "CART",
        subtotalCents: 1000,
        items: [
          {
            id: "item-1",
            productId: "prod-1",
            variantId: null,
            productName: "Limited Stock",
            variantName: null,
            sku: null,
            quantity: 1,
            unitPriceCents: 1000,
            totalPriceCents: 1000,
            product: {
              imageUrl: null,
              trackInventory: true,
              quantity: 3,
              type: "PHYSICAL",
            },
            variant: null,
          },
        ],
      } as never);

      await expect(updateCartItem("session-1", "item-1", 10)).rejects.toThrow(
        "Only 3 items available"
      );
    });
  });

  describe("removeFromCart", () => {
    it("throws when item not in cart", async () => {
      vi.mocked(prisma.storeOrder.findFirst).mockResolvedValue({
        id: "cart-1",
        sessionId: "session-1",
        status: "CART",
        subtotalCents: 0,
        items: [],
      } as never);

      await expect(removeFromCart("session-1", "fake-item")).rejects.toThrow(
        "Item not found in cart"
      );
    });
  });

  describe("getCartItemCount", () => {
    it("returns 0 when no session", async () => {
      const count = await getCartItemCount(null);
      expect(count).toBe(0);
    });

    it("returns 0 when no cart found", async () => {
      vi.mocked(prisma.storeOrder.findFirst).mockResolvedValue(null);

      const count = await getCartItemCount("session-1");
      expect(count).toBe(0);
    });

    it("returns total item count", async () => {
      vi.mocked(prisma.storeOrder.findFirst).mockResolvedValue({
        id: "cart-1",
        items: [{ quantity: 2 }, { quantity: 3 }, { quantity: 1 }],
      } as never);

      const count = await getCartItemCount("session-1");
      expect(count).toBe(6);
    });
  });
});
