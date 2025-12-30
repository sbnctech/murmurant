"use client";

// Copyright © 2025 Murmurant, Inc.. All rights reserved.

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatClubDateTime } from "@/lib/timezone";

type OrderItem = {
  id: string;
  productName: string;
  variantName: string | null;
  sku: string | null;
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
  product: {
    id: string;
    name: string;
    slug: string;
    type: string;
  };
  variant: {
    id: string;
    name: string;
  } | null;
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
  phone: string | null;
};

type DigitalDelivery = {
  id: string;
  productId: string;
  downloadToken: string;
  downloadCount: number;
  maxDownloads: number | null;
  expiresAt: string | null;
};

type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type Order = {
  id: string;
  orderNumber: number;
  status: string;
  fulfillmentType: string | null;
  customerId: string | null;
  guestEmail: string | null;
  guestFirstName: string | null;
  guestLastName: string | null;
  guestPhone: string | null;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  trackingNumber: string | null;
  trackingUrl: string | null;
  carrier: string | null;
  pickupLocation: string | null;
  pickupCode: string | null;
  pickupInstructions: string | null;
  customerNotes: string | null;
  adminNotes: string | null;
  createdAt: string;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  pickedUpAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  items: OrderItem[];
  customer: Customer | null;
  shippingAddress: ShippingAddress | null;
  digitalDeliveries: DigitalDelivery[];
};

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  return formatClubDateTime(new Date(dateStr));
}

