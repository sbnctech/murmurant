"use client";

import { useState, useMemo } from "react";
import { formatClubMonthYear, formatClubDateLong, getClubDayOfWeek } from "@/lib/timezone";

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Format weekday name using club timezone
 */
function formatWeekday(date: Date, style: "short" | "long" = "short"): string {
  const dayIndex = getClubDayOfWeek(date);
  return style === "long" ? WEEKDAY_LONG[dayIndex] : WEEKDAY_SHORT[dayIndex];
}

/**
 * Event type for calendar display
 */
type CalendarEvent = {
  id: string;
  title: string;
  date: Date;
  time: string;
  category: string;
  location: string | null;
  description: string | null;
};

/**
 * Category colors for events
 */
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Social: { bg: "#dbeafe", text: "#1e40af", border: "#3b82f6" },
  "Interest Group": { bg: "#dcfce7", text: "#166534", border: "#22c55e" },
  "Day Trip": { bg: "#fef3c7", text: "#92400e", border: "#f59e0b" },
  Luncheon: { bg: "#fce7f3", text: "#9d174d", border: "#ec4899" },
  Workshop: { bg: "#e0e7ff", text: "#3730a3", border: "#6366f1" },
  Other: { bg: "#f3f4f6", text: "#374151", border: "#9ca3af" },
};

/**
 * Get days in a month
 */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Get the day of week the month starts on (0 = Sunday)
 */
function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/**
 * Format month name
 */
function formatMonth(year: number, month: number): string {
  return formatClubMonthYear(new Date(year, month, 1));
}

/**
 * Public Calendar View Page
 *
 * Features:
 * - Monthly calendar grid view
 * - Events shown on their dates
 * - Click event to see details popup
 * - Previous/Next month navigation
 * - List view toggle option
 * - Color coding by event category
 */
