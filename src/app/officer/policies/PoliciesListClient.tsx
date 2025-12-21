/**
 * Policies List Client Component
 *
 * Handles search, filtering, and display of the policy registry.
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Policy {
  id: string;
  title: string;
  shortTitle: string;
  category: string;
  status: string;
  effectiveDate: string;
  summary: string;
  enforcementLevel: string;
}

interface PolicyResponse {
  policies: Policy[];
  categories: string[];
  metadata: {
    totalPolicies: number;
    byCategory: Record<string, number>;
    byStatus: Record<string, number>;
  };
}

// Category badge colors
const categoryColors: Record<string, { bg: string; text: string }> = {
  Events: { bg: "#dbeafe", text: "#1e40af" },
  Membership: { bg: "#dcfce7", text: "#166534" },
  Privacy: { bg: "#fef3c7", text: "#92400e" },
  Communications: { bg: "#e0e7ff", text: "#3730a3" },
  Finance: { bg: "#fce7f3", text: "#9d174d" },
  Governance: { bg: "#f3e8ff", text: "#6b21a8" },
};

// Status badge colors
const statusColors: Record<string, { bg: string; text: string }> = {
  active: { bg: "#dcfce7", text: "#166534" },
  draft: { bg: "#fef3c7", text: "#92400e" },
  deprecated: { bg: "#fee2e2", text: "#991b1b" },
};

// Enforcement level badges
const enforcementColors: Record<string, { bg: string; text: string }> = {
  automatic: { bg: "#dbeafe", text: "#1e40af" },
  manual: { bg: "#fef3c7", text: "#92400e" },
  advisory: { bg: "#f3f4f6", text: "#4b5563" },
};

export default function PoliciesListClient() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter) params.set("category", categoryFilter);
      if (statusFilter) params.set("status", statusFilter);

      const url = `/api/v1/policies${params.toString() ? `?${params}` : ""}`;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error("Failed to load policies");
      }

      const data: PolicyResponse = await res.json();
      setPolicies(data.policies);
      setCategories(data.categories);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load policies");
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  // Handle search with debounce
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  if (error) {
    return (
      <div
        style={{
          backgroundColor: "#fef2f2",
          color: "#991b1b",
          padding: "16px",
          borderRadius: "8px",
          border: "1px solid #fecaca",
        }}
      >
        <strong>Error:</strong> {error}
      </div>
    );
  }

  return (
    <div>
      {/* Search and Filters */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        {/* Search input */}
        <input
          type="text"
          placeholder="Search policies..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{
            flex: "1",
            minWidth: "200px",
            padding: "10px 14px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            fontSize: "14px",
          }}
        />

        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            padding: "10px 14px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            fontSize: "14px",
            backgroundColor: "#fff",
            minWidth: "150px",
          }}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "10px 14px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            fontSize: "14px",
            backgroundColor: "#fff",
            minWidth: "120px",
          }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="deprecated">Deprecated</option>
        </select>

        {/* Export PDF button */}
        <Link
          href="/api/v1/policies/export-pdf"
          style={{
            padding: "10px 16px",
            backgroundColor: "#0066cc",
            color: "#fff",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 500,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>Export PDF</span>
        </Link>
      </div>

      {/* Loading state */}
      {loading ? (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "#6b7280",
          }}
        >
          Loading policies...
        </div>
      ) : policies.length === 0 ? (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "#6b7280",
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
          }}
        >
          No policies found matching your criteria.
        </div>
      ) : (
        /* Policy list */
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {policies.map((policy) => (
            <Link
              key={policy.id}
              href={`/officer/policies/${encodeURIComponent(policy.id)}`}
              style={{
                display: "block",
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "16px 20px",
                textDecoration: "none",
                color: "inherit",
                transition: "box-shadow 0.15s, border-color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(0,0,0,0.08)";
                e.currentTarget.style.borderColor = "#3b82f6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "#e5e7eb";
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "8px",
                }}
              >
                <div>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "12px",
                      color: "#6b7280",
                      marginRight: "8px",
                    }}
                  >
                    {policy.id}
                  </span>
                  <h2
                    style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      margin: "4px 0",
                      color: "#111827",
                    }}
                  >
                    {policy.title}
                  </h2>
                </div>
                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  {/* Category badge */}
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 600,
                      backgroundColor:
                        categoryColors[policy.category]?.bg || "#f3f4f6",
                      color:
                        categoryColors[policy.category]?.text || "#4b5563",
                    }}
                  >
                    {policy.category}
                  </span>
                  {/* Status badge */}
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 600,
                      backgroundColor:
                        statusColors[policy.status]?.bg || "#f3f4f6",
                      color: statusColors[policy.status]?.text || "#4b5563",
                    }}
                  >
                    {policy.status}
                  </span>
                </div>
              </div>

              <p
                style={{
                  fontSize: "14px",
                  color: "#4b5563",
                  margin: "0 0 12px 0",
                  lineHeight: 1.5,
                }}
              >
                {policy.summary.trim()}
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  fontSize: "12px",
                  color: "#9ca3af",
                }}
              >
                <span>Effective: {policy.effectiveDate}</span>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: "4px",
                    backgroundColor:
                      enforcementColors[policy.enforcementLevel]?.bg ||
                      "#f3f4f6",
                    color:
                      enforcementColors[policy.enforcementLevel]?.text ||
                      "#4b5563",
                  }}
                >
                  {policy.enforcementLevel} enforcement
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
