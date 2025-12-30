/**
 * Member Events Page
 *
 * URL: /member/events
 *
 * Displays upcoming club events for members to browse and register.
 * Features:
 * - Category filtering
 * - Search functionality
 * - Responsive card layout
 * - Clear registration status indicators
 *
 * Copyright © 2025 Murmurant, Inc.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatClubDateShort, formatClubTime } from "@/lib/timezone";

interface EventSummary {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  location: string | null;
  startTime: string;
  endTime: string | null;
  capacity: number | null;
  registeredCount: number;
  spotsRemaining: number | null;
  isWaitlistOpen: boolean;
}

interface EventsResponse {
  events: EventSummary[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  categories: string[];
}

export default function MemberEventsPage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("limit", "50");
        if (selectedCategory) params.set("category", selectedCategory);
        if (searchQuery) params.set("search", searchQuery);

        const res = await fetch(`/api/v1/events?${params.toString()}`);
        if (res.ok) {
          const data: EventsResponse = await res.json();
          setEvents(data.events);
          if (data.categories.length > 0) {
            setCategories(data.categories);
          }
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, [selectedCategory, searchQuery]);

  // Format date for display using club timezone
  const formatDate = (isoDate: string): string => {
    return formatClubDateShort(new Date(isoDate));
  };

  const formatTime = (isoDate: string): string => {
    return formatClubTime(new Date(isoDate));
  };

  return (
    <div data-test-id="member-events-page" style={{ minHeight: "100vh", backgroundColor: "var(--token-color-surface-2)" }}>
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: "var(--token-color-surface)",
          borderBottom: "1px solid var(--token-color-border)",
          padding: "var(--token-space-sm) var(--token-space-md)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: "var(--token-text-lg)",
            fontWeight: 700,
            color: "var(--token-color-text)",
            textDecoration: "none",
          }}
        >
          SBNC
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: "var(--token-space-md)" }}>
          <Link
            href="/my"
            style={{
              fontSize: "var(--token-text-sm)",
              color: "var(--token-color-text-muted)",
              textDecoration: "none",
            }}
          >
            My SBNC
          </Link>
          <Link
            href="/member/events"
            style={{
              fontSize: "var(--token-text-sm)",
              color: "var(--token-color-primary)",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Events
          </Link>
          <Link
            href="/member/directory"
            style={{
              fontSize: "var(--token-text-sm)",
              color: "var(--token-color-text-muted)",
              textDecoration: "none",
            }}
          >
            Directory
          </Link>
        </nav>
      </header>

      {/* Page Content */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "var(--token-space-lg) var(--token-space-md)" }}>
        {/* Page Title */}
        <div style={{ marginBottom: "var(--token-space-lg)" }}>
          <h1
            style={{
              fontSize: "var(--token-text-2xl)",
              fontWeight: "var(--token-weight-bold)",
              color: "var(--token-color-text)",
              margin: 0,
            }}
          >
            Upcoming Events
          </h1>
          <p
            style={{
              fontSize: "var(--token-text-base)",
              color: "var(--token-color-text-muted)",
              marginTop: "var(--token-space-xs)",
            }}
          >
            Browse and register for club activities
          </p>
        </div>

        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: "var(--token-space-md)",
            marginBottom: "var(--token-space-lg)",
            flexWrap: "wrap",
          }}
        >
          {/* Search */}
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "var(--token-space-sm) var(--token-space-md)",
              border: "1px solid var(--token-color-border)",
              borderRadius: "var(--token-radius-lg)",
              fontSize: "var(--token-text-sm)",
              minWidth: "200px",
              backgroundColor: "var(--token-color-surface)",
            }}
          />

          {/* Category Filter */}
          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: "var(--token-space-sm) var(--token-space-md)",
                border: "1px solid var(--token-color-border)",
                borderRadius: "var(--token-radius-lg)",
                fontSize: "var(--token-text-sm)",
                backgroundColor: "var(--token-color-surface)",
                cursor: "pointer",
              }}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Events List */}
        {loading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "var(--token-space-md)",
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "var(--token-color-surface)",
                  borderRadius: "var(--token-radius-lg)",
                  border: "1px solid var(--token-color-border)",
                  padding: "var(--token-space-lg)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              >
                <div
                  style={{
                    height: "24px",
                    backgroundColor: "var(--token-color-surface-2)",
                    borderRadius: "var(--token-radius-lg)",
                    marginBottom: "var(--token-space-sm)",
                  }}
                />
                <div
                  style={{
                    height: "60px",
                    backgroundColor: "var(--token-color-surface-2)",
                    borderRadius: "var(--token-radius-lg)",
                  }}
                />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "var(--token-space-2xl)",
              backgroundColor: "var(--token-color-surface)",
              borderRadius: "var(--token-radius-lg)",
              border: "1px solid var(--token-color-border)",
            }}
          >
            <p style={{ color: "var(--token-color-text-muted)", margin: 0 }}>
              {searchQuery || selectedCategory
                ? "No events match your filters. Try adjusting your search."
                : "No upcoming events at this time. Check back soon!"}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "var(--token-space-md)",
            }}
          >
            {events.map((event) => (
              <EventCard key={event.id} event={event} formatDate={formatDate} formatTime={formatTime} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Event Card Component
// ============================================================================

interface EventCardProps {
  event: EventSummary;
  formatDate: (date: string) => string;
  formatTime: (date: string) => string;
}

function EventCard({ event, formatDate, formatTime }: EventCardProps) {
  const isFull = event.capacity !== null && event.spotsRemaining === 0;

  return (
    <div
      data-test-id={`event-card-${event.id}`}
      style={{
        backgroundColor: "var(--token-color-surface)",
        borderRadius: "var(--token-radius-lg)",
        border: "1px solid var(--token-color-border)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Date Badge */}
      <div
        style={{
          backgroundColor: "var(--token-color-primary)",
          color: "#fff",
          padding: "var(--token-space-xs) var(--token-space-md)",
          fontSize: "var(--token-text-sm)",
          fontWeight: 600,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{formatDate(event.startTime)}</span>
        <span>{formatTime(event.startTime)}</span>
      </div>

      {/* Content */}
      <div style={{ padding: "var(--token-space-md)", flex: 1 }}>
        {/* Category */}
        {event.category && (
          <span
            style={{
              display: "inline-block",
              fontSize: "var(--token-text-xs)",
              color: "var(--token-color-primary)",
              backgroundColor: "#eef2ff",
              padding: "2px 8px",
              borderRadius: "var(--token-radius-lg)",
              marginBottom: "var(--token-space-xs)",
            }}
          >
            {event.category}
          </span>
        )}

        {/* Title */}
        <h3
          style={{
            fontSize: "var(--token-text-lg)",
            fontWeight: 600,
            color: "var(--token-color-text)",
            margin: "0 0 var(--token-space-xs) 0",
          }}
        >
          {event.title}
        </h3>

        {/* Description */}
        {event.description && (
          <p
            style={{
              fontSize: "var(--token-text-sm)",
              color: "var(--token-color-text-muted)",
              margin: "0 0 var(--token-space-sm) 0",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {event.description}
          </p>
        )}

        {/* Location */}
        {event.location && (
          <p
            style={{
              fontSize: "var(--token-text-sm)",
              color: "var(--token-color-text-muted)",
              margin: 0,
            }}
          >
            {event.location}
          </p>
        )}
      </div>

      {/* Footer with registration status */}
      <div
        style={{
          padding: "var(--token-space-sm) var(--token-space-md)",
          borderTop: "1px solid var(--token-color-border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "var(--token-color-surface-2)",
        }}
      >
        {/* Spots info */}
        <span
          style={{
            fontSize: "var(--token-text-sm)",
            color: isFull ? "var(--token-color-error)" : "var(--token-color-text-muted)",
          }}
        >
          {event.capacity === null ? (
            "Open registration"
          ) : isFull ? (
            event.isWaitlistOpen ? "Waitlist open" : "Full"
          ) : (
            `${event.spotsRemaining} spots left`
          )}
        </span>

        {/* Register button */}
        <Link
          href={`/events/${event.id}`}
          style={{
            padding: "var(--token-space-xs) var(--token-space-md)",
            backgroundColor: isFull ? "var(--token-color-surface)" : "var(--token-color-primary)",
            color: isFull ? "var(--token-color-text)" : "#fff",
            border: isFull ? "1px solid var(--token-color-border)" : "none",
            borderRadius: "var(--token-radius-lg)",
            fontSize: "var(--token-text-sm)",
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          {isFull && event.isWaitlistOpen ? "Join Waitlist" : isFull ? "View" : "Register"}
        </Link>
      </div>
    </div>
  );
}
