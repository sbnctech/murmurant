// Copyright (c) Santa Barbara Newcomers Club
// Bulk member email tool for administrators

"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { formatClubDateTime } from "@/lib/timezone";

type RecipientFilter = "all" | "tier" | "committee" | "status";
type MemberTier = "individual" | "household" | "lifetime" | "honorary";
type MemberStatus = "active" | "pending" | "expired" | "alumni";
type EmailTemplate = "blank" | "newsletter" | "announcement" | "reminder";
type ScheduleOption = "now" | "later";

interface SentEmail {
  id: string;
  subject: string;
  recipientFilter: string;
  recipientCount: number;
  template: EmailTemplate;
  sentAt: string;
  sentBy: string;
  status: "sent" | "scheduled" | "failed";
}

// Mock data for member counts
const memberCounts = {
  all: 342,
  tiers: {
    individual: 145,
    household: 168,
    lifetime: 24,
    honorary: 5,
  },
  committees: {
    events: 28,
    hospitality: 15,
    membership: 12,
    communications: 8,
    finance: 6,
  },
  statuses: {
    active: 298,
    pending: 18,
    expired: 22,
    alumni: 4,
  },
};

// Mock sent emails history
const sentEmailsHistory: SentEmail[] = [
  {
    id: "bulk-1",
    subject: "December Newsletter - Upcoming Events & Holiday Schedule",
    recipientFilter: "All Active Members",
    recipientCount: 298,
    template: "newsletter",
    sentAt: "2024-12-15T10:00:00Z",
    sentBy: "Admin User",
    status: "sent",
  },
  {
    id: "bulk-2",
    subject: "Important: Annual Meeting Reminder",
    recipientFilter: "All Members",
    recipientCount: 342,
    template: "reminder",
    sentAt: "2024-12-10T14:30:00Z",
    sentBy: "Admin User",
    status: "sent",
  },
  {
    id: "bulk-3",
    subject: "New Year Celebration Announcement",
    recipientFilter: "Active Members",
    recipientCount: 298,
    template: "announcement",
    sentAt: "2024-12-20T09:00:00Z",
    sentBy: "Admin User",
    status: "scheduled",
  },
  {
    id: "bulk-4",
    subject: "Membership Renewal Reminder",
    recipientFilter: "Expired Members",
    recipientCount: 22,
    template: "reminder",
    sentAt: "2024-12-05T11:00:00Z",
    sentBy: "Admin User",
    status: "sent",
  },
];

const templateOptions: { value: EmailTemplate; label: string; description: string }[] = [
  { value: "blank", label: "Blank", description: "Start from scratch" },
  { value: "newsletter", label: "Newsletter", description: "Monthly club newsletter format" },
  { value: "announcement", label: "Announcement", description: "Important club announcements" },
  { value: "reminder", label: "Reminder", description: "Event or deadline reminders" },
];

const templateContent: Record<EmailTemplate, { subject: string; body: string }> = {
  blank: { subject: "", body: "" },
  newsletter: {
    subject: "[Month] Newsletter - Santa Barbara Newcomers Club",
    body: `Dear Members,

Welcome to this month's newsletter! Here's what's happening at the Santa Barbara Newcomers Club.

## Upcoming Events
- [Event 1]
- [Event 2]
- [Event 3]

## Club News
[Add your news here]

## Member Spotlight
[Feature a member]

Best regards,
The SBNC Communications Team`,
  },
  announcement: {
    subject: "Important Announcement - Santa Barbara Newcomers Club",
    body: `Dear Members,

We have an important announcement to share with you.

[Your announcement here]

If you have any questions, please don't hesitate to reach out.

Best regards,
Santa Barbara Newcomers Club`,
  },
  reminder: {
    subject: "Reminder: [Event/Deadline] - Santa Barbara Newcomers Club",
    body: `Dear Members,

This is a friendly reminder about:

[Event/Deadline Details]

Date: [Date]
Time: [Time]
Location: [Location]

Please [action needed].

See you there!
Santa Barbara Newcomers Club`,
  },
};

function getStatusColor(status: SentEmail["status"]): { bg: string; text: string } {
  switch (status) {
    case "sent":
      return { bg: "#dcfce7", text: "#166534" };
    case "scheduled":
      return { bg: "#dbeafe", text: "#1e40af" };
    case "failed":
      return { bg: "#fee2e2", text: "#991b1b" };
  }
}

