// Copyright © 2025 Murmurant, Inc.
// Document library page - club documents, policies, and forms

"use client";

import React, { useState, useMemo } from "react";
import { formatClubDate } from "@/lib/timezone";

interface Document {
  id: string;
  name: string;
  category: "Governance" | "Forms" | "Newsletters" | "Minutes";
  uploadDate: string;
  fileSize: string;
  fileType: string;
  membersOnly: boolean;
  description?: string;
}

// Mock document data
const documents: Document[] = [
  {
    id: "1",
    name: "Club Bylaws",
    category: "Governance",
    uploadDate: "2024-01-15",
    fileSize: "245 KB",
    fileType: "PDF",
    membersOnly: false,
    description: "Official bylaws of the Santa Barbara Newcomers Club",
  },
  {
    id: "2",
    name: "Standing Rules",
    category: "Governance",
    uploadDate: "2024-02-01",
    fileSize: "128 KB",
    fileType: "PDF",
    membersOnly: false,
    description: "Operational rules and procedures",
  },
  {
    id: "3",
    name: "Privacy Policy",
    category: "Governance",
    uploadDate: "2024-01-10",
    fileSize: "89 KB",
    fileType: "PDF",
    membersOnly: false,
  },
  {
    id: "4",
    name: "Membership Application",
    category: "Forms",
    uploadDate: "2024-03-01",
    fileSize: "156 KB",
    fileType: "PDF",
    membersOnly: false,
    description: "Application form for new members",
  },
  {
    id: "5",
    name: "Event Proposal Form",
    category: "Forms",
    uploadDate: "2024-02-15",
    fileSize: "98 KB",
    fileType: "PDF",
    membersOnly: true,
    description: "Submit ideas for new club events",
  },
  {
    id: "6",
    name: "Expense Reimbursement Form",
    category: "Forms",
    uploadDate: "2024-01-20",
    fileSize: "112 KB",
    fileType: "PDF",
    membersOnly: true,
  },
  {
    id: "7",
    name: "December 2024 Newsletter",
    category: "Newsletters",
    uploadDate: "2024-12-01",
    fileSize: "2.4 MB",
    fileType: "PDF",
    membersOnly: true,
  },
  {
    id: "8",
    name: "November 2024 Newsletter",
    category: "Newsletters",
    uploadDate: "2024-11-01",
    fileSize: "2.1 MB",
    fileType: "PDF",
    membersOnly: true,
  },
  {
    id: "9",
    name: "October 2024 Newsletter",
    category: "Newsletters",
    uploadDate: "2024-10-01",
    fileSize: "1.9 MB",
    fileType: "PDF",
    membersOnly: true,
  },
  {
    id: "10",
    name: "Board Meeting Minutes - December 2024",
    category: "Minutes",
    uploadDate: "2024-12-15",
    fileSize: "78 KB",
    fileType: "PDF",
    membersOnly: true,
    description: "Minutes from the December board meeting",
  },
  {
    id: "11",
    name: "Board Meeting Minutes - November 2024",
    category: "Minutes",
    uploadDate: "2024-11-18",
    fileSize: "82 KB",
    fileType: "PDF",
    membersOnly: true,
  },
  {
    id: "12",
    name: "Annual Meeting Minutes - 2024",
    category: "Minutes",
    uploadDate: "2024-06-20",
    fileSize: "145 KB",
    fileType: "PDF",
    membersOnly: true,
    description: "Minutes from the 2024 annual membership meeting",
  },
];

const categories = ["All", "Governance", "Forms", "Newsletters", "Minutes"] as const;

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return formatClubDate(date);
}

function getCategoryColor(category: Document["category"]): { bg: string; text: string } {
  switch (category) {
    case "Governance":
      return { bg: "#fef3c7", text: "#92400e" };
    case "Forms":
      return { bg: "#dbeafe", text: "#1e40af" };
    case "Newsletters":
      return { bg: "#d1fae5", text: "#065f46" };
    case "Minutes":
      return { bg: "#e0e7ff", text: "#3730a3" };
    default:
      return { bg: "#f3f4f6", text: "#374151" };
  }
}

