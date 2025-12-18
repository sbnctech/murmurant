"use client";

/**
 * Governance Annotations List Page
 *
 * Lists all governance annotations with filtering and actions.
 * Requires governance:annotations:read capability.
 */

import { useEffect, useState, useCallback } from "react";
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
  createdBy: { id: string; firstName: string; lastName: string } | null;
  motion: { id: string; motionNumber: number; motionText: string } | null;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const TARGET_TYPE_LABELS: Record<AnnotationTargetType, string> = {
  motion: "Motion",
  bylaw: "Bylaw",
  policy: "Policy",
  page: "Page",
  file: "File",
  minutes: "Minutes",
};

export default function GovernanceAnnotationsPage() {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Filters
  const [targetTypeFilter, setTargetTypeFilter] = useState<AnnotationTargetType | "">("");
  const [publishedFilter, setPublishedFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  const fetchAnnotations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (targetTypeFilter) params.set("targetType", targetTypeFilter);
      if (publishedFilter) params.set("isPublished", publishedFilter);

      const res = await fetch(`/api/v1/officer/governance/annotations?${params}`, {
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 403) {
          setError("You do not have permission to view annotations.");
          return;
        }
        throw new Error("Failed to fetch annotations");
      }

      const data = await res.json();
      setAnnotations(data.annotations);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [page, targetTypeFilter, publishedFilter]);

  useEffect(() => {
    fetchAnnotations();
  }, [fetchAnnotations]);

  const handlePublishToggle = async (annotationId: string, currentlyPublished: boolean) => {
    setActionInProgress(annotationId);
    try {
      const action = currentlyPublished ? "unpublish" : "publish";
      const res = await fetch(`/api/v1/officer/governance/annotations/${annotationId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Action failed");
      }

      await fetchAnnotations();
    } catch (err) {
      alert(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const truncateBody = (body: string, maxLength: number = 100) => {
    if (body.length <= maxLength) return body;
    return body.substring(0, maxLength) + "...";
  };

  if (error) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Governance Annotations</h1>
        <div style={styles.error}>{error}</div>
        <Link href="/admin" style={styles.backLink}>← Back to Admin</Link>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <Link href="/admin" style={styles.backLink}>← Admin</Link>
          <h1 style={styles.title}>Governance Annotations</h1>
          <p style={styles.subtitle}>Interpretations and notes on governance documents</p>
        </div>
        <Link href="/admin/governance/annotations/new" style={styles.newButton}>
          + New Annotation
        </Link>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <select
          value={targetTypeFilter}
          onChange={(e) => { setTargetTypeFilter(e.target.value as AnnotationTargetType | ""); setPage(1); }}
          style={styles.select}
        >
          <option value="">All Targets</option>
          {Object.entries(TARGET_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <select
          value={publishedFilter}
          onChange={(e) => { setPublishedFilter(e.target.value); setPage(1); }}
          style={styles.select}
        >
          <option value="">All Status</option>
          <option value="true">Published</option>
          <option value="false">Draft</option>
        </select>
      </div>

      {/* Loading */}
      {loading && <div style={styles.loading}>Loading...</div>}

      {/* Annotations List */}
      {!loading && annotations.length === 0 && (
        <div style={styles.empty}>No annotations found matching your filters.</div>
      )}

      {!loading && annotations.length > 0 && (
        <div style={styles.list}>
          {annotations.map((annotation) => (
            <div key={annotation.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardBadges}>
                  <span style={styles.targetBadge}>
                    {TARGET_TYPE_LABELS[annotation.targetType as AnnotationTargetType] || annotation.targetType}
                  </span>
                  <span style={annotation.isPublished ? styles.publishedBadge : styles.draftBadge}>
                    {annotation.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
                <div style={styles.cardActions}>
                  <button
                    onClick={() => handlePublishToggle(annotation.id, annotation.isPublished)}
                    disabled={actionInProgress === annotation.id}
                    style={annotation.isPublished ? styles.unpublishBtn : styles.publishBtn}
                  >
                    {actionInProgress === annotation.id
                      ? "..."
                      : annotation.isPublished
                      ? "Unpublish"
                      : "Publish"}
                  </button>
                  <Link href={`/admin/governance/annotations/${annotation.id}`} style={styles.viewLink}>
                    View
                  </Link>
                </div>
              </div>

              <div style={styles.cardBody}>
                {truncateBody(annotation.body)}
              </div>

              <div style={styles.cardMeta}>
                <span>Target: {annotation.targetId.substring(0, 8)}...</span>
                {annotation.anchor && <span>Anchor: {annotation.anchor}</span>}
                <span>{formatDate(annotation.createdAt)}</span>
                {annotation.createdBy && (
                  <span>by {annotation.createdBy.firstName} {annotation.createdBy.lastName}</span>
                )}
              </div>

              {annotation.motion && (
                <div style={styles.motionRef}>
                  <span style={styles.motionLabel}>Motion #{annotation.motion.motionNumber}:</span>
                  <span>{truncateBody(annotation.motion.motionText, 60)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            style={styles.pageBtn}
          >
            ← Previous
          </button>
          <span style={styles.pageInfo}>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= pagination.totalPages}
            style={styles.pageBtn}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "24px",
    maxWidth: "1000px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
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
  newButton: {
    padding: "10px 20px",
    backgroundColor: "#7c3aed",
    color: "#fff",
    borderRadius: "6px",
    textDecoration: "none",
    fontWeight: 500,
    fontSize: "14px",
  },
  filters: {
    display: "flex",
    gap: "12px",
    marginBottom: "20px",
  },
  select: {
    padding: "8px 12px",
    fontSize: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    backgroundColor: "#fff",
  },
  loading: {
    padding: "40px",
    textAlign: "center",
    color: "#6b7280",
  },
  empty: {
    padding: "40px",
    textAlign: "center",
    color: "#9ca3af",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
  },
  error: {
    padding: "16px",
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    borderRadius: "8px",
    marginBottom: "16px",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  card: {
    padding: "20px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    backgroundColor: "#fff",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  cardBadges: {
    display: "flex",
    gap: "8px",
  },
  cardActions: {
    display: "flex",
    gap: "8px",
  },
  targetBadge: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: 500,
    backgroundColor: "#e0e7ff",
    color: "#4338ca",
  },
  publishedBadge: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: 500,
    backgroundColor: "#d1fae5",
    color: "#047857",
  },
  draftBadge: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: 500,
    backgroundColor: "#f3f4f6",
    color: "#6b7280",
  },
  publishBtn: {
    padding: "4px 10px",
    fontSize: "12px",
    backgroundColor: "#d1fae5",
    color: "#047857",
    border: "1px solid #6ee7b7",
    borderRadius: "4px",
    cursor: "pointer",
  },
  unpublishBtn: {
    padding: "4px 10px",
    fontSize: "12px",
    backgroundColor: "#f3f4f6",
    color: "#6b7280",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    cursor: "pointer",
  },
  viewLink: {
    padding: "4px 10px",
    fontSize: "12px",
    color: "#7c3aed",
    textDecoration: "none",
  },
  cardBody: {
    fontSize: "14px",
    color: "#374151",
    lineHeight: 1.6,
    marginBottom: "12px",
  },
  cardMeta: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
    fontSize: "12px",
    color: "#9ca3af",
  },
  motionRef: {
    marginTop: "12px",
    padding: "10px",
    backgroundColor: "#f9fafb",
    borderRadius: "6px",
    fontSize: "13px",
    color: "#374151",
  },
  motionLabel: {
    fontWeight: 500,
    marginRight: "8px",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "16px",
    marginTop: "24px",
  },
  pageBtn: {
    padding: "8px 16px",
    fontSize: "14px",
    backgroundColor: "#fff",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    cursor: "pointer",
  },
  pageInfo: {
    fontSize: "14px",
    color: "#6b7280",
  },
};
