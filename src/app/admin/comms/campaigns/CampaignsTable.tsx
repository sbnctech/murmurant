"use client";

import { useState, useEffect } from "react";
import { formatClubDateTime } from "@/lib/timezone";

type CampaignListItem = {
  id: string;
  name: string;
  status: string;
  scheduledAt: string | null;
  sentAt: string | null;
  updatedAt: string;
  template: { id: string; name: string } | null;
  mailingList: { id: string; name: string } | null;
};

type PaginatedResponse = {
  items: CampaignListItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

const PAGE_SIZE = 10;

function formatDate(isoString: string): string {
  return formatClubDateTime(new Date(isoString));
}

function getStatusBadge(status: string): { bg: string; text: string } {
  switch (status) {
    case "SENT":
      return { bg: "#e6ffe6", text: "#006600" };
    case "SENDING":
      return { bg: "#e6f0ff", text: "#0066cc" };
    case "SCHEDULED":
      return { bg: "#fff3e0", text: "#995500" };
    case "DRAFT":
      return { bg: "#f0f0f0", text: "#666666" };
    case "FAILED":
      return { bg: "#ffe6e6", text: "#cc0000" };
    case "CANCELLED":
      return { bg: "#f5f5f5", text: "#999999" };
    default:
      return { bg: "#f0f0f0", text: "#333333" };
  }
}

export default function CampaignsTable() {
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    async function fetchCampaigns() {
      setLoading(true);
      try {
        let url = `/api/admin/comms/campaigns?page=${page}&pageSize=${PAGE_SIZE}`;
        if (statusFilter) url += `&status=${statusFilter}`;

        const res = await fetch(url);
        if (res.ok) {
          const data: PaginatedResponse = await res.json();
          setCampaigns(data.items ?? []);
          setTotalPages(data.totalPages ?? 1);
        }
      } catch {
        // Keep existing state on error
      }
      setLoading(false);
    }
    fetchCampaigns();
  }, [page, statusFilter]);

  return (
    <>
      <div
        data-test-id="admin-campaigns-filters"
        style={{ marginBottom: "16px", display: "flex", gap: "12px", alignItems: "center" }}
      >
        <label>
          Status:{" "}
          <select
            data-test-id="admin-campaigns-status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={{ padding: "6px", fontSize: "14px" }}
          >
            <option value="">All</option>
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="SENDING">Sending</option>
            <option value="SENT">Sent</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>
      </div>

      <table
        data-test-id="admin-campaigns-table"
        style={{
          width: "100%",
          borderCollapse: "collapse",
          maxWidth: "1100px",
        }}
      >
        <thead>
          <tr>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>
              Campaign
            </th>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>
              Template
            </th>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>
              List
            </th>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>
              Status
            </th>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>
              Sent / Scheduled
            </th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((campaign) => {
            const statusStyle = getStatusBadge(campaign.status);
            return (
              <tr key={campaign.id} data-test-id="admin-campaigns-row">
                <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                  <a
                    href={`/admin/comms/campaigns/${campaign.id}`}
                    data-test-id="admin-campaigns-name-link"
                    style={{ color: "#0066cc", textDecoration: "none" }}
                  >
                    {campaign.name}
                  </a>
                </td>
                <td style={{ borderBottom: "1px solid #eee", padding: "8px", fontSize: "13px" }}>
                  {campaign.template ? campaign.template.name : <span style={{ color: "#999" }}>None</span>}
                </td>
                <td style={{ borderBottom: "1px solid #eee", padding: "8px", fontSize: "13px" }}>
                  {campaign.mailingList ? campaign.mailingList.name : <span style={{ color: "#999" }}>None</span>}
                </td>
                <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.text,
                    }}
                  >
                    {campaign.status}
                  </span>
                </td>
                <td style={{ borderBottom: "1px solid #eee", padding: "8px", fontSize: "13px", color: "#666" }}>
                  {campaign.sentAt
                    ? formatDate(campaign.sentAt)
                    : campaign.scheduledAt
                      ? formatDate(campaign.scheduledAt)
                      : "-"}
                </td>
              </tr>
            );
          })}
          {!loading && campaigns.length === 0 && (
            <tr data-test-id="admin-campaigns-empty-state">
              <td
                colSpan={5}
                style={{ padding: "8px", fontStyle: "italic", color: "#666" }}
              >
                No campaigns found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div
        data-test-id="admin-campaigns-pagination"
        style={{
          marginTop: "16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <button
          data-test-id="admin-campaigns-pagination-prev"
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
        <span data-test-id="admin-campaigns-pagination-label">
          Page {page} of {totalPages}
        </span>
        <button
          data-test-id="admin-campaigns-pagination-next"
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
