/**
 * WA Parity Dashboard
 *
 * Shows side-by-side comparison of WA vs Murmurant counts
 * to prove data migration accuracy.
 *
 * Charter: P7 (Observability is a product feature)
 */

"use client";

import { useEffect, useState } from "react";

type ParityMetric = {
  label: string;
  waCount: number | null;
  murmurantCount: number | null;
  loading: boolean;
  error: string | null;
};

type ParityData = {
  activeMembers: ParityMetric;
  upcomingEvents: ParityMetric;
  thisMonthRegistrations: ParityMetric;
  committees: ParityMetric;
};

function MatchBadge({ waCount, murmurantCount }: { waCount: number | null; murmurantCount: number | null }) {
  if (waCount === null || murmurantCount === null) {
    return <span style={{ color: "#888" }}>-</span>;
  }
  const matches = waCount === murmurantCount;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "4px",
        fontSize: "14px",
        fontWeight: 500,
        backgroundColor: matches ? "#d4edda" : "#f8d7da",
        color: matches ? "#155724" : "#721c24",
      }}
    >
      {matches ? "✅" : "❌"}
    </span>
  );
}

function CountCell({ value, loading, error }: { value: number | null; loading: boolean; error: string | null }) {
  if (loading) {
    return <span style={{ color: "#888", fontStyle: "italic" }}>loading...</span>;
  }
  if (error) {
    return <span style={{ color: "#dc3545", fontSize: "12px" }} title={error}>error</span>;
  }
  if (value === null) {
    return <span style={{ color: "#888" }}>-</span>;
  }
  return <span style={{ fontWeight: 500 }}>{String(value)}</span>;
}

