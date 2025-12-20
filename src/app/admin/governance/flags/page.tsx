"use client";

/**
 * Governance Flags List Page
 *
 * Lists all governance review flags with filtering and actions.
 * Requires governance:flags:read capability.
 *
 * Charter P1: Identity provable (session-based auth)
 * Charter P2: Default deny (capability check)
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatClubDate } from "@/lib/timezone";

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
  resolvedAt: string | null;
  resolution: string | null;
  createdBy: { id: string; firstName: string; lastName: string } | null;
  resolvedBy: { id: string; firstName: string; lastName: string } | null;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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

export default function GovernanceFlagsPage() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<ReviewFlagStatus | "">("");
  const [typeFilter, setTypeFilter] = useState<ReviewFlagType | "">("");
  const [page, setPage] = useState(1);

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (statusFilter) params.set("status", statusFilter);
      if (typeFilter) params.set("flagType", typeFilter);

      const res = await fetch(`/api/v1/officer/governance/flags?${params}`, {
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 403) {
          setError("You do not have permission to view governance flags.");
          return;
        }
        throw new Error("Failed to fetch flags");
      }

      const data = await res.json();
      setFlags(data.flags);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const handleAction = async (flagId: string, action: string, resolution?: string) => {
    setActionInProgress(flagId);
    try {
      const res = await fetch(`/api/v1/officer/governance/flags/${flagId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, resolution }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Action failed");
      }

      await fetchFlags();
    } catch (err) {
      alert(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return formatClubDate(new Date(dateStr));
  };

  const isOverdue = (flag: Flag) => {
    if (!flag.dueDate) return false;
    if (flag.status === "RESOLVED" || flag.status === "DISMISSED") return false;
    return new Date(flag.dueDate) < new Date();
  };

  if (error) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Governance Flags</h1>
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
          <h1 style={styles.title}>Governance Flags</h1>
          <p style={styles.subtitle}>Review flags for compliance, insurance, and policy questions</p>
        </div>
        <Link href="/admin/governance/flags/new" style={styles.newButton}>
          + New Flag
        </Link>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as ReviewFlagStatus | ""); setPage(1); }}
          style={styles.select}
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value as ReviewFlagType | ""); setPage(1); }}
          style={styles.select}
        >
          <option value="">All Types</option>
          {Object.entries(FLAG_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {loading && <div style={styles.loading}>Loading...</div>}

      {/* Flags List */}
      {!loading && flags.length === 0 && (
        <div style={styles.empty}>No flags found matching your filters.</div>
      )}

      {!loading && flags.length > 0 && (
        <div style={styles.table}>
          <div style={styles.tableHeader}>
            <div style={styles.colTitle}>Title</div>
            <div style={styles.colType}>Type</div>
            <div style={styles.colTarget}>Target</div>
            <div style={styles.colStatus}>Status</div>
            <div style={styles.colDue}>Due</div>
            <div style={styles.colActions}>Actions</div>
          </div>

          {flags.map((flag) => (
            <div key={flag.id} style={styles.tableRow}>
              <div style={styles.colTitle}>
                <Link href={`/admin/governance/flags/${flag.id}`} style={styles.flagLink}>
                  {flag.title}
                </Link>
                {flag.createdBy && (
                  <div style={styles.meta}>
                    by {flag.createdBy.firstName} {flag.createdBy.lastName}
                  </div>
                )}
              </div>
              <div style={styles.colType}>
                <span style={getTypeBadgeStyle(flag.flagType)}>
                  {FLAG_TYPE_LABELS[flag.flagType]}
                </span>
              </div>
              <div style={styles.colTarget}>
                <span style={styles.targetBadge}>{flag.targetType}</span>
              </div>
              <div style={styles.colStatus}>
                <span style={getStatusBadgeStyle(flag.status)}>
                  {STATUS_LABELS[flag.status]}
                </span>
              </div>
              <div style={styles.colDue}>
                {flag.dueDate ? (
                  <span style={isOverdue(flag) ? styles.overdue : undefined}>
                    {formatDate(flag.dueDate)}
                    {isOverdue(flag) && " ⚠️"}
                  </span>
                ) : (
                  <span style={styles.noDue}>—</span>
                )}
              </div>
              <div style={styles.colActions}>
                {flag.status === "OPEN" && (
                  <button
                    onClick={() => handleAction(flag.id, "start")}
                    disabled={actionInProgress === flag.id}
                    style={styles.actionBtn}
                  >
                    Start
                  </button>
                )}
                {(flag.status === "OPEN" || flag.status === "IN_PROGRESS") && (
                  <>
                    <button
                      onClick={() => {
                        const resolution = prompt("Enter resolution notes:");
                        if (resolution) handleAction(flag.id, "resolve", resolution);
                      }}
                      disabled={actionInProgress === flag.id}
                      style={styles.resolveBtn}
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => {
                        const resolution = prompt("Enter dismissal reason:");
                        if (resolution) handleAction(flag.id, "dismiss", resolution);
                      }}
                      disabled={actionInProgress === flag.id}
                      style={styles.dismissBtn}
                    >
                      Dismiss
                    </button>
                  </>
                )}
                {(flag.status === "RESOLVED" || flag.status === "DISMISSED") && (
                  <button
                    onClick={() => handleAction(flag.id, "reopen")}
                    disabled={actionInProgress === flag.id}
                    style={styles.actionBtn}
                  >
                    Reopen
                  </button>
                )}
              </div>
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

function getTypeBadgeStyle(type: ReviewFlagType): React.CSSProperties {
  const colors: Record<ReviewFlagType, { bg: string; text: string }> = {
    INSURANCE_REVIEW: { bg: "#dbeafe", text: "#1d4ed8" },
    LEGAL_REVIEW: { bg: "#fef3c7", text: "#92400e" },
    POLICY_REVIEW: { bg: "#e0e7ff", text: "#4338ca" },
    COMPLIANCE_CHECK: { bg: "#d1fae5", text: "#047857" },
    GENERAL: { bg: "#f3f4f6", text: "#374151" },
  };
  return {
    ...styles.badge,
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
    ...styles.badge,
    backgroundColor: colors[status].bg,
    color: colors[status].text,
  };
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "24px",
    maxWidth: "1200px",
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
  table: {
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    overflow: "hidden",
  },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1.5fr",
    gap: "16px",
    padding: "12px 16px",
    backgroundColor: "#f9fafb",
    fontWeight: 600,
    fontSize: "13px",
    color: "#374151",
    borderBottom: "1px solid #e5e7eb",
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1.5fr",
    gap: "16px",
    padding: "16px",
    borderBottom: "1px solid #e5e7eb",
    alignItems: "center",
  },
  colTitle: { minWidth: 0 },
  colType: {},
  colTarget: {},
  colStatus: {},
  colDue: {},
  colActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  flagLink: {
    color: "#7c3aed",
    textDecoration: "none",
    fontWeight: 500,
  },
  meta: {
    fontSize: "12px",
    color: "#9ca3af",
    marginTop: "4px",
  },
  badge: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: 500,
  },
  targetBadge: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: 500,
    backgroundColor: "#f3f4f6",
    color: "#374151",
  },
  overdue: {
    color: "#b91c1c",
    fontWeight: 500,
  },
  noDue: {
    color: "#9ca3af",
  },
  actionBtn: {
    padding: "4px 10px",
    fontSize: "12px",
    backgroundColor: "#f3f4f6",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    cursor: "pointer",
  },
  resolveBtn: {
    padding: "4px 10px",
    fontSize: "12px",
    backgroundColor: "#d1fae5",
    color: "#047857",
    border: "1px solid #6ee7b7",
    borderRadius: "4px",
    cursor: "pointer",
  },
  dismissBtn: {
    padding: "4px 10px",
    fontSize: "12px",
    backgroundColor: "#f3f4f6",
    color: "#6b7280",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    cursor: "pointer",
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
