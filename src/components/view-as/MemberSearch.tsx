/**
 * MemberSearch - Search and select a member to impersonate
 *
 * Used in admin tools to start impersonating a specific member.
 * Searches by name or email.
 *
 * Copyright © 2025 Murmurant, Inc.
 */

"use client";

import { useState, useCallback } from "react";

interface SearchResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
}

interface MemberSearchProps {
  onImpersonate: (memberId: string, memberName: string) => Promise<void>;
  disabled?: boolean;
}

export default function MemberSearch({ onImpersonate, disabled }: MemberSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [impersonating, setImpersonating] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/admin/search?q=${encodeURIComponent(query.trim())}`,
        { credentials: "include" }
      );

      if (!res.ok) {
        throw new Error("Search failed");
      }

      const data = await res.json();
      setResults(data.members || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleImpersonate = async (member: SearchResult) => {
    setImpersonating(member.id);
    try {
      await onImpersonate(member.id, `${member.firstName} ${member.lastName}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start impersonation");
    } finally {
      setImpersonating(null);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.searchRow}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search by name or email..."
          disabled={disabled}
          style={styles.input}
          data-test-id="member-search-input"
        />
        <button
          onClick={handleSearch}
          disabled={disabled || loading || !query.trim()}
          style={styles.button}
          data-test-id="member-search-button"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {error && (
        <div style={styles.error} data-test-id="member-search-error">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div style={styles.results} data-test-id="member-search-results">
          {results.map((member) => (
            <div key={member.id} style={styles.resultRow}>
              <div style={styles.memberInfo}>
                <div style={styles.memberName}>
                  {member.firstName} {member.lastName}
                </div>
                <div style={styles.memberEmail}>{member.email}</div>
              </div>
              <div style={styles.memberStatus}>
                <span
                  style={{
                    ...styles.statusBadge,
                    backgroundColor: member.status === "Active" ? "#d1fae5" : "#fef3c7",
                    color: member.status === "Active" ? "#065f46" : "#92400e",
                  }}
                >
                  {member.status}
                </span>
              </div>
              <button
                onClick={() => handleImpersonate(member)}
                disabled={disabled || impersonating === member.id}
                style={styles.impersonateButton}
                data-test-id={`impersonate-${member.id}`}
              >
                {impersonating === member.id ? "Starting..." : "View As"}
              </button>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && query.trim() && !loading && !error && (
        <div style={styles.noResults}>No members found</div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "16px",
    backgroundColor: "#fafafa",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
  },
  searchRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "12px",
  },
  input: {
    flex: 1,
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    fontSize: "14px",
  },
  button: {
    padding: "8px 16px",
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
  },
  error: {
    padding: "8px 12px",
    backgroundColor: "#fef2f2",
    color: "#991b1b",
    borderRadius: "4px",
    marginBottom: "12px",
    fontSize: "14px",
  },
  results: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  resultRow: {
    display: "flex",
    alignItems: "center",
    padding: "12px",
    backgroundColor: "#fff",
    borderRadius: "4px",
    border: "1px solid #e5e7eb",
    gap: "12px",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#111827",
  },
  memberEmail: {
    fontSize: "13px",
    color: "#6b7280",
  },
  memberStatus: {},
  statusBadge: {
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: 500,
  },
  impersonateButton: {
    padding: "6px 12px",
    backgroundColor: "#f59e0b",
    color: "#000",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 500,
  },
  noResults: {
    padding: "12px",
    color: "#6b7280",
    fontStyle: "italic",
    textAlign: "center",
  },
};
