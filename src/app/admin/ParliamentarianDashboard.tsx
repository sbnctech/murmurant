"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

/**
 * Types for Parliamentarian Dashboard data (mirrors API response)
 */
type ReviewFlagType =
  | "INSURANCE_REVIEW"
  | "LEGAL_REVIEW"
  | "POLICY_REVIEW"
  | "COMPLIANCE_CHECK"
  | "GENERAL";

type ReviewFlagStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "DISMISSED";

type FlagSummary = {
  id: string;
  targetType: string;
  targetId: string;
  flagType: ReviewFlagType;
  flagTypeLabel: string;
  title: string;
  notes: string | null;
  status: ReviewFlagStatus;
  statusLabel: string;
  dueDate: string | null;
  dueDateFormatted: string | null;
  isOverdue: boolean;
  createdAt: string;
  createdBy: string | null;
  auditTrailUrl: string;
};

type AnnotationSummary = {
  id: string;
  targetType: string;
  targetId: string;
  anchor: string | null;
  body: string;
  isPublished: boolean;
  createdAt: string;
  createdAtFormatted: string;
  createdBy: string | null;
  auditTrailUrl: string;
};

type ParliamentarianDashboardData = {
  visible: boolean;
  openPolicyQuestions: FlagSummary[];
  recentInterpretations: AnnotationSummary[];
  docsNeedingReview: FlagSummary[];
  overdueFlags: FlagSummary[];
  flagCounts: Record<string, number>;
  capabilities: {
    canCreateFlag: boolean;
    canResolveFlag: boolean;
    canCreateAnnotation: boolean;
    canEditAnnotation: boolean;
    canPublishAnnotation: boolean;
    canManageRules: boolean;
  };
};

/**
 * Parliamentarian Dashboard Widget
 *
 * Displays governance oversight status for the Parliamentarian role:
 * - Open policy questions (flags)
 * - Recent interpretations log entries
 * - Docs needing review (insurance, legal flags)
 * - Overdue flags
 *
 * Inline actions are gated by server-validated capabilities:
 * - Create flag (governance:flags:create)
 * - Resolve flag (governance:flags:resolve)
 * - Create annotation (governance:annotations:write)
 * - Publish annotation (governance:annotations:publish)
 *
 * Authentication is handled via HttpOnly session cookies - no tokens are
 * passed from parent components (Charter P1, P7).
 */
