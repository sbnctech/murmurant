"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatClubDate } from "@/lib/timezone";

type DemoMember = {
  id: string;
  name: string;
  email: string;
  status: string;
  statusLabel: string;
  tier: string | null;
  tierName: string | null;
  joinedAt: string;
  lifecycleHint: string;
};

type FilterOption = {
  code: string;
  label?: string;
  name?: string;
};

type MemberListResponse = {
  items: DemoMember[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  filters: {
    statusOptions: FilterOption[];
    tierOptions: FilterOption[];
  };
};

function formatDate(isoString: string): string {
  return formatClubDate(new Date(isoString));
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    active: { bg: "#d4edda", text: "#155724" },
    lapsed: { bg: "#f8d7da", text: "#721c24" },
    pending_new: { bg: "#fff3cd", text: "#856404" },
    pending_renewal: { bg: "#fff3cd", text: "#856404" },
    suspended: { bg: "#f8d7da", text: "#721c24" },
  };

  const color = colors[status] ?? { bg: "#e9ecef", text: "#495057" };

  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "4px",
        fontSize: "12px",
        fontWeight: 500,
        backgroundColor: color.bg,
        color: color.text,
      }}
    >
      {label}
    </span>
  );
}

function TierBadge({ tier, name }: { tier: string | null; name: string | null }) {
  if (!tier || !name) {
    return (
      <span style={{ color: "#999", fontStyle: "italic", fontSize: "13px" }}>
        —
      </span>
    );
  }

  const colors: Record<string, { bg: string; text: string }> = {
    newbie_member: { bg: "#cce5ff", text: "#004085" },
    member: { bg: "#e2e3e5", text: "#383d41" },
    extended_member: { bg: "#d4edda", text: "#155724" },
    admin: { bg: "#f5c6cb", text: "#721c24" },
    admins: { bg: "#f5c6cb", text: "#721c24" },
  };

  const color = colors[tier] ?? { bg: "#e9ecef", text: "#495057" };

  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "4px",
        fontSize: "12px",
        fontWeight: 500,
        backgroundColor: color.bg,
        color: color.text,
      }}
    >
      {name}
    </span>
  );
}

function LifecycleHint({ hint }: { hint: string }) {
  let color = "#666";
  if (hint.includes("expires in") && hint.match(/\d+/)) {
    const days = parseInt(hint.match(/\d+/)![0], 10);
    if (days <= 7) {
      color = "#dc3545";
    } else if (days <= 30) {
      color = "#fd7e14";
    } else {
      color = "#28a745";
    }
  } else if (hint.includes("ended") || hint.includes("pending")) {
    color = "#dc3545";
  } else if (hint.includes("Extended") || hint.includes("Administrator")) {
    color = "#6f42c1";
  }

  return (
    <span style={{ fontSize: "13px", color, fontStyle: "italic" }}>{hint}</span>
  );
}

