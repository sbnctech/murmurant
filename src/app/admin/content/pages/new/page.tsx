/**
 * Create New Page
 *
 * URL: /admin/content/pages/new
 *
 * Admin form for creating a new content page with:
 * - Basic fields (title, slug, description)
 * - Visibility settings
 * - Breadcrumb editor (explicit opt-in)
 * - SEO settings
 *
 * Charter: P5 (visible state), N4 (no hidden rules)
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import PageForm, { PageFormData } from "@/components/admin/pages/PageForm";

export default function NewPagePage() {
  const router = useRouter();

  const handleSubmit = async (data: PageFormData) => {
    const body = {
      title: data.title.trim(),
      slug: data.slug.trim(),
      description: data.description.trim() || null,
      visibility: data.visibility,
      breadcrumb: data.breadcrumb, // null if disabled, array if enabled
      seoTitle: data.seoTitle.trim() || null,
      seoDescription: data.seoDescription.trim() || null,
      status: "DRAFT",
      content: { schemaVersion: 1, layout: "default", regions: [] },
    };

    const res = await fetch("/api/admin/content/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || "Failed to create page");
    }

    const result = await res.json();
    router.push(`/admin/content/pages/${result.page?.id || result.id}`);
  };

  const handleCancel = () => {
    router.push("/admin/content/pages");
  };

  return (
    <div data-test-id="admin-page-new" style={{ padding: "20px", maxWidth: "800px" }}>
      {/* Breadcrumb navigation */}
      <nav style={{ marginBottom: "16px", fontSize: "14px" }}>
        <Link href="/admin/content/pages" style={{ color: "#6b7280", textDecoration: "none" }}>
          Pages
        </Link>
        <span style={{ margin: "0 8px", color: "#9ca3af" }}>/</span>
        <span style={{ color: "#1f2937" }}>New Page</span>
      </nav>

      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 8px 0", color: "#1f2937" }}>
          Create New Page
        </h1>
        <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
          Create a new content page. The page will be saved as a draft until published.
        </p>
      </div>

      {/* Form */}
      <div
        style={{
          backgroundColor: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "24px",
        }}
      >
        <PageForm onSubmit={handleSubmit} onCancel={handleCancel} submitLabel="Create Page" />
      </div>
    </div>
  );
}
