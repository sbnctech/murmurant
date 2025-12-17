"use client";

// Copyright (c) Santa Barbara Newcomers Club
// Create new page route

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageContent, createDefaultPageContent } from "@/lib/publishing/blocks";
import PageEditor from "@/components/editor/PageEditor";

export default function AdminNewPagePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "MEMBERS_ONLY" | "ROLE_RESTRICTED">("PUBLIC");
  const [content, setContent] = useState<PageContent>(createDefaultPageContent());

  // Auto-generate slug from title
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    // Only auto-generate if slug hasn't been manually edited
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(newTitle));
    }
  };

  const handleCreate = useCallback(async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!slug.trim()) {
      setError("URL slug is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/content/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          visibility,
          content,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create page");
      }

      const data = await res.json();
      router.push(`/admin/content/pages/${data.page.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create page");
      setSaving(false);
    }
  }, [title, slug, description, visibility, content, router]);

  const handleContentChange = useCallback((newContent: PageContent) => {
    setContent(newContent);
  }, []);

  return (
    <div data-test-id="new-page-root" style={{ padding: "20px", maxWidth: "1400px" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <Link href="/admin/content/pages" style={{ color: "#666", textDecoration: "none", fontSize: "14px" }}>
          ← Pages
        </Link>
        <h1 style={{ margin: "8px 0 0 0", fontSize: "24px" }}>Create New Page</h1>
      </div>

      {/* Action bar */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", padding: "12px 16px", backgroundColor: "#f5f5f5", borderRadius: "6px", alignItems: "center" }}>
        <button data-test-id="create-page-button" onClick={handleCreate} disabled={saving || !title.trim() || !slug.trim()} style={{ padding: "8px 16px", fontSize: "14px", fontWeight: 500, backgroundColor: !title.trim() || !slug.trim() ? "#ccc" : "#0066cc", color: "#fff", border: "none", borderRadius: "4px", cursor: saving || !title.trim() || !slug.trim() ? "not-allowed" : "pointer" }}>
          {saving ? "Creating..." : "Create Page"}
        </button>
        <span style={{ fontSize: "13px", color: "#666" }}>Page will be created as Draft</span>
      </div>

      {/* Error message */}
      {error && (
        <div style={{ padding: "12px 16px", backgroundColor: "#fee", color: "#c00", borderRadius: "4px", marginBottom: "16px", fontSize: "14px" }}>
          {error}
        </div>
      )}

      {/* Page settings */}
      <div style={{ display: "flex", gap: "24px", marginBottom: "24px" }}>
        <div style={{ flex: "1 1 300px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 500, marginBottom: "4px", color: "#555" }}>
            Title <span style={{ color: "#c00" }}>*</span>
          </label>
          <input type="text" value={title} onChange={(e) => handleTitleChange(e.target.value)} data-test-id="new-page-title-input" placeholder="Page title" style={{ width: "100%", padding: "8px 10px", fontSize: "14px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box" }} />
        </div>
        <div style={{ flex: "1 1 200px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 500, marginBottom: "4px", color: "#555" }}>
            URL Slug <span style={{ color: "#c00" }}>*</span>
          </label>
          <input type="text" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} data-test-id="new-page-slug-input" placeholder="page-url" style={{ width: "100%", padding: "8px 10px", fontSize: "14px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box", fontFamily: "monospace" }} />
        </div>
        <div style={{ flex: "1 1 150px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 500, marginBottom: "4px", color: "#555" }}>Visibility</label>
          <select value={visibility} onChange={(e) => setVisibility(e.target.value as "PUBLIC" | "MEMBERS_ONLY" | "ROLE_RESTRICTED")} data-test-id="new-page-visibility-select" style={{ width: "100%", padding: "8px 10px", fontSize: "14px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box", backgroundColor: "#fff" }}>
            <option value="PUBLIC">Public</option>
            <option value="MEMBERS_ONLY">Members Only</option>
            <option value="ROLE_RESTRICTED">Role Restricted</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <label style={{ display: "block", fontSize: "12px", fontWeight: 500, marginBottom: "4px", color: "#555" }}>Description (SEO)</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} data-test-id="new-page-description-input" style={{ width: "100%", padding: "8px 10px", fontSize: "14px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box", minHeight: "60px", resize: "vertical" }} placeholder="Brief description for search engines..." />
      </div>

      {/* Block editor */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>Page Content</h2>
        <PageEditor initialContent={content} onChange={handleContentChange} disabled={saving} />
      </div>
    </div>
  );
}

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 50);
}
