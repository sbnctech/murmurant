"use client";

/**
 * Create New Governance Annotation Page
 *
 * Form to create a new annotation/interpretation.
 * Requires governance:annotations:write capability.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type AnnotationTargetType = "motion" | "bylaw" | "policy" | "page" | "file" | "minutes";

const TARGET_TYPE_OPTIONS: { value: AnnotationTargetType; label: string; description: string }[] = [
  { value: "motion", label: "Motion", description: "A motion from a governance meeting" },
  { value: "bylaw", label: "Bylaw", description: "Organization bylaw section" },
  { value: "policy", label: "Policy", description: "Organization policy document" },
  { value: "minutes", label: "Minutes", description: "Meeting minutes" },
  { value: "page", label: "Page", description: "Published page on the website" },
  { value: "file", label: "File", description: "Uploaded file or document" },
];

export default function NewGovernanceAnnotationPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [body, setBody] = useState("");
  const [targetType, setTargetType] = useState<AnnotationTargetType>("motion");
  const [targetId, setTargetId] = useState("");
  const [motionId, setMotionId] = useState("");
  const [anchor, setAnchor] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!body.trim()) {
      setError("Annotation body is required");
      return;
    }

    if (!targetId.trim()) {
      setError("Target ID is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/officer/governance/annotations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: body.trim(),
          targetType,
          targetId: targetId.trim(),
          motionId: motionId.trim() || null,
          anchor: anchor.trim() || null,
          isPublished,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create annotation");
      }

      const data = await res.json();
      router.push(`/admin/governance/annotations/${data.annotation.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setSaving(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <Link href="/admin/governance/annotations" style={styles.backLink}>
          ← Back to Annotations
        </Link>
        <h1 style={styles.title}>Create New Annotation</h1>
        <p style={styles.subtitle}>Add an interpretation or note to a governance document</p>
      </div>

      {/* Error */}
      {error && <div style={styles.error}>{error}</div>}

      {/* Form */}
      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Body */}
        <div style={styles.field}>
          <label style={styles.label}>
            Annotation <span style={styles.required}>*</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your interpretation, clarification, or note here..."
            style={styles.textarea}
            rows={6}
            disabled={saving}
          />
          <p style={styles.hint}>
            Markdown formatting is supported.
          </p>
        </div>

        {/* Target Type */}
        <div style={styles.field}>
          <label style={styles.label}>
            Target Type <span style={styles.required}>*</span>
          </label>
          <div style={styles.radioGroup}>
            {TARGET_TYPE_OPTIONS.map((option) => (
              <label key={option.value} style={styles.radioLabel}>
                <input
                  type="radio"
                  name="targetType"
                  value={option.value}
                  checked={targetType === option.value}
                  onChange={(e) => setTargetType(e.target.value as AnnotationTargetType)}
                  disabled={saving}
                />
                <span style={styles.radioText}>
                  <strong>{option.label}</strong>
                  <span style={styles.radioDesc}>{option.description}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Target ID */}
        <div style={styles.field}>
          <label style={styles.label}>
            Target ID <span style={styles.required}>*</span>
          </label>
          <input
            type="text"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            placeholder="UUID of the target resource"
            style={styles.input}
            disabled={saving}
          />
          <p style={styles.hint}>
            Enter the UUID of the {targetType} you want to annotate.
          </p>
        </div>

        {/* Motion ID (optional, for motion-specific annotations) */}
        {targetType === "motion" && (
          <div style={styles.field}>
            <label style={styles.label}>Motion ID</label>
            <input
              type="text"
              value={motionId}
              onChange={(e) => setMotionId(e.target.value)}
              placeholder="UUID of the motion (if linking to a specific motion)"
              style={styles.input}
              disabled={saving}
            />
            <p style={styles.hint}>
              Optionally link this annotation directly to a motion record.
            </p>
          </div>
        )}

        {/* Anchor */}
        <div style={styles.field}>
          <label style={styles.label}>Anchor (Optional)</label>
          <input
            type="text"
            value={anchor}
            onChange={(e) => setAnchor(e.target.value)}
            placeholder="e.g., section-2, paragraph-3, article-iv"
            style={styles.input}
            disabled={saving}
          />
          <p style={styles.hint}>
            Specific location within the target document (section ID, paragraph number, etc.)
          </p>
        </div>

        {/* Publish immediately */}
        <div style={styles.field}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              disabled={saving}
            />
            <span style={styles.checkboxText}>
              Publish immediately
              <span style={styles.checkboxDesc}>
                Published annotations are visible to Board and Officers
              </span>
            </span>
          </label>
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <Link href="/admin/governance/annotations" style={styles.cancelBtn}>
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || !body.trim() || !targetId.trim()}
            style={styles.submitBtn}
          >
            {saving ? "Creating..." : "Create Annotation"}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "24px",
    maxWidth: "700px",
    margin: "0 auto",
  },
  header: {
    marginBottom: "24px",
  },
  backLink: {
    fontSize: "14px",
    color: "#6b7280",
    textDecoration: "none",
  },
  title: {
    fontSize: "24px",
    fontWeight: 600,
    margin: "8px 0 4px 0",
  },
  subtitle: {
    fontSize: "14px",
    color: "#6b7280",
    margin: 0,
  },
  error: {
    padding: "12px 16px",
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    borderRadius: "6px",
    marginBottom: "16px",
    fontSize: "14px",
  },
  form: {
    backgroundColor: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "24px",
  },
  field: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: 500,
    color: "#374151",
    marginBottom: "6px",
  },
  required: {
    color: "#dc2626",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    boxSizing: "border-box",
    resize: "vertical",
    fontFamily: "inherit",
    lineHeight: 1.6,
  },
  hint: {
    fontSize: "12px",
    color: "#9ca3af",
    marginTop: "4px",
  },
  radioGroup: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
  },
  radioLabel: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    cursor: "pointer",
    padding: "10px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
  },
  radioText: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  radioDesc: {
    fontSize: "12px",
    color: "#6b7280",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    cursor: "pointer",
    padding: "12px",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    backgroundColor: "#f9fafb",
  },
  checkboxText: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    fontSize: "14px",
    fontWeight: 500,
  },
  checkboxDesc: {
    fontSize: "12px",
    color: "#6b7280",
    fontWeight: "normal",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "24px",
    paddingTop: "24px",
    borderTop: "1px solid #e5e7eb",
  },
  cancelBtn: {
    padding: "10px 20px",
    fontSize: "14px",
    color: "#374151",
    backgroundColor: "#fff",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    textDecoration: "none",
    cursor: "pointer",
  },
  submitBtn: {
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: 500,
    color: "#fff",
    backgroundColor: "#7c3aed",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};
