"use client";

/**
 * Governance Annotation Detail Page
 *
 * View and manage a single governance annotation.
 * Requires governance:annotations:read capability.
 */

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";

type AnnotationTargetType = "motion" | "bylaw" | "policy" | "page" | "file" | "minutes";

type Annotation = {
  id: string;
  targetType: string;
  targetId: string;
  anchor: string | null;
  body: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; firstName: string; lastName: string; email: string } | null;
  motion: {
    id: string;
    motionNumber: number;
    motionText: string;
    meeting: { id: string; date: string; type: string } | null;
  } | null;
};

const TARGET_TYPE_LABELS: Record<AnnotationTargetType, string> = {
  motion: "Motion",
  bylaw: "Bylaw",
  policy: "Policy",
  page: "Page",
  file: "File",
  minutes: "Minutes",
};

export default function GovernanceAnnotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [annotation, setAnnotation] = useState<Annotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState("");

  const fetchAnnotation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/officer/governance/annotations/${id}`, {
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 404) {
          setError("Annotation not found");
          return;
        }
        if (res.status === 403) {
          setError("You do not have permission to view this annotation");
          return;
        }
        throw new Error("Failed to fetch annotation");
      }

      const data = await res.json();
      setAnnotation(data.annotation);
      setEditBody(data.annotation.body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAnnotation();
  }, [fetchAnnotation]);

  const handlePublishToggle = async () => {
    if (!annotation) return;
    setActionInProgress(true);
    try {
      const action = annotation.isPublished ? "unpublish" : "publish";
      const res = await fetch(`/api/v1/officer/governance/annotations/${id}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Action failed");
      }

      await fetchAnnotation();
    } catch (err) {
      alert(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleSaveEdit = async () => {
    setActionInProgress(true);
    try {
      const res = await fetch(`/api/v1/officer/governance/annotations/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: editBody }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update");
      }

      await fetchAnnotation();
      setEditing(false);
    } catch (err) {
      alert(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this annotation? This cannot be undone.")) {
      return;
    }

    setActionInProgress(true);
    try {
      const res = await fetch(`/api/v1/officer/governance/annotations/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete");
      }

      window.location.href = "/admin/governance/annotations";
    } catch (err) {
      alert(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      setActionInProgress(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (error || !annotation) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error || "Annotation not found"}</div>
        <Link href="/admin/governance/annotations" style={styles.backLink}>
          ← Back to Annotations
        </Link>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <Link href="/admin/governance/annotations" style={styles.backLink}>
          ← Back to Annotations
        </Link>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>Annotation</h1>
          <div style={styles.badges}>
            <span style={styles.targetBadge}>
              {TARGET_TYPE_LABELS[annotation.targetType as AnnotationTargetType] || annotation.targetType}
            </span>
            <span style={annotation.isPublished ? styles.publishedBadge : styles.draftBadge}>
              {annotation.isPublished ? "Published" : "Draft"}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={styles.actions}>
        <button
          onClick={handlePublishToggle}
          disabled={actionInProgress}
          style={annotation.isPublished ? styles.unpublishBtn : styles.publishBtn}
        >
          {actionInProgress ? "..." : annotation.isPublished ? "Unpublish" : "Publish"}
        </button>
        {!editing && (
          <button onClick={() => setEditing(true)} style={styles.editBtn}>
            Edit
          </button>
        )}
        <button onClick={handleDelete} disabled={actionInProgress} style={styles.deleteBtn}>
          Delete
        </button>
        <Link
          href={`/admin/audit?objectType=GovernanceAnnotation&objectId=${annotation.id}`}
          style={styles.auditLink}
        >
          View Audit Trail
        </Link>
      </div>

      {/* Motion Reference */}
      {annotation.motion && (
        <div style={styles.motionSection}>
          <h2 style={styles.sectionTitle}>Related Motion</h2>
          <div style={styles.motionCard}>
            <div style={styles.motionNumber}>Motion #{annotation.motion.motionNumber}</div>
            <div style={styles.motionText}>{annotation.motion.motionText}</div>
            {annotation.motion.meeting && (
              <div style={styles.motionMeta}>
                Meeting: {annotation.motion.meeting.type} - {formatDate(annotation.motion.meeting.date)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Body */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Content</h2>
        {editing ? (
          <div style={styles.editForm}>
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              style={styles.editTextarea}
              rows={10}
              disabled={actionInProgress}
            />
            <div style={styles.editActions}>
              <button
                onClick={() => { setEditing(false); setEditBody(annotation.body); }}
                style={styles.cancelEditBtn}
                disabled={actionInProgress}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                style={styles.saveBtn}
                disabled={actionInProgress || !editBody.trim()}
              >
                {actionInProgress ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        ) : (
          <div style={styles.body}>{annotation.body}</div>
        )}
      </div>

      {/* Details */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Details</h2>
        <div style={styles.grid}>
          <div style={styles.gridItem}>
            <div style={styles.gridLabel}>Target</div>
            <div style={styles.gridValue}>
              <span style={styles.targetBadgeSmall}>{annotation.targetType}</span>
              <code style={styles.code}>{annotation.targetId}</code>
            </div>
          </div>
          {annotation.anchor && (
            <div style={styles.gridItem}>
              <div style={styles.gridLabel}>Anchor</div>
              <div style={styles.gridValue}>{annotation.anchor}</div>
            </div>
          )}
          <div style={styles.gridItem}>
            <div style={styles.gridLabel}>Created</div>
            <div style={styles.gridValue}>
              {formatDate(annotation.createdAt)}
              {annotation.createdBy && (
                <span style={styles.byText}>
                  by {annotation.createdBy.firstName} {annotation.createdBy.lastName}
                </span>
              )}
            </div>
          </div>
          <div style={styles.gridItem}>
            <div style={styles.gridLabel}>Last Updated</div>
            <div style={styles.gridValue}>{formatDate(annotation.updatedAt)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "24px",
    maxWidth: "900px",
    margin: "0 auto",
  },
  loading: {
    padding: "40px",
    textAlign: "center",
    color: "#6b7280",
  },
  error: {
    padding: "16px",
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    borderRadius: "8px",
    marginBottom: "16px",
  },
  header: {
    marginBottom: "24px",
  },
  backLink: {
    fontSize: "14px",
    color: "#6b7280",
    textDecoration: "none",
    display: "inline-block",
    marginBottom: "12px",
  },
  headerContent: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  title: {
    fontSize: "24px",
    fontWeight: 600,
    margin: 0,
  },
  badges: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  targetBadge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 500,
    backgroundColor: "#e0e7ff",
    color: "#4338ca",
  },
  publishedBadge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 500,
    backgroundColor: "#d1fae5",
    color: "#047857",
  },
  draftBadge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 500,
    backgroundColor: "#f3f4f6",
    color: "#6b7280",
  },
  actions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    padding: "16px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    marginBottom: "24px",
  },
  publishBtn: {
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: 500,
    backgroundColor: "#d1fae5",
    color: "#047857",
    border: "1px solid #6ee7b7",
    borderRadius: "6px",
    cursor: "pointer",
  },
  unpublishBtn: {
    padding: "8px 16px",
    fontSize: "14px",
    backgroundColor: "#f3f4f6",
    color: "#6b7280",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    cursor: "pointer",
  },
  editBtn: {
    padding: "8px 16px",
    fontSize: "14px",
    backgroundColor: "#fff",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    cursor: "pointer",
  },
  deleteBtn: {
    padding: "8px 16px",
    fontSize: "14px",
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: "6px",
    cursor: "pointer",
  },
  auditLink: {
    marginLeft: "auto",
    padding: "8px 16px",
    fontSize: "14px",
    color: "#7c3aed",
    textDecoration: "none",
  },
  motionSection: {
    marginBottom: "24px",
  },
  motionCard: {
    padding: "16px",
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
  },
  motionNumber: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#4338ca",
    marginBottom: "8px",
  },
  motionText: {
    fontSize: "14px",
    color: "#374151",
    lineHeight: 1.6,
  },
  motionMeta: {
    fontSize: "12px",
    color: "#6b7280",
    marginTop: "8px",
  },
  section: {
    marginBottom: "24px",
    padding: "20px",
    backgroundColor: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#374151",
    marginTop: 0,
    marginBottom: "16px",
  },
  body: {
    fontSize: "14px",
    color: "#374151",
    lineHeight: 1.8,
    whiteSpace: "pre-wrap",
  },
  editForm: {},
  editTextarea: {
    width: "100%",
    padding: "12px",
    fontSize: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    resize: "vertical",
    fontFamily: "inherit",
    lineHeight: 1.6,
    boxSizing: "border-box",
  },
  editActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "12px",
  },
  cancelEditBtn: {
    padding: "8px 16px",
    fontSize: "14px",
    backgroundColor: "#fff",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    cursor: "pointer",
  },
  saveBtn: {
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: 500,
    backgroundColor: "#7c3aed",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "16px",
  },
  gridItem: {},
  gridLabel: {
    fontSize: "12px",
    fontWeight: 500,
    color: "#6b7280",
    marginBottom: "4px",
    textTransform: "uppercase",
  },
  gridValue: {
    fontSize: "14px",
    color: "#111827",
  },
  targetBadgeSmall: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: 500,
    backgroundColor: "#e0e7ff",
    color: "#4338ca",
    marginRight: "8px",
  },
  code: {
    fontSize: "12px",
    fontFamily: "monospace",
    color: "#6b7280",
  },
  byText: {
    display: "block",
    fontSize: "12px",
    color: "#6b7280",
    marginTop: "4px",
  },
};
