// Copyright © 2025 Murmurant, Inc.
// Event archive/history page - browse past club events

"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { formatClubDateShort } from "@/lib/timezone";

interface PastEvent {
  id: string;
  title: string;
  date: string;
  category: string;
  attendeeCount: number;
  hasPhotos: boolean;
  description: string;
}

// Mock past events data
const pastEvents: PastEvent[] = [
  {
    id: "evt-001",
    title: "Holiday Gala 2024",
    date: "2024-12-10",
    category: "Social",
    attendeeCount: 156,
    hasPhotos: true,
    description: "Annual holiday celebration with dinner, dancing, and entertainment.",
  },
  {
    id: "evt-002",
    title: "Wine Tasting at Local Vineyard",
    date: "2024-11-15",
    category: "Social",
    attendeeCount: 42,
    hasPhotos: true,
    description: "Tour and tasting at a premier Santa Barbara winery.",
  },
  {
    id: "evt-003",
    title: "Newcomers Welcome Brunch",
    date: "2024-11-02",
    category: "New Members",
    attendeeCount: 35,
    hasPhotos: false,
    description: "Welcome event for members who joined in the past quarter.",
  },
  {
    id: "evt-004",
    title: "Book Club: October Selection",
    date: "2024-10-25",
    category: "Interest Group",
    attendeeCount: 18,
    hasPhotos: false,
    description: "Monthly book club discussion.",
  },
  {
    id: "evt-005",
    title: "Hiking: Inspiration Point",
    date: "2024-10-12",
    category: "Outdoor",
    attendeeCount: 24,
    hasPhotos: true,
    description: "Moderate hike with stunning views of the Santa Barbara coastline.",
  },
  {
    id: "evt-006",
    title: "Annual Meeting 2024",
    date: "2024-06-15",
    category: "Governance",
    attendeeCount: 89,
    hasPhotos: true,
    description: "Annual membership meeting with board elections.",
  },
  {
    id: "evt-007",
    title: "Spring Garden Tour",
    date: "2024-04-20",
    category: "Social",
    attendeeCount: 52,
    hasPhotos: true,
    description: "Tour of private gardens in Montecito.",
  },
  {
    id: "evt-008",
    title: "Valentine's Dinner Dance",
    date: "2024-02-14",
    category: "Social",
    attendeeCount: 120,
    hasPhotos: true,
    description: "Romantic evening with dinner and dancing.",
  },
  {
    id: "evt-009",
    title: "New Year's Brunch",
    date: "2024-01-06",
    category: "Social",
    attendeeCount: 78,
    hasPhotos: false,
    description: "New Year celebration brunch at the Yacht Club.",
  },
  {
    id: "evt-010",
    title: "Holiday Gala 2023",
    date: "2023-12-09",
    category: "Social",
    attendeeCount: 142,
    hasPhotos: true,
    description: "Annual holiday celebration with dinner and entertainment.",
  },
  {
    id: "evt-011",
    title: "Thanksgiving Potluck",
    date: "2023-11-18",
    category: "Social",
    attendeeCount: 65,
    hasPhotos: false,
    description: "Community potluck dinner celebrating Thanksgiving.",
  },
  {
    id: "evt-012",
    title: "Wine Country Day Trip",
    date: "2023-10-14",
    category: "Social",
    attendeeCount: 38,
    hasPhotos: true,
    description: "Bus trip to Santa Ynez Valley wineries.",
  },
];

const categories = [
  "All Categories",
  "Social",
  "New Members",
  "Interest Group",
  "Outdoor",
  "Governance",
];

const ITEMS_PER_PAGE = 6;

function formatEventDate(dateString: string): string {
  const date = new Date(dateString);
  return formatClubDateShort(date);
}

function getCategoryColor(category: string): { bg: string; text: string } {
  switch (category) {
    case "Social":
      return { bg: "#dbeafe", text: "#1e40af" };
    case "New Members":
      return { bg: "#d1fae5", text: "#065f46" };
    case "Interest Group":
      return { bg: "#fef3c7", text: "#92400e" };
    case "Outdoor":
      return { bg: "#dcfce7", text: "#166534" };
    case "Governance":
      return { bg: "#e0e7ff", text: "#3730a3" };
    default:
      return { bg: "#f3f4f6", text: "#374151" };
  }
}

interface EventCardProps {
  event: PastEvent;
}