const STATUS_BADGES: Record<string, { label: string; color: string; bg: string }> = {
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

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Fulfillment form state
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [carrier, setCarrier] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/store/orders/${orderId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("Order not found");
          return;
        }
        throw new Error("Failed to fetch order");
      }
      const data = await res.json();
      setOrder(data.order);
      setAdminNotes(data.order.adminNotes || "");
      setPickupLocation(data.order.pickupLocation || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load order");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const performAction = async (action: string, extraData: Record<string, string> = {}) => {
    if (!order) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/store/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extraData }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update order");
      }

      await fetchOrder();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update order");
    } finally {
      setUpdating(false);
    }
  };

  const saveNotes = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/store/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes }),
      });

      if (!res.ok) {
        throw new Error("Failed to save notes");
      }

      await fetchOrder();
      alert("Notes saved");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save notes");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading order...</div>;
  }

  if (error || !order) {
    return (
      <div style={styles.errorContainer}>
        <h2>{error || "Order not found"}</h2>
        <Link href="/admin/store/orders" style={styles.backLink}>
          Back to Orders
        </Link>
      </div>
    );
  }

  const statusInfo = STATUS_BADGES[order.status] || {
    label: order.status,
    color: "#6b7280",
    bg: "#f3f4f6",
  };

  const customerName = order.customer
    ? `${order.customer.firstName} ${order.customer.lastName}`
    : order.guestFirstName && order.guestLastName
      ? `${order.guestFirstName} ${order.guestLastName}`
      : "Guest";

  const customerEmail = order.customer?.email || order.guestEmail;

  // Determine available actions based on current status
  const canShip = order.fulfillmentType === "SHIPPING" && ["PAID", "PROCESSING"].includes(order.status);
  const canMarkReadyForPickup = order.fulfillmentType === "PICKUP" && ["PAID", "PROCESSING"].includes(order.status);
  const canMarkPickedUp = order.status === "READY_FOR_PICKUP";
  const canMarkDelivered = order.status === "SHIPPED";
  const canCancel = ["PAID", "PROCESSING", "SHIPPED", "READY_FOR_PICKUP"].includes(order.status);

  return (
    <div style={styles.container}>
      <nav style={styles.breadcrumb}>
        <Link href="/admin/store/orders" style={styles.breadcrumbLink}>
          Orders
        </Link>
        <span style={styles.breadcrumbSeparator}>/</span>
        <span>#{order.orderNumber}</span>
      </nav>

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Order #{order.orderNumber}</h1>
          <p style={styles.subtitle}>Placed on {formatDate(order.createdAt)}</p>
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
        {/* Customer Info */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Customer</h2>
          <div style={styles.customerDetails}>
            <p><strong>Name:</strong> {customerName}</p>
            <p><strong>Email:</strong> {customerEmail}</p>
            {order.guestPhone && <p><strong>Phone:</strong> {order.guestPhone}</p>}
            {order.customer && (
              <Link href={`/admin/members/${order.customer.id}`} style={styles.link}>
                View Member Profile
              </Link>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Order Items</h2>
          <div style={styles.itemsList}>
            {order.items.map((item) => (
              <div key={item.id} style={styles.orderItem}>
                <div style={styles.itemDetails}>
                  <span style={styles.itemName}>{item.productName}</span>
                  {item.variantName && (
                    <span style={styles.itemVariant}>{item.variantName}</span>
                  )}
                  {item.sku && <span style={styles.itemSku}>SKU: {item.sku}</span>}
                  <span style={styles.itemType}>
                    {item.product.type === "DIGITAL" ? "Digital" : "Physical"}
                  </span>
                </div>
                <div style={styles.itemQty}>x{item.quantity}</div>
                <div style={styles.itemPrice}>{formatPrice(item.totalPriceCents)}</div>
              </div>
            ))}
          </div>

          <div style={styles.totals}>
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
              {order.shippingAddress.phone && (
                <>
                  <br />
                  Phone: {order.shippingAddress.phone}
                </>
              )}
            </p>
          </div>
        )}

        {/* Fulfillment Actions */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Fulfillment</h2>

          {/* Shipping fulfillment */}
          {canShip && (
            <div style={styles.fulfillmentForm}>
              <h3 style={styles.formTitle}>Mark as Shipped</h3>
              <div style={styles.formRow}>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Tracking Number *"
                  style={styles.input}
                />
                <input
                  type="text"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder="Carrier (USPS, FedEx, etc.)"
                  style={styles.input}
                />
              </div>
              <input
                type="url"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder="Tracking URL (optional)"
                style={{ ...styles.input, marginBottom: "12px" }}
              />
              <button
                onClick={() => performAction("mark_shipped", { trackingNumber, trackingUrl, carrier })}
                disabled={updating || !trackingNumber}
                style={styles.actionButton}
              >
                {updating ? "Updating..." : "Mark as Shipped"}
              </button>
            </div>
          )}

          {/* Pickup fulfillment */}
          {canMarkReadyForPickup && (
            <div style={styles.fulfillmentForm}>
              <h3 style={styles.formTitle}>Mark Ready for Pickup</h3>
              <input
                type="text"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                placeholder="Pickup Location"
                style={{ ...styles.input, marginBottom: "12px" }}
              />
              <button
                onClick={() => performAction("mark_ready_for_pickup", { pickupLocation })}
                disabled={updating}
                style={styles.actionButton}
              >
                {updating ? "Updating..." : "Mark Ready for Pickup"}
              </button>
            </div>
          )}

          {canMarkPickedUp && (
            <button
              onClick={() => performAction("mark_picked_up")}
              disabled={updating}
              style={styles.actionButton}
            >
              {updating ? "Updating..." : "Mark as Picked Up"}
            </button>
          )}

          {canMarkDelivered && (
            <button
              onClick={() => performAction("mark_delivered")}
              disabled={updating}
              style={styles.actionButton}
            >
              {updating ? "Updating..." : "Mark as Delivered"}
            </button>
          )}

          {/* Current tracking info */}
          {order.trackingNumber && (
            <div style={styles.trackingInfo}>
              <p>
                <strong>Tracking:</strong>{" "}
                {order.trackingUrl ? (
                  <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer">
                    {order.trackingNumber}
                  </a>
                ) : (
                  order.trackingNumber
                )}
                {order.carrier && ` (${order.carrier})`}
              </p>
            </div>
          )}

          {/* Pickup info */}
          {order.pickupCode && (
            <div style={styles.pickupInfo}>
              <p>
                <strong>Pickup Code:</strong>{" "}
                <span style={styles.pickupCode}>{order.pickupCode}</span>
              </p>
              {order.pickupLocation && <p><strong>Location:</strong> {order.pickupLocation}</p>}
            </div>
          )}

          {/* Cancel option */}
          {canCancel && (
            <div style={styles.dangerSection}>
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to cancel this order?")) {
                    performAction("cancel");
                  }
                }}
                disabled={updating}
                style={styles.dangerButton}
              >
                Cancel Order
              </button>
            </div>
          )}
        </div>

        {/* Digital Deliveries */}
        {order.digitalDeliveries.length > 0 && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Digital Downloads</h2>
            <div style={styles.downloadList}>
              {order.digitalDeliveries.map((delivery) => {
                // Look up product name from order items
                const item = order.items.find((i) => i.product.id === delivery.productId);
                const productName = item?.product.name || item?.productName || "Digital Product";
                return (
                  <div key={delivery.id} style={styles.downloadItem}>
                    <span>{productName}</span>
                    <span>Downloads: {delivery.downloadCount}{delivery.maxDownloads ? `/${delivery.maxDownloads}` : ""}</span>
                    <span style={styles.downloadToken}>Token: {delivery.downloadToken.slice(0, 8)}...</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Admin Notes */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Admin Notes</h2>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Internal notes about this order..."
            style={styles.notesTextarea}
          />
          <button
            onClick={saveNotes}
            disabled={updating}
            style={styles.saveNotesButton}
          >
            {updating ? "Saving..." : "Save Notes"}
          </button>

          {order.customerNotes && (
            <div style={styles.customerNotes}>
              <h4>Customer Notes:</h4>
              <p>{order.customerNotes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: "24px", maxWidth: "1000px" },
  loading: { textAlign: "center", padding: "60px", color: "#6b7280" },
  errorContainer: { textAlign: "center", padding: "60px" },
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
  subtitle: { fontSize: "14px", color: "#6b7280" },
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
  customerDetails: { lineHeight: "1.8", color: "#4b5563" },
  link: { color: "#2563eb", textDecoration: "none" },
  itemsList: { display: "flex", flexDirection: "column", gap: "12px" },
  orderItem: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "12px 0",
    borderBottom: "1px solid #f3f4f6",
  },
  itemDetails: { flex: 1, display: "flex", flexDirection: "column", gap: "2px" },
  itemName: { fontSize: "14px", fontWeight: "500", color: "#1f2937" },
  itemVariant: { fontSize: "12px", color: "#6b7280" },
  itemSku: { fontSize: "11px", color: "#9ca3af" },
  itemType: { fontSize: "11px", color: "#6b7280", fontStyle: "italic" },
  itemQty: { fontSize: "14px", color: "#6b7280" },
  itemPrice: { fontSize: "14px", fontWeight: "600", color: "#1f2937" },
  totals: { marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #e5e7eb" },
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
  fulfillmentForm: {
    padding: "16px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    marginBottom: "16px",
  },
  formTitle: { fontSize: "14px", fontWeight: "600", color: "#1f2937", marginBottom: "12px" },
  formRow: { display: "flex", gap: "12px", marginBottom: "12px" },
  input: {
    flex: 1,
    padding: "10px 14px",
    fontSize: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
  },
  actionButton: {
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: "500",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  trackingInfo: {
    padding: "12px",
    backgroundColor: "#f0f9ff",
    borderRadius: "8px",
    marginTop: "12px",
  },
  pickupInfo: {
    padding: "12px",
    backgroundColor: "#f0fdf4",
    borderRadius: "8px",
    marginTop: "12px",
  },
  pickupCode: {
    fontFamily: "monospace",
    fontSize: "16px",
    fontWeight: "700",
    backgroundColor: "#dcfce7",
    padding: "4px 8px",
    borderRadius: "4px",
  },
  dangerSection: { marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #e5e7eb" },
  dangerButton: {
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: "500",
    backgroundColor: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  downloadList: { display: "flex", flexDirection: "column", gap: "8px" },
  downloadItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 12px",
    backgroundColor: "#f9fafb",
    borderRadius: "6px",
    fontSize: "13px",
  },
  downloadToken: { color: "#6b7280", fontFamily: "monospace" },
  notesTextarea: {
    width: "100%",
    minHeight: "100px",
    padding: "12px",
    fontSize: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    resize: "vertical",
    boxSizing: "border-box",
  },
  saveNotesButton: {
    marginTop: "12px",
    padding: "8px 16px",
    fontSize: "14px",
    backgroundColor: "#f3f4f6",
    color: "#374151",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    cursor: "pointer",
  },
  customerNotes: {
    marginTop: "16px",
    padding: "12px",
    backgroundColor: "#fffbeb",
    borderRadius: "8px",
    fontSize: "14px",
  },
};
