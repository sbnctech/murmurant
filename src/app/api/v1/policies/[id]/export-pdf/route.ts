/**
 * Single Policy PDF Export
 *
 * GET /api/v1/policies/[id]/export-pdf - Export a single policy as printable HTML
 *
 * Returns HTML with print-optimized styles that can be printed to PDF
 * using the browser's print dialog (Cmd+P / Ctrl+P).
 *
 * Charter Principles:
 * - P1: Identity provable - requires authentication
 * - N5: No hidden rules - policies are visible and documented
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getPolicyById } from "@/lib/policies";
import { formatClubDateLong } from "@/lib/timezone";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  // Require authentication
  const auth = await requireAuth(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;

  try {
    const policy = getPolicyById(id);

    if (!policy) {
      return NextResponse.json(
        { error: `Policy not found: ${id}` },
        { status: 404 }
      );
    }

    const html = generatePolicyHtml(policy);

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error generating policy PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate policy export" },
      { status: 500 }
    );
  }
}

interface Policy {
  id: string;
  title: string;
  shortTitle: string;
  category: string;
  status: string;
  effectiveDate: string;
  summary: string;
  description: string;
  enforcementLevel: string;
  enforcementPoints: string[];
  relatedDocs: string[];
  approvedBy: string;
  approvalDate: string;
  reviewSchedule: string;
  nextReviewDate: string;
}

function generatePolicyHtml(policy: Policy): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(policy.id)} - ${escapeHtml(policy.title)}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1a1a1a;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }

    @media print {
      body {
        padding: 0;
        font-size: 10pt;
      }

      .no-print {
        display: none !important;
      }
    }

    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      background: #0066cc;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
    }

    .print-button:hover {
      background: #0052a3;
    }

    .header {
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }

    .policy-id {
      font-family: monospace;
      font-size: 12pt;
      color: #6b7280;
      margin-bottom: 4px;
    }

    h1 {
      font-size: 22pt;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .badges {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }

    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 10pt;
      font-weight: 600;
    }

    .badge.category {
      background: #dbeafe;
      color: #1e40af;
    }

    .badge.status.active {
      background: #dcfce7;
      color: #166534;
    }

    .badge.status.draft {
      background: #fef3c7;
      color: #92400e;
    }

    .badge.status.deprecated {
      background: #fee2e2;
      color: #991b1b;
    }

    .badge.enforcement {
      background: #f3f4f6;
      color: #4b5563;
    }

    .summary {
      font-size: 12pt;
      color: #374151;
      padding: 16px 20px;
      background: #f9fafb;
      border-left: 4px solid #3b82f6;
      margin-bottom: 24px;
    }

    .metadata {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 30px;
      padding: 16px;
      background: #f9fafb;
      border-radius: 8px;
    }

    .meta-item {
      font-size: 10pt;
    }

    .meta-item .label {
      color: #6b7280;
      display: block;
      margin-bottom: 2px;
    }

    .meta-item .value {
      color: #111827;
      font-weight: 500;
    }

    section {
      margin-bottom: 24px;
    }

    section > h2 {
      font-size: 14pt;
      font-weight: 600;
      margin-bottom: 12px;
      color: #111827;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }

    .description h3 {
      font-size: 12pt;
      font-weight: 600;
      margin: 16px 0 8px 0;
      color: #111827;
    }

    .description h4 {
      font-size: 11pt;
      font-weight: 600;
      margin: 12px 0 6px 0;
      color: #374151;
    }

    .description p {
      margin: 10px 0;
      color: #374151;
    }

    .description ul,
    .description ol {
      margin: 10px 0 10px 24px;
    }

    .description li {
      margin-bottom: 6px;
    }

    .description code {
      font-family: monospace;
      font-size: 9pt;
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 3px;
    }

    .enforcement-points ul,
    .related-docs ul {
      list-style: none;
    }

    .enforcement-points li,
    .related-docs li {
      font-size: 10pt;
      padding: 8px 12px;
      margin-bottom: 6px;
      background: #f9fafb;
      border-radius: 4px;
      border: 1px solid #e5e7eb;
    }

    .enforcement-points code {
      font-family: monospace;
      font-size: 9pt;
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 9pt;
      color: #9ca3af;
      text-align: center;
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">
    Print / Save as PDF
  </button>

  <header class="header">
    <div class="policy-id">${escapeHtml(policy.id)}</div>
    <h1>${escapeHtml(policy.title)}</h1>
    <div class="badges">
      <span class="badge category">${escapeHtml(policy.category)}</span>
      <span class="badge status ${policy.status}">${escapeHtml(policy.status)}</span>
      <span class="badge enforcement">${escapeHtml(policy.enforcementLevel)} enforcement</span>
    </div>
  </header>

  <div class="summary">
    ${escapeHtml(policy.summary.trim())}
  </div>

  <div class="metadata">
    <div class="meta-item">
      <span class="label">Effective Date</span>
      <span class="value">${escapeHtml(policy.effectiveDate)}</span>
    </div>
    <div class="meta-item">
      <span class="label">Approved By</span>
      <span class="value">${escapeHtml(policy.approvedBy)}</span>
    </div>
    <div class="meta-item">
      <span class="label">Approval Date</span>
      <span class="value">${escapeHtml(policy.approvalDate)}</span>
    </div>
    <div class="meta-item">
      <span class="label">Review Schedule</span>
      <span class="value">${escapeHtml(policy.reviewSchedule)}</span>
    </div>
    <div class="meta-item">
      <span class="label">Next Review</span>
      <span class="value">${escapeHtml(policy.nextReviewDate)}</span>
    </div>
  </div>

  <section>
    <h2>Policy Details</h2>
    <div class="description">
      ${formatMarkdown(policy.description)}
    </div>
  </section>

  ${
    policy.enforcementPoints.length > 0
      ? `
  <section class="enforcement-points">
    <h2>Enforcement Points</h2>
    <p style="font-size: 10pt; color: #6b7280; margin-bottom: 12px;">
      Code locations where this policy is enforced:
    </p>
    <ul>
      ${policy.enforcementPoints.map((p) => `<li><code>${escapeHtml(p)}</code></li>`).join("")}
    </ul>
  </section>
  `
      : ""
  }

  ${
    policy.relatedDocs.length > 0
      ? `
  <section class="related-docs">
    <h2>Related Documentation</h2>
    <ul>
      ${policy.relatedDocs.map((d) => `<li>${escapeHtml(d)}</li>`).join("")}
    </ul>
  </section>
  `
      : ""
  }

  <footer class="footer">
    <p>Santa Barbara Newcomers Club - Club Policy</p>
    <p>Generated on ${formatClubDateLong(new Date())}</p>
  </footer>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMarkdown(content: string): string {
  const lines = content.trim().split("\n");
  let html = "";
  let inList = false;
  let listType: "ul" | "ol" = "ul";

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("## ")) {
      if (inList) {
        html += `</${listType}>`;
        inList = false;
      }
      html += `<h3>${escapeHtml(trimmed.slice(3))}</h3>`;
    } else if (trimmed.startsWith("### ")) {
      if (inList) {
        html += `</${listType}>`;
        inList = false;
      }
      html += `<h4>${escapeHtml(trimmed.slice(4))}</h4>`;
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (!inList || listType !== "ul") {
        if (inList) html += `</${listType}>`;
        html += "<ul>";
        listType = "ul";
        inList = true;
      }
      html += `<li>${formatInline(trimmed.slice(2))}</li>`;
    } else if (/^\d+\.\s/.test(trimmed)) {
      if (!inList || listType !== "ol") {
        if (inList) html += `</${listType}>`;
        html += "<ol>";
        listType = "ol";
        inList = true;
      }
      html += `<li>${formatInline(trimmed.replace(/^\d+\.\s/, ""))}</li>`;
    } else if (trimmed.startsWith("```")) {
      // Skip code fences
    } else if (trimmed.length > 0) {
      if (inList) {
        html += `</${listType}>`;
        inList = false;
      }
      html += `<p>${formatInline(trimmed)}</p>`;
    }
  }

  if (inList) {
    html += `</${listType}>`;
  }

  return html;
}

function formatInline(text: string): string {
  // Escape HTML first
  let result = escapeHtml(text);

  // Format code
  result = result.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Format bold
  result = result.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  return result;
}
