"use client";

/**
 * EventCalendar - Month grid calendar view for events
 *
 * Displays events on a traditional month calendar grid with:
 * - Month navigation (prev/next)
 * - Event indicators (dots) on dates with events
 * - Day click to show events for that date
 * - Responsive layout
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  formatClubTime,
  getClubYearMonth,
  getClubDayOfMonth,
  getClubDayOfWeek,
  formatClubMonthName,
  createClubDate,
  formatClubDateLong,
} from "@/lib/timezone";

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
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  categories: string[];
}

interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: EventSummary[];
}

interface EventCalendarProps {
  category?: string;
  search?: string;
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Get start and end dates for a month (for API query)
 */
function getMonthDateRange(year: number, month: number): { from: string; to: string } {
  const firstDay = createClubDate(year, month, 1);
  // Get last day of month
  const lastDay = new Date(year, month, 0); // Day 0 of next month = last day of this month
  const lastDayNum = lastDay.getDate();
  const lastDayDate = createClubDate(year, month, lastDayNum);
  // Add 24 hours to include the full last day
  lastDayDate.setTime(lastDayDate.getTime() + 24 * 60 * 60 * 1000 - 1);

  return {
    from: firstDay.toISOString(),
    to: lastDayDate.toISOString(),
  };
}

/**
 * Build calendar grid for a month
 */
function buildCalendarGrid(year: number, month: number, events: EventSummary[]): CalendarDay[] {
  const today = new Date();
  const todayClub = getClubYearMonth(today);
  const todayDay = getClubDayOfMonth(today);

  // First day of the month
  const firstOfMonth = createClubDate(year, month, 1);
  const firstDayOfWeek = getClubDayOfWeek(firstOfMonth);

  // Days in month
  const daysInMonth = new Date(year, month, 0).getDate();

  // Days in previous month
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevMonthYear = month === 1 ? year - 1 : year;
  const daysInPrevMonth = new Date(prevMonthYear, prevMonth, 0).getDate();

  // Group events by day
  const eventsByDay = new Map<string, EventSummary[]>();
  for (const event of events) {
    const eventDate = new Date(event.startTime);
    const eventClub = getClubYearMonth(eventDate);
    const eventDay = getClubDayOfMonth(eventDate);
    const key = `${eventClub.year}-${eventClub.month}-${eventDay}`;
    if (!eventsByDay.has(key)) {
      eventsByDay.set(key, []);
    }
    eventsByDay.get(key)!.push(event);
  }

  const days: CalendarDay[] = [];

  // Add days from previous month to fill first week
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const date = createClubDate(prevMonthYear, prevMonth, day);
    const key = `${prevMonthYear}-${prevMonth}-${day}`;
    days.push({
      date,
      dayOfMonth: day,
      isCurrentMonth: false,
      isToday: false,
      events: eventsByDay.get(key) ?? [],
    });
  }

  // Add days of current month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = createClubDate(year, month, day);
    const key = `${year}-${month}-${day}`;
    const isToday = todayClub.year === year && todayClub.month === month && todayDay === day;
    days.push({
      date,
      dayOfMonth: day,
      isCurrentMonth: true,
      isToday,
      events: eventsByDay.get(key) ?? [],
    });
  }

  // Add days from next month to complete last week
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextMonthYear = month === 12 ? year + 1 : year;
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let day = 1; day <= remaining; day++) {
      const date = createClubDate(nextMonthYear, nextMonth, day);
      days.push({
        date,
        dayOfMonth: day,
        isCurrentMonth: false,
        isToday: false,
        events: [],
      });
    }
  }

  return days;
}

