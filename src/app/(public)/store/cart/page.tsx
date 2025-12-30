"use client";

// Copyright © 2025 Murmurant, Inc.. All rights reserved.

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type CartItem = {
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

type Cart = {
  id: string;
  sessionId: string;
  items: CartItem[];
  subtotalCents: number;
  itemCount: number;
};

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch("/api/store/cart");
      if (!res.ok) throw new Error("Failed to fetch cart");
      const data = await res.json();
      setCart(data.cart);
    } catch (err) {
      console.error("Error fetching cart:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const updateQuantity = async (itemId: string, quantity: number) => {
    setUpdating(itemId);
    try {
      const res = await fetch(`/api/store/cart/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }

      const data = await res.json();
      setCart(data.cart);
    } catch (err) {
      console.error("Error updating item:", err);
      alert(err instanceof Error ? err.message : "Failed to update item");
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId: string) => {
    setUpdating(itemId);
    try {
      const res = await fetch(`/api/store/cart/items/${itemId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to remove item");

      const data = await res.json();
      setCart(data.cart);
    } catch (err) {
      console.error("Error removing item:", err);
      alert("Failed to remove item");
    } finally {
      setUpdating(null);
    }
  };

  const clearCart = async () => {
    if (!confirm("Are you sure you want to clear your cart?")) return;

    setLoading(true);
    try {
      const res = await fetch("/api/store/cart", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to clear cart");

      const data = await res.json();
      setCart(data.cart);
    } catch (err) {
      console.error("Error clearing cart:", err);
      alert("Failed to clear cart");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>Loading cart...</div>
      </div>
    );
  }

  const hasItems = cart && cart.items.length > 0;
  const hasOutOfStockItems = cart?.items.some((item) => !item.inStock);

  return (
    <div style={styles.container}>
      <nav style={styles.breadcrumb}>
        <Link href="/store" style={styles.breadcrumbLink}>
          Store
        </Link>
        <span style={styles.breadcrumbSeparator}>/</span>
        <span>Shopping Cart</span>
      </nav>

      <h1 style={styles.title}>Shopping Cart</h1>

      {!hasItems ? (
        <div style={styles.emptyCart}>
          <span style={styles.emptyCartIcon}>🛒</span>
          <h2 style={styles.emptyCartTitle}>Your cart is empty</h2>
          <p style={styles.emptyCartText}>
            Browse our store to find something you&apos;ll love!
          </p>
          <Link href="/store" style={styles.continueShoppingButton}>
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div style={styles.cartLayout}>
          <div style={styles.itemsSection}>
            <div style={styles.itemsHeader}>
              <span>{cart.itemCount} item{cart.itemCount !== 1 ? "s" : ""}</span>
              <button onClick={clearCart} style={styles.clearButton}>
                Clear Cart
              </button>
            </div>

            <div style={styles.itemsList}>
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    ...styles.cartItem,
                    opacity: updating === item.id ? 0.6 : 1,
                  }}
                >
                  <div style={styles.itemImage}>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        style={styles.itemImageImg}
                      />
                    ) : (
                      <span style={styles.itemImagePlaceholder}>🛍️</span>
                    )}
                  </div>

                  <div style={styles.itemDetails}>
                    <h3 style={styles.itemName}>{item.productName}</h3>
                    {item.variantName && (
                      <p style={styles.itemVariant}>{item.variantName}</p>
                    )}
                    {item.sku && (
                      <p style={styles.itemSku}>SKU: {item.sku}</p>
                    )}
                    {!item.inStock && (
                      <span style={styles.outOfStockBadge}>Out of Stock</span>
                    )}
                  </div>

                  <div style={styles.itemQuantity}>
                    <div style={styles.quantityControls}>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={updating === item.id || item.quantity <= 1}
                        style={styles.quantityButton}
                      >
                        -
                      </button>
                      <span style={styles.quantityValue}>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={
                          updating === item.id || item.quantity >= item.maxQuantity
                        }
                        style={styles.quantityButton}
                      >
                        +
                      </button>
                    </div>
                    {item.maxQuantity < 999 && (
                      <span style={styles.stockInfo}>
                        {item.maxQuantity} available
                      </span>
                    )}
                  </div>

                  <div style={styles.itemPrice}>
                    <span style={styles.itemTotalPrice}>
                      {formatPrice(item.totalPriceCents)}
                    </span>
                    <span style={styles.itemUnitPrice}>
                      {formatPrice(item.unitPriceCents)} each
                    </span>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    disabled={updating === item.id}
                    style={styles.removeButton}
                    title="Remove item"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.summarySection}>
            <div style={styles.summaryCard}>
              <h2 style={styles.summaryTitle}>Order Summary</h2>

              <div style={styles.summaryRow}>
                <span>Subtotal</span>
                <span>{formatPrice(cart.subtotalCents)}</span>
              </div>

              <div style={styles.summaryRow}>
                <span>Shipping</span>
                <span style={styles.summaryNote}>Calculated at checkout</span>
              </div>

              <div style={styles.summaryDivider} />

              <div style={styles.summaryTotal}>
                <span>Total</span>
                <span>{formatPrice(cart.subtotalCents)}</span>
              </div>

              {hasOutOfStockItems && (
                <div style={styles.warningBanner}>
                  Some items in your cart are out of stock.
                  Please remove them to proceed.
                </div>
              )}

              <button
                onClick={() => router.push("/store/checkout")}
                disabled={hasOutOfStockItems}
                style={{
                  ...styles.checkoutButton,
                  opacity: hasOutOfStockItems ? 0.5 : 1,
                  cursor: hasOutOfStockItems ? "not-allowed" : "pointer",
                }}
              >
                Proceed to Checkout
              </button>

              <Link href="/store" style={styles.continueLink}>
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" },
  loadingContainer: { textAlign: "center", padding: "60px 20px", color: "#6b7280" },
  breadcrumb: { marginBottom: "24px", fontSize: "14px", color: "#6b7280" },
  breadcrumbLink: { color: "#2563eb", textDecoration: "none" },
  breadcrumbSeparator: { margin: "0 8px" },
  title: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: "32px",
  },
  emptyCart: {
    textAlign: "center",
    padding: "80px 20px",
  },
  emptyCartIcon: { fontSize: "64px", display: "block", marginBottom: "24px" },
  emptyCartTitle: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "12px",
  },
  emptyCartText: {
    fontSize: "16px",
    color: "#6b7280",
    marginBottom: "24px",
  },
  continueShoppingButton: {
    display: "inline-block",
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: "600",
    backgroundColor: "#2563eb",
    color: "#fff",
    borderRadius: "8px",
    textDecoration: "none",
  },
  cartLayout: {
    display: "grid",
    gridTemplateColumns: "1fr 380px",
    gap: "40px",
    alignItems: "start",
  },
  itemsSection: {},
  itemsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    fontSize: "14px",
    color: "#6b7280",
  },
  clearButton: {
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: "500",
    backgroundColor: "#fff",
    color: "#dc2626",
    border: "1px solid #fecaca",
    borderRadius: "6px",
    cursor: "pointer",
  },
  itemsList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  cartItem: {
    display: "grid",
    gridTemplateColumns: "80px 1fr auto auto 40px",
    gap: "16px",
    alignItems: "center",
    padding: "16px",
    backgroundColor: "#fff",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
  },
  itemImage: {
    width: "80px",
    height: "80px",
    backgroundColor: "#f3f4f6",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  itemImageImg: { width: "100%", height: "100%", objectFit: "cover" },
  itemImagePlaceholder: { fontSize: "32px", opacity: 0.5 },
  itemDetails: { minWidth: 0 },
  itemName: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "4px",
  },
  itemVariant: { fontSize: "14px", color: "#6b7280", marginBottom: "2px" },
  itemSku: { fontSize: "12px", color: "#9ca3af" },
  outOfStockBadge: {
    display: "inline-block",
    marginTop: "8px",
    padding: "4px 8px",
    fontSize: "11px",
    fontWeight: "500",
    backgroundColor: "#fef2f2",
    color: "#991b1b",
    borderRadius: "4px",
  },
  itemQuantity: { textAlign: "center" },
  quantityControls: { display: "flex", alignItems: "center", gap: "8px" },
  quantityButton: {
    width: "28px",
    height: "28px",
    fontSize: "14px",
    fontWeight: "600",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    backgroundColor: "#fff",
    cursor: "pointer",
  },
  quantityValue: {
    fontSize: "14px",
    fontWeight: "600",
    minWidth: "24px",
    textAlign: "center",
  },
  stockInfo: { fontSize: "11px", color: "#9ca3af", marginTop: "4px" },
  itemPrice: { textAlign: "right" },
  itemTotalPrice: { display: "block", fontSize: "16px", fontWeight: "600", color: "#1f2937" },
  itemUnitPrice: { fontSize: "12px", color: "#9ca3af" },
  removeButton: {
    width: "32px",
    height: "32px",
    fontSize: "14px",
    color: "#9ca3af",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  summarySection: {},
  summaryCard: {
    padding: "24px",
    backgroundColor: "#f9fafb",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    position: "sticky",
    top: "24px",
  },
  summaryTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "20px",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "14px",
    color: "#4b5563",
    marginBottom: "12px",
  },
  summaryNote: { fontSize: "12px", color: "#9ca3af" },
  summaryDivider: {
    height: "1px",
    backgroundColor: "#e5e7eb",
    margin: "16px 0",
  },
  summaryTotal: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "20px",
  },
  warningBanner: {
    padding: "12px",
    backgroundColor: "#fef2f2",
    color: "#991b1b",
    fontSize: "13px",
    borderRadius: "8px",
    marginBottom: "16px",
    textAlign: "center",
  },
  checkoutButton: {
    width: "100%",
    padding: "14px 24px",
    fontSize: "16px",
    fontWeight: "600",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    marginBottom: "12px",
  },
  continueLink: {
    display: "block",
    textAlign: "center",
    fontSize: "14px",
    color: "#2563eb",
    textDecoration: "none",
  },
};
