"use client";

/**
 * Create New Governance Flag Page
 *
 * Form to create a new review flag.
 * Requires governance:flags:create capability.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ReviewFlagType =
  | "INSURANCE_REVIEW"
  | "LEGAL_REVIEW"
  | "POLICY_REVIEW"
  | "COMPLIANCE_CHECK"
  | "GENERAL";

type TargetType = "page" | "file" | "policy" | "event" | "bylaw" | "minutes" | "motion";

const FLAG_TYPE_OPTIONS: { value: ReviewFlagType; label: string; description: string }[] = [
  { value: "INSURANCE_REVIEW", label: "Insurance Review", description: "Requires insurance team review" },
  { value: "LEGAL_REVIEW", label: "Legal Review", description: "Requires legal/liability review" },
  { value: "POLICY_REVIEW", label: "Policy Question", description: "Policy interpretation needed" },
  { value: "COMPLIANCE_CHECK", label: "Compliance Check", description: "Bylaws/rules compliance check" },
  { value: "GENERAL", label: "General", description: "Other review needed" },
];

const TARGET_TYPE_OPTIONS: { value: TargetType; label: string }[] = [
  { value: "page", label: "Page" },
  { value: "file", label: "File" },
  { value: "policy", label: "Policy" },
  { value: "event", label: "Event" },
  { value: "bylaw", label: "Bylaw" },
  { value: "minutes", label: "Minutes" },
  { value: "motion", label: "Motion" },
];

export default function NewGovernanceFlagPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [flagType, setFlagType] = useState<ReviewFlagType>("GENERAL");
  const [targetType, setTargetType] = useState<TargetType>("page");
  const [targetId, setTargetId] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (!targetId.trim()) {
      setError("Target ID is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/officer/governance/flags", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          flagType,
          targetType,
          targetId: targetId.trim(),
          notes: notes.trim() || null,
          dueDate: dueDate || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create flag");
      }

      const data = await res.json();
      router.push(`/admin/governance/flags/${data.flag.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setSaving(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <Link href="/admin/governance/flags" style={styles.backLink}>
          ← Back to Flags
        </Link>
        <h1 style={styles.title}>Create New Flag</h1>
        <p style={styles.subtitle}>Create a review flag for governance oversight</p>
      </div>

      {/* Error */}
      {error && <div style={styles.error}>{error}</div>}

      {/* Form */}
      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Title */}
        <div style={styles.field}>
          <label style={styles.label}>
            Title <span style={styles.required}>*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief description of the review needed"
            style={styles.input}
            disabled={saving}
          />
        </div>

        {/* Flag Type */}
        <div style={styles.field}>
          <label style={styles.label}>
            Flag Type <span style={styles.required}>*</span>
          </label>
          <div style={styles.radioGroup}>
            {FLAG_TYPE_OPTIONS.map((option) => (
              <label key={option.value} style={styles.radioLabel}>
                <input
                  type="radio"
                  name="flagType"
                  value={option.value}
                  checked={flagType === option.value}
                  onChange={(e) => setFlagType(e.target.value as ReviewFlagType)}
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

        {/* Target Type */}
        <div style={styles.field}>
          <label style={styles.label}>
            Target Type <span style={styles.required}>*</span>
          </label>
          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value as TargetType)}
            style={styles.select}
            disabled={saving}
          >
            {TARGET_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
            Enter the UUID of the {targetType} you want to flag for review.
          </p>
        </div>

        {/* Notes */}
        <div style={styles.field}>
          <label style={styles.label}>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Detailed notes about what needs to be reviewed..."
            style={styles.textarea}
            rows={4}
            disabled={saving}
          />
        </div>

        {/* Due Date */}
        <div style={styles.field}>
          <label style={styles.label}>Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={styles.input}
            disabled={saving}
          />
          <p style={styles.hint}>Optional deadline for resolution.</p>
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <Link href="/admin/governance/flags" style={styles.cancelBtn}>
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || !title.trim() || !targetId.trim()}
            style={styles.submitBtn}
          >
            {saving ? "Creating..." : "Create Flag"}
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
  select: {
    width: "100%",
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    backgroundColor: "#fff",
  },
  textarea: {
    width: "100%",
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    boxSizing: "border-box",
    resize: "vertical",
  },
  hint: {
    fontSize: "12px",
    color: "#9ca3af",
    marginTop: "4px",
  },
  radioGroup: {
    display: "flex",
    flexDirection: "column",
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
