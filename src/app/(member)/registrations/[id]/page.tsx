// Copyright (c) Santa Barbara Newcomers Club
// Event registration confirmation page

"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

/**
 * Registration details type
 */
type Registration = {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  ticketType: string;
  quantity: number;
  amountPaid: number;
  registeredAt: string;
  confirmationNumber: string;
  status: "confirmed" | "waitlisted" | "cancelled";
};

/**
 * Registration Confirmation Page
 *
 * Displays:
 * - Registration confirmation details
 * - Event name, date, time, location
 * - Ticket type and quantity
 * - Amount paid
 * - QR code placeholder for check-in
 * - Add to calendar buttons
 * - Cancel registration option
 */
export default function RegistrationConfirmationPage() {
  const params = useParams();
  const registrationId = params.id as string;
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Mock registration data
  const registration: Registration = {
    id: registrationId,
    eventId: "evt-123",
    eventTitle: "Wine Tasting Tour - Santa Ynez Valley",
    eventDate: "Saturday, January 15, 2025",
    eventTime: "9:00 AM - 4:00 PM",
    eventLocation: "Meet at Fess Parker Winery, 6200 Foxen Canyon Rd",
    ticketType: "Member",
    quantity: 2,
    amountPaid: 90.0,
    registeredAt: "December 20, 2024 at 3:45 PM",
    confirmationNumber: "SBNC-2025-0115-" + registrationId.slice(-4).toUpperCase(),
    status: "confirmed",
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleCancel = async () => {
    setCancelling(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setCancelling(false);
    setShowCancelModal(false);
    alert("Demo: Registration cancelled. Refund will be processed within 5-7 business days.");
  };

  const generateCalendarUrl = (type: "google" | "apple" | "outlook") => {
    const eventTitle = encodeURIComponent(registration.eventTitle);
    const eventLocation = encodeURIComponent(registration.eventLocation);
    const startDate = "20250115T090000";
    const endDate = "20250115T160000";

    switch (type) {
      case "google":
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${startDate}/${endDate}&location=${eventLocation}`;
      case "outlook":
        return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${eventTitle}&startdt=2025-01-15T09:00:00&enddt=2025-01-15T16:00:00&location=${eventLocation}`;
      case "apple":
        // Apple Calendar uses .ics file download
        return "#";
      default:
        return "#";
    }
  };

  const statusColors = {
    confirmed: { bg: "#dcfce7", text: "#166534", label: "Confirmed" },
    waitlisted: { bg: "#fef3c7", text: "#92400e", label: "Waitlisted" },
    cancelled: { bg: "#fee2e2", text: "#991b1b", label: "Cancelled" },
  };

  const status = statusColors[registration.status];

  return (
    <div style={styles.container}>
      {/* Success Banner */}
      <div style={styles.successBanner}>
        <span style={styles.successIcon}>&#10003;</span>
        <div>
          <div style={styles.successTitle}>Registration Confirmed!</div>
          <div style={styles.successSubtitle}>
            Confirmation #{registration.confirmationNumber}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.content}>
        {/* Event Details Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h1 style={styles.eventTitle}>{registration.eventTitle}</h1>
            <span
              style={{
                ...styles.statusBadge,
                backgroundColor: status.bg,
                color: status.text,
              }}
            >
              {status.label}
            </span>
          </div>

          <div style={styles.detailsGrid}>
            <div style={styles.detailItem}>
              <span style={styles.detailIcon}>&#128197;</span>
              <div>
                <div style={styles.detailLabel}>Date</div>
                <div style={styles.detailValue}>{registration.eventDate}</div>
              </div>
            </div>

            <div style={styles.detailItem}>
              <span style={styles.detailIcon}>&#128336;</span>
              <div>
                <div style={styles.detailLabel}>Time</div>
                <div style={styles.detailValue}>{registration.eventTime}</div>
              </div>
            </div>

            <div style={styles.detailItem}>
              <span style={styles.detailIcon}>&#128205;</span>
              <div>
                <div style={styles.detailLabel}>Location</div>
                <div style={styles.detailValue}>{registration.eventLocation}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Ticket & Payment Details */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Ticket Details</h2>
          <div style={styles.ticketRow}>
            <div>
              <div style={styles.ticketType}>{registration.ticketType}</div>
              <div style={styles.ticketQuantity}>
                Quantity: {registration.quantity}
              </div>
            </div>
            <div style={styles.ticketPrice}>
              {formatCurrency(registration.amountPaid)}
            </div>
          </div>
          <div style={styles.divider} />
          <div style={styles.registeredAt}>
            Registered on {registration.registeredAt}
          </div>
        </div>

        {/* QR Code Card */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Check-in QR Code</h2>
          <div style={styles.qrContainer}>
            <div style={styles.qrPlaceholder}>
              <span style={styles.qrIcon}>&#9635;</span>
              <div style={styles.qrText}>QR Code</div>
            </div>
            <div style={styles.qrInstructions}>
              Show this QR code at the event for quick check-in
            </div>
          </div>
        </div>

        {/* Add to Calendar */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Add to Calendar</h2>
          <div style={styles.calendarButtons}>
            <a
              href={generateCalendarUrl("google")}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.calendarButton}
            >
              <span style={styles.calendarIcon}>&#128197;</span>
              Google Calendar
            </a>
            <a
              href={generateCalendarUrl("outlook")}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.calendarButton}
            >
              <span style={styles.calendarIcon}>&#128197;</span>
              Outlook
            </a>
            <button
              style={styles.calendarButton}
              onClick={() => alert("Demo: .ics file would download for Apple Calendar")}
            >
              <span style={styles.calendarIcon}>&#128197;</span>
              Apple Calendar
            </button>
          </div>
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <Link href={`/events/${registration.eventId}`} style={styles.viewEventLink}>
            View Event Details
          </Link>
          {registration.status === "confirmed" && (
            <button
              style={styles.cancelButton}
              onClick={() => setShowCancelModal(true)}
            >
              Cancel Registration
            </button>
          )}
        </div>

        {/* Back Link */}
        <div style={styles.backLink}>
          <Link href="/my-events" style={styles.link}>
            &#8592; Back to My Events
          </Link>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCancelModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Cancel Registration?</h3>
            <p style={styles.modalText}>
              Are you sure you want to cancel your registration for{" "}
              <strong>{registration.eventTitle}</strong>?
            </p>
            <p style={styles.modalText}>
              {registration.amountPaid > 0
                ? `A refund of ${formatCurrency(registration.amountPaid)} will be processed within 5-7 business days.`
                : "This action cannot be undone."}
            </p>
            <div style={styles.modalActions}>
              <button
                style={styles.modalCancelButton}
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
              >
                Keep Registration
              </button>
              <button
                style={styles.modalConfirmButton}
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Note */}
      <div style={styles.footer}>
        <span style={styles.footerIcon}>&#9432;</span>
        Questions? Contact us at{" "}
        <a href="mailto:events@sbnewcomers.org" style={styles.footerLink}>
          events@sbnewcomers.org
        </a>
      </div>
    </div>
  );
}

/**
 * Inline styles
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "700px",
    margin: "0 auto",
    padding: "24px 20px",
  },
  successBanner: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    backgroundColor: "#dcfce7",
    borderRadius: "12px",
    padding: "20px 24px",
    marginBottom: "24px",
  },
  successIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    backgroundColor: "#16a34a",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "bold",
  },
  successTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#166534",
  },
  successSubtitle: {
    fontSize: "14px",
    color: "#15803d",
    marginTop: "4px",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    padding: "24px",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "20px",
  },
  eventTitle: {
    fontSize: "22px",
    fontWeight: "600",
    color: "#1f2937",
    margin: 0,
  },
  statusBadge: {
    padding: "6px 12px",
    fontSize: "13px",
    fontWeight: "500",
    borderRadius: "16px",
    whiteSpace: "nowrap",
  },
  detailsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  detailItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  },
  detailIcon: {
    fontSize: "20px",
    width: "24px",
    textAlign: "center",
  },
  detailLabel: {
    fontSize: "12px",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  detailValue: {
    fontSize: "15px",
    color: "#1f2937",
    marginTop: "2px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "16px",
  },
  ticketRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ticketType: {
    fontSize: "16px",
    fontWeight: "500",
    color: "#1f2937",
  },
  ticketQuantity: {
    fontSize: "14px",
    color: "#6b7280",
    marginTop: "4px",
  },
  ticketPrice: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1f2937",
  },
  divider: {
    height: "1px",
    backgroundColor: "#e5e7eb",
    margin: "16px 0",
  },
  registeredAt: {
    fontSize: "13px",
    color: "#6b7280",
  },
  qrContainer: {
    textAlign: "center",
  },
  qrPlaceholder: {
    width: "160px",
    height: "160px",
    backgroundColor: "#f3f4f6",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
    border: "2px dashed #d1d5db",
  },
  qrIcon: {
    fontSize: "64px",
    color: "#9ca3af",
  },
  qrText: {
    fontSize: "12px",
    color: "#6b7280",
    marginTop: "8px",
  },
  qrInstructions: {
    fontSize: "14px",
    color: "#6b7280",
  },
  calendarButtons: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
  },
  calendarButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: "500",
    backgroundColor: "#f3f4f6",
    color: "#374151",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    cursor: "pointer",
    textDecoration: "none",
  },
  calendarIcon: {
    fontSize: "16px",
  },
  actions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  viewEventLink: {
    flex: 1,
    minWidth: "200px",
    padding: "14px 20px",
    fontSize: "15px",
    fontWeight: "600",
    textAlign: "center",
    backgroundColor: "#2563eb",
    color: "white",
    borderRadius: "8px",
    textDecoration: "none",
  },
  cancelButton: {
    padding: "14px 20px",
    fontSize: "15px",
    fontWeight: "500",
    backgroundColor: "white",
    color: "#dc2626",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    cursor: "pointer",
  },
  backLink: {
    textAlign: "center",
    marginTop: "8px",
  },
  link: {
    fontSize: "14px",
    color: "#2563eb",
    textDecoration: "none",
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
    padding: "20px",
  },
  modal: {
    backgroundColor: "white",
    borderRadius: "12px",
    maxWidth: "420px",
    width: "100%",
    padding: "24px",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "12px",
  },
  modalText: {
    fontSize: "14px",
    color: "#4b5563",
    lineHeight: "1.6",
    marginBottom: "12px",
  },
  modalActions: {
    display: "flex",
    gap: "12px",
    marginTop: "20px",
  },
  modalCancelButton: {
    flex: 1,
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: "500",
    backgroundColor: "#f3f4f6",
    color: "#374151",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  modalConfirmButton: {
    flex: 1,
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: "500",
    backgroundColor: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  footer: {
    marginTop: "32px",
    padding: "16px 20px",
    backgroundColor: "#f0f9ff",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#0369a1",
    textAlign: "center",
  },
  footerIcon: {
    marginRight: "8px",
  },
  footerLink: {
    color: "#0369a1",
    textDecoration: "underline",
  },
};
