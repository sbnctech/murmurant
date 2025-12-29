/**
 * Policy Detail Page
 *
 * Displays full details of a single policy including description,
 * enforcement points, and related documentation.
 *
 * Charter Principles:
 * - N5: No hidden rules - policies are visible and documented
 * - P5: Visible state - policy details clearly shown
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { getPolicyById, getPolicies } from "@/lib/policies";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Generate static params for all policies
export async function generateStaticParams() {
  const policies = getPolicies();
  return policies.map((policy) => ({
    id: policy.id,
  }));
}

// Generate metadata for the page
export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const policy = getPolicyById(id);

  if (!policy) {
    return { title: "Policy Not Found | Murmurant" };
  }

  return {
    title: `${policy.shortTitle} (${policy.id}) | Murmurant`,
    description: policy.summary,
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

export default async function PolicyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const policy = getPolicyById(id);

  if (!policy) {
    notFound();
  }

  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
      {/* Back link */}
      <Link
        href="/officer/policies"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          color: "#6b7280",
          textDecoration: "none",
          fontSize: "14px",
          marginBottom: "16px",
        }}
      >
        <span>&larr;</span>
        <span>Back to Policies</span>
      </Link>

      {/* Header */}
      <header
        style={{
          marginBottom: "32px",
          paddingBottom: "24px",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "14px",
                color: "#6b7280",
                fontWeight: 500,
              }}
            >
              {policy.id}
            </span>
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 600,
                margin: "8px 0",
                color: "#111827",
              }}
            >
              {policy.title}
            </h1>
          </div>

          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            {/* Category badge */}
            <span
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 600,
                backgroundColor:
                  categoryColors[policy.category]?.bg || "#f3f4f6",
                color: categoryColors[policy.category]?.text || "#4b5563",
              }}
            >
              {policy.category}
            </span>
            {/* Status badge */}
            <span
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 600,
                backgroundColor: statusColors[policy.status]?.bg || "#f3f4f6",
                color: statusColors[policy.status]?.text || "#4b5563",
              }}
            >
              {policy.status}
            </span>
          </div>
        </div>

        <p
          style={{
            fontSize: "16px",
            color: "#4b5563",
            margin: "16px 0 0 0",
            lineHeight: 1.6,
          }}
        >
          {policy.summary.trim()}
        </p>
      </header>

      {/* Metadata grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <MetadataCard label="Effective Date" value={policy.effectiveDate} />
        <MetadataCard label="Approved By" value={policy.approvedBy} />
        <MetadataCard label="Approval Date" value={policy.approvalDate} />
        <MetadataCard label="Review Schedule" value={policy.reviewSchedule} />
        <MetadataCard label="Next Review" value={policy.nextReviewDate} />
        <MetadataCard
          label="Enforcement"
          value={
            <span
              style={{
                padding: "4px 10px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: 600,
                backgroundColor:
                  enforcementColors[policy.enforcementLevel]?.bg || "#f3f4f6",
                color:
                  enforcementColors[policy.enforcementLevel]?.text || "#4b5563",
              }}
            >
              {policy.enforcementLevel}
            </span>
          }
        />
      </div>

      {/* Full description */}
      <section style={{ marginBottom: "32px" }}>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 600,
            marginBottom: "12px",
            color: "#111827",
          }}
        >
          Policy Details
        </h2>
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "20px",
          }}
        >
          <MarkdownContent content={policy.description} />
        </div>
      </section>

      {/* Enforcement points */}
      {policy.enforcementPoints && policy.enforcementPoints.length > 0 && (
        <section style={{ marginBottom: "32px" }}>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: 600,
              marginBottom: "12px",
              color: "#111827",
            }}
          >
            Enforcement Points
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "#6b7280",
              marginBottom: "12px",
            }}
          >
            Code locations where this policy is enforced:
          </p>
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {policy.enforcementPoints.map((point, idx) => (
              <li
                key={idx}
                style={{
                  fontFamily: "monospace",
                  fontSize: "13px",
                  color: "#374151",
                  backgroundColor: "#f9fafb",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #e5e7eb",
                }}
              >
                {point}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Related documentation */}
      {policy.relatedDocs && policy.relatedDocs.length > 0 && (
        <section style={{ marginBottom: "32px" }}>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: 600,
              marginBottom: "12px",
              color: "#111827",
            }}
          >
            Related Documentation
          </h2>
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {policy.relatedDocs.map((doc, idx) => (
              <li
                key={idx}
                style={{
                  fontSize: "14px",
                  color: "#3b82f6",
                  backgroundColor: "#f0f9ff",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #bae6fd",
                }}
              >
                {doc}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Export button */}
      <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: "1px solid #e5e7eb" }}>
        <Link
          href={`/api/v1/policies/${encodeURIComponent(policy.id)}/export-pdf`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 20px",
            backgroundColor: "#0066cc",
            color: "#fff",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Export as PDF
        </Link>
      </div>
    </div>
  );
}

// Metadata card component
function MetadataCard({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      style={{
        backgroundColor: "#f9fafb",
        borderRadius: "8px",
        padding: "14px 16px",
        border: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          color: "#6b7280",
          marginBottom: "4px",
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "14px", color: "#111827" }}>{value}</div>
    </div>
  );
}

// Simple markdown renderer for policy descriptions
function MarkdownContent({ content }: { content: string }) {
  // Parse markdown content into sections
  const lines = content.trim().split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const flushList = () => {
    if (currentList.length > 0 && listType) {
      const ListComponent = listType === "ol" ? "ol" : "ul";
      elements.push(
        <ListComponent
          key={elements.length}
          style={{
            margin: "12px 0",
            paddingLeft: "24px",
            lineHeight: 1.7,
          }}
        >
          {currentList.map((item, idx) => (
            <li key={idx} style={{ marginBottom: "4px" }}>
              {item}
            </li>
          ))}
        </ListComponent>
      );
      currentList = [];
      listType = null;
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Headers
    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h3
          key={idx}
          style={{
            fontSize: "16px",
            fontWeight: 600,
            margin: "20px 0 10px 0",
            color: "#111827",
          }}
        >
          {trimmed.slice(3)}
        </h3>
      );
    } else if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <h4
          key={idx}
          style={{
            fontSize: "14px",
            fontWeight: 600,
            margin: "16px 0 8px 0",
            color: "#374151",
          }}
        >
          {trimmed.slice(4)}
        </h4>
      );
    }
    // Unordered list items
    else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (listType !== "ul") {
        flushList();
        listType = "ul";
      }
      currentList.push(trimmed.slice(2));
    }
    // Ordered list items
    else if (/^\d+\.\s/.test(trimmed)) {
      if (listType !== "ol") {
        flushList();
        listType = "ol";
      }
      currentList.push(trimmed.replace(/^\d+\.\s/, ""));
    }
    // Code blocks
    else if (trimmed.startsWith("```")) {
      flushList();
      // Skip code fence markers
    }
    // Regular paragraphs
    else if (trimmed.length > 0) {
      flushList();
      elements.push(
        <p
          key={idx}
          style={{
            margin: "12px 0",
            lineHeight: 1.7,
            color: "#374151",
          }}
        >
          {formatInlineCode(trimmed)}
        </p>
      );
    }
  });

  flushList();

  return <div>{elements}</div>;
}

// Format inline code markers
function formatInlineCode(text: string): React.ReactNode {
  const parts = text.split(/(`[^`]+`)/);
  return parts.map((part, idx) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={idx}
          style={{
            fontFamily: "monospace",
            fontSize: "13px",
            backgroundColor: "#f3f4f6",
            padding: "2px 6px",
            borderRadius: "4px",
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    // Handle bold text
    const boldParts = part.split(/(\*\*[^*]+\*\*)/);
    return boldParts.map((bp, bpIdx) => {
      if (bp.startsWith("**") && bp.endsWith("**")) {
        return (
          <strong key={`${idx}-${bpIdx}`}>{bp.slice(2, -2)}</strong>
        );
      }
      return bp;
    });
  });
}