export default function DemoMembersClient() {
  const [data, setData] = useState<MemberListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [tierFilter, setTierFilter] = useState<string>("");

  useEffect(() => {
    async function fetchMembers() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: "25",
        });
        if (statusFilter) params.set("status", statusFilter);
        if (tierFilter) params.set("tier", tierFilter);

        const res = await fetch(`/api/admin/demo/member-list?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // Keep existing state
      }
      setLoading(false);
    }
    fetchMembers();
  }, [page, statusFilter, tierFilter]);

  return (
    <div data-test-id="demo-members-root" style={{ padding: "20px", maxWidth: "1400px" }}>
      <header style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <h1 style={{ fontSize: "24px", margin: 0 }}>Member List (Demo)</h1>
          <Link
            href="/admin/demo"
            style={{ fontSize: "14px", color: "#0066cc" }}
          >
            Back to Demo Dashboard
          </Link>
        </div>
        <p style={{ color: "#666", marginTop: "8px" }}>
          Read-only view of members with status, tier, and lifecycle hints
        </p>
      </header>

      {/* Filters */}
      <div
        data-test-id="demo-members-filters"
        style={{
          marginBottom: "20px",
          padding: "12px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div>
          <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "4px" }}>
            Status
          </label>
          <select
            data-test-id="demo-members-status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: "6px 12px",
              fontSize: "14px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          >
            <option value="">All statuses</option>
            {data?.filters.statusOptions.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "4px" }}>
            Tier
          </label>
          <select
            data-test-id="demo-members-tier-filter"
            value={tierFilter}
            onChange={(e) => {
              setTierFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: "6px 12px",
              fontSize: "14px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          >
            <option value="">All tiers</option>
            {data?.filters.tierOptions.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginLeft: "auto", fontSize: "14px", color: "#666" }}>
          {loading ? "Loading..." : `Showing ${data?.items.length ?? 0} of ${data?.totalItems ?? 0} members`}
        </div>
      </div>

      {/* Table */}
      <table
        data-test-id="demo-members-table"
        style={{
          width: "100%",
          borderCollapse: "collapse",
          backgroundColor: "#fff",
          border: "1px solid #ddd",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f8f9fa" }}>
            <th style={{ textAlign: "left", padding: "12px", borderBottom: "2px solid #ddd" }}>
              Name
            </th>
            <th style={{ textAlign: "left", padding: "12px", borderBottom: "2px solid #ddd" }}>
              Email
            </th>
            <th style={{ textAlign: "left", padding: "12px", borderBottom: "2px solid #ddd" }}>
              Status
            </th>
            <th style={{ textAlign: "left", padding: "12px", borderBottom: "2px solid #ddd" }}>
              Tier
            </th>
            <th style={{ textAlign: "left", padding: "12px", borderBottom: "2px solid #ddd" }}>
              Joined
            </th>
            <th style={{ textAlign: "left", padding: "12px", borderBottom: "2px solid #ddd" }}>
              Lifecycle
            </th>
          </tr>
        </thead>
        <tbody>
          {data?.items.map((member) => (
            <tr
              key={member.id}
              data-test-id="demo-members-row"
              style={{ borderBottom: "1px solid #eee" }}
            >
              <td style={{ padding: "10px 12px" }}>
                <Link
                  href={`/admin/members/${member.id}`}
                  style={{ color: "#0066cc", textDecoration: "none", fontWeight: 500 }}
                >
                  {member.name}
                </Link>
              </td>
              <td style={{ padding: "10px 12px", fontSize: "13px", color: "#444" }}>
                {member.email}
              </td>
              <td style={{ padding: "10px 12px" }}>
                <StatusBadge status={member.status} label={member.statusLabel} />
              </td>
              <td style={{ padding: "10px 12px" }}>
                <TierBadge tier={member.tier} name={member.tierName} />
              </td>
              <td style={{ padding: "10px 12px", fontSize: "13px", color: "#666" }}>
                {formatDate(member.joinedAt)}
              </td>
              <td style={{ padding: "10px 12px" }}>
                <LifecycleHint hint={member.lifecycleHint} />
              </td>
            </tr>
          ))}
          {!loading && data?.items.length === 0 && (
            <tr data-test-id="demo-members-empty">
              <td
                colSpan={6}
                style={{
                  padding: "24px",
                  textAlign: "center",
                  fontStyle: "italic",
                  color: "#666",
                }}
              >
                No members found matching the selected filters.
              </td>
            </tr>
          )}
          {loading && (
            <tr>
              <td
                colSpan={6}
                style={{
                  padding: "24px",
                  textAlign: "center",
                  color: "#666",
                }}
              >
                Loading members...
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {data && (
        <div
          data-test-id="demo-members-pagination"
          style={{
            marginTop: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              cursor: page <= 1 ? "not-allowed" : "pointer",
              opacity: page <= 1 ? 0.5 : 1,
              backgroundColor: "#f8f9fa",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          >
            Previous
          </button>
          <span style={{ fontSize: "14px", color: "#666" }}>
            Page {page} of {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page >= data.totalPages}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              cursor: page >= data.totalPages ? "not-allowed" : "pointer",
              opacity: page >= data.totalPages ? 0.5 : 1,
              backgroundColor: "#f8f9fa",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
