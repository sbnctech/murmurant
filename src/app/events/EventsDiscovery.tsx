"use client";

/**
 * EventsDiscovery - Interactive events list with filters
 *
 * Client component for browsing and filtering events.
 * Supports list and calendar-style grid views.
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ContentStripe } from "@/components/sections";
import { formatClubDate, formatClubTime } from "@/lib/timezone";

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

interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface EventsResponse {
  events: EventSummary[];
  pagination: PaginationMeta;
  categories: string[];
}

type ViewMode = "list" | "grid";
type TimeFilter = "upcoming" | "past";

export default function EventsDiscovery() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("upcoming");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [page, setPage] = useState(1);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "12");

      if (category) params.set("category", category);
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (timeFilter === "past") params.set("past", "true");

      const response = await fetch(`/api/v1/events?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const data: EventsResponse = await response.json();
      setEvents(data.events);
      setPagination(data.pagination);
      setCategories(data.categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [page, category, debouncedSearch, timeFilter]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatClubDate(date);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return formatClubTime(date);
  };

  const formatDateRange = (start: string, end: string | null) => {
    const startDate = formatDate(start);
    const startTime = formatTime(start);

    if (!end) {
      return `${startDate} at ${startTime}`;
    }

    const endTime = formatTime(end);
    return `${startDate} at ${startTime} - ${endTime}`;
  };

  const getStatusBadge = (event: EventSummary) => {
    const isPast = new Date(event.startTime) < new Date();

    if (isPast) {
      return { text: "Past", color: "var(--token-color-text-muted)", bg: "var(--token-color-surface-2)" };
    }
    if (event.isWaitlistOpen) {
      return { text: "Waitlist", color: "var(--token-color-warning)", bg: "var(--token-color-warning-bg)" };
    }
    if (event.spotsRemaining !== null && event.spotsRemaining <= 5) {
      return { text: `${event.spotsRemaining} spots left`, color: "var(--token-color-danger)", bg: "var(--token-color-danger-bg)" };
    }
    return { text: "Open", color: "var(--token-color-success)", bg: "var(--token-color-success-bg)" };
  };

  return (
    <ContentStripe testId="events-discovery" padding="lg">
      {/* Filters Bar */}
      <div
        data-test-id="events-filters"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--token-space-sm)",
          marginBottom: "var(--token-space-lg)",
          alignItems: "center",
        }}
      >
        {/* Search */}
        <input
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-test-id="events-search"
          style={{
            flex: "1 1 200px",
            padding: "var(--token-space-sm) var(--token-space-md)",
            border: "1px solid var(--token-color-border)",
            borderRadius: "var(--token-radius-lg)",
            fontSize: "var(--token-text-base)",
          }}
        />

        {/* Category Filter */}
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          data-test-id="events-category-filter"
          style={{
            padding: "var(--token-space-sm) var(--token-space-md)",
            border: "1px solid var(--token-color-border)",
            borderRadius: "var(--token-radius-lg)",
            fontSize: "var(--token-text-base)",
            backgroundColor: "var(--token-color-surface)",
          }}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Time Filter */}
        <div
          style={{
            display: "flex",
            border: "1px solid var(--token-color-border)",
            borderRadius: "var(--token-radius-lg)",
            overflow: "hidden",
          }}
        >
          <button
            onClick={() => {
              setTimeFilter("upcoming");
              setPage(1);
            }}
            data-test-id="events-time-upcoming"
            style={{
              padding: "var(--token-space-sm) var(--token-space-md)",
              border: "none",
              backgroundColor: timeFilter === "upcoming" ? "var(--token-color-primary)" : "var(--token-color-surface)",
              color: timeFilter === "upcoming" ? "white" : "var(--token-color-text)",
              cursor: "pointer",
              fontSize: "var(--token-text-sm)",
            }}
          >
            Upcoming
          </button>
          <button
            onClick={() => {
              setTimeFilter("past");
              setPage(1);
            }}
            data-test-id="events-time-past"
            style={{
              padding: "var(--token-space-sm) var(--token-space-md)",
              border: "none",
              borderLeft: "1px solid var(--token-color-border)",
              backgroundColor: timeFilter === "past" ? "var(--token-color-primary)" : "var(--token-color-surface)",
              color: timeFilter === "past" ? "white" : "var(--token-color-text)",
              cursor: "pointer",
              fontSize: "var(--token-text-sm)",
            }}
          >
            Past
          </button>
        </div>

        {/* View Toggle */}
        <div
          style={{
            display: "flex",
            border: "1px solid var(--token-color-border)",
            borderRadius: "var(--token-radius-lg)",
            overflow: "hidden",
          }}
        >
          <button
            onClick={() => setViewMode("list")}
            data-test-id="events-view-list"
            title="List view"
            style={{
              padding: "var(--token-space-sm)",
              border: "none",
              backgroundColor: viewMode === "list" ? "var(--token-color-primary)" : "var(--token-color-surface)",
              color: viewMode === "list" ? "white" : "var(--token-color-text)",
              cursor: "pointer",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode("grid")}
            data-test-id="events-view-grid"
            title="Grid view"
            style={{
              padding: "var(--token-space-sm)",
              border: "none",
              borderLeft: "1px solid var(--token-color-border)",
              backgroundColor: viewMode === "grid" ? "var(--token-color-primary)" : "var(--token-color-surface)",
              color: viewMode === "grid" ? "white" : "var(--token-color-text)",
              cursor: "pointer",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Loading State - Skeleton Cards */}
      {loading && (
        <div
          data-test-id="events-loading"
          style={{
            display: viewMode === "grid" ? "grid" : "flex",
            gridTemplateColumns: viewMode === "grid" ? "repeat(auto-fill, minmax(300px, 1fr))" : undefined,
            flexDirection: viewMode === "list" ? "column" : undefined,
            gap: "var(--token-space-md)",
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              style={{
                backgroundColor: "var(--token-color-surface)",
                border: "1px solid var(--token-color-border)",
                borderRadius: "var(--token-radius-lg)",
                padding: "var(--token-space-md)",
              }}
            >
              {/* Category skeleton */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "var(--token-space-sm)",
                }}
              >
                <div
                  style={{
                    width: "60px",
                    height: "12px",
                    backgroundColor: "var(--token-color-surface-2)",
                    borderRadius: "var(--token-radius-lg)",
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
                <div
                  style={{
                    width: "50px",
                    height: "20px",
                    backgroundColor: "var(--token-color-surface-2)",
                    borderRadius: "12px",
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
              </div>
              {/* Title skeleton */}
              <div
                style={{
                  width: "80%",
                  height: "24px",
                  backgroundColor: "var(--token-color-surface-2)",
                  borderRadius: "var(--token-radius-lg)",
                  marginBottom: "var(--token-space-sm)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
              {/* Date skeleton */}
              <div
                style={{
                  width: "60%",
                  height: "16px",
                  backgroundColor: "var(--token-color-surface-2)",
                  borderRadius: "var(--token-radius-lg)",
                  marginBottom: "var(--token-space-xs)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
              {/* Location skeleton */}
              <div
                style={{
                  width: "40%",
                  height: "14px",
                  backgroundColor: "var(--token-color-surface-2)",
                  borderRadius: "var(--token-radius-lg)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div
          data-test-id="events-error"
          style={{
            textAlign: "center",
            padding: "var(--token-space-2xl)",
            color: "var(--token-color-danger)",
          }}
        >
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && events.length === 0 && (
        <div
          data-test-id="events-empty"
          style={{
            textAlign: "center",
            padding: "var(--token-space-2xl)",
            color: "var(--token-color-text-muted)",
          }}
        >
          <p style={{ fontSize: "var(--token-text-lg)", marginBottom: "var(--token-space-sm)" }}>
            No events found
          </p>
          <p style={{ fontSize: "var(--token-text-sm)" }}>
            {search || category
              ? "Try adjusting your filters"
              : timeFilter === "upcoming"
              ? "Check back soon for new events!"
              : "No past events to display"}
          </p>
        </div>
      )}

      {/* Events List/Grid */}
      {!loading && !error && events.length > 0 && (
        <div
          data-test-id="events-list"
          style={{
            display: viewMode === "grid" ? "grid" : "flex",
            gridTemplateColumns: viewMode === "grid" ? "repeat(auto-fill, minmax(300px, 1fr))" : undefined,
            flexDirection: viewMode === "list" ? "column" : undefined,
            gap: "var(--token-space-md)",
          }}
        >
          {events.map((event) => {
            const status = getStatusBadge(event);
            return (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                data-test-id={`event-card-${event.id}`}
                style={{
                  display: "block",
                  backgroundColor: "var(--token-color-surface)",
                  border: "1px solid var(--token-color-border)",
                  borderRadius: "var(--token-radius-lg)",
                  padding: "var(--token-space-md)",
                  textDecoration: "none",
                  color: "inherit",
                  transition: "box-shadow 0.2s, border-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "var(--token-shadow-md)";
                  e.currentTarget.style.borderColor = "var(--token-color-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "var(--token-color-border)";
                }}
              >
                {/* Category and Status */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "var(--token-space-sm)",
                  }}
                >
                  {event.category && (
                    <span
                      style={{
                        fontSize: "var(--token-text-xs)",
                        color: "var(--token-color-text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {event.category}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: "var(--token-text-xs)",
                      fontWeight: 600,
                      color: status.color,
                      backgroundColor: status.bg,
                      padding: "2px 8px",
                      borderRadius: "12px",
                    }}
                  >
                    {status.text}
                  </span>
                </div>

                {/* Title */}
                <h3
                  style={{
                    fontSize: "var(--token-text-lg)",
                    fontWeight: 600,
                    marginTop: 0,
                    marginBottom: "var(--token-space-xs)",
                    color: "var(--token-color-text)",
                  }}
                >
                  {event.title}
                </h3>

                {/* Date/Time */}
                <p
                  style={{
                    fontSize: "var(--token-text-sm)",
                    color: "var(--token-color-primary)",
                    marginBottom: "var(--token-space-xs)",
                    fontWeight: 500,
                  }}
                >
                  {formatDateRange(event.startTime, event.endTime)}
                </p>

                {/* Location */}
                {event.location && (
                  <p
                    style={{
                      fontSize: "var(--token-text-sm)",
                      color: "var(--token-color-text-muted)",
                      marginBottom: "var(--token-space-sm)",
                    }}
                  >
                    {event.location}
                  </p>
                )}

                {/* Description (truncated) */}
                {event.description && (
                  <p
                    style={{
                      fontSize: "var(--token-text-sm)",
                      color: "var(--token-color-text-muted)",
                      marginBottom: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {event.description}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div
          data-test-id="events-pagination"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "var(--token-space-sm)",
            marginTop: "var(--token-space-lg)",
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!pagination.hasPrev}
            data-test-id="events-prev-page"
            style={{
              padding: "var(--token-space-sm) var(--token-space-md)",
              border: "1px solid var(--token-color-border)",
              borderRadius: "var(--token-radius-lg)",
              backgroundColor: "var(--token-color-surface)",
              color: pagination.hasPrev ? "var(--token-color-text)" : "var(--token-color-text-muted)",
              cursor: pagination.hasPrev ? "pointer" : "not-allowed",
            }}
          >
            Previous
          </button>
          <span style={{ color: "var(--token-color-text-muted)", fontSize: "var(--token-text-sm)" }}>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={!pagination.hasNext}
            data-test-id="events-next-page"
            style={{
              padding: "var(--token-space-sm) var(--token-space-md)",
              border: "1px solid var(--token-color-border)",
              borderRadius: "var(--token-radius-lg)",
              backgroundColor: "var(--token-color-surface)",
              color: pagination.hasNext ? "var(--token-color-text)" : "var(--token-color-text-muted)",
              cursor: pagination.hasNext ? "pointer" : "not-allowed",
            }}
          >
            Next
          </button>
        </div>
      )}
    </ContentStripe>
  );
}