export default function ParliamentarianDashboard() {
  const [data, setData] = useState<ParliamentarianDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/officer/parliamentarian/dashboard", {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok && res.status !== 200) {
        throw new Error("Failed to fetch dashboard data");
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Error fetching parliamentarian dashboard:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Resolve a flag
   */
  const resolveFlag = async (flagId: string, status: "RESOLVED" | "DISMISSED") => {
    setActionInProgress(flagId);
    try {
      const res = await fetch(`/api/v1/officer/governance/flags/${flagId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolve", status, resolution: "Resolved via dashboard" }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Action failed");
      }

      await fetchData();
    } catch (err) {
      console.error(`Error resolving flag:`, err);
      alert(`Failed to resolve flag: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setActionInProgress(null);
    }
  };

  // Don't render if loading, error, or not visible
  if (loading) {
    return (
      <div data-test-id="parliamentarian-dashboard-loading" style={styles.container}>
        <div style={styles.header}>
          <span style={styles.icon}>&#9878;</span>
          <span style={styles.title}>Parliamentarian Dashboard</span>
        </div>
        <div style={styles.loadingText}>Loading...</div>
      </div>
    );
  }

  if (error || !data?.visible) {
    return null;
  }

  const {
    openPolicyQuestions,
    recentInterpretations,
    docsNeedingReview,
    overdueFlags,
    flagCounts,
    capabilities,
  } = data;

  const totalOpenFlags = Object.values(flagCounts).reduce((a, b) => a + b, 0);

  return (
    <div data-test-id="parliamentarian-dashboard" style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.icon}>&#9878;</span>
        <div>
          <div data-test-id="parliamentarian-dashboard-title" style={styles.title}>
            Parliamentarian Dashboard
          </div>
          <div style={styles.subtitle}>Governance Oversight</div>
        </div>
        {totalOpenFlags > 0 && (
          <span data-test-id="parliamentarian-total-flags" style={styles.totalBadge}>
            {totalOpenFlags} open
          </span>
        )}
      </div>

      {/* Overdue Flags Alert */}
      {overdueFlags.length > 0 && (
        <div data-test-id="parliamentarian-overdue-alert" style={styles.alertSection}>
          <div style={styles.alertHeader}>
            <span style={styles.alertIcon}>&#9888;</span>
            <span style={styles.alertTitle}>Overdue Items ({overdueFlags.length})</span>
          </div>
          <div style={styles.alertList}>
            {overdueFlags.slice(0, 3).map((flag) => (
              <div key={flag.id} style={styles.alertItem}>
                <span style={styles.overdueLabel}>{flag.flagTypeLabel}</span>
                <span style={styles.overdueDue}>Due: {flag.dueDateFormatted}</span>
                <Link href={`/admin/governance/flags/${flag.id}`} style={styles.alertLink}>
                  {flag.title}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Open Policy Questions */}
      <FlagsSection
        testId="parliamentarian-policy-questions"
        title="Open Policy Questions"
        items={openPolicyQuestions}
        emptyText="No open policy questions"
        canResolve={capabilities.canResolveFlag}
        onResolve={resolveFlag}
        actionInProgress={actionInProgress}
        badgeStyle={styles.badgePolicyQuestion}
      />

      {/* Docs Needing Review */}
      <FlagsSection
        testId="parliamentarian-docs-review"
        title="Docs Needing Review"
        items={docsNeedingReview}
        emptyText="No documents pending review"
        canResolve={capabilities.canResolveFlag}
        onResolve={resolveFlag}
        actionInProgress={actionInProgress}
        badgeStyle={styles.badgeDocsReview}
      />

      {/* Recent Interpretations */}
      <InterpretationsSection
        testId="parliamentarian-interpretations"
        title="Recent Interpretations"
        items={recentInterpretations}
        emptyText="No recent interpretations"
        canPublish={capabilities.canPublishAnnotation}
      />

      {/* Quick Links */}
      <div style={styles.quickLinks}>
        <Link href="/admin/governance/flags" style={styles.link}>
          All Flags
        </Link>
        <Link href="/admin/governance/annotations" style={styles.link}>
          All Annotations
        </Link>
        {capabilities.canCreateFlag && (
          <Link href="/admin/governance/flags/new" style={styles.linkPrimary}>
            + New Flag
          </Link>
        )}
        {capabilities.canCreateAnnotation && (
          <Link href="/admin/governance/annotations/new" style={styles.linkPrimary}>
            + New Annotation
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * Flags section component
 */
function FlagsSection({
  testId,
  title,
  items,
  emptyText,
  canResolve,
  onResolve,
  actionInProgress,
  badgeStyle,
}: {
  testId: string;
  title: string;
  items: FlagSummary[];
  emptyText: string;
  canResolve?: boolean;
  onResolve?: (id: string, status: "RESOLVED" | "DISMISSED") => void;
  actionInProgress?: string | null;
  badgeStyle?: React.CSSProperties;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (items.length === 0) {
    return (
      <div data-test-id={testId} style={styles.section}>
        <div style={styles.sectionTitle}>{title}</div>
        <div style={styles.emptyText}>{emptyText}</div>
      </div>
    );
  }

  return (
    <div data-test-id={testId} style={styles.section}>
      <div
        style={styles.sectionHeader}
        onClick={() => setIsCollapsed(!isCollapsed)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setIsCollapsed(!isCollapsed)}
      >
        <span style={styles.sectionTitle}>{title}</span>
        <span data-test-id={`${testId}-count`} style={styles.badge}>
          {items.length}
        </span>
        <span style={styles.collapseIcon}>{isCollapsed ? "▶" : "▼"}</span>
      </div>

      {!isCollapsed && (
        <div data-test-id={`${testId}-list`} style={styles.list}>
          {items.map((flag) => (
            <div
              key={flag.id}
              data-test-id={`${testId}-item-${flag.id}`}
              style={styles.listItem}
            >
              <div style={styles.itemContent}>
                <div style={styles.itemHeader}>
                  <span style={styles.itemTitle}>{flag.title}</span>
                  <span style={{ ...styles.statusBadge, ...badgeStyle }}>
                    {flag.flagTypeLabel}
                  </span>
                  {flag.isOverdue && (
                    <span style={styles.overdueBadge}>Overdue</span>
                  )}
                </div>
                <div style={styles.itemMeta}>
                  <span>Target: {flag.targetType}/{flag.targetId.substring(0, 8)}...</span>
                  {flag.dueDateFormatted && (
                    <span>Due: {flag.dueDateFormatted}</span>
                  )}
                  <span>Status: {flag.statusLabel}</span>
                </div>
              </div>

              <div style={styles.itemActions}>
                {canResolve && onResolve && flag.status !== "RESOLVED" && (
                  <button
                    data-test-id={`${testId}-resolve-${flag.id}`}
                    style={styles.actionButton}
                    onClick={() => onResolve(flag.id, "RESOLVED")}
                    disabled={actionInProgress === flag.id}
                  >
                    {actionInProgress === flag.id ? "..." : "Resolve"}
                  </button>
                )}
                <Link
                  href={flag.auditTrailUrl}
                  data-test-id={`${testId}-audit-${flag.id}`}
                  style={styles.auditLink}
                  title="View audit trail"
                >
                  &#128269;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Interpretations section component
 */
function InterpretationsSection({
  testId,
  title,
  items,
  emptyText,
  canPublish: _canPublish,
}: {
  testId: string;
  title: string;
  items: AnnotationSummary[];
  emptyText: string;
  canPublish?: boolean;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (items.length === 0) {
    return (
      <div data-test-id={testId} style={styles.section}>
        <div style={styles.sectionTitle}>{title}</div>
        <div style={styles.emptyText}>{emptyText}</div>
      </div>
    );
  }

  return (
    <div data-test-id={testId} style={styles.section}>
      <div
        style={styles.sectionHeader}
        onClick={() => setIsCollapsed(!isCollapsed)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setIsCollapsed(!isCollapsed)}
      >
        <span style={styles.sectionTitle}>{title}</span>
        <span data-test-id={`${testId}-count`} style={styles.badge}>
          {items.length}
        </span>
        <span style={styles.collapseIcon}>{isCollapsed ? "▶" : "▼"}</span>
      </div>

      {!isCollapsed && (
        <div data-test-id={`${testId}-list`} style={styles.list}>
          {items.map((annotation) => (
            <div
              key={annotation.id}
              data-test-id={`${testId}-item-${annotation.id}`}
              style={styles.listItem}
            >
              <div style={styles.itemContent}>
                <div style={styles.itemHeader}>
                  <span style={styles.itemTitle}>
                    {annotation.body.length > 60
                      ? annotation.body.substring(0, 60) + "..."
                      : annotation.body}
                  </span>
                  <span
                    style={{
                      ...styles.statusBadge,
                      ...(annotation.isPublished
                        ? styles.badgePublished
                        : styles.badgeDraft),
                    }}
                  >
                    {annotation.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
                <div style={styles.itemMeta}>
                  <span>Target: {annotation.targetType}</span>
                  {annotation.anchor && <span>Anchor: {annotation.anchor}</span>}
                  <span>{annotation.createdAtFormatted}</span>
                  {annotation.createdBy && <span>by {annotation.createdBy}</span>}
                </div>
              </div>

              <div style={styles.itemActions}>
                <Link
                  href={`/admin/governance/annotations/${annotation.id}`}
                  data-test-id={`${testId}-view-${annotation.id}`}
                  style={styles.editLink}
                >
                  View
                </Link>
                <Link
                  href={annotation.auditTrailUrl}
                  data-test-id={`${testId}-audit-${annotation.id}`}
                  style={styles.auditLink}
                  title="View audit trail"
                >
                  &#128269;
                </Link>
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
    border: "2px solid #7c3aed",
    borderRadius: "8px",
    backgroundColor: "#f5f3ff",
    marginBottom: "24px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
  },
  icon: {
    fontSize: "28px",
  },
  title: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#5b21b6",
  },
  subtitle: {
    fontSize: "13px",
    color: "#6d28d9",
  },
  loadingText: {
    fontSize: "14px",
    color: "#6b7280",
  },
  totalBadge: {
    marginLeft: "auto",
    padding: "4px 10px",
    fontSize: "12px",
    fontWeight: 600,
    backgroundColor: "#7c3aed",
    color: "#ffffff",
    borderRadius: "12px",
  },
  alertSection: {
    marginBottom: "16px",
    padding: "12px",
    backgroundColor: "#fef2f2",
    borderRadius: "6px",
    border: "1px solid #fecaca",
  },
  alertHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
  },
  alertIcon: {
    color: "#dc2626",
    fontSize: "18px",
  },
  alertTitle: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#b91c1c",
  },
  alertList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  alertItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
  },
  overdueLabel: {
    fontWeight: 500,
    color: "#991b1b",
  },
  overdueDue: {
    color: "#b91c1c",
    fontSize: "12px",
  },
  alertLink: {
    color: "#7c3aed",
    textDecoration: "none",
  },
  section: {
    marginBottom: "16px",
    padding: "12px",
    backgroundColor: "#ffffff",
    borderRadius: "6px",
    border: "1px solid #e9d5ff",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    userSelect: "none",
  },
  sectionTitle: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#374151",
  },
  badge: {
    display: "inline-block",
    padding: "2px 8px",
    fontSize: "12px",
    fontWeight: 600,
    backgroundColor: "#e9d5ff",
    color: "#7c3aed",
    borderRadius: "12px",
  },
  collapseIcon: {
    marginLeft: "auto",
    fontSize: "10px",
    color: "#9ca3af",
  },
  emptyText: {
    fontSize: "13px",
    color: "#9ca3af",
    fontStyle: "italic",
    marginTop: "8px",
  },
  list: {
    marginTop: "12px",
  },
  listItem: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: "10px",
    borderBottom: "1px solid #f3f4f6",
    gap: "12px",
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
  },
  itemHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  itemTitle: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#111827",
  },
  itemMeta: {
    fontSize: "12px",
    color: "#9ca3af",
    marginTop: "4px",
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  itemActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexShrink: 0,
  },
  statusBadge: {
    display: "inline-block",
    padding: "2px 6px",
    fontSize: "11px",
    fontWeight: 500,
    backgroundColor: "#e5e7eb",
    color: "#374151",
    borderRadius: "4px",
  },
  badgePolicyQuestion: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  badgeDocsReview: {
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
  },
  badgePublished: {
    backgroundColor: "#d1fae5",
    color: "#047857",
  },
  badgeDraft: {
    backgroundColor: "#f3f4f6",
    color: "#6b7280",
  },
  overdueBadge: {
    display: "inline-block",
    padding: "2px 6px",
    fontSize: "11px",
    fontWeight: 500,
    backgroundColor: "#fecaca",
    color: "#b91c1c",
    borderRadius: "4px",
  },
  editLink: {
    fontSize: "13px",
    color: "#7c3aed",
    textDecoration: "none",
  },
  actionButton: {
    padding: "4px 10px",
    fontSize: "12px",
    fontWeight: 500,
    backgroundColor: "#7c3aed",
    color: "#ffffff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  auditLink: {
    fontSize: "14px",
    color: "#9ca3af",
    textDecoration: "none",
    cursor: "pointer",
  },
  quickLinks: {
    display: "flex",
    gap: "16px",
    borderTop: "1px solid #e9d5ff",
    paddingTop: "12px",
    flexWrap: "wrap",
  },
  link: {
    fontSize: "13px",
    color: "#7c3aed",
    textDecoration: "none",
    fontWeight: 500,
  },
  linkPrimary: {
    fontSize: "13px",
    color: "#ffffff",
    backgroundColor: "#7c3aed",
    padding: "4px 10px",
    borderRadius: "4px",
    textDecoration: "none",
    fontWeight: 500,
  },
};
