"use client";

// Copyright © 2025 Murmurant, Inc.. All rights reserved.

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatClubDateTime } from "@/lib/timezone";

type OrderItem = {
  id: string;
  productName: string;
  variantName: string | null;
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
};

type ShippingAddress = {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

type DigitalDelivery = {
  productId: string;
  downloadUrl: string;
  downloadsRemaining: number | null;
  expiresAt: string | null;
};

type Order = {
  orderNumber: number;
  status: string;
  fulfillmentType: string | null;
  customerName: string | null;
  email: string | null;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  items: OrderItem[];
  createdAt: string;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  pickedUpAt: string | null;
  completedAt: string | null;
  shippingAddress: ShippingAddress | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  carrier: string | null;
  pickupLocation: string | null;
  pickupCode: string | null;
  pickupInstructions: string | null;
  digitalDeliveries: DigitalDelivery[];
};

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  return formatClubDateTime(new Date(dateStr));
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING_PAYMENT: { label: "Pending Payment", color: "#92400e", bg: "#fef3c7" },
  PAID: { label: "Paid", color: "#166534", bg: "#dcfce7" },
  PROCESSING: { label: "Processing", color: "#1d4ed8", bg: "#dbeafe" },
  SHIPPED: { label: "Shipped", color: "#7c3aed", bg: "#ede9fe" },
  READY_FOR_PICKUP: { label: "Ready for Pickup", color: "#0369a1", bg: "#e0f2fe" },
  DELIVERED: { label: "Delivered", color: "#166534", bg: "#dcfce7" },
  PICKED_UP: { label: "Picked Up", color: "#166534", bg: "#dcfce7" },
  COMPLETED: { label: "Completed", color: "#166534", bg: "#dcfce7" },
  CANCELLED: { label: "Cancelled", color: "#991b1b", bg: "#fef2f2" },
  REFUND_PENDING: { label: "Refund Pending", color: "#92400e", bg: "#fef3c7" },
  REFUNDED: { label: "Refunded", color: "#6b7280", bg: "#f3f4f6" },
};