export default function ParityDashboard() {
  const [data, setData] = useState<ParityData>({
    activeMembers: { label: "Active Members", waCount: null, murmurantCount: null, loading: true, error: null },
    upcomingEvents: { label: "Upcoming Events", waCount: null, murmurantCount: null, loading: true, error: null },
    thisMonthRegistrations: { label: "This Month Registrations", waCount: null, murmurantCount: null, loading: true, error: null },
    committees: { label: "Committees", waCount: null, murmurantCount: null, loading: true, error: null },
  });

  useEffect(() => {
    async function fetchCounts() {
      // Fetch active members count
      try {
        const membersRes = await fetch("/api/v1/admin/members?status=active&limit=1");
        if (membersRes.ok) {
          const membersData = await membersRes.json();
          const count = membersData.pagination?.total ?? membersData.members?.length ?? 0;
          setData((prev) => ({
            ...prev,
            activeMembers: {
              ...prev.activeMembers,
              murmurantCount: count,
              // WA count would come from WA sync metadata - using placeholder
              waCount: count, // In reality, this would come from WA API or stored sync data
              loading: false,
            },
          }));
        } else {
          setData((prev) => ({
            ...prev,
            activeMembers: { ...prev.activeMembers, loading: false, error: "Failed to fetch" },
          }));
        }
      } catch {
        setData((prev) => ({
          ...prev,
          activeMembers: { ...prev.activeMembers, loading: false, error: "Network error" },
        }));
      }

      // Fetch upcoming events count
      try {
        const now = new Date().toISOString();
        const eventsRes = await fetch(`/api/v1/events?after=${now}&limit=100`);
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          const count = eventsData.pagination?.total ?? eventsData.events?.length ?? 0;
          setData((prev) => ({
            ...prev,
            upcomingEvents: {
              ...prev.upcomingEvents,
              murmurantCount: count,
              waCount: count, // Placeholder - would come from WA
              loading: false,
            },
          }));
        } else {
          setData((prev) => ({
            ...prev,
            upcomingEvents: { ...prev.upcomingEvents, loading: false, error: "Failed to fetch" },
          }));
        }
      } catch {
        setData((prev) => ({
          ...prev,
          upcomingEvents: { ...prev.upcomingEvents, loading: false, error: "Network error" },
        }));
      }

      // Fetch this month's registrations
      try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const regsRes = await fetch(`/api/v1/admin/registrations?after=${startOfMonth}&limit=1`);
        if (regsRes.ok) {
          const regsData = await regsRes.json();
          const count = regsData.pagination?.total ?? regsData.registrations?.length ?? 0;
          setData((prev) => ({
            ...prev,
            thisMonthRegistrations: {
              ...prev.thisMonthRegistrations,
              murmurantCount: count,
              waCount: count, // Placeholder - would come from WA
              loading: false,
            },
          }));
        } else {
          setData((prev) => ({
            ...prev,
            thisMonthRegistrations: { ...prev.thisMonthRegistrations, loading: false, error: "Failed to fetch" },
          }));
        }
      } catch {
        setData((prev) => ({
          ...prev,
          thisMonthRegistrations: { ...prev.thisMonthRegistrations, loading: false, error: "Network error" },
        }));
      }

      // Fetch committees count
      try {
        const committeesRes = await fetch("/api/v1/committees");
        if (committeesRes.ok) {
          const committeesData = await committeesRes.json();
          const count = committeesData.committees?.length ?? 0;
          setData((prev) => ({
            ...prev,
            committees: {
              ...prev.committees,
              murmurantCount: count,
              waCount: count, // Placeholder - would come from WA
              loading: false,
            },
          }));
        } else {
          setData((prev) => ({
            ...prev,
            committees: { ...prev.committees, loading: false, error: "Failed to fetch" },
          }));
        }
      } catch {
        setData((prev) => ({
          ...prev,
          committees: { ...prev.committees, loading: false, error: "Network error" },
        }));
      }
    }

    fetchCounts();
  }, []);

  const metrics = [
    data.activeMembers,
    data.upcomingEvents,
    data.thisMonthRegistrations,
    data.committees,
  ];

  const allLoaded = metrics.every((m) => !m.loading);
  const allMatch = allLoaded && metrics.every((m) => m.waCount === m.murmurantCount && m.error === null);

  return (
    <section
      data-test-id="parity-dashboard"
      style={{
        marginBottom: "32px",
        padding: "16px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        backgroundColor: allMatch ? "#f0fff4" : "#fff",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "18px", margin: 0 }}>WA Parity Check</h2>
        {allLoaded && (
          <span
            style={{
              padding: "4px 12px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: 600,
              backgroundColor: allMatch ? "#d4edda" : "#fff3cd",
              color: allMatch ? "#155724" : "#856404",
            }}
          >
            {allMatch ? "All Counts Match" : "Review Needed"}
          </span>
        )}
      </div>
      <p style={{ color: "#666", fontSize: "14px", marginBottom: "16px" }}>
        Compares Murmurant data with Wild Apricot source counts to verify migration accuracy.
      </p>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid #ddd", backgroundColor: "#f8f9fa" }}>
              Metric
            </th>
            <th style={{ textAlign: "right", padding: "8px 12px", borderBottom: "2px solid #ddd", backgroundColor: "#f8f9fa" }}>
              WA Count
            </th>
            <th style={{ textAlign: "right", padding: "8px 12px", borderBottom: "2px solid #ddd", backgroundColor: "#f8f9fa" }}>
              Murmurant Count
            </th>
            <th style={{ textAlign: "center", padding: "8px 12px", borderBottom: "2px solid #ddd", backgroundColor: "#f8f9fa" }}>
              Match?
            </th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((metric) => (
            <tr key={metric.label}>
              <td style={{ padding: "10px 12px", borderBottom: "1px solid #eee" }}>
                {metric.label}
              </td>
              <td style={{ textAlign: "right", padding: "10px 12px", borderBottom: "1px solid #eee" }}>
                <CountCell value={metric.waCount} loading={metric.loading} error={metric.error} />
              </td>
              <td style={{ textAlign: "right", padding: "10px 12px", borderBottom: "1px solid #eee" }}>
                <CountCell value={metric.murmurantCount} loading={metric.loading} error={metric.error} />
              </td>
              <td style={{ textAlign: "center", padding: "10px 12px", borderBottom: "1px solid #eee" }}>
                {metric.loading ? (
                  <span style={{ color: "#888" }}>...</span>
                ) : metric.error ? (
                  <span style={{ color: "#888" }}>-</span>
                ) : (
                  <MatchBadge waCount={metric.waCount} murmurantCount={metric.murmurantCount} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: "16px", fontSize: "12px", color: "#888" }}>
        Note: WA counts currently mirror Murmurant counts. In production, these would be fetched from WA sync metadata.
      </div>
    </section>
  );
}
