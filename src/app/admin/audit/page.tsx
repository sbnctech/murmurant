/**
 * Admin Audit Log Viewer
 *
 * Lists all audit log entries with filters for action type, resource type,
 * actor, and date range. Includes expandable details and CSV export.
 *
 * Charter: P1 (identity provable), P7 (observability)
 */

"use client";

import React, { useState, useMemo } from "react";
import { formatClubDateTime } from "@/lib/timezone";

type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "PUBLISH"
  | "UNPUBLISH"
  | "SEND"
  | "ARCHIVE"
  | "DISCARD_DRAFT"
  | "EMAIL_SENT"
  | "EMAIL_BOUNCED";

interface AuditLogEntry {
  id: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  memberId: string | null;
  memberName: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

// Mock data for demonstration
const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "1",
    action: "CREATE",
    resourceType: "Member",
    resourceId: "mem-001",
    memberId: "admin-001",
    memberName: "Jane Smith",
    before: null,
    after: { firstName: "John", lastName: "Doe", email: "john@example.com" },
    metadata: { source: "admin_portal" },
    ipAddress: "192.168.1.1",
    createdAt: "2024-12-27T10:30:00Z",
  },
  {
    id: "2",
    action: "UPDATE",
    resourceType: "Event",
    resourceId: "evt-042",
    memberId: "admin-002",
    memberName: "Bob Johnson",
    before: { title: "Holiday Gathering", capacity: 50 },
    after: { title: "Winter Holiday Gathering", capacity: 75 },
    metadata: null,
    ipAddress: "192.168.1.15",
    createdAt: "2024-12-27T09:15:00Z",
  },
  {
    id: "3",
    action: "PUBLISH",
    resourceType: "Page",
    resourceId: "page-007",
    memberId: "admin-001",
    memberName: "Jane Smith",
    before: { status: "draft" },
    after: { status: "published" },
    metadata: { publishedUrl: "/about/leadership" },
    ipAddress: "192.168.1.1",
    createdAt: "2024-12-26T16:45:00Z",
  },
  {
    id: "4",
    action: "DELETE",
    resourceType: "Registration",
    resourceId: "reg-199",
    memberId: "admin-003",
    memberName: "Carol Williams",
    before: { memberId: "mem-042", eventId: "evt-038", status: "CONFIRMED" },
    after: null,
    metadata: { reason: "member_request" },
    ipAddress: "192.168.1.22",
    createdAt: "2024-12-26T14:20:00Z",
  },
  {
    id: "5",
    action: "EMAIL_SENT",
    resourceType: "Member",
    resourceId: "mem-042",
    memberId: null,
    memberName: "System",
    before: null,
    after: null,
    metadata: { template: "welcome_email", recipient: "new@example.com" },
    ipAddress: null,
    createdAt: "2024-12-26T12:00:00Z",
  },
  {
    id: "6",
    action: "UPDATE",
    resourceType: "Member",
    resourceId: "mem-015",
    memberId: "admin-002",
    memberName: "Bob Johnson",
    before: { phone: "555-1234" },
    after: { phone: "555-5678" },
    metadata: null,
    ipAddress: "192.168.1.15",
    createdAt: "2024-12-25T18:30:00Z",
  },
  {
    id: "7",
    action: "ARCHIVE",
    resourceType: "Event",
    resourceId: "evt-035",
    memberId: "admin-001",
    memberName: "Jane Smith",
    before: { status: "closed" },
    after: { status: "archived" },
    metadata: null,
    ipAddress: "192.168.1.1",
    createdAt: "2024-12-24T20:00:00Z",
  },
  {
    id: "8",
    action: "CREATE",
    resourceType: "Event",
    resourceId: "evt-043",
    memberId: "admin-002",
    memberName: "Bob Johnson",
    before: null,
    after: { title: "New Year Brunch", date: "2025-01-01", capacity: 40 },
    metadata: null,
    ipAddress: "192.168.1.15",
    createdAt: "2024-12-24T11:00:00Z",
  },
];

const ACTION_TYPES: AuditAction[] = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "PUBLISH",
  "UNPUBLISH",
  "SEND",
  "ARCHIVE",
  "DISCARD_DRAFT",
  "EMAIL_SENT",
  "EMAIL_BOUNCED",
];

const RESOURCE_TYPES = ["Member", "Event", "Page", "Registration", "Committee", "Payment"];

