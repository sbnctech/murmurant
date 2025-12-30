/**
 * Member Public Profile Page
 *
 * URL: /member/directory/:id
 *
 * Shows a read-only "public profile" view of a member as seen by other members.
 * Does NOT expose admin-only fields, internal notes, payments, or audit logs.
 *
 * Features:
 * - Name and tenure
 * - Membership level/tier
 * - Committee memberships
 * - Privacy-respecting (no email, phone, exact join date)
 *
 * Copyright © 2025 Murmurant, Inc.
 */

"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import type { PublicMemberProfile } from "@/app/api/v1/members/[id]/public/route";

interface MemberProfilePageProps {
  params: Promise<{ id: string }>;
}

export default function MemberProfilePage({ params }: MemberProfilePageProps) {
  const { id } = use(params);
  const [member, setMember] = useState<PublicMemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMember() {
      try {
        const res = await fetch(`/api/v1/members/${id}/public`);
        if (res.status === 401) {
          setError("Please sign in to view member profiles");
          return;
        }
        if (res.status === 404) {
          setError("Member not found");
          return;
        }
        if (!res.ok) {
          throw new Error("Failed to load member profile");
        }
        const data = await res.json();
        setMember(data.member);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load member profile");
      } finally {
        setLoading(false);
      }
    }
    fetchMember();
  }, [id]);

  return (
    <div
      data-test-id="member-profile-page"
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

      {/* Main Content */}
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding: "var(--token-space-lg) var(--token-space-md)",
        }}
      >
        {/* Breadcrumb */}
        <nav
          style={{
            marginBottom: "var(--token-space-md)",
            fontSize: "var(--token-text-sm)",
          }}
        >
          <Link
            href="/member/directory"
            style={{
              color: "var(--token-color-text-muted)",
              textDecoration: "none",
            }}
          >
            Directory
          </Link>
          <span style={{ color: "var(--token-color-text-muted)", margin: "0 8px" }}>/</span>
          <span style={{ color: "var(--token-color-text)" }}>
            {loading ? "Loading..." : member ? `${member.firstName} ${member.lastName}` : "Member"}
          </span>
        </nav>

        {/* Loading State */}
        {loading && (
          <div
            style={{
              backgroundColor: "var(--token-color-surface)",
              borderRadius: "var(--token-radius-lg)",
              border: "1px solid var(--token-color-border)",
              padding: "var(--token-space-xl)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "var(--token-space-md)", marginBottom: "var(--token-space-lg)" }}>
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  backgroundColor: "var(--token-color-surface-2)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    width: "150px",
                    height: "28px",
                    backgroundColor: "var(--token-color-surface-2)",
                    borderRadius: "var(--token-radius-lg)",
                    marginBottom: "var(--token-space-sm)",
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
                <div
                  style={{
                    width: "100px",
                    height: "18px",
                    backgroundColor: "var(--token-color-surface-2)",
                    borderRadius: "var(--token-radius-lg)",
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div
            data-test-id="member-profile-error"
            style={{
              backgroundColor: "var(--token-color-surface)",
              borderRadius: "var(--token-radius-lg)",
              border: "1px solid var(--token-color-danger)",
              padding: "var(--token-space-xl)",
              textAlign: "center",
            }}
          >
            <p style={{ color: "var(--token-color-danger)", marginBottom: "var(--token-space-md)" }}>
              {error}
            </p>
            <Link
              href="/member/directory"
              style={{
                color: "var(--token-color-primary)",
                textDecoration: "none",
              }}
            >
              Back to Directory
            </Link>
          </div>
        )}

        {/* Member Profile */}
        {member && !loading && (
          <div
            style={{
              backgroundColor: "var(--token-color-surface)",
              borderRadius: "var(--token-radius-lg)",
              border: "1px solid var(--token-color-border)",
              overflow: "hidden",
            }}
          >
            {/* Profile Header */}
            <div
              style={{
                padding: "var(--token-space-xl)",
                borderBottom: "1px solid var(--token-color-border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "var(--token-space-md)" }}>
                {/* Avatar */}
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    backgroundColor: "var(--token-color-primary)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "var(--token-text-2xl)",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {member.firstName.charAt(0).toUpperCase()}
                  {member.lastName.charAt(0).toUpperCase()}
                </div>

                {/* Name and Status */}
                <div>
                  <h1
                    data-test-id="member-name"
                    style={{
                      fontSize: "var(--token-text-2xl)",
                      fontWeight: 700,
                      color: "var(--token-color-text)",
                      margin: 0,
                    }}
                  >
                    {member.firstName} {member.lastName}
                  </h1>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--token-space-sm)", marginTop: "var(--token-space-xs)" }}>
                    <span
                      data-test-id="member-status"
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        backgroundColor: "#dcfce7",
                        color: "var(--token-color-success)",
                        borderRadius: "var(--token-radius-lg)",
                        fontSize: "var(--token-text-sm)",
                        fontWeight: 600,
                      }}
                    >
                      {member.membershipStatus.label}
                    </span>
                    {member.membershipTier && (
                      <span
                        data-test-id="member-tier"
                        style={{
                          fontSize: "var(--token-text-sm)",
                          color: "var(--token-color-text-muted)",
                          backgroundColor: "var(--token-color-surface-2)",
                          padding: "2px 8px",
                          borderRadius: "var(--token-radius-lg)",
                          border: "1px solid var(--token-color-border)",
                        }}
                      >
                        {member.membershipTier.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Member Details */}
            <div style={{ padding: "var(--token-space-lg)" }}>
              {/* Member Since */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--token-space-sm)",
                  marginBottom: "var(--token-space-md)",
                  padding: "var(--token-space-md)",
                  backgroundColor: "var(--token-color-surface-2)",
                  borderRadius: "var(--token-radius-lg)",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--token-color-primary)"
                  strokeWidth="2"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span
                  data-test-id="member-since"
                  style={{ color: "var(--token-color-text)" }}
                >
                  Member since {member.memberSince}
                </span>
              </div>

              {/* Committees */}
              {member.committees.length > 0 && (
                <div>
                  <h2
                    style={{
                      fontSize: "var(--token-text-base)",
                      fontWeight: 600,
                      color: "var(--token-color-text)",
                      marginTop: 0,
                      marginBottom: "var(--token-space-sm)",
                    }}
                  >
                    Committees
                  </h2>
                  <div
                    data-test-id="member-committees"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--token-space-xs)",
                    }}
                  >
                    {member.committees.map((committee, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "var(--token-space-sm) var(--token-space-md)",
                          backgroundColor: "var(--token-color-surface-2)",
                          borderRadius: "var(--token-radius-lg)",
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>{committee.name}</span>
                        <span
                          style={{
                            fontSize: "var(--token-text-sm)",
                            color: "var(--token-color-text-muted)",
                          }}
                        >
                          {committee.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No committees */}
              {member.committees.length === 0 && (
                <p
                  style={{
                    color: "var(--token-color-text-muted)",
                    fontStyle: "italic",
                    margin: 0,
                    textAlign: "center",
                  }}
                >
                  Not currently serving on any committees
                </p>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "var(--token-space-md) var(--token-space-lg)",
                borderTop: "1px solid var(--token-color-border)",
                backgroundColor: "var(--token-color-surface-2)",
              }}
            >
              <Link
                href="/member/directory"
                style={{
                  color: "var(--token-color-primary)",
                  textDecoration: "none",
                  fontSize: "var(--token-text-sm)",
                }}
              >
                &larr; Back to Directory
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
