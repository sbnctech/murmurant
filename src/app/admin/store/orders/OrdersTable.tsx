"use client";

// Copyright © 2025 Murmurant, Inc.. All rights reserved.

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatClubDate } from "@/lib/timezone";

type OrderSummary = {
  id: string;
  orderNumber: number;
  status: string;
  fulfillmentType: string | null;
  customerName: string | null;
  email: string | null;
  itemCount: number;
  totalCents: number;
  createdAt: string;
  paidAt: string | null;
};

type OrdersResponse = {
  items: OrderSummary[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  return formatClubDate(new Date(dateStr));
}

const STATUS_BADGES: Record<string, { label: string; color: string; bg: string }> = {
  PENDING_PAYMENT: { label: "Pending Payment", color: "#92400e", bg: "#fef3c7" },
  PAID: { label: "Paid", color: "#166534", bg: "#dcfce7" },
  PROCESSING: { label: "Processing", color: "#1d4ed8", bg: "#dbeafe" },
  SHIPPED: { label: "Shipped", color: "#7c3aed", bg: "#ede9fe" },
  READY_FOR_PICKUP: { label: "Ready", color: "#0369a1", bg: "#e0f2fe" },
  DELIVERED: { label: "Delivered", color: "#166534", bg: "#dcfce7" },
  PICKED_UP: { label: "Picked Up", color: "#166534", bg: "#dcfce7" },
  COMPLETED: { label: "Completed", color: "#166534", bg: "#dcfce7" },
  CANCELLED: { label: "Cancelled", color: "#991b1b", bg: "#fef2f2" },
  REFUND_PENDING: { label: "Refund Pending", color: "#92400e", bg: "#fef3c7" },
  REFUNDED: { label: "Refunded", color: "#6b7280", bg: "#f3f4f6" },
};

const FULFILLMENT_LABELS: Record<string, string> = {
  SHIPPING: "Ship",
  PICKUP: "Pickup",
  DIGITAL_DELIVERY: "Digital",
};

export default function OrdersTable() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<{ page: number; totalPages: number; totalItems: number } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  const fetchOrders = useCallback(async (status: string, searchQuery: string, page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", "20");
      if (status) params.set("status", status);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/admin/store/orders?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch orders");

      const data: OrdersResponse = await res.json();
      setOrders(data.items);
      setPagination({ page: data.page, totalPages: data.totalPages, totalItems: data.totalItems });
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(statusFilter, search);
  }, [fetchOrders, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders(statusFilter, search);
  };

  return (
    <div>
      {/* Filters */}
      <div style={styles.filterBar}>
        <form onSubmit={handleSearch} style={styles.searchForm}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email, name, or order #"
            style={styles.searchInput}
          />
          <button type="submit" style={styles.searchButton}>
            Search
          </button>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="">All Statuses</option>
          <option value="PENDING_PAYMENT">Pending Payment</option>
          <option value="PAID">Paid</option>
          <option value="PROCESSING">Processing</option>
          <option value="SHIPPED">Shipped</option>
          <option value="READY_FOR_PICKUP">Ready for Pickup</option>
          <option value="DELIVERED">Delivered</option>
          <option value="PICKED_UP">Picked Up</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="REFUND_PENDING">Refund Pending</option>
          <option value="REFUNDED">Refunded</option>
        </select>
      </div>

      {/* Stats */}
      {pagination && (
        <div style={styles.stats}>
          {pagination.totalItems} order{pagination.totalItems !== 1 ? "s" : ""} found
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={styles.loading}>Loading orders...</div>
      ) : orders.length === 0 ? (
        <div style={styles.empty}>No orders found</div>
      ) : (
        <>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Order #</th>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Fulfillment</th>
                  <th style={styles.th}>Items</th>
                  <th style={styles.th}>Total</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const statusInfo = STATUS_BADGES[order.status] || {
                    label: order.status,
                    color: "#6b7280",
                    bg: "#f3f4f6",
                  };
                  return (
                    <tr key={order.id} style={styles.tr}>
                      <td style={styles.td}>
                        <span style={styles.orderNumber}>#{order.orderNumber}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.customerInfo}>
                          <span style={styles.customerName}>{order.customerName || "Guest"}</span>
                          {order.email && (
                            <span style={styles.customerEmail}>{order.email}</span>
                          )}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor: statusInfo.bg,
                            color: statusInfo.color,
                          }}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.fulfillment}>
                          {order.fulfillmentType
                            ? FULFILLMENT_LABELS[order.fulfillmentType] || order.fulfillmentType
                            : "—"}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.itemCount}>{order.itemCount}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.total}>{formatPrice(order.totalCents)}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.date}>{formatDate(order.createdAt)}</span>
                      </td>
                      <td style={styles.td}>
                        <Link href={`/admin/store/orders/${order.id}`} style={styles.viewLink}>
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div style={styles.pagination}>
              <button
                onClick={() => fetchOrders(statusFilter, search, pagination.page - 1)}
                disabled={pagination.page <= 1}
                style={{
                  ...styles.pageButton,
                  opacity: pagination.page > 1 ? 1 : 0.5,
                }}
              >
                Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchOrders(statusFilter, search, pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                style={{
                  ...styles.pageButton,
                  opacity: pagination.page < pagination.totalPages ? 1 : 0.5,
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  filterBar: {
    display: "flex",
    gap: "16px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },
  searchForm: {
    display: "flex",
    gap: "8px",
    flex: 1,
    minWidth: "300px",
  },
  searchInput: {
    flex: 1,
    padding: "10px 14px",
    fontSize: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
  },
  searchButton: {
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: "500",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  filterSelect: {
    padding: "10px 14px",
    fontSize: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    backgroundColor: "#fff",
    minWidth: "180px",
  },
  stats: {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "16px",
  },
  loading: {
    textAlign: "center",
    padding: "40px",
    color: "#6b7280",
  },
  empty: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#6b7280",
    backgroundColor: "#f9fafb",
    borderRadius: "12px",
  },
  tableWrapper: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "12px 16px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    backgroundColor: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
  },
  tr: {
    borderBottom: "1px solid #f3f4f6",
  },
  td: {
    padding: "12px 16px",
    fontSize: "14px",
    verticalAlign: "middle",
  },
  orderNumber: {
    fontWeight: "600",
    color: "#1f2937",
  },
  customerInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  customerName: {
    fontWeight: "500",
    color: "#1f2937",
  },
  customerEmail: {
    fontSize: "12px",
    color: "#6b7280",
  },
  statusBadge: {
    display: "inline-block",
    padding: "4px 10px",
    fontSize: "12px",
    fontWeight: "500",
    borderRadius: "12px",
  },
  fulfillment: {
    fontSize: "13px",
    color: "#4b5563",
  },
  itemCount: {
    color: "#6b7280",
  },
  total: {
    fontWeight: "600",
    color: "#1f2937",
  },
  date: {
    color: "#6b7280",
    fontSize: "13px",
  },
  viewLink: {
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: "500",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "16px",
    marginTop: "20px",
  },
  pageButton: {
    padding: "8px 16px",
    fontSize: "14px",
    backgroundColor: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    cursor: "pointer",
  },
};
