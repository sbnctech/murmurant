/**
 * Committees Page
 *
 * URL: /member/committees
 *
 * Lists all active committees and interest groups.
 * Members can browse and express interest in joining.
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Committee {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export default function MemberCommitteesPage() {
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCommittees() {
      try {
        const res = await fetch("/api/v1/committees");
        if (res.ok) {
          const data = await res.json();
          setCommittees(data.committees || []);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
    fetchCommittees();
  }, []);

  return (
    <div data-test-id="member-committees-page" style={{ minHeight: "100vh", backgroundColor: "var(--token-color-surface-2)" }}>
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
            href="/member/events"
            style={{
              fontSize: "var(--token-text-sm)",
              color: "var(--token-color-text-muted)",
              textDecoration: "none",
            }}
          >
            Events
          </Link>
        </nav>
      </header>

      {/* Page Content */}
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "var(--token-space-lg) var(--token-space-md)" }}>
        {/* Page Title */}
        <div style={{ marginBottom: "var(--token-space-lg)" }}>
          <h1
            style={{
              fontSize: "var(--token-text-2xl)",
              fontWeight: "var(--token-weight-bold)",
              color: "var(--token-color-text)",
              margin: 0,
            }}
          >
            Committees & Interest Groups
          </h1>
          <p
            style={{
              fontSize: "var(--token-text-base)",
              color: "var(--token-color-text-muted)",
              marginTop: "var(--token-space-xs)",
            }}
          >
            Explore activities and find your community
          </p>
        </div>

        {/* Committees List */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--token-space-md)" }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "var(--token-color-surface)",
                  borderRadius: "var(--token-radius-lg)",
                  border: "1px solid var(--token-color-border)",
                  padding: "var(--token-space-lg)",
                }}
              >
                <div
                  style={{
                    height: "24px",
                    width: "40%",
                    backgroundColor: "var(--token-color-surface-2)",
                    borderRadius: "var(--token-radius-lg)",
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
              </div>
            ))}
          </div>
        ) : committees.length === 0 ? (
          <div
            style={{
              backgroundColor: "var(--token-color-surface)",
              borderRadius: "var(--token-radius-lg)",
              border: "1px solid var(--token-color-border)",
              padding: "var(--token-space-xl)",
              textAlign: "center",
            }}
          >
            <p style={{ color: "var(--token-color-text-muted)", margin: 0 }}>
              Committee information is coming soon.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--token-space-md)" }}>
            {committees.map((committee) => (
              <div
                key={committee.id}
                style={{
                  backgroundColor: "var(--token-color-surface)",
                  borderRadius: "var(--token-radius-lg)",
                  border: "1px solid var(--token-color-border)",
                  padding: "var(--token-space-lg)",
                }}
              >
                <h3
                  style={{
                    fontSize: "var(--token-text-lg)",
                    fontWeight: 600,
                    color: "var(--token-color-text)",
                    margin: "0 0 var(--token-space-xs) 0",
                  }}
                >
                  {committee.name}
                </h3>
                {committee.description && (
                  <p
                    style={{
                      fontSize: "var(--token-text-sm)",
                      color: "var(--token-color-text-muted)",
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    {committee.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Back Link */}
        <div style={{ marginTop: "var(--token-space-xl)" }}>
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
