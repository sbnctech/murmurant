"use client";

// Copyright © 2025 Murmurant, Inc.. All rights reserved.

import { useState } from "react";
import { useRouter } from "next/navigation";

type ProductFormData = {
  name: string;
  slug: string;
  description: string;
  type: "PHYSICAL" | "DIGITAL";
  priceCents: number;
  comparePriceCents: number | null;
  imageUrl: string;
  isActive: boolean;
  isPublic: boolean;
  allowsShipping: boolean;
  allowsPickup: boolean;
  trackInventory: boolean;
  quantity: number;
  lowStockThreshold: number | null;
  digitalAssetUrl: string;
  downloadLimit: number | null;
};

type ProductFormProps = {
  mode: "create" | "edit";
  initialData?: Partial<ProductFormData>;
  productId?: string;
};

const defaultFormData: ProductFormData = {
  name: "",
  slug: "",
  description: "",
  type: "PHYSICAL",
  priceCents: 0,
  comparePriceCents: null,
  imageUrl: "",
  isActive: true,
  isPublic: true,
  allowsShipping: true,
  allowsPickup: false,
  trackInventory: true,
  quantity: 0,
  lowStockThreshold: null,
  digitalAssetUrl: "",
  downloadLimit: null,
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export default function ProductForm({
  mode,
  initialData,
  productId,
}: ProductFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<ProductFormData>({
    ...defaultFormData,
    ...initialData,
  });
  const [priceDisplay, setPriceDisplay] = useState(
    initialData?.priceCents ? (initialData.priceCents / 100).toFixed(2) : ""
  );
  const [comparePriceDisplay, setComparePriceDisplay] = useState(
    initialData?.comparePriceCents
      ? (initialData.comparePriceCents / 100).toFixed(2)
      : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      // Auto-generate slug if in create mode and slug hasn't been manually edited
      slug: mode === "create" && prev.slug === generateSlug(prev.name)
        ? generateSlug(name)
        : prev.slug,
    }));
  };

  const handlePriceChange = (value: string) => {
    setPriceDisplay(value);
    const cents = Math.round(parseFloat(value || "0") * 100);
    setFormData((prev) => ({
      ...prev,
      priceCents: isNaN(cents) ? 0 : cents,
    }));
  };

  const handleComparePriceChange = (value: string) => {
    setComparePriceDisplay(value);
    if (value === "") {
      setFormData((prev) => ({ ...prev, comparePriceCents: null }));
    } else {
      const cents = Math.round(parseFloat(value) * 100);
      setFormData((prev) => ({
        ...prev,
        comparePriceCents: isNaN(cents) ? null : cents,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url =
        mode === "create"
          ? "/api/admin/store/products"
          : `/api/admin/store/products/${productId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          slug: formData.slug || generateSlug(formData.name),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save product");
      }

      router.push("/admin/store/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "8px 12px",
    fontSize: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    marginTop: "4px",
  };

  const labelStyle = {
    display: "block",
    fontSize: "14px",
    fontWeight: 500 as const,
    color: "#374151",
    marginBottom: "4px",
  };

  const fieldGroupStyle = {
    marginBottom: "20px",
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "600px" }}>
      {error && (
        <div
          data-test-id="product-form-error"
          style={{
            padding: "12px 16px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "6px",
            color: "#991b1b",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>
          Product Name *
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            data-test-id="product-form-name"
            style={inputStyle}
            placeholder="Club T-Shirt"
          />
        </label>
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>
          Slug
          <input
            type="text"
            value={formData.slug}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, slug: e.target.value }))
            }
            data-test-id="product-form-slug"
            style={inputStyle}
            placeholder="club-t-shirt"
          />
        </label>
        <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
          URL-friendly identifier. Auto-generated if left blank.
        </p>
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>
          Description
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            data-test-id="product-form-description"
            style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
            placeholder="Describe the product..."
          />
        </label>
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>
          Product Type *
          <select
            value={formData.type}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                type: e.target.value as "PHYSICAL" | "DIGITAL",
              }))
            }
            data-test-id="product-form-type"
            style={inputStyle}
          >
            <option value="PHYSICAL">Physical (requires shipping/pickup)</option>
            <option value="DIGITAL">Digital (download)</option>
          </select>
        </label>
      </div>

      <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>
            Price ($) *
            <input
              type="number"
              step="0.01"
              min="0"
              value={priceDisplay}
              onChange={(e) => handlePriceChange(e.target.value)}
              required
              data-test-id="product-form-price"
              style={inputStyle}
              placeholder="25.00"
            />
          </label>
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>
            Compare at Price ($)
            <input
              type="number"
              step="0.01"
              min="0"
              value={comparePriceDisplay}
              onChange={(e) => handleComparePriceChange(e.target.value)}
              data-test-id="product-form-compare-price"
              style={inputStyle}
              placeholder="35.00"
            />
          </label>
          <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
            Original price for sale display
          </p>
        </div>
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>
          Image URL
          <input
            type="url"
            value={formData.imageUrl}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))
            }
            data-test-id="product-form-image"
            style={inputStyle}
            placeholder="https://..."
          />
        </label>
      </div>

      {formData.type === "PHYSICAL" && (
        <>
          <div
            style={{
              ...fieldGroupStyle,
              padding: "16px",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 600 }}>
              Inventory
            </h3>
            <label
              style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}
            >
              <input
                type="checkbox"
                checked={formData.trackInventory}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    trackInventory: e.target.checked,
                  }))
                }
                data-test-id="product-form-track-inventory"
              />
              <span style={{ fontSize: "14px" }}>Track inventory</span>
            </label>

            {formData.trackInventory && (
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>
                    Quantity
                    <input
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          quantity: parseInt(e.target.value) || 0,
                        }))
                      }
                      data-test-id="product-form-quantity"
                      style={inputStyle}
                    />
                  </label>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>
                    Low Stock Alert
                    <input
                      type="number"
                      min="0"
                      value={formData.lowStockThreshold ?? ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          lowStockThreshold: e.target.value
                            ? parseInt(e.target.value)
                            : null,
                        }))
                      }
                      data-test-id="product-form-low-stock"
                      style={inputStyle}
                      placeholder="5"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              ...fieldGroupStyle,
              padding: "16px",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 600 }}>
              Fulfillment Options
            </h3>
            <label
              style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}
            >
              <input
                type="checkbox"
                checked={formData.allowsShipping}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    allowsShipping: e.target.checked,
                  }))
                }
                data-test-id="product-form-allows-shipping"
              />
              <span style={{ fontSize: "14px" }}>Shipping available</span>
            </label>
            <label
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <input
                type="checkbox"
                checked={formData.allowsPickup}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    allowsPickup: e.target.checked,
                  }))
                }
                data-test-id="product-form-allows-pickup"
              />
              <span style={{ fontSize: "14px" }}>Pickup available</span>
            </label>
          </div>
        </>
      )}

      {formData.type === "DIGITAL" && (
        <div
          style={{
            ...fieldGroupStyle,
            padding: "16px",
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
          }}
        >
          <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 600 }}>
            Digital Delivery
          </h3>
          <div style={{ marginBottom: "12px" }}>
            <label style={labelStyle}>
              Download URL
              <input
                type="url"
                value={formData.digitalAssetUrl}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    digitalAssetUrl: e.target.value,
                  }))
                }
                data-test-id="product-form-digital-url"
                style={inputStyle}
                placeholder="https://storage.example.com/file.pdf"
              />
            </label>
          </div>
          <div>
            <label style={labelStyle}>
              Download Limit
              <input
                type="number"
                min="1"
                value={formData.downloadLimit ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    downloadLimit: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  }))
                }
                data-test-id="product-form-download-limit"
                style={inputStyle}
                placeholder="Unlimited"
              />
            </label>
            <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
              Leave blank for unlimited downloads
            </p>
          </div>
        </div>
      )}

      <div
        style={{
          ...fieldGroupStyle,
          padding: "16px",
          backgroundColor: "#f9fafb",
          borderRadius: "8px",
        }}
      >
        <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 600 }}>
          Visibility
        </h3>
        <label
          style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}
        >
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
            }
            data-test-id="product-form-is-active"
          />
          <span style={{ fontSize: "14px" }}>Active (visible in admin)</span>
        </label>
        <label
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <input
            type="checkbox"
            checked={formData.isPublic}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, isPublic: e.target.checked }))
            }
            data-test-id="product-form-is-public"
          />
          <span style={{ fontSize: "14px" }}>Public (visible in store)</span>
        </label>
      </div>

      <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
        <button
          type="submit"
          disabled={saving}
          data-test-id="product-form-submit"
          style={{
            padding: "10px 20px",
            backgroundColor: saving ? "#9ca3af" : "#16a34a",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving
            ? "Saving..."
            : mode === "create"
            ? "Create Product"
            : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/store/products")}
          data-test-id="product-form-cancel"
          style={{
            padding: "10px 20px",
            backgroundColor: "#fff",
            color: "#374151",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
