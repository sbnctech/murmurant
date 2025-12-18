"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

/**
 * Types for Secretary Dashboard data (mirrors API response)
 */
type MinutesStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "REVISED"
  | "APPROVED"
  | "PUBLISHED"
  | "ARCHIVED";

type MinutesSummary = {
  id: string;
  meetingId: string;
  meetingDate: string;
  meetingDateFormatted: string;
  meetingType: string;
  meetingTitle: string | null;
  status: MinutesStatus;
  statusLabel: string;
  version: number;
  updatedAt: string;
  lastEditedBy: string | null;
  auditTrailUrl: string;
};

type SecretaryDashboardData = {
  visible: boolean;
  upcomingMeeting: {
    id: string;
    date: string;
    dateFormatted: string;
    type: string;
    title: string | null;
    hasMinutes: boolean;
  } | null;
  draftsInProgress: MinutesSummary[];
  awaitingReview: MinutesSummary[];
  readyToPublish: MinutesSummary[];
  recentlyPublished: MinutesSummary[];
  capabilities: {
    canCreateDraft: boolean;
    canEditDraft: boolean;
    canSubmit: boolean;
    canPublish: boolean;
  };
};

/**
 * Secretary Dashboard Widget
 *
 * Displays minutes workflow status for the Secretary role:
 * - Upcoming meeting quick link
 * - Draft minutes in progress
 * - Minutes awaiting President review
 * - Approved minutes ready to publish
 * - Recently published minutes
 *
 * Inline actions are gated by server-validated capabilities:
 * - Create draft (meetings:minutes:draft:create)
 * - Edit draft (meetings:minutes:draft:edit)
 * - Submit for review (meetings:minutes:draft:submit)
 * - Publish (meetings:minutes:finalize)
 *
 * Authentication is handled via HttpOnly session cookies - no tokens are
 * passed from parent components (Charter P1, P7).
 */
