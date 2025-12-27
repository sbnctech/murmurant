"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type EventSummary = {
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
};

type EventsResponse = {
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
};

function formatEventDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function PublicEventsPage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [pagination, setPagination] = useState<EventsResponse["pagination"] | null>(null);

  const fetchEvents = useCallback(async (category: string | null = null, page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "12");
      if (category) params.set("category", category);

      const res = await fetch(`/api/v1/events?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch events");

      const data: EventsResponse = await res.json();
      setEvents(data.events);
      setCategories(data.categories);
      setPagination(data.pagination);
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(selectedCategory);
  }, [fetchEvents, selectedCategory]);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Upcoming Events</h1>
        <p style={styles.subtitle}>Join us for social gatherings and community events</p>
      </header>

      {categories.length > 0 && (
        <div style={styles.filterBar}>
          <button
            style={{ ...styles.filterButton, ...(selectedCategory === null ? styles.filterButtonActive : {}) }}
            onClick={() => setSelectedCategory(null)}
          >
            All Events
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              style={{ ...styles.filterButton, ...(selectedCategory === cat ? styles.filterButtonActive : {}) }}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div style={styles.loadingContainer}>Loading events...</div>
      ) : events.length === 0 ? (
        <div style={styles.emptyState}>No upcoming events. Check back soon!</div>
      ) : (
        <>
          <div style={styles.eventsGrid}>
            {events.map((event) => (
              <div key={event.id} style={styles.card}>
                <div style={styles.cardImage}>
                  <span style={styles.cardImageIcon}>&#128197;</span>
                </div>
                <div style={styles.cardContent}>
                  {event.category && <span style={styles.categoryBadge}>{event.category}</span>}
                  <h3 style={styles.cardTitle}>{event.title}</h3>
                  <div style={styles.cardMeta}>
                    <div>&#128197; {formatEventDate(event.startTime)}</div>
                    {event.location && <div>&#128205; {event.location}</div>}
                  </div>
                  {event.description && (
                    <p style={styles.cardDescription}>
                      {event.description.length > 100 ? event.description.slice(0, 100) + "..." : event.description}
                    </p>
                  )}
                  <div style={styles.pricingRow}>
                    <div style={styles.pricingItem}>
                      <span style={styles.pricingLabel}>Member</span>
                      <span style={styles.pricingValue}>Free</span>
                    </div>
                    <div style={styles.pricingItem}>
                      <span style={styles.pricingLabel}>Non-Member</span>
                      <span style={styles.pricingValue}>$15</span>
                    </div>
                  </div>
                  {event.spotsRemaining !== null && (
                    <div style={styles.spotsInfo}>
                      {event.spotsRemaining === 0 ? (
                        <span style={{ color: "#dc2626" }}>{event.isWaitlistOpen ? "Waitlist Open" : "Full"}</span>
                      ) : event.spotsRemaining <= 5 ? (
                        <span style={{ color: "#d97706" }}>Only {event.spotsRemaining} spots left!</span>
                      ) : (
                        <span style={{ color: "#059669" }}>{event.spotsRemaining} spots available</span>
                      )}
                    </div>
                  )}
                  <Link href={`/events/${event.id}`} style={styles.registerButton}>
                    {event.spotsRemaining === 0 ? "Join Waitlist" : "View Details & Register"}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div style={styles.pagination}>
              <button
                style={{ ...styles.pageButton, opacity: pagination.hasPrev ? 1 : 0.5 }}
                onClick={() => fetchEvents(selectedCategory, pagination.page - 1)}
                disabled={!pagination.hasPrev}
              >
                Previous
              </button>
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <button
                style={{ ...styles.pageButton, opacity: pagination.hasNext ? 1 : 0.5 }}
                onClick={() => fetchEvents(selectedCategory, pagination.page + 1)}
                disabled={!pagination.hasNext}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" },
  header: { textAlign: "center", marginBottom: "40px" },
  title: { fontSize: "36px", fontWeight: "700", color: "#1f2937", marginBottom: "12px" },
  subtitle: { fontSize: "18px", color: "#6b7280" },
  filterBar: { display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", marginBottom: "32px" },
  filterButton: { padding: "8px 16px", fontSize: "14px", fontWeight: "500", border: "1px solid #e5e7eb", borderRadius: "20px", backgroundColor: "#fff", color: "#374151", cursor: "pointer" },
  filterButtonActive: { backgroundColor: "#2563eb", borderColor: "#2563eb", color: "#fff" },
  loadingContainer: { textAlign: "center", padding: "60px 20px", color: "#6b7280" },
  emptyState: { textAlign: "center", padding: "80px 20px", color: "#6b7280", fontSize: "18px" },
  eventsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" },
  card: { backgroundColor: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #e5e7eb" },
  cardImage: { height: "140px", backgroundColor: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" },
  cardImageIcon: { fontSize: "48px", opacity: 0.5 },
  cardContent: { padding: "20px" },
  categoryBadge: { display: "inline-block", padding: "4px 10px", fontSize: "12px", fontWeight: "500", backgroundColor: "#e0e7ff", color: "#4338ca", borderRadius: "12px", marginBottom: "12px" },
  cardTitle: { fontSize: "18px", fontWeight: "600", color: "#1f2937", marginBottom: "12px" },
  cardMeta: { fontSize: "14px", color: "#6b7280", marginBottom: "12px", lineHeight: "1.8" },
  cardDescription: { fontSize: "14px", color: "#6b7280", lineHeight: "1.5", marginBottom: "16px" },
  pricingRow: { display: "flex", gap: "16px", marginBottom: "12px", padding: "12px", backgroundColor: "#f9fafb", borderRadius: "8px" },
  pricingItem: { flex: 1, textAlign: "center" },
  pricingLabel: { display: "block", fontSize: "11px", color: "#6b7280", textTransform: "uppercase", marginBottom: "4px" },
  pricingValue: { display: "block", fontSize: "16px", fontWeight: "600", color: "#1f2937" },
  spotsInfo: { marginBottom: "16px", fontSize: "13px", textAlign: "center" },
  registerButton: { display: "block", width: "100%", padding: "12px 20px", fontSize: "14px", fontWeight: "600", textAlign: "center", backgroundColor: "#2563eb", color: "#fff", borderRadius: "8px", textDecoration: "none" },
  pagination: { display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", marginTop: "40px" },
  pageButton: { padding: "10px 20px", fontSize: "14px", fontWeight: "500", backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", cursor: "pointer" },
};
