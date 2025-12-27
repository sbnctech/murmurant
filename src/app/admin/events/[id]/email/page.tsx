// Copyright (c) Santa Barbara Newcomers Club
// Event email composer page for event chairs

"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatClubDateTime } from "@/lib/timezone";

type RecipientGroup = "registered" | "waitlist" | "both";

interface SentEmail {
  id: string;
  subject: string;
  recipientGroup: RecipientGroup;
  recipientCount: number;
  sentAt: string;
  sentBy: string;
}

// Mock event data
const eventData = {
  id: "evt-123",
  title: "Wine Tasting Tour - Santa Ynez Valley",
  registeredCount: 24,
  waitlistCount: 8,
};

// Mock sent emails history
const sentEmailsHistory: SentEmail[] = [
  {
    id: "email-1",
    subject: "Important: Parking Information for Wine Tasting Tour",
    recipientGroup: "registered",
    recipientCount: 24,
    sentAt: "2024-12-20T14:30:00Z",
    sentBy: "Jane Smith",
  },
  {
    id: "email-2",
    subject: "Waitlist Update - Spots May Open Soon",
    recipientGroup: "waitlist",
    recipientCount: 8,
    sentAt: "2024-12-18T10:15:00Z",
    sentBy: "Jane Smith",
  },
  {
    id: "email-3",
    subject: "Event Reminder: Wine Tasting Tour This Saturday",
    recipientGroup: "both",
    recipientCount: 32,
    sentAt: "2024-12-15T09:00:00Z",
    sentBy: "John Doe",
  },
];

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return formatClubDateTime(date);
}

function getRecipientLabel(group: RecipientGroup): string {
  switch (group) {
    case "registered":
      return "Registered";
    case "waitlist":
      return "Waitlist";
    case "both":
      return "All";
  }
}

function getRecipientColor(group: RecipientGroup): { bg: string; text: string } {
  switch (group) {
    case "registered":
      return { bg: "#dcfce7", text: "#166534" };
    case "waitlist":
      return { bg: "#fef3c7", text: "#92400e" };
    case "both":
      return { bg: "#dbeafe", text: "#1e40af" };
  }
}