function DocumentCard({ doc }: { doc: Document }) {
  const categoryColor = getCategoryColor(doc.category);

  return (
    <div
      data-test-id={`document-${doc.id}`}
      style={{
        backgroundColor: "white",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        padding: "16px",
        display: "flex",
        alignItems: "flex-start",
        gap: "16px",
      }}
    >
      {/* File Icon */}
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "8px",
          backgroundColor: "#f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280" }}>
          {doc.fileType}
        </span>
      </div>

      {/* Document Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <span
            style={{
              fontWeight: 600,
              fontSize: "16px",
              color: "#1f2937",
            }}
          >
            {doc.name}
          </span>
          {doc.membersOnly && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 500,
                backgroundColor: "#fef2f2",
                color: "#991b1b",
                padding: "2px 6px",
                borderRadius: "4px",
              }}
            >
              Members Only
            </span>
          )}
        </div>

        {doc.description && (
          <p
            style={{
              fontSize: "14px",
              color: "#6b7280",
              margin: "0 0 8px 0",
            }}
          >
            {doc.description}
          </p>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 500,
              backgroundColor: categoryColor.bg,
              color: categoryColor.text,
              padding: "2px 8px",
              borderRadius: "12px",
            }}
          >
            {doc.category}
          </span>
          <span style={{ fontSize: "13px", color: "#9ca3af" }}>
            {formatDate(doc.uploadDate)}
          </span>
          <span style={{ fontSize: "13px", color: "#9ca3af" }}>
            {doc.fileSize}
          </span>
        </div>
      </div>

      {/* Download Button */}
      <button
        type="button"
        data-test-id={`download-${doc.id}`}
        onClick={() => {
          // In production, this would trigger actual download
          alert(`Downloading: ${doc.name}`);
        }}
        style={{
          padding: "8px 16px",
          fontSize: "14px",
          fontWeight: 500,
          color: "#2563eb",
          backgroundColor: "#eff6ff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          flexShrink: 0,
          transition: "background-color 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#dbeafe";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#eff6ff";
        }}
      >
        Download
      </button>
    </div>
  );
}

export default function DocumentLibraryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        doc.name.toLowerCase().includes(searchLower) ||
        (doc.description && doc.description.toLowerCase().includes(searchLower));

      // Category filter
      const matchesCategory =
        selectedCategory === "All" || doc.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Group documents by category for display
  const groupedDocuments = useMemo(() => {
    if (selectedCategory !== "All") {
      return { [selectedCategory]: filteredDocuments };
    }

    const groups: Record<string, Document[]> = {};
    filteredDocuments.forEach((doc) => {
      if (!groups[doc.category]) {
        groups[doc.category] = [];
      }
      groups[doc.category].push(doc);
    });
    return groups;
  }, [filteredDocuments, selectedCategory]);

  return (
    <div data-test-id="document-library-page" style={{ maxWidth: "900px" }}>
      <h1
        style={{
          fontSize: "28px",
          fontWeight: 700,
          marginBottom: "8px",
          color: "#1f2937",
        }}
      >
        Document Library
      </h1>
      <p
        style={{
          fontSize: "16px",
          color: "#6b7280",
          marginBottom: "24px",
        }}
      >
        Access club bylaws, forms, newsletters, and meeting minutes
      </p>

      {/* Search and Filter Bar */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        {/* Search Input */}
        <div style={{ flex: "1 1 300px" }}>
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-test-id="document-search"
            style={{
              width: "100%",
              padding: "10px 16px",
              fontSize: "16px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              outline: "none",
            }}
          />
        </div>

        {/* Category Filter */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              data-test-id={`filter-${category.toLowerCase()}`}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: 500,
                color: selectedCategory === category ? "white" : "#374151",
                backgroundColor: selectedCategory === category ? "#2563eb" : "#f3f4f6",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div
        style={{
          fontSize: "14px",
          color: "#6b7280",
          marginBottom: "16px",
        }}
      >
        Showing {filteredDocuments.length} of {documents.length} documents
      </div>

      {/* Document List */}
      {Object.keys(groupedDocuments).length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {Object.entries(groupedDocuments).map(([category, docs]) => (
            <section key={category}>
              {selectedCategory === "All" && (
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#1f2937",
                    marginBottom: "12px",
                  }}
                >
                  {category}
                </h2>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {docs.map((doc) => (
                  <DocumentCard key={doc.id} doc={doc} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div
          data-test-id="documents-empty-state"
          style={{
            textAlign: "center",
            padding: "48px 24px",
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
            color: "#6b7280",
          }}
        >
          <p style={{ fontSize: "18px", marginBottom: "8px" }}>No documents found</p>
          <p style={{ fontSize: "14px" }}>
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
}
