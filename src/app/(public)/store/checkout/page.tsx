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
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
  imageUrl: string | null;
};

type Cart = {
  id: string;
  items: CartItem[];
  subtotalCents: number;
  itemCount: number;
};

type FulfillmentType = "SHIPPING" | "PICKUP" | "DIGITAL_DELIVERY";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>("SHIPPING");

  // Shipping address
  const [shippingFirstName, setShippingFirstName] = useState("");
  const [shippingLastName, setShippingLastName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch("/api/store/cart");
      if (!res.ok) throw new Error("Failed to fetch cart");
      const data = await res.json();
      setCart(data.cart);

      // If cart is empty, redirect to store
      if (!data.cart || data.cart.items.length === 0) {
        router.push("/store");
      }
    } catch (err) {
      console.error("Error fetching cart:", err);
      setError("Failed to load cart");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Determine if cart has physical or digital items
  const hasPhysicalItems = cart?.items.some((item) => {
    // We'd need product type info here - for now assume all need shipping/pickup
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const checkoutData: Record<string, unknown> = {
        email,
        firstName,
        lastName,
        phone: phone || undefined,
        fulfillmentType,
      };

      if (fulfillmentType === "SHIPPING") {
        checkoutData.shippingAddress = {
          firstName: shippingFirstName || firstName,
          lastName: shippingLastName || lastName,
          addressLine1,
          addressLine2: addressLine2 || undefined,
          city,
          state,
          postalCode,
          country: "US",
          phone: phone || undefined,
        };
      }

      const res = await fetch("/api/store/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create checkout");
      }

      // Redirect to Stripe checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to proceed to checkout");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>Loading checkout...</div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyCart}>
          <h2>Your cart is empty</h2>
          <Link href="/store" style={styles.backLink}>
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <nav style={styles.breadcrumb}>
        <Link href="/store" style={styles.breadcrumbLink}>
          Store
        </Link>
        <span style={styles.breadcrumbSeparator}>/</span>
        <Link href="/store/cart" style={styles.breadcrumbLink}>
          Cart
        </Link>
        <span style={styles.breadcrumbSeparator}>/</span>
        <span>Checkout</span>
      </nav>

      <h1 style={styles.title}>Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div style={styles.checkoutLayout}>
          <div style={styles.formSection}>
            {/* Contact Information */}
            <div style={styles.formCard}>
              <h2 style={styles.sectionTitle}>Contact Information</h2>

              <div style={styles.formGroup}>
                <label style={styles.label}>Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={styles.input}
                  placeholder="you@example.com"
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    style={styles.input}
                    placeholder="John"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    style={styles.input}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Phone (optional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={styles.input}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            {/* Fulfillment Options */}
            {hasPhysicalItems && (
              <div style={styles.formCard}>
                <h2 style={styles.sectionTitle}>Delivery Method</h2>

                <div style={styles.fulfillmentOptions}>
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      name="fulfillment"
                      value="SHIPPING"
                      checked={fulfillmentType === "SHIPPING"}
                      onChange={(e) => setFulfillmentType(e.target.value as FulfillmentType)}
                      style={styles.radio}
                    />
                    <div style={styles.radioContent}>
                      <span style={styles.radioTitle}>Ship to Address</span>
                      <span style={styles.radioDescription}>
                        Standard shipping (3-7 business days)
                      </span>
                    </div>
                  </label>

                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      name="fulfillment"
                      value="PICKUP"
                      checked={fulfillmentType === "PICKUP"}
                      onChange={(e) => setFulfillmentType(e.target.value as FulfillmentType)}
                      style={styles.radio}
                    />
                    <div style={styles.radioContent}>
                      <span style={styles.radioTitle}>Local Pickup</span>
                      <span style={styles.radioDescription}>
                        Pick up at club meeting
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Shipping Address */}
            {fulfillmentType === "SHIPPING" && (
              <div style={styles.formCard}>
                <h2 style={styles.sectionTitle}>Shipping Address</h2>

                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>First Name *</label>
                    <input
                      type="text"
                      value={shippingFirstName}
                      onChange={(e) => setShippingFirstName(e.target.value)}
                      required={fulfillmentType === "SHIPPING"}
                      style={styles.input}
                      placeholder={firstName || "John"}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Last Name *</label>
                    <input
                      type="text"
                      value={shippingLastName}
                      onChange={(e) => setShippingLastName(e.target.value)}
                      required={fulfillmentType === "SHIPPING"}
                      style={styles.input}
                      placeholder={lastName || "Doe"}
                    />
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Address Line 1 *</label>
                  <input
                    type="text"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    required={fulfillmentType === "SHIPPING"}
                    style={styles.input}
                    placeholder="123 Main Street"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Address Line 2</label>
                  <input
                    type="text"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    style={styles.input}
                    placeholder="Apt, Suite, Unit (optional)"
                  />
                </div>

                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>City *</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required={fulfillmentType === "SHIPPING"}
                      style={styles.input}
                      placeholder="Santa Barbara"
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>State *</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      required={fulfillmentType === "SHIPPING"}
                      style={styles.input}
                      placeholder="CA"
                      maxLength={2}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>ZIP Code *</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      required={fulfillmentType === "SHIPPING"}
                      style={styles.input}
                      placeholder="93101"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div style={styles.summarySection}>
            <div style={styles.summaryCard}>
              <h2 style={styles.summaryTitle}>Order Summary</h2>

              <div style={styles.summaryItems}>
                {cart.items.map((item) => (
                  <div key={item.id} style={styles.summaryItem}>
                    <div style={styles.summaryItemImage}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" style={styles.summaryImg} />
                      ) : (
                        <span style={styles.summaryImgPlaceholder}>🛍️</span>
                      )}
                      <span style={styles.summaryItemQty}>{item.quantity}</span>
                    </div>
                    <div style={styles.summaryItemDetails}>
                      <span style={styles.summaryItemName}>{item.productName}</span>
                      {item.variantName && (
                        <span style={styles.summaryItemVariant}>{item.variantName}</span>
                      )}
                    </div>
                    <span style={styles.summaryItemPrice}>
                      {formatPrice(item.totalPriceCents)}
                    </span>
                  </div>
                ))}
              </div>

              <div style={styles.summaryDivider} />

              <div style={styles.summaryRow}>
                <span>Subtotal</span>
                <span>{formatPrice(cart.subtotalCents)}</span>
              </div>

              <div style={styles.summaryRow}>
                <span>Shipping</span>
                <span>{fulfillmentType === "SHIPPING" ? "Free" : "—"}</span>
              </div>

              <div style={styles.summaryDivider} />

              <div style={styles.summaryTotal}>
                <span>Total</span>
                <span>{formatPrice(cart.subtotalCents)}</span>
              </div>

              {error && <div style={styles.errorBanner}>{error}</div>}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  ...styles.checkoutButton,
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? "Processing..." : "Proceed to Payment"}
              </button>

              <p style={styles.securityNote}>
                🔒 You&apos;ll be redirected to Stripe for secure payment
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" },
  loadingContainer: { textAlign: "center", padding: "60px 20px", color: "#6b7280" },
  emptyCart: { textAlign: "center", padding: "60px 20px" },
  backLink: { color: "#2563eb", textDecoration: "none" },
  breadcrumb: { marginBottom: "24px", fontSize: "14px", color: "#6b7280" },
  breadcrumbLink: { color: "#2563eb", textDecoration: "none" },
  breadcrumbSeparator: { margin: "0 8px" },
  title: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: "32px",
  },
  checkoutLayout: {
    display: "grid",
    gridTemplateColumns: "1fr 400px",
    gap: "40px",
    alignItems: "start",
  },
  formSection: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    padding: "24px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "20px",
  },
  formGroup: {
    marginBottom: "16px",
    flex: 1,
  },
  formRow: {
    display: "flex",
    gap: "16px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
    marginBottom: "6px",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    fontSize: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    outline: "none",
    boxSizing: "border-box",
  },
  fulfillmentOptions: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  radioLabel: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "16px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    cursor: "pointer",
  },
  radio: {
    marginTop: "4px",
  },
  radioContent: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  radioTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1f2937",
  },
  radioDescription: {
    fontSize: "13px",
    color: "#6b7280",
  },
  summarySection: {},
  summaryCard: {
    backgroundColor: "#f9fafb",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    padding: "24px",
    position: "sticky",
    top: "24px",
  },
  summaryTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "20px",
  },
  summaryItems: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  summaryItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  summaryItemImage: {
    position: "relative",
    width: "48px",
    height: "48px",
    backgroundColor: "#e5e7eb",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  summaryImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  summaryImgPlaceholder: {
    fontSize: "20px",
    opacity: 0.5,
  },
  summaryItemQty: {
    position: "absolute",
    top: "-6px",
    right: "-6px",
    width: "20px",
    height: "20px",
    backgroundColor: "#6b7280",
    color: "#fff",
    fontSize: "11px",
    fontWeight: "600",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryItemDetails: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  summaryItemName: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#1f2937",
  },
  summaryItemVariant: {
    fontSize: "12px",
    color: "#6b7280",
  },
  summaryItemPrice: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1f2937",
  },
  summaryDivider: {
    height: "1px",
    backgroundColor: "#e5e7eb",
    margin: "16px 0",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
    color: "#4b5563",
    marginBottom: "8px",
  },
  summaryTotal: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "20px",
  },
  errorBanner: {
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
    padding: "16px 24px",
    fontSize: "16px",
    fontWeight: "600",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  securityNote: {
    marginTop: "12px",
    fontSize: "12px",
    color: "#6b7280",
    textAlign: "center",
  },
};
