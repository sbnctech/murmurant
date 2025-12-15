"use client";

import { useState, useEffect } from "react";
import { formatClubDate } from "@/lib/timezone";

type ThemeListItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  isDefault: boolean;
  updatedAt: string;
};

function formatDate(isoString: string): string {
  return formatClubDate(new Date(isoString));
}

function getStatusBadge(status: string): { bg: string; text: string } {
  switch (status) {
    case "ACTIVE":
      return { bg: "#e6ffe6", text: "#006600" };
    case "DRAFT":
      return { bg: "#fff3e0", text: "#995500" };
    case "ARCHIVED":
      return { bg: "#f0f0f0", text: "#666666" };
    default:
      return { bg: "#f0f0f0", text: "#333333" };
  }
}

export default function ThemesTable() {
  const [themes, setThemes] = useState<ThemeListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchThemes() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/content/themes");
        if (res.ok) {
          const data = await res.json();
          setThemes(data.themes ?? []);
        }
      } catch {
        // Keep existing state on error
      }
      setLoading(false);
    }
    fetchThemes();
  }, []);

  return (
    <table
      data-test-id="admin-themes-table"
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
            Status
          </th>
          <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>
            Default
          </th>
          <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>
            Updated
          </th>
        </tr>
      </thead>
      <tbody>
        {themes.map((theme) => {
          const statusStyle = getStatusBadge(theme.status);
          return (
            <tr key={theme.id} data-test-id="admin-themes-row">
              <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                <a
                  href={`/admin/content/themes/${theme.id}`}
                  data-test-id="admin-themes-name-link"
                  style={{ color: "#0066cc", textDecoration: "none" }}
                >
                  {theme.name}
                </a>
                {theme.description && (
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                    {theme.description}
                  </div>
                )}
              </td>
              <td style={{ borderBottom: "1px solid #eee", padding: "8px", fontFamily: "monospace", fontSize: "13px" }}>
                {theme.slug}
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
                >
                  {theme.status}
                </span>
              </td>
              <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                {theme.isDefault && (
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      backgroundColor: "#e6f0ff",
                      color: "#0066cc",
                    }}
                  >
                    Default
                  </span>
                )}
              </td>
              <td style={{ borderBottom: "1px solid #eee", padding: "8px", fontSize: "13px", color: "#666" }}>
                {formatDate(theme.updatedAt)}
              </td>
            </tr>
          );
        })}
        {!loading && themes.length === 0 && (
          <tr data-test-id="admin-themes-empty-state">
            <td
              colSpan={5}
              style={{ padding: "8px", fontStyle: "italic", color: "#666" }}
            >
              No themes found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
