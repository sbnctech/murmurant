"use client";

import { useState, useEffect } from "react";
import { formatClubDate } from "@/lib/timezone";

type TemplateListItem = {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string | null;
  schemaVersion: number;
  isActive: boolean;
  updatedAt: string;
};

function formatDate(isoString: string): string {
  return formatClubDate(new Date(isoString));
}

export default function TemplatesTable() {
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("");

  useEffect(() => {
    async function fetchTemplates() {
      setLoading(true);
      try {
        let url = "/api/admin/content/templates";
        if (typeFilter) url += `?type=${typeFilter}`;

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setTemplates(data.templates ?? []);
        }
      } catch {
        // Keep existing state on error
      }
      setLoading(false);
    }
    fetchTemplates();
  }, [typeFilter]);

  return (
    <>
      <div
        data-test-id="admin-templates-filters"
        style={{ marginBottom: "16px", display: "flex", gap: "12px", alignItems: "center" }}
      >
        <label>
          Type:{" "}
          <select
            data-test-id="admin-templates-type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ padding: "6px", fontSize: "14px" }}
          >
            <option value="">All</option>
            <option value="PAGE">Page</option>
            <option value="EMAIL">Email</option>
          </select>
        </label>
      </div>

      <table
        data-test-id="admin-templates-table"
        style={{
          width: "100%",
          borderCollapse: "collapse",
          maxWidth: "900px",
        }}
      >
        <thead>
          <tr>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>
              Name
            </th>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>
              Slug
            </th>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>
              Type
            </th>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>
              Status
            </th>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>
              Updated
            </th>
          </tr>
        </thead>
        <tbody>
          {templates.map((template) => (
            <tr key={template.id} data-test-id="admin-templates-row">
              <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                <a
                  href={`/admin/content/templates/${template.id}`}
                  data-test-id="admin-templates-name-link"
                  style={{ color: "#0066cc", textDecoration: "none" }}
                >
                  {template.name}
                </a>
                {template.description && (
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                    {template.description}
                  </div>
                )}
              </td>
              <td style={{ borderBottom: "1px solid #eee", padding: "8px", fontFamily: "monospace", fontSize: "13px" }}>
                {template.slug}
              </td>
              <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    backgroundColor: template.type === "PAGE" ? "#e6f0ff" : "#f0e6ff",
                    color: template.type === "PAGE" ? "#0066cc" : "#6600cc",
                  }}
                >
                  {template.type}
                </span>
              </td>
              <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    backgroundColor: template.isActive ? "#e6ffe6" : "#f0f0f0",
                    color: template.isActive ? "#006600" : "#666666",
                  }}
                >
                  {template.isActive ? "Active" : "Inactive"}
                </span>
              </td>
              <td style={{ borderBottom: "1px solid #eee", padding: "8px", fontSize: "13px", color: "#666" }}>
                {formatDate(template.updatedAt)}
              </td>
            </tr>
          ))}
          {!loading && templates.length === 0 && (
            <tr data-test-id="admin-templates-empty-state">
              <td
                colSpan={5}
                style={{ padding: "8px", fontStyle: "italic", color: "#666" }}
              >
                No templates found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
