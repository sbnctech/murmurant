"use client";

import { useEffect, useState, useCallback } from "react";
import { formatClubDateTime } from "@/lib/timezone";

/**
 * Types for Annotation data
 */
type AnnotationTargetType = "motion" | "bylaw" | "policy" | "page" | "file" | "minutes";

type Annotation = {
  id: string;
  targetType: AnnotationTargetType;
  targetId: string;
  anchor: string | null;
  body: string;
  isPublished: boolean;
  createdAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
};

type AnnotationPanelProps = {
  /** Type of target document */
  targetType: AnnotationTargetType;
  /** ID of the target document */
  targetId: string;
  /** Available section anchors for the document */
  anchors?: { id: string; label: string }[];
  /** Title to display at the top of the panel */
  title?: string;
  /** Whether to show the add annotation form */
  showAddForm?: boolean;
  /** Test ID prefix for E2E testing */
  testIdPrefix?: string;
};

type AnnotationPanelCapabilities = {
  canCreate: boolean;
  canEdit: boolean;
  canPublish: boolean;
};

/**
 * AnnotationPanel - Reusable component for managing annotations on governance documents
 *
 * Features:
 * - List annotations for a target document
 * - Add new annotations (capability-gated)
 * - Edit existing annotations (capability-gated)
 * - Publish/unpublish annotations (capability-gated)
 * - Support for section-level anchors
 *
 * Authentication is handled via HttpOnly session cookies - no tokens are
 * passed from parent components (Charter P1, P7).
 */
