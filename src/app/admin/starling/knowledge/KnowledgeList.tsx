// Copyright (c) Murmurant, Inc.
// Knowledge list component with search and filtering

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDateLocale, CLUB_TIMEZONE } from "@/lib/timezone";

interface KnowledgeEntry {
  id: string;
  content: string;
  source: string;
  source_type: string;
  title: string | null;
  section: string | null;
  organization_id: string | null;
  visibility: string;
  created_at: Date;
  updated_at: Date;
}

export async function KnowledgeList() {
  // Fetch recent knowledge entries (grouped by source to avoid showing chunks)
  const entries = await prisma.$queryRaw<KnowledgeEntry[]>`
    SELECT DISTINCT ON (source)
      id, content, source, source_type, title, section, organization_id, visibility, created_at, updated_at
    FROM "StarlingKnowledge"
    ORDER BY source, updated_at DESC
    LIMIT 50
  `;

  if (entries.length === 0) {
    return (
      <div className="p-8 text-center">
        <svg
          className="w-12 h-12 mx-auto text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="text-gray-900 font-medium mb-1">No knowledge entries yet</h3>
        <p className="text-gray-500 text-sm mb-4">
          Add content to help Starling answer questions accurately.
        </p>
        <Link
          href="/admin/starling/knowledge/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          Add First Entry
        </Link>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {entries.map((entry) => (
        <div key={entry.id} className="p-4 hover:bg-gray-50">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(
                    entry.source_type
                  )}`}
                >
                  {entry.source_type}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getVisibilityColor(
                    entry.visibility
                  )}`}
                >
                  {entry.visibility}
                </span>
                {entry.organization_id ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                    Operator
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                    Platform
                  </span>
                )}
              </div>
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {entry.title || entry.source}
              </h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {entry.content.substring(0, 150)}
                {entry.content.length > 150 ? "..." : ""}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Updated {formatDate(entry.updated_at)}
              </p>
            </div>
            <div className="ml-4 flex items-center gap-2">
              <Link
                href={`/admin/starling/knowledge/${entry.source}`}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function getTypeColor(type: string): string {
  switch (type) {
    case "faq":
      return "bg-purple-100 text-purple-700";
    case "policy":
      return "bg-orange-100 text-orange-700";
    case "help":
      return "bg-teal-100 text-teal-700";
    case "runbook":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getVisibilityColor(visibility: string): string {
  switch (visibility) {
    case "public":
      return "bg-emerald-100 text-emerald-700";
    case "member":
      return "bg-sky-100 text-sky-700";
    case "staff":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes} minutes ago`;
    }
    return `${hours} hours ago`;
  }
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;

  const options: Intl.DateTimeFormatOptions = {
    timeZone: CLUB_TIMEZONE,
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  };
  return formatDateLocale(date, options);
}
