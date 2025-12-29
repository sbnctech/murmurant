"use client";

// Copyright (c) Murmurant, Inc.
// Form for creating/editing knowledge entries

import { useState } from "react";
import { useRouter } from "next/navigation";

type KnowledgeVisibility = "public" | "member" | "staff";

interface KnowledgeFormProps {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    title: string;
    content: string;
    sourceType: string;
    section?: string;
    organizationId?: string;
    visibility?: KnowledgeVisibility;
  };
}

export function KnowledgeForm({ mode, initialData }: KnowledgeFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default visibility based on content type
  const getDefaultVisibility = (sourceType: string): KnowledgeVisibility => {
    switch (sourceType) {
      case "runbook": return "staff";
      case "policy": return "member";
      case "faq": return "public";
      case "help": return "member";
      default: return "member";
    }
  };

  const [formData, setFormData] = useState({
    title: initialData?.title ?? "",
    content: initialData?.content ?? "",
    sourceType: initialData?.sourceType ?? "faq",
    section: initialData?.section ?? "",
    organizationId: initialData?.organizationId ?? "",
    scope: initialData?.organizationId ? "operator" : "platform",
    visibility: initialData?.visibility ?? getDefaultVisibility(initialData?.sourceType ?? "faq"),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const url = mode === "create"
        ? "/api/starling/knowledge"
        : `/api/starling/knowledge/${initialData?.id}`;

      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title || undefined,
          content: formData.content,
          sourceType: formData.sourceType,
          section: formData.section || undefined,
          organizationId: formData.scope === "operator" ? formData.organizationId : undefined,
          visibility: formData.visibility,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save");
      }

      router.push("/admin/starling/knowledge");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Scope Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Scope</label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="scope"
              value="platform"
              checked={formData.scope === "platform"}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
              className="mr-2"
            />
            <span className="text-sm">
              <strong>Platform</strong> - Available to all organizations
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="scope"
              value="operator"
              checked={formData.scope === "operator"}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
              className="mr-2"
            />
            <span className="text-sm">
              <strong>Operator</strong> - Specific to one organization
            </span>
          </label>
        </div>
      </div>

      {/* Organization ID (only for operator scope) */}
      {formData.scope === "operator" && (
        <div>
          <label htmlFor="organizationId" className="block text-sm font-medium text-gray-700 mb-1">
            Organization ID
          </label>
          <input
            type="text"
            id="organizationId"
            value={formData.organizationId}
            onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="UUID of the organization"
            required={formData.scope === "operator"}
          />
        </div>
      )}

      {/* Content Type */}
      <div>
        <label htmlFor="sourceType" className="block text-sm font-medium text-gray-700 mb-1">
          Content Type
        </label>
        <select
          id="sourceType"
          value={formData.sourceType}
          onChange={(e) => {
            const newType = e.target.value;
            setFormData({
              ...formData,
              sourceType: newType,
              visibility: getDefaultVisibility(newType),
            });
          }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="faq">FAQ - Frequently Asked Questions</option>
          <option value="policy">Policy - Rules and Guidelines</option>
          <option value="help">Help - How-to Articles</option>
          <option value="runbook">Runbook - Operational Procedures</option>
        </select>
      </div>

      {/* Visibility (RBAC) */}
      <div>
        <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-1">
          Visibility (Who can see this?)
        </label>
        <select
          id="visibility"
          value={formData.visibility}
          onChange={(e) => setFormData({ ...formData, visibility: e.target.value as KnowledgeVisibility })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="public">Public - Anyone (including non-members)</option>
          <option value="member">Members - Authenticated members only</option>
          <option value="staff">Staff - Officers and admins only</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          {formData.visibility === "public" && "Visible to everyone, including visitors who aren't logged in."}
          {formData.visibility === "member" && "Only visible to authenticated club members."}
          {formData.visibility === "staff" && "Only visible to board members, chairs, and administrators."}
        </p>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., How to Register for Events"
        />
      </div>

      {/* Section */}
      <div>
        <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-1">
          Section (optional)
        </label>
        <input
          type="text"
          id="section"
          value={formData.section}
          onChange={(e) => setFormData({ ...formData, section: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Events, Membership, Billing"
        />
      </div>

      {/* Content */}
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
          Content
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Write clear, concise content. Starling will use this to answer member questions.
          Markdown is supported.
        </p>
        <textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          rows={12}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter the knowledge content here..."
          required
        />
        <p className="text-xs text-gray-400 mt-1">
          {formData.content.length} characters
          {formData.content.length > 500 && ` (will be split into ${Math.ceil(formData.content.length / 450)} chunks)`}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-gray-700 hover:text-gray-900"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !formData.content.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </>
          ) : mode === "create" ? (
            "Add Entry"
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </form>
  );
}
