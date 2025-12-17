"use client";

// Copyright (c) Santa Barbara Newcomers Club
// Page editor client component with full editing capabilities

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageContent, createDefaultPageContent } from "@/lib/publishing/blocks";
import PageEditor from "@/components/editor/PageEditor";

type PageData = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  visibility: "PUBLIC" | "MEMBERS_ONLY" | "ROLE_RESTRICTED";
  content: PageContent;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: string | null;
  updatedAt: string;
  template: { id: string; name: string; slug: string } | null;
  theme: { id: string; name: string; slug: string } | null;
};

type PageEditorClientProps = {
  pageId: string;
};

export default function PageEditorClient({ pageId }: PageEditorClientProps) {
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "MEMBERS_ONLY" | "ROLE_RESTRICTED">("PUBLIC");
  const [content, setContent] = useState<PageContent>(createDefaultPageContent());

  // Preview state
  const [showPreview, setShowPreview] = useState(false);

  // Load page data
  useEffect(() => {
    async function loadPage() {
      try {
        const res = await fetch(`/api/admin/content/pages/${pageId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Page not found");
          } else {
            setError("Failed to load page");
          }
          return;
        }
        const data = await res.json();
        const p = data.page as PageData;
        setPage(p);
        setTitle(p.title);
        setSlug(p.slug);
        setDescription(p.description || "");
        setVisibility(p.visibility);
        setContent(p.content || createDefaultPageContent());
      } catch {
        setError("Failed to load page");
      } finally {
        setLoading(false);
      }
    }
    loadPage();
  }, [pageId]);

  // Track unsaved changes
  useEffect(() => {
    if (!page) return;
    const hasChanges =
      title !== page.title ||
      slug !== page.slug ||
      description !== (page.description || "") ||
      visibility !== page.visibility ||
      JSON.stringify(content) !== JSON.stringify(page.content);
    setHasUnsavedChanges(hasChanges);
  }, [page, title, slug, description, visibility, content]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleSave = useCallback(async () => {
    if (!page) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/content/pages/${pageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          description: description || null,
          visibility,
          content,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to save page");
      }

      const data = await res.json();
      setPage((prev) =>
        prev
          ? {
              ...prev,
              title: data.page.title,
              slug: data.page.slug,
              description: data.page.description,
              visibility: data.page.visibility,
              content: content,
              updatedAt: data.page.updatedAt,
            }
          : null
      );
      setHasUnsavedChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save page");
    } finally {
      setSaving(false);
    }
  }, [page, pageId, title, slug, description, visibility, content]);

  const handlePublish = useCallback(async () => {
    if (!page || hasUnsavedChanges) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/content/pages/${pageId}?action=publish`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to publish page");
      }

      const data = await res.json();
      setPage((prev) => (prev ? { ...prev, status: "PUBLISHED", publishedAt: data.page.publishedAt } : null));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish page");
    } finally {
      setSaving(false);
    }
  }, [page, pageId, hasUnsavedChanges]);

  const handleUnpublish = useCallback(async () => {
    if (!page) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/content/pages/${pageId}?action=unpublish`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to unpublish page");
      }

      setPage((prev) => (prev ? { ...prev, status: "DRAFT" } : null));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unpublish page");
    } finally {
      setSaving(false);
    }
  }, [page, pageId]);

  const handleArchive = useCallback(async () => {
    if (!page) return;
    if (!confirm("Are you sure you want to archive this page? It will no longer be visible.")) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/content/pages/${pageId}?action=archive`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to archive page");
      }

      setPage((prev) => (prev ? { ...prev, status: "ARCHIVED" } : null));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive page");
    } finally {
      setSaving(false);
    }
  }, [page, pageId]);

  const handleContentChange = useCallback((newContent: PageContent) => {
    setContent(newContent);
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "20px" }}>
        <p>Loading page...</p>
      </div>
    );
  }

  if (error && !page) {
    return (
      <div style={{ padding: "20px" }}>
        <p style={{ color: "#c00" }}>{error}</p>
        <Link href="/admin/content/pages" style={{ color: "#0066cc" }}>
          Back to pages
        </Link>
      </div>
    );
  }

  if (!page) {
    return null;
  }

  const statusBadgeStyle = {
    DRAFT: { bg: "#fff3e0", text: "#995500" },
    PUBLISHED: { bg: "#e6ffe6", text: "#006600" },
    ARCHIVED: { bg: "#f0f0f0", text: "#666666" },
  }[page.status];

  return (
    <div data-test-id="page-editor-root" style={{ padding: "20px", maxWidth: "1400px" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <Link href="/admin/content/pages" style={{ color: "#666", textDecoration: "none", fontSize: "14px" }}>
            ← Pages
          </Link>
          <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "12px", backgroundColor: statusBadgeStyle.bg, color: statusBadgeStyle.text }}>
            {page.status}
          </span>
          {hasUnsavedChanges && (
            <span style={{ fontSize: "12px", color: "#c60" }}>• Unsaved changes</span>
          )}
        </div>
        <h1 style={{ margin: "0 0 4px 0", fontSize: "24px" }}>{page.title}</h1>
        <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>URL: /{page.slug}</p>
      </div>

      {/* Action bar */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", padding: "12px 16px", backgroundColor: "#f5f5f5", borderRadius: "6px", alignItems: "center", flexWrap: "wrap" }}>
        <button data-test-id="save-page-button" onClick={handleSave} disabled={saving || !hasUnsavedChanges} style={{ padding: "8px 16px", fontSize: "14px", fontWeight: 500, backgroundColor: hasUnsavedChanges ? "#0066cc" : "#ccc", color: "#fff", border: "none", borderRadius: "4px", cursor: saving || !hasUnsavedChanges ? "not-allowed" : "pointer" }}>
          {saving ? "Saving..." : "Save"}
        </button>

        <button data-test-id="preview-page-button" onClick={() => setShowPreview(!showPreview)} style={{ padding: "8px 16px", fontSize: "14px", backgroundColor: "#fff", color: "#333", border: "1px solid #ddd", borderRadius: "4px", cursor: "pointer" }}>
          {showPreview ? "Hide Preview" : "Preview"}
        </button>

        <div style={{ flex: 1 }} />

        {page.status === "DRAFT" && (
          <button data-test-id="publish-page-button" onClick={handlePublish} disabled={saving || hasUnsavedChanges} title={hasUnsavedChanges ? "Save changes first" : "Publish page"} style={{ padding: "8px 16px", fontSize: "14px", fontWeight: 500, backgroundColor: hasUnsavedChanges ? "#ccc" : "#060", color: "#fff", border: "none", borderRadius: "4px", cursor: saving || hasUnsavedChanges ? "not-allowed" : "pointer" }}>
            Publish
          </button>
        )}

        {page.status === "PUBLISHED" && (
          <button data-test-id="unpublish-page-button" onClick={handleUnpublish} disabled={saving} style={{ padding: "8px 16px", fontSize: "14px", backgroundColor: "#fff", color: "#c60", border: "1px solid #c60", borderRadius: "4px", cursor: saving ? "not-allowed" : "pointer" }}>
            Unpublish
          </button>
        )}

        {page.status !== "ARCHIVED" && (
          <button data-test-id="archive-page-button" onClick={handleArchive} disabled={saving} style={{ padding: "8px 16px", fontSize: "14px", backgroundColor: "#fff", color: "#666", border: "1px solid #ddd", borderRadius: "4px", cursor: saving ? "not-allowed" : "pointer" }}>
            Archive
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div style={{ padding: "12px 16px", backgroundColor: "#fee", color: "#c00", borderRadius: "4px", marginBottom: "16px", fontSize: "14px" }}>
          {error}
        </div>
      )}

      {/* Preview mode */}
      {showPreview && (
        <div data-test-id="page-preview" style={{ marginBottom: "24px", border: "1px solid #ddd", borderRadius: "8px", overflow: "hidden" }}>
          <div style={{ padding: "8px 12px", backgroundColor: "#f5f5f5", borderBottom: "1px solid #ddd", fontSize: "12px", color: "#666" }}>
            Preview (live changes) — <a href={`/${slug}`} target="_blank" rel="noopener noreferrer" style={{ color: "#0066cc" }}>Open in new tab</a>
          </div>
          <iframe src={`/${slug}?preview=true`} style={{ width: "100%", height: "500px", border: "none", backgroundColor: "#fff" }} title="Page preview" />
        </div>
      )}

      {/* Page settings */}
      <div style={{ display: "flex", gap: "24px", marginBottom: "24px" }}>
        <div style={{ flex: "1 1 300px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 500, marginBottom: "4px", color: "#555" }}>Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} data-test-id="page-title-input" style={{ width: "100%", padding: "8px 10px", fontSize: "14px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box" }} />
        </div>
        <div style={{ flex: "1 1 200px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 500, marginBottom: "4px", color: "#555" }}>URL Slug</label>
          <input type="text" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} data-test-id="page-slug-input" style={{ width: "100%", padding: "8px 10px", fontSize: "14px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box", fontFamily: "monospace" }} />
        </div>
        <div style={{ flex: "1 1 150px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 500, marginBottom: "4px", color: "#555" }}>Visibility</label>
          <select value={visibility} onChange={(e) => setVisibility(e.target.value as "PUBLIC" | "MEMBERS_ONLY" | "ROLE_RESTRICTED")} data-test-id="page-visibility-select" style={{ width: "100%", padding: "8px 10px", fontSize: "14px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box", backgroundColor: "#fff" }}>
            <option value="PUBLIC">Public</option>
            <option value="MEMBERS_ONLY">Members Only</option>
            <option value="ROLE_RESTRICTED">Role Restricted</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <label style={{ display: "block", fontSize: "12px", fontWeight: 500, marginBottom: "4px", color: "#555" }}>Description (SEO)</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} data-test-id="page-description-input" style={{ width: "100%", padding: "8px 10px", fontSize: "14px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box", minHeight: "60px", resize: "vertical" }} placeholder="Brief description for search engines..." />
      </div>

      {/* Block editor */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>Page Content</h2>
        <PageEditor initialContent={content} onChange={handleContentChange} disabled={saving} />
      </div>
    </div>
  );
}
