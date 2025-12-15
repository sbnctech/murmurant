"use client";

import { useState, useEffect } from "react";

type MailingListItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  allowUnsubscribe: boolean;
  subscriberCount: number;
  audienceRule: { id: string; name: string } | null;
  updatedAt: string;
};

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function MailingListsTable() {
  const [lists, setLists] = useState<MailingListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLists() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/comms/lists");
        if (res.ok) {
          const data = await res.json();
          setLists(data.lists ?? []);
        }
      } catch {
        // Keep existing state on error
      }
      setLoading(false);
    }
    fetchLists();
  }, []);

  return (
    <table
      data-test-id="admin-mailing-lists-table"
      style={{
        width: "100%",
        borderCollapse: "collapse",
        maxWidth: "1000px",
      }}
    >
      <thead>
        <tr>
          <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>
            Name
          </th>
          <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>
            Subscribers
          </th>
          <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>
            Audience rule
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
        {lists.map((list) => (
          <tr key={list.id} data-test-id="admin-mailing-lists-row">
            <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
              <a
                href={`/admin/comms/lists/${list.id}`}
                data-test-id="admin-mailing-lists-name-link"
                style={{ color: "#0066cc", textDecoration: "none" }}
              >
                {list.name}
              </a>
              {list.description && (
                <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                  {list.description}
                </div>
              )}
            </td>
            <td style={{ borderBottom: "1px solid #eee", padding: "8px", fontWeight: 600 }}>
              {list.subscriberCount.toLocaleString()}
            </td>
            <td style={{ borderBottom: "1px solid #eee", padding: "8px", fontSize: "13px" }}>
              {list.audienceRule ? (
                <a
                  href={`/admin/comms/audience-rules/${list.audienceRule.id}`}
                  style={{ color: "#0066cc", textDecoration: "none" }}
                >
                  {list.audienceRule.name}
                </a>
              ) : (
                <span style={{ color: "#999" }}>None</span>
              )}
            </td>
            <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  backgroundColor: list.isActive ? "#e6ffe6" : "#f0f0f0",
                  color: list.isActive ? "#006600" : "#666666",
                }}
              >
                {list.isActive ? "Active" : "Inactive"}
              </span>
            </td>
            <td style={{ borderBottom: "1px solid #eee", padding: "8px", fontSize: "13px", color: "#666" }}>
              {formatDate(list.updatedAt)}
            </td>
          </tr>
        ))}
        {!loading && lists.length === 0 && (
          <tr data-test-id="admin-mailing-lists-empty-state">
            <td
              colSpan={5}
              style={{ padding: "8px", fontStyle: "italic", color: "#666" }}
            >
              No mailing lists found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