export default function OrderStatusPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderNumber = params.orderNumber as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [needsEmail, setNeedsEmail] = useState(!searchParams.get("email"));

  const fetchOrder = async (emailToUse: string) => {
    if (!emailToUse) {
      setNeedsEmail(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/store/orders/${orderNumber}?email=${encodeURIComponent(emailToUse)}`
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch order");
      }

      const data = await res.json();
      setOrder(data.order);
      setNeedsEmail(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      fetchOrder(emailParam);
    } else {
      setLoading(false);
    }
  }, [orderNumber, searchParams]);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(email);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>Loading order...</div>
      </div>
    );
  }

  if (needsEmail) {
    return (
      <div style={styles.container}>
        <div style={styles.emailForm}>
          <h1 style={styles.title}>Order #{orderNumber}</h1>
          <p style={styles.emailText}>
            Enter the email address used for this order to view its status.
          </p>
          <form onSubmit={handleEmailSubmit}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={styles.emailInput}
            />
            <button type="submit" style={styles.emailButton}>
              View Order
            </button>
          </form>
          {error && <div style={styles.errorBanner}>{error}</div>}
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <h2 style={styles.errorTitle}>Order Not Found</h2>
          <p style={styles.errorText}>{error || "Could not find this order."}</p>
          <Link href="/store" style={styles.backLink}>
            Return to Store
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[order.status] || {
    label: order.status,
    color: "#6b7280",
    bg: "#f3f4f6",
  };

  return (
    <div style={styles.container}>
      <nav style={styles.breadcrumb}>
        <Link href="/store" style={styles.breadcrumbLink}>
          Store
        </Link>
        <span style={styles.breadcrumbSeparator}>/</span>
        <span>Order #{order.orderNumber}</span>
      </nav>

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Order #{order.orderNumber}</h1>
          <p style={styles.orderDate}>Placed on {formatDate(order.createdAt)}</p>
        </div>
        <span
          style={{
            ...styles.statusBadge,
            backgroundColor: statusInfo.bg,
            color: statusInfo.color,
          }}
        >
          {statusInfo.label}
        </span>
      </div>

      <div style={styles.content}>
        {/* Order Timeline */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Order Status</h2>
          <div style={styles.timeline}>
            <TimelineItem
              label="Order Placed"
              date={order.createdAt}
              completed={true}
            />
            <TimelineItem
              label="Payment Confirmed"
              date={order.paidAt}
              completed={!!order.paidAt}
            />
            {order.fulfillmentType === "SHIPPING" && (
              <>
                <TimelineItem
                  label="Shipped"
                  date={order.shippedAt}
                  completed={!!order.shippedAt}
                />
                <TimelineItem
                  label="Delivered"
                  date={order.deliveredAt}
                  completed={!!order.deliveredAt}
                />
              </>
            )}
            {order.fulfillmentType === "PICKUP" && (
              <TimelineItem
                label="Picked Up"
                date={order.pickedUpAt}
                completed={!!order.pickedUpAt}
              />
            )}
          </div>

          {/* Tracking Info */}
          {order.trackingNumber && (
            <div style={styles.trackingInfo}>
              <h3 style={styles.trackingTitle}>Tracking Information</h3>
              <p>
                {order.carrier && <span>{order.carrier}: </span>}
                {order.trackingUrl ? (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.trackingLink}
                  >
                    {order.trackingNumber}
                  </a>
                ) : (
                  <span>{order.trackingNumber}</span>
                )}
              </p>
            </div>
          )}

          {/* Pickup Info */}
          {order.fulfillmentType === "PICKUP" && order.status === "READY_FOR_PICKUP" && (
            <div style={styles.pickupInfo}>
              <h3 style={styles.pickupTitle}>Pickup Details</h3>
              {order.pickupLocation && <p><strong>Location:</strong> {order.pickupLocation}</p>}
              {order.pickupCode && (
                <p>
                  <strong>Pickup Code:</strong>{" "}
                  <span style={styles.pickupCode}>{order.pickupCode}</span>
                </p>
              )}
              {order.pickupInstructions && <p>{order.pickupInstructions}</p>}
            </div>
          )}
        </div>

        {/* Digital Downloads */}
        {order.digitalDeliveries.length > 0 && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Digital Downloads</h2>
            <div style={styles.downloadList}>
              {order.digitalDeliveries.map((delivery, index) => (
                <div key={index} style={styles.downloadItem}>
                  <a
                    href={delivery.downloadUrl}
                    style={styles.downloadLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download File
                  </a>
                  {delivery.downloadsRemaining !== null && (
                    <span style={styles.downloadInfo}>
                      {delivery.downloadsRemaining} downloads remaining
                    </span>
                  )}
                  {delivery.expiresAt && (
                    <span style={styles.downloadInfo}>
                      Expires: {formatDate(delivery.expiresAt)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order Items */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Order Items</h2>
          <div style={styles.itemsList}>
            {order.items.map((item) => (
              <div key={item.id} style={styles.orderItem}>
                <div style={styles.orderItemDetails}>
                  <span style={styles.orderItemName}>{item.productName}</span>
                  {item.variantName && (
                    <span style={styles.orderItemVariant}>{item.variantName}</span>
                  )}
                </div>
                <div style={styles.orderItemQty}>x{item.quantity}</div>
                <div style={styles.orderItemPrice}>
                  {formatPrice(item.totalPriceCents)}
                </div>
              </div>
            ))}
          </div>

          <div style={styles.orderTotals}>
            <div style={styles.totalRow}>
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotalCents)}</span>
            </div>
            {order.shippingCents > 0 && (
              <div style={styles.totalRow}>
                <span>Shipping</span>
                <span>{formatPrice(order.shippingCents)}</span>
              </div>
            )}
            {order.taxCents > 0 && (
              <div style={styles.totalRow}>
                <span>Tax</span>
                <span>{formatPrice(order.taxCents)}</span>
              </div>
            )}
            <div style={styles.totalRowFinal}>
              <span>Total</span>
              <span>{formatPrice(order.totalCents)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        {order.shippingAddress && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Shipping Address</h2>
            <p style={styles.addressText}>
              {order.shippingAddress.firstName} {order.shippingAddress.lastName}
              <br />
              {order.shippingAddress.addressLine1}
              {order.shippingAddress.addressLine2 && (
                <>
                  <br />
                  {order.shippingAddress.addressLine2}
                </>
              )}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.postalCode}
              <br />
              {order.shippingAddress.country}
            </p>
          </div>
        )}
      </div>

      <div style={styles.footer}>
        <Link href="/store" style={styles.continueLink}>
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

function TimelineItem({
  label,
  date,
  completed,
}: {
  label: string;
  date: string | null;
  completed: boolean;
}) {
  return (
    <div style={styles.timelineItem}>
      <div
        style={{
          ...styles.timelineDot,
          backgroundColor: completed ? "#16a34a" : "#d1d5db",
        }}
      >
        {completed && <span style={styles.timelineCheck}>✓</span>}
      </div>
      <div style={styles.timelineContent}>
        <span
          style={{
            ...styles.timelineLabel,
            color: completed ? "#1f2937" : "#9ca3af",
          }}
        >
          {label}
        </span>
        {date && (
          <span style={styles.timelineDate}>{formatDate(date)}</span>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: "800px", margin: "0 auto", padding: "40px 20px" },
  loadingContainer: { textAlign: "center", padding: "60px 20px", color: "#6b7280" },
  emailForm: {
    maxWidth: "400px",
    margin: "0 auto",
    padding: "40px",
    backgroundColor: "#fff",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    textAlign: "center",
  },
  emailText: { color: "#6b7280", marginBottom: "24px" },
  emailInput: {
    width: "100%",
    padding: "12px 16px",
    fontSize: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    marginBottom: "12px",
    boxSizing: "border-box",
  },
  emailButton: {
    width: "100%",
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: "600",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  errorContainer: { textAlign: "center", padding: "60px 20px" },
  errorTitle: { fontSize: "24px", fontWeight: "600", color: "#1f2937", marginBottom: "12px" },
  errorText: { color: "#6b7280", marginBottom: "24px" },
  errorBanner: {
    marginTop: "16px",
    padding: "12px",
    backgroundColor: "#fef2f2",
    color: "#991b1b",
    borderRadius: "8px",
    fontSize: "14px",
  },
  backLink: { color: "#2563eb", textDecoration: "none" },
  breadcrumb: { marginBottom: "24px", fontSize: "14px", color: "#6b7280" },
  breadcrumbLink: { color: "#2563eb", textDecoration: "none" },
  breadcrumbSeparator: { margin: "0 8px" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "32px",
  },
  title: { fontSize: "28px", fontWeight: "700", color: "#1f2937", marginBottom: "4px" },
  orderDate: { fontSize: "14px", color: "#6b7280" },
  statusBadge: {
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "600",
    borderRadius: "20px",
  },
  content: { display: "flex", flexDirection: "column", gap: "24px" },
  card: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    padding: "24px",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "16px",
  },
  timeline: { display: "flex", flexDirection: "column", gap: "16px" },
  timelineItem: { display: "flex", alignItems: "flex-start", gap: "12px" },
  timelineDot: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  timelineCheck: { color: "#fff", fontSize: "12px", fontWeight: "700" },
  timelineContent: { display: "flex", flexDirection: "column", gap: "2px" },
  timelineLabel: { fontSize: "14px", fontWeight: "500" },
  timelineDate: { fontSize: "12px", color: "#6b7280" },
  trackingInfo: {
    marginTop: "20px",
    padding: "16px",
    backgroundColor: "#f0f9ff",
    borderRadius: "8px",
  },
  trackingTitle: { fontSize: "14px", fontWeight: "600", color: "#0369a1", marginBottom: "8px" },
  trackingLink: { color: "#2563eb", textDecoration: "underline" },
  pickupInfo: {
    marginTop: "20px",
    padding: "16px",
    backgroundColor: "#f0fdf4",
    borderRadius: "8px",
  },
  pickupTitle: { fontSize: "14px", fontWeight: "600", color: "#166534", marginBottom: "8px" },
  pickupCode: {
    fontFamily: "monospace",
    fontSize: "18px",
    fontWeight: "700",
    backgroundColor: "#dcfce7",
    padding: "4px 8px",
    borderRadius: "4px",
  },
  downloadList: { display: "flex", flexDirection: "column", gap: "12px" },
  downloadItem: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "12px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
  },
  downloadLink: {
    padding: "8px 16px",
    backgroundColor: "#2563eb",
    color: "#fff",
    borderRadius: "6px",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
  },
  downloadInfo: { fontSize: "12px", color: "#6b7280" },
  itemsList: { display: "flex", flexDirection: "column", gap: "12px" },
  orderItem: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "12px 0",
    borderBottom: "1px solid #f3f4f6",
  },
  orderItemDetails: { flex: 1, display: "flex", flexDirection: "column", gap: "2px" },
  orderItemName: { fontSize: "14px", fontWeight: "500", color: "#1f2937" },
  orderItemVariant: { fontSize: "12px", color: "#6b7280" },
  orderItemQty: { fontSize: "14px", color: "#6b7280" },
  orderItemPrice: { fontSize: "14px", fontWeight: "600", color: "#1f2937" },
  orderTotals: {
    marginTop: "16px",
    paddingTop: "16px",
    borderTop: "1px solid #e5e7eb",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "8px",
  },
  totalRowFinal: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
    marginTop: "8px",
  },
  addressText: { fontSize: "14px", color: "#4b5563", lineHeight: "1.6" },
  footer: { marginTop: "32px", textAlign: "center" },
  continueLink: {
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
