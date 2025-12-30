"use client";

// Copyright © 2025 Murmurant, Inc.. All rights reserved.

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type ProductVariant = {
  id: string;
  name: string;
  sku: string | null;
  priceCents: number;
  attributes: Record<string, string> | null;
  imageUrl: string | null;
  inStock: boolean;
  quantity: number;
};

type ProductDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: "PHYSICAL" | "DIGITAL";
  priceCents: number;
  comparePriceCents: number | null;
  imageUrl: string | null;
  images: string[] | null;
  allowsShipping: boolean;
  allowsPickup: boolean;
  inStock: boolean;
  variants: ProductVariant[];
};

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [addedMessage, setAddedMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      try {
        const res = await fetch(`/api/store/products/${slug}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Product not found");
          } else {
            throw new Error("Failed to fetch product");
          }
          return;
        }

        const data = await res.json();
        setProduct(data.product);

        // Pre-select first variant if exists
        if (data.product.variants.length > 0) {
          setSelectedVariant(data.product.variants[0]);
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to load product");
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [slug]);

  const handleAddToCart = async () => {
    if (!product) return;

    setAdding(true);
    setAddedMessage(null);

    try {
      const res = await fetch("/api/store/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          variantId: selectedVariant?.id || null,
          quantity,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add to cart");
      }

      setAddedMessage("Added to cart!");
      setTimeout(() => setAddedMessage(null), 3000);
    } catch (err) {
      setAddedMessage(err instanceof Error ? err.message : "Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>Loading product...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <h2>{error || "Product not found"}</h2>
          <Link href="/store" style={styles.backLink}>
            Back to Store
          </Link>
        </div>
      </div>
    );
  }

  const currentPrice = selectedVariant?.priceCents ?? product.priceCents;
  const currentInStock = selectedVariant?.inStock ?? product.inStock;
  const maxQuantity = selectedVariant?.quantity ?? 999;
  const currentImage = selectedVariant?.imageUrl || product.imageUrl;

  return (
    <div style={styles.container}>
      <nav style={styles.breadcrumb}>
        <Link href="/store" style={styles.breadcrumbLink}>
          Store
        </Link>
        <span style={styles.breadcrumbSeparator}>/</span>
        <span>{product.name}</span>
      </nav>

      <div style={styles.productLayout}>
        <div style={styles.imageSection}>
          <div style={styles.mainImage}>
            {currentImage ? (
              <img src={currentImage} alt={product.name} style={styles.productImage} />
            ) : (
              <span style={styles.imagePlaceholder}>
                {product.type === "DIGITAL" ? "📄" : "🛍️"}
              </span>
            )}
          </div>
        </div>

        <div style={styles.detailsSection}>
          <span
            style={{
              ...styles.typeBadge,
              backgroundColor: product.type === "DIGITAL" ? "#dbeafe" : "#f3f4f6",
              color: product.type === "DIGITAL" ? "#1d4ed8" : "#374151",
            }}
          >
            {product.type === "DIGITAL" ? "Digital Download" : "Physical Product"}
          </span>

          <h1 style={styles.productTitle}>{product.name}</h1>

          <div style={styles.priceSection}>
            <span style={styles.price}>{formatPrice(currentPrice)}</span>
            {product.comparePriceCents && (
              <span style={styles.comparePrice}>
                {formatPrice(product.comparePriceCents)}
              </span>
            )}
          </div>

          {product.description && (
            <p style={styles.description}>{product.description}</p>
          )}

          {product.variants.length > 0 && (
            <div style={styles.variantSection}>
              <label style={styles.variantLabel}>Select Option:</label>
              <div style={styles.variantButtons}>
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    disabled={!variant.inStock}
                    style={{
                      ...styles.variantButton,
                      ...(selectedVariant?.id === variant.id
                        ? styles.variantButtonSelected
                        : {}),
                      ...(variant.inStock ? {} : styles.variantButtonDisabled),
                    }}
                  >
                    {variant.name}
                    {!variant.inStock && " (Out of Stock)"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentInStock && (
            <div style={styles.quantitySection}>
              <label style={styles.quantityLabel}>Quantity:</label>
              <div style={styles.quantityControls}>
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  style={styles.quantityButton}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span style={styles.quantityValue}>{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                  style={styles.quantityButton}
                  disabled={quantity >= maxQuantity}
                >
                  +
                </button>
              </div>
            </div>
          )}

          {currentInStock ? (
            <button
              onClick={handleAddToCart}
              disabled={adding}
              style={{
                ...styles.addToCartButton,
                opacity: adding ? 0.7 : 1,
              }}
            >
              {adding ? "Adding..." : "Add to Cart"}
            </button>
          ) : (
            <div style={styles.outOfStockBanner}>Out of Stock</div>
          )}

          {addedMessage && (
            <div
              style={{
                ...styles.message,
                backgroundColor: addedMessage.includes("Added")
                  ? "#dcfce7"
                  : "#fef2f2",
                color: addedMessage.includes("Added") ? "#166534" : "#991b1b",
              }}
            >
              {addedMessage}
            </div>
          )}

          <div style={styles.viewCartLink}>
            <Link href="/store/cart" style={styles.viewCartButton}>
              View Cart
            </Link>
          </div>

          {product.type === "PHYSICAL" && (
            <div style={styles.fulfillmentInfo}>
              <h4 style={styles.fulfillmentTitle}>Fulfillment Options:</h4>
              <ul style={styles.fulfillmentList}>
                {product.allowsShipping && <li>Shipping available</li>}
                {product.allowsPickup && <li>Local pickup available</li>}
              </ul>
            </div>
          )}

          {product.type === "DIGITAL" && (
            <div style={styles.fulfillmentInfo}>
              <h4 style={styles.fulfillmentTitle}>Digital Delivery:</h4>
              <p style={styles.fulfillmentText}>
                Download link will be sent to your email after purchase.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" },
  loadingContainer: { textAlign: "center", padding: "60px 20px", color: "#6b7280" },
  errorContainer: { textAlign: "center", padding: "60px 20px" },
  backLink: { color: "#2563eb", textDecoration: "none" },
  breadcrumb: { marginBottom: "24px", fontSize: "14px", color: "#6b7280" },
  breadcrumbLink: { color: "#2563eb", textDecoration: "none" },
  breadcrumbSeparator: { margin: "0 8px" },
  productLayout: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px" },
  imageSection: {},
  mainImage: {
    aspectRatio: "1",
    backgroundColor: "#f3f4f6",
    borderRadius: "12px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  productImage: { width: "100%", height: "100%", objectFit: "cover" },
  imagePlaceholder: { fontSize: "96px", opacity: 0.5 },
  detailsSection: {},
  typeBadge: {
    display: "inline-block",
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: "500",
    borderRadius: "16px",
    marginBottom: "16px",
    textTransform: "uppercase",
  },
  productTitle: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: "16px",
  },
  priceSection: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" },
  price: { fontSize: "28px", fontWeight: "700", color: "#1f2937" },
  comparePrice: {
    fontSize: "18px",
    color: "#9ca3af",
    textDecoration: "line-through",
  },
  description: {
    fontSize: "16px",
    color: "#4b5563",
    lineHeight: "1.6",
    marginBottom: "24px",
  },
  variantSection: { marginBottom: "24px" },
  variantLabel: {
    display: "block",
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "8px",
  },
  variantButtons: { display: "flex", flexWrap: "wrap", gap: "8px" },
  variantButton: {
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: "500",
    border: "2px solid #e5e7eb",
    borderRadius: "8px",
    backgroundColor: "#fff",
    color: "#374151",
    cursor: "pointer",
  },
  variantButtonSelected: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
    color: "#2563eb",
  },
  variantButtonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
    backgroundColor: "#f9fafb",
  },
  quantitySection: { marginBottom: "24px" },
  quantityLabel: {
    display: "block",
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "8px",
  },
  quantityControls: { display: "flex", alignItems: "center", gap: "12px" },
  quantityButton: {
    width: "36px",
    height: "36px",
    fontSize: "18px",
    fontWeight: "600",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    backgroundColor: "#fff",
    cursor: "pointer",
  },
  quantityValue: {
    fontSize: "18px",
    fontWeight: "600",
    minWidth: "40px",
    textAlign: "center",
  },
  addToCartButton: {
    width: "100%",
    padding: "16px 24px",
    fontSize: "16px",
    fontWeight: "600",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    marginBottom: "12px",
  },
  outOfStockBanner: {
    width: "100%",
    padding: "16px 24px",
    fontSize: "16px",
    fontWeight: "600",
    backgroundColor: "#fef2f2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    textAlign: "center",
    marginBottom: "12px",
  },
  message: {
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    marginBottom: "16px",
    textAlign: "center",
  },
  viewCartLink: { marginBottom: "24px" },
  viewCartButton: {
    display: "block",
    width: "100%",
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: "500",
    backgroundColor: "#fff",
    color: "#374151",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    textAlign: "center",
    textDecoration: "none",
  },
  fulfillmentInfo: {
    padding: "16px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
  },
  fulfillmentTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "8px",
  },
  fulfillmentList: {
    margin: 0,
    paddingLeft: "20px",
    fontSize: "14px",
    color: "#6b7280",
    lineHeight: "1.8",
  },
  fulfillmentText: {
    fontSize: "14px",
    color: "#6b7280",
    margin: 0,
  },
};
