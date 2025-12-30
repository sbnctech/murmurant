"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

/**
 * Types for VP Activities Dashboard data (mirrors API response)
 */
type EventStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "CHANGES_REQUESTED"
  | "APPROVED"
  | "PUBLISHED"
  | "CANCELED"
  | "COMPLETED";

type EventSummary = {
  id: string;
  title: string;
  status: EventStatus;
  statusLabel: string;
  startTime: string;
  startTimeFormatted: string;
  endTime: string | null;
  location: string | null;
  category: string | null;
  eventChair: string | null;
  eventChairId: string | null;
  submittedAt: string | null;
  submittedBy: string | null;
  approvedAt: string | null;
  changesRequestedAt: string | null;
  rejectionNotes: string | null;
  registrationCount: number;
  capacity: number | null;
  auditTrailUrl: string;
};

type VPActivitiesDashboardData = {
  visible: boolean;
  pendingApproval: EventSummary[];
  changesRequested: EventSummary[];
  readyToPublish: EventSummary[];
  recentlyPublished: EventSummary[];
  upcomingEvents: EventSummary[];
  stats: {
    pendingCount: number;
    approvedCount: number;
    publishedThisMonth: number;
    upcomingCount: number;
  };
  capabilities: {
    canApprove: boolean;
    canRequestChanges: boolean;
    canPublish: boolean;
    canCancel: boolean;
    canViewAll: boolean;
  };
};

/**
 * VP Activities Dashboard Widget
 *
 * Displays event approval workflow status for the VP of Activities role:
 * - Events pending approval
 * - Events with changes requested (awaiting chair revision)
 * - Approved events ready to publish
 * - Recently published events
 * - Upcoming events
 *
 * Inline actions are gated by server-validated capabilities:
 * - Approve event (events:edit)
 * - Request changes (events:edit)
 * - Publish event (events:edit)
 * - Cancel event (events:edit)
 *
 * Authentication is handled via HttpOnly session cookies - no tokens are
 * passed from parent components (Charter P1, P7).
 *
 * Copyright © 2025 Murmurant, Inc.
 */
