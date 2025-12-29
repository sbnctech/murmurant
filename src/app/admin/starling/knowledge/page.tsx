// Copyright (c) Murmurant, Inc.
// Admin page for managing Starling knowledge base

import { Suspense } from "react";
import { getCurrentSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { KnowledgeList } from "./KnowledgeList";
import { KnowledgeStats } from "./KnowledgeStats";

export const metadata = {
  title: "Starling Knowledge Base | Admin",
  description: "Manage the Starling chatbot knowledge base",
};

export default async function StarlingKnowledgePage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  // Get knowledge stats
  const stats = await prisma.$queryRaw<
    Array<{ source_type: string; org_id: string | null; count: bigint }>
  >`
    SELECT
      source_type,
      organization_id as org_id,
      COUNT(*) as count
    FROM "StarlingKnowledge"
    GROUP BY source_type, organization_id
    ORDER BY organization_id NULLS FIRST, source_type
  `;

  const platformCount = stats
    .filter((s) => s.org_id === null)
    .reduce((sum, s) => sum + Number(s.count), 0);

  const operatorCount = stats
    .filter((s) => s.org_id !== null)
    .reduce((sum, s) => sum + Number(s.count), 0);

  const byType: Record<string, number> = {};
  for (const row of stats) {
    byType[row.source_type] = (byType[row.source_type] || 0) + Number(row.count);
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Starling Knowledge Base
        </h1>
        <p className="text-gray-600 mt-1">
          Manage the content that powers Starling&apos;s responses
        </p>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <KnowledgeStats
          label="Platform Docs"
          count={platformCount}
          description="Shared across all organizations"
          color="blue"
        />
        <KnowledgeStats
          label="Operator Docs"
          count={operatorCount}
          description="Organization-specific"
          color="green"
        />
        <KnowledgeStats
          label="FAQs"
          count={byType.faq || 0}
          description="Frequently asked questions"
          color="purple"
        />
        <KnowledgeStats
          label="Policies"
          count={byType.policy || 0}
          description="Rules and guidelines"
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-8">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/starling/knowledge/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Knowledge Entry
          </Link>
          <Link
            href="/admin/starling/knowledge/import"
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Bulk Import
          </Link>
          <Link
            href="/admin/starling/knowledge/reindex"
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reindex All
          </Link>
        </div>
      </div>

      {/* Knowledge List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Knowledge Entries</h2>
        </div>
        <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
          <KnowledgeList />
        </Suspense>
      </div>
    </div>
  );
}
