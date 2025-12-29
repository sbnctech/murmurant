/**
 * Message Template Editor Component
 *
 * Visual editor for creating and editing email templates.
 * Supports merge fields (tokens) for personalization.
 *
 * P1.1: Message Template Editor UI
 * Charter: P6 (human-first UI), P1 (audit)
 *
 * Copyright (c) Murmurant, Inc.
 */

"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

// Available merge fields for templates
const MERGE_FIELDS = [
  { token: "{{member.firstName}}", label: "First Name", category: "Member" },
  { token: "{{member.lastName}}", label: "Last Name", category: "Member" },
  { token: "{{member.email}}", label: "Email", category: "Member" },
  { token: "{{member.fullName}}", label: "Full Name", category: "Member" },
  { token: "{{event.title}}", label: "Event Title", category: "Event" },
  { token: "{{event.date}}", label: "Event Date", category: "Event" },
  { token: "{{event.time}}", label: "Event Time", category: "Event" },
  { token: "{{event.location}}", label: "Event Location", category: "Event" },
  { token: "{{club.name}}", label: "Club Name", category: "Club" },
  { token: "{{club.email}}", label: "Club Email", category: "Club" },
  { token: "{{club.website}}", label: "Club Website", category: "Club" },
  { token: "{{today}}", label: "Today's Date", category: "System" },
  { token: "{{year}}", label: "Current Year", category: "System" },
];

// Sample data for preview
const SAMPLE_DATA: Record<string, string> = {
  "{{member.firstName}}": "Jane",
  "{{member.lastName}}": "Smith",
  "{{member.email}}": "jane.smith@example.com",
  "{{member.fullName}}": "Jane Smith",
  "{{event.title}}": "Monthly Luncheon",
  "{{event.date}}": "January 15, 2025",
  "{{event.time}}": "11:30 AM",
  "{{event.location}}": "The University Club",
  "{{club.name}}": "Santa Barbara Newcomers Club",
  "{{club.email}}": "info@sbnewcomers.org",
  "{{club.website}}": "https://sbnewcomers.org",
  "{{today}}": new Date().toLocaleDateString(),
  "{{year}}": new Date().getFullYear().toString(),
};

interface TemplateEditorProps {
  templateId?: string;
  initialData?: {
    name: string;
    slug: string;
    subject: string;
    bodyHtml: string;
    bodyText?: string;
    isActive?: boolean;
  };
}

