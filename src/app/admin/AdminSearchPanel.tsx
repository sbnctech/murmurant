"use client";

import { useState } from "react";

type SearchMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
};

type SearchEvent = {
  id: string;
  title: string;
  category: string;
  startTime: string;
};

type SearchRegistration = {
  id: string;
  memberId: string;
  eventId: string;
  status: string;
  memberName: string;
  eventTitle: string;
};

type SearchResults = {
  members: SearchMember[];
  events: SearchEvent[];
  registrations: SearchRegistration[];
};

type MemberDetail = {
  member: {
    id: string;
    name: string;
    email: string;
    status: string;
  };
  registrations: Array<{
    id: string;
    eventId: string;
    eventTitle: string;
    status: string;
  }>;
};

export default function AdminSearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [searching, setSearching] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberDetail | null>(null);
  const [loadingMember, setLoadingMember] = useState(false);

  async function handleSearch() {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      setSelectedMember(null);
      return;
    }

    setSearching(true);
    setSelectedMember(null);
    try {
      // credentials: 'include' sends HttpOnly session cookies
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(trimmed)}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
      } else {
        setResults(null);
      }
    } catch {
      setResults(null);
    } finally {
      setSearching(false);
    }
  }

  async function handleMemberClick(memberId: string) {
    setLoadingMember(true);
    try {
      // credentials: 'include' sends HttpOnly session cookies
      const res = await fetch(`/api/admin/members/${memberId}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedMember(data);
      } else {
        setSelectedMember(null);
      }
    } catch {
      setSelectedMember(null);
    } finally {
      setLoadingMember(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleSearch();
    }
  }

  const hasResults = results !== null;
  const noMatches =
    hasResults &&
    results.members.length === 0 &&
    results.events.length === 0 &&
    results.registrations.length === 0;

  return (
    <div data-test-id="admin-search-panel">
      {/* Search input */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <input
          type="text"
          data-test-id="admin-search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search members, events, registrations..."
          style={{
            padding: "8px 12px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "14px",
            width: "300px",
          }}
        />
        <button
          type="button"
          data-test-id="admin-search-button"
          onClick={handleSearch}
          disabled={searching}
          style={{
            padding: "8px 16px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            backgroundColor: "#fff",
            cursor: searching ? "default" : "pointer",
          }}
        >
          {searching ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Results container */}
      <div style={{ display: "flex", gap: "24px" }}>
        {/* Left side: Search results */}
        <div style={{ flex: 1 }}>
          {noMatches && (
            <div data-test-id="admin-search-no-results" style={{ color: "#666", fontStyle: "italic" }}>
              No results found for &quot;{query.trim()}&quot;
            </div>
          )}

          {hasResults && !noMatches && (
            <div data-test-id="admin-search-results">
              {/* Members section */}
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>Members</h3>
                {results.members.length === 0 ? (
                  <div data-test-id="admin-search-members-empty" style={{ color: "#666", fontSize: "14px" }}>
                    No matching members
                  </div>
                ) : (
                  <table
                    data-test-id="admin-search-members-table"
                    style={{ width: "100%", borderCollapse: "collapse", maxWidth: "500px" }}
                  >
                    <thead>
                      <tr>
                        <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "6px" }}>
                          Name
                        </th>
                        <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "6px" }}>
                          Email
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.members.map((m) => (
                        <tr
                          key={m.id}
                          data-test-id="admin-search-member-row"
                          onClick={() => handleMemberClick(m.id)}
                          style={{
                            cursor: "pointer",
                            backgroundColor: selectedMember?.member.id === m.id ? "#e6f3ff" : "transparent",
                          }}
                        >
                          <td style={{ borderBottom: "1px solid #eee", padding: "6px" }}>
                            {m.firstName} {m.lastName}
                          </td>
                          <td style={{ borderBottom: "1px solid #eee", padding: "6px" }}>{m.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Events section */}
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>Events</h3>
                {results.events.length === 0 ? (
                  <div data-test-id="admin-search-events-empty" style={{ color: "#666", fontSize: "14px" }}>
                    No matching events
                  </div>
                ) : (
                  <table
                    data-test-id="admin-search-events-table"
                    style={{ width: "100%", borderCollapse: "collapse", maxWidth: "500px" }}
                  >
                    <thead>
                      <tr>
                        <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "6px" }}>
                          Title
                        </th>
                        <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "6px" }}>
                          Category
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.events.map((e) => (
                        <tr key={e.id} data-test-id="admin-search-event-row">
                          <td style={{ borderBottom: "1px solid #eee", padding: "6px" }}>{e.title}</td>
                          <td style={{ borderBottom: "1px solid #eee", padding: "6px" }}>{e.category}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Registrations section */}
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>Registrations</h3>
                {results.registrations.length === 0 ? (
                  <div data-test-id="admin-search-registrations-empty" style={{ color: "#666", fontSize: "14px" }}>
                    No matching registrations
                  </div>
                ) : (
                  <table
                    data-test-id="admin-search-registrations-table"
                    style={{ width: "100%", borderCollapse: "collapse", maxWidth: "500px" }}
                  >
                    <thead>
                      <tr>
                        <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "6px" }}>
                          Member
                        </th>
                        <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "6px" }}>
                          Event
                        </th>
                        <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "6px" }}>
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.registrations.map((r) => (
                        <tr key={r.id} data-test-id="admin-search-registration-row">
                          <td style={{ borderBottom: "1px solid #eee", padding: "6px" }}>{r.memberName}</td>
                          <td style={{ borderBottom: "1px solid #eee", padding: "6px" }}>{r.eventTitle}</td>
                          <td style={{ borderBottom: "1px solid #eee", padding: "6px" }}>{r.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right side: Member detail panel */}
        {selectedMember && (
          <div
            data-test-id="admin-member-detail-panel"
            style={{
              width: "350px",
              padding: "16px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              backgroundColor: "#fafafa",
            }}
          >
            <h3 style={{ fontSize: "16px", marginBottom: "12px" }}>Member Detail</h3>

            {loadingMember ? (
              <div>Loading...</div>
            ) : (
              <>
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ marginBottom: "6px" }}>
                    <strong>Name:</strong>{" "}
                    <span data-test-id="admin-member-panel-name">{selectedMember.member.name}</span>
                  </div>
                  <div style={{ marginBottom: "6px" }}>
                    <strong>Email:</strong>{" "}
                    <span data-test-id="admin-member-panel-email">{selectedMember.member.email}</span>
                  </div>
                  <div style={{ marginBottom: "6px" }}>
                    <strong>Status:</strong>{" "}
                    <span data-test-id="admin-member-panel-status">{selectedMember.member.status}</span>
                  </div>
                </div>

                <h4 style={{ fontSize: "14px", marginBottom: "8px" }}>Registrations</h4>
                {selectedMember.registrations.length === 0 ? (
                  <div style={{ color: "#666", fontSize: "14px" }}>No registrations</div>
                ) : (
                  <table
                    data-test-id="admin-member-panel-registrations-table"
                    style={{ width: "100%", borderCollapse: "collapse" }}
                  >
                    <thead>
                      <tr>
                        <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "4px", fontSize: "13px" }}>
                          Event
                        </th>
                        <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "4px", fontSize: "13px" }}>
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedMember.registrations.map((reg) => (
                        <tr key={reg.id} data-test-id="admin-member-panel-registration-row">
                          <td style={{ borderBottom: "1px solid #eee", padding: "4px", fontSize: "13px" }}>
                            {reg.eventTitle}
                          </td>
                          <td style={{ borderBottom: "1px solid #eee", padding: "4px", fontSize: "13px" }}>
                            {reg.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
