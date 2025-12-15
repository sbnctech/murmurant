"use client";

import { useState, useEffect } from "react";
import { formatClubMonthYear } from "@/lib/timezone";

type ServiceHistoryRecord = {
  id: string;
  memberId: string;
  memberName: string;
  serviceType: string;
  roleTitle: string;
  committeeName: string | null;
  eventTitle: string | null;
  eventId: string | null;
  termName: string | null;
  startAt: string;
  endAt: string | null;
  isActive: boolean;
  createdByName: string | null;
};

type PaginatedResponse = {
  items: ServiceHistoryRecord[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

type Filters = {
  serviceType: string;
  activeOnly: boolean;
};

const SERVICE_TYPES = [
  { value: "", label: "All Types" },
  { value: "BOARD_OFFICER", label: "Board Officer" },
  { value: "COMMITTEE_CHAIR", label: "Committee Chair" },
  { value: "COMMITTEE_MEMBER", label: "Committee Member" },
  { value: "EVENT_HOST", label: "Event Host" },
];

const PAGE_SIZE = 20;

export default function ServiceHistoryTable() {
  const [records, setRecords] = useState<ServiceHistoryRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    serviceType: "",
    activeOnly: false,
  });

  useEffect(() => {
    async function fetchRecords() {
      setLoading(true);
      setForbidden(false);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
        });
        if (filters.serviceType) {
          params.set("serviceType", filters.serviceType);
        }
        if (filters.activeOnly) {
          params.set("activeOnly", "true");
        }

        const res = await fetch(`/api/v1/admin/service-history?${params}`);
        if (res.status === 403) {
          setForbidden(true);
          setRecords([]);
          setLoading(false);
          return;
        }
        if (res.ok) {
          const data: PaginatedResponse = await res.json();
          setRecords(data.items ?? []);
          setTotalPages(data.totalPages ?? 1);
          setTotalItems(data.totalItems ?? 0);
        }
      } catch {
        // Keep existing state on error
      }
      setLoading(false);
    }
    fetchRecords();
  }, [page, filters]);

  const handleFilterChange = (key: keyof Filters, value: string | boolean) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page on filter change
  };

  // Render forbidden state if user lacks permission
  if (forbidden) {
    return (
      <div
        data-test-id="service-history-forbidden"
        style={{
          padding: "24px",
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: "8px",
          textAlign: "center",
        }}
      >
        <h2 style={{ color: "#991b1b", fontSize: "18px", marginBottom: "8px" }}>
          Access Denied
        </h2>
        <p style={{ color: "#7f1d1d", fontSize: "14px" }}>
          You do not have permission to view service history records.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Filters */}
      <div
        data-test-id="service-history-filters"
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
            htmlFor="serviceType"
            style={{ fontSize: "14px", marginRight: "8px" }}
          >
            Service Type:
          </label>
          <select
            id="serviceType"
            data-test-id="service-history-filter-type"
            value={filters.serviceType}
            onChange={(e) => handleFilterChange("serviceType", e.target.value)}
            style={{
              padding: "6px 12px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          >
            {SERVICE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <input
            type="checkbox"
            id="activeOnly"
            data-test-id="service-history-filter-active"
            checked={filters.activeOnly}
            onChange={(e) => handleFilterChange("activeOnly", e.target.checked)}
          />
          <label htmlFor="activeOnly" style={{ fontSize: "14px" }}>
            Active Only
          </label>
        </div>

        <div style={{ fontSize: "14px", color: "#666" }}>
          {totalItems} record{totalItems !== 1 ? "s" : ""} found
        </div>
      </div>

      {/* Table */}
      <table
        data-test-id="service-history-table"
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th style={thStyle}>Member</th>
            <th style={thStyle}>Role</th>
            <th style={thStyle}>Type</th>
            <th style={thStyle}>Committee/Event</th>
            <th style={thStyle}>Term</th>
            <th style={thStyle}>Period</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Created By</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id} data-test-id="service-history-row">
              <td style={tdStyle}>
                <a
                  href={`/admin/members/${record.memberId}`}
                  style={{ color: "#0066cc", textDecoration: "none" }}
                >
                  {record.memberName}
                </a>
              </td>
              <td style={tdStyle}>{record.roleTitle}</td>
              <td style={tdStyle}>{formatServiceType(record.serviceType)}</td>
              <td style={tdStyle}>
                {record.committeeName || record.eventTitle || "-"}
              </td>
              <td style={tdStyle}>{record.termName || "-"}</td>
              <td style={tdStyle}>
                {formatDateRange(record.startAt, record.endAt)}
              </td>
              <td style={tdStyle}>
                {record.isActive ? (
                  <span
                    data-test-id="service-history-status-active"
                    style={{
                      color: "#006600",
                      fontWeight: 600,
                      padding: "2px 8px",
                      backgroundColor: "#e6ffe6",
                      borderRadius: "4px",
                    }}
                  >
                    Active
                  </span>
                ) : (
                  <span style={{ color: "#666" }}>Completed</span>
                )}
              </td>
              <td style={tdStyle}>{record.createdByName || "-"}</td>
            </tr>
          ))}
          {!loading && records.length === 0 && (
            <tr data-test-id="service-history-empty-state">
              <td
                colSpan={8}
                style={{
                  padding: "16px",
                  fontStyle: "italic",
                  color: "#666",
                  textAlign: "center",
                }}
              >
                No service records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div
        data-test-id="service-history-pagination"
        style={{
          marginTop: "16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <button
          data-test-id="service-history-pagination-prev"
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
        <span data-test-id="service-history-pagination-label">
          Page {page} of {totalPages}
        </span>
        <button
          data-test-id="service-history-pagination-next"
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
