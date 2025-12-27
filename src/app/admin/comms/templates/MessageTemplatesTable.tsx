"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatClubDate } from "@/lib/timezone";

type MessageTemplateListItem = {
  id: string;
  name: string;
  slug: string;
  type: string;
  subject: string | null;
  isActive: boolean;
  updatedAt: string;
  timesUsed?: number;
  description?: string;
};

function formatDate(isoString: string): string {
  return formatClubDate(new Date(isoString));
}

export default function MessageTemplatesTable() {
  const [templates, setTemplates] = useState<MessageTemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [previewTemplate, setPreviewTemplate] = useState<MessageTemplateListItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<MessageTemplateListItem | null>(null);

  const handleDuplicate = (template: MessageTemplateListItem) => {
    alert(`Demo: Template "${template.name}" would be duplicated`);
  };

  const handleDelete = (template: MessageTemplateListItem) => {
    setTemplates(templates.filter((t) => t.id !== template.id));
    setDeleteConfirm(null);
    alert(`Template "${template.name}" deleted.`);
  };

  useEffect(() => {
    async function fetchTemplates() {
      setLoading(true);
      try {
        let url = "/api/admin/comms/templates";
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
        data-test-id="admin-msg-templates-filters"
        style={{ marginBottom: "16px", display: "flex", gap: "12px", alignItems: "center" }}
      >
        <label>
          Type:{" "}
          <select
            data-test-id="admin-msg-templates-type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ padding: "6px", fontSize: "14px" }}
          >
            <option value="">All</option>
            <option value="EMAIL">Email</option>
            <option value="SMS">SMS</option>
          </select>
        </label>
      </div>

      <table
        data-test-id="admin-msg-templates-table"
        style={{
          width: "100%",
          borderCollapse: "collapse",
          maxWidth: "1100px",
        }}
      >
        <thead>
          <tr>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>
              Name
            </th>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>
              Subject
            </th>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>
              Type
            </th>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>
              Status
            </th>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>
              Used
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
          {templates.map((template) => (
            <tr key={template.id} data-test-id="admin-msg-templates-row">
              <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                <Link
                  href={`/admin/comms/templates/${template.id}`}
                  data-test-id="admin-msg-templates-name-link"
                  style={{ color: "#0066cc", textDecoration: "none", fontWeight: 500 }}
                >
                  {template.name}
                </Link>
                {template.description && (
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
                    {template.description}
                  </div>
                )}
              </td>
              <td style={{ borderBottom: "1px solid #eee", padding: "8px", fontSize: "13px", color: "#666" }}>
                {template.subject || "-"}
              </td>
              <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    backgroundColor: template.type === "EMAIL" ? "#e6f0ff" : "#e6fff0",
                    color: template.type === "EMAIL" ? "#0066cc" : "#006633",
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
                {template.timesUsed ?? 0} times
              </td>
              <td style={{ borderBottom: "1px solid #eee", padding: "8px", fontSize: "13px", color: "#666" }}>
                {formatDate(template.updatedAt)}
              </td>
              <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={() => setPreviewTemplate(template)}
                    data-test-id={`preview-${template.id}`}
                    style={{
                      padding: "4px 10px",
                      fontSize: "12px",
                      backgroundColor: "#f3f4f6",
                      color: "#374151",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Preview
                  </button>
                  <Link
                    href={`/admin/comms/templates/${template.id}/edit`}
                    data-test-id={`edit-${template.id}`}
                    style={{
                      padding: "4px 10px",
                      fontSize: "12px",
                      backgroundColor: "#eff6ff",
                      color: "#2563eb",
                      borderRadius: "4px",
                      textDecoration: "none",
                    }}
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDuplicate(template)}
                    data-test-id={`duplicate-${template.id}`}
                    style={{
                      padding: "4px 10px",
                      fontSize: "12px",
                      backgroundColor: "#f0fdf4",
                      color: "#16a34a",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(template)}
                    data-test-id={`delete-${template.id}`}
                    style={{
                      padding: "4px 10px",
                      fontSize: "12px",
                      backgroundColor: "#fef2f2",
                      color: "#dc2626",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!loading && templates.length === 0 && (
            <tr data-test-id="admin-msg-templates-empty-state">
              <td
                colSpan={7}
                style={{ padding: "8px", fontStyle: "italic", color: "#666" }}
              >
                No message templates found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Preview Modal */}
      {previewTemplate && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setPreviewTemplate(null)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              maxWidth: "600px",
              width: "100%",
              padding: "24px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0 }}>Template Preview</h2>
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                style={{ padding: "6px 12px", fontSize: "14px", backgroundColor: "#f3f4f6", border: "none", borderRadius: "4px", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "12px", color: "#666" }}>Template Name</div>
              <div style={{ fontSize: "16px", fontWeight: 600 }}>{previewTemplate.name}</div>
            </div>
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "12px", color: "#666" }}>Subject</div>
              <div style={{ fontSize: "14px" }}>{previewTemplate.subject || "-"}</div>
            </div>
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Body Preview</div>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "16px", backgroundColor: "#f9fafb", minHeight: "150px" }}>
                <p style={{ margin: 0, fontSize: "14px", color: "#4b5563" }}>
                  Dear {"{{member.firstName}}"},<br /><br />
                  This is a preview of the template content.<br /><br />
                  Best regards,<br />
                  Santa Barbara Newcomers Club
                </p>
              </div>
            </div>
            <div style={{ fontSize: "13px", color: "#666" }}>
              Type: {previewTemplate.type} | Used: {previewTemplate.timesUsed ?? 0} times | Updated: {formatDate(previewTemplate.updatedAt)}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              maxWidth: "420px",
              width: "100%",
              padding: "24px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Delete Template?</h3>
            <p style={{ fontSize: "14px", color: "#4b5563", marginBottom: "8px" }}>
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
            </p>
            <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "20px" }}>
              This template has been used {deleteConfirm.timesUsed ?? 0} times. This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                style={{ flex: 1, padding: "10px 16px", fontSize: "14px", backgroundColor: "#f3f4f6", color: "#374151", border: "none", borderRadius: "8px", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirm)}
                style={{ flex: 1, padding: "10px 16px", fontSize: "14px", backgroundColor: "#dc2626", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}
              >
                Delete Template
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