function EventCard({ event }: EventCardProps) {
  const categoryColor = getCategoryColor(event.category);

  return (
    <div
      data-test-id={`archive-event-${event.id}`}
      style={{
        backgroundColor: "white",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        overflow: "hidden",
        transition: "box-shadow 0.2s",
      }}
    >
      <div
        style={{
          backgroundColor: "#f9fafb",
          padding: "12px 16px",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <div style={{ fontSize: "14px", color: "#6b7280" }}>
          {formatEventDate(event.date)}
        </div>
      </div>

      <div style={{ padding: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
          <h3
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#1f2937",
              margin: 0,
            }}
          >
            {event.title}
          </h3>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 500,
              backgroundColor: categoryColor.bg,
              color: categoryColor.text,
              padding: "2px 8px",
              borderRadius: "12px",
              flexShrink: 0,
              marginLeft: "8px",
            }}
          >
            {event.category}
          </span>
        </div>

        <p
          style={{
            fontSize: "14px",
            color: "#6b7280",
            margin: "0 0 12px 0",
            lineHeight: "1.5",
          }}
        >
          {event.description}
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "12px",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "14px", color: "#6b7280" }}>
              <strong style={{ color: "#1f2937" }}>{event.attendeeCount}</strong> attended
            </span>
            {event.hasPhotos && (
              <Link
                href={`/events/${event.id}/photos`}
                style={{
                  fontSize: "14px",
                  color: "#2563eb",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>📷</span> View Photos
              </Link>
            )}
          </div>

          <Link
            href={`/events/${event.id}`}
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: "#2563eb",
              textDecoration: "none",
            }}
          >
            View Details →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function EventArchivePage() {
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
  const [currentPage, setCurrentPage] = useState(1);

  const availableYears = useMemo(() => {
    const years = new Set(pastEvents.map((e) => new Date(e.date).getFullYear().toString()));
    return ["all", ...Array.from(years).sort((a, b) => Number(b) - Number(a))];
  }, []);

  const filteredEvents = useMemo(() => {
    return pastEvents.filter((event) => {
      const eventYear = new Date(event.date).getFullYear().toString();
      const matchesYear = selectedYear === "all" || eventYear === selectedYear;
      const matchesCategory =
        selectedCategory === "All Categories" || event.category === selectedCategory;
      return matchesYear && matchesCategory;
    });
  }, [selectedYear, selectedCategory]);

  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEvents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEvents, currentPage]);

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setCurrentPage(1);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  return (
    <div data-test-id="event-archive-page" style={{ maxWidth: "900px" }}>
      <h1
        style={{
          fontSize: "28px",
          fontWeight: 700,
          marginBottom: "8px",
          color: "#1f2937",
        }}
      >
        Event Archive
      </h1>
      <p
        style={{
          fontSize: "16px",
          color: "#6b7280",
          marginBottom: "24px",
        }}
      >
        Browse our history of past club events and activities
      </p>

      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <label
            htmlFor="year-filter"
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 500,
              color: "#374151",
              marginBottom: "4px",
            }}
          >
            Year
          </label>
          <select
            id="year-filter"
            value={selectedYear}
            onChange={(e) => handleYearChange(e.target.value)}
            data-test-id="archive-year-filter"
            style={{
              padding: "8px 12px",
              fontSize: "14px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              backgroundColor: "white",
              minWidth: "120px",
              cursor: "pointer",
            }}
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year === "all" ? "All Years" : year}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="category-filter"
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 500,
              color: "#374151",
              marginBottom: "4px",
            }}
          >
            Category
          </label>
          <select
            id="category-filter"
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            data-test-id="archive-category-filter"
            style={{
              padding: "8px 12px",
              fontSize: "14px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              backgroundColor: "white",
              minWidth: "160px",
              cursor: "pointer",
            }}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        style={{
          fontSize: "14px",
          color: "#6b7280",
          marginBottom: "16px",
        }}
      >
        Showing {paginatedEvents.length} of {filteredEvents.length} past events
      </div>

      {paginatedEvents.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
            gap: "20px",
            marginBottom: "24px",
          }}
        >
          {paginatedEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div
          data-test-id="archive-empty-state"
          style={{
            textAlign: "center",
            padding: "48px 24px",
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
            color: "#6b7280",
          }}
        >
          <p style={{ fontSize: "18px", marginBottom: "8px" }}>No events found</p>
          <p style={{ fontSize: "14px" }}>
            Try adjusting your filters to see more events
          </p>
        </div>
      )}

      {totalPages > 1 && (
        <div
          data-test-id="archive-pagination"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "8px",
            marginTop: "24px",
          }}
        >
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: 500,
              color: currentPage === 1 ? "#9ca3af" : "#374151",
              backgroundColor: "white",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
            }}
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              style={{
                padding: "8px 12px",
                fontSize: "14px",
                fontWeight: 500,
                color: page === currentPage ? "white" : "#374151",
                backgroundColor: page === currentPage ? "#2563eb" : "white",
                border: `1px solid ${page === currentPage ? "#2563eb" : "#d1d5db"}`,
                borderRadius: "6px",
                cursor: "pointer",
                minWidth: "40px",
              }}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: 500,
              color: currentPage === totalPages ? "#9ca3af" : "#374151",
              backgroundColor: "white",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
