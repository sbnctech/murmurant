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
 * VP Activities Dashboard
 *
 * Displays event approval workflow for VP of Activities:
 * - Pending approval queue with one-click actions
 * - Events awaiting changes
 * - Ready to publish queue
 * - Upcoming events calendar view
 * - Quick stats
 *
 * Authentication via HttpOnly session cookies (Charter P1, P7).
 */
export default function VPActivitiesDashboard() {
  const [data, setData] = useState<VPActivitiesDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

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
   * Perform an action on an event
   */
  const performAction = async (
    eventId: string,
    action: "approve" | "request_changes" | "publish",
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
        throw new Error(errorData.message || "Action failed");
      }

      await fetchData();
    } catch (err) {
      console.error(`Error performing action:`, err);
      alert(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setActionInProgress(null);
    }
  };

  /**
   * Request changes with a note
   */
  const handleRequestChanges = async (eventId: string) => {
    const note = prompt("Enter feedback for the event chair:");
    if (note === null) return; // Cancelled
    await performAction(eventId, "request_changes", note);
  };

  // Loading state
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

  // Error or not visible
  if (error || !data?.visible) {
    return null;
  }

  const {
    pendingApproval,
    changesRequested,
    readyToPublish,
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

      {/* Quick Stats */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.pendingCount}</div>
          <div style={styles.statLabel}>Pending</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.approvedCount}</div>
          <div style={styles.statLabel}>Approved</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.publishedThisMonth}</div>
          <div style={styles.statLabel}>Published This Month</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.upcomingCount}</div>
          <div style={styles.statLabel}>Upcoming</div>
        </div>
      </div>

      {/* Pending Approval Queue */}
      {pendingApproval.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionIcon}>&#9888;</span>
            Pending Approval ({pendingApproval.length})
          </div>
          <div style={styles.cardGrid}>
            {pendingApproval.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                actions={
                  capabilities.canApprove && (
                    <div style={styles.actionRow}>
                      <button
                        style={styles.approveButton}
                        onClick={() => performAction(event.id, "approve")}
                        disabled={actionInProgress === event.id}
                      >
                        {actionInProgress === event.id ? "..." : "Approve"}
                      </button>
                      <button
                        style={styles.changesButton}
                        onClick={() => handleRequestChanges(event.id)}
                        disabled={actionInProgress === event.id}
                      >
                        Request Changes
                      </button>
                    </div>
                  )
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Changes Requested */}
      {changesRequested.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionIcon}>&#128221;</span>
            Awaiting Revisions ({changesRequested.length})
          </div>
          <div style={styles.cardGrid}>
            {changesRequested.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                showRejectionNotes
              />
            ))}
          </div>
        </div>
      )}

      {/* Ready to Publish */}
      {readyToPublish.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionIcon}>&#10003;</span>
            Ready to Publish ({readyToPublish.length})
          </div>
          <div style={styles.cardGrid}>
            {readyToPublish.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                actions={
                  capabilities.canPublish && (
                    <button
                      style={styles.publishButton}
                      onClick={() => performAction(event.id, "publish")}
                      disabled={actionInProgress === event.id}
                    >
                      {actionInProgress === event.id ? "..." : "Publish"}
                    </button>
                  )
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events Calendar View */}
      {upcomingEvents.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionIcon}>&#128198;</span>
            Upcoming Events ({upcomingEvents.length})
          </div>
          <div style={styles.calendarList}>
            {upcomingEvents.map((event) => (
              <div key={event.id} style={styles.calendarItem}>
                <div style={styles.calendarDate}>
                  {event.startTimeFormatted}
                </div>
                <div style={styles.calendarDetails}>
                  <Link href={`/admin/events/${event.id}`} style={styles.link}>
                    {event.title}
                  </Link>
                  <span style={styles.calendarMeta}>
                    {event.location && ` • ${event.location}`}
                    {event.registrationCount > 0 && ` • ${event.registrationCount} registered`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {pendingApproval.length === 0 &&
        changesRequested.length === 0 &&
        readyToPublish.length === 0 && (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>&#10003;</span>
            <div>All caught up! No events need your attention.</div>
          </div>
        )}
    </div>
  );
}

/**
 * Event Card Component
 */
function EventCard({
  event,
  actions,
  showRejectionNotes,
}: {
  event: EventSummary;
  actions?: React.ReactNode;
  showRejectionNotes?: boolean;
}) {
  return (
    <div style={styles.card} data-test-id={`event-card-${event.id}`}>
      <div style={styles.cardHeader}>
        <Link href={`/admin/events/${event.id}`} style={styles.cardTitle}>
          {event.title}
        </Link>
        <span style={styles.statusBadge} data-status={event.status}>
          {event.statusLabel}
        </span>
      </div>

      <div style={styles.cardMeta}>
        <div>
          <strong>Date:</strong> {event.startTimeFormatted}
        </div>
        {event.eventChair && (
          <div>
            <strong>Chair:</strong> {event.eventChair}
          </div>
        )}
        {event.location && (
          <div>
            <strong>Location:</strong> {event.location}
          </div>
        )}
        <div>
          <strong>Capacity:</strong>{" "}
          {event.capacity !== null ? event.capacity : "Unlimited"}
          {event.registrationCount > 0 && ` (${event.registrationCount} registered)`}
        </div>
      </div>

      {showRejectionNotes && event.rejectionNotes && (
        <div style={styles.rejectionNotes}>
          <strong>Feedback:</strong> {event.rejectionNotes}
        </div>
      )}

      {actions && <div style={styles.cardActions}>{actions}</div>}

      <div style={styles.cardFooter}>
        <Link href={event.auditTrailUrl} style={styles.auditLink}>
          View Audit Trail
        </Link>
      </div>
    </div>
  );
}

/**
 * Inline styles
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "20px",
    marginBottom: "20px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
  },
  icon: {
    fontSize: "32px",
  },
  title: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1f2937",
  },
  subtitle: {
    fontSize: "14px",
    color: "#6b7280",
  },
  loadingText: {
    color: "#6b7280",
    padding: "20px 0",
  },
  statsRow: {
    display: "flex",
    gap: "16px",
    marginBottom: "24px",
    flexWrap: "wrap" as const,
  },
  statCard: {
    flex: "1",
    minWidth: "120px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    padding: "16px",
    textAlign: "center" as const,
  },
  statNumber: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1f2937",
  },
  statLabel: {
    fontSize: "12px",
    color: "#6b7280",
    textTransform: "uppercase" as const,
  },
  section: {
    marginBottom: "24px",
  },
  sectionHeader: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  sectionIcon: {
    fontSize: "18px",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "16px",
  },
  card: {
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "16px",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "12px",
    gap: "8px",
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1f2937",
    textDecoration: "none",
  },
  statusBadge: {
    fontSize: "11px",
    fontWeight: "500",
    padding: "2px 8px",
    borderRadius: "12px",
    backgroundColor: "#e5e7eb",
    color: "#374151",
    whiteSpace: "nowrap" as const,
  },
  cardMeta: {
    fontSize: "13px",
    color: "#6b7280",
    lineHeight: "1.6",
  },
  rejectionNotes: {
    marginTop: "12px",
    padding: "8px",
    backgroundColor: "#fef3c7",
    borderRadius: "4px",
    fontSize: "13px",
    color: "#92400e",
  },
  cardActions: {
    marginTop: "16px",
  },
  actionRow: {
    display: "flex",
    gap: "8px",
  },
  approveButton: {
    backgroundColor: "#10b981",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
  },
  changesButton: {
    backgroundColor: "#f59e0b",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
  },
  publishButton: {
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
  },
  cardFooter: {
    marginTop: "12px",
    paddingTop: "12px",
    borderTop: "1px solid #e5e7eb",
  },
  auditLink: {
    fontSize: "12px",
    color: "#6b7280",
    textDecoration: "none",
  },
  calendarList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
  },
  calendarItem: {
    display: "flex",
    gap: "16px",
    padding: "12px",
    backgroundColor: "#f9fafb",
    borderRadius: "6px",
    alignItems: "center",
  },
  calendarDate: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#374151",
    minWidth: "120px",
  },
  calendarDetails: {
    flex: 1,
  },
  calendarMeta: {
    fontSize: "12px",
    color: "#6b7280",
  },
  link: {
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: "500",
  },
  emptyState: {
    textAlign: "center" as const,
    padding: "40px 20px",
    color: "#6b7280",
  },
  emptyIcon: {
    fontSize: "48px",
    display: "block",
    marginBottom: "12px",
    color: "#10b981",
  },
};
