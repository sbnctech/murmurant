/**
 * SupportDashboard - Tech Lead Support Case Dashboard Widget
 *
 * Displays support case statistics and recent open cases.
 * Access is restricted to admin-level users via API.
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

// Dashboard data types (mirrors API response)
type SupportDashboardData = {
  visible: boolean;
  stats: {
    open: number;
    awaitingInfo: number;
    inProgress: number;
    escalated: number;
    resolved: number;
    closedThisWeek: number;
    totalOpen: number;
  };
  avgResolutionDays: number | null;
  recentCases: Array<{
    id: string;
    caseNumber: number;
    submitterName: string;
    channel: string;
    status: string;
    category: string;
    description: string;
    receivedAt: string;
    ageHours: number;
  }>;
};

// Status badge colors
const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  OPEN: { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
  AWAITING_INFO: { bg: "#fefce8", text: "#ca8a04", border: "#fef08a" },
  IN_PROGRESS: { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" },
  ESCALATED: { bg: "#faf5ff", text: "#9333ea", border: "#e9d5ff" },
  RESOLVED: { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
  CLOSED: { bg: "#f9fafb", text: "#6b7280", border: "#e5e7eb" },
};

// Channel labels
const CHANNEL_LABELS: Record<string, string> = {
  EMAIL: "Email",
  TEXT: "Text",
  SLACK: "Slack",
  IN_PERSON: "In Person",
  PHONE: "Phone",
  OTHER: "Other",
};

// Category labels
const CATEGORY_LABELS: Record<string, string> = {
  BUG: "Bug",
  UX_GAP: "UX Gap",
  RULE_MISMATCH: "Rule Mismatch",
  MISSING_CAPABILITY: "Feature Request",
  EDUCATION: "Education",
  UNKNOWN: "Unknown",
};

function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.CLOSED;
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: "4px",
        fontSize: "11px",
        fontWeight: 500,
        backgroundColor: colors.bg,
        color: colors.text,
        border: "1px solid " + colors.border,
      }}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div
      style={{
        padding: "12px 16px",
        backgroundColor: "#fff",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "24px",
          fontWeight: 700,
          color: color || "#111827",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "12px", color: "#6b7280" }}>{label}</div>
    </div>
  );
}

export default function SupportDashboard() {
  const [data, setData] = useState<SupportDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/support/dashboard", {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok && res.status !== 200) {
        throw new Error("Failed to fetch dashboard data");
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Error fetching support dashboard:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Don't render if loading, error, or not visible
  if (loading) {
    return (
      <div style={{ padding: "20px", color: "#6b7280" }}>
        Loading support dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px", color: "#dc2626" }}>
        Error loading support dashboard: {error}
      </div>
    );
  }

  if (!data || !data.visible) {
    return null;
  }

  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          backgroundColor: "#7c3aed",
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
            Support Cases
          </h3>
          <p style={{ margin: "4px 0 0 0", fontSize: "13px", opacity: 0.9 }}>
            Tech Lead intake queue
          </p>
        </div>
        <Link
          href="/admin/support"
          style={{
            padding: "8px 16px",
            backgroundColor: "rgba(255,255,255,0.2)",
            color: "#fff",
            borderRadius: "6px",
            fontSize: "13px",
            textDecoration: "none",
          }}
        >
          View All Cases
        </Link>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          padding: "16px 20px",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
          backgroundColor: "#f9fafb",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <StatCard label="Open" value={data.stats.open} color="#dc2626" />
        <StatCard
          label="Awaiting Info"
          value={data.stats.awaitingInfo}
          color="#ca8a04"
        />
        <StatCard label="In Progress" value={data.stats.inProgress} color="#2563eb" />
        <StatCard label="Escalated" value={data.stats.escalated} color="#9333ea" />
      </div>

      {/* Summary stats */}
      <div
        style={{
          padding: "12px 20px",
          display: "flex",
          gap: "24px",
          fontSize: "13px",
          color: "#6b7280",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <span>
          <strong>{data.stats.totalOpen}</strong> total open cases
        </span>
        <span>
          <strong>{data.stats.closedThisWeek}</strong> closed this week
        </span>
        {data.avgResolutionDays !== null && (
          <span>
            Avg resolution: <strong>{data.avgResolutionDays}</strong> days
          </span>
        )}
      </div>

      {/* Recent Cases */}
      <div style={{ padding: "16px 20px" }}>
        <h4
          style={{
            margin: "0 0 12px 0",
            fontSize: "14px",
            fontWeight: 600,
            color: "#374151",
          }}
        >
          Recent Open Cases
        </h4>

        {data.recentCases.length === 0 ? (
          <div
            style={{
              padding: "24px",
              textAlign: "center",
              color: "#6b7280",
              fontSize: "13px",
            }}
          >
            No open cases
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {data.recentCases.slice(0, 5).map((c) => (
              <Link
                key={c.id}
                href={"/admin/support/" + c.id}
                style={{
                  display: "block",
                  padding: "12px",
                  backgroundColor: "#f9fafb",
                  borderRadius: "6px",
                  border: "1px solid #e5e7eb",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "6px",
                  }}
                >
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span
                      style={{ fontSize: "12px", fontWeight: 600, color: "#7c3aed" }}
                    >
                      #{c.caseNumber}
                    </span>
                    <StatusBadge status={c.status} />
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "2px 6px",
                        backgroundColor: "#e5e7eb",
                        borderRadius: "4px",
                        color: "#374151",
                      }}
                    >
                      {CHANNEL_LABELS[c.channel] || c.channel}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "2px 6px",
                        backgroundColor: "#dbeafe",
                        borderRadius: "4px",
                        color: "#1e40af",
                      }}
                    >
                      {CATEGORY_LABELS[c.category] || c.category}
                    </span>
                  </div>
                  <span style={{ fontSize: "11px", color: "#6b7280" }}>
                    {c.ageHours < 24
                      ? c.ageHours + "h ago"
                      : Math.floor(c.ageHours / 24) + "d ago"}
                  </span>
                </div>
                <div style={{ fontSize: "13px", fontWeight: 500, color: "#111827" }}>
                  {c.submitterName}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginTop: "4px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.description}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
