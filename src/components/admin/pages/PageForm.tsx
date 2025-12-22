/**
 * PageForm - Form for creating/editing content pages
 *
 * Features:
 * - Basic page fields (title, slug, description)
 * - Visibility settings
 * - Breadcrumb editor (explicit opt-in)
 * - SEO fields
 *
 * Charter: N4 (no hidden rules), P5 (visible state)
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

"use client";

import React, { useState } from "react";
import BreadcrumbEditor, {
  BreadcrumbItem,
  validateBreadcrumbs,
} from "./BreadcrumbEditor";

export interface PageFormData {
  title: string;
  slug: string;
  description: string;
  visibility: "PUBLIC" | "MEMBERS_ONLY" | "ROLE_RESTRICTED";
  breadcrumb: BreadcrumbItem[] | null;
  seoTitle: string;
  seoDescription: string;
}

interface PageFormProps {
  initialData?: Partial<PageFormData>;
  onSubmit: (data: PageFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

const defaultData: PageFormData = {
  title: "",
  slug: "",
  description: "",
  visibility: "PUBLIC",
  breadcrumb: null, // OFF by default
  seoTitle: "",
  seoDescription: "",
};

const styles = {
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "20px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
  },
  label: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#374151",
  },
  required: {
    color: "#dc2626",
    marginLeft: "2px",
  },
  optional: {
    color: "#9ca3af",
    fontWeight: 400,
    marginLeft: "4px",
    fontSize: "12px",
  },
  input: {
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  },
  inputError: {
    borderColor: "#ef4444",
  },
  textarea: {
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
    minHeight: "80px",
    resize: "vertical" as const,
    fontFamily: "inherit",
  },
  select: {
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    outline: "none",
    backgroundColor: "#fff",
    cursor: "pointer",
  },
  helpText: {
    fontSize: "12px",
    color: "#6b7280",
    marginTop: "2px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#1f2937",
    marginBottom: "8px",
    paddingTop: "16px",
    borderTop: "1px solid #e5e7eb",
  },
  buttonRow: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
    paddingTop: "16px",
    borderTop: "1px solid #e5e7eb",
  },
  button: {
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: 500,
    borderRadius: "6px",
    cursor: "pointer",
    border: "none",
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
    color: "#374151",
    border: "1px solid #d1d5db",
  },
  submitButton: {
    backgroundColor: "#2563eb",
    color: "#fff",
  },
  submitButtonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  error: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "6px",
    padding: "12px",
    color: "#dc2626",
    fontSize: "14px",
  },
  row: {
    display: "flex",
    gap: "16px",
  },
  halfWidth: {
    flex: 1,
  },
};

export default function PageForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Create Page",
}: PageFormProps) {
  const [formData, setFormData] = useState<PageFormData>({
    ...defaultData,
    ...initialData,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Auto-format slug: lowercase, replace spaces with dashes, remove special chars
    const raw = e.target.value;
    const formatted = raw
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    setFormData((prev) => ({ ...prev, slug: formatted }));
    setError(null);
  };

  const handleBreadcrumbChange = (value: BreadcrumbItem[] | null) => {
    setFormData((prev) => ({ ...prev, breadcrumb: value }));
    setError(null);
  };

  const validate = (): string | null => {
    if (!formData.title.trim()) {
      return "Title is required";
    }
    if (!formData.slug.trim()) {
      return "Slug is required";
    }
    if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      return "Slug must contain only lowercase letters, numbers, and dashes";
    }

    // Validate breadcrumbs
    const breadcrumbError = validateBreadcrumbs(formData.breadcrumb);
    if (breadcrumbError) {
      return breadcrumbError;
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form} data-test-id="page-form">
      {/* Error display */}
      {error && (
        <div style={styles.error} data-test-id="page-form-error">
          {error}
        </div>
      )}

      {/* Basic fields */}
      <div style={styles.row}>
        <div style={{ ...styles.fieldGroup, ...styles.halfWidth }}>
          <label style={styles.label}>
            Title<span style={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="About Us"
            style={styles.input}
            data-test-id="page-title-input"
          />
        </div>

        <div style={{ ...styles.fieldGroup, ...styles.halfWidth }}>
          <label style={styles.label}>
            Slug<span style={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="slug"
            value={formData.slug}
            onChange={handleSlugChange}
            placeholder="about-us"
            style={styles.input}
            data-test-id="page-slug-input"
          />
          <span style={styles.helpText}>URL path: /{formData.slug || "..."}</span>
        </div>
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>
          Description<span style={styles.optional}>(optional)</span>
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Brief description of the page content"
          style={styles.textarea}
          data-test-id="page-description-input"
        />
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>Visibility</label>
        <select
          name="visibility"
          value={formData.visibility}
          onChange={handleChange}
          style={styles.select}
          data-test-id="page-visibility-select"
        >
          <option value="PUBLIC">Public - Anyone can view</option>
          <option value="MEMBERS_ONLY">Members Only</option>
          <option value="ROLE_RESTRICTED">Role Restricted</option>
        </select>
      </div>

      {/* Breadcrumb section */}
      <div>
        <h3 style={styles.sectionTitle}>Navigation</h3>
        <BreadcrumbEditor
          value={formData.breadcrumb}
          onChange={handleBreadcrumbChange}
          disabled={isSubmitting}
        />
      </div>

      {/* SEO section */}
      <div>
        <h3 style={styles.sectionTitle}>SEO Settings</h3>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>
            SEO Title<span style={styles.optional}>(optional)</span>
          </label>
          <input
            type="text"
            name="seoTitle"
            value={formData.seoTitle}
            onChange={handleChange}
            placeholder="Override page title for search engines"
            style={styles.input}
            data-test-id="page-seo-title-input"
          />
        </div>

        <div style={{ ...styles.fieldGroup, marginTop: "12px" }}>
          <label style={styles.label}>
            SEO Description<span style={styles.optional}>(optional)</span>
          </label>
          <textarea
            name="seoDescription"
            value={formData.seoDescription}
            onChange={handleChange}
            placeholder="Meta description for search results"
            style={{ ...styles.textarea, minHeight: "60px" }}
            data-test-id="page-seo-description-input"
          />
        </div>
      </div>

      {/* Buttons */}
      <div style={styles.buttonRow}>
        <button
          type="button"
          onClick={onCancel}
          style={{ ...styles.button, ...styles.cancelButton }}
          disabled={isSubmitting}
          data-test-id="page-form-cancel"
        >
          Cancel
        </button>
        <button
          type="submit"
          style={{
            ...styles.button,
            ...styles.submitButton,
            ...(isSubmitting ? styles.submitButtonDisabled : {}),
          }}
          disabled={isSubmitting}
          data-test-id="page-form-submit"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