export default function VPActivitiesDashboard() {
  const [data, setData] = useState<VPActivitiesDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/officer/vp-activities/dashboard", {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok && res.status !== 200) {
        throw new Error("Failed to fetch dashboard data");
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Error fetching VP Activities dashboard:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Perform workflow action on event
   */
  const performAction = async (
    eventId: string,
    action: "approve" | "request_changes" | "publish" | "cancel",
    note?: string
  ) => {
    setActionInProgress(eventId);
    try {
      const res = await fetch(`/api/v1/events/${eventId}/status`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || errorData.error || "Action failed");
      }

      // Refresh dashboard data after action
      await fetchData();
      setShowRejectModal(null);
      setRejectNotes("");
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
      <div data-test-id="vp-activities-dashboard-loading" style={styles.container}>
        <div style={styles.header}>
          <span style={styles.icon}>&#128197;</span>
          <span style={styles.title}>VP Activities Dashboard</span>
        </div>
        <div style={styles.loadingText}>Loading...</div>
      </div>
    );
  }

  if (error || !data?.visible) {
    return null;
  }

  const {
    pendingApproval,
    changesRequested,
    readyToPublish,
    recentlyPublished,
    upcomingEvents,
    stats,
    capabilities,
  } = data;

  return (
    <div data-test-id="vp-activities-dashboard" style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.icon}>&#128197;</span>
        <div>
          <div data-test-id="vp-activities-dashboard-title" style={styles.title}>
            VP Activities Dashboard
          </div>
          <div style={styles.subtitle}>Event Approval Workflow</div>
        </div>
      </div>

      {/* Stats Summary */}
      <div data-test-id="vp-activities-stats" style={styles.statsRow}>
        <div style={styles.stat}>
          <span style={styles.statNumber}>{stats.pendingCount}</span>
          <span style={styles.statLabel}>Pending</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statNumber}>{stats.approvedCount}</span>
          <span style={styles.statLabel}>Ready to Publish</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statNumber}>{stats.publishedThisMonth}</span>
          <span style={styles.statLabel}>Published This Month</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statNumber}>{stats.upcomingCount}</span>
          <span style={styles.statLabel}>Upcoming</span>
        </div>
      </div>

      {/* Pending Approval - Most Important */}
      {pendingApproval.length > 0 && (
        <div data-test-id="vp-pending-approval" style={styles.alertSection}>
          <div style={styles.sectionTitle}>
            &#9888; Pending Your Approval ({pendingApproval.length})
          </div>
          <div style={styles.list}>
            {pendingApproval.map((event) => (
              <div key={event.id} data-test-id={`pending-event-${event.id}`} style={styles.listItem}>
                <div style={styles.itemContent}>
                  <div style={styles.itemHeader}>
                    <span style={styles.itemTitle}>{event.title}</span>
                    {event.category && (
                      <span style={styles.categoryBadge}>{event.category}</span>
                    )}
                  </div>
                  <div style={styles.itemMeta}>
                    <span>{event.startTimeFormatted}</span>
                    {event.location && <span>&#128205; {event.location}</span>}
                    {event.eventChair && <span>Chair: {event.eventChair}</span>}
                  </div>
                  {event.submittedBy && (
                    <div style={styles.itemSubmitted}>
                      Submitted by {event.submittedBy}
                    </div>
                  )}
                </div>
                <div style={styles.itemActions}>
                  <Link
                    href={`/admin/events/${event.id}`}
                    data-test-id={`view-event-${event.id}`}
                    style={styles.viewLink}
                  >
                    Review
                  </Link>
                  {capabilities.canApprove && (
                    <button
                      data-test-id={`approve-event-${event.id}`}
                      style={styles.approveButton}
                      onClick={() => performAction(event.id, "approve")}
                      disabled={actionInProgress === event.id}
                    >
                      {actionInProgress === event.id ? "..." : "Approve"}
                    </button>
                  )}
                  {capabilities.canRequestChanges && (
                    <button
                      data-test-id={`reject-event-${event.id}`}
                      style={styles.rejectButton}
                      onClick={() => setShowRejectModal(event.id)}
                      disabled={actionInProgress === event.id}
                    >
                      Request Changes
                    </button>
                  )}
                  <Link
                    href={event.auditTrailUrl}
                    data-test-id={`audit-event-${event.id}`}
                    style={styles.auditLink}
                    title="View audit trail"
                  >
                    &#128269;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Changes Requested */}
      <EventsSection
        testId="vp-changes-requested"
        title="Changes Requested"
        items={changesRequested}
        emptyText="No events awaiting revision"
        badgeStyle={styles.badgeWarning}
        showRejectionNotes
      />

      {/* Ready to Publish */}
      <EventsSection
        testId="vp-ready-publish"
        title="Approved - Ready to Publish"
        items={readyToPublish}
        emptyText="No events ready to publish"
        badgeStyle={styles.badgeSuccess}
        actionLabel={capabilities.canPublish ? "Publish" : undefined}
        onAction={capabilities.canPublish ? (id) => performAction(id, "publish") : undefined}
        actionInProgress={actionInProgress}
      />

      {/* Recently Published */}
      <EventsSection
        testId="vp-recently-published"
        title="Recently Published"
        items={recentlyPublished}
        emptyText="No recently published events"
        badgeStyle={styles.badgePublished}
        showRegistrations
        collapsed
      />

      {/* Upcoming Events */}
      <EventsSection
        testId="vp-upcoming"
        title="Upcoming Events (Next 30 Days)"
        items={upcomingEvents}
        emptyText="No upcoming events"
        badgeStyle={styles.badgeUpcoming}
        showRegistrations
        collapsed
      />

      {/* Quick Links */}
      <div style={styles.quickLinks}>
        <Link href="/admin/events" style={styles.link}>
          All Events
        </Link>
        <Link href="/admin/events?status=DRAFT" style={styles.link}>
          Drafts
        </Link>
        <Link href="/admin/registrations" style={styles.link}>
          Registrations
        </Link>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalTitle}>Request Changes</div>
            <p style={styles.modalText}>
              Please provide feedback for the event chair about what needs to be changed:
            </p>
            <textarea
              style={styles.textarea}
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="e.g., Please add parking information..."
              rows={4}
            />
            <div style={styles.modalActions}>
              <button
                style={styles.cancelButton}
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectNotes("");
                }}
              >
                Cancel
              </button>
              <button
                style={styles.submitButton}
                onClick={() => performAction(showRejectModal, "request_changes", rejectNotes)}
                disabled={!rejectNotes.trim() || actionInProgress === showRejectModal}
              >
                {actionInProgress === showRejectModal ? "Sending..." : "Send Feedback"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Events section component
 */
function EventsSection({
  testId,
  title,
  items,
  emptyText,
  actionLabel,
  onAction,
  actionInProgress,
  badgeStyle,
  showRegistrations,
  showRejectionNotes,
  collapsed,
}: {
  testId: string;
  title: string;
  items: EventSummary[];
  emptyText: string;
  actionLabel?: string;
  onAction?: (id: string) => void;
  actionInProgress?: string | null;
  badgeStyle?: React.CSSProperties;
  showRegistrations?: boolean;
  showRejectionNotes?: boolean;
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
          {items.map((event) => (
            <div
              key={event.id}
              data-test-id={`${testId}-item-${event.id}`}
              style={styles.listItem}
            >
              <div style={styles.itemContent}>
                <div style={styles.itemHeader}>
                  <span style={styles.itemTitle}>{event.title}</span>
                  <span style={{ ...styles.statusBadge, ...badgeStyle }}>
                    {event.statusLabel}
                  </span>
                </div>
                <div style={styles.itemMeta}>
                  <span>{event.startTimeFormatted}</span>
                  {event.location && <span>&#128205; {event.location}</span>}
                  {event.eventChair && <span>Chair: {event.eventChair}</span>}
                  {showRegistrations && (
                    <span>
                      {event.registrationCount}
                      {event.capacity ? `/${event.capacity}` : ""} registered
                    </span>
                  )}
                </div>
                {showRejectionNotes && event.rejectionNotes && (
                  <div style={styles.rejectionNotes}>
                    <strong>Feedback:</strong> {event.rejectionNotes}
                  </div>
                )}
              </div>

              <div style={styles.itemActions}>
                <Link
                  href={`/admin/events/${event.id}`}
                  data-test-id={`${testId}-view-${event.id}`}
                  style={styles.viewLink}
                >
                  View
                </Link>
                {actionLabel && onAction && (
                  <button
                    data-test-id={`${testId}-action-${event.id}`}
                    style={styles.actionButton}
                    onClick={() => onAction(event.id)}
                    disabled={actionInProgress === event.id}
                  >
                    {actionInProgress === event.id ? "..." : actionLabel}
                  </button>
                )}
                <Link
                  href={event.auditTrailUrl}
                  data-test-id={`${testId}-audit-${event.id}`}
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
 * Styles - Blue/Orange theme for VP Activities (distinct from Secretary green)
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "16px",
    border: "2px solid #2563eb",
    borderRadius: "8px",
    backgroundColor: "#eff6ff",
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
    color: "#1d4ed8",
  },
  subtitle: {
    fontSize: "13px",
    color: "#3b82f6",
  },
  loadingText: {
    fontSize: "14px",
    color: "#6b7280",
  },
  statsRow: {
    display: "flex",
    gap: "16px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "12px 16px",
    backgroundColor: "#ffffff",
    borderRadius: "6px",
    border: "1px solid #dbeafe",
    minWidth: "80px",
  },
  statNumber: {
    fontSize: "24px",
    fontWeight: 700,
    color: "#1d4ed8",
  },
  statLabel: {
    fontSize: "11px",
    color: "#6b7280",
    textAlign: "center",
  },
  alertSection: {
    marginBottom: "16px",
    padding: "12px",
    backgroundColor: "#fef3c7",
    borderRadius: "6px",
    border: "2px solid #f59e0b",
  },
  section: {
    marginBottom: "16px",
    padding: "12px",
    backgroundColor: "#ffffff",
    borderRadius: "6px",
    border: "1px solid #dbeafe",
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
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
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
    color: "#6b7280",
    marginTop: "4px",
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  itemSubmitted: {
    fontSize: "12px",
    color: "#9ca3af",
    marginTop: "4px",
    fontStyle: "italic",
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
  categoryBadge: {
    display: "inline-block",
    padding: "2px 6px",
    fontSize: "10px",
    fontWeight: 500,
    backgroundColor: "#f3f4f6",
    color: "#6b7280",
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
  badgeUpcoming: {
    backgroundColor: "#e0e7ff",
    color: "#4338ca",
  },
  viewLink: {
    fontSize: "13px",
    color: "#2563eb",
    textDecoration: "none",
  },
  approveButton: {
    padding: "4px 10px",
    fontSize: "12px",
    fontWeight: 500,
    backgroundColor: "#059669",
    color: "#ffffff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  rejectButton: {
    padding: "4px 10px",
    fontSize: "12px",
    fontWeight: 500,
    backgroundColor: "#ffffff",
    color: "#dc2626",
    border: "1px solid #dc2626",
    borderRadius: "4px",
    cursor: "pointer",
  },
  actionButton: {
    padding: "4px 10px",
    fontSize: "12px",
    fontWeight: 500,
    backgroundColor: "#2563eb",
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
  rejectionNotes: {
    fontSize: "12px",
    color: "#92400e",
    backgroundColor: "#fef3c7",
    padding: "6px 8px",
    borderRadius: "4px",
    marginTop: "6px",
  },
  quickLinks: {
    display: "flex",
    gap: "16px",
    borderTop: "1px solid #dbeafe",
    paddingTop: "12px",
  },
  link: {
    fontSize: "13px",
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: 500,
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    padding: "24px",
    maxWidth: "480px",
    width: "90%",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#111827",
    marginBottom: "12px",
  },
  modalText: {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "16px",
  },
  textarea: {
    width: "100%",
    padding: "10px",
    fontSize: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    resize: "vertical",
    fontFamily: "inherit",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "16px",
  },
  cancelButton: {
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: 500,
    backgroundColor: "#ffffff",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    cursor: "pointer",
  },
  submitButton: {
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: 500,
    backgroundColor: "#dc2626",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};