export default function AnnotationPanel({
  targetType,
  targetId,
  anchors = [],
  title = "Annotations",
  showAddForm = true,
  testIdPrefix = "annotation-panel",
}: AnnotationPanelProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<AnnotationPanelCapabilities>({
    canCreate: false,
    canEdit: false,
    canPublish: false,
  });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    body: "",
    anchor: "",
  });
  const [saving, setSaving] = useState(false);

  /**
   * Fetch annotations for the target
   */
  const fetchAnnotations = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/v1/officer/governance/annotations?targetType=${targetType}&targetId=${targetId}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      if (res.status === 403) {
        // User doesn't have read access
        setCapabilities({ canCreate: false, canEdit: false, canPublish: false });
        setLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to fetch annotations");
      }

      const data = await res.json();
      setAnnotations(data.annotations || []);

      // Check capabilities by trying to detect what the user can do
      // In a real implementation, this would be returned by the API
      setCapabilities({
        canCreate: true, // Assume can create if can read
        canEdit: true,
        canPublish: true,
      });
    } catch (err) {
      console.error("Error fetching annotations:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [targetType, targetId]);

  useEffect(() => {
    fetchAnnotations();
  }, [fetchAnnotations]);

  /**
   * Create a new annotation
   */
  const createAnnotation = async () => {
    if (!formData.body.trim()) {
      alert("Annotation body is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/v1/officer/governance/annotations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          body: formData.body,
          anchor: formData.anchor || null,
          isPublished: false,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create annotation");
      }

      // Reset form and refresh list
      setFormData({ body: "", anchor: "" });
      setShowForm(false);
      await fetchAnnotations();
    } catch (err) {
      console.error("Error creating annotation:", err);
      alert(`Failed to create annotation: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Update an existing annotation
   */
  const updateAnnotation = async (id: string) => {
    if (!formData.body.trim()) {
      alert("Annotation body is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/v1/officer/governance/annotations/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: formData.body,
          anchor: formData.anchor || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update annotation");
      }

      // Reset form and refresh list
      setFormData({ body: "", anchor: "" });
      setEditingId(null);
      await fetchAnnotations();
    } catch (err) {
      console.error("Error updating annotation:", err);
      alert(`Failed to update annotation: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Toggle publish status of an annotation
   */
  const togglePublish = async (id: string, currentlyPublished: boolean) => {
    try {
      const res = await fetch(`/api/v1/officer/governance/annotations/${id}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: currentlyPublished ? "unpublish" : "publish",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to toggle publish status");
      }

      await fetchAnnotations();
    } catch (err) {
      console.error("Error toggling publish:", err);
      alert(`Failed to toggle publish: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  /**
   * Delete an annotation
   */
  const deleteAnnotation = async (id: string) => {
    if (!confirm("Are you sure you want to delete this annotation?")) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/officer/governance/annotations/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete annotation");
      }

      await fetchAnnotations();
    } catch (err) {
      console.error("Error deleting annotation:", err);
      alert(`Failed to delete annotation: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  /**
   * Start editing an annotation
   */
  const startEdit = (annotation: Annotation) => {
    setEditingId(annotation.id);
    setFormData({
      body: annotation.body,
      anchor: annotation.anchor || "",
    });
    setShowForm(false);
  };

  /**
   * Cancel editing
   */
  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ body: "", anchor: "" });
  };

  /**
   * Format date for display
   */
  const formatDate = (dateStr: string) => {
    return formatClubDateTime(new Date(dateStr));
  };

  if (loading) {
    return (
      <div data-test-id={`${testIdPrefix}-loading`} style={styles.container}>
        <div style={styles.header}>
          <span style={styles.title}>{title}</span>
        </div>
        <div style={styles.loadingText}>Loading annotations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-test-id={`${testIdPrefix}-error`} style={styles.container}>
        <div style={styles.header}>
          <span style={styles.title}>{title}</span>
        </div>
        <div style={styles.errorText}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div data-test-id={testIdPrefix} style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.title}>{title}</span>
        <span data-test-id={`${testIdPrefix}-count`} style={styles.badge}>
          {annotations.length}
        </span>
        {showAddForm && capabilities.canCreate && !showForm && !editingId && (
          <button
            data-test-id={`${testIdPrefix}-add-btn`}
            style={styles.addButton}
            onClick={() => setShowForm(true)}
          >
            + Add
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(showForm || editingId) && (
        <div data-test-id={`${testIdPrefix}-form`} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Annotation</label>
            <textarea
              data-test-id={`${testIdPrefix}-form-body`}
              style={styles.textarea}
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder="Enter your annotation..."
              rows={4}
            />
          </div>

          {anchors.length > 0 && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Anchor (Section)</label>
              <select
                data-test-id={`${testIdPrefix}-form-anchor`}
                style={styles.select}
                value={formData.anchor}
                onChange={(e) => setFormData({ ...formData, anchor: e.target.value })}
              >
                <option value="">-- No specific section --</option>
                {anchors.map((anchor) => (
                  <option key={anchor.id} value={anchor.id}>
                    {anchor.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={styles.formActions}>
            <button
              data-test-id={`${testIdPrefix}-form-save`}
              style={styles.saveButton}
              onClick={() => (editingId ? updateAnnotation(editingId) : createAnnotation())}
              disabled={saving}
            >
              {saving ? "Saving..." : editingId ? "Update" : "Save"}
            </button>
            <button
              data-test-id={`${testIdPrefix}-form-cancel`}
              style={styles.cancelButton}
              onClick={() => {
                setShowForm(false);
                cancelEdit();
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Annotations List */}
      {annotations.length === 0 ? (
        <div data-test-id={`${testIdPrefix}-empty`} style={styles.emptyText}>
          No annotations yet
        </div>
      ) : (
        <div data-test-id={`${testIdPrefix}-list`} style={styles.list}>
          {annotations.map((annotation) => (
            <div
              key={annotation.id}
              data-test-id={`${testIdPrefix}-item-${annotation.id}`}
              style={styles.item}
            >
              <div style={styles.itemContent}>
                <div style={styles.itemBody}>{annotation.body}</div>
                <div style={styles.itemMeta}>
                  {annotation.anchor && (
                    <span
                      data-test-id={`${testIdPrefix}-item-anchor-${annotation.id}`}
                      style={styles.anchorBadge}
                    >
                      # {annotation.anchor}
                    </span>
                  )}
                  <span
                    style={{
                      ...styles.publishBadge,
                      ...(annotation.isPublished
                        ? styles.publishedBadge
                        : styles.draftBadge),
                    }}
                  >
                    {annotation.isPublished ? "Published" : "Draft"}
                  </span>
                  <span style={styles.metaText}>
                    {formatDate(annotation.createdAt)}
                  </span>
                  {annotation.createdBy && (
                    <span style={styles.metaText}>
                      by {annotation.createdBy.firstName} {annotation.createdBy.lastName}
                    </span>
                  )}
                </div>
              </div>

              <div style={styles.itemActions}>
                {capabilities.canEdit && (
                  <button
                    data-test-id={`${testIdPrefix}-edit-${annotation.id}`}
                    style={styles.iconButton}
                    onClick={() => startEdit(annotation)}
                    title="Edit"
                  >
                    &#9998;
                  </button>
                )}
                {capabilities.canPublish && (
                  <button
                    data-test-id={`${testIdPrefix}-publish-${annotation.id}`}
                    style={styles.iconButton}
                    onClick={() => togglePublish(annotation.id, annotation.isPublished)}
                    title={annotation.isPublished ? "Unpublish" : "Publish"}
                  >
                    {annotation.isPublished ? "&#128274;" : "&#128275;"}
                  </button>
                )}
                {capabilities.canEdit && (
                  <button
                    data-test-id={`${testIdPrefix}-delete-${annotation.id}`}
                    style={styles.deleteButton}
                    onClick={() => deleteAnnotation(annotation.id)}
                    title="Delete"
                  >
                    &#128465;
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Styles
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "16px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "16px",
  },
  title: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#111827",
  },
  badge: {
    display: "inline-block",
    padding: "2px 8px",
    fontSize: "12px",
    fontWeight: 600,
    backgroundColor: "#f3f4f6",
    color: "#6b7280",
    borderRadius: "12px",
  },
  addButton: {
    marginLeft: "auto",
    padding: "4px 12px",
    fontSize: "13px",
    fontWeight: 500,
    backgroundColor: "#7c3aed",
    color: "#ffffff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  loadingText: {
    fontSize: "14px",
    color: "#6b7280",
    fontStyle: "italic",
  },
  errorText: {
    fontSize: "14px",
    color: "#dc2626",
  },
  emptyText: {
    fontSize: "14px",
    color: "#9ca3af",
    fontStyle: "italic",
    textAlign: "center",
    padding: "20px",
  },
  form: {
    marginBottom: "16px",
    padding: "12px",
    backgroundColor: "#f9fafb",
    borderRadius: "6px",
    border: "1px solid #e5e7eb",
  },
  formGroup: {
    marginBottom: "12px",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: 500,
    color: "#374151",
    marginBottom: "4px",
  },
  textarea: {
    width: "100%",
    padding: "8px",
    fontSize: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    resize: "vertical",
    fontFamily: "inherit",
  },
  select: {
    width: "100%",
    padding: "8px",
    fontSize: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    backgroundColor: "#ffffff",
  },
  formActions: {
    display: "flex",
    gap: "8px",
  },
  saveButton: {
    padding: "6px 14px",
    fontSize: "13px",
    fontWeight: 500,
    backgroundColor: "#7c3aed",
    color: "#ffffff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  cancelButton: {
    padding: "6px 14px",
    fontSize: "13px",
    fontWeight: 500,
    backgroundColor: "#ffffff",
    color: "#6b7280",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    cursor: "pointer",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  item: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: "12px",
    backgroundColor: "#f9fafb",
    borderRadius: "6px",
    border: "1px solid #e5e7eb",
    gap: "12px",
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
  },
  itemBody: {
    fontSize: "14px",
    color: "#111827",
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
  },
  itemMeta: {
    marginTop: "8px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  anchorBadge: {
    display: "inline-block",
    padding: "2px 6px",
    fontSize: "11px",
    fontWeight: 500,
    backgroundColor: "#e0e7ff",
    color: "#4f46e5",
    borderRadius: "4px",
  },
  publishBadge: {
    display: "inline-block",
    padding: "2px 6px",
    fontSize: "11px",
    fontWeight: 500,
    borderRadius: "4px",
  },
  publishedBadge: {
    backgroundColor: "#d1fae5",
    color: "#047857",
  },
  draftBadge: {
    backgroundColor: "#f3f4f6",
    color: "#6b7280",
  },
  metaText: {
    fontSize: "12px",
    color: "#9ca3af",
  },
  itemActions: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    flexShrink: 0,
  },
  iconButton: {
    padding: "4px 8px",
    fontSize: "14px",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#6b7280",
  },
  deleteButton: {
    padding: "4px 8px",
    fontSize: "14px",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#dc2626",
  },
};
