// Copyright (c) Murmurant, Inc.
// Page for creating new knowledge entries

import { getCurrentSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { KnowledgeForm } from "../KnowledgeForm";

export const metadata = {
  title: "Add Knowledge Entry | Starling Admin",
  description: "Add a new entry to the Starling knowledge base",
};

export default async function NewKnowledgePage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <header className="mb-8">
        <Link
          href="/admin/starling/knowledge"
          className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Knowledge Base
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add Knowledge Entry</h1>
        <p className="text-gray-600 mt-1">
          Add content that Starling can use to answer questions
        </p>
      </header>

      <KnowledgeForm mode="create" />
    </div>
  );
}
