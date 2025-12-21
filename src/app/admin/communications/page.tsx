/**
 * VP Communications Dashboard
 *
 * URL: /admin/communications
 *
 * Shows:
 * - Events announcing this week (in eNews)
 * - Events with registration opening this week
 * - Deep links to event details for review
 * - eNews blurb draft editing (optional)
 *
 * Authorization: events:schedule:view capability
 *
 * Charter: P1 (identity), P2 (default deny)
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ============================================================================
// Types
// ============================================================================

interface EventSummary {
  id: string;
  title: string;
  category: string | null;
  committeeName: string | null;
  publishAt: string | null;
  publishedAt: string | null;
  registrationOpensAt: string | null;
  startTime: string;
  requiresRegistration: boolean;
  enewsBlurbDraft: string | null;
  operationalStatus: string;
  operationalStatusLabel: string;
  registrationOpensMessage: string | null;
  eventChairName: string | null;
}

interface WeekData {
  start: string;
  end: string;
  displayStart: string;
  displayEnd: string;
}

interface DashboardData {
  week: WeekData;
  announcing: EventSummary[];
  opening: EventSummary[];
  counts: {
    announcing: number;
    opening: number;
  };
}

type LoadState = "loading" | "ready" | "error";

// ============================================================================
// Main Component
// ============================================================================

export default function VPCommunicationsDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/v1/admin/communications/enews-week");
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            setErrorMessage("You don't have permission to view this dashboard.");
            setLoadState("error");
            return;
          }
          throw new Error("Failed to load dashboard data");
        }
        const result = await res.json();
        setData(result);
        setLoadState("ready");
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Failed to load dashboard");
        setLoadState("error");
      }
    }
    fetchData();
  }, []);

  if (loadState === "loading") {
    return (
      <div style={{ padding: "20px" }}>
        <h1 style={{ fontSize: "24px", marginBottom: "20px" }}>VP Communications Dashboard</h1>
        <div style={{ color: "#666" }}>Loading...</div>
      </div>
    );
  }

  if (loadState === "error" || !data) {
    return (
      <div style={{ padding: "20px" }}>
        <h1 style={{ fontSize: "24px", marginBottom: "20px" }}>VP Communications Dashboard</h1>
        <div
          style={{
            padding: "16px",
            backgroundColor: "#fee2e2",
            borderRadius: "8px",
            color: "#991b1b",
          }}
        >
          {errorMessage || "Failed to load dashboard data"}
        </div>
        <div style={{ marginTop: "16px" }}>
          <Link href="/admin" style={{ color: "#2563eb" }}>
            ← Back to Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div data-test-id="vp-comms-dashboard" style={{ padding: "20px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <Link href="/admin" style={{ color: "#6b7280", fontSize: "14px" }}>
            Admin
          </Link>
          <span style={{ color: "#6b7280" }}>/</span>
          <span style={{ fontWeight: 600 }}>Communications</span>
        </div>
        <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0 }}>VP Communications Dashboard</h1>
        <p style={{ color: "#6b7280", marginTop: "4px" }}>
          Week of {data.week.displayStart} – {data.week.displayEnd}
        </p>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <SummaryCard
          title="Announcing This Week"
          count={data.counts.announcing}
          color="#8b5cf6"
          description="Events appearing in this week's eNews"
        />
        <SummaryCard
          title="Registration Opens"
          count={data.counts.opening}
          color="#22c55e"
          description="Events opening for registration"
        />
      </div>

      {/* Announcing This Week Section */}
      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>
          📰 Announcing This Week
        </h2>
        {data.announcing.length === 0 ? (
          <EmptyState message="No events announcing this week." />
        ) : (
          <EventTable events={data.announcing} showPublishDate />
        )}
      </section>

      {/* Registration Opens Section */}
      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>
          🎟️ Registration Opens This Week
        </h2>
        {data.opening.length === 0 ? (
          <EmptyState message="No events with registration opening this week." />
        ) : (
          <EventTable events={data.opening} showRegistrationDate />
        )}
      </section>

      {/* Policy Note */}
      <div
        style={{
          padding: "16px",
          backgroundColor: "#f0fdf4",
          border: "1px solid #86efac",
          borderRadius: "8px",
          marginTop: "24px",
        }}
      >
        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#15803d", marginBottom: "8px" }}>
          SBNC Scheduling Policy
        </h3>
        <p style={{ fontSize: "13px", color: "#166534", margin: 0 }}>
          Events requiring registration are announced on <strong>Sunday</strong> (in the eNews)
          and registration opens the following <strong>Tuesday at 8:00 AM Pacific</strong>.
          This gives members time to plan before the registration rush.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

