// Copyright © 2025 Murmurant, Inc.
// Event waitlist management page for event chairs

"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

/**
 * Waitlist entry type
 */
type WaitlistEntry = {
  id: string;
  position: number;
  memberId: string;
  memberName: string;
  memberEmail: string;
  addedAt: string;
  ticketType: string;
  quantity: number;
};

/**
 * Event summary for header
 */
type EventSummary = {
  id: string;
  title: string;
  date: string;
  capacity: number;
  registered: number;
  waitlistCount: number;
};

/**
 * Waitlist Management Page
 *
 * For event chairs to manage waitlist:
 * - View waitlist in order
 * - Promote members to registered
 * - Remove from waitlist
 * - Send notifications
 * - View capacity status
 */
export default function WaitlistManagementPage() {
  const params = useParams();
  const eventId = params.id as string;
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());

  // Mock event data
  const event: EventSummary = {
    id: eventId,
    title: "Wine Tasting Tour - Santa Ynez Valley",
    date: "Saturday, January 15, 2025",
    capacity: 40,
    registered: 40,
    waitlistCount: 8,
  };

  // Mock waitlist data
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([
    {
      id: "wl-1",
      position: 1,
      memberId: "m-101",
      memberName: "Patricia Anderson",
      memberEmail: "panderson@email.com",
      addedAt: "Dec 18, 2024 at 2:15 PM",
      ticketType: "Member",
      quantity: 2,
    },
    {
      id: "wl-2",
      position: 2,
      memberId: "m-102",
      memberName: "Robert Martinez",
      memberEmail: "rmartinez@email.com",
      addedAt: "Dec 19, 2024 at 9:30 AM",
      ticketType: "Member",
      quantity: 1,
    },
    {
      id: "wl-3",
      position: 3,
      memberId: "m-103",
      memberName: "Susan Chen",
      memberEmail: "schen@email.com",
      addedAt: "Dec 19, 2024 at 11:45 AM",
      ticketType: "Member + Guest",
      quantity: 2,
    },
    {
      id: "wl-4",
      position: 4,
      memberId: "m-104",
      memberName: "Michael Thompson",
      memberEmail: "mthompson@email.com",
      addedAt: "Dec 20, 2024 at 3:20 PM",
      ticketType: "Member",
      quantity: 1,
    },
    {
      id: "wl-5",
      position: 5,
      memberId: "m-105",
      memberName: "Jennifer Wilson",
      memberEmail: "jwilson@email.com",
      addedAt: "Dec 21, 2024 at 10:00 AM",
      ticketType: "Member",
      quantity: 2,
    },
  ]);

  const spotsAvailable = event.capacity - event.registered;

  const handlePromote = async (entryId: string) => {
    setActionInProgress(entryId);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setWaitlist((prev) => prev.filter((e) => e.id !== entryId));
    setActionInProgress(null);
    alert("Demo: Member promoted to registered. Confirmation email sent.");
  };

  const handleRemove = async (entryId: string) => {
    if (!confirm("Remove this person from the waitlist?")) return;
    setActionInProgress(entryId);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setWaitlist((prev) => prev.filter((e) => e.id !== entryId));
    setActionInProgress(null);
    alert("Demo: Removed from waitlist. Notification sent.");
  };

  const handleSendNotification = async (entryId: string) => {
    setActionInProgress(entryId);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setActionInProgress(null);
    alert("Demo: Waitlist position update email sent.");
  };

  const handleBulkNotify = async () => {
    if (selectedEntries.size === 0) {
      alert("Please select entries to notify.");
      return;
    }
    setActionInProgress("bulk");
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setActionInProgress(null);
    setSelectedEntries(new Set());
    alert(`Demo: Notification sent to ${selectedEntries.size} waitlisted members.`);
  };

  const toggleSelectEntry = (entryId: string) => {
    setSelectedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedEntries.size === waitlist.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(waitlist.map((e) => e.id)));
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <Link href={`/admin/events/${eventId}`} style={styles.backLink}>
          &#8592; Back to Event
        </Link>
        <h1 style={styles.title}>Waitlist Management</h1>
        <p style={styles.eventName}>{event.title}</p>
        <p style={styles.eventDate}>{event.date}</p>
      </div>

      {/* Capacity Status */}
      <div style={styles.capacityCard}>
        <div style={styles.capacityGrid}>
          <div style={styles.capacityStat}>
            <div style={styles.capacityNumber}>{event.capacity}</div>
            <div style={styles.capacityLabel}>Capacity</div>
          </div>
          <div style={styles.capacityStat}>
            <div style={styles.capacityNumber}>{event.registered}</div>
            <div style={styles.capacityLabel}>Registered</div>
          </div>
          <div style={styles.capacityStat}>
            <div style={{ ...styles.capacityNumber, color: "#dc2626" }}>
              {waitlist.length}
            </div>
            <div style={styles.capacityLabel}>On Waitlist</div>
          </div>
          <div style={styles.capacityStat}>
            <div
              style={{
                ...styles.capacityNumber,
                color: spotsAvailable > 0 ? "#16a34a" : "#6b7280",
              }}
            >
              {spotsAvailable}
            </div>
            <div style={styles.capacityLabel}>Spots Available</div>
          </div>
        </div>
        {spotsAvailable > 0 && (
          <div style={styles.capacityNote}>
            <span style={styles.noteIcon}>&#9432;</span>
            {spotsAvailable} spot{spotsAvailable !== 1 ? "s" : ""} available.
            Consider promoting from the waitlist.
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {waitlist.length > 0 && (
        <div style={styles.bulkActions}>
          <label style={styles.selectAllLabel}>
            <input
              type="checkbox"
              checked={selectedEntries.size === waitlist.length}
              onChange={toggleSelectAll}
              style={styles.checkbox}
            />
            Select All ({selectedEntries.size} selected)
          </label>
          <button
            style={styles.bulkNotifyButton}
            onClick={handleBulkNotify}
            disabled={actionInProgress === "bulk" || selectedEntries.size === 0}
          >
            {actionInProgress === "bulk" ? "Sending..." : "Send Update to Selected"}
          </button>
        </div>
      )}

      {/* Waitlist Table */}
      {waitlist.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>&#10003;</span>
          <div style={styles.emptyText}>No one is on the waitlist</div>
          <div style={styles.emptySubtext}>
            All interested members have been registered.
          </div>
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}></th>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Tickets</th>
                <th style={styles.th}>Added</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {waitlist.map((entry) => (
                <tr key={entry.id} style={styles.tr}>
                  <td style={styles.td}>
                    <input
                      type="checkbox"
                      checked={selectedEntries.has(entry.id)}
                      onChange={() => toggleSelectEntry(entry.id)}
                      style={styles.checkbox}
                    />
                  </td>
                  <td style={styles.td}>
                    <span style={styles.positionBadge}>{entry.position}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.memberName}>{entry.memberName}</div>
                    <div style={styles.memberEmail}>{entry.memberEmail}</div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.ticketInfo}>{entry.ticketType}</div>
                    <div style={styles.ticketQty}>Qty: {entry.quantity}</div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.addedDate}>{entry.addedAt}</div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actionButtons}>
                      <button
                        style={styles.promoteButton}
                        onClick={() => handlePromote(entry.id)}
                        disabled={actionInProgress === entry.id || spotsAvailable < entry.quantity}
                        title={
                          spotsAvailable < entry.quantity
                            ? `Need ${entry.quantity} spots, only ${spotsAvailable} available`
                            : "Promote to registered"
                        }
                      >
                        {actionInProgress === entry.id ? "..." : "Promote"}
                      </button>
                      <button
                        style={styles.notifyButton}
                        onClick={() => handleSendNotification(entry.id)}
                        disabled={actionInProgress === entry.id}
                        title="Send position update email"
                      >
                        &#9993;
                      </button>
                      <button
                        style={styles.removeButton}
                        onClick={() => handleRemove(entry.id)}
                        disabled={actionInProgress === entry.id}
                        title="Remove from waitlist"
                      >
                        &#10005;
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Note */}
      <div style={styles.footer}>
        <span style={styles.footerIcon}>&#9432;</span>
        Promoted members receive automatic confirmation emails. Removed members
        are notified of their removal.
      </div>
    </div>
  );
}

