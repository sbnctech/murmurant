"use client";

// Copyright © 2025 Murmurant, Inc.. All rights reserved.

import { useState, useEffect } from "react";
import Link from "next/link";

type AdminProductListItem = {
  id: string;
  name: string;
  slug: string;
  type: "PHYSICAL" | "DIGITAL";
  priceCents: number;
  quantity: number;
  isActive: boolean;
  variantCount: number;
};

type PaginatedResponse = {
  items: AdminProductListItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

const PAGE_SIZE = 10;

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ProductsTable() {
  const [products, setProducts] = useState<AdminProductListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/store/products?page=${page}&pageSize=${PAGE_SIZE}`
        );
        if (res.ok) {
          const data: PaginatedResponse = await res.json();
          setProducts(data.items ?? []);
          setTotalPages(data.totalPages ?? 1);
        }
      } catch {
        // Keep existing state on error
      }
      setLoading(false);
    }
    fetchProducts();
  }, [page]);

  return (
    <>
      <table
        data-test-id="admin-products-list-table"
        style={{
          width: "100%",
          borderCollapse: "collapse",
          maxWidth: "1000px",
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                borderBottom: "1px solid #ccc",
                textAlign: "left",
                padding: "8px",
              }}
            >
              Name
            </th>
            <th
              style={{
                borderBottom: "1px solid #ccc",
                textAlign: "left",
                padding: "8px",
              }}
            >
              Type
            </th>
            <th
              style={{
                borderBottom: "1px solid #ccc",
                textAlign: "left",
                padding: "8px",
              }}
            >
              Price
            </th>
            <th
              style={{
                borderBottom: "1px solid #ccc",
                textAlign: "left",
                padding: "8px",
              }}
            >
              Stock
            </th>
            <th
              style={{
                borderBottom: "1px solid #ccc",
                textAlign: "left",
                padding: "8px",
              }}
            >
              Variants
            </th>
            <th
              style={{
                borderBottom: "1px solid #ccc",
                textAlign: "left",
                padding: "8px",
              }}
            >
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} data-test-id="admin-products-list-row">
              <td
                style={{
                  borderBottom: "1px solid #eee",
                  padding: "8px",
                }}
              >
                <a
                  href={`/admin/store/products/${product.id}`}
                  data-test-id="admin-products-list-name-link"
                  style={{ color: "#0066cc", textDecoration: "none" }}
                >
                  {product.name}
                </a>
              </td>
              <td
                style={{
                  borderBottom: "1px solid #eee",
                  padding: "8px",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    backgroundColor: product.type === "DIGITAL" ? "#dbeafe" : "#f3f4f6",
                    color: product.type === "DIGITAL" ? "#1d4ed8" : "#374151",
                  }}
                >
                  {product.type === "DIGITAL" ? "Digital" : "Physical"}
                </span>
              </td>
              <td
                style={{
                  borderBottom: "1px solid #eee",
                  padding: "8px",
                }}
              >
                {formatPrice(product.priceCents)}
              </td>
              <td
                style={{
                  borderBottom: "1px solid #eee",
                  padding: "8px",
                }}
              >
                {product.type === "DIGITAL" ? (
                  <span style={{ color: "#6b7280" }}>∞</span>
                ) : (
                  <span
                    style={{
                      color: product.quantity <= 5 ? "#dc2626" : "#374151",
                      fontWeight: product.quantity <= 5 ? 600 : 400,
                    }}
                  >
                    {product.quantity}
                  </span>
                )}
              </td>
              <td
                style={{
                  borderBottom: "1px solid #eee",
                  padding: "8px",
                }}
              >
                {product.variantCount}
              </td>
              <td
                style={{
                  borderBottom: "1px solid #eee",
                  padding: "8px",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    backgroundColor: product.isActive ? "#dcfce7" : "#fef2f2",
                    color: product.isActive ? "#166534" : "#991b1b",
                  }}
                >
                  {product.isActive ? "Active" : "Inactive"}
                </span>
              </td>
            </tr>
          ))}
          {!loading && products.length === 0 && (
            <tr data-test-id="admin-products-list-empty-state">
              <td
                colSpan={6}
                style={{
                  padding: "24px 8px",
                  fontStyle: "italic",
                  color: "#666",
                  textAlign: "center",
                }}
              >
                No products yet.{" "}
                <Link href="/admin/store/products/new" style={{ color: "#0066cc" }}>
                  Create your first product
                </Link>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div
        data-test-id="admin-products-pagination"
        style={{
          marginTop: "16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <button
          data-test-id="admin-products-pagination-prev"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          style={{
            padding: "6px 12px",
            fontSize: "14px",
            cursor: page <= 1 ? "not-allowed" : "pointer",
            opacity: page <= 1 ? 0.5 : 1,
          }}
        >
          Prev
        </button>
        <span data-test-id="admin-products-pagination-label">
          Page {page} of {totalPages}
        </span>
        <button
          data-test-id="admin-products-pagination-next"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          style={{
            padding: "6px 12px",
            fontSize: "14px",
            cursor: page >= totalPages ? "not-allowed" : "pointer",
            opacity: page >= totalPages ? 0.5 : 1,
          }}
        >
          Next
        </button>
      </div>
    </>
  );
}