export default function EventEmailComposerPage() {
  const params = useParams();
  const eventId = params.id as string;

  // Form state
  const [recipientGroup, setRecipientGroup] = useState<RecipientGroup>("registered");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmSend, setShowConfirmSend] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  // Calculate recipient count
  const recipientCount = useMemo(() => {
    switch (recipientGroup) {
      case "registered":
        return eventData.registeredCount;
      case "waitlist":
        return eventData.waitlistCount;
      case "both":
        return eventData.registeredCount + eventData.waitlistCount;
    }
  }, [recipientGroup]);

  const handleSendTest = async () => {
    setSendingTest(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSendingTest(false);
    alert("Demo: Test email sent to your email address");
  };

  const handleSendAll = async () => {
    setSending(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setSending(false);
    setShowConfirmSend(false);
    setSubject("");
    setBody("");
    alert(`Demo: Email sent to ${recipientCount} recipients`);
  };

  const isFormValid = subject.trim().length > 0 && body.trim().length > 0;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <Link href={`/admin/events/${eventId}`} style={styles.backLink}>
          ← Back to Event
        </Link>
        <h1 style={styles.title}>Email Composer</h1>
        <p style={styles.subtitle}>{eventData.title}</p>
      </div>

      <div style={styles.layout}>
        {/* Main Form */}
        <div style={styles.mainColumn}>
          {/* Recipient Selector */}
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Recipients</h2>
            <div style={styles.recipientOptions}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="recipients"
                  value="registered"
                  checked={recipientGroup === "registered"}
                  onChange={() => setRecipientGroup("registered")}
                  style={styles.radio}
                />
                <span style={styles.radioText}>
                  Registered Attendees
                  <span style={styles.recipientCount}>({eventData.registeredCount})</span>
                </span>
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="recipients"
                  value="waitlist"
                  checked={recipientGroup === "waitlist"}
                  onChange={() => setRecipientGroup("waitlist")}
                  style={styles.radio}
                />
                <span style={styles.radioText}>
                  Waitlist Only
                  <span style={styles.recipientCount}>({eventData.waitlistCount})</span>
                </span>
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="recipients"
                  value="both"
                  checked={recipientGroup === "both"}
                  onChange={() => setRecipientGroup("both")}
                  style={styles.radio}
                />
                <span style={styles.radioText}>
                  All (Registered + Waitlist)
                  <span style={styles.recipientCount}>
                    ({eventData.registeredCount + eventData.waitlistCount})
                  </span>
                </span>
              </label>
            </div>
          </div>

          {/* Subject Line */}
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Subject Line</h2>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
              style={styles.subjectInput}
              data-test-id="email-subject"
            />
          </div>

          {/* Email Body */}
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Email Body</h2>
            <div style={styles.editorToolbar}>
              <button
                type="button"
                style={styles.toolbarButton}
                onClick={() => setBody(body + "<b></b>")}
                title="Bold"
              >
                <strong>B</strong>
              </button>
              <button
                type="button"
                style={styles.toolbarButton}
                onClick={() => setBody(body + "<i></i>")}
                title="Italic"
              >
                <em>I</em>
              </button>
              <button
                type="button"
                style={styles.toolbarButton}
                onClick={() => setBody(body + "<u></u>")}
                title="Underline"
              >
                <span style={{ textDecoration: "underline" }}>U</span>
              </button>
              <span style={styles.toolbarDivider} />
              <button
                type="button"
                style={styles.toolbarButton}
                onClick={() => setBody(body + "\n• ")}
                title="Bullet List"
              >
                • List
              </button>
              <button
                type="button"
                style={styles.toolbarButton}
                onClick={() => setBody(body + '<a href=""></a>')}
                title="Insert Link"
              >
                🔗 Link
              </button>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email message here...

You can include:
• Event details and reminders
• Important updates or changes
• Links to additional information
• Contact information for questions"
              style={styles.bodyTextarea}
              data-test-id="email-body"
            />
            <div style={styles.charCount}>
              {body.length} characters
            </div>
          </div>

          {/* Action Buttons */}
          <div style={styles.actions}>
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              disabled={!isFormValid}
              style={{
                ...styles.previewButton,
                opacity: isFormValid ? 1 : 0.5,
                cursor: isFormValid ? "pointer" : "not-allowed",
              }}
            >
              Preview Email
            </button>
            <button
              type="button"
              onClick={handleSendTest}
              disabled={!isFormValid || sendingTest}
              style={{
                ...styles.testButton,
                opacity: isFormValid && !sendingTest ? 1 : 0.5,
                cursor: isFormValid && !sendingTest ? "pointer" : "not-allowed",
              }}
            >
              {sendingTest ? "Sending..." : "Send Test to Self"}
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmSend(true)}
              disabled={!isFormValid}
              style={{
                ...styles.sendButton,
                opacity: isFormValid ? 1 : 0.5,
                cursor: isFormValid ? "pointer" : "not-allowed",
              }}
            >
              Send to {recipientCount} Recipients
            </button>
          </div>
        </div>

        {/* Sidebar - Sent Emails History */}
        <div style={styles.sidebar}>
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Sent Emails</h2>
            {sentEmailsHistory.length > 0 ? (
              <div style={styles.emailHistory}>
                {sentEmailsHistory.map((email) => {
                  const colors = getRecipientColor(email.recipientGroup);
                  return (
                    <div key={email.id} style={styles.historyItem}>
                      <div style={styles.historySubject}>{email.subject}</div>
                      <div style={styles.historyMeta}>
                        <span
                          style={{
                            ...styles.historyBadge,
                            backgroundColor: colors.bg,
                            color: colors.text,
                          }}
                        >
                          {getRecipientLabel(email.recipientGroup)} ({email.recipientCount})
                        </span>
                      </div>
                      <div style={styles.historyDate}>
                        {formatDateTime(email.sentAt)} by {email.sentBy}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={styles.emptyHistory}>
                No emails sent yet
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Recipients Summary</h2>
            <div style={styles.statsList}>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Registered</span>
                <span style={styles.statValue}>{eventData.registeredCount}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Waitlisted</span>
                <span style={styles.statValue}>{eventData.waitlistCount}</span>
              </div>
              <div style={{ ...styles.statItem, borderTop: "1px solid #e5e7eb", paddingTop: "12px" }}>
                <span style={{ ...styles.statLabel, fontWeight: 600 }}>Total</span>
                <span style={{ ...styles.statValue, fontWeight: 600 }}>
                  {eventData.registeredCount + eventData.waitlistCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div style={styles.modalOverlay} onClick={() => setShowPreview(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Email Preview</h3>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                style={styles.modalClose}
              >
                ✕
              </button>
            </div>
            <div style={styles.previewContent}>
              <div style={styles.previewField}>
                <span style={styles.previewLabel}>To:</span>
                <span style={styles.previewValue}>
                  {getRecipientLabel(recipientGroup)} ({recipientCount} recipients)
                </span>
              </div>
              <div style={styles.previewField}>
                <span style={styles.previewLabel}>Subject:</span>
                <span style={styles.previewValue}>{subject}</span>
              </div>
              <div style={styles.previewDivider} />
              <div style={styles.previewBody}>
                {body.split("\n").map((line, i) => (
                  <p key={i} style={{ margin: "0 0 8px 0" }}>
                    {line || <br />}
                  </p>
                ))}
              </div>
            </div>
            <div style={styles.modalActions}>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                style={styles.modalCancelButton}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPreview(false);
                  setShowConfirmSend(true);
                }}
                style={styles.modalConfirmButton}
              >
                Proceed to Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Send Modal */}
      {showConfirmSend && (
        <div style={styles.modalOverlay} onClick={() => setShowConfirmSend(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Confirm Send</h3>
              <button
                type="button"
                onClick={() => setShowConfirmSend(false)}
                style={styles.modalClose}
                disabled={sending}
              >
                ✕
              </button>
            </div>
            <div style={styles.confirmContent}>
              <div style={styles.warningIcon}>📧</div>
              <p style={styles.confirmText}>
                You are about to send this email to{" "}
                <strong>{recipientCount} {recipientCount === 1 ? "person" : "people"}</strong>.
              </p>
              <p style={styles.confirmSubtext}>
                This action cannot be undone. Please make sure you have reviewed the content.
              </p>
            </div>
            <div style={styles.modalActions}>
              <button
                type="button"
                onClick={() => setShowConfirmSend(false)}
                style={styles.modalCancelButton}
                disabled={sending}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendAll}
                style={styles.modalSendButton}
                disabled={sending}
              >
                {sending ? "Sending..." : `Send to ${recipientCount} Recipients`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "24px",
  },
  header: {
    marginBottom: "32px",
  },
  backLink: {
    color: "#2563eb",
    textDecoration: "none",
    fontSize: "14px",
    display: "inline-block",
    marginBottom: "12px",
  },
  title: {
    fontSize: "28px",
    fontWeight: 700,
    color: "#1f2937",
    margin: 0,
  },
  subtitle: {
    fontSize: "16px",
    color: "#6b7280",
    marginTop: "4px",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "1fr 350px",
    gap: "24px",
  },
  mainColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    padding: "20px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#374151",
    margin: "0 0 16px 0",
  },
  recipientOptions: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  radioLabel: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
  },
  radio: {
    marginRight: "12px",
    width: "18px",
    height: "18px",
    cursor: "pointer",
  },
  radioText: {
    fontSize: "15px",
    color: "#1f2937",
  },
  recipientCount: {
    marginLeft: "8px",
    color: "#6b7280",
  },
  subjectInput: {
    width: "100%",
    padding: "12px 16px",
    fontSize: "16px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    outline: "none",
    boxSizing: "border-box",
  },
  editorToolbar: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "8px",
    backgroundColor: "#f9fafb",
    borderRadius: "6px 6px 0 0",
    border: "1px solid #d1d5db",
    borderBottom: "none",
  },
  toolbarButton: {
    padding: "6px 12px",
    fontSize: "14px",
    backgroundColor: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "4px",
    cursor: "pointer",
  },
  toolbarDivider: {
    width: "1px",
    height: "24px",
    backgroundColor: "#e5e7eb",
    margin: "0 8px",
  },
  bodyTextarea: {
    width: "100%",
    minHeight: "250px",
    padding: "16px",
    fontSize: "15px",
    border: "1px solid #d1d5db",
    borderRadius: "0 0 6px 6px",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
    lineHeight: "1.6",
    boxSizing: "border-box",
  },
  charCount: {
    fontSize: "12px",
    color: "#9ca3af",
    textAlign: "right",
    marginTop: "8px",
  },
  actions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  previewButton: {
    padding: "12px 24px",
    fontSize: "15px",
    fontWeight: 500,
    backgroundColor: "#f3f4f6",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    cursor: "pointer",
  },
  testButton: {
    padding: "12px 24px",
    fontSize: "15px",
    fontWeight: 500,
    backgroundColor: "#fef3c7",
    color: "#92400e",
    border: "1px solid #fcd34d",
    borderRadius: "6px",
    cursor: "pointer",
  },
  sendButton: {
    padding: "12px 24px",
    fontSize: "15px",
    fontWeight: 500,
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  emailHistory: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  historyItem: {
    padding: "12px",
    backgroundColor: "#f9fafb",
    borderRadius: "6px",
  },
  historySubject: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#1f2937",
    marginBottom: "8px",
  },
  historyMeta: {
    marginBottom: "6px",
  },
  historyBadge: {
    display: "inline-block",
    padding: "2px 8px",
    fontSize: "12px",
    fontWeight: 500,
    borderRadius: "12px",
  },
  historyDate: {
    fontSize: "12px",
    color: "#6b7280",
  },
  emptyHistory: {
    padding: "24px",
    textAlign: "center",
    color: "#9ca3af",
    fontSize: "14px",
  },
  statsList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  statItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    fontSize: "14px",
    color: "#6b7280",
  },
  statValue: {
    fontSize: "16px",
    color: "#1f2937",
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
    maxWidth: "600px",
    width: "100%",
    maxHeight: "80vh",
    overflow: "auto",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderBottom: "1px solid #e5e7eb",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#1f2937",
    margin: 0,
  },
  modalClose: {
    background: "none",
    border: "none",
    fontSize: "20px",
    color: "#6b7280",
    cursor: "pointer",
    padding: "4px",
  },
  previewContent: {
    padding: "24px",
  },
  previewField: {
    display: "flex",
    marginBottom: "12px",
  },
  previewLabel: {
    fontWeight: 600,
    color: "#374151",
    width: "80px",
    flexShrink: 0,
  },
  previewValue: {
    color: "#1f2937",
  },
  previewDivider: {
    height: "1px",
    backgroundColor: "#e5e7eb",
    margin: "16px 0",
  },
  previewBody: {
    fontSize: "15px",
    color: "#1f2937",
    lineHeight: "1.6",
  },
  confirmContent: {
    padding: "32px 24px",
    textAlign: "center",
  },
  warningIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  confirmText: {
    fontSize: "16px",
    color: "#1f2937",
    marginBottom: "8px",
  },
  confirmSubtext: {
    fontSize: "14px",
    color: "#6b7280",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    padding: "16px 24px",
    borderTop: "1px solid #e5e7eb",
  },
  modalCancelButton: {
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: 500,
    backgroundColor: "#f3f4f6",
    color: "#374151",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  modalConfirmButton: {
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: 500,
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  modalSendButton: {
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: 500,
    backgroundColor: "#16a34a",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};
