"use client";

/**
 * Governance Flag Detail Page
 *
 * View and manage a single governance flag.
 * Requires governance:flags:read capability.
 */

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { formatClubDateTime } from "@/lib/timezone";

type ReviewFlagType =
  | "INSURANCE_REVIEW"
  | "LEGAL_REVIEW"
  | "POLICY_REVIEW"
  | "COMPLIANCE_CHECK"
  | "GENERAL";

type ReviewFlagStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "DISMISSED";

type Flag = {
  id: string;
  targetType: string;
  targetId: string;
  flagType: ReviewFlagType;
  title: string;
  notes: string | null;
  status: ReviewFlagStatus;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  resolution: string | null;
  createdBy: { id: string; firstName: string; lastName: string; email: string } | null;
  resolvedBy: { id: string; firstName: string; lastName: string; email: string } | null;
};

const FLAG_TYPE_LABELS: Record<ReviewFlagType, string> = {
  INSURANCE_REVIEW: "Insurance Review",
  LEGAL_REVIEW: "Legal Review",
  POLICY_REVIEW: "Policy Question",
  COMPLIANCE_CHECK: "Compliance Check",
  GENERAL: "General",
};

const STATUS_LABELS: Record<ReviewFlagStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  DISMISSED: "Dismissed",
};