function getActionColor(action: AuditAction): { bg: string; text: string } {
  switch (action) {
    case "CREATE":
      return { bg: "#d1fae5", text: "#065f46" };
    case "UPDATE":
      return { bg: "#dbeafe", text: "#1e40af" };
    case "DELETE":
      return { bg: "#fee2e2", text: "#991b1b" };
    case "PUBLISH":
      return { bg: "#d1fae5", text: "#065f46" };
    case "UNPUBLISH":
      return { bg: "#fef3c7", text: "#92400e" };
    case "SEND":
    case "EMAIL_SENT":
      return { bg: "#e0e7ff", text: "#3730a3" };
    case "EMAIL_BOUNCED":
      return { bg: "#fee2e2", text: "#991b1b" };
    case "ARCHIVE":
      return { bg: "#f3f4f6", text: "#374151" };
    case "DISCARD_DRAFT":
      return { bg: "#fef3c7", text: "#92400e" };
    default:
      return { bg: "#f3f4f6", text: "#374151" };
  }
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return formatClubDateTime(date);
}

function exportToCSV(logs: AuditLogEntry[]): void {
  const headers = [
    "Timestamp",
    "Action",
    "Resource Type",
    "Resource ID",
    "Actor",
    "IP Address",
    "Before",
    "After",
    "Metadata",
  ];

  const rows = logs.map((log) => [
    log.createdAt,
    log.action,
    log.resourceType,
    log.resourceId,
    log.memberName || "System",
    log.ipAddress || "",
    log.before ? JSON.stringify(log.before) : "",
    log.after ? JSON.stringify(log.after) : "",
    log.metadata ? JSON.stringify(log.metadata) : "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function AuditLogRow({
  log,
  isExpanded,
  onToggle,
}: {
  log: AuditLogEntry;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const actionColor = getActionColor(log.action);

  return (
    <div
      data-test-id={`audit-log-${log.id}`}
      style={{
        backgroundColor: "white",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        marginBottom: "8px",
        overflow: "hidden",
      }}
    >
      {/* Main row */}
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: "100%",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        {/* Expand icon */}
        <span
          style={{
            fontSize: "12px",
            color: "#9ca3af",
            transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        >
          ▶
        </span>

        {/* Timestamp */}
        <span style={{ fontSize: "13px", color: "#6b7280", minWidth: "150px" }}>
          {formatDateTime(log.createdAt)}
        </span>

        {/* Action badge */}
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: "4px",
            backgroundColor: actionColor.bg,
            color: actionColor.text,
            minWidth: "80px",
            textAlign: "center",
          }}
        >
          {log.action}
        </span>

        {/* Resource */}
        <span style={{ fontSize: "14px", color: "#374151", flex: 1 }}>
          <span style={{ fontWeight: 500 }}>{log.resourceType}</span>
          <span style={{ color: "#9ca3af", marginLeft: "4px" }}>
            #{log.resourceId}
          </span>
        </span>

        {/* Actor */}
        <span style={{ fontSize: "14px", color: "#6b7280", minWidth: "120px" }}>
          {log.memberName || "System"}
        </span>

        {/* IP */}
        <span
          style={{
            fontSize: "12px",
            color: "#9ca3af",
            fontFamily: "monospace",
            minWidth: "100px",
          }}
        >
          {log.ipAddress || "—"}
        </span>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div
          data-test-id={`audit-log-${log.id}-details`}
          style={{
            borderTop: "1px solid #e5e7eb",
            padding: "16px",
            backgroundColor: "#f9fafb",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            {/* Before state */}
            <div>
              <h4
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "8px",
                }}
              >
                Before
              </h4>
              <pre
                style={{
                  fontSize: "12px",
                  backgroundColor: "white",
                  padding: "12px",
                  borderRadius: "4px",
                  border: "1px solid #e5e7eb",
                  overflow: "auto",
                  maxHeight: "200px",
                  margin: 0,
                }}
              >
                {log.before ? JSON.stringify(log.before, null, 2) : "—"}
              </pre>
            </div>

            {/* After state */}
            <div>
              <h4
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "8px",
                }}
              >
                After
              </h4>
              <pre
                style={{
                  fontSize: "12px",
                  backgroundColor: "white",
                  padding: "12px",
                  borderRadius: "4px",
                  border: "1px solid #e5e7eb",
                  overflow: "auto",
                  maxHeight: "200px",
                  margin: 0,
                }}
              >
                {log.after ? JSON.stringify(log.after, null, 2) : "—"}
              </pre>
            </div>
          </div>

          {/* Metadata */}
          {log.metadata && (
            <div style={{ marginTop: "16px" }}>
              <h4
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "8px",
                }}
              >
                Metadata
              </h4>
              <pre
                style={{
                  fontSize: "12px",
                  backgroundColor: "white",
                  padding: "12px",
                  borderRadius: "4px",
                  border: "1px solid #e5e7eb",
                  overflow: "auto",
                  maxHeight: "150px",
                  margin: 0,
                }}
              >
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AuditLogViewerPage() {
  // Initialize with mock data directly to avoid useEffect lint error
  const [logs] = useState<AuditLogEntry[]>(MOCK_AUDIT_LOGS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<string>("");
  const [resourceFilter, setResourceFilter] = useState<string>("");
  const [actorFilter, setActorFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Get unique actors for filter dropdown
  const actors = useMemo(() => {
    const actorSet = new Set<string>();
    logs.forEach((log) => {
      if (log.memberName) actorSet.add(log.memberName);
    });
    return Array.from(actorSet).sort();
  }, [logs]);

  // Apply filters
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Action filter
      if (actionFilter && log.action !== actionFilter) return false;

      // Resource type filter
      if (resourceFilter && log.resourceType !== resourceFilter) return false;

      // Actor filter
      if (actorFilter && log.memberName !== actorFilter) return false;

      // Date range filter
      if (startDate) {
        const logDate = new Date(log.createdAt);
        const start = new Date(startDate);
        if (logDate < start) return false;
      }
      if (endDate) {
        const logDate = new Date(log.createdAt);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (logDate > end) return false;
      }

      return true;
    });
  }, [logs, actionFilter, resourceFilter, actorFilter, startDate, endDate]);

  const clearFilters = () => {
    setActionFilter("");
    setResourceFilter("");
    setActorFilter("");
    setStartDate("");
    setEndDate("");
  };

  const hasActiveFilters =
    actionFilter || resourceFilter || actorFilter || startDate || endDate;

  return (
    <div data-test-id="audit-log-page" style={{ padding: "24px", maxWidth: "1400px" }}>
      {/* Header */}
      <header style={{ marginBottom: "24px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "#1f2937",
                margin: 0,
              }}
            >
              Audit Log
            </h1>
            <p style={{ color: "#6b7280", marginTop: "4px" }}>
              Track all system changes and administrative actions
            </p>
          </div>
          <button
            type="button"
            data-test-id="export-csv-button"
            onClick={() => exportToCSV(filteredLogs)}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: 500,
              color: "white",
              backgroundColor: "#2563eb",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Export to CSV
          </button>
        </div>
      </header>

      {/* Filters */}
      <div
        data-test-id="audit-filters"
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          padding: "16px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          {/* Action filter */}
          <div style={{ minWidth: "140px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 500,
                color: "#374151",
                marginBottom: "4px",
              }}
            >
              Action
            </label>
            <select
              data-test-id="action-filter"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                fontSize: "14px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                backgroundColor: "white",
              }}
            >
              <option value="">All Actions</option>
              {ACTION_TYPES.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>

          {/* Resource type filter */}
          <div style={{ minWidth: "140px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 500,
                color: "#374151",
                marginBottom: "4px",
              }}
            >
              Resource Type
            </label>
            <select
              data-test-id="resource-filter"
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                fontSize: "14px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                backgroundColor: "white",
              }}
            >
              <option value="">All Resources</option>
              {RESOURCE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Actor filter */}
          <div style={{ minWidth: "140px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 500,
                color: "#374151",
                marginBottom: "4px",
              }}
            >
              Actor
            </label>
            <select
              data-test-id="actor-filter"
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                fontSize: "14px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                backgroundColor: "white",
              }}
            >
              <option value="">All Actors</option>
              {actors.map((actor) => (
                <option key={actor} value={actor}>
                  {actor}
                </option>
              ))}
            </select>
          </div>

          {/* Start date */}
          <div style={{ minWidth: "140px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 500,
                color: "#374151",
                marginBottom: "4px",
              }}
            >
              From Date
            </label>
            <input
              type="date"
              data-test-id="start-date-filter"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                fontSize: "14px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
              }}
            />
          </div>

          {/* End date */}
          <div style={{ minWidth: "140px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 500,
                color: "#374151",
                marginBottom: "4px",
              }}
            >
              To Date
            </label>
            <input
              type="date"
              data-test-id="end-date-filter"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                fontSize: "14px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
              }}
            />
          </div>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <button
              type="button"
              data-test-id="clear-filters-button"
              onClick={clearFilters}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: 500,
                color: "#6b7280",
                backgroundColor: "#f3f4f6",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div
        style={{
          fontSize: "14px",
          color: "#6b7280",
          marginBottom: "16px",
        }}
      >
        Showing {filteredLogs.length} of {logs.length} entries
      </div>

      {/* Log list */}
      {filteredLogs.length > 0 ? (
        <div data-test-id="audit-log-list">
          {filteredLogs.map((log) => (
            <AuditLogRow
              key={log.id}
              log={log}
              isExpanded={expandedId === log.id}
              onToggle={() =>
                setExpandedId(expandedId === log.id ? null : log.id)
              }
            />
          ))}
        </div>
      ) : (
        <div
          data-test-id="audit-log-empty"
          style={{
            textAlign: "center",
            padding: "48px 24px",
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
            color: "#6b7280",
          }}
        >
          <p style={{ fontSize: "18px", marginBottom: "8px" }}>
            No audit log entries found
          </p>
          <p style={{ fontSize: "14px" }}>
            Try adjusting your filter criteria
          </p>
        </div>
      )}
    </div>
  );
}
