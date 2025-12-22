"use client";

import { useState, useEffect } from "react";
import { formatClubDate } from "@/lib/timezone";

type PageListItem = {
  id: string;
  slug: string;
  title: string;
  status: string;
  visibility: string;
  publishedAt: string | null;
  updatedAt: string;
  hasDraftChanges: boolean;
};

type PaginatedResponse = {
  items: PageListItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

const PAGE_SIZE = 10;

function formatDate(isoString: string): string {
  return formatClubDate(new Date(isoString));
}

function getStatusBadge(status: string): { bg: string; text: string } {
  switch (status) {
    case "PUBLISHED":
      return { bg: "#e6ffe6", text: "#006600" };
    case "DRAFT":
      return { bg: "#fff3e0", text: "#995500" };
    case "ARCHIVED":
      return { bg: "#f0f0f0", text: "#666666" };
    default:
      return { bg: "#f0f0f0", text: "#333333" };
  }
}

export default function PagesTable() {
  const [pages, setPages] = useState<PageListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    async function fetchPages() {
      setLoading(true);
      try {
        let url = `/api/admin/content/pages?page=${page}&pageSize=${PAGE_SIZE}`;
        if (statusFilter) url += `&status=${statusFilter}`;

        const res = await fetch(url);
        if (res.ok) {
          const data: PaginatedResponse = await res.json();
          setPages(data.items ?? []);
          setTotalPages(data.totalPages ?? 1);
        }
      } catch {
        // Keep existing state on error
      }
      setLoading(false);
    }
    fetchPages();
  }, [page, statusFilter]);

  return (
    <>
      <div
        data-test-id="admin-pages-filters"
        style={{ marginBottom: "16px", display: "flex", gap: "12px", alignItems: "center" }}
      >
        <label>
          Status:{" "}
          <select
            data-test-id="admin-pages-status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={{ padding: "6px", fontSize: "14px" }}
          >
            <option value="">All</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>
      </div>

      <table
        data-test-id="admin-pages-table"
        style={{
          width: "100%",
          borderCollapse: "collapse",
          maxWidth: "1000px",
        }}
      >
        <thead>
          <tr>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>
              Title
            </th>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>
              Slug
            </th>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>
              Status
            </th>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>
              Published
            </th>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>
              Updated
            </th>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {pages.map((p) => {
            const statusStyle = getStatusBadge(p.status);
            const isPublished = p.status === "PUBLISHED";
            return (
              <tr key={p.id} data-test-id="admin-pages-row">
                <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                  <a
                    href={`/admin/content/pages/${p.id}`}
                    data-test-id="admin-pages-title-link"
                    style={{ color: "#0066cc", textDecoration: "none" }}
                  >
                    {p.title}
                  </a>
                </td>
                <td style={{ borderBottom: "1px solid #eee", padding: "8px", fontFamily: "monospace", fontSize: "13px" }}>
                  /{p.slug}
                </td>
                <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.text,
                    }}
                    data-test-id="admin-pages-status-badge"
                  >
                    {p.status}
                  </span>
                  {p.hasDraftChanges && (
                    <span
                      data-test-id="admin-pages-has-changes"
                      style={{
                        display: "inline-block",
                        marginLeft: "6px",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        backgroundColor: "#fff3cd",
                        color: "#856404",
                        border: "1px solid #ffc107",
                      }}
                      title="Draft has unpublished changes"
                    >
                      Has changes
                    </span>
                  )}
                </td>
                <td style={{ borderBottom: "1px solid #eee", padding: "8px", fontSize: "13px", color: "#666" }}>
                  {p.publishedAt ? formatDate(p.publishedAt) : "—"}
                </td>
                <td style={{ borderBottom: "1px solid #eee", padding: "8px", fontSize: "13px", color: "#666" }}>
                  {formatDate(p.updatedAt)}
                </td>
                <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <a
                      href={`/admin/content/pages/${p.id}`}
                      data-test-id="admin-pages-action-edit"
                      style={{ color: "#0066cc", textDecoration: "none", fontSize: "13px" }}
                    >
                      Edit
                    </a>
                    {isPublished && (
                      <a
                        href={`/pages/${p.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-test-id="admin-pages-action-view"
                        style={{ color: "#006600", textDecoration: "none", fontSize: "13px" }}
                      >
                        View
                      </a>
                    )}
                    <a
                      href={`/pages/${p.slug}/preview`}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-test-id="admin-pages-action-preview"
                      style={{ color: "#995500", textDecoration: "none", fontSize: "13px" }}
                    >
                      Preview
                    </a>
                  </div>
                </td>
              </tr>
            );
          })}
          {!loading && pages.length === 0 && (
            <tr data-test-id="admin-pages-empty-state">
              <td
                colSpan={6}
                style={{ padding: "8px", fontStyle: "italic", color: "#666" }}
              >
                No pages found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div
        data-test-id="admin-pages-pagination"
        style={{
          marginTop: "16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <button
          data-test-id="admin-pages-pagination-prev"
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
        <span data-test-id="admin-pages-pagination-label">
          Page {page} of {totalPages}
        </span>
        <button
          data-test-id="admin-pages-pagination-next"
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
