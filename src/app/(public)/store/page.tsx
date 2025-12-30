"use client";

// Copyright © 2025 Murmurant, Inc.. All rights reserved.

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type ProductSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: "PHYSICAL" | "DIGITAL";
  priceCents: number;
  comparePriceCents: number | null;
  imageUrl: string | null;
  inStock: boolean;
  hasVariants: boolean;
};

type ProductsResponse = {
  items: ProductSummary[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function PublicStorePage() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<{ page: number; totalPages: number } | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const fetchProducts = useCallback(async (type: string | null = null, page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", "12");
      if (type) params.set("type", type);

      const res = await fetch(`/api/store/products?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch products");

      const data: ProductsResponse = await res.json();
      setProducts(data.items);
      setPagination({ page: data.page, totalPages: data.totalPages });
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(typeFilter);
  }, [fetchProducts, typeFilter]);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Club Store</h1>
        <p style={styles.subtitle}>Shop our organization-branded merchandise</p>
      </header>

      <div style={styles.filterBar}>
        <button
          style={{ ...styles.filterButton, ...(typeFilter === null ? styles.filterButtonActive : {}) }}
          onClick={() => setTypeFilter(null)}
        >
          All Products
        </button>
        <button
          style={{ ...styles.filterButton, ...(typeFilter === "PHYSICAL" ? styles.filterButtonActive : {}) }}
          onClick={() => setTypeFilter("PHYSICAL")}
        >
          Physical
        </button>
        <button
          style={{ ...styles.filterButton, ...(typeFilter === "DIGITAL" ? styles.filterButtonActive : {}) }}
          onClick={() => setTypeFilter("DIGITAL")}
        >
          Digital
        </button>
      </div>

      {loading ? (
        <div style={styles.loadingContainer}>Loading products...</div>
      ) : products.length === 0 ? (
        <div style={styles.emptyState}>No products available. Check back soon!</div>
      ) : (
        <>
          <div style={styles.productsGrid}>
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/store/products/${product.slug}`}
                style={styles.card}
              >
                <div style={styles.cardImage}>
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      style={styles.productImage}
                    />
                  ) : (
                    <span style={styles.cardImageIcon}>
                      {product.type === "DIGITAL" ? "📄" : "🛍️"}
                    </span>
                  )}
                </div>
                <div style={styles.cardContent}>
                  <span
                    style={{
                      ...styles.typeBadge,
                      backgroundColor: product.type === "DIGITAL" ? "#dbeafe" : "#f3f4f6",
                      color: product.type === "DIGITAL" ? "#1d4ed8" : "#374151",
                    }}
                  >
                    {product.type === "DIGITAL" ? "Digital" : "Physical"}
                  </span>
                  <h3 style={styles.cardTitle}>{product.name}</h3>
                  {product.description && (
                    <p style={styles.cardDescription}>
                      {product.description.length > 80
                        ? product.description.slice(0, 80) + "..."
                        : product.description}
                    </p>
                  )}
                  <div style={styles.priceRow}>
                    <span style={styles.price}>{formatPrice(product.priceCents)}</span>
                    {product.comparePriceCents && (
                      <span style={styles.comparePrice}>
                        {formatPrice(product.comparePriceCents)}
                      </span>
                    )}
                  </div>
                  {!product.inStock && (
                    <span style={styles.outOfStock}>Out of Stock</span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div style={styles.pagination}>
              <button
                style={{ ...styles.pageButton, opacity: pagination.page > 1 ? 1 : 0.5 }}
                onClick={() => fetchProducts(typeFilter, pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                style={{
                  ...styles.pageButton,
                  opacity: pagination.page < pagination.totalPages ? 1 : 0.5,
                }}
                onClick={() => fetchProducts(typeFilter, pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
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
  container: { maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" },
  header: { textAlign: "center", marginBottom: "40px" },
  title: { fontSize: "36px", fontWeight: "700", color: "#1f2937", marginBottom: "12px" },
  subtitle: { fontSize: "18px", color: "#6b7280" },
  filterBar: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    justifyContent: "center",
    marginBottom: "32px",
  },
  filterButton: {
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "500",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    backgroundColor: "#fff",
    color: "#374151",
    cursor: "pointer",
  },
  filterButtonActive: { backgroundColor: "#2563eb", borderColor: "#2563eb", color: "#fff" },
  loadingContainer: { textAlign: "center", padding: "60px 20px", color: "#6b7280" },
  emptyState: { textAlign: "center", padding: "80px 20px", color: "#6b7280", fontSize: "18px" },
  productsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "24px",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    border: "1px solid #e5e7eb",
    textDecoration: "none",
    color: "inherit",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  cardImage: {
    height: "200px",
    backgroundColor: "#f3f4f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  cardImageIcon: { fontSize: "64px", opacity: 0.5 },
  cardContent: { padding: "20px" },
  typeBadge: {
    display: "inline-block",
    padding: "4px 10px",
    fontSize: "11px",
    fontWeight: "500",
    borderRadius: "12px",
    marginBottom: "12px",
    textTransform: "uppercase",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "8px",
  },
  cardDescription: {
    fontSize: "14px",
    color: "#6b7280",
    lineHeight: "1.5",
    marginBottom: "12px",
  },
  priceRow: { display: "flex", alignItems: "center", gap: "8px" },
  price: { fontSize: "20px", fontWeight: "700", color: "#1f2937" },
  comparePrice: {
    fontSize: "14px",
    color: "#9ca3af",
    textDecoration: "line-through",
  },
  outOfStock: {
    display: "inline-block",
    marginTop: "8px",
    padding: "4px 8px",
    fontSize: "12px",
    fontWeight: "500",
    backgroundColor: "#fef2f2",
    color: "#991b1b",
    borderRadius: "4px",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "16px",
    marginTop: "40px",
  },
  pageButton: {
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: "500",
    backgroundColor: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    cursor: "pointer",
  },
};