export default function GovernanceFlagDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [flag, setFlag] = useState<Flag | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  const fetchFlag = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/officer/governance/flags/${id}`, {
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 404) {
          setError("Flag not found");
          return;
        }
        if (res.status === 403) {
          setError("You do not have permission to view this flag");
          return;
        }
        throw new Error("Failed to fetch flag");
      }

      const data = await res.json();
      setFlag(data.flag);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchFlag();
  }, [fetchFlag]);

  const handleAction = async (action: string, resolution?: string) => {
    setActionInProgress(true);
    try {
      const res = await fetch(`/api/v1/officer/governance/flags/${id}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, resolution }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Action failed");
      }

      await fetchFlag();
    } catch (err) {
      alert(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setActionInProgress(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return formatClubDateTime(new Date(dateStr));
  };

  const isOverdue = () => {
    if (!flag?.dueDate) return false;
    if (flag.status === "RESOLVED" || flag.status === "DISMISSED") return false;
    return new Date(flag.dueDate) < new Date();
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (error || !flag) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error || "Flag not found"}</div>
        <Link href="/admin/governance/flags" style={styles.backLink}>
          ← Back to Flags
        </Link>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <Link href="/admin/governance/flags" style={styles.backLink}>
          ← Back to Flags
        </Link>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>{flag.title}</h1>
          <div style={styles.badges}>
            <span style={getTypeBadgeStyle(flag.flagType)}>
              {FLAG_TYPE_LABELS[flag.flagType]}
            </span>
            <span style={getStatusBadgeStyle(flag.status)}>
              {STATUS_LABELS[flag.status]}
            </span>
            {isOverdue() && <span style={styles.overdueBadge}>Overdue</span>}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={styles.actions}>
        {flag.status === "OPEN" && (
          <button
            onClick={() => handleAction("start")}
            disabled={actionInProgress}
            style={styles.actionBtn}
          >
            Start Working
          </button>
        )}
        {(flag.status === "OPEN" || flag.status === "IN_PROGRESS") && (
          <>
            <button
              onClick={() => {
                const resolution = prompt("Enter resolution notes:");
                if (resolution) handleAction("resolve", resolution);
              }}
              disabled={actionInProgress}
              style={styles.resolveBtn}
            >
              Resolve
            </button>
            <button
              onClick={() => {
                const resolution = prompt("Enter dismissal reason:");
                if (resolution) handleAction("dismiss", resolution);
              }}
              disabled={actionInProgress}
              style={styles.dismissBtn}
            >
              Dismiss
            </button>
          </>
        )}
        {(flag.status === "RESOLVED" || flag.status === "DISMISSED") && (
          <button
            onClick={() => handleAction("reopen")}
            disabled={actionInProgress}
            style={styles.actionBtn}
          >
            Reopen
          </button>
        )}
        <Link
          href={`/admin/audit?objectType=GovernanceReviewFlag&objectId=${flag.id}`}
          style={styles.auditLink}
        >
          View Audit Trail
        </Link>
      </div>

      {/* Details */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Details</h2>
        <div style={styles.grid}>
          <div style={styles.gridItem}>
            <div style={styles.gridLabel}>Target</div>
            <div style={styles.gridValue}>
              <span style={styles.targetBadge}>{flag.targetType}</span>
              <code style={styles.code}>{flag.targetId}</code>
            </div>
          </div>
          <div style={styles.gridItem}>
            <div style={styles.gridLabel}>Due Date</div>
            <div style={styles.gridValue}>
              {flag.dueDate ? (
                <span style={isOverdue() ? styles.overdueText : undefined}>
                  {formatDate(flag.dueDate)}
                </span>
              ) : (
                <span style={styles.noValue}>Not set</span>
              )}
            </div>
          </div>
          <div style={styles.gridItem}>
            <div style={styles.gridLabel}>Created</div>
            <div style={styles.gridValue}>
              {formatDate(flag.createdAt)}
              {flag.createdBy && (
                <span style={styles.byText}>
                  by {flag.createdBy.firstName} {flag.createdBy.lastName}
                </span>
              )}
            </div>
          </div>
          {flag.resolvedAt && (
            <div style={styles.gridItem}>
              <div style={styles.gridLabel}>Resolved</div>
              <div style={styles.gridValue}>
                {formatDate(flag.resolvedAt)}
                {flag.resolvedBy && (
                  <span style={styles.byText}>
                    by {flag.resolvedBy.firstName} {flag.resolvedBy.lastName}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {flag.notes && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Notes</h2>
          <div style={styles.notes}>{flag.notes}</div>
        </div>
      )}

      {/* Resolution */}
      {flag.resolution && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Resolution</h2>
          <div style={styles.resolution}>{flag.resolution}</div>
        </div>
      )}
    </div>
  );
}

function getTypeBadgeStyle(type: ReviewFlagType): React.CSSProperties {
  const colors: Record<ReviewFlagType, { bg: string; text: string }> = {
    INSURANCE_REVIEW: { bg: "#dbeafe", text: "#1d4ed8" },
    LEGAL_REVIEW: { bg: "#fef3c7", text: "#92400e" },
    POLICY_REVIEW: { bg: "#e0e7ff", text: "#4338ca" },
    COMPLIANCE_CHECK: { bg: "#d1fae5", text: "#047857" },
    GENERAL: { bg: "#f3f4f6", text: "#374151" },
  };
  return {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 500,
    backgroundColor: colors[type].bg,
    color: colors[type].text,
  };
}

function getStatusBadgeStyle(status: ReviewFlagStatus): React.CSSProperties {
  const colors: Record<ReviewFlagStatus, { bg: string; text: string }> = {
    OPEN: { bg: "#fef3c7", text: "#92400e" },
    IN_PROGRESS: { bg: "#dbeafe", text: "#1d4ed8" },
    RESOLVED: { bg: "#d1fae5", text: "#047857" },
    DISMISSED: { bg: "#f3f4f6", text: "#6b7280" },
  };
  return {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 500,
    backgroundColor: colors[status].bg,
    color: colors[status].text,
  };
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
  overdueBadge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 500,
    backgroundColor: "#fecaca",
    color: "#b91c1c",
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
  actionBtn: {
    padding: "8px 16px",
    fontSize: "14px",
    backgroundColor: "#fff",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    cursor: "pointer",
  },
  resolveBtn: {
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: 500,
    backgroundColor: "#d1fae5",
    color: "#047857",
    border: "1px solid #6ee7b7",
    borderRadius: "6px",
    cursor: "pointer",
  },
  dismissBtn: {
    padding: "8px 16px",
    fontSize: "14px",
    backgroundColor: "#f3f4f6",
    color: "#6b7280",
    border: "1px solid #d1d5db",
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
  targetBadge: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: 500,
    backgroundColor: "#f3f4f6",
    color: "#374151",
    marginRight: "8px",
  },
  code: {
    fontSize: "12px",
    fontFamily: "monospace",
    color: "#6b7280",
  },
  noValue: {
    color: "#9ca3af",
    fontStyle: "italic",
  },
  overdueText: {
    color: "#b91c1c",
    fontWeight: 500,
  },
  byText: {
    display: "block",
    fontSize: "12px",
    color: "#6b7280",
    marginTop: "4px",
  },
  notes: {
    fontSize: "14px",
    color: "#374151",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
  },
  resolution: {
    fontSize: "14px",
    color: "#374151",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
    padding: "16px",
    backgroundColor: "#f0fdf4",
    borderRadius: "6px",
    border: "1px solid #bbf7d0",
  },
};