/**
 * Inline styles
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "24px 20px",
  },
  header: {
    marginBottom: "24px",
  },
  backLink: {
    fontSize: "14px",
    color: "#2563eb",
    textDecoration: "none",
    display: "inline-block",
    marginBottom: "12px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: "8px",
  },
  eventName: {
    fontSize: "16px",
    color: "#374151",
    marginBottom: "4px",
  },
  eventDate: {
    fontSize: "14px",
    color: "#6b7280",
  },
  capacityCard: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    padding: "24px",
    marginBottom: "24px",
  },
  capacityGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    textAlign: "center",
  },
  capacityStat: {
    padding: "12px",
  },
  capacityNumber: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#1f2937",
  },
  capacityLabel: {
    fontSize: "13px",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginTop: "4px",
  },
  capacityNote: {
    marginTop: "16px",
    padding: "12px 16px",
    backgroundColor: "#fef3c7",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#92400e",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  noteIcon: {
    fontSize: "16px",
  },
  bulkActions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    marginBottom: "16px",
  },
  selectAllLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    color: "#374151",
    cursor: "pointer",
  },
  checkbox: {
    width: "16px",
    height: "16px",
    cursor: "pointer",
  },
  bulkNotifyButton: {
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "500",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    backgroundColor: "#fff",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
  },
  emptyIcon: {
    display: "block",
    fontSize: "48px",
    color: "#16a34a",
    marginBottom: "16px",
  },
  emptyText: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "8px",
  },
  emptySubtext: {
    fontSize: "14px",
    color: "#6b7280",
  },
  tableContainer: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  th: {
    textAlign: "left",
    padding: "14px 12px",
    backgroundColor: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    color: "#374151",
    fontWeight: "600",
    whiteSpace: "nowrap",
  },
  tr: {
    borderBottom: "1px solid #e5e7eb",
  },
  td: {
    padding: "14px 12px",
    verticalAlign: "middle",
  },
  positionBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    backgroundColor: "#e0e7ff",
    color: "#4338ca",
    fontWeight: "600",
    fontSize: "13px",
  },
  memberName: {
    fontWeight: "500",
    color: "#1f2937",
  },
  memberEmail: {
    fontSize: "13px",
    color: "#6b7280",
    marginTop: "2px",
  },
  ticketInfo: {
    color: "#374151",
  },
  ticketQty: {
    fontSize: "12px",
    color: "#6b7280",
    marginTop: "2px",
  },
  addedDate: {
    fontSize: "13px",
    color: "#6b7280",
  },
  actionButtons: {
    display: "flex",
    gap: "8px",
  },
  promoteButton: {
    padding: "6px 12px",
    fontSize: "13px",
    fontWeight: "500",
    backgroundColor: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  notifyButton: {
    padding: "6px 10px",
    fontSize: "14px",
    backgroundColor: "#f3f4f6",
    color: "#374151",
    border: "1px solid #e5e7eb",
    borderRadius: "4px",
    cursor: "pointer",
  },
  removeButton: {
    padding: "6px 10px",
    fontSize: "14px",
    backgroundColor: "#fff",
    color: "#dc2626",
    border: "1px solid #fecaca",
    borderRadius: "4px",
    cursor: "pointer",
  },
  footer: {
    marginTop: "24px",
    padding: "16px 20px",
    backgroundColor: "#f0f9ff",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#0369a1",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  footerIcon: {
    fontSize: "16px",
  },
};
