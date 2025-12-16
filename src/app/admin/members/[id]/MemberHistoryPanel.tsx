"use client";

import { useState, useEffect, useCallback } from "react";
import { formatClubMonthYear } from "@/lib/timezone";
import { generateMemberHistoryProse } from "@/lib/serviceHistory/proseGenerator";

type MemberHistoryStats = {
  eventsAttended: number;
  volunteerRoles: number;
  leadershipRoles: number;
  yearsActive: number;
};

type TimelineEntry = {
  id: string;
  serviceType: string;
  roleTitle: string;
  committeeName: string | null;
  eventTitle: string | null;
  startAt: string;
  endAt: string | null;
  isActive: boolean;
};

type MemberHistoryData = {
  memberId: string;
  memberName: string;
  summaryText: string;
  stats: MemberHistoryStats;
  timeline: TimelineEntry[];
};

type MemberHistoryPanelProps = {
  memberId: string;
};

export default function MemberHistoryPanel({ memberId }: MemberHistoryPanelProps) {
  const [data, setData] = useState<MemberHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      setError(null);
      try {
        // credentials: 'include' sends HttpOnly session cookies (Charter P1, P7)
        const res = await fetch(`/api/admin/members/${memberId}/history`, {
          credentials: "include",
        });
        if (res.status === 403) {
          setError("forbidden");
          return;
        }
        if (!res.ok) {
          setError("Failed to load history");
          return;
        }
        const json = await res.json();
        setData(json);
      } catch {
        setError("Failed to load history");
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [memberId]);

  // Generate prose for exports
  const proseOutput = data
    ? generateMemberHistoryProse({
        memberId: data.memberId,
        memberName: data.memberName,
        stats: data.stats,
        timeline: data.timeline,
      })
    : null;

  const handleCopy = useCallback(async () => {
    if (!proseOutput?.fullProse) return;
    try {
      await navigator.clipboard.writeText(proseOutput.fullProse);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // Clipboard API failed, ignore
    }
  }, [proseOutput?.fullProse]);

  const handleDownloadMarkdown = useCallback(() => {
    if (!proseOutput?.markdown || !data) return;
    try {
      const blob = new Blob([proseOutput.markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeName = data.memberName.replace(/[^a-zA-Z0-9]/g, "_");
      a.href = url;
      a.download = `${safeName}_service_history.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    } catch {
      // Download failed, ignore
    }
  }, [proseOutput?.markdown, data]);

  if (loading) {
    return (
      <div data-test-id="member-history-loading" style={{ padding: "16px", color: "#666" }}>
        Loading history...
      </div>
    );
  }

  if (error === "forbidden") {
    return (
      <div data-test-id="member-history-forbidden" style={{ padding: "16px", color: "#999" }}>
        You do not have permission to view member history.
      </div>
    );
  }

  if (error) {
    return (
      <div data-test-id="member-history-error" style={{ padding: "16px", color: "#c00" }}>
        {error}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div data-test-id="member-history-panel" style={{ marginTop: "24px" }}>
      <h2 style={{ fontSize: "18px", marginBottom: "16px" }}>Member History</h2>

      {/* Stats Row */}
      <div
        data-test-id="member-history-stats"
        style={{
          display: "flex",
          gap: "24px",
          marginBottom: "16px",
          padding: "12px",
          backgroundColor: "#f5f5f5",
          borderRadius: "4px",
        }}
      >
        <div>
          <strong>Events Attended:</strong>{" "}
          <span data-test-id="stat-events-attended">{data.stats.eventsAttended}</span>
        </div>
        <div>
          <strong>Volunteer Roles:</strong>{" "}
          <span data-test-id="stat-volunteer-roles">{data.stats.volunteerRoles}</span>
        </div>
        <div>
          <strong>Leadership Roles:</strong>{" "}
          <span data-test-id="stat-leadership-roles">{data.stats.leadershipRoles}</span>
        </div>
        <div>
          <strong>Years Active:</strong>{" "}
          <span data-test-id="stat-years-active">{data.stats.yearsActive}</span>
        </div>
      </div>

      {/* Summary Text */}
      <div
        data-test-id="member-history-summary"
        style={{
          padding: "16px",
          backgroundColor: "#fafafa",
          border: "1px solid #ddd",
          borderRadius: "4px",
          lineHeight: "1.6",
          marginBottom: "12px",
          whiteSpace: "pre-wrap",
          fontFamily: "inherit",
        }}
      >
        {proseOutput?.fullProse || data.summaryText}
      </div>

      {/* Export Controls */}
      <div data-test-id="member-history-export-controls" style={{ marginBottom: "16px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button
          data-test-id="member-history-copy-button"
          onClick={handleCopy}
          style={{
            padding: "8px 16px",
            backgroundColor: copySuccess ? "#4caf50" : "#0066cc",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {copySuccess ? "Copied!" : "Copy to Clipboard"}
        </button>
        <button
          data-test-id="member-history-download-md"
          onClick={handleDownloadMarkdown}
          style={{
            padding: "8px 16px",
            backgroundColor: downloadSuccess ? "#4caf50" : "#555",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {downloadSuccess ? "Downloaded!" : "Download Markdown"}
        </button>
        <span style={{ fontSize: "12px", color: "#666", alignSelf: "center" }}>
          (Print Markdown to PDF for formal reports)
        </span>
      </div>

      {/* Timeline Toggle */}
      {data.timeline.length > 0 && (
        <div>
          <button
            data-test-id="member-history-timeline-toggle"
            onClick={() => setShowTimeline(!showTimeline)}
            style={{
              padding: "8px 16px",
              backgroundColor: "#f0f0f0",
              border: "1px solid #ccc",
              borderRadius: "4px",
              cursor: "pointer",
              marginBottom: "12px",
            }}
          >
            {showTimeline ? "Hide Timeline" : "Show Timeline"} ({data.timeline.length})
          </button>

          {showTimeline && (
            <table
              data-test-id="member-history-timeline"
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: "8px",
              }}
            >
              <thead>
                <tr>
                  <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>
                    Role
                  </th>
                  <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>
                    Type
                  </th>
                  <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>
                    Committee/Event
                  </th>
                  <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>
                    Period
                  </th>
                  <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.timeline.map((entry) => (
                  <tr key={entry.id} data-test-id="member-history-timeline-row">
                    <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                      {entry.roleTitle}
                    </td>
                    <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                      {formatServiceType(entry.serviceType)}
                    </td>
                    <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                      {entry.committeeName || entry.eventTitle || "-"}
                    </td>
                    <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                      {formatDateRange(entry.startAt, entry.endAt)}
                    </td>
                    <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                      {entry.isActive ? (
                        <span style={{ color: "#006600", fontWeight: 600 }}>Active</span>
                      ) : (
                        <span style={{ color: "#666" }}>Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function formatServiceType(type: string): string {
  switch (type) {
    case "BOARD_OFFICER":
      return "Board Officer";
    case "COMMITTEE_CHAIR":
      return "Committee Chair";
    case "COMMITTEE_MEMBER":
      return "Committee Member";
    case "EVENT_HOST":
      return "Event Host";
    default:
      return type;
  }
}

function formatDateRange(startAt: string, endAt: string | null): string {
  const start = formatClubMonthYear(new Date(startAt));
  if (!endAt) {
    return `${start} - Present`;
  }
  const end = formatClubMonthYear(new Date(endAt));
  return `${start} - ${end}`;
}
