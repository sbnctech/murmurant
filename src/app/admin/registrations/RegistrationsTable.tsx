"use client";

import { useState, useEffect } from "react";

type AdminRegistrationListItem = {
  id: string;
  memberId: string;
  memberName: string;
  eventId: string;
  eventTitle: string;
  status: string;
  registeredAt: string;
};

type FilterValue = "ALL" | "CONFIRMED" | "WAITLISTED";

type PaginatedResponse = {
  items: AdminRegistrationListItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

const PAGE_SIZE = 10;

export default function RegistrationsTable() {
  const [registrations, setRegistrations] = useState<AdminRegistrationListItem[]>([]);
  const [filter, setFilter] = useState<FilterValue>("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRegistrations() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/registrations?page=${page}&pageSize=${PAGE_SIZE}`
        );
        if (res.ok) {
          const data: PaginatedResponse = await res.json();
          setRegistrations(data.items ?? []);
          setTotalPages(data.totalPages ?? 1);
        }
      } catch {
        // Keep existing state on error
      }
      setLoading(false);
    }
    fetchRegistrations();
  }, [page]);

  const filteredRegistrations = registrations.filter((reg) => {
    if (filter === "ALL") return true;
    return reg.status === filter;
  });

  return (
    <>
      <div
        data-test-id="admin-registrations-filter"
        style={{ marginBottom: "16px" }}
      >
        <label
          htmlFor="status-filter"
          style={{ marginRight: "8px" }}
        >
          Filter by status:
        </label>
        <select
          id="status-filter"
          data-test-id="admin-registrations-filter-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterValue)}
          style={{
            padding: "4px 8px",
            fontSize: "14px",
          }}
        >
          <option value="ALL">All statuses</option>
          <option value="CONFIRMED">Confirmed only</option>
          <option value="WAITLISTED">Waitlisted only</option>
        </select>
      </div>

      <table
        data-test-id="admin-registrations-list-table"
        style={{
          width: "100%",
          borderCollapse: "collapse",
          maxWidth: "900px",
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                borderBottom: "1px solid #ccc",
                textAlign: "left",
                padding: "8px",
              }}
            >
              Member
            </th>
            <th
              style={{
                borderBottom: "1px solid #ccc",
                textAlign: "left",
                padding: "8px",
              }}
            >
              Event
            </th>
            <th
              style={{
                borderBottom: "1px solid #ccc",
                textAlign: "left",
                padding: "8px",
              }}
            >
              Status
            </th>
            <th
              style={{
                borderBottom: "1px solid #ccc",
                textAlign: "left",
                padding: "8px",
              }}
            >
              Registered at
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredRegistrations.map((reg) => (
            <tr key={reg.id} data-test-id="admin-registrations-list-row">
              <td
                style={{
                  borderBottom: "1px solid #eee",
                  padding: "8px",
                }}
              >
                <a
                  href={`/admin/registrations/${reg.id}`}
                  data-test-id="admin-registrations-list-member-link"
                  style={{ color: "#0066cc", textDecoration: "none" }}
                >
                  {reg.memberName}
                </a>
              </td>
              <td
                style={{
                  borderBottom: "1px solid #eee",
                  padding: "8px",
                }}
              >
                {reg.eventTitle}
              </td>
              <td
                style={{
                  borderBottom: "1px solid #eee",
                  padding: "8px",
                }}
              >
                {reg.status}
              </td>
              <td
                style={{
                  borderBottom: "1px solid #eee",
                  padding: "8px",
                }}
              >
                {reg.registeredAt}
              </td>
            </tr>
          ))}
          {!loading && filteredRegistrations.length === 0 && (
            <tr data-test-id="admin-registrations-list-empty-state">
              <td
                colSpan={4}
                style={{
                  padding: "8px",
                  fontStyle: "italic",
                  color: "#666",
                }}
              >
                No registrations found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div
        data-test-id="admin-registrations-pagination"
        style={{
          marginTop: "16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <button
          data-test-id="admin-registrations-pagination-prev"
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
        <span data-test-id="admin-registrations-pagination-label">
          Page {page} of {totalPages}
        </span>
        <button
          data-test-id="admin-registrations-pagination-next"
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