export default function TemplateEditor({ templateId, initialData }: TemplateEditorProps) {
  const router = useRouter();
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [subject, setSubject] = useState(initialData?.subject || "");
  const [bodyHtml, setBodyHtml] = useState(initialData?.bodyHtml || "");
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeField, setActiveField] = useState<"subject" | "body">("body");

  const isEditMode = !!templateId;

  // Generate slug from name
  const handleNameChange = useCallback((value: string) => {
    setName(value);
    if (!isEditMode && !slug) {
      const newSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setSlug(newSlug);
    }
  }, [isEditMode, slug]);

  // Insert merge field at cursor position
  const insertMergeField = useCallback((token: string) => {
    if (activeField === "subject" && subjectRef.current) {
      const input = subjectRef.current;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newValue = subject.slice(0, start) + token + subject.slice(end);
      setSubject(newValue);
      // Restore focus and cursor position
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + token.length, start + token.length);
      }, 0);
    } else if (activeField === "body" && bodyRef.current) {
      const textarea = bodyRef.current;
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const newValue = bodyHtml.slice(0, start) + token + bodyHtml.slice(end);
      setBodyHtml(newValue);
      // Restore focus and cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + token.length, start + token.length);
      }, 0);
    }
  }, [activeField, subject, bodyHtml]);

  // Replace tokens with sample data for preview
  const renderPreview = useCallback((content: string) => {
    let result = content;
    for (const [token, value] of Object.entries(SAMPLE_DATA)) {
      result = result.replace(new RegExp(token.replace(/[{}]/g, "\\$&"), "g"), value);
    }
    return result;
  }, []);

  // Save template
  const handleSave = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!slug.trim()) {
      setError("Slug is required");
      return;
    }
    if (!subject.trim()) {
      setError("Subject is required");
      return;
    }
    if (!bodyHtml.trim()) {
      setError("Body content is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const url = isEditMode
        ? `/api/admin/comms/templates?id=${templateId}`
        : "/api/admin/comms/templates";

      const response = await fetch(url, {
        method: isEditMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          subject: subject.trim(),
          bodyHtml: bodyHtml.trim(),
          isActive,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to save template");
      }

      router.push("/admin/comms/templates");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  // Group merge fields by category
  const groupedFields = MERGE_FIELDS.reduce((acc, field) => {
    if (!acc[field.category]) acc[field.category] = [];
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, typeof MERGE_FIELDS>);

  return (
    <div data-test-id="template-editor" style={{ display: "flex", gap: "24px", minHeight: "calc(100vh - 200px)" }}>
      {/* Editor Panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Template Info */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: 500 }}>
              Template Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Welcome Email"
              data-test-id="template-name"
              style={{
                width: "100%",
                padding: "8px 12px",
                fontSize: "14px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: 500 }}>
              Slug *
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder="welcome-email"
              disabled={isEditMode}
              data-test-id="template-slug"
              style={{
                width: "100%",
                padding: "8px 12px",
                fontSize: "14px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                backgroundColor: isEditMode ? "#f9fafb" : "white",
              }}
            />
          </div>
        </div>

        {/* Subject Line */}
        <div>
          <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: 500 }}>
            Subject Line *
          </label>
          <input
            ref={subjectRef}
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            onFocus={() => setActiveField("subject")}
            placeholder="e.g., Welcome to {{club.name}}, {{member.firstName}}!"
            data-test-id="template-subject"
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: "14px",
              border: activeField === "subject" ? "2px solid #2563eb" : "1px solid #d1d5db",
              borderRadius: "6px",
            }}
          />
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
            Use merge fields like {"{{member.firstName}}"} for personalization
          </div>
        </div>

        {/* Body Content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: 500 }}>
            Email Body *
          </label>
          <textarea
            ref={bodyRef}
            value={bodyHtml}
            onChange={(e) => setBodyHtml(e.target.value)}
            onFocus={() => setActiveField("body")}
            placeholder={`Dear {{member.firstName}},

Welcome to {{club.name}}! We're excited to have you join our community.

Best regards,
The {{club.name}} Team`}
            data-test-id="template-body"
            style={{
              flex: 1,
              minHeight: "300px",
              padding: "12px",
              fontSize: "14px",
              fontFamily: "monospace",
              border: activeField === "body" ? "2px solid #2563eb" : "1px solid #d1d5db",
              borderRadius: "6px",
              resize: "vertical",
            }}
          />
        </div>

        {/* Status Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            data-test-id="template-active"
          />
          <label htmlFor="isActive" style={{ fontSize: "14px" }}>
            Template is active and available for use
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div
            data-test-id="template-error"
            style={{
              padding: "12px",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "6px",
              color: "#dc2626",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => router.push("/admin/comms/templates")}
            style={{
              padding: "10px 20px",
              fontSize: "14px",
              backgroundColor: "#f3f4f6",
              color: "#374151",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            style={{
              padding: "10px 20px",
              fontSize: "14px",
              backgroundColor: "#eff6ff",
              color: "#2563eb",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            {showPreview ? "Hide Preview" : "Show Preview"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            data-test-id="template-save"
            style={{
              padding: "10px 20px",
              fontSize: "14px",
              backgroundColor: saving ? "#9ca3af" : "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Saving..." : isEditMode ? "Save Changes" : "Create Template"}
          </button>
        </div>
      </div>

      {/* Sidebar: Merge Fields + Preview */}
      <div style={{ width: "320px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Merge Fields Panel */}
        <div
          style={{
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "16px",
          }}
        >
          <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>
            Insert Merge Field
          </h3>
          <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "12px" }}>
            Click to insert at cursor in {activeField === "subject" ? "subject" : "body"}
          </div>
          {Object.entries(groupedFields).map(([category, fields]) => (
            <div key={category} style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "6px", textTransform: "uppercase" }}>
                {category}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {fields.map((field) => (
                  <button
                    key={field.token}
                    type="button"
                    onClick={() => insertMergeField(field.token)}
                    title={field.token}
                    style={{
                      padding: "4px 8px",
                      fontSize: "12px",
                      backgroundColor: "white",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    {field.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div
            style={{
              flex: 1,
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ fontSize: "14px", fontWeight: 600, margin: 0 }}>Preview</h3>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setPreviewMode("desktop")}
                  style={{
                    padding: "4px 8px",
                    fontSize: "12px",
                    backgroundColor: previewMode === "desktop" ? "#2563eb" : "#f3f4f6",
                    color: previewMode === "desktop" ? "white" : "#374151",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("mobile")}
                  style={{
                    padding: "4px 8px",
                    fontSize: "12px",
                    backgroundColor: previewMode === "mobile" ? "#2563eb" : "#f3f4f6",
                    color: previewMode === "mobile" ? "white" : "#374151",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Mobile
                </button>
              </div>
            </div>
            <div
              style={{
                padding: "16px",
                maxWidth: previewMode === "mobile" ? "375px" : "100%",
                margin: previewMode === "mobile" ? "0 auto" : undefined,
              }}
            >
              <div
                style={{
                  backgroundColor: "#f3f4f6",
                  padding: "12px",
                  borderRadius: "6px",
                  marginBottom: "12px",
                }}
              >
                <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px" }}>Subject</div>
                <div style={{ fontSize: "14px", fontWeight: 500 }}>
                  {renderPreview(subject) || "(No subject)"}
                </div>
              </div>
              <div
                style={{
                  fontSize: "14px",
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap",
                }}
              >
                {renderPreview(bodyHtml) || "(No content)"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