export default function BulkEmailPage() {
  // Filter state
  const [filterType, setFilterType] = useState<RecipientFilter>("all");
  const [selectedTiers, setSelectedTiers] = useState<MemberTier[]>([]);
  const [selectedCommittee, setSelectedCommittee] = useState<string>("");
  const [selectedStatuses, setSelectedStatuses] = useState<MemberStatus[]>(["active"]);

  // Email content state
  const [template, setTemplate] = useState<EmailTemplate>("blank");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  // Schedule state
  const [scheduleOption, setScheduleOption] = useState<ScheduleOption>("now");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  // UI state
  const [showConfirmSend, setShowConfirmSend] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  // Calculate recipient count based on filters
  const recipientCount = useMemo(() => {
    switch (filterType) {
      case "all":
        return memberCounts.all;
      case "tier":
        return selectedTiers.reduce(
          (sum, tier) => sum + memberCounts.tiers[tier],
          0
        );
      case "committee":
        return selectedCommittee
          ? memberCounts.committees[selectedCommittee as keyof typeof memberCounts.committees] || 0
          : 0;
      case "status":
        return selectedStatuses.reduce(
          (sum, status) => sum + memberCounts.statuses[status],
          0
        );
      default:
        return 0;
    }
  }, [filterType, selectedTiers, selectedCommittee, selectedStatuses]);

  // Get filter description for display
  const filterDescription = useMemo(() => {
    switch (filterType) {
      case "all":
        return "All Members";
      case "tier":
        return selectedTiers.length > 0
          ? `Tiers: ${selectedTiers.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(", ")}`
          : "Select tiers";
      case "committee":
        return selectedCommittee
          ? `Committee: ${selectedCommittee.charAt(0).toUpperCase() + selectedCommittee.slice(1)}`
          : "Select committee";
      case "status":
        return selectedStatuses.length > 0
          ? `Status: ${selectedStatuses.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(", ")}`
          : "Select statuses";
      default:
        return "";
    }
  }, [filterType, selectedTiers, selectedCommittee, selectedStatuses]);

  const handleTemplateChange = (newTemplate: EmailTemplate) => {
    setTemplate(newTemplate);
    const content = templateContent[newTemplate];
    setSubject(content.subject);
    setBody(content.body);
  };

  const handleTierToggle = (tier: MemberTier) => {
    setSelectedTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
  };

  const handleStatusToggle = (status: MemberStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const handleSendTest = async () => {
    setSendingTest(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSendingTest(false);
    alert("Demo: Test email sent to your email address");
  };

  const handleSend = async () => {
    setSending(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setSending(false);
    setShowConfirmSend(false);
    const action = scheduleOption === "now" ? "sent" : "scheduled";
    alert(`Demo: Email ${action} to ${recipientCount} recipients`);
    setSubject("");
    setBody("");
    setTemplate("blank");
  };

  const isFormValid =
    subject.trim().length > 0 &&
    body.trim().length > 0 &&
    recipientCount > 0 &&
    (scheduleOption === "now" || (scheduledDate && scheduledTime));

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Link href="/admin/comms" style={styles.backLink}>
          ← Back to Communications
        </Link>
        <h1 style={styles.title}>Bulk Email Tool</h1>
        <p style={styles.subtitle}>Send emails to filtered groups of members</p>
      </div>

      <div style={styles.layout}>
        <div style={styles.mainColumn}>
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Recipients</h2>
            <div style={styles.filterTypeRow}>
              <label style={styles.filterLabel}>Filter by:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as RecipientFilter)}
                style={styles.select}
              >
                <option value="all">All Members</option>
                <option value="tier">Membership Tier</option>
                <option value="committee">Committee</option>
                <option value="status">Member Status</option>
              </select>
            </div>

            {filterType === "tier" && (
              <div style={styles.checkboxGroup}>
                {(Object.keys(memberCounts.tiers) as MemberTier[]).map((tier) => (
                  <label key={tier} style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={selectedTiers.includes(tier)}
                      onChange={() => handleTierToggle(tier)}
                      style={styles.checkbox}
                    />
                    <span style={styles.checkboxText}>
                      {tier.charAt(0).toUpperCase() + tier.slice(1)}
                      <span style={styles.countBadge}>({memberCounts.tiers[tier]})</span>
                    </span>
                  </label>
                ))}
              </div>
            )}

            {filterType === "committee" && (
              <div style={styles.radioGroup}>
                {Object.keys(memberCounts.committees).map((committee) => (
                  <label key={committee} style={styles.radioLabel}>
                    <input
                      type="radio"
                      name="committee"
                      value={committee}
                      checked={selectedCommittee === committee}
                      onChange={(e) => setSelectedCommittee(e.target.value)}
                      style={styles.radio}
                    />
                    <span style={styles.radioText}>
                      {committee.charAt(0).toUpperCase() + committee.slice(1)}
                      <span style={styles.countBadge}>
                        ({memberCounts.committees[committee as keyof typeof memberCounts.committees]})
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}

            {filterType === "status" && (
              <div style={styles.checkboxGroup}>
                {(Object.keys(memberCounts.statuses) as MemberStatus[]).map((status) => (
                  <label key={status} style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(status)}
                      onChange={() => handleStatusToggle(status)}
                      style={styles.checkbox}
                    />
                    <span style={styles.checkboxText}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                      <span style={styles.countBadge}>({memberCounts.statuses[status]})</span>
                    </span>
                  </label>
                ))}
              </div>
            )}

            <div style={styles.recipientPreview}>
              <div style={styles.recipientCount}>
                <span style={styles.recipientNumber}>{recipientCount}</span>
                <span style={styles.recipientLabel}>recipients</span>
              </div>
              <div style={styles.filterDesc}>{filterDescription}</div>
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Email Template</h2>
            <div style={styles.templateGrid}>
              {templateOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleTemplateChange(opt.value)}
                  style={{
                    ...styles.templateButton,
                    borderColor: template === opt.value ? "#2563eb" : "#e5e7eb",
                    backgroundColor: template === opt.value ? "#eff6ff" : "white",
                  }}
                >
                  <div style={styles.templateLabel}>{opt.label}</div>
                  <div style={styles.templateDesc}>{opt.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Email Content</h2>
            <div style={styles.formGroup}>
              <label style={styles.inputLabel}>Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject..."
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.inputLabel}>Body</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your email message here..."
                style={styles.textarea}
              />
              <div style={styles.charCount}>{body.length} characters</div>
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Send Options</h2>
            <div style={styles.scheduleOptions}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="schedule"
                  value="now"
                  checked={scheduleOption === "now"}
                  onChange={() => setScheduleOption("now")}
                  style={styles.radio}
                />
                <span style={styles.radioText}>Send immediately</span>
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="schedule"
                  value="later"
                  checked={scheduleOption === "later"}
                  onChange={() => setScheduleOption("later")}
                  style={styles.radio}
                />
                <span style={styles.radioText}>Schedule for later</span>
              </label>
            </div>

            {scheduleOption === "later" && (
              <div style={styles.scheduleInputs}>
                <div style={styles.scheduleField}>
                  <label style={styles.inputLabel}>Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div style={styles.scheduleField}>
                  <label style={styles.inputLabel}>Time</label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>
            )}
          </div>

          <div style={styles.actions}>
            <button
              type="button"
              onClick={handleSendTest}
              disabled={!subject.trim() || !body.trim() || sendingTest}
              style={{
                ...styles.testButton,
                opacity: subject.trim() && body.trim() && !sendingTest ? 1 : 0.5,
                cursor: subject.trim() && body.trim() && !sendingTest ? "pointer" : "not-allowed",
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
              {scheduleOption === "now"
                ? `Send to ${recipientCount} Recipients`
                : `Schedule for ${recipientCount} Recipients`}
            </button>
          </div>
        </div>

        <div style={styles.sidebar}>
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Recent Bulk Emails</h2>
            {sentEmailsHistory.length > 0 ? (
              <div style={styles.historyList}>
                {sentEmailsHistory.map((email) => {
                  const statusColor = getStatusColor(email.status);
                  return (
                    <div key={email.id} style={styles.historyItem}>
                      <div style={styles.historySubject}>{email.subject}</div>
                      <div style={styles.historyMeta}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor: statusColor.bg,
                            color: statusColor.text,
                          }}
                        >
                          {email.status.charAt(0).toUpperCase() + email.status.slice(1)}
                        </span>
                        <span style={styles.historyRecipients}>
                          {email.recipientCount} recipients
                        </span>
                      </div>
                      <div style={styles.historyFilter}>{email.recipientFilter}</div>
                      <div style={styles.historyDate}>
                        {formatClubDateTime(new Date(email.sentAt))} by {email.sentBy}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={styles.emptyHistory}>No bulk emails sent yet</div>
            )}
          </div>

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Member Counts</h2>
            <div style={styles.statsList}>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Total Members</span>
                <span style={styles.statValue}>{memberCounts.all}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Active</span>
                <span style={styles.statValue}>{memberCounts.statuses.active}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Pending</span>
                <span style={styles.statValue}>{memberCounts.statuses.pending}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Expired</span>
                <span style={styles.statValue}>{memberCounts.statuses.expired}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showConfirmSend && (
        <div style={styles.modalOverlay} onClick={() => setShowConfirmSend(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Confirm Bulk Email</h3>
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
                You are about to {scheduleOption === "now" ? "send" : "schedule"} this email to{" "}
                <strong>{recipientCount} members</strong>.
              </p>
              <div style={styles.confirmDetails}>
                <div style={styles.confirmRow}>
                  <span style={styles.confirmLabel}>Recipients:</span>
                  <span>{filterDescription}</span>
                </div>
                <div style={styles.confirmRow}>
                  <span style={styles.confirmLabel}>Subject:</span>
                  <span>{subject}</span>
                </div>
                {scheduleOption === "later" && (
                  <div style={styles.confirmRow}>
                    <span style={styles.confirmLabel}>Scheduled:</span>
                    <span>{scheduledDate} at {scheduledTime}</span>
                  </div>
                )}
              </div>
              <p style={styles.confirmWarning}>
                This action cannot be undone. Please review before confirming.
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
                onClick={handleSend}
                style={styles.modalSendButton}
                disabled={sending}
              >
                {sending
                  ? "Processing..."
                  : scheduleOption === "now"
                    ? `Send to ${recipientCount} Members`
                    : `Schedule Email`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: "1200px", margin: "0 auto", padding: "24px" },
  header: { marginBottom: "32px" },
  backLink: { color: "#2563eb", textDecoration: "none", fontSize: "14px", display: "inline-block", marginBottom: "12px" },
  title: { fontSize: "28px", fontWeight: 700, color: "#1f2937", margin: 0 },
  subtitle: { fontSize: "16px", color: "#6b7280", marginTop: "4px" },
  layout: { display: "grid", gridTemplateColumns: "1fr 350px", gap: "24px" },
  mainColumn: { display: "flex", flexDirection: "column", gap: "20px" },
  sidebar: { display: "flex", flexDirection: "column", gap: "20px" },
  card: { backgroundColor: "white", borderRadius: "8px", border: "1px solid #e5e7eb", padding: "20px" },
  sectionTitle: { fontSize: "16px", fontWeight: 600, color: "#374151", margin: "0 0 16px 0" },
  filterTypeRow: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" },
  filterLabel: { fontSize: "14px", fontWeight: 500, color: "#374151" },
  select: { padding: "8px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", backgroundColor: "white", cursor: "pointer" },
  checkboxGroup: { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" },
  checkboxLabel: { display: "flex", alignItems: "center", cursor: "pointer" },
  checkbox: { marginRight: "10px", width: "16px", height: "16px", cursor: "pointer" },
  checkboxText: { fontSize: "14px", color: "#1f2937" },
  radioGroup: { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" },
  radioLabel: { display: "flex", alignItems: "center", cursor: "pointer" },
  radio: { marginRight: "10px", width: "16px", height: "16px", cursor: "pointer" },
  radioText: { fontSize: "14px", color: "#1f2937" },
  countBadge: { marginLeft: "8px", color: "#6b7280", fontSize: "13px" },
  recipientPreview: { padding: "16px", backgroundColor: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" },
  recipientCount: { display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "4px" },
  recipientNumber: { fontSize: "32px", fontWeight: 700, color: "#166534" },
  recipientLabel: { fontSize: "16px", color: "#166534" },
  filterDesc: { fontSize: "14px", color: "#15803d" },
  templateGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" },
  templateButton: { padding: "16px", textAlign: "left", border: "2px solid #e5e7eb", borderRadius: "8px", cursor: "pointer", backgroundColor: "white", transition: "all 0.2s" },
  templateLabel: { fontSize: "15px", fontWeight: 600, color: "#1f2937", marginBottom: "4px" },
  templateDesc: { fontSize: "13px", color: "#6b7280" },
  formGroup: { marginBottom: "16px" },
  inputLabel: { display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" },
  input: { width: "100%", padding: "10px 12px", fontSize: "15px", border: "1px solid #d1d5db", borderRadius: "6px", boxSizing: "border-box" },
  textarea: { width: "100%", minHeight: "200px", padding: "12px", fontSize: "15px", border: "1px solid #d1d5db", borderRadius: "6px", resize: "vertical", fontFamily: "inherit", lineHeight: "1.6", boxSizing: "border-box" },
  charCount: { fontSize: "12px", color: "#9ca3af", textAlign: "right", marginTop: "6px" },
  scheduleOptions: { display: "flex", flexDirection: "column", gap: "10px" },
  scheduleInputs: { display: "flex", gap: "16px", marginTop: "16px" },
  scheduleField: { flex: 1 },
  actions: { display: "flex", gap: "12px", justifyContent: "flex-end" },
  testButton: { padding: "12px 24px", fontSize: "15px", fontWeight: 500, backgroundColor: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d", borderRadius: "6px", cursor: "pointer" },
  sendButton: { padding: "12px 24px", fontSize: "15px", fontWeight: 500, backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" },
  historyList: { display: "flex", flexDirection: "column", gap: "16px" },
  historyItem: { padding: "12px", backgroundColor: "#f9fafb", borderRadius: "6px" },
  historySubject: { fontSize: "14px", fontWeight: 500, color: "#1f2937", marginBottom: "8px" },
  historyMeta: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" },
  statusBadge: { display: "inline-block", padding: "2px 8px", fontSize: "11px", fontWeight: 500, borderRadius: "12px" },
  historyRecipients: { fontSize: "12px", color: "#6b7280" },
  historyFilter: { fontSize: "12px", color: "#6b7280", marginBottom: "4px" },
  historyDate: { fontSize: "11px", color: "#9ca3af" },
  emptyHistory: { padding: "24px", textAlign: "center", color: "#9ca3af", fontSize: "14px" },
  statsList: { display: "flex", flexDirection: "column", gap: "10px" },
  statItem: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  statLabel: { fontSize: "14px", color: "#6b7280" },
  statValue: { fontSize: "15px", fontWeight: 500, color: "#1f2937" },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" },
  modal: { backgroundColor: "white", borderRadius: "12px", maxWidth: "500px", width: "100%" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #e5e7eb" },
  modalTitle: { fontSize: "18px", fontWeight: 600, color: "#1f2937", margin: 0 },
  modalClose: { background: "none", border: "none", fontSize: "20px", color: "#6b7280", cursor: "pointer", padding: "4px" },
  confirmContent: { padding: "24px", textAlign: "center" },
  warningIcon: { fontSize: "48px", marginBottom: "16px" },
  confirmText: { fontSize: "16px", color: "#1f2937", marginBottom: "16px" },
  confirmDetails: { backgroundColor: "#f9fafb", borderRadius: "8px", padding: "16px", textAlign: "left", marginBottom: "16px" },
  confirmRow: { display: "flex", marginBottom: "8px" },
  confirmLabel: { fontWeight: 500, color: "#374151", width: "100px", flexShrink: 0 },
  confirmWarning: { fontSize: "13px", color: "#dc2626" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: "12px", padding: "16px 24px", borderTop: "1px solid #e5e7eb" },
  modalCancelButton: { padding: "10px 20px", fontSize: "14px", fontWeight: 500, backgroundColor: "#f3f4f6", color: "#374151", border: "none", borderRadius: "6px", cursor: "pointer" },
  modalSendButton: { padding: "10px 20px", fontSize: "14px", fontWeight: 500, backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" },
};