function SummaryCard({
  title,
  count,
  color,
  description,
}: {
  title: string;
  count: number;
  color: string;
  description: string;
}) {
  return (
    <div
      style={{
        padding: "16px",
        backgroundColor: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        borderLeft: `4px solid ${color}`,
      }}
    >
      <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "4px" }}>{title}</div>
      <div style={{ fontSize: "32px", fontWeight: 700, color }}>{count}</div>
      <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px" }}>{description}</div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#f9fafb",
        borderRadius: "8px",
        textAlign: "center",
        color: "#6b7280",
      }}
    >
      {message}
    </div>
  );
}

function EventTable({
  events,
  showPublishDate = false,
  showRegistrationDate = false,
}: {
  events: EventSummary[];
  showPublishDate?: boolean;
  showRegistrationDate?: boolean;
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          backgroundColor: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f9fafb" }}>
            <th style={thStyle}>Event</th>
            <th style={thStyle}>Committee</th>
            {showPublishDate && <th style={thStyle}>Publish Date</th>}
            {showRegistrationDate && <th style={thStyle}>Registration Opens</th>}
            <th style={thStyle}>Event Date</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>eNews Blurb</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id} style={{ borderTop: "1px solid #e5e7eb" }}>
              <td style={tdStyle}>
                <Link
                  href={`/admin/events/${event.id}`}
                  style={{ color: "#2563eb", fontWeight: 500 }}
                >
                  {event.title}
                </Link>
                {event.eventChairName && (
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    Chair: {event.eventChairName}
                  </div>
                )}
              </td>
              <td style={tdStyle}>
                <span style={{ color: event.committeeName ? "#111" : "#9ca3af" }}>
                  {event.committeeName || "—"}
                </span>
              </td>
              {showPublishDate && (
                <td style={tdStyle}>
                  {formatDate(event.publishAt || event.publishedAt)}
                </td>
              )}
              {showRegistrationDate && (
                <td style={tdStyle}>
                  {event.requiresRegistration && event.registrationOpensAt ? (
                    <div>
                      {formatDate(event.registrationOpensAt)}
                      <div style={{ fontSize: "11px", color: "#6b7280" }}>
                        {formatTime(event.registrationOpensAt)}
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: "#9ca3af" }}>N/A</span>
                  )}
                </td>
              )}
              <td style={tdStyle}>{formatDate(event.startTime)}</td>
              <td style={tdStyle}>
                <StatusBadge status={event.operationalStatus} label={event.operationalStatusLabel} />
              </td>
              <td style={tdStyle}>
                {event.enewsBlurbDraft ? (
                  <span style={{ color: "#22c55e", fontSize: "12px" }}>✓ Draft ready</span>
                ) : (
                  <span style={{ color: "#f59e0b", fontSize: "12px" }}>⚠ No blurb</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    DRAFT: { bg: "#f3f4f6", text: "#6b7280" },
    PENDING_APPROVAL: { bg: "#fef3c7", text: "#92400e" },
    CHANGES_REQUESTED: { bg: "#fee2e2", text: "#991b1b" },
    APPROVED_SCHEDULED: { bg: "#dbeafe", text: "#1e40af" },
    ANNOUNCED_NOT_OPEN: { bg: "#f3e8ff", text: "#7c3aed" },
    OPEN_FOR_REGISTRATION: { bg: "#dcfce7", text: "#166534" },
    REGISTRATION_CLOSED: { bg: "#f3f4f6", text: "#6b7280" },
    IN_PROGRESS: { bg: "#dcfce7", text: "#166534" },
    COMPLETED: { bg: "#f3f4f6", text: "#6b7280" },
    CANCELED: { bg: "#fee2e2", text: "#991b1b" },
    ARCHIVED: { bg: "#f3f4f6", text: "#9ca3af" },
  };

  const color = colors[status] || colors.DRAFT;

  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        fontSize: "12px",
        fontWeight: 500,
        borderRadius: "4px",
        backgroundColor: color.bg,
        color: color.text,
      }}
    >
      {label}
    </span>
  );
}

// ============================================================================
// Utilities
// ============================================================================

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px",
  fontSize: "12px",
  fontWeight: 600,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const tdStyle: React.CSSProperties = {
  padding: "12px",
  fontSize: "14px",
  verticalAlign: "top",
};

function formatDate(isoString: string | null): string {
  if (!isoString) return "—";
  const date = new Date(isoString);
  const formatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  });
  return formatter.format(date);
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  });
  return formatter.format(date);
}
