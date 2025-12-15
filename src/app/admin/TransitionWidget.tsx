"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type TransitionWidgetData = {
  visible: boolean;
  nextTransitionDate: string;
  nextTransitionDateFormatted: string;
  daysRemaining: number;
  termName: string;
  plan: {
    id: string;
    name: string;
    status: string;
    presidentApproved: boolean;
    vpActivitiesApproved: boolean;
  } | null;
};

type TransitionSummary = {
  term: string;
  termStart: string;
  termEnd: string;
  counts: {
    draft: number;
    pendingApproval: number;
    approved: number;
    applied: number;
    cancelled: number;
    total: number;
  };
};

type Props = {
  adminToken?: string;
};

/**
 * Transition countdown widget for President and Past President dashboards.
 *
 * Shows:
 * - Days remaining until next transition
 * - Link to /admin/transitions
 * - Status summary of transition plans
 *
 * Only visible to users with president or past-president board position.
 */
export default function TransitionWidget({ adminToken }: Props) {
  const [widgetData, setWidgetData] = useState<TransitionWidgetData | null>(null);
  const [summary, setSummary] = useState<TransitionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const headers: HeadersInit = {};
        if (adminToken) {
          headers["x-admin-test-token"] = adminToken;
        }

        // Fetch widget visibility and data
        const widgetRes = await fetch("/api/v1/admin/transitions/widget", {
          headers,
          cache: "no-store",
        });

        if (widgetRes.status === 403) {
          // User doesn't have access - widget should not be shown
          setWidgetData({ visible: false } as TransitionWidgetData);
          setLoading(false);
          return;
        }

        if (!widgetRes.ok) {
          throw new Error("Failed to fetch widget data");
        }

        const widgetJson = await widgetRes.json();
        setWidgetData(widgetJson.widget);

        // Only fetch summary if widget is visible
        if (widgetJson.widget?.visible) {
          const summaryRes = await fetch("/api/admin/transitions/summary?term=next", {
            headers,
            cache: "no-store",
          });

          if (summaryRes.ok) {
            const summaryJson = await summaryRes.json();
            setSummary(summaryJson);
          }
        }
      } catch (err) {
        console.error("Error fetching transition widget data:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [adminToken]);

  // Don't render anything if loading, error, or not visible
  if (loading) {
    return null;
  }

  if (error || !widgetData?.visible) {
    return null;
  }

  const statusLabel = getStatusLabel(widgetData.plan?.status);

  return (
    <div
      data-test-id="transition-widget"
      style={{
        padding: "16px",
        border: "2px solid #2563eb",
        borderRadius: "8px",
        backgroundColor: "#eff6ff",
        marginBottom: "24px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
        <span style={{ fontSize: "24px" }}>&#128197;</span>
        <div>
          <div
            data-test-id="transition-widget-title"
            style={{ fontSize: "16px", fontWeight: 600, color: "#1e40af" }}
          >
            Leadership Transition
          </div>
          <div
            data-test-id="transition-widget-countdown"
            style={{ fontSize: "14px", color: "#1e40af" }}
          >
            {widgetData.daysRemaining === 0
              ? "Transition is TODAY"
              : widgetData.daysRemaining === 1
              ? "Transition in 1 day"
              : `Transition in ${widgetData.daysRemaining} days`}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "13px", color: "#374151" }}>
          <strong>Next term:</strong> {widgetData.termName}
        </div>
        <div style={{ fontSize: "13px", color: "#374151" }}>
          <strong>Effective:</strong> {widgetData.nextTransitionDateFormatted}
        </div>
      </div>

      {summary && (
        <div
          data-test-id="transition-widget-summary"
          style={{
            fontSize: "13px",
            color: "#374151",
            marginBottom: "12px",
            padding: "8px",
            backgroundColor: "#dbeafe",
            borderRadius: "4px",
          }}
        >
          <div style={{ marginBottom: "4px" }}>
            <strong>Plans for next term:</strong>
          </div>
          {summary.counts.total === 0 ? (
            <div style={{ color: "#b91c1c" }}>No transition plan created yet</div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {summary.counts.draft > 0 && (
                <span data-test-id="transition-widget-draft-count">
                  Draft: {summary.counts.draft}
                </span>
              )}
              {summary.counts.pendingApproval > 0 && (
                <span data-test-id="transition-widget-pending-count">
                  Pending: {summary.counts.pendingApproval}
                </span>
              )}
              {summary.counts.approved > 0 && (
                <span data-test-id="transition-widget-approved-count">
                  Approved: {summary.counts.approved}
                </span>
              )}
              {summary.counts.applied > 0 && (
                <span data-test-id="transition-widget-applied-count">
                  Applied: {summary.counts.applied}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {widgetData.plan && (
        <div style={{ fontSize: "13px", color: "#374151", marginBottom: "12px" }}>
          <strong>Current plan:</strong> {widgetData.plan.name} ({statusLabel})
        </div>
      )}

      <Link
        href="/admin/transitions"
        data-test-id="transition-widget-link"
        style={{
          display: "inline-block",
          padding: "8px 16px",
          backgroundColor: "#2563eb",
          color: "#ffffff",
          borderRadius: "4px",
          textDecoration: "none",
          fontSize: "14px",
          fontWeight: 500,
        }}
      >
        {widgetData.plan ? "Review Transition Plan" : "Create Transition Plan"}
      </Link>
    </div>
  );
}

function getStatusLabel(status: string | undefined): string {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "PENDING_APPROVAL":
      return "Pending Approval";
    case "APPROVED":
      return "Approved";
    case "APPLIED":
      return "Applied";
    case "CANCELLED":
      return "Cancelled";
    default:
      return "Unknown";
  }
}
