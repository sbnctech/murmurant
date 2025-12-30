/**
 * Member Directory Page
 *
 * URL: /member/directory
 *
 * Lists active members for other members to browse.
 * Requires authentication.
 *
 * Features:
 * - Search by name
 * - Pagination
 * - Links to individual member profiles
 *
 * Copyright © 2025 Murmurant, Inc.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { DirectoryMember } from "@/app/api/v1/members/directory/route";

interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function MemberDirectoryPage() {
  const [members, setMembers] = useState<DirectoryMember[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/v1/members/directory?${params.toString()}`);

      if (res.status === 401) {
        setError("Please sign in to view the member directory");
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to load directory");
      }

      const data = await res.json();
      setMembers(data.members);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load directory");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return (
    <div
      data-test-id="member-directory-page"
      style={{ minHeight: "100vh", backgroundColor: "var(--token-color-surface-2)" }}
    >
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: "var(--token-color-surface)",
          borderBottom: "1px solid var(--token-color-border)",
          padding: "var(--token-space-sm) var(--token-space-md)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: "var(--token-text-lg)",
            fontWeight: 700,
            color: "var(--token-color-text)",
            textDecoration: "none",
          }}
        >
          SBNC
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: "var(--token-space-md)" }}>
          <Link
            href="/my"
            style={{
              fontSize: "var(--token-text-sm)",
              color: "var(--token-color-text-muted)",
              textDecoration: "none",
            }}
          >
            My SBNC
          </Link>
          <Link
            href="/events"
            style={{
              fontSize: "var(--token-text-sm)",
              color: "var(--token-color-text-muted)",
              textDecoration: "none",
            }}
          >
            Events
          </Link>
          <Link
            href="/member/directory"
            style={{
              fontSize: "var(--token-text-sm)",
              color: "var(--token-color-primary)",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Directory
          </Link>
        </nav>
      </header>

      {/* Page Content */}
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          padding: "var(--token-space-lg) var(--token-space-md)",
        }}
      >
        {/* Page Header */}
        <div style={{ marginBottom: "var(--token-space-lg)" }}>
          <h1
            style={{
              fontSize: "var(--token-text-2xl)",
              fontWeight: "var(--token-weight-bold)",
              color: "var(--token-color-text)",
              margin: 0,
            }}
          >
            Member Directory
          </h1>
          <p
            style={{
              fontSize: "var(--token-text-base)",
              color: "var(--token-color-text-muted)",
              marginTop: "var(--token-space-xs)",
              marginBottom: 0,
            }}
          >
            Find and connect with fellow SBNC members
          </p>
        </div>

        {/* Search */}
        <div style={{ marginBottom: "var(--token-space-lg)" }}>
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-test-id="directory-search"
            style={{
              width: "100%",
              padding: "var(--token-space-sm) var(--token-space-md)",
              fontSize: "var(--token-text-base)",
              border: "1px solid var(--token-color-border)",
              borderRadius: "var(--token-radius-lg)",
              backgroundColor: "var(--token-color-surface)",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Error State */}
        {error && (
          <div
            data-test-id="directory-error"
            style={{
              backgroundColor: "var(--token-color-surface)",
              borderRadius: "var(--token-radius-lg)",
              border: "1px solid var(--token-color-danger)",
              padding: "var(--token-space-xl)",
              textAlign: "center",
            }}
          >
            <p style={{ color: "var(--token-color-danger)", margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && !error && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--token-space-sm)",
            }}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "var(--token-color-surface)",
                  borderRadius: "var(--token-radius-lg)",
                  border: "1px solid var(--token-color-border)",
                  padding: "var(--token-space-md)",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--token-space-md)",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: "var(--token-color-surface-2)",
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      width: "120px",
                      height: "18px",
                      backgroundColor: "var(--token-color-surface-2)",
                      borderRadius: "var(--token-radius-lg)",
                      marginBottom: "var(--token-space-xs)",
                      animation: "pulse 1.5s ease-in-out infinite",
                    }}
                  />
                  <div
                    style={{
                      width: "80px",
                      height: "14px",
                      backgroundColor: "var(--token-color-surface-2)",
                      borderRadius: "var(--token-radius-lg)",
                      animation: "pulse 1.5s ease-in-out infinite",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Member List */}
        {!loading && !error && (
          <>
            {members.length === 0 ? (
              <div
                style={{
                  backgroundColor: "var(--token-color-surface)",
                  borderRadius: "var(--token-radius-lg)",
                  border: "1px solid var(--token-color-border)",
                  padding: "var(--token-space-xl)",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    color: "var(--token-color-text-muted)",
                    margin: 0,
                  }}
                >
                  {debouncedSearch
                    ? "No members found matching your search"
                    : "No members in the directory yet"}
                </p>
              </div>
            ) : (
              <div
                data-test-id="directory-list"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--token-space-sm)",
                }}
              >
                {members.map((member) => (
                  <Link
                    key={member.id}
                    href={`/member/directory/${member.id}`}
                    data-test-id={`directory-member-${member.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--token-space-md)",
                      backgroundColor: "var(--token-color-surface)",
                      borderRadius: "var(--token-radius-lg)",
                      border: "1px solid var(--token-color-border)",
                      padding: "var(--token-space-md)",
                      textDecoration: "none",
                      color: "inherit",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--token-color-primary)";
                      e.currentTarget.style.boxShadow = "var(--token-shadow-sm)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--token-color-border)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        backgroundColor: "var(--token-color-primary)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "var(--token-text-lg)",
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {member.firstName.charAt(0).toUpperCase()}
                      {member.lastName.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "var(--token-text-base)",
                          fontWeight: 600,
                          color: "var(--token-color-text)",
                        }}
                      >
                        {member.firstName} {member.lastName}
                      </div>
                      <div
                        style={{
                          fontSize: "var(--token-text-sm)",
                          color: "var(--token-color-text-muted)",
                          display: "flex",
                          alignItems: "center",
                          gap: "var(--token-space-sm)",
                        }}
                      >
                        <span>Member since {member.memberSince}</span>
                        {member.membershipTier && (
                          <>
                            <span style={{ color: "var(--token-color-border)" }}>|</span>
                            <span>{member.membershipTier.name}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--token-color-text-muted)"
                      strokeWidth="2"
                    >
                      <polyline points="9,18 15,12 9,6" />
                    </svg>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div
                data-test-id="directory-pagination"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "var(--token-space-sm)",
                  marginTop: "var(--token-space-lg)",
                }}
              >
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrev}
                  style={{
                    padding: "var(--token-space-sm) var(--token-space-md)",
                    border: "1px solid var(--token-color-border)",
                    borderRadius: "var(--token-radius-lg)",
                    backgroundColor: "var(--token-color-surface)",
                    color: pagination.hasPrev
                      ? "var(--token-color-text)"
                      : "var(--token-color-text-muted)",
                    cursor: pagination.hasPrev ? "pointer" : "not-allowed",
                  }}
                >
                  Previous
                </button>
                <span
                  style={{
                    color: "var(--token-color-text-muted)",
                    fontSize: "var(--token-text-sm)",
                  }}
                >
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={!pagination.hasNext}
                  style={{
                    padding: "var(--token-space-sm) var(--token-space-md)",
                    border: "1px solid var(--token-color-border)",
                    borderRadius: "var(--token-radius-lg)",
                    backgroundColor: "var(--token-color-surface)",
                    color: pagination.hasNext
                      ? "var(--token-color-text)"
                      : "var(--token-color-text-muted)",
                    cursor: pagination.hasNext ? "pointer" : "not-allowed",
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Back Link */}
        <div style={{ marginTop: "var(--token-space-xl)", textAlign: "center" }}>
          <Link
            href="/my"
            style={{
              color: "var(--token-color-primary)",
              textDecoration: "none",
              fontSize: "var(--token-text-sm)",
            }}
          >
            &larr; Back to My SBNC
          </Link>
        </div>
      </div>
    </div>
  );
}
