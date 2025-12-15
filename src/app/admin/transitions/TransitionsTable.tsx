"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatClubDate } from "@/lib/timezone";

type TransitionPlan = {
  id: string;
  name: string;
  description: string | null;
  targetTermName: string;
  effectiveAt: string;
  status: string;
  presidentApproved: boolean;
  vpActivitiesApproved: boolean;
  assignmentCount: number;
  createdAt: string;
};

type PaginatedResponse = {
  items: TransitionPlan[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

type Filters = {
  status: string;
};

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_APPROVAL", label: "Pending Approval" },
  { value: "APPROVED", label: "Approved" },
  { value: "APPLIED", label: "Applied" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PAGE_SIZE = 20;

type Props = {
  adminToken?: string;
};

export default function TransitionsTable({ adminToken }: Props) {
  const [plans, setPlans] = useState<TransitionPlan[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    status: "",
  });

  useEffect(() => {
    async function fetchPlans() {
      setLoading(true);
      setForbidden(false);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
        });
        if (filters.status) {
          params.set("status", filters.status);
        }

        const headers: HeadersInit = {};
        if (adminToken) {
          headers["x-admin-test-token"] = adminToken;
        }

        const res = await fetch(`/api/v1/admin/transitions?${params}`, {
          headers,
        });
        if (res.status === 403) {
          setForbidden(true);
          setPlans([]);
          setLoading(false);
          return;
        }
        if (res.ok) {
          const data: PaginatedResponse = await res.json();
          setPlans(data.items ?? []);
          setTotalPages(data.totalPages ?? 1);
          setTotalItems(data.totalItems ?? 0);
        }
      } catch {
        // Keep existing state on error
      }
      setLoading(false);
    }
    fetchPlans();
  }, [page, filters, adminToken]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  if (forbidden) {
    return (
      <div
        data-test-id="transitions-forbidden"
        style={{
          padding: "32px",
          textAlign: "center",
          color: "#991b1b",
          backgroundColor: "#fee2e2",
          borderRadius: "8px",
        }}
      >
        <h2 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>Access Denied</h2>
        <p style={{ margin: 0 }}>
          You do not have permission to view transition plans.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Filters */}
      <div
        data-test-id="transitions-filters"
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "16px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div>
          <label
            htmlFor="status"
            style={{ fontSize: "14px", marginRight: "8px" }}
          >
            Status:
          </label>
          <select
            id="status"
            data-test-id="transitions-filter-status"
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            style={{
              padding: "6px 12px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: "14px", color: "#666" }}>
          {totalItems} plan{totalItems !== 1 ? "s" : ""} found
        </div>
      </div>

      {/* Table */}
      <table
        data-test-id="transitions-table"
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Term</th>
            <th style={thStyle}>Effective Date</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Approvals</th>
            <th style={thStyle}>Assignments</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((plan) => (
            <tr key={plan.id} data-test-id="transitions-row">
              <td style={tdStyle}>
                <Link
                  href={`/admin/transitions/${plan.id}`}
                  data-test-id="transitions-link"
                  style={{ color: "#0066cc", textDecoration: "none" }}
                >
                  {plan.name}
                </Link>
              </td>
              <td style={tdStyle}>{plan.targetTermName}</td>
              <td style={tdStyle}>{formatDate(plan.effectiveAt)}</td>
              <td style={tdStyle}>
                <StatusBadge status={plan.status} />
              </td>
              <td style={tdStyle}>
                <ApprovalIndicator
                  presidentApproved={plan.presidentApproved}
                  vpActivitiesApproved={plan.vpActivitiesApproved}
                />
              </td>
              <td style={tdStyle}>{plan.assignmentCount}</td>
              <td style={tdStyle}>
                <Link
                  href={`/admin/transitions/${plan.id}`}
                  style={{
                    color: "#0066cc",
                    textDecoration: "none",
                    fontSize: "13px",
                  }}
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
          {!loading && plans.length === 0 && (
            <tr data-test-id="transitions-empty-state">
              <td
                colSpan={7}
                style={{
                  padding: "16px",
                  fontStyle: "italic",
                  color: "#666",
                  textAlign: "center",
                }}
              >
                No transition plans found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div
        data-test-id="transitions-pagination"
        style={{
          marginTop: "16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <button
          data-test-id="transitions-pagination-prev"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          style={{
            padding: "6px 12px",
            fontSize: "14px",
            cursor: page <= 1 ? "not-allowed" : "pointer",
            opacity: page <= 1 ? 0.5 : 1,
          }}
        >
          Prev
        </button>
        <span data-test-id="transitions-pagination-label">
          Page {page} of {totalPages}
        </span>
        <button
          data-test-id="transitions-pagination-next"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          style={{
            padding: "6px 12px",
            fontSize: "14px",
            cursor: page >= totalPages ? "not-allowed" : "pointer",
            opacity: page >= totalPages ? 0.5 : 1,
          }}
        >
          Next
        </button>
      </div>
    </>
  );
}

const thStyle: React.CSSProperties = {
  borderBottom: "1px solid #ccc",
  textAlign: "left",
  padding: "8px",
  fontSize: "14px",
};

const tdStyle: React.CSSProperties = {
  borderBottom: "1px solid #eee",
  padding: "8px",
  fontSize: "14px",
};

function formatDate(isoString: string): string {
  return formatClubDate(new Date(isoString));
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    DRAFT: {
      backgroundColor: "#f3f4f6",
      color: "#374151",
    },
    PENDING_APPROVAL: {
      backgroundColor: "#fef3c7",
      color: "#92400e",
    },
    APPROVED: {
      backgroundColor: "#d1fae5",
      color: "#065f46",
    },
    APPLIED: {
      backgroundColor: "#dbeafe",
      color: "#1e40af",
    },
    CANCELLED: {
      backgroundColor: "#fee2e2",
      color: "#991b1b",
    },
  };

  const labels: Record<string, string> = {
    DRAFT: "Draft",
    PENDING_APPROVAL: "Pending Approval",
    APPROVED: "Approved",
    APPLIED: "Applied",
    CANCELLED: "Cancelled",
  };

  return (
    <span
      data-test-id={`transitions-status-${status.toLowerCase()}`}
      style={{
        padding: "2px 8px",
        borderRadius: "4px",
        fontSize: "12px",
        fontWeight: 500,
        ...styles[status],
      }}
    >
      {labels[status] || status}
    </span>
  );
}

function ApprovalIndicator({
  presidentApproved,
  vpActivitiesApproved,
}: {
  presidentApproved: boolean;
  vpActivitiesApproved: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: "4px", fontSize: "12px" }}>
      <span
        data-test-id="transitions-approval-president"
        title="President"
        style={{
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: presidentApproved ? "#d1fae5" : "#f3f4f6",
          color: presidentApproved ? "#065f46" : "#9ca3af",
        }}
      >
        P
      </span>
      <span
        data-test-id="transitions-approval-vp"
        title="VP Activities"
        style={{
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: vpActivitiesApproved ? "#d1fae5" : "#f3f4f6",
          color: vpActivitiesApproved ? "#065f46" : "#9ca3af",
        }}
      >
        V
      </span>
    </div>
  );
}
