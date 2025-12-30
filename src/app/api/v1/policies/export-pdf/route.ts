/**
 * Policy Registry PDF Export
 *
 * GET /api/v1/policies/export-pdf - Export all policies as printable HTML
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
import { getPolicies, loadPolicyRegistry } from "@/lib/policies";
import { formatClubDateLong } from "@/lib/timezone";

export async function GET(request: NextRequest) {
  // Require authentication
  const auth = await requireAuth(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const registry = loadPolicyRegistry();
    const policies = getPolicies();

    const html = generatePrintableHtml(policies, registry);

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

interface Registry {
  version: string;
  lastUpdated: string;
  maintainer: string;
}

function generatePrintableHtml(policies: Policy[], registry: Registry): string {
  const policyHtml = policies
    .map(
      (policy) => `
    <article class="policy">
      <header>
        <span class="policy-id">${escapeHtml(policy.id)}</span>
        <h2>${escapeHtml(policy.title)}</h2>
        <div class="badges">
          <span class="badge category">${escapeHtml(policy.category)}</span>
          <span class="badge status ${policy.status}">${escapeHtml(policy.status)}</span>
          <span class="badge enforcement">${escapeHtml(policy.enforcementLevel)}</span>
        </div>
      </header>

      <div class="summary">
        <p>${escapeHtml(policy.summary.trim())}</p>
      </div>

      <div class="metadata">
        <div class="meta-item">
          <span class="label">Effective:</span>
          <span class="value">${escapeHtml(policy.effectiveDate)}</span>
        </div>
        <div class="meta-item">
          <span class="label">Approved By:</span>
          <span class="value">${escapeHtml(policy.approvedBy)}</span>
        </div>
        <div class="meta-item">
          <span class="label">Review:</span>
          <span class="value">${escapeHtml(policy.reviewSchedule)} (next: ${escapeHtml(policy.nextReviewDate)})</span>
        </div>
      </div>

      <div class="description">
        ${formatMarkdown(policy.description)}
      </div>

      ${
        policy.enforcementPoints.length > 0
          ? `
      <div class="enforcement-points">
        <h4>Enforcement Points</h4>
        <ul>
          ${policy.enforcementPoints.map((p) => `<li><code>${escapeHtml(p)}</code></li>`).join("")}
        </ul>
      </div>
      `
          : ""
      }

      ${
        policy.relatedDocs.length > 0
          ? `
      <div class="related-docs">
        <h4>Related Documentation</h4>
        <ul>
          ${policy.relatedDocs.map((d) => `<li>${escapeHtml(d)}</li>`).join("")}
        </ul>
      </div>
      `
          : ""
      }
    </article>
  `
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Club Policy Registry - Santa Barbara Newcomers Club</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1a1a1a;
      padding: 40px;
      max-width: 850px;
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

      .policy {
        page-break-inside: avoid;
        break-inside: avoid;
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
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }

    .header h1 {
      font-size: 24pt;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .header .subtitle {
      color: #6b7280;
      font-size: 12pt;
    }

    .header .meta {
      margin-top: 16px;
      font-size: 10pt;
      color: #9ca3af;
    }

    .toc {
      margin-bottom: 40px;
      padding: 20px;
      background: #f9fafb;
      border-radius: 8px;
    }

    .toc h2 {
      font-size: 14pt;
      margin-bottom: 12px;
    }

    .toc ul {
      list-style: none;
      columns: 2;
    }

    .toc li {
      margin-bottom: 6px;
    }

    .toc a {
      color: #374151;
      text-decoration: none;
    }

    .toc .policy-id {
      font-family: monospace;
      font-size: 9pt;
      color: #6b7280;
    }

    .policy {
      margin-bottom: 40px;
      padding-bottom: 30px;
      border-bottom: 1px solid #e5e7eb;
    }

    .policy:last-child {
      border-bottom: none;
    }

    .policy header {
      margin-bottom: 16px;
    }

    .policy-id {
      font-family: monospace;
      font-size: 10pt;
      color: #6b7280;
      display: block;
      margin-bottom: 4px;
    }

    .policy h2 {
      font-size: 16pt;
      font-weight: 600;
      margin-bottom: 10px;
    }

    .badges {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 4px;
      font-size: 9pt;
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
      font-size: 11pt;
      color: #374151;
      margin-bottom: 16px;
      padding: 12px 16px;
      background: #f9fafb;
      border-left: 3px solid #3b82f6;
    }

    .metadata {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-bottom: 16px;
      font-size: 10pt;
    }

    .meta-item .label {
      color: #6b7280;
      margin-right: 6px;
    }

    .meta-item .value {
      color: #374151;
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
      margin: 8px 0;
      color: #374151;
    }

    .description ul,
    .description ol {
      margin: 8px 0 8px 20px;
    }

    .description li {
      margin-bottom: 4px;
    }

    .description code {
      font-family: monospace;
      font-size: 9pt;
      background: #f3f4f6;
      padding: 1px 4px;
      border-radius: 3px;
    }

    .enforcement-points,
    .related-docs {
      margin-top: 16px;
    }

    .enforcement-points h4,
    .related-docs h4 {
      font-size: 10pt;
      font-weight: 600;
      color: #6b7280;
      margin-bottom: 8px;
    }

    .enforcement-points ul,
    .related-docs ul {
      list-style: none;
    }

    .enforcement-points li,
    .related-docs li {
      font-size: 9pt;
      padding: 4px 8px;
      margin-bottom: 4px;
      background: #f9fafb;
      border-radius: 4px;
    }

    .enforcement-points code {
      font-family: monospace;
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      font-size: 9pt;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">
    Print / Save as PDF
  </button>

  <div class="header">
    <h1>Club Policy Registry</h1>
    <p class="subtitle">Santa Barbara Newcomers Club</p>
    <p class="meta">
      Version ${escapeHtml(registry.version)} |
      Last Updated: ${escapeHtml(registry.lastUpdated)} |
      ${policies.length} Policies
    </p>
  </div>

  <nav class="toc no-print">
    <h2>Table of Contents</h2>
    <ul>
      ${policies.map((p) => `<li><span class="policy-id">${escapeHtml(p.id)}</span> ${escapeHtml(p.shortTitle)}</li>`).join("")}
    </ul>
  </nav>

  <main>
    ${policyHtml}
  </main>

  <footer class="footer">
    <p>Copyright &copy; Santa Barbara Newcomers Club</p>
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
