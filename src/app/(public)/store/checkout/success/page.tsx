"use client";

// Copyright © 2025 Murmurant, Inc.. All rights reserved.

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type OrderSummary = {
  orderNumber: number;
  email: string;
  fulfillmentType: string;
  totalCents: number;
  items: {
    productName: string;
    variantName: string | null;
    quantity: number;
  }[];
};

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      if (!sessionId) {
        setError("No session ID found");
        setLoading(false);
        return;
      }

      try {
        // Poll for order status since webhook might not have processed yet
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
          const res = await fetch(`/api/store/orders/by-session?sessionId=${sessionId}`);

          if (res.ok) {
            const data = await res.json();
            if (data.order && data.order.status !== "PENDING_PAYMENT") {
              setOrder(data.order);
              setLoading(false);
              return;
            }
          }

          attempts++;
          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        // If still pending after polling, show pending state
        setError("Your payment is being processed. Please check your email for confirmation.");
        setLoading(false);
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Failed to load order details");
        setLoading(false);
      }
    }

    fetchOrder();
  }, [sessionId]);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}>⏳</div>
          <h2 style={styles.loadingTitle}>Processing your order...</h2>
          <p style={styles.loadingText}>Please wait while we confirm your payment.</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div style={styles.container}>
        <div style={styles.messageContainer}>
          <span style={styles.warningIcon}>⚠️</span>
          <h2 style={styles.messageTitle}>{error}</h2>
          <p style={styles.messageText}>
            If you have any questions, please contact us with your session reference: {sessionId?.slice(0, 20)}...
          </p>
          <Link href="/store" style={styles.backButton}>
            Return to Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.successContainer}>
        <div style={styles.successIcon}>✓</div>
        <h1 style={styles.successTitle}>Thank you for your order!</h1>
        <p style={styles.successSubtitle}>
          Your order has been confirmed and we&apos;ve sent a confirmation email to{" "}
          <strong>{order?.email}</strong>
        </p>

        {order && (
          <div style={styles.orderCard}>
            <div style={styles.orderHeader}>
              <span style={styles.orderNumberLabel}>Order Number</span>
              <span style={styles.orderNumber}>#{order.orderNumber}</span>
            </div>

            <div style={styles.orderDivider} />

            <div style={styles.orderItems}>
              {order.items.map((item, index) => (
                <div key={index} style={styles.orderItem}>
                  <span style={styles.orderItemName}>
                    {item.productName}
                    {item.variantName && ` - ${item.variantName}`}
                  </span>
                  <span style={styles.orderItemQty}>x{item.quantity}</span>
                </div>
              ))}
            </div>

            <div style={styles.orderDivider} />

            <div style={styles.orderTotal}>
              <span>Total</span>
              <span>{formatPrice(order.totalCents)}</span>
            </div>

            <div style={styles.fulfillmentInfo}>
              {order.fulfillmentType === "SHIPPING" && (
                <p>
                  📦 Your order will be shipped within 3-5 business days.
                  You&apos;ll receive tracking information via email.
                </p>
              )}
              {order.fulfillmentType === "PICKUP" && (
                <p>
                  📍 Your order is ready for pickup. We&apos;ll email you
                  pickup details and instructions.
                </p>
              )}
              {order.fulfillmentType === "DIGITAL_DELIVERY" && (
                <p>
                  📧 Your digital download links have been sent to your email.
                  Check your inbox!
                </p>
              )}
            </div>
          </div>
        )}

        <div style={styles.actions}>
          <Link href="/store" style={styles.continueButton}>
            Continue Shopping
          </Link>
          {order && (
            <Link
              href={`/store/orders/${order.orderNumber}`}
              style={styles.viewOrderButton}
            >
              View Order Status
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "60px 20px",
  },
  loadingContainer: {
    textAlign: "center",
    padding: "40px 20px",
  },
  loadingSpinner: {
    fontSize: "48px",
    marginBottom: "24px",
  },
  loadingTitle: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "12px",
  },
  loadingText: {
    fontSize: "16px",
    color: "#6b7280",
  },
  messageContainer: {
    textAlign: "center",
    padding: "40px 20px",
  },
  warningIcon: {
    fontSize: "48px",
    display: "block",
    marginBottom: "24px",
  },
  messageTitle: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "12px",
  },
  messageText: {
    fontSize: "16px",
    color: "#6b7280",
    marginBottom: "24px",
  },
  backButton: {
    display: "inline-block",
    padding: "12px 24px",
    backgroundColor: "#2563eb",
    color: "#fff",
    borderRadius: "8px",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "600",
  },
  successContainer: {
    textAlign: "center",
  },
  successIcon: {
    width: "80px",
    height: "80px",
    backgroundColor: "#dcfce7",
    color: "#16a34a",
    fontSize: "40px",
    fontWeight: "700",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 24px",
  },
  successTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: "12px",
  },
  successSubtitle: {
    fontSize: "16px",
    color: "#6b7280",
    marginBottom: "32px",
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    padding: "24px",
    textAlign: "left",
    marginBottom: "32px",
  },
  orderHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderNumberLabel: {
    fontSize: "14px",
    color: "#6b7280",
  },
  orderNumber: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#1f2937",
  },
  orderDivider: {
    height: "1px",
    backgroundColor: "#e5e7eb",
    margin: "16px 0",
  },
  orderItems: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  orderItem: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
    color: "#4b5563",
  },
  orderItemName: {
    flex: 1,
  },
  orderItemQty: {
    color: "#6b7280",
  },
  orderTotal: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
  },
  fulfillmentInfo: {
    marginTop: "16px",
    padding: "16px",
    backgroundColor: "#f0f9ff",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#0369a1",
    lineHeight: "1.5",
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    alignItems: "center",
  },
  continueButton: {
    display: "inline-block",
    padding: "14px 32px",
    backgroundColor: "#2563eb",
    color: "#fff",
    borderRadius: "8px",
    textDecoration: "none",
    fontSize: "16px",
    fontWeight: "600",
  },
  viewOrderButton: {
    display: "inline-block",
    padding: "12px 24px",
    backgroundColor: "#fff",
    color: "#2563eb",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
  },
};
