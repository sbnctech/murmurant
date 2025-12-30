/**
 * ViewAsMemberSection - Support Tools section for admin demo dashboard
 *
 * Provides "View as Member" impersonation capability for troubleshooting.
 * Designed to feel official and trustworthy for conservative stakeholders.
 *
 * Safety features:
 * - Read-only mode during impersonation
 * - Audit logging of all sessions
 * - Server-side capability blocking
 *
 * Copyright © 2025 Murmurant, Inc.
 */

"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { MemberSearch } from "@/components/view-as";

export default function ViewAsMemberSection() {
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleImpersonate = useCallback(async (memberId: string, memberName: string) => {
    setError(null);

    try {
      const res = await fetch("/api/admin/impersonate/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ memberId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start impersonation");
      }

      // Reload to show the impersonation banner
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start impersonation");
      throw err;
    }
  }, []);

  return (
    <section
      data-test-id="support-tools-section"
      style={{
        marginBottom: "32px",
        padding: "20px",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        backgroundColor: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      {/* Section Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "20px",
        paddingBottom: "16px",
        borderBottom: "1px solid #e5e7eb",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            backgroundColor: "#eef2ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
          }}>
            &#128736;
          </div>
          <div>
            <h2 style={{
              fontSize: "18px",
              fontWeight: 600,
              margin: 0,
              color: "#111827",
            }}>
              Support Tools
            </h2>
            <p style={{
              margin: 0,
              fontSize: "13px",
              color: "#6b7280",
            }}>
              Troubleshooting utilities for member support
            </p>
          </div>
        </div>
        <Link
          href="/docs/support/view-as"
          target="_blank"
          style={{
            fontSize: "13px",
            color: "#6366f1",
            textDecoration: "none",
          }}
        >
          Documentation &rarr;
        </Link>
      </div>

      {/* View as Member Tool */}
      <div
        data-test-id="demo-view-as-section"
        style={{
          padding: "16px",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          backgroundColor: "#fafafa",
        }}
      >
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}>
          <div>
            <h3 style={{
              fontSize: "15px",
              fontWeight: 600,
              margin: "0 0 4px 0",
              color: "#111827",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <span style={{ fontSize: "16px" }}>&#128065;</span>
              View as Member
            </h3>
            <p style={{
              color: "#6b7280",
              fontSize: "13px",
              margin: 0,
              maxWidth: "500px",
            }}>
              Safely simulate member experience for troubleshooting. All actions are read-only and audit logged.
            </p>
          </div>
          <div style={{
            display: "flex",
            gap: "6px",
          }}>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 8px",
              backgroundColor: "#dcfce7",
              color: "#166534",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase" as const,
              letterSpacing: "0.5px",
            }}>
              <span>&#128274;</span> Read-only
            </span>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 8px",
              backgroundColor: "#dbeafe",
              color: "#1e40af",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase" as const,
              letterSpacing: "0.5px",
            }}>
              <span>&#128221;</span> Audit Logged
            </span>
          </div>
        </div>

        {error && (
          <div
            style={{
              marginBottom: "12px",
              padding: "10px 14px",
              backgroundColor: "#fef2f2",
              color: "#991b1b",
              borderRadius: "6px",
              fontSize: "14px",
              border: "1px solid #fecaca",
            }}
          >
            {error}
          </div>
        )}

        <MemberSearch onImpersonate={handleImpersonate} />

        {/* Safety note */}
        <div style={{
          marginTop: "16px",
          padding: "12px",
          backgroundColor: "#f0fdf4",
          borderRadius: "6px",
          border: "1px solid #bbf7d0",
        }}>
          <p style={{
            margin: 0,
            fontSize: "12px",
            color: "#166534",
            lineHeight: 1.5,
          }}>
            <strong>Safety guarantee:</strong> While viewing as a member, dangerous actions
            (financial transactions, sending emails, role changes) are blocked at the server level.
            A dark banner will be visible at all times, and you can exit instantly with the Escape key.
          </p>
        </div>
      </div>

      {/* Support Workflow Examples */}
      <div
        data-test-id="support-workflow-section"
        style={{
          marginTop: "20px",
          padding: "16px",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          backgroundColor: "#fefce8",
        }}
      >
        <h3 style={{
          fontSize: "14px",
          fontWeight: 600,
          margin: "0 0 12px 0",
          color: "#854d0e",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          <span style={{ fontSize: "16px" }}>📋</span>
          Common Support Workflows
        </h3>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "12px",
        }}>
          {/* Scenario 1 */}
          <div style={{
            padding: "12px",
            backgroundColor: "#fff",
            borderRadius: "6px",
            border: "1px solid #fde68a",
          }}>
            <div style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#92400e",
              marginBottom: "4px",
            }}>
              Member Can&apos;t See Event
            </div>
            <ol style={{
              margin: 0,
              padding: "0 0 0 16px",
              fontSize: "12px",
              color: "#78350f",
              lineHeight: 1.5,
            }}>
              <li>Search for member above</li>
              <li>Click &quot;View As&quot; to impersonate</li>
              <li>Navigate to /events</li>
              <li>Check event visibility and eligibility</li>
              <li>Press Esc to exit</li>
            </ol>
          </div>

          {/* Scenario 2 */}
          <div style={{
            padding: "12px",
            backgroundColor: "#fff",
            borderRadius: "6px",
            border: "1px solid #fde68a",
          }}>
            <div style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#92400e",
              marginBottom: "4px",
            }}>
              Test Event Chair View
            </div>
            <ol style={{
              margin: 0,
              padding: "0 0 0 16px",
              fontSize: "12px",
              color: "#78350f",
              lineHeight: 1.5,
            }}>
              <li>Find an Event Chair member</li>
              <li>Note the &quot;Event Chair&quot; badge appears</li>
              <li>Navigate to their committee&apos;s events</li>
              <li>Verify edit permissions work</li>
              <li>Press Esc to exit</li>
            </ol>
          </div>

          {/* Scenario 3 */}
          <div style={{
            padding: "12px",
            backgroundColor: "#fff",
            borderRadius: "6px",
            border: "1px solid #fde68a",
          }}>
            <div style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#92400e",
              marginBottom: "4px",
            }}>
              Verify Officer Dashboard
            </div>
            <ol style={{
              margin: 0,
              padding: "0 0 0 16px",
              fontSize: "12px",
              color: "#78350f",
              lineHeight: 1.5,
            }}>
              <li>Find a board member</li>
              <li>Note the &quot;Officer&quot; badge appears</li>
              <li>Navigate to /officer dashboard</li>
              <li>Check governance access</li>
              <li>Press Esc to exit</li>
            </ol>
          </div>

          {/* Scenario 4 */}
          <div style={{
            padding: "12px",
            backgroundColor: "#fff",
            borderRadius: "6px",
            border: "1px solid #fde68a",
          }}>
            <div style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#92400e",
              marginBottom: "4px",
            }}>
              Debug Pending Member
            </div>
            <ol style={{
              margin: 0,
              padding: "0 0 0 16px",
              fontSize: "12px",
              color: "#78350f",
              lineHeight: 1.5,
            }}>
              <li>Find a member with pending status</li>
              <li>Note the status badge in banner</li>
              <li>Check what pages they can access</li>
              <li>Verify restrictions are applied</li>
              <li>Press Esc to exit</li>
            </ol>
          </div>
        </div>

        <p style={{
          margin: "12px 0 0 0",
          fontSize: "11px",
          color: "#a16207",
          fontStyle: "italic",
        }}>
          Tip: Click &quot;What&apos;s blocked?&quot; in the banner to see which actions are disabled during impersonation.
        </p>
      </div>
    </section>
  );
}