export default function CalendarPage() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Mock events for demonstration
  const events: CalendarEvent[] = useMemo(() => [
    {
      id: "evt-1",
      title: "New Year Brunch",
      date: new Date(2025, 0, 4),
      time: "10:30 AM",
      category: "Social",
      location: "El Paseo Restaurant",
      description: "Start the new year with friends! Join us for a delicious brunch.",
    },
    {
      id: "evt-2",
      title: "Book Club Meeting",
      date: new Date(2025, 0, 8),
      time: "2:00 PM",
      category: "Interest Group",
      location: "Member's Home",
      description: "Discussing 'The Midnight Library' by Matt Haig.",
    },
    {
      id: "evt-3",
      title: "Wine Country Day Trip",
      date: new Date(2025, 0, 15),
      time: "9:00 AM",
      category: "Day Trip",
      location: "Santa Ynez Valley",
      description: "Visit three wineries with lunch included.",
    },
    {
      id: "evt-4",
      title: "Monthly Luncheon",
      date: new Date(2025, 0, 18),
      time: "11:30 AM",
      category: "Luncheon",
      location: "Fess Parker Resort",
      description: "Guest speaker: Local historian discusses SB architecture.",
    },
    {
      id: "evt-5",
      title: "Photography Walk",
      date: new Date(2025, 0, 22),
      time: "4:00 PM",
      category: "Interest Group",
      location: "Stearns Wharf",
      description: "Capture sunset photos with our photography group.",
    },
    {
      id: "evt-6",
      title: "Craft Workshop",
      date: new Date(2025, 0, 25),
      time: "1:00 PM",
      category: "Workshop",
      location: "Community Center",
      description: "Learn watercolor basics. All materials provided.",
    },
    {
      id: "evt-7",
      title: "Game Night",
      date: new Date(2025, 0, 29),
      time: "6:00 PM",
      category: "Social",
      location: "Member's Home",
      description: "Board games and card games. Bring a snack to share!",
    },
    {
      id: "evt-8",
      title: "Hiking Group",
      date: new Date(2025, 1, 1),
      time: "8:00 AM",
      category: "Interest Group",
      location: "Rattlesnake Canyon",
      description: "Moderate 4-mile hike. Bring water and sturdy shoes.",
    },
  ], []);

  // Filter events for current month
  const monthEvents = events.filter(
    (e) => e.date.getFullYear() === currentYear && e.date.getMonth() === currentMonth
  );

  // Group events by day for calendar view
  const eventsByDay = useMemo(() => {
    const grouped: Record<number, CalendarEvent[]> = {};
    monthEvents.forEach((event) => {
      const day = event.date.getDate();
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(event);
    });
    return grouped;
  }, [monthEvents]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS.Other;
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Event Calendar</h1>
        <p style={styles.subtitle}>View upcoming club events and activities</p>
      </header>

      {/* Controls */}
      <div style={styles.controls}>
        <div style={styles.navControls}>
          <button style={styles.navButton} onClick={goToPrevMonth}>
            &#8592; Prev
          </button>
          <button style={styles.todayButton} onClick={goToToday}>
            Today
          </button>
          <button style={styles.navButton} onClick={goToNextMonth}>
            Next &#8594;
          </button>
        </div>
        <h2 style={styles.monthTitle}>{formatMonth(currentYear, currentMonth)}</h2>
        <div style={styles.viewToggle}>
          <button
            style={{
              ...styles.toggleButton,
              ...(viewMode === "calendar" ? styles.toggleButtonActive : {}),
            }}
            onClick={() => setViewMode("calendar")}
          >
            &#128197; Calendar
          </button>
          <button
            style={{
              ...styles.toggleButton,
              ...(viewMode === "list" ? styles.toggleButtonActive : {}),
            }}
            onClick={() => setViewMode("list")}
          >
            &#128203; List
          </button>
        </div>
      </div>

      {/* Category Legend */}
      <div style={styles.legend}>
        {Object.entries(CATEGORY_COLORS).map(([category, colors]) => (
          <div key={category} style={styles.legendItem}>
            <span
              style={{
                ...styles.legendDot,
                backgroundColor: colors.border,
              }}
            />
            {category}
          </div>
        ))}
      </div>

      {/* Calendar Grid View */}
      {viewMode === "calendar" && (
        <div style={styles.calendarGrid}>
          {/* Day headers */}
          {dayNames.map((day) => (
            <div key={day} style={styles.dayHeader}>
              {day}
            </div>
          ))}

          {/* Empty cells before first day */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} style={styles.emptyCell} />
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvents = eventsByDay[day] || [];
            const isToday =
              day === today.getDate() &&
              currentMonth === today.getMonth() &&
              currentYear === today.getFullYear();

            return (
              <div
                key={day}
                style={{
                  ...styles.dayCell,
                  ...(isToday ? styles.todayCell : {}),
                }}
              >
                <div style={styles.dayNumber}>{day}</div>
                <div style={styles.dayEvents}>
                  {dayEvents.slice(0, 3).map((event) => {
                    const colors = getCategoryColor(event.category);
                    return (
                      <button
                        key={event.id}
                        style={{
                          ...styles.eventPill,
                          backgroundColor: colors.bg,
                          color: colors.text,
                          borderLeft: `3px solid ${colors.border}`,
                        }}
                        onClick={() => setSelectedEvent(event)}
                      >
                        {event.title}
                      </button>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <div style={styles.moreEvents}>+{dayEvents.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div style={styles.listView}>
          {monthEvents.length === 0 ? (
            <div style={styles.emptyState}>No events this month.</div>
          ) : (
            monthEvents
              .sort((a, b) => a.date.getTime() - b.date.getTime())
              .map((event) => {
                const colors = getCategoryColor(event.category);
                return (
                  <div
                    key={event.id}
                    style={{
                      ...styles.listItem,
                      borderLeftColor: colors.border,
                    }}
                    onClick={() => setSelectedEvent(event)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setSelectedEvent(event)}
                  >
                    <div style={styles.listDate}>
                      <div style={styles.listDay}>{event.date.getDate()}</div>
                      <div style={styles.listDayName}>
                        {formatWeekday(event.date, "short")}
                      </div>
                    </div>
                    <div style={styles.listContent}>
                      <div style={styles.listTitle}>{event.title}</div>
                      <div style={styles.listMeta}>
                        <span>{event.time}</span>
                        {event.location && <span> • {event.location}</span>}
                      </div>
                    </div>
                    <span
                      style={{
                        ...styles.categoryBadge,
                        backgroundColor: colors.bg,
                        color: colors.text,
                      }}
                    >
                      {event.category}
                    </span>
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div style={styles.modalOverlay} onClick={() => setSelectedEvent(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span
                style={{
                  ...styles.modalCategory,
                  backgroundColor: getCategoryColor(selectedEvent.category).bg,
                  color: getCategoryColor(selectedEvent.category).text,
                }}
              >
                {selectedEvent.category}
              </span>
              <button
                style={styles.closeButton}
                onClick={() => setSelectedEvent(null)}
                aria-label="Close"
              >
                &#10005;
              </button>
            </div>
            <h3 style={styles.modalTitle}>{selectedEvent.title}</h3>
            <div style={styles.modalMeta}>
              <div style={styles.modalMetaItem}>
                <span style={styles.modalMetaIcon}>&#128197;</span>
                {formatWeekday(selectedEvent.date, "long")}, {formatClubDateLong(selectedEvent.date)}
              </div>
              <div style={styles.modalMetaItem}>
                <span style={styles.modalMetaIcon}>&#128336;</span>
                {selectedEvent.time}
              </div>
              {selectedEvent.location && (
                <div style={styles.modalMetaItem}>
                  <span style={styles.modalMetaIcon}>&#128205;</span>
                  {selectedEvent.location}
                </div>
              )}
            </div>
            {selectedEvent.description && (
              <p style={styles.modalDescription}>{selectedEvent.description}</p>
            )}
            <div style={styles.modalActions}>
              <button style={styles.registerButton}>View Details & Register</button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Note */}
      <div style={styles.footer}>
        <span style={styles.footerIcon}>&#9432;</span>
        Demo calendar with sample events. Real events sync from the club database.
      </div>
    </div>
  );
}

/**
 * Inline styles
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "40px 20px",
  },
  header: {
    textAlign: "center",
    marginBottom: "32px",
  },
  title: {
    fontSize: "36px",
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: "12px",
  },
  subtitle: {
    fontSize: "18px",
    color: "#6b7280",
  },
  controls: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "16px",
  },
  navControls: {
    display: "flex",
    gap: "8px",
  },
  navButton: {
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "500",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    backgroundColor: "#fff",
    color: "#374151",
    cursor: "pointer",
  },
  todayButton: {
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "500",
    border: "1px solid #2563eb",
    borderRadius: "6px",
    backgroundColor: "#fff",
    color: "#2563eb",
    cursor: "pointer",
  },
  monthTitle: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#1f2937",
    margin: 0,
  },
  viewToggle: {
    display: "flex",
    gap: "4px",
    backgroundColor: "#f3f4f6",
    borderRadius: "8px",
    padding: "4px",
  },
  toggleButton: {
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "500",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "transparent",
    color: "#6b7280",
    cursor: "pointer",
  },
  toggleButtonActive: {
    backgroundColor: "#fff",
    color: "#1f2937",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
  },
  legend: {
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
    justifyContent: "center",
    marginBottom: "24px",
    padding: "12px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    color: "#4b5563",
  },
  legendDot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
  },
  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  dayHeader: {
    padding: "12px 8px",
    textAlign: "center",
    fontSize: "13px",
    fontWeight: "600",
    color: "#6b7280",
    backgroundColor: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
  },
  emptyCell: {
    minHeight: "100px",
    backgroundColor: "#fafafa",
    borderRight: "1px solid #e5e7eb",
    borderBottom: "1px solid #e5e7eb",
  },
  dayCell: {
    minHeight: "100px",
    padding: "8px",
    borderRight: "1px solid #e5e7eb",
    borderBottom: "1px solid #e5e7eb",
    backgroundColor: "#fff",
  },
  todayCell: {
    backgroundColor: "#eff6ff",
  },
  dayNumber: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
    marginBottom: "4px",
  },
  dayEvents: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  eventPill: {
    display: "block",
    width: "100%",
    padding: "4px 6px",
    fontSize: "11px",
    fontWeight: "500",
    textAlign: "left",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  moreEvents: {
    fontSize: "11px",
    color: "#6b7280",
    padding: "2px 6px",
  },
  listView: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  listItem: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "16px",
    backgroundColor: "#fff",
    border: "1px solid #e5e7eb",
    borderLeft: "4px solid",
    borderRadius: "8px",
    cursor: "pointer",
  },
  listDate: {
    textAlign: "center",
    minWidth: "50px",
  },
  listDay: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#1f2937",
  },
  listDayName: {
    fontSize: "12px",
    color: "#6b7280",
    textTransform: "uppercase",
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "4px",
  },
  listMeta: {
    fontSize: "14px",
    color: "#6b7280",
  },
  categoryBadge: {
    padding: "4px 10px",
    fontSize: "12px",
    fontWeight: "500",
    borderRadius: "12px",
    whiteSpace: "nowrap",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#6b7280",
    fontSize: "16px",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    maxWidth: "480px",
    width: "100%",
    padding: "24px",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "12px",
  },
  modalCategory: {
    padding: "4px 10px",
    fontSize: "12px",
    fontWeight: "500",
    borderRadius: "12px",
  },
  closeButton: {
    backgroundColor: "transparent",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    color: "#6b7280",
    padding: "4px",
  },
  modalTitle: {
    fontSize: "22px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "16px",
  },
  modalMeta: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "16px",
  },
  modalMetaItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    color: "#4b5563",
  },
  modalMetaIcon: {
    fontSize: "16px",
  },
  modalDescription: {
    fontSize: "14px",
    color: "#6b7280",
    lineHeight: "1.6",
    marginBottom: "20px",
  },
  modalActions: {
    borderTop: "1px solid #e5e7eb",
    paddingTop: "16px",
  },
  registerButton: {
    width: "100%",
    padding: "12px 20px",
    fontSize: "14px",
    fontWeight: "600",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  footer: {
    marginTop: "32px",
    padding: "16px 20px",
    backgroundColor: "#f0f9ff",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#0369a1",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    justifyContent: "center",
  },
  footerIcon: {
    fontSize: "16px",
  },
};