export default function EventCalendar({ category, search }: EventCalendarProps) {
  const now = new Date();
  const currentClub = getClubYearMonth(now);

  const [year, setYear] = useState(currentClub.year);
  const [month, setMonth] = useState(currentClub.month);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  // Month name for header
  const monthName = useMemo(() => {
    const date = createClubDate(year, month, 15);
    return `${formatClubMonthName(date)} ${year}`;
  }, [year, month]);

  // Fetch events for the current month
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { from, to } = getMonthDateRange(year, month);
      const params = new URLSearchParams();
      params.set("from", from);
      params.set("to", to);
      params.set("limit", "100"); // Get all events for the month

      if (category) params.set("category", category);
      if (search) params.set("search", search);

      const response = await fetch(`/api/v1/events?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const data: EventsResponse = await response.json();
      setEvents(data.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [year, month, category, search]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Build calendar grid
  const calendarDays = useMemo(() => buildCalendarGrid(year, month, events), [year, month, events]);

  // Navigation handlers
  const goToPrevMonth = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
    setSelectedDay(null);
  };

  const goToToday = () => {
    const todayClub = getClubYearMonth(new Date());
    setYear(todayClub.year);
    setMonth(todayClub.month);
    setSelectedDay(null);
  };

  return (
    <div data-test-id="event-calendar">
      {/* Calendar Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "var(--token-space-md)",
        }}
      >
        <button
          onClick={goToPrevMonth}
          data-test-id="calendar-prev-month"
          style={{
            padding: "var(--token-space-sm) var(--token-space-md)",
            border: "1px solid var(--token-color-border)",
            borderRadius: "var(--token-radius-lg)",
            backgroundColor: "var(--token-color-surface)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "var(--token-space-xs)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Prev
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--token-space-md)" }}>
          <h2
            data-test-id="calendar-month-title"
            style={{
              margin: 0,
              fontSize: "var(--token-text-xl)",
              fontWeight: 600,
              color: "var(--token-color-text)",
            }}
          >
            {monthName}
          </h2>
          <button
            onClick={goToToday}
            data-test-id="calendar-today"
            style={{
              padding: "var(--token-space-xs) var(--token-space-sm)",
              border: "1px solid var(--token-color-border)",
              borderRadius: "var(--token-radius-lg)",
              backgroundColor: "var(--token-color-surface)",
              cursor: "pointer",
              fontSize: "var(--token-text-sm)",
            }}
          >
            Today
          </button>
        </div>

        <button
          onClick={goToNextMonth}
          data-test-id="calendar-next-month"
          style={{
            padding: "var(--token-space-sm) var(--token-space-md)",
            border: "1px solid var(--token-color-border)",
            borderRadius: "var(--token-radius-lg)",
            backgroundColor: "var(--token-color-surface)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "var(--token-space-xs)",
          }}
        >
          Next
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div
          data-test-id="calendar-loading"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "var(--token-space-2xl)",
            color: "var(--token-color-text-muted)",
          }}
        >
          Loading events...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div
          data-test-id="calendar-error"
          style={{
            textAlign: "center",
            padding: "var(--token-space-2xl)",
            color: "var(--token-color-danger)",
          }}
        >
          {error}
        </div>
      )}

      {/* Calendar Grid */}
      {!loading && !error && (
        <>
          {/* Day Headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "1px",
              backgroundColor: "var(--token-color-border)",
              border: "1px solid var(--token-color-border)",
              borderBottom: "none",
            }}
          >
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                style={{
                  padding: "var(--token-space-sm)",
                  textAlign: "center",
                  fontWeight: 600,
                  fontSize: "var(--token-text-sm)",
                  color: "var(--token-color-text-muted)",
                  backgroundColor: "var(--token-color-surface-2)",
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "1px",
              backgroundColor: "var(--token-color-border)",
              border: "1px solid var(--token-color-border)",
              borderTop: "none",
            }}
          >
            {calendarDays.map((day, index) => {
              const isSelected = selectedDay?.date.getTime() === day.date.getTime();
              const hasEvents = day.events.length > 0;

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  data-test-id={`calendar-day-${day.dayOfMonth}`}
                  style={{
                    padding: "var(--token-space-sm)",
                    minHeight: "80px",
                    backgroundColor: isSelected
                      ? "var(--token-color-primary)"
                      : day.isToday
                      ? "var(--token-color-info-bg)"
                      : "var(--token-color-surface)",
                    border: "none",
                    cursor: hasEvents || day.isCurrentMonth ? "pointer" : "default",
                    textAlign: "left",
                    verticalAlign: "top",
                    display: "flex",
                    flexDirection: "column",
                    transition: "background-color 0.1s",
                  }}
                >
                  {/* Day Number */}
                  <span
                    style={{
                      fontSize: "var(--token-text-sm)",
                      fontWeight: day.isToday ? 700 : 400,
                      color: isSelected
                        ? "white"
                        : day.isCurrentMonth
                        ? "var(--token-color-text)"
                        : "var(--token-color-text-muted)",
                      marginBottom: "var(--token-space-xs)",
                    }}
                  >
                    {day.dayOfMonth}
                  </span>

                  {/* Event Indicators */}
                  {hasEvents && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "2px",
                        marginTop: "auto",
                      }}
                    >
                      {day.events.slice(0, 3).map((event, _i) => (
                        <div
                          key={event.id}
                          title={event.title}
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            backgroundColor: isSelected ? "white" : "var(--token-color-primary)",
                          }}
                        />
                      ))}
                      {day.events.length > 3 && (
                        <span
                          style={{
                            fontSize: "10px",
                            color: isSelected ? "white" : "var(--token-color-text-muted)",
                          }}
                        >
                          +{day.events.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Day Events */}
          {selectedDay && selectedDay.events.length > 0 && (
            <div
              data-test-id="calendar-day-events"
              style={{
                marginTop: "var(--token-space-lg)",
                padding: "var(--token-space-md)",
                backgroundColor: "var(--token-color-surface)",
                border: "1px solid var(--token-color-border)",
                borderRadius: "var(--token-radius-lg)",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  marginBottom: "var(--token-space-md)",
                  fontSize: "var(--token-text-lg)",
                  fontWeight: 600,
                }}
              >
                Events on {formatClubDateLong(selectedDay.date)}
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--token-space-sm)" }}>
                {selectedDay.events.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    data-test-id={`calendar-event-${event.id}`}
                    style={{
                      display: "block",
                      padding: "var(--token-space-sm) var(--token-space-md)",
                      backgroundColor: "var(--token-color-surface-2)",
                      borderRadius: "var(--token-radius-lg)",
                      textDecoration: "none",
                      color: "inherit",
                      transition: "background-color 0.1s",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            color: "var(--token-color-text)",
                            marginBottom: "var(--token-space-xs)",
                          }}
                        >
                          {event.title}
                        </div>
                        <div
                          style={{
                            fontSize: "var(--token-text-sm)",
                            color: "var(--token-color-primary)",
                          }}
                        >
                          {formatClubTime(new Date(event.startTime))}
                          {event.location && (
                            <span style={{ color: "var(--token-color-text-muted)" }}>
                              {" "}
                              at {event.location}
                            </span>
                          )}
                        </div>
                      </div>
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
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Selected Day - No Events */}
          {selectedDay && selectedDay.events.length === 0 && selectedDay.isCurrentMonth && (
            <div
              data-test-id="calendar-day-empty"
              style={{
                marginTop: "var(--token-space-lg)",
                padding: "var(--token-space-md)",
                backgroundColor: "var(--token-color-surface)",
                border: "1px solid var(--token-color-border)",
                borderRadius: "var(--token-radius-lg)",
                textAlign: "center",
                color: "var(--token-color-text-muted)",
              }}
            >
              No events scheduled for {formatClubDateLong(selectedDay.date)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