export default function SecretaryDashboard() {
  const [data, setData] = useState<SecretaryDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/officer/secretary/dashboard", {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok && res.status !== 200) {
        throw new Error("Failed to fetch dashboard data");
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Error fetching secretary dashboard:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Perform workflow action on minutes
   */
  const performAction = async (
    minutesId: string,
    action: "submit" | "publish",
    notes?: string
  ) => {
    setActionInProgress(minutesId);
    try {
      const res = await fetch(`/api/v1/officer/governance/minutes/${minutesId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Action failed");
      }

      // Refresh dashboard data after action
      await fetchData();
    } catch (err) {
      console.error(`Error performing ${action}:`, err);
      alert(`Failed to ${action}: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setActionInProgress(null);
    }
  };

  // Don't render if loading, error, or not visible
  if (loading) {
    return (
      <div data-test-id="secretary-dashboard-loading" style={styles.container}>
        <div style={styles.header}>
          <span style={styles.icon}>&#128221;</span>
          <span style={styles.title}>Secretary Dashboard</span>
        </div>
        <div style={styles.loadingText}>Loading...</div>
      </div>
    );
  }

  if (error || !data?.visible) {
    return null;
  }

  const { upcomingMeeting, draftsInProgress, awaitingReview, readyToPublish, recentlyPublished, capabilities } = data;

  return (
    <div data-test-id="secretary-dashboard" style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.icon}>&#128221;</span>
        <div>
          <div data-test-id="secretary-dashboard-title" style={styles.title}>
            Secretary Dashboard
          </div>
          <div style={styles.subtitle}>Minutes Workflow</div>
        </div>
      </div>

      {/* Upcoming Meeting */}
      {upcomingMeeting && (
        <div data-test-id="secretary-upcoming-meeting" style={styles.section}>
          <div style={styles.sectionTitle}>Upcoming Meeting</div>
          <div style={styles.meetingCard}>
            <div style={styles.meetingInfo}>
              <strong>{upcomingMeeting.type}</strong> Meeting
              <span style={styles.meetingDate}>{upcomingMeeting.dateFormatted}</span>
            </div>
            {upcomingMeeting.title && (
              <div style={styles.meetingTitle}>{upcomingMeeting.title}</div>
            )}
            <div style={styles.meetingActions}>
              {!upcomingMeeting.hasMinutes && capabilities.canCreateDraft && (
                <Link
                  href={`/admin/governance/minutes/new?meetingId=${upcomingMeeting.id}`}
                  data-test-id="secretary-create-draft-btn"
                  style={styles.primaryButton}
                >
                  Create Draft Minutes
                </Link>
              )}
              {upcomingMeeting.hasMinutes && (
                <Link
                  href={`/admin/governance/meetings/${upcomingMeeting.id}`}
                  style={styles.secondaryButton}
                >
                  View Meeting
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Drafts in Progress */}
      <MinutesSection
        testId="secretary-drafts"
        title="Drafts in Progress"
        items={draftsInProgress}
        emptyText="No drafts in progress"
        actionLabel={capabilities.canSubmit ? "Submit for Review" : undefined}
        onAction={
          capabilities.canSubmit
            ? (id) => performAction(id, "submit")
            : undefined
        }
        actionInProgress={actionInProgress}
        showEdit={capabilities.canEditDraft}
      />

      {/* Awaiting Review */}
      <MinutesSection
        testId="secretary-awaiting-review"
        title="Awaiting President Review"
        items={awaitingReview}
        emptyText="No minutes awaiting review"
        badgeStyle={styles.badgeWarning}
      />

      {/* Ready to Publish */}
      <MinutesSection
        testId="secretary-ready-publish"
        title="Approved - Ready to Publish"
        items={readyToPublish}
        emptyText="No minutes ready to publish"
        actionLabel={capabilities.canPublish ? "Publish" : undefined}
        onAction={
          capabilities.canPublish
            ? (id) => performAction(id, "publish")
            : undefined
        }
        actionInProgress={actionInProgress}
        badgeStyle={styles.badgeSuccess}
      />

      {/* Recently Published */}
      <MinutesSection
        testId="secretary-published"
        title="Recently Published"
        items={recentlyPublished}
        emptyText="No published minutes"
        badgeStyle={styles.badgePublished}
        collapsed
      />

      {/* Quick Links */}
      <div style={styles.quickLinks}>
        <Link href="/admin/governance/minutes" style={styles.link}>
          View All Minutes
        </Link>
        <Link href="/admin/governance/meetings" style={styles.link}>
          All Meetings
        </Link>
      </div>
    </div>
  );
}

/**
 * Minutes section component
 */
function MinutesSection({
  testId,
  title,
  items,
  emptyText,
  actionLabel,
  onAction,
  actionInProgress,
  badgeStyle,
  showEdit,
  collapsed,
}: {
  testId: string;
  title: string;
  items: MinutesSummary[];
  emptyText: string;
  actionLabel?: string;
  onAction?: (id: string) => void;
  actionInProgress?: string | null;
  badgeStyle?: React.CSSProperties;
  showEdit?: boolean;
  collapsed?: boolean;
}) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

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
          {items.map((item) => (
            <div
              key={item.id}
              data-test-id={`${testId}-item-${item.id}`}
              style={styles.listItem}
            >
              <div style={styles.itemContent}>
                <div style={styles.itemHeader}>
                  <span style={styles.itemTitle}>
                    {item.meetingType} - {item.meetingDateFormatted}
                  </span>
                  <span style={{ ...styles.statusBadge, ...badgeStyle }}>
                    {item.statusLabel}
                  </span>
                </div>
                {item.meetingTitle && (
                  <div style={styles.itemSubtitle}>{item.meetingTitle}</div>
                )}
                <div style={styles.itemMeta}>
                  {item.lastEditedBy && (
                    <span>Last edited by {item.lastEditedBy}</span>
                  )}
                  {item.version > 1 && <span>v{item.version}</span>}
                </div>
              </div>

              <div style={styles.itemActions}>
                {showEdit && (
                  <Link
                    href={`/admin/governance/minutes/${item.id}/edit`}
                    data-test-id={`${testId}-edit-${item.id}`}
                    style={styles.editLink}
                  >
                    Edit
                  </Link>
                )}
                {actionLabel && onAction && (
                  <button
                    data-test-id={`${testId}-action-${item.id}`}
                    style={styles.actionButton}
                    onClick={() => onAction(item.id)}
                    disabled={actionInProgress === item.id}
                  >
                    {actionInProgress === item.id ? "..." : actionLabel}
                  </button>
                )}
                <Link
                  href={item.auditTrailUrl}
                  data-test-id={`${testId}-audit-${item.id}`}
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
    border: "2px solid #059669",
    borderRadius: "8px",
    backgroundColor: "#ecfdf5",
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
    color: "#047857",
  },
  subtitle: {
    fontSize: "13px",
    color: "#065f46",
  },
  loadingText: {
    fontSize: "14px",
    color: "#6b7280",
  },
  section: {
    marginBottom: "16px",
    padding: "12px",
    backgroundColor: "#ffffff",
    borderRadius: "6px",
    border: "1px solid #d1fae5",
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
    backgroundColor: "#d1fae5",
    color: "#047857",
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
  itemSubtitle: {
    fontSize: "13px",
    color: "#6b7280",
    marginTop: "2px",
  },
  itemMeta: {
    fontSize: "12px",
    color: "#9ca3af",
    marginTop: "4px",
    display: "flex",
    gap: "12px",
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
  badgeWarning: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  badgeSuccess: {
    backgroundColor: "#d1fae5",
    color: "#047857",
  },
  badgePublished: {
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
  },
  editLink: {
    fontSize: "13px",
    color: "#2563eb",
    textDecoration: "none",
  },
  actionButton: {
    padding: "4px 10px",
    fontSize: "12px",
    fontWeight: 500,
    backgroundColor: "#059669",
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
  meetingCard: {
    marginTop: "8px",
  },
  meetingInfo: {
    fontSize: "14px",
    color: "#111827",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  meetingDate: {
    color: "#6b7280",
  },
  meetingTitle: {
    fontSize: "13px",
    color: "#6b7280",
    marginTop: "4px",
  },
  meetingActions: {
    marginTop: "10px",
    display: "flex",
    gap: "8px",
  },
  primaryButton: {
    display: "inline-block",
    padding: "8px 14px",
    fontSize: "13px",
    fontWeight: 500,
    backgroundColor: "#059669",
    color: "#ffffff",
    borderRadius: "4px",
    textDecoration: "none",
  },
  secondaryButton: {
    display: "inline-block",
    padding: "8px 14px",
    fontSize: "13px",
    fontWeight: 500,
    backgroundColor: "#ffffff",
    color: "#059669",
    border: "1px solid #059669",
    borderRadius: "4px",
    textDecoration: "none",
  },
  quickLinks: {
    display: "flex",
    gap: "16px",
    borderTop: "1px solid #d1fae5",
    paddingTop: "12px",
  },
  link: {
    fontSize: "13px",
    color: "#059669",
    textDecoration: "none",
    fontWeight: 500,
  },
};
